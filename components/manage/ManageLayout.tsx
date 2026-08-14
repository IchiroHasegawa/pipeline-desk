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

/**
 * Manage page frame — DESIGN_SPEC §8.
 *
 * Not a canvas page: no dotted grid, three-column document layout. Every child
 * is positioned against the 1920-wide document frame using the measured
 * coordinates, so slots are rendered as direct children of the frame and
 * position themselves rather than being wrapped in flow containers.
 *
 * Frame height is 1271 — the entity list panel (193 + 1078) is the lowest
 * element, below the commit rail (ends 1080) and the left vertical rule
 * (ends 1122).
 */
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
  toolsPosition = { x: 677, y: 116 },
  nav = <VerticalNav active="project" />,
}) => {
  const [activeTab, setActiveTab] = React.useState<"detail" | "todo">("todo");

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[var(--color-canvas,#ffffff)] text-[var(--color-ink,#000000)] font-sans select-none">
      {nav}

      <main className="absolute inset-0 overflow-auto">
        <div className="relative w-[1920px] h-[1271px] shrink-0">
          {/* Parent thumbnail (14.5, 35) 97 × 136 */}
          <div className="absolute left-[14.5px] top-[35px] w-[97px] h-[136px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] overflow-hidden">
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

          {/* Parent name (131.5, 92) 578 × 79 */}
          <h1 className="absolute left-[131.5px] top-[92px] w-[578px] h-[79px] text-[var(--text-heading,24px)] leading-tight font-bold tracking-tight text-[var(--color-ink,#000000)] truncate">
            {parentName}
          </h1>

          {/* Title (132, 142) 664 × 29 */}
          <h2 className="absolute left-[132px] top-[142px] w-[664px] h-[29px] flex items-center text-[var(--text-section,18px)] leading-none font-medium text-[var(--color-ink-muted,#707070)] truncate">
            {title}
          </h2>

          {/* Preview player (14.5, 193) 722 × 389 */}
          <div className="absolute left-[14.5px] top-[193px] w-[722px] h-[389px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] overflow-hidden shadow-sm">
            {preview}
          </div>

          {/*
            Strip thumbnails: y 614, x 14.5 + 147·n, 134 × 75, 5 visible.
            Sits above the heading and below the preview, and must never overlap
            the commit rail (which starts at y 756.5).
          */}
          <div className="absolute left-[14.5px] top-[614px] w-[722px] h-[75px] overflow-hidden">
            {strip}
          </div>

          {/* Strip heading (15, 705) 211 × 62 */}
          <h3 className="absolute left-[15px] top-[705px] w-[211px] h-[62px] text-[var(--text-section,18px)] leading-none font-medium text-[var(--color-ink,#000000)]">
            {stripHeading}
          </h3>

          {/* Rule under the heading (15, 722) 735 × 1 */}
          <div className="absolute left-[15px] top-[722px] w-[735px] h-[1px] bg-[var(--color-line,#000000)]" />

          {/* Commit rail positions itself at (10, 756.5) */}
          {commitRail}

          {/* "Tasks" heading (775, 199) 311 × 31 */}
          <h3 className="absolute left-[775px] top-[199px] w-[311px] h-[31px] flex items-center text-[var(--text-section,18px)] leading-none font-medium text-[var(--color-ink,#000000)]">
            Tasks
          </h3>

          {/* Top rule (768, 224) 424 × 1 */}
          <div className="absolute left-[768px] top-[224px] w-[424px] h-[1px] bg-[var(--color-line,#000000)]" />

          {/* Left vertical rule (768, 224) 1 × 898 */}
          <div className="absolute left-[768px] top-[224px] w-[1px] h-[898px] bg-[var(--color-line,#000000)]" />

          {/* Task cards position themselves at y 253 / 369, x 775 + 191.7·n */}
          {tasks}

          {/* Detail / To do rule (768, 618.5) 828 × 1 */}
          <div className="absolute left-[768px] top-[618.5px] w-[828px] h-[1px] bg-[var(--color-line,#000000)]" />

          {/* Detail tab (775, 619) and To do tab (833, 619), 66 × 32 each */}
          <button
            type="button"
            onClick={() => setActiveTab("detail")}
            className={`absolute left-[775px] top-[619px] w-[66px] h-[32px] rounded-t-[var(--radius-sm,3px)] border border-b-0 border-[var(--color-line,#000000)] cursor-pointer transition-colors ${
              activeTab === "detail"
                ? "bg-[var(--color-panel,#f0f0f0)] z-20"
                : "bg-[var(--color-selection,#d9d9d9)] z-10"
            }`}
          >
            {/* Tab label (786, 628) */}
            <span
              className={`absolute left-[11px] top-[9px] text-[var(--text-caption,11px)] leading-none font-medium ${
                activeTab === "detail"
                  ? "text-[var(--color-ink,#000000)]"
                  : "text-[var(--color-ink-muted,#707070)]"
              }`}
            >
              Detail
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("todo")}
            className={`absolute left-[833px] top-[619px] w-[66px] h-[32px] rounded-t-[var(--radius-sm,3px)] border border-b-0 border-[var(--color-line,#000000)] cursor-pointer transition-colors ${
              activeTab === "todo"
                ? "bg-[var(--color-panel,#f0f0f0)] z-20"
                : "bg-[var(--color-selection,#d9d9d9)] z-10"
            }`}
          >
            {/* Tab label (845, 628) */}
            <span
              className={`absolute left-[12px] top-[9px] text-[var(--text-caption,11px)] leading-none font-medium ${
                activeTab === "todo"
                  ? "text-[var(--color-ink,#000000)]"
                  : "text-[var(--color-ink-muted,#707070)]"
              }`}
            >
              To do
            </span>
          </button>

          {/* Tab body — the To Do rail positions itself at (789, 686) */}
          {activeTab === "todo" ? (
            todoRail
          ) : (
            <div className="absolute left-[789px] top-[673px] w-[790px] p-4 border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] bg-[var(--color-panel,#f0f0f0)] text-[var(--text-list,12px)]">
              {detailPanel || "No additional detail metadata available."}
            </div>
          )}

          {/* Entity list panel positions itself at (1593, 193) 319 × 1078 */}
          {entityList}

          {/* Transform tools */}
          <div
            className="absolute z-20"
            style={{ left: `${toolsPosition.x}px`, top: `${toolsPosition.y}px` }}
          >
            {tools}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageLayout;
