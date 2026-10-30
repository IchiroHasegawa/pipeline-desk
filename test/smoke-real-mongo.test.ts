/**
 * Smoke test against a REAL MongoDB server, not mongodb-memory-server.
 *
 * Skipped unless SMOKE_MONGODB_URI is set, so it never runs in the normal
 * suite:
 *
 *   SMOKE_MONGODB_URI='mongodb://po_mongo:27017/smoketest?replicaSet=rs0' \
 *     npx vitest run test/smoke-real-mongo.test.ts
 *
 * The unit suite runs against an in-process replica set. That is genuine, but
 * it is not the deployed server, and the features this migration leans on
 * hardest are exactly the ones that could differ:
 *
 *   - partial indexes created with their filter intact
 *   - a collation index actually enforcing case-insensitive uniqueness
 *   - multi-document transactions committing and rolling back
 *   - $unionWith, and $dateToString with a named timezone — which needs the
 *     server's timezone database to be installed
 *
 * It writes to a scratch database and drops it at the end.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { syncAllIndexes, ALL_MODELS } from "@/lib/models";
import { Profile } from "@/lib/models/Profile";
import { Asset } from "@/lib/models/Asset";
import { AssetFile } from "@/lib/models/AssetFile";
import { ProductionTask } from "@/lib/models/ProductionTask";
import { Workflow } from "@/lib/models/Workflow";
import { WorkflowProcess } from "@/lib/models/WorkflowProcess";
import { Episode } from "@/lib/models/Episode";
import { Scene } from "@/lib/models/Scene";
import { Todo } from "@/lib/models/Todo";
import { signupWithPassword } from "@/lib/auth/signup";
import { loginWithPassword } from "@/lib/auth/login";
import { generateWorkflowTasks } from "@/lib/services/workflowTasks";
import { projectCommitDays, projectAssetStats } from "@/lib/services/stats";
import { assets, assetProjectLinks, assetJobLinks } from "@/lib/repositories/assets";
import { profiles } from "@/lib/repositories/profiles";
import type { Actor } from "@/lib/permissions";

const URI = process.env.SMOKE_MONGODB_URI;
const actor: Actor = { _id: "smoke", accountStatus: "active", systemRole: "user" };

describe.skipIf(!URI)("smoke test against the real MongoDB server", () => {
  beforeAll(async () => {
    expect(URI, "point SMOKE_MONGODB_URI at a scratch database").toMatch(/smoke/i);
    process.env.AUTH_JWT_SECRET ??= "smoke-only-not-a-real-secret";
    await connectMongo(URI);
    for (const m of ALL_MODELS) await m.deleteMany({});
    await syncAllIndexes();
  });

  afterAll(async () => {
    if (!URI) return;
    await mongoose.connection.db!.dropDatabase();
    await disconnectMongo();
  });

  describe("the server itself", () => {
    it("reports a PRIMARY, so transactions are possible at all", async () => {
      const status = await mongoose.connection.db!.admin().command({ replSetGetStatus: 1 });
      expect(status.myState).toBe(1);
    });

    it("is MongoDB 8.x", async () => {
      const info = await mongoose.connection.db!.admin().serverInfo();
      expect(info.version.startsWith("8.")).toBe(true);
    });
  });

  describe("indexes are really created, with their filters", () => {
    it("production_tasks has a 4-column partial unique index on the process", async () => {
      const partial = (await ProductionTask.collection.indexes()).find(
        (i) => i.partialFilterExpression
      );
      expect(partial).toBeDefined();
      expect(JSON.stringify(partial!.partialFilterExpression)).toContain(
        "sourceWorkflowProcessId"
      );
      expect(partial!.unique).toBe(true);
      expect(Object.keys(partial!.key)).toHaveLength(4);
    });

    it("asset_files has two partial unique indexes", async () => {
      const idx = await AssetFile.collection.indexes();
      expect(idx.filter((i) => i.unique && i.partialFilterExpression)).toHaveLength(2);
    });

    it("the profiles username index carries a strength-2 collation", async () => {
      const byUsername = (await Profile.collection.indexes()).find(
        (i) => i.key.username !== undefined
      );
      expect(byUsername?.collation?.strength).toBe(2);
    });
  });

  describe("the partial index behaves (the migration-027 case)", () => {
    it("lets many process-less tasks share one scene", async () => {
      await ProductionTask.create({ name: "A", sceneId: "sc1" });
      await ProductionTask.create({ name: "B", sceneId: "sc1" });
      await ProductionTask.create({ name: "C", sceneId: "sc1" });
      expect(await ProductionTask.countDocuments({ sceneId: "sc1" })).toBe(3);
    });

    it("rejects the same process twice on one scene", async () => {
      const row = { name: "D", sceneId: "sc2", sourceWorkflowProcessId: "wpX" };
      await ProductionTask.create(row);
      await expect(ProductionTask.create(row)).rejects.toThrow(/duplicate key/i);
    });
  });

  describe("collation uniqueness is enforced by the server", () => {
    it("rejects a username differing only in case", async () => {
      await Profile.create({ email: "a@smoke.test", username: "SmokeUser", passwordHash: "h" });
      await expect(
        Profile.create({ email: "b@smoke.test", username: "smokeuser", passwordHash: "h" })
      ).rejects.toThrow(/duplicate key/i);
    });

    it("preserves the stored casing", async () => {
      const p = await Profile.findOne({ email: "a@smoke.test" }).lean();
      expect(p!.username).toBe("SmokeUser");
    });
  });

  describe("transactions on the real server", () => {
    beforeAll(async () => {
      await Workflow.create({
        _id: "wf-smoke",
        name: "Smoke",
        colour: "#fff",
        workflowCode: "SMK",
        workflowType: "scene",
        status: "active",
      });
      await WorkflowProcess.create([
        { _id: "wps-1", workflowId: "wf-smoke", name: "One", colour: "#fff", processType: "Manual", position: 1 },
        { _id: "wps-2", workflowId: "wf-smoke", name: "Two", colour: "#fff", processType: "Manual", position: 2 },
      ]);
    });

    it("commits a whole generated task list", async () => {
      const r = await generateWorkflowTasks(actor, "scene", "sc-gen", "wf-smoke");
      expect(r.created).toBe(2);
    });

    it("is idempotent on a second run", async () => {
      const r = await generateWorkflowTasks(actor, "scene", "sc-gen", "wf-smoke");
      expect(r.created).toBe(0);
    });

    it("rolls an aborted transaction all the way back", async () => {
      const before = await ProductionTask.countDocuments();
      const session = await mongoose.startSession();
      try {
        await session
          .withTransaction(async () => {
            await ProductionTask.create([{ name: "rollback-me", sceneId: "sc9" }], {
              session,
              ordered: true,
            });
            throw new Error("deliberate abort");
          })
          .catch(() => {});
      } finally {
        await session.endSession();
      }
      expect(await ProductionTask.countDocuments()).toBe(before);
    });
  });

  describe("aggregation pipelines, including the timezone database", () => {
    beforeAll(async () => {
      await Episode.create({ _id: "ep1", projectId: "pr1", episodeName: "Ep" });
      await Scene.create({ _id: "scn1", episodeId: "ep1", sceneName: "Sc" });
    });

    // Needs the server's tz database. Without it $dateToString either throws or
    // silently falls back to UTC, which would shift every commit-day figure.
    it("resolves Asia/Kolkata and puts 18:45Z on the next day", async () => {
      await Todo.create({
        title: "Late",
        profileId: "smoke",
        episodeId: "ep1",
        completedAt: new Date("2026-03-10T18:45:00Z"),
      });
      const rows = await projectCommitDays(actor);
      expect(rows).toHaveLength(1);
      expect(rows[0].commitDay).toBe("2026-03-11");
    });

    it("de-duplicates assets across link routes with $unionWith", async () => {
      await Asset.create([
        { _id: "as1", assetCode: "S1", assetName: "One", assetType: "Prop" },
        { _id: "as2", assetCode: "S2", assetName: "Two", assetType: "Prop" },
      ]);
      await assetProjectLinks.link(actor, "as1", "pr1");
      await assetJobLinks.link(actor, "as1", "ep1"); // same asset, second route
      await assetJobLinks.link(actor, "as2", "ep1");
      const [row] = await projectAssetStats(actor, "pr1");
      expect(row.assetCount).toBe(2);
    });
  });

  describe("auth end to end", () => {
    it("signs up, returns no password hash, and logs back in", async () => {
      const { profile } = await signupWithPassword({
        email: "smoke-auth@smoke.test",
        username: "smoke_auth",
        password: "smokepw12345",
      });
      expect(profile.accountStatus).toBe("active");
      expect(profile).not.toHaveProperty("passwordHash");
      expect(await loginWithPassword("SMOKE-AUTH@smoke.test", "smokepw12345")).not.toBeNull();
    });

    it("refuses a wrong password", async () => {
      expect(await loginWithPassword("smoke-auth@smoke.test", "nope")).toBeNull();
    });
  });

  describe("repository guards on the real server", () => {
    it("hands out distinct asset numbers under concurrency", async () => {
      const made = await Promise.all(
        [1, 2, 3, 4, 5].map((n) =>
          assets.createWithNumber(actor, {
            assetCode: `CN_${n}`,
            assetName: `C${n}`,
            assetType: "Prop",
          })
        )
      );
      expect(new Set(made.map((a) => a.assetNumber)).size).toBe(5);
    });

    it("refuses a disabled actor", async () => {
      await expect(
        assets.list({ ...actor, accountStatus: "disabled" })
      ).rejects.toThrow(/unavailable/i);
    });

    it("blocks reaching another user's profile", async () => {
      const other = await Profile.findOne({ email: "a@smoke.test" }).lean();
      await expect(
        profiles.updateById(actor, other!._id, { displayName: "hacked" })
      ).rejects.toThrow(/belongs to someone else/i);
    });

    it("refuses systemRole through a repository", async () => {
      await expect(
        profiles.updateById(actor, "smoke", { systemRole: "owner" } as Record<string, unknown>)
      ).rejects.toThrow(/systemRole/);
    });
  });
});
