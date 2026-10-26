import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { Workflow } from "@/lib/models/Workflow";
import { WorkflowProcess } from "@/lib/models/WorkflowProcess";
import { WorkflowTaskStatus } from "@/lib/models/WorkflowTaskStatus";
import { ProductionTask } from "@/lib/models/ProductionTask";
import { AssetTask } from "@/lib/models/AssetTask";

let mongo: TestMongo;
const models = [Workflow, WorkflowProcess, WorkflowTaskStatus, ProductionTask, AssetTask];

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await Promise.all(models.map((m) => m.syncIndexes()));
});

afterEach(async () => {
  await Promise.all(models.map((m) => m.deleteMany({})));
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

describe("Workflow", () => {
  const wf = { name: "Scene flow", colour: "#fff", workflowCode: "SCN", workflowType: "scene" };

  it("requires name, colour, workflowCode and workflowType", async () => {
    await expect(Workflow.create({})).rejects.toThrow(/validation/i);
  });

  // CHECK (workflow_type IN ('job','scene','asset','task_status'))
  it.each(["job", "scene", "asset", "task_status"])(
    "accepts workflowType %o",
    async (workflowType) => {
      await expect(Workflow.create({ ...wf, workflowType })).resolves.toBeTruthy();
    }
  );

  it("rejects a workflowType outside the contract", async () => {
    await expect(Workflow.create({ ...wf, workflowType: "episode" })).rejects.toThrow(
      /validation/i
    );
  });

  it("defaults status to active and sortOrder to 0", async () => {
    const w = await Workflow.create(wf);
    expect([w.status, w.sortOrder]).toEqual(["active", 0]);
  });
});

describe("WorkflowProcess", () => {
  const wp = { workflowId: "w1", name: "Layout", colour: "#fff", processType: "Manual" };

  it("defaults position 0, takeRetakeMode Take, takeRetakeCount 1", async () => {
    const p = await WorkflowProcess.create(wp);
    expect([p.position, p.takeRetakeMode, p.takeRetakeCount]).toEqual([0, "Take", 1]);
  });

  // CHECK (process_type IN ('Manual','Approval','Asset Progress'))
  it.each(["Manual", "Approval", "Asset Progress"])(
    "accepts processType %o",
    async (processType) => {
      await expect(WorkflowProcess.create({ ...wp, processType })).resolves.toBeTruthy();
    }
  );

  it("rejects a processType outside the contract", async () => {
    await expect(WorkflowProcess.create({ ...wp, processType: "Auto" })).rejects.toThrow(
      /validation/i
    );
  });

  // CHECK (take_retake_mode IN ('Take','Retake'))
  it("rejects a takeRetakeMode outside the contract", async () => {
    await expect(WorkflowProcess.create({ ...wp, takeRetakeMode: "Redo" })).rejects.toThrow(
      /validation/i
    );
  });

  // CHECK (take_retake_count > 0)
  it("rejects a takeRetakeCount of 0", async () => {
    await expect(WorkflowProcess.create({ ...wp, takeRetakeCount: 0 })).rejects.toThrow(
      /validation/i
    );
  });

  // CHECK (default_completion BETWEEN 0 AND 100)
  it.each([-1, 101])("rejects defaultCompletion %o", async (defaultCompletion) => {
    await expect(WorkflowProcess.create({ ...wp, defaultCompletion })).rejects.toThrow(
      /validation/i
    );
  });

  // CHECK (duration_days >= 0) / CHECK (effort_hours >= 0)
  it.each([
    ["durationDays", { durationDays: -1 }],
    ["effortHours", { effortHours: -1 }],
  ])("rejects a negative %s", async (_n, patch) => {
    await expect(WorkflowProcess.create({ ...wp, ...patch })).rejects.toThrow(/validation/i);
  });
});

describe("WorkflowTaskStatus", () => {
  const ts = { workflowId: "w1", name: "Standby", colour: "#ccc" };

  // CHECK (completion_percentage BETWEEN 0 AND 100)
  it.each([-1, 101])("rejects completionPercentage %o", async (completionPercentage) => {
    await expect(
      WorkflowTaskStatus.create({ ...ts, completionPercentage })
    ).rejects.toThrow(/validation/i);
  });

  it("defaults completionPercentage to 0", async () => {
    expect((await WorkflowTaskStatus.create(ts)).completionPercentage).toBe(0);
  });
});

describe("ProductionTask", () => {
  it("defaults status to Unassigned and progress to 0", async () => {
    const t = await ProductionTask.create({ name: "Layout", sceneId: "s1" });
    expect([t.status, t.progress]).toEqual(["Unassigned", 0]);
  });

  it("has no environmentId field (dropped by migration 033)", () => {
    expect(ProductionTask.schema.path("environmentId")).toBeUndefined();
  });

  /**
   * Review Focus 1 — the whole reason the index is partial.
   *
   * The live index is:
   *   (episode_id, scene_id, day_id, source_workflow_process_id)
   *   NULLS NOT DISTINCT WHERE source_workflow_process_id IS NOT NULL
   *
   * Hand-seeded demo tasks have no source process, so they must fall outside
   * the index entirely. This is exactly the case that makes migration 027
   * unreplayable: its original constraint was not partial, so 11 seeded demo
   * tasks collided.
   */
  it("allows many tasks on one scene when none came from a workflow process", async () => {
    await ProductionTask.create({ name: "Layout", sceneId: "s1" });
    await ProductionTask.create({ name: "Setup", sceneId: "s1" });
    await expect(
      ProductionTask.create({ name: "Render", sceneId: "s1" })
    ).resolves.toBeTruthy();
    expect(await ProductionTask.countDocuments({ sceneId: "s1" })).toBe(3);
  });

  it("rejects a second task from the same workflow process on the same scene", async () => {
    const row = { name: "Layout", sceneId: "s2", sourceWorkflowProcessId: "wp1" };
    await ProductionTask.create(row);
    await expect(ProductionTask.create({ ...row, name: "Dup" })).rejects.toThrow(
      /duplicate key/i
    );
  });

  // dayId is part of the index — four columns, not three.
  it("allows the same process on the same scene for different days", async () => {
    const row = { name: "Layout", sceneId: "s3", sourceWorkflowProcessId: "wp1" };
    await ProductionTask.create({ ...row, dayId: "d1" });
    await expect(ProductionTask.create({ ...row, dayId: "d2" })).resolves.toBeTruthy();
  });

  it("treats a missing dayId as equal, matching NULLS NOT DISTINCT", async () => {
    const row = { name: "Layout", sceneId: "s4", sourceWorkflowProcessId: "wp2" };
    await ProductionTask.create(row);
    await expect(ProductionTask.create({ ...row, name: "Dup" })).rejects.toThrow(
      /duplicate key/i
    );
  });

  // CHECK (progress BETWEEN 0 AND 100)
  it.each([-1, 101])("rejects progress %o", async (progress) => {
    await expect(ProductionTask.create({ name: "x", sceneId: "s1", progress })).rejects.toThrow(
      /validation/i
    );
  });

  // CHECK (contributes_to_task_id <> id AND branches_from_task_id <> id)
  it.each([
    ["contributesToTaskId", "contributesToTaskId"],
    ["branchesFromTaskId", "branchesFromTaskId"],
  ])("rejects a task that links to itself via %s", async (_n, field) => {
    await expect(
      ProductionTask.create({ _id: "t-self", name: "x", sceneId: "s1", [field]: "t-self" })
    ).rejects.toThrow(/validation/i);
  });

  it("allows linking to a different task", async () => {
    await expect(
      ProductionTask.create({
        _id: "t-a",
        name: "x",
        sceneId: "s1",
        contributesToTaskId: "t-b",
      })
    ).resolves.toBeTruthy();
  });
});

describe("AssetTask", () => {
  it("requires assetId and name", async () => {
    await expect(AssetTask.create({})).rejects.toThrow(/validation/i);
  });

  /**
   * uq_asset_task_process is NULLS NOT DISTINCT with **no** WHERE clause, so
   * unlike production_tasks it is NOT partial: two process-less tasks on the
   * same asset genuinely do collide. Reproducing the live behaviour, not the
   * behaviour that would be nicer.
   */
  it("rejects a second process-less task on the same asset", async () => {
    await AssetTask.create({ name: "Model", assetId: "a1" });
    await expect(AssetTask.create({ name: "Rig", assetId: "a1" })).rejects.toThrow(
      /duplicate key/i
    );
  });

  it("allows tasks from different processes on the same asset", async () => {
    await AssetTask.create({ name: "Model", assetId: "a2", sourceWorkflowProcessId: "wp1" });
    await expect(
      AssetTask.create({ name: "Rig", assetId: "a2", sourceWorkflowProcessId: "wp2" })
    ).resolves.toBeTruthy();
  });

  it("rejects the same process twice on one asset", async () => {
    const row = { name: "Model", assetId: "a3", sourceWorkflowProcessId: "wp1" };
    await AssetTask.create(row);
    await expect(AssetTask.create({ ...row, name: "Dup" })).rejects.toThrow(/duplicate key/i);
  });
});
