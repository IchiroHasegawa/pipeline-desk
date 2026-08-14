/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo } from "react";
import type { ProjectV2 } from "@/types/production-v2";

export type ProjectPosterGridProps = {
  projects: ProjectV2[];
  onSelectProject: (projectId: string) => void;
};

/**
 * DESIGN_SPEC §10 — posters 226 × 345 at x 78, 379, 680, 980, 1282, 1583
 * (column pitch 301) and y 227 & 656 (row pitch 429), six per row.
 * The grid's own origin is (78, 227), set by the page, so offsets here are
 * relative to it.
 */
const COLUMN_PITCH = 301;
const ROW_PITCH = 429;
const PER_ROW = 6;

export const ProjectPosterGridComponent: React.FC<ProjectPosterGridProps> = ({
  projects,
  onSelectProject,
}) => {
  return (
    <div
      className="relative w-[1731px] font-sans select-none"
      style={{ height: `${Math.ceil(projects.length / PER_ROW) * ROW_PITCH}px` }}
    >
      {projects.map((project, idx) => {
        const col = idx % PER_ROW;
        const row = Math.floor(idx / PER_ROW);

        return (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            style={{ left: `${col * COLUMN_PITCH}px`, top: `${row * ROW_PITCH}px` }}
            className="absolute w-[226px] flex flex-col gap-2 cursor-pointer group"
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
