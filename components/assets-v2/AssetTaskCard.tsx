"use client";

import React, { memo } from "react";
import type { AssetTaskV2 } from "@/types/production-v2";

export type AssetTaskCardProps = {
  task: AssetTaskV2;
  index: number;
  statuses: string[];
  onTaskChange?: (taskId: string, updates: { assignee?: string | null; status?: string }) => void;
};

const ASSIGNEES = ["Artist A", "Artist B", "Lead C"];

const Caret: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-[24px] h-[24px] fill-none stroke-current"
    strokeWidth={2}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * Asset task card — DESIGN_SPEC §12. 216 × 171, layered back to front:
 * back plate (0,7) 216 × 152 r4; tab A (28,0) 13 × 32; tab B (70,0) 13 × 32;
 * mid plate (0,13) 216 × 152 r10; number badge (159,0) 57 × 59 r15 with text at
 * (168,5) 41 × 33; front panel (0,19) 216 × 152 r4.
 *
 * Front panel contents (all `--color-ink-inverse`, frame-relative):
 * task name (8,30) 124 × 35; "Assigned" (8,107) with underline (93.5,119) 110.5
 * and caret (185,99) 24 × 24; "Status" (8,141) with underline (93.5,152) and
 * caret (185,133).
 */
export const AssetTaskCardComponent: React.FC<AssetTaskCardProps> = ({
  task,
  index,
  statuses,
  onTaskChange,
}) => {
  return (
    <div className="relative w-[216px] h-[171px] select-none font-sans">
      {/* 1. Back plate (0, 7) 216 × 152, radius 4 */}
      <div className="absolute left-0 top-[7px] w-[216px] h-[152px] rounded-[4px] bg-[var(--color-placeholder,#d9d9d9)]" />

      {/* 2. Tab A (28, 0) 13 × 32 */}
      <div className="absolute left-[28px] top-0 w-[13px] h-[32px] bg-[var(--color-tag-take,#fde4b6)]" />

      {/* 3. Tab B (70, 0) 13 × 32 */}
      <div className="absolute left-[70px] top-0 w-[13px] h-[32px] bg-[var(--color-tag-status,#b6fdb6)]" />

      {/* 4. Mid plate (0, 13) 216 × 152, radius 10 */}
      <div className="absolute left-0 top-[13px] w-[216px] h-[152px] rounded-[10px] bg-[var(--color-task-rail,#5dc0d2)]" />

      {/* 5. Number badge (159, 0) 57 × 59, radius 15; text (168, 5) 41 × 33 */}
      <div className="absolute left-[159px] top-0 w-[57px] h-[59px] rounded-[15px] bg-[#8b8b8b] z-20">
        <span className="absolute left-[9px] top-[5px] w-[41px] h-[33px] flex items-center justify-center text-[var(--color-ink-inverse,#ffffff)] font-bold text-[18px] leading-none">
          #{index + 1}
        </span>
      </div>

      {/* 6. Front panel (0, 19) 216 × 152, radius 4 */}
      <div className="absolute left-0 top-[19px] w-[216px] h-[152px] rounded-[4px] bg-[var(--color-task-surface,#363636)] z-10" />

      {/* --- Front panel contents --- */}
      <div className="absolute inset-0 z-10 text-[var(--color-ink-inverse,#ffffff)] pointer-events-none">
        {/* Task name (8, 30) 124 × 35 */}
        <div className="absolute left-[8px] top-[30px] w-[124px] h-[35px] text-[var(--text-list,12px)] leading-tight font-bold line-clamp-2">
          {task.taskName}
        </div>

        {/* Assigned (8, 107) */}
        <span className="absolute left-[8px] top-[107px] text-[10px] leading-none opacity-70">
          Assigned
        </span>
        <div className="absolute left-[93.5px] top-[119px] w-[110.5px] h-[1px] bg-[var(--color-ink-inverse,#ffffff)] opacity-40" />
        <div className="absolute left-[185px] top-[99px] opacity-70">
          <Caret />
        </div>
        <select
          aria-label={`Assignee for ${task.taskName}`}
          value={task.assignee || ""}
          onChange={(e) =>
            onTaskChange && onTaskChange(task.id, { assignee: e.target.value || null })
          }
          className="absolute left-[93.5px] top-[105px] w-[91.5px] h-[14px] pointer-events-auto bg-transparent text-[var(--color-ink-inverse,#ffffff)] text-[10px] leading-none border-none outline-none cursor-pointer appearance-none truncate"
        >
          <option value="" className="text-black">
            Unassigned
          </option>
          {ASSIGNEES.map((name) => (
            <option key={name} value={name} className="text-black">
              {name}
            </option>
          ))}
        </select>

        {/* Status (8, 141) */}
        <span className="absolute left-[8px] top-[141px] text-[10px] leading-none opacity-70">
          Status
        </span>
        <div className="absolute left-[93.5px] top-[152px] w-[110.5px] h-[1px] bg-[var(--color-ink-inverse,#ffffff)] opacity-40" />
        <div className="absolute left-[185px] top-[133px] opacity-70">
          <Caret />
        </div>
        <select
          aria-label={`Status for ${task.taskName}`}
          value={task.status}
          onChange={(e) => onTaskChange && onTaskChange(task.id, { status: e.target.value })}
          className="absolute left-[93.5px] top-[138px] w-[91.5px] h-[14px] pointer-events-auto bg-transparent text-[var(--color-ink-inverse,#ffffff)] text-[10px] leading-none font-bold border-none outline-none cursor-pointer appearance-none truncate"
        >
          {statuses.map((st) => (
            <option key={st} value={st} className="text-black">
              {st}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export const AssetTaskCard = memo(AssetTaskCardComponent);
export default AssetTaskCard;
