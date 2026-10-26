import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 * Postgres enforced "exactly one scope" with a three-branch CHECK:
 *
 *   CHECK ( (project_id IS NOT NULL AND episode_id IS NULL AND scene_id IS NULL)
 *        OR (project_id IS NULL AND episode_id IS NOT NULL AND scene_id IS NULL)
 *        OR (project_id IS NULL AND episode_id IS NULL AND scene_id IS NOT NULL) )
 *
 * Mongoose has no document-level CHECK, so it becomes a validate hook.
 */
const AssetAssignmentSchema = new Schema(
  {
    _id: uuidPk,
    assetId: refTo("Asset", true),
    projectId: refTo("Project"),
    episodeId: refTo("Episode"),
    sceneId: refTo("Scene"),
  },
  { ...timestamped, collection: "asset_assignments" }
);

// Promise-style hook with no `next`: Mongoose 9 invokes document middleware
// without a callback argument, so a `function (next)` signature throws
// "next is not a function".
AssetAssignmentSchema.pre("validate", function () {
  const scopes = [this.projectId, this.episodeId, this.sceneId].filter(
    (v) => v !== undefined && v !== null
  );
  if (scopes.length !== 1) {
    this.invalidate(
      "projectId",
      "an assignment must be scoped to exactly one of projectId, episodeId or sceneId"
    );
  }
});

export type AssetAssignmentDoc = InferSchemaType<typeof AssetAssignmentSchema> & { _id: string };

export const AssetAssignment: Model<AssetAssignmentDoc> =
  (mongoose.models.AssetAssignment as Model<AssetAssignmentDoc>) ??
  mongoose.model<AssetAssignmentDoc>("AssetAssignment", AssetAssignmentSchema);
