import type { EpisodeJob } from "@/types/production";
import ProgressCircle from "./ProgressCircle";

type EpisodeTableProps = {
  jobs: EpisodeJob[];
  selectedJobId: string;
  onSelectJob: (job: EpisodeJob) => void;
};

const taskColumns = [
  "Script",
  "Storyboard",
  "Production",
  "Layout",
  "Setup",
  "Animation",
  "Cleanup Animation",
  "Compositing",
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
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      <div className="overflow-x-auto">
        <table className="min-w-[1300px] w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-3">Select</th>
              <th className="px-3 py-3">Job Name</th>
              <th className="px-3 py-3">Preview</th>
              <th className="px-3 py-3">Start Date</th>
              <th className="px-3 py-3">End Date</th>

              {taskColumns.map((column) => (
                <th key={column} className="px-3 py-3 text-center">
                  {column}
                </th>
              ))}

              <th className="px-3 py-3 text-center">Completion</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => {
              const isSelected = job.id === selectedJobId;

              return (
                <tr
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className={`cursor-pointer border-t border-slate-800 transition hover:bg-slate-900 ${
                    isSelected ? "bg-slate-900" : "bg-slate-950"
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4"
                    />
                  </td>

                  <td className="px-3 py-3 font-medium text-slate-100">
                    {job.jobName}
                  </td>

                  <td className="px-3 py-3">
                    <div className="h-12 w-20 rounded-md bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                      Preview
                    </div>
                  </td>

                  <td className="px-3 py-3 text-slate-300">
                    {job.startDate}
                  </td>

                  <td className="px-3 py-3 text-slate-300">
                    {job.endDate}
                  </td>

                  {taskColumns.map((taskName) => (
                    <td key={taskName} className="px-3 py-3">
                      <ProgressCircle
                        value={getTaskProgress(job, taskName)}
                        size={42}
                      />
                    </td>
                  ))}

                  <td className="px-3 py-3">
                    <ProgressCircle
                      value={getOverallProgress(job)}
                      size={48}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}