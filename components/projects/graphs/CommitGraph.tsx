"use client";

import React, { useMemo } from "react";
import {
  GRAPH_SIZES,
  BOARD_ACCENT,
  BOARD_ACCENT_LIGHT,
  CARD_SHADOW,
  HAIRLINE,
} from "@/lib/design/boardTokens";
import type { ProjectBoardStats } from "@/types/production-v2";

export type CommitGraphProps = {
  commitDays: ProjectBoardStats["commitDays"];
  className?: string;
};

const SIZE = GRAPH_SIZES.commits;

const CELL = 10;
const GAP = 2;
const PAD_X = 10;

/**
 * Whole week columns that fit the card: n * CELL + (n - 1) * GAP <= innerWidth.
 * At 280px wide that is 21 columns (147 days).
 */
const WEEK_COLUMNS = Math.floor((SIZE.width - PAD_X * 2 + GAP) / (CELL + GAP));

/** Rows run Mon..Sun. */
const ROWS = 7;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpHex(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const c = (a: number, b: number) => Math.round(a + (b - a) * t);
  return (
    "rgb(" + c(r1, r2) + ", " + c(g1, g2) + ", " + c(b1, b2) + ")"
  );
}

/** Four steps from the light accent to the full accent. */
const STEPS = [0, 1 / 3, 2 / 3, 1].map((t) =>
  lerpHex(BOARD_ACCENT_LIGHT, BOARD_ACCENT, t)
);

/**
 * Today as YYYY-MM-DD in IST. project_commit_days buckets on
 * `(completed_at at time zone 'Asia/Kolkata')`, so the grid must be built in
 * the same zone — browser-local time would shift the whole calendar for any
 * viewer outside IST.
 */
function istTodayString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Date maths on the calendar date only, anchored in UTC so it cannot drift. */
function parseDateUTC(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

export const CommitGraph: React.FC<CommitGraphProps> = ({
  commitDays,
  className,
}) => {
  const { cells, maxCount } = useMemo(() => {
    const counts = new Map<string, number>();
    let max = 0;
    for (const entry of commitDays) {
      counts.set(entry.day, entry.count);
      if (entry.count > max) max = entry.count;
    }

    const today = parseDateUTC(istTodayString());
    // getUTCDay: Sun=0..Sat=6. Shift so Mon=0..Sun=6.
    const dayOffset = (today.getUTCDay() + 6) % 7;
    const currentWeekMonday = addDaysUTC(today, -dayOffset);
    const firstMonday = addDaysUTC(currentWeekMonday, -(WEEK_COLUMNS - 1) * 7);

    const out: { key: string; day: string; count: number; row: number; col: number }[] = [];
    for (let col = 0; col < WEEK_COLUMNS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const date = addDaysUTC(firstMonday, col * 7 + row);
        const iso = formatUTC(date);
        out.push({
          key: iso,
          day: iso,
          count: counts.get(iso) ?? 0,
          row,
          col,
        });
      }
    }

    return { cells: out, maxCount: max };
  }, [commitDays]);

  // Thresholds come from the data's own max, so a quiet project still shows
  // contrast rather than a uniform pale grid.
  const colourFor = (count: number): string => {
    if (count <= 0) return "var(--color-placeholder, #d9d9d9)";
    if (maxCount <= 0) return STEPS[0];
    const bucket = Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4)));
    return STEPS[bucket - 1];
  };

  return (
    <div
      className={"flex flex-col overflow-hidden font-sans " + (className || "")}
      style={{
        width: SIZE.width + "px",
        height: SIZE.height + "px",
        backgroundColor: "var(--color-canvas, #ffffff)",
        border: HAIRLINE + " solid var(--color-line-soft, #a9a9a9)",
        borderRadius: "var(--radius-card, 7px)",
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="shrink-0 pt-3"
        style={{
          paddingLeft: PAD_X + "px",
          paddingRight: PAD_X + "px",
          fontSize: "var(--text-caption, 11px)",
          color: "var(--color-ink-muted, #707070)",
        }}
      >
        Commits
      </div>

      <div
        className="flex-1 flex items-center"
        style={{ paddingLeft: PAD_X + "px", paddingRight: PAD_X + "px" }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(" + WEEK_COLUMNS + ", " + CELL + "px)",
            gridTemplateRows: "repeat(" + ROWS + ", " + CELL + "px)",
            gridAutoFlow: "column",
            gap: GAP + "px",
          }}
        >
          {cells.map((cell) => (
            <div
              key={cell.key}
              title={cell.count + " commits on " + cell.day}
              style={{
                width: CELL + "px",
                height: CELL + "px",
                borderRadius: "var(--radius-xs, 1px)",
                backgroundColor: colourFor(cell.count),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommitGraph;
