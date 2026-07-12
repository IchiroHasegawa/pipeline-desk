"use client";

import { useState } from "react";
import type { Episode } from "@/types/production";
import { createJobs, updateJob } from "@/lib/data/productionRepository";

type JobFormProps = {
  environmentId: string;
  job: Episode | null;
  onClose: () => void;
};

const WORKFLOW_OPTIONS = [
  "Basic",
  "Single Approval",
  "Double Approval",
  "Complete",
  "Custom",
];

function generateJobNames(firstJobName: string, count: number): string[] {
  if (count <= 1) return [firstJobName];

  const names: string[] = [];
  const match = firstJobName.match(/^(.*?)(\d+)$/);

  if (match) {
    const prefix = match[1];
    const numStr = match[2];
    const padding = numStr.length;
    const startNum = parseInt(numStr, 10);

    for (let i = 0; i < count; i++) {
      names.push(`${prefix}${String(startNum + i).padStart(padding, "0")}`);
    }
  } else {
    for (let i = 0; i < count; i++) {
      names.push(`${firstJobName}_${String(i + 1).padStart(3, "0")}`);
    }
  }

  return names;
}

export default function JobForm({ environmentId, job, onClose }: JobFormProps) {
  // If editing an existing job, lock number of jobs to 1 and hide bulk fields
  const isEditing = !!job;

  const [numberOfJobs, setNumberOfJobs] = useState(1);
  const [startDate, setStartDate] = useState(job?.startDate ?? new Date().toISOString().split("T")[0]);
  const [daysBetweenJobs, setDaysBetweenJobs] = useState(0);
  
  const [jobName, setJobName] = useState(job?.episodeName ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [previewImage, setPreviewImage] = useState(job?.previewImage ?? "");
  
  const [jobWorkflow, setJobWorkflow] = useState(job?.jobWorkflow ?? "Basic");
  const [sceneWorkflow, setSceneWorkflow] = useState(job?.sceneWorkflow ?? "Basic");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName.trim()) {
      setError(isEditing ? "Job Name is required." : "First Job Name is required.");
      return;
    }
    if (!startDate) {
      setError("Start Date is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing) {
        await updateJob(job.id, {
          episodeName: jobName,
          description,
          previewImage,
          startDate,
          jobWorkflow,
          sceneWorkflow,
        });
      } else {
        const jobNames = generateJobNames(jobName, numberOfJobs);
        const jobsToCreate = jobNames.map((name, index) => {
          const date = new Date(startDate);
          if (daysBetweenJobs > 0 && index > 0) {
            date.setDate(date.getDate() + (daysBetweenJobs * index));
          }
          
          return {
            episodeName: name,
            description,
            previewImage,
            startDate: date.toISOString().split("T")[0],
            status: "Active" as const,
            jobWorkflow,
            sceneWorkflow,
            code: "", // Code generation can be added later if needed
            endDate: "", // End date can be calculated later if needed
          };
        });

        await createJobs(environmentId, jobsToCreate);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save job(s).");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#121212] p-6 shadow-2xl">
        <h2 className="mb-6 text-xl font-bold text-white">
          {isEditing ? "Edit Job" : "Create Job(s)"}
        </h2>

        {error && (
          <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Number of Jobs <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={numberOfJobs}
                  onChange={(e) => setNumberOfJobs(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Days Between Jobs
                </label>
                <input
                  type="number"
                  min="0"
                  value={daysBetweenJobs}
                  onChange={(e) => setDaysBetweenJobs(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              {isEditing ? "Job Name" : "First Job Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              placeholder={isEditing ? "e.g. Episode_001" : "e.g. Episode_001"}
              required
            />
            {!isEditing && numberOfJobs > 1 && jobName && (
              <p className="mt-1 text-xs text-zinc-500">
                Will also create {generateJobNames(jobName, numberOfJobs).slice(1, 3).join(", ")}
                {numberOfJobs > 3 ? "..." : ""}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500 [color-scheme:dark]"
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
              rows={2}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Thumbnail URL
            </label>
            <input
              type="text"
              value={previewImage}
              onChange={(e) => setPreviewImage(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              placeholder="https://example.com/image.png"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Job Workflow
              </label>
              <select
                value={jobWorkflow}
                onChange={(e) => setJobWorkflow(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                {WORKFLOW_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Scene Workflow
              </label>
              <select
                value={sceneWorkflow}
                onChange={(e) => setSceneWorkflow(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              >
                {WORKFLOW_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
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
              {isSubmitting ? "Saving..." : isEditing ? "Save Job" : "Create Job(s)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
