"use client";

import React, { useRef, useState, useLayoutEffect, useEffect } from "react";
import { WORLD_WIDTH, WORLD_HEIGHT } from "@/lib/timeline/timelineGeometry";

export type WorldLayerProps = {
  className?: string;
  children: React.ReactNode;
};

/**
 * Places absolutely-positioned HTML into the same 1920 × 1080 world the
 * canvas SVG draws into.
 *
 * The canvas uses `preserveAspectRatio="xMidYMid meet"`, so world units and
 * DOM pixels only coincide when the container happens to be exactly 1920
 * wide. Anything anchored to canvas geometry — the focus overlay and its
 * thumbnail, which the connector has to reach — must be mapped through the
 * same fit, or it drifts as the window resizes.
 *
 * This reproduces that fit exactly: scale to the smaller axis, then centre
 * the letterboxed remainder. Children keep their measured design-pixel
 * coordinates and land where the SVG puts the same coordinates.
 *
 * Viewport chrome (the nav rail, the tool cluster, the bottom strip) is
 * anchored to the window rather than to canvas geometry and deliberately
 * does not go through here.
 */
export const WorldLayer: React.FC<WorldLayerProps> = ({ className, children }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0 });

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
      setFit({
        scale,
        x: (width - WORLD_WIDTH * scale) / 2,
        y: (height - WORLD_HEIGHT * scale) / 2,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // Guard against a font/scrollbar shift landing after the first paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const host = hostRef.current;
      if (!host) return;
      const { width, height } = host.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
      setFit((prev) =>
        Math.abs(prev.scale - scale) < 0.0001
          ? prev
          : {
              scale,
              x: (width - WORLD_WIDTH * scale) / 2,
              y: (height - WORLD_HEIGHT * scale) / 2,
            }
      );
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    // Inert by default: this layer spans the whole canvas, so it must not
    // intercept drags. Interactive children opt back in with
    // `pointer-events-auto`.
    <div
      ref={hostRef}
      className={`absolute inset-0 pointer-events-none ${className ?? ""}`}
    >
      <div
        className="pointer-events-none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${WORLD_WIDTH}px`,
          height: `${WORLD_HEIGHT}px`,
          transformOrigin: "0 0",
          transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default WorldLayer;
