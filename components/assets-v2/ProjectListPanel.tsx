/* eslint-disable @next/next/no-img-element */
"use client";

import React, { memo } from "react";
import type { ProjectV2 } from "@/types/production-v2";

export type ProjectListPanelProps = {
  projects: ProjectV2[];
  currentProjectId: string;
  isCollapsed: boolean;
  onSelectProject: (projectId: string) => void;
};

export const ProjectListPanelComponent: React.FC<ProjectListPanelProps> = ({
  projects,
  currentProjectId,
  isCollapsed,
  onSelectProject,
}) => {
  return (
    <aside
      style={{
        width: isCollapsed ? "0px" : "330px",
      }}
      className="h-full bg-[var(--color-selection,#d9d9d9)] border-r border-[var(--color-line,#000000)] overflow-hidden transition-all duration-300 ease-in-out z-20 flex flex-col font-sans select-none shrink-0"
    >
      <div className="w-[330px] h-full p-6 flex flex-col gap-6">
        <h2 className="text-[var(--text-heading,28px)] font-bold text-[var(--color-ink,#000000)]">
          Projects
        </h2>

        <div className="flex-1 overflow-y-auto flex flex-col gap-[36px] pr-2">
          {projects.map((proj) => {
            const isSelected = proj.id === currentProjectId;

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`w-[202px] h-[282px] rounded-[var(--radius-card,7px)] border flex flex-col justify-between p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-black bg-[#7d7d7d] text-white shadow-md ring-2 ring-black"
                    : "border-[var(--color-line-soft,#a9a9a9)] bg-[#7d7d7d]/80 text-white hover:bg-[#7d7d7d]"
                }`}
              >
                {/* Thumbnail / Placeholder */}
                <div className="w-full h-[180px] bg-black/20 rounded-[var(--radius-sm,3px)] overflow-hidden flex items-center justify-center">
                  {proj.thumbnailUrl ? (
                    <img
                      src={proj.thumbnailUrl}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] font-mono opacity-80">
                      [THUMBNAIL]
                    </span>
                  )}
                </div>

                {/* Card Title */}
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[var(--text-list,12px)] font-bold truncate">
                    {proj.title}
                  </h3>
                  <span className="text-[10px] font-mono opacity-70">
                    {proj.isSystem ? "★ System / Unknown" : proj.projectCode}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export const ProjectListPanel = memo(ProjectListPanelComponent);
export default ProjectListPanel;
