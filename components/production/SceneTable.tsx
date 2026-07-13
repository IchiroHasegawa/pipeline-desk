"use client";

import type { Scene } from "@/types/production";
import ProgressCircle from "./ProgressCircle";
import TaskCard from "./TaskCard";
import { useState, useRef, useEffect } from "react";

type SceneTableProps = {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (scene: Scene) => void;
};

export default function SceneTable({ scenes, selectedSceneId, onSelectScene }: SceneTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const allIds = scenes.map(s => s.id);
  const isAllSelected = scenes.length > 0 && selectedIds.size === scenes.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < scenes.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleHeaderClick = () => {
    if (isIndeterminate || !isAllSelected) {
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleRowCheck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-[#0a0a0a] px-4">
      <table className="w-full min-w-[1040px] border-collapse text-left text-sm text-[#e0e0e0]">
        <thead className="sticky top-0 z-10 border-b border-[#2a2a2a] bg-[#121212] text-xs font-bold uppercase text-zinc-500 shadow-sm">
          <tr>
            <th className="px-2 py-3 w-8 text-center font-medium">
              <input 
                type="checkbox" 
                ref={headerCheckboxRef}
                checked={isAllSelected}
                onChange={handleHeaderClick}
                className="rounded border-zinc-700 bg-zinc-900" 
              />
            </th>
            <th className="px-2 py-3 w-32 font-medium">Preview</th>
            <th className="px-2 py-3 font-medium">Scene Name ▲</th>
            <th className="px-2 py-3 w-24 font-medium text-center">Completion</th>
            <th className="px-4 py-3 font-medium">Tasks</th>
            <th className="px-2 py-3 w-48 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {scenes.map((scene) => {
            const isSelected = selectedSceneId === scene.id;
            const totalTasks = scene.tasks.length;
            const completedTasks = scene.tasks.filter(t => t.status === "Approved").length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return (
              <tr
                key={scene.id}
                onClick={() => onSelectScene(scene)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors last:border-0 hover:bg-zinc-800/50 ${
                  isSelected ? "bg-zinc-800/80" : ""
                }`}
              >
                <td className="px-2 py-3 text-center" onClick={(e) => handleRowCheck(e, scene.id)}>
                  <input type="checkbox" checked={selectedIds.has(scene.id)} readOnly className="rounded border-zinc-700 bg-zinc-900" />
                </td>
                <td className="px-2 py-3">
                  {scene.previewImage ? (
                    <div
                      className="h-14 w-24 shrink-0 rounded bg-zinc-800 bg-cover bg-center"
                      style={{ backgroundImage: `url(${scene.previewImage})` }}
                    />
                  ) : (
                    <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-500">
                      {scene.sceneName.substring(0, 3).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-white group-hover:text-blue-400 transition-colors">
                      {scene.sceneName}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                      {scene.workflow || "Basic Workflow"} • {scene.numberOfFrames}f
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="flex justify-center">
                    <ProgressCircle value={progress} size={48} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 overflow-x-auto max-w-[600px] pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {scene.tasks.map((task) => (
                      <div key={task.id} className="w-[140px] shrink-0">
                        <TaskCard task={task} />
                      </div>
                    ))}
                    {scene.tasks.length === 0 && (
                      <span className="text-xs text-zinc-500 italic">No tasks assigned</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-3 text-zinc-400">
                  <div className="truncate max-w-[180px] text-xs flex flex-col">
                    {scene.description && <span>{scene.description}</span>}
                    {scene.note && <span className="text-zinc-500 italic">{scene.note}</span>}
                    {!scene.description && !scene.note && "No notes available."}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
