"use client";

import React, { useEffect, memo } from "react";

export type BoardTool = "select" | "folder" | "comment" | "arrow";

export type BoardToolbarProps = {
  activeTool: BoardTool;
  onToolSelect: (tool: BoardTool) => void;
};

export const BoardToolbarComponent: React.FC<BoardToolbarProps> = ({
  activeTool,
  onToolSelect,
}) => {
  // Keyboard shortcuts (V, F, C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "v") onToolSelect("select");
      if (key === "f") onToolSelect("folder");
      if (key === "c") onToolSelect("comment");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToolSelect]);

  return (
    <div
      style={{ left: "840.9px", top: "979.6px" }}
      className="fixed z-40 w-[235px] h-[59px] bg-[var(--color-panel,#f0f0f0)]/90 backdrop-blur-md border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] flex flex-row items-center justify-between px-2 shadow-lg select-none"
    >
      {/* 1. Select / Arrow Tool (V) */}
      <button
        type="button"
        title="Select / Connect Arrow (V)"
        onClick={() => onToolSelect("select")}
        className={`w-[59px] h-[59px] rounded-[7px] border flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
          activeTool === "select" || activeTool === "arrow"
            ? "bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] border-black shadow-xs"
            : "bg-[var(--color-placeholder,#d9d9d9)] text-[var(--color-ink,#000000)] border-[var(--color-line-soft,#a9a9a9)] hover:bg-black/10"
        }`}
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L5 18.5V2z" />
        </svg>
        <span className="text-[9px] font-mono font-medium opacity-80">Select (V)</span>
      </button>

      {/* 2. Folder Tool (F) */}
      <button
        type="button"
        title="Create Folder (F)"
        onClick={() => onToolSelect("folder")}
        className={`w-[59px] h-[59px] rounded-[7px] border flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
          activeTool === "folder"
            ? "bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] border-black shadow-xs"
            : "bg-[var(--color-placeholder,#d9d9d9)] text-[var(--color-ink,#000000)] border-[var(--color-line-soft,#a9a9a9)] hover:bg-black/10"
        }`}
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
        <span className="text-[9px] font-mono font-medium opacity-80">Folder (F)</span>
      </button>

      {/* 3. Comment Tool (C) */}
      <button
        type="button"
        title="Create Comment (C)"
        onClick={() => onToolSelect("comment")}
        className={`w-[59px] h-[59px] rounded-[7px] border flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
          activeTool === "comment"
            ? "bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] border-black shadow-xs"
            : "bg-[var(--color-placeholder,#d9d9d9)] text-[var(--color-ink,#000000)] border-[var(--color-line-soft,#a9a9a9)] hover:bg-black/10"
        }`}
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
        </svg>
        <span className="text-[9px] font-mono font-medium opacity-80">Comment (C)</span>
      </button>
    </div>
  );
};

export const BoardToolbar = memo(BoardToolbarComponent);
export default BoardToolbar;
