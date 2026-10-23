"use client";

import React, { useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Pencil, X } from "lucide-react";
import type { ProjectV2, ProjectBoardStats } from "@/types/production-v2";
import { EMPTY_PROJECT_BOARD_STATS } from "@/types/production-v2";
import {
  durationDays,
  formatDuration,
  formatBytes,
  formatDateRange,
} from "@/lib/format/production";
import { projectEpisodesHref } from "@/lib/routes/app";
import { CommitHeatmap } from "./CommitHeatmap";
import { PlaceholderArt } from "@/components/app-shell";

export interface ProjectDetailsPanelProps {
  project: ProjectV2;
  stats?: ProjectBoardStats;
  onClose: () => void;
}

export const ProjectDetailsPanel: React.FC<ProjectDetailsPanelProps> = ({
  project,
  stats = EMPTY_PROJECT_BOARD_STATS,
  onClose,
}) => {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Use mousedown with capture to intercept before other click handlers
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [onClose]);


  const days = durationDays(project.startDate, project.endDate);
  const durLabel = formatDuration(days, Boolean(project.startDate));
  const dateRangeStr = formatDateRange(project.startDate, project.endDate);
  const isActive = project.status === "Active";

  const epStatus = stats?.episodeStatus ?? EMPTY_PROJECT_BOARD_STATS.episodeStatus;
  const epBoxes = [
    { label: "Not started", n: epStatus.notStarted },
    { label: "In progress", n: epStatus.inProgress },
    { label: "Complete", n: epStatus.complete },
    { label: "Total", n: epStatus.total },
  ];

  const totalCommits = useMemo(() => {
    return (stats.commitDays || []).reduce((acc, cur) => acc + cur.count, 0);
  }, [stats.commitDays]);

  return (
    <div
      ref={panelRef}
      className="absolute top-[124px] right-[12px] bottom-[12px] z-20 flex w-[440px] flex-col overflow-hidden rounded-[22px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-lg)]"
      style={{
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center gap-[10px] border-b border-[var(--po-line)] pt-[14px] pr-[14px] pb-[14px] pl-[20px]">
        <span className="text-[13px] font-medium text-[var(--po-ink-3)]">
          Project details
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full border-none bg-[var(--po-chip)] text-[15px] text-[var(--po-ink-2)] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
        >
          <X size={15} />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex flex-1 flex-col gap-[22px] overflow-auto p-5 text-[14px]">
        {/* Hero image or initials fallback */}
        <div className="relative aspect-video overflow-hidden rounded-[14px]">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <PlaceholderArt seed={project.id} className="h-full w-full object-cover" />
          )}
        </div>

        {/* Title, metadata and description */}
        <div className="flex flex-col gap-[10px]">
          <span className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--po-ink)]">
            {project.title}
          </span>
          <div className="flex flex-wrap items-center gap-[10px] text-[13px] text-[var(--po-ink-2)]">
            <span className="rounded-[6px] bg-[var(--po-chip)] px-2 py-1 text-[11px] font-semibold tracking-[0.06em] text-[var(--po-ink)]">
              {project.projectCode}
            </span>
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
            <span>{dateRangeStr}</span>
            {project.startDate && (
              <span className="text-[var(--po-ink-3)]">{durLabel}</span>
            )}
          </div>
          <p className="m-0 leading-[1.55] text-[var(--po-ink-2)] [text-wrap:pretty]">
            {project.description || "No project description provided."}
          </p>

          {/* Action buttons: Open project & Edit */}
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(projectEpisodesHref(project.id))}
              className="inline-flex h-[36px] cursor-pointer items-center gap-2 rounded-full border-none bg-[var(--po-ink)] px-4 text-[13px] font-medium text-[var(--po-panel)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
            >
              <span>Open project</span>
              <ArrowRight size={14} />
            </button>
            <Link
              href="/settings/projects"
              className="inline-flex h-[36px] cursor-pointer items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-transparent px-4 text-[13px] font-medium text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
            >
              <Pencil size={14} />
              <span>Edit</span>
            </Link>
          </div>
        </div>

        {/* Episodes stat boxes */}
        <div className="flex flex-col gap-[10px]">
          <span className="text-[12px] font-medium text-[var(--po-ink-3)]">
            Episodes
          </span>
          <div className="grid grid-cols-4 gap-2">
            {epBoxes.map((box) => (
              <div
                key={box.label}
                className="flex flex-col gap-1 rounded-[12px] bg-[var(--po-sunken)] p-3"
              >
                <span className="text-[20px] font-semibold text-[var(--po-ink)]">
                  {box.n}
                </span>
                <span className="text-[11px] text-[var(--po-ink-3)]">
                  {box.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Commits Heatmap */}
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-medium text-[var(--po-ink-3)]">
              Commits · last 365 days
            </span>
            <span className="font-semibold text-[var(--po-ink)]">
              {totalCommits.toLocaleString("en-US")}
            </span>
          </div>
          <CommitHeatmap
            commitDays={stats.commitDays}
            cellSize={5}
            gap={2}
            borderRadius={1.5}
          />
        </div>

        {/* Storage stats */}
        <div className="flex flex-col gap-[10px]">
          <span className="text-[12px] font-medium text-[var(--po-ink-3)]">
            Storage
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1 rounded-[12px] bg-[var(--po-sunken)] p-3">
              <span className="text-[18px] font-semibold text-[var(--po-ink)]">
                {stats.assets.assetCount}
              </span>
              <span className="text-[11px] text-[var(--po-ink-3)]">Assets</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[12px] bg-[var(--po-sunken)] p-3">
              <span className="text-[18px] font-semibold text-[var(--po-ink)]">
                {stats.assets.fileCount}
              </span>
              <span className="text-[11px] text-[var(--po-ink-3)]">Files</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[12px] bg-[var(--po-sunken)] p-3">
              <span className="text-[18px] font-semibold text-[var(--po-ink)]">
                {formatBytes(stats.assets.totalBytes)}
              </span>
              <span className="text-[11px] text-[var(--po-ink-3)]">
                Total size
              </span>
            </div>
          </div>
        </div>

        {/* Reviews Coming Soon */}
        <div className="flex flex-col gap-[10px]">
          <span className="text-[12px] font-medium text-[var(--po-ink-3)]">
            Reviews
          </span>
          <div className="rounded-[12px] border-[1.5px] border-dashed border-[var(--po-line-2)] p-[18px] text-center text-[13px] text-[var(--po-ink-3)]">
            Coming soon
          </div>
        </div>
      </div>
    </div>
  );
};
