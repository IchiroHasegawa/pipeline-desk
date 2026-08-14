/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo } from "react";
import type { EpisodeV2, AssetV2 } from "@/types/production-v2";

export type EpisodeThumbGridProps = {
  episodes?: EpisodeV2[];
  assets?: AssetV2[];
  activeTab: "eps" | "asts";
  onSelectEpisode: (episodeId: string) => void;
};

/**
 * DESIGN_SPEC §11 — episode grid at (96, 258), 1732 wide, five per row.
 * Cell 296 × 234 with the thumbnail at offset (0, 41) 296 × 193 and the name at
 * thumb y + 193 (268 × 41). Column pitch 359, row pitch 280.
 * The grid origin is set by the page, so offsets here are relative to it.
 */
const COLUMN_PITCH = 359;
const ROW_PITCH = 280;
const PER_ROW = 5;
const THUMB_TOP = 41;
const THUMB_W = 296;
const THUMB_H = 193;

type Cell = {
  key: string;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  onOpen?: () => void;
};

const GridBody: React.FC<{ cells: Cell[]; interactive: boolean }> = ({
  cells,
  interactive,
}) => (
  <div
    className="relative w-[1732px] font-sans select-none"
    style={{ height: `${Math.ceil(cells.length / PER_ROW) * ROW_PITCH}px` }}
  >
    {cells.map((cell, idx) => {
      const col = idx % PER_ROW;
      const row = Math.floor(idx / PER_ROW);

      return (
        <div
          key={cell.key}
          onDoubleClick={cell.onOpen}
          style={{ left: `${col * COLUMN_PITCH}px`, top: `${row * ROW_PITCH}px` }}
          className={`absolute w-[296px] h-[234px] group ${
            interactive ? "cursor-pointer" : ""
          }`}
        >
          {/* Thumbnail (0, 41) 296 × 193 */}
          <div
            style={{ top: `${THUMB_TOP}px`, width: `${THUMB_W}px`, height: `${THUMB_H}px` }}
            className="absolute left-0 bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line,#000000)] overflow-hidden flex items-center justify-center transition-colors group-hover:border-black"
          >
            {cell.imageUrl ? (
              <img
                src={cell.imageUrl}
                alt={cell.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]">
                {cell.subtitle}
              </span>
            )}
          </div>

          {/* Name — thumb y + 193, 268 × 41 */}
          <div
            style={{ top: `${THUMB_TOP + THUMB_H}px` }}
            className="absolute left-0 w-[268px] h-[41px] flex flex-col justify-center gap-[2px]"
          >
            <span className="block text-[var(--text-list,12px)] leading-none font-bold text-[var(--color-ink,#000000)] truncate">
              {cell.title}
            </span>
            <span className="block text-[10px] leading-none text-[var(--color-ink-muted,#707070)] truncate">
              {cell.subtitle}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

export const EpisodeThumbGridComponent: React.FC<EpisodeThumbGridProps> = ({
  episodes = [],
  assets = [],
  activeTab,
  onSelectEpisode,
}) => {
  if (activeTab === "asts") {
    if (assets.length === 0) {
      return (
        <div className="w-[1732px] p-8 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] font-sans">
          No assets allocated to this project.
        </div>
      );
    }

    return (
      <GridBody
        interactive={false}
        cells={assets.map((asset) => ({
          key: asset.id,
          title: asset.name,
          subtitle: `${asset.category || "General"} · ${asset.assetCode}`,
          imageUrl: asset.previewUrl,
        }))}
      />
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="w-[1732px] p-8 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] font-sans">
        No episodes in this project.
      </div>
    );
  }

  return (
    <GridBody
      interactive
      cells={episodes.map((ep) => ({
        key: ep.id,
        title: ep.code || ep.episodeName,
        subtitle: ep.episodeName,
        imageUrl: ep.previewImage,
        onOpen: () => onSelectEpisode(ep.id),
      }))}
    />
  );
};

export const EpisodeThumbGrid = memo(EpisodeThumbGridComponent);
export default EpisodeThumbGrid;
