/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo } from "react";
import type { AssetV2, AssetTaskV2 } from "@/types/production-v2";
import AssetTaskCard from "@/components/assets-v2/AssetTaskCard";

export type AssetRowTableProps = {
  assets: AssetV2[];
  assetTasksMap: Record<string, AssetTaskV2[]>;
  statuses: string[];
  onTaskChange?: (taskId: string, updates: { assignee?: string | null; status?: string }) => void;
};

export const AssetRowTableComponent: React.FC<AssetRowTableProps> = ({
  assets,
  assetTasksMap,
  statuses,
  onTaskChange,
}) => {
  return (
    <div className="relative w-[1851px] flex flex-col font-sans select-none min-h-[825px]">
      {/* Vertical Column Dividers (x: 328.5, 571, 1736) */}
      <div className="absolute left-[328.5px] top-0 bottom-0 w-[1px] bg-[var(--color-line-soft,#a9a9a9)] pointer-events-none z-10" />
      <div className="absolute left-[571px] top-0 bottom-0 w-[1px] bg-[var(--color-line-soft,#a9a9a9)] pointer-events-none z-10" />
      <div className="absolute left-[1736px] top-0 bottom-0 w-[1px] bg-[var(--color-line-soft,#a9a9a9)] pointer-events-none z-10" />

      {/* 1. Header Row & Rule (33, 245) 1851 x 1px */}
      <div className="flex flex-row items-center py-3 text-[var(--text-list,12px)] font-bold text-[var(--color-ink,#000000)] border-b border-[var(--color-line,#000000)] relative z-20">
        <div className="w-[33px]" />
        <div className="w-[295px]">Preview</div>
        <div className="w-[242.5px]">Asset name</div>
        <div className="flex-1 pl-4">Tasks</div>
        <div className="w-[115px] pl-4">Notes</div>
      </div>

      {/* 2. Asset Rows or Centered Empty State */}
      {assets.length === 0 ? (
        <div className="flex-1 min-h-[700px] flex items-center justify-center p-12 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-sans font-medium relative z-20">
          No assets in this episode yet.
        </div>
      ) : (
        assets.map((asset) => {
          const tasks = assetTasksMap[asset.id] || [];

          return (
            <div
              key={asset.id}
              className="flex flex-row items-start py-4 border-b border-[var(--color-line-soft,#a9a9a9)] transition-colors hover:bg-black/5 relative z-20"
            >
              {/* Checkbox (x 5) */}
              <div className="w-[33px] pt-2 flex justify-center">
                <input
                  type="checkbox"
                  aria-label={`Select asset ${asset.name}`}
                  className="w-[22px] h-[22px] rounded-[3px] border border-[var(--color-line,#000000)] accent-black cursor-pointer"
                />
              </div>

              {/* Preview (278 x 171) */}
              <div className="w-[295px] pr-4 shrink-0">
                <div className="w-[278px] h-[171px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-sm,3px)] overflow-hidden flex items-center justify-center">
                  {asset.previewUrl ? (
                    <img
                      src={asset.previewUrl}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 font-mono text-[var(--color-ink-muted,#707070)] text-[10px]">
                      <span>[PREVIEW]</span>
                      <span>{asset.assetCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Description */}
              <div className="w-[242px] pr-4 flex flex-col gap-1 shrink-0 pt-1">
                <h4 className="text-[var(--text-list,12px)] font-bold text-[var(--color-ink,#000000)]">
                  {asset.name}
                </h4>
                <span className="text-[10px] font-mono text-[var(--color-ink-muted,#707070)]">
                  {asset.assetCode} {asset.category ? `· ${asset.category}` : ""}
                </span>
                {asset.description && (
                  <p className="text-[11px] text-[var(--color-ink-muted,#707070)] leading-tight pt-1 max-w-[202px]">
                    {asset.description}
                  </p>
                )}
              </div>

              {/* Task Cards Container (4 per row, pitch 249px) */}
              <div className="w-[1165px] pl-4">
                <div className="flex flex-wrap gap-x-[33px] gap-y-4 items-start min-h-[171px] pb-2">
                  {tasks.length === 0 ? (
                    <div className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-mono italic pt-6">
                      No workflow tasks generated yet.
                    </div>
                  ) : (
                    tasks.map((task, idx) => (
                      <AssetTaskCard
                        key={task.id}
                        task={task}
                        index={idx}
                        statuses={statuses}
                        onTaskChange={onTaskChange}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Notes Column */}
              <div className="w-[115px] pt-1 pl-4 text-[11px] text-[var(--color-ink-muted,#707070)] font-mono">
                Priority: {asset.priority || "Medium"}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export const AssetRowTable = memo(AssetRowTableComponent);
export default AssetRowTable;
