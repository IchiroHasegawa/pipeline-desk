import { NextRequest, NextResponse } from "next/server";
import { renameFileLabel } from "@/lib/data/productionRepository";
import { checkDriveAccess } from "@/lib/deployment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string; assetFileId: string }> }
) {
  const driveAccess = await checkDriveAccess();
  if (!driveAccess.allowed) {
    return NextResponse.json({ error: driveAccess.error }, { status: 403 });
  }
  try {
    const { assetFileId } = await params;
    const body = await request.json();
    
    if (!body.displayName) {
       return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }

    await renameFileLabel(assetFileId, body.displayName);

    return NextResponse.json({ success: true, message: "File renamed successfully" });
  } catch (error) {
    console.error("Rename file error", error);
    const message = error instanceof Error ? error.message : "Failed to rename file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
