// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { WorkflowProcess } from "@/lib/data/workflowRepository";

type ProcessCardProps = {
  process: WorkflowProcess;
  isSelected: boolean;
  onClick: () => void;
};

export default function ProcessCard({ process, isSelected, onClick }: ProcessCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-64 h-32 rounded-[14px] border flex flex-col text-left transition-all ${
        isSelected 
          ? "border-[var(--po-accent)] bg-[var(--po-accent)]/10 shadow-[0_0_0_1px_var(--po-accent)]" 
          : "border-[var(--po-line)] bg-[var(--po-card)] hover:bg-[var(--po-chip)] hover:border-[var(--po-line-2)]"
      }`}
    >
      <div 
        className="h-1.5 w-full rounded-t-[14px] opacity-90" 
        style={{ backgroundColor: process.colour }}
      />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold text-[var(--po-ink)] truncate pr-2">{process.name}</span>
          <span className="text-xs bg-[var(--po-chip)] text-[var(--po-ink-2)] px-2 py-0.5 rounded-[6px] border border-[var(--po-line)] font-mono">
            {process.position}
          </span>
        </div>
        
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--po-ink-3)] w-16 uppercase font-medium">Status</span>
            <span className="text-[var(--po-ink-2)] truncate">
              {process.default_task_status_id ? "Configured" : "None"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--po-ink-3)] w-16 uppercase font-medium">Assignee</span>
            <span className="text-[var(--po-ink-2)] truncate">
              {process.assignee_group_id ? "Group assigned" : "Unassigned"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
