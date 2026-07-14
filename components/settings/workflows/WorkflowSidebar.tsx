"use client";

import { useState, useMemo } from "react";
import { Workflow } from "@/lib/data/workflowRepository";
import WorkflowFormDialog from "./WorkflowFormDialog";

type WorkflowSidebarProps = {
  workflows: Workflow[];
  loading: boolean;
  selectedWorkflowId: string | null;
  onSelectWorkflow: (id: string) => void;
  onRefresh: () => void;
  error: string | null;
};

type FolderType = "environment" | "job" | "scene" | "asset" | "task_status";

const folderLabels: Record<FolderType, string> = {
  environment: "Environments",
  job: "Jobs",
  scene: "Scenes",
  asset: "Assets",
  task_status: "Task Statuses"
};

const folderOrder: FolderType[] = ["environment", "job", "scene", "asset", "task_status"];

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
    environment: true,
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
      environment: [],
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
      <div className="p-4 border-b border-[#2a2a2a] flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Workflows</h2>
          <button 
            onClick={onRefresh}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <input 
          type="text" 
          placeholder="Quick Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-[#2a2a2a] text-sm text-white px-3 py-1.5 rounded focus:outline-none focus:border-blue-500 transition-colors"
        />

        <button 
          onClick={() => setIsAddDialogOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-1.5 rounded transition-colors flex items-center justify-center gap-1"
        >
          <span>+</span> Add Workflow
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center text-zinc-500 text-sm mt-4">Loading Workflows...</div>
        ) : error ? (
          <div className="text-center text-red-400 text-sm mt-4">{error}</div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm mt-4">No Workflows match your search.</div>
        ) : (
          <div className="space-y-4">
            {folderOrder.map(folder => {
              const items = groupedWorkflows[folder];
              const isExpanded = expanded[folder];
              
              return (
                <div key={folder} className="space-y-1">
                  <button 
                    onClick={() => toggleFolder(folder)}
                    className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1.5">
                      <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {folderLabels[folder]}
                    </div>
                    <span>{items.length}</span>
                  </button>
                  
                  {isExpanded && items.length > 0 && (
                    <div className="space-y-0.5 mt-1">
                      {items.map(workflow => (
                        <button
                          key={workflow.id}
                          onClick={() => onSelectWorkflow(workflow.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors text-left ${
                            selectedWorkflowId === workflow.id 
                              ? 'bg-blue-900/30 text-blue-400 font-medium' 
                              : 'text-zinc-300 hover:bg-zinc-800/50'
                          }`}
                        >
                          <div 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: workflow.colour }}
                          />
                          <span className="truncate flex-1">{workflow.name}</span>
                          {workflow.status === 'retired' && (
                            <span className="text-[10px] text-zinc-500 border border-zinc-700 px-1 rounded uppercase">Retired</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {isExpanded && items.length === 0 && search === "" && (
                    <div className="px-6 py-1 text-xs text-zinc-600">Empty</div>
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
          workflows={workflows} // For "Copy From"
        />
      )}
    </div>
  );
}
