"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useTimelineScale, { type TimelineRange } from "@/lib/timeline/useTimelineScale";
import {
  BOARD_GUTTER,
  PANEL_MIN_WIDTH,
  PANEL_MAX_WIDTH,
  PANEL_TOP_BAR_HEIGHT,
  PANEL_HEIGHT,
  MEASURE_BAR_HEIGHT,
  MEASURE_TICK_HEIGHT,
  HAIRLINE,
  CARD_SHADOW,
} from "@/lib/design/boardTokens";
import EpisodeStatusGraph from "@/components/projects/graphs/EpisodeStatusGraph";
import CommitGraph from "@/components/projects/graphs/CommitGraph";
import AssetStatsGraph from "@/components/projects/graphs/AssetStatsGraph";
import ReviewsGraph from "@/components/projects/graphs/ReviewsGraph";
import { GRAPH_SIZES, DEFAULT_GRAPH_LAYOUT, type GraphId } from "@/lib/design/boardTokens";
import type {
  ProjectV2,
  ProjectBoardStats,
  GraphPosition,
  BoardLayout,
} from "@/types/production-v2";
import { EMPTY_PROJECT_BOARD_STATS, GRAPH_IDS } from "@/types/production-v2";
import { updateProjectBoardLayout } from "@/app/actions/production";

/** Card positions now live in DEFAULT_GRAPH_LAYOUT and projects.board_layout. */
type PanelLayout = Record<GraphId, GraphPosition>;

/** Milliseconds a drop waits before persisting, so rapid nudges collapse. */
const LAYOUT_WRITE_DEBOUNCE_MS = 500;

/**
 * Handed to useTimelineScale, which uses it only to build lengthById — a value
 * this component ignores. Panel width comes from WIDTH_SCALE below.
 */
const PIXELS_PER_DAY = 5.8;

/**
 * Panel width grows with the SQUARE ROOT of duration, not linearly.
 *
 * A linear mapping saturated at both rails: at 5.8px/day every project under
 * ~55 days floored at PANEL_MIN_WIDTH and every project over ~124 days capped
 * at PANEL_MAX_WIDTH, so most real projects rendered at one of two identical
 * widths and duration stopped being readable at all.
 *
 * sqrt compresses the long tail instead of clipping it early, which keeps
 * short and medium durations distinct (7d -> 399px, 30d -> 484px,
 * 90d -> 605px) and pushes the cap out from ~124 to ~178 days.
 *
 * Do NOT "simplify" this back to a linear multiply.
 */
const WIDTH_SCALE = 30; // px per sqrt(day)

/** Movement past this many px is a pan, not a click. */
const DRAG_THRESHOLD_PX = 4;

/** Both hairline borders of the panel, subtracted to get the body's width. */
const PANEL_BORDER_TOTAL = 1;

/** Inset either end of the row so the first and last panel are not flush. */
const ROW_PADDING_X = BOARD_GUTTER;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 34 -> "4W 6Days", 14 -> "2W", 5 -> "5Days".
 * A project with no start date has no measurable duration.
 */
function formatDuration(durationDays: number, hasStartDate: boolean): string {
  if (!hasStartDate) return "No dates";

  const weeks = Math.floor(durationDays / 7);
  const days = durationDays % 7;

  if (weeks > 0 && days > 0) return weeks + "W " + days + "Days";
  if (weeks > 0) return weeks + "W";
  return days + "Days";
}

/**
 * The panel body, and the four graph cards inside it.
 *
 * Dimensions are measured with a ResizeObserver, seeded from the deterministic
 * panel geometry so clamping holds from the very first paint. The same bounds
 * clamp both the resting positions and every drag frame — there is exactly one
 * clamp in this component.
 */
const PanelBody: React.FC<{
  stats: ProjectBoardStats;
  panelWidth: number;
  layout: PanelLayout;
  /** Fired continuously while dragging. */
  onLayoutChange: (next: PanelLayout) => void;
  /** Fired once on drop, after z has been normalised. */
  onCommit: (layout: PanelLayout) => void;
}> = ({ stats, panelWidth, layout, onLayoutChange, onCommit }) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Deterministic bounds, known before layout. The body carries no padding, so
  // its width is the panel width less the two hairline borders; its height is
  // the fixed panel height less those borders and the top bar. The header sits
  // inside that height, so this seed is a slight over-estimate that the
  // observer tightens — never an under-estimate that would let a card escape.
  const seed = useMemo(
    () => ({
      width: Math.max(0, panelWidth - PANEL_BORDER_TOTAL),
      height: Math.max(0, PANEL_HEIGHT - PANEL_BORDER_TOTAL - PANEL_TOP_BAR_HEIGHT),
    }),
    [panelWidth]
  );

  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      // A zero reading means the element is not laid out yet. Ignore it and
      // keep the seed: ResizeObserver only fires again when the size CHANGES,
      // so accepting-or-discarding must never leave the bounds unset.
      if (rect && rect.width > 0 && rect.height > 0) {
        setMeasured({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Take the tighter of the two on each axis, so the clamp is never looser
  // than the deterministic bound even if a measurement is stale or wrong.
  const box = {
    width: measured ? Math.min(seed.width, measured.width) : seed.width,
    height: measured ? Math.min(seed.height, measured.height) : seed.height,
  };

  /** The single source of clamp bounds, shared by resting and dragging. */
  const boundsFor = (id: GraphId) => ({
    maxX: Math.max(0, box.width - GRAPH_SIZES[id].width),
    maxY: Math.max(0, box.height - GRAPH_SIZES[id].height),
  });

  const dragRef = useRef<{
    id: GraphId;
    pointerX: number;
    pointerY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<GraphId | null>(null);

  const handlePointerDown =
    (id: GraphId) => (e: React.PointerEvent<HTMLDivElement>) => {
      // The row's pan handler must never see this, or dragging a card would
      // slide the whole row underneath it.
      e.stopPropagation();

      const spot = layout[id];
      dragRef.current = {
        id,
        pointerX: e.clientX,
        pointerY: e.clientY,
        originX: spot.x,
        originY: spot.y,
      };
      setDraggingId(id);
      e.currentTarget.setPointerCapture(e.pointerId);

      // Raise above every other card in this panel.
      const maxZ = GRAPH_IDS.reduce((m, k) => Math.max(m, layout[k].z), 0);
      onLayoutChange({ ...layout, [id]: { ...spot, z: maxZ + 1 } });
    };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const { maxX, maxY } = boundsFor(drag.id);
    onLayoutChange({
      ...layout,
      [drag.id]: {
        ...layout[drag.id],
        x: clamp(drag.originX + (e.clientX - drag.pointerX), 0, maxX),
        y: clamp(drag.originY + (e.clientY - drag.pointerY), 0, maxY),
      },
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    setDraggingId(null);

    // Renumber 1..4 in the current stacking order so z never grows unbounded.
    const ordered = [...GRAPH_IDS].sort((a, b) => layout[a].z - layout[b].z);
    const normalised: PanelLayout = { ...layout };
    ordered.forEach((k, i) => {
      normalised[k] = { ...layout[k], z: i + 1 };
    });

    onLayoutChange(normalised);
    onCommit(normalised);
  };

  const cards: { id: GraphId; node: React.ReactNode }[] = [
    {
      id: "episodeStatus",
      node: <EpisodeStatusGraph episodeStatus={stats.episodeStatus} />,
    },
    { id: "assets", node: <AssetStatsGraph assets={stats.assets} /> },
    { id: "reviews", node: <ReviewsGraph /> },
    { id: "commits", node: <CommitGraph commitDays={stats.commitDays} /> },
  ];

  return (
    <div
      ref={bodyRef}
      data-panel-body
      className="relative flex-1 min-h-0 overflow-hidden"
    >
      {cards.map(({ id, node }) => {
        const spot = layout[id];
        const { maxX, maxY } = boundsFor(id);

        return (
          <div
            key={id}
            onPointerDown={handlePointerDown(id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            // Double-clicking a card must not open the episodes page.
            onDoubleClick={(e) => e.stopPropagation()}
            className={draggingId === id ? "cursor-grabbing" : "cursor-grab"}
            style={{
              position: "absolute",
              left: clamp(spot.x, 0, maxX),
              top: clamp(spot.y, 0, maxY),
              zIndex: spot.z,
              touchAction: "none",
            }}
          >
            {node}
          </div>
        );
      })}
    </div>
  );
};

export type ProjectBoardRowProps = {
  projects: ProjectV2[];
  onOpen: (id: string) => void;
  /** Keyed by project id. Projects absent from the views fall back to zeroes. */
  stats: Record<string, ProjectBoardStats>;
  /** Selection lives in the parent because the SUB tool acts on it. */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Surfaced when a layout write fails. The card keeps its new position. */
  onError?: (message: string) => void;
};

export const ProjectBoardRow: React.FC<ProjectBoardRowProps> = ({
  projects,
  onOpen,
  stats,
  selectedId = null,
  onSelect,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  // Layout state, keyed by project id. Only projects the user has actually
  // moved get an entry; everything else derives from the project's persisted
  // boardLayout over DEFAULT_GRAPH_LAYOUT, so newly created projects need no
  // seeding pass.
  const [layoutOverrides, setLayoutOverrides] = useState<
    Record<string, PanelLayout>
  >({});

  const layoutFor = useCallback(
    (project: ProjectV2): PanelLayout =>
      layoutOverrides[project.id] ?? {
        ...DEFAULT_GRAPH_LAYOUT,
        ...project.boardLayout,
      },
    [layoutOverrides]
  );

  // Debounced persistence. Timers and payloads live in refs so a re-render
  // mid-drag cannot drop a pending write.
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingRef = useRef<Record<string, PanelLayout>>({});
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const flushWrite = useCallback((projectId: string) => {
    const layout = pendingRef.current[projectId];
    if (!layout) return;

    delete pendingRef.current[projectId];
    delete timersRef.current[projectId];

    // On failure the local position is kept deliberately — snapping a card
    // back to where it was would read as the drag itself having failed.
    void updateProjectBoardLayout(projectId, layout as BoardLayout).catch(
      (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        onErrorRef.current?.("Failed to save board layout: " + msg);
      }
    );
  }, []);

  const scheduleWrite = useCallback(
    (projectId: string, layout: PanelLayout) => {
      pendingRef.current[projectId] = layout;
      const existing = timersRef.current[projectId];
      if (existing) clearTimeout(existing);
      timersRef.current[projectId] = setTimeout(() => {
        flushWrite(projectId);
      }, LAYOUT_WRITE_DEBOUNCE_MS);
    },
    [flushWrite]
  );

  // Any drop still inside the debounce window when the board unmounts must
  // still reach the database.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const projectId of Object.keys(timers)) {
        clearTimeout(timers[projectId]);
      }
      for (const projectId of Object.keys(pendingRef.current)) {
        flushWrite(projectId);
      }
    };
  }, [flushWrite]);

  // Pan gesture state lives in refs, not state: it changes on every
  // pointermove and must not drive a re-render of its own.
  const dragStartRef = useRef<{ x: number; tx: number } | null>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width > 0) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ranges: TimelineRange[] = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    [projects]
  );

  // Only durationDaysById is used here. The hook's lengthById floors at 478px
  // in absolute mode, which is wider than PANEL_MIN_WIDTH, so panel widths are
  // derived from the raw day counts instead.
  const { durationDaysById } = useTimelineScale(ranges, {
    mode: "absolute",
    viewportWidth: containerWidth || PANEL_MIN_WIDTH,
    pixelsPerDay: PIXELS_PER_DAY,
  });

  const panels = useMemo(
    () =>
      projects.map((project) => {
        const durationDays = durationDaysById[project.id] ?? 0;
        const width = project.startDate
          ? clamp(
              PANEL_MIN_WIDTH + Math.sqrt(durationDays) * WIDTH_SCALE,
              PANEL_MIN_WIDTH,
              PANEL_MAX_WIDTH
            )
          : PANEL_MIN_WIDTH;
        return {
          project,
          durationDays,
          width: Math.round(width),
          label: formatDuration(durationDays, Boolean(project.startDate)),
        };
      }),
    [projects, durationDaysById]
  );

  const rowWidth = useMemo(() => {
    if (panels.length === 0) return 0;
    const panelsWidth = panels.reduce((sum, p) => sum + p.width, 0);
    const gutters = BOARD_GUTTER * (panels.length - 1);
    return panelsWidth + gutters + ROW_PADDING_X * 2;
  }, [panels]);

  const canPan = containerWidth > 0 && rowWidth > containerWidth;
  const minTranslateX = canPan ? containerWidth - rowWidth : 0;

  // A row that stops overflowing must not stay parked off-screen.
  useEffect(() => {
    if (!canPan) {
      setTranslateX(0);
      return;
    }
    setTranslateX((tx) => clamp(tx, minTranslateX, 0));
  }, [canPan, minTranslateX]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      didDragRef.current = false;
      if (!canPan) return;
      dragStartRef.current = { x: e.clientX, tx: translateX };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [canPan, translateX]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current;
      if (!start) return;

      // Vertical movement is ignored by design; only the X delta is applied.
      const dx = e.clientX - start.x;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
        didDragRef.current = true;
      }
      setTranslateX(clamp(start.tx + dx, minTranslateX, 0));
    },
    [minTranslateX]
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragStartRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={
        "w-full h-full relative overflow-hidden select-none font-sans " +
        (canPan ? "cursor-grab" : "")
      }
    >
      <div
        className="absolute top-0 left-0 h-full flex flex-row items-start"
        style={{
          transform: "translateX(" + translateX + "px)",
          paddingLeft: ROW_PADDING_X + "px",
          paddingRight: ROW_PADDING_X + "px",
          gap: BOARD_GUTTER + "px",
        }}
      >
        {panels.map(({ project, width, label }) => {
          const isSelected = project.id === selectedId;

          return (
            <div
              key={project.id}
              style={{ width: width + "px" }}
              className="flex flex-col shrink-0"
            >
              {/* Measurement bar — spans exactly this panel's width. */}
              <div
                aria-hidden="true"
                className="relative shrink-0"
                style={{ height: MEASURE_BAR_HEIGHT + "px" }}
              >
                <div
                  className="absolute left-0 right-0"
                  style={{
                    top: "50%",
                    height: HAIRLINE,
                    backgroundColor: "var(--color-line, #000000)",
                  }}
                />
                <div
                  className="absolute left-0"
                  style={{
                    top: "50%",
                    width: HAIRLINE,
                    height: MEASURE_TICK_HEIGHT + "px",
                    backgroundColor: "var(--color-line, #000000)",
                  }}
                />
                <div
                  className="absolute right-0"
                  style={{
                    top: "50%",
                    width: HAIRLINE,
                    height: MEASURE_TICK_HEIGHT + "px",
                    backgroundColor: "var(--color-line, #000000)",
                  }}
                />
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-2"
                  style={{
                    fontSize: "var(--text-caption, 11px)",
                    color: "var(--color-ink, #000000)",
                    backgroundColor: "var(--color-canvas, #ffffff)",
                  }}
                >
                  {label}
                </span>
              </div>

              {/* Panel */}
              <div
                onClick={() => {
                  if (didDragRef.current) return;
                  onSelect?.(project.id);
                }}
                onDoubleClick={() => {
                  if (didDragRef.current) return;
                  onOpen(project.id);
                }}
                className="shrink-0 flex flex-col overflow-hidden"
                style={{
                  height: PANEL_HEIGHT + "px",
                  backgroundColor: "var(--color-panel, #ffffff)",
                  border: HAIRLINE + " solid var(--color-line-soft, #a9a9a9)",
                  borderRadius: "var(--radius-card, 7px)",
                  boxShadow: CARD_SHADOW,
                  outline: isSelected
                    ? "1px solid var(--color-ink, #000000)"
                    : undefined,
                }}
              >
                {/* Solid bar flush with the panel's top edge. */}
                <div
                  aria-hidden="true"
                  className="w-full shrink-0"
                  style={{
                    height: PANEL_TOP_BAR_HEIGHT + "px",
                    backgroundColor: "var(--color-ink, #000000)",
                  }}
                />

                {/* Header */}
                <div className="flex flex-row items-center gap-3 shrink-0 pt-[14px] pl-[14px] pr-[14px]">
                  <span
                    className="font-medium truncate"
                    style={{
                      fontSize: "var(--text-section, 18px)",
                      color: "var(--color-ink, #000000)",
                    }}
                  >
                    {project.title}
                  </span>

                  <span
                    aria-hidden="true"
                    className="shrink-0 self-stretch"
                    style={{
                      width: HAIRLINE,
                      backgroundColor: "var(--color-line-soft, #a9a9a9)",
                    }}
                  />

                  <span
                    className="shrink-0"
                    style={{
                      fontSize: "var(--text-caption, 11px)",
                      color: "var(--color-ink, #000000)",
                    }}
                  >
                    {project.projectCode}
                  </span>

                  <span
                    aria-hidden="true"
                    className="shrink-0 self-stretch"
                    style={{
                      width: HAIRLINE,
                      backgroundColor: "var(--color-line-soft, #a9a9a9)",
                    }}
                  />

                  <span
                    className="truncate"
                    style={{
                      fontSize: "var(--text-caption, 11px)",
                      color: "var(--color-ink-muted, #707070)",
                    }}
                  >
                    {project.description}
                  </span>
                </div>

                <PanelBody
                  stats={stats[project.id] ?? EMPTY_PROJECT_BOARD_STATS}
                  panelWidth={width}
                  layout={layoutFor(project)}
                  onLayoutChange={(next) =>
                    setLayoutOverrides((prev) => ({
                      ...prev,
                      [project.id]: next,
                    }))
                  }
                  onCommit={(next) => scheduleWrite(project.id, next)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectBoardRow;
