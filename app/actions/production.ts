"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/types/supabase";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  DayV2,
  MainTaskV2,
  CustomTaskV2,
  AssetV2,
  ProjectBoardStats,
  ProcessProgress,
  BoardLayout,
} from "@/types/production-v2";
import { parseBoardLayout, GRAPH_IDS } from "@/types/production-v2";
import {
  getProjectsV2 as repoGetProjectsV2,
  getProjectBoardStats as repoGetProjectBoardStats,
  createSceneV2 as repoCreateSceneV2,
  getSceneWorkflows as repoGetSceneWorkflows,
  getJobWorkflows as repoGetJobWorkflows,
  getEpisodeProcessProgress as repoGetEpisodeProcessProgress,
} from "@/lib/data/v2/productionRepositoryV2";

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

function mapProjectV2(row: Tables<"projects">): ProjectV2 {
  return {
    id: row.id,
    title: row.title,
    projectCode: row.project_code,
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

export async function createProjectV2(input: {
  title: string;
  projectCode: string;
  description?: string;
  startDate: string;
  endDate?: string;
  thumbnailUrl?: string;
  assetCodePrefix?: string | null;
  defaultAssetWorkflowId?: string | null;
}): Promise<ProjectV2> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: input.title,
      project_code: input.projectCode,
      description: input.description ?? null,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      asset_code_prefix: input.assetCodePrefix ?? null,
      default_asset_workflow_id: input.defaultAssetWorkflowId ?? null,
      status: "Active",
    })
    .select("*")
    .single();

  if (error) {
    throw formatPostgrestError("createProjectV2", error);
  }

  if (!data) {
    throw new Error("createProjectV2 failed: No data returned from project creation.");
  }

  revalidatePath("/projects");
  revalidatePath("/assets/manage");
  return mapProjectV2(data);
}

export async function deleteProjectV2(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    throw formatPostgrestError("deleteProjectV2", error);
  }

  revalidatePath("/projects");
  revalidatePath("/assets/manage");
}

export async function updateProjectV2(
  id: string,
  updates: {
    title?: string;
    projectCode?: string;
    description?: string;
    thumbnailUrl?: string;
    startDate?: string;
    endDate?: string;
    status?: "Active" | "Retired";
    assetCodePrefix?: string | null;
    defaultAssetWorkflowId?: string | null;
  }
): Promise<ProjectV2> {
  const supabase = await createClient();

  // Only keys the caller actually supplied are written, so a partial update
  // never nulls an untouched column.
  const payload: TablesUpdate<"projects"> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.projectCode !== undefined) payload.project_code = updates.projectCode;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.thumbnailUrl !== undefined) payload.thumbnail_url = updates.thumbnailUrl;
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.assetCodePrefix !== undefined) payload.asset_code_prefix = updates.assetCodePrefix;
  if (updates.defaultAssetWorkflowId !== undefined) {
    payload.default_asset_workflow_id = updates.defaultAssetWorkflowId;
  }

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw formatPostgrestError("updateProjectV2", error);
  }

  if (!data) {
    throw new Error("updateProjectV2 failed: No data returned from project update.");
  }

  revalidatePath("/projects");
  revalidatePath("/assets/manage");
  return mapProjectV2(data);
}

/**
 * Writes the whole layout object — the client holds the full state, so this is
 * a replace, not a merge.
 *
 * Deliberately does NOT call revalidatePath. This fires on every card drop, and
 * a revalidate would refetch the entire board and push server state back over
 * the local positions mid-interaction, making cards jump. The client already
 * has the authoritative layout; the write is fire-and-forget persistence.
 */
export async function updateProjectBoardLayout(
  projectId: string,
  layout: BoardLayout
): Promise<void> {
  const supabase = await createClient();

  // Never trust the client payload: drop unknown keys, and require finite
  // numbers for every coordinate.
  const safe: Record<string, { x: number; y: number; z: number }> = {};
  for (const key of GRAPH_IDS) {
    const spot = layout[key];
    if (!spot) continue;

    const x = Number(spot.x);
    const y = Number(spot.y);
    const z = Number(spot.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      continue;
    }
    safe[key] = { x, y, z };
  }

  const { error } = await supabase
    .from("projects")
    .update({ board_layout: safe })
    .eq("id", projectId);

  if (error) {
    throw formatPostgrestError("updateProjectBoardLayout", error);
  }
}

export async function retireProjectV2(id: string): Promise<ProjectV2> {
  return updateProjectV2(id, { status: "Retired" });
}

export async function restoreProjectV2(id: string): Promise<ProjectV2> {
  return updateProjectV2(id, { status: "Active" });
}

export async function createEpisodeV2(input: {
  projectId: string;
  episodeName: string;
  code?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
  /** Generates the episode's own Main Tasks. Optional — none if omitted. */
  jobWorkflowId?: string;
  /** Stored only. The default each scene inherits at scene creation. */
  sceneWorkflowId?: string;
}): Promise<EpisodeV2> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("episodes")
    .insert({
      project_id: input.projectId,
      episode_name: input.episodeName,
      code: input.code ?? null,
      description: input.description ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      sort_order: input.sortOrder ?? null,
      job_workflow: input.jobWorkflowId ?? null,
      scene_workflow: input.sceneWorkflowId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw formatPostgrestError("createEpisodeV2", error);
  }

  if (!data) {
    throw new Error("createEpisodeV2 failed: No data returned from episode creation.");
  }

  // sceneWorkflowId is deliberately NOT generated here — it is the default that
  // scenes inherit, applied per scene by createSceneV2.
  if (input.jobWorkflowId) {
    const { error: rpcError } = await supabase.rpc("generate_workflow_tasks", {
      p_entity_type: "job",
      p_entity_id: data.id,
      p_workflow_id: input.jobWorkflowId,
    });

    if (rpcError) {
      // Compensating delete, following createAssetWithDefaults. An episode that
      // exists with no Main Tasks would read as 0% forever and look created;
      // createSceneV2 omits this and leaves orphaned workflow-less scenes.
      await supabase.from("episodes").delete().eq("id", data.id);
      throw formatPostgrestError("createEpisodeV2 (generate_workflow_tasks RPC)", rpcError);
    }
  }

  revalidatePath(`/projects/${input.projectId}/episodes`);
  revalidatePath(`/assets/manage/${input.projectId}`);
  return mapEpisodeV2(data);
}

export async function deleteEpisodeV2(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("episodes").delete().eq("id", id);

  if (error) {
    throw formatPostgrestError("deleteEpisodeV2", error);
  }

  revalidatePath("/projects", "layout");
}

export async function createDay(input: {
  episodeId: string;
  dayDate: string;
  title?: string;
  description?: string;
  sortOrder?: number;
}): Promise<DayV2> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("days")
    .insert({
      episode_id: input.episodeId,
      day_date: input.dayDate,
      title: input.title ?? null,
      description: input.description ?? null,
      sort_order: input.sortOrder ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw formatPostgrestError("createDay", error);
  }

  if (!data) {
    throw new Error("createDay failed: No data returned from day creation.");
  }

  revalidatePath("/projects", "layout");
  return mapDayV2(data);
}

export async function updateDay(
  id: string,
  updates: Partial<Omit<DayV2, "id" | "episodeId" | "createdAt">>
): Promise<void> {
  const supabase = await createClient();
  const dbUpdates: TablesUpdate<"days"> = {};

  if (updates.dayDate !== undefined) dbUpdates.day_date = updates.dayDate;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

  const { error } = await supabase
    .from("days")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    throw formatPostgrestError("updateDay", error);
  }

  revalidatePath("/projects", "layout");
}

export async function deleteDay(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("days").delete().eq("id", id);

  if (error) {
    throw formatPostgrestError("deleteDay", error);
  }

  revalidatePath("/projects", "layout");
}

export async function deleteDayV2(id: string): Promise<void> {
  return deleteDay(id);
}

export async function createCustomTask(input: {
  dayId: string;
  name: string;
  contributesToTaskId?: string | null;
  branchesFromTaskId?: string | null;
  sortOrder?: number;
}): Promise<CustomTaskV2> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("production_tasks")
    .insert({
      day_id: input.dayId,
      name: input.name,
      contributes_to_task_id: input.contributesToTaskId ?? null,
      branches_from_task_id: input.branchesFromTaskId ?? null,
      sort_order: input.sortOrder ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw formatPostgrestError("createCustomTask", error);
  }

  if (!data) {
    throw new Error("createCustomTask failed: No data returned from custom task creation.");
  }

  revalidatePath("/projects", "layout");
  return mapCustomTaskV2(data);
}

export async function updateCustomTask(
  id: string,
  updates: Partial<Pick<CustomTaskV2, "name" | "progress" | "status" | "sortOrder" | "contributesToTaskId" | "branchesFromTaskId">>
): Promise<void> {
  const supabase = await createClient();
  const dbUpdates: TablesUpdate<"production_tasks"> = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  if (updates.contributesToTaskId !== undefined) dbUpdates.contributes_to_task_id = updates.contributesToTaskId;
  if (updates.branchesFromTaskId !== undefined) dbUpdates.branches_from_task_id = updates.branchesFromTaskId;

  const { error } = await supabase
    .from("production_tasks")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    throw formatPostgrestError("updateCustomTask", error);
  }

  revalidatePath("/projects", "layout");
}

export async function deleteCustomTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("production_tasks").delete().eq("id", id);

  if (error) {
    throw formatPostgrestError("deleteCustomTask", error);
  }

  revalidatePath("/projects", "layout");
}

export async function setCustomTaskComplete(id: string, complete: boolean): Promise<void> {
  const supabase = await createClient();
  const progress = complete ? 100 : 0;
  const status = complete ? "Completed" : "Not Started";

  const { error } = await supabase
    .from("production_tasks")
    .update({ progress, status })
    .eq("id", id);

  if (error) {
    throw formatPostgrestError("setCustomTaskComplete", error);
  }

  revalidatePath("/projects", "layout");
}

export async function updateAssetTask(
  taskId: string,
  updates: { assignee?: string | null; status?: string }
): Promise<void> {
  const supabase = await createClient();
  const payload: { assignee?: string | null; status?: string } = {};
  if (updates.assignee !== undefined) payload.assignee = updates.assignee;
  if (updates.status !== undefined) payload.status = updates.status;

  const { error } = await supabase
    .from("asset_tasks")
    .update(payload)
    .eq("id", taskId);

  if (error) {
    throw formatPostgrestError("updateAssetTask", error);
  }

  revalidatePath("/assets/manage", "layout");
}

export async function createAssetWithDefaults(input: {
  filename: string;
  projectId?: string | null;
  imageUrl?: string | null;
  description?: string | null;
}): Promise<AssetV2> {
  const supabase = await createClient();

  const cleanName = input.filename
    ? input.filename.replace(/\.[^/.]+$/, "").trim()
    : "Untitled Asset";

  let targetProjectId = input.projectId || null;
  let assetCodePrefix = "AST";
  let defaultWorkflowId: string | null = null;

  if (targetProjectId) {
    const { data: projectRow, error: projectError } = await supabase
      .from("projects")
      .select("id, project_code, asset_code_prefix, default_asset_workflow_id, is_system")
      .eq("id", targetProjectId)
      .single();

    if (projectError) {
      throw formatPostgrestError("createAssetWithDefaults (project lookup)", projectError);
    }

    if (projectRow) {
      assetCodePrefix = projectRow.asset_code_prefix || projectRow.project_code || "AST";
      defaultWorkflowId = projectRow.default_asset_workflow_id || null;
    }
  } else {
    const { data: sysProjects, error: sysError } = await supabase
      .from("projects")
      .select("id, project_code, asset_code_prefix, default_asset_workflow_id")
      .eq("is_system", true)
      .limit(1);

    if (sysError) {
      throw formatPostgrestError("createAssetWithDefaults (system project lookup)", sysError);
    }

    if (sysProjects && sysProjects.length > 0) {
      targetProjectId = sysProjects[0].id;
      assetCodePrefix = sysProjects[0].asset_code_prefix || sysProjects[0].project_code || "AST";
      defaultWorkflowId = sysProjects[0].default_asset_workflow_id || null;
    }
  }

  const { data: categories, error: catError } = await supabase
    .from("asset_categories")
    .select("id, name")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1);

  if (catError) {
    throw formatPostgrestError("createAssetWithDefaults (category lookup)", catError);
  }

  const defaultCategory = categories && categories.length > 0 ? categories[0] : null;
  const categoryName = defaultCategory?.name || "General";
  const categoryId = defaultCategory?.id || null;

  const { data: insertedAsset, error: insertError } = await supabase
    .from("assets")
    .insert([
      {
        asset_name: cleanName,
        asset_code: "TEMP",
        asset_type: categoryName,
        category_id: categoryId,
        priority: 1,
        description: input.description || null,
        preview_url: input.imageUrl || null,
        status: "Active",
      },
    ])
    .select("*")
    .single();

  if (insertError) {
    throw formatPostgrestError("createAssetWithDefaults (asset insert)", insertError);
  }

  if (!insertedAsset) {
    throw new Error("createAssetWithDefaults failed: No data returned from asset insert.");
  }

  if (insertedAsset.asset_number === null || insertedAsset.asset_number === undefined) {
    await supabase.from("assets").delete().eq("id", insertedAsset.id);
    throw new Error("createAssetWithDefaults failed: asset_number returned from insert is null.");
  }

  const computedCode = `${assetCodePrefix}_${insertedAsset.asset_number}`;

  const { data: updatedAsset, error: updateError } = await supabase
    .from("assets")
    .update({ asset_code: computedCode })
    .eq("id", insertedAsset.id)
    .select("*")
    .single();

  if (updateError) {
    await supabase.from("assets").delete().eq("id", insertedAsset.id);
    throw formatPostgrestError("createAssetWithDefaults (code update)", updateError);
  }

  const finalAsset = updatedAsset || insertedAsset;

  if (targetProjectId) {
    const { error: projLinkError } = await supabase.from("asset_project_links").insert([
      {
        asset_id: finalAsset.id,
        project_id: targetProjectId,
      },
    ]);
    if (projLinkError) {
      await supabase.from("assets").delete().eq("id", finalAsset.id);
      throw formatPostgrestError("createAssetWithDefaults (project link)", projLinkError);
    }
  }

  if (defaultWorkflowId) {
    const { error: rpcError } = await supabase.rpc("generate_workflow_tasks", {
      p_entity_type: "asset",
      p_entity_id: finalAsset.id,
      p_workflow_id: defaultWorkflowId,
    });
    if (rpcError) {
      console.error("Failed to generate workflow tasks for asset:", rpcError);
      throw formatPostgrestError("createAssetWithDefaults (workflow task RPC)", rpcError);
    }
  }

  revalidatePath("/assets/manage", "layout");
  revalidatePath("/assets/assembly", "layout");

  return {
    id: finalAsset.id,
    name: finalAsset.asset_name,
    assetCode: finalAsset.asset_code ?? computedCode,
    category: finalAsset.asset_type ?? categoryName,
    priority: String(finalAsset.priority ?? "Medium"),
    projectId: targetProjectId,
    episodeId: null,
    previewUrl: finalAsset.preview_url ?? null,
    description: finalAsset.description ?? null,
    createdAt: finalAsset.created_at,
    updatedAt: finalAsset.updated_at,
    hasDefaultWorkflow: Boolean(defaultWorkflowId),
  };
}

export async function createAssetV2(input: {
  name: string;
  assetCode?: string;
  category?: string;
  priority?: string;
  projectId?: string | null;
  episodeId?: string | null;
  description?: string | null;
  workflowId?: string;
  previewUrl?: string | null;
}): Promise<AssetV2> {
  const supabase = await createClient();
  let targetProjectId = input.projectId;

  if (!targetProjectId) {
    const { data: sysProjects, error: sysError } = await supabase
      .from("projects")
      .select("id")
      .eq("is_system", true)
      .limit(1);

    if (sysError) {
      throw formatPostgrestError("createAssetV2 (system project lookup)", sysError);
    }

    if (sysProjects && sysProjects.length > 0) {
      targetProjectId = sysProjects[0].id;
    }
  }

  const { data, error } = await supabase
    .from("assets")
    .insert([
      {
        asset_name: input.name,
        asset_code: input.assetCode || "TEMP",
        asset_type: input.category || "General",
        priority: 1,
        description: input.description || null,
        preview_url: input.previewUrl || null,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw formatPostgrestError("createAssetV2 (asset insert)", error);
  }

  if (!data) {
    throw new Error("createAssetV2 failed: No data returned from asset insert.");
  }

  if (!input.assetCode) {
    if (data.asset_number === null || data.asset_number === undefined) {
      await supabase.from("assets").delete().eq("id", data.id);
      throw new Error("createAssetV2 failed: asset_number returned from insert is null.");
    }
    let prefix = "AST";
    if (targetProjectId) {
      const { data: p } = await supabase
        .from("projects")
        .select("asset_code_prefix, project_code")
        .eq("id", targetProjectId)
        .single();
      if (p) {
        prefix = p.asset_code_prefix || p.project_code || "AST";
      }
    }
    const computedCode = `${prefix}_${data.asset_number}`;
    const { error: codeUpdateError } = await supabase
      .from("assets")
      .update({ asset_code: computedCode })
      .eq("id", data.id);

    if (codeUpdateError) {
      await supabase.from("assets").delete().eq("id", data.id);
      throw formatPostgrestError("createAssetV2 (code update)", codeUpdateError);
    }
    data.asset_code = computedCode;
  }

  if (targetProjectId) {
    const { error: projLinkError } = await supabase.from("asset_project_links").insert([
      {
        asset_id: data.id,
        project_id: targetProjectId,
      },
    ]);
    if (projLinkError) {
      throw formatPostgrestError("createAssetV2 (project link insert)", projLinkError);
    }
  }

  if (input.episodeId) {
    const { error: jobLinkError } = await supabase.from("asset_job_links").insert([
      {
        asset_id: data.id,
        episode_id: input.episodeId,
      },
    ]);
    if (jobLinkError) {
      throw formatPostgrestError("createAssetV2 (job link insert)", jobLinkError);
    }
  }

  if (input.workflowId) {
    const { error: rpcError } = await supabase.rpc("generate_workflow_tasks", {
      p_entity_type: "asset",
      p_entity_id: data.id,
      p_workflow_id: input.workflowId,
    });
    if (rpcError) {
      throw formatPostgrestError("createAssetV2 (workflow task RPC)", rpcError);
    }
  }

  revalidatePath("/assets/manage", "layout");
  revalidatePath("/assets/assembly", "layout");

  return {
    id: data.id,
    name: data.asset_name,
    assetCode: data.asset_code ?? null,
    category: data.asset_type ?? null,
    priority: String(data.priority ?? "Medium"),
    projectId: targetProjectId ?? null,
    episodeId: input.episodeId ?? null,
    previewUrl: data.preview_url ?? null,
    description: data.description ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
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
  const result = await repoCreateSceneV2(input);
  revalidatePath("/projects", "layout");
  return result;
}

export async function getSceneWorkflows(): Promise<Array<{ id: string; name: string }>> {
  return repoGetSceneWorkflows();
}


export async function getProjectsV2(): Promise<ProjectV2[]> {
  return repoGetProjectsV2();
}

export async function getProjectBoardStats(): Promise<Record<string, ProjectBoardStats>> {
  return repoGetProjectBoardStats();
}

export async function getJobWorkflows(): Promise<Array<{ id: string; name: string }>> {
  return repoGetJobWorkflows();
}

export async function getEpisodeProcessProgress(
  episodeIds: string[]
): Promise<Record<string, ProcessProgress[]>> {
  return repoGetEpisodeProcessProgress(episodeIds);
}

/**
 * Move a task to one of the statuses its own status workflow defines.
 *
 * task_status_definition_id is the authoritative value — migration 037's views
 * and the Episode board's process rings both read completion through it. The
 * free-text status column is written to the same status's name so the two do
 * not drift, but nothing reads it for completion. progress is deliberately not
 * touched: migration 037 records that it is not authoritative.
 */
export async function updateTaskStatus(
  taskId: string,
  statusDefinitionId: string
): Promise<void> {
  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("production_tasks")
    .select("id, task_status_workflow_id")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError) {
    throw formatPostgrestError("updateTaskStatus (task lookup)", taskError);
  }
  if (!task) {
    throw new Error(`updateTaskStatus failed: task ${taskId} not found.`);
  }
  if (!task.task_status_workflow_id) {
    throw new Error(
      `updateTaskStatus failed: task ${taskId} has no task_status_workflow_id, ` +
        "so no status can be validated against it."
    );
  }

  const { data: status, error: statusError } = await supabase
    .from("workflow_task_statuses")
    .select("id, name, workflow_id")
    .eq("id", statusDefinitionId)
    .maybeSingle();

  if (statusError) {
    throw formatPostgrestError("updateTaskStatus (status lookup)", statusError);
  }
  if (!status) {
    throw new Error(
      `updateTaskStatus failed: status ${statusDefinitionId} not found.`
    );
  }

  // Rejected rather than silently written: a status from another workflow would
  // pass the FK but means nothing for this task.
  if (status.workflow_id !== task.task_status_workflow_id) {
    throw new Error(
      `updateTaskStatus failed: status ${statusDefinitionId} belongs to workflow ` +
        `${status.workflow_id}, but task ${taskId} is scoped to workflow ` +
        `${task.task_status_workflow_id}.`
    );
  }

  const { error } = await supabase
    .from("production_tasks")
    .update({
      task_status_definition_id: status.id,
      status: status.name,
    })
    .eq("id", taskId);

  if (error) {
    throw formatPostgrestError("updateTaskStatus", error);
  }

  revalidatePath("/projects", "layout");
}

/**
 * Set or clear a task's assignee.
 *
 * production_tasks.assignee is a text column with no FK, and this stores the
 * profile UUID in it, resolved to a display name at render time.
 *
 * asset_tasks.assignee remains free text holding a display name, written by
 * updateAssetTask above; that is deliberately left alone rather than migrated
 * in this pass.
 */
export async function updateTaskAssignee(
  taskId: string,
  profileId: string | null
): Promise<void> {
  const supabase = await createClient();

  if (profileId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .eq("account_status", "active")
      .maybeSingle();

    if (profileError) {
      throw formatPostgrestError("updateTaskAssignee (profile lookup)", profileError);
    }
    if (!profile) {
      throw new Error(
        `updateTaskAssignee failed: no active profile ${profileId}.`
      );
    }
  }

  const { error } = await supabase
    .from("production_tasks")
    .update({ assignee: profileId })
    .eq("id", taskId);

  if (error) {
    throw formatPostgrestError("updateTaskAssignee", error);
  }

  revalidatePath("/projects", "layout");
}
