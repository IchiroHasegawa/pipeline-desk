"use client";

import { useState } from "react";
import type { EpisodeJob } from "@/types/production";
import ProgressCircle from "./ProgressCircle";

type RightDetailsPanelProps = {
  job: EpisodeJob;
};

function getOverallProgress(job: EpisodeJob) {
  if (job.tasks.length === 0) return 0;

  const total = job.tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(total / job.tasks.length);
}

export default function RightDetailsPanel({ job }: RightDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"details" | "notes">("details");

  return (
    <aside className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 lg:w-[320px]">
      <div className="h-36 rounded-lg bg-slate-800 flex items-center justify-center text-sm text-slate-400">
        Preview Image
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {job.jobName}
          </h2>

          <p className="text-xs text-slate-400">{job.code}</p>
        </div>

        <ProgressCircle value={getOverallProgress(job)} size={52} />
      </div>

      <div className="mt-4 flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-3 py-2 text-sm ${
            activeTab === "details"
              ? "border-b-2 border-blue-500 text-slate-100"
              : "text-slate-400"
          }`}
        >
          Details
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`px-3 py-2 text-sm ${
            activeTab === "notes"
              ? "border-b-2 border-blue-500 text-slate-100"
              : "text-slate-400"
          }`}
        >
          Notes
        </button>
      </div>

      {activeTab === "details" && (
        <div className="mt-4 space-y-3 text-sm">
          <DetailRow label="Description" value={job.description || "No description"} />
          <DetailRow label="Workflow" value={job.workflow} />
          <DetailRow label="Start Date" value={job.startDate} />
          <DetailRow label="End Date" value={job.endDate} />

          <div>
            <p className="mb-2 text-xs uppercase text-slate-500">Tasks</p>

            <div className="space-y-2">
              {job.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md bg-slate-900 px-3 py-2"
                >
                  <span className="text-slate-300">{task.name}</span>
                  <span className="text-xs text-slate-400">
                    {task.progress}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "notes" && (
        <div className="mt-4 space-y-2">
          {job.notes.length > 0 ? (
            job.notes.map((note, index) => (
              <div
                key={index}
                className="rounded-md bg-slate-900 p-3 text-sm text-slate-300"
              >
                {note}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No notes available.</p>
          )}
        </div>
      )}
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-slate-300">{value}</p>
    </div>
  );
}