"use client";

import React, { useRef, useMemo } from "react";
import {
  PANEL_UNDERLINE_WIDTH,
  PANEL_ROW_PITCH,
  CANVAS_LABEL_FONT_SIZE,
  CANVAS_LABEL_FONT_WEIGHT,
  CANVAS_LABEL_LETTER_SPACING,
  MAX_VISIBLE_PROJECTS,
} from "@/lib/timeline/timelineGeometry";

export type ListPanelItem = { id: string; label: string };

export type ListPanelProps = {
  items: ListPanelItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
  /** First item of the solid window — kept in step with the canvas. */
  windowStart?: number;
  /** Solid rows. Neighbours outside it fade out and stop being clickable. */
  windowSize?: number;
  onWindowStartChange?: (next: number) => void;
};

/** Rows rendered on each side of the window, progressively faded. */
const FADE_NEIGHBOURS = 1;

/** Opacity per step away from the window. Index 0 is the nearest neighbour. */
const NEIGHBOUR_OPACITY = [0.28];

export const ListPanel: React.FC<ListPanelProps> = ({
  items,
  selectedId,
  onSelect,
  emptyLabel = "No items",
  windowStart = 0,
  windowSize = MAX_VISIBLE_PROJECTS,
  onWindowStartChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const maxStart = Math.max(0, items.length - windowSize);
  const start = Math.min(Math.max(0, windowStart), maxStart);
  const end = start + windowSize;

  // The window plus its faded neighbours — reference image 1 shows the
  // first and last entries visibly lighter than the five in between.
  const rows = useMemo(() => {
    const first = Math.max(0, start - FADE_NEIGHBOURS);
    const last = Math.min(items.length, end + FADE_NEIGHBOURS);
    return items.slice(first, last).map((item, i) => {
      const index = first + i;
      const inWindow = index >= start && index < end;
      const distance = inWindow ? 0 : index < start ? start - index : index - end + 1;
      const opacity = inWindow
        ? 1
        : NEIGHBOUR_OPACITY[Math.min(distance - 1, NEIGHBOUR_OPACITY.length - 1)];
      return { item, index, inWindow, opacity };
    });
  }, [items, start, end]);

  const move = (delta: number) => {
    const focusIndex = items.findIndex((i) => i.id === selectedId);
    const nextIndex = Math.min(
      items.length - 1,
      Math.max(0, (focusIndex >= 0 ? focusIndex : start) + delta)
    );
    if (nextIndex < 0 || !items[nextIndex]) return;

    // Scroll the window so the newly selected row stays inside it.
    if (nextIndex < start) onWindowStartChange?.(nextIndex);
    else if (nextIndex >= end) onWindowStartChange?.(nextIndex - windowSize + 1);

    onSelect(items[nextIndex].id);
  };

  // Faded rows are inert by design, so the wheel is what lets the window
  // reach items past the fifth. Without it those projects would be
  // unreachable by mouse entirely.
  const handleWheel = (e: React.WheelEvent) => {
    if (items.length <= windowSize) return;
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    if (delta === 0) return;
    const next = Math.min(maxStart, Math.max(0, start + (delta > 0 ? 1 : -1)));
    if (next !== start) {
      e.preventDefault();
      onWindowStartChange?.(next);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const current = items.find((i) => i.id === selectedId);
      if (current) onSelect(current.id);
    }
  };

  return (
    <div
      ref={containerRef}
      role="listbox"
      tabIndex={0}
      aria-label="Selection List"
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      className="w-[116.5px] overflow-hidden outline-none select-none font-sans"
      style={{ height: `${(windowSize + FADE_NEIGHBOURS * 2) * PANEL_ROW_PITCH}px` }}
    >
      {items.length === 0 ? (
        <div
          className="flex items-center justify-center text-[var(--color-ink-muted,#707070)]"
          style={{ height: `${PANEL_ROW_PITCH}px`, fontSize: CANVAS_LABEL_FONT_SIZE }}
        >
          {emptyLabel}
        </div>
      ) : (
        rows.map(({ item, inWindow, opacity }) => {
          const isSelected = item.id === selectedId;

          return (
            <button
              key={item.id}
              role="option"
              type="button"
              aria-selected={isSelected}
              disabled={!inWindow}
              tabIndex={-1}
              onClick={() => inWindow && onSelect(item.id)}
              style={{
                height: `${PANEL_ROW_PITCH}px`,
                opacity,
                // Faded rows are inert, matching the ghost lines they
                // correspond to on the canvas.
                pointerEvents: inWindow ? "auto" : "none",
              }}
              className="relative w-[116.5px] block text-left cursor-pointer outline-none shrink-0 transition-opacity duration-300"
            >
              {isSelected && inWindow && (
                <div className="absolute left-0 top-0 w-[116px] h-[24px] bg-[var(--color-selection,#d9d9d9)] z-0" />
              )}

              <div className="absolute left-0 top-0 w-[110px] h-[16px] flex items-center z-10">
                <span
                  className="truncate text-[var(--color-ink,#000000)]"
                  style={{
                    // Same tokens the canvas labels use, so the panel can
                    // never drift from the canvas typography.
                    fontSize: `${CANVAS_LABEL_FONT_SIZE}px`,
                    fontWeight: CANVAS_LABEL_FONT_WEIGHT,
                    letterSpacing: CANVAS_LABEL_LETTER_SPACING,
                  }}
                >
                  {item.label}
                </span>
              </div>

              {/* Underline weight is bound to the canvas line stroke. */}
              <div
                className="absolute left-0 top-[22px] w-[116.5px] bg-[var(--color-line,#000000)] z-10"
                style={{ height: `${PANEL_UNDERLINE_WIDTH}px` }}
              />
            </button>
          );
        })
      )}
    </div>
  );
};

export default ListPanel;
