// Copied from components/board for the redesign; the original is removed at cutover.
"use client";

import React, { memo } from "react";
import type { BoardElement } from "@/types/production-v2";

export type FolderElementProps = {
  element: BoardElement;
  childCount?: number;
  selected?: boolean;
  onSelect?: (e: React.PointerEvent) => void;
  onDoubleClick?: (element: BoardElement) => void;
};

export const FolderElementComponent: React.FC<FolderElementProps> = ({
  element,
  childCount = 0,
  selected = false,
  onSelect,
  onDoubleClick,
}) => {
  const isGreen = element.colour === "green";

  const tabFill = isGreen
    ? "oklch(0.68 0.14 150)"
    : "oklch(0.65 0.12 205)";

  const frontFill = isGreen
    ? "oklch(0.48 0.12 150)"
    : "oklch(0.45 0.11 205)";

  return (
    <div
      onPointerDown={onSelect}
      onDoubleClick={() => onDoubleClick && onDoubleClick(element)}
      style={{ width: "203px", height: "160px" }}
      className={`relative select-none cursor-grab active:cursor-grabbing transition-transform duration-100 ${
        selected ? "ring-2 ring-[var(--po-accent)] ring-offset-2 ring-offset-[var(--po-sunken)] rounded-[12px] shadow-[var(--po-shadow)]" : ""
      }`}
    >
      {/* 1. Back plate: (0, 11) 203 x 133, radius 4 */}
      <div
        className="absolute left-0 top-[11px] w-[203px] h-[133px] rounded-[8px] bg-[var(--po-panel)] border border-[var(--po-line)] shadow-xs"
      />

      {/* 2. Tab: (162, 0) 41 x 61, radius 10 */}
      <div
        style={{ backgroundColor: tabFill }}
        className="absolute left-[150px] top-0 w-[45px] h-[61px] rounded-[10px] shadow-xs"
      />

      {/* 3. Front: (0, 27) 203 x 133, radius 10 */}
      <div
        style={{ backgroundColor: frontFill }}
        className="absolute left-0 top-[27px] w-[203px] h-[133px] rounded-[12px] border border-white/10 shadow-[var(--po-shadow-sm)]"
      />

      {/* 4. Label: (14, 52) */}
      <div className="absolute left-[16px] top-[48px] right-[16px] flex flex-col justify-center text-white">
        <span className="block text-[13px] leading-tight font-semibold truncate drop-shadow-xs">
          {element.title || "Untitled Folder"}
        </span>
        <span className="block pt-1 text-[11px] leading-none opacity-85 font-mono">
          {childCount} item{childCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
};

export const FolderElement = memo(FolderElementComponent);
export default FolderElement;
