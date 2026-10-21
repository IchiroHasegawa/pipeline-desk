// Copied from components/board for the redesign; the original is removed at cutover.
"use client";

import React, { memo } from "react";
import type { BoardElement } from "@/types/production-v2";

export type ArrowElementProps = {
  element: BoardElement;
  fromElement?: BoardElement;
  toElement?: BoardElement;
  selected?: boolean;
  onSelect?: (e: React.PointerEvent) => void;
};

export const ArrowElementComponent: React.FC<ArrowElementProps> = ({
  element,
  fromElement,
  toElement,
  selected = false,
  onSelect,
}) => {
  if (!fromElement || !toElement) return null;

  // Center coordinates of source and target elements
  const fromCenter = {
    x: fromElement.x + (fromElement.width || 100) / 2,
    y: fromElement.y + (fromElement.height || 100) / 2,
  };

  const toCenter = {
    x: toElement.x + (toElement.width || 100) / 2,
    y: toElement.y + (toElement.height || 100) / 2,
  };

  const markerId = `arrowhead-v3-${element.id}`;
  const strokeColor = selected ? "var(--po-accent)" : "var(--po-ink-2)";

  return (
    <g onPointerDown={onSelect} className="cursor-pointer group">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 14 10"
          refX="12"
          refY="5"
          markerWidth="12"
          markerHeight="9"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 14 5 L 0 10 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Invisible wider hit region for easier clicking */}
      <line
        x1={fromCenter.x}
        y1={fromCenter.y}
        x2={toCenter.x}
        y2={toCenter.y}
        stroke="transparent"
        strokeWidth={14}
      />

      {/* Visible connecting line with arrowhead */}
      <line
        x1={fromCenter.x}
        y1={fromCenter.y}
        x2={toCenter.x}
        y2={toCenter.y}
        stroke={strokeColor}
        strokeWidth={selected ? 2.5 : 2}
        strokeDasharray={element.colour === "dashed" ? "5 4" : undefined}
        markerEnd={`url(#${markerId})`}
        className="transition-colors group-hover:stroke-[var(--po-accent)]"
      />
    </g>
  );
};

export const ArrowElement = memo(ArrowElementComponent);
export default ArrowElement;
