import type { TodoV2 } from "@/types/production-v2";

/**
 * Formats relative commit time label, e.g. "Last commit — 2 hours ago".
 * Protects against future timestamps due to clock skew.
 */
export function formatCommitLabel(completedAt: string, now = new Date()): string {
  const completedTime = new Date(completedAt).getTime();
  const nowTime = now.getTime();

  if (isNaN(completedTime) || completedTime > nowTime) {
    return "Last commit — just now";
  }

  const diffMs = Math.max(0, nowTime - completedTime);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return "Last commit — just now";
  }
  if (diffMin < 60) {
    return `Last commit — ${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffHours < 24) {
    return `Last commit — ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  return `Last commit — ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
}

/**
 * Splits a commit list into { latest, previous } for the two-slot Commit panel.
 * latest: commits[0] || null
 * previous: commits.slice(1)
 */
export function splitCommits(commits: TodoV2[]): {
  latest: TodoV2 | null;
  previous: TodoV2[];
} {
  if (!commits || commits.length === 0) {
    return { latest: null, previous: [] };
  }
  return {
    latest: commits[0],
    previous: commits.slice(1),
  };
}
