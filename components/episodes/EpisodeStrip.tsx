"use client";

import React, { useRef, useCallback, memo } from "react";

export type EpisodeStripItem = {
  id: string;
  label: string;
  thumbnailUrl?: string;
};

export type EpisodeStripProps = {
  items: EpisodeStripItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenManage: (id: string) => void;
};

export const EpisodeStripComponent: React.FC<EpisodeStripProps> = ({
  items,
  selectedId,
  onSelect,
  onOpenManage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Wheel handler for horizontal scrolling
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    if (delta === 0) return;

    const canScrollLeft = el.scrollLeft > 0;
    const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;

    if ((delta < 0 && canScrollLeft) || (delta > 0 && canScrollRight)) {
      e.preventDefault();
      el.scrollLeft += delta * 0.8;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return;
    const currentIdx = items.findIndex((item) => item.id === selectedId);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIdx = Math.min(items.length - 1, (currentIdx >= 0 ? currentIdx : -1) + 1);
      onSelect(items[nextIdx].id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIdx = Math.max(0, currentIdx - 1);
      onSelect(items[prevIdx].id);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (selectedId) {
        onOpenManage(selectedId);
      }
    }
  };

  return (
    <div
      role="region"
      aria-label="Episode Strip Picker"
      className="absolute z-30 pointer-events-auto select-none"
      style={{
        left: "calc((335.5 / 1920) * 100%)",
        top: "calc((937 / 1080) * 100%)",
        width: "calc((1180 / 1920) * 100%)",
        height: "82px",
      }}
    >
      <div
        ref={containerRef}
        tabIndex={0}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        className="w-full h-full flex flex-row items-center gap-[58px] overflow-x-auto outline-none scrollbar-none py-1 px-4"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        {items.map((item) => {
          const isSelected = item.id === selectedId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => onOpenManage(item.id)}
              className={`w-[152px] h-[80px] shrink-0 rounded-[var(--radius-sm,3px)] overflow-hidden bg-[var(--color-placeholder,#d9d9d9)] border transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                isSelected
                  ? "border-black ring-2 ring-black font-medium"
                  : "border-[var(--color-line-soft,#a9a9a9)] opacity-80 hover:opacity-100"
              }`}
              style={{
                boxShadow: "6px 10px 4px rgba(0, 0, 0, 0.25)",
              }}
            >
              {item.thumbnailUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.thumbnailUrl}
                  alt={item.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink-muted,#707070)] truncate px-2">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const EpisodeStrip = memo(EpisodeStripComponent);
export default EpisodeStrip;
