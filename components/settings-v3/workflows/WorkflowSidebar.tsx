// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useState, useMemo } from "react";
import { Workflow } from "@/lib/data/workflowRepository";
import WorkflowFormDialog from "./WorkflowFormDialog";
import { RefreshCw, Search, Plus, ChevronRight } from "lucide-react";

type WorkflowSidebarProps = {
  workflows: Workflow[];
  loading: boolean;
  selectedWorkflowId: string | null;
  onSelectWorkflow: (id: string) => void;
  onRefresh: () => void;
  error: string | null;
};

export type FolderType = "job" | "scene" | "asset" | "task_status";

const folderLabels: Record<FolderType, string> = {
  job: "Jobs",
  scene: "Scenes",
  asset: "Assets",
  task_status: "Task Statuses"
};

const folderOrder: FolderType[] = ["job", "scene", "asset", "task_status"];

export default function WorkflowSidebar({
  workflows,
  loading,
  selectedWorkflowId,
  onSelectWorkflow,
  onRefresh,
  error
}: WorkflowSidebarProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<FolderType, boolean>>({
    job: true,
    scene: true,
    asset: true,
    task_status: true
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const toggleFolder = (folder: FolderType) => {
    setExpanded(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const filteredWorkflows = useMemo(() => {
    if (!search.trim()) return workflows;
    const lowerSearch = search.toLowerCase();
    return workflows.filter(
      w => w.name.toLowerCase().includes(lowerSearch) || w.workflow_code.toLowerCase().includes(lowerSearch)
    );
  }, [workflows, search]);

  const groupedWorkflows = useMemo(() => {
    const groups: Record<FolderType, Workflow[]> = {
      job: [],
      scene: [],
      asset: [],
      task_status: []
    };
    filteredWorkflows.forEach(w => {
      if (groups[w.workflow_type as FolderType]) {
        groups[w.workflow_type as FolderType].push(w);
      }
    });
    return groups;
  }, [filteredWorkflows]);

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-[var(--po-line)] flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[var(--po-ink)] uppercase tracking-wider">Workflows</h2>
          <button 
            onClick={onRefresh}
            className="text-[var(--po-ink-3)] hover:text-[var(--po-ink)] p-1 rounded-[6px] hover:bg-[var(--po-chip)] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--po-ink-3)]" />
          <input 
            type="text" 
            placeholder="Quick Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--po-panel)] border border-[var(--po-line-2)] text-xs text-[var(--po-ink)] pl-8 pr-3 py-1.5 rounded-full focus:outline-none focus:border-[var(--po-accent)] transition-colors placeholder:text-[var(--po-ink-3)]"
          />
        </div>

        <button 
          onClick={() => setIsAddDialogOpen(true)}
          className="w-full bg-[var(--po-ink)] hover:opacity-90 text-[var(--po-panel)] text-xs font-semibold py-1.5 rounded-full transition-opacity flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Workflow
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center text-[var(--po-ink-3)] text-xs mt-4">Loading Workflows...</div>
        ) : error ? (
          <div className="text-center text-[var(--po-ink-3)] text-xs mt-4">
            Unable to load Workflows.<br />
            <button onClick={onRefresh} className="mt-2 text-[var(--po-accent)] hover:underline">Retry</button>
          </div>
        ) : (
          <div className="space-y-4">
            {search.trim() !== "" && filteredWorkflows.length === 0 && (
              <div className="text-center text-[var(--po-ink-3)] text-xs mb-4">No Workflows match your search.</div>
            )}
            {folderOrder.map(folder => {
              const items = groupedWorkflows[folder];
              const isExpanded = expanded[folder];
              
              return (
                <div key={folder} className="space-y-1">
                  <button 
                    onClick={() => toggleFolder(folder)}
                    className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-[var(--po-ink-2)] hover:text-[var(--po-ink)] transition-colors uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      {folderLabels[folder]}
                    </div>
                    <span className="text-[10px] text-[var(--po-ink-3)] font-mono">{items.length}</span>
                  </button>
                  
                  {isExpanded && items.length > 0 && (
                    <div className="space-y-0.5 mt-1">
                      {items.map(workflow => (
                        <button
                          key={workflow.id}
                          onClick={() => onSelectWorkflow(workflow.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-xs transition-colors text-left ${
                            selectedWorkflowId === workflow.id 
                              ? 'bg-[var(--po-accent)]/15 text-[var(--po-ink)] font-semibold' 
                              : 'text-[var(--po-ink-2)] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)]'
                          }`}
                        >
                          <div 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: workflow.colour }}
                          />
                          <span className="truncate flex-1">{workflow.name}</span>
                          {workflow.status === 'retired' && (
                            <span className="text-[10px] text-[var(--po-ink-3)] border border-[var(--po-line-2)] px-1 rounded uppercase">Retired</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {isExpanded && items.length === 0 && (
                    <div className="px-6 py-1 text-xs text-[var(--po-ink-3)]">
                      {search.trim() !== "" ? "No matching Workflows" : `No ${folderLabels[folder]} Workflows`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAddDialogOpen && (
        <WorkflowFormDialog 
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={(newId) => {
            onRefresh();
            onSelectWorkflow(newId);
          }}
          workflows={workflows}
        />
      )}
    </div>
  );
}
