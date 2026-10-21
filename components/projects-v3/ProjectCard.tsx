"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, Calendar, MessageSquare } from "lucide-react";
import type {
  ProjectV2,
  ProjectBoardStats,
  EpisodeV2,
  ProcessProgress,
} from "@/types/production-v2";
import { EMPTY_PROJECT_BOARD_STATS } from "@/types/production-v2";
import {
  durationDays,
  formatDuration,
  formatBytes,
  formatDateRange,
} from "@/lib/format/production";
import { projectEpisodesHref } from "@/lib/routes/app";
import { EpisodeTileRow } from "./EpisodeTileRow";
import { CommitHeatmap } from "./CommitHeatmap";

export interface ProjectCardProps {
  project: ProjectV2;
  stats?: ProjectBoardStats;
  episodes: EpisodeV2[];
  processProgress: Record<string, ProcessProgress[]>;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  stats = EMPTY_PROJECT_BOARD_STATS,
  episodes,
  processProgress,
  isSelected,
  onSelect,
}) => {
  const router = useRouter();

  // Project initials fallback
  const initials = useMemo(() => {
    const words = project.title.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "PR";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }, [project.title]);

  // Duration and dates
  const days = durationDays(project.startDate, project.endDate);
  const durLabel = formatDuration(days, Boolean(project.startDate));
  const dateRangeStr = formatDateRange(project.startDate, project.endDate);

  // Status styling
  const isActive = project.status === "Active";

  // Episode counts and segment widths
  const epStatus = stats?.episodeStatus ?? EMPTY_PROJECT_BOARD_STATS.episodeStatus;
  const epTotal = epStatus.total;
  const safeTotal = epTotal > 0 ? epTotal : 1;
  const barNS = epTotal > 0 ? `${(epStatus.notStarted / safeTotal) * 100}%` : "0%";
  const barIP = epTotal > 0 ? `${(epStatus.inProgress / safeTotal) * 100}%` : "0%";
  const barC = epTotal > 0 ? `${(epStatus.complete / safeTotal) * 100}%` : "0%";
  const barLabel = `${epStatus.notStarted} not started · ${epStatus.inProgress} in progress · ${epStatus.complete} complete`;

  // Commits sum
  const totalCommits = useMemo(() => {
    return (stats.commitDays || []).reduce((acc, cur) => acc + cur.count, 0);
  }, [stats.commitDays]);

  const handleOpen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    router.push(projectEpisodesHref(project.id));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(project.id)}
      onDoubleClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSelect(project.id);
        }
      }}
      className={`group grid grid-cols-[minmax(0,34%)_minmax(0,1fr)] gap-7 rounded-[24px] border border-[var(--po-line)] bg-[var(--po-card)] p-[14px] shadow-[var(--po-shadow-sm)] outline-offset-[-1px] transition-[transform,box-shadow] duration-180 hover:-translate-y-[3px] hover:shadow-[var(--po-shadow-lift)] focus-visible:outline-none ${
        isSelected
          ? "outline-2 outline-[var(--po-accent)]"
          : "outline-2 outline-transparent"
      }`}
    >
      {/* Hero Left Column */}
      <div
        className="relative aspect-video overflow-hidden rounded-[16px]"
        style={{
          background: project.thumbnailUrl
            ? undefined
            : "linear-gradient(145deg, var(--po-ph1), var(--po-ph2))",
        }}
      >
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[72px] font-semibold tracking-[-0.04em] text-[var(--po-ink-3)] opacity-80 select-none">
            {initials}
          </div>
        )}
      </div>

      {/* Right Column Content */}
      <div className="flex min-w-0 flex-col gap-[11px] pt-[6px] pr-[6px] pb-[2px] pl-0">
        {/* Title and Open Button */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="m-0 truncate text-[22px] font-semibold tracking-[-0.02em] text-[var(--po-ink)]">
            {project.title}
          </h2>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex h-[32px] flex-none cursor-pointer items-center gap-[6px] rounded-full border border-[var(--po-line-2)] bg-transparent pr-3 pl-[14px] text-[13px] font-medium text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
          >
            <span>Open</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Metadata Line */}
        <div className="flex flex-wrap items-center gap-x-[14px] gap-y-2 text-[13px] text-[var(--po-ink-2)]">
          {/* Project Code */}
          <span className="rounded-[6px] bg-[var(--po-chip)] px-2 py-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--po-ink)]">
            {project.projectCode}
          </span>

          {/* Status Pill */}
          <span
            className="inline-flex items-center gap-[6px] rounded-full px-[10px] py-[3px] pr-[10px] pl-[8px] text-[12px] font-medium"
            style={{
              backgroundColor: isActive
                ? "color-mix(in oklch, var(--po-accent) 14%, transparent)"
                : "var(--po-chip)",
              color: isActive ? "var(--po-accent)" : "var(--po-ink-2)",
            }}
          >
            <span className="h-[6px] w-[6px] rounded-full bg-current" />
            <span>{project.status}</span>
          </span>

          {/* Date Range & Duration */}
          <span className="inline-flex items-center gap-[6px]">
            <Calendar size={14} className="text-[var(--po-ink-3)]" />
            <span>{dateRangeStr}</span>
            {project.startDate && (
              <span className="text-[var(--po-ink-3)]">· {durLabel}</span>
            )}
          </span>

          {/* Episode Count */}
          <span className="font-medium text-[var(--po-ink)]">
            {epTotal} {epTotal === 1 ? "episode" : "episodes"}
          </span>

          {/* Three-segment Episode Status Bar */}
          <div className="flex items-center gap-2">
            <div className="flex h-[6px] w-[96px] gap-[2px] overflow-hidden rounded-[3px] bg-[var(--po-chip)]">
              <div
                style={{ width: barNS }}
                className="bg-[var(--po-ink-3)] opacity-40 transition-[width] duration-300"
              />
              <div
                style={{ width: barIP }}
                className="bg-[var(--po-accent)] opacity-50 transition-[width] duration-300"
              />
              <div
                style={{ width: barC }}
                className="bg-[var(--po-accent)] transition-[width] duration-300"
              />
            </div>
            <span className="text-[12px] text-[var(--po-ink-3)]">{barLabel}</span>
          </div>
        </div>

        {/* Description: 2-line clamp */}
        <p className="m-0 line-clamp-2 max-h-[44px] text-[14px] leading-[22px] text-[var(--po-ink-2)] [text-wrap:pretty]">
          {project.description || "No project description provided."}
        </p>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-x-7 gap-y-[10px] text-[12px] text-[var(--po-ink-2)]">
          {/* Commits Mini-Heatmap */}
          <div className="flex items-center gap-[10px]">
            <CommitHeatmap commitDays={stats.commitDays} />
            <span>
              <b className="font-semibold text-[var(--po-ink)]">
                {totalCommits.toLocaleString("en-US")}
              </b>{" "}
              commits · last 365 days
            </span>
          </div>

          {/* Assets Summary */}
          <div className="flex items-center gap-[6px]">
            <Boxes size={14} className="text-[var(--po-ink-3)]" />
            <span>
              <b className="font-semibold text-[var(--po-ink)]">
                {stats.assets.assetCount}
              </b>{" "}
              assets
              <span className="px-1 text-[var(--po-ink-3)]">·</span>
              <b className="font-semibold text-[var(--po-ink)]">
                {stats.assets.fileCount}
              </b>{" "}
              files
              <span className="px-1 text-[var(--po-ink-3)]">·</span>
              <b className="font-semibold text-[var(--po-ink)]">
                {formatBytes(stats.assets.totalBytes)}
              </b>
            </span>
          </div>

          {/* Reviews */}
          <div className="flex items-center gap-[6px]">
            <MessageSquare size={14} className="text-[var(--po-ink-3)]" />
            <span>Reviews</span>
            <span className="rounded-full border border-dashed border-[var(--po-line-2)] px-[7px] py-[2px] text-[11px] text-[var(--po-ink-3)]">
              Coming soon
            </span>
          </div>
        </div>

        {/* Episode Tile Row */}
        <EpisodeTileRow
          projectId={project.id}
          episodes={episodes}
          processProgress={processProgress}
        />
      </div>
    </div>
  );
};
