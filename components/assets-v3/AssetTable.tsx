"use client";

import React, { useMemo } from "react";
import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
import { PlaceholderArt } from "@/components/app-shell";
import { resolveTaskStatus } from "@/lib/format/production";
import { assetPreviewSrc } from "@/lib/format/assets";
import type {
  AssetV2,
  AssetBoardTask,
  TaskStatusOption,
} from "@/types/production-v2";

export interface AssetTableProps {
  assets: AssetV2[];
  tasksByAssetId: Record<string, AssetBoardTask[]>;
  workflowOptions: Record<string, TaskStatusOption[]>;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  onOpenDetail: (asset: AssetV2) => void;
  searchQuery?: string;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  tasksByAssetId,
  workflowOptions,
  selectedAssetId,
  onSelectAsset,
  onOpenDetail,
  searchQuery = "",
}) => {
  // Filter assets by search query
  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => {
      const matchName = a.name.toLowerCase().includes(q);
      const matchCode = (a.assetCode || "").toLowerCase().includes(q);
      const matchCat = (a.category || "").toLowerCase().includes(q);
      return matchName || matchCode || matchCat;
    });
  }, [assets, searchQuery]);

  // Compute task progress for an asset
  const getProgress = (assetId: string) => {
    const tasks = tasksByAssetId[assetId] || [];
    if (tasks.length === 0) return { completed: 0, total: 0, percent: 0 };

    let completed = 0;
    for (const t of tasks) {
      const wfOpts = t.taskStatusWorkflowId
        ? workflowOptions[t.taskStatusWorkflowId] || []
        : [];
      const resolved = resolveTaskStatus(t, wfOpts);
      if (resolved && resolved.completionPercentage === 100) {
        completed += 1;
      }
    }

    const percent = Math.round((completed / tasks.length) * 100);
    return { completed, total: tasks.length, percent };
  };

  const renderPriority = (priorityStr: string | null) => {
    const prio = (priorityStr || "Medium").toLowerCase();
    if (prio.includes("high") || prio.includes("p1") || prio.includes("critical")) {
      return (
        <span className="inline-flex items-center gap-1 font-medium text-[#E5534B]">
          <ArrowUp size={13} />
          <span>High</span>
        </span>
      );
    }
    if (prio.includes("low") || prio.includes("p5") || prio.includes("minor")) {
      return (
        <span className="inline-flex items-center gap-1 font-medium text-[var(--po-ink-3)]">
          <ArrowDown size={13} />
          <span>Low</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 font-medium text-[var(--po-ink-2)]">
        <ArrowRight size={13} />
        <span>Medium</span>
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-sm)]">
      {/* Table Header */}
      <div className="grid grid-cols-[88px_minmax(180px,1.5fr)_minmax(120px,1fr)_130px_110px_160px] items-center gap-4 border-b border-[var(--po-line)] px-5 py-3 text-[12px] font-semibold text-[var(--po-ink-3)] uppercase tracking-wider">
        <span>Preview</span>
        <span>Name</span>
        <span>Code</span>
        <span>Category</span>
        <span>Priority</span>
        <span>Task Progress</span>
      </div>

      {/* Table Body */}
      {filteredAssets.length === 0 ? (
        <div className="py-14 text-center text-[14px] text-[var(--po-ink-3)]">
          {searchQuery
            ? `No assets match "${searchQuery}".`
            : "No assets here yet. Use + in the rail to add one."}
        </div>
      ) : (
        <div className="divide-y divide-[var(--po-line)]">
          {filteredAssets.map((asset) => {
            const isSelected = asset.id === selectedAssetId;
            const progress = getProgress(asset.id);

            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                onDoubleClick={() => onOpenDetail(asset)}
                className={`grid grid-cols-[88px_minmax(180px,1.5fr)_minmax(120px,1fr)_130px_110px_160px] items-center gap-4 px-5 py-2.5 text-[13px] cursor-pointer transition-colors duration-100 select-none ${
                  isSelected
                    ? "bg-[var(--po-chip)] ring-1 ring-inset ring-[var(--po-accent)]/40"
                    : "hover:bg-[var(--po-chip)]/50"
                }`}
              >
                {/* 1. Preview */}
                <div className="relative flex h-[44px] w-[72px] items-center justify-center overflow-hidden rounded-[8px] border border-[var(--po-line)] bg-[var(--po-sunken)]">
                  <PlaceholderArt seed={asset.id} className="absolute inset-0 h-full w-full object-cover" />
                  {(() => {
                    const src = assetPreviewSrc(asset);
                    return src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={asset.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : null;
                  })()}
                </div>

                {/* 2. Name */}
                <div className="font-semibold text-[var(--po-ink)] truncate">
                  {asset.name}
                </div>

                {/* 3. Code */}
                <div className="font-mono text-[12px] text-[var(--po-ink-2)] truncate">
                  {asset.assetCode || "—"}
                </div>

                {/* 4. Category */}
                <div className="text-[var(--po-ink-2)] truncate">
                  {asset.category || "General"}
                </div>

                {/* 5. Priority */}
                <div>{renderPriority(asset.priority)}</div>

                {/* 6. Task Progress */}
                <div>
                  {progress.total > 0 ? (
                    <div className="flex flex-col gap-1 w-full max-w-[130px]">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[var(--po-ink-3)]">
                        <span>
                          {progress.completed}/{progress.total}
                        </span>
                        <span>{progress.percent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--po-sunken)] border border-[var(--po-line)]">
                        <div
                          className="h-full rounded-full bg-[var(--po-ok)] transition-all duration-300"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[12px] text-[var(--po-ink-3)]">No tasks</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
