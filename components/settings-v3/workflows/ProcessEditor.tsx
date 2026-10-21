// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkflowProcess, updateWorkflowProcess, deleteWorkflowProcess, Workflow, getWorkflows, getTaskStatuses, WorkflowTaskStatus } from "@/lib/data/workflowRepository";
import { Select, ConfirmDialog } from "@/components/app-shell";

type ProcessEditorProps = {
  process: WorkflowProcess;
  onProcessUpdated: (p: WorkflowProcess) => void;
  onProcessDeleted: (id: string) => void;
};

const PROCESS_TYPE_OPTIONS = [
  { value: "Manual", label: "Manual" },
  { value: "Approval", label: "Approval" },
  { value: "Asset Progress", label: "Asset Progress" },
];

const TAKE_RETAKE_OPTIONS = [
  { value: "Take", label: "Take" },
  { value: "Retake", label: "Retake" },
];

export default function ProcessEditor({ process, onProcessUpdated, onProcessDeleted }: ProcessEditorProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<WorkflowProcess>>({});
  const [taskStatusWorkflows, setTaskStatusWorkflows] = useState<Workflow[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<WorkflowTaskStatus[]>([]);

  const supabase = createClient();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setErrorMessage(null);
    try {
      const updated = await updateWorkflowProcess(supabase, process.id, formData);
      onProcessUpdated(updated);
    } catch {
      setErrorMessage("Unable to update Process.");
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    setDeleting(true);
    setErrorMessage(null);
    try {
      await deleteWorkflowProcess(supabase, process.id);
      setIsConfirmDeleteOpen(false);
      onProcessDeleted(process.id);
    } catch {
      setErrorMessage("Unable to delete Process.");
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (field: keyof WorkflowProcess, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value as WorkflowProcess[keyof WorkflowProcess] }));
  };

  const hasChanges = JSON.stringify({ ...process, ...formData }) !== JSON.stringify(process);

  const statusWorkflowOptions = [
    { value: "", label: "None (Hardcoded defaults)" },
    ...taskStatusWorkflows.map(w => ({ value: w.id, label: w.name })),
  ];

  const taskStatusOptions = [
    { value: "", label: "Select a status..." },
    ...taskStatuses.map(s => ({ value: s.id, label: `${s.name} (${s.completion_percentage}%)` })),
  ];

  const assigneeGroupOptions = [
    { value: "", label: "Unassigned" },
    { value: "placeholder-group", label: "Groups coming later", disabled: true },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-[var(--po-ink)] uppercase tracking-wider">
          Process Details: {process.name}
        </h3>
        <div className="flex gap-2">
          {hasChanges && (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[var(--po-ink)] hover:opacity-90 text-[var(--po-panel)] text-xs font-semibold px-4 py-1.5 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
          <button 
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="rounded-full text-[#E5534B] border border-[#E5534B]/30 hover:bg-[#E5534B]/10 px-4 py-1.5 text-xs font-medium transition-colors"
          >
            Delete Process
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-[12px] border border-[#E5534B]/30 bg-[#E5534B]/10 p-3 text-xs text-[#E5534B]">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[var(--po-ink-3)] uppercase border-b border-[var(--po-line)] pb-2">Basic Information</h4>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Name</label>
            <input 
              type="text" 
              value={formData.name || ""}
              onChange={e => handleChange("name", e.target.value)}
              className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Process Type</label>
              <Select
                value={formData.process_type || "Manual"}
                options={PROCESS_TYPE_OPTIONS}
                onChange={val => handleChange("process_type", val)}
                ariaLabel="Process Type"
              />
            </div>
            
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Colour</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  value={formData.colour || "#ffffff"}
                  onChange={e => handleChange("colour", e.target.value)}
                  className="h-9 w-9 rounded-[8px] cursor-pointer border-0 p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={formData.colour || "#ffffff"}
                  onChange={e => handleChange("colour", e.target.value)}
                  className="flex-1 rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none uppercase font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Position (Order)</label>
            <input 
              type="number" 
              value={formData.position || 0}
              onChange={e => handleChange("position", parseInt(e.target.value) || 0)}
              className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Task Information */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[var(--po-ink-3)] uppercase border-b border-[var(--po-line)] pb-2">Task Information Defaults</h4>
          
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Task Status Workflow</label>
            <Select
              value={formData.task_status_workflow_id || ""}
              options={statusWorkflowOptions}
              onChange={val => {
                handleChange("task_status_workflow_id", val || null);
                handleChange("default_task_status_id", null);
              }}
              ariaLabel="Task Status Workflow"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Default Status</label>
            <Select
              value={formData.default_task_status_id || ""}
              options={taskStatusOptions}
              onChange={val => {
                const statusId = val || null;
                handleChange("default_task_status_id", statusId);
                const s = taskStatuses.find(st => st.id === statusId);
                if (s) {
                  handleChange("default_completion", s.completion_percentage);
                }
              }}
              disabled={!formData.task_status_workflow_id}
              ariaLabel="Default Status"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Default Completion (%)</label>
              <input 
                type="number" 
                min={0} max={100}
                value={formData.default_completion || 0}
                onChange={e => handleChange("default_completion", parseInt(e.target.value) || 0)}
                className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Assignee Group</label>
              <Select
                value={formData.assignee_group_id || ""}
                options={assigneeGroupOptions}
                onChange={val => handleChange("assignee_group_id", val || null)}
                ariaLabel="Assignee Group"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Duration (Days)</label>
              <input 
                type="number" 
                min={0} step="0.5"
                value={formData.duration_days || 0}
                onChange={e => handleChange("duration_days", parseFloat(e.target.value) || 0)}
                className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Effort (Hours)</label>
              <input 
                type="number" 
                min={0} step="0.5"
                value={formData.effort_hours || 0}
                onChange={e => handleChange("effort_hours", parseFloat(e.target.value) || 0)}
                className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Take / Retake Mode</label>
              <Select
                value={formData.take_retake_mode || "Take"}
                options={TAKE_RETAKE_OPTIONS}
                onChange={val => handleChange("take_retake_mode", val)}
                ariaLabel="Take / Retake Mode"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[var(--po-ink-2)]">Take / Retake Count</label>
              <input 
                type="number" 
                min={1}
                value={formData.take_retake_count || 1}
                onChange={e => handleChange("take_retake_count", parseInt(e.target.value) || 1)}
                className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Behaviours Placeholder */}
      <div className="mt-8 pt-6 border-t border-[var(--po-line)]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-bold text-[var(--po-ink-3)] uppercase tracking-wider">Behaviours</h4>
          <button disabled className="rounded-full bg-[var(--po-chip)] text-[var(--po-ink-3)] text-xs font-medium px-4 py-1.5 cursor-not-allowed border border-[var(--po-line)]">
            + Add Behaviour
          </button>
        </div>
        <div className="bg-[var(--po-chip)] border border-[var(--po-line)] rounded-[14px] p-6 text-center text-sm text-[var(--po-ink-3)]">
          No Behaviours have been configured for this Process.<br/>
          <span className="text-xs mt-1 block">Coming in a later phase.</span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title="Delete Process"
        description={`Are you sure you want to delete Process '${process.name}'?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleting}
        onConfirm={executeDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
}
