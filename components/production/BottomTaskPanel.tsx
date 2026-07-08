"use client";

import { useState } from "react";
import type { EpisodeJob } from "@/types/production";
import TaskCard from "./TaskCard";

type BottomTaskPanelProps = {
  job: EpisodeJob;
};

type BottomTab = "tasks" | "completion" | "assets" | "review";

export default function BottomTaskPanel({ job }: BottomTaskPanelProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("tasks");

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950">
      <div className="flex border-b border-slate-800">
        <TabButton
          label="Job Tasks"
          active={activeTab === "tasks"}
          onClick={() => setActiveTab("tasks")}
        />

        <TabButton
          label="Task Completion"
          active={activeTab === "completion"}
          onClick={() => setActiveTab("completion")}
        />

        <TabButton
          label="Assets"
          active={activeTab === "assets"}
          onClick={() => setActiveTab("assets")}
        />

        <TabButton
          label="Review Notes"
          active={activeTab === "review"}
          onClick={() => setActiveTab("review")}
        />
      </div>

      <div className="p-4">
        {activeTab === "tasks" && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {job.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}

        {activeTab === "completion" && (
          <div className="space-y-3">
            {job.tasks.map((task) => (
              <div key={task.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{task.name}</span>
                  <span className="text-slate-400">{task.progress}%</span>
                </div>

                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "assets" && (
          <div className="rounded-lg bg-slate-900 p-4 text-sm text-slate-400">
            Asset list will come here later. For now this is a placeholder.
          </div>
        )}

        {activeTab === "review" && (
          <div className="space-y-2">
            {job.notes.map((note, index) => (
              <div
                key={index}
                className="rounded-lg bg-slate-900 p-3 text-sm text-slate-300"
              >
                {note}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm ${
        active
          ? "border-b-2 border-blue-500 text-slate-100"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}