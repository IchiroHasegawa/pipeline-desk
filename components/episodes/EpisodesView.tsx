"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ListPanel, { ListPanelItem } from "@/components/shell/ListPanel";

import TimelineCanvas from "@/components/timeline/TimelineCanvas";
import TimelineBranch from "@/components/timeline/TimelineBranch";
import FocusCard from "@/components/timeline/FocusCard";
import EpisodeStrip, { EpisodeStripItem } from "@/components/episodes/EpisodeStrip";
import EpisodeFormDialog from "@/components/episodes/EpisodeFormDialog";

import useTimelineScale, { TimelineRange } from "@/lib/timeline/useTimelineScale";
import {
  resolveBranchPaths,
  BranchSpec,
  Point,
} from "@/lib/timeline/timelineGeometry";
import {
  createEpisodeV2,
  deleteEpisodeV2,
  getMainTasksForEpisode,
} from "@/lib/data/v2/productionRepositoryV2";
import type { ProjectV2, EpisodeV2, MainTaskV2 } from "@/types/production-v2";

export type EpisodesViewProps = {
  project: ProjectV2;
  initialEpisodes: EpisodeV2[];
  initialError?: string | null;
};

export const EpisodesView: React.FC<EpisodesViewProps> = ({
  project,
  initialEpisodes,
  initialError = null,
}) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(1440);

  const [episodes, setEpisodes] = useState<EpisodeV2[]>(initialEpisodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  // Lazy loaded main tasks for focused episode
  const [mainTasks, setMainTasks] = useState<MainTaskV2[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

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

  // Fetch main tasks when focused episode changes
  useEffect(() => {
    let cancelled = false;
    async function loadTasks() {
      if (!focusedId) {
        if (!cancelled) setMainTasks([]);
        return;
      }
      try {
        setIsLoadingTasks(true);
        const tasks = await getMainTasksForEpisode(focusedId);
        if (!cancelled) {
          setMainTasks(tasks);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Failed to load main tasks:", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTasks(false);
        }
      }
    }
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [focusedId]);

  // Compute unclamped scale (mode: "absolute")
  const ranges: TimelineRange[] = useMemo(() => {
    return [
      { id: project.id, startDate: project.startDate, endDate: project.endDate },
      ...episodes.map((ep) => ({
        id: ep.id,
        startDate: ep.startDate,
        endDate: ep.endDate,
      })),
    ];
  }, [project, episodes]);

  const { lengthById } = useTimelineScale(ranges, {
    mode: "absolute",
    viewportWidth,
    pixelsPerDay: 5,
    minLength: 320,
  });

  const parentLength = lengthById[project.id] || 900;

  // Calculate deterministic branch specs for episodes
  const branchPaths = useMemo(() => {
    const parentOrigin: Point = { x: 180, y: 520 };
    const projStart = project.startDate
      ? new Date(project.startDate).getTime()
      : new Date(project.createdAt).getTime();
    const projEnd = project.endDate
      ? new Date(project.endDate).getTime()
      : projStart + 180 * 24 * 60 * 60 * 1000; // default 180 days span
    const totalSpan = Math.max(1, projEnd - projStart);

    // Angles array for deterministic variation
    const angles = [-45, 45, -30, 60, -60, 30];

    const branchSpecs: BranchSpec[] = episodes.map((ep, idx) => {
      let anchorT = (idx + 1) / (episodes.length + 1);
      if (ep.startDate) {
        const epStart = new Date(ep.startDate).getTime();
        anchorT = Math.max(0.08, Math.min(0.92, (epStart - projStart) / totalSpan));
      }
      const angleDeg = angles[idx % angles.length];
      const length = lengthById[ep.id] || 220;

      return {
        id: ep.id,
        anchorT,
        angleDeg,
        length,
      };
    });

    return resolveBranchPaths(parentOrigin, parentLength, branchSpecs);
  }, [episodes, project, lengthById, parentLength]);

  const timelineCanvasItems = useMemo(() => {
    return [
      {
        id: project.id,
        length: parentLength,
        label: project.title,
      },
    ];
  }, [project, parentLength]);

  const listItems: ListPanelItem[] = useMemo(() => {
    return episodes.map((ep) => ({
      id: ep.id,
      label: ep.code || ep.episodeName,
    }));
  }, [episodes]);

  const stripItems: EpisodeStripItem[] = useMemo(() => {
    return episodes.map((ep) => ({
      id: ep.id,
      label: ep.code || ep.episodeName,
      thumbnailUrl: ep.previewImage,
    }));
  }, [episodes]);

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

  // Handlers
  const handleListSelect = useCallback((id: string) => {
    // ListPanel click -> Select AND Focus
    setSelectedId(id);
    setFocusedId(id);
  }, []);

  const handleBranchSelect = useCallback(
    (id: string) => {
      if (selectedId === id) {
        // Already selected -> Focus
        setFocusedId(id);
      } else {
        // Select only
        setSelectedId(id);
      }
    },
    [selectedId]
  );

  const handleBranchOpen = useCallback(
    (id: string) => {
      if (focusedId === id) {
        // Already focused -> Navigate to scenes
        router.push(`/projects/${project.id}/episodes/${id}/scenes`);
      } else {
        // Select & Focus
        setSelectedId(id);
        setFocusedId(id);
      }
    },
    [focusedId, project.id, router]
  );

  const handleStripSelect = useCallback((id: string) => {
    // Single click thumbnail -> Select only (no focus)
    setSelectedId(id);
  }, []);

  const handleStripOpenManage = useCallback(
    (id: string) => {
      // Double click thumbnail -> Navigate to Manage
      router.push(`/projects/${project.id}/episodes/${id}/manage`);
    },
    [project.id, router]
  );

  const handleDeleteSelected = async () => {
    if (!selectedId) return;
    try {
      await deleteEpisodeV2(selectedId);
      setEpisodes((prev) => prev.filter((e) => e.id !== selectedId));
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

  const handleCreateEpisode = async (data: {
    projectId: string;
    episodeName: string;
    code?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const newEp = await createEpisodeV2(data);
    setEpisodes((prev) => [...prev, newEp]);
    setSelectedId(newEp.id);
    setFocusedId(newEp.id);
  };

  const focusedEpisode = episodes.find((e) => e.id === focusedId);

  // Layout error state
  if (errorMsg) {
    return (
      <CanvasShell
        nav={<VerticalNav active="project" />}
        tools={<TransformTools actions={toolActions} />}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[var(--color-panel,#f0f0f0)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] p-8 max-w-md">
            <p className="text-[var(--text-section,18px)] text-[var(--color-ink,#000000)] font-medium mb-4">
              Error Loading Episodes
            </p>
            <p className="text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)] mb-6">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] text-[var(--text-caption,11px)] font-medium rounded-[var(--radius-sm,3px)] cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </CanvasShell>
    );
  }

  return (
    <CanvasShell
      nav={<VerticalNav active="project" />}
      tools={<TransformTools actions={toolActions} />}
      list={
        <ListPanel
          items={listItems}
          selectedId={selectedId}
          onSelect={handleListSelect}
          emptyLabel="No episodes"
        />
      }
    >
      <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        {/* Main Canvas rendering parent project line and 0.5px hairline branches */}
        <TimelineCanvas
          items={timelineCanvasItems}
          selectedId={null}
          focusedId={null}
          mode="absolute"
          onSelect={() => {}}
          onOpen={() => {}}
          renderBranches={() => (
            <>
              {branchPaths.map((bp) => {
                const isSelected = bp.id === selectedId;
                const isFocused = bp.id === focusedId;
                const isDimmed = focusedId !== null && !isFocused;

                return (
                  <TimelineBranch
                    key={bp.id}
                    id={bp.id}
                    from={bp.from}
                    to={bp.to}
                    selected={isSelected || isFocused}
                    dimmed={isDimmed}
                    onSelect={handleBranchSelect}
                    onOpen={handleBranchOpen}
                  />
                );
              })}
            </>
          )}
        />

        {/* Focus Card Overlay when Episode is Focused */}
        {focusedEpisode && (
          <div
            aria-label="Focused Episode Details"
            className="absolute z-30 pointer-events-auto transition-all duration-500 ease-out"
            style={{
              left: "calc((343.5 / 1920) * 100%)",
              top: "calc((201 / 1080) * 100%)",
            }}
          >
            <FocusCard
              title={focusedEpisode.code || focusedEpisode.episodeName}
              creationDate={focusedEpisode.createdAt}
              description={focusedEpisode.description}
              thumbnailUrl={focusedEpisode.previewImage}
            />
          </div>
        )}

        {/* Main Tasks Panel (Figma 70:412) shown when an episode is focused */}
        {focusedId && (
          <aside
            aria-label="Main Tasks Panel"
            className="absolute z-30 pointer-events-auto w-[124px] bg-[var(--color-panel,#f0f0f0)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] shadow-lg overflow-hidden transition-all duration-300 font-sans"
            style={{
              left: "calc((1769.4 / 1920) * 100%)",
              top: "calc((223.4 / 1080) * 100%)",
              height: "414px",
            }}
          >
            {/* Header bar */}
            <div className="h-[36px] px-3 flex items-center border-b border-[var(--color-line-soft,#a9a9a9)] bg-[var(--color-panel,#f0f0f0)]">
              <span className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink,#000000)] tracking-tight">
                Main Tasks
              </span>
            </div>

            {/* Task list body */}
            <div className="p-2 flex flex-col gap-3 relative h-[378px] overflow-y-auto">
              {/* Hairline vertical rail */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[0.5px] bg-[var(--color-line,#000000)] pointer-events-none" />

              {isLoadingTasks ? (
                <div className="py-6 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-mono">
                  Loading...
                </div>
              ) : mainTasks.length === 0 ? (
                <div className="py-6 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]">
                  No tasks
                </div>
              ) : (
                mainTasks.map((task) => (
                  <div key={task.id} className="relative pl-4 flex flex-col gap-1">
                    {/* Row Dot */}
                    <div className="absolute left-[5px] top-1.5 w-[5px] h-[5px] rounded-full bg-[var(--color-ink,#000000)] -translate-x-1/2" />

                    <div className="flex flex-row items-center justify-between">
                      <span className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)] truncate max-w-[80px]">
                        {task.name}
                      </span>
                      <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink-muted,#707070)]">
                        {task.progress}%
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-[110px] h-[4px] bg-[var(--color-line-soft,#a9a9a9)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-progress,#000000)] transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
                      />
                    </div>

                    <span className="text-[9px] font-mono text-[var(--color-ink-muted,#707070)] truncate">
                      Last commit 2d ago
                    </span>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* Bottom Episode Strip Picker */}
        <EpisodeStrip
          items={stripItems}
          selectedId={selectedId}
          onSelect={handleStripSelect}
          onOpenManage={handleStripOpenManage}
        />

        {/* Create Episode Dialog */}
        <EpisodeFormDialog
          isOpen={isCreateOpen}
          projectId={project.id}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateEpisode}
        />
      </div>
    </CanvasShell>
  );
};

export default EpisodesView;
