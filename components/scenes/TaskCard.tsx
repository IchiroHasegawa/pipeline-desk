"use client";

import React, { memo } from "react";
import { Point } from "@/lib/timeline/timelineGeometry";

export type TaskCardProps = {
  id: string;
  title: string;
  description: string;
  selected: boolean;
  anchor: Point; // branch endpoint
  onSelect: (id: string) => void;
};

export const TaskCardComponent: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  selected,
  anchor,
  onSelect,
}) => {
  // Offset card slightly from branch endpoint
  const cardLeft = anchor.x + 20;
  const cardTop = anchor.y - 40;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          onSelect(id);
        }
      }}
      className="absolute z-20 cursor-pointer select-none font-sans pointer-events-auto transition-all duration-300"
      style={{
        left: `${cardLeft}px`,
        top: `${cardTop}px`,
        width: "155px",
        height: "180px",
      }}
    >
      {/* 0.5px leader line connecting anchor to card edge */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
        style={{ left: "-20px", top: "40px", width: "20px", height: "1px" }}
      >
        <line
          x1={0}
          y1={0}
          x2={20}
          y2={0}
          stroke="var(--color-line, #000000)"
          strokeWidth={0.5}
        />
      </svg>

      {/* Tab (75 x 25, overlaps 13px above body) */}
      <div className="w-[75px] h-[25px] bg-[var(--color-placeholder,#d9d9d9)] rounded-t-[var(--radius-sm,3px)] border border-b-0 border-[var(--color-line,#000000)] px-1.5 flex items-center">
        <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink,#000000)] font-medium truncate">
          Task
        </span>
      </div>

      {/* Body (155 x 167) */}
      <div
        className={`w-[155px] h-[167px] -mt-[13px] rounded-[var(--radius-sm,3px)] border border-[var(--color-line,#000000)] p-2.5 transition-colors flex flex-col gap-1.5 ${
          selected
            ? "bg-[#8b8b8b] ring-2 ring-black"
            : "bg-[var(--color-task-surface,#363636)]"
        }`}
      >
        <h4 className="text-[var(--text-caption,11px)] font-medium text-[var(--color-ink-inverse,#ffffff)] truncate">
          {title}
        </h4>
        <p className="text-[10px] text-[var(--color-ink-inverse,#ffffff)]/80 leading-snug line-clamp-6">
          {description || "No task description provided."}
        </p>
      </div>
    </div>
  );
};

export const TaskCard = memo(TaskCardComponent);
export default TaskCard;
