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

  const markerId = `arrowhead-${element.id}`;

  return (
    <g onClick={onSelect} className="cursor-pointer group">
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 14 10"
          refX="12"
          refY="5"
          markerWidth="13.5"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 14 5 L 0 10 z" fill="var(--color-line,#000000)" />
        </marker>
      </defs>

      {/* Invisible wider hit region for easier clicking */}
      <line
        x1={fromCenter.x}
        y1={fromCenter.y}
        x2={toCenter.x}
        y2={toCenter.y}
        stroke="transparent"
        strokeWidth={12}
      />

      {/* Main Hairline Arrow */}
      <line
        x1={fromCenter.x}
        y1={fromCenter.y}
        x2={toCenter.x}
        y2={toCenter.y}
        stroke={selected ? "black" : "var(--color-line,#000000)"}
        strokeWidth={selected ? 2 : 1}
        markerEnd={`url(#${markerId})`}
      />
    </g>
  );
};

export const ArrowElement = memo(ArrowElementComponent);
export default ArrowElement;
