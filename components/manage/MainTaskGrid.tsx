"use client";

import React, { memo } from "react";
import type { MainTaskV2, CustomTaskV2, TodoV2 } from "@/types/production-v2";
import { computeMainTaskProgress } from "@/lib/timeline/taskRollup";
import { formatCommitLabel } from "@/lib/timeline/commitFormat";

export type MainTaskGridProps = {
  tasks: MainTaskV2[];
  customTasks?: CustomTaskV2[];
  latestCommitsByTask?: Record<string, TodoV2>;
};

export const MainTaskGridComponent: React.FC<MainTaskGridProps> = ({
  tasks,
  customTasks = [],
  latestCommitsByTask = {},
}) => {
  if (tasks.length === 0) {
    return (
      <div className="p-8 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] font-mono">
        No main tasks assigned.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 w-[775px] font-sans">
      {tasks.map((task) => {
        const displayedPct = computeMainTaskProgress(task, customTasks);
        const latestCommit = latestCommitsByTask[task.id];

        return (
          <div
            key={task.id}
            className="w-[185px] h-[105px] p-3 border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] flex flex-col justify-between shadow-xs transition-colors hover:border-black"
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center justify-between">
                <h4 className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)] truncate max-w-[120px]">
                  {task.name}
                </h4>
                <span className="text-[10px] font-mono font-medium text-[var(--color-ink-muted,#707070)]">
                  {displayedPct}%
                </span>
              </div>
              <span className="text-[10px] text-[var(--color-ink-muted,#707070)] truncate">
                {task.assignee ? `Assignee: ${task.assignee}` : task.status}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {/* Progress Bar */}
              <div className="w-full h-[4px] bg-[var(--color-line-soft,#a9a9a9)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-progress,#000000)] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, displayedPct))}%` }}
                />
              </div>

              {/* Last commit caption */}
              <span className="text-[9px] font-mono text-[var(--color-ink-muted,#707070)] truncate">
                {latestCommit
                  ? formatCommitLabel(latestCommit.completedAt || latestCommit.createdAt)
                  : "No recent commits"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const MainTaskGrid = memo(MainTaskGridComponent);
export default MainTaskGrid;
