import { MongoMemoryReplSet } from "mongodb-memory-server";

export type TestMongo = {
  uri: string;
  stop: () => Promise<void>;
};

/**
 * Boots an in-process MongoDB **replica set** for tests.
 *
 * A replica set, not a standalone `mongod`: multi-document transactions only
 * work on a replica set, and the workflow-task generation service depends on
 * one. A standalone instance would let those tests pass in a way that does not
 * reflect the deployed `po_mongo`.
 */
export async function startTestMongo(): Promise<TestMongo> {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
  });

  return {
    uri: replSet.getUri(),
    // replSet.stop() resolves to a boolean; callers have no use for it, so the
    // contract stays Promise<void> and the value is discarded here.
    stop: async () => {
      await replSet.stop();
    },
  };
}
