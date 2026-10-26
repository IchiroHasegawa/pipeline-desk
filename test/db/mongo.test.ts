import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";

let mongo: TestMongo;

beforeAll(async () => {
  mongo = await startTestMongo();
});

afterEach(async () => {
  await disconnectMongo();
  delete process.env.MONGODB_URI;
});

afterAll(async () => {
  await mongo.stop();
});

describe("connectMongo", () => {
  it("reuses a single connection across calls", async () => {
    const a = await connectMongo(mongo.uri);
    const b = await connectMongo(mongo.uri);
    expect(a).toBe(b);
    expect(mongoose.connections.filter((c) => c.readyState === 1)).toHaveLength(1);
  });

  it("reads MONGODB_URI when called with no argument", async () => {
    process.env.MONGODB_URI = mongo.uri;
    const m = await connectMongo();
    expect(m.connection.readyState).toBe(1);
  });

  it("throws a named error when no uri is configured", async () => {
    await expect(connectMongo()).rejects.toThrow(/MONGODB_URI/);
  });

  it("shares one in-flight connect between concurrent callers", async () => {
    const [a, b] = await Promise.all([connectMongo(mongo.uri), connectMongo(mongo.uri)]);
    expect(a).toBe(b);
    expect(mongoose.connections.filter((c) => c.readyState === 1)).toHaveLength(1);
  });
});
