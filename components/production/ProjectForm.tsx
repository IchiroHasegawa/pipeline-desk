"use client";

import { useState } from "react";
import type { Project } from "@/types/production";
import { createProject, updateProject } from "@/lib/data/productionRepository";

type ProjectFormProps = {
  project: Project | null;
  onClose: () => void;
};

export default function ProjectForm({ project, onClose }: ProjectFormProps) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [projectCode, setProjectCode] = useState(project?.projectCode ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(project?.thumbnailUrl ?? "");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }
    if (!projectCode.trim()) {
      setError("Project code is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (project) {
        await updateProject(project.id, {
          title,
          projectCode,
          description,
          thumbnailUrl,
        });
      } else {
        await createProject({
          title,
          projectCode,
          description,
          thumbnailUrl,
          status: "Active",
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save project.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#121212] p-6 shadow-2xl">
        <h2 className="mb-6 text-xl font-bold text-white">
          {project ? "Edit Project" : "Create Project"}
        </h2>

        {error && (
          <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              placeholder="e.g. The Lion and Rabbit"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Project Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              placeholder="e.g. TLR"
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

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Thumbnail URL
            </label>
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              placeholder="https://example.com/image.png"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
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
              {isSubmitting ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
