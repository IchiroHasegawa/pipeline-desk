import mongoose from "mongoose";
import { Workflow } from "@/lib/models/Workflow";
import { WorkflowProcess } from "@/lib/models/WorkflowProcess";
import { WorkflowTaskStatus } from "@/lib/models/WorkflowTaskStatus";
import { ProductionTask } from "@/lib/models/ProductionTask";
import { AssetTask } from "@/lib/models/AssetTask";
import { requireActiveUser, type Actor } from "@/lib/permissions";

/**
 * Entity types the generator accepts. `task_status` is a valid *workflow* type
 * but is never generated against an entity, which is why it is absent — the
 * Postgres function rejected it the same way.
 */
export const GENERATABLE_ENTITY_TYPES = ["job", "scene", "asset"] as const;
export type GeneratableEntityType = (typeof GENERATABLE_ENTITY_TYPES)[number];

/** Fallback when a process names no default task status. */
const DEFAULT_TASK_STATUS_NAME = "Standby";

/**
 * Ports the `generate_workflow_tasks(text, uuid, uuid)` plpgsql function.
 *
 * Faithful to the live definition, including its error messages, which the UI
 * surfaces verbatim. Two behaviours matter:
 *
 *  - **Idempotent.** Postgres used `ON CONFLICT ... DO NOTHING` against
 *    `uq_production_task_process` / `uq_asset_task_process`. Here the same
 *    unique indexes back an upsert that inserts only when absent, so
 *    re-running after adding a process tops up rather than duplicating.
 *  - **Atomic.** The whole loop runs in one transaction, so a failure partway
 *    leaves no half-generated task list behind. This is why `po_mongo` must be
 *    a replica set: a standalone mongod cannot do multi-document transactions.
 */
export async function generateWorkflowTasks(
  actor: Actor,
  entityType: GeneratableEntityType,
  entityId: string,
  workflowId: string
): Promise<{ created: number }> {
  requireActiveUser(actor);

  if (!GENERATABLE_ENTITY_TYPES.includes(entityType)) {
    throw new Error(`Unsupported entity type: ${entityType}`);
  }

  const workflow = await Workflow.findOne({ _id: workflowId, status: "active" }).lean();
  if (!workflow) {
    throw new Error("The selected Workflow is not valid or active.");
  }
  if (workflow.workflowType !== entityType) {
    throw new Error("The selected Workflow is not valid for this item.");
  }

  const processes = await WorkflowProcess.find({ workflowId, status: "active" })
    .sort({ position: 1 })
    .lean();

  if (processes.length === 0) return { created: 0 };

  // One query for the status names the loop needs, rather than the LEFT JOIN
  // the plpgsql version did per row.
  const statusIds = processes
    .map((p) => p.defaultTaskStatusId)
    .filter((id): id is string => Boolean(id));

  const statusNameById = new Map<string, string>(
    (
      await WorkflowTaskStatus.find({ _id: { $in: statusIds } })
        .select("name")
        .lean()
    ).map((s) => [s._id, s.name])
  );

  const session = await mongoose.startSession();
  try {
    let created = 0;

    await session.withTransaction(async () => {
      created = 0;

      for (const process of processes) {
        const shared = {
          name: process.name,
          progress: process.defaultCompletion ?? 0,
          status:
            (process.defaultTaskStatusId
              ? statusNameById.get(process.defaultTaskStatusId)
              : undefined) ?? DEFAULT_TASK_STATUS_NAME,
          sortOrder: process.position,
          sourceWorkflowId: workflowId,
          sourceWorkflowProcessId: process._id,
          taskStatusWorkflowId: process.taskStatusWorkflowId,
          taskStatusDefinitionId: process.defaultTaskStatusId,
          assigneeGroupId: process.assigneeGroupId,
          durationDays: process.durationDays,
          effortHours: process.effortHours,
          takeRetakeMode: process.takeRetakeMode,
          takeRetakeCount: process.takeRetakeCount,
        };

        if (entityType === "asset") {
          const exists = await AssetTask.exists({
            assetId: entityId,
            sourceWorkflowProcessId: process._id,
          }).session(session);
          if (exists) continue;

          await AssetTask.create([{ ...shared, assetId: entityId }], {
            session,
            ordered: true,
          });
        } else {
          const scope =
            entityType === "job" ? { episodeId: entityId } : { sceneId: entityId };

          const exists = await ProductionTask.exists({
            ...scope,
            sourceWorkflowProcessId: process._id,
          }).session(session);
          if (exists) continue;

          await ProductionTask.create([{ ...shared, ...scope }], {
            session,
            ordered: true,
          });
        }

        created += 1;
      }
    });

    return { created };
  } finally {
    await session.endSession();
  }
}
