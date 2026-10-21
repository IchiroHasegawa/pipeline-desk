// Copied from components/board for the redesign; the original is removed at cutover.
"use client";

import React, { useState, memo } from "react";
import type { BoardElement } from "@/types/production-v2";

export type CommentElementProps = {
  element: BoardElement;
  selected?: boolean;
  onSelect?: (e: React.PointerEvent) => void;
  onTextChange?: (elementId: string, newBody: string) => void;
};

export const CommentElementComponent: React.FC<CommentElementProps> = ({
  element,
  selected = false,
  onSelect,
  onTextChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bodyText, setBodyText] = useState(element.body || element.title || "Comment...");

  const handleBlur = () => {
    setIsEditing(false);
    if (onTextChange && bodyText !== (element.body || element.title)) {
      onTextChange(element.id, bodyText);
    }
  };

  return (
    <div
      onPointerDown={onSelect}
      onDoubleClick={() => setIsEditing(true)}
      style={{ minWidth: "168px", minHeight: "32px" }}
      className={`relative inline-flex items-center px-3 py-1.5 rounded-[10px] bg-[var(--po-card)] text-[var(--po-ink)] font-sans border border-[var(--po-line)] shadow-[var(--po-shadow-sm)] cursor-grab active:cursor-grabbing transition-all ${
        selected ? "ring-2 ring-[var(--po-accent)] border-[var(--po-accent)] shadow-[var(--po-shadow)]" : ""
      }`}
    >
      {isEditing ? (
        <input
          autoFocus
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="w-full bg-transparent text-[var(--po-ink)] border-none outline-none font-sans text-[12px] leading-tight p-0"
        />
      ) : (
        <div className="flex items-center gap-1.5 text-[12px] leading-tight truncate">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--po-accent)] flex-none" />
          <span className="truncate">{bodyText}</span>
        </div>
      )}
    </div>
  );
};

export const CommentElement = memo(CommentElementComponent);
export default CommentElement;
