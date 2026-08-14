"use client";

import React, { memo } from "react";
import {
  CANVAS_LABEL_FONT_SIZE,
  CANVAS_LABEL_FONT_WEIGHT,
  BRANCH_STROKE_WIDTH,
  type Point,
} from "@/lib/timeline/timelineGeometry";

export type OriginDotProps = {
  /** The line's t = 0 point, in world units. */
  at: Point;
  open: boolean;
  onToggle: () => void;
  title: string;
  creationDate: string | null;
  description: string;
};

const DOT_RADIUS = 4;
const PANEL_WIDTH = 300;
const PANEL_HEIGHT = 200;
const PANEL_GAP = 18;

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

/**
 * The project line's origin marker on the Episode page (§3.3).
 *
 * It lives inside the line's transform group and sits at t = 0, so it is
 * simply off-screen until the user drags the line far enough to bring the
 * origin into view — no visibility plumbing needed, and it stays pinned to
 * the line under pan and zoom.
 *
 * Clicking it opens the same project detail the Project page shows, but
 * anchored on the dot rather than on the line, so it travels with it.
 */
export const OriginDotComponent: React.FC<OriginDotProps> = ({
  at,
  open,
  onToggle,
  title,
  creationDate,
  description,
}) => {
  return (
    <g>
      {open && (
        <>
          <line
            x1={at.x}
            y1={at.y}
            x2={at.x + PANEL_GAP}
            y2={at.y + PANEL_GAP}
            stroke="var(--color-line, #000000)"
            strokeWidth={BRANCH_STROKE_WIDTH}
            className="pointer-events-none"
          />
          <foreignObject
            x={at.x + PANEL_GAP}
            y={at.y + PANEL_GAP}
            width={PANEL_WIDTH}
            height={PANEL_HEIGHT}
            className="overflow-visible"
          >
            <div className="w-full h-full font-sans pointer-events-auto">
              <h2 className="text-[36px] leading-none tracking-tighter text-[var(--color-ink,#000000)] truncate">
                {title}
              </h2>
              <p
                className="mt-3 text-[var(--color-ink-muted,#707070)] tracking-wide"
                style={{
                  fontSize: `${CANVAS_LABEL_FONT_SIZE}px`,
                  fontWeight: CANVAS_LABEL_FONT_WEIGHT,
                }}
              >
                Creation Date - {formatDate(creationDate)}
              </p>
              <p
                className="mt-3 text-[var(--color-ink,#000000)] leading-relaxed overflow-hidden"
                style={{ fontSize: `${CANVAS_LABEL_FONT_SIZE}px`, maxHeight: "120px" }}
              >
                {description || "No description available."}
              </p>
            </div>
          </foreignObject>
        </>
      )}

      <circle
        cx={at.x}
        cy={at.y}
        r={DOT_RADIUS}
        fill="var(--color-ink, #000000)"
        className="cursor-pointer"
        style={{ pointerEvents: "all" }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      />
      {/* Generous invisible hit area — the dot itself is only 8px across. */}
      <circle
        cx={at.x}
        cy={at.y}
        r={14}
        fill="transparent"
        className="cursor-pointer"
        style={{ pointerEvents: "all" }}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      />
    </g>
  );
};

export const OriginDot = memo(OriginDotComponent);
export default OriginDot;
