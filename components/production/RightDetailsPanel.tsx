"use client";

import { useState } from "react";

import type {
  Episode,
} from "@/types/production";

import ProgressCircle from "./ProgressCircle";

type RightDetailsPanelProps = {
  episode: Episode;
  environmentName: string;
};

function getOverallProgress(
  episode: Episode
) {
  const allTasks =
    episode.scenes.flatMap(
      (scene) => scene.tasks
    );

  if (
    allTasks.length === 0
  ) {
    return 0;
  }

  const totalProgress =
    allTasks.reduce(
      (total, task) =>
        total +
        task.progress,
      0
    );

  return Math.round(
    totalProgress /
      allTasks.length
  );
}

export default function RightDetailsPanel({
  episode,
  environmentName,
}: RightDetailsPanelProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState<
    "details" | "notes"
  >("details");

  const notes = episode.scenes
    .filter(
      (scene) =>
        scene.note.trim() !== ""
    )
    .map(
      (scene) => ({
        sceneName:
          scene.sceneName,

        note: scene.note,
      })
    );

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-[#2a2a2a] bg-zinc-900 lg:flex">
      <div
        aria-label={`${episode.episodeName} preview`}
        className="aspect-video w-full bg-zinc-800 bg-cover bg-center"
        style={{
          backgroundImage: `url(${episode.previewImage})`,
        }}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded border border-[#2a2a2a] p-2">
            <h2 className="text-sm font-bold">
              {
                episode.episodeName
              }
            </h2>

            <ProgressCircle
              value={getOverallProgress(
                episode
              )}
              size={32}
            />
          </div>

          <div className="flex border-b border-[#2a2a2a]">
            <button
              onClick={() =>
                setActiveTab(
                  "notes"
                )
              }
              className={`px-4 py-2 text-xs transition-colors ${
                activeTab ===
                "notes"
                  ? "rounded-t bg-white font-bold text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Notes
            </button>

            <button
              onClick={() =>
                setActiveTab(
                  "details"
                )
              }
              className={`px-4 py-2 text-xs transition-colors ${
                activeTab ===
                "details"
                  ? "rounded-t bg-white font-bold text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Details
            </button>
          </div>

          {activeTab ===
            "details" && (
            <>
              <div className="space-y-3 rounded border border-[#2a2a2a] p-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Job Name
                  </label>

                  <input
                    type="text"
                    value={
                      episode.episodeName
                    }
                    readOnly
                    className="w-full rounded border border-[#2a2a2a] bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    Description
                  </label>

                  <textarea
                    value={
                      episode.description
                    }
                    readOnly
                    className="h-16 w-full resize-none rounded border border-[#2a2a2a] bg-black px-2 py-1 text-xs text-[#e0e0e0] outline-none"
                  />
                </div>

                <DetailRow
                  label="Code"
                  value={
                    episode.code
                  }
                />

                <DetailRow
                  label="Start Date"
                  value={
                    episode.startDate
                  }
                />

                <DetailRow
                  label="End Date"
                  value={
                    episode.endDate
                  }
                />

                <DetailRow
                  label="Scenes"
                  value={String(
                    episode.scenes
                      .length
                  )}
                />
              </div>

              <div className="border-t border-[#2a2a2a] pt-2">
                <div className="mb-2 border-b border-[#2a2a2a] pb-1">
                  <span className="text-xs font-bold text-zinc-400">
                    Production
                    Settings
                  </span>
                </div>

                <div className="space-y-2">
                  <DetailRow
                    label="Environment"
                    value={
                      environmentName
                    }
                  />

                  <DetailRow
                    label="Job"
                    value={
                      episode.episodeName
                    }
                  />
                </div>
              </div>
            </>
          )}

          {activeTab ===
            "notes" &&
            (notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map(
                  ({
                    sceneName,
                    note,
                  }) => (
                    <div
                      key={
                        sceneName
                      }
                      className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-300"
                    >
                      <p className="mb-1 font-bold text-zinc-500">
                        {
                          sceneName
                        }
                      </p>

                      <p>{note}</p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                No scene notes are
                available.
              </p>
            ))}
        </div>
      </div>
    </aside>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500">
        {label}
      </span>

      <div className="text-xs text-zinc-400">
        {value}
      </div>
    </div>
  );
}