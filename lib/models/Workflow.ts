import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 * CHECK (workflow_type IN ('job','scene','asset','task_status'))
 *
 * Note `task_status` is a fourth type: those workflows describe task-status
 * sets rather than being generated against an entity, which is why
 * generateWorkflowTasks only accepts job / scene / asset.
 *
 * `status` here is lowercase ('active'), unlike projects/episodes/scenes which
 * use 'Active'. That inconsistency is in the live schema; it is preserved
 * rather than tidied, because queries filter on the literal value.
 */
export const WORKFLOW_TYPES = ["job", "scene", "asset", "task_status"] as const;

const WorkflowSchema = new Schema(
  {
    _id: uuidPk,
    name: { type: String, required: true },
    colour: { type: String, required: true },
    workflowCode: { type: String, required: true },
    workflowType: { type: String, required: true, enum: WORKFLOW_TYPES },
    description: { type: String },
    status: { type: String, required: true, default: "active" },
    sortOrder: { type: Number, default: 0 },
    createdBy: refTo("Profile"),
  },
  { ...timestamped, collection: "workflows" }
);

export type WorkflowDoc = InferSchemaType<typeof WorkflowSchema> & { _id: string };

export const Workflow: Model<WorkflowDoc> =
  (mongoose.models.Workflow as Model<WorkflowDoc>) ??
  mongoose.model<WorkflowDoc>("Workflow", WorkflowSchema);
