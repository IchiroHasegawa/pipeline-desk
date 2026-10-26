import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, lifecycleStatus, refTo, timestamped } from "./_shared";

/**
 *   CHECK (priority IN (1,2,3,4,5))
 *   CHECK (number_of_frames >= 1)
 *   CHECK (status IN ('Active','Retired'))
 */
const SceneSchema = new Schema(
  {
    _id: uuidPk,
    episodeId: refTo("Episode", true),
    sceneName: { type: String, required: true },
    description: { type: String },
    status: lifecycleStatus,
    priority: { type: Number, required: true, default: 4, enum: [1, 2, 3, 4, 5] },
    numberOfFrames: { type: Number, required: true, default: 1, min: 1 },
    workflow: { type: String },
    sortOrder: { type: Number },
    previewImage: { type: String },
  },
  { ...timestamped, collection: "scenes" }
);

SceneSchema.index({ episodeId: 1, sortOrder: 1 });

export type SceneDoc = InferSchemaType<typeof SceneSchema> & { _id: string };

export const Scene: Model<SceneDoc> =
  (mongoose.models.Scene as Model<SceneDoc>) ??
  mongoose.model<SceneDoc>("Scene", SceneSchema);
