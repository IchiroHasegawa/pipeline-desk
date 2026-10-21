"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  HardDrive,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { Select, type SelectOption } from "@/components/app-shell/Select";
import { formatBytes } from "@/lib/format/production";
import { updateAssetTaskStatus, updateAssetTask } from "@/app/actions/production";
import type {
  AssetV2,
  AssetBoardTask,
  TaskStatusOption,
  AssignableUser,
} from "@/types/production-v2";

export interface AssetDetailPanelProps {
  asset: AssetV2 | null;
  tasks: AssetBoardTask[];
  fileStats?: { fileCount: number; totalBytes: number };
  workflowOptions: Record<string, TaskStatusOption[]>;
  assignableUsers: AssignableUser[];
  scopeLabel?: string;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: AssetBoardTask) => void;
}

export const AssetDetailPanel: React.FC<AssetDetailPanelProps> = ({
  asset,
  tasks: initialTasks,
  fileStats,
  workflowOptions,
  assignableUsers,
  scopeLabel,
  onClose,
  onTaskUpdated,
}) => {
  const [tasks, setTasks] = useState<AssetBoardTask[]>(initialTasks);
  const [prevInitialTasks, setPrevInitialTasks] = useState<AssetBoardTask[]>(initialTasks);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync tasks when initialTasks prop changes
  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }


  // Handle Escape key
  useEffect(() => {
    if (!asset) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [asset, onClose]);

  // Assignee options for Select
  const assigneeOptions: SelectOption[] = useMemo(() => {
    const opts: SelectOption[] = [
      {
        value: "__unassigned__",
        label: "Unassigned",
        avatarInitials: "-",
      },
      ...assignableUsers.map((u) => {
        const parts = u.displayName.trim().split(/\s+/);
        const initials =
          parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : (u.displayName.slice(0, 2) || "U").toUpperCase();
        return {
          value: u.displayName,
          label: u.displayName,
          avatarInitials: initials,
        };
      }),
    ];
    return opts;
  }, [assignableUsers]);

  // Handle task status update with optimistic update and rollback
  const handleStatusChange = useCallback(
    async (task: AssetBoardTask, newDefinitionId: string) => {
      if (!task.taskStatusWorkflowId) return;
      const opts = workflowOptions[task.taskStatusWorkflowId] || [];
      const newOpt = opts.find((o) => o.id === newDefinitionId);
      if (!newOpt) return;

      const prevTask = { ...task };
      const optimisticTask: AssetBoardTask = {
        ...task,
        taskStatusDefinitionId: newOpt.id,
        status: newOpt.name,
      };

      // Optimistic state
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? optimisticTask : t))
      );
      if (onTaskUpdated) onTaskUpdated(optimisticTask);

      try {
        setErrorMessage(null);
        await updateAssetTaskStatus(task.id, newDefinitionId);
      } catch (err: unknown) {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? prevTask : t))
        );
        if (onTaskUpdated) onTaskUpdated(prevTask);
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(`Failed to update status for ${task.taskName}: ${msg}`);
      }
    },
    [workflowOptions, onTaskUpdated]
  );

  // Handle task assignee update with optimistic update and rollback
  const handleAssigneeChange = useCallback(
    async (task: AssetBoardTask, newAssigneeValue: string) => {
      const newAssignee =
        newAssigneeValue === "__unassigned__" ? null : newAssigneeValue;

      const prevTask = { ...task };
      const optimisticTask: AssetBoardTask = {
        ...task,
        assignee: newAssignee,
      };

      // Optimistic state
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? optimisticTask : t))
      );
      if (onTaskUpdated) onTaskUpdated(optimisticTask);

      try {
        setErrorMessage(null);
        await updateAssetTask(task.id, { assignee: newAssignee });
      } catch (err: unknown) {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? prevTask : t))
        );
        if (onTaskUpdated) onTaskUpdated(prevTask);
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMessage(
          `Failed to update assignee for ${task.taskName}: ${msg}`
        );
      }
    },
    [onTaskUpdated]
  );

  if (!asset) return null;

  const filesCount = fileStats?.fileCount ?? 0;
  const totalBytes = fileStats?.totalBytes ?? 0;

  return (
    <>
      {/* Backdrop for outside click dismissal */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Container */}
      <aside
        role="dialog"
        aria-label={`Details for ${asset.name}`}
        aria-modal="true"
        className="fixed top-3 right-3 bottom-3 z-50 flex w-[420px] flex-col overflow-hidden rounded-[24px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-lg)] animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--po-line)] px-5">
          <span className="text-[13px] font-semibold tracking-tight text-[var(--po-ink-3)] uppercase">
            Asset Details
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--po-ink-3)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Inline Error Notice */}
        {errorMessage && (
          <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-xl border border-[#E5534B]/30 bg-[#E5534B]/10 p-3 text-[12px] text-[#E5534B]">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="hover:opacity-75"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Asset Preview Thumbnail */}
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-[16px] border border-[var(--po-line)] bg-[var(--po-sunken)] shadow-inner">
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--po-ink-3)]">
              <FolderOpen size={36} className="opacity-40" />
              <span className="text-[12px] font-medium">No preview image</span>
            </div>
            {asset.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.previewUrl}
                alt={asset.name}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>

          {/* Asset Meta Info */}
          <div className="space-y-2.5">
            <h2 className="text-[20px] font-bold text-[var(--po-ink)] tracking-tight">
              {asset.name}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              {asset.assetCode && (
                <span className="rounded-md bg-[var(--po-chip)] px-2 py-0.5 font-mono font-medium text-[var(--po-ink)] text-[11px] border border-[var(--po-line)]">
                  {asset.assetCode}
                </span>
              )}
              {asset.category && (
                <span className="font-medium text-[var(--po-ink-2)]">
                  {asset.category}
                </span>
              )}
              {asset.priority && (
                <>
                  <span className="text-[var(--po-ink-3)]">·</span>
                  <span className="font-medium text-[var(--po-ink-2)]">
                    {asset.priority}
                  </span>
                </>
              )}
              {scopeLabel && (
                <>
                  <span className="text-[var(--po-ink-3)]">·</span>
                  <span className="text-[var(--po-ink-3)]">{scopeLabel}</span>
                </>
              )}
            </div>

            {asset.description && (
              <p className="text-[13px] leading-relaxed text-[var(--po-ink-2)] pt-1">
                {asset.description}
              </p>
            )}
          </div>

          {/* Drive Files Section */}
          <div className="space-y-2 pt-2 border-t border-[var(--po-line)]">
            <span className="text-[12px] font-semibold text-[var(--po-ink-3)] uppercase tracking-wider">
              Files
            </span>
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[var(--po-line)] bg-[var(--po-sunken)]/60 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--po-card)] text-[var(--po-ink-2)] border border-[var(--po-line)] shadow-xs">
                <HardDrive size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[var(--po-ink)]">
                  {filesCount > 0
                    ? `${filesCount} file${filesCount > 1 ? "s" : ""}`
                    : "No files"}
                </div>
                <div className="text-[12px] text-[var(--po-ink-3)]">
                  {filesCount > 0
                    ? `${formatBytes(totalBytes)} in storage`
                    : "No files uploaded to this asset"}
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-3 pt-2 border-t border-[var(--po-line)]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--po-ink-3)] uppercase tracking-wider">
                Tasks ({tasks.length})
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--po-line)] p-4 text-center text-[13px] text-[var(--po-ink-3)]">
                No tasks assigned to this asset yet.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const wfId = task.taskStatusWorkflowId;
                  const opts = wfId ? workflowOptions[wfId] || [] : [];
                  const selectOptions: SelectOption[] = opts.map((opt) => ({
                    value: opt.id,
                    label: opt.name,
                    colour: opt.colour,
                  }));

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col gap-2 rounded-[14px] border border-[var(--po-line)] bg-[var(--po-sunken)]/60 p-3"
                    >
                      {/* Task Process Title & Dot */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {task.processColour && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: task.processColour }}
                            />
                          )}
                          <span className="truncate text-[13px] font-semibold text-[var(--po-ink)]">
                            {task.taskName}
                          </span>
                        </div>
                        {task.processName && (
                          <span className="shrink-0 text-[11px] font-medium text-[var(--po-ink-3)]">
                            {task.processName}
                          </span>
                        )}
                      </div>

                      {/* Dropdowns Row: Status & Assignee */}
                      <div className="flex items-center gap-2 pt-1">
                        {/* Status Select */}
                        <div className="flex-1 min-w-0">
                          {wfId && selectOptions.length > 0 ? (
                            <Select
                              value={task.taskStatusDefinitionId}
                              options={selectOptions}
                              onChange={(val) => handleStatusChange(task, val)}
                              ariaLabel={`Status for ${task.taskName}`}
                              size="sm"
                            />
                          ) : (
                            <span className="inline-flex h-[32px] w-full items-center rounded-lg border border-[var(--po-line)] bg-[var(--po-card)] px-2.5 text-[12px] font-medium text-[var(--po-ink-2)]">
                              {task.status || "Not Started"}
                            </span>
                          )}
                        </div>

                        {/* Assignee Select */}
                        <div className="flex-1 min-w-0">
                          <Select
                            value={task.assignee || "__unassigned__"}
                            options={assigneeOptions}
                            onChange={(val) => handleAssigneeChange(task, val)}
                            ariaLabel={`Assignee for ${task.taskName}`}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
