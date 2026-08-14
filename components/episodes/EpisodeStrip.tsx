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
  onCreate?: () => void;
  createLabel?: string;
  embedded?: boolean;
};

export const EpisodeStripComponent: React.FC<EpisodeStripProps> = ({
  items,
  selectedId,
  onSelect,
  onOpenManage,
  onCreate,
  createLabel = "Create new",
  embedded = false,
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

  const leftMask = onCreate ? "black 0%" : "transparent 0%, black 10%";

  if (embedded) {
    return (
      <div className="relative w-full h-full pointer-events-auto select-none font-sans">
        <div
          ref={containerRef}
          tabIndex={0}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          className="w-full h-full flex flex-row items-center gap-[13px] overflow-x-auto outline-none scrollbar-none py-1"
          style={{
            WebkitMaskImage: `linear-gradient(to right, ${leftMask}, black 90%, transparent 100%)`,
            maskImage: `linear-gradient(to right, ${leftMask}, black 90%, transparent 100%)`,
          }}
        >
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              aria-label={createLabel}
              className="sticky left-0 z-10 w-[134px] h-[75px] shrink-0 rounded-[var(--radius-sm,3px)] bg-[var(--color-placeholder,#d9d9d9)] border border-dashed border-[var(--color-line-soft,#a9a9a9)] hover:border-[var(--color-line,#000000)] transition-all cursor-pointer flex items-center justify-center outline-none"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-icon,#000000)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
          {items.map((item) => {
            const isSelected = item.id === selectedId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                onDoubleClick={() => onOpenManage(item.id)}
                style={{ width: "134px", height: "75px" }}
                className={`shrink-0 rounded-[var(--radius-sm,3px)] overflow-hidden bg-[var(--color-placeholder,#d9d9d9)] border transition-all cursor-pointer relative flex flex-col items-center justify-center shadow-[6px_10px_4px_rgba(0,0,0,0.25)] ${
                  isSelected
                    ? "border-black ring-2 ring-black font-medium"
                    : "border-[var(--color-line-soft,#a9a9a9)] opacity-80 hover:opacity-100"
                }`}
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
  }

  return (
    <>
      {/* Spec B3 Radial fade backing: 1587 x 272 at (185.5, 842) */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "185.5px",
          bottom: "0px",
          width: "1587px",
          height: "272px",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
          zIndex: 29,
        }}
      />

      {/* Spec B3 Episode Strip frame: 1180 x 82 at (335.5, 937) anchored to viewport bottom (1080 - 937 - 82 = 61px from bottom) */}
      <div
        role="region"
        aria-label="Episode Strip Picker"
        style={{
          position: "fixed",
          left: "335.5px",
          bottom: "61px",
          width: "1180px",
          height: "82px",
          zIndex: 30,
        }}
        className="pointer-events-auto select-none font-sans"
      >
        <div
          ref={containerRef}
          tabIndex={0}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          className="w-full h-full flex flex-row items-center gap-[58px] overflow-x-auto outline-none scrollbar-none py-1"
          style={{
            WebkitMaskImage: `linear-gradient(to right, ${leftMask}, black 90%, transparent 100%)`,
            maskImage: `linear-gradient(to right, ${leftMask}, black 90%, transparent 100%)`,
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
                style={{ width: "152px", height: "80px" }}
                className={`shrink-0 rounded-[var(--radius-sm,3px)] overflow-hidden bg-[var(--color-placeholder,#d9d9d9)] border transition-all cursor-pointer relative flex flex-col items-center justify-center shadow-[6px_10px_4px_rgba(0,0,0,0.25)] ${
                  isSelected
                    ? "border-black ring-2 ring-black font-medium"
                    : "border-[var(--color-line-soft,#a9a9a9)] opacity-80 hover:opacity-100"
                }`}
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
    </>
  );
};

export const EpisodeStrip = memo(EpisodeStripComponent);
export default EpisodeStrip;
