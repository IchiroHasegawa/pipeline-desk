import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/types/supabase";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  DayV2,
  MainTaskV2,
  CustomTaskV2,
} from "@/types/production-v2";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapProjectV2(row: Tables<"projects">): ProjectV2 {
  return {
    id: row.id,
    title: row.title,
    projectCode: row.project_code,
    description: row.description ?? "",
    thumbnailUrl: row.thumbnail_url ?? "",
    status: (row.status === "Retired" ? "Retired" : "Active") as "Active" | "Retired",
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
// Reads
// ---------------------------------------------------------------------------

export async function getProjectsV2(): Promise<ProjectV2[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapProjectV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch projects v2: ${message}`);
  }
}

export async function getEpisodesByProject(projectId: string): Promise<EpisodeV2[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("episode_name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapEpisodeV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch episodes for project ${projectId}: ${message}`);
  }
}

export async function getScenesByEpisode(episodeId: string): Promise<SceneV2[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("scenes")
      .select("*")
      .eq("episode_id", episodeId)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("scene_name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapSceneV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch scenes for episode ${episodeId}: ${message}`);
  }
}

export async function getDaysByEpisode(episodeId: string): Promise<DayV2[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("days")
      .select("*")
      .eq("episode_id", episodeId)
      .order("day_date", { ascending: true })
      .order("sort_order", { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return (data || []).map(mapDayV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch days for episode ${episodeId}: ${message}`);
  }
}

export async function getMainTasksForEpisode(episodeId: string): Promise<MainTaskV2[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("production_tasks")
      .select("*")
      .eq("episode_id", episodeId)
      .is("day_id", null);

    if (error) {
      throw error;
    }

    return (data || []).map(mapMainTaskV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch main tasks for episode ${episodeId}: ${message}`);
  }
}

export async function getMainTasksForScene(sceneId: string): Promise<MainTaskV2[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("production_tasks")
      .select("*")
      .eq("scene_id", sceneId)
      .is("day_id", null);

    if (error) {
      throw error;
    }

    return (data || []).map(mapMainTaskV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch main tasks for scene ${sceneId}: ${message}`);
  }
}

export async function getCustomTasksByDay(dayId: string): Promise<CustomTaskV2[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("production_tasks")
      .select("*")
      .eq("day_id", dayId);

    if (error) {
      throw error;
    }

    return (data || []).map(mapCustomTaskV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch custom tasks for day ${dayId}: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createDay(input: {
  episodeId: string;
  dayDate: string;
  title?: string;
  description?: string;
  sortOrder?: number;
}): Promise<DayV2> {
  try {
    const supabase = createClient();
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

    if (error || !data) {
      throw error || new Error("No data returned from day creation.");
    }

    return mapDayV2(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create day: ${message}`);
  }
}

export async function updateDay(
  id: string,
  updates: Partial<Omit<DayV2, "id" | "episodeId" | "createdAt">>
): Promise<void> {
  try {
    const supabase = createClient();
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
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update day ${id}: ${message}`);
  }
}

export async function deleteDay(id: string): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("days").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete day ${id}: ${message}`);
  }
}

export async function createCustomTask(input: {
  dayId: string;
  name: string;
  contributesToTaskId?: string | null;
  branchesFromTaskId?: string | null;
  sortOrder?: number;
}): Promise<CustomTaskV2> {
  try {
    const supabase = createClient();
    // Custom task inserts set day_id and NEVER set source_workflow_process_id
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

    if (error || !data) {
      throw error || new Error("No data returned from custom task creation.");
    }

    return mapCustomTaskV2(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create custom task: ${message}`);
  }
}

export async function updateCustomTask(
  id: string,
  updates: Partial<Pick<CustomTaskV2, "name" | "progress" | "status" | "sortOrder" | "contributesToTaskId" | "branchesFromTaskId">>
): Promise<void> {
  try {
    const supabase = createClient();
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
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update custom task ${id}: ${message}`);
  }
}

export async function deleteCustomTask(id: string): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("production_tasks").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete custom task ${id}: ${message}`);
  }
}

export async function createEpisodeV2(input: {
  projectId: string;
  episodeName: string;
  code?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: number;
}): Promise<EpisodeV2> {
  try {
    const supabase = createClient();
    // Sets project_id and NEVER sets environment_id
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
      })
      .select("*")
      .single();

    if (error || !data) {
      throw error || new Error("No data returned from episode creation.");
    }

    return mapEpisodeV2(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create episode v2: ${message}`);
  }
}

export async function createProjectV2(input: {
  title: string;
  projectCode: string;
  description?: string;
  startDate: string;
  endDate?: string;
  thumbnailUrl?: string;
}): Promise<ProjectV2> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        title: input.title,
        project_code: input.projectCode,
        description: input.description ?? null,
        start_date: input.startDate,
        end_date: input.endDate ?? null,
        thumbnail_url: input.thumbnailUrl ?? null,
        status: "Active",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw error || new Error("No data returned from project creation.");
    }

    return mapProjectV2(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create project v2: ${message}`);
  }
}

export async function deleteProjectV2(id: string): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete project ${id}: ${message}`);
  }
}

export async function getProjectV2(id: string): Promise<ProjectV2 | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data ? mapProjectV2(data) : null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch project ${id}: ${message}`);
  }
}

export async function deleteEpisodeV2(id: string): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("episodes").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete episode ${id}: ${message}`);
  }
}

export async function getSceneV2(id: string): Promise<SceneV2 | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("scenes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data ? mapSceneV2(data) : null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch scene ${id}: ${message}`);
  }
}

export async function getDaysWithTasks(
  episodeId: string
): Promise<Array<DayV2 & { tasks: CustomTaskV2[] }>> {
  try {
    const supabase = createClient();
    const days = await getDaysByEpisode(episodeId);
    if (days.length === 0) return [];

    const dayIds = days.map((d) => d.id);
    const { data: tasksData, error: tasksError } = await supabase
      .from("production_tasks")
      .select("*")
      .in("day_id", dayIds);

    if (tasksError) {
      throw tasksError;
    }

    const tasksMapped = (tasksData || []).map(mapCustomTaskV2);

    return days.map((day) => ({
      ...day,
      tasks: tasksMapped.filter((t) => t.dayId === day.id),
    }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch days with tasks for episode ${episodeId}: ${message}`);
  }
}

export async function setCustomTaskComplete(id: string, complete: boolean): Promise<void> {
  try {
    const supabase = createClient();
    const progress = complete ? 100 : 0;
    const status = complete ? "Completed" : "Not Started";

    const { error } = await supabase
      .from("production_tasks")
      .update({ progress, status })
      .eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to set completion for custom task ${id}: ${message}`);
  }
}

export async function deleteDayV2(id: string): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("days").delete().eq("id", id);

    if (error) {
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete day ${id}: ${message}`);
  }
}
