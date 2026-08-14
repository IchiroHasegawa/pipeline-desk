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

/**
 * Main task grid — DESIGN_SPEC §8.
 * Cards 185 × 105 at y 253 and 369; x 775, 967, 1158, 1350.
 * Four per row, then wrap; row pitch 116 continues past the two measured rows.
 */
const CARD_X = [775, 967, 1158, 1350];
const ROW_Y = [253, 369];
const ROW_PITCH = ROW_Y[1] - ROW_Y[0]; // 116

export const MainTaskGridComponent: React.FC<MainTaskGridProps> = ({
  tasks,
  customTasks = [],
  latestCommitsByTask = {},
}) => {
  if (tasks.length === 0) {
    return (
      <div className="absolute left-[775px] top-[253px] w-[185px] h-[105px] flex items-center justify-center p-3 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] font-sans">
        No main tasks assigned.
      </div>
    );
  }

  return (
    <>
      {tasks.map((task, idx) => {
        const col = idx % CARD_X.length;
        const row = Math.floor(idx / CARD_X.length);
        const left = CARD_X[col];
        const top = ROW_Y[0] + row * ROW_PITCH;

        const pct = Math.min(100, Math.max(0, computeMainTaskProgress(task, customTasks)));
        const latestCommit = latestCommitsByTask[task.id];

        return (
          <div
            key={task.id}
            style={{ left: `${left}px`, top: `${top}px` }}
            className="absolute w-[185px] h-[105px] p-3 border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] flex flex-col justify-between font-sans transition-colors hover:border-black"
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center justify-between gap-2">
                <h4 className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)] truncate">
                  {task.name}
                </h4>
                <span className="text-[10px] font-medium text-[var(--color-ink-muted,#707070)] tabular-nums shrink-0">
                  {pct}%
                </span>
              </div>
              <span className="text-[10px] text-[var(--color-ink-muted,#707070)] truncate">
                {task.assignee ? `Assignee: ${task.assignee}` : task.status}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="w-full h-[4px] bg-[var(--color-line-soft,#a9a9a9)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-progress,#3cac88)] transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] text-[var(--color-ink-muted,#707070)] truncate">
                {latestCommit
                  ? formatCommitLabel(latestCommit.completedAt || latestCommit.createdAt)
                  : "No recent commits"}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

export const MainTaskGrid = memo(MainTaskGridComponent);
export default MainTaskGrid;
