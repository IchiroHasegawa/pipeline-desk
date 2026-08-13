"use client";

import React, { useId, memo } from "react";
import { TIMELINE_LINE_FADE_STOPS, Point } from "@/lib/timeline/timelineGeometry";

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
  const gradientId = useId();

  let computedOpacity = 1.0;
  if (dimmed) {
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
      className="transition-[opacity] duration-300 ease-out"
      style={{ opacity: computedOpacity }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
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

      {/* Visible 0.5px hairline branch line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={`url(#${gradientId})`}
        strokeWidth={selected ? 1.5 : 0.5}
        strokeLinecap="round"
        className="pointer-events-none"
      />

      {/* Transparent wide 12px hit target */}
      <line
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
        onDoubleClick={handleDoubleClick}
      />

      {/* Sub-branch children */}
      {children}
    </g>
  );
};

export const TimelineBranch = memo(TimelineBranchComponent);
export default TimelineBranch;
