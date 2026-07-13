import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { encryptToken } from "@/lib/encryption";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unavailable in production" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/settings?error=" + encodeURIComponent(error), request.url));
  }

  const savedState = request.cookies.get("google_oauth_state")?.value;

  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/settings?error=invalid_state", request.url));
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/settings?error=missing_env", request.url));
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code!);
    
    if (!tokens.refresh_token) {
      // If no refresh token, they might have already authorized and Google didn't send a new one.
      // But we require offline access and consent, so it usually sends one.
      return NextResponse.redirect(new URL("/settings?error=no_refresh_token", request.url));
    }

    oauth2Client.setCredentials(tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    // Find or create "Production OS" root folder
    let rootFolderId: string | null = null;
    
    const folderRes = await drive.files.list({
      q: "name = 'Production OS' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (folderRes.data.files && folderRes.data.files.length > 0) {
      rootFolderId = folderRes.data.files[0].id ?? null;
    } else {
      const createRes = await drive.files.create({
        requestBody: {
          name: "Production OS",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      rootFolderId = createRes.data.id ?? null;
    }

    const encryptedToken = encryptToken(tokens.refresh_token);
    
    // Attempt to get user info if possible for account_label, though drive.file doesn't grant email.
    // We will leave account_label null since we don't request email scope.
    const accountLabel = null; 

    const adminClient = getAdminClient();
    
    // Delete existing google_drive connections (assume 1 connection max)
    await adminClient.from("storage_connections").delete().eq("provider", "google_drive");

    const { error: insertError } = await adminClient.from("storage_connections").insert({
      provider: "google_drive",
      connection_name: "Google Drive",
      account_label: accountLabel,
      encrypted_refresh_token: encryptedToken,
      root_folder_id: rootFolderId,
      status: "Connected",
      last_connected_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.redirect(new URL("/settings?error=db_error", request.url));
    }

    const response = NextResponse.redirect(new URL("/settings", request.url));
    response.cookies.delete("google_oauth_state");
    return response;

  } catch (err) {
    console.error("OAuth error:", err);
    return NextResponse.redirect(new URL("/settings?error=oauth_failed", request.url));
  }
}
