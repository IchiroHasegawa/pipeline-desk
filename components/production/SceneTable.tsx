"use client";

import type { Scene, TaskStatus } from "@/types/production";
import ProgressCircle from "./ProgressCircle";

type SceneTableProps = {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (scene: Scene) => void;
};

export default function SceneTable({ scenes, selectedSceneId, onSelectScene }: SceneTableProps) {
  return (
    <div className="flex-1 overflow-auto bg-[#0a0a0a]">
      <table className="w-full min-w-[800px] border-collapse text-left text-sm text-[#e0e0e0]">
        <thead className="sticky top-0 z-10 border-b border-[#2a2a2a] bg-[#121212] text-xs font-bold uppercase text-zinc-500 shadow-sm">
          <tr>
            <th className="px-4 py-3 font-medium">Scene</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Workflow</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Frames</th>
            <th className="px-4 py-3 font-medium text-center">Progress</th>
            <th className="px-4 py-3 font-medium text-center">Tasks</th>
          </tr>
        </thead>
        <tbody>
          {scenes.map((scene) => {
            const isSelected = selectedSceneId === scene.id;
            
            const totalTasks = scene.tasks.length;
            const completedTasks = scene.tasks.filter(t => t.status === "Approved").length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            // Get combined task status
            let combinedStatus: TaskStatus = "Standby";
            if (totalTasks > 0) {
              if (scene.tasks.every(t => t.status === "Approved")) {
                combinedStatus = "Approved";
              } else if (scene.tasks.some(t => t.status === "Rejected")) {
                combinedStatus = "Rejected";
              } else if (scene.tasks.some(t => t.status === "Review")) {
                combinedStatus = "Review";
              } else if (scene.tasks.some(t => t.status === "To Validate")) {
                combinedStatus = "To Validate";
              } else if (scene.tasks.some(t => t.status === "Pending")) {
                combinedStatus = "Pending";
              } else if (scene.tasks.every(t => t.status === "Standby")) {
                combinedStatus = "Standby";
              } else {
                combinedStatus = "In Progress";
              }
            }
            
            const statusColors: Record<TaskStatus, string> = {
              "Standby": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
              "Pending": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
              "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
              "Review": "bg-purple-500/10 text-purple-400 border-purple-500/20",
              "To Validate": "bg-orange-500/10 text-orange-400 border-orange-500/20",
              "Approved": "bg-green-500/10 text-green-400 border-green-500/20",
              "Rejected": "bg-red-500/10 text-red-400 border-red-500/20",
              "Unassigned": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
            };

            const priorityLabels: Record<number, string> = {
              1: "1 - Critical",
              2: "2 - High",
              3: "3 - Medium",
              4: "4 - Normal",
              5: "5 - Low",
            };

            return (
              <tr
                key={scene.id}
                onClick={() => onSelectScene(scene)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors last:border-0 hover:bg-zinc-800/50 ${
                  isSelected ? "bg-zinc-800/80" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {scene.previewImage ? (
                      <div
                        className="h-10 w-16 shrink-0 rounded bg-zinc-800 bg-cover bg-center"
                        style={{ backgroundImage: `url(${scene.previewImage})` }}
                      />
                    ) : (
                      <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-500">
                        {scene.sceneName.substring(0, 3).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {scene.sceneName}
                      </span>
                      {scene.description && (
                        <span className="text-xs text-zinc-500 truncate max-w-[200px]">{scene.description}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[combinedStatus]}`}>
                    {scene.status === "Retired" ? "Retired" : combinedStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {scene.workflow || "Basic"}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {priorityLabels[scene.priority] || scene.priority}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {scene.numberOfFrames}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    <ProgressCircle value={progress} size={28} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center text-xs font-medium text-zinc-400">
                    {completedTasks} / {totalTasks}
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
