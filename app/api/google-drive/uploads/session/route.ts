import { NextResponse } from "next/server";
import { getDriveClient, resolveAssetStorageHierarchy } from "@/lib/google-drive-server";
import { Auth } from "googleapis";

const BLOCKED_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".ps1", ".vbs", ".js"];
const PREVIEW_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Google Drive uploads are disabled in production" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { assetId, fileName, mimeType, sizeBytes, destination } = body;

    if (!assetId || !fileName || !mimeType || sizeBytes === undefined || !destination) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["Source", "Preview", "Versions"].includes(destination)) {
      return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
    }

    const extension = fileName.includes('.') ? "." + fileName.split('.').pop()?.toLowerCase() : "";

    if (BLOCKED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: "This file type is not allowed." }, { status: 400 });
    }

    if (destination === "Preview" && !PREVIEW_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: "Preview destination only accepts image files (.png, .jpg, .jpeg, .webp)." }, { status: 400 });
    }

    // Resolve or create folder hierarchy
    const location = await resolveAssetStorageHierarchy(assetId);
    
    let parentFolderId: string;
    if (destination === "Source") parentFolderId = location.source_folder_id;
    else if (destination === "Preview") parentFolderId = location.preview_folder_id;
    else parentFolderId = location.versions_folder_id;

    const { drive } = await getDriveClient();
    const authClient = drive.context._options.auth as unknown as Auth.OAuth2Client;

    if (!authClient) {
      return NextResponse.json({ error: "Authentication client not configured" }, { status: 500 });
    }

    // Initiate resumable upload session
    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
    
    const referer = req.headers.get("referer");
    const origin = req.headers.get("origin") || (referer ? new URL(referer).origin : "http://localhost:3000");

    // We send a POST request with the metadata to get the session URI
    const response = await authClient.request({
      url,
      method: "POST",
      headers: {
        "X-Upload-Content-Type": mimeType,
        "X-Upload-Content-Length": sizeBytes.toString(),
        "Content-Type": "application/json; charset=UTF-8",
        "Origin": origin
      },
      data: {
        name: fileName,
        parents: [parentFolderId],
        mimeType: mimeType
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headers = response.headers as any;
    let sessionUri = headers.location || headers.Location || headers["x-goog-upload-url"];
    if (!sessionUri && typeof headers.get === "function") {
      sessionUri = headers.get("location") || headers.get("Location") || headers.get("x-goog-upload-url");
    }

    if (!sessionUri) {
      throw new Error("Google Drive did not return an upload session URI.");
    }

    return NextResponse.json({ sessionUri });

  } catch (err) {
    console.error("Upload session creation error", err);
    return NextResponse.json({ error: "Unable to begin upload." }, { status: 500 });
  }
}
