/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo, useMemo } from "react";
import type { AssetV2, AssetTaskV2 } from "@/types/production-v2";
import AssetTaskCard from "@/components/assets-v2/AssetTaskCard";

export type AssetRowTableProps = {
  assets: AssetV2[];
  assetTasksMap: Record<string, AssetTaskV2[]>;
  statuses: string[];
  onTaskChange?: (taskId: string, updates: { assignee?: string | null; status?: string }) => void;
};

/**
 * DESIGN_SPEC §12 — assets rows table, absolute on the 1920 frame.
 * Header rule (33, 245) 1851 × 1. Column headers at y 261.
 * Dividers at x 328.5, 571, 1736 starting y 261.
 * First row: checkbox (5, 304) 22 × 22 r3; preview (33, 304) 278 × 171;
 * name (346, 304) 211 × 50; task cards y 289, x 590 + 249·n, 216 × 171.
 *
 * Four task cards per row, then wrap — not a horizontal scroller. Because the
 * number of tasks varies, row height is derived from the wrapped card lines;
 * the design measures only a single-line row.
 */
const FIRST_ROW_CONTENT_Y = 304;
const FIRST_ROW_CARDS_Y = 289;
const CARD_X = [590, 839, 1088, 1337];
const CARD_H = 171;
const CARD_LINE_GAP = 20;
const ROW_BOTTOM_PAD = 19;

/** Segmented 1px separator drawn under each row: [x, width] pairs. */
const ROW_SEPARATORS: [number, number][] = [
  [70, 211],
  [346, 211],
  [590, 1128],
  [1758, 137],
];

export const AssetRowTableComponent: React.FC<AssetRowTableProps> = ({
  assets,
  assetTasksMap,
  statuses,
  onTaskChange,
}) => {
  // Resolve each row's y offset from the wrapped card lines above it.
  const rows = useMemo(() => {
    const resolved: {
      asset: AssetV2;
      tasks: AssetTaskV2[];
      offset: number;
      height: number;
    }[] = [];

    let cursor = 0;
    for (const asset of assets) {
      const tasks = assetTasksMap[asset.id] || [];
      const lines = Math.max(1, Math.ceil(tasks.length / CARD_X.length));
      const height = lines * CARD_H + (lines - 1) * CARD_LINE_GAP + ROW_BOTTOM_PAD;
      resolved.push({ asset, tasks, offset: cursor, height });
      cursor += height;
    }

    return resolved;
  }, [assets, assetTasksMap]);

  const bodyHeight = rows.reduce((sum, r) => sum + r.height, 0);
  // Dividers are measured at 825.5 / 863.5 for the mock's row count; they are
  // extended to cover however many rows are actually present.
  const dividerHeight = Math.max(825.5, bodyHeight + (FIRST_ROW_CONTENT_Y - 261));

  return (
    <div
      className="relative w-[1920px] font-sans select-none"
      style={{ height: `${FIRST_ROW_CONTENT_Y + bodyHeight + 40}px` }}
    >
      {/* Header rule (33, 245) 1851 × 1 */}
      <div className="absolute left-[33px] top-[245px] w-[1851px] h-[1px] bg-[var(--color-line,#000000)]" />

      {/* Column headers at y 261 */}
      <div className="absolute left-[142px] top-[261px] w-[225px] h-[28px] flex items-center text-[var(--text-list,12px)] leading-none font-bold text-[var(--color-ink,#000000)]">
        Preview
      </div>
      <div className="absolute left-[406px] top-[261px] w-[225px] h-[28px] flex items-center text-[var(--text-list,12px)] leading-none font-bold text-[var(--color-ink,#000000)]">
        Asset name
      </div>
      <div className="absolute left-[1108px] top-[261px] w-[250px] h-[17px] flex items-center text-[var(--text-list,12px)] leading-none font-bold text-[var(--color-ink,#000000)]">
        Tasks
      </div>
      <div className="absolute left-[1794px] top-[261px] w-[69px] h-[25px] flex items-center text-[var(--text-list,12px)] leading-none font-bold text-[var(--color-ink,#000000)]">
        Notes
      </div>

      {/* Vertical dividers from y 261 */}
      {[328.5, 571, 1736].map((x) => (
        <div
          key={x}
          style={{ left: `${x}px`, height: `${dividerHeight}px` }}
          className="absolute top-[261px] w-[1px] bg-[var(--color-line-soft,#a9a9a9)] pointer-events-none"
        />
      ))}

      {assets.length === 0 ? (
        <div className="absolute left-[33px] top-[340px] w-[1851px] p-12 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-medium">
          No assets in this episode yet.
        </div>
      ) : (
        rows.map(({ asset, tasks, offset, height }) => {
          const contentY = FIRST_ROW_CONTENT_Y + offset;
          const cardsY = FIRST_ROW_CARDS_Y + offset;

          return (
            <React.Fragment key={asset.id}>
              {/* Checkbox (5, 304) 22 × 22, radius 3 */}
              <input
                type="checkbox"
                aria-label={`Select asset ${asset.name}`}
                style={{ top: `${contentY}px` }}
                className="absolute left-[5px] w-[22px] h-[22px] rounded-[3px] border border-[var(--color-line,#000000)] accent-black cursor-pointer"
              />

              {/* Preview (33, 304) 278 × 171 */}
              <div
                style={{ top: `${contentY}px` }}
                className="absolute left-[33px] w-[278px] h-[171px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)] overflow-hidden flex items-center justify-center"
              >
                {asset.previewUrl ? (
                  <img
                    src={asset.previewUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[var(--color-ink-muted,#707070)] text-[10px]">
                    <span>[PREVIEW]</span>
                    <span>{asset.assetCode}</span>
                  </div>
                )}
              </div>

              {/* Name (346, 304) 211 × 50 */}
              <div
                style={{ top: `${contentY}px` }}
                className="absolute left-[346px] w-[211px] h-[50px] flex flex-col justify-center gap-[3px]"
              >
                <span className="block text-[var(--text-list,12px)] leading-none font-bold text-[var(--color-ink,#000000)] truncate">
                  {asset.name}
                </span>
                <span className="block text-[10px] leading-none text-[var(--color-ink-muted,#707070)] truncate">
                  {asset.assetCode}
                  {asset.category ? ` · ${asset.category}` : ""}
                </span>
              </div>

              {/* Notes column, aligned with the "Notes" header at x 1794 */}
              <div
                style={{ top: `${contentY}px` }}
                className="absolute left-[1758px] w-[137px] text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]"
              >
                Priority: {asset.priority || "Medium"}
              </div>

              {/* Task cards — y 289, x 590 + 249·n, four per row then wrap */}
              {tasks.length === 0 ? (
                <div
                  style={{ top: `${cardsY + 40}px` }}
                  className="absolute left-[590px] text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] italic"
                >
                  No workflow tasks generated yet.
                </div>
              ) : (
                tasks.map((task, idx) => {
                  const col = idx % CARD_X.length;
                  const line = Math.floor(idx / CARD_X.length);

                  return (
                    <div
                      key={task.id}
                      style={{
                        left: `${CARD_X[col]}px`,
                        top: `${cardsY + line * (CARD_H + CARD_LINE_GAP)}px`,
                      }}
                      className="absolute"
                    >
                      <AssetTaskCard
                        task={task}
                        index={idx}
                        statuses={statuses}
                        onTaskChange={onTaskChange}
                      />
                    </div>
                  );
                })
              )}

              {/* Segmented row separator */}
              {ROW_SEPARATORS.map(([x, w]) => (
                <div
                  key={`${asset.id}-sep-${x}`}
                  style={{ left: `${x}px`, top: `${contentY + height - 10}px`, width: `${w}px` }}
                  className="absolute h-[1px] bg-[var(--color-line-soft,#a9a9a9)] pointer-events-none"
                />
              ))}
            </React.Fragment>
          );
        })
      )}
    </div>
  );
};

export const AssetRowTable = memo(AssetRowTableComponent);
export default AssetRowTable;
