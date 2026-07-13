import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDriveClient } from "@/lib/google-drive-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string; assetFileId: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Google Drive operations are disabled in production" }, { status: 403 });
  }

  try {
    const { assetId, assetFileId } = await params;
    const adminClient = getAdminClient();

    // 1. Get the file to restore
    const { data: fileToRestore, error: fileErr } = await adminClient
      .from("asset_files")
      .select("*")
      .eq("id", assetFileId)
      .eq("asset_id", assetId)
      .single();

    if (fileErr || !fileToRestore) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    if (!fileToRestore.drive_file_id) {
      return NextResponse.json({ error: "Cannot restore a file without a Google Drive file ID." }, { status: 400 });
    }

    // 2. Identify the logical source group
    const logicalSourceId = fileToRestore.file_role === "Source" ? fileToRestore.id : fileToRestore.source_file_id;
    if (!logicalSourceId) {
      return NextResponse.json({ error: "Cannot identify logical source group for this file." }, { status: 400 });
    }

    // 3. Find the highest version number currently in this group
    const { data: versionFiles, error: verErr } = await adminClient
      .from("asset_files")
      .select("version_number")
      .eq("source_file_id", logicalSourceId);

    if (verErr) {
      return NextResponse.json({ error: "Failed to determine next version number." }, { status: 500 });
    }

    let maxVersion = 1;
    for (const v of versionFiles || []) {
      if (v.version_number && v.version_number > maxVersion) {
        maxVersion = v.version_number;
      }
    }
    const nextVersionNumber = maxVersion + 1;

    // 4. Get the asset's storage locations (to find the Versions folder)
    const { data: location, error: locErr } = await adminClient
      .from("asset_storage_locations")
      .select("versions_folder_id")
      .eq("asset_id", assetId)
      .single();

    if (locErr || !location?.versions_folder_id) {
      return NextResponse.json({ error: "Asset storage locations not found." }, { status: 500 });
    }

    // 5. Connect to Drive and copy the file
    let driveClient;
    try {
      const { drive } = await getDriveClient();
      driveClient = drive;
    } catch {
      return NextResponse.json({ error: "Google Drive is not connected." }, { status: 400 });
    }

    // Construct the new filename (e.g. rabbit_model_v005.blend)
    const originalName = fileToRestore.original_file_name || fileToRestore.file_name;
    const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    const ext = originalName.substring(originalName.lastIndexOf(".")) || "";
    
    // Strip existing _vXXX from basename if present
    const cleanBaseName = baseName.replace(/_v\d{3}$/, '');
    const newFileName = `${cleanBaseName}_v${String(nextVersionNumber).padStart(3, '0')}${ext}`;

    const copyResult = await driveClient.files.copy({
      fileId: fileToRestore.drive_file_id,
      requestBody: {
        name: newFileName,
        parents: [location.versions_folder_id]
      }
    });

    if (!copyResult.data || !copyResult.data.id) {
      throw new Error("Google Drive API failed to copy the file.");
    }

    // 6. Create the new asset_files record
    const { data: newRecord, error: insertErr } = await adminClient
      .from("asset_files")
      .insert({
        asset_id: assetId,
        provider: "google_drive",
        drive_file_id: copyResult.data.id,
        drive_parent_folder_id: location.versions_folder_id,
        original_file_name: originalName,
        file_name: newFileName,
        file_url: "", // will need to be fetched if we want webViewLink, but copy doesn't return it by default
        file_format: fileToRestore.file_format,
        mime_type: fileToRestore.mime_type,
        extension: fileToRestore.extension,
        file_size_bytes: fileToRestore.file_size_bytes,
        file_role: "Versions",
        version_number: nextVersionNumber,
        record_status: "Active",
        source_file_id: logicalSourceId,
        restored_from_file_id: fileToRestore.id,
      })
      .select("*")
      .single();

    if (insertErr || !newRecord) {
      console.error("Failed to insert restored file record", insertErr);
      return NextResponse.json({ error: "Failed to create new file record." }, { status: 500 });
    }

    // 7. Make it the current file
    const { error: makeCurrentErr } = await adminClient
      .from("asset_files")
      .update({ current_file_id: newRecord.id })
      .eq("id", logicalSourceId)
      .eq("file_role", "Source");

    if (makeCurrentErr) {
      console.error("Failed to update current file pointer", makeCurrentErr);
      // We don't fail the whole request since the file was restored successfully, just log error
    }

    return NextResponse.json({ success: true, file: newRecord });
  } catch (error) {
    console.error("Restore file error", error);
    const message = error instanceof Error ? error.message : "Failed to restore file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
