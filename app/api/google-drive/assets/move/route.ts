import { NextResponse } from "next/server";
import { moveAssetFolderInDrive } from "@/lib/google-drive-server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Google Drive uploads are disabled in production" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { assetIds, removeAllLinks } = body as {
      assetIds: string[];
      removeAllLinks?: boolean;
    };

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ error: "Missing or invalid assetIds array" }, { status: 400 });
    }

    // When unassigning, remove ALL links for these assets so they return to Global Library
    if (removeAllLinks) {
      const adminClient = getAdminClient();

      for (const assetId of assetIds) {
        const { count: projCount } = await adminClient.from("asset_project_links")
          .delete({ count: "exact" }).eq("asset_id", assetId);
        const { count: envCount } = await adminClient.from("asset_environment_links")
          .delete({ count: "exact" }).eq("asset_id", assetId);
        const { count: jobCount } = await adminClient.from("asset_job_links")
          .delete({ count: "exact" }).eq("asset_id", assetId);
        const { count: sceneCount } = await adminClient.from("asset_scene_links")
          .delete({ count: "exact" }).eq("asset_id", assetId);

        console.log(`[move] Cleared ALL links for asset ${assetId}: proj=${projCount}, env=${envCount}, job=${jobCount}, scene=${sceneCount}`);
      }
    }

    const results = [];
    for (const assetId of assetIds) {
      const location = await moveAssetFolderInDrive(assetId);
      results.push({ assetId, location });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    console.error("Failed to move asset folders", err);
    const message = err instanceof Error ? err.message : "Failed to move asset folders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
