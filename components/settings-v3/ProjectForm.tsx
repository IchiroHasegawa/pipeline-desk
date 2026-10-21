// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useState, useEffect } from "react";
import type { ProjectV2 } from "@/types/production-v2";
import { createProjectV2, updateProjectV2 } from "@/app/actions/production";
import { createClient } from "@/lib/supabase/client";
import ThumbnailUploader from "@/components/shared/ThumbnailUploader";
import { Select } from "@/components/app-shell";

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

  const workflowOptions = [
    { value: "", label: "None (No auto-generated tasks)" },
    ...assetWorkflows.map((w) => ({ value: w.id, label: w.name })),
  ];

  return (
    <div className="max-w-3xl rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] p-6 shadow-[var(--po-shadow-sm)]">
      <h2 className="mb-6 text-xl font-bold text-[var(--po-ink)]">
        {project ? "Edit Project" : "Create Project"}
      </h2>

      {error && (
        <div className="mb-6 rounded-[12px] border border-[#E5534B]/30 bg-[#E5534B]/10 p-4 text-sm text-[#E5534B]">
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
            <label className="text-xs font-bold uppercase text-[var(--po-ink-2)]">Project Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-sm text-[var(--po-ink)] outline-none focus:border-[var(--po-accent)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--po-ink-2)]">Project Code *</label>
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
              className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-sm text-[var(--po-ink)] outline-none focus:border-[var(--po-accent)]"
            />
            <p className="text-[10px] text-[var(--po-ink-3)]">Only letters, numbers, and single underscores allowed. No spaces.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--po-ink-2)]">Asset Code Prefix</label>
            <input
              type="text"
              value={assetCodePrefix}
              onChange={(e) => setAssetCodePrefix(e.target.value)}
              placeholder={projectCode || "Defaults to project code"}
              className="w-full rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-sm text-[var(--po-ink)] outline-none focus:border-[var(--po-accent)]"
            />
            <p className="text-[10px] text-[var(--po-ink-3)]">Prefix used when generating asset codes (e.g. {assetCodePrefix || projectCode || "CODE"}_101). Defaults to project code.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--po-ink-2)]">Default Asset Workflow</label>
            <Select
              value={defaultAssetWorkflowId || ""}
              options={workflowOptions}
              onChange={(val) => setDefaultAssetWorkflowId(val)}
              ariaLabel="Default Asset Workflow"
              placeholder="Select default asset workflow..."
            />
            <p className="text-[10px] text-[var(--po-ink-3)]">Workflow applied automatically to new assets created in this project.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[var(--po-ink-2)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24 w-full resize-none rounded-[10px] border border-[var(--po-line-2)] bg-[var(--po-panel)] px-3 py-2 text-sm text-[var(--po-ink)] outline-none focus:border-[var(--po-accent)]"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-[var(--po-line)] pt-4">
            <button
              type="button"
              onClick={() => onClose()}
              className="rounded-full border border-[var(--po-line-2)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--po-ink)] transition-colors hover:bg-[var(--po-chip)]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[var(--po-ink)] px-6 py-2 text-sm font-bold text-[var(--po-panel)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : project ? "Save Project" : "Create Project"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
