"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project } from "@/types/production";
import { getProjects, deleteProject, retireProject, restoreProject } from "@/lib/data/productionRepository";
import ProjectForm from "./ProjectForm";
import { Search, Plus, Edit2, Archive, RotateCcw, Trash2 } from "lucide-react";

export default function ProjectsSettings() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (project: Project) => {
    if (project.environments && project.environments.length > 0) {
      alert(`Cannot delete project "${project.title}" because it contains environments. You must retire, move, or delete them first.`);
      return;
    }

    if (confirm(`Are you sure you want to completely delete project "${project.title}"? This cannot be undone.`)) {
      try {
        await deleteProject(project.id);
        loadProjects();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete project. Check if there are attached environments.");
      }
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
                      <button onClick={() => handleDelete(project)} className="p-1 text-red-500 hover:text-red-400" title="Delete">
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
  );
}
