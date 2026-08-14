"use client";

import React, { memo } from "react";
import type { CustomTaskV2 } from "@/types/production-v2";

export type CustomTasksPanelProps = {
  tasks: CustomTaskV2[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onToggleComplete: (id: string, complete: boolean) => void;
};

/** DESIGN_SPEC §7 — row pitch 51px. */
const ROW_PITCH = 51;

/**
 * Custom Tasks panel — DESIGN_SPEC §7.
 * Card 124 wide at (1611, 226); header (0,0) 124 × 36; body (0,30) 124 × 153;
 * rail x 6 (0.5 × 140); dot x 4 (5 × 5); task name x 11 (80 × 12);
 * checkbox x 75 (10 × 10).
 */
export const CustomTasksPanelComponent: React.FC<CustomTasksPanelProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleComplete,
}) => {
  return (
    <aside
      aria-label="Custom Tasks Panel"
      className="absolute z-30 pointer-events-auto w-[124px] h-[183px] bg-[var(--color-panel,#f0f0f0)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] shadow-lg overflow-hidden font-sans"
      style={{
        left: "calc((1611 / 1920) * 100%)",
        top: "calc((226 / 1080) * 100%)",
      }}
    >
      {/* Header (0, 0) 124 × 36 */}
      <div className="absolute left-0 top-0 w-[124px] h-[36px] border-b border-[var(--color-line-soft,#a9a9a9)] bg-[var(--color-panel,#f0f0f0)] z-10">
        {/* "Custom Tasks" (12, 9) 100 × 18 */}
        <span className="absolute left-[12px] top-[9px] w-[100px] h-[18px] flex items-center text-[var(--text-section,18px)] leading-none font-medium text-[var(--color-ink,#000000)] tracking-tight truncate">
          Custom Tasks
        </span>
      </div>

      {/* Body (0, 30) 124 × 153 */}
      <div className="absolute left-0 top-[30px] w-[124px] h-[153px] overflow-y-auto">
        {/* Rail x 6, 0.5 × 140 */}
        <div className="absolute left-[6px] top-[6px] w-[0.5px] h-[140px] bg-[var(--color-line,#000000)] pointer-events-none" />

        {tasks.length === 0 ? (
          <div className="pt-6 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]">
            No custom tasks
          </div>
        ) : (
          tasks.map((task, idx) => {
            const isSelected = task.id === selectedTaskId;
            const isCompleted = task.progress === 100;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                style={{ top: `${6 + idx * ROW_PITCH}px`, height: `${ROW_PITCH}px` }}
                className={`absolute left-0 w-[124px] cursor-pointer transition-colors ${
                  isSelected ? "bg-[var(--color-selection,#d9d9d9)]" : "hover:bg-neutral-200/50"
                }`}
              >
                {/* Dot x 4, 5 × 5 */}
                <div className="absolute left-[4px] top-[4px] w-[5px] h-[5px] rounded-full bg-[var(--color-ink,#000000)]" />

                {/* Task name x 11, 80 × 12 */}
                <span
                  className={`absolute left-[11px] top-[1px] w-[80px] h-[12px] flex items-center text-[var(--text-list,12px)] leading-none truncate ${
                    isSelected ? "font-medium" : ""
                  } ${
                    isCompleted
                      ? "line-through text-[var(--color-ink-muted,#707070)]"
                      : "text-[var(--color-ink,#000000)]"
                  }`}
                >
                  {task.name}
                </span>

                {/* Checkbox x 75, 10 × 10 */}
                <input
                  type="checkbox"
                  aria-label={`Mark ${task.name} complete`}
                  checked={isCompleted}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task.id, e.target.checked);
                  }}
                  className="absolute left-[75px] top-[1px] w-[10px] h-[10px] m-0 accent-black cursor-pointer"
                />
              </div>
            );
          })
        )}

        {/* Rows are absolutely positioned; this establishes the scroll height. */}
        <div style={{ height: `${6 + tasks.length * ROW_PITCH}px` }} aria-hidden="true" />
      </div>
    </aside>
  );
};

export const CustomTasksPanel = memo(CustomTasksPanelComponent);
export default CustomTasksPanel;
