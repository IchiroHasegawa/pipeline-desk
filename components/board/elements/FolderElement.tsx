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
    ? "var(--color-folder-green-tab, #75d592)"
    : "var(--color-folder-teal-tab, #b5ffe5)";

  const frontFill = isGreen
    ? "var(--color-folder-green, #327c53)"
    : "var(--color-folder-teal, #32717c)";

  return (
    <div
      onPointerDown={onSelect}
      onDoubleClick={() => onDoubleClick && onDoubleClick(element)}
      style={{ width: "203px", height: "160px" }}
      className={`relative select-none cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-black rounded-lg shadow-md" : ""
      }`}
    >
      {/* 1. Back plate: (0, 11) 203 x 133, radius 4 */}
      <div
        className="absolute left-0 top-[11px] w-[203px] h-[133px] rounded-[4px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)]"
      />

      {/* 2. Tab: (162, 0) 41 x 61, radius 10 */}
      <div
        style={{ backgroundColor: tabFill }}
        className="absolute left-[162px] top-0 w-[41px] h-[61px] rounded-[10px] shadow-xs"
      />

      {/* 3. Front: (0, 27) 203 x 133, radius 10 */}
      <div
        style={{ backgroundColor: frontFill }}
        className="absolute left-0 top-[27px] w-[203px] h-[133px] rounded-[10px] border border-black/10 shadow-sm"
      />

      {/* 4. Label: (12, 52) 71 x 30, --color-ink-inverse */}
      <div className="absolute left-[12px] top-[52px] w-[71px] h-[30px] flex flex-col justify-center text-[var(--color-ink-inverse,#ffffff)]">
        <span className="block text-[var(--text-list,12px)] leading-none font-bold truncate">
          {element.title || "Untitled Folder"}
        </span>
        <span className="block pt-[3px] text-[10px] leading-none opacity-80 truncate">
          {childCount} item{childCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
};

export const FolderElement = memo(FolderElementComponent);
export default FolderElement;
