/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo } from "react";
import type { BoardElement } from "@/types/production-v2";

export type ImageElementProps = {
  element: BoardElement;
  selected?: boolean;
  onSelect?: (e: React.PointerEvent) => void;
  onDoubleClick?: (element: BoardElement) => void;
};

export const ImageElementComponent: React.FC<ImageElementProps> = ({
  element,
  selected = false,
  onSelect,
  onDoubleClick,
}) => {
  const width = element.width || 339;
  const height = element.height || 198;

  return (
    <div
      onPointerDown={onSelect}
      onDoubleClick={() => onDoubleClick && onDoubleClick(element)}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`relative select-none cursor-grab active:cursor-grabbing border ${
        selected
          ? "border-2 border-[var(--color-ink,#000000)] shadow-md"
          : "border-[var(--color-line-soft,#a9a9a9)] shadow-xs"
      } bg-[var(--color-placeholder,#d9d9d9)] overflow-hidden transition-shadow`}
    >
      {element.imageUrl ? (
        <img
          src={element.imageUrl}
          alt={element.title || "Keyframe"}
          className="w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-4 font-mono text-[var(--color-ink-muted,#707070)] text-[11px] text-center">
          <span>{element.title || "[IMAGE]"}</span>
          <span className="text-[9px] opacity-70">
            {element.elementType === "keyframe" ? "Keyframe" : "Asset"}
          </span>
        </div>
      )}

      {/* Keyframe number badge */}
      {element.keyframeNumber !== null && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] font-mono font-bold text-[11px] rounded-[var(--radius-xs,1px)] shadow-xs">
          #{element.keyframeNumber}
        </div>
      )}
    </div>
  );
};

export const ImageElement = memo(ImageElementComponent);
export default ImageElement;
