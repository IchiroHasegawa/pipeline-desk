import { NextResponse } from "next/server";
import { getDriveClient, resolveAssetStorageHierarchy } from "@/lib/google-drive-server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Google Drive uploads are disabled in production" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { assetId, driveFileId, expectedDestination } = body;

    if (!assetId || !driveFileId || !expectedDestination) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["Source", "Preview", "Versions"].includes(expectedDestination)) {
      return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
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

    // Do not create the record before successful verification (we just verified it)
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
      upload_status: "Complete"
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
