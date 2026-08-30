"use client";

import React from "react";
import type { ProcessProgress } from "@/types/production-v2";

export type ProcessCardProps = {
  process: ProcessProgress;
};

const CARD_WIDTH = 155;
const CARD_HEIGHT = 115;
const TAB_HEIGHT = 4;

const RING_SIZE = 54;
const RING_STROKE = 7;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * One process of an episode's scene workflow, as a dark card with a completion
 * ring. Purely presentational — the rollup is computed server-side by
 * getEpisodeProcessProgress.
 */
export const ProcessCard: React.FC<ProcessCardProps> = ({ process }) => {
  // percent is already clamped by the rollup, but the ring geometry breaks
  // visibly if it ever is not, so the arc is bounded here too.
  const percent = Math.max(0, Math.min(100, process.percent));
  const dash = (percent / 100) * RING_CIRCUMFERENCE;

  return (
    <div
      className="relative shrink-0 overflow-hidden select-none"
      style={{
        width: CARD_WIDTH + "px",
        height: CARD_HEIGHT + "px",
        backgroundColor: "var(--color-task-surface, #363636)",
        borderRadius: "var(--radius-card, 7px)",
      }}
      title={`${process.processName}: ${process.completeScenes} of ${process.totalScenes} scenes complete`}
    >
      {/* Coloured tab strip along the top edge, in the process's own colour. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0"
        style={{
          height: TAB_HEIGHT + "px",
          backgroundColor: process.colour || "var(--color-placeholder, #d9d9d9)",
        }}
      />

      <div
        className="flex flex-row items-start justify-between gap-2"
        style={{ padding: `${TAB_HEIGHT + 10}px 10px 0 10px` }}
      >
        <span
          className="min-w-0 leading-tight break-words"
          style={{
            fontSize: "var(--text-list, 12px)",
            color: "var(--color-canvas, #ffffff)",
          }}
        >
          {process.processName}
        </span>

        <span
          className="shrink-0 inline-flex items-center justify-center"
          style={{
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            borderRadius: "var(--radius-sm, 3px)",
            backgroundColor: "var(--color-task-surface-alt, #484747)",
            fontSize: "var(--text-caption, 11px)",
            color: "var(--color-canvas, #ffffff)",
          }}
        >
          {process.position}
        </span>
      </div>

      <div className="absolute right-[10px] bottom-[10px]">
        <div
          className="relative"
          style={{ width: RING_SIZE + "px", height: RING_SIZE + "px" }}
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            aria-hidden="true"
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--color-placeholder, #d9d9d9)"
              strokeWidth={RING_STROKE}
            />
            {percent > 0 && (
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--color-progress, #3cac88)"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${RING_CIRCUMFERENCE - dash}`}
                /* Start the arc at 12 o'clock rather than 3. */
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            )}
          </svg>

          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{
              fontSize: "var(--text-body, 15px)",
              color: "var(--color-canvas, #ffffff)",
            }}
          >
            {percent}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProcessCard;
