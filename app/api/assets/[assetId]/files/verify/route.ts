import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getDriveClient } from "@/lib/google-drive-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Google Drive operations are disabled in production" }, { status: 403 });
  }

  try {
    const { assetId } = await params;
    const adminClient = getAdminClient();

    // Verify Asset exists
    const { data: asset, error: assetErr } = await adminClient
      .from("assets")
      .select("id")
      .eq("id", assetId)
      .single();

    if (assetErr || !asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    // Load all files for this asset that have a drive_file_id
    const { data: files, error: filesErr } = await adminClient
      .from("asset_files")
      .select("id, drive_file_id, record_status")
      .eq("asset_id", assetId)
      .not("drive_file_id", "is", null);

    if (filesErr || !files) {
      return NextResponse.json({ error: "Unable to load asset files." }, { status: 500 });
    }

    if (files.length === 0) {
      return NextResponse.json({ success: true, message: "No files to verify." });
    }

    let driveClient;
    try {
      const { drive } = await getDriveClient();
      driveClient = drive;
    } catch {
      return NextResponse.json({ error: "Google Drive is not connected." }, { status: 400 });
    }

    const maxConcurrency = 3;
    const results = [];
    
    // Process in batches
    for (let i = 0; i < files.length; i += maxConcurrency) {
      const batch = files.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (file) => {
        try {
          const response = await driveClient.files.get({
            fileId: file.drive_file_id!,
            fields: "id, trashed",
          });
          
          if (response.data.trashed && file.record_status !== "Missing" && file.record_status !== "Trashed") {
            // Update to Trashed
            await adminClient
              .from("asset_files")
              .update({ record_status: "Trashed" })
              .eq("id", file.id);
            return { id: file.id, status: "Trashed" };
          } else if (!response.data.trashed && (file.record_status === "Missing" || file.record_status === "Trashed")) {
            // Recovered
            await adminClient
              .from("asset_files")
              .update({ record_status: "Active" })
              .eq("id", file.id);
            return { id: file.id, status: "Active" };
          }
          return { id: file.id, status: file.record_status };
        } catch (err: unknown) {
          if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404 && file.record_status !== "Missing") {
            // Missing
            await adminClient
              .from("asset_files")
              .update({ record_status: "Missing" })
              .eq("id", file.id);
            return { id: file.id, status: "Missing" };
          }
          return { id: file.id, status: file.record_status }; // Keep current if other error
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error("Verify files error:", error);
    return NextResponse.json({ error: "Unable to verify files." }, { status: 500 });
  }
}
