"use client";

import React, { memo, useMemo } from "react";
import type { MainTaskV2, CustomTaskV2, TodoV2 } from "@/types/production-v2";
import { computeMainTaskProgress } from "@/lib/timeline/taskRollup";
import { formatCommitLabel } from "@/lib/timeline/commitFormat";

export type MainTasksPanelProps = {
  mainTasks: MainTaskV2[];
  customTasks?: CustomTaskV2[];
  /** Completed To Dos used to derive each task's "Last commit …" label. */
  completedTodos?: TodoV2[];
  isLoading?: boolean;
};

/**
 * Row pitch. DESIGN_SPEC §6 measures 52 / 59 / 81 in the mock and calls it
 * content-driven; 52 is the content height (name 12 + track 4 + commit 19 plus
 * gaps), so it is applied consistently to every row.
 */
const ROW_PITCH = 52;

/**
 * Main Tasks panel — DESIGN_SPEC §6. Shared by the Episodes and Scene pages.
 *
 * Card 124 wide at (1766, 225); header (0,0) 124 × 36 with "Main Tasks" at
 * (22, 9) 80 × 18; body (0,31) 124 × 378; rail x 7 (0.5 × 359); dot x 5 (5 × 5);
 * name x 15 (80 × 12); percent x 99 (25 × 15); progress track x 10 (110 × 4);
 * "Last commit …" x 10, 7px below the bar (106 × 19).
 */
export const MainTasksPanelComponent: React.FC<MainTasksPanelProps> = ({
  mainTasks,
  customTasks = [],
  completedTodos = [],
  isLoading = false,
}) => {
  // Latest completed To Do per task, used for the commit caption.
  const latestCommitByTask = useMemo(() => {
    const map: Record<string, TodoV2> = {};
    for (const todo of completedTodos) {
      if (!todo.taskId || !todo.completedAt) continue;
      const existing = map[todo.taskId];
      if (
        !existing ||
        new Date(todo.completedAt).getTime() > new Date(existing.completedAt!).getTime()
      ) {
        map[todo.taskId] = todo;
      }
    }
    return map;
  }, [completedTodos]);

  return (
    <aside
      aria-label="Main Tasks Panel"
      className="absolute z-30 pointer-events-auto w-[124px] h-[409px] bg-[var(--color-panel,#f0f0f0)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] shadow-lg overflow-hidden font-sans"
      style={{
        left: "calc((1766 / 1920) * 100%)",
        top: "calc((225 / 1080) * 100%)",
      }}
    >
      {/* Header (0, 0) 124 × 36 */}
      <div className="absolute left-0 top-0 w-[124px] h-[36px] border-b border-[var(--color-line-soft,#a9a9a9)] bg-[var(--color-panel,#f0f0f0)] z-10">
        {/* "Main Tasks" (22, 9) 80 × 18 */}
        <span className="absolute left-[22px] top-[9px] w-[80px] h-[18px] flex items-center text-[var(--text-list,12px)] leading-none font-medium text-[var(--color-ink,#000000)] tracking-tight truncate">
          Main Tasks
        </span>
      </div>

      {/* Body (0, 31) 124 × 378 */}
      <div className="absolute left-0 top-[31px] w-[124px] h-[378px] overflow-y-auto">
        {/* Rail x 7, 0.5 × 359 */}
        <div className="absolute left-[7px] top-[6px] w-[0.5px] h-[359px] bg-[var(--color-line,#000000)] pointer-events-none" />

        {isLoading ? (
          <div className="pt-6 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]">
            Loading…
          </div>
        ) : mainTasks.length === 0 ? (
          <div className="pt-6 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]">
            No tasks
          </div>
        ) : (
          mainTasks.map((task, idx) => {
            const pct = Math.min(
              100,
              Math.max(0, computeMainTaskProgress(task, customTasks))
            );
            const commit = latestCommitByTask[task.id];

            return (
              <div
                key={task.id}
                style={{ top: `${6 + idx * ROW_PITCH}px`, height: `${ROW_PITCH}px` }}
                className="absolute left-0 w-[124px]"
              >
                {/* Dot x 5, 5 × 5 */}
                <div className="absolute left-[5px] top-[4px] w-[5px] h-[5px] rounded-full bg-[var(--color-ink,#000000)]" />

                {/* Task name x 15, 80 × 12 */}
                <span className="absolute left-[15px] top-[1px] w-[80px] h-[12px] flex items-center text-[var(--text-list,12px)] leading-none font-medium text-[var(--color-ink,#000000)] truncate">
                  {task.name}
                </span>

                {/* Percent x 99, 25 × 15 */}
                <span className="absolute left-[99px] top-0 w-[25px] h-[15px] flex items-center justify-end pr-[2px] text-[var(--text-caption,11px)] leading-none text-[var(--color-ink-muted,#707070)] tabular-nums">
                  {pct}%
                </span>

                {/* Progress track x 10, 110 × 4 */}
                <div className="absolute left-[10px] top-[19px] w-[110px] h-[4px] bg-[var(--color-line-soft,#a9a9a9)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-progress,#3cac88)] transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* "Last commit …" x 10, 7px below the bar, 106 × 19 */}
                <span className="absolute left-[10px] top-[30px] w-[106px] h-[19px] flex items-center text-[9px] leading-none text-[var(--color-ink-muted,#707070)] truncate">
                  {commit ? formatCommitLabel(commit.completedAt!) : "No commits"}
                </span>
              </div>
            );
          })
        )}

        {/* Rows are absolutely positioned; this establishes the scroll height. */}
        <div
          aria-hidden="true"
          style={{ height: `${6 + mainTasks.length * ROW_PITCH}px` }}
        />
      </div>
    </aside>
  );
};

export const MainTasksPanel = memo(MainTasksPanelComponent);
export default MainTasksPanel;
