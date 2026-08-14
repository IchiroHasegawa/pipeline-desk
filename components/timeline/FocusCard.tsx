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

  // Scale title font size between 142px and 64px so long titles do not overflow
  const titleFontSize = (() => {
    const len = title.trim().length;
    if (len <= 5) return 142;
    return Math.max(64, Math.min(142, Math.round(142 * (5 / len))));
  })();

  return (
    <div
      aria-label="Focus Details"
      className="absolute inset-0 pointer-events-none select-none font-sans"
    >
      {/* Title at (329.5, 147), size 680 x 126 */}
      <div className="absolute left-[329.5px] top-[147px] w-[680px] h-[126px] flex items-baseline pointer-events-auto">
        <h1
          className="font-sans font-normal text-[var(--color-ink,#000000)] tracking-tighter leading-none select-text truncate"
          style={{ fontSize: `${titleFontSize}px` }}
        >
          {title}
        </h1>
      </div>

      {/* Creation Date at (622.5, 346), size 147 x 88 */}
      <div className="absolute left-[622.5px] top-[346px] w-[147px] h-[88px] flex items-start pointer-events-auto">
        <p className="text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)] font-sans font-medium tracking-wide">
          Creation Date - {formattedDate}
        </p>
      </div>

      {/* Description at (329.5, 393), size 257 x 395 */}
      <div className="absolute left-[329.5px] top-[393px] w-[257px] h-[395px] overflow-auto pointer-events-auto">
        <p className="text-[var(--text-list,12px)] text-[var(--color-ink,#000000)] font-sans leading-relaxed">
          {description}
        </p>
      </div>

      {/* The connector is NOT drawn here. TimelineCanvas draws it from the
          project line's live anchor to this frame's edge, so it stays
          attached under pan, zoom and resize (§2.7). Its geometry comes
          from PROJECT_FOCUS_CONNECTOR — keep this frame's position in step
          with that constant. */}

      {/* Thumbnail Frame (214 x 125) at (1143.5, 468) — PROJECT_FOCUS_CONNECTOR.rect */}
      <div className="absolute left-[1143.5px] top-[468px] w-[214px] h-[125px] rounded-[var(--radius-sm,3px)] overflow-hidden bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)] pointer-events-auto flex items-center justify-center">
        {thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-[182px] h-[96px] bg-[var(--color-placeholder,#d9d9d9)] flex items-center justify-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-mono">
            THUMBNAIL
          </div>
        )}
      </div>
    </div>
  );
};

export const FocusCard = memo(FocusCardComponent);
export default FocusCard;
