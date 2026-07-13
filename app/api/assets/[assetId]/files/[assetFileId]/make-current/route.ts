import { NextRequest, NextResponse } from "next/server";
import { makeFileCurrent } from "@/lib/data/productionRepository";
import { getAdminClient } from "@/lib/supabase/admin";
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
    
    const adminClient = getAdminClient();
    const { data: file, error } = await adminClient
       .from("asset_files")
       .select("source_file_id, file_role")
       .eq("id", assetFileId)
       .single();
       
    if (error || !file) {
       return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    const sourceId = file.file_role === "Source" ? assetFileId : file.source_file_id;
    if (!sourceId) {
       return NextResponse.json({ error: "Cannot identify logical source group for this file." }, { status: 400 });
    }

    await makeFileCurrent(sourceId, assetFileId);

    return NextResponse.json({ success: true, message: "File set as current successfully" });
  } catch (error) {
    console.error("Make current error", error);
    const message = error instanceof Error ? error.message : "Failed to set file as current";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
