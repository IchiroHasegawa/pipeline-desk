"use client";

import { useEffect, useRef, useState } from "react";

import type { Scene } from "@/types/production";

import ProgressCircle from "./ProgressCircle";
import { getSceneProgress, TaskRail } from "./productionTableUtils";

type SceneTableProps = {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (scene: Scene) => void;
  onOpenScene?: (scene: Scene) => void;
};

export default function SceneTable({ scenes, selectedSceneId, onSelectScene, onOpenScene }: SceneTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const visibleIds = scenes.map((scene) => scene.id);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const isAllSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const isIndeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleIds.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  function handleHeaderClick() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (isAllSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function handleRowCheck(event: React.MouseEvent, id: string) {
    event.stopPropagation();
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-[#0a0a0a] px-4">
      <table className="w-full min-w-[1500px] border-collapse text-left text-sm text-[#e0e0e0]">
        <thead className="sticky top-0 z-10 border-b border-[#2a2a2a] bg-[#121212] text-xs font-bold uppercase text-zinc-500 shadow-sm">
          <tr>
            <th className="w-8 px-2 py-3 text-center font-medium">
              <input ref={headerCheckboxRef} type="checkbox" checked={isAllSelected} onChange={handleHeaderClick} className="rounded border-zinc-700 bg-zinc-900" />
            </th>
            <th className="w-36 px-2 py-3 font-medium">Preview</th>
            <th className="min-w-[180px] px-2 py-3 font-medium">Scene Name ▲</th>
            <th className="w-28 px-2 py-3 text-center font-medium">Completion</th>
            <th className="min-w-[820px] px-4 py-3 font-medium">Tasks</th>
            <th className="min-w-[280px] px-2 py-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {scenes.map((scene) => {
            const isSelected = selectedSceneId === scene.id;
            const progress = getSceneProgress(scene);

            return (
              <tr
                key={scene.id}
                onClick={() => onSelectScene(scene)}
                onDoubleClick={() => onOpenScene?.(scene)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors last:border-0 hover:bg-zinc-800/50 ${isSelected ? "bg-zinc-800/80" : ""}`}
              >
                <td className="px-2 py-3 text-center" onClick={(event) => handleRowCheck(event, scene.id)}>
                  <input type="checkbox" checked={selectedIds.has(scene.id)} readOnly className="rounded border-zinc-700 bg-zinc-900" />
                </td>
                <td className="px-2 py-3">
                  {scene.previewImage ? (
                    <div className="h-16 w-28 shrink-0 rounded bg-zinc-800 bg-cover bg-center" style={{ backgroundImage: `url(${scene.previewImage})` }} />
                  ) : (
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-500">
                      {scene.sceneName.substring(0, 3).toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-white transition-colors group-hover:text-blue-400">{scene.sceneName}</span>
                    <span className="mt-0.5 font-mono text-[10px] text-zinc-500">{scene.workflow || "Basic Workflow"} • {scene.numberOfFrames}f</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="flex justify-center">
                    <ProgressCircle value={progress} size={50} />
                  </div>
                </td>
                <td className="min-w-[820px] px-4 py-3"><TaskRail tasks={scene.tasks} /></td>
                <td className="min-w-[280px] px-2 py-3 text-zinc-400">
                  <div className="flex flex-col text-xs">
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
