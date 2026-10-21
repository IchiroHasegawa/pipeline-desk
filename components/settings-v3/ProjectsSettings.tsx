// Copied from components/settings for the redesign; the original is removed at cutover.
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProjectV2 } from "@/types/production-v2";
import { getProjectsV2, deleteProjectV2, retireProjectV2, restoreProjectV2 } from "@/app/actions/production";
import ProjectForm from "./ProjectForm";
import { Search, Plus, Edit2, Archive, RotateCcw, Trash2, AlertTriangle, X } from "lucide-react";

export default function ProjectsSettings() {
  const [projects, setProjects] = useState<ProjectV2[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingProject, setEditingProject] = useState<ProjectV2 | null>(null);
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
      const data = await getProjectsV2();
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

  const handleEdit = (project: ProjectV2) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleRetire = async (id: string) => {
    setError(null);
    try {
      await retireProjectV2(id);
      loadProjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRestore = async (id: string) => {
    setError(null);
    try {
      await restoreProjectV2(id);
      loadProjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleInitiateDelete = async (project: ProjectV2) => {
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
    setError(null);
    try {
      await deleteProjectV2(id);
      setConfirmDeleteId(null);
      loadProjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete project. Check if there are attached episodes.");
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
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--po-ink)]">Projects</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-full bg-[var(--po-ink)] px-5 py-2 text-sm font-semibold text-[var(--po-panel)] transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      </div>

      {error && (
        <div className="rounded-[14px] border border-[#E5534B]/30 bg-[#E5534B]/10 p-4 text-sm text-[#E5534B] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[#E5534B] hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--po-ink-3)]" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border border-[var(--po-line-2)] bg-[var(--po-panel)] py-2 pl-10 pr-4 text-sm text-[var(--po-ink)] outline-none placeholder:text-[var(--po-ink-3)] focus:border-[var(--po-accent)]"
        />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[var(--po-line)] bg-[var(--po-card)] shadow-[var(--po-shadow-sm)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-[var(--po-line)] bg-[var(--po-bg)]/40 text-xs font-semibold uppercase text-[var(--po-ink-3)]">
            <tr>
              <th className="px-5 py-3.5">Project</th>
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[var(--po-ink-3)]">Loading projects...</td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[var(--po-ink-3)]">No projects found.</td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id} className="border-b border-[var(--po-line)] last:border-0 hover:bg-[var(--po-chip)]/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[var(--po-ink)]">
                    <div className="flex items-center gap-3">
                      {project.thumbnailUrl ? (
                        <div 
                          className="h-8 w-8 shrink-0 rounded-[8px] bg-[var(--po-chip)] bg-cover bg-center border border-[var(--po-line)]" 
                          style={{ backgroundImage: `url(${project.thumbnailUrl})` }}
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--po-chip)] text-xs font-bold text-[var(--po-ink-2)] border border-[var(--po-line)]">
                          {project.title.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{project.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--po-ink-2)] font-mono text-xs">{project.projectCode}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      project.status === "Active" 
                        ? "bg-[#28A745]/15 text-[#28A745] border border-[#28A745]/30" 
                        : "bg-[var(--po-chip)] text-[var(--po-ink-3)] border border-[var(--po-line-2)]"
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(project)} 
                        className="p-1.5 rounded-[8px] text-[var(--po-ink-3)] hover:text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors" 
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {project.status === "Active" ? (
                        <button 
                          onClick={() => handleRetire(project.id)} 
                          className="p-1.5 rounded-[8px] text-[var(--po-ink-3)] hover:text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors" 
                          title="Retire"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRestore(project.id)} 
                          className="p-1.5 rounded-[8px] text-[var(--po-ink-3)] hover:text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors" 
                          title="Restore"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleInitiateDelete(project)} 
                        className="p-1.5 rounded-[8px] text-[#E5534B] hover:bg-[#E5534B]/10 transition-colors" 
                        title="Delete" 
                        disabled={isProcessing || isFetchingImpact}
                      >
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

      {/* Confirm Delete Modal Overlay styled with Production OS design */}
      {confirmDeleteId && (() => {
        const itemToConfirm = projects.find(i => i.id === confirmDeleteId);
        if (!itemToConfirm) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md bg-[var(--po-card)] border border-[var(--po-line)] rounded-[22px] shadow-[var(--po-shadow-lg)] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-[#E5534B]">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#E5534B]/15 text-[#E5534B]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--po-ink)]">Confirm Deletion</h3>
              </div>
              <p className="text-sm text-[var(--po-ink-2)]">
                Are you sure you want to completely delete <strong className="text-[var(--po-ink)]">{itemToConfirm.title}</strong>?
              </p>
              
              <div className="bg-[var(--po-chip)] border border-[var(--po-line)] rounded-[14px] p-4 flex flex-col gap-2 mt-1">
                <p className="text-[10px] text-[var(--po-ink-3)] font-semibold uppercase tracking-wider">Impact Summary</p>
                {impactMessages.length > 0 ? (
                  <div className="text-sm text-[#E5534B]">
                    This will also permanently delete:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {impactMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--po-ink-3)]">All nested items (if any) will also be deleted.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)} 
                  className="rounded-full border border-[var(--po-line-2)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--po-ink)] hover:bg-[var(--po-chip)] transition-colors" 
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)} 
                  className="rounded-full bg-[#E5534B] hover:opacity-90 text-white px-5 py-2 text-sm font-semibold transition-opacity flex items-center justify-center min-w-[140px]" 
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
