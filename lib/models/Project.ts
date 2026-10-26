import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, lifecycleStatus, dateOnly, refTo, timestamped, jsonObject } from "./_shared";

/**
 * Constraints from docs/mongo-migration/schema-contract.json:
 *   CHECK (project_code ~ '^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$')
 *   CHECK (status IN ('Active','Retired'))
 *   UNIQUE (project_code)
 *   UNIQUE INDEX projects_single_system_idx ON ((true)) WHERE is_system
 *
 * Note: there is no board-views field. Migration 037 is named
 * `project_board_views.sql` but actually creates the three database views.
 */
const ProjectSchema = new Schema(
  {
    _id: uuidPk,
    title: { type: String, required: true },
    projectCode: {
      type: String,
      required: true,
      match: /^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/,
    },
    description: { type: String },
    thumbnailUrl: { type: String },
    status: lifecycleStatus,
    startDate: dateOnly,
    endDate: dateOnly,
    isSystem: { type: Boolean, required: true, default: false },
    defaultAssetWorkflowId: refTo("Workflow"),
    assetCodePrefix: { type: String },
    boardLayout: jsonObject,
  },
  { ...timestamped, collection: "projects" }
);

ProjectSchema.index({ projectCode: 1 }, { unique: true });

// Postgres enforced "at most one system project" with a unique index on the
// constant `true` filtered to WHERE is_system. The Mongo equivalent is a
// partial unique index on isSystem restricted to the true case — without the
// partial filter every non-system project would collide on isSystem:false.
ProjectSchema.index(
  { isSystem: 1 },
  { unique: true, partialFilterExpression: { isSystem: true } }
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & { _id: string };

export const Project: Model<ProjectDoc> =
  (mongoose.models.Project as Model<ProjectDoc>) ??
  mongoose.model<ProjectDoc>("Project", ProjectSchema);
