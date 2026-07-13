import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDriveClient } from "@/lib/google-drive-server";
import { checkDriveAccess } from "@/lib/deployment";

export async function GET(req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  try {
    const { assetId } = await params;
    
    const adminClient = getAdminClient();
    
    // Load the Asset to resolve primary Preview Drive file ID
    const { data: asset, error: assetErr } = await adminClient
      .from("assets")
      .select("preview_url")
      .eq("id", assetId)
      .single();

    if (assetErr || !asset || !asset.preview_url) {
      return new NextResponse("Preview not found", { status: 404 });
    }

    const driveFileId = asset.preview_url;

    const { drive } = await getDriveClient();

    // Get file metadata to verify it exists, get mimeType and verify ownership isn't easily doable
    // unless we check if it is in the Preview folder of this asset.
    // However, the prompt says "verify the file belongs to the selected Asset".
    // We already trust the preview_url column on the Asset because it is only set by our own code.
    // We can also query asset_storage_locations to ensure its parent is the preview_folder_id.
    const { data: loc } = await adminClient
      .from("asset_storage_locations")
      .select("preview_folder_id")
      .eq("asset_id", assetId)
      .maybeSingle();

    const fileMetaResponse = await drive.files.get({
      fileId: driveFileId,
      fields: "id, mimeType, parents, trashed",
    });

    const fileMeta = fileMetaResponse.data;

    if (fileMeta.trashed) {
      return new NextResponse("File is trashed", { status: 404 });
    }

    // Verify it belongs to the preview folder
    if (loc && loc.preview_folder_id && (!fileMeta.parents || !fileMeta.parents.includes(loc.preview_folder_id))) {
       // If it doesn't belong to the preview folder, it might be a legacy or invalid preview.
       // The prompt says "verify the file belongs to the selected Asset". 
       // We can reject it or just assume if it's in the DB it's fine, but let's be strict.
       return new NextResponse("File does not belong to the asset preview folder", { status: 403 });
    }

    // Stream the file content
    const response = await drive.files.get(
      { fileId: driveFileId, alt: "media" },
      { responseType: "stream" }
    );

    // Provide cache control (safe private caching)
    const headers = new Headers();
    headers.set("Content-Type", fileMeta.mimeType || "application/octet-stream");
    headers.set("Cache-Control", "private, max-age=3600"); // 1 hour private cache

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new NextResponse(response.data as any, { headers });

  } catch (err: unknown) {
    console.error("Preview proxy error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
