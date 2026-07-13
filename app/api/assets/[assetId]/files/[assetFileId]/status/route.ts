import { NextRequest, NextResponse } from "next/server";
import { updateFileRecordStatus } from "@/lib/data/productionRepository";
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
    
    if (!body.status || !["Active", "Retired", "Trashed", "Missing"].includes(body.status)) {
       return NextResponse.json({ error: "Invalid status provided" }, { status: 400 });
    }

    await updateFileRecordStatus(assetFileId, body.status);

    return NextResponse.json({ success: true, message: `File status updated to ${body.status}` });
  } catch (error) {
    console.error("Status update error", error);
    const message = error instanceof Error ? error.message : "Failed to update file status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
