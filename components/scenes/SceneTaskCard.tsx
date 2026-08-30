"use client";

import React, { memo } from "react";
import type {
  SceneBoardTask,
  TaskStatusOption,
  AssignableUser,
} from "@/types/production-v2";

export type SceneTaskCardProps = {
  task: SceneBoardTask;
  /** Statuses of this task's own status workflow. Empty when it has none. */
  statusOptions: TaskStatusOption[];
  users: AssignableUser[];
  onStatusChange: (taskId: string, statusDefinitionId: string) => void;
  onAssigneeChange: (taskId: string, profileId: string | null) => void;
  /** Set while a write for this card is in flight. */
  busy?: boolean;
};

const CARD_WIDTH = 216;
const CARD_HEIGHT = 171;
const TAB_HEIGHT = 4;

const Caret: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-[14px] h-[14px] fill-none stroke-current opacity-70 pointer-events-none"
    strokeWidth={2}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "10px",
  lineHeight: 1,
  color: "var(--color-ink-inverse, #ffffff)",
  opacity: 0.7,
};

const SELECT_CLASS =
  "w-full appearance-none bg-transparent border-none outline-none cursor-pointer truncate pr-[16px] pb-[3px] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-1 focus-visible:ring-white";

const SELECT_STYLE: React.CSSProperties = {
  fontSize: "10px",
  lineHeight: 1.2,
  color: "var(--color-ink-inverse, #ffffff)",
};

/**
 * One Main Task of a scene.
 *
 * Carries ProcessCard's material — task surface, card radius, the process's
 * colour as a strip along the top edge, name top-left, position badge
 * top-right — with AssetTaskCard's control mechanics: a transparent
 * appearance-none select sitting on a hairline underline with its own caret.
 *
 * No progress ring. A single task resolves to one status, not a percentage;
 * the ring belongs to the Episode board, where processes roll up across scenes.
 */
export const SceneTaskCardComponent: React.FC<SceneTaskCardProps> = ({
  task,
  statusOptions,
  users,
  onStatusChange,
  onAssigneeChange,
  busy = false,
}) => {
  const hasStatusWorkflow = task.taskStatusWorkflowId !== null;

  /*
    A task whose current status is not among the active options — the status
    was retired, or the task predates the workflow — would otherwise render as
    a blank select and silently rewrite itself on the next change. The current
    value is kept as an explicit option instead.
  */
  const currentStatusMissing =
    task.taskStatusDefinitionId !== null &&
    !statusOptions.some((s) => s.id === task.taskStatusDefinitionId);

  /*
    assignee is a text column with no FK. It now holds a profile uuid, but rows
    written before that — or by an assignee who has since been deactivated —
    can hold anything. Show the raw value rather than misreporting Unassigned.
  */
  const assigneeUnknown =
    task.assignee !== null && !users.some((u) => u.id === task.assignee);

  return (
    <div
      className="relative shrink-0 overflow-hidden select-none font-sans flex flex-col"
      style={{
        width: CARD_WIDTH + "px",
        height: CARD_HEIGHT + "px",
        backgroundColor: "var(--color-task-surface, #363636)",
        borderRadius: "var(--radius-card, 7px)",
      }}
    >
      {/* Coloured tab strip along the top edge, in the process's own colour. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0"
        style={{
          height: TAB_HEIGHT + "px",
          backgroundColor:
            task.processColour || "var(--color-placeholder, #d9d9d9)",
        }}
      />

      <div
        className="flex flex-row items-start justify-between gap-2"
        style={{ padding: `${TAB_HEIGHT + 10}px 10px 0 10px` }}
      >
        <span
          className="min-w-0 leading-tight line-clamp-3"
          style={{
            fontSize: "var(--text-list, 12px)",
            color: "var(--color-ink-inverse, #ffffff)",
          }}
        >
          {task.name}
        </span>

        {task.processPosition !== null && (
          <span
            className="shrink-0 inline-flex items-center justify-center"
            style={{
              minWidth: "18px",
              height: "18px",
              padding: "0 5px",
              borderRadius: "var(--radius-sm, 3px)",
              backgroundColor: "var(--color-task-surface-alt, #484747)",
              fontSize: "var(--text-caption, 11px)",
              color: "var(--color-ink-inverse, #ffffff)",
            }}
          >
            {task.processPosition}
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 px-[10px] pb-[12px]">
        {/* Assigned */}
        <div className="flex flex-row items-end gap-2">
          <span className="shrink-0" style={LABEL_STYLE}>
            Assigned
          </span>
          <div
            className="relative flex-1 min-w-0"
            style={{
              borderBottom: "1px solid var(--color-ink-inverse, #ffffff)",
            }}
          >
            <select
              aria-label={`Assignee for ${task.name}`}
              value={task.assignee ?? ""}
              disabled={busy}
              onChange={(e) =>
                onAssigneeChange(task.id, e.target.value || null)
              }
              className={SELECT_CLASS}
              style={SELECT_STYLE}
            >
              <option value="" className="text-black">
                Unassigned
              </option>
              {assigneeUnknown && (
                <option value={task.assignee ?? ""} className="text-black">
                  {task.assignee} (unknown)
                </option>
              )}
              {users.map((user) => (
                <option key={user.id} value={user.id} className="text-black">
                  {user.displayName}
                </option>
              ))}
            </select>
            <span className="absolute right-0 bottom-[2px] text-[var(--color-ink-inverse,#ffffff)]">
              <Caret />
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-row items-end gap-2">
          <span className="shrink-0" style={LABEL_STYLE}>
            Status
          </span>
          <div
            className="relative flex-1 min-w-0"
            style={{
              borderBottom: "1px solid var(--color-ink-inverse, #ffffff)",
            }}
          >
            <select
              aria-label={`Status for ${task.name}`}
              value={task.taskStatusDefinitionId ?? ""}
              /*
                A task with no task_status_workflow_id has nothing to validate a
                status against, and updateTaskStatus rejects it server-side. The
                control is disabled rather than offering a write that will throw.
              */
              disabled={busy || !hasStatusWorkflow || statusOptions.length === 0}
              onChange={(e) => {
                if (!e.target.value) return;
                onStatusChange(task.id, e.target.value);
              }}
              className={SELECT_CLASS}
              style={{ ...SELECT_STYLE, fontWeight: 600 }}
            >
              {(task.taskStatusDefinitionId === null ||
                statusOptions.length === 0) && (
                <option value="" className="text-black">
                  {task.status || "No status"}
                </option>
              )}
              {currentStatusMissing && (
                <option
                  value={task.taskStatusDefinitionId ?? ""}
                  className="text-black"
                >
                  {task.status || "Current status"} (retired)
                </option>
              )}
              {statusOptions.map((status) => (
                <option key={status.id} value={status.id} className="text-black">
                  {status.name}
                </option>
              ))}
            </select>
            <span className="absolute right-0 bottom-[2px] text-[var(--color-ink-inverse,#ffffff)]">
              <Caret />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SceneTaskCard = memo(SceneTaskCardComponent);
export default SceneTaskCard;
