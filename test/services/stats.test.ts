import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { ALL_MODELS, syncAllIndexes } from "@/lib/models";
import { Episode } from "@/lib/models/Episode";
import { Scene } from "@/lib/models/Scene";
import { ProductionTask } from "@/lib/models/ProductionTask";
import { WorkflowTaskStatus } from "@/lib/models/WorkflowTaskStatus";
import { Todo } from "@/lib/models/Todo";
import { Asset } from "@/lib/models/Asset";
import { AssetFile } from "@/lib/models/AssetFile";
import { AssetProjectLink } from "@/lib/models/AssetProjectLink";
import { AssetJobLink } from "@/lib/models/AssetJobLink";
import { AssetSceneLink } from "@/lib/models/AssetSceneLink";
import {
  projectEpisodeStatus,
  projectCommitDays,
  projectAssetStats,
} from "@/lib/services/stats";
import type { Actor } from "@/lib/permissions";

let mongo: TestMongo;
const alice: Actor = { _id: "alice", accountStatus: "active", systemRole: "user" };

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

/**
 * Fixture for project P1:
 *   E1 -> S1 with 2 day-less tasks (1 complete, 1 not) and 1 day-bound task
 *   E2 -> no tasks at all
 * So E1 is in progress, E2 is not started.
 */
async function episodeFixture() {
  await Episode.create([
    { _id: "e1", projectId: "p1", episodeName: "Ep 1" },
    { _id: "e2", projectId: "p1", episodeName: "Ep 2" },
  ]);
  await Scene.create([
    { _id: "s1", episodeId: "e1", sceneName: "Sc 1" },
    { _id: "s2", episodeId: "e2", sceneName: "Sc 2" },
  ]);
  await WorkflowTaskStatus.create([
    { _id: "done", workflowId: "w1", name: "Done", colour: "#0f0", completionPercentage: 100 },
    { _id: "wip", workflowId: "w1", name: "WIP", colour: "#ff0", completionPercentage: 50 },
  ]);
  await ProductionTask.create([
    { _id: "t1", name: "A", sceneId: "s1", taskStatusDefinitionId: "done" },
    { _id: "t2", name: "B", sceneId: "s1", taskStatusDefinitionId: "wip" },
    // day-bound: the view joins ON pt.day_id IS NULL, so this must be ignored
    { _id: "t3", name: "C", sceneId: "s1", dayId: "d1", taskStatusDefinitionId: "done" },
  ]);
}

describe("projectEpisodeStatus", () => {
  it("buckets episodes by completeness, ignoring day-bound tasks", async () => {
    await episodeFixture();
    const [row] = await projectEpisodeStatus(alice);
    expect(row).toEqual({
      projectId: "p1",
      notStarted: 1, // E2 has no tasks
      inProgress: 1, // E1 has 2 tasks, 1 complete
      complete: 0,
      totalEpisodes: 2,
    });
  });

  it("counts an episode complete only when every task is complete", async () => {
    await episodeFixture();
    await ProductionTask.updateOne({ _id: "t2" }, { $set: { taskStatusDefinitionId: "done" } });
    const [row] = await projectEpisodeStatus(alice);
    expect([row.notStarted, row.inProgress, row.complete]).toEqual([1, 0, 1]);
  });

  it("treats an episode whose tasks are all incomplete as not started", async () => {
    // Postgres: FILTER (WHERE total_tasks = 0 OR complete_tasks = 0)
    await episodeFixture();
    await ProductionTask.updateOne({ _id: "t1" }, { $set: { taskStatusDefinitionId: "wip" } });
    const [row] = await projectEpisodeStatus(alice);
    expect([row.notStarted, row.inProgress, row.complete]).toEqual([2, 0, 0]);
  });

  it("returns a row per project", async () => {
    await episodeFixture();
    await Episode.create({ _id: "e9", projectId: "p2", episodeName: "Other" });
    const rows = await projectEpisodeStatus(alice);
    expect(rows.map((r) => r.projectId).sort()).toEqual(["p1", "p2"]);
  });

  it("can be scoped to one project", async () => {
    await episodeFixture();
    await Episode.create({ _id: "e9", projectId: "p2", episodeName: "Other" });
    const rows = await projectEpisodeStatus(alice, "p1");
    expect(rows).toHaveLength(1);
    expect(rows[0].projectId).toBe("p1");
  });

  it("returns nothing when a project has no episodes", async () => {
    expect(await projectEpisodeStatus(alice, "p-empty")).toEqual([]);
  });
});

describe("projectCommitDays", () => {
  it("counts completed todos per project per day", async () => {
    await episodeFixture();
    const at = new Date("2026-03-10T06:00:00Z");
    await Todo.create([
      { title: "A", profileId: "alice", episodeId: "e1", completedAt: at },
      { title: "B", profileId: "alice", sceneId: "s1", completedAt: at },
      { title: "C", profileId: "alice", sceneId: "s1" }, // not completed
    ]);
    const rows = await projectCommitDays(alice);
    expect(rows).toEqual([{ projectId: "p1", commitDay: "2026-03-10", commitCount: 2 }]);
  });

  /**
   * The view uses `completed_at AT TIME ZONE 'Asia/Kolkata'`, so the day
   * boundary is IST (+05:30), not UTC. 18:45 UTC is already past midnight in
   * Kolkata and belongs to the NEXT day.
   */
  it("uses the Asia/Kolkata day boundary, not UTC", async () => {
    await episodeFixture();
    await Todo.create({
      title: "Late",
      profileId: "alice",
      episodeId: "e1",
      completedAt: new Date("2026-03-10T18:45:00Z"), // 2026-03-11 00:15 IST
    });
    const rows = await projectCommitDays(alice);
    expect(rows[0].commitDay).toBe("2026-03-11");
  });

  it("resolves the project through a scene when the todo has no episode", async () => {
    await episodeFixture();
    await Todo.create({
      title: "ViaScene",
      profileId: "alice",
      sceneId: "s2", // s2 -> e2 -> p1
      completedAt: new Date("2026-03-10T06:00:00Z"),
    });
    const rows = await projectCommitDays(alice);
    expect(rows).toEqual([{ projectId: "p1", commitDay: "2026-03-10", commitCount: 1 }]);
  });

  it("drops todos whose project cannot be resolved", async () => {
    // Postgres: WHERE project_id IS NOT NULL
    await Todo.create({
      title: "Orphan",
      profileId: "alice",
      sceneId: "unknown-scene",
      completedAt: new Date("2026-03-10T06:00:00Z"),
    });
    expect(await projectCommitDays(alice)).toEqual([]);
  });
});

describe("projectAssetStats", () => {
  /**
   * Assets reach a project by three routes, UNIONed and de-duplicated:
   *   direct project link · job link -> episode · scene link -> scene -> episode
   * a1 arrives by two of them and must still count once.
   */
  async function assetFixture() {
    await episodeFixture();
    await Asset.create([
      { _id: "a1", assetCode: "A1", assetName: "One", assetType: "Prop" },
      { _id: "a2", assetCode: "A2", assetName: "Two", assetType: "Prop" },
      { _id: "a3", assetCode: "A3", assetName: "Three", assetType: "Prop" },
    ]);
    await AssetProjectLink.create({ assetId: "a1", projectId: "p1" });
    await AssetJobLink.create([
      { assetId: "a1", episodeId: "e1" }, // duplicate route for a1
      { assetId: "a2", episodeId: "e1" },
    ]);
    await AssetSceneLink.create({ assetId: "a3", sceneId: "s1" });
    await AssetFile.create([
      {
        assetId: "a1",
        fileUrl: "u",
        fileName: "f1",
        fileFormat: "png",
        recordStatus: "Active",
        fileSizeBytes: 100,
      },
      {
        assetId: "a1",
        fileUrl: "u",
        fileName: "f2",
        fileFormat: "png",
        recordStatus: "Active",
        fileSizeBytes: 200,
      },
      {
        assetId: "a1",
        fileUrl: "u",
        fileName: "f3",
        fileFormat: "png",
        recordStatus: "Trashed",
        fileSizeBytes: 999,
      },
    ]);
  }

  it("counts distinct assets across all three link routes", async () => {
    await assetFixture();
    const [row] = await projectAssetStats(alice);
    expect(row.projectId).toBe("p1");
    expect(row.assetCount).toBe(3); // a1 counted once despite two routes
  });

  it("counts only Active files and sums their bytes", async () => {
    await assetFixture();
    const [row] = await projectAssetStats(alice);
    expect(row.fileCount).toBe(2);
    expect(row.totalBytes).toBe(300); // the Trashed 999 is excluded
  });

  it("reports zero bytes for a project whose assets have no files", async () => {
    await episodeFixture();
    await Asset.create({ _id: "a9", assetCode: "A9", assetName: "Nine", assetType: "Prop" });
    await AssetProjectLink.create({ assetId: "a9", projectId: "p1" });
    const [row] = await projectAssetStats(alice);
    expect(row).toEqual({ projectId: "p1", assetCount: 1, fileCount: 0, totalBytes: 0 });
  });

  it("can be scoped to one project", async () => {
    await assetFixture();
    await AssetProjectLink.create({ assetId: "a2", projectId: "p2" });
    expect(await projectAssetStats(alice, "p2")).toHaveLength(1);
  });

  it("returns nothing when a project has no assets", async () => {
    expect(await projectAssetStats(alice, "p-empty")).toEqual([]);
  });
});
