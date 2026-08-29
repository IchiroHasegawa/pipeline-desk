"use client";

import { useState, useEffect } from "react";
import type { ProjectV2 } from "@/types/production-v2";
import { createProjectV2, updateProjectV2 } from "@/app/actions/production";
import { createClient } from "@/lib/supabase/client";
import ThumbnailUploader from "@/components/shared/ThumbnailUploader";

type ProjectFormProps = {
  project: ProjectV2 | null;
  onClose: (createdId?: string) => void;
};

export default function ProjectForm({ project, onClose }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title || "");
  const [projectCode, setProjectCode] = useState(project?.projectCode || "");
  const [assetCodePrefix, setAssetCodePrefix] = useState(project?.assetCodePrefix || "");
  const [defaultAssetWorkflowId, setDefaultAssetWorkflowId] = useState(project?.defaultAssetWorkflowId || "");
  const [description, setDescription] = useState(project?.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(project?.thumbnailUrl || "");

  const [assetWorkflows, setAssetWorkflows] = useState<Array<{ id: string; name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkflows() {
      const supabase = createClient();
      const { data } = await supabase
        .from("workflows")
        .select("id, name")
        .eq("workflow_type", "asset")
        .eq("status", "active")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });
      if (data) {
        setAssetWorkflows(data);
      }
    }
    void loadWorkflows();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate code regex locally just in case
      const codeRegex = /^[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/;
      if (!codeRegex.test(projectCode)) {
        throw new Error("Project code is invalid. Use only A-Z, a-z, 0-9, and underscores (no spaces or double underscores).");
      }

      if (assetCodePrefix) {
        const prefixRegex = /^[A-Za-z0-9_-]+$/;
        if (!prefixRegex.test(assetCodePrefix)) {
          throw new Error("Asset code prefix is invalid. Use only letters, numbers, dashes, and underscores.");
        }
      }

      const finalAssetCodePrefix = assetCodePrefix.trim() || projectCode;

      if (project) {
        await updateProjectV2(project.id, {
          title,
          projectCode,
          assetCodePrefix: finalAssetCodePrefix,
          defaultAssetWorkflowId: defaultAssetWorkflowId || null,
          description,
          thumbnailUrl,
        });
        onClose(project.id);
      } else {
        const newProject = await createProjectV2({
          title,
          projectCode,
          assetCodePrefix: finalAssetCodePrefix,
          defaultAssetWorkflowId: defaultAssetWorkflowId || null,
          description,
          thumbnailUrl,
          // This form collects no dates; mirror ProjectFormDialog default.
          startDate: new Date().toISOString().split("T")[0],
        });
        onClose(newProject.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save project.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl rounded border border-[#2a2a2a] bg-zinc-900 p-6">
      <h2 className="mb-6 text-xl font-bold text-white">
        {project ? "Edit Project" : "Create Project"}
      </h2>

      {error && (
        <div className="mb-6 rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-8">
        {/* Left Column: Thumbnail Uploader */}
        <div className="pt-6">
          <ThumbnailUploader value={thumbnailUrl} onChange={setThumbnailUrl} />
        </div>
        
        {/* Right Column: Form Fields */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">Project Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">Project Code *</label>
            <input
              type="text"
              required
              value={projectCode}
              onChange={(e) => {
                const nextVal = e.target.value;
                setProjectCode(nextVal);
                if (!project && !assetCodePrefix) {
                  // Keep assetCodePrefix in sync if not set
                }
              }}
              placeholder="e.g. TBA_JOB00083"
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-zinc-500"
            />
            <p className="text-[10px] text-zinc-500">Only letters, numbers, and single underscores allowed. No spaces.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">Asset Code Prefix</label>
            <input
              type="text"
              value={assetCodePrefix}
              onChange={(e) => setAssetCodePrefix(e.target.value)}
              placeholder={projectCode || "Defaults to project code"}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-zinc-500"
            />
            <p className="text-[10px] text-zinc-500">Prefix used when generating asset codes (e.g. {assetCodePrefix || projectCode || "CODE"}_101). Defaults to project code.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">Default Asset Workflow</label>
            <select
              value={defaultAssetWorkflowId}
              onChange={(e) => setDefaultAssetWorkflowId(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-zinc-500"
            >
              <option value="">None (No auto-generated tasks)</option>
              {assetWorkflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500">Workflow applied automatically to new assets created in this project.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24 w-full resize-none rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-zinc-500"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-[#2a2a2a] pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-blue-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : project ? "Save Project" : "Create Project"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

