"use client";

import React from "react";
import { GRAPH_SIZES, CARD_SHADOW, HAIRLINE } from "@/lib/design/boardTokens";

/**
 * Placeholder card. There is no reviews schema yet and none is invented here:
 * the Review page will supply the data, and this component will take a props
 * slice of ProjectBoardStats at that point. Until then it renders static copy
 * and queries nothing.
 */
export type ReviewsGraphProps = {
  className?: string;
};

const SIZE = GRAPH_SIZES.reviews;

export const ReviewsGraph: React.FC<ReviewsGraphProps> = ({ className }) => {
  return (
    <div
      className={
        "flex flex-col items-center justify-center gap-1 overflow-hidden font-sans " +
        (className || "")
      }
      style={{
        width: SIZE.width + "px",
        height: SIZE.height + "px",
        backgroundColor: "var(--color-placeholder, #d9d9d9)",
        border: HAIRLINE + " solid var(--color-line-soft, #a9a9a9)",
        borderRadius: "var(--radius-card, 7px)",
        boxShadow: CARD_SHADOW,
      }}
    >
      <span
        style={{
          fontSize: "var(--text-caption, 11px)",
          color: "var(--color-ink, #000000)",
        }}
      >
        Reviews
      </span>
      <span
        style={{
          fontSize: "var(--text-caption, 11px)",
          color: "var(--color-ink-muted, #707070)",
        }}
      >
        Coming soon
      </span>
    </div>
  );
};

export default ReviewsGraph;
