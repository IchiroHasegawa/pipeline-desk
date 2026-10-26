import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { startTestMongo } from "./mongo";

describe("test mongo", () => {
  it("supports multi-document transactions", async () => {
    const { uri, stop } = await startTestMongo();
    await mongoose.connect(uri);
    const M = mongoose.model("T", new mongoose.Schema({ n: Number }));

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Mongoose 9 requires `ordered: true` for a multi-document create in a session.
      await M.create([{ n: 1 }, { n: 2 }], { session, ordered: true });
    });
    await session.endSession();
    expect(await M.countDocuments()).toBe(2);

    const s2 = await mongoose.startSession();
    await expect(
      s2.withTransaction(async () => {
        await M.create([{ n: 3 }], { session: s2 });
        throw new Error("abort");
      })
    ).rejects.toThrow("abort");
    await s2.endSession();
    expect(await M.countDocuments()).toBe(2); // rolled back

    await mongoose.disconnect();
    await stop();
  });
});
