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

export const EpisodeThumbGridComponent: React.FC<EpisodeThumbGridProps> = ({
  episodes = [],
  assets = [],
  activeTab,
  onSelectEpisode,
}) => {
  if (activeTab === "asts") {
    return (
      <div className="grid grid-cols-5 gap-6 w-[1732px] pt-4 font-sans select-none">
        {assets.length === 0 ? (
          <div className="col-span-5 p-8 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] font-mono">
            No assets allocated to this project.
          </div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] overflow-hidden shadow-xs"
            >
              <div className="w-full h-[140px] bg-[var(--color-placeholder,#d9d9d9)] flex items-center justify-center border-b border-[var(--color-line-soft,#a9a9a9)]">
                {asset.previewUrl ? (
                  <img
                    src={asset.previewUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-mono text-[var(--color-ink-muted,#707070)]">
                    [ASSET PREVIEW]
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-0.5">
                <span className="text-[var(--text-list,12px)] font-bold text-[var(--color-ink,#000000)] truncate">
                  {asset.name}
                </span>
                <span className="text-[10px] font-mono text-[var(--color-ink-muted,#707070)]">
                  {asset.category || "General"} · {asset.assetCode}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-6 w-[1732px] pt-4 font-sans select-none">
      {episodes.map((ep) => (
        <div
          key={ep.id}
          onDoubleClick={() => onSelectEpisode(ep.id)}
          className="flex flex-col border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] overflow-hidden shadow-xs cursor-pointer group hover:border-black transition-colors"
        >
          {/* Episode Thumbnail */}
          <div className="w-full h-[180px] bg-[var(--color-placeholder,#d9d9d9)] flex items-center justify-center border-b border-[var(--color-line-soft,#a9a9a9)] overflow-hidden">
            {ep.previewImage ? (
              <img
                src={ep.previewImage}
                alt={ep.episodeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 font-mono text-[var(--color-ink-muted,#707070)] text-[11px]">
                <span>[EPISODE THUMB]</span>
                <span className="text-[9px] opacity-70">Double-click to open</span>
              </div>
            )}
          </div>

          {/* Name Bar Strip */}
          <div className="p-3 bg-[var(--color-panel,#f0f0f0)] flex flex-col gap-0.5">
            <span className="text-[var(--text-list,12px)] font-bold text-[var(--color-ink,#000000)] truncate group-hover:underline">
              {ep.code || ep.episodeName}
            </span>
            <span className="text-[10px] font-mono text-[var(--color-ink-muted,#707070)] truncate">
              {ep.episodeName}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const EpisodeThumbGrid = memo(EpisodeThumbGridComponent);
export default EpisodeThumbGrid;
