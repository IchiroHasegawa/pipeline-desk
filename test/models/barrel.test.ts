import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { ALL_MODELS, syncAllIndexes } from "@/lib/models";

let mongo: TestMongo;

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

describe("model barrel", () => {
  it("registers one model per migrated table", () => {
    // 23 Postgres base tables, minus auth.users (merged into Profile) and the
    // 23rd being profiles itself, plus the 2 new auth collections.
    expect(ALL_MODELS).toHaveLength(25);
  });

  it("gives every model a distinct collection name", () => {
    const names = ALL_MODELS.map((m) => m.collection.collectionName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("syncs every index without a name or option conflict", async () => {
    // This is the guard for the bug that `refTo`'s implicit index caused on
    // Board: an explicit single-field index auto-generates the same name as
    // the implicit one, and Mongo rejects the pair.
    await expect(syncAllIndexes()).resolves.toBeUndefined();
  });
});
