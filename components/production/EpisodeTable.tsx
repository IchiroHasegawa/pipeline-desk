import type { Episode, ProductionTask } from "@/types/production";
import ProgressCircle from "./ProgressCircle";
import TaskCard from "./TaskCard";

type EpisodeTableProps = {
  episodes: Episode[];
  selectedEpisodeId: string | null;
  onSelectEpisode: (episode: Episode) => void;
};

const taskColumns = [
  { label: "Script", taskNames: ["Script"] },
  { label: "Storyboard", taskNames: ["Storyboard"] },
  { label: "Production", taskNames: ["Production"] },
  { label: "Layout", taskNames: ["Layout", "Layout Check"] },
  { label: "Setup", taskNames: ["Setup"] },
  { label: "Animation", taskNames: ["Animation", "Rough Animation"] },
  { label: "Cleanup", taskNames: ["Cleanup Animation"] },
  { label: "Comp", taskNames: ["Compositing"] },
];

function getTaskProgress(episode: Episode, taskNames: string[]) {
  const matchingTasks = episode.scenes
    .flatMap((scene) => scene.tasks)
    .filter((task) => taskNames.includes(task.name));
  if (matchingTasks.length === 0) return 0;
  const totalProgress = matchingTasks.reduce((total, task) => total + task.progress, 0);
  return Math.round(totalProgress / matchingTasks.length);
}

function getOverallProgress(episode: Episode) {
  const allTasks = episode.scenes.flatMap((scene) => scene.tasks);
  if (allTasks.length === 0) return 0;
  const totalProgress = allTasks.reduce((total, task) => total + task.progress, 0);
  return Math.round(totalProgress / allTasks.length);
}

export default function EpisodeTable({
  episodes,
  selectedEpisodeId,
  onSelectEpisode,
}: EpisodeTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto px-4">
      <table className="w-full min-w-[1040px] border-collapse text-left">
        <thead className="border-b border-[#2a2a2a] text-[10px] font-bold uppercase text-zinc-500">
          <tr>
            <th className="sticky top-0 z-10 w-8 bg-[#121212] px-2 py-3 text-center shadow-[0_1px_0_#2a2a2a]">
              <input type="checkbox" className="rounded border-zinc-700 bg-zinc-900" />
            </th>
            <th className="sticky top-0 z-10 w-32 bg-[#121212] px-2 py-3 shadow-[0_1px_0_#2a2a2a]">
              Preview
            </th>
            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-3 shadow-[0_1px_0_#2a2a2a]">
              Job Name ▲
            </th>
            <th className="sticky top-0 z-10 w-24 bg-[#121212] px-2 py-3 text-center shadow-[0_1px_0_#2a2a2a]">
              Completion
            </th>
            <th className="sticky top-0 z-10 bg-[#121212] px-4 py-3 shadow-[0_1px_0_#2a2a2a]">
              Tasks
            </th>
            <th className="sticky top-0 z-10 w-48 bg-[#121212] px-2 py-3 shadow-[0_1px_0_#2a2a2a]">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {episodes.map((episode) => {
            const isSelected = episode.id === selectedEpisodeId;
            return (
              <tr
                key={episode.id}
                onClick={() => onSelectEpisode(episode)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors hover:bg-zinc-900/50 ${
                  isSelected ? "bg-zinc-900/70" : "bg-transparent"
                }`}
              >
                <td className="px-2 py-3 text-center font-medium text-zinc-500" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={isSelected} readOnly className="rounded border-zinc-700 bg-zinc-900" />
                </td>
                <td className="px-2 py-3">
                  <div
                    aria-label={`${episode.episodeName} preview`}
                    className="flex h-14 w-24 shrink-0 items-center justify-center rounded bg-zinc-800 bg-cover bg-center text-[9px] text-zinc-500"
                    style={{ backgroundImage: `url(${episode.previewImage})` }}
                  >
                    {!episode.previewImage && <span className="rounded bg-black/50 px-1">Preview</span>}
                  </div>
                </td>
                <td className="px-2 py-3 font-medium text-[#e0e0e0]">
                  {episode.episodeName}
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="flex justify-center">
                    <ProgressCircle value={getOverallProgress(episode)} size={48} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 overflow-x-auto max-w-[600px] pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {taskColumns.map((col) => {
                      const progress = getTaskProgress(episode, col.taskNames);
                      // Only show tasks that are relevant (we fake relevance if progress > 0 or if we assume it's part of workflow)
                      const fakeTask: ProductionTask = {
                        id: col.label,
                        name: col.label,
                        progress,
                        status: progress === 100 ? "Approved" : progress > 0 ? "In Progress" : "Standby",
                        assignee: "Team",
                        startDate: episode.startDate,
                        endDate: episode.endDate,
                        createdAt: new Date().toISOString(),
                      };
                      return (
                        <div key={col.label} className="w-[140px] shrink-0">
                          <TaskCard task={fakeTask} />
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-2 py-3 text-zinc-400">
                  <div className="truncate max-w-[180px] text-xs">
                    {episode.description || "No notes available."}
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