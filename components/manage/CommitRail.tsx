"use client";

import React, { memo } from "react";
import type { TodoV2 } from "@/types/production-v2";
import { splitCommits, formatCommitLabel } from "@/lib/timeline/commitFormat";

export type CommitRailProps = {
  commits: TodoV2[];
};

/**
 * Commit rail — DESIGN_SPEC §8.
 * Rail (10, 756.5) 0.5 × 323.5.
 * Latest   — dot (7, 751) 6 × 6, label (17, 746) 196 × 44, rule (100, 754) 595.5.
 * Previous — dot (7, 897) 6 × 6, label (17, 892) 179 × 39, rule (106, 900) 595.5.
 *
 * Figma spells the label "Lastest"; the spec directs using "Latest".
 */
export const CommitRailComponent: React.FC<CommitRailProps> = ({ commits }) => {
  const { latest, previous } = splitCommits(commits);
  const previousCommit = previous.length > 0 ? previous[0] : null;

  return (
    <>
      {/* Rail (10, 756.5) 0.5 × 323.5 */}
      <div className="absolute left-[10px] top-[756.5px] w-[0.5px] h-[323.5px] bg-[var(--color-line,#000000)] pointer-events-none" />

      {/* ---- Latest ---- */}
      <div className="absolute left-[7px] top-[751px] w-[6px] h-[6px] rounded-full bg-[var(--color-ink,#000000)]" />
      <div className="absolute left-[100px] top-[754px] w-[595.5px] h-[1px] bg-[var(--color-line-soft,#a9a9a9)]" />
      <div className="absolute left-[17px] top-[746px] w-[196px] h-[44px] font-sans">
        <span className="block text-[var(--text-list,12px)] leading-none font-medium text-[var(--color-ink,#000000)]">
          Latest commit
        </span>
        {latest ? (
          <div className="pt-[6px] flex flex-col gap-[2px]">
            <span className="block text-[var(--text-caption,11px)] leading-none font-medium text-[var(--color-ink,#000000)] truncate">
              {latest.title}
            </span>
            <span className="block text-[10px] leading-none text-[var(--color-ink-muted,#707070)] truncate">
              {formatCommitLabel(latest.completedAt || latest.createdAt)}
            </span>
          </div>
        ) : (
          <span className="block pt-[6px] text-[var(--text-caption,11px)] leading-none text-[var(--color-ink-muted,#707070)] italic">
            No commits yet
          </span>
        )}
      </div>

      {/* ---- Previous ---- */}
      <div className="absolute left-[7px] top-[897px] w-[6px] h-[6px] rounded-full bg-[var(--color-ink,#000000)]" />
      <div className="absolute left-[106px] top-[900px] w-[595.5px] h-[1px] bg-[var(--color-line-soft,#a9a9a9)]" />
      <div className="absolute left-[17px] top-[892px] w-[179px] h-[39px] font-sans">
        <span className="block text-[var(--text-list,12px)] leading-none font-medium text-[var(--color-ink,#000000)]">
          Previous commit
        </span>
        {previousCommit ? (
          <div className="pt-[6px] flex flex-col gap-[2px]">
            <span className="block text-[var(--text-caption,11px)] leading-none font-medium text-[var(--color-ink,#000000)] truncate">
              {previousCommit.title}
            </span>
            <span className="block text-[10px] leading-none text-[var(--color-ink-muted,#707070)] truncate">
              {formatCommitLabel(previousCommit.completedAt || previousCommit.createdAt)}
            </span>
          </div>
        ) : (
          <span className="block pt-[6px] text-[var(--text-caption,11px)] leading-none text-[var(--color-ink-muted,#707070)] italic">
            No previous commits
          </span>
        )}
      </div>
    </>
  );
};

export const CommitRail = memo(CommitRailComponent);
export default CommitRail;
