/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import VerticalNav from "@/components/shell/VerticalNav";

export type ManageLayoutProps = {
  parentThumbnailUrl?: string;
  parentName: string;
  title: string;
  preview: React.ReactNode;
  strip: React.ReactNode;
  stripHeading: string; // "Scenes" | "Keyframes"
  commitRail: React.ReactNode;
  tasks: React.ReactNode;
  detailPanel?: React.ReactNode;
  todoRail: React.ReactNode;
  entityList: React.ReactNode;
  tools: React.ReactNode;
  toolsPosition?: { x: number; y: number };
  nav?: React.ReactNode;
};

export const ManageLayout: React.FC<ManageLayoutProps> = ({
  parentThumbnailUrl,
  parentName,
  title,
  preview,
  strip,
  stripHeading,
  commitRail,
  tasks,
  detailPanel,
  todoRail,
  entityList,
  tools,
  toolsPosition,
  nav = <VerticalNav active="project" />,
}) => {
  const [activeTab, setActiveTab] = React.useState<"detail" | "todo">("todo");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-canvas,#ffffff)] text-[var(--color-ink,#000000)] font-sans select-none">
      {/* Navigation Anchor */}
      {nav}

      {/* Main 3-Column Document Body (Offset by Nav width) */}
      <main className="absolute left-[64px] top-0 right-0 bottom-0 overflow-auto">
        <div className="relative w-[1856px] h-[1080px] min-w-[1280px]">
          {/* 1. Header block (top-left) */}
          <div className="absolute left-[14.5px] top-[35px] flex flex-row items-center gap-4">
            <div className="w-[97px] h-[136px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] overflow-hidden shrink-0">
              {parentThumbnailUrl ? (
                <img
                  src={parentThumbnailUrl}
                  alt={parentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--color-ink-muted,#707070)] font-mono">
                  [THUMB]
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-[var(--text-heading,28px)] font-bold tracking-tight text-[var(--color-ink,#000000)]">
                {parentName}
              </h1>
              <h2 className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink-muted,#707070)]">
                {title}
              </h2>
            </div>
          </div>

          {/* 2. Left column — Preview, Strip, Heading, Commit rail */}
          <div className="absolute left-[14.5px] top-[193px] w-[735px] flex flex-col">
            {/* Preview player (14.5, 193) -> 722 x 389, ends y=582 */}
            <div className="w-[722px] h-[389px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] overflow-hidden shadow-sm shrink-0">
              {preview}
            </div>

            {/* Strip thumbnails (y=614, height 75px) */}
            <div className="mt-[32px] h-[75px] w-[735px] shrink-0 overflow-hidden">
              {strip}
            </div>

            {/* Heading (15, 705) & Rule (15, 722) */}
            <div className="mt-[16px] flex flex-col gap-2 shrink-0">
              <h3 className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink,#000000)] font-sans">
                {stripHeading}
              </h3>
              <div className="w-[735px] h-[1px] bg-[var(--color-line,#000000)]" />
            </div>

            {/* Commit rail (10, 756.5) */}
            <div className="mt-[34.5px] pl-[0.5px]">
              {commitRail}
            </div>
          </div>

          {/* 3. Centre column — Tasks grid, Detail / To do toggle, To Do rail */}
          <div className="absolute left-[775px] top-[199px] w-[790px] flex flex-col gap-3">
            {/* Tasks section */}
            <div className="flex flex-col gap-2">
              <h3 className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink,#000000)]">
                Tasks
              </h3>
              <div className="w-[424px] h-[1px] bg-[var(--color-line,#000000)]" />
              <div className="pt-2">{tasks}</div>
            </div>

            {/* Detail / To do toggle */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="w-[790px] h-[1px] bg-[var(--color-line,#000000)]" />
              <div className="flex flex-row items-center gap-0 text-[var(--text-caption,11px)]">
                <button
                  type="button"
                  onClick={() => setActiveTab("detail")}
                  className={`w-[66px] h-[32px] rounded-t-[var(--radius-sm,3px)] border border-b-0 border-[var(--color-line,#000000)] font-medium cursor-pointer transition-colors ${
                    activeTab === "detail"
                      ? "bg-[var(--color-panel,#f0f0f0)] text-[var(--color-ink,#000000)] z-10"
                      : "bg-[var(--color-selection,#d9d9d9)] text-[var(--color-ink-muted,#707070)]"
                  }`}
                >
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("todo")}
                  className={`w-[66px] h-[32px] -ml-2 rounded-t-[var(--radius-sm,3px)] border border-b-0 border-[var(--color-line,#000000)] font-medium cursor-pointer transition-colors ${
                    activeTab === "todo"
                      ? "bg-[var(--color-panel,#f0f0f0)] text-[var(--color-ink,#000000)] z-10"
                      : "bg-[var(--color-selection,#d9d9d9)] text-[var(--color-ink-muted,#707070)]"
                  }`}
                >
                  To do
                </button>
              </div>

              {/* Tab Body */}
              <div className="pt-2">
                {activeTab === "todo" ? (
                  todoRail
                ) : (
                  detailPanel || (
                    <div className="p-4 border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] text-[var(--text-list,12px)]">
                      No additional detail metadata available.
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 4. Right column — Pinned entity list */}
          <div className="absolute left-[1593px] top-[193px] w-[260px] h-[860px]">
            {entityList}
          </div>
        </div>
      </main>

      {/* Tools Anchor */}
      <div
        className="absolute z-20"
        style={{
          left: toolsPosition
            ? `calc((${toolsPosition.x} / 1920) * 100%)`
            : "calc((637.5 / 1920) * 100%)",
          top: toolsPosition
            ? `calc((${toolsPosition.y} / 1080) * 100%)`
            : "calc((117 / 1080) * 100%)",
        }}
      >
        {tools}
      </div>
    </div>
  );
};

export default ManageLayout;
