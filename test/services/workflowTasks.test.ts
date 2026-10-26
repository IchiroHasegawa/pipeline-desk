import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { ALL_MODELS, syncAllIndexes } from "@/lib/models";
import { Workflow } from "@/lib/models/Workflow";
import { WorkflowProcess } from "@/lib/models/WorkflowProcess";
import { WorkflowTaskStatus } from "@/lib/models/WorkflowTaskStatus";
import { ProductionTask } from "@/lib/models/ProductionTask";
import { AssetTask } from "@/lib/models/AssetTask";
import { generateWorkflowTasks } from "@/lib/services/workflowTasks";
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
  vi.restoreAllMocks();
  await Promise.all(ALL_MODELS.map((m) => m.deleteMany({})));
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

/** A scene workflow with three active processes and one retired one. */
async function sceneWorkflow() {
  const wf = await Workflow.create({
    _id: "wf-scene",
    name: "Scene flow",
    colour: "#fff",
    workflowCode: "SCN",
    workflowType: "scene",
    status: "active",
  });
  const done = await WorkflowTaskStatus.create({
    _id: "wts-standby-named",
    workflowId: wf._id,
    name: "Blocked",
    colour: "#000",
    completionPercentage: 0,
  });
  await WorkflowProcess.create([
    {
      _id: "wp-1",
      workflowId: wf._id,
      name: "Layout",
      colour: "#fff",
      processType: "Manual",
      position: 1,
      defaultCompletion: 10,
      defaultTaskStatusId: done._id,
      durationDays: 2,
      effortHours: 8,
    },
    {
      _id: "wp-2",
      workflowId: wf._id,
      name: "Animation",
      colour: "#fff",
      processType: "Manual",
      position: 2,
    },
    {
      _id: "wp-3",
      workflowId: wf._id,
      name: "Render",
      colour: "#fff",
      processType: "Manual",
      position: 3,
    },
    {
      _id: "wp-off",
      workflowId: wf._id,
      name: "Retired step",
      colour: "#fff",
      processType: "Manual",
      position: 4,
      status: "inactive",
    },
  ]);
  return wf;
}

describe("generateWorkflowTasks validation", () => {
  it("requires an active account", async () => {
    await sceneWorkflow();
    await expect(
      generateWorkflowTasks(
        { ...alice, accountStatus: "disabled" },
        "scene",
        "s1",
        "wf-scene"
      )
    ).rejects.toThrow(ForbiddenError);
  });

  it("rejects an unsupported entity type", async () => {
    await sceneWorkflow();
    await expect(
      // @ts-expect-error deliberately outside the union, mirroring the raw API
      generateWorkflowTasks(alice, "environment", "x1", "wf-scene")
    ).rejects.toThrow(/Unsupported entity type/);
  });

  it("rejects an unknown workflow with the schema's own message", async () => {
    await expect(generateWorkflowTasks(alice, "scene", "s1", "nope")).rejects.toThrow(
      "The selected Workflow is not valid or active."
    );
  });

  it("rejects an inactive workflow", async () => {
    const wf = await sceneWorkflow();
    await Workflow.updateOne({ _id: wf._id }, { $set: { status: "inactive" } });
    await expect(generateWorkflowTasks(alice, "scene", "s1", wf._id)).rejects.toThrow(
      "The selected Workflow is not valid or active."
    );
  });

  it("rejects a workflow whose type does not match the entity", async () => {
    await sceneWorkflow();
    await expect(generateWorkflowTasks(alice, "asset", "a1", "wf-scene")).rejects.toThrow(
      "The selected Workflow is not valid for this item."
    );
  });
});

describe("generateWorkflowTasks output", () => {
  beforeEach(sceneWorkflow);

  it("creates one task per ACTIVE process, in position order", async () => {
    const result = await generateWorkflowTasks(alice, "scene", "s1", "wf-scene");
    expect(result.created).toBe(3); // the inactive process is skipped

    const tasks = await ProductionTask.find({ sceneId: "s1" }).sort({ sortOrder: 1 }).lean();
    expect(tasks.map((t) => t.name)).toEqual(["Layout", "Animation", "Render"]);
    expect(tasks.map((t) => t.sortOrder)).toEqual([1, 2, 3]);
  });

  it("copies progress from defaultCompletion and carries the process fields", async () => {
    await generateWorkflowTasks(alice, "scene", "s1", "wf-scene");
    const layout = await ProductionTask.findOne({ sceneId: "s1", name: "Layout" }).lean();
    expect(layout!.progress).toBe(10);
    expect(layout!.durationDays).toBe(2);
    expect(layout!.effortHours).toBe(8);
    expect(layout!.sourceWorkflowId).toBe("wf-scene");
    expect(layout!.sourceWorkflowProcessId).toBe("wp-1");
  });

  // status = COALESCE(default_status_name, 'Standby')
  it("uses the default status's NAME, falling back to Standby", async () => {
    await generateWorkflowTasks(alice, "scene", "s1", "wf-scene");
    const layout = await ProductionTask.findOne({ sceneId: "s1", name: "Layout" }).lean();
    const render = await ProductionTask.findOne({ sceneId: "s1", name: "Render" }).lean();
    expect(layout!.status).toBe("Blocked"); // wp-1 points at a named status
    expect(render!.status).toBe("Standby"); // wp-3 has none
  });

  it("writes production tasks against sceneId for a scene workflow", async () => {
    await generateWorkflowTasks(alice, "scene", "s1", "wf-scene");
    const t = await ProductionTask.findOne({ name: "Layout" }).lean();
    expect(t!.sceneId).toBe("s1");
    expect(t!.episodeId).toBeUndefined();
  });

  it("writes production tasks against episodeId for a job workflow", async () => {
    await Workflow.create({
      _id: "wf-job",
      name: "Job flow",
      colour: "#fff",
      workflowCode: "JOB",
      workflowType: "job",
      status: "active",
    });
    await WorkflowProcess.create({
      _id: "wpj-1",
      workflowId: "wf-job",
      name: "Brief",
      colour: "#fff",
      processType: "Manual",
      position: 1,
    });
    await generateWorkflowTasks(alice, "job", "e1", "wf-job");
    const t = await ProductionTask.findOne({ name: "Brief" }).lean();
    expect(t!.episodeId).toBe("e1");
    expect(t!.sceneId).toBeUndefined();
  });

  it("writes asset tasks for an asset workflow", async () => {
    await Workflow.create({
      _id: "wf-asset",
      name: "Asset flow",
      colour: "#fff",
      workflowCode: "AST",
      workflowType: "asset",
      status: "active",
    });
    await WorkflowProcess.create({
      _id: "wpa-1",
      workflowId: "wf-asset",
      name: "Model",
      colour: "#fff",
      processType: "Manual",
      position: 1,
    });
    const result = await generateWorkflowTasks(alice, "asset", "a1", "wf-asset");
    expect(result.created).toBe(1);
    expect(await ProductionTask.countDocuments()).toBe(0);
    expect((await AssetTask.findOne({ assetId: "a1" }).lean())!.name).toBe("Model");
  });
});

describe("generateWorkflowTasks idempotency and atomicity", () => {
  beforeEach(sceneWorkflow);

  // ON CONFLICT ... DO NOTHING
  it("running twice creates each task exactly once", async () => {
    const first = await generateWorkflowTasks(alice, "scene", "s1", "wf-scene");
    const second = await generateWorkflowTasks(alice, "scene", "s1", "wf-scene");
    expect(first.created).toBe(3);
    expect(second.created).toBe(0);
    expect(await ProductionTask.countDocuments({ sceneId: "s1" })).toBe(3);
  });

  it("generating for a different scene is independent", async () => {
    await generateWorkflowTasks(alice, "scene", "s1", "wf-scene");
    const other = await generateWorkflowTasks(alice, "scene", "s2", "wf-scene");
    expect(other.created).toBe(3);
    expect(await ProductionTask.countDocuments()).toBe(6);
  });

  /**
   * Review Focus 5 — a failure partway through must leave nothing behind.
   *
   * The spy is how the failure is injected; the assertion is on the database,
   * so this tests the transaction rather than the mock.
   */
  it("creates no tasks at all when an insert fails partway through", async () => {
    let calls = 0;
    const real = ProductionTask.create.bind(ProductionTask);
    vi.spyOn(ProductionTask, "create").mockImplementation(async (...args: unknown[]) => {
      calls += 1;
      if (calls === 2) throw new Error("injected failure on the second insert");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return real(...(args as [any, any]));
    });

    await expect(generateWorkflowTasks(alice, "scene", "s1", "wf-scene")).rejects.toThrow(
      "injected failure"
    );

    vi.restoreAllMocks();
    expect(await ProductionTask.countDocuments({ sceneId: "s1" })).toBe(0);
  });
});
