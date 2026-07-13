"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project } from "@/types/production";
import { getProjects, deleteProject, retireProject, restoreProject } from "@/lib/data/productionRepository";
import ProjectForm from "./ProjectForm";
import { Search, Plus, Edit2, Archive, RotateCcw, Trash2, AlertTriangle } from "lucide-react";

export default function ProjectsSettings() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [impactMessages, setImpactMessages] = useState<string[]>([]);
  const [isFetchingImpact, setIsFetchingImpact] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.projectCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleRetire = async (id: string) => {
    try {
      await retireProject(id);
      loadProjects();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreProject(id);
      loadProjects();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };
  const handleInitiateDelete = async (project: Project) => {
    setConfirmDeleteId(project.id);
    setIsFetchingImpact(true);
    setImpactMessages([]);
    try {
      const res = await fetch(`/api/production/impact?entityType=Project&id=${project.id}`);
      if (res.ok) {
        const data = await res.json();
        setImpactMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
    setIsFetchingImpact(false);
  };

  const handleDelete = async (id: string) => {
    setIsProcessing(true);
    try {
      await deleteProject(id);
      setConfirmDeleteId(null);
      loadProjects();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete project. Check if there are attached environments.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isFormOpen) {
    return (
      <ProjectForm 
        project={editingProject} 
        onClose={() => {
          setIsFormOpen(false);
          loadProjects();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Projects</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Create Project
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
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-[#e0e0e0] outline-none placeholder:text-zinc-500 focus:border-zinc-500"
        />
      </div>

      <div className="overflow-hidden rounded border border-[#2a2a2a] bg-zinc-900">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-[#2a2a2a] bg-[#121212] text-xs font-bold uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-zinc-500">Loading projects...</td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-zinc-500">No projects found.</td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-white">
                    <div className="flex items-center gap-3">
                      {project.thumbnailUrl ? (
                        <div 
                          className="h-8 w-8 shrink-0 rounded bg-zinc-800 bg-cover bg-center" 
                          style={{ backgroundImage: `url(${project.thumbnailUrl})` }}
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-500">
                          {project.title.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {project.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{project.projectCode}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                      project.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-400"
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(project)} className="p-1 text-zinc-400 hover:text-white" title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {project.status === "Active" ? (
                        <button onClick={() => handleRetire(project.id)} className="p-1 text-zinc-400 hover:text-white" title="Retire">
                          <Archive className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => handleRestore(project.id)} className="p-1 text-zinc-400 hover:text-white" title="Restore">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleInitiateDelete(project)} className="p-1 text-red-500 hover:text-red-400" title="Delete" disabled={isProcessing || isFetchingImpact}>
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

      {/* Confirm Delete Modal Overlay */}
      {confirmDeleteId && (() => {
        const itemToConfirm = projects.find(i => i.id === confirmDeleteId);
        if (!itemToConfirm) return null;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#121212] border border-[#2a2a2a] rounded-lg shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-zinc-300">
                Are you sure you want to completely delete <strong>{itemToConfirm.title}</strong>?
              </p>
              
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-4 flex flex-col gap-2 mt-2">
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Impact Summary</p>
                {impactMessages.length > 0 ? (
                  <div className="text-sm text-red-400">
                    This will also permanently delete:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {impactMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">All nested items (if any) will also be deleted.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)} 
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-700 rounded" 
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)} 
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors flex items-center justify-center min-w-[140px]" 
                  disabled={isProcessing}
                >
                  {isProcessing ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
