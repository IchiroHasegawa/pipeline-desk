/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, memo } from "react";

export type EntityItem = {
  id: string;
  label: string;
  thumbnailUrl?: string;
};

export type EntityListPanelProps = {
  heading: string;
  items: EntityItem[];
  currentId: string;
  onSelect: (id: string) => void;
  onOpen?: (id: string) => void;
};

/**
 * Entity list panel — DESIGN_SPEC §8.
 * Panel (1593, 193) 319 × 1078; divider (1594, 219) 1 × 1052;
 * thumbnails x 1604, y 219 + 222·n, 308 × 171; name x 1607, thumb y + 171, 180 × 22.
 *
 * Coordinates are frame-absolute, matching how the spec expresses them, so the
 * panel is rendered as a direct child of the ManageLayout frame.
 */
const THUMB_PITCH = 222;
const FIRST_THUMB_Y = 219;

export const EntityListPanelComponent: React.FC<EntityListPanelProps> = ({
  heading,
  items,
  currentId,
  onSelect,
  onOpen,
}) => {
  // Pin the currently-open item first, followed by the rest
  const sortedItems = useMemo(() => {
    const currentItem = items.find((i) => i.id === currentId);
    const otherItems = items.filter((i) => i.id !== currentId);
    return currentItem ? [currentItem, ...otherItems] : items;
  }, [items, currentId]);

  return (
    <aside
      aria-label={`${heading} List`}
      className="absolute left-[1593px] top-[193px] w-[319px] h-[1078px] overflow-y-auto overflow-x-hidden font-sans"
    >
      {/* Divider (1594, 219) 1 × 1052 — panel-relative x 1, y 26 */}
      <div className="absolute left-[1px] top-[26px] w-[1px] h-[1052px] bg-[var(--color-line,#000000)] pointer-events-none" />

      {sortedItems.map((item, idx) => {
        const isCurrent = item.id === currentId;
        // Panel-relative: thumbnails sit at x 1604 (panel + 11)
        const top = FIRST_THUMB_Y - 193 + idx * THUMB_PITCH;

        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            onDoubleClick={() => onOpen && onOpen(item.id)}
            style={{ top: `${top}px` }}
            className="absolute left-[11px] w-[308px] cursor-pointer group"
          >
            {/* Thumbnail 308 × 171 */}
            <div
              className={`w-[308px] h-[171px] bg-[var(--color-placeholder,#d9d9d9)] overflow-hidden flex items-center justify-center transition-all ${
                isCurrent
                  ? "border-2 border-[var(--color-ink,#000000)]"
                  : "border border-[var(--color-line-soft,#a9a9a9)] opacity-80 group-hover:opacity-100"
              }`}
            >
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-[var(--color-ink-muted,#707070)]">
                  [NO PREVIEW]
                </span>
              )}
            </div>

            {/* Name — x 1607 (panel + 14), thumb y + 171, 180 × 22 */}
            <div className="absolute left-[3px] top-[171px] w-[180px] h-[22px] flex items-center gap-2">
              <span
                className={`text-[var(--text-list,12px)] leading-none truncate ${
                  isCurrent
                    ? "font-medium text-[var(--color-ink,#000000)]"
                    : "text-[var(--color-ink,#000000)]"
                }`}
              >
                {item.label}
              </span>
              {isCurrent && (
                <span className="text-[9px] font-medium px-1 py-0.5 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] rounded-[var(--radius-xs,1px)] shrink-0">
                  OPEN
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Absolutely positioned rows: establishes scroll height. */}
      <div
        aria-hidden="true"
        style={{ height: `${FIRST_THUMB_Y - 193 + sortedItems.length * THUMB_PITCH}px` }}
      />
    </aside>
  );
};

export const EntityListPanel = memo(EntityListPanelComponent);
export default EntityListPanel;
