"use client";

import { useMemo, useState } from "react";

import type { ProductionRowItem as DetailItem } from "./productionTableUtils";

import ProgressCircle from "./ProgressCircle";
import {
  getAverageProgress,
  getEnvironmentTasks,
  getEpisodeTasks,
  getProjectTasks,
  getSceneProgress,
} from "./productionTableUtils";

type RightDetailsPanelProps = {
  selection: DetailItem | null;
  contextLabel?: string;
};

function getTitle(selection: DetailItem) {
  if (selection.type === "project") return selection.item.title;
  if (selection.type === "environment") return selection.item.name;
  if (selection.type === "job") return selection.item.episodeName;
  return selection.item.sceneName;
}

function getTypeLabel(selection: DetailItem) {
  if (selection.type === "project") return "Project";
  if (selection.type === "environment") return "Environment";
  if (selection.type === "job") return "Job";
  return "Scene";
}

function getPreview(selection: DetailItem) {
  if (selection.type === "project") return selection.item.thumbnailUrl;
  if (selection.type === "environment") return selection.item.thumbnailUrl;
  if (selection.type === "job") return selection.item.previewImage;
  return selection.item.previewImage;
}

function getDescription(selection: DetailItem) {
  if (selection.type === "project") return selection.item.description;
  if (selection.type === "environment") return selection.item.description;
  if (selection.type === "job") return selection.item.description;
  return selection.item.description || selection.item.note || "";
}

function getProgress(selection: DetailItem) {
  if (selection.type === "project") return getAverageProgress(getProjectTasks(selection.item));
  if (selection.type === "environment") return getAverageProgress(getEnvironmentTasks(selection.item));
  if (selection.type === "job") return getAverageProgress(getEpisodeTasks(selection.item));
  return getSceneProgress(selection.item);
}

function getCounts(selection: DetailItem) {
  if (selection.type === "project") {
    const environments = selection.item.environments.length;
    const jobs = selection.item.environments.reduce((count, env) => count + env.episodes.length, 0);
    const scenes = selection.item.environments.reduce(
      (count, env) => count + env.episodes.reduce((episodeCount, episode) => episodeCount + episode.scenes.length, 0),
      0
    );
    return [
      ["Environments", String(environments)],
      ["Jobs", String(jobs)],
      ["Scenes", String(scenes)],
    ];
  }

  if (selection.type === "environment") {
    const jobs = selection.item.episodes.length;
    const scenes = selection.item.episodes.reduce((count, episode) => count + episode.scenes.length, 0);
    return [
      ["Jobs", String(jobs)],
      ["Scenes", String(scenes)],
    ];
  }

  if (selection.type === "job") {
    return [
      ["Code", selection.item.code],
      ["Start Date", selection.item.startDate],
      ["End Date", selection.item.endDate],
      ["Scenes", String(selection.item.scenes.length)],
    ];
  }

  return [
    ["Frames", String(selection.item.numberOfFrames)],
    ["Priority", String(selection.item.priority)],
    ["Status", selection.item.status],
  ];
}

export default function RightDetailsPanel({ selection, contextLabel }: RightDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<"details" | "notes">("details");

  const notes = useMemo(() => {
    if (!selection) return [];
    if (selection.type === "project") return selection.item.environments.map((env) => env.description).filter(Boolean);
    if (selection.type === "environment") return selection.item.episodes.map((episode) => episode.description).filter(Boolean);
    if (selection.type === "job") {
      return selection.item.scenes
        .flatMap((scene) => [scene.description, scene.note])
        .filter((note): note is string => Boolean(note && note.trim() !== ""));
    }
    return [selection.item.description, selection.item.note].filter((note): note is string => Boolean(note && note.trim() !== ""));
  }, [selection]);

  if (!selection) {
    return (
      <aside className="hidden w-80 shrink-0 flex-col border-l border-[#2a2a2a] bg-zinc-900 lg:flex">
        <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-zinc-500">
          Select a row to view details. Double-click a row to open it.
        </div>
      </aside>
    );
  }

  const preview = getPreview(selection);

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-[#2a2a2a] bg-zinc-900 lg:flex">
      <div
        aria-label={`${getTitle(selection)} preview`}
        className="aspect-video w-full bg-zinc-800 bg-cover bg-center"
        style={{ backgroundImage: preview ? `url(${preview})` : "none" }}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded border border-[#2a2a2a] p-2">
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-500">{getTypeLabel(selection)}</p>
              <h2 className="text-sm font-bold">{getTitle(selection)}</h2>
            </div>
            <ProgressCircle value={getProgress(selection)} size={36} />
          </div>

          <div className="flex border-b border-[#2a2a2a]">
            <button onClick={() => setActiveTab("details")} className={`px-4 py-2 text-xs transition-colors ${activeTab === "details" ? "rounded-t bg-white font-bold text-black" : "text-zinc-400 hover:text-white"}`}>Details</button>
            <button onClick={() => setActiveTab("notes")} className={`px-4 py-2 text-xs transition-colors ${activeTab === "notes" ? "rounded-t bg-white font-bold text-black" : "text-zinc-400 hover:text-white"}`}>Notes</button>
          </div>

          {activeTab === "details" && (
            <>
              <div className="space-y-3 rounded border border-[#2a2a2a] p-3">
                <DetailRow label="Name" value={getTitle(selection)} />
                <DetailRow label="Description" value={getDescription(selection) || "No description"} />
                {getCounts(selection).map(([label, value]) => (
                  <DetailRow key={label} label={label} value={value} />
                ))}
              </div>

              {contextLabel && (
                <div className="border-t border-[#2a2a2a] pt-2">
                  <DetailRow label="Context" value={contextLabel} />
                </div>
              )}
            </>
          )}

          {activeTab === "notes" && (
            notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note, index) => (
                  <div key={`${note}-${index}`} className="rounded border border-[#2a2a2a] bg-black p-3 text-xs text-zinc-300">{note}</div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">No notes are available.</p>
            )
          )}
        </div>
      </div>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold uppercase text-zinc-500">{label}</span>
      <div className="text-xs text-zinc-400">{value}</div>
    </div>
  );
}

