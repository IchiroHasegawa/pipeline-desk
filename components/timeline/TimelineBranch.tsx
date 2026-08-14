"use client";

import React, { useRef, useEffect, memo } from "react";
import {
  BRANCH_STROKE_WIDTH,
  LINE_STROKE_WIDTH,
  Point,
} from "@/lib/timeline/timelineGeometry";

export type TimelineBranchProps = {
  id: string;
  from: Point;
  to: Point;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void;
  children?: React.ReactNode;
};

/**
 * Episode / day / task branch line.
 *
 * §3.5 — branches are SOLID strokes with no endpoint fade. In particular
 * there is no fade-in at `from`, which is the point where the branch meets
 * its parent line, so the junction reads as attached rather than dissolving
 * into it. The endpoint fade belongs to the project line alone
 * (see TimelineLine); the Episode page's boundary fade is a separate
 * mechanism applied by the bounding-box mask, not here.
 */
export const TimelineBranchComponent: React.FC<TimelineBranchProps> = ({
  id,
  from,
  to,
  selected = false,
  dimmed = false,
  onSelect,
  onOpen,
  children,
}) => {
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    },
    []
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (e.detail >= 2) {
      onOpen?.(id);
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      onSelect?.(id);
    }, 220);
  };

  return (
    <g
      className="transition-opacity duration-300 ease-out"
      style={{ opacity: dimmed ? 0.15 : 1 }}
    >
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="var(--color-line, #000000)"
        strokeWidth={selected ? LINE_STROKE_WIDTH : BRANCH_STROKE_WIDTH}
        strokeLinecap="round"
        className="pointer-events-none"
      />

      <line
        data-branch-hit="true"
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="transparent"
        strokeWidth={12}
        strokeLinecap="round"
        style={{ pointerEvents: "stroke" }}
        className="cursor-pointer"
        onClick={handleClick}
      />

      {children}
    </g>
  );
};

export const TimelineBranch = memo(TimelineBranchComponent);
export default TimelineBranch;
