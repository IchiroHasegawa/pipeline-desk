"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clapperboard } from "lucide-react";
import type { EpisodeV2, ProcessProgress } from "@/types/production-v2";
import { episodeScenesHref, projectEpisodesHref } from "@/lib/routes/app";

export interface EpisodeTileRowProps {
  projectId: string;
  episodes: EpisodeV2[];
  processProgress: Record<string, ProcessProgress[]>;
}

export const EpisodeTileRow: React.FC<EpisodeTileRowProps> = ({
  projectId,
  episodes,
  processProgress,
}) => {
  const router = useRouter();

  if (episodes.length === 0) {
    return (
      <div className="mt-auto grid grid-cols-5 gap-[10px]">
        <div className="col-span-5 flex aspect-[9.2/1] items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-[var(--po-line-2)] text-[13px] text-[var(--po-ink-3)]">
          <Clapperboard size={16} />
          <span>No episodes yet</span>
        </div>
      </div>
    );
  }

  const hasMore = episodes.length > 5;
  const displayEpisodes = hasMore ? episodes.slice(0, 4) : episodes.slice(0, 5);
  const moreCount = episodes.length - 4;

  const handleEpisodeClick = (
    e: React.MouseEvent,
    episodeId: string
  ) => {
    e.stopPropagation();
    router.push(episodeScenesHref(projectId, episodeId));
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(projectEpisodesHref(projectId));
  };

  return (
    <div className="mt-auto grid grid-cols-5 gap-[10px]">
      {displayEpisodes.map((ep) => {
        const rawProcs = processProgress[ep.id] ?? [];
        const sortedProcs = [...rawProcs].sort((a, b) => a.position - b.position);

        return (
          <div
            key={ep.id}
            role="button"
            tabIndex={0}
            onClick={(e) => handleEpisodeClick(e, ep.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleEpisodeClick(e as unknown as React.MouseEvent, ep.id);
              }
            }}
            className="group relative aspect-video cursor-pointer overflow-hidden rounded-[12px] border border-[var(--po-line)] bg-[var(--po-sunken)] transition-transform duration-150 hover:scale-[1.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
            style={{
              background: ep.previewImage
                ? undefined
                : "linear-gradient(145deg, var(--po-ph1), var(--po-ph2))",
            }}
          >
            {ep.previewImage ? (
              <img
                src={ep.previewImage}
                alt={ep.episodeName}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[18px] font-semibold tracking-[-0.02em] text-[var(--po-ink-3)] opacity-70">
                {ep.code || ep.episodeName.slice(0, 4)}
              </div>
            )}

            {/* Dark gradient overlay at bottom for readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-35% to-black/60" />

            {/* Episode name and process progress bars */}
            <div className="pointer-events-none absolute inset-x-[10px] bottom-[9px] flex flex-col gap-[6px]">
              <span className="truncate text-[12px] font-semibold tracking-[0.02em] text-white">
                {ep.episodeName}
              </span>
              <div className="flex h-[3px] gap-[2px]">
                {sortedProcs.length > 0 ? (
                  sortedProcs.map((proc) => {
                    const pct = Math.max(0, Math.min(100, Math.round(proc.percent)));
                    const color = proc.colour ?? "var(--po-accent)";
                    return (
                      <div
                        key={proc.processId}
                        className="flex-1 overflow-hidden rounded-[2px] bg-white/30"
                        title={`${proc.processName}: ${pct}%`}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 rounded-[2px] bg-white/20" />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleMoreClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleMoreClick(e as unknown as React.MouseEvent);
            }
          }}
          className="flex aspect-video cursor-pointer items-center justify-center gap-[6px] rounded-[12px] border border-[var(--po-line)] bg-[var(--po-sunken)] text-[13px] font-medium text-[var(--po-ink-2)] transition-transform duration-150 hover:scale-[1.025] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
        >
          <span>+{moreCount} more</span>
          <ArrowRight size={13} />
        </div>
      )}
    </div>
  );
};
