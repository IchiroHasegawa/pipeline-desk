import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkDriveAccess } from "@/lib/deployment";

export async function POST() {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  try {
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from("storage_connections")
      .delete()
      .eq("provider", "google_drive");

    if (error) {
      console.error("Disconnect delete error", error);
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Disconnect route error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
