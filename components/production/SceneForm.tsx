"use client";

import { useState } from "react";
import type { Scene } from "@/types/production";
import { createScenes, updateScene } from "@/lib/data/productionRepository";

type SceneFormProps = {
  jobId: string;
  scene: Scene | null;
  onClose: () => void;
};

export default function SceneForm({ jobId, scene, onClose }: SceneFormProps) {
  const isEditing = !!scene;

  const [sceneName, setSceneName] = useState(scene?.sceneName ?? "");
  const [description, setDescription] = useState(scene?.description ?? "");
  const [previewImage, setPreviewImage] = useState(scene?.previewImage ?? "");
  const [workflow, setWorkflow] = useState(scene?.workflow ?? "Basic");
  const [numberOfFrames, setNumberOfFrames] = useState(scene?.numberOfFrames ?? 1);
  const [priority, setPriority] = useState(scene?.priority ?? 4);

  const [sceneCount, setSceneCount] = useState(1);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateScene(scene.id, {
          sceneName,
          description,
          previewImage,
          workflow,
          numberOfFrames,
          priority,
        });
      } else {
        const match = sceneName.match(/^(.*?)(\d+)$/);
        const count = Math.max(1, sceneCount);
        
        let names = [sceneName];
        if (count > 1 && match) {
          names = [];
          const prefix = match[1];
          const numStr = match[2];
          const padding = numStr.length;
          const startNum = parseInt(numStr, 10);

          for (let i = 0; i < count; i++) {
            names.push(`${prefix}${String(startNum + i).padStart(padding, "0")}`);
          }
        } else if (count > 1) {
          names = [];
          for (let i = 0; i < count; i++) {
            names.push(`${sceneName}_${String(i + 1).padStart(3, "0")}`);
          }
        }

        const newScenes = names.map((name) => ({
          sceneName: name,
          description,
          previewImage,
          note: "",
          status: "Active" as const,
          workflow,
          numberOfFrames,
          priority,
        }));

        await createScenes(jobId, newScenes);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save scene(s)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#121212] p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6">
          {isEditing ? "Edit Scene" : "Create Scene(s)"}
        </h2>

        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase text-zinc-400 border-b border-zinc-800 pb-2">
              Scene Information
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {!isEditing && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Number of Scenes *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sceneCount}
                    onChange={(e) => setSceneCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                  />
                </div>
              )}
  
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">
                  {isEditing ? "Scene Name *" : "First Scene Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  placeholder="e.g., Scene_001"
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                />
              </div>
  
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-24 w-full resize-none rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                />
              </div>
  
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Default Thumbnail URL</label>
                <input
                  type="url"
                  value={previewImage}
                  onChange={(e) => setPreviewImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase text-zinc-400 border-b border-zinc-800 pb-2">
              Production Settings
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Workflow</label>
                <select
                  value={workflow}
                  onChange={(e) => setWorkflow(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                >
                  <option value="Basic">Basic</option>
                  <option value="Single Approval">Single Approval</option>
                  <option value="Double Approval">Double Approval</option>
                  <option value="Complete">Complete</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
  
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Number of Frames</label>
                <input
                  type="number"
                  min="1"
                  value={numberOfFrames}
                  onChange={(e) => setNumberOfFrames(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                />
              </div>
  
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-blue-500"
                >
                  <option value="1">1 - Critical</option>
                  <option value="2">2 - High</option>
                  <option value="3">3 - Medium</option>
                  <option value="4">4 - Normal</option>
                  <option value="5">5 - Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Scene" : "Create Scene(s)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
