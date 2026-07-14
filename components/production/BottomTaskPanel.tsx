"use client";

import { useMemo, useState } from "react";

import type { ProductionTask } from "@/types/production";
import type { ProductionRowItem } from "./productionTableUtils";

import TaskCard from "./TaskCard";
import {
  getEnvironmentTasks,
  getEpisodeTasks,
  getProjectTasks,
  summarizeTasks,
} from "./productionTableUtils";

type BottomTaskPanelProps = {
  selection: ProductionRowItem | null;
};

type BottomTab = "tasks" | "completion" | "assets" | "review";

function getTitle(selection: ProductionRowItem) {
  if (selection.type === "project") return selection.item.title;
  if (selection.type === "environment") return selection.item.name;
  if (selection.type === "job") return selection.item.episodeName;
  return selection.item.sceneName;
}

function getTasks(selection: ProductionRowItem): ProductionTask[] {
  if (selection.type === "project") return summarizeTasks(getProjectTasks(selection.item));
  if (selection.type === "environment") return summarizeTasks(getEnvironmentTasks(selection.item));
  if (selection.type === "job") return summarizeTasks(getEpisodeTasks(selection.item));
  return selection.item.tasks;
}

function getNotes(selection: ProductionRowItem) {
  if (selection.type === "project") {
    return selection.item.environments.map((env) => env.description).filter(Boolean);
  }
  if (selection.type === "environment") {
    return selection.item.episodes.map((episode) => episode.description).filter(Boolean);
  }
  if (selection.type === "job") {
    return selection.item.scenes
      .flatMap((scene) => [scene.description, scene.note])
      .filter((note): note is string => Boolean(note && note.trim() !== ""));
  }
  return [selection.item.description, selection.item.note].filter((note): note is string => Boolean(note && note.trim() !== ""));
}

export default function BottomTaskPanel({ selection }: BottomTaskPanelProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("tasks");

  const tasks = useMemo(() => (selection ? getTasks(selection) : []), [selection]);
  const notes = useMemo(() => (selection ? getNotes(selection) : []), [selection]);

  if (!selection) {
    return null;
  }

  return (
    <div className="mt-auto shrink-0 border-t border-[#2a2a2a] bg-[#121212] p-4">
      <div className="mb-4 flex gap-6 overflow-x-auto text-xs font-bold uppercase text-zinc-400">
        <button className="rounded-t border border-b-0 border-[#2a2a2a] bg-white px-4 py-1 text-black">
          {getTitle(selection)}
        </button>

        <TabButton label="Tasks" active={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} />
        <TabButton label="Tasks Completion" active={activeTab === "completion"} onClick={() => setActiveTab("completion")} />
        <TabButton label="Assets" active={activeTab === "assets"} onClick={() => setActiveTab("assets")} />
        <TabButton label="Review Notes" active={activeTab === "review"} onClick={() => setActiveTab("review")} />
      </div>

      {activeTab === "tasks" && (
        tasks.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <EmptyText text="No tasks are available for this selection." />
        )
      )}

      {activeTab === "completion" && (
        tasks.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {tasks.map((task) => (
              <div key={task.id} className="text-xs">
                <div className="mb-1 flex justify-between">
                  <span className="text-zinc-300">{task.name}</span>
                  <span className="text-zinc-500">{task.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800">
                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${task.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyText text="No completion information is available." />
        )
      )}

      {activeTab === "assets" && (
        <div className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-400">
          Asset associations for this selection will appear here.
        </div>
      )}

      {activeTab === "review" && (
        notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note, index) => (
              <div key={`${note}-${index}`} className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-300">{note}</div>
            ))}
          </div>
        ) : (
          <EmptyText text="No notes are available." />
        )
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-1 transition-colors ${active ? "rounded-t bg-white text-black" : "hover:text-white"}`}
    >
      {label}
    </button>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="text-xs text-zinc-500">{text}</p>;
}
