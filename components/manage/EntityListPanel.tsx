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

export const EntityListPanelComponent: React.FC<EntityListPanelProps> = ({
  heading,
  items,
  currentId,
  onSelect,
  onOpen,
}) => {
  // Pin currently-open item first, followed by the rest
  const sortedItems = useMemo(() => {
    const currentItem = items.find((i) => i.id === currentId);
    const otherItems = items.filter((i) => i.id !== currentId);
    return currentItem ? [currentItem, ...otherItems] : items;
  }, [items, currentId]);

  return (
    <aside
      aria-label={`${heading} List`}
      className="w-[260px] h-full bg-[var(--color-panel,#f0f0f0)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] p-4 flex flex-col gap-4 font-sans overflow-hidden shadow-xs"
    >
      <div className="flex flex-row items-center justify-between pb-2 border-b border-[var(--color-line-soft,#a9a9a9)]">
        <h3 className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink,#000000)]">
          {heading}
        </h3>
        <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink-muted,#707070)]">
          {items.length} total
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
        {sortedItems.map((item) => {
          const isCurrent = item.id === currentId;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => onOpen && onOpen(item.id)}
              className={`flex flex-col gap-2 p-2 border rounded-[var(--radius-sm,3px)] cursor-pointer transition-all ${
                isCurrent
                  ? "border-[var(--color-ink,#000000)] bg-[var(--color-selection,#d9d9d9)] shadow-sm"
                  : "border-[var(--color-line-soft,#a9a9a9)] bg-white/50 hover:bg-white"
              }`}
            >
              <div className="w-full h-[120px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-xs,1px)] overflow-hidden flex items-center justify-center">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-mono text-[var(--color-ink-muted,#707070)]">
                    [NO PREVIEW]
                  </span>
                )}
              </div>
              <div className="flex flex-row items-center justify-between">
                <span className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)] truncate max-w-[170px]">
                  {item.label}
                </span>
                {isCurrent && (
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] rounded-[var(--radius-xs,1px)]">
                    OPEN
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export const EntityListPanel = memo(EntityListPanelComponent);
export default EntityListPanel;
