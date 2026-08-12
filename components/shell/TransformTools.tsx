"use client";

import React from "react";

export type ToolAction = {
  id: string;
  label: string; // e.g. "ADD", "SUB", "WHOLE", "RESTORE", "HIDE", "SAP"
  onSelect: () => void;
  disabled?: boolean;
};

export type TransformToolsProps = {
  actions: ToolAction[];
};

export const TransformTools: React.FC<TransformToolsProps> = ({ actions }) => {
  return (
    <div aria-label="Transform Tools" className="flex flex-row items-start gap-4">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.onSelect}
          disabled={action.disabled}
          aria-label={action.label}
          className="group flex flex-col items-center cursor-pointer focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {/* Plus/Cross Icon */}
          <div className="w-[var(--size-tool-icon,19px)] h-[20px] flex items-center justify-center">
            <svg
              width="19"
              height="20"
              viewBox="0 0 19 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-[19px] h-[20px] group-hover:animate-tool-nudge transition-transform origin-center"
            >
              <path
                d="M8.5 3H10.5V8.5H16V10.5H10.5V16H8.5V10.5H3V8.5H8.5V3Z"
                fill="var(--color-ink, #000000)"
              />
            </svg>
          </div>

          {/* Hover-activated Vertical Label */}
          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
            <span
              className="text-[var(--text-tool,10px)] text-[var(--color-ink,#000000)] font-sans tracking-wider select-none"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "upright",
              }}
            >
              {action.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default TransformTools;
