import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { Profile } from "@/lib/models/Profile";
import { Project } from "@/lib/models/Project";
import { projects } from "@/lib/repositories/projects";
import { profiles } from "@/lib/repositories/profiles";
import { ForbiddenError, UnauthorizedError } from "@/lib/permissions/errors";
import type { Actor } from "@/lib/permissions";

let mongo: TestMongo;

const actor = (over: Partial<Actor> = {}): Actor => ({
  _id: "u1",
  accountStatus: "active",
  systemRole: "user",
  ...over,
});

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await Promise.all([Profile.syncIndexes(), Project.syncIndexes()]);
});

afterEach(async () => {
  await Promise.all([Profile.deleteMany({}), Project.deleteMany({})]);
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

describe("every repository method requires an active actor", () => {
  const calls: [string, (a: Actor | null) => Promise<unknown>][] = [
    ["list", (a) => projects.list(a as Actor)],
    ["getById", (a) => projects.getById(a as Actor, "p1")],
    ["create", (a) => projects.create(a as Actor, { title: "x", projectCode: "X" })],
    ["updateById", (a) => projects.updateById(a as Actor, "p1", { title: "y" })],
    ["deleteById", (a) => projects.deleteById(a as Actor, "p1")],
    ["count", (a) => projects.count(a as Actor)],
  ];

  it.each(calls)("%s rejects a missing actor with 401", async (_n, call) => {
    await expect(call(null)).rejects.toThrow(UnauthorizedError);
  });

  it.each(calls)("%s rejects a disabled actor with 403", async (_n, call) => {
    await expect(call(actor({ accountStatus: "disabled" }))).rejects.toThrow(ForbiddenError);
  });
});

describe("base repository behaviour", () => {
  it("returns plain objects, not hydrated documents", async () => {
    await projects.create(actor(), { title: "Demo", projectCode: "DEMO" });
    const [row] = await projects.list(actor());
    expect(row.constructor).toBe(Object);
    // A hydrated Mongoose document would carry these.
    expect(row).not.toHaveProperty("$__");
    expect(row).not.toHaveProperty("save");
  });

  it("getById returns null for a missing row rather than throwing", async () => {
    expect(await projects.getById(actor(), "nope")).toBeNull();
  });

  it("deleteById reports whether anything was removed", async () => {
    const made = await projects.create(actor(), { title: "Demo", projectCode: "DEMO" });
    expect(await projects.deleteById(actor(), made._id)).toBe(true);
    expect(await projects.deleteById(actor(), made._id)).toBe(false);
  });

  it("updateById returns the updated row", async () => {
    const made = await projects.create(actor(), { title: "Old", projectCode: "DEMO" });
    const updated = await projects.updateById(actor(), made._id, { title: "New" });
    expect(updated!.title).toBe("New");
  });

  it("updateById still enforces schema validation", async () => {
    const made = await projects.create(actor(), { title: "Demo", projectCode: "DEMO" });
    await expect(
      projects.updateById(actor(), made._id, { status: "Archived" })
    ).rejects.toThrow(/validation/i);
  });

  it("list accepts a filter so call sites need no raw query", async () => {
    const a = await projects.create(actor(), { title: "A", projectCode: "A1" });
    await projects.create(actor(), { title: "B", projectCode: "B1" });
    await projects.updateById(actor(), a._id, { status: "Retired" });
    const retired = await projects.list(actor(), { status: "Retired" });
    expect(retired.map((p) => p.projectCode)).toEqual(["A1"]);
  });

  it("refuses to let a generic create set isSystem", async () => {
    // Only the seed may create the single system project — there is a partial
    // unique index allowing exactly one, so a stray create would either claim
    // it or fail confusingly later.
    await expect(
      projects.create(actor(), { title: "A", projectCode: "A1", isSystem: true })
    ).rejects.toThrow(/isSystem/);
  });
});

describe("immutable field guard", () => {
  /**
   * The single most important test in this file.
   *
   * Postgres had a trigger (prevent_system_role_update) that silently reverted
   * any client-side change to system_role. That trigger is gone. If a generic
   * repository update could write systemRole, any user could promote
   * themselves to owner with a crafted patch. Only lib/auth/roles.ts may
   * write it.
   */
  it("refuses to let a generic update write systemRole", async () => {
    const made = await Profile.create({
      email: "a@x.com",
      username: "aa_user",
      passwordHash: "h",
    });

    await expect(
      profiles.updateById(actor({ _id: made._id }), made._id, {
        systemRole: "owner",
      } as Record<string, unknown>)
    ).rejects.toThrow(/systemRole/);

    expect((await Profile.findById(made._id).lean())!.systemRole).toBe("user");
  });

  it("refuses to let a generic update write passwordHash", async () => {
    const made = await Profile.create({
      email: "a@x.com",
      username: "aa_user",
      passwordHash: "h",
    });

    await expect(
      profiles.updateById(actor({ _id: made._id }), made._id, {
        passwordHash: "attacker-chosen",
      } as Record<string, unknown>)
    ).rejects.toThrow(/passwordHash/);
  });

  it("refuses to let a generic create set systemRole", async () => {
    await expect(
      profiles.create(actor(), {
        email: "b@x.com",
        username: "bb_user",
        passwordHash: "h",
        systemRole: "owner",
      } as Record<string, unknown>)
    ).rejects.toThrow(/systemRole/);
  });

  it("allows updating a field that is not protected", async () => {
    const made = await Profile.create({
      email: "a@x.com",
      username: "aa_user",
      passwordHash: "h",
    });
    const updated = await profiles.updateById(actor({ _id: made._id }), made._id, {
      displayName: "Ada",
    });
    expect(updated!.displayName).toBe("Ada");
  });
});

describe("profiles repository", () => {
  it("never returns the password hash", async () => {
    const made = await Profile.create({
      email: "a@x.com",
      username: "aa_user",
      passwordHash: "secret-hash",
    });
    const got = await profiles.getOwn(actor({ _id: made._id }));
    expect(got).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(got)).not.toContain("secret-hash");
  });

  // RLS was: auth.uid() = id AND is_active_user()
  it("refuses to read another person's profile", async () => {
    const other = await Profile.create({
      email: "b@x.com",
      username: "bb_user",
      passwordHash: "h",
    });
    await expect(profiles.getById(actor({ _id: "someone-else" }), other._id)).rejects.toThrow(
      ForbiddenError
    );
  });

  it("lets you read your own profile by id", async () => {
    const mine = await Profile.create({
      email: "c@x.com",
      username: "cc_user",
      passwordHash: "h",
    });
    const got = await profiles.getById(actor({ _id: mine._id }), mine._id);
    expect(got!.username).toBe("cc_user");
  });
});
