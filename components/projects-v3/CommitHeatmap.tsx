"use client";

import React, { useMemo } from "react";
import type { ProjectBoardStats } from "@/types/production-v2";

export interface CommitHeatmapProps {
  commitDays: ProjectBoardStats["commitDays"];
  cellSize?: number; // default 3px
  gap?: number; // default 1px
  borderRadius?: number; // default 1px
}

const HEAT_COLORS = [
  "var(--po-heat0)",
  "color-mix(in oklch, var(--po-accent) 30%, var(--po-heat0))",
  "color-mix(in oklch, var(--po-accent) 55%, var(--po-heat0))",
  "color-mix(in oklch, var(--po-accent) 80%, var(--po-heat0))",
  "var(--po-accent)",
] as const;

export const CommitHeatmap: React.FC<CommitHeatmapProps> = ({
  commitDays,
  cellSize = 3,
  gap = 1,
  borderRadius = 1,
}) => {
  const { cells } = useMemo(() => {
    const counts = new Map<string, number>();
    let max = 0;
    for (const entry of commitDays || []) {
      counts.set(entry.day, entry.count);
      if (entry.count > max) max = entry.count;
    }

    const today = new Date();
    // 53 weeks x 7 days = 371 cells (spanning the last 365+ days)
    const totalCells = 371;
    const dayOfWeek = (today.getUTCDay() + 6) % 7; // Monday = 0 ... Sunday = 6
    // Shift backwards to the Monday 52 weeks ago
    const startOffsetDays = 52 * 7 + dayOfWeek;

    const out: { bg: string }[] = [];

    for (let i = 0; i < totalCells; i++) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - (startOffsetDays - i));
      const iso = d.toISOString().split("T")[0];
      const count = counts.get(iso) ?? 0;

      let level = 0;
      if (count > 0) {
        if (max <= 1) {
          level = 2;
        } else {
          const ratio = count / max;
          if (ratio < 0.25) level = 1;
          else if (ratio < 0.5) level = 2;
          else if (ratio < 0.75) level = 3;
          else level = 4;
        }
      }

      out.push({ bg: HEAT_COLORS[level] });
    }

    return { cells: out };
  }, [commitDays]);

  return (
    <div
      className="grid"
      style={{
        gridAutoFlow: "column",
        gridTemplateRows: `repeat(7, ${cellSize}px)`,
        gridAutoColumns: `${cellSize}px`,
        gap: `${gap}px`,
      }}
    >
      {cells.map((cell, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: cell.bg,
            borderRadius: `${borderRadius}px`,
          }}
        />
      ))}
    </div>
  );
};
