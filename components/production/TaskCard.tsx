import { ChevronDown } from "lucide-react";
import type { ProductionTask, TaskStatus } from "@/types/production";

type TaskCardProps = {
  task: ProductionTask;
};

function getTaskCardClasses(taskName: string) {
  if (taskName === "Storyboard") {
    return {
      shell: "bg-blue-50 border-blue-300",
      header: "border-blue-200 text-blue-600",
      row: "border-blue-100 bg-white",
    };
  }

  if (taskName === "Production") {
    return {
      shell: "bg-lime-50 border-lime-300",
      header: "border-lime-200 text-lime-700",
      row: "border-lime-100 bg-white",
    };
  }

  if (taskName === "Layout") {
    return {
      shell: "bg-blue-100 border-blue-400",
      header: "border-blue-300 text-blue-800",
      row: "border-blue-200 bg-white",
    };
  }

  return {
    shell: "bg-white border-zinc-400",
    header: "border-zinc-300 text-zinc-500",
    row: "border-zinc-200 bg-white",
  };
}

function getStatusClasses(status: TaskStatus) {
  if (status === "Approved") return "border-green-500/40 bg-green-500/20";
  if (status === "Rejected") return "border-red-500/40 bg-red-500/20";
  if (status === "In Progress" || status === "Review") {
    return "border-yellow-500/40 bg-yellow-500/20";
  }

  return "border-zinc-200 bg-zinc-100";
}

export default function TaskCard({ task }: TaskCardProps) {
  const classes = getTaskCardClasses(task.name);

  return (
    <div
      className={`min-w-[120px] shrink-0 overflow-hidden rounded border text-black ${classes.shell}`}
    >
      <div
        className={`border-b py-0.5 text-center text-[10px] font-bold ${classes.header}`}
      >
        {task.name}
      </div>

      <div className="space-y-0.5 p-1 text-[9px]">
        <div className={`flex items-center rounded border px-1 ${classes.row}`}>
          <span className="w-8 text-zinc-400">Start</span>
          <span className="flex-1 text-right">{task.startDate}</span>
        </div>

        <div className={`flex items-center rounded border px-1 ${classes.row}`}>
          <span className="w-8 text-zinc-400">End</span>
          <span className="flex-1 text-right">{task.endDate}</span>
        </div>

        <div
          className={`flex items-center justify-between rounded border px-1 py-0.5 ${getStatusClasses(
            task.status
          )}`}
        >
          <span>{task.status}</span>
          <ChevronDown className="h-3 w-3" />
        </div>

        <div className="flex items-center justify-between rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5">
          <span>{task.assignee || "Unassigned"}</span>
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
