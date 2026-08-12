"use client";

import React, { useId, memo } from "react";
import { Point, TIMELINE_ANGLE_DEG } from "@/lib/timeline/timelineGeometry";

export type TimelineGlowProps = {
  origin: Point;
  length?: number; // default ~1201.66
  opacity?: number; // default 0.8
};

export const TimelineGlowComponent: React.FC<TimelineGlowProps> = ({
  origin,
  length = 1201.66,
  opacity = 0.8,
}) => {
  const gradientId = useId();
  const height = 26;

  return (
    <g
      aria-hidden="true"
      className="pointer-events-none select-none"
      style={{ opacity }}
    >
      <defs>
        <radialGradient
          id={gradientId}
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
          <stop offset="60%" stopColor="#ffffff" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect
        x={origin.x}
        y={origin.y - height / 2}
        width={length}
        height={height}
        fill={`url(#${gradientId})`}
        transform={`rotate(${-TIMELINE_ANGLE_DEG}, ${origin.x}, ${origin.y})`}
      />
    </g>
  );
};

export const TimelineGlow = memo(TimelineGlowComponent);
export default TimelineGlow;
