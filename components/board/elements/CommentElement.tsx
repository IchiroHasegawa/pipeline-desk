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
      style={{ width: "168px", height: "28px" }}
      className={`relative rounded-[9px] bg-[var(--color-comment-surface,#565656)] text-[var(--color-ink-inverse,#ffffff)] font-sans shadow-md cursor-grab active:cursor-grabbing ${
        selected ? "ring-2 ring-black outline outline-1 outline-white" : ""
      }`}
    >
      {/* Text (8, 6) 117 x 15 */}
      {isEditing ? (
        <input
          autoFocus
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="absolute left-[8px] top-[6px] w-[117px] h-[15px] bg-transparent text-[var(--color-ink-inverse,#ffffff)] border-none outline-none font-sans text-[var(--text-caption,11px)] leading-none p-0"
        />
      ) : (
        <div className="absolute left-[8px] top-[6px] w-[117px] h-[15px] flex items-center text-[var(--text-caption,11px)] leading-none truncate">
          {bodyText}
        </div>
      )}
    </div>
  );
};

export const CommentElement = memo(CommentElementComponent);
export default CommentElement;
