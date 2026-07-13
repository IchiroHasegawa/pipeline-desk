import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDriveClient, resolveAssetStorageHierarchy } from "@/lib/google-drive-server";
import { checkDriveAccess } from "@/lib/deployment";

export async function GET(
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

    // 1. Load the asset_files record
    const { data: fileRecord, error: fileErr } = await adminClient
      .from("asset_files")
      .select("asset_id, drive_file_id, file_role, original_file_name, mime_type, file_size_bytes")
      .eq("id", assetFileId)
      .single();

    if (fileErr || !fileRecord) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // 3. Verify asset_id matches
    if (fileRecord.asset_id !== assetId) {
      return NextResponse.json({ error: "File does not belong to this asset." }, { status: 403 });
    }

    if (!fileRecord.drive_file_id) {
      return NextResponse.json({ error: "This file no longer exists in Google Drive." }, { status: 404 });
    }

    // 4. Verify Google Drive connection
    let driveClient;
    try {
      const { drive } = await getDriveClient();
      driveClient = drive;
    } catch {
      return NextResponse.json({ error: "Google Drive is not connected." }, { status: 400 });
    }

    // Resolve storage hierarchy
    const location = await resolveAssetStorageHierarchy(assetId);
    let expectedParentId: string;
    if (fileRecord.file_role === "Source") expectedParentId = location.source_folder_id;
    else if (fileRecord.file_role === "Preview") expectedParentId = location.preview_folder_id;
    else expectedParentId = location.versions_folder_id;

    // 5. Retrieve fresh Drive metadata
    let driveFile;
    try {
      const response = await driveClient.files.get({
        fileId: fileRecord.drive_file_id,
        fields: "id, parents, trashed",
      });
      driveFile = response.data;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return NextResponse.json({ error: "This file no longer exists in Google Drive." }, { status: 404 });
      }
      return NextResponse.json({ error: "Unable to prepare the download." }, { status: 500 });
    }

    // 6. Verify conditions
    if (driveFile.trashed) {
      return NextResponse.json({ error: "This file no longer exists in Google Drive." }, { status: 404 });
    }

    if (!driveFile.parents || !driveFile.parents.includes(expectedParentId)) {
      return NextResponse.json({ error: "Unable to prepare the download." }, { status: 403 });
    }

    // 7. Download binary file content from Google Drive and stream it
    const dlResponse = await driveClient.files.get(
      { fileId: fileRecord.drive_file_id, alt: "media" },
      { responseType: "stream" }
    );

    const fileName = fileRecord.original_file_name || "download";
    const sanitizedFileName = encodeURIComponent(fileName.replace(/[^\x20-\x7E]/g, ''));

    const headers = new Headers();
    headers.set("Content-Type", fileRecord.mime_type || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${sanitizedFileName}"`);
    if (fileRecord.file_size_bytes) {
      headers.set("Content-Length", fileRecord.file_size_bytes.toString());
    }

    // Cast the node stream to a web stream
    const webStream = new ReadableStream({
      start(controller) {
        dlResponse.data.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        dlResponse.data.on('end', () => controller.close());
        dlResponse.data.on('error', (err: Error) => controller.error(err));
      }
    });

    return new NextResponse(webStream, { headers });

  } catch (error) {
    console.error("Download file error:", error);
    return NextResponse.json({ error: "Unable to prepare the download." }, { status: 500 });
  }
}
