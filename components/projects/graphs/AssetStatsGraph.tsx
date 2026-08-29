"use client";

import React from "react";
import {
  GRAPH_SIZES,
  BOARD_ACCENT,
  CARD_SHADOW,
  HAIRLINE,
} from "@/lib/design/boardTokens";
import type { ProjectBoardStats } from "@/types/production-v2";

export type AssetStatsGraphProps = {
  assets: ProjectBoardStats["assets"];
  className?: string;
};

const SIZE = GRAPH_SIZES.assets;

/** Solid accent block across the top third. */
const ACCENT_BLOCK_HEIGHT = Math.round(SIZE.height / 3);

/** Bytes are whole; everything above KB carries one decimal. */
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return Math.round(bytes) + " B";

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return value.toFixed(1) + " " + units[unitIndex];
}

export const AssetStatsGraph: React.FC<AssetStatsGraphProps> = ({
  assets,
  className,
}) => {
  const rows: { label: string; value: number }[] = [
    { label: "Assets", value: assets.assetCount },
    { label: "Files", value: assets.fileCount },
  ];

  return (
    <div
      className={"flex flex-col overflow-hidden font-sans " + (className || "")}
      style={{
        width: SIZE.width + "px",
        height: SIZE.height + "px",
        backgroundColor: "var(--color-canvas, #ffffff)",
        border: HAIRLINE + " solid var(--color-line-soft, #a9a9a9)",
        borderRadius: "var(--radius-card, 7px)",
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="shrink-0 flex flex-col justify-center px-4"
        style={{
          height: ACCENT_BLOCK_HEIGHT + "px",
          backgroundColor: BOARD_ACCENT,
          color: "var(--color-ink-inverse, #ffffff)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-caption, 11px)",
            color: "rgba(255, 255, 255, 0.75)",
          }}
        >
          Assets
        </span>
        <span
          className="font-medium leading-none pt-1"
          style={{ fontSize: "var(--text-section, 18px)" }}
        >
          {formatBytes(assets.totalBytes)}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-start px-4 pt-3">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex flex-row items-center justify-between py-2"
            style={{
              fontSize: "var(--text-caption, 11px)",
              color: "var(--color-ink, #000000)",
              borderTop:
                i === 0
                  ? undefined
                  : HAIRLINE + " solid var(--color-line-soft, #a9a9a9)",
            }}
          >
            <span style={{ color: "var(--color-ink-muted, #707070)" }}>
              {row.label}
            </span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetStatsGraph;
