import { Episode } from "@/lib/models/Episode";
import { Todo } from "@/lib/models/Todo";
import { AssetProjectLink } from "@/lib/models/AssetProjectLink";
import { requireActiveUser, type Actor } from "@/lib/permissions";

/**
 * The three Postgres reporting views, as aggregation pipelines.
 *
 * Each is a faithful port of its `pg_get_viewdef` output, including the
 * details that are easy to lose: day-bound tasks are excluded from episode
 * status, the commit day boundary is **Asia/Kolkata** rather than UTC, and
 * asset counts de-duplicate across three different link routes.
 *
 * The views took no parameters and returned every project; these accept an
 * optional projectId so a page can ask for one without filtering in JS.
 */

export type ProjectEpisodeStatusRow = {
  projectId: string;
  notStarted: number;
  inProgress: number;
  complete: number;
  totalEpisodes: number;
};

export type ProjectCommitDayRow = {
  projectId: string;
  commitDay: string;
  commitCount: number;
};

export type ProjectAssetStatsRow = {
  projectId: string;
  assetCount: number;
  fileCount: number;
  totalBytes: number;
};

/**
 * Port of `project_episode_status`.
 *
 * Buckets each episode as not-started / in-progress / complete by counting its
 * scenes' tasks, then rolls the buckets up per project. A task counts only
 * when it has **no day** (the view joins `ON pt.day_id IS NULL`), and counts as
 * complete when its task status has `completion_percentage = 100`.
 */
export async function projectEpisodeStatus(
  actor: Actor,
  projectId?: string
): Promise<ProjectEpisodeStatusRow[]> {
  requireActiveUser(actor);

  return Episode.aggregate<ProjectEpisodeStatusRow>([
    ...(projectId ? [{ $match: { projectId } }] : []),
    {
      $lookup: {
        from: "scenes",
        localField: "_id",
        foreignField: "episodeId",
        as: "scenes",
      },
    },
    {
      $lookup: {
        from: "production_tasks",
        let: { sceneIds: "$scenes._id" },
        pipeline: [
          // dayId: null matches both an explicit null and a missing field,
          // which is what `day_id IS NULL` meant.
          { $match: { $expr: { $in: ["$sceneId", "$$sceneIds"] }, dayId: null } },
          {
            $lookup: {
              from: "workflow_task_statuses",
              localField: "taskStatusDefinitionId",
              foreignField: "_id",
              as: "status",
            },
          },
          {
            $project: {
              isComplete: {
                $anyElementTrue: {
                  $map: {
                    input: "$status",
                    as: "s",
                    in: { $eq: ["$$s.completionPercentage", 100] },
                  },
                },
              },
            },
          },
        ],
        as: "tasks",
      },
    },
    {
      $project: {
        projectId: 1,
        totalTasks: { $size: "$tasks" },
        completeTasks: {
          $size: { $filter: { input: "$tasks", cond: "$$this.isComplete" } },
        },
      },
    },
    {
      $group: {
        _id: "$projectId",
        notStarted: {
          $sum: {
            $cond: [
              {
                $or: [{ $eq: ["$totalTasks", 0] }, { $eq: ["$completeTasks", 0] }],
              },
              1,
              0,
            ],
          },
        },
        inProgress: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$totalTasks", 0] },
                  { $gt: ["$completeTasks", 0] },
                  { $lt: ["$completeTasks", "$totalTasks"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        complete: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$totalTasks", 0] },
                  { $eq: ["$completeTasks", "$totalTasks"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalEpisodes: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        projectId: "$_id",
        notStarted: 1,
        inProgress: 1,
        complete: 1,
        totalEpisodes: 1,
      },
    },
    { $sort: { projectId: 1 } },
  ]).exec();
}

/**
 * Port of `project_commit_days`.
 *
 * Counts completed todos per project per calendar day, where the project is
 * reached either directly through the todo's episode or through its scene's
 * episode.
 *
 * **The day boundary is Asia/Kolkata**, straight from the view's
 * `AT TIME ZONE 'Asia/Kolkata'`. A todo completed at 18:45 UTC belongs to the
 * following day. Changing this silently shifts every historical figure.
 */
export const COMMIT_DAY_TIMEZONE = "Asia/Kolkata";

export async function projectCommitDays(
  actor: Actor,
  projectId?: string
): Promise<ProjectCommitDayRow[]> {
  requireActiveUser(actor);

  return Todo.aggregate<ProjectCommitDayRow>([
    { $match: { completedAt: { $ne: null } } },
    {
      $lookup: {
        from: "episodes",
        localField: "episodeId",
        foreignField: "_id",
        as: "directEpisode",
      },
    },
    { $lookup: { from: "scenes", localField: "sceneId", foreignField: "_id", as: "scene" } },
    {
      $lookup: {
        from: "episodes",
        localField: "scene.episodeId",
        foreignField: "_id",
        as: "sceneEpisode",
      },
    },
    {
      $addFields: {
        resolvedProjectId: {
          $ifNull: [
            { $first: "$directEpisode.projectId" },
            { $first: "$sceneEpisode.projectId" },
          ],
        },
      },
    },
    {
      $match: {
        resolvedProjectId: { $ne: null },
        ...(projectId ? { resolvedProjectId: projectId } : {}),
      },
    },
    {
      $group: {
        _id: {
          projectId: "$resolvedProjectId",
          commitDay: {
            $dateToString: {
              date: "$completedAt",
              format: "%Y-%m-%d",
              timezone: COMMIT_DAY_TIMEZONE,
            },
          },
        },
        commitCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        projectId: "$_id.projectId",
        commitDay: "$_id.commitDay",
        commitCount: 1,
      },
    },
    { $sort: { projectId: 1, commitDay: 1 } },
  ]).exec();
}

/**
 * Port of `project_asset_stats`.
 *
 * An asset belongs to a project by any of three routes — a direct project
 * link, a job link through its episode, or a scene link through scene and
 * episode — and the view UNIONs them, so an asset reachable twice counts once.
 * Files are counted only where `record_status = 'Active'`.
 */
export async function projectAssetStats(
  actor: Actor,
  projectId?: string
): Promise<ProjectAssetStatsRow[]> {
  requireActiveUser(actor);

  return AssetProjectLink.aggregate<ProjectAssetStatsRow>([
    { $project: { _id: 0, assetId: 1, projectId: 1 } },
    {
      $unionWith: {
        coll: "asset_job_links",
        pipeline: [
          {
            $lookup: {
              from: "episodes",
              localField: "episodeId",
              foreignField: "_id",
              as: "episode",
            },
          },
          { $unwind: "$episode" },
          { $project: { _id: 0, assetId: 1, projectId: "$episode.projectId" } },
        ],
      },
    },
    {
      $unionWith: {
        coll: "asset_scene_links",
        pipeline: [
          { $lookup: { from: "scenes", localField: "sceneId", foreignField: "_id", as: "scene" } },
          { $unwind: "$scene" },
          {
            $lookup: {
              from: "episodes",
              localField: "scene.episodeId",
              foreignField: "_id",
              as: "episode",
            },
          },
          { $unwind: "$episode" },
          { $project: { _id: 0, assetId: 1, projectId: "$episode.projectId" } },
        ],
      },
    },
    // The UNION (not UNION ALL) de-duplicates (asset, project) pairs.
    { $group: { _id: { assetId: "$assetId", projectId: "$projectId" } } },
    ...(projectId ? [{ $match: { "_id.projectId": projectId } }] : []),
    {
      $lookup: {
        from: "asset_files",
        let: { assetId: "$_id.assetId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$assetId", "$$assetId"] }, recordStatus: "Active" } },
          { $project: { fileSizeBytes: 1 } },
        ],
        as: "files",
      },
    },
    {
      $group: {
        _id: "$_id.projectId",
        assetCount: { $sum: 1 },
        fileCount: { $sum: { $size: "$files" } },
        totalBytes: { $sum: { $sum: "$files.fileSizeBytes" } },
      },
    },
    {
      $project: {
        _id: 0,
        projectId: "$_id",
        assetCount: 1,
        fileCount: 1,
        totalBytes: 1,
      },
    },
    { $sort: { projectId: 1 } },
  ]).exec();
}
