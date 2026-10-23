/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import { ChevronRight, ChevronDown, Clapperboard, Check } from "lucide-react";
import type { ProjectV2, EpisodeV2 } from "@/types/production-v2";
import { createClient } from "@/lib/supabase/client";
import { PlaceholderArt } from "@/components/app-shell";

export type Target = {
  projectId: string;
  episodeId: string | null;
};

export type DropTarget =
  | { type: "project"; projectId: string }
  | { type: "episode"; episodeId: string; projectId: string }
  | null;

export type AssetAssemblyProjectPanelProps = {
  projects: ProjectV2[];
  currentProjectId: string;
  isCollapsed: boolean;
  target: Target;
  onSetTarget: (target: Target) => void;
  onSelectProject: (projectId: string) => void;
  hoveredDropTarget?: DropTarget;
  linkCounts: {
    byProject: Record<string, number>;
    byEpisode: Record<string, number>;
  };
  selectedAssetCount: number;
  isAssigning?: boolean;
  onAssign?: () => void;
};

export const AssetAssemblyProjectPanelComponent: React.FC<
  AssetAssemblyProjectPanelProps
> = ({
  projects,
  currentProjectId,
  isCollapsed,
  target,
  onSetTarget,
  onSelectProject,
  hoveredDropTarget = null,
  linkCounts,
  selectedAssetCount,
  isAssigning = false,
  onAssign,
}) => {
  // Track open/collapsed projects in tree (auto-open current project by default)
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({
    [currentProjectId]: true,
  });

  // Keep current project open when currentProjectId changes
  const [prevCurrentProjectId, setPrevCurrentProjectId] = useState(currentProjectId);
  if (prevCurrentProjectId !== currentProjectId) {
    setPrevCurrentProjectId(currentProjectId);
    setOpenProjects((prev) => ({
      ...prev,
      [currentProjectId]: true,
    }));
  }

  // Cache episodes by projectId
  const [episodesByProject, setEpisodesByProject] = useState<
    Record<string, EpisodeV2[]>
  >({});
  const [loadingProjectIds, setLoadingProjectIds] = useState<
    Record<string, boolean>
  >({});

  // Pin system project (Unknown / Inbox) first
  const sortedProjects = useMemo(() => {
    const unknown = projects.filter((p) => p.isSystem);
    const regular = projects.filter((p) => !p.isSystem);
    return [...unknown, ...regular];
  }, [projects]);

  // Load episodes for a project on demand
  const loadEpisodesForProject = useCallback(
    async (projectId: string) => {
      if (episodesByProject[projectId] || loadingProjectIds[projectId]) return;

      setLoadingProjectIds((prev) => ({ ...prev, [projectId]: true }));
      const supabase = createClient();
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("episode_name", { ascending: true });

      if (!error && data) {
        setEpisodesByProject((prev) => ({
          ...prev,
          [projectId]: data.map((row) => ({
            id: row.id,
            projectId: row.project_id,
            episodeName: row.episode_name,
            code: row.code ?? "",
            description: row.description ?? "",
            previewImage: row.preview_image ?? "",
            startDate: row.start_date ?? null,
            endDate: row.end_date ?? null,
            sortOrder: row.sort_order ?? null,
            jobWorkflow: row.job_workflow ?? null,
            sceneWorkflow: row.scene_workflow ?? null,
            status: (row.status === "Retired" ? "Retired" : "Active") as
              | "Active"
              | "Retired",
            createdAt: row.created_at,
          })),
        }));
      } else {
        setEpisodesByProject((prev) => ({
          ...prev,
          [projectId]: [],
        }));
      }
      setLoadingProjectIds((prev) => ({ ...prev, [projectId]: false }));
    },
    [episodesByProject, loadingProjectIds]
  );

  // Automatically load episodes for currently open projects
  useEffect(() => {
    Object.entries(openProjects).forEach(([pId, isOpen]) => {
      if (isOpen && !episodesByProject[pId]) {
        loadEpisodesForProject(pId);
      }
    });
  }, [openProjects, episodesByProject, loadEpisodesForProject]);

  const toggleProjectOpen = (projectId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenProjects((prev) => {
      const willOpen = !prev[projectId];
      if (willOpen && !episodesByProject[projectId]) {
        loadEpisodesForProject(projectId);
      }
      return { ...prev, [projectId]: willOpen };
    });
  };

  const handlePickProject = (project: ProjectV2) => {
    // Open project's board if different
    if (project.id !== currentProjectId) {
      onSelectProject(project.id);
    }
    // Set target to project level
    onSetTarget({ projectId: project.id, episodeId: null });
  };

  const handlePickEpisode = (projectId: string, episodeId: string) => {
    // Set target to episode level (board does not change)
    onSetTarget({ projectId, episodeId });
  };

  // Compute target display name
  const targetProject = useMemo(() => {
    return projects.find((p) => p.id === target.projectId);
  }, [projects, target.projectId]);

  const targetEpisode = useMemo(() => {
    if (!target.episodeId) return null;
    const eps = episodesByProject[target.projectId] || [];
    return eps.find((e) => e.id === target.episodeId) || null;
  }, [target, episodesByProject]);

  const targetLabel = useMemo(() => {
    if (!targetProject) return "None";
    const projName = targetProject.isSystem ? "Inbox" : targetProject.title;
    if (targetEpisode) {
      return `${projName} / ${targetEpisode.episodeName}`;
    }
    return targetProject.isSystem ? "Inbox" : `${projName} (project-level)`;
  }, [targetProject, targetEpisode]);

  // Hint text
  const isAlreadyOnCurrentProject =
    target.projectId === currentProjectId && !target.episodeId;

  const hintText = useMemo(() => {
    if (selectedAssetCount === 0) {
      return "Select assets to assign";
    }
    if (isAlreadyOnCurrentProject) {
      return "Already on this project";
    }
    return `${selectedAssetCount} asset${
      selectedAssetCount > 1 ? "s" : ""
    } selected`;
  }, [selectedAssetCount, isAlreadyOnCurrentProject]);

  // Assign button disabled status
  const isAssignDisabled =
    selectedAssetCount === 0 || isAlreadyOnCurrentProject || isAssigning;

  if (isCollapsed) return null;

  return (
    <aside className="h-full w-full bg-[var(--po-card)] shrink-0 overflow-hidden flex flex-col font-sans select-none">
      {/* Header */}
      <div className="px-4 pt-4 pb-1 text-[14px] font-semibold text-[var(--po-ink)]">
        Projects &amp; episodes
      </div>
      <div className="px-4 pb-2.5 text-[12px] text-[var(--po-ink-3)]">
        Pick a target, then select assets on the board.
      </div>

      {/* Tree scrollable list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-0.5">
        {sortedProjects.map((project) => {
          const isOpen = Boolean(openProjects[project.id]);
          const isProjectTarget =
            target.projectId === project.id && !target.episodeId;
          const isCurrentBoard = project.id === currentProjectId;
          const isProjectHovered =
            hoveredDropTarget?.type === "project" &&
            hoveredDropTarget.projectId === project.id;
          const projectCount = linkCounts.byProject[project.id] || 0;
          const episodes = episodesByProject[project.id] || [];
          const isLoadingEps = loadingProjectIds[project.id];

          return (
            <div key={project.id} className="flex flex-col gap-0.5">
              {/* Project Row */}
              <div
                data-drop-target-project-id={project.id}
                className={`group flex items-center gap-1.5 p-1.5 rounded-[12px] transition-colors cursor-pointer ${
                  isProjectHovered
                    ? "ring-2 ring-[var(--po-accent)] bg-[var(--po-chip)]"
                    : isProjectTarget
                    ? "bg-[var(--po-chip)]"
                    : "hover:bg-[var(--po-chip)]"
                }`}
                onClick={() => handlePickProject(project)}
              >
                {/* Chevron Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => toggleProjectOpen(project.id, e)}
                  aria-label={isOpen ? "Collapse project" : "Expand project"}
                  className="w-[22px] h-[22px] flex items-center justify-center rounded-[6px] text-[var(--po-ink-3)] hover:text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors cursor-pointer shrink-0"
                >
                  {isOpen ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>

                {/* Project Thumbnail */}
                <div className="w-[30px] h-[30px] rounded-[8px] overflow-hidden bg-[var(--po-sunken)] shrink-0 flex items-center justify-center border border-[var(--po-line)]">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PlaceholderArt
                      seed={project.id}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Project Title */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span
                    className={`truncate text-[13px] ${
                      isCurrentBoard
                        ? "font-semibold text-[var(--po-ink)]"
                        : "font-medium text-[var(--po-ink)]"
                    }`}
                  >
                    {project.isSystem ? "Inbox" : project.title}
                  </span>
                  {project.isSystem && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[var(--po-chip)] text-[var(--po-ink-3)] shrink-0">
                      SYS
                    </span>
                  )}
                </div>

                {/* Count Badge */}
                <span className="text-[11px] font-semibold text-[var(--po-ink-2)] bg-[var(--po-chip)] px-[7px] py-[2px] rounded-full shrink-0">
                  {projectCount}
                </span>
              </div>

              {/* Inline Episodes list when expanded */}
              {isOpen && (
                <div className="flex flex-col gap-0.5 my-0.5">
                  {isLoadingEps && (
                    <div className="ml-7 py-1 px-2 text-[12px] text-[var(--po-ink-3)] italic">
                      Loading episodes…
                    </div>
                  )}

                  {!isLoadingEps && episodes.length === 0 && (
                    <div className="ml-7 py-1 px-2 text-[12px] text-[var(--po-ink-3)] italic">
                      No episodes
                    </div>
                  )}

                  {!isLoadingEps &&
                    episodes.map((ep) => {
                      const isEpisodeTarget =
                        target.projectId === project.id &&
                        target.episodeId === ep.id;
                      const isEpisodeHovered =
                        hoveredDropTarget?.type === "episode" &&
                        hoveredDropTarget.episodeId === ep.id;
                      const epCount = linkCounts.byEpisode[ep.id] || 0;

                      return (
                        <button
                          key={ep.id}
                          type="button"
                          data-drop-target-episode-id={ep.id}
                          data-drop-target-project-id={project.id}
                          onClick={() => handlePickEpisode(project.id, ep.id)}
                          className={`flex items-center gap-2.5 ml-[28px] w-[calc(100%-28px)] box-border py-[7px] px-2.5 rounded-[10px] text-left text-[13px] font-medium transition-colors cursor-pointer ${
                            isEpisodeHovered
                              ? "ring-2 ring-[var(--po-accent)]"
                              : ""
                          } ${
                            isEpisodeTarget
                              ? "bg-[var(--po-ink)] text-[var(--po-panel)]"
                              : "text-[var(--po-ink)] hover:bg-[var(--po-chip)]"
                          }`}
                        >
                          <Clapperboard
                            size={13}
                            className={`shrink-0 ${
                              isEpisodeTarget ? "opacity-80" : "opacity-60 text-[var(--po-ink-3)]"
                            }`}
                          />
                          <span className="truncate flex-1">{ep.episodeName}</span>
                          <span
                            className={`text-[11px] shrink-0 font-medium ${
                              isEpisodeTarget
                                ? "opacity-80"
                                : "text-[var(--po-ink-3)]"
                            }`}
                          >
                            {epCount}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Target Footer */}
      <div className="border-t border-[var(--po-line)] p-4 flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[11px] font-medium text-[var(--po-ink-3)] uppercase tracking-wider">
            Target
          </span>
          <span className="text-[13px] font-semibold text-[var(--po-ink)] truncate">
            {targetLabel}
          </span>
        </div>

        <span className="text-[12px] text-[var(--po-ink-2)] truncate">
          {hintText}
        </span>

        <button
          type="button"
          onClick={onAssign}
          disabled={isAssignDisabled}
          className={`h-[34px] px-3.5 rounded-full text-[13px] font-medium inline-flex items-center justify-center gap-2 w-full transition-all cursor-pointer ${
            isAssignDisabled
              ? "bg-[var(--po-ink)] text-[var(--po-panel)] opacity-40 cursor-not-allowed"
              : "bg-[var(--po-ink)] text-[var(--po-panel)] hover:opacity-90 active:scale-[0.98]"
          }`}
        >
          {isAssigning ? (
            <span className="inline-block animate-spin text-[12px]">●</span>
          ) : (
            <Check size={14} />
          )}
          <span>Assign</span>
        </button>
      </div>
    </aside>
  );
};

export const AssetAssemblyProjectPanel = memo(AssetAssemblyProjectPanelComponent);
export default AssetAssemblyProjectPanel;
