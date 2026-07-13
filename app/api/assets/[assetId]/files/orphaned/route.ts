import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDriveClient } from "@/lib/google-drive-server";
import { checkDriveAccess } from "@/lib/deployment";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  try {
    const { assetId } = await params;
    const adminClient = getAdminClient();

    // 1. Get known drive_file_ids for this asset
    const { data: files, error: filesErr } = await adminClient
      .from("asset_files")
      .select("drive_file_id")
      .eq("asset_id", assetId)
      .not("drive_file_id", "is", null);

    if (filesErr || !files) {
      return NextResponse.json({ error: "Unable to load asset files." }, { status: 500 });
    }

    const knownIds = new Set(files.map(f => f.drive_file_id));

    // 2. Get asset folders
    const { data: location, error: locErr } = await adminClient
      .from("asset_storage_locations")
      .select("*")
      .eq("asset_id", assetId)
      .single();

    if (locErr || !location) {
       return NextResponse.json({ error: "Asset storage locations not found." }, { status: 404 });
    }

    const foldersToCheck = [
      location.source_folder_id,
      location.preview_folder_id,
      location.versions_folder_id
    ].filter(Boolean);

    if (foldersToCheck.length === 0) {
      return NextResponse.json({ success: true, orphanedFiles: [] });
    }

    // 3. Search Drive
    let driveClient;
    try {
      const { drive } = await getDriveClient();
      driveClient = drive;
    } catch {
      return NextResponse.json({ error: "Google Drive is not connected." }, { status: 400 });
    }

    const orphanedFiles = [];
    
    // We do one search query per folder to avoid overly complex queries
    for (const folderId of foldersToCheck) {
      if (!folderId) continue;
      
      let pageToken: string | undefined = undefined;
      do {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await driveClient.files.list({
          q: `'${folderId}' in parents and trashed=false`,
          fields: "nextPageToken, files(id, name, mimeType, webViewLink, createdTime, size)",
          pageToken: pageToken,
          pageSize: 100
        });

        const driveFiles = response.data.files || [];
        for (const df of driveFiles) {
          // If it's a folder, skip it (unless we want to track subfolders?)
          if (df.mimeType === "application/vnd.google-apps.folder") continue;
          
          if (df.id && !knownIds.has(df.id)) {
            let role = "Unknown";
            if (folderId === location.source_folder_id) role = "Source";
            else if (folderId === location.preview_folder_id) role = "Preview";
            else if (folderId === location.versions_folder_id) role = "Versions";
            
            orphanedFiles.push({
              id: df.id,
              name: df.name,
              mimeType: df.mimeType,
              url: df.webViewLink,
              createdTime: df.createdTime,
              sizeBytes: df.size ? parseInt(df.size, 10) : 0,
              location: role,
              folderId: folderId
            });
          }
        }
        
        pageToken = response.data.nextPageToken || undefined;
      } while (pageToken);
    }

    return NextResponse.json({ success: true, orphanedFiles });

  } catch (error) {
    console.error("Orphaned files error", error);
    const message = error instanceof Error ? error.message : "Failed to find orphaned files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
