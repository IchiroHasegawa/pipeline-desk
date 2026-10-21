/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import { ArrowLeft, Clapperboard, FolderKanban, Inbox } from "lucide-react";
import type { ProjectV2, EpisodeV2 } from "@/types/production-v2";
import { createClient } from "@/lib/supabase/client";

export type DropTarget =
  | { type: "project"; projectId: string }
  | { type: "episode"; episodeId: string; projectId: string }
  | null;

export type AssetAssemblyProjectPanelProps = {
  projects: ProjectV2[];
  currentProjectId: string;
  isCollapsed: boolean;
  onSelectProject: (projectId: string) => void;
  hoveredDropTarget?: DropTarget;
};

export const AssetAssemblyProjectPanelComponent: React.FC<
  AssetAssemblyProjectPanelProps
> = ({
  projects,
  currentProjectId,
  isCollapsed,
  onSelectProject,
  hoveredDropTarget = null,
}) => {
  const [viewMode, setViewMode] = useState<"projects" | "episodes">("projects");
  const [drilledProject, setDrilledProject] = useState<ProjectV2 | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeV2[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Pin system project (Unknown / Inbox) first
  const sortedProjects = useMemo(() => {
    const unknown = projects.filter((p) => p.isSystem);
    const regular = projects.filter((p) => !p.isSystem);
    return [...unknown, ...regular];
  }, [projects]);

  // Fetch episodes when drilling down into a project
  useEffect(() => {
    if (viewMode === "episodes" && drilledProject) {
      const supabase = createClient();
      supabase
        .from("episodes")
        .select("*")
        .eq("project_id", drilledProject.id)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("episode_name", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setEpisodes(
              data.map((row) => ({
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
              }))
            );
          } else {
            setEpisodes([]);
          }
          setIsLoadingEpisodes(false);
        });
    }
  }, [viewMode, drilledProject]);

  const handleDoubleClickProject = (project: ProjectV2) => {
    setIsLoadingEpisodes(true);
    setDrilledProject(project);
    setViewMode("episodes");
  };

  const handleBackToProjects = () => {
    setViewMode("projects");
    setDrilledProject(null);
  };

  return (
    <aside
      style={{
        width: isCollapsed ? "0px" : "320px",
      }}
      className="h-full border-r border-[var(--po-line)] bg-[var(--po-panel)] transition-[width] duration-300 ease-in-out shrink-0 overflow-hidden z-20 flex flex-col font-sans select-none"
    >
      <div className="w-[320px] h-full flex flex-col overflow-hidden">
        {/* Panel Header */}
        <div className="flex flex-col gap-1.5 px-5 pt-4 pb-3 border-b border-[var(--po-line)] shrink-0">
          {viewMode === "projects" ? (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban size={16} className="text-[var(--po-ink-2)]" />
                  <h2 className="text-[14px] font-semibold text-[var(--po-ink)]">
                    Projects
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink-3)]">
                  {sortedProjects.length}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--po-ink-3)]">
                Drag onto card to assign · Double-click for episodes
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleBackToProjects}
                className="self-start flex items-center gap-1.5 text-[12px] font-semibold text-[var(--po-ink-2)] hover:text-[var(--po-ink)] transition-colors py-0.5"
              >
                <ArrowLeft size={13} />
                <span>Back to Projects</span>
              </button>
              <div className="flex items-center justify-between min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--po-ink-3)]">
                    Project Episodes
                  </span>
                  <h2 className="text-[13px] font-semibold text-[var(--po-ink)] truncate">
                    {drilledProject?.title}
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink-3)] shrink-0">
                  {episodes.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
          {viewMode === "projects" ? (
            sortedProjects.map((proj) => {
              const isSelected = proj.id === currentProjectId;
              const isHoveredTarget =
                hoveredDropTarget?.type === "project" &&
                hoveredDropTarget.projectId === proj.id;

              return (
                <div
                  key={proj.id}
                  data-drop-target-project-id={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  onDoubleClick={() => handleDoubleClickProject(proj)}
                  className={`group relative flex flex-col gap-2 rounded-[16px] border p-2.5 cursor-pointer transition-all duration-150 ${
                    isHoveredTarget
                      ? "ring-2 ring-[var(--po-accent)] border-[var(--po-accent)] bg-[var(--po-chip)] scale-[1.02] shadow-lg"
                      : isSelected
                      ? "border-[var(--po-accent)] bg-[var(--po-card)] shadow-[var(--po-shadow-sm)] ring-1 ring-[var(--po-accent)]"
                      : "border-[var(--po-line)] bg-[var(--po-card)] hover:border-[var(--po-line-2)] hover:bg-[var(--po-sunken)] shadow-[var(--po-shadow-sm)]"
                  }`}
                >
                  {/* Poster / Thumbnail Area */}
                  <div className="relative aspect-video w-full rounded-[10px] overflow-hidden bg-gradient-to-br from-[var(--po-ph1)] to-[var(--po-ph2)] border border-[var(--po-line)] flex items-center justify-center pointer-events-none">
                    {proj.thumbnailUrl ? (
                      <img
                        src={proj.thumbnailUrl}
                        alt={proj.title}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 text-[var(--po-ink-3)]">
                        {proj.isSystem ? (
                          <Inbox size={24} className="opacity-60" />
                        ) : (
                          <span className="text-[20px] font-semibold opacity-70">
                            {proj.title.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span className="text-[10px] font-mono opacity-60">
                          {proj.projectCode}
                        </span>
                      </div>
                    )}

                    {/* System / Inbox Badge */}
                    {proj.isSystem && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-[var(--po-ink)] text-[var(--po-panel)] font-mono font-bold text-[9px] rounded-full uppercase tracking-wider shadow-sm">
                        System / Inbox
                      </div>
                    )}
                  </div>

                  {/* Card Title & Code */}
                  <div className="flex items-center justify-between px-1 pointer-events-none">
                    <span className="text-[13px] font-semibold text-[var(--po-ink)] group-hover:text-[var(--po-accent)] transition-colors truncate">
                      {proj.title}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--po-ink-3)] shrink-0 ml-2">
                      {proj.isSystem ? "Inbox" : proj.projectCode}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {isLoadingEpisodes ? (
                <div className="py-8 text-center text-[12px] text-[var(--po-ink-3)]">
                  Loading episodes...
                </div>
              ) : episodes.length === 0 ? (
                <div className="py-8 text-center text-[12px] text-[var(--po-ink-3)] rounded-[12px] border border-dashed border-[var(--po-line)]">
                  No episodes found in this project.
                </div>
              ) : (
                episodes.map((ep) => {
                  const isHoveredTarget =
                    hoveredDropTarget?.type === "episode" &&
                    hoveredDropTarget.episodeId === ep.id;

                  return (
                    <div
                      key={ep.id}
                      data-drop-target-episode-id={ep.id}
                      data-drop-target-project-id={drilledProject?.id}
                      className={`group relative flex flex-col gap-2 rounded-[16px] border p-2.5 transition-all duration-150 ${
                        isHoveredTarget
                          ? "ring-2 ring-[var(--po-accent)] border-[var(--po-accent)] bg-[var(--po-chip)] scale-[1.02] shadow-lg"
                          : "border-[var(--po-line)] bg-[var(--po-card)] hover:border-[var(--po-line-2)] hover:bg-[var(--po-sunken)] shadow-[var(--po-shadow-sm)]"
                      }`}
                    >
                      {/* Episode Thumbnail */}
                      <div className="relative aspect-video w-full rounded-[10px] overflow-hidden bg-gradient-to-br from-[var(--po-ph1)] to-[var(--po-ph2)] border border-[var(--po-line)] flex items-center justify-center pointer-events-none">
                        {ep.previewImage ? (
                          <img
                            src={ep.previewImage}
                            alt={ep.episodeName}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 text-[var(--po-ink-3)]">
                            <Clapperboard size={20} className="opacity-50" />
                            <span className="text-[9px] font-mono opacity-70">
                              {ep.code || "EPISODE"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Episode Title & Code */}
                      <div className="flex items-center justify-between px-1 pointer-events-none">
                        <span className="text-[13px] font-semibold text-[var(--po-ink)] truncate">
                          {ep.episodeName}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--po-ink-3)] shrink-0 ml-2">
                          {ep.code || "EPISODE"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export const AssetAssemblyProjectPanel = memo(AssetAssemblyProjectPanelComponent);
export default AssetAssemblyProjectPanel;
