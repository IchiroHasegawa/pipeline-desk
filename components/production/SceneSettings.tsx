"use client";

import { useState } from "react";
import type { Scene, Episode } from "@/types/production";
import { deleteScene, retireScene, restoreScene } from "@/lib/data/productionRepository";
import SceneForm from "./SceneForm";
import { Search, Plus, Edit2, Archive, RotateCcw, Trash2, ArrowLeft } from "lucide-react";

type SceneSettingsProps = {
  job: Episode;
  onClose: () => void;
  onRefresh: () => void;
};

export default function SceneSettings({ job, onClose, onRefresh }: SceneSettingsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const error = null;

  const filteredScenes = job.scenes.filter(scene => 
    scene.sceneName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (scene.description && scene.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingScene(null);
    setIsFormOpen(true);
  };

  const handleEdit = (scene: Scene) => {
    setEditingScene(scene);
    setIsFormOpen(true);
  };

  const handleRetire = async (id: string) => {
    try {
      await retireScene(id);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreScene(id);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (scene: Scene) => {
    if (confirm(`Are you sure you want to completely delete scene "${scene.sceneName}"? This cannot be undone.`)) {
      try {
        await deleteScene(scene.id);
        onRefresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete scene.");
      }
    }
  };

  if (isFormOpen) {
    return (
      <SceneForm 
        jobId={job.id}
        scene={editingScene} 
        onClose={() => {
          setIsFormOpen(false);
          onRefresh();
        }} 
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[#0a0a0a] p-6">
      <div className="mb-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              title="Back to Scenes View"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-white">
              Scenes <span className="text-zinc-500 font-normal">in {job.episodeName}</span>
            </h2>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Create Scene(s)
          </button>
        </div>

        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search scenes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-[#e0e0e0] outline-none placeholder:text-zinc-500 focus:border-zinc-500"
          />
        </div>

        <div className="overflow-hidden rounded border border-[#2a2a2a] bg-zinc-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-[#2a2a2a] bg-[#121212] text-xs font-bold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Scene Name</th>
                <th className="px-4 py-3">Workflow</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScenes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-zinc-500">
                    {searchQuery ? "No scenes found matching your search." : "No scenes exist in this job yet."}
                  </td>
                </tr>
              ) : (
                filteredScenes.map((scene) => (
                  <tr key={scene.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-white">
                      <div className="flex items-center gap-3">
                        {scene.previewImage ? (
                          <div 
                            className="h-8 w-12 shrink-0 rounded bg-zinc-800 bg-cover bg-center" 
                            style={{ backgroundImage: `url(${scene.previewImage})` }}
                          />
                        ) : (
                          <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-500">
                            {scene.sceneName.substring(0, 3).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span>{scene.sceneName}</span>
                          {scene.description && (
                            <span className="text-xs text-zinc-500 truncate max-w-[200px]">{scene.description}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{scene.workflow || "Basic"}</td>
                    <td className="px-4 py-3 text-zinc-400">{scene.priority}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                        scene.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-400"
                      }`}>
                        {scene.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(scene)} className="p-1 text-zinc-400 hover:text-white" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {scene.status === "Active" ? (
                          <button onClick={() => handleRetire(scene.id)} className="p-1 text-zinc-400 hover:text-white" title="Retire">
                            <Archive className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleRestore(scene.id)} className="p-1 text-zinc-400 hover:text-white" title="Restore">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(scene)} className="p-1 text-red-500 hover:text-red-400" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
