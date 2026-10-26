import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, dateOnly, timestamped } from "./_shared";
import { TAKE_RETAKE_MODES } from "./WorkflowProcess";

/**
 * The live uniqueness rule, verbatim from the schema contract:
 *
 *   uq_production_task_process ON production_tasks
 *     (episode_id, scene_id, day_id, source_workflow_process_id)
 *     NULLS NOT DISTINCT WHERE (source_workflow_process_id IS NOT NULL)
 *
 * Two things matter and are easy to get wrong:
 *
 *  - **It is partial.** Tasks with no source process fall outside the index
 *    entirely, so a scene may carry many hand-made tasks. Migration 027's
 *    original constraint was *not* partial, which is why it cannot be applied
 *    to a database carrying the 11 seeded demo tasks — a later migration made
 *    it partial, and this is that final state.
 *  - **It includes day_id** — four columns, not three. The same process on the
 *    same scene is allowed once per day.
 *
 * NULLS NOT DISTINCT needs no special handling: Mongo compound unique indexes
 * already treat a missing field as null and compare nulls as equal, which is
 * precisely NULLS NOT DISTINCT.
 *
 * There is no `environmentId`. Migration 033 dropped it; do not reintroduce it.
 */
const ProductionTaskSchema = new Schema(
  {
    _id: uuidPk,
    name: { type: String, required: true },
    status: { type: String, required: true, default: "Unassigned" },
    progress: { type: Number, required: true, default: 0, min: 0, max: 100 },

    episodeId: refTo("Episode"),
    sceneId: refTo("Scene"),
    dayId: refTo("Day"),

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
    branchesFromTaskId: refTo("ProductionTask"),
    contributesToTaskId: refTo("ProductionTask"),
  },
  { ...timestamped, collection: "production_tasks" }
);

ProductionTaskSchema.index(
  { episodeId: 1, sceneId: 1, dayId: 1, sourceWorkflowProcessId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceWorkflowProcessId: { $exists: true } },
  }
);

// CHECK ((contributes_to_task_id IS NULL OR contributes_to_task_id <> id)
//    AND (branches_from_task_id IS NULL OR branches_from_task_id <> id))
ProductionTaskSchema.pre("validate", function () {
  if (this.contributesToTaskId && this.contributesToTaskId === this._id) {
    this.invalidate("contributesToTaskId", "a task cannot contribute to itself");
  }
  if (this.branchesFromTaskId && this.branchesFromTaskId === this._id) {
    this.invalidate("branchesFromTaskId", "a task cannot branch from itself");
  }
});

export type ProductionTaskDoc = InferSchemaType<typeof ProductionTaskSchema> & { _id: string };

export const ProductionTask: Model<ProductionTaskDoc> =
  (mongoose.models.ProductionTask as Model<ProductionTaskDoc>) ??
  mongoose.model<ProductionTaskDoc>("ProductionTask", ProductionTaskSchema);
