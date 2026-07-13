import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDriveClient } from "@/lib/google-drive-server";
import { checkDriveAccess } from "@/lib/deployment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string; assetFileId: string }> }
) {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  try {
    const { assetId, assetFileId } = await params;
    const adminClient = getAdminClient();

    // 1. Get the file to trash
    const { data: fileToTrash, error: fileErr } = await adminClient
      .from("asset_files")
      .select("*")
      .eq("id", assetFileId)
      .eq("asset_id", assetId)
      .single();

    if (fileErr || !fileToTrash) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // 2. Prevent trashing if it's the current file
    if (fileToTrash.file_role === "Source" || fileToTrash.file_role === "Versions") {
      const sourceId = fileToTrash.file_role === "Source" ? fileToTrash.id : fileToTrash.source_file_id;
      if (sourceId) {
        const { data: sourceRec } = await adminClient
          .from("asset_files")
          .select("current_file_id")
          .eq("id", sourceId)
          .single();
        
        if (sourceRec && sourceRec.current_file_id === fileToTrash.id) {
          return NextResponse.json({ error: "Cannot move the current file to Trash. Choose another current Version first." }, { status: 400 });
        }
      }
    }

    // 3. Prevent trashing if it's the primary preview
    if (fileToTrash.file_role === "Preview") {
      const { data: assetRec } = await adminClient
        .from("assets")
        .select("preview_url")
        .eq("id", assetId)
        .single();
        
      if (assetRec && assetRec.preview_url === fileToTrash.file_url) {
         return NextResponse.json({ error: "Cannot move the primary Preview to Trash. Select another Preview or remove it first." }, { status: 400 });
      }
    }

    // 4. Connect to Drive and trash the file
    if (fileToTrash.drive_file_id) {
      let driveClient;
      try {
        const { drive } = await getDriveClient();
        driveClient = drive;
      } catch {
        return NextResponse.json({ error: "Google Drive is not connected." }, { status: 400 });
      }

      try {
        await driveClient.files.update({
          fileId: fileToTrash.drive_file_id,
          requestBody: { trashed: true }
        });
      } catch (err: unknown) {
        // If it's a 404, it might already be trashed or missing, proceed to update DB anyway
        if (!(err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404)) {
           console.error("Failed to trash Google Drive file", err);
           return NextResponse.json({ error: "Failed to move the Google Drive file to Trash." }, { status: 500 });
        }
      }
    }

    // 5. Update the asset_files record
    const { error: updateErr } = await adminClient
      .from("asset_files")
      .update({ record_status: "Trashed", updated_at: new Date().toISOString() })
      .eq("id", fileToTrash.id);

    if (updateErr) {
      console.error("Failed to update file status to Trashed", updateErr);
      return NextResponse.json({ error: "Failed to update Production OS file record." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "File moved to Trash" });
  } catch (error) {
    console.error("Trash file error", error);
    const message = error instanceof Error ? error.message : "Failed to move file to trash";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
