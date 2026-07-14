"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Workflow, WorkflowProcess, WorkflowTaskStatus, getWorkflowProcesses, updateWorkflow, retireWorkflow, restoreWorkflow, deleteWorkflow, getTaskStatuses } from "@/lib/data/workflowRepository";
import ProcessCard from "./ProcessCard";
import ProcessFormDialog from "./ProcessFormDialog";
import ProcessEditor from "./ProcessEditor";

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

  const supabase = createClient();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(workflow.name);
    setColour(workflow.colour);
    setDescription(workflow.description || "");
    setSelectedProcessId(null);
    
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
    try {
      const updated = await updateWorkflow(supabase, workflow.id, {
        name,
        colour,
        description: description || null,
      });
      onWorkflowUpdated(updated);
    } catch (err) {
      console.error("Unable to update Workflow", err);
      alert("Unable to update Workflow.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleRetire = async () => {
    if (confirm("Are you sure you want to retire this Workflow? It will no longer be available for new creations.")) {
      try {
        const updated = await retireWorkflow(supabase, workflow.id);
        onWorkflowUpdated(updated);
      } catch {
        alert("Unable to retire Workflow.");
      }
    }
  };
  
  const handleRestore = async () => {
    try {
      const updated = await restoreWorkflow(supabase, workflow.id);
      onWorkflowUpdated(updated);
    } catch {
      alert("Unable to restore Workflow.");
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${workflow.name}? Existing Production Tasks created from this Workflow will remain unchanged. This cannot be undone if not referenced.`)) {
      try {
        await deleteWorkflow(supabase, workflow.id);
        onWorkflowDeleted(workflow.id);
      } catch {
        alert("Unable to delete. Workflow may be referenced by existing tasks or entities. Please Retire it instead.");
      }
    }
  };

  const hasChanges = name !== workflow.name || colour !== workflow.colour || description !== (workflow.description || "");
  const selectedProcess = processes.find(p => p.id === selectedProcessId) || null;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="p-6 border-b border-[#2a2a2a] flex flex-col gap-6">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <span>Workflow Editor</span>
          <span>&gt;</span>
          <span>{workflow.workflow_type.replace("_", " ")}</span>
          <span>&gt;</span>
          <span className="text-zinc-300">{workflow.name}</span>
          {workflow.status === 'retired' && (
            <span className="ml-2 text-[10px] text-zinc-500 border border-zinc-700 px-1 rounded uppercase">Retired</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 font-semibold uppercase block mb-1">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-[#2a2a2a] text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase block mb-1">Type</label>
                <input 
                  type="text" 
                  value={workflow.workflow_type}
                  disabled
                  className="w-full bg-zinc-900/50 border border-[#2a2a2a] text-zinc-500 px-3 py-2 rounded cursor-not-allowed text-sm capitalize"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-zinc-500 font-semibold uppercase block mb-1">Colour</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={colour}
                    onChange={e => setColour(e.target.value)}
                    className="h-9 w-9 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={colour}
                    onChange={e => setColour(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-[#2a2a2a] text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 uppercase font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 font-semibold uppercase block mb-1">Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900 border border-[#2a2a2a] text-white px-3 py-2 rounded focus:outline-none focus:border-blue-500 transition-colors text-sm resize-none"
              />
            </div>
            <div className="flex items-center gap-3 justify-between">
              <div className="flex gap-2">
                {hasChanges && (
                  <>
                    <button 
                      onClick={handleSaveInfo}
                      disabled={savingInfo}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
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
                      className="text-zinc-400 hover:text-white text-sm font-medium px-4 py-1.5 transition-colors"
                    >
                      Discard
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {workflow.status === 'active' ? (
                  <button onClick={handleRetire} className="text-orange-400 border border-orange-400/30 hover:bg-orange-400/10 px-3 py-1.5 rounded text-sm transition-colors">
                    Retire Workflow
                  </button>
                ) : (
                  <button onClick={handleRestore} className="text-green-400 border border-green-400/30 hover:bg-green-400/10 px-3 py-1.5 rounded text-sm transition-colors">
                    Restore Workflow
                  </button>
                )}
                <button onClick={handleDelete} className="text-red-400 border border-red-400/30 hover:bg-red-400/10 px-3 py-1.5 rounded text-sm transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
        {workflow.workflow_type === "task_status" ? (
          <div className="flex flex-col gap-4 max-w-3xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Status List</h3>
            <p className="text-sm text-zinc-400">Define the statuses available when this Task Status Workflow is selected.</p>
            {/* Implementation for Task Statuses */}
            <div className="space-y-2">
              {statuses.map(status => (
                <div key={status.id} className="flex items-center gap-4 bg-[#121212] border border-[#2a2a2a] p-3 rounded">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.colour }} />
                  <div className="flex-1 font-medium text-white">{status.name}</div>
                  <div className="text-zinc-400 text-sm w-16">{status.completion_percentage}%</div>
                  <div className="text-zinc-500 text-sm w-8 text-center">{status.position}</div>
                  {/* Needs edit capabilities - simplified for brevity, maybe just read-only or minimal edit */}
                  <span className="text-xs text-zinc-500">Edit via DB for now or implement inline</span>
                </div>
              ))}
            </div>
            <button className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm py-2 rounded mt-2 border border-[#2a2a2a] transition-colors w-32">
              + Add Status
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Processes</h3>
                <span className="text-xs text-zinc-500">Workflow changes apply to newly created items.</span>
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
                  className="flex-shrink-0 w-64 h-32 border-2 border-dashed border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500 hover:bg-zinc-900/50 transition-colors"
                >
                  <span className="text-2xl mb-1">+</span>
                  <span className="text-sm font-medium">Add Process</span>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#121212] border border-[#2a2a2a] rounded-lg overflow-y-auto p-6">
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
                <div className="flex h-full items-center justify-center text-zinc-500">
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
    </div>
  );
}
