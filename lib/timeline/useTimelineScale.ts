import { useMemo } from "react";

export type TimelineMode = "clamped" | "absolute";

export type TimelineRange = {
  id: string;
  startDate: string | null;
  endDate: string | null;
};

export type TimelineScaleOptions = {
  mode: TimelineMode;
  viewportWidth: number;
  /** clamped mode: fraction of viewportWidth the longest range occupies. Default 0.72 */
  maxFraction?: number;
  /** absolute mode: pixels per day. Default 4 */
  pixelsPerDay?: number;
  /** Minimum rendered length so a one-day range is still visible. Default 24 */
  minLength?: number;
};

export function useTimelineScale(
  ranges: TimelineRange[],
  options: TimelineScaleOptions
): { lengthById: Record<string, number>; durationDaysById: Record<string, number> } {
  const {
    mode,
    viewportWidth,
    maxFraction = 0.72,
    pixelsPerDay = 4,
    minLength = 24,
  } = options;

  return useMemo(() => {
    const lengthById: Record<string, number> = {};
    const durationDaysById: Record<string, number> = {};

    if (!ranges || ranges.length === 0) {
      return { lengthById, durationDaysById };
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Compute duration in days for each range
    let maxDuration = 0;

    for (const range of ranges) {
      if (!range.startDate) {
        durationDaysById[range.id] = 0;
        continue;
      }

      const start = new Date(range.startDate);
      if (isNaN(start.getTime())) {
        durationDaysById[range.id] = 0;
        continue;
      }

      const endStr = range.endDate ?? todayStr;
      const end = new Date(endStr);
      if (isNaN(end.getTime()) || end.getTime() < start.getTime()) {
        durationDaysById[range.id] = 0;
        continue;
      }

      const diffMs = end.getTime() - start.getTime();
      const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      durationDaysById[range.id] = days;

      if (days > maxDuration) {
        maxDuration = days;
      }
    }

    // Compute pixel lengths based on mode
    if (mode === "absolute") {
      for (const range of ranges) {
        const days = durationDaysById[range.id] || 0;
        const rawLength = days * pixelsPerDay;
        lengthById[range.id] = Math.max(minLength, rawLength);
      }
    } else {
      // "clamped" mode
      if (maxDuration === 0) {
        // Prevent division by zero when all durations are 0
        for (const range of ranges) {
          lengthById[range.id] = minLength;
        }
      } else {
        const targetMaxPixels = Math.max(minLength, viewportWidth * maxFraction);
        for (const range of ranges) {
          const days = durationDaysById[range.id] || 0;
          const rawLength = (days / maxDuration) * targetMaxPixels;
          lengthById[range.id] = Math.max(minLength, rawLength);
        }
      }
    }

    return { lengthById, durationDaysById };
  }, [ranges, mode, viewportWidth, maxFraction, pixelsPerDay, minLength]);
}

export default useTimelineScale;
