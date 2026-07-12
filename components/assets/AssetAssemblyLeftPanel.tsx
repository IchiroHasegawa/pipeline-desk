"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Folder, Box } from "lucide-react";
import type { Project } from "@/types/production";
import { getProjects } from "@/lib/data/productionRepository";

type AssignmentTarget = {
  type: "project" | "environment" | "episode" | "scene";
  id: string;
  name: string;
};

type AssetAssemblyLeftPanelProps = {
  selectedTarget: AssignmentTarget | null;
  onSelectTarget: (target: AssignmentTarget) => void;
};

export default function AssetAssemblyLeftPanel({ selectedTarget, onSelectTarget }: AssetAssemblyLeftPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedEnvs, setExpandedEnvs] = useState<Set<string>>(new Set());
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
  }, []);

  const toggleExpand = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const isSelected = (type: string, id: string) => selectedTarget?.type === type && selectedTarget.id === id;

  return (
    <aside className="w-80 shrink-0 border-r border-[#2a2a2a] bg-[#121212] overflow-y-auto">
      <div className="p-4 border-b border-[#2a2a2a] sticky top-0 bg-[#121212] z-10">
        <h2 className="text-xs font-bold uppercase text-zinc-500">Production Hierarchy</h2>
        <p className="text-[10px] text-zinc-400 mt-1">Select a level to assign assets to</p>
      </div>
      
      <div className="p-2">
        {projects.map(project => (
          <div key={project.id} className="mb-1 text-sm">
            <div className={`flex items-center gap-1 rounded px-2 py-1.5 transition-colors cursor-pointer ${
              isSelected("project", project.id) ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800"
            }`}>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleExpand(setExpandedProjects, project.id); }}
                className="w-4 h-4 flex items-center justify-center shrink-0"
              >
                {expandedProjects.has(project.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
              <Folder className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
              <span className="truncate" onClick={() => onSelectTarget({ type: "project", id: project.id, name: project.title })}>
                {project.title}
              </span>
            </div>

            {expandedProjects.has(project.id) && (
              <div className="ml-4 pl-2 border-l border-[#2a2a2a] mt-1 space-y-1">
                {project.environments?.map(env => (
                  <div key={env.id}>
                    <div className={`flex items-center gap-1 rounded px-2 py-1.5 transition-colors cursor-pointer ${
                      isSelected("environment", env.id) ? "bg-blue-600/80 text-white" : "text-zinc-400 hover:bg-zinc-800"
                    }`}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleExpand(setExpandedEnvs, env.id); }}
                        className="w-4 h-4 flex items-center justify-center shrink-0"
                      >
                        {expandedEnvs.has(env.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                      <Folder className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
                      <span className="truncate" onClick={() => onSelectTarget({ type: "environment", id: env.id, name: env.name })}>
                        {env.name}
                      </span>
                    </div>

                    {expandedEnvs.has(env.id) && (
                      <div className="ml-4 pl-2 border-l border-[#2a2a2a] mt-1 space-y-1">
                        {env.episodes?.map(episode => (
                          <div key={episode.id}>
                            <div className={`flex items-center gap-1 rounded px-2 py-1.5 transition-colors cursor-pointer ${
                              isSelected("episode", episode.id) ? "bg-blue-600/60 text-white" : "text-zinc-500 hover:bg-zinc-800"
                            }`}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleExpand(setExpandedEpisodes, episode.id); }}
                                className="w-4 h-4 flex items-center justify-center shrink-0"
                              >
                                {expandedEpisodes.has(episode.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                              <Box className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
                              <span className="truncate" onClick={() => onSelectTarget({ type: "episode", id: episode.id, name: episode.episodeName })}>
                                {episode.episodeName}
                              </span>
                            </div>

                            {expandedEpisodes.has(episode.id) && (
                              <div className="ml-4 pl-2 border-l border-[#2a2a2a] mt-1 space-y-1">
                                {episode.scenes?.map(scene => (
                                  <div 
                                    key={scene.id} 
                                    onClick={() => onSelectTarget({ type: "scene", id: scene.id, name: scene.sceneName })}
                                    className={`flex items-center gap-1 rounded px-2 py-1.5 transition-colors cursor-pointer ml-4 ${
                                      isSelected("scene", scene.id) ? "bg-blue-600/40 text-white" : "text-zinc-500 hover:bg-zinc-800"
                                    }`}
                                  >
                                    <Box className="w-3.5 h-3.5 shrink-0 text-zinc-700" />
                                    <span className="truncate text-xs">{scene.sceneName}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
