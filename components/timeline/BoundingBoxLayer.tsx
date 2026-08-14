"use client";

import React, { useId } from "react";
import {
  BOX_EDGE_FADE_RATIO,
  type BoundingBox,
} from "@/lib/timeline/timelineGeometry";

export type BoundingBoxLayerProps = {
  box: BoundingBox;
  /** Fraction of each axis consumed by the edge fade. */
  fadeRatio?: number;
  /** Dev-only outline so the boundary can be checked visually. */
  debug?: boolean;
  children: React.ReactNode;
};

/**
 * The Episode page's invisible boundary (§3.1).
 *
 * Two mechanisms, deliberately kept separate:
 *
 *  - a `<clipPath>` gives the hard boundary, so no line can render past
 *    the box under any transform;
 *  - a `<mask>` built from edge gradients fades lines out *at* the edge,
 *    so a line that reaches the boundary dissolves instead of being cut
 *    mid-stroke.
 *
 * This BOUNDARY fade is NOT the project line's endpoint fade. That one
 * lives in TimelineLine / TIMELINE_LINE_FADE_STOPS and belongs to the
 * project line alone. The two compose correctly because both are opacity
 * multiplications: a project line reaching the box edge is attenuated by
 * its own gradient and again by the mask, which is the intended result.
 * Keep them named apart — BOX_EDGE_FADE_RATIO vs PROJECT_LINE_FADE_*.
 *
 * The mask is built from two nested masks so the horizontal and vertical
 * gradients multiply; a single mask with two overlapping gradient rects
 * would composite by painting order instead and leave the corners wrong.
 */
export const BoundingBoxLayer: React.FC<BoundingBoxLayerProps> = ({
  box,
  fadeRatio = BOX_EDGE_FADE_RATIO,
  debug = false,
  children,
}) => {
  const uid = useId().replace(/:/g, "");
  const clipId = `bbox-clip-${uid}`;
  const maskId = `bbox-mask-${uid}`;
  const vMaskId = `bbox-vmask-${uid}`;
  const hGradId = `bbox-hgrad-${uid}`;
  const vGradId = `bbox-vgrad-${uid}`;

  const near = Math.min(0.49, Math.max(0, fadeRatio));
  const far = 1 - near;

  // Dev-only. `process.env.NODE_ENV` is statically replaced at build time,
  // so this whole block is eliminated from production bundles.
  const showDebug = debug && process.env.NODE_ENV !== "production";

  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect x={box.x} y={box.y} width={box.width} height={box.height} />
        </clipPath>

        <linearGradient id={hGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" />
          <stop offset={near} stopColor="#ffffff" />
          <stop offset={far} stopColor="#ffffff" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>

        <linearGradient id={vGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" />
          <stop offset={near} stopColor="#ffffff" />
          <stop offset={far} stopColor="#ffffff" />
          <stop offset="1" stopColor="#000000" />
        </linearGradient>

        <mask id={vMaskId} maskUnits="userSpaceOnUse">
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill={`url(#${vGradId})`}
          />
        </mask>

        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill={`url(#${hGradId})`}
            mask={`url(#${vMaskId})`}
          />
        </mask>
      </defs>

      <g clipPath={`url(#${clipId})`} mask={`url(#${maskId})`}>
        {children}
      </g>

      {showDebug && (
        <g pointerEvents="none" aria-hidden="true">
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="none"
            stroke="#ff0080"
            strokeWidth={1}
            strokeDasharray="6 4"
          />
          <text
            x={box.x + 6}
            y={box.y + 16}
            fill="#ff0080"
            fontSize={12}
            fontFamily="monospace"
          >
            {`bbox ${Math.round(box.width)} × ${Math.round(box.height)}`}
          </text>
        </g>
      )}
    </>
  );
};

export default BoundingBoxLayer;
