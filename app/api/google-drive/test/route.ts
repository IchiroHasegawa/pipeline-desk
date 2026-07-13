import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/encryption";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unavailable in production" }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
  }

  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("storage_connections")
      .select("encrypted_refresh_token, root_folder_id")
      .eq("provider", "google_drive")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const refreshToken = decryptToken(data.encrypted_refresh_token);

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // This forces a token refresh if needed and tests the API
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    if (data.root_folder_id) {
      // Check if folder is still accessible
      await drive.files.get({
        fileId: data.root_folder_id,
        fields: "id",
      });
    }

    // Update last_connected_at
    await adminClient
      .from("storage_connections")
      .update({
        status: "Connected",
        last_connected_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("provider", "google_drive");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Test route error", err);

    // Set status to Error
    try {
      const adminClient = getAdminClient();
      await adminClient
        .from("storage_connections")
        .update({
          status: "Error",
          last_error: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("provider", "google_drive");
    } catch (dbErr) {
      console.error("Failed to update status to Error", dbErr);
    }

    return NextResponse.json({ error: "Connection test failed" }, { status: 500 });
  }
}
