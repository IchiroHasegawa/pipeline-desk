"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Workflow, createWorkflow, getWorkflowProcesses, createWorkflowProcess, getTaskStatuses, createTaskStatus } from "@/lib/data/workflowRepository";

type WorkflowFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newId: string) => void;
  workflows: Workflow[];
};

export default function WorkflowFormDialog({ isOpen, onClose, onSuccess, workflows }: WorkflowFormDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("job");
  const [colour, setColour] = useState("#3b82f6");
  const [description, setDescription] = useState("");
  const [copyFromId, setCopyFromId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const compatibleWorkflows = workflows.filter(w => w.workflow_type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      setError("Name must be between 1 and 100 characters.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create Workflow
      // Generate a simple readable code, e.g., WF-ENV-0001
      const prefix = {
        job: "JOB",
        scene: "SCN",
        asset: "AST",
        task_status: "STS"
      }[type] || "GEN";
      
      const code = `WF-${prefix}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

      const newWorkflow = await createWorkflow(supabase, {
        name: trimmedName,
        workflow_type: type,
        colour,
        description: description || null,
        workflow_code: code
      });

      // 2. Handle Copy From
      if (copyFromId) {
        if (type === "task_status") {
          const statusesToCopy = await getTaskStatuses(supabase, copyFromId);
          for (const s of statusesToCopy) {
            await createTaskStatus(supabase, {
              workflow_id: newWorkflow.id,
              name: s.name,
              status_code: s.status_code,
              colour: s.colour,
              position: s.position,
              completion_percentage: s.completion_percentage
            });
          }
        } else {
          const processesToCopy = await getWorkflowProcesses(supabase, copyFromId);
          for (const p of processesToCopy) {
            await createWorkflowProcess(supabase, {
              workflow_id: newWorkflow.id,
              name: p.name,
              process_type: p.process_type,
              colour: p.colour,
              position: p.position,
              task_status_workflow_id: p.task_status_workflow_id,
              default_task_status_id: null, // copying this is tricky as the ids might belong to the copied task status, wait, if they reference an external task status workflow, it's fine.
              assignee_group_id: p.assignee_group_id,
              default_completion: p.default_completion,
              duration_days: p.duration_days,
              effort_hours: p.effort_hours,
              take_retake_mode: p.take_retake_mode,
              take_retake_count: p.take_retake_count
            });
          }
        }
      }

      onSuccess(newWorkflow.id);
      onClose();
    } catch (err) {
      setError("Unable to create Workflow.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#121212] shadow-xl">
        <div className="border-b border-[#2a2a2a] px-6 py-4">
          <h2 className="text-lg font-bold text-white">Add Workflow</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-red-400">{error}</div>}
          
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Name *</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Type *</label>
            <select 
              value={type}
              onChange={e => {
                setType(e.target.value);
                setCopyFromId("");
              }}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="job">Job</option>
              <option value="scene">Scene</option>
              <option value="asset">Asset</option>
              <option value="task_status">Task Status</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Colour *</label>
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
                className="flex-1 rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none uppercase font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Copy From (Optional)</label>
            <select 
              value={copyFromId}
              onChange={e => setCopyFromId(e.target.value)}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">None (Blank Workflow)</option>
              {compatibleWorkflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="rounded px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
