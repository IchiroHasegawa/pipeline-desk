import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, lifecycleStatus, dateOnly, refTo, timestamped } from "./_shared";

const EpisodeSchema = new Schema(
  {
    _id: uuidPk,
    projectId: refTo("Project", true),
    episodeName: { type: String, required: true },
    code: { type: String },
    description: { type: String },
    status: lifecycleStatus,
    startDate: dateOnly,
    endDate: dateOnly,
    sortOrder: { type: Number },
    previewImage: { type: String },
    // Free-text workflow names carried over from the Postgres columns
    // `job_workflow` / `scene_workflow`; not references.
    jobWorkflow: { type: String },
    sceneWorkflow: { type: String },
  },
  { ...timestamped, collection: "episodes" }
);

EpisodeSchema.index({ projectId: 1, sortOrder: 1 });

export type EpisodeDoc = InferSchemaType<typeof EpisodeSchema> & { _id: string };

export const Episode: Model<EpisodeDoc> =
  (mongoose.models.Episode as Model<EpisodeDoc>) ??
  mongoose.model<EpisodeDoc>("Episode", EpisodeSchema);
