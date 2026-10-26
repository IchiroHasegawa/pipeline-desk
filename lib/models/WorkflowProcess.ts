import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 *   CHECK (process_type IN ('Manual','Approval','Asset Progress'))
 *   CHECK (take_retake_mode IN ('Take','Retake'))
 *   CHECK (take_retake_count > 0)
 *   CHECK (default_completion BETWEEN 0 AND 100)
 *   CHECK (duration_days >= 0)
 *   CHECK (effort_hours >= 0)
 */
export const PROCESS_TYPES = ["Manual", "Approval", "Asset Progress"] as const;
export const TAKE_RETAKE_MODES = ["Take", "Retake"] as const;

const WorkflowProcessSchema = new Schema(
  {
    _id: uuidPk,
    workflowId: refTo("Workflow", true),
    name: { type: String, required: true },
    colour: { type: String, required: true },
    processType: { type: String, required: true, enum: PROCESS_TYPES },
    status: { type: String, required: true, default: "active" },
    position: { type: Number, required: true, default: 0 },
    durationDays: { type: Number, default: 0, min: 0 },
    effortHours: { type: Number, default: 0, min: 0 },
    defaultCompletion: { type: Number, default: 0, min: 0, max: 100 },
    takeRetakeMode: { type: String, required: true, default: "Take", enum: TAKE_RETAKE_MODES },
    takeRetakeCount: { type: Number, required: true, default: 1, min: 1 },
    assigneeGroupId: { type: String },
    defaultTaskStatusId: refTo("WorkflowTaskStatus"),
    taskStatusWorkflowId: refTo("Workflow"),
  },
  { ...timestamped, collection: "workflow_processes" }
);

WorkflowProcessSchema.index({ workflowId: 1, position: 1 });

export type WorkflowProcessDoc = InferSchemaType<typeof WorkflowProcessSchema> & { _id: string };

export const WorkflowProcess: Model<WorkflowProcessDoc> =
  (mongoose.models.WorkflowProcess as Model<WorkflowProcessDoc>) ??
  mongoose.model<WorkflowProcessDoc>("WorkflowProcess", WorkflowProcessSchema);
