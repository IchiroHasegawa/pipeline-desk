/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import type { ProjectV2, EpisodeV2 } from "@/types/production-v2";
import { createClient } from "@/lib/supabase/client";

export type DropTarget =
  | { type: "project"; projectId: string }
  | { type: "episode"; episodeId: string; projectId: string }
  | null;

export type ProjectListPanelProps = {
  projects: ProjectV2[];
  currentProjectId: string;
  isCollapsed: boolean;
  onSelectProject: (projectId: string) => void;
  hoveredDropTarget?: DropTarget;
};

export const ProjectListPanelComponent: React.FC<ProjectListPanelProps> = ({
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

  // Pin Unknown system project first
  const sortedProjects = useMemo(() => {
    const unknown = projects.filter((p) => p.isSystem);
    const regular = projects.filter((p) => !p.isSystem);
    return [...unknown, ...regular];
  }, [projects]);

  // Fetch episodes when drilling down
  useEffect(() => {
    if (viewMode === "episodes" && drilledProject) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingEpisodes(true);
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
                status: (row.status === "Retired" ? "Retired" : "Active") as "Active" | "Retired",
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
        width: isCollapsed ? "0px" : "330px",
      }}
      className="h-full bg-[var(--color-selection,#d9d9d9)] border-r border-[var(--color-line,#000000)] overflow-hidden transition-all duration-300 ease-in-out z-20 flex flex-col font-sans select-none shrink-0"
    >
      <div className="relative w-[330px] h-full overflow-y-auto overflow-x-hidden">
        {/* Panel Header — "Projects" (121, 56) 202 × 88 (DESIGN_SPEC §13) */}
        {viewMode === "projects" ? (
          <h2 className="absolute left-[121px] top-[56px] w-[202px] h-[88px] text-[var(--text-heading,24px)] leading-tight font-bold text-[var(--color-ink,#000000)]">
            Projects
          </h2>
        ) : (
          <div className="flex flex-col gap-2 pt-[56px] px-6">
            <button
              onClick={handleBackToProjects}
              className="self-start flex items-center gap-1.5 text-xs font-bold text-[var(--color-ink,#000000)] hover:underline py-1"
            >
              <span>←</span>
              <span>Back to Projects</span>
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-muted,#707070)]">
                Project / Episodes
              </span>
              <h2 className="text-[var(--text-section,18px)] font-bold text-[var(--color-ink,#000000)] truncate">
                {drilledProject?.title}
              </h2>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={viewMode === "projects" ? "" : "flex flex-col gap-6 px-6 pb-6 pt-4"}>
          {viewMode === "projects" ? (
            sortedProjects.map((proj, idx) => {
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
                  style={{ left: "64px", top: `${148 + idx * 318}px` }}
                  className={`absolute w-[202px] h-[282px] rounded-[var(--radius-card,7px)] border flex flex-col justify-between p-3.5 cursor-pointer transition-all ${
                    isHoveredTarget
                      ? "border-blue-600 bg-blue-500/20 ring-4 ring-blue-500 shadow-xl scale-[1.02]"
                      : isSelected
                      ? "border-black bg-[#7d7d7d] text-white shadow-md ring-2 ring-black"
                      : "border-[var(--color-line-soft,#a9a9a9)] bg-[#7d7d7d]/80 text-white hover:bg-[#7d7d7d] hover:border-black"
                  }`}
                >
                  {/* Thumbnail / Poster Area */}
                  <div className="relative w-full h-[180px] bg-black/20 rounded-[var(--radius-sm,3px)] overflow-hidden flex items-center justify-center pointer-events-none">
                    {proj.thumbnailUrl ? (
                      <img
                        src={proj.thumbnailUrl}
                        alt={proj.title}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 font-mono text-[11px] opacity-80 text-center">
                        <span>[POSTER]</span>
                        <span className="text-[9px] opacity-70">{proj.projectCode}</span>
                      </div>
                    )}

                    {/* System / Unknown Badge */}
                    {proj.isSystem && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] font-mono font-bold text-[9px] rounded-[var(--radius-xs,1px)] shadow-xs">
                        SYSTEM / INBOX
                      </div>
                    )}
                  </div>

                  {/* Card Title & Code */}
                  <div className="flex flex-col gap-0.5 pointer-events-none">
                    <h3 className="text-[var(--text-list,12px)] font-bold truncate">
                      {proj.title}
                    </h3>
                    <span className="text-[10px] font-mono opacity-75 truncate">
                      {proj.isSystem ? "★ Unassigned Inbox" : proj.projectCode}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              {isLoadingEpisodes ? (
                <div className="p-8 text-center text-xs font-mono text-[var(--color-ink-muted,#707070)]">
                  Loading episodes...
                </div>
              ) : episodes.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-[var(--color-ink-muted,#707070)] border border-dashed border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] bg-black/5">
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
                      className={`w-[202px] rounded-[var(--radius-card,7px)] border flex flex-col justify-between p-3.5 transition-all ${
                        isHoveredTarget
                          ? "border-blue-600 bg-blue-500/20 ring-4 ring-blue-500 shadow-xl scale-[1.02]"
                          : "border-[var(--color-line-soft,#a9a9a9)] bg-[#7d7d7d]/80 text-white hover:bg-[#7d7d7d] hover:border-black"
                      }`}
                    >
                      {/* Episode Thumbnail */}
                      <div className="relative w-full h-[120px] bg-black/20 rounded-[var(--radius-sm,3px)] overflow-hidden flex items-center justify-center mb-2 pointer-events-none">
                        {ep.previewImage ? (
                          <img
                            src={ep.previewImage}
                            alt={ep.episodeName}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 font-mono text-[10px] opacity-80 text-center">
                            <span>[EPISODE THUMB]</span>
                            <span className="text-[9px] opacity-70">{ep.code}</span>
                          </div>
                        )}
                      </div>

                      {/* Episode Title */}
                      <div className="flex flex-col gap-0.5 pointer-events-none">
                        <h4 className="text-[var(--text-list,12px)] font-bold truncate">
                          {ep.episodeName}
                        </h4>
                        <span className="text-[10px] font-mono opacity-75 truncate">
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

        {/* Project cards are absolutely positioned: establishes the scroll height. */}
        {viewMode === "projects" && (
          <div
            aria-hidden="true"
            style={{ height: `${148 + sortedProjects.length * 318}px` }}
          />
        )}
      </div>
    </aside>
  );
};

export const ProjectListPanel = memo(ProjectListPanelComponent);
export default ProjectListPanel;
