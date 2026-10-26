import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/** CHECK (completion_percentage BETWEEN 0 AND 100) */
const WorkflowTaskStatusSchema = new Schema(
  {
    _id: uuidPk,
    workflowId: refTo("Workflow", true),
    name: { type: String, required: true },
    colour: { type: String, required: true },
    statusCode: { type: String },
    status: { type: String, required: true, default: "active" },
    position: { type: Number, required: true, default: 0 },
    completionPercentage: { type: Number, required: true, default: 0, min: 0, max: 100 },
  },
  { ...timestamped, collection: "workflow_task_statuses" }
);

WorkflowTaskStatusSchema.index({ workflowId: 1, position: 1 });

export type WorkflowTaskStatusDoc = InferSchemaType<typeof WorkflowTaskStatusSchema> & {
  _id: string;
};

export const WorkflowTaskStatus: Model<WorkflowTaskStatusDoc> =
  (mongoose.models.WorkflowTaskStatus as Model<WorkflowTaskStatusDoc>) ??
  mongoose.model<WorkflowTaskStatusDoc>("WorkflowTaskStatus", WorkflowTaskStatusSchema);
