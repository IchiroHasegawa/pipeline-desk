"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkflowProcess, updateWorkflowProcess, deleteWorkflowProcess, Workflow, getWorkflows, getTaskStatuses, WorkflowTaskStatus } from "@/lib/data/workflowRepository";

type ProcessEditorProps = {
  process: WorkflowProcess;
  onProcessUpdated: (p: WorkflowProcess) => void;
  onProcessDeleted: (id: string) => void;
};

export default function ProcessEditor({ process, onProcessUpdated, onProcessDeleted }: ProcessEditorProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<WorkflowProcess>>({});
  const [taskStatusWorkflows, setTaskStatusWorkflows] = useState<Workflow[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<WorkflowTaskStatus[]>([]);

  const supabase = createClient();

  useEffect(() => {
    setFormData(process);
    
    async function loadStatusWorkflows() {
      try {
        const wfs = await getWorkflows(supabase, "task_status");
        setTaskStatusWorkflows(wfs || []);
      } catch {
        console.error("Failed to load workflows");
      }
    }
    
    loadStatusWorkflows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process.id]);

  useEffect(() => {
    async function loadStatuses(workflowId: string) {
      try {
        const statuses = await getTaskStatuses(supabase, workflowId);
        setTaskStatuses(statuses || []);
      } catch {
        console.error("Failed to load statuses");
      }
    }

    if (formData.task_status_workflow_id) {
      loadStatuses(formData.task_status_workflow_id);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTaskStatuses([]);
    }
  }, [formData.task_status_workflow_id, supabase]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateWorkflowProcess(supabase, process.id, formData);
      onProcessUpdated(updated);
    } catch {
      alert("Unable to update Process.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete Process '${process.name}'?`)) {
      try {
        await deleteWorkflowProcess(supabase, process.id);
        onProcessDeleted(process.id);
      } catch {
        alert("Unable to delete Process.");
      }
    }
  };

  const handleChange = (field: keyof WorkflowProcess, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
  };

  const hasChanges = JSON.stringify({ ...process, ...formData }) !== JSON.stringify(process);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Process Details: {process.name}</h3>
        <div className="flex gap-2">
          {hasChanges && (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
          <button 
            onClick={handleDelete}
            className="text-red-400 border border-red-400/30 hover:bg-red-400/10 px-3 py-1.5 rounded text-xs transition-colors"
          >
            Delete Process
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-500 uppercase border-b border-[#2a2a2a] pb-2">Basic Information</h4>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Name</label>
            <input 
              type="text" 
              value={formData.name || ""}
              onChange={e => handleChange("name", e.target.value)}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Process Type</label>
              <select 
                value={formData.process_type || "Manual"}
                onChange={e => handleChange("process_type", e.target.value)}
                className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="Manual">Manual</option>
                <option value="Approval">Approval</option>
                <option value="Asset Progress">Asset Progress</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Colour</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  value={formData.colour || "#ffffff"}
                  onChange={e => handleChange("colour", e.target.value)}
                  className="h-9 w-9 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={formData.colour || "#ffffff"}
                  onChange={e => handleChange("colour", e.target.value)}
                  className="flex-1 rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none uppercase font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Position (Order)</label>
            <input 
              type="number" 
              value={formData.position || 0}
              onChange={e => handleChange("position", parseInt(e.target.value) || 0)}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Task Information */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-zinc-500 uppercase border-b border-[#2a2a2a] pb-2">Task Information Defaults</h4>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Task Status Workflow</label>
            <select 
              value={formData.task_status_workflow_id || ""}
              onChange={e => {
                handleChange("task_status_workflow_id", e.target.value || null);
                handleChange("default_task_status_id", null);
              }}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="">None (Hardcoded defaults)</option>
              {taskStatusWorkflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Default Status</label>
            <select 
              value={formData.default_task_status_id || ""}
              onChange={e => {
                const statusId = e.target.value || null;
                handleChange("default_task_status_id", statusId);
                const s = taskStatuses.find(st => st.id === statusId);
                if (s) {
                  handleChange("default_completion", s.completion_percentage);
                }
              }}
              disabled={!formData.task_status_workflow_id}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm disabled:opacity-50"
            >
              <option value="">Select a status...</option>
              {taskStatuses.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.completion_percentage}%)</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Default Completion (%)</label>
              <input 
                type="number" 
                min={0} max={100}
                value={formData.default_completion || 0}
                onChange={e => handleChange("default_completion", parseInt(e.target.value) || 0)}
                className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Assignee Group</label>
              <select 
                value={formData.assignee_group_id || ""}
                onChange={e => handleChange("assignee_group_id", e.target.value || null)}
                className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="">Unassigned</option>
                {/* Groups not fully implemented, placeholder */}
                <option value="placeholder-group" disabled>Groups coming later</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Duration (Days)</label>
              <input 
                type="number" 
                min={0} step="0.5"
                value={formData.duration_days || 0}
                onChange={e => handleChange("duration_days", parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Effort (Hours)</label>
              <input 
                type="number" 
                min={0} step="0.5"
                value={formData.effort_hours || 0}
                onChange={e => handleChange("effort_hours", parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Take / Retake Mode</label>
              <select 
                value={formData.take_retake_mode || "Take"}
                onChange={e => handleChange("take_retake_mode", e.target.value)}
                className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="Take">Take</option>
                <option value="Retake">Retake</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Take / Retake Count</label>
              <input 
                type="number" 
                min={1}
                value={formData.take_retake_count || 1}
                onChange={e => handleChange("take_retake_count", parseInt(e.target.value) || 1)}
                className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Behaviours Placeholder */}
      <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Behaviours</h4>
          <button disabled className="bg-zinc-800 text-zinc-500 text-xs font-medium px-3 py-1.5 rounded cursor-not-allowed border border-[#2a2a2a]">
            + Add Behaviour
          </button>
        </div>
        <div className="bg-zinc-900/50 border border-[#2a2a2a] rounded p-6 text-center text-sm text-zinc-500">
          No Behaviours have been configured for this Process.<br/>
          <span className="text-xs mt-1 block">Coming in a later phase.</span>
        </div>
      </div>
    </div>
  );
}
