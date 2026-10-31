import { AssetFile, type AssetFileDoc, type FileRole } from "@/lib/models/AssetFile";
import { AssetStorageLocation } from "@/lib/models/AssetStorageLocation";
import { requireActiveUser, type Actor } from "@/lib/permissions";
import { routeUpload, type StorageProvider } from "./router";
import { buildUploadTarget, type UploadTarget } from "./cloudinary";

/**
 * The seam between "where should this file go" and the two providers.
 *
 * Deciding and recording are separate calls because the upload happens in
 * between, directly from the browser to the provider — the server never holds
 * the bytes. `planUpload` hands out a narrow permission; `recordUploadedFile`
 * writes down what actually landed.
 */

export type UploadRequest = {
  assetId: string;
  fileRole: FileRole;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type UploadPlan = {
  provider: StorageProvider;
  reason: string;
  /**
   * True when the original is going to Drive and a Cloudinary preview should
   * be derived from it in the browser. Nothing consumes this until the UI
   * exists; it is the decision, recorded at the only point it can be made.
   */
  derivePreview: boolean;
  /** Present only when the file is going to Cloudinary. */
  cloudinary?: UploadTarget;
  /**
   * Present only when the file is going to Drive. The resumable session itself
   * is minted by the existing Drive route, which already owns that flow.
   */
  drive?: { useExistingResumableSession: true };
};

export async function planUpload(actor: Actor, request: UploadRequest): Promise<UploadPlan> {
  requireActiveUser(actor);

  const decision = routeUpload({
    fileRole: request.fileRole,
    mimeType: request.mimeType,
    sizeBytes: request.sizeBytes,
  });

  if (decision.provider === "drive") {
    return {
      provider: "drive",
      reason: decision.reason,
      derivePreview: decision.derivePreview,
      drive: { useExistingResumableSession: true },
    };
  }

  // Only create the location for files actually going to Cloudinary — a
  // Drive-bound upload must not leave an empty Cloudinary folder record behind.
  await ensureCloudinaryLocation(request.assetId);

  return {
    provider: "cloudinary",
    reason: decision.reason,
    derivePreview: decision.derivePreview,
    cloudinary: buildUploadTarget({
      assetId: request.assetId,
      fileRole: request.fileRole,
      mimeType: request.mimeType,
      fileName: request.fileName,
    }),
  };
}

/**
 * Idempotent upsert, so repeat uploads for one asset do not race to create a
 * second location row and collide on the (assetId, provider) unique index.
 */
async function ensureCloudinaryLocation(assetId: string): Promise<void> {
  await AssetStorageLocation.updateOne(
    { assetId, provider: "cloudinary" },
    {
      $setOnInsert: {
        _id: crypto.randomUUID(),
        assetId,
        provider: "cloudinary",
        cloudinaryFolder: `productionos/assets/${assetId}`,
      },
    },
    { upsert: true }
  );
}

export type RecordRequest = UploadRequest & {
  provider: StorageProvider;
  cloudinary?: {
    publicId: string;
    resourceType: "image" | "video" | "raw";
    format: string;
    version: number;
    secureUrl: string;
  };
  drive?: {
    fileId: string;
    parentFolderId: string;
    webViewLink: string;
  };
};

/**
 * Writes down a file that has finished uploading.
 *
 * The provider-specific block is required rather than optional-and-ignored: a
 * row with neither a public id nor a drive file id is a file nobody can ever
 * fetch or delete, and it would look fine in a listing.
 */
export async function recordUploadedFile(
  actor: Actor,
  request: RecordRequest
): Promise<AssetFileDoc> {
  requireActiveUser(actor);

  const common = {
    assetId: request.assetId,
    fileRole: request.fileRole,
    fileName: request.fileName,
    originalFileName: request.fileName,
    mimeType: request.mimeType,
    fileSizeBytes: request.sizeBytes,
    recordStatus: "Active" as const,
  };

  if (request.provider === "cloudinary") {
    const c = request.cloudinary;
    if (!c?.publicId) {
      throw new Error("A cloudinary file must carry its cloudinary publicId.");
    }
    const created = await AssetFile.create({
      ...common,
      provider: "cloudinary",
      fileUrl: c.secureUrl,
      fileFormat: c.format,
      extension: c.format,
      cloudinaryPublicId: c.publicId,
      cloudinaryResourceType: c.resourceType,
      cloudinaryFormat: c.format,
      cloudinaryVersion: c.version,
    });
    return (await AssetFile.findById(created._id).lean<AssetFileDoc>().exec()) as AssetFileDoc;
  }

  const d = request.drive;
  if (!d?.fileId) {
    throw new Error("A drive file must carry its drive fileId.");
  }

  const format = request.fileName.split(".").pop()?.toLowerCase() ?? "";
  const created = await AssetFile.create({
    ...common,
    provider: "google_drive",
    fileUrl: d.webViewLink,
    fileFormat: format,
    extension: format,
    driveFileId: d.fileId,
    driveParentFolderId: d.parentFolderId,
  });
  return (await AssetFile.findById(created._id).lean<AssetFileDoc>().exec()) as AssetFileDoc;
}
