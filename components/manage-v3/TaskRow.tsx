"use client";

import React, { useMemo } from "react";
import type {
  SceneBoardTask,
  TaskStatusOption,
  AssignableUser,
  TodoV2,
} from "@/types/production-v2";
import { Select, type SelectOption } from "@/components/app-shell/Select";
import { formatCommitLabel } from "@/lib/timeline/commitFormat";

export interface TaskRowProps {
  task: SceneBoardTask;
  index: number;
  statusOptions: TaskStatusOption[];
  users: AssignableUser[];
  latestCommit?: TodoV2;
  isBusy?: boolean;
  onStatusChange: (taskId: string, statusId: string) => void;
  onAssigneeChange: (taskId: string, profileId: string | null) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  index,
  statusOptions,
  users,
  latestCommit,
  isBusy = false,
  onStatusChange,
  onAssigneeChange,
}) => {
  const currentStatusOption = useMemo(() => {
    return statusOptions.find((opt) => opt.id === task.taskStatusDefinitionId);
  }, [statusOptions, task.taskStatusDefinitionId]);

  const completionPct = currentStatusOption?.completionPercentage ?? 0;
  const statusColour = currentStatusOption?.colour || "var(--po-accent)";

  const statusSelectOptions = useMemo<SelectOption[]>(() => {
    return statusOptions.map((opt) => ({
      value: opt.id,
      label: opt.name,
      colour: opt.colour,
    }));
  }, [statusOptions]);

  const assigneeSelectOptions = useMemo<SelectOption[]>(() => {
    return [
      { value: "", label: "Unassigned", avatarInitials: "—" },
      ...users.map((u) => ({
        value: u.id,
        label: u.displayName,
        avatarInitials: (u.displayName.slice(0, 2) || "U").toUpperCase(),
      })),
    ];
  }, [users]);

  const commitText = latestCommit
    ? formatCommitLabel(latestCommit.completedAt || latestCommit.createdAt)
    : "—";

  return (
    <div
      className={`grid grid-cols-[40px_minmax(120px,1.2fr)_160px_minmax(120px,1fr)_160px_140px] items-center gap-4 px-4 py-2.5 border-b border-[var(--po-line)] transition-colors hover:bg-[var(--po-chip)] ${
        isBusy ? "opacity-60" : ""
      }`}
    >
      {/* Process Number Badge */}
      <div className="flex items-center">
        <span
          className="flex h-6 w-6 flex-none items-center justify-center rounded-[7px] text-[11px] font-semibold text-white shadow-xs"
          style={{
            backgroundColor: task.processColour || "var(--po-ink-3)",
          }}
          title={task.processName || `Process ${index + 1}`}
        >
          {task.processPosition ?? index + 1}
        </span>
      </div>

      {/* Process / Task Name */}
      <span
        className="truncate text-[13px] font-medium text-[var(--po-ink)]"
        title={task.processName || task.name}
      >
        {task.processName || task.name}
      </span>

      {/* Status Select */}
      <div className="flex items-center">
        <Select
          disabled={isBusy}
          value={task.taskStatusDefinitionId || null}
          options={statusSelectOptions}
          onChange={(val) => onStatusChange(task.id, val)}
          ariaLabel={`Status for ${task.processName || task.name}`}
          size="sm"
        />
      </div>

      {/* Completion Bar & Percent (from current status option's completionPercentage) */}
      <div className="flex items-center gap-2.5 pr-2">
        <div className="h-1.5 flex-1 rounded-full bg-[var(--po-chip)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, completionPct))}%`,
              backgroundColor: statusColour,
            }}
          />
        </div>
        <span className="w-9 text-right text-[12px] font-medium tabular-nums text-[var(--po-ink-2)]">
          {completionPct}%
        </span>
      </div>

      {/* Assignee Select */}
      <div className="flex items-center">
        <Select
          disabled={isBusy}
          value={task.assignee || ""}
          options={assigneeSelectOptions}
          onChange={(val) => onAssigneeChange(task.id, val || null)}
          ariaLabel={`Assignee for ${task.processName || task.name}`}
          size="sm"
        />
      </div>

      {/* Latest Commit Label */}
      <span
        className="truncate text-[12px] text-[var(--po-ink-3)]"
        title={commitText}
      >
        {commitText}
      </span>
    </div>
  );
};
