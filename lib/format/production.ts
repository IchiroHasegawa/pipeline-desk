/**
 * Shared formatting utilities for Production OS.
 */

const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Pure calculation of duration in days reproducing useTimelineScale.
 * If startDate is missing or invalid, returns 0.
 * If endDate is missing, defaults to today.
 * If end date is earlier than start date, returns 0.
 */
export function durationDays(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const endStr = endDate ?? todayStr;
  const end = new Date(endStr);
  if (isNaN(end.getTime()) || end.getTime() < start.getTime()) return 0;

  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * 34 -> "4W 6Days", 14 -> "2W", 5 -> "5Days".
 * A project with no start date has no measurable duration ("No dates").
 * Copied unchanged from components/projects/ProjectBoardRow.tsx.
 */
export function formatDuration(
  durationDays: number,
  hasStartDate: boolean
): string {
  if (!hasStartDate) return "No dates";

  const weeks = Math.floor(durationDays / 7);
  const days = durationDays % 7;

  if (weeks > 0 && days > 0) return weeks + "W " + days + "Days";
  if (weeks > 0) return weeks + "W";
  return days + "Days";
}

/**
 * Bytes are whole; everything above KB carries one decimal.
 * Copied unchanged from components/projects/graphs/AssetStatsGraph.tsx.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return Math.round(bytes) + " B";

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return value.toFixed(1) + " " + units[unitIndex];
}

/**
 * Format a single ISO date string (YYYY-MM-DD) into "DD Mon YYYY".
 * Returns null if invalid or absent.
 */
export function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = MON[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format date range matching prototype: "03 Aug 2026 – 18 Dec 2026" or "No dates".
 */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  const startFmt = formatDate(startDate);
  if (!startFmt) return "No dates";
  const endFmt = formatDate(endDate);
  if (!endFmt) return `${startFmt} – Present`;
  return `${startFmt} – ${endFmt}`;
}

export type EpisodeStatusState = "not_started" | "in_progress" | "complete";

/**
 * Derives the episode status ("not_started" | "in_progress" | "complete") from
 * the episode's Main Tasks rollup, matching the rule in migration 037's
 * `project_episode_status` view:
 *   - not started: total = 0 OR complete = 0
 *   - complete: total > 0 AND complete = total
 *   - in progress: otherwise (total > 0 AND complete > 0 AND complete < total)
 */
export function deriveEpisodeStatus(rollup?: {
  total: number;
  complete: number;
} | null): EpisodeStatusState {
  if (!rollup || rollup.total === 0 || rollup.complete === 0) {
    return "not_started";
  }
  if (rollup.complete === rollup.total) {
    return "complete";
  }
  return "in_progress";
}

export type SceneStatusState = "not_started" | "in_progress" | "complete";

/**
 * Derives scene status ("not_started" | "in_progress" | "complete") matching
 * deriveEpisodeStatus: a task is complete when completionPercentage === 100.
 */
export function deriveSceneStatus(
  tasks: readonly { taskStatusDefinitionId?: string | null }[],
  completionByStatusId: Record<string, number>
): SceneStatusState {
  const total = tasks.length;
  if (total === 0) return "not_started";

  let complete = 0;
  for (const task of tasks) {
    if (
      task.taskStatusDefinitionId &&
      completionByStatusId[task.taskStatusDefinitionId] === 100
    ) {
      complete += 1;
    }
  }

  if (complete === 0) return "not_started";
  if (complete === total) return "complete";
  return "in_progress";
}

/**
 * Format priority number 1-5 to "P1" - "P5". Defaults to "P4" when nullish.
 */
export function formatPriority(priority: number | null | undefined): string {
  return "P" + (priority ?? 4);
}


