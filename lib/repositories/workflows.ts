import { Workflow, type WorkflowDoc, type WorkflowType } from "@/lib/models/Workflow";
import { WorkflowProcess, type WorkflowProcessDoc } from "@/lib/models/WorkflowProcess";
import {
  WorkflowTaskStatus,
  type WorkflowTaskStatusDoc,
} from "@/lib/models/WorkflowTaskStatus";
import { baseRepo } from "./base";
import { requireActiveUser, type Actor } from "@/lib/permissions";

export const workflows = {
  ...baseRepo<WorkflowDoc>(Workflow),

  /**
   * Active workflows of one type. The task-generation service needs exactly
   * this, and `workflowType` is one of job | scene | asset | task_status.
   */
  async listActiveByType(actor: Actor, workflowType: WorkflowType): Promise<WorkflowDoc[]> {
    requireActiveUser(actor);
    return Workflow.find({ workflowType, status: "active" })
      .sort({ sortOrder: 1, name: 1 })
      .lean<WorkflowDoc[]>()
      .exec();
  },

  async getActive(actor: Actor, id: string): Promise<WorkflowDoc | null> {
    requireActiveUser(actor);
    return Workflow.findOne({ _id: id, status: "active" }).lean<WorkflowDoc>().exec();
  },
};

export const workflowProcesses = {
  ...baseRepo<WorkflowProcessDoc>(WorkflowProcess),

  /** Active processes in run order — the sequence tasks are generated from. */
  async listActiveForWorkflow(
    actor: Actor,
    workflowId: string
  ): Promise<WorkflowProcessDoc[]> {
    requireActiveUser(actor);
    return WorkflowProcess.find({ workflowId, status: "active" })
      .sort({ position: 1 })
      .lean<WorkflowProcessDoc[]>()
      .exec();
  },
};

export const workflowTaskStatuses = {
  ...baseRepo<WorkflowTaskStatusDoc>(WorkflowTaskStatus),

  async listForWorkflow(
    actor: Actor,
    workflowId: string
  ): Promise<WorkflowTaskStatusDoc[]> {
    requireActiveUser(actor);
    return WorkflowTaskStatus.find({ workflowId })
      .sort({ position: 1 })
      .lean<WorkflowTaskStatusDoc[]>()
      .exec();
  },
};
