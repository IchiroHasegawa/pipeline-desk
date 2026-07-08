import type { ProductionTask } from "@/types/production";
import ProgressCircle from "./ProgressCircle";

type TaskCardProps = {
  task: ProductionTask;
};

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-100">
            {task.name}
          </h4>

          <p className="mt-1 text-xs text-slate-400">
            {task.startDate} → {task.endDate}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Assignee: {task.assignee || "Unassigned"}
          </p>

          <span className="mt-2 inline-block rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
            {task.status}
          </span>
        </div>

        <ProgressCircle value={task.progress} size={46} />
      </div>
    </div>
  );
}