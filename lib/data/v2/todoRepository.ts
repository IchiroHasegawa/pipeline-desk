import { createClient } from "@/lib/supabase/client";
import type { TodoV2, TodoScope } from "@/types/production-v2";
import type { Database } from "@/types/supabase";

type TodoUpdate = Database["public"]["Tables"]["todos"]["Update"];

export function mapTodoV2(row: {
  id: string;
  episode_id: string | null;
  scene_id: string | null;
  task_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
  completed_at: string | null;
  created_at: string;
}): TodoV2 {
  return {
    id: row.id,
    episodeId: row.episode_id,
    sceneId: row.scene_id,
    taskId: row.task_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

/** Open To Dos for the current user, in display order. */
export async function getOpenTodos(scope: TodoScope): Promise<TodoV2[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User must be authenticated to fetch To Dos");
    }

    let query = supabase
      .from("todos")
      .select("*")
      .is("completed_at", null)
      .eq("user_id", user.id);

    if (scope.kind === "episode") {
      query = query.eq("episode_id", scope.episodeId);
    } else {
      query = query.eq("scene_id", scope.sceneId);
    }

    const { data, error } = await query
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapTodoV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch open To Dos: ${message}`);
  }
}

/** Completed To Dos (commits) for the current user, newest first. */
export async function getCommits(
  scope: TodoScope,
  limit = 50
): Promise<TodoV2[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User must be authenticated to fetch commits");
    }

    let query = supabase
      .from("todos")
      .select("*")
      .not("completed_at", "is", null)
      .eq("user_id", user.id);

    if (scope.kind === "episode") {
      query = query.eq("episode_id", scope.episodeId);
    } else {
      query = query.eq("scene_id", scope.sceneId);
    }

    const { data, error } = await query
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map(mapTodoV2);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch commits: ${message}`);
  }
}

/** Most recent commit per task id, for the "Last commit..." captions. */
export async function getLatestCommitByTask(
  taskIds: string[]
): Promise<Record<string, TodoV2>> {
  if (taskIds.length === 0) {
    return {};
  }
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .in("task_id", taskIds)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (error) {
      throw error;
    }

    const result: Record<string, TodoV2> = {};
    (data || []).forEach((row) => {
      if (row.task_id && !result[row.task_id]) {
        result[row.task_id] = mapTodoV2(row);
      }
    });

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch latest commits by task: ${message}`);
  }
}

export async function createTodo(input: {
  scope: TodoScope;
  title: string;
  description?: string;
  taskId?: string | null;
  sortOrder?: number;
}): Promise<TodoV2> {
  try {
    const supabase = createClient();

    // OMIT user_id so Postgres defaults it to auth.uid()
    const payload = {
      episode_id: input.scope.kind === "episode" ? input.scope.episodeId : null,
      scene_id: input.scope.kind === "scene" ? input.scope.sceneId : null,
      task_id: input.taskId || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      sort_order: input.sortOrder ?? null,
    };

    const { data, error } = await supabase
      .from("todos")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error("You do not have permission to create To Dos for this user");
      }
      throw error;
    }

    return mapTodoV2(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create To Do: ${message}`);
  }
}

/** Sets completed_at to now() or null. This is the To Do -> Commit move. */
export async function setTodoComplete(
  id: string,
  complete: boolean
): Promise<TodoV2> {
  try {
    const supabase = createClient();
    const completedAt = complete ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from("todos")
      .update({ completed_at: completedAt, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error("You can only modify or complete your own To Dos");
      }
      throw error;
    }

    return mapTodoV2(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update completion status for To Do ${id}: ${message}`);
  }
}

export async function updateTodo(
  id: string,
  updates: Partial<Pick<TodoV2, "title" | "description" | "sortOrder" | "taskId">>
): Promise<void> {
  try {
    const supabase = createClient();

    const payload: TodoUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined)
      payload.description = updates.description ? updates.description.trim() : null;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
    if (updates.taskId !== undefined) payload.task_id = updates.taskId;

    const { error } = await supabase
      .from("todos")
      .update(payload)
      .eq("id", id);

    if (error) {
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error("You can only update your own To Dos");
      }
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update To Do ${id}: ${message}`);
  }
}

export async function deleteTodo(id: string): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) {
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error("You can only delete your own To Dos");
      }
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete To Do ${id}: ${message}`);
  }
}

/** Bulk reorder after drag-and-drop. */
export async function reorderTodos(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  try {
    const supabase = createClient();
    const rows = orderedIds.map((id, index) => ({
      id,
      sort_order: index,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("todos")
      .upsert(rows as unknown as Database["public"]["Tables"]["todos"]["Insert"][], {
        onConflict: "id",
      });

    if (error) {
      if (error.code === "42501" || error.message.includes("policy")) {
        throw new Error("You can only reorder your own To Dos");
      }
      throw error;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to reorder To Dos: ${message}`);
  }
}
