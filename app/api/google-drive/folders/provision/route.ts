import { NextResponse } from "next/server";
import { resolveAssetStorageHierarchy } from "@/lib/google-drive-server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkDriveAccess } from "@/lib/deployment";

export async function POST(req: Request) {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  try {
    const { assetId } = await req.json();

    if (!assetId) {
      return NextResponse.json({ error: "assetId is required" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    
    // Check if Google Drive is connected first
    const { data: conn } = await adminClient
      .from("storage_connections")
      .select("status")
      .eq("provider", "google_drive")
      .maybeSingle();

    if (!conn || conn.status !== "Connected") {
      return NextResponse.json({ message: "Drive not connected. Folders skipped." }, { status: 200 });
    }

    const location = await resolveAssetStorageHierarchy(assetId);

    return NextResponse.json({ success: true, location });
  } catch (err: unknown) {
    console.error("Folder provisioning error:", err);
    // Return 200 even on failure so the client doesn't block the asset creation, 
    // but include success: false.
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to provision folders" 
    }, { status: 200 });
  }
}
