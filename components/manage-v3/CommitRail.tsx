"use client";

import React from "react";
import { GitCommitHorizontal, Check } from "lucide-react";
import type { TodoV2 } from "@/types/production-v2";
import { formatCommitLabel } from "@/lib/timeline/commitFormat";

export interface CommitRailProps {
  commits: TodoV2[];
}

export const CommitRail: React.FC<CommitRailProps> = ({ commits }) => {
  return (
    <div className="flex flex-col min-h-0 h-full rounded-[20px] bg-[var(--po-card)] border border-[var(--po-line)] overflow-hidden shadow-[var(--po-shadow-sm)]">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-3 flex-none">
        <GitCommitHorizontal size={16} className="text-[var(--po-ink-3)]" />
        <h2 className="text-[14px] font-semibold text-[var(--po-ink)] m-0">Your commits</h2>
        <span className="rounded-full bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink-2)]">
          {commits.length}
        </span>
        <span className="ml-auto text-[11px] text-[var(--po-ink-3)]">Newest first</span>
      </div>

      {/* Commits List */}
      <div className="flex-1 overflow-auto px-2 pb-2 flex flex-col gap-0.5">
        {commits.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[var(--po-ink-3)]">
            No commits yet.
          </div>
        ) : (
          commits.map((commit) => (
            <div
              key={commit.id}
              className="flex items-start gap-2.5 rounded-[10px] p-2 transition-colors hover:bg-[var(--po-chip)]"
            >
              <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[var(--po-accent)]/15 text-[var(--po-accent)]">
                <Check size={10} strokeWidth={2.5} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[13px] leading-[1.4] text-[var(--po-ink-2)] break-words">
                  {commit.title}
                </span>
                <span className="text-[11px] text-[var(--po-ink-3)]">
                  <b className="font-medium text-[var(--po-ink-2)]">
                    {formatCommitLabel(commit.completedAt || commit.createdAt)}
                  </b>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
