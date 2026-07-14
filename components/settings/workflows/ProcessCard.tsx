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
      className={`flex-shrink-0 w-64 h-32 rounded-lg border flex flex-col text-left transition-all ${
        isSelected 
          ? "border-blue-500 bg-blue-900/20 shadow-[0_0_0_1px_rgba(59,130,246,1)]" 
          : "border-[#2a2a2a] bg-[#121212] hover:bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      <div 
        className="h-1.5 w-full rounded-t-lg opacity-80" 
        style={{ backgroundColor: process.colour }}
      />
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <span className="font-bold text-white truncate pr-2">{process.name}</span>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-[#2a2a2a]">
            {process.position}
          </span>
        </div>
        
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 w-16 uppercase">Status</span>
            <span className="text-zinc-300 truncate">
              {process.default_task_status_id ? "Configured" : "None"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 w-16 uppercase">Assignee</span>
            <span className="text-zinc-300 truncate">
              {process.assignee_group_id ? "Group assigned" : "Unassigned"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
