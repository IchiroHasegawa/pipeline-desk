"use client";

import React from "react";
import {
  IDENTITY_TRANSFORM,
  type CanvasTransform,
} from "@/lib/timeline/timelineGeometry";

export type CanvasShellProps = {
  nav: React.ReactNode;
  tools: React.ReactNode;
  toolsPosition?: { x: number; y: number };
  list?: React.ReactNode;
  /**
   * The canvas layer's transform. The dot grid follows it, so dragging
   * empty canvas moves the grid while the project lines hold still.
   *
   * This supersedes DESIGN_SPEC §0 ("Grid ... Fixed to viewport; does not
   * pan"), per the Phase 2 requirement that the two layers move
   * independently. Omit the prop to keep the old pinned grid.
   */
  gridTransform?: CanvasTransform;
  children: React.ReactNode;
};

export const CanvasShell: React.FC<CanvasShellProps> = ({
  nav,
  tools,
  toolsPosition,
  list,
  gridTransform = IDENTITY_TRANSFORM,
  children,
}) => {
  const pitch = 26 * gridTransform.scale;

  return (
    <div className="relative w-full min-h-screen h-screen overflow-hidden bg-[var(--color-canvas,#ffffff)] font-sans antialiased">
      {/* Background canvas grid — panned and scaled by gridTransform.
          Shifting background-position rather than transforming the element
          keeps the tiling infinite, so the grid never runs out at the edges. */}
      <div
        className="absolute inset-0 canvas-grid pointer-events-none z-0"
        style={{
          backgroundSize: `${pitch}px ${pitch}px`,
          backgroundPosition: `${gridTransform.x}px ${gridTransform.y}px`,
        }}
      />

      {/* Screen width guard for viewports below 1280px */}
      <div className="viewport-guard fixed inset-0 z-50 bg-[var(--color-canvas,#ffffff)] flex items-center justify-center p-6 text-center">
        <p className="text-[var(--text-section,18px)] font-sans font-medium text-[var(--color-ink,#000000)] tracking-tight">
          Production OS requires a wider window.
        </p>
      </div>

      {/* Main desktop layout */}
      <div className="shell-container relative z-10 w-full h-full min-w-[1280px]">
        {/* Top-Left Transform Tools Slot */}
        <div
          className="absolute z-20"
          style={{
            left: toolsPosition
              ? `calc((${toolsPosition.x} / 1920) * 100%)`
              : "calc((101.5 / 1920) * 100%)",
            top: toolsPosition
              ? `calc((${toolsPosition.y} / 1080) * 100%)`
              : "calc((87 / 1080) * 100%)",
          }}
        >
          {tools}
        </div>

        {/* Top-Right Vertical Navigation Slot */}
        <div
          className="absolute z-20"
          style={{
            left: "calc((1632.5 / 1920) * 100%)",
            top: "calc((38 / 1080) * 100%)",
          }}
        >
          {nav}
        </div>

        {/* Left-Centre List Panel Slot */}
        {list && (
          <div
            className="absolute z-20"
            style={{
              left: "calc((14 / 1920) * 100%)",
              top: "calc((346 / 1080) * 100%)",
            }}
          >
            {list}
          </div>
        )}

        {/* Main Canvas Area */}
        <main className="w-full h-full relative z-10">{children}</main>
      </div>

      <style jsx>{`
        @media (max-width: 1279px) {
          .viewport-guard {
            display: flex !important;
          }
          .shell-container {
            display: none !important;
          }
        }
        @media (min-width: 1280px) {
          .viewport-guard {
            display: none !important;
          }
          .shell-container {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CanvasShell;
