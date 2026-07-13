import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkDriveAccess } from "@/lib/deployment";

export async function GET() {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("storage_connections")
      .select("status, last_connected_at, account_label, root_folder_id")
      .eq("provider", "google_drive")
      .maybeSingle();

    if (error) {
      console.error("Status fetch error", error);
      return NextResponse.json({ status: "Error" });
    }

    if (!data) {
      return NextResponse.json({ status: "Disconnected" });
    }

    return NextResponse.json({
      status: data.status,
      last_connected_at: data.last_connected_at,
      account_label: data.account_label,
      root_folder_id: data.root_folder_id,
    });
  } catch (err) {
    console.error("Status route error", err);
    return NextResponse.json({ status: "Error" }, { status: 500 });
  }
}
