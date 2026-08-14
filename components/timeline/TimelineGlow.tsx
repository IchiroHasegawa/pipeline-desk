"use client";

import React, { useId, memo } from "react";
import { Point, TIMELINE_ANGLE_DEG } from "@/lib/timeline/timelineGeometry";

export type TimelineGlowProps = {
  origin: Point;
  lineLength: number;
  angleDeg?: number;
  opacity?: number;
};

export const TimelineGlowComponent: React.FC<TimelineGlowProps> = ({
  origin,
  lineLength,
  angleDeg = TIMELINE_ANGLE_DEG,
  opacity = 0.8,
}) => {
  const gradientId = useId();

  const streakWidth = lineLength * 1.05;
  const streakHeight = streakWidth * 0.42;
  const streakX = origin.x - 30;
  const streakY = origin.y + 410;

  return (
    <g
      aria-hidden="true"
      style={{ opacity, pointerEvents: "none" }}
      className="select-none"
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
          <stop offset="70%" stopColor="#ffffff" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect
        x={streakX}
        y={streakY - streakHeight / 2}
        width={streakWidth}
        height={streakHeight}
        fill={`url(#${gradientId})`}
        transform={`rotate(${-angleDeg}, ${streakX}, ${streakY})`}
      />
    </g>
  );
};

export const TimelineGlow = memo(TimelineGlowComponent);
export default TimelineGlow;
