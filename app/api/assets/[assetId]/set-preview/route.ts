import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unavailable in production" }, { status: 403 });
  }

  try {
    const { assetId } = await params;
    const { driveFileId } = await req.json();

    if (!driveFileId) {
      return NextResponse.json({ error: "driveFileId is required" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    
    const { error } = await adminClient
      .from("assets")
      .update({ preview_url: driveFileId, updated_at: new Date().toISOString() })
      .eq("id", assetId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Set preview error:", err);
    return NextResponse.json({ error: "Failed to set asset preview" }, { status: 500 });
  }
}
