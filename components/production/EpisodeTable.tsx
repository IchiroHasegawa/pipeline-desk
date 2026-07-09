import type { Episode } from "@/types/production";

import ProgressCircle from "./ProgressCircle";

type EpisodeTableProps = {
  episodes: Episode[];
  selectedEpisodeId: string | null;
  onSelectEpisode: (episode: Episode) => void;
};

const taskColumns = [
  {
    label: "Script",
    taskNames: ["Script"],
  },
  {
    label: "Storyboard",
    taskNames: ["Storyboard"],
  },
  {
    label: "Production",
    taskNames: ["Production"],
  },
  {
    label: "Layout",
    taskNames: ["Layout", "Layout Check"],
  },
  {
    label: "Setup",
    taskNames: ["Setup"],
  },
  {
    label: "Animation",
    taskNames: ["Animation", "Rough Animation"],
  },
  {
    label: "Cleanup",
    taskNames: ["Cleanup Animation"],
  },
  {
    label: "Comp",
    taskNames: ["Compositing"],
  },
];

function getTaskProgress(
  episode: Episode,
  taskNames: string[]
) {
  const matchingTasks = episode.scenes
    .flatMap((scene) => scene.tasks)
    .filter((task) =>
      taskNames.includes(task.name)
    );

  if (matchingTasks.length === 0) {
    return 0;
  }

  const totalProgress = matchingTasks.reduce(
    (total, task) =>
      total + task.progress,
    0
  );

  return Math.round(
    totalProgress / matchingTasks.length
  );
}

function getOverallProgress(
  episode: Episode
) {
  const allTasks = episode.scenes.flatMap(
    (scene) => scene.tasks
  );

  if (allTasks.length === 0) {
    return 0;
  }

  const totalProgress = allTasks.reduce(
    (total, task) =>
      total + task.progress,
    0
  );

  return Math.round(
    totalProgress / allTasks.length
  );
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
            <th className="sticky top-0 z-10 w-8 bg-[#121212] px-2 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              #
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Episode Name ▲
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Preview
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              Start Date
            </th>

            <th className="sticky top-0 z-10 bg-[#121212] px-2 py-2 shadow-[0_1px_0_#2a2a2a]">
              End Date
            </th>

            {taskColumns.map((column) => (
              <th
                key={column.label}
                className="sticky top-0 z-10 bg-[#121212] px-1 py-2 text-center shadow-[0_1px_0_#2a2a2a]"
              >
                {column.label}
              </th>
            ))}

            <th className="sticky top-0 z-10 bg-[#121212] px-1 py-2 text-center shadow-[0_1px_0_#2a2a2a]">
              Done
            </th>
          </tr>
        </thead>

        <tbody className="text-xs">
          {episodes.map(
            (episode, index) => {
              const isSelected =
                episode.id ===
                selectedEpisodeId;

              return (
                <tr
                  key={episode.id}
                  onClick={() =>
                    onSelectEpisode(
                      episode
                    )
                  }
                  className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors hover:bg-zinc-900/50 ${
                    isSelected
                      ? "bg-zinc-900/70"
                      : "bg-transparent"
                  }`}
                >
                  <td className="px-2 py-2 text-center font-medium text-zinc-500">
                    {index + 1}
                  </td>

                  <td className="px-2 py-2 font-medium text-[#e0e0e0]">
                    {
                      episode.episodeName
                    }
                  </td>

                  <td className="px-2 py-2">
                    <div
                      aria-label={`${episode.episodeName} preview`}
                      className="flex h-10 w-16 items-center justify-center rounded bg-zinc-800 bg-cover bg-center text-[9px] text-zinc-500"
                      style={{
                        backgroundImage: `url(${episode.previewImage})`,
                      }}
                    >
                      <span className="rounded bg-black/50 px-1">
                        Preview
                      </span>
                    </div>
                  </td>

                  <td className="px-2 py-2 text-zinc-400">
                    {
                      episode.startDate
                    }
                  </td>

                  <td className="px-2 py-2 text-zinc-400">
                    {episode.endDate}
                  </td>

                  {taskColumns.map(
                    (column) => (
                      <td
                        key={
                          column.label
                        }
                        className="px-1 py-2 text-center"
                      >
                        <ProgressCircle
                          value={getTaskProgress(
                            episode,
                            column.taskNames
                          )}
                          size={28}
                        />
                      </td>
                    )
                  )}

                  <td className="px-1 py-2 text-center">
                    <ProgressCircle
                      value={getOverallProgress(
                        episode
                      )}
                      size={28}
                    />
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}