import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 * Kept as its own collection rather than embedded as an array on either side.
 * The relationship is many-to-many and is queried from both directions (every
 * project for an asset, every asset for a project), so embedding would
 * duplicate the data and let the two copies drift.
 */
const AssetProjectLinkSchema = new Schema(
  {
    _id: uuidPk,
    assetId: refTo("Asset", true),
    projectId: refTo("Project", true),
  },
  { ...timestamped, collection: "asset_project_links" }
);

AssetProjectLinkSchema.index({ assetId: 1, projectId: 1 }, { unique: true });

export type AssetProjectLinkDoc = InferSchemaType<typeof AssetProjectLinkSchema> & {
  _id: string;
};

export const AssetProjectLink: Model<AssetProjectLinkDoc> =
  (mongoose.models.AssetProjectLink as Model<AssetProjectLinkDoc>) ??
  mongoose.model<AssetProjectLinkDoc>("AssetProjectLink", AssetProjectLinkSchema);
