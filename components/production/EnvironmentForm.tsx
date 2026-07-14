"use client";

import { useState } from "react";
import type { ProductionEnvironment } from "@/types/production";
import { createEnvironment, updateEnvironment } from "@/lib/data/productionRepository";
import ThumbnailUploader from "@/components/shared/ThumbnailUploader";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Workflow, getWorkflows, generateWorkflowTasks } from "@/lib/data/workflowRepository";

type EnvironmentFormProps = {
  projectId: string;
  environment: ProductionEnvironment | null;
  onClose: (createdId?: string) => void;
};

export default function EnvironmentForm({ projectId, environment, onClose }: EnvironmentFormProps) {
  const [name, setName] = useState(environment?.name ?? "");
  const [description, setDescription] = useState(environment?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(environment?.thumbnailUrl ?? "");
  const [workflowId, setWorkflowId] = useState("");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!environment) {
      getWorkflows(supabase, "environment")
        .then(data => setWorkflows((data || []).filter(w => w.status === 'active')))
        .catch(console.error);
    }
  }, [environment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Environment name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (environment) {
        await updateEnvironment(environment.id, {
          name,
          description,
          thumbnailUrl,
        });
        onClose(environment.id);
      } else {
        const newEnv = await createEnvironment({
          projectId,
          name,
          description,
          thumbnailUrl,
          status: "Active",
        });
        
        if (workflowId) {
          try {
            await generateWorkflowTasks(supabase, "environment", newEnv.id, workflowId);
          } catch (taskErr) {
            console.error("Failed to generate workflow tasks:", taskErr);
            // Non-blocking error
          }
        }
        
        onClose(newEnv.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save environment.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border border-[#2a2a2a] bg-[#121212] p-6 shadow-2xl">
        <h2 className="mb-6 text-xl font-bold text-white">
          {environment ? "Edit Environment" : "Create Environment"}
        </h2>

        {error && (
          <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-8">
          <div className="pt-6">
            <ThumbnailUploader value={thumbnailUrl} onChange={setThumbnailUrl} />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Environment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                placeholder="e.g. Layout, Animation, Pre-Production"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                placeholder="Optional description"
                rows={3}
              />
            </div>

            {!environment && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Workflow (Optional)
                </label>
                <select
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">No Workflow</option>
                  {workflows.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {!workflowId && (
                  <p className="mt-1 text-xs text-zinc-500">No Tasks will be created automatically.</p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
              <button
                type="button"
                onClick={() => onClose()}
                className="rounded px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Environment"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
