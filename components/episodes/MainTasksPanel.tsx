"use client";

import React, { memo } from "react";
import type { MainTaskV2, CustomTaskV2, TodoV2 } from "@/types/production-v2";
import { computeMainTaskProgress } from "@/lib/timeline/taskRollup";
import { formatCommitLabel } from "@/lib/timeline/commitFormat";

export type MainTasksPanelProps = {
  mainTasks: MainTaskV2[];
  customTasks?: CustomTaskV2[];
  completedTodos?: TodoV2[];
};

export const MainTasksPanelComponent: React.FC<MainTasksPanelProps> = ({
  mainTasks,
  customTasks = [],
  completedTodos = [],
}) => {
  // Find latest completed todo timestamp for each task
  const getLatestCommitTime = (taskId: string): string | null => {
    const taskTodos = completedTodos.filter(
      (t) => t.taskId === taskId && t.completedAt !== null
    );
    if (taskTodos.length === 0) return null;
    taskTodos.sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );
    return taskTodos[0].completedAt!;
  };

  return (
    <div
      aria-label="Main Tasks Panel"
      style={{
        position: "fixed",
        left: "1766px",
        top: "225px",
        width: "124px",
        height: "414px",
        zIndex: 40,
      }}
      className="pointer-events-auto select-none font-sans"
    >
      {/* Header bar (124 x 36 at 0, 0) */}
      <div className="absolute left-0 top-0 w-[124px] h-[36px] bg-[var(--color-panel,#ffffff)] border border-[var(--color-line,#000000)] rounded-t-[var(--radius-sm,3px)] flex items-center px-[22px] z-10">
        <span className="text-[var(--text-section,12px)] font-bold text-[var(--color-ink,#000000)] tracking-tight">
          Main Tasks
        </span>
      </div>

      {/* Body (124 x 378 at 0, 31) */}
      <div className="absolute left-0 top-[31px] w-[124px] h-[378px] bg-[var(--color-panel,#ffffff)] border-x border-b border-[var(--color-line,#000000)] rounded-b-[var(--radius-sm,3px)] p-2 overflow-y-auto z-0">
        {/* Vertical rail (0.5px x 359 at x=7) */}
        <div className="absolute left-[7px] top-2 bottom-2 w-[0.5px] bg-[var(--color-line,#000000)] pointer-events-none" />

        {mainTasks.length === 0 ? (
          <div className="pl-4 pt-2 text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]">
            No tasks
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-1">
            {mainTasks.map((task) => {
              const progressPct = computeMainTaskProgress(task, customTasks);
              const latestCommit = getLatestCommitTime(task.id);
              const commitText = latestCommit
                ? formatCommitLabel(latestCommit)
                : "No commits";

              return (
                <div key={task.id} className="relative pl-[15px] flex flex-col gap-1">
                  {/* Row dot (5x5 ellipse at x=5) */}
                  <div className="absolute left-[3px] top-[4px] w-[5px] h-[5px] rounded-full bg-[var(--color-ink,#000000)]" />

                  {/* Task Name & Percent */}
                  <div className="flex items-center justify-between pr-1">
                    <span className="truncate w-[70px] text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)]">
                      {task.name}
                    </span>
                    <span className="text-[var(--text-caption,11px)] text-[var(--color-ink,#000000)] font-mono">
                      {progressPct}%
                    </span>
                  </div>

                  {/* Progress track & fill (110 x 4) */}
                  <div className="w-[95px] h-[4px] bg-[var(--color-line-soft,#d9d9d9)] rounded-full overflow-hidden relative">
                    <div
                      style={{ width: `${progressPct}%` }}
                      className="h-full bg-[var(--color-progress,#327c53)] transition-all duration-300"
                    />
                  </div>

                  {/* Last commit label */}
                  <span className="text-[9px] text-[var(--color-ink-muted,#707070)] truncate w-[95px]">
                    {commitText}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const MainTasksPanel = memo(MainTasksPanelComponent);
export default MainTasksPanel;
