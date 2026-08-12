"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from "react";
import TimelineLine from "@/components/timeline/TimelineLine";
import TimelineGlow from "@/components/timeline/TimelineGlow";
import { lineEndpoint, Point } from "@/lib/timeline/timelineGeometry";

export type TimelineCanvasProps = {
  items: Array<{ id: string; length: number; label: string }>;
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

  // Pan offset state for absolute mode (kept in ref for performance, mirrored in state for bounds)
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pointer drag state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasExceededThresholdRef = useRef(false);

  // Calculate layout origins for each item (staggered overlap strata)
  // Index 0 (newest) sits lowest and frontmost
  const itemLayouts = React.useMemo(() => {
    const total = items.length;
    return items.map((item, index) => {
      // Stagger origins: index 0 is lowest Y, frontmost
      const origin: Point = {
        x: 180 + (total - 1 - index) * 50,
        y: 480 - index * 42,
      };
      const end = lineEndpoint(origin, item.length);
      const midpoint: Point = {
        x: (origin.x + end.x) / 2,
        y: (origin.y + end.y) / 2,
      };
      return {
        ...item,
        origin,
        end,
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

    // Viewport center target
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

    isDraggingRef.current = true;
    hasExceededThresholdRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...panRef.current };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || mode !== "absolute") return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 4) {
      hasExceededThresholdRef.current = true;
    }

    if (hasExceededThresholdRef.current) {
      // Pan along the 22° axis (ascending right)
      const rad = (22 * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Project drag onto 22° vector
      const projectedDist = deltaX * cos - deltaY * sin;

      // Clamp pan extent
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
      const rad = (22 * Math.PI) / 180;
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
      <svg className="w-full h-full overflow-visible pointer-events-none">
        <g
          ref={wrapperRef}
          className="transition-transform duration-500 ease-out origin-center"
          style={{
            transform: focusTransform
              ? `translate(${focusTransform.deltaX}px, ${focusTransform.deltaY}px) scale(${focusTransform.scale})`
              : `translate(${effectivePan.x}px, ${effectivePan.y}px)`,
          }}
        >
          {/* Render background glow streak for frontmost item */}
          {itemLayouts.length > 0 && (
            <TimelineGlow
              origin={itemLayouts[0].origin}
              length={Math.max(1200, itemLayouts[0].length)}
              opacity={focusedId ? 0.2 : 0.8}
            />
          )}

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
