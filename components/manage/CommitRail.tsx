"use client";

import React, { memo } from "react";
import type { TodoV2 } from "@/types/production-v2";
import { splitCommits, formatCommitLabel } from "@/lib/timeline/commitFormat";

export type CommitRailProps = {
  commits: TodoV2[];
};

export const CommitRailComponent: React.FC<CommitRailProps> = ({ commits }) => {
  const { latest, previous } = splitCommits(commits);

  return (
    <div className="relative pl-6 py-2 min-h-[140px] font-sans">
      {/* Hairline vertical rail */}
      <div className="absolute left-[7px] top-2 bottom-2 w-[0.5px] bg-[var(--color-line,#000000)] pointer-events-none" />

      {/* Entry 1: Latest Commit */}
      <div className="relative mb-6 flex flex-col gap-1">
        {/* Dot */}
        <div className="absolute -left-[20px] top-[6px] w-[6px] h-[6px] rounded-full bg-[var(--color-ink,#000000)]" />

        <div className="flex flex-row items-center gap-4">
          <span className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)] shrink-0">
            Latest commit
          </span>
          <div className="flex-1 h-[1px] bg-[var(--color-line-soft,#a9a9a9)]" />
        </div>

        {latest ? (
          <div className="flex flex-col gap-0.5 pt-1 text-[var(--text-caption,11px)]">
            <span className="font-medium text-[var(--color-ink,#000000)]">
              {latest.title}
            </span>
            <span className="text-[var(--color-ink-muted,#707070)] font-mono text-[10px]">
              {formatCommitLabel(latest.completedAt || latest.createdAt)}
            </span>
          </div>
        ) : (
          <span className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] pt-1 italic">
            No commits yet
          </span>
        )}
      </div>

      {/* Entry 2: Previous Commit */}
      <div className="relative flex flex-col gap-1">
        {/* Dot */}
        <div className="absolute -left-[20px] top-[6px] w-[6px] h-[6px] rounded-full bg-[var(--color-ink,#000000)]" />

        <div className="flex flex-row items-center gap-4">
          <span className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)] shrink-0">
            Previous commit
          </span>
          <div className="flex-1 h-[1px] bg-[var(--color-line-soft,#a9a9a9)]" />
        </div>

        {previous.length > 0 ? (
          <div className="flex flex-col gap-1.5 pt-1">
            {previous.slice(0, 3).map((prev) => (
              <div key={prev.id} className="flex flex-col gap-0.5 text-[var(--text-caption,11px)]">
                <span className="font-medium text-[var(--color-ink,#000000)]">
                  {prev.title}
                </span>
                <span className="text-[var(--color-ink-muted,#707070)] font-mono text-[10px]">
                  {formatCommitLabel(prev.completedAt || prev.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] pt-1 italic">
            No previous commits
          </span>
        )}
      </div>
    </div>
  );
};

export const CommitRail = memo(CommitRailComponent);
export default CommitRail;
