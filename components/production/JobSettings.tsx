"use client";

import { useState } from "react";
import type { Episode, ProductionEnvironment } from "@/types/production";
import { deleteJob, retireJob, restoreJob } from "@/lib/data/productionRepository";
import JobForm from "./JobForm";
import { Search, Plus, Edit2, Archive, RotateCcw, Trash2, ArrowLeft, ExternalLink } from "lucide-react";

type JobSettingsProps = {
  environment: ProductionEnvironment;
  onClose: () => void;
  onSelectJob: (job: Episode) => void;
  onRefresh: () => void;
};

export default function JobSettings({ environment, onClose, onSelectJob, onRefresh }: JobSettingsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const [editingJob, setEditingJob] = useState<Episode | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const error = null;

  const filteredJobs = environment.episodes.filter(job => 
    job.episodeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = () => {
    setEditingJob(null);
    setIsFormOpen(true);
  };

  const handleEdit = (job: Episode) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleRetire = async (id: string) => {
    try {
      await retireJob(id);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreJob(id);
      onRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (job: Episode) => {
    if (confirm(`Are you sure you want to completely delete job "${job.episodeName}"? This cannot be undone.`)) {
      try {
        await deleteJob(job.id);
        onRefresh();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete job.");
      }
    }
  };

  if (isFormOpen) {
    return (
      <JobForm 
        environmentId={environment.id}
        job={editingJob} 
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
              title="Back to Environment"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-white">
              Jobs <span className="text-zinc-500 font-normal">in {environment.name}</span>
            </h2>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Create Job(s)
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
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-[#e0e0e0] outline-none placeholder:text-zinc-500 focus:border-zinc-500"
          />
        </div>

        <div className="overflow-hidden rounded border border-[#2a2a2a] bg-zinc-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-[#2a2a2a] bg-[#121212] text-xs font-bold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Job Name</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">Workflows</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-zinc-500">
                    {searchQuery ? "No jobs found matching your search." : "No jobs exist in this environment yet."}
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-white">
                      <div className="flex items-center gap-3">
                        {job.previewImage ? (
                          <div 
                            className="h-8 w-12 shrink-0 rounded bg-zinc-800 bg-cover bg-center" 
                            style={{ backgroundImage: `url(${job.previewImage})` }}
                          />
                        ) : (
                          <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-500">
                            {job.episodeName.substring(0, 3).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span>{job.episodeName}</span>
                          {job.description && (
                            <span className="text-xs text-zinc-500 truncate max-w-[200px]">{job.description}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{job.startDate || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs text-zinc-400">
                        <span>Job: <span className="text-zinc-300">{job.jobWorkflow || "Basic"}</span></span>
                        <span>Scene: <span className="text-zinc-300">{job.sceneWorkflow || "Basic"}</span></span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                        job.status === "Active" ? "bg-green-500/10 text-green-400" : "bg-zinc-500/10 text-zinc-400"
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            onSelectJob(job);
                            onClose();
                          }} 
                          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white mr-2" 
                          title="Open Scene View"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </button>
                        <button onClick={() => handleEdit(job)} className="p-1 text-zinc-400 hover:text-white" title="Edit">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {job.status === "Active" ? (
                          <button onClick={() => handleRetire(job.id)} className="p-1 text-zinc-400 hover:text-white" title="Retire">
                            <Archive className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleRestore(job.id)} className="p-1 text-zinc-400 hover:text-white" title="Restore">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(job)} className="p-1 text-red-500 hover:text-red-400" title="Delete">
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
