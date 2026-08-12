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
      className="w-[var(--size-list-width,116px)] h-[var(--size-list-height,345px)] overflow-y-auto outline-none select-none"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      {items.length === 0 ? (
        <div className="h-[var(--size-list-row-height,46px)] flex items-center justify-center text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)]">
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
              className="w-full h-[var(--size-list-row-height,46px)] flex items-center justify-center border-b border-[var(--color-line,#000000)] last:border-b-0 cursor-pointer relative"
            >
              <div
                className={`w-full h-[var(--size-list-chip-height,24px)] px-2 flex items-center text-left transition-colors ${
                  isSelected
                    ? "bg-[var(--color-selection,#d9d9d9)] font-medium"
                    : "bg-transparent hover:bg-neutral-200/50"
                } ${isFocused ? "outline-1 outline-black" : ""}`}
              >
                <span className="truncate text-[var(--text-list,12px)] font-sans text-[var(--color-ink,#000000)]">
                  {item.label}
                </span>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default ListPanel;

