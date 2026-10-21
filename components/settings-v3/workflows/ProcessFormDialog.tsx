// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkflowProcess, createWorkflowProcess } from "@/lib/data/workflowRepository";
import { Select } from "@/components/app-shell";

type ProcessFormDialogProps = {
  isOpen: boolean;
  workflowId: string;
  nextPosition: number;
  onClose: () => void;
  onSuccess: (p: WorkflowProcess) => void;
};

const PROCESS_TYPE_OPTIONS = [
  { value: "Manual", label: "Manual" },
  { value: "Approval", label: "Approval" },
  { value: "Asset Progress", label: "Asset Progress" },
];

export default function ProcessFormDialog({ isOpen, workflowId, nextPosition, onClose, onSuccess }: ProcessFormDialogProps) {
  const [name, setName] = useState("");
  const [processType, setProcessType] = useState("Manual");
  const [colour, setColour] = useState("#8b5cf6");
  const [position, setPosition] = useState(nextPosition);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newProcess = await createWorkflowProcess(supabase, {
        workflow_id: workflowId,
        name: name.trim(),
        process_type: processType,
        colour,
        position,
      });
      onSuccess(newProcess);
    } catch (err) {
      setError("Unable to create Process.");
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
          <h2 className="text-lg font-bold text-[var(--po-ink)]">Add Process</h2>
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
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--po-ink-2)]">Process Type *</label>
            <Select
              value={processType}
              options={PROCESS_TYPE_OPTIONS}
              onChange={setProcessType}
              ariaLabel="Process Type"
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
            <label className="mb-1 block text-sm font-medium text-[var(--po-ink-2)]">Position *</label>
            <input 
              type="number" 
              value={position}
              onChange={e => setPosition(parseInt(e.target.value) || 1)}
              min={1}
              className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-[var(--po-ink)] focus:border-[var(--po-accent)] focus:outline-none text-sm"
              required
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
              {loading ? "Adding..." : "Add Process"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
