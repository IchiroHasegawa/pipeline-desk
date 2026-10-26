import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { syncAllIndexes } from "@/lib/models";
import { Board } from "@/lib/models/Board";
import { getOrCreateBoard } from "@/lib/services/boards";
import { ForbiddenError } from "@/lib/permissions/errors";
import type { Actor } from "@/lib/permissions";

let mongo: TestMongo;
const alice: Actor = { _id: "alice", accountStatus: "active", systemRole: "user" };

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await syncAllIndexes();
});

afterEach(async () => {
  await Board.deleteMany({});
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

describe("getOrCreateBoard", () => {
  it("creates a board on first call and returns the same one after", async () => {
    const first = await getOrCreateBoard(alice, { projectId: "p1" });
    const second = await getOrCreateBoard(alice, { projectId: "p1" });
    expect(first._id).toBe(second._id);
    expect(await Board.countDocuments()).toBe(1);
  });

  /**
   * The reason this is an upsert and not read-then-insert: two people opening
   * the same board at once would both read "absent" and both insert, and the
   * partial unique index would turn the loser into an error dialog.
   */
  it("creates exactly one board under concurrent calls", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => getOrCreateBoard(alice, { projectId: "p1" }))
    );
    expect(await Board.countDocuments({ projectId: "p1" })).toBe(1);
    expect(new Set(results.map((b) => b._id)).size).toBe(1);
  });

  it("keeps project and scene boards separate", async () => {
    const forProject = await getOrCreateBoard(alice, { projectId: "p1" });
    const forScene = await getOrCreateBoard(alice, { sceneId: "s1" });
    expect(forProject._id).not.toBe(forScene._id);
    expect(forProject.sceneId).toBeUndefined();
    expect(forScene.projectId).toBeUndefined();
  });

  it("requires an active account", async () => {
    await expect(
      getOrCreateBoard({ ...alice, accountStatus: "suspended" }, { projectId: "p1" })
    ).rejects.toThrow(ForbiddenError);
  });

  it("refuses a reference that is neither a project nor a scene", async () => {
    // @ts-expect-error deliberately empty, mirroring a bad call site
    await expect(getOrCreateBoard(alice, {})).rejects.toThrow(/exactly one/i);
  });

  it("refuses a reference naming both", async () => {
    await expect(
      // @ts-expect-error both scopes at once is not a valid reference
      getOrCreateBoard(alice, { projectId: "p1", sceneId: "s1" })
    ).rejects.toThrow(/exactly one/i);
  });
});
