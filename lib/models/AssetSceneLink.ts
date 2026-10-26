import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

const AssetSceneLinkSchema = new Schema(
  {
    _id: uuidPk,
    assetId: refTo("Asset", true),
    sceneId: refTo("Scene", true),
  },
  { ...timestamped, collection: "asset_scene_links" }
);

AssetSceneLinkSchema.index({ assetId: 1, sceneId: 1 }, { unique: true });

export type AssetSceneLinkDoc = InferSchemaType<typeof AssetSceneLinkSchema> & { _id: string };

export const AssetSceneLink: Model<AssetSceneLinkDoc> =
  (mongoose.models.AssetSceneLink as Model<AssetSceneLinkDoc>) ??
  mongoose.model<AssetSceneLinkDoc>("AssetSceneLink", AssetSceneLinkSchema);
