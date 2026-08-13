"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ListPanel, { ListPanelItem } from "@/components/shell/ListPanel";

import TimelineCanvas from "@/components/timeline/TimelineCanvas";
import FocusCard from "@/components/timeline/FocusCard";
import ProjectFormDialog from "@/components/projects/ProjectFormDialog";

import useTimelineScale, { TimelineRange } from "@/lib/timeline/useTimelineScale";
import { createProjectV2, deleteProjectV2 } from "@/app/actions/production";
import type { ProjectV2 } from "@/types/production-v2";

export type ProjectsViewProps = {
  initialProjects: ProjectV2[];
  initialError?: string | null;
};

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  initialProjects,
  initialError = null,
}) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(1440);

  const [projects, setProjects] = useState<ProjectV2[]>(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  // ResizeObserver for canvas container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setViewportWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sort projects newest createdAt first
  const sortedProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [projects]);

  // Compute scaled line lengths using useTimelineScale in clamped mode
  const ranges: TimelineRange[] = useMemo(() => {
    return sortedProjects.map((p) => ({
      id: p.id,
      startDate: p.startDate,
      endDate: p.endDate,
    }));
  }, [sortedProjects]);

  const { lengthById } = useTimelineScale(ranges, {
    mode: "clamped",
    viewportWidth,
    maxFraction: 0.72,
    minLength: 280,
  });

  const timelineItems = useMemo(() => {
    return sortedProjects.map((p) => ({
      id: p.id,
      length: lengthById[p.id] || 280,
      label: p.title,
    }));
  }, [sortedProjects, lengthById]);

  const listItems: ListPanelItem[] = useMemo(() => {
    return sortedProjects.map((p) => ({
      id: p.id,
      label: p.projectCode || p.title,
    }));
  }, [sortedProjects]);

  // Handle escape key to clear focus (keep selection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Interaction handlers
  const handleListSelect = useCallback((id: string) => {
    // Click name in ListPanel -> Select AND Focus
    setSelectedId(id);
    setFocusedId(id);
  }, []);

  const handleCanvasLineSelect = useCallback(
    (id: string) => {
      if (selectedId === id) {
        // Already selected -> Focus
        setFocusedId(id);
      } else {
        // Select only (no focus)
        setSelectedId(id);
      }
    },
    [selectedId]
  );

  const handleCanvasLineOpen = useCallback(
    (id: string) => {
      if (focusedId === id) {
        // Already focused -> Navigate to episodes
        router.push(`/projects/${id}/episodes`);
      } else {
        // Select and Focus
        setSelectedId(id);
        setFocusedId(id);
      }
    },
    [focusedId, router]
  );

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Click empty canvas -> Clear focus AND selection
    if (e.target === e.currentTarget) {
      setFocusedId(null);
      setSelectedId(null);
    }
  }, []);

  // Tool actions
  const handleDeleteSelected = async () => {
    if (!selectedId) return;
    try {
      await deleteProjectV2(selectedId);
      setProjects((prev) => prev.filter((p) => p.id !== selectedId));
      if (focusedId === selectedId) setFocusedId(null);
      setSelectedId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  const toolActions: ToolAction[] = [
    { id: "add", label: "ADD", onSelect: () => setIsCreateOpen(true) },
    {
      id: "sub",
      label: "SUB",
      onSelect: handleDeleteSelected,
      disabled: !selectedId,
    },
    {
      id: "whole",
      label: "WHOLE",
      onSelect: () => setFocusedId(null),
    },
    {
      id: "restore",
      label: "RESTORE",
      onSelect: () => {
        setFocusedId(null);
        setSelectedId(null);
      },
    },
  ];

  const handleCreateProject = async (data: {
    title: string;
    projectCode: string;
    description?: string;
    startDate: string;
    endDate?: string;
    thumbnailUrl?: string;
  }) => {
    const newProj = await createProjectV2(data);
    setProjects((prev) => [newProj, ...prev]);
    setSelectedId(newProj.id);
    setFocusedId(newProj.id);
  };

  const focusedProject = sortedProjects.find((p) => p.id === focusedId);

  // Layout states
  if (errorMsg) {
    return (
      <CanvasShell
        nav={<VerticalNav active="project" />}
        tools={<TransformTools actions={toolActions} />}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-[var(--radius-card,7px)] p-8 max-w-md shadow-sm">
            <p className="text-[var(--text-section,18px)] text-[var(--color-ink)] font-medium mb-4">
              Error Loading Projects
            </p>
            <p className="text-[var(--text-list,12px)] text-[var(--color-ink)] mb-6 opacity-90 leading-relaxed">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-canvas)] text-[var(--text-caption,11px)] font-medium rounded-[var(--radius-sm,3px)] cursor-pointer hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      </CanvasShell>
    );
  }

  if (projects.length === 0) {
    return (
      <CanvasShell
        nav={<VerticalNav active="project" />}
        tools={<TransformTools actions={toolActions} />}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="border border-dashed border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] p-10 max-w-md bg-white/50">
            <p className="text-[var(--text-section,18px)] text-[var(--color-ink,#000000)] font-medium mb-2">
              No Projects Found
            </p>
            <p className="text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)] mb-6">
              Create your first project to start building your production timeline.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] text-[var(--text-caption,11px)] font-medium rounded-[var(--radius-sm,3px)] cursor-pointer"
            >
              + Create First Project
            </button>
          </div>

          <ProjectFormDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreateProject}
          />
        </div>
      </CanvasShell>
    );
  }

  return (
    <CanvasShell
      nav={<VerticalNav active="project" />}
      tools={<TransformTools actions={toolActions} />}
      toolsPosition={{ x: 101.5, y: 87 }}
      list={
        <ListPanel
          items={listItems}
          selectedId={selectedId}
          onSelect={handleListSelect}
        />
      }
    >
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="w-full h-full relative overflow-hidden"
      >
        {/* Main Canvas with Staggered Lines */}
        <TimelineCanvas
          items={timelineItems}
          selectedId={selectedId}
          focusedId={focusedId}
          mode="clamped"
          onSelect={handleCanvasLineSelect}
          onOpen={handleCanvasLineOpen}
        />

        {/* Focus Card Overlay */}
        {focusedProject && (
          <div
            aria-label="Focused Project Details"
            className="absolute z-30 pointer-events-auto transition-all duration-500 ease-out"
            style={{
              left: "calc((329.5 / 1920) * 100%)",
              top: "calc((147 / 1080) * 100%)",
            }}
          >
            <FocusCard
              title={focusedProject.projectCode || focusedProject.title}
              creationDate={focusedProject.createdAt}
              description={focusedProject.description}
              thumbnailUrl={focusedProject.thumbnailUrl}
            />
          </div>
        )}

        {/* Create Project Modal */}
        <ProjectFormDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateProject}
        />
      </div>
    </CanvasShell>
  );
};

export default ProjectsView;
