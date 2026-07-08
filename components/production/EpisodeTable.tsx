import type { EpisodeJob } from "@/types/production";
import ProgressCircle from "./ProgressCircle";

type EpisodeTableProps = {
  jobs: EpisodeJob[];
  selectedJobId: string;
  onSelectJob: (job: EpisodeJob) => void;
};

const taskColumns = [
  { label: "Script", taskName: "Script" },
  { label: "Storyboard", taskName: "Storyboard" },
  { label: "Production", taskName: "Production" },
  { label: "Layout", taskName: "Layout" },
  { label: "Setup", taskName: "Setup" },
  { label: "Animation", taskName: "Animation" },
  { label: "Cleanup", taskName: "Cleanup Animation" },
  { label: "Comp", taskName: "Compositing" },
];

function getTaskProgress(job: EpisodeJob, taskName: string) {
  const task = job.tasks.find((item) => item.name === taskName);
  return task?.progress ?? 0;
}

function getOverallProgress(job: EpisodeJob) {
  if (job.tasks.length === 0) return 0;

  const total = job.tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(total / job.tasks.length);
}

export default function EpisodeTable({
  jobs,
  selectedJobId,
  onSelectJob,
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
              Job Name ▲
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
                key={column.taskName}
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
          {jobs.map((job, index) => {
            const isSelected = job.id === selectedJobId;

            return (
              <tr
                key={job.id}
                onClick={() => onSelectJob(job)}
                className={`group cursor-pointer border-b border-[#2a2a2a] transition-colors hover:bg-zinc-900/50 ${
                  isSelected ? "bg-zinc-900/70" : "bg-transparent"
                }`}
              >
                <td className="px-2 py-2 text-center font-medium text-zinc-500">
                  {index + 1}
                </td>

                <td className="px-2 py-2 font-medium text-[#e0e0e0]">
                  {job.jobName}
                </td>

                <td className="px-2 py-2">
                  <div
                    aria-label={`${job.jobName} preview`}
                    className="flex h-10 w-16 items-center justify-center rounded bg-zinc-800 bg-cover bg-center text-[9px] text-zinc-500"
                    style={{ backgroundImage: `url(${job.previewImage})` }}
                  >
                    <span className="rounded bg-black/50 px-1">Preview</span>
                  </div>
                </td>

                <td className="px-2 py-2 text-zinc-400">{job.startDate}</td>
                <td className="px-2 py-2 text-zinc-400">{job.endDate}</td>

                {taskColumns.map((column) => (
                  <td key={column.taskName} className="px-1 py-2 text-center">
                    <ProgressCircle
                      value={getTaskProgress(job, column.taskName)}
                      size={28}
                    />
                  </td>
                ))}

                <td className="px-1 py-2 text-center">
                  <ProgressCircle value={getOverallProgress(job)} size={28} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
