"use client";

import { useMemo, useState } from "react";
import { Search, Folder, Box, CheckSquare, Square } from "lucide-react";
import type { Project, ProductionEnvironment, Episode, Scene } from "@/types/production";
import ProjectDropdown from "@/components/production/ProjectDropdown";
import EnvironmentDropdown from "@/components/production/EnvironmentDropdown";
import EpisodeDropdown from "@/components/production/EpisodeDropdown";
import ProgressCircle from "@/components/production/ProgressCircle";

export type ProductionTargetItem = Project | ProductionEnvironment | Episode | Scene;

export type ProductionTarget = {
  id: string;
  type: "project" | "environment" | "episode" | "scene";
  name: string;
  item: ProductionTargetItem;
};

type AssetAssemblyLeftPanelProps = {
  projects: Project[];
  selectedTargets: Set<string>;
  onToggleTarget: (target: ProductionTarget, checked: boolean) => void;
};

export default function AssetAssemblyLeftPanel({ projects, selectedTargets, onToggleTarget }: AssetAssemblyLeftPanelProps) {
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("ALL");
  const [episodeFilterId, setEpisodeFilterId] = useState<"ALL" | string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const viewLevel = 
    selectedProjectId === "ALL" ? "PROJECT" :
    selectedEnvironmentId === "ALL" ? "ENVIRONMENT" :
    episodeFilterId === "ALL" ? "JOB" : "SCENE";

  const selectedProject = useMemo(() => {
    if (selectedProjectId === "ALL") return null;
    return projects.find((p) => p.id === selectedProjectId) ?? null;
  }, [projects, selectedProjectId]);

  const selectedEnvironment = useMemo(() => {
    if (!selectedProject || selectedEnvironmentId === "ALL") return null;
    return selectedProject.environments.find((e) => e.id === selectedEnvironmentId) ?? null;
  }, [selectedProject, selectedEnvironmentId]);

  const selectedEpisode = useMemo(() => {
    if (!selectedEnvironment || episodeFilterId === "ALL") return null;
    return selectedEnvironment.episodes.find((e) => e.id === episodeFilterId) ?? null;
  }, [selectedEnvironment, episodeFilterId]);

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    setSelectedEnvironmentId("ALL");
    setEpisodeFilterId("ALL");
    setSearchQuery("");
  }

  function handleEnvironmentChange(envId: string) {
    setSelectedEnvironmentId(envId);
    setEpisodeFilterId("ALL");
    setSearchQuery("");
  }

  function handleEpisodeChange(epId: "ALL" | string) {
    setEpisodeFilterId(epId);
    setSearchQuery("");
  }

  const itemsToRender = useMemo(() => {
    let items: ProductionTarget[] = [];
    if (viewLevel === "PROJECT") {
      items = projects.map(p => ({ id: p.id, type: "project", name: p.title, item: p }));
    } else if (viewLevel === "ENVIRONMENT" && selectedProject) {
      items = selectedProject.environments.map(e => ({ id: e.id, type: "environment", name: e.name, item: e }));
    } else if (viewLevel === "JOB" && selectedEnvironment) {
      items = selectedEnvironment.episodes.map(e => ({ id: e.id, type: "episode", name: e.episodeName, item: e }));
    } else if (viewLevel === "SCENE" && selectedEpisode) {
      items = selectedEpisode.scenes.map(s => ({ id: s.id, type: "scene", name: s.sceneName, item: s }));
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [viewLevel, projects, selectedProject, selectedEnvironment, selectedEpisode, searchQuery]);

  // Helper to get progress and thumbnail based on type
  const getItemDetails = (type: string, item: ProductionTargetItem) => {
    let progress = 0;
    let thumb = "";
    if (type === "project") {
      thumb = (item as Project).thumbnailUrl || "";
    } else if (type === "environment") {
      thumb = (item as ProductionEnvironment).thumbnailUrl || "";
    } else if (type === "episode") {
      thumb = (item as Episode).previewImage || "";
      const allTasks = (item as Episode).scenes.flatMap((s: Scene) => s.tasks || []);
      if (allTasks.length > 0) {
        progress = Math.round(allTasks.reduce((acc, t) => acc + t.progress, 0) / allTasks.length);
      }
    } else if (type === "scene") {
      thumb = (item as Scene).previewImage || "";
      const tasks = (item as Scene).tasks || [];
      if (tasks.length > 0) {
        progress = Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length);
      }
    }
    return { progress, thumb };
  };

  return (
    <aside className="w-[30%] shrink-0 border-r border-[#2a2a2a] bg-[#121212] flex flex-col h-full min-w-[300px]">
      <div className="p-4 border-b border-[#2a2a2a] bg-[#121212] shrink-0 h-16 flex flex-col justify-center">
        <h2 className="text-sm font-bold uppercase text-zinc-500">Production List</h2>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-b border-[#2a2a2a] bg-[#121212] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <ProjectDropdown
            projects={projects}
            selectedProjectId={selectedProjectId}
            onChangeProject={handleProjectChange}
          />
          {viewLevel !== "PROJECT" && (
            <EnvironmentDropdown
              productions={selectedProject?.environments ?? []}
              selectedProductionId={selectedEnvironmentId}
              onChangeProduction={handleEnvironmentChange}
            />
          )}
          {(viewLevel === "JOB" || viewLevel === "SCENE") && (
            <EpisodeDropdown
              episodes={selectedEnvironment?.episodes ?? []}
              selectedEpisodeId={episodeFilterId}
              onChangeEpisode={handleEpisodeChange}
            />
          )}
        </div>

        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Quick search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-[#2a2a2a] bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-[#e0e0e0] outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {itemsToRender.length === 0 ? (
          <div className="text-zinc-500 text-center mt-8 text-sm">No items are available at this level.</div>
        ) : (
          itemsToRender.map((target) => {
            const isSelected = selectedTargets.has(target.id);
            const { progress, thumb } = getItemDetails(target.type, target.item);

            return (
              <div
                key={target.id}
                onClick={() => {
                  if (target.type === "project") handleProjectChange(target.id);
                  else if (target.type === "environment") handleEnvironmentChange(target.id);
                  else if (target.type === "episode") handleEpisodeChange(target.id);
                }}
                className={`group flex items-center justify-between gap-3 p-2 rounded mb-1 cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-600/10 border border-blue-500/50" : "bg-transparent border border-transparent hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTarget(target, !isSelected);
                    }}
                    className="text-zinc-400 hover:text-white transition-colors shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {thumb ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt="" className="w-10 h-6 object-cover rounded bg-zinc-800 shrink-0" />
                    </>
                  ) : (
                    <div className="w-10 h-6 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                      {target.type === "project" || target.type === "environment" ? (
                        <Folder className="w-3.5 h-3.5 text-zinc-500" />
                      ) : (
                        <Box className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-zinc-200 truncate">{target.name}</span>
                    <span className="text-[10px] uppercase text-zinc-500">{target.type === "episode" ? "job" : target.type}</span>
                  </div>
                </div>

                {(target.type === "episode" || target.type === "scene") && (
                  <div className="shrink-0 mr-2">
                    <ProgressCircle value={progress} size={24} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
