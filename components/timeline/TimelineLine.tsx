"use client";

import React, { useId, memo } from "react";
import {
  lineEndpoint,
  depthTransform,
  TIMELINE_LINE_FADE_STOPS,
  Point,
} from "@/lib/timeline/timelineGeometry";

export type TimelineLineProps = {
  id: string;
  length: number; // px, from useTimelineScale
  origin: Point;
  depthIndex: number; // 0 = frontmost
  depthTotal: number;
  selected?: boolean;
  dimmed?: boolean; // true when another line is focused
  onSelect?: (id: string) => void;
  onOpen?: (id: string) => void; // second click / double click
  children?: React.ReactNode; // branch lines, anchored by the parent
};

export const TimelineLineComponent: React.FC<TimelineLineProps> = ({
  id,
  length,
  origin,
  depthIndex,
  depthTotal,
  selected = false,
  dimmed = false,
  onSelect,
  onOpen,
  children,
}) => {
  const gradientId = useId();

  const end = lineEndpoint(origin, length);
  const transform = depthTransform(depthIndex, depthTotal);

  // Compute visual opacity: selected forces full opacity; dimmed forces low opacity
  let computedOpacity = transform.opacity;
  if (selected) {
    computedOpacity = 1.0;
  } else if (dimmed) {
    computedOpacity = 0.15;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected && onOpen) {
      onOpen(id);
    } else if (onSelect) {
      onSelect(id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpen) {
      onOpen(id);
    }
  };

  return (
    <g
      className="transition-[transform,opacity,filter] duration-300 ease-out"
      style={{
        transform: `translate(0px, ${transform.offsetY}px) scale(${transform.scale})`,
        transformOrigin: `${origin.x}px ${origin.y}px`,
        opacity: computedOpacity,
        filter: transform.blurPx > 0 ? `blur(${transform.blurPx}px)` : undefined,
      }}
    >
      <defs>
        {/* Axis-aligned linear gradient along line axis */}
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

      {/* Visible 1px line */}
      <line
        x1={origin.x}
        y1={origin.y}
        x2={end.x}
        y2={end.y}
        stroke={`url(#${gradientId})`}
        strokeWidth={selected ? 2 : 1}
        strokeLinecap="round"
        className="pointer-events-none"
      />

      {/* Transparent wide hit target for click/double-click */}
      <line
        x1={origin.x}
        y1={origin.y}
        x2={end.x}
        y2={end.y}
        stroke="transparent"
        strokeWidth={12}
        strokeLinecap="round"
        style={{ pointerEvents: "stroke" }}
        className="cursor-pointer"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />

      {/* Branch children */}
      {children}
    </g>
  );
};

export const TimelineLine = memo(TimelineLineComponent);
export default TimelineLine;
