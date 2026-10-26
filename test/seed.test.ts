import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../test/setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { ALL_MODELS, syncAllIndexes } from "@/lib/models";
import { Project } from "@/lib/models/Project";
import { Workflow } from "@/lib/models/Workflow";
import { WorkflowProcess } from "@/lib/models/WorkflowProcess";
import { WorkflowTaskStatus } from "@/lib/models/WorkflowTaskStatus";
import { ProductionTask } from "@/lib/models/ProductionTask";
import { Episode } from "@/lib/models/Episode";
import { Scene } from "@/lib/models/Scene";
import { seedMongo } from "@/lib/seed";

let mongo: TestMongo;

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

describe("seedMongo", () => {
  it("seeds the expected row counts", async () => {
    const { counts } = await seedMongo();
    expect(counts).toMatchObject({
      workflowTaskStatuses: 7,
      workflows: 9,
      workflowProcesses: 60,
      projects: 2,
      episodes: 3,
      scenes: 2,
      sceneNotes: 1,
    });
  });

  it("is idempotent", async () => {
    await seedMongo();
    const before = await Promise.all(ALL_MODELS.map((m) => m.countDocuments()));
    await seedMongo();
    const after = await Promise.all(ALL_MODELS.map((m) => m.countDocuments()));
    expect(after).toEqual(before);
  });

  /**
   * The 11 hand-seeded demo production tasks are exactly what collides with
   * migration 027's unique constraint. Re-seeding them would reintroduce the
   * problem the Phase 0 deploy patch exists to solve.
   */
  it("seeds no production tasks", async () => {
    await seedMongo();
    expect(await ProductionTask.countDocuments()).toBe(0);
  });

  it("creates the single system project (migration 032's Unknown)", async () => {
    await seedMongo();
    const system = await Project.find({ isSystem: true }).lean();
    expect(system).toHaveLength(1);
    expect(system[0].projectCode).toBe("UNKNOWN");
  });

  it("seeds data that satisfies the schema, not just the row count", async () => {
    await seedMongo();
    // Every workflow process must point at a workflow that exists, or task
    // generation would produce tasks referencing nothing.
    const workflowIds = new Set((await Workflow.find().select("_id").lean()).map((w) => w._id));
    const processes = await WorkflowProcess.find().lean();
    expect(processes.every((p) => workflowIds.has(p.workflowId))).toBe(true);

    const statuses = await WorkflowTaskStatus.find().lean();
    expect(statuses.every((s) => workflowIds.has(s.workflowId))).toBe(true);
  });

  it("keeps the episode and scene hierarchy intact", async () => {
    await seedMongo();
    const projectIds = new Set((await Project.find().select("_id").lean()).map((p) => p._id));
    const episodes = await Episode.find().lean();
    expect(episodes.every((e) => projectIds.has(e.projectId))).toBe(true);

    const episodeIds = new Set(episodes.map((e) => e._id));
    const scenes = await Scene.find().lean();
    expect(scenes.every((s) => episodeIds.has(s.episodeId))).toBe(true);
  });

  it("produces workflows of every type the generator accepts", async () => {
    await seedMongo();
    const types = new Set((await Workflow.find().select("workflowType").lean()).map((w) => w.workflowType));
    expect(types.has("scene")).toBe(true);
    expect(types.has("asset")).toBe(true);
  });

  it("reports what it wrote versus what already existed", async () => {
    const first = await seedMongo();
    expect(first.inserted).toBeGreaterThan(0);
    const second = await seedMongo();
    expect(second.inserted).toBe(0);
  });
});
