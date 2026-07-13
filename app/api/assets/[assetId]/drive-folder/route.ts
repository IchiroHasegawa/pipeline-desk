import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDriveClient, resolveAssetStorageHierarchy } from "@/lib/google-drive-server";
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

    // Verify Asset exists
    const { data: asset, error: assetErr } = await adminClient
      .from("assets")
      .select("id")
      .eq("id", assetId)
      .single();

    if (assetErr || !asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    // Verify Google Drive connection
    let driveClient;
    try {
      const { drive } = await getDriveClient();
      driveClient = drive;
    } catch {
      return NextResponse.json({ error: "Google Drive is not connected." }, { status: 400 });
    }

    // Load storage location
    const location = await resolveAssetStorageHierarchy(assetId);

    // Retrieve fresh Drive metadata
    let driveFolder;
    try {
      const response = await driveClient.files.get({
        fileId: location.asset_folder_id,
        fields: "id, mimeType, trashed, webViewLink",
      });
      driveFolder = response.data;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
        return NextResponse.json({ error: "The asset folder no longer exists in Google Drive." }, { status: 404 });
      }
      return NextResponse.json({ error: "Unable to open the asset folder." }, { status: 500 });
    }

    // Verify it is a folder and not trashed
    if (driveFolder.trashed) {
      return NextResponse.json({ error: "The asset folder no longer exists in Google Drive." }, { status: 404 });
    }

    if (driveFolder.mimeType !== "application/vnd.google-apps.folder") {
      return NextResponse.json({ error: "Unable to open the asset folder." }, { status: 403 });
    }

    if (!driveFolder.webViewLink) {
      return NextResponse.json({ error: "Unable to open the asset folder." }, { status: 500 });
    }

    // Redirect to webViewLink
    return NextResponse.redirect(driveFolder.webViewLink);

  } catch (error) {
    console.error("Open asset folder error:", error);
    return NextResponse.json({ error: "Unable to open the asset folder." }, { status: 500 });
  }
}
