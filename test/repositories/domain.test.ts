import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { ALL_MODELS, syncAllIndexes } from "@/lib/models";
import { Asset } from "@/lib/models/Asset";
import { Todo } from "@/lib/models/Todo";
import { assets, assetProjectLinks, assetFiles } from "@/lib/repositories/assets";
import { productionTasks } from "@/lib/repositories/tasks";
import { workflowProcesses } from "@/lib/repositories/workflows";
import { todos, boardElements } from "@/lib/repositories/boards";
import { ForbiddenError } from "@/lib/permissions/errors";
import type { Actor } from "@/lib/permissions";

let mongo: TestMongo;

const alice: Actor = { _id: "alice", accountStatus: "active", systemRole: "user" };
const bob: Actor = { _id: "bob", accountStatus: "active", systemRole: "user" };

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await syncAllIndexes();
});

afterEach(async () => {
  await Promise.all(ALL_MODELS.map((m) => m.deleteMany({})));
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

const asset = { assetCode: "CH_001", assetName: "Hero", assetType: "Character" };

describe("asset numbering (replacing the Postgres sequence)", () => {
  it("starts at 1 and increments", async () => {
    const a = await assets.createWithNumber(alice, asset);
    const b = await assets.createWithNumber(alice, { ...asset, assetCode: "CH_002" });
    expect([a.assetNumber, b.assetNumber]).toEqual([1, 2]);
  });

  /**
   * A real divergence from Postgres, pinned so it is a decision and not a
   * surprise: `nextval()` never hands out a number twice, even after the row
   * using it is deleted. Taking `max + 1` does reuse the gap.
   *
   * Accepted because asset_number is a display/ordering number, not an
   * audit identity, and nothing references it as a foreign key. If it ever
   * needs to be gap-free, this has to become a counters collection.
   */
  it("reuses the highest number after that asset is deleted (unlike nextval)", async () => {
    const a = await assets.createWithNumber(alice, asset);
    expect(a.assetNumber).toBe(1);
    await assets.deleteById(alice, a._id);
    const b = await assets.createWithNumber(alice, { ...asset, assetCode: "CH_002" });
    expect(b.assetNumber).toBe(1);
  });

  it("keeps counting up while earlier assets still exist", async () => {
    await assets.createWithNumber(alice, asset);
    const b = await assets.createWithNumber(alice, { ...asset, assetCode: "CH_002" });
    await assets.deleteById(alice, b._id);
    const c = await assets.createWithNumber(alice, { ...asset, assetCode: "CH_003" });
    expect(c.assetNumber).toBe(2);
  });

  it("assigns distinct numbers under concurrent creates", async () => {
    const created = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        assets.createWithNumber(alice, { ...asset, assetCode: `CH_00${i}` })
      )
    );
    const numbers = created.map((a) => a.assetNumber);
    expect(new Set(numbers).size).toBe(5);
  });

  it("refuses to let a generic create set assetNumber", async () => {
    await expect(
      assets.create(alice, { ...asset, assetNumber: 99 })
    ).rejects.toThrow(/assetNumber/);
  });
});

describe("asset links", () => {
  it("link is idempotent, so attaching twice is harmless", async () => {
    await assetProjectLinks.link(alice, "a1", "p1");
    await expect(assetProjectLinks.link(alice, "a1", "p1")).resolves.toBeUndefined();
    expect(await assetProjectLinks.count(alice)).toBe(1);
  });

  it("unlink reports whether anything was removed", async () => {
    await assetProjectLinks.link(alice, "a1", "p1");
    expect(await assetProjectLinks.unlink(alice, "a1", "p1")).toBe(true);
    expect(await assetProjectLinks.unlink(alice, "a1", "p1")).toBe(false);
  });

  it("resolves assets for a project through the link collection", async () => {
    const a = await Asset.create(asset);
    const b = await Asset.create({ ...asset, assetCode: "CH_002" });
    await assetProjectLinks.link(alice, a._id, "p1");
    await assetProjectLinks.link(alice, b._id, "p2");
    const forP1 = await assets.listByProject(alice, "p1");
    expect(forP1.map((x) => x._id)).toEqual([a._id]);
  });

  it("returns an empty list rather than everything when a project has none", async () => {
    await Asset.create(asset);
    expect(await assets.listByProject(alice, "p-none")).toEqual([]);
  });
});

describe("todo ownership", () => {
  it("takes profileId from the actor, not the payload", async () => {
    const t = await todos.createMine(alice, {
      title: "Mine",
      sceneId: "s1",
      profileId: bob._id, // attempt to plant it on someone else
    });
    expect(t.profileId).toBe(alice._id);
  });

  it("listMine never returns another person's todos", async () => {
    await todos.createMine(alice, { title: "A", sceneId: "s1" });
    await todos.createMine(bob, { title: "B", sceneId: "s1" });
    const mine = await todos.listMine(alice);
    expect(mine.map((t) => t.title)).toEqual(["A"]);
  });

  it.each([
    ["getMine", (id: string) => todos.getMine(bob, id)],
    ["updateMine", (id: string) => todos.updateMine(bob, id, { title: "hacked" })],
    ["deleteMine", (id: string) => todos.deleteMine(bob, id)],
    ["setCompleted", (id: string) => todos.setCompleted(bob, id, true)],
  ])("%s refuses someone else's todo", async (_n, call) => {
    const t = await todos.createMine(alice, { title: "A", sceneId: "s1" });
    await expect(call(t._id)).rejects.toThrow(ForbiddenError);
    expect((await Todo.findById(t._id).lean())!.title).toBe("A");
  });

  it("toggles completion both ways", async () => {
    const t = await todos.createMine(alice, { title: "A", sceneId: "s1" });
    expect((await todos.setCompleted(alice, t._id, true))!.completedAt).toBeInstanceOf(Date);
    expect((await todos.setCompleted(alice, t._id, false))!.completedAt).toBeUndefined();
  });
});

describe("ordering guarantees call sites rely on", () => {
  it("lists workflow processes in run order, not insertion order", async () => {
    await workflowProcesses.create(alice, {
      workflowId: "w1",
      name: "Third",
      colour: "#fff",
      processType: "Manual",
      position: 3,
    });
    await workflowProcesses.create(alice, {
      workflowId: "w1",
      name: "First",
      colour: "#fff",
      processType: "Manual",
      position: 1,
    });
    const ordered = await workflowProcesses.listActiveForWorkflow(alice, "w1");
    expect(ordered.map((p) => p.name)).toEqual(["First", "Third"]);
  });

  it("excludes inactive processes from the generation list", async () => {
    await workflowProcesses.create(alice, {
      workflowId: "w1",
      name: "Retired",
      colour: "#fff",
      processType: "Manual",
      status: "inactive",
    });
    expect(await workflowProcesses.listActiveForWorkflow(alice, "w1")).toEqual([]);
  });

  it("lists production tasks for many scenes in one call", async () => {
    await productionTasks.create(alice, { name: "A", sceneId: "s1" });
    await productionTasks.create(alice, { name: "B", sceneId: "s2" });
    await productionTasks.create(alice, { name: "C", sceneId: "s3" });
    const some = await productionTasks.listByScenes(alice, ["s1", "s2"]);
    expect(some.map((t) => t.name).sort()).toEqual(["A", "B"]);
  });

  it("returns no tasks rather than all of them for an empty scene list", async () => {
    await productionTasks.create(alice, { name: "A", sceneId: "s1" });
    expect(await productionTasks.listByScenes(alice, [])).toEqual([]);
  });

  it("refuses to repoint sourceWorkflowProcessId through a generic patch", async () => {
    const t = await productionTasks.create(alice, { name: "A", sceneId: "s1" });
    await expect(
      productionTasks.updateById(alice, t._id, { sourceWorkflowProcessId: "wp9" })
    ).rejects.toThrow(/sourceWorkflowProcessId/);
  });

  it("enforces the 0-100 range on setProgress", async () => {
    const t = await productionTasks.create(alice, { name: "A", sceneId: "s1" });
    await expect(productionTasks.setProgress(alice, t._id, 101)).rejects.toThrow(/validation/i);
    expect((await productionTasks.setProgress(alice, t._id, 50))!.progress).toBe(50);
  });

  it("hands out the next keyframe number per board", async () => {
    expect(await boardElements.nextKeyframeNumber(alice, "b1")).toBe(1);
    await boardElements.create(alice, {
      boardId: "b1",
      elementType: "keyframe",
      imageUrl: "u",
      keyframeNumber: 1,
    });
    expect(await boardElements.nextKeyframeNumber(alice, "b1")).toBe(2);
    // Independent per board.
    expect(await boardElements.nextKeyframeNumber(alice, "b2")).toBe(1);
  });
});

describe("asset files", () => {
  it("lists versions newest first", async () => {
    const base = { assetId: "a1", fileUrl: "u", fileName: "f", fileFormat: "png" };
    await assetFiles.create(alice, { ...base, sourceFileId: "src", versionNumber: 1 });
    await assetFiles.create(alice, { ...base, sourceFileId: "src", versionNumber: 3 });
    await assetFiles.create(alice, { ...base, sourceFileId: "src", versionNumber: 2 });
    const versions = await assetFiles.listVersions(alice, "src");
    expect(versions.map((v) => v.versionNumber)).toEqual([3, 2, 1]);
  });

  it("finds a file by its drive id", async () => {
    await assetFiles.create(alice, {
      assetId: "a1",
      fileUrl: "u",
      fileName: "f",
      fileFormat: "png",
      driveFileId: "drive-1",
    });
    expect((await assetFiles.getByDriveFileId(alice, "drive-1"))!.fileName).toBe("f");
    expect(await assetFiles.getByDriveFileId(alice, "nope")).toBeNull();
  });
});
