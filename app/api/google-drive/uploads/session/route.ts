import { NextResponse } from "next/server";
import { getDriveClient, resolveAssetStorageHierarchy } from "@/lib/google-drive-server";
import { Auth } from "googleapis";
import { checkDriveAccess } from "@/lib/deployment";

const BLOCKED_EXTENSIONS = [".exe", ".msi", ".bat", ".cmd", ".com", ".scr", ".ps1", ".vbs", ".js"];
const PREVIEW_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

export async function POST(req: Request) {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { assetId, fileName, mimeType, sizeBytes, destination, sourceFileId } = body;

    if (!assetId || !fileName || !mimeType || sizeBytes === undefined || !destination) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["Source", "Preview", "Versions"].includes(destination)) {
      return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
    }

    if (destination === "Versions" && !sourceFileId) {
      return NextResponse.json({ error: "Missing sourceFileId for version upload" }, { status: 400 });
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

    let driveFileName = fileName;
    
    if (destination === "Versions" && sourceFileId) {
      // Determine version number for Drive file name
      const { getAdminClient } = await import("@/lib/supabase/admin");
      const adminClient = getAdminClient();
      
      const { data: maxVerData } = await adminClient
        .from("asset_files")
        .select("version_number")
        .eq("source_file_id", sourceFileId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextVersion = (maxVerData?.version_number || 1) + 1;
      // Also get original source name to preserve base name if we want, but using new name base + version is okay too.
      // Let's use the original source base name for consistency
      const { data: sourceFile } = await adminClient.from("asset_files").select("original_file_name, file_name").eq("id", sourceFileId).single();
      const baseNameStr = sourceFile?.original_file_name || sourceFile?.file_name || fileName;
      const baseNameWithoutExt = baseNameStr.includes('.') ? baseNameStr.substring(0, baseNameStr.lastIndexOf('.')) : baseNameStr;
      
      driveFileName = `${baseNameWithoutExt}_v${nextVersion.toString().padStart(3, '0')}${extension}`;
    }

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
        name: driveFileName,
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
