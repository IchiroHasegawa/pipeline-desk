"use client";

import React, { useState } from "react";
import { Minus, Plus, Maximize } from "lucide-react";

export interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  className?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  className = "",
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const isMin = zoom <= 0.25 + 0.001;
  const isMax = zoom >= 3.0 - 0.001;

  const pctString = `${Math.round(zoom * 100)}%`;

  return (
    <div
      role="group"
      aria-label="Zoom controls"
      className={`pointer-events-auto flex items-center gap-[2px] rounded-full border border-[var(--po-line)] bg-[var(--po-card)] p-[5px] shadow-[var(--po-shadow)] select-none ${className}`.trim()}
      style={{
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      }}
    >
      {/* Zoom Out Button */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setActiveTooltip("out")}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          type="button"
          onClick={isMin ? undefined : onZoomOut}
          disabled={isMin}
          aria-label={isMin ? "Minimum zoom · 25%" : "Zoom out"}
          className={`flex h-[36px] w-[36px] items-center justify-center rounded-[18px] border-none text-[var(--po-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] ${
            isMin
              ? "cursor-not-allowed opacity-30"
              : "cursor-pointer hover:bg-[var(--po-chip)]"
          }`}
        >
          <Minus size={16} />
        </button>
        {activeTooltip === "out" && (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-[52px] left-1/2 -translate-x-1/2 z-[90] whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
          >
            {isMin ? "Minimum zoom · 25%" : "Zoom out"}
          </div>
        )}
      </div>

      {/* Percentage / Reset Button */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setActiveTooltip("pct")}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          type="button"
          onClick={onResetZoom}
          aria-label="Reset to 100%"
          className="flex h-[36px] min-w-[56px] items-center justify-center rounded-[18px] border-none px-2 text-[13px] font-semibold text-[var(--po-ink)] tabular-nums transition-colors hover:bg-[var(--po-chip)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
        >
          {pctString}
        </button>
        {activeTooltip === "pct" && (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-[52px] left-1/2 -translate-x-1/2 z-[90] whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
          >
            Reset to 100%
          </div>
        )}
      </div>

      {/* Zoom In Button */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setActiveTooltip("in")}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          type="button"
          onClick={isMax ? undefined : onZoomIn}
          disabled={isMax}
          aria-label={isMax ? "Maximum zoom · 300%" : "Zoom in"}
          className={`flex h-[36px] w-[36px] items-center justify-center rounded-[18px] border-none text-[var(--po-ink)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)] ${
            isMax
              ? "cursor-not-allowed opacity-30"
              : "cursor-pointer hover:bg-[var(--po-chip)]"
          }`}
        >
          <Plus size={16} />
        </button>
        {activeTooltip === "in" && (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-[52px] left-1/2 -translate-x-1/2 z-[90] whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
          >
            {isMax ? "Maximum zoom · 300%" : "Zoom in"}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-1 h-[20px] w-[1px] bg-[var(--po-line-2)]" />

      {/* Fit to Content Button */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setActiveTooltip("fit")}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <button
          type="button"
          onClick={onFitToContent}
          aria-label="Fit to content"
          className="flex h-[36px] items-center justify-center gap-1.5 rounded-[18px] border-none px-3 text-[13px] font-semibold text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
        >
          <Maximize size={15} />
          <span>Fit</span>
        </button>
        {activeTooltip === "fit" && (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-[52px] left-1/2 -translate-x-1/2 z-[90] whitespace-nowrap rounded-[8px] bg-[var(--po-tip)] px-[10px] py-[7px] text-[12px] font-medium text-[var(--po-tip-ink)] shadow-[var(--po-shadow)]"
          >
            Fit to content
          </div>
        )}
      </div>
    </div>
  );
};
