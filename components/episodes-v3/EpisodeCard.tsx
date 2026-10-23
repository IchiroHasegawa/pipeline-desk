"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Calendar, GitBranch, ListChecks } from "lucide-react";
import type { EpisodeV2, ProcessProgress, SceneV2 } from "@/types/production-v2";
import {
  durationDays,
  formatDuration,
  formatDateRange,
  deriveEpisodeStatus,
} from "@/lib/format/production";
import { episodeScenesHref, episodeManageHref } from "@/lib/routes/app";
import { SceneTileRow } from "./SceneTileRow";
import { PlaceholderArt } from "@/components/app-shell";

export interface EpisodeCardProps {
  episode: EpisodeV2;
  projectId: string;
  processProgress: ProcessProgress[];
  scenes: SceneV2[];
  sceneRollup: Record<string, { total: number; complete: number }>;
  episodeRollup?: { total: number; complete: number };
  workflowName?: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  projectId,
  processProgress,
  scenes,
  sceneRollup,
  episodeRollup,
  workflowName,
  isSelected,
  onSelect,
}) => {
  const router = useRouter();


  // Duration and dates
  const days = durationDays(episode.startDate, episode.endDate);
  const durLabel = formatDuration(days, Boolean(episode.startDate));
  const dateRangeStr = formatDateRange(episode.startDate, episode.endDate);

  // Status calculation matching migration 037 rule
  const statusState = deriveEpisodeStatus(episodeRollup);
  const statusConfig = {
    not_started: {
      label: "Not started",
      bg: "var(--po-chip)",
      fg: "var(--po-ink-2)",
    },
    in_progress: {
      label: "In progress",
      bg: "color-mix(in oklch, var(--po-accent) 14%, transparent)",
      fg: "var(--po-accent)",
    },
    complete: {
      label: "Completed",
      bg: "color-mix(in oklch, var(--po-ok) 14%, transparent)",
      fg: "var(--po-ok)",
    },
  }[statusState];

  // Process rings sorted by position
  const sortedProcesses = useMemo(() => {
    return [...processProgress].sort((a, b) => a.position - b.position);
  }, [processProgress]);

  // Circumference for r=16 SVG circle
  const circumference = 2 * Math.PI * 16; // ~100.53

  const handleOpenScenes = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(episodeScenesHref(projectId, episode.id));
  };

  const handleManage = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(episodeManageHref(projectId, episode.id));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(episode.id)}
      onDoubleClick={handleOpenScenes}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSelect(episode.id);
        }
      }}
      className={`group grid grid-cols-[minmax(0,30%)_minmax(0,1fr)] gap-7 rounded-[24px] border border-[var(--po-line)] bg-[var(--po-card)] p-[14px] shadow-[var(--po-shadow-sm)] outline-offset-[-1px] transition-[transform,box-shadow] duration-180 hover:-translate-y-[3px] hover:shadow-[var(--po-shadow-lift)] focus-visible:outline-none ${
        isSelected
          ? "outline-2 outline-[var(--po-accent)]"
          : "outline-2 outline-transparent"
      }`}
    >
      {/* Hero Left Column */}
      <div className="relative aspect-video overflow-hidden rounded-[16px]">
        {episode.previewImage ? (
          <img
            src={episode.previewImage}
            alt={episode.episodeName}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderArt seed={episode.id} className="h-full w-full object-cover" />
        )}
      </div>

      {/* Right Column Content */}
      <div className="flex min-w-0 flex-col gap-[11px] pt-[6px] pr-[6px] pb-[2px] pl-0">
        {/* Title and Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="m-0 truncate text-[22px] font-semibold tracking-[-0.02em] text-[var(--po-ink)]">
              {episode.episodeName}
            </h2>
            {episode.code && (
              <span className="flex-none rounded-[6px] bg-[var(--po-chip)] px-2 py-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--po-ink)]">
                {episode.code}
              </span>
            )}
            <span
              className="inline-flex flex-none items-center gap-[6px] rounded-full px-[10px] py-[3px] pr-[10px] pl-[8px] text-[12px] font-medium"
              style={{
                backgroundColor: statusConfig.bg,
                color: statusConfig.fg,
              }}
            >
              <span className="h-[6px] w-[6px] rounded-full bg-current" />
              <span>{statusConfig.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-none">
            <button
              type="button"
              onClick={handleManage}
              className="inline-flex h-[32px] cursor-pointer items-center gap-[6px] rounded-full border border-[var(--po-line-2)] bg-transparent px-[14px] text-[13px] font-medium text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
            >
              <ListChecks size={14} />
              <span>Manage</span>
            </button>
            <button
              type="button"
              onClick={handleOpenScenes}
              className="inline-flex h-[32px] cursor-pointer items-center gap-[6px] rounded-full border border-[var(--po-line-2)] bg-transparent pr-3 pl-[14px] text-[13px] font-medium text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
            >
              <span>Scenes</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Metadata Line */}
        <div className="flex flex-wrap items-center gap-x-[14px] gap-y-2 text-[13px] text-[var(--po-ink-2)]">
          {/* Date Range & Duration */}
          <span className="inline-flex items-center gap-[6px]">
            <Calendar size={14} className="text-[var(--po-ink-3)]" />
            <span>{dateRangeStr}</span>
            {episode.startDate && (
              <span className="text-[var(--po-ink-3)]">· {durLabel}</span>
            )}
          </span>

          {/* Workflow Name */}
          {workflowName && (
            <span className="inline-flex items-center gap-[6px]">
              <GitBranch size={14} className="text-[var(--po-ink-3)]" />
              <span>{workflowName}</span>
            </span>
          )}

          {/* Scene Count */}
          <span className="font-medium text-[var(--po-ink)]">
            {scenes.length} {scenes.length === 1 ? "scene" : "scenes"}
          </span>
        </div>

        {/* Description: 2-line clamp */}
        <p className="m-0 line-clamp-2 max-h-[44px] text-[14px] leading-[22px] text-[var(--po-ink-2)] [text-wrap:pretty]">
          {episode.description || "No episode description provided."}
        </p>

        {/* Process Row: Circular SVG Rings */}
        {sortedProcesses.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-[26px] gap-y-[10px]">
            {sortedProcesses.map((proc) => {
              const pct = Math.max(0, Math.min(100, Math.round(proc.percent)));
              const strokeDashoffset = circumference - (pct / 100) * circumference;
              const ringColor = proc.colour ?? "var(--po-accent)";

              return (
                <div key={proc.processId} className="flex items-center gap-[10px]">
                  <div className="relative h-[40px] w-[40px] flex-none">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      className="block -rotate-90"
                    >
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        strokeWidth="4"
                        className="stroke-[var(--po-chip)]"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        strokeWidth="4"
                        stroke={ringColor}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-[stroke-dashoffset] duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[var(--po-ink)]">
                      {pct}%
                    </span>
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[12px] font-medium text-[var(--po-ink)]">
                      {proc.processName}
                    </span>
                    <span className="text-[11px] text-[var(--po-ink-3)]">
                      {proc.completeScenes} of {proc.totalScenes} scenes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scene Tile Row */}
        <SceneTileRow
          projectId={projectId}
          episodeId={episode.id}
          scenes={scenes}
          sceneRollup={sceneRollup}
        />
      </div>
    </div>
  );
};
