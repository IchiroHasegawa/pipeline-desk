import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDriveClient } from "@/lib/google-drive-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const assetId = (await params).assetId;
    if (!assetId) {
      return NextResponse.json({ error: "Missing assetId" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // Find the storage location
    const { data: storageLoc } = await adminClient
      .from("asset_storage_locations")
      .select("asset_folder_id")
      .eq("asset_id", assetId)
      .eq("provider", "google_drive")
      .maybeSingle();

    if (storageLoc && storageLoc.asset_folder_id) {
      try {
        const { drive } = await getDriveClient();
        await drive.files.delete({ fileId: storageLoc.asset_folder_id });
      } catch (driveErr: unknown) {
        // If it's a 404, it's already deleted in drive. If it's auth failure, we still want to delete the DB record.
        console.error("Failed to delete from Drive (or drive not connected), proceeding with DB deletion anyway:", driveErr);
      }
    }

    // Now delete from Supabase
    const { error: dbError } = await adminClient
      .from("assets")
      .delete()
      .eq("id", assetId);

    if (dbError) {
      return NextResponse.json({ error: "Failed to delete asset from database: " + dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete asset error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
