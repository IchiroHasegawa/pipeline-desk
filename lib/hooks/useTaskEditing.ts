"use client";

import { useState, useCallback } from "react";
import type { SceneBoardTask, TaskStatusOption } from "@/types/production-v2";
import { updateTaskStatus, updateTaskAssignee } from "@/app/actions/production";

export interface UseTaskEditingOptions {
  initialTasks: Record<string, SceneBoardTask[]>;
  statusOptionsByWorkflow: Record<string, TaskStatusOption[]>;
}

export interface UseTaskEditingResult {
  tasks: Record<string, SceneBoardTask[]>;
  busyIds: Set<string>;
  changeStatus: (taskId: string, statusId: string) => Promise<void>;
  changeAssignee: (taskId: string, profileId: string | null) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export function useTaskEditing({
  initialTasks,
  statusOptionsByWorkflow,
}: UseTaskEditingOptions): UseTaskEditingResult {
  const [tasks, setTasks] = useState<Record<string, SceneBoardTask[]>>(initialTasks);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const setBusy = useCallback((taskId: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }, []);

  const findTask = useCallback(
    (taskId: string): SceneBoardTask | null => {
      for (const list of Object.values(tasks)) {
        const found = list.find((t) => t.id === taskId);
        if (found) return found;
      }
      return null;
    },
    [tasks]
  );

  const patchTask = useCallback(
    (taskId: string, patch: Partial<SceneBoardTask>) => {
      setTasks((prev) => {
        const next: Record<string, SceneBoardTask[]> = {};
        for (const [key, list] of Object.entries(prev)) {
          next[key] = list.map((task) =>
            task.id === taskId ? { ...task, ...patch } : task
          );
        }
        return next;
      });
    },
    []
  );

  const restoreTask = useCallback((previous: SceneBoardTask) => {
    setTasks((prev) => {
      const next: Record<string, SceneBoardTask[]> = {};
      for (const [key, list] of Object.entries(prev)) {
        next[key] = list.map((task) =>
          task.id === previous.id ? previous : task
        );
      }
      return next;
    });
  }, []);

  const changeStatus = useCallback(
    async (taskId: string, statusDefinitionId: string) => {
      const option = Object.values(statusOptionsByWorkflow)
        .flat()
        .find((s) => s.id === statusDefinitionId);

      const previous = findTask(taskId);
      patchTask(taskId, {
        taskStatusDefinitionId: statusDefinitionId,
        status: option ? option.name : undefined,
      });

      setBusy(taskId, true);
      setError(null);
      try {
        await updateTaskStatus(taskId, statusDefinitionId);
      } catch (err: unknown) {
        if (previous) restoreTask(previous);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(taskId, false);
      }
    },
    [statusOptionsByWorkflow, findTask, patchTask, restoreTask, setBusy]
  );

  const changeAssignee = useCallback(
    async (taskId: string, profileId: string | null) => {
      const previous = findTask(taskId);
      patchTask(taskId, { assignee: profileId });

      setBusy(taskId, true);
      setError(null);
      try {
        await updateTaskAssignee(taskId, profileId);
      } catch (err: unknown) {
        if (previous) restoreTask(previous);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(taskId, false);
      }
    },
    [findTask, patchTask, restoreTask, setBusy]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    tasks,
    busyIds,
    changeStatus,
    changeAssignee,
    error,
    clearError,
  };
}
