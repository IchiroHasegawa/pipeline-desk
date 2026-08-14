"use client";

import React, { useRef, useState } from "react";

export type ListPanelItem = { id: string; label: string };

export type ListPanelProps = {
  items: ListPanelItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyLabel?: string;
};

export const ListPanel: React.FC<ListPanelProps> = ({
  items,
  selectedId,
  onSelect,
  emptyLabel = "No items",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userFocusedIndex, setUserFocusedIndex] = useState<number | null>(null);

  const selectedIndex = items.findIndex((item) => item.id === selectedId);
  const effectiveIndex =
    userFocusedIndex !== null && userFocusedIndex < items.length
      ? userFocusedIndex
      : selectedIndex >= 0
      ? selectedIndex
      : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = (effectiveIndex + 1) % items.length;
      setUserFocusedIndex(nextIdx);
      onSelect(items[nextIdx].id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = (effectiveIndex - 1 + items.length) % items.length;
      setUserFocusedIndex(prevIdx);
      onSelect(items[prevIdx].id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (items[effectiveIndex]) {
        onSelect(items[effectiveIndex].id);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      role="listbox"
      tabIndex={0}
      aria-label="Selection List"
      onKeyDown={handleKeyDown}
      className="w-[116.5px] h-[var(--size-list-height,345px)] overflow-y-auto outline-none select-none font-sans"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      {items.length === 0 ? (
        <div className="h-[46.4px] flex items-center justify-center text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)]">
          {emptyLabel}
        </div>
      ) : (
        items.map((item, idx) => {
          const isSelected = item.id === selectedId;
          const isFocused = idx === effectiveIndex;

          return (
            <button
              key={item.id}
              role="option"
              type="button"
              aria-selected={isSelected}
              onClick={() => {
                setUserFocusedIndex(idx);
                onSelect(item.id);
              }}
              style={{ height: "46.4px" }}
              className="relative w-[116.5px] block text-left cursor-pointer outline-none shrink-0"
            >
              {/* Selection chip (116 x 24 behind the row) */}
              {(isSelected || isFocused) && (
                <div
                  className={`absolute left-0 top-0 w-[116px] h-[24px] bg-[var(--color-selection,#d9d9d9)] z-0 ${
                    isFocused ? "ring-1 ring-black" : ""
                  }`}
                />
              )}

              {/* Row Label (110 x 16 at var(--text-list)) */}
              <div className="absolute left-0 top-0 w-[110px] h-[16px] flex items-center z-10">
                <span className="truncate text-[var(--text-list,12px)] font-sans font-medium text-[var(--color-ink,#000000)]">
                  {item.label}
                </span>
              </div>

              {/* Separator (1px full width, 22px below label top) */}
              <div className="absolute left-0 top-[22px] w-[116.5px] h-[1px] bg-[var(--color-line,#000000)] z-10" />
            </button>
          );
        })
      )}
    </div>
  );
};

export default ListPanel;
