// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Workflow, WorkflowProcess, WorkflowTaskStatus, getWorkflowProcesses, updateWorkflow, retireWorkflow, restoreWorkflow, deleteWorkflow, getTaskStatuses } from "@/lib/data/workflowRepository";
import ProcessCard from "./ProcessCard";
import ProcessFormDialog from "./ProcessFormDialog";
import ProcessEditor from "./ProcessEditor";
import { ConfirmDialog } from "@/components/app-shell";

type WorkflowDetailProps = {
  workflow: Workflow;
  onWorkflowUpdated: (w: Workflow) => void;
  onWorkflowDeleted: (id: string) => void;
};

export default function WorkflowDetail({ workflow, onWorkflowUpdated, onWorkflowDeleted }: WorkflowDetailProps) {
  const [name, setName] = useState(workflow.name);
  const [colour, setColour] = useState(workflow.colour);
  const [description, setDescription] = useState(workflow.description || "");
  
  const [processes, setProcesses] = useState<WorkflowProcess[]>([]);
  const [statuses, setStatuses] = useState<WorkflowTaskStatus[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [isAddProcessOpen, setIsAddProcessOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isRetireConfirmOpen, setIsRetireConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(workflow.name);
    setColour(workflow.colour);
    setDescription(workflow.description || "");
    setSelectedProcessId(null);
    setActionError(null);
    
    async function loadDetails() {
      try {
        if (workflow.workflow_type === "task_status") {
          const data = await getTaskStatuses(supabase, workflow.id);
          setStatuses(data || []);
        } else {
          const data = await getWorkflowProcesses(supabase, workflow.id);
          setProcesses(data || []);
          if (data && data.length > 0) {
            setSelectedProcessId(data[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    loadDetails();
  }, [workflow.id, workflow.name, workflow.colour, workflow.description, workflow.workflow_type, supabase]);

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setActionError(null);
    try {
      const updated = await updateWorkflow(supabase, workflow.id, {
        name,
        colour,
        description: description || null,
      });
      onWorkflowUpdated(updated);
    } catch (err) {
      console.error("Unable to update Workflow", err);
      setActionError("Unable to update Workflow.");
    } finally {
      setSavingInfo(false);
    }
  };

  const executeRetire = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      const updated = await retireWorkflow(supabase, workflow.id);
      setIsRetireConfirmOpen(false);
      onWorkflowUpdated(updated);
    } catch {
      setActionError("Unable to retire Workflow.");
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const handleRestore = async () => {
    setActionError(null);
    try {
      const updated = await restoreWorkflow(supabase, workflow.id);
      onWorkflowUpdated(updated);
    } catch {
      setActionError("Unable to restore Workflow.");
    }
  };

  const executeDelete = async () => {
    setIsActionLoading(true);
    setActionError(null);
    try {
      await deleteWorkflow(supabase, workflow.id);
      setIsDeleteConfirmOpen(false);
      onWorkflowDeleted(workflow.id);
    } catch {
      setActionError("Unable to delete. Workflow may be referenced by existing tasks or entities. Please Retire it instead.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const hasChanges = name !== workflow.name || colour !== workflow.colour || description !== (workflow.description || "");
  const selectedProcess = processes.find(p => p.id === selectedProcessId) || null;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="p-6 border-b border-[var(--po-line)] flex flex-col gap-6">
        <div className="text-xs font-semibold text-[var(--po-ink-3)] uppercase tracking-wider flex items-center gap-2">
          <span>Workflow Editor</span>
          <span>&gt;</span>
          <span>{workflow.workflow_type.replace("_", " ")}</span>
          <span>&gt;</span>
          <span className="text-[var(--po-ink)]">{workflow.name}</span>
          {workflow.status === 'retired' && (
            <span className="ml-2 text-[10px] text-[var(--po-ink-3)] border border-[var(--po-line-2)] px-1.5 py-0.5 rounded-[4px] uppercase font-mono">Retired</span>
          )}
        </div>

        {actionError && (
          <div className="rounded-[12px] border border-[#E5534B]/30 bg-[#E5534B]/10 p-3 text-xs text-[#E5534B]">
            {actionError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--po-ink-2)] font-semibold uppercase block mb-1">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[var(--po-panel)] border border-[var(--po-line-2)] text-[var(--po-ink)] px-3 py-2 rounded-[10px] focus:outline-none focus:border-[var(--po-accent)] transition-colors text-sm"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-[var(--po-ink-2)] font-semibold uppercase block mb-1">Type</label>
                <input 
                  type="text" 
                  value={workflow.workflow_type}
                  disabled
                  className="w-full bg-[var(--po-chip)] border border-[var(--po-line)] text-[var(--po-ink-3)] px-3 py-2 rounded-[10px] cursor-not-allowed text-sm capitalize"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[var(--po-ink-2)] font-semibold uppercase block mb-1">Colour</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={colour}
                    onChange={e => setColour(e.target.value)}
                    className="h-9 w-9 rounded-[8px] cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={colour}
                    onChange={e => setColour(e.target.value)}
                    className="flex-1 bg-[var(--po-panel)] border border-[var(--po-line-2)] text-[var(--po-ink)] px-3 py-2 rounded-[10px] focus:outline-none focus:border-[var(--po-accent)] uppercase font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--po-ink-2)] font-semibold uppercase block mb-1">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[var(--po-panel)] border border-[var(--po-line-2)] text-[var(--po-ink)] px-3 py-2 rounded-[10px] focus:outline-none focus:border-[var(--po-accent)] transition-colors text-sm resize-none"
              />
            </div>
            <div className="flex items-center gap-3 justify-between">
              <div className="flex gap-2">
                {hasChanges && (
                  <>
                    <button 
                      onClick={handleSaveInfo}
                      disabled={savingInfo}
                      className="rounded-full bg-[var(--po-ink)] hover:opacity-90 text-[var(--po-panel)] text-xs font-semibold px-4 py-1.5 transition-opacity disabled:opacity-50"
                    >
                      {savingInfo ? "Saving..." : "Save"}
                    </button>
                    <button 
                      onClick={() => {
                        setName(workflow.name);
                        setColour(workflow.colour);
                        setDescription(workflow.description || "");
                      }}
                      disabled={savingInfo}
                      className="rounded-full border border-[var(--po-line-2)] text-[var(--po-ink-2)] hover:text-[var(--po-ink)] hover:bg-[var(--po-chip)] text-xs font-medium px-4 py-1.5 transition-colors"
                    >
                      Discard
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {workflow.status === 'active' ? (
                  <button 
                    onClick={() => setIsRetireConfirmOpen(true)} 
                    className="rounded-full text-[var(--po-accent)] border border-[var(--po-accent)]/30 hover:bg-[var(--po-accent)]/10 px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    Retire Workflow
                  </button>
                ) : (
                  <button 
                    onClick={handleRestore} 
                    className="rounded-full text-[#28A745] border border-[#28A745]/30 hover:bg-[#28A745]/10 px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    Restore Workflow
                  </button>
                )}
                <button 
                  onClick={() => setIsDeleteConfirmOpen(true)} 
                  className="rounded-full text-[#E5534B] border border-[#E5534B]/30 hover:bg-[#E5534B]/10 px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0 bg-[var(--po-panel)]">
        {workflow.workflow_type === "task_status" ? (
          <div className="flex flex-col gap-4 max-w-3xl">
            <h3 className="text-sm font-bold text-[var(--po-ink)] uppercase tracking-wider">Status List</h3>
            <p className="text-sm text-[var(--po-ink-2)]">Define the statuses available when this Task Status Workflow is selected.</p>
            <div className="space-y-2">
              {statuses.map(status => (
                <div key={status.id} className="flex items-center gap-4 bg-[var(--po-card)] border border-[var(--po-line)] p-3 rounded-[12px]">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: status.colour }} />
                  <div className="flex-1 font-medium text-[var(--po-ink)]">{status.name}</div>
                  <div className="text-[var(--po-ink-2)] text-sm w-16">{status.completion_percentage}%</div>
                  <div className="text-[var(--po-ink-3)] text-sm w-8 text-center font-mono">{status.position}</div>
                  <span className="text-xs text-[var(--po-ink-3)]">Configured</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--po-ink)] uppercase tracking-wider">Processes</h3>
                <span className="text-xs text-[var(--po-ink-3)]">Workflow changes apply to newly created items.</span>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {processes.map(process => (
                  <ProcessCard 
                    key={process.id}
                    process={process}
                    isSelected={selectedProcessId === process.id}
                    onClick={() => setSelectedProcessId(process.id)}
                  />
                ))}
                
                <button 
                  onClick={() => setIsAddProcessOpen(true)}
                  className="flex-shrink-0 w-64 h-32 border-2 border-dashed border-[var(--po-line-2)] rounded-[14px] flex flex-col items-center justify-center text-[var(--po-ink-3)] hover:text-[var(--po-ink)] hover:border-[var(--po-accent)] hover:bg-[var(--po-chip)]/40 transition-colors"
                >
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-sm font-medium">Add Process</span>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[var(--po-card)] border border-[var(--po-line)] rounded-[20px] overflow-y-auto p-6 shadow-[var(--po-shadow-sm)]">
              {selectedProcess ? (
                <ProcessEditor 
                  process={selectedProcess} 
                  onProcessUpdated={(updated) => {
                    setProcesses(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a,b) => a.position - b.position));
                  }}
                  onProcessDeleted={(id) => {
                    setProcesses(prev => prev.filter(p => p.id !== id));
                    setSelectedProcessId(null);
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--po-ink-3)]">
                  Select a Process to view details or add a new Process.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isAddProcessOpen && (
        <ProcessFormDialog
          isOpen={isAddProcessOpen}
          workflowId={workflow.id}
          nextPosition={processes.length > 0 ? Math.max(...processes.map(p => p.position)) + 1 : 1}
          onClose={() => setIsAddProcessOpen(false)}
          onSuccess={(newProcess) => {
            setProcesses(prev => [...prev, newProcess].sort((a,b) => a.position - b.position));
            setSelectedProcessId(newProcess.id);
            setIsAddProcessOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={isRetireConfirmOpen}
        title="Retire Workflow"
        description="Are you sure you want to retire this Workflow? It will no longer be available for new creations."
        confirmLabel="Retire"
        cancelLabel="Cancel"
        variant="default"
        isLoading={isActionLoading}
        onConfirm={executeRetire}
        onCancel={() => setIsRetireConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Delete Workflow"
        description={`Are you sure you want to delete ${workflow.name}? Existing Production Tasks created from this Workflow will remain unchanged. This cannot be undone if not referenced.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isActionLoading}
        onConfirm={executeDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
}
