import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  DayV2,
  MainTaskV2,
  CustomTaskV2,
  AssetV2,
  AssetTaskV2,
  ProjectBoardStats,
  ProcessProgress,
  TaskStatusOption,
  SceneBoardTask,
  AssignableUser,
} from "@/types/production-v2";
import { parseBoardLayout } from "@/types/production-v2";

// ---------------------------------------------------------------------------
// Error Formatting Helpers
// ---------------------------------------------------------------------------

function formatPostgrestError(
  context: string,
  error: { code?: string; message: string; details?: string | null; hint?: string | null }
): Error {
  return new Error(
    `${context} failed [${error.code ?? "UNKNOWN"}]: ${error.message}` +
      (error.details ? ` | details: ${error.details}` : "") +
      (error.hint ? ` | hint: ${error.hint}` : "")
  );
}

export function serializeRepositoryError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null
    ? JSON.stringify(error)
    : String(error);
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapProjectV2(row: Tables<"projects">): ProjectV2 {
  return {
    id: row.id,
    title: row.title,
    projectCode: row.project_code,
    assetCodePrefix: row.asset_code_prefix ?? null,
    defaultAssetWorkflowId: row.default_asset_workflow_id ?? null,
    description: row.description ?? "",
    thumbnailUrl: row.thumbnail_url ?? "",
    status: (row.status === "Retired" ? "Retired" : "Active") as "Active" | "Retired",
    isSystem: Boolean(row.is_system),
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    boardLayout: parseBoardLayout(row.board_layout),
    createdAt: row.created_at,
  };
}

function mapEpisodeV2(row: Tables<"episodes">): EpisodeV2 {
  return {
    id: row.id,
    projectId: row.project_id,
    episodeName: row.episode_name,
    code: row.code ?? "",
    description: row.description ?? "",
    previewImage: row.preview_image ?? "",
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    sortOrder: row.sort_order ?? null,
    jobWorkflow: row.job_workflow ?? null,
    sceneWorkflow: row.scene_workflow ?? null,
    status: (row.status === "Retired" ? "Retired" : "Active") as "Active" | "Retired",
    createdAt: row.created_at,
  };
}

function mapSceneV2(row: Tables<"scenes">): SceneV2 {
  return {
    id: row.id,
    episodeId: row.episode_id,
    sceneName: row.scene_name,
    description: row.description ?? "",
    previewImage: row.preview_image ?? "",
    sortOrder: row.sort_order ?? null,
    status: (row.status === "Retired" ? "Retired" : "Active") as "Active" | "Retired",
    numberOfFrames: row.number_of_frames,
    priority: row.priority,
    createdAt: row.created_at,
  };
}

function mapDayV2(row: Tables<"days">): DayV2 {
  return {
    id: row.id,
    episodeId: row.episode_id,
    dayDate: row.day_date,
    title: row.title ?? null,
    description: row.description ?? null,
    sortOrder: row.sort_order ?? null,
    createdAt: row.created_at,
  };
}

function mapMainTaskV2(row: Tables<"production_tasks">): MainTaskV2 {
  return {
    id: row.id,
    episodeId: row.episode_id ?? null,
    sceneId: row.scene_id ?? null,
    name: row.name,
    progress: row.progress,
    status: row.status,
    assignee: row.assignee ?? null,
    sortOrder: row.sort_order ?? null,
    sourceWorkflowProcessId: row.source_workflow_process_id ?? null,
    taskStatusDefinitionId: row.task_status_definition_id ?? null,
    taskStatusWorkflowId: row.task_status_workflow_id ?? null,
    createdAt: row.created_at,
  };
}

function mapCustomTaskV2(row: Tables<"production_tasks">): CustomTaskV2 {
  return {
    id: row.id,
    dayId: row.day_id!,
    name: row.name,
    progress: row.progress,
    status: row.status,
    sortOrder: row.sort_order ?? null,
    contributesToTaskId: row.contributes_to_task_id ?? null,
    branchesFromTaskId: row.branches_from_task_id ?? null,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Reads (Server Only)
// ---------------------------------------------------------------------------

export async function getProjectsV2(): Promise<ProjectV2[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw formatPostgrestError("getProjectsV2", error);
  }

  const mapped = (data || []).map(mapProjectV2);
  const unknownSys = mapped.filter((p) => p.isSystem);
  const regularProjects = mapped.filter((p) => !p.isSystem);

  return [...unknownSys, ...regularProjects];
}

export async function getEpisodesByProject(projectId: string): Promise<EpisodeV2[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("episode_name", { ascending: true });

  if (error) {
    throw formatPostgrestError("getEpisodesByProject", error);
  }

  return (data || []).map(mapEpisodeV2);
}

export async function getScenesByEpisode(episodeId: string): Promise<SceneV2[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("episode_id", episodeId)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("scene_name", { ascending: true });

  if (error) {
    throw formatPostgrestError("getScenesByEpisode", error);
  }

  return (data || []).map(mapSceneV2);
}

export async function getDaysByEpisode(episodeId: string): Promise<DayV2[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("days")
    .select("*")
    .eq("episode_id", episodeId)
    .order("day_date", { ascending: true })
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) {
    throw formatPostgrestError("getDaysByEpisode", error);
  }

  return (data || []).map(mapDayV2);
}

export async function getMainTasksForEpisode(episodeId: string): Promise<MainTaskV2[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_tasks")
    .select("*")
    .eq("episode_id", episodeId)
    .is("day_id", null);

  if (error) {
    throw formatPostgrestError("getMainTasksForEpisode", error);
  }

  return (data || []).map(mapMainTaskV2);
}

export async function getMainTasksForScene(sceneId: string): Promise<MainTaskV2[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_tasks")
    .select("*")
    .eq("scene_id", sceneId)
    .is("day_id", null);

  if (error) {
    throw formatPostgrestError("getMainTasksForScene", error);
  }

  return (data || []).map(mapMainTaskV2);
}

export async function getCustomTasksByDay(dayId: string): Promise<CustomTaskV2[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_tasks")
    .select("*")
    .eq("day_id", dayId);

  if (error) {
    throw formatPostgrestError("getCustomTasksByDay", error);
  }

  return (data || []).map(mapCustomTaskV2);
}

export async function getProjectV2(id: string): Promise<ProjectV2 | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw formatPostgrestError("getProjectV2", error);
  }

  return data ? mapProjectV2(data) : null;
}

export async function getSceneV2(id: string): Promise<SceneV2 | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw formatPostgrestError("getSceneV2", error);
  }

  return data ? mapSceneV2(data) : null;
}

export async function getDaysWithTasks(
  episodeId: string
): Promise<Array<DayV2 & { tasks: CustomTaskV2[] }>> {
  const supabase = await createClient();
  const days = await getDaysByEpisode(episodeId);
  if (days.length === 0) return [];

  const dayIds = days.map((d) => d.id);
  const { data: tasksData, error: tasksError } = await supabase
    .from("production_tasks")
    .select("*")
    .in("day_id", dayIds);

  if (tasksError) {
    throw formatPostgrestError("getDaysWithTasks", tasksError);
  }

  const tasksMapped = (tasksData || []).map(mapCustomTaskV2);

  return days.map((day) => ({
    ...day,
    tasks: tasksMapped.filter((t) => t.dayId === day.id),
  }));
}

// ---------------------------------------------------------------------------
// Assets V2 Reads
// ---------------------------------------------------------------------------

export async function getAssetsByProject(projectId: string): Promise<AssetV2[]> {
  const supabase = await createClient();
  const { data: linkRows, error: linkError } = await supabase
    .from("asset_project_links")
    .select("asset_id")
    .eq("project_id", projectId);

  if (linkError) {
    throw formatPostgrestError("getAssetsByProject (project links)", linkError);
  }
  const assetIds = (linkRows || []).map((l) => l.asset_id);
  if (assetIds.length === 0) return [];

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .in("id", assetIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw formatPostgrestError("getAssetsByProject (assets)", error);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.asset_name,
    assetCode: row.asset_code ?? null,
    category: row.asset_type ?? null,
    priority: String(row.priority ?? "Medium"),
    projectId: projectId,
    episodeId: null,
    previewUrl: row.preview_url ?? null,
    description: row.description ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getAssetsByEpisode(episodeId: string): Promise<AssetV2[]> {
  const supabase = await createClient();
  const { data: linkRows, error: linkError } = await supabase
    .from("asset_job_links")
    .select("asset_id")
    .eq("episode_id", episodeId);

  if (linkError) {
    throw formatPostgrestError("getAssetsByEpisode (job links)", linkError);
  }
  const assetIds = (linkRows || []).map((l) => l.asset_id);
  if (assetIds.length === 0) return [];

  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .in("id", assetIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw formatPostgrestError("getAssetsByEpisode (assets)", error);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.asset_name,
    assetCode: row.asset_code ?? null,
    category: row.asset_type ?? null,
    priority: String(row.priority ?? "Medium"),
    projectId: null,
    episodeId: episodeId,
    previewUrl: row.preview_url ?? null,
    description: row.description ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getAssetTasks(
  assetIds: string[]
): Promise<Record<string, AssetTaskV2[]>> {
  if (assetIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asset_tasks")
    .select("*")
    .in("asset_id", assetIds)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) {
    throw formatPostgrestError("getAssetTasks", error);
  }

  const result: Record<string, AssetTaskV2[]> = {};
  (data || []).forEach((row) => {
    const task: AssetTaskV2 = {
      id: row.id,
      assetId: row.asset_id,
      taskName: row.name,
      status: row.status,
      assignee: row.assignee ?? null,
      sortOrder: row.sort_order ?? null,
      createdAt: row.created_at,
    };
    if (!result[row.asset_id]) {
      result[row.asset_id] = [];
    }
    result[row.asset_id].push(task);
  });

  return result;
}

export async function getWorkflowTaskStatuses(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workflow_task_statuses")
      .select("name")
      .order("position", { ascending: true, nullsFirst: false });

    if (error) {
      console.warn(
        `getWorkflowTaskStatuses failed [${error.code}]: ${error.message}` +
          (error.details ? ` | details: ${error.details}` : "") +
          (error.hint ? ` | hint: ${error.hint}` : "")
      );
      return ["Not Started", "In Progress", "In Review", "Done"];
    }
    const statuses = (data || []).map((row) => row.name);
    return statuses.length > 0
      ? statuses
      : ["Not Started", "In Progress", "In Review", "Done"];
  } catch (error: unknown) {
    const message = serializeRepositoryError(error);
    console.warn("Failed to fetch workflow task statuses, falling back to defaults:", message);
    return ["Not Started", "In Progress", "In Review", "Done"];
  }
}

export async function createSceneV2(input: {
  episodeId: string;
  sceneName: string;
  description?: string;
  previewImage?: string;
  numberOfFrames?: number;
  priority?: number;
  workflowId?: string;
}): Promise<SceneV2> {
  const supabase = await createClient();

  const { data: maxRows, error: maxError } = await supabase
    .from("scenes")
    .select("sort_order")
    .eq("episode_id", input.episodeId)
    .order("sort_order", { ascending: false, nullsFirst: false })
    .limit(1);

  if (maxError) {
    throw formatPostgrestError("createSceneV2 (max sort_order lookup)", maxError);
  }

  const maxSortOrder =
    maxRows && maxRows.length > 0 && maxRows[0].sort_order !== null
      ? maxRows[0].sort_order
      : 0;

  const nextSortOrder = maxSortOrder + 1;

  const { data, error } = await supabase
    .from("scenes")
    .insert({
      episode_id: input.episodeId,
      scene_name: input.sceneName,
      description: input.description || null,
      preview_image: input.previewImage || null,
      number_of_frames: input.numberOfFrames ?? 0,
      priority: input.priority ?? 1,
      sort_order: nextSortOrder,
      status: "Active",
      workflow: input.workflowId || null,
    })
    .select("*")
    .single();

  if (error) {
    throw formatPostgrestError("createSceneV2 (scene insert)", error);
  }

  if (!data) {
    throw new Error("createSceneV2 failed: No data returned from scene insertion.");
  }

  const createdScene = mapSceneV2(data);

  if (input.workflowId) {
    const { error: rpcError } = await supabase.rpc("generate_workflow_tasks", {
      p_entity_type: "scene",
      p_entity_id: createdScene.id,
      p_workflow_id: input.workflowId,
    });

    if (rpcError) {
      throw formatPostgrestError("createSceneV2 (generate_workflow_tasks RPC)", rpcError);
    }
  }

  return createdScene;
}

export async function getSceneWorkflows(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflows")
    .select("id, name")
    .eq("workflow_type", "scene")
    .eq("status", "active")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw formatPostgrestError("getSceneWorkflows", error);
  }

  return (data || []).map((row) => ({ id: row.id, name: row.name }));
}

/**
 * Workflows an Episode can be built from. generate_workflow_tasks enforces
 * workflow_type = p_entity_type, so only 'job' workflows are valid for the
 * "job" entity type it uses for episodes.
 */
export async function getJobWorkflows(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflows")
    .select("id, name")
    .eq("workflow_type", "job")
    .eq("status", "active")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw formatPostgrestError("getJobWorkflows", error);
  }

  return (data || []).map((row) => ({ id: row.id, name: row.name }));
}

export async function getActiveAssetWorkflows(): Promise<
  Array<{ id: string; name: string; workflowCode: string }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflows")
    .select("id, name, workflow_code")
    .eq("workflow_type", "asset")
    .eq("status", "active")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw formatPostgrestError("getActiveAssetWorkflows", error);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    workflowCode: row.workflow_code,
  }));
}



// ---------------------------------------------------------------------------
// Project Board stats (migration 037 views)
// ---------------------------------------------------------------------------

/**
 * Formats a Date as YYYY-MM-DD in IST.
 *
 * project_commit_days buckets on `(completed_at at time zone 'Asia/Kolkata')`,
 * so the cutoff must be computed in the same zone. en-CA yields YYYY-MM-DD.
 */
function istDateString(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * One query per view for every project — never per project. Results are keyed
 * by project_id, and any project present in one view but missing from another
 * still gets a fully zeroed slice for the missing one.
 *
 * A project absent from all three views has no key here; callers should fall
 * back to EMPTY_PROJECT_BOARD_STATS.
 */
export async function getProjectBoardStats(): Promise<Record<string, ProjectBoardStats>> {
  const supabase = await createClient();

  // 365 days inclusive of today.
  const cutoff = istDateString(new Date(Date.now() - 364 * 24 * 60 * 60 * 1000));

  const [statusRes, commitRes, assetRes] = await Promise.all([
    supabase
      .from("project_episode_status")
      .select("project_id, not_started, in_progress, complete, total_episodes"),
    supabase
      .from("project_commit_days")
      .select("project_id, commit_day, commit_count")
      .gte("commit_day", cutoff)
      .order("commit_day", { ascending: true }),
    supabase
      .from("project_asset_stats")
      .select("project_id, asset_count, file_count, total_bytes"),
  ]);

  if (statusRes.error) {
    throw formatPostgrestError("getProjectBoardStats (episode status)", statusRes.error);
  }
  if (commitRes.error) {
    throw formatPostgrestError("getProjectBoardStats (commit days)", commitRes.error);
  }
  if (assetRes.error) {
    throw formatPostgrestError("getProjectBoardStats (asset stats)", assetRes.error);
  }

  const byProject: Record<string, ProjectBoardStats> = {};

  const ensure = (projectId: string): ProjectBoardStats => {
    let entry = byProject[projectId];
    if (!entry) {
      entry = {
        episodeStatus: { notStarted: 0, inProgress: 0, complete: 0, total: 0 },
        commitDays: [],
        assets: { assetCount: 0, fileCount: 0, totalBytes: 0 },
      };
      byProject[projectId] = entry;
    }
    return entry;
  };

  for (const row of statusRes.data || []) {
    if (!row.project_id) continue;
    const entry = ensure(row.project_id);
    entry.episodeStatus = {
      notStarted: row.not_started ?? 0,
      inProgress: row.in_progress ?? 0,
      complete: row.complete ?? 0,
      total: row.total_episodes ?? 0,
    };
  }

  for (const row of commitRes.data || []) {
    if (!row.project_id || !row.commit_day) continue;
    ensure(row.project_id).commitDays.push({
      day: row.commit_day,
      count: row.commit_count ?? 0,
    });
  }

  for (const row of assetRes.data || []) {
    if (!row.project_id) continue;
    const entry = ensure(row.project_id);
    entry.assets = {
      assetCount: row.asset_count ?? 0,
      fileCount: row.file_count ?? 0,
      totalBytes: row.total_bytes ?? 0,
    };
  }

  return byProject;
}

// ---------------------------------------------------------------------------
// Episode process rollup
// ---------------------------------------------------------------------------

/**
 * Per-process scene completion for every episode passed in.
 *
 * Two queries in total however many episodes are asked for — never one per
 * episode. Scenes are fetched separately because the denominator is ALL scenes
 * in the episode, including scenes carrying no task for the process at all;
 * those scenes never appear in the task query but must still count against the
 * percentage. That is the point of the measure.
 *
 * Completion is read from workflow_task_statuses.completion_percentage = 100,
 * matching migration 037's views. production_tasks.status lost its CHECK in 023
 * and production_tasks.progress is not authoritative, so neither is consulted.
 *
 * day_id IS NULL restricts this to Main Tasks, excluding Custom Tasks (029).
 *
 * Every requested episode gets a key. An episode with no scenes — or with
 * scenes but no tasks — gets an empty array, so callers never need a fallback.
 */
export async function getEpisodeProcessProgress(
  episodeIds: string[]
): Promise<Record<string, ProcessProgress[]>> {
  if (episodeIds.length === 0) return {};

  const supabase = await createClient();

  const [sceneRes, taskRes] = await Promise.all([
    supabase.from("scenes").select("id, episode_id").in("episode_id", episodeIds),
    supabase
      .from("production_tasks")
      // One string literal, deliberately long: supabase-js infers the row shape
      // from the literal type of this argument, and concatenating it collapses
      // the inference to GenericStringError.
      .select(
        "scene_id, scenes!inner(episode_id), workflow_processes!inner(id, name, colour, position), workflow_task_statuses(completion_percentage)"
      )
      .in("scenes.episode_id", episodeIds)
      .is("day_id", null),
  ]);

  if (sceneRes.error) {
    throw formatPostgrestError("getEpisodeProcessProgress (scenes)", sceneRes.error);
  }
  if (taskRes.error) {
    throw formatPostgrestError("getEpisodeProcessProgress (tasks)", taskRes.error);
  }

  const totalScenesByEpisode: Record<string, number> = {};
  for (const row of sceneRes.data || []) {
    totalScenesByEpisode[row.episode_id] =
      (totalScenesByEpisode[row.episode_id] ?? 0) + 1;
  }

  /**
   * Completed scenes are collected as a Set rather than a counter: a scene
   * carrying two tasks for the same process would otherwise be counted twice
   * and could push the percentage past 100.
   */
  type ProcessAccumulator = {
    processId: string;
    processName: string;
    colour: string | null;
    position: number;
    completeSceneIds: Set<string>;
  };

  const byEpisode = new Map<string, Map<string, ProcessAccumulator>>();

  for (const row of taskRes.data || []) {
    const sceneId = row.scene_id;
    const episodeId = row.scenes?.episode_id;
    const process = row.workflow_processes;
    if (!sceneId || !episodeId || !process) continue;

    let processes = byEpisode.get(episodeId);
    if (!processes) {
      processes = new Map<string, ProcessAccumulator>();
      byEpisode.set(episodeId, processes);
    }

    let entry = processes.get(process.id);
    if (!entry) {
      entry = {
        processId: process.id,
        processName: process.name,
        colour: process.colour ?? null,
        position: process.position,
        completeSceneIds: new Set<string>(),
      };
      processes.set(process.id, entry);
    }

    if (row.workflow_task_statuses?.completion_percentage === 100) {
      entry.completeSceneIds.add(sceneId);
    }
  }

  const result: Record<string, ProcessProgress[]> = {};
  for (const episodeId of episodeIds) {
    result[episodeId] = [];
  }

  for (const [episodeId, processes] of byEpisode) {
    const totalScenes = totalScenesByEpisode[episodeId] ?? 0;

    result[episodeId] = Array.from(processes.values())
      // Two workflows both number their processes from 1, so position
      // alone leaves ties, and the task query has no ORDER BY to fall back
      // on. Name breaks the tie so card order is stable across requests.
      .sort((a, b) =>
        a.position !== b.position
          ? a.position - b.position
          : a.processName.localeCompare(b.processName)
      )
      .map((entry) => {
        const completeScenes = entry.completeSceneIds.size;
        return {
          processId: entry.processId,
          processName: entry.processName,
          colour: entry.colour,
          position: entry.position,
          completeScenes,
          totalScenes,
          percent:
            totalScenes === 0
              ? 0
              : Math.round((completeScenes / totalScenes) * 100),
        };
      });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Scene board: tasks, status options, assignable users
// ---------------------------------------------------------------------------

/**
 * Main Tasks for every scene passed in, each carrying the workflow process it
 * was generated from so the board card can draw its colour strip and badge.
 *
 * One query for all scenes, never one per scene. Keyed by scene id, with an
 * entry for every scene asked for so callers need no fallback.
 */
export async function getSceneBoardTasks(
  sceneIds: string[]
): Promise<Record<string, SceneBoardTask[]>> {
  if (sceneIds.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_tasks")
    // One unbroken string literal: supabase-js infers the embedded row shape
    // from this argument's literal type, and concatenating it collapses the
    // inference to GenericStringError.
    .select(
      "id, episode_id, scene_id, name, progress, status, assignee, sort_order, source_workflow_process_id, task_status_definition_id, task_status_workflow_id, created_at, workflow_processes(name, colour, position)"
    )
    .in("scene_id", sceneIds)
    .is("day_id", null);

  if (error) {
    throw formatPostgrestError("getSceneBoardTasks", error);
  }

  const result: Record<string, SceneBoardTask[]> = {};
  for (const sceneId of sceneIds) {
    result[sceneId] = [];
  }

  for (const row of data || []) {
    const sceneId = row.scene_id;
    if (!sceneId || !result[sceneId]) continue;

    const process = row.workflow_processes;

    result[sceneId].push({
      id: row.id,
      episodeId: row.episode_id ?? null,
      sceneId,
      name: row.name,
      progress: row.progress,
      status: row.status,
      assignee: row.assignee ?? null,
      sortOrder: row.sort_order ?? null,
      sourceWorkflowProcessId: row.source_workflow_process_id ?? null,
      taskStatusDefinitionId: row.task_status_definition_id ?? null,
      taskStatusWorkflowId: row.task_status_workflow_id ?? null,
      createdAt: row.created_at,
      processName: process?.name ?? null,
      processColour: process?.colour ?? null,
      processPosition: process?.position ?? null,
    });
  }

  /*
    Ordered by the process position the card's badge shows, so the cards read
    in workflow order. Tasks with no process sort last, then by name, because
    the query itself has no ORDER BY to fall back on.
  */
  for (const sceneId of Object.keys(result)) {
    result[sceneId].sort((a, b) => {
      const ap = a.processPosition;
      const bp = b.processPosition;
      if (ap === null && bp === null) return a.name.localeCompare(b.name);
      if (ap === null) return 1;
      if (bp === null) return -1;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });
  }

  return result;
}

/**
 * The statuses each of these workflows defines, keyed by workflow id.
 *
 * Batched deliberately: a scene's tasks can come from more than one status
 * workflow, and the board must not issue a query per task.
 */
export async function getTaskStatusOptionsByWorkflow(
  workflowIds: string[]
): Promise<Record<string, TaskStatusOption[]>> {
  const unique = Array.from(new Set(workflowIds));
  if (unique.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workflow_task_statuses")
    .select("id, workflow_id, name, colour, completion_percentage")
    .in("workflow_id", unique)
    .eq("status", "active")
    .order("position", { ascending: true });

  if (error) {
    throw formatPostgrestError("getTaskStatusOptionsByWorkflow", error);
  }

  const result: Record<string, TaskStatusOption[]> = {};
  for (const workflowId of unique) {
    result[workflowId] = [];
  }

  for (const row of data || []) {
    const bucket = result[row.workflow_id];
    if (!bucket) continue;
    bucket.push({
      id: row.id,
      name: row.name,
      colour: row.colour,
      completionPercentage: row.completion_percentage,
    });
  }

  return result;
}

/**
 * The statuses one workflow defines, in position order.
 *
 * Unlike getWorkflowTaskStatuses — which returns bare names across every
 * workflow and is kept for its existing asset-page callers — this is scoped to
 * a single workflow and carries the ids a status write needs.
 */
export async function getTaskStatusOptions(
  taskStatusWorkflowId: string
): Promise<TaskStatusOption[]> {
  const byWorkflow = await getTaskStatusOptionsByWorkflow([taskStatusWorkflowId]);
  return byWorkflow[taskStatusWorkflowId] ?? [];
}

/**
 * Profiles that may be put in production_tasks.assignee.
 *
 * account_status is lowercase: migration 013 created it as 'Active' with a
 * CHECK, and migration 021 lowercased both the data and the constraint to
 * ('active','suspended','disabled'). Every other caller in the app compares
 * against "active", so this does too.
 */
export async function getAssignableUsers(): Promise<AssignableUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("account_status", "active")
    .order("display_name", { ascending: true, nullsFirst: false })
    .order("username", { ascending: true });

  if (error) {
    throw formatPostgrestError("getAssignableUsers", error);
  }

  return (data || []).map((row) => ({
    id: row.id,
    displayName: row.display_name ?? row.username,
  }));
}
