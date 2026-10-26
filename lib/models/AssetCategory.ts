import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, timestamped } from "./_shared";

const AssetCategorySchema = new Schema(
  {
    _id: uuidPk,
    name: { type: String, required: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { ...timestamped, collection: "asset_categories" }
);

AssetCategorySchema.index({ name: 1 }, { unique: true });

export type AssetCategoryDoc = InferSchemaType<typeof AssetCategorySchema> & { _id: string };

export const AssetCategory: Model<AssetCategoryDoc> =
  (mongoose.models.AssetCategory as Model<AssetCategoryDoc>) ??
  mongoose.model<AssetCategoryDoc>("AssetCategory", AssetCategorySchema);
