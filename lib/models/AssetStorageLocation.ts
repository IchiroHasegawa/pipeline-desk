import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";
import { STORAGE_PROVIDERS } from "./AssetFile";

/**
 * Where one asset's files live, per provider.
 *
 * `UNIQUE (assetId, provider)` is the seam the two-provider design rests on:
 * an asset can hold a Drive location *and* a Cloudinary location at the same
 * time, which is exactly what happens when a large master goes to Drive and
 * its derived preview goes to Cloudinary.
 *
 * The folder fields are provider-specific and therefore **conditionally
 * required**. They were unconditionally required when Drive was the only
 * provider, which would have made a Cloudinary location impossible to store.
 */
const AssetStorageLocationSchema = new Schema(
  {
    _id: uuidPk,
    assetId: refTo("Asset", true),
    provider: { type: String, required: true, enum: STORAGE_PROVIDERS },

    // Drive: a tree of real folder ids.
    rootFolderId: { type: String },
    assetFolderId: { type: String },
    sourceFolderId: { type: String },
    previewFolderId: { type: String },
    versionsFolderId: { type: String },
    projectFolderId: { type: String },
    categoryFolderId: { type: String },

    // Cloudinary: a single slash-delimited path prefix, not a folder entity.
    cloudinaryFolder: { type: String },
  },
  { ...timestamped, collection: "asset_storage_locations" }
);

const DRIVE_REQUIRED_FOLDERS = [
  "rootFolderId",
  "assetFolderId",
  "sourceFolderId",
  "previewFolderId",
  "versionsFolderId",
] as const;

AssetStorageLocationSchema.pre("validate", function () {
  if (this.provider === "google_drive") {
    for (const field of DRIVE_REQUIRED_FOLDERS) {
      if (!this[field]) {
        this.invalidate(field, `${field} is required for a google_drive location`);
      }
    }
  }

  if (this.provider === "cloudinary" && !this.cloudinaryFolder) {
    this.invalidate("cloudinaryFolder", "cloudinaryFolder is required for a cloudinary location");
  }
});

AssetStorageLocationSchema.index({ assetId: 1, provider: 1 }, { unique: true });

export type AssetStorageLocationDoc = InferSchemaType<typeof AssetStorageLocationSchema> & {
  _id: string;
};

export const AssetStorageLocation: Model<AssetStorageLocationDoc> =
  (mongoose.models.AssetStorageLocation as Model<AssetStorageLocationDoc>) ??
  mongoose.model<AssetStorageLocationDoc>("AssetStorageLocation", AssetStorageLocationSchema);
