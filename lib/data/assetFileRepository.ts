import { createClient } from "@/lib/supabase/client";

export async function renameFileLabel(fileId: string, displayName: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("asset_files")
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq("id", fileId);

  if (error) {
    console.error("Failed to rename file label", error);
    throw error;
  }
}

export async function updateFileRecordStatus(fileId: string, newStatus: "Active" | "Retired" | "Trashed" | "Missing"): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("asset_files")
    .update({ record_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", fileId);

  if (error) {
    console.error(`Failed to update record status to ${newStatus}`, error);
    throw error;
  }
}

export async function makeFileCurrent(sourceFileId: string, newCurrentFileId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("asset_files")
    .update({ current_file_id: newCurrentFileId, updated_at: new Date().toISOString() })
    .eq("id", sourceFileId)
    .eq("file_role", "Source");

  if (error) {
    console.error("Failed to make file current", error);
    throw error;
  }
}
