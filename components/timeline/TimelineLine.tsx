"use client";

import React, { useId, memo } from "react";
import {
  lineEndpoint,
  TIMELINE_LINE_FADE_STOPS,
  TIMELINE_ANGLE_DEG,
  LINE_STROKE_WIDTH,
  GHOST_BLUR_PX,
  GHOST_OPACITY,
  Point,
} from "@/lib/timeline/timelineGeometry";

export type TimelineLineProps = {
  id: string;
  length: number;
  origin: Point;
  angleDeg?: number;
  /** Another line is focused; this one recedes. */
  dimmed?: boolean;
  /** Outside the visible window — blurred, behind, and non-interactive. */
  ghost?: boolean;
  /** Whether this line offers a drag affordance (false in focus mode). */
  draggable?: boolean;
  /** Receives the raw click count so the caller can split single from double. */
  onClick?: (id: string, detail: number) => void;
  children?: React.ReactNode;
};

/**
 * A project line.
 *
 * This is the ONLY line type that carries the endpoint fade
 * (TIMELINE_LINE_FADE_STOPS). Episode, scene, day and task lines are solid
 * — see TimelineBranch.
 */
export const TimelineLineComponent: React.FC<TimelineLineProps> = ({
  id,
  length,
  origin,
  angleDeg = TIMELINE_ANGLE_DEG,
  dimmed = false,
  ghost = false,
  draggable = true,
  onClick,
  children,
}) => {
  const gradientId = useId();
  const end = lineEndpoint(origin, length, angleDeg);

  // §2.5 — selection must not darken or recolour the line, so there is
  // deliberately no `selected` branch here. Selection is expressed by the
  // detail overlay and by the line easing to the centre of the display.
  const opacity = ghost ? GHOST_OPACITY : dimmed ? 0.15 : 1;

  return (
    <g
      className="transition-opacity duration-300 ease-out"
      style={{
        opacity,
        filter: ghost ? `blur(${GHOST_BLUR_PX}px)` : undefined,
        pointerEvents: ghost ? "none" : undefined,
      }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={origin.x}
          y1={origin.y}
          x2={end.x}
          y2={end.y}
        >
          {TIMELINE_LINE_FADE_STOPS.map((stop, i) => (
            <stop
              key={i}
              offset={stop.offset}
              stopColor="var(--color-line, #000000)"
              stopOpacity={stop.opacity}
            />
          ))}
        </linearGradient>
      </defs>

      <line
        x1={origin.x}
        y1={origin.y}
        x2={end.x}
        y2={end.y}
        stroke={`url(#${gradientId})`}
        strokeWidth={LINE_STROKE_WIDTH}
        strokeLinecap="round"
        className="pointer-events-none"
      />

      {/* Wide transparent hit target. Ghosts never render one, so a click
          where a blurred line sits falls through to the canvas. */}
      {!ghost && (
        <line
          data-line-hit="true"
          x1={origin.x}
          y1={origin.y}
          x2={end.x}
          y2={end.y}
          stroke="transparent"
          strokeWidth={12}
          strokeLinecap="round"
          style={{ pointerEvents: "stroke" }}
          className={draggable ? "cursor-grab" : "cursor-pointer"}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(id, e.detail);
          }}
        />
      )}

      {children}
    </g>
  );
};

export const TimelineLine = memo(TimelineLineComponent);
export default TimelineLine;
