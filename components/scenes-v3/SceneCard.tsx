"use client";

import React, { useMemo } from "react";
import { Film } from "lucide-react";
import type {
  SceneV2,
  SceneBoardTask,
  TaskStatusOption,
  AssignableUser,
} from "@/types/production-v2";
import {
  deriveSceneStatus,
  formatPriority,
} from "@/lib/format/production";
import { Select, type SelectOption } from "@/components/app-shell/Select";

export interface SceneCardProps {
  scene: SceneV2;
  tasks: readonly SceneBoardTask[];
  statusOptionsByWorkflow: Record<string, TaskStatusOption[]>;
  completionByStatusId: Record<string, number>;
  users: readonly AssignableUser[];
  busyTaskIds: ReadonlySet<string>;
  isSelected: boolean;
  onSelect: (sceneId: string) => void;
  onOpen: (sceneId: string) => void;
  onStatusChange: (taskId: string, statusDefinitionId: string) => void;
  onAssigneeChange: (taskId: string, profileId: string | null) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  tasks,
  statusOptionsByWorkflow,
  completionByStatusId,
  users,
  busyTaskIds,
  isSelected,
  onSelect,
  onOpen,
  onStatusChange,
  onAssigneeChange,
}) => {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const posA = a.processPosition ?? 0;
      const posB = b.processPosition ?? 0;
      return posA - posB;
    });
  }, [tasks]);

  const sceneStatus = useMemo(() => {
    return deriveSceneStatus(tasks, completionByStatusId);
  }, [tasks, completionByStatusId]);

  const statusLabel =
    sceneStatus === "complete"
      ? "Completed"
      : sceneStatus === "in_progress"
      ? "In progress"
      : "Not started";

  const statusDotColor =
    sceneStatus === "complete"
      ? "var(--po-ok)"
      : sceneStatus === "in_progress"
      ? "var(--po-accent)"
      : "var(--po-ink-3)";

  const initials = useMemo(() => {
    const clean = scene.sceneName.replace(/[^a-zA-Z0-9]/g, "");
    return (clean.slice(0, 2) || "SC").toUpperCase();
  }, [scene.sceneName]);

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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(scene.id)}
      onDoubleClick={() => onOpen(scene.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onOpen(scene.id);
        } else if (e.key === " ") {
          e.preventDefault();
          onSelect(scene.id);
        }
      }}
      className={`group flex flex-col gap-2.5 rounded-[18px] border border-[var(--po-line)] bg-[var(--po-card)] p-2.5 shadow-[var(--po-shadow-sm)] outline-offset-[-1px] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--po-shadow-lift)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] cursor-pointer ${
        isSelected
          ? "outline-2 outline-[var(--po-accent)]"
          : "outline-2 outline-transparent"
      }`}
    >
      {/* 16:7 Aspect Ratio Preview Image Hero */}
      <div
        className="relative aspect-[16/7] w-full overflow-hidden rounded-[12px] bg-[var(--po-sunken)]"
        style={{
          background: scene.previewImage
            ? undefined
            : "linear-gradient(145deg, var(--po-ph1), var(--po-ph2))",
        }}
      >
        {scene.previewImage ? (
          <img
            src={scene.previewImage}
            alt={scene.sceneName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[44px] font-semibold tracking-[-0.03em] text-[var(--po-ink-3)] opacity-70 select-none">
            {initials}
          </div>
        )}

        {/* Top-left status pill badge */}
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-medium text-[#18181B] shadow-sm backdrop-blur-xs">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusDotColor }}
          />
          {statusLabel}
        </span>
      </div>

      {/* Title & Metadata Row */}
      <div className="flex items-center gap-2.5 px-1 pt-0.5">
        <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--po-ink)]">
          {scene.sceneName}
        </span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1 text-[12px] text-[var(--po-ink-2)]">
          <Film size={13} className="text-[var(--po-ink-3)]" />
          {scene.numberOfFrames ?? 0} f
        </span>
        <span className="inline-flex items-center rounded-[6px] bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink)]">
          {formatPriority(scene.priority)}
        </span>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-0.5 pt-1">
        {sortedTasks.length === 0 ? (
          <div className="py-3 text-center text-[12px] text-[var(--po-ink-3)]">
            No tasks
          </div>
        ) : (
          sortedTasks.map((task, idx) => {
            const isBusy = busyTaskIds.has(task.id);
            const workflowId = task.taskStatusWorkflowId;
            const availableOptions =
              (workflowId ? statusOptionsByWorkflow[workflowId] : null) || [];

            const statusSelectOptions: SelectOption[] = availableOptions.map(
              (opt) => ({
                value: opt.id,
                label: opt.name,
                colour: opt.colour,
              })
            );

            return (
              <div
                key={task.id}
                className="grid grid-cols-[20px_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[8px] p-1 transition-colors hover:bg-[var(--po-chip)]"
              >
                {/* Process number badge */}
                <span
                  className="flex h-5 w-5 flex-none items-center justify-center rounded-[6px] text-[11px] font-semibold text-white"
                  style={{
                    backgroundColor: task.processColour || "var(--po-ink-3)",
                  }}
                  title={task.processName || `Process ${idx + 1}`}
                >
                  {task.processPosition ?? idx + 1}
                </span>

                {/* Process / Task Name with title attribute for truncated names */}
                <span
                  className="truncate text-[12px] text-[var(--po-ink-2)]"
                  title={task.processName || task.name || undefined}
                >
                  {task.processName || task.name}
                </span>

                {/* Status Dropdown */}
                <Select
                  disabled={isBusy}
                  value={task.taskStatusDefinitionId || null}
                  options={statusSelectOptions}
                  onChange={(val) => onStatusChange(task.id, val)}
                  ariaLabel={`Status for ${task.processName || task.name}`}
                  size="sm"
                />

                {/* Assignee Dropdown */}
                <Select
                  disabled={isBusy}
                  value={task.assignee || ""}
                  options={assigneeSelectOptions}
                  onChange={(val) => onAssigneeChange(task.id, val || null)}
                  ariaLabel={`Assignee for ${task.processName || task.name}`}
                  size="sm"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
