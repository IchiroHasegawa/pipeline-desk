"use client";

import React, { memo } from "react";

export type FocusCardProps = {
  title: string;
  creationDate: string | null;
  description: string;
  thumbnailUrl?: string;
};

export const FocusCardComponent: React.FC<FocusCardProps> = ({
  title,
  creationDate,
  description,
  thumbnailUrl,
}) => {
  // Format creationDate as MM/DD/YY
  const formattedDate = creationDate
    ? (() => {
        try {
          const d = new Date(creationDate);
          if (isNaN(d.getTime())) return creationDate;
          return d.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          });
        } catch {
          return creationDate;
        }
      })()
    : "N/A";

  return (
    <div
      aria-label="Focus Details"
      className="relative flex flex-row items-start gap-6 pointer-events-auto select-none transition-all duration-500 ease-out"
    >
      {/* Left Details Block */}
      <div className="flex flex-col items-start max-w-[420px]">
        {/* Title (142px display text) */}
        <h1
          className="font-sans font-normal text-[var(--color-ink,#000000)] tracking-tighter leading-none select-text"
          style={{ fontSize: "var(--text-display, 142px)" }}
        >
          {title}
        </h1>

        {/* Creation Date */}
        <p className="mt-2 text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)] font-sans font-medium tracking-wide">
          Creation Date - {formattedDate}
        </p>

        {/* Description */}
        <p className="mt-3 text-[var(--text-list,12px)] text-[var(--color-ink,#000000)] font-sans leading-relaxed max-w-[257px]">
          {description}
        </p>
      </div>

      {/* 50x13 Connector Line & 214x125 Thumbnail */}
      <div className="flex flex-row items-center gap-2 mt-12">
        {/* Connector SVG line (50x13, 0.5px stroke) */}
        <svg
          width="50"
          height="13"
          viewBox="0 0 50 13"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[50px] h-[13px] shrink-0"
        >
          <path
            d="M0 6.5H50"
            stroke="var(--color-line, #000000)"
            strokeWidth="0.5"
          />
        </svg>

        {/* Thumbnail Frame (214 x 125) */}
        <div className="w-[214px] h-[125px] rounded-[var(--radius-sm,3px)] overflow-hidden bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)] shrink-0 flex items-center justify-center">
          {thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[var(--color-placeholder,#d9d9d9)] flex items-center justify-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-mono">
              THUMBNAIL
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const FocusCard = memo(FocusCardComponent);
export default FocusCard;
