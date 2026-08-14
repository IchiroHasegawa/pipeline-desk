"use client";

import React, { useState, useEffect, useCallback } from "react";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ListPanel, { ListPanelItem } from "@/components/shell/ListPanel";

import TimelineCanvas from "@/components/timeline/TimelineCanvas";
import FocusCard from "@/components/timeline/FocusCard";
import useTimelineScale, { TimelineRange, TimelineMode } from "@/lib/timeline/useTimelineScale";

type MockProject = {
  id: string;
  title: string;
  code: string;
  startDate: string | null;
  endDate: string | null;
  creationDate: string;
  description: string;
};

const MOCK_PROJECTS: MockProject[] = [
  {
    id: "proj-1",
    title: "PROJ_TITAN",
    code: "TITAN",
    startDate: "2026-01-01",
    endDate: "2026-12-31", // long ~1191
    creationDate: "2026-01-01",
    description: "Main feature animation production timeline for Titan series.",
  },
  {
    id: "proj-2",
    title: "PROJ_AEGIS",
    code: "AEGIS",
    startDate: "2026-02-15",
    endDate: "2026-10-30", // ~1063
    creationDate: "2026-02-15",
    description: "Hybrid short-form animation project Aegis.",
  },
  {
    id: "proj-3",
    title: "PROJ_NEBULA",
    code: "NEBULA",
    startDate: "2026-03-01",
    endDate: "2026-10-15", // ~1038
    creationDate: "2026-03-01",
    description: "Sci-fi 3D episodic sequence production.",
  },
  {
    id: "proj-4",
    title: "PROJ_SOLAR",
    code: "SOLAR",
    startDate: "2026-04-10",
    endDate: "2026-09-30", // ~836
    creationDate: "2026-04-10",
    description: "Solar flare visual effects breakdown and asset pipeline.",
  },
  {
    id: "proj-5",
    title: "PROJ_LUNA",
    code: "LUNA",
    startDate: "2026-05-01",
    endDate: "2026-08-15", // ~478
    creationDate: "2026-05-01",
    description: "Lunar environment asset stage and lighting tests.",
  },
  {
    id: "proj-6",
    title: "PROJ_KINETIC",
    code: "KINETIC",
    startDate: "2026-06-01",
    endDate: "2026-07-01", // short ~300
    creationDate: "2026-06-01",
    description: "Short motion graphic teaser for promo launch.",
  },
];

export default function TimelinePreviewPage() {
  const [selectedId, setSelectedId] = useState<string | null>("proj-1");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [mode, setMode] = useState<TimelineMode>("clamped");

  // Compute scaled line lengths using useTimelineScale
  const ranges: TimelineRange[] = MOCK_PROJECTS.map((p) => ({
    id: p.id,
    startDate: p.startDate,
    endDate: p.endDate,
  }));

  const { lengthById } = useTimelineScale(ranges, {
    mode,
    viewportWidth: 1440,
    maxFraction: 0.75,
    pixelsPerDay: 4,
    minLength: 280,
  });

  const timelineItems = MOCK_PROJECTS.map((p) => ({
    id: p.id,
    length: lengthById[p.id] || 300,
    label: p.title,
  }));

  const listItems: ListPanelItem[] = MOCK_PROJECTS.map((p) => ({
    id: p.id,
    label: p.title,
  }));

  // Handle escape key to unfocus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      if (selectedId === id) {
        // Second click toggles focus
        setFocusedId((prev) => (prev === id ? null : id));
      } else {
        setSelectedId(id);
      }
    },
    [selectedId]
  );

  const handleOpen = useCallback((id: string) => {
    setSelectedId(id);
    setFocusedId(id);
  }, []);

  const focusedProject = MOCK_PROJECTS.find((p) => p.id === focusedId);

  const toolActions: ToolAction[] = [
    { id: "add", label: "ADD", onSelect: () => {} },
    { id: "sub", label: "SUB", onSelect: () => {} },
    { id: "whole", label: "WHOLE", onSelect: () => {} },
    { id: "restore", label: "RESTORE", onSelect: () => {} },
  ];

  return (
    <CanvasShell
      nav={<VerticalNav active="project" />}
      tools={
        <div className="flex flex-row items-center gap-6">
          <TransformTools actions={toolActions} />
          {/* Mode Toggle Button */}
          <div className="flex flex-row items-center border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] overflow-hidden text-[var(--text-tool,10px)] font-sans">
            <button
              type="button"
              onClick={() => setMode("clamped")}
              className={`px-3 py-1 cursor-pointer transition-colors ${
                mode === "clamped"
                  ? "bg-[var(--color-nav-active,#d9d9d9)] font-medium text-black"
                  : "bg-transparent text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              CLAMPED
            </button>
            <div className="w-[1px] h-full bg-[var(--color-line,#000000)]" />
            <button
              type="button"
              onClick={() => setMode("absolute")}
              className={`px-3 py-1 cursor-pointer transition-colors ${
                mode === "absolute"
                  ? "bg-[var(--color-nav-active,#d9d9d9)] font-medium text-black"
                  : "bg-transparent text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              ABSOLUTE
            </button>
          </div>
        </div>
      }
      list={
        <ListPanel
          items={listItems}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
          }}
        />
      }
    >
      <div className="w-full h-full relative overflow-hidden">
        {/* Main Canvas with Staggered Lines */}
        <TimelineCanvas
          items={timelineItems}
          selectedId={selectedId}
          focusedId={focusedId}
          onSelect={handleSelect}
          onOpen={handleOpen}
          autoCenter
          centerOnSelect
        />

        {/* Focus Card overlay when an item is focused */}
        {focusedProject && (
          <div className="absolute top-24 left-44 z-30 pointer-events-auto">
            <FocusCard
              title={focusedProject.code}
              creationDate={focusedProject.creationDate}
              description={focusedProject.description}
            />
          </div>
        )}
      </div>
    </CanvasShell>
  );
}
