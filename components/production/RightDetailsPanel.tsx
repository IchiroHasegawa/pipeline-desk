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
    <aside className="hidden w-80 shrink-0 flex-col border-l border-[#2a2a2a] bg-zinc-900 lg:flex">
      <div
        aria-label={`${job.jobName} focus shot`}
        className="aspect-video w-full bg-zinc-800 bg-cover bg-center"
        style={{ backgroundImage: `url(${job.previewImage})` }}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded border border-[#2a2a2a] p-2">
            <h2 className="text-sm font-bold">{job.jobName}</h2>
            <ProgressCircle value={getOverallProgress(job)} size={32} />
          </div>

          <div className="flex border-b border-[#2a2a2a]">
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-4 py-2 text-xs transition-colors ${
                activeTab === "notes"
                  ? "rounded-t bg-white font-bold text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Notes
            </button>

            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 text-xs transition-colors ${
                activeTab === "details"
                  ? "rounded-t bg-white font-bold text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Details
            </button>
          </div>

          {activeTab === "details" && (
            <>
              <div className="space-y-3 rounded border border-[#2a2a2a] p-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Name
                  </label>
                  <input
                    type="text"
                    value={job.jobName}
                    readOnly
                    className="w-full rounded border border-[#2a2a2a] bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Description
                  </label>
                  <textarea
                    value={job.description || ""}
                    readOnly
                    className="h-16 w-full resize-none rounded border border-[#2a2a2a] bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none"
                  />
                </div>

                <DetailRow label="Code" value={job.code} />
                <DetailRow label="Workflow" value={job.workflow} />
                <DetailRow label="Start Date" value={job.startDate} />
                <DetailRow label="End Date" value={job.endDate} />

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Layout Posing
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="w-full rounded border border-[#2a2a2a] bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-2">
                <div className="mb-2 flex items-center justify-between border-b border-[#2a2a2a] pb-1">
                  <span className="text-xs font-bold text-zinc-400">
                    Harmony Settings
                  </span>
                </div>

                <div className="space-y-2">
                  <DetailRow label="env" value="Roger_et_ses_humains" />

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">
                      job
                    </span>
                    <div className="rounded border border-[#2a2a2a] bg-black px-2 py-1 text-xs">
                      {job.jobName}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">
                      harmonyVersion
                    </span>
                    <div className="h-4" />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "notes" && (
            <div className="space-y-2">
              {job.notes.length > 0 ? (
                job.notes.map((note, index) => (
                  <div
                    key={index}
                    className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-300"
                  >
                    {note}
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400">No notes available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500">
        {label}
      </span>
      <div className="text-xs text-zinc-400">{value}</div>
    </div>
  );
}
