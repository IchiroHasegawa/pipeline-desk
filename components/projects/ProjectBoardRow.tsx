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
import { GRAPH_SIZES } from "@/lib/design/boardTokens";
import type { ProjectV2, ProjectBoardStats } from "@/types/production-v2";
import { EMPTY_PROJECT_BOARD_STATS } from "@/types/production-v2";

/**
 * Fixed graph placement inside the panel body. Cards overlap at corners by
 * 20-70px rather than face-on, so no card occludes another's content. Total
 * extent is 430px wide by 640px tall, which fits inside PANEL_HEIGHT.
 *
 *   episodeStatus 200x260 -> 20-220,  24-284
 *   commits       280x170 -> 150-430, 210-380
 *   assets        190x240 -> 34-224,  320-560
 *   reviews       170x210 -> 246-416, 430-640
 *
 * Phase 3 replaces these defaults with persisted positions from
 * projects.board_layout.
 */
const GRAPH_PLACEMENT = {
  episodeStatus: { x: 20, y: 24, z: 1 },
  commits: { x: 150, y: 210, z: 3 },
  assets: { x: 34, y: 320, z: 2 },
  reviews: { x: 246, y: 430, z: 1 },
} as const;

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
 * Its own dimensions are measured with a ResizeObserver rather than derived
 * from the panel's outer width: the outer width includes the border, and the
 * body's height depends on the header, which wraps with the project title.
 * Clamping against anything else lets cards escape the box.
 */
const PanelBody: React.FC<{ stats: ProjectBoardStats }> = ({ stats }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setBox({ width: rect.width, height: rect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Unconditional and two-dimensional: a card can never leave the body on
  // either axis, at any panel width. Before the first measurement the raw
  // position is used — overflow:hidden covers that single frame.
  const place = (
    spot: { x: number; y: number; z: number },
    graphWidth: number,
    graphHeight: number
  ): React.CSSProperties => ({
    position: "absolute",
    left: box ? clamp(spot.x, 0, Math.max(0, box.width - graphWidth)) : spot.x,
    top: box ? clamp(spot.y, 0, Math.max(0, box.height - graphHeight)) : spot.y,
    zIndex: spot.z,
  });

  return (
    <div
      ref={bodyRef}
      data-panel-body
      className="relative flex-1 min-h-0 overflow-hidden"
    >
      <div
        style={place(
          GRAPH_PLACEMENT.episodeStatus,
          GRAPH_SIZES.episodeStatus.width,
          GRAPH_SIZES.episodeStatus.height
        )}
      >
        <EpisodeStatusGraph episodeStatus={stats.episodeStatus} />
      </div>

      <div
        style={place(
          GRAPH_PLACEMENT.assets,
          GRAPH_SIZES.assets.width,
          GRAPH_SIZES.assets.height
        )}
      >
        <AssetStatsGraph assets={stats.assets} />
      </div>

      <div
        style={place(
          GRAPH_PLACEMENT.reviews,
          GRAPH_SIZES.reviews.width,
          GRAPH_SIZES.reviews.height
        )}
      >
        <ReviewsGraph />
      </div>

      <div
        style={place(
          GRAPH_PLACEMENT.commits,
          GRAPH_SIZES.commits.width,
          GRAPH_SIZES.commits.height
        )}
      >
        <CommitGraph commitDays={stats.commitDays} />
      </div>
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
};

export const ProjectBoardRow: React.FC<ProjectBoardRowProps> = ({
  projects,
  onOpen,
  stats,
  selectedId = null,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [translateX, setTranslateX] = useState(0);

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
