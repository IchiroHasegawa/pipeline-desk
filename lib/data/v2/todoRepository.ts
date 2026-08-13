import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { TodoV2, TodoScope } from "@/types/production-v2";

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
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `getOpenTodos failed getting user [${userError.status ?? "AUTH"}]: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("getOpenTodos failed: User must be authenticated to fetch To Dos");
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
    throw formatPostgrestError("getOpenTodos", error);
  }

  return (data || []).map(mapTodoV2);
}

/** Completed To Dos (commits) for the current user, newest first. */
export async function getCommits(
  scope: TodoScope,
  limit = 50
): Promise<TodoV2[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(
      `getCommits failed getting user [${userError.status ?? "AUTH"}]: ${userError.message}`
    );
  }

  if (!user) {
    throw new Error("getCommits failed: User must be authenticated to fetch commits");
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
    throw formatPostgrestError("getCommits", error);
  }

  return (data || []).map(mapTodoV2);
}

/** Most recent commit per task id, for the "Last commit..." captions. */
export async function getLatestCommitByTask(
  taskIds: string[]
): Promise<Record<string, TodoV2>> {
  if (taskIds.length === 0) {
    return {};
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .in("task_id", taskIds)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error) {
    throw formatPostgrestError("getLatestCommitByTask", error);
  }

  const result: Record<string, TodoV2> = {};
  (data || []).forEach((row) => {
    if (row.task_id && !result[row.task_id]) {
      result[row.task_id] = mapTodoV2(row);
    }
  });

  return result;
}
