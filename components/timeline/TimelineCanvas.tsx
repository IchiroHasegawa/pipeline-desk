"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import TimelineLine from "@/components/timeline/TimelineLine";
import TimelineGlow from "@/components/timeline/TimelineGlow";
import {
  lineEndpoint,
  getProjectLineOrigin,
  getProjectLineAngle,
  transformToSvg,
  worldToView,
  resolveThumbnailConnector,
  clamp,
  IDENTITY_TRANSFORM,
  MIN_CANVAS_SCALE,
  MAX_CANVAS_SCALE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  WORLD_CENTER,
  BRANCH_STROKE_WIDTH,
  type CanvasTransform,
  type LineSegment,
  type Point,
  type ThumbnailConnectorSpec,
} from "@/lib/timeline/timelineGeometry";

export type TimelineCanvasItem = {
  id: string;
  length: number;
  label: string;
  origin?: Point;
  angleDeg?: number;
};

export type TimelineCanvasProps = {
  items: TimelineCanvasItem[];
  selectedId: string | null;
  focusedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  renderBranches?: (itemId: string) => React.ReactNode;

  /** First item of the foreground window. Items outside it render as ghosts. */
  windowStart?: number;
  /** Foreground window size. Pass Infinity to render every item in front. */
  windowSize?: number;

  /** Centre the visible lines once, on mount. */
  autoCenter?: boolean;
  /** Ease the selected line to the display centre when selection changes. */
  centerOnSelect?: boolean;

  /** False in focus mode — the line stops being draggable and loses its cursor. */
  lineDragEnabled?: boolean;
  canvasDragEnabled?: boolean;

  /** Mirrors the canvas layer's transform out so the dot grid can follow it. */
  onCanvasTransformChange?: (transform: CanvasTransform) => void;

  /** Draws a connector from `connectorItemId`'s line to a fixed thumbnail. */
  connector?: ThumbnailConnectorSpec;
  connectorItemId?: string | null;

  /** Extra content inside the line layer, e.g. the Episode page's origin dot. */
  children?: React.ReactNode;
  /**
   * Wraps everything inside the line layer. The Episode page uses this to
   * apply its bounding-box clip + edge-fade mask, so the boundary travels
   * with the lines instead of being pinned to the viewport.
   */
  wrapLineLayer?: (content: React.ReactNode) => React.ReactNode;
  /** Rendered untransformed, above everything — debug overlays. */
  overlay?: React.ReactNode;
};

const CENTER_TWEEN_MS = 260;
const DRAG_THRESHOLD_PX = 4;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const TimelineCanvasComponent: React.FC<TimelineCanvasProps> = ({
  items,
  selectedId,
  focusedId,
  onSelect,
  onOpen,
  renderBranches,
  windowStart = 0,
  windowSize = Number.POSITIVE_INFINITY,
  autoCenter = false,
  centerOnSelect = false,
  lineDragEnabled = true,
  canvasDragEnabled = true,
  onCanvasTransformChange,
  connector,
  connectorItemId,
  children,
  wrapLineLayer,
  overlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // §2.1 — two independent transform states. The dot grid follows
  // canvasTransform; the project-line assembly follows lineTransform.
  const [canvasTransform, setCanvasTransform] =
    useState<CanvasTransform>(IDENTITY_TRANSFORM);
  const [lineTransform, setLineTransform] =
    useState<CanvasTransform>(IDENTITY_TRANSFORM);

  // Mirrors of the two transforms for the pointer handlers, which need the
  // latest value without re-binding on every frame of a drag.
  const lineTransformRef = useRef(lineTransform);
  const canvasTransformRef = useRef(canvasTransform);
  useEffect(() => {
    lineTransformRef.current = lineTransform;
  }, [lineTransform]);
  useEffect(() => {
    canvasTransformRef.current = canvasTransform;
  }, [canvasTransform]);

  // Drag bookkeeping
  const dragRef = useRef<{
    layer: "canvas" | "line";
    startX: number;
    startY: number;
    origin: CanvasTransform;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Click / double-click discrimination (§2.6)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tween bookkeeping
  const tweenRef = useRef<number | null>(null);

  const cancelTween = useCallback(() => {
    if (tweenRef.current !== null) {
      cancelAnimationFrame(tweenRef.current);
      tweenRef.current = null;
    }
  }, []);

  const tweenLineTransform = useCallback(
    (target: CanvasTransform) => {
      cancelTween();
      const from = lineTransformRef.current;
      const startedAt = performance.now();

      const step = (now: number) => {
        const raw = Math.min(1, (now - startedAt) / CENTER_TWEEN_MS);
        const k = easeInOutCubic(raw);
        setLineTransform({
          x: from.x + (target.x - from.x) * k,
          y: from.y + (target.y - from.y) * k,
          scale: from.scale + (target.scale - from.scale) * k,
        });
        if (raw < 1) {
          tweenRef.current = requestAnimationFrame(step);
        } else {
          tweenRef.current = null;
        }
      };

      tweenRef.current = requestAnimationFrame(step);
    },
    [cancelTween]
  );

  useEffect(() => cancelTween, [cancelTween]);
  useEffect(
    () => () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    },
    []
  );

  // Resolve every line's geometry in world units.
  const itemLayouts = useMemo(() => {
    return items.map((item, index) => {
      const origin: Point = item.origin ?? getProjectLineOrigin(item.id);
      const angleDeg = item.angleDeg ?? getProjectLineAngle(item.id);
      const end = lineEndpoint(origin, item.length, angleDeg);
      return {
        ...item,
        origin,
        end,
        angleDeg,
        midpoint: { x: (origin.x + end.x) / 2, y: (origin.y + end.y) / 2 } as Point,
        segment: { x1: origin.x, y1: origin.y, x2: end.x, y2: end.y } as LineSegment,
        index,
      };
    });
  }, [items]);

  // §2.2 — only the window renders as foreground, interactive lines.
  const windowEnd = windowStart + windowSize;
  const foreground = useMemo(
    () => itemLayouts.filter((it) => it.index >= windowStart && it.index < windowEnd),
    [itemLayouts, windowStart, windowEnd]
  );
  const ghosts = useMemo(
    () => itemLayouts.filter((it) => it.index < windowStart || it.index >= windowEnd),
    [itemLayouts, windowStart, windowEnd]
  );

  const transformCenteringOn = useCallback(
    (target: Point, scale: number): CanvasTransform => ({
      x: WORLD_CENTER.x - target.x * scale,
      y: WORLD_CENTER.y - target.y * scale,
      scale,
    }),
    []
  );

  // §2.3 — one centring pass per mount, after the lines are known.
  // The ref guard is what stops a refetch, a resize or any re-render from
  // re-firing it and fighting the user's drag.
  const didAutoCenterRef = useRef(false);
  useLayoutEffect(() => {
    if (!autoCenter || didAutoCenterRef.current || foreground.length === 0) return;
    didAutoCenterRef.current = true;

    const xs = foreground.flatMap((it) => [it.origin.x, it.end.x]);
    const ys = foreground.flatMap((it) => [it.origin.y, it.end.y]);
    const center: Point = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };

    const next = transformCenteringOn(center, 1);
    setLineTransform(next);
    setCanvasTransform(IDENTITY_TRANSFORM);
  }, [autoCenter, foreground, transformCenteringOn]);

  // §2.5 — selecting a line eases it to the centre of the display.
  const lastCenteredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!centerOnSelect) return;
    if (!selectedId || selectedId === lastCenteredRef.current) {
      if (!selectedId) lastCenteredRef.current = null;
      return;
    }
    const target = itemLayouts.find((it) => it.id === selectedId);
    if (!target) return;
    lastCenteredRef.current = selectedId;
    tweenLineTransform(
      transformCenteringOn(target.midpoint, lineTransformRef.current.scale)
    );
  }, [centerOnSelect, selectedId, itemLayouts, tweenLineTransform, transformCenteringOn]);

  useEffect(() => {
    onCanvasTransformChange?.(canvasTransform);
  }, [canvasTransform, onCanvasTransformChange]);

  /* ---------------------------------------------------------------- *
   * Pointer handling
   * ---------------------------------------------------------------- */

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    // Cleared per gesture. Without this, a canvas drag that ends nowhere
    // near a line would leave the flag set and swallow the next genuine
    // line click.
    suppressClickRef.current = false;

    const target = e.target as Element | null;
    const overLine = Boolean(target?.closest?.("[data-line-hit='true']"));

    // §2.8 — in focus mode the line is not draggable, and a press on it
    // must not silently fall through to panning the canvas either.
    if (overLine) {
      if (!lineDragEnabled) return;
    } else if (!canvasDragEnabled) {
      return;
    }

    cancelTween();
    dragRef.current = {
      layer: overLine ? "line" : "canvas",
      startX: e.clientX,
      startY: e.clientY,
      origin: overLine ? lineTransformRef.current : canvasTransformRef.current,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dxScreen = e.clientX - drag.startX;
    const dyScreen = e.clientY - drag.startY;

    if (!drag.moved) {
      if (Math.hypot(dxScreen, dyScreen) < DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // capture is a nicety; dragging still works without it
      }
    }

    // Screen delta → world delta, so a drag tracks the cursor exactly at
    // any window size or aspect ratio.
    const rect = containerRef.current?.getBoundingClientRect();
    const unit = rect
      ? Math.min(rect.width / WORLD_WIDTH, rect.height / WORLD_HEIGHT)
      : 1;
    const dx = dxScreen / unit;
    const dy = dyScreen / unit;

    const next: CanvasTransform = {
      x: drag.origin.x + dx,
      y: drag.origin.y + dy,
      scale: drag.origin.scale,
    };

    if (drag.layer === "line") setLineTransform(next);
    else setCanvasTransform(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setIsDragging(false);
    if (drag.moved) {
      suppressClickRef.current = true;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }
    }
  };

  // Zoom is shared by both layers so the grid and the lines keep their
  // relative scale. Anchored on the cursor via the SVG's own CTM, which is
  // the only thing that accounts for preserveAspectRatio letterboxing.
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const svg = svgRef.current;
    if (!svg) return;

    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    e.preventDefault();
    cancelTween();

    const cursorWorld = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;

    const rescale = (t: CanvasTransform): CanvasTransform => {
      const scale = clamp(t.scale * factor, MIN_CANVAS_SCALE, MAX_CANVAS_SCALE);
      const applied = scale / t.scale;
      return {
        x: cursorWorld.x - (cursorWorld.x - t.x) * applied,
        y: cursorWorld.y - (cursorWorld.y - t.y) * applied,
        scale,
      };
    };

    setLineTransform(rescale);
    setCanvasTransform(rescale);
  };

  /* ---------------------------------------------------------------- *
   * Selection
   * ---------------------------------------------------------------- */

  // §2.6 — a double-click must not also fire the single-click select.
  // `detail === 2` catches the second press; the pending single-click
  // timer is cancelled before it can centre the line.
  const handleLineClick = useCallback(
    (id: string, detail: number) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      if (detail >= 2) {
        onOpen(id);
        return;
      }
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        onSelect(id);
      }, 220);
    },
    [onOpen, onSelect]
  );

  /* ---------------------------------------------------------------- *
   * Focus-mode connector (§2.7)
   * ---------------------------------------------------------------- */

  const connectorPath = useMemo(() => {
    if (!connector || !connectorItemId) return null;
    const item = itemLayouts.find((it) => it.id === connectorItemId);
    if (!item) return null;
    return resolveThumbnailConnector(item.segment, lineTransform, connector);
  }, [connector, connectorItemId, itemLayouts, lineTransform]);

  // §2.8 — the grabbing cursor only ever appears for a drag that is
  // actually permitted, so focus mode shows no drag affordance at all.
  const cursorClass = isDragging ? "cursor-grabbing" : "cursor-default";

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Timeline Canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={handleWheel}
      className={`w-full h-full relative overflow-hidden select-none touch-none ${cursorClass}`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full overflow-visible"
      >
        {/* Ghost layer — §2.2. Behind the foreground, blurred, and inert:
            it must never intercept a drag, click or double-click. */}
        {ghosts.length > 0 && (
          <g
            aria-hidden="true"
            transform={transformToSvg(lineTransform)}
            style={{ pointerEvents: "none" }}
          >
            {ghosts.map((item) => (
              <TimelineLine
                key={`ghost-${item.id}`}
                id={item.id}
                length={item.length}
                origin={item.origin}
                angleDeg={item.angleDeg}
                ghost
              />
            ))}
          </g>
        )}

        {/* Line layer — moves with lineTransform only. */}
        <g transform={transformToSvg(lineTransform)}>
          {(() => {
            const content = (
              <>
                {foreground.map((item) => (
                  <TimelineGlow
                    key={`glow-${item.id}`}
                    origin={item.origin}
                    lineLength={item.length}
                    angleDeg={item.angleDeg}
                    opacity={focusedId ? (item.id === focusedId ? 0.8 : 0.15) : 0.8}
                  />
                ))}

                {foreground
                  .slice()
                  .reverse()
                  .map((item) => (
                    <TimelineLine
                      key={item.id}
                      id={item.id}
                      length={item.length}
                      origin={item.origin}
                      angleDeg={item.angleDeg}
                      dimmed={focusedId !== null && item.id !== focusedId}
                      draggable={lineDragEnabled}
                      onClick={handleLineClick}
                    >
                      {renderBranches?.(item.id)}
                    </TimelineLine>
                  ))}
              </>
            );
            return wrapLineLayer ? wrapLineLayer(content) : content;
          })()}

          {/* Outside the wrapper, inside the transform. The Episode page's
              origin dot sits exactly on a corner of the bounding box, so
              clipping and edge-fading it would make it invisible and
              unclickable — the one thing §3.3 needs it to be. It still
              travels with the line. */}
          {children}
        </g>

        {/* Connector layer — untransformed. Both endpoints are already in
            view space (the anchor was pushed through lineTransform, the
            thumbnail has its own fixed frame), so the two stay joined
            under pan, zoom and resize. */}
        {connectorPath && (
          <line
            x1={connectorPath.from.x}
            y1={connectorPath.from.y}
            x2={connectorPath.to.x}
            y2={connectorPath.to.y}
            stroke="var(--color-line, #000000)"
            strokeWidth={BRANCH_STROKE_WIDTH}
            className="pointer-events-none"
          />
        )}

        {overlay}
      </svg>
    </div>
  );
};

export const TimelineCanvas = memo(TimelineCanvasComponent);
export default TimelineCanvas;

/** Exposed for callers that need to place HTML against a transformed line. */
export { worldToView };
