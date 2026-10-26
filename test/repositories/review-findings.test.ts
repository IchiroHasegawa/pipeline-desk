import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { syncAllIndexes } from "@/lib/models";
import { Profile } from "@/lib/models/Profile";
import { Todo } from "@/lib/models/Todo";
import { profiles } from "@/lib/repositories/profiles";
import { todos } from "@/lib/repositories/boards";
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
  await Promise.all([Profile.deleteMany({}), Todo.deleteMany({})]);
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

async function makeProfile(id: string) {
  return Profile.create({
    _id: id,
    email: `${id}@x.com`,
    username: `${id}_user`,
    passwordHash: "h",
  });
}

/**
 * Review finding 1 — profiles inherited unguarded writes.
 *
 * `profiles` spreads baseRepo and then overrides only `getById`. The RLS
 * policy it replaces was `auth.uid() = id AND is_active_user()`, which governed
 * *all* access to a profile row, not reads alone. So the inherited
 * `updateById` / `deleteById` let any active user edit or delete anyone else's
 * profile — changing their displayName, or removing the account outright.
 */
describe("profiles: write access must be self-only", () => {
  it("refuses to update someone else's profile", async () => {
    await makeProfile("bob");
    await expect(
      profiles.updateById(alice, "bob", { displayName: "hacked" })
    ).rejects.toThrow(ForbiddenError);
    expect((await Profile.findById("bob").lean())!.displayName).toBeUndefined();
  });

  it("allows updating your own profile", async () => {
    await makeProfile("alice");
    const updated = await profiles.updateById(alice, "alice", { displayName: "Ada" });
    expect(updated!.displayName).toBe("Ada");
  });

  it("refuses to delete someone else's profile", async () => {
    await makeProfile("bob");
    await expect(profiles.deleteById(alice, "bob")).rejects.toThrow(ForbiddenError);
    expect(await Profile.countDocuments({ _id: "bob" })).toBe(1);
  });

  // For queries not addressed by id, the scope makes other rows *invisible*
  // rather than raising — which is what the RLS policy did too. Only
  // id-addressed access can distinguish "not yours" from "not there", and only
  // that case raises.
  it("list shows you only yourself, never everyone", async () => {
    await makeProfile("alice");
    await makeProfile("bob");
    const visible = await profiles.list(alice);
    expect(visible.map((p) => p._id)).toEqual(["alice"]);
  });

  it("listAllAsOwner is the only way to see everyone, and is owner-gated", async () => {
    await makeProfile("alice");
    await makeProfile("bob");
    await expect(profiles.listAllAsOwner(alice)).rejects.toThrow(ForbiddenError);
    await expect(
      profiles.listAllAsOwner({ ...alice, systemRole: "owner" })
    ).resolves.toHaveLength(2);
  });

  it("getOne cannot be used to reach outside the scope", async () => {
    await makeProfile("alice");
    await makeProfile("bob");
    // The scope is spread last, so a caller passing the same key cannot widen
    // it: asking for bob by id still resolves within alice's scope.
    const got = await profiles.getOne(alice, { _id: "bob" });
    expect(got?._id).toBe("alice");
  });

  it("count reports only what is in scope", async () => {
    await makeProfile("alice");
    await makeProfile("bob");
    expect(await profiles.count(alice)).toBe(1);
  });

  it("deleteMany cannot reach outside the scope", async () => {
    await makeProfile("alice");
    await makeProfile("bob");
    expect(await profiles.deleteMany(alice, {})).toBe(1);
    expect(await Profile.countDocuments({ _id: "bob" })).toBe(1);
  });
});

/**
 * Review finding 2 — todos exposed unguarded CRUD beside the guarded methods.
 *
 * `todos` spreads baseRepo, so `updateById` / `deleteById` / `getById` / `list`
 * sit next to `updateMine` / `deleteMine` / `getMine` / `listMine`. The
 * unguarded names reach any row regardless of owner, and a Plan 2 call site
 * picking the shorter name would silently bypass ownership.
 */
describe("todos: the unguarded inherited methods must not reach other owners", () => {
  it("refuses updateById on someone else's todo", async () => {
    const t = await todos.createMine(bob, { title: "Bob's", sceneId: "s1" });
    await expect(
      todos.updateById(alice, t._id, { title: "hacked" })
    ).rejects.toThrow(ForbiddenError);
    expect((await Todo.findById(t._id).lean())!.title).toBe("Bob's");
  });

  it("refuses deleteById on someone else's todo", async () => {
    const t = await todos.createMine(bob, { title: "Bob's", sceneId: "s1" });
    await expect(todos.deleteById(alice, t._id)).rejects.toThrow(ForbiddenError);
    expect(await Todo.countDocuments()).toBe(1);
  });

  it("refuses getById on someone else's todo", async () => {
    const t = await todos.createMine(bob, { title: "Bob's", sceneId: "s1" });
    await expect(todos.getById(alice, t._id)).rejects.toThrow(ForbiddenError);
  });

  it("scopes list to the acting user instead of returning everyone's", async () => {
    await todos.createMine(alice, { title: "Alice's", sceneId: "s1" });
    await todos.createMine(bob, { title: "Bob's", sceneId: "s1" });
    const visible = await todos.list(alice);
    expect(visible.map((t) => t.title)).toEqual(["Alice's"]);
  });

  it("still lets you work on your own todo through the inherited names", async () => {
    const t = await todos.createMine(alice, { title: "Mine", sceneId: "s1" });
    expect((await todos.updateById(alice, t._id, { title: "Updated" }))!.title).toBe("Updated");
    expect(await todos.deleteById(alice, t._id)).toBe(true);
  });
});
