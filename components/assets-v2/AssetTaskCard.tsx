"use client";

import React, { memo } from "react";
import type { AssetTaskV2 } from "@/types/production-v2";

export type AssetTaskCardProps = {
  task: AssetTaskV2;
  index: number;
  statuses: string[];
  onTaskChange?: (taskId: string, updates: { assignee?: string | null; status?: string }) => void;
};

export const AssetTaskCardComponent: React.FC<AssetTaskCardProps> = ({
  task,
  index,
  statuses,
  onTaskChange,
}) => {
  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (onTaskChange) {
      onTaskChange(task.id, { assignee: val || null });
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (onTaskChange) {
      onTaskChange(task.id, { status: val });
    }
  };

  return (
    <div className="relative w-[216px] h-[171px] select-none font-sans">
      {/* 1. Back plate: (0, 7) 216 x 152, radius 4 */}
      <div className="absolute left-0 top-[7px] w-[216px] h-[152px] rounded-[4px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)]" />

      {/* 2. Tab A: (28, 0) 13 x 32 */}
      <div className="absolute left-[28px] top-0 w-[13px] h-[32px] bg-[var(--color-tag-take,#ff8080)] rounded-t-xs" />

      {/* 3. Tab B: (70, 0) 13 x 32 */}
      <div className="absolute left-[70px] top-0 w-[13px] h-[32px] bg-[var(--color-tag-status,#80c0ff)] rounded-t-xs" />

      {/* 4. Mid plate: (0, 13) 216 x 152, radius 10 */}
      <div className="absolute left-0 top-[13px] w-[216px] h-[152px] rounded-[10px] bg-[var(--color-task-rail,#b0b0b0)] shadow-xs" />

      {/* 5. Number badge: (159, 0) 57 x 59, radius 15 */}
      <div className="absolute left-[159px] top-0 w-[57px] h-[59px] rounded-[15px] bg-[#8b8b8b] flex items-center justify-center text-[var(--color-ink-inverse,#ffffff)] font-mono font-bold text-[18px] shadow-sm z-20">
        #{index + 1}
      </div>

      {/* 6. Front panel: (0, 19) 216 x 152, radius 4 */}
      <div className="absolute left-0 top-[19px] w-[216px] h-[152px] rounded-[4px] bg-[var(--color-task-surface,#333333)] text-[var(--color-ink-inverse,#ffffff)] p-2 flex flex-col justify-between z-10 shadow-md">
        {/* Task Name */}
        <div className="text-[var(--text-list,12px)] font-bold truncate max-w-[140px] pt-1">
          {task.taskName}
        </div>

        {/* Form Controls */}
        <div className="flex flex-col gap-1.5 pb-1 text-[10px]">
          {/* Assigned Select */}
          <div className="flex flex-row items-center justify-between gap-1 border-b border-white/20 pb-0.5">
            <span className="text-[var(--color-ink-inverse,#ffffff)] opacity-70">Assigned</span>
            <select
              value={task.assignee || ""}
              onChange={handleAssigneeChange}
              className="bg-transparent text-[var(--color-ink-inverse,#ffffff)] text-[10px] border-none outline-none font-mono cursor-pointer max-w-[120px]"
            >
              <option value="" className="text-black">Unassigned</option>
              <option value="Artist A" className="text-black">Artist A</option>
              <option value="Artist B" className="text-black">Artist B</option>
              <option value="Lead C" className="text-black">Lead C</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="flex flex-row items-center justify-between gap-1 border-b border-white/20 pb-0.5">
            <span className="text-[var(--color-ink-inverse,#ffffff)] opacity-70">Status</span>
            <select
              value={task.status}
              onChange={handleStatusChange}
              className="bg-transparent text-[var(--color-ink-inverse,#ffffff)] text-[10px] border-none outline-none font-mono font-bold cursor-pointer max-w-[120px]"
            >
              {statuses.map((st) => (
                <option key={st} value={st} className="text-black">
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AssetTaskCard = memo(AssetTaskCardComponent);
export default AssetTaskCard;
