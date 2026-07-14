import type { Episode, ProductionEnvironment, ProductionTask, Project, Scene } from "@/types/production";

import ProgressCircle from "./ProgressCircle";
import TaskCard from "./TaskCard";

export type ProductionRowItem =
  | { type: "project"; item: Project }
  | { type: "environment"; item: ProductionEnvironment }
  | { type: "job"; item: Episode }
  | { type: "scene"; item: Scene };

export function getSceneProgress(scene: Scene) {
  if (scene.tasks.length === 0) return 0;
  const total = scene.tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(total / scene.tasks.length);
}

export function getEpisodeTasks(episode: Episode) {
  return episode.scenes.flatMap((scene) => scene.tasks);
}

export function getEnvironmentTasks(environment: ProductionEnvironment) {
  return environment.episodes.flatMap((episode) => getEpisodeTasks(episode));
}

export function getProjectTasks(project: Project) {
  return project.environments.flatMap((environment) => getEnvironmentTasks(environment));
}

export function getAverageProgress(tasks: ProductionTask[]) {
  if (tasks.length === 0) return 0;
  const total = tasks.reduce((sum, task) => sum + task.progress, 0);
  return Math.round(total / tasks.length);
}

export function summarizeTasks(tasks: ProductionTask[]) {
  const groups = new Map<string, ProductionTask[]>();

  tasks.forEach((task) => {
    groups.set(task.name, [...(groups.get(task.name) ?? []), task]);
  });

  return Array.from(groups.entries()).map(([name, groupedTasks]) => {
    const assignees = Array.from(
      new Set(groupedTasks.map((task) => task.assignee).filter(Boolean))
    );

    return {
      id: name.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-"),
      name,
      progress: getAverageProgress(groupedTasks),
      status: getSummaryStatus(groupedTasks),
      assignee: assignees.length > 0 ? assignees.join(", ") : "Unassigned",
      startDate: "—",
      endDate: "—",
      createdAt: groupedTasks[0]?.createdAt ?? new Date().toISOString(),
    } satisfies ProductionTask;
  });
}

function getSummaryStatus(tasks: ProductionTask[]): ProductionTask["status"] {
  if (tasks.length === 0) return "Standby";
  if (tasks.every((task) => task.status === "Approved")) return "Approved";
  if (tasks.some((task) => task.status === "Rejected")) return "Rejected";
  if (tasks.some((task) => task.status === "To Validate")) return "To Validate";
  if (tasks.some((task) => task.status === "Review")) return "Review";
  if (tasks.some((task) => task.status === "In Progress")) return "In Progress";
  if (tasks.some((task) => task.status === "Pending")) return "Pending";
  return "Standby";
}

export function TaskRail({ tasks }: { tasks: ProductionTask[] }) {
  if (tasks.length === 0) {
    return <span className="text-xs italic text-zinc-500">No tasks assigned</span>;
  }

  return (
    <div className="flex min-w-max gap-2 pb-2">
      {tasks.map((task) => (
        <div key={task.id} className="w-[150px] shrink-0">
          <TaskCard task={task} />
        </div>
      ))}
    </div>
  );
}

export function ProgressSummary({ tasks }: { tasks: ProductionTask[] }) {
  const summaryTasks = summarizeTasks(tasks);

  if (summaryTasks.length === 0) {
    return <span className="text-xs italic text-zinc-500">No task progress</span>;
  }

  return (
    <div className="flex min-w-max gap-4 pb-2">
      {summaryTasks.map((task) => (
        <ProgressCircle key={task.id} value={task.progress} label={task.name} size={46} />
      ))}
    </div>
  );
}
