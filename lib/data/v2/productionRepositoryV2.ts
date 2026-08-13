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
} from "@/types/production-v2";

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


