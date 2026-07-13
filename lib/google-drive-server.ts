import { drive_v3, google } from "googleapis";
import { getAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/encryption";
import type { Database } from "@/types/supabase";

export async function getDriveClient(): Promise<{ drive: drive_v3.Drive; rootFolderId: string }> {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from("storage_connections")
    .select("encrypted_refresh_token, root_folder_id")
    .eq("provider", "google_drive")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Google Drive connection not found");
  }

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google Drive configuration");
  }

  const refreshToken = decryptToken(data.encrypted_refresh_token);

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const rootFolderId = data.root_folder_id;
  if (!rootFolderId) {
    throw new Error("Google Drive root folder ID not found. Please reconnect.");
  }

  return { drive: google.drive({ version: "v3", auth: oauth2Client }), rootFolderId };
}

function sanitizeFolderName(name: string): string {
  // Drive folder names can contain many things, but we should sanitize out things like slashes
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim();
}

export async function getOrCreateFolder(drive: drive_v3.Drive, parentId: string, folderName: string): Promise<string> {
  const sanitized = sanitizeFolderName(folderName);
  // Escaping single quotes for the query
  const escapedName = sanitized.replace(/'/g, "\\'");
  const query = `('${parentId}' in parents) and (name = '${escapedName}') and (mimeType = 'application/vnd.google-apps.folder') and (trashed = false)`;
  
  const response = await drive.files.list({
    q: query,
    spaces: "drive",
    fields: "files(id, name)",
    pageSize: 1,
  });

  const files = response.data.files;
  if (files && files.length > 0 && files[0].id) {
    return files[0].id;
  }

  // Create it
  const createResponse = await drive.files.create({
    requestBody: {
      name: sanitized,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });

  if (!createResponse.data.id) {
    throw new Error(`Failed to create folder ${folderName}`);
  }

  return createResponse.data.id;
}

export async function getProjectIdForAsset(assetId: string): Promise<string | null> {
  const adminClient = getAdminClient();
  
  // 1. Direct project link
  const { data: projLink } = await adminClient.from("asset_project_links").select("project_id").eq("asset_id", assetId).limit(1).maybeSingle();
  if (projLink?.project_id) {
    console.log(`[getProjectIdForAsset] Found project link for asset ${assetId}: project_id=${projLink.project_id}`);
    return projLink.project_id;
  }
  
  // 2. Environment link
  const { data: envLink } = await adminClient.from("asset_environment_links").select("environment_id").eq("asset_id", assetId).limit(1).maybeSingle();
  if (envLink?.environment_id) {
    console.log(`[getProjectIdForAsset] Found environment link for asset ${assetId}: env_id=${envLink.environment_id}`);
    const { data: env } = await adminClient.from("production_environments").select("project_id").eq("id", envLink.environment_id).single();
    if (env?.project_id) return env.project_id;
  }
  
  // 3. Job (Episode) link
  const { data: jobLink } = await adminClient.from("asset_job_links").select("episode_id").eq("asset_id", assetId).limit(1).maybeSingle();
  if (jobLink?.episode_id) {
    const { data: episode } = await adminClient.from("episodes").select("environment_id").eq("id", jobLink.episode_id).single();
    if (episode?.environment_id) {
       const { data: env } = await adminClient.from("production_environments").select("project_id").eq("id", episode.environment_id).single();
       if (env?.project_id) return env.project_id;
    }
  }

  // 4. Scene link
  const { data: sceneLink } = await adminClient.from("asset_scene_links").select("scene_id").eq("asset_id", assetId).limit(1).maybeSingle();
  if (sceneLink?.scene_id) {
    const { data: scene } = await adminClient.from("scenes").select("episode_id").eq("id", sceneLink.scene_id).single();
    if (scene?.episode_id) {
      const { data: episode } = await adminClient.from("episodes").select("environment_id").eq("id", scene.episode_id).single();
      if (episode?.environment_id) {
         const { data: env } = await adminClient.from("production_environments").select("project_id").eq("id", episode.environment_id).single();
         if (env?.project_id) return env.project_id;
      }
    }
  }
  
  console.log(`[getProjectIdForAsset] No project found for asset ${assetId}, returning null`);
  return null;
}

export type StorageLocation = Database["public"]["Tables"]["asset_storage_locations"]["Row"];

export async function resolveAssetStorageHierarchy(assetId: string): Promise<StorageLocation> {
  const adminClient = getAdminClient();
  
  // See if we already have it
  const { data: existingLoc, error: existingErr } = await adminClient
    .from("asset_storage_locations")
    .select("*")
    .eq("asset_id", assetId)
    .eq("provider", "google_drive")
    .maybeSingle();
    
  if (existingLoc) {
    return existingLoc;
  }
  
  if (existingErr && existingErr.code !== 'PGRST116') {
    throw new Error("Database error while checking existing storage location");
  }
  
  // We need to create it
  const { drive, rootFolderId } = await getDriveClient();
  
  // Get asset info with category and project links
  const { data: asset, error: assetErr } = await adminClient
    .from("assets")
    .select("asset_code, category_id")
    .eq("id", assetId)
    .single();
  
  if (assetErr || !asset) throw new Error("Asset not found");
  
  let categoryName = "Uncategorized";
  if (asset.category_id) {
    const { data: catData } = await adminClient.from("asset_categories").select("name").eq("id", asset.category_id).single();
    if (catData && catData.name) categoryName = catData.name;
  }

  const assetCode = asset.asset_code;
  
  let projectFolderId: string | null = null;
  let categoryFolderId: string | null = null;
  let parentForAsset: string;
  
  const projectId = await getProjectIdForAsset(assetId);
  
  if (projectId) {
    const { data: project } = await adminClient.from("projects").select("project_code").eq("id", projectId).single();
    
    if (project) {
      const projectsFolderId = await getOrCreateFolder(drive, rootFolderId, "Projects");
      projectFolderId = await getOrCreateFolder(drive, projectsFolderId, project.project_code);
      const assetsFolderId = await getOrCreateFolder(drive, projectFolderId, "Assets");
      categoryFolderId = await getOrCreateFolder(drive, assetsFolderId, categoryName);
      parentForAsset = categoryFolderId;
    } else {
      const globalLibraryId = await getOrCreateFolder(drive, rootFolderId, "Global Library");
      categoryFolderId = await getOrCreateFolder(drive, globalLibraryId, categoryName);
      parentForAsset = categoryFolderId;
    }
  } else {
    const globalLibraryId = await getOrCreateFolder(drive, rootFolderId, "Global Library");
    categoryFolderId = await getOrCreateFolder(drive, globalLibraryId, categoryName);
    parentForAsset = categoryFolderId;
  }
  
  const assetFolderId = await getOrCreateFolder(drive, parentForAsset, assetCode);
  const sourceFolderId = await getOrCreateFolder(drive, assetFolderId, "Source");
  const previewFolderId = await getOrCreateFolder(drive, assetFolderId, "Preview");
  const versionsFolderId = await getOrCreateFolder(drive, assetFolderId, "Versions");
  
  const locationRecord = {
    asset_id: assetId,
    provider: "google_drive",
    root_folder_id: rootFolderId,
    project_folder_id: projectFolderId,
    category_folder_id: categoryFolderId,
    asset_folder_id: assetFolderId,
    source_folder_id: sourceFolderId,
    preview_folder_id: previewFolderId,
    versions_folder_id: versionsFolderId
  };
  
  const { data: insertedLoc, error: insertErr } = await adminClient
    .from("asset_storage_locations")
    .insert(locationRecord)
    .select("*")
    .single();
  
  if (insertErr || !insertedLoc) throw new Error("Failed to save storage location: " + insertErr?.message);
  
  return insertedLoc;
}

export async function moveAssetFolderInDrive(assetId: string): Promise<StorageLocation | null> {
  const adminClient = getAdminClient();
  
  // 1. Get existing location. If none exists, nothing to move yet (it will be created correctly when files are uploaded).
  const { data: existingLoc, error: existingErr } = await adminClient
    .from("asset_storage_locations")
    .select("*")
    .eq("asset_id", assetId)
    .eq("provider", "google_drive")
    .maybeSingle();

  if (!existingLoc || existingErr) {
    console.log(`[moveAssetFolderInDrive] No existing storage location for asset ${assetId}`);
    return null;
  }

  // 2. Get current required project_id
  const projectId = await getProjectIdForAsset(assetId);
  console.log(`[moveAssetFolderInDrive] Asset ${assetId}: resolved projectId=${projectId}, current category_folder_id=${existingLoc.category_folder_id}`);

  // Get asset info with category
  const { data: asset, error: assetErr } = await adminClient
    .from("assets")
    .select("asset_code, category_id")
    .eq("id", assetId)
    .single();

  if (assetErr || !asset) return existingLoc;

  let categoryName = "Uncategorized";
  if (asset.category_id) {
    const { data: catData } = await adminClient.from("asset_categories").select("name").eq("id", asset.category_id).single();
    if (catData && catData.name) categoryName = catData.name;
  }

  const { drive, rootFolderId } = await getDriveClient();

  let newProjectFolderId: string | null = null;
  let newCategoryFolderId: string | null = null;
  let newParentForAsset: string;

  if (projectId) {
    const { data: project } = await adminClient.from("projects").select("project_code").eq("id", projectId).single();
    
    if (project) {
      const projectsFolderId = await getOrCreateFolder(drive, rootFolderId, "Projects");
      newProjectFolderId = await getOrCreateFolder(drive, projectsFolderId, project.project_code);
      const assetsFolderId = await getOrCreateFolder(drive, newProjectFolderId, "Assets");
      newCategoryFolderId = await getOrCreateFolder(drive, assetsFolderId, categoryName);
      newParentForAsset = newCategoryFolderId;
    } else {
      const globalLibraryId = await getOrCreateFolder(drive, rootFolderId, "Global Library");
      newCategoryFolderId = await getOrCreateFolder(drive, globalLibraryId, categoryName);
      newParentForAsset = newCategoryFolderId;
    }
  } else {
    const globalLibraryId = await getOrCreateFolder(drive, rootFolderId, "Global Library");
    newCategoryFolderId = await getOrCreateFolder(drive, globalLibraryId, categoryName);
    newParentForAsset = newCategoryFolderId;
  }

  // 3. Compare current parent with intended parent
  console.log(`[moveAssetFolderInDrive] Asset ${assetId}: existingCategoryFolder=${existingLoc.category_folder_id}, newParent=${newParentForAsset}, needsMove=${existingLoc.category_folder_id !== newParentForAsset}`);
  if (existingLoc.category_folder_id !== newParentForAsset) {
    // We need to move the asset folder
    try {
      console.log(`[moveAssetFolderInDrive] Moving folder ${existingLoc.asset_folder_id} from ${existingLoc.category_folder_id} to ${newParentForAsset}`);
      const moveResult = await drive.files.update({
        fileId: existingLoc.asset_folder_id,
        addParents: newParentForAsset,
        removeParents: existingLoc.category_folder_id || undefined,
        fields: "id, parents"
      });
      console.log(`[moveAssetFolderInDrive] Drive move result: status=${moveResult.status}, parents=${JSON.stringify(moveResult.data.parents)}`);

      // Update the DB record
      const { data: updatedLoc, error: updateErr } = await adminClient
        .from("asset_storage_locations")
        .update({
          project_folder_id: newProjectFolderId,
          category_folder_id: newCategoryFolderId,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingLoc.id)
        .select("*")
        .single();

      if (updateErr) throw new Error("Failed to update storage location record");
      console.log(`[moveAssetFolderInDrive] DB updated. New category_folder_id=${updatedLoc?.category_folder_id}`);
      return updatedLoc;

    } catch (error) {
      console.error("Failed to move asset folder in Google Drive:", error);
      // Even if move fails, return the existing location so we don't break the app
      return existingLoc;
    }
  }

  return existingLoc;
}
