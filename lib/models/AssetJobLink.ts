import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 * "Job" is an episode. The Postgres column is `episode_id`, and the name is
 * kept here so the collection still matches `asset_job_links`.
 */
const AssetJobLinkSchema = new Schema(
  {
    _id: uuidPk,
    assetId: refTo("Asset", true),
    episodeId: refTo("Episode", true),
  },
  { ...timestamped, collection: "asset_job_links" }
);

AssetJobLinkSchema.index({ assetId: 1, episodeId: 1 }, { unique: true });

export type AssetJobLinkDoc = InferSchemaType<typeof AssetJobLinkSchema> & { _id: string };

export const AssetJobLink: Model<AssetJobLinkDoc> =
  (mongoose.models.AssetJobLink as Model<AssetJobLinkDoc>) ??
  mongoose.model<AssetJobLinkDoc>("AssetJobLink", AssetJobLinkSchema);
