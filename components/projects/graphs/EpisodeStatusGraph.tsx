"use client";

import React from "react";
import {
  GRAPH_SIZES,
  BOARD_ACCENT_GRADIENT,
  CARD_SHADOW,
  HAIRLINE,
} from "@/lib/design/boardTokens";
import type { ProjectBoardStats } from "@/types/production-v2";

export type EpisodeStatusGraphProps = {
  episodeStatus: ProjectBoardStats["episodeStatus"];
  className?: string;
};

const SIZE = GRAPH_SIZES.episodeStatus;

/** Hairlines between rows sit at 30% white so they read on the gradient. */
const ROW_RULE = "rgba(255, 255, 255, 0.3)";

export const EpisodeStatusGraph: React.FC<EpisodeStatusGraphProps> = ({
  episodeStatus,
  className,
}) => {
  const { notStarted, inProgress, complete, total } = episodeStatus;

  const rows: { label: string; value: number }[] = [
    { label: "Complete", value: complete },
    { label: "In Progress", value: inProgress },
    { label: "Not Started", value: notStarted },
  ];

  return (
    <div
      className={"flex flex-col overflow-hidden font-sans " + (className || "")}
      style={{
        width: SIZE.width + "px",
        height: SIZE.height + "px",
        background: BOARD_ACCENT_GRADIENT,
        border: HAIRLINE + " solid var(--color-line-soft, #a9a9a9)",
        borderRadius: "var(--radius-card, 7px)",
        boxShadow: CARD_SHADOW,
        color: "var(--color-ink-inverse, #ffffff)",
      }}
    >
      <div
        className="px-4 pt-3 shrink-0"
        style={{
          fontSize: "var(--text-caption, 11px)",
          color: "var(--color-ink-muted, #707070)",
        }}
      >
        <span style={{ color: "rgba(255, 255, 255, 0.75)" }}>Episodes</span>
      </div>

      {total === 0 ? (
        <div
          className="flex-1 flex items-center justify-center"
          style={{ fontSize: "var(--text-caption, 11px)" }}
        >
          No episodes
        </div>
      ) : (
        <>
          <div className="px-4 pt-2 pb-3 shrink-0">
            <span
              className="font-medium leading-none"
              style={{ fontSize: "var(--text-heading, 24px)" }}
            >
              {total}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-start px-4 pb-3">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className="flex flex-row items-center justify-between py-2"
                style={{
                  fontSize: "var(--text-caption, 11px)",
                  borderTop: i === 0 ? undefined : HAIRLINE + " solid " + ROW_RULE,
                }}
              >
                <span>{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EpisodeStatusGraph;
