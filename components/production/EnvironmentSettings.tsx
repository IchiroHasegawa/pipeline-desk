"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProductionEnvironment } from "@/types/production";
import { getEnvironmentsByProject, deleteEnvironment, retireEnvironment, restoreEnvironment } from "@/lib/data/productionRepository";
import EnvironmentForm from "./EnvironmentForm";
import { Search, Plus, Edit2, Archive, RotateCcw, Trash2, ArrowLeft } from "lucide-react";

type EnvironmentSettingsProps = {
  projectId: string;
  projectName: string;
  onClose: () => void;
};

export default function EnvironmentSettings({ projectId, projectName, onClose }: EnvironmentSettingsProps) {
  const [environments, setEnvironments] = useState<ProductionEnvironment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingEnvironment, setEditingEnvironment] = useState<ProductionEnvironment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEnvironments = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEnvironmentsByProject(projectId);
      setEnvironments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load environments.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEnvironments();
  }, [loadEnvironments]);

  const filteredEnvironments = environments.filter(env => 
    env.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (env.description && env.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingEnvironment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (env: ProductionEnvironment) => {
    setEditingEnvironment(env);
    setIsFormOpen(true);
  };

  const handleRetire = async (id: string) => {
    try {
      await retireEnvironment(id);
      loadEnvironments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreEnvironment(id);
      loadEnvironments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (env: ProductionEnvironment) => {
    if (confirm(`Are you sure you want to completely delete environment "${env.name}"? This cannot be undone.`)) {
      try {
        await deleteEnvironment(env.id);
        loadEnvironments();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete environment.");
      }
    }
  };

  if (isFormOpen) {
    return (
      <EnvironmentForm 
        projectId={projectId}
        environment={editingEnvironment} 
        onClose={() => {
          setIsFormOpen(false);
          loadEnvironments();
        }} 
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-[#0a0a0a] p-6">
      <div className="mb-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              title="Back to Production"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-white">
              Environments <span className="text-zinc-500 font-normal">for {projectName}</span>
            </h2>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Create Environment
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
            placeholder="Search environments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-[#e0e0e0] outline-none placeholder:text-zinc-500 focus:border-zinc-500"
          />
        </div>

        <div className="overflow-hidden rounded border border-[#2a2a2a] bg-zinc-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-[#2a2a2a] bg-[#121212] text-xs font-bold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Environment</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-zinc-500">Loading environments...</td>
                </tr>
              ) : filteredEnvironments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-zinc-500">
                    {searchQuery ? "No environments found matching your search." : "No environments exist yet."}
                  </td>
                </tr>
              ) : (
                filteredEnvironments.map((env) => (
                  <tr key={env.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-white">
                      <div className="flex items-center gap-3">
                        {env.thumbnailUrl ? (
                          <div 
                            className="h-8 w-8 shrink-0 rounded bg-zinc-800 bg-cover bg-center" 
                            style={{ backgroundImage: `url(${env.thumbnailUrl})` }}
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-500">
                            {env.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {env.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 truncate max-w-[200px]">{env.description || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                        env.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-400"
                      }`}>
                        {env.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(env)} className="p-1 text-zinc-400 hover:text-white" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {env.status === "Active" ? (
                          <button onClick={() => handleRetire(env.id)} className="p-1 text-zinc-400 hover:text-white" title="Retire">
                            <Archive className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleRestore(env.id)} className="p-1 text-zinc-400 hover:text-white" title="Restore">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(env)} className="p-1 text-red-500 hover:text-red-400" title="Delete">
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
