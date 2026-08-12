"use client";

import React, { memo } from "react";
import type { CustomTaskV2 } from "@/types/production-v2";

export type CustomTasksPanelProps = {
  tasks: CustomTaskV2[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onToggleComplete: (id: string, complete: boolean) => void;
};

export const CustomTasksPanelComponent: React.FC<CustomTasksPanelProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleComplete,
}) => {
  return (
    <aside
      aria-label="Custom Tasks Panel"
      className="absolute z-30 pointer-events-auto w-[124px] bg-[var(--color-panel,#f0f0f0)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] shadow-lg overflow-hidden transition-all duration-300 font-sans"
      style={{
        left: "calc((1611 / 1920) * 100%)",
        top: "calc((226 / 1080) * 100%)",
        height: "189px",
      }}
    >
      {/* Header bar */}
      <div className="h-[36px] px-3 flex items-center border-b border-[var(--color-line-soft,#a9a9a9)] bg-[var(--color-panel,#f0f0f0)]">
        <span className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink,#000000)] tracking-tight truncate">
          Custom Tasks
        </span>
      </div>

      {/* Body */}
      <div className="p-2 flex flex-col gap-2 relative h-[153px] overflow-y-auto">
        {/* Hairline vertical rail */}
        <div className="absolute left-[6px] top-2 bottom-2 w-[0.5px] bg-[var(--color-line,#000000)] pointer-events-none" />

        {tasks.length === 0 ? (
          <div className="py-6 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]">
            No custom tasks
          </div>
        ) : (
          tasks.map((task) => {
            const isSelected = task.id === selectedTaskId;
            const isCompleted = task.progress === 100;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={`relative pl-3 pr-1 py-1 flex flex-row items-center justify-between cursor-pointer rounded-[var(--radius-xs,1px)] transition-colors ${
                  isSelected ? "bg-[var(--color-selection,#d9d9d9)] font-medium" : "hover:bg-neutral-200/50"
                }`}
              >
                {/* Row Dot */}
                <div className="absolute left-[4px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-[var(--color-ink,#000000)] -translate-x-1/2" />

                <span
                  className={`text-[var(--text-list,12px)] truncate max-w-[70px] ${
                    isCompleted ? "line-through text-[var(--color-ink-muted,#707070)]" : "text-[var(--color-ink,#000000)]"
                  }`}
                >
                  {task.name}
                </span>

                {/* Checkbox (10 x 10) */}
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task.id, e.target.checked);
                  }}
                  className="w-[10px] h-[10px] accent-black cursor-pointer shrink-0"
                />
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export const CustomTasksPanel = memo(CustomTasksPanelComponent);
export default CustomTasksPanel;
