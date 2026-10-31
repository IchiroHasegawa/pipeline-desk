import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 * Constraints from the contract. Note these differ from what the migration
 * plan assumed — there is no `upload_status` column, and `file_role` has four
 * values, not three:
 *
 *   CHECK (file_role IN ('Source','Preview','Version','Versions'))
 *   CHECK (record_status IN ('Queued','Preparing','Uploading','Active',
 *                           'Retired','Trashed','Failed','Cancelled','Missing'))
 *   CHECK (provider = 'google_drive')
 *   CHECK ((file_role = 'Source') OR (current_file_id IS NULL))
 *   UNIQUE (drive_file_id)                  -- nullable, so partial
 *   UNIQUE (source_file_id, version_number) -- both nullable, so partial
 */
export const FILE_ROLES = ["Source", "Preview", "Version", "Versions"] as const;

export const RECORD_STATUSES = [
  "Queued",
  "Preparing",
  "Uploading",
  "Active",
  "Retired",
  "Trashed",
  "Failed",
  "Cancelled",
  "Missing",
] as const;

export type FileRole = (typeof FILE_ROLES)[number];
export type RecordStatus = (typeof RECORD_STATUSES)[number];

/**
 * Postgres had `CHECK (provider = 'google_drive')` — a single-value enum left
 * deliberately narrow, alongside a `UNIQUE (asset_id, provider)` on storage
 * locations that only makes sense if more than one provider is expected.
 * Cloudinary is that second provider.
 */
export const STORAGE_PROVIDERS = ["google_drive", "cloudinary"] as const;
export type StorageProviderName = (typeof STORAGE_PROVIDERS)[number];

/** Cloudinary's own taxonomy. `raw` is anything it will not transform. */
export const CLOUDINARY_RESOURCE_TYPES = ["image", "video", "raw"] as const;

const AssetFileSchema = new Schema(
  {
    _id: uuidPk,
    assetId: refTo("Asset", true),
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileFormat: { type: String, required: true },
    displayName: { type: String },
    originalFileName: { type: String },
    extension: { type: String },
    mimeType: { type: String },
    fileSizeBytes: { type: Number, required: true, default: 0 },
    fileRole: { type: String, enum: FILE_ROLES },
    recordStatus: { type: String, enum: RECORD_STATUSES },
    provider: { type: String, enum: STORAGE_PROVIDERS },

    // Drive-specific
    driveFileId: { type: String },
    driveParentFolderId: { type: String },
    driveCreatedTime: { type: Date },

    // Cloudinary-specific. publicId is the handle for delivery, transformation
    // and deletion; version pins a specific upload so a cached URL cannot
    // silently change under a replaced file.
    cloudinaryPublicId: { type: String },
    cloudinaryResourceType: { type: String, enum: CLOUDINARY_RESOURCE_TYPES },
    cloudinaryFormat: { type: String },
    cloudinaryVersion: { type: Number },
    versionNumber: { type: Number },
    sourceFileId: refTo("AssetFile"),
    currentFileId: refTo("AssetFile"),
    restoredFromFileId: refTo("AssetFile"),
  },
  { ...timestamped, collection: "asset_files" }
);

// CHECK ((file_role = 'Source') OR (current_file_id IS NULL))
AssetFileSchema.path("currentFileId").validate(function (value: unknown) {
  if (value === undefined || value === null) return true;
  return (this as unknown as { fileRole?: string }).fileRole === "Source";
}, "currentFileId may only be set on a file whose fileRole is 'Source'");

AssetFileSchema.index(
  { driveFileId: 1 },
  { unique: true, partialFilterExpression: { driveFileId: { $exists: true } } }
);

// Partial for the same reason as driveFileId: the field is optional, and a
// total unique index would make every second Drive file collide on its absence.
AssetFileSchema.index(
  { cloudinaryPublicId: 1 },
  { unique: true, partialFilterExpression: { cloudinaryPublicId: { $exists: true } } }
);

AssetFileSchema.index(
  { sourceFileId: 1, versionNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sourceFileId: { $exists: true },
      versionNumber: { $exists: true },
    },
  }
);

export type AssetFileDoc = InferSchemaType<typeof AssetFileSchema> & { _id: string };

export const AssetFile: Model<AssetFileDoc> =
  (mongoose.models.AssetFile as Model<AssetFileDoc>) ??
  mongoose.model<AssetFileDoc>("AssetFile", AssetFileSchema);
