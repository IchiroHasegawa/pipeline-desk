"use client";

import React, { useEffect, memo } from "react";

export type BoardTool = "select" | "folder" | "comment" | "arrow";

export type BoardToolbarProps = {
  activeTool: BoardTool;
  onToolSelect: (tool: BoardTool) => void;
  /**
   * Bar origin. DESIGN_SPEC §9 (Scene Assembly) measures (840.9, 979.6);
   * §13 (Assets Assembly) measures (842, 981).
   */
  position?: { x: number; y: number };
};

/** Button 59 × 59 at 88px pitch — DESIGN_SPEC §9 measures x 840.9, 928.9, 1016.9. */
const BUTTON_SIZE = 59;
const BUTTON_PITCH = 88;

/**
 * Order is Select · Folder · Comment, with Arrow appended — the spec notes Arrow
 * was added after the three measured buttons.
 */
const TOOLS: { id: BoardTool; label: string; shortcut: string }[] = [
  { id: "select", label: "Select", shortcut: "V" },
  { id: "folder", label: "Folder", shortcut: "F" },
  { id: "comment", label: "Comment", shortcut: "C" },
  { id: "arrow", label: "Arrow", shortcut: "A" },
];

const ICONS: Record<BoardTool, React.ReactNode> = {
  select: (
    <svg className="w-[24px] h-[24px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L5 18.5V2z" />
    </svg>
  ),
  folder: (
    <svg className="w-[24px] h-[24px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  ),
  comment: (
    <svg className="w-[24px] h-[24px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
    </svg>
  ),
  arrow: (
    <svg
      className="w-[24px] h-[24px] fill-none stroke-current"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="12 5 19 5 19 12" />
    </svg>
  ),
};

/**
 * Board tools bar — DESIGN_SPEC §9 / §13.
 * Buttons 59 × 59, radius 7, icons centred at 24–32px in `--color-ink-inverse`.
 *
 * The spec gives the icon colour but not the button fill; the dark surface below
 * is inferred from the icons being inverse-on-dark.
 */
export const BoardToolbarComponent: React.FC<BoardToolbarProps> = ({
  activeTool,
  onToolSelect,
  position = { x: 840.9, y: 979.6 },
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
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${(TOOLS.length - 1) * BUTTON_PITCH + BUTTON_SIZE}px`,
        height: `${BUTTON_SIZE}px`,
        zIndex: 40,
      }}
      className="select-none font-sans"
    >
      {TOOLS.map((tool, idx) => {
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            type="button"
            title={`${tool.label} (${tool.shortcut})`}
            aria-label={`${tool.label} tool`}
            aria-pressed={isActive}
            onClick={() => onToolSelect(tool.id)}
            style={{ left: `${idx * BUTTON_PITCH}px` }}
            className={`absolute top-0 w-[59px] h-[59px] rounded-[7px] flex items-center justify-center cursor-pointer transition-colors text-[var(--color-ink-inverse,#ffffff)] outline-none focus-visible:ring-2 focus-visible:ring-black ${
              isActive
                ? "bg-[var(--color-ink,#000000)]"
                : "bg-[var(--color-task-surface,#363636)] hover:bg-[var(--color-task-surface-alt,#484747)]"
            }`}
          >
            {ICONS[tool.id]}
          </button>
        );
      })}
    </div>
  );
};

export const BoardToolbar = memo(BoardToolbarComponent);
export default BoardToolbar;
