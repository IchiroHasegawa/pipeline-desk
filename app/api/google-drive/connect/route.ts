import { NextResponse } from "next/server";
import { google } from "googleapis";
import crypto from "crypto";
import { checkDriveAccess } from "@/lib/deployment";

export async function GET() {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Missing Google Drive environment variables" },
      { status: 500 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const state = crypto.randomBytes(32).toString("hex");

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    state: state,
    prompt: "consent",
  });

  const response = NextResponse.redirect(url);
  
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: false, // Since this route is development only
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
