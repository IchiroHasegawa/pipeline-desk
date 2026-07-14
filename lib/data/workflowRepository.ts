import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type WorkflowProcess = Database["public"]["Tables"]["workflow_processes"]["Row"];
export type WorkflowTaskStatus = Database["public"]["Tables"]["workflow_task_statuses"]["Row"];

export async function getWorkflows(supabase: SupabaseClient<Database>, type?: string) {
  let query = supabase.from("workflows").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  
  if (type) {
    query = query.eq("workflow_type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getWorkflow(supabase: SupabaseClient<Database>, id: string) {
  const { data, error } = await supabase.from("workflows").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createWorkflow(supabase: SupabaseClient<Database>, workflow: Database["public"]["Tables"]["workflows"]["Insert"]) {
  const { data, error } = await supabase
    .from("workflows")
    .insert(workflow)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkflow(supabase: SupabaseClient<Database>, id: string, updates: Database["public"]["Tables"]["workflows"]["Update"]) {
  const { data, error } = await supabase
    .from("workflows")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function retireWorkflow(supabase: SupabaseClient<Database>, id: string) {
  return updateWorkflow(supabase, id, { status: "retired" });
}

export async function restoreWorkflow(supabase: SupabaseClient<Database>, id: string) {
  return updateWorkflow(supabase, id, { status: "active" });
}

export async function deleteWorkflow(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase.from("workflows").delete().eq("id", id);
  if (error) throw error;
}

// Processes

export async function getWorkflowProcesses(supabase: SupabaseClient<Database>, workflowId: string) {
  const { data, error } = await supabase
    .from("workflow_processes")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createWorkflowProcess(supabase: SupabaseClient<Database>, process: Database["public"]["Tables"]["workflow_processes"]["Insert"]) {
  const { data, error } = await supabase
    .from("workflow_processes")
    .insert(process)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkflowProcess(supabase: SupabaseClient<Database>, id: string, updates: Database["public"]["Tables"]["workflow_processes"]["Update"]) {
  const { data, error } = await supabase
    .from("workflow_processes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkflowProcess(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase.from("workflow_processes").delete().eq("id", id);
  if (error) throw error;
}

// Task Statuses

export async function getTaskStatuses(supabase: SupabaseClient<Database>, workflowId: string) {
  const { data, error } = await supabase
    .from("workflow_task_statuses")
    .select("*")
    .eq("workflow_id", workflowId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTaskStatus(supabase: SupabaseClient<Database>, status: Database["public"]["Tables"]["workflow_task_statuses"]["Insert"]) {
  const { data, error } = await supabase
    .from("workflow_task_statuses")
    .insert(status)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTaskStatus(supabase: SupabaseClient<Database>, id: string, updates: Database["public"]["Tables"]["workflow_task_statuses"]["Update"]) {
  const { data, error } = await supabase
    .from("workflow_task_statuses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTaskStatus(supabase: SupabaseClient<Database>, id: string) {
  const { error } = await supabase.from("workflow_task_statuses").delete().eq("id", id);
  if (error) throw error;
}

// Task Generation RPC

export async function generateWorkflowTasks(supabase: SupabaseClient<Database>, entityType: string, entityId: string, workflowId: string) {
  // @ts-expect-error - RPC might not be in generated types yet
  const { error } = await supabase.rpc("generate_workflow_tasks", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_workflow_id: workflowId
  });
  if (error) throw error;
}
