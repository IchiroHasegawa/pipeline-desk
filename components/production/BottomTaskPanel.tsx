"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  Episode,
  ProductionTask,
  TaskStatus,
} from "@/types/production";

import TaskCard from "./TaskCard";

type BottomTaskPanelProps = {
  episode: Episode;
};

type BottomTab =
  | "tasks"
  | "completion"
  | "assets"
  | "review";

function getCombinedStatus(
  tasks: ProductionTask[]
): TaskStatus {
  if (
    tasks.every(
      (task) =>
        task.status === "Approved"
    )
  ) {
    return "Approved";
  }

  if (
    tasks.some(
      (task) =>
        task.status === "Rejected"
    )
  ) {
    return "Rejected";
  }

  if (
    tasks.some(
      (task) =>
        task.status === "Review"
    )
  ) {
    return "Review";
  }

  if (
    tasks.some(
      (task) =>
        task.status ===
        "To Validate"
    )
  ) {
    return "To Validate";
  }

  if (
    tasks.some(
      (task) =>
        task.status === "Pending"
    )
  ) {
    return "Pending";
  }

  if (
    tasks.every(
      (task) =>
        task.status === "Standby"
    )
  ) {
    return "Standby";
  }

  return "In Progress";
}

function createEpisodeTaskSummary(
  episode: Episode
): ProductionTask[] {
  const taskGroups = new Map<
    string,
    ProductionTask[]
  >();

  episode.scenes.forEach(
    (scene) => {
      scene.tasks.forEach(
        (task) => {
          const existing =
            taskGroups.get(
              task.name
            ) ?? [];

          taskGroups.set(
            task.name,
            [...existing, task]
          );
        }
      );
    }
  );

  return Array.from(
    taskGroups.entries()
  ).map(
    ([taskName, tasks]) => {
      const totalProgress =
        tasks.reduce(
          (total, task) =>
            total +
            task.progress,
          0
        );

      const assignees =
        Array.from(
          new Set(
            tasks.map(
              (task) =>
                task.assignee
            )
          )
        );

      return {
        id: taskName
          .toLowerCase()
          .replaceAll(" ", "-"),

        name: taskName,

        progress: Math.round(
          totalProgress /
            tasks.length
        ),

        status:
          getCombinedStatus(
            tasks
          ),

        assignee:
          assignees.join(", "),

        startDate: "—",

        endDate: "—", createdAt: new Date().toISOString(),
      };
    }
  );
}

export default function BottomTaskPanel({
  episode,
}: BottomTaskPanelProps) {
  const [activeTab, setActiveTab] =
    useState<BottomTab>("tasks");

  const episodeTasks = useMemo(
    () =>
      createEpisodeTaskSummary(
        episode
      ),
    [episode]
  );

  const episodeNotes =
    episode.scenes
      .filter(
        (scene) =>
          scene.note.trim() !== ""
      )
      .map(
        (scene) =>
          `${scene.sceneName}: ${scene.note}`
      );

  return (
    <div className="mt-auto shrink-0 border-t border-[#2a2a2a] bg-[#121212] p-4">
      <div className="mb-4 flex gap-6 overflow-x-auto text-xs font-bold uppercase text-zinc-400">
        <button className="rounded-t border border-b-0 border-[#2a2a2a] bg-white px-4 py-1 text-black">
          {
            episode.episodeName
          }
        </button>

        <TabButton
          label="Job Tasks"
          active={
            activeTab === "tasks"
          }
          onClick={() =>
            setActiveTab("tasks")
          }
        />

        <TabButton
          label="Tasks Completion"
          active={
            activeTab ===
            "completion"
          }
          onClick={() =>
            setActiveTab(
              "completion"
            )
          }
        />

        <TabButton
          label="Assets"
          active={
            activeTab === "assets"
          }
          onClick={() =>
            setActiveTab("assets")
          }
        />

        <TabButton
          label="Review Notes"
          active={
            activeTab === "review"
          }
          onClick={() =>
            setActiveTab("review")
          }
        />
      </div>

      {activeTab === "tasks" &&
        (episodeTasks.length >
        0 ? (
          <div className="flex gap-1 overflow-x-auto pb-2">
            {episodeTasks.map(
              (task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                />
              )
            )}
          </div>
        ) : (
          <EmptyText text="This job does not have any scene tasks yet." />
        ))}

      {activeTab ===
        "completion" &&
        (episodeTasks.length >
        0 ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {episodeTasks.map(
              (task) => (
                <div
                  key={task.id}
                  className="text-xs"
                >
                  <div className="mb-1 flex justify-between">
                    <span className="text-zinc-300">
                      {task.name}
                    </span>

                    <span className="text-zinc-500">
                      {
                        task.progress
                      }
                      %
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-zinc-800">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{
                        width: `${task.progress}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <EmptyText text="No completion information is available." />
        ))}

      {activeTab === "assets" && (
        <div className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-400">
          Asset management will be
          added later.
        </div>
      )}

      {activeTab === "review" &&
        (episodeNotes.length > 0 ? (
          <div className="space-y-2">
            {episodeNotes.map(
              (note) => (
                <div
                  key={note}
                  className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-300"
                >
                  {note}
                </div>
              )
            )}
          </div>
        ) : (
          <EmptyText text="No scene notes are available." />
        ))}
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
      className={`whitespace-nowrap px-4 py-1 transition-colors ${
        active
          ? "rounded-t bg-white text-black"
          : "hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyText({
  text,
}: {
  text: string;
}) {
  return (
    <p className="text-xs text-zinc-500">
      {text}
    </p>
  );
}