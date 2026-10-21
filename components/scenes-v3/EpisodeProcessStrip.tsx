"use client";

import React, { useMemo } from "react";
import type { ProcessProgress } from "@/types/production-v2";

export interface EpisodeProcessStripProps {
  progress: readonly ProcessProgress[];
}

export const EpisodeProcessStrip: React.FC<EpisodeProcessStripProps> = ({
  progress,
}) => {
  const sorted = useMemo(() => {
    return [...progress].sort((a, b) => a.position - b.position);
  }, [progress]);

  if (sorted.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-4 rounded-[16px] border border-[var(--po-line)] bg-[var(--po-card)] px-3.5 py-2 shadow-[var(--po-shadow-sm)]"
      aria-label="Episode process progress strip"
    >
      {sorted.map((item, idx) => {
        const bgCol = item.colour || "var(--po-accent)";
        return (
          <div
            key={item.processId}
            className="flex min-w-[85px] max-w-[125px] flex-col gap-1"
          >
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className="flex h-4 w-4 flex-none items-center justify-center rounded-[4px] text-[9px] font-semibold text-white"
                style={{ backgroundColor: item.colour || "var(--po-ink-3)" }}
              >
                {idx + 1}
              </span>
              <span
                className="truncate font-medium text-[var(--po-ink)]"
                title={`${item.processName} (${item.completeScenes} of ${item.totalScenes} scenes)`}
              >
                {item.processName}
              </span>
              <span className="ml-auto font-semibold text-[var(--po-ink-2)]">
                {item.percent}%
              </span>
            </div>
            <div className="h-[3px] w-full overflow-hidden rounded-[1.5px] bg-[var(--po-chip)]">
              <div
                className="h-full rounded-[1.5px] transition-all duration-300"
                style={{
                  width: `${Math.max(0, Math.min(100, item.percent))}%`,
                  backgroundColor: bgCol,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
