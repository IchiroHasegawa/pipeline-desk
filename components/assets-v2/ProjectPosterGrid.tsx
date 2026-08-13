/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo } from "react";
import type { ProjectV2 } from "@/types/production-v2";

export type ProjectPosterGridProps = {
  projects: ProjectV2[];
  onSelectProject: (projectId: string) => void;
};

export const ProjectPosterGridComponent: React.FC<ProjectPosterGridProps> = ({
  projects,
  onSelectProject,
}) => {
  return (
    <div className="grid grid-cols-6 gap-[75px] w-[1731px] pt-4 font-sans select-none">
      {projects.map((project) => {
        return (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="flex flex-col gap-2 cursor-pointer group"
          >
            {/* Poster Card: 226 x 345 */}
            <div className="relative w-[226px] h-[345px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] overflow-hidden shadow-sm group-hover:shadow-md transition-all group-hover:border-black flex flex-col justify-between p-3">
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 font-mono text-[var(--color-ink-muted,#707070)] text-[12px] text-center">
                  <span>[POSTER]</span>
                  <span className="text-[10px] opacity-70">{project.projectCode}</span>
                </div>
              )}

              {/* System Badge for Unknown Project */}
              {project.isSystem && (
                <div className="relative z-10 self-start px-2 py-0.5 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] font-mono font-bold text-[10px] rounded-[var(--radius-xs,1px)] shadow-xs">
                  SYSTEM / UNKNOWN
                </div>
              )}
            </div>

            {/* Poster Label */}
            <div className="flex flex-col gap-0.5 max-w-[226px]">
              <h3 className="text-[var(--text-list,12px)] font-bold text-[var(--color-ink,#000000)] truncate group-hover:underline">
                {project.title}
              </h3>
              <span className="text-[10px] font-mono text-[var(--color-ink-muted,#707070)] truncate">
                {project.projectCode}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const ProjectPosterGrid = memo(ProjectPosterGridComponent);
export default ProjectPosterGrid;
