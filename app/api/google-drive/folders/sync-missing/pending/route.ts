import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unavailable in production" }, { status: 403 });
  }

  try {
    const adminClient = getAdminClient();
    
    // Check Drive connection
    const { data: conn } = await adminClient
      .from("storage_connections")
      .select("status")
      .eq("provider", "google_drive")
      .maybeSingle();

    if (!conn || conn.status !== "Connected") {
      return NextResponse.json({ error: "Drive not connected" }, { status: 400 });
    }

    const { data: locations } = await adminClient.from("asset_storage_locations").select("asset_id").eq("provider", "google_drive");
    const locationAssetIds = new Set(locations?.map(l => l.asset_id) || []);

    const { data: assets } = await adminClient.from("assets").select("id");
    const missingAssetIds = (assets || []).filter(a => !locationAssetIds.has(a.id)).map(a => a.id);

    return NextResponse.json({ pendingAssetIds: missingAssetIds });
  } catch (err: unknown) {
    console.error("Fetch pending folders error:", err);
    return NextResponse.json({ error: "Failed to fetch pending assets" }, { status: 500 });
  }
}
