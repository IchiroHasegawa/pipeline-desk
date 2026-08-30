"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ListPanel, { ListPanelItem } from "@/components/shell/ListPanel";

import TimelineCanvas from "@/components/timeline/TimelineCanvas";
import TimelineBranch from "@/components/timeline/TimelineBranch";
import BoundingBoxLayer from "@/components/timeline/BoundingBoxLayer";
import OriginDot from "@/components/timeline/OriginDot";
import WorldLayer from "@/components/shell/WorldLayer";
import EpisodeStrip, { EpisodeStripItem } from "@/components/episodes/EpisodeStrip";
import EpisodeFormDialog from "@/components/episodes/EpisodeFormDialog";
import MainTasksPanel from "@/components/shared/MainTasksPanel";

import {
  resolveEpisodeBranchPaths,
  computeEpisodeBoundingBox,
  toSegment,
  IDENTITY_TRANSFORM,
  Point,
  type CanvasTransform,
} from "@/lib/timeline/timelineGeometry";
import {
  createEpisodeV2,
  deleteEpisodeV2,
  getMainTasksForEpisode,
} from "@/app/actions/production";
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
  const [, setViewportWidth] = useState(1440);

  const [episodes, setEpisodes] = useState<EpisodeV2[]>(initialEpisodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  // Lazy loaded main tasks for focused episode
  const [mainTasks, setMainTasks] = useState<MainTaskV2[]>([]);

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
        const tasks = await getMainTasksForEpisode(focusedId);
        if (!cancelled) {
          setMainTasks(tasks);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Failed to load main tasks:", err);
        }
      }
    }
    loadTasks();
    return () => {
      cancelled = true;
    };
  }, [focusedId]);

  // §3.3 — the project detail anchored on the origin dot.
  const [isOriginOpen, setIsOriginOpen] = useState(false);

  // §3.1 — dev-only bounding-box overlay, toggled with Shift+B. The guard
  // is `process.env.NODE_ENV`, which is statically replaced at build time,
  // so neither the state nor the listener survives a production build.
  const [showBoundingBox, setShowBoundingBox] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "B" || e.key === "b")) {
        setShowBoundingBox((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // §3.6 — mirrored out of the canvas so the dot grid follows canvas pans
  // only. Dragging the project line leaves this untouched, so the grid,
  // the bottom episode rail and the floating panels all stay put.
  const [gridTransform, setGridTransform] =
    useState<CanvasTransform>(IDENTITY_TRANSFORM);

  // Parent project line geometry — DESIGN_SPEC §5: bbox 981 × 408.5 at
  // (457, 317.5), so the line runs from (457, 726) up-right at 22.61°.
  const parentOrigin: Point = useMemo(() => ({ x: 457, y: 726 }), []);
  const parentLength = 1062.7;
  const parentAngleDeg = 22.61;

  const parentSegment = useMemo(
    () => toSegment(parentOrigin, parentLength, parentAngleDeg),
    [parentOrigin, parentLength, parentAngleDeg]
  );

  // §3.4 — junctions come from EPISODE_ATTACH_* via getAttachmentPoint.
  const branchPaths = useMemo(() => {
    return resolveEpisodeBranchPaths(
      parentOrigin,
      parentLength,
      parentAngleDeg,
      episodes
    );
  }, [parentOrigin, parentLength, parentAngleDeg, episodes]);

  // §3.1 — width is the project line's full extent (its fade reaches zero
  // at its own end); height is the span from the topmost branch above the
  // line to the bottommost below it.
  const boundingBox = useMemo(
    () => computeEpisodeBoundingBox(parentSegment, branchPaths),
    [parentSegment, branchPaths]
  );

  const timelineCanvasItems = useMemo(() => {
    return [
      {
        id: project.id,
        length: parentLength,
        label: project.title,
        origin: parentOrigin,
        angleDeg: parentAngleDeg,
      },
    ];
  }, [project, parentLength, parentOrigin, parentAngleDeg]);

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
    setSelectedId(id);
    setFocusedId(id);
  }, []);

  const handleBranchSelect = useCallback(
    (id: string) => {
      if (selectedId === id) {
        setFocusedId(id);
      } else {
        setSelectedId(id);
      }
    },
    [selectedId]
  );

  const handleBranchOpen = useCallback(
    (id: string) => {
      if (focusedId === id) {
        router.push(`/projects/${project.id}/episodes/${id}/scenes`);
      } else {
        setSelectedId(id);
        setFocusedId(id);
      }
    },
    [focusedId, project.id, router]
  );

  const handleStripSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleStripOpenManage = useCallback(
    (id: string) => {
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
    jobWorkflowId?: string;
    sceneWorkflowId?: string;
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
          <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-[var(--radius-card,7px)] p-8 max-w-md shadow-sm">
            <p className="text-[var(--text-section,18px)] text-[var(--color-ink)] font-medium mb-4">
              Error Loading Episodes
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

  return (
    <CanvasShell
      nav={<VerticalNav active="project" />}
      tools={<TransformTools actions={toolActions} />}
      toolsPosition={{ x: 101.5, y: 87 }}
      gridTransform={gridTransform}
      list={
        <ListPanel
          items={listItems}
          selectedId={selectedId}
          onSelect={handleListSelect}
          emptyLabel="No episodes"
        />
      }
    >
      <div ref={containerRef} className="w-full h-full relative overflow-hidden select-none font-sans">
        {/* §3.2 — autoCenter puts the project line at the centre of the
            display. It does not need to be centred within the box. */}
        <TimelineCanvas
          items={timelineCanvasItems}
          selectedId={null}
          focusedId={null}
          onSelect={() => {}}
          onOpen={() => {}}
          autoCenter
          onCanvasTransformChange={setGridTransform}
          // §3.1 — every line inside the layer is clipped to the box and
          // fades at its edges. Branches are children of the project line,
          // so they translate with it and stay attached at the junction.
          wrapLineLayer={(content) => (
            <BoundingBoxLayer box={boundingBox} debug={showBoundingBox}>
              {content}
            </BoundingBoxLayer>
          )}
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
        >
          {/* §3.3 — sits at t = 0 inside the line's transform group, so it
              is off-screen until the line is dragged far enough to reveal
              it, then travels with the line. */}
          <OriginDot
            at={parentOrigin}
            open={isOriginOpen}
            onToggle={() => setIsOriginOpen((v) => !v)}
            title={project.projectCode || project.title}
            creationDate={project.createdAt}
            description={project.description}
          />
        </TimelineCanvas>

        {/* Spec B4 Focus Card Overlay when Episode is Focused — in world
            space so its measured design coordinates line up with the canvas
            at any window size. */}
        {focusedEpisode && (
          <WorldLayer>
          <div aria-label="Focused Episode Details" className="absolute inset-0 pointer-events-none">
            {/* Episode Title (343.5, 201), size 680 x 126 */}
            <div className="absolute left-[343.5px] top-[201px] w-[680px] h-[126px] flex items-baseline pointer-events-auto">
              <h1 className="text-[142px] font-sans font-normal text-[var(--color-ink,#000000)] tracking-tighter leading-none truncate">
                {focusedEpisode.code || focusedEpisode.episodeName}
              </h1>
            </div>

            {/* Creation Date at (636.5, 400), size 147 x 88 */}
            <div className="absolute left-[636.5px] top-[400px] w-[147px] h-[88px] flex items-start pointer-events-auto">
              <p className="text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)] font-sans font-medium tracking-wide">
                Creation Date - {new Date(focusedEpisode.createdAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
              </p>
            </div>

            {/* Description at (343.5, 447), size 257 x 395 */}
            <div className="absolute left-[343.5px] top-[447px] w-[257px] h-[395px] overflow-auto pointer-events-auto">
              <p className="text-[var(--text-list,12px)] text-[var(--color-ink,#000000)] font-sans leading-relaxed">
                {focusedEpisode.description || "No description available."}
              </p>
            </div>

            {/* Connector line (68.5 x 130.5, 0.5px stroke) at (1115.5, 435.5) */}
            <div className="absolute left-[1115.5px] top-[435.5px] w-[68.5px] h-[130.5px] pointer-events-none">
              <svg width="68.5" height="130.5" viewBox="0 0 68.5 130.5" fill="none">
                <path d="M0 0L68.5 130.5" stroke="var(--color-line,#000000)" strokeWidth="0.5" />
              </svg>
            </div>

            {/* Thumbnail collage (424 x 469) at (1184.5, 547) */}
            <div className="absolute left-[1184.5px] top-[547px] w-[424px] h-[469px] rounded-[var(--radius-card,7px)] overflow-hidden bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)] pointer-events-auto flex items-center justify-center shadow-md">
              {focusedEpisode.previewImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={focusedEpisode.previewImage} alt={focusedEpisode.episodeName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--color-placeholder,#d9d9d9)] flex items-center justify-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-mono">
                  EPISODE COLLAGE (424 × 469)
                </div>
              )}
            </div>
          </div>
          </WorldLayer>
        )}

        {/* Spec C Main Tasks Panel at (1766, 225) shown when an episode is focused */}
        {focusedId && (
          <MainTasksPanel mainTasks={mainTasks} />
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
