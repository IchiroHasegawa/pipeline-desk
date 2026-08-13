"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TodoV2, TodoScope } from "@/types/production-v2";
import type { Database } from "@/types/supabase";

type TodoUpdate = Database["public"]["Tables"]["todos"]["Update"];

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

function mapTodoV2(row: {
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

export async function createTodo(input: {
  scope: TodoScope;
  title: string;
  description?: string;
  taskId?: string | null;
  sortOrder?: number;
}): Promise<TodoV2> {
  const supabase = await createClient();

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
    throw formatPostgrestError("createTodo", error);
  }

  if (!data) {
    throw new Error("createTodo failed: No data returned from To Do insert.");
  }

  revalidatePath("/projects", "layout");
  return mapTodoV2(data);
}

export async function setTodoComplete(
  id: string,
  complete: boolean
): Promise<TodoV2> {
  const supabase = await createClient();
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
    throw formatPostgrestError("setTodoComplete", error);
  }

  if (!data) {
    throw new Error("setTodoComplete failed: No data returned from To Do update.");
  }

  revalidatePath("/projects", "layout");
  return mapTodoV2(data);
}

export async function updateTodo(
  id: string,
  updates: Partial<Pick<TodoV2, "title" | "description" | "sortOrder" | "taskId">>
): Promise<void> {
  const supabase = await createClient();

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
    throw formatPostgrestError("updateTodo", error);
  }

  revalidatePath("/projects", "layout");
}

export async function deleteTodo(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error) {
    if (error.code === "42501" || error.message.includes("policy")) {
      throw new Error("You can only delete your own To Dos");
    }
    throw formatPostgrestError("deleteTodo", error);
  }

  revalidatePath("/projects", "layout");
}

export async function reorderTodos(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const supabase = await createClient();
  const rows = orderedIds.map((id, index) => ({
    id,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));

  // Supabase upsert expects full Insert type (title is required), but reordering only supplies partial update fields (id, sort_order, updated_at).
  const { error } = await supabase
    .from("todos")
    .upsert(rows as unknown as Database["public"]["Tables"]["todos"]["Insert"][], {
      onConflict: "id",
    });

  if (error) {
    if (error.code === "42501" || error.message.includes("policy")) {
      throw new Error("You can only reorder your own To Dos");
    }
    throw formatPostgrestError("reorderTodos", error);
  }

  revalidatePath("/projects", "layout");
}
