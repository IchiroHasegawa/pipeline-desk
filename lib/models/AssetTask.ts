import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, dateOnly, timestamped } from "./_shared";
import { TAKE_RETAKE_MODES } from "./WorkflowProcess";

/**
 * The live uniqueness rule:
 *
 *   uq_asset_task_process ON asset_tasks (asset_id, source_workflow_process_id)
 *     NULLS NOT DISTINCT
 *
 * Note there is **no WHERE clause** — unlike production_tasks this index is
 * NOT partial. So two process-less tasks on the same asset genuinely do
 * collide, and an asset can carry at most one hand-made task. That is the live
 * behaviour and it is reproduced here deliberately rather than "improved".
 *
 * A plain compound unique index gives exactly NULLS NOT DISTINCT semantics,
 * because Mongo treats a missing field as null and compares nulls as equal.
 */
const AssetTaskSchema = new Schema(
  {
    _id: uuidPk,
    assetId: refTo("Asset", true),
    name: { type: String, required: true },
    status: { type: String, required: true, default: "Unassigned" },
    progress: { type: Number, required: true, default: 0, min: 0, max: 100 },

    assignee: { type: String },
    assigneeGroupId: { type: String },
    startDate: dateOnly,
    endDate: dateOnly,
    sortOrder: { type: Number },
    durationDays: { type: Number, default: 0 },
    effortHours: { type: Number, default: 0 },
    takeRetakeMode: { type: String, default: "Take", enum: TAKE_RETAKE_MODES },
    takeRetakeCount: { type: Number, default: 1 },

    sourceWorkflowId: refTo("Workflow"),
    sourceWorkflowProcessId: refTo("WorkflowProcess"),
    taskStatusWorkflowId: refTo("Workflow"),
    taskStatusDefinitionId: refTo("WorkflowTaskStatus"),
  },
  { ...timestamped, collection: "asset_tasks" }
);

AssetTaskSchema.index({ assetId: 1, sourceWorkflowProcessId: 1 }, { unique: true });

export type AssetTaskDoc = InferSchemaType<typeof AssetTaskSchema> & { _id: string };

export const AssetTask: Model<AssetTaskDoc> =
  (mongoose.models.AssetTask as Model<AssetTaskDoc>) ??
  mongoose.model<AssetTaskDoc>("AssetTask", AssetTaskSchema);
