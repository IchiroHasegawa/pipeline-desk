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

    // 1. Get asset details and all its file records
    const { data: asset, error: assetErr } = await adminClient
      .from("assets")
      .select("id, preview_url")
      .eq("id", assetId)
      .single();

    if (assetErr || !asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }

    const { data: files, error: filesErr } = await adminClient
      .from("asset_files")
      .select("*")
      .eq("asset_id", assetId);

    if (filesErr || !files) {
      return NextResponse.json({ error: "Unable to load asset files." }, { status: 500 });
    }

    let driveClient;
    try {
      const { drive } = await getDriveClient();
      driveClient = drive;
    } catch {
      return NextResponse.json({ error: "Google Drive is not connected." }, { status: 400 });
    }

    const report = {
      verified: 0,
      trashed: 0,
      missing: 0,
      moved: 0,
      nameChanged: 0,
      metadataConflicts: 0,
      invalidCurrentFile: 0,
      invalidPrimaryPreview: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      details: [] as any[]
    };

    // 2. Check for duplicate drive_file_id metadata
    const driveIdCounts = new Map<string, string[]>();
    for (const file of files) {
      if (file.drive_file_id) {
        const existing = driveIdCounts.get(file.drive_file_id) || [];
        existing.push(file.id);
        driveIdCounts.set(file.drive_file_id, existing);
      }
    }
    
    for (const [driveId, ids] of driveIdCounts.entries()) {
      if (ids.length > 1) {
        report.metadataConflicts++;
        report.details.push({ type: "duplicate_metadata", driveFileId: driveId, recordIds: ids, message: "Multiple records point to the same Google Drive file." });
      }
    }

    // 3. Verify primary preview pointer
    if (asset.preview_url) {
      const previewFile = files.find(f => f.file_url === asset.preview_url);
      if (!previewFile) {
        report.invalidPrimaryPreview++;
        report.details.push({ type: "invalid_preview", message: "Asset primary preview URL points to a file that is not in the database." });
      }
    }

    // 4. Verify current-file pointer
    const sourceFiles = files.filter(f => f.file_role === "Source");
    for (const source of sourceFiles) {
      if (source.current_file_id) {
        const currentFile = files.find(f => f.id === source.current_file_id);
        if (!currentFile) {
          report.invalidCurrentFile++;
          report.details.push({ type: "invalid_current_file", recordId: source.id, message: `Source file points to a missing current_file_id: ${source.current_file_id}` });
        }
      }
    }

    // 5. Verify Drive state with limited concurrency
    const maxConcurrency = 3;
    const driveFiles = files.filter(f => f.drive_file_id);
    
    for (let i = 0; i < driveFiles.length; i += maxConcurrency) {
      const batch = driveFiles.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (file) => {
        try {
          const response = await driveClient.files.get({
            fileId: file.drive_file_id!,
            fields: "id, name, trashed, parents",
          });
          
          if (response.data.trashed) {
            report.trashed++;
            if (file.record_status !== "Trashed") {
               report.details.push({ type: "trashed_mismatch", recordId: file.id, name: file.file_name, message: "File is in Google Drive Trash but not marked Trashed in Production OS." });
            }
          } else {
            // Active file
            let isVerified = true;
            
            // Check name
            if (response.data.name !== file.file_name) {
              report.nameChanged++;
              report.details.push({ type: "name_changed", recordId: file.id, oldName: file.file_name, newName: response.data.name, message: "File name was changed directly in Google Drive." });
              isVerified = false;
            }
            
            // Check folder location
            if (file.drive_parent_folder_id && response.data.parents && !response.data.parents.includes(file.drive_parent_folder_id)) {
              report.moved++;
              report.details.push({ type: "moved_folder", recordId: file.id, name: file.file_name, expectedParent: file.drive_parent_folder_id, actualParents: response.data.parents, message: "File was moved to a different folder in Google Drive." });
              isVerified = false;
            }
            
            if (isVerified) {
               report.verified++;
               if (file.record_status === "Missing" || file.record_status === "Trashed") {
                  report.details.push({ type: "recovered", recordId: file.id, name: file.file_name, message: `File is marked as ${file.record_status} but exists properly in Google Drive.` });
               }
            }
          }
        } catch (err: unknown) {
          if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 404) {
             report.missing++;
             if (file.record_status !== "Missing") {
               report.details.push({ type: "missing", recordId: file.id, name: file.file_name, message: "Google Drive file is completely missing." });
             }
          } else {
             report.details.push({ type: "error", recordId: file.id, name: file.file_name, message: "Failed to access Google Drive API for this file." });
          }
        }
      });

      await Promise.all(batchPromises);
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Reconcile error", error);
    const message = error instanceof Error ? error.message : "Failed to reconcile files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
