"use client";

import { useState } from "react";
import type { Episode } from "@/types/production";
import { createJobs, updateJob } from "@/lib/data/productionRepository";
import ThumbnailUploader from "@/components/shared/ThumbnailUploader";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Workflow, getWorkflows, generateWorkflowTasks } from "@/lib/data/workflowRepository";

type JobFormProps = {
  environmentId: string;
  job: Episode | null;
  onClose: (createdId?: string) => void;
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
  const [endDate, setEndDate] = useState(job?.endDate ?? "");
  const [daysBetweenJobs, setDaysBetweenJobs] = useState(0);
  
  const [jobName, setJobName] = useState(job?.episodeName ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [previewImage, setPreviewImage] = useState(job?.previewImage ?? "");
  
  const [jobWorkflow, setJobWorkflow] = useState(job?.jobWorkflow ?? "Basic");
  const [sceneWorkflow, setSceneWorkflow] = useState(job?.sceneWorkflow ?? "Basic");
  
  const [workflowId, setWorkflowId] = useState("");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!job) {
      getWorkflows(supabase, "job")
        .then(data => setWorkflows((data || []).filter(w => w.status === 'active')))
        .catch(console.error);
    }
  }, [job]);

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
            endDate,
            jobWorkflow,
            sceneWorkflow,
          });
          onClose(job.id);
        } else {
          const jobNames = generateJobNames(jobName, numberOfJobs);
          const jobsToCreate = jobNames.map((name, index) => {
            const date = new Date(startDate);
            const eDate = endDate ? new Date(endDate) : null;
            
            if (daysBetweenJobs > 0 && index > 0) {
              date.setDate(date.getDate() + (daysBetweenJobs * index));
              if (eDate) {
                eDate.setDate(eDate.getDate() + (daysBetweenJobs * index));
              }
            }
            
            return {
              episodeName: name,
              description,
              previewImage,
              startDate: date.toISOString().split("T")[0],
              status: "Active" as const,
              jobWorkflow,
              sceneWorkflow,
              code: "", 
              endDate: eDate ? eDate.toISOString().split("T")[0] : "", 
            };
          });

          const newJobIds = await createJobs(environmentId, jobsToCreate);
          
          if (workflowId) {
            for (const newJobId of newJobIds) {
              try {
                await generateWorkflowTasks(supabase, "job", newJobId, workflowId);
              } catch (taskErr) {
                console.error("Failed to generate workflow tasks:", taskErr);
              }
            }
          }
          
          onClose(newJobIds[0]);
        }
      } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save job(s).");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#121212] p-6 shadow-2xl">
        <h2 className="mb-6 text-xl font-bold text-white">
          {isEditing ? "Edit Job" : "Create Job(s)"}
        </h2>

        {error && (
          <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-8">
          <div className="pt-6">
            <ThumbnailUploader value={previewImage} onChange={setPreviewImage} />
          </div>
          
          <div className="flex-1 space-y-4">
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
                {numberOfJobs > 1 && (
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
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                {isEditing ? "Job Name" : numberOfJobs > 1 ? "First Job Name" : "Job Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                placeholder={numberOfJobs > 1 ? "e.g. EP_01" : "e.g. Layout Review"}
                required
              />
              {!isEditing && numberOfJobs > 1 && (
                <p className="mt-1 text-xs text-zinc-500">
                  Subsequent names will auto-increment (e.g. EP_01, EP_02...)
                </p>
              )}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Target End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {!isEditing && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">
                  Generate Tasks via Workflow (Optional)
                </label>
                <select
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">No Workflow</option>
                  {workflows.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {!workflowId && (
                  <p className="mt-1 text-xs text-zinc-500">No Tasks will be created automatically.</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
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
                onClick={() => onClose()}
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
                {isSubmitting ? "Saving..." : "Save Job"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
