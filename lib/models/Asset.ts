import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 * `assets` has no CHECK constraints in the contract — `status` is free text
 * here, unlike projects/episodes/scenes. `asset_code` is NOT NULL but **not**
 * unique; only `asset_number` is.
 *
 * `asset_number` came from a Postgres sequence (`nextval`). Mongo has no
 * sequences, so the value is assigned by the repository layer; the model only
 * enforces uniqueness, and does so with a partial index because the column is
 * nullable.
 */
const AssetSchema = new Schema(
  {
    _id: uuidPk,
    assetCode: { type: String, required: true },
    assetName: { type: String, required: true },
    assetType: { type: String, required: true },
    assetNumber: { type: Number },
    categoryId: refTo("AssetCategory"),
    description: { type: String },
    previewUrl: { type: String },
    status: { type: String, required: true, default: "Active" },
    priority: { type: Number, required: true, default: 4 },
    sortOrder: { type: Number, required: true, default: 0 },
    workflow: { type: String },
    tags: { type: [String], required: true, default: () => [] },
  },
  { ...timestamped, collection: "assets" }
);

AssetSchema.index(
  { assetNumber: 1 },
  { unique: true, partialFilterExpression: { assetNumber: { $exists: true } } }
);

export type AssetDoc = InferSchemaType<typeof AssetSchema> & { _id: string };

export const Asset: Model<AssetDoc> =
  (mongoose.models.Asset as Model<AssetDoc>) ?? mongoose.model<AssetDoc>("Asset", AssetSchema);
