"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WorkflowProcess, createWorkflowProcess } from "@/lib/data/workflowRepository";

type ProcessFormDialogProps = {
  isOpen: boolean;
  workflowId: string;
  nextPosition: number;
  onClose: () => void;
  onSuccess: (p: WorkflowProcess) => void;
};

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#121212] shadow-xl">
        <div className="border-b border-[#2a2a2a] px-6 py-4">
          <h2 className="text-lg font-bold text-white">Add Process</h2>
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
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-400">Process Type *</label>
            <select 
              value={processType}
              onChange={e => setProcessType(e.target.value)}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="Manual">Manual</option>
              <option value="Approval">Approval</option>
              <option value="Asset Progress">Asset Progress</option>
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
            <label className="mb-1 block text-sm font-medium text-zinc-400">Position *</label>
            <input 
              type="number" 
              value={position}
              onChange={e => setPosition(parseInt(e.target.value) || 1)}
              min={1}
              className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              required
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
              {loading ? "Adding..." : "Add Process"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
