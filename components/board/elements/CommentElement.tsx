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
      style={{
        minWidth: "168px",
        minHeight: "28px",
      }}
      className={`relative p-2 rounded-[9px] bg-[var(--color-comment-surface,#2b2b2b)] text-[var(--color-ink-inverse,#ffffff)] text-[12px] font-sans shadow-md cursor-grab active:cursor-grabbing border ${
        selected ? "border-2 border-white ring-2 ring-black" : "border-transparent"
      }`}
    >
      {isEditing ? (
        <textarea
          autoFocus
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-transparent text-white border-none outline-none resize-none font-sans text-[12px] leading-snug"
          rows={Math.max(1, bodyText.split("\n").length)}
        />
      ) : (
        <div className="whitespace-pre-wrap break-words leading-snug text-[12px]">
          {bodyText}
        </div>
      )}
    </div>
  );
};

export const CommentElement = memo(CommentElementComponent);
export default CommentElement;
