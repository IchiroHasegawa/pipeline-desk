// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Workflow, createWorkflow, getWorkflowProcesses, createWorkflowProcess, getTaskStatuses, createTaskStatus } from "@/lib/data/workflowRepository";
import { Select } from "@/components/app-shell";

type WorkflowFormDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newId: string) => void;
  workflows: Workflow[];
};

const WORKFLOW_TYPE_OPTIONS = [
  { value: "job", label: "Job" },
  { value: "scene", label: "Scene" },
  { value: "asset", label: "Asset" },
  { value: "task_status", label: "Task Status" },
];

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

  const copyFromOptions = [
    { value: "", label: "None (Blank Workflow)" },
    ...compatibleWorkflows.map(w => ({ value: w.id, label: w.name })),
  ];

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
              default_task_status_id: null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-lg)] overflow-hidden">
        <div className="border-b border-[var(--po-line)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--po-ink)]">Add Workflow</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="text-sm text-[#E5534B] bg-[#E5534B]/10 border border-[#E5534B]/30 rounded-[10px] p-3">{error}</div>}
          
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--po-ink-2)]">Name *</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--po-ink-2)]">Type *</label>
            <Select
              value={type}
              options={WORKFLOW_TYPE_OPTIONS}
              onChange={val => {
                setType(val);
                setCopyFromId("");
              }}
              ariaLabel="Workflow Type"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--po-ink-2)]">Colour *</label>
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
                className="flex-1 rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none uppercase font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--po-ink-2)]">Copy From (Optional)</label>
            <Select
              value={copyFromId}
              options={copyFromOptions}
              onChange={setCopyFromId}
              ariaLabel="Copy From Workflow"
              placeholder="None (Blank Workflow)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--po-ink-2)]">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--po-line)]">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-[var(--po-line-2)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="rounded-full bg-[var(--po-ink)] px-5 py-2 text-sm font-semibold text-[var(--po-panel)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Creating..." : "Create Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
