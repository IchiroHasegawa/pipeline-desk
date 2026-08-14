"use client";

import React, { memo } from "react";

export type TaskCardProps = {
  id: string;
  title: string;
  contributesToTaskName?: string | null;
  selected: boolean;
  onSelect: (id: string) => void;
};

/**
 * Scene task card — DESIGN_SPEC §7.
 * Frame 217.7 × 235.6; tab (0,0) 75 × 25; "Task" label (6,4) 33 × 18;
 * body (0,13) 155 × 167; description (6,38) 139 × 129.
 * All offsets are frame-relative, so the parts are absolutely positioned.
 */
export const TaskCardComponent: React.FC<TaskCardProps> = ({
  id,
  title,
  contributesToTaskName,
  selected,
  onSelect,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect(id);
        }
      }}
      className="relative w-[217.7px] h-[235.6px] cursor-pointer select-none font-sans pointer-events-auto outline-none"
    >
      {/* Body (0, 13) 155 × 167 — sits behind the tab */}
      <div
        className={`absolute left-0 top-[13px] w-[155px] h-[167px] rounded-[var(--radius-sm,3px)] border border-[var(--color-line,#000000)] transition-colors ${
          selected
            ? "bg-[#8b8b8b] ring-2 ring-black"
            : "bg-[var(--color-task-surface,#363636)]"
        }`}
      />

      {/* Description (6, 38) 139 × 129 */}
      <div className="absolute left-[6px] top-[38px] w-[139px] h-[129px] overflow-hidden flex flex-col gap-1">
        <h4 className="text-[var(--text-caption,11px)] font-medium text-[var(--color-ink-inverse,#ffffff)] truncate">
          {title}
        </h4>
        {contributesToTaskName && (
          <p className="text-[10px] leading-snug text-[var(--color-ink-inverse,#ffffff)]/80 line-clamp-4">
            Contributes to: {contributesToTaskName}
          </p>
        )}
      </div>

      {/* Tab (0, 0) 75 × 25 */}
      <div className="absolute left-0 top-0 w-[75px] h-[25px] bg-[var(--color-placeholder,#d9d9d9)] rounded-t-[var(--radius-sm,3px)] border border-b-0 border-[var(--color-line,#000000)]">
        {/* "Task" label (6, 4) 33 × 18 */}
        <span className="absolute left-[6px] top-[4px] w-[33px] h-[18px] flex items-center text-[var(--text-caption,11px)] font-mono font-medium text-[var(--color-ink,#000000)]">
          Task
        </span>
      </div>
    </div>
  );
};

export const TaskCard = memo(TaskCardComponent);
export default TaskCard;
