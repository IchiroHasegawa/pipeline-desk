import { NextResponse } from "next/server";
import { getDriveClient, resolveAssetStorageHierarchy } from "@/lib/google-drive-server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkDriveAccess } from "@/lib/deployment";

export async function POST(req: Request) {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { assetId, driveFileId, expectedDestination, sourceFileId } = body;

    if (!assetId || !driveFileId || !expectedDestination) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["Source", "Preview", "Versions"].includes(expectedDestination)) {
      return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
    }

    if (expectedDestination === "Versions" && !sourceFileId) {
      return NextResponse.json({ error: "Missing sourceFileId for version upload" }, { status: 400 });
    }

    // Resolve folder hierarchy to get expected parent folder ID
    const location = await resolveAssetStorageHierarchy(assetId);
    let expectedParentId: string;
    if (expectedDestination === "Source") expectedParentId = location.source_folder_id;
    else if (expectedDestination === "Preview") expectedParentId = location.preview_folder_id;
    else expectedParentId = location.versions_folder_id;

    const { drive } = await getDriveClient();

    // Verify file exists and we can access it
    const response = await drive.files.get({
      fileId: driveFileId,
      fields: "id, name, mimeType, size, parents, webViewLink, createdTime, trashed",
    });

    const fileMeta = response.data;

    if (fileMeta.trashed) {
      return NextResponse.json({ error: "File has been trashed." }, { status: 400 });
    }

    if (!fileMeta.parents || !fileMeta.parents.includes(expectedParentId)) {
      return NextResponse.json({ error: "File does not exist in the expected Asset folder." }, { status: 400 });
    }

    const fileName = fileMeta.name || "Untitled";
    const mimeType = fileMeta.mimeType || "application/octet-stream";
    const sizeBytes = parseInt(fileMeta.size || "0", 10);
    const extension = fileName.includes('.') ? "." + fileName.split('.').pop()?.toLowerCase() : "";

    const adminClient = getAdminClient();

    let versionNumber = expectedDestination === "Source" ? 1 : null;
    const actualSourceFileId = expectedDestination === "Versions" ? sourceFileId : null;

    if (expectedDestination === "Versions" && sourceFileId) {
      // Safely determine next version with a simple retry loop on conflict
      let retryCount = 0;
      const maxRetries = 3;
      let fileRecord = null;
      let fileErr = null;

      while (retryCount < maxRetries) {
        const { data: maxVerData } = await adminClient
          .from("asset_files")
          .select("version_number")
          .eq("source_file_id", sourceFileId)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();

        versionNumber = (maxVerData?.version_number || 1) + 1;

        const result = await adminClient.from("asset_files").insert({
          asset_id: assetId,
          provider: "google_drive",
          drive_file_id: driveFileId,
          drive_parent_folder_id: expectedParentId,
          original_file_name: fileName,
          file_name: fileName,
          file_url: fileMeta.webViewLink || "",
          file_format: mimeType,
          mime_type: mimeType,
          extension: extension,
          file_size_bytes: sizeBytes,
          file_role: expectedDestination,
          drive_created_time: fileMeta.createdTime,
          record_status: "Active",
          updated_at: new Date().toISOString(),
          source_file_id: actualSourceFileId,
          version_number: versionNumber
        }).select("*").single();

        if (result.error && result.error.code === '23505' && result.error.message.includes('asset_files_unique_version')) {
          retryCount++;
          // Wait a bit and try again
          await new Promise(r => setTimeout(r, 200 * retryCount));
          continue;
        }

        fileRecord = result.data;
        fileErr = result.error;
        break;
      }

      if (fileErr || !fileRecord) {
        console.error("Database error while finalizing file version", fileErr);
        return NextResponse.json({ error: "Unable to save Asset file information." }, { status: 500 });
      }

      return NextResponse.json({ file: fileRecord });
    }

    // Normal insertion for non-versions
    const { data: fileRecord, error: fileErr } = await adminClient.from("asset_files").insert({
      asset_id: assetId,
      provider: "google_drive",
      drive_file_id: driveFileId,
      drive_parent_folder_id: expectedParentId,
      original_file_name: fileName,
      file_name: fileName,
      file_url: fileMeta.webViewLink || "",
      file_format: mimeType,
      mime_type: mimeType,
      extension: extension,
      file_size_bytes: sizeBytes,
      file_role: expectedDestination,
      drive_created_time: fileMeta.createdTime,
      record_status: "Active",
      updated_at: new Date().toISOString(),
      source_file_id: null,
      version_number: versionNumber
    }).select("*").single();

    if (fileErr || !fileRecord) {
      console.error("Database error while finalizing file", fileErr);
      return NextResponse.json({ error: "Unable to save Asset file information." }, { status: 500 });
    }

    return NextResponse.json({ file: fileRecord });

  } catch (err) {
    console.error("Upload finalization error", err);
    return NextResponse.json({ error: "Unable to verify the uploaded file." }, { status: 500 });
  }
}
