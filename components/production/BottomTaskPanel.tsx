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
    <div className="mt-auto shrink-0 border-t border-[#2a2a2a] bg-[#121212] p-4">
      <div className="mb-4 flex gap-6 text-xs font-bold uppercase text-zinc-400">
        <button className="rounded-t border border-b-0 border-[#2a2a2a] bg-white px-4 py-1 text-black">
          {job.jobName}
        </button>

        <TabButton
          label="Job Tasks"
          active={activeTab === "tasks"}
          onClick={() => setActiveTab("tasks")}
        />

        <TabButton
          label="Tasks Completion"
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

      {activeTab === "tasks" && (
        <div className="flex gap-1 overflow-x-auto pb-2">
          {job.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {activeTab === "completion" && (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {job.tasks.map((task) => (
            <div key={task.id} className="text-xs">
              <div className="mb-1 flex justify-between">
                <span className="text-zinc-300">{task.name}</span>
                <span className="text-zinc-500">{task.progress}%</span>
              </div>

              <div className="h-1.5 rounded-full bg-zinc-800">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "assets" && (
        <div className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-400">
          Asset list will come here later. For now this is a placeholder.
        </div>
      )}

      {activeTab === "review" && (
        <div className="space-y-2">
          {job.notes.map((note, index) => (
            <div
              key={index}
              className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-300"
            >
              {note}
            </div>
          ))}
        </div>
      )}
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
      className={`px-4 py-1 transition-colors ${
        active ? "rounded-t bg-white text-black" : "hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
