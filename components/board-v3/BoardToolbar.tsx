// Copied from components/board for the redesign; the original is removed at cutover.
"use client";

import React, { useEffect, memo } from "react";

export type BoardTool = "select" | "folder" | "comment" | "arrow";

export type BoardToolbarProps = {
  activeTool: BoardTool;
  onToolSelect: (tool: BoardTool) => void;
  className?: string;
};

const TOOLS: { id: BoardTool; label: string; shortcut: string }[] = [
  { id: "select", label: "Select", shortcut: "V" },
  { id: "folder", label: "Folder", shortcut: "F" },
  { id: "comment", label: "Comment", shortcut: "C" },
  { id: "arrow", label: "Arrow", shortcut: "A" },
];

const ICONS: Record<BoardTool, React.ReactNode> = {
  select: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L5 18.5V2z" />
    </svg>
  ),
  folder: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  ),
  comment: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
    </svg>
  ),
  arrow: (
    <svg
      className="w-5 h-5 fill-none stroke-current"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="12 5 19 5 19 12" />
    </svg>
  ),
};

export const BoardToolbarComponent: React.FC<BoardToolbarProps> = ({
  activeTool,
  onToolSelect,
  className = "",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      const match = TOOLS.find((t) => t.shortcut.toLowerCase() === key);
      if (match) onToolSelect(match.id);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToolSelect]);

  return (
    <div
      role="toolbar"
      aria-label="Board Tools"
      className={`select-none font-sans inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[var(--po-card)] border border-[var(--po-line)] shadow-[var(--po-shadow)] backdrop-blur-md z-30 ${className}`}
    >
      {TOOLS.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onToolSelect(t.id)}
            title={`${t.label} (${t.shortcut})`}
            aria-label={`${t.label} (${t.shortcut})`}
            className={`group relative flex items-center justify-center h-10 w-10 rounded-full transition-all cursor-pointer ${
              isActive
                ? "bg-[var(--po-ink)] text-[var(--po-panel)] shadow-xs"
                : "text-[var(--po-ink-2)] hover:text-[var(--po-ink)] hover:bg-[var(--po-chip)]"
            }`}
          >
            {ICONS[t.id]}
            {/* Tooltip on hover */}
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-[var(--po-tip)] px-2 py-0.5 text-[11px] font-medium text-[var(--po-tip-ink)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 z-50">
              {t.label} <span className="opacity-70 font-mono text-[10px]">({t.shortcut})</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const BoardToolbar = memo(BoardToolbarComponent);
export default BoardToolbar;
