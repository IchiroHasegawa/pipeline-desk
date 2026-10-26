import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 * UNIQUE (asset_id, provider) — deliberately leaves room for one asset to live
 * in several storage providers at once. Widening `provider` beyond
 * 'google_drive' belongs to the Cloudinary phase and is not done here.
 */
const AssetStorageLocationSchema = new Schema(
  {
    _id: uuidPk,
    assetId: refTo("Asset", true),
    provider: { type: String, required: true, enum: ["google_drive"] },
    rootFolderId: { type: String, required: true },
    assetFolderId: { type: String, required: true },
    sourceFolderId: { type: String, required: true },
    previewFolderId: { type: String, required: true },
    versionsFolderId: { type: String, required: true },
    projectFolderId: { type: String },
    categoryFolderId: { type: String },
  },
  { ...timestamped, collection: "asset_storage_locations" }
);

AssetStorageLocationSchema.index({ assetId: 1, provider: 1 }, { unique: true });

export type AssetStorageLocationDoc = InferSchemaType<typeof AssetStorageLocationSchema> & {
  _id: string;
};

export const AssetStorageLocation: Model<AssetStorageLocationDoc> =
  (mongoose.models.AssetStorageLocation as Model<AssetStorageLocationDoc>) ??
  mongoose.model<AssetStorageLocationDoc>("AssetStorageLocation", AssetStorageLocationSchema);
