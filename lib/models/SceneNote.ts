import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

const SceneNoteSchema = new Schema(
  {
    _id: uuidPk,
    sceneId: refTo("Scene", true),
    content: { type: String, required: true },
  },
  { ...timestamped, collection: "scene_notes" }
);

export type SceneNoteDoc = InferSchemaType<typeof SceneNoteSchema> & { _id: string };

export const SceneNote: Model<SceneNoteDoc> =
  (mongoose.models.SceneNote as Model<SceneNoteDoc>) ??
  mongoose.model<SceneNoteDoc>("SceneNote", SceneNoteSchema);
