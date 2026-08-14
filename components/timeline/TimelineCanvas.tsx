"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";
import TimelineLine from "@/components/timeline/TimelineLine";
import TimelineGlow from "@/components/timeline/TimelineGlow";
import {
  lineEndpoint,
  getProjectLineOrigin,
  getProjectLineAngle,
  Point,
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
  mode: "clamped" | "absolute";
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  renderBranches?: (itemId: string) => React.ReactNode;
};

export const TimelineCanvasComponent: React.FC<TimelineCanvasProps> = ({
  items,
  selectedId,
  focusedId,
  mode,
  onSelect,
  onOpen,
  renderBranches,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<SVGGElement>(null);

  // Pan offset state for absolute mode
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pointer drag state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasExceededThresholdRef = useRef(false);

  // Calculate layout origins and angles for each item using deterministic hash01 if not provided
  const itemLayouts = React.useMemo(() => {
    const total = items.length;
    return items.map((item, index) => {
      const origin: Point = item.origin ?? getProjectLineOrigin(item.id);
      const angleDeg = item.angleDeg ?? getProjectLineAngle(item.id);
      const end = lineEndpoint(origin, item.length, angleDeg);
      const midpoint: Point = {
        x: (origin.x + end.x) / 2,
        y: (origin.y + end.y) / 2,
      };
      return {
        ...item,
        origin,
        end,
        angleDeg,
        midpoint,
        depthIndex: index,
        depthTotal: total,
      };
    });
  }, [items]);

  // Compute focus transform
  const focusTransform = React.useMemo(() => {
    if (!focusedId) return null;
    const focusedItem = itemLayouts.find((item) => item.id === focusedId);
    if (!focusedItem) return null;

    const targetCenterX = 640;
    const targetCenterY = 340;

    const deltaX = targetCenterX - focusedItem.midpoint.x;
    const deltaY = targetCenterY - focusedItem.midpoint.y;

    return { deltaX, deltaY, scale: 1.1 };
  }, [focusedId, itemLayouts]);

  const effectivePan = useMemo(
    () => (mode === "clamped" ? { x: 0, y: 0 } : pan),
    [mode, pan]
  );

  // Apply pan transform to wrapper SVG group
  const updateWrapperTransform = useCallback(() => {
    if (!wrapperRef.current) return;

    let transformStr = "";
    if (focusTransform) {
      transformStr = `translate(${focusTransform.deltaX}px, ${focusTransform.deltaY}px) scale(${focusTransform.scale})`;
    } else {
      const activePan = mode === "clamped" ? { x: 0, y: 0 } : panRef.current;
      transformStr = `translate(${activePan.x}px, ${activePan.y}px)`;
    }

    wrapperRef.current.style.transform = transformStr;
  }, [focusTransform, mode]);

  useEffect(() => {
    if (mode === "clamped") {
      panRef.current = { x: 0, y: 0 };
    }
    updateWrapperTransform();
  }, [updateWrapperTransform, effectivePan, mode]);

  // Pointer event handlers for drag-to-scrub (absolute mode only)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (mode !== "absolute" || focusedId) return;

    const targetTag = (e.target as HTMLElement).tagName?.toLowerCase();
    if (targetTag === "line" || targetTag === "path") return;

    isDraggingRef.current = true;
    hasExceededThresholdRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...panRef.current };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || mode !== "absolute") return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 4 && !hasExceededThresholdRef.current) {
      hasExceededThresholdRef.current = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore if capture fails
      }
    }

    if (hasExceededThresholdRef.current) {
      const rad = (22.5 * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const projectedDist = deltaX * cos - deltaY * sin;

      const maxPanX = 0;
      const minPanX = -1200;

      const newPanX = Math.min(
        maxPanX,
        Math.max(minPanX, initialPanRef.current.x + projectedDist * cos)
      );
      const newPanY = initialPanRef.current.y - (initialPanRef.current.x - newPanX) * Math.tan(rad);

      panRef.current = { x: newPanX, y: newPanY };

      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate(${newPanX}px, ${newPanY}px)`;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (hasExceededThresholdRef.current) {
      setPan({ ...panRef.current });
    }
  };

  // Wheel handler for horizontal panning in absolute mode
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (mode !== "absolute" || focusedId) return;

    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 0) {
      const rad = (22.5 * Math.PI) / 180;
      const maxPanX = 0;
      const minPanX = -1200;

      const newPanX = Math.min(
        maxPanX,
        Math.max(minPanX, panRef.current.x - delta * 0.8)
      );
      const newPanY = - ( - newPanX) * Math.tan(rad);

      if (newPanX !== panRef.current.x) {
        e.preventDefault();
        panRef.current = { x: newPanX, y: newPanY };
        setPan({ x: newPanX, y: newPanY });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Timeline Canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="w-full h-full relative overflow-hidden select-none touch-none"
    >
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full overflow-visible"
      >
        <g
          ref={wrapperRef}
          className="transition-transform duration-500 ease-out origin-center"
          style={{
            transform: focusTransform
              ? `translate(${focusTransform.deltaX}px, ${focusTransform.deltaY}px) scale(${focusTransform.scale})`
              : `translate(${effectivePan.x}px, ${effectivePan.y}px)`,
          }}
        >
          {/* Render background glow streak per project line per Spec A3 */}
          {itemLayouts.map((item) => (
            <TimelineGlow
              key={`glow-${item.id}`}
              origin={item.origin}
              lineLength={item.length}
              angleDeg={item.angleDeg}
              opacity={focusedId ? (item.id === focusedId ? 0.8 : 0.15) : 0.8}
            />
          ))}

          {/* Render lines from back to front (reverse order) */}
          {itemLayouts
            .slice()
            .reverse()
            .map((item) => {
              const isSelected = item.id === selectedId;
              const isFocused = item.id === focusedId;
              const isDimmed = focusedId !== null && !isFocused;

              return (
                <TimelineLine
                  key={item.id}
                  id={item.id}
                  length={item.length}
                  origin={item.origin}
                  depthIndex={item.depthIndex}
                  depthTotal={item.depthTotal}
                  selected={isSelected || isFocused}
                  dimmed={isDimmed}
                  onSelect={onSelect}
                  onOpen={onOpen}
                >
                  {renderBranches && renderBranches(item.id)}
                </TimelineLine>
              );
            })}
        </g>
      </svg>
    </div>
  );
};

export const TimelineCanvas = memo(TimelineCanvasComponent);
export default TimelineCanvas;
