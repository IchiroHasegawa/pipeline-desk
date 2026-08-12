import type { MainTaskV2, CustomTaskV2 } from "@/types/production-v2";

/**
 * Computes displayed progress for a Main Task based on linked custom tasks.
 * Rollup rule:
 * completed = custom tasks where contributes_to_task_id = mainTask.id AND progress = 100
 * displayed = round(completed / total * 100)   when total > 0
 * displayed = mainTask.progress                when total = 0 (manual fallback)
 */
export function computeMainTaskProgress(
  mainTask: MainTaskV2,
  allCustomTasks: CustomTaskV2[]
): number {
  const linkedCustomTasks = allCustomTasks.filter(
    (ct) => ct.contributesToTaskId === mainTask.id
  );
  if (linkedCustomTasks.length === 0) {
    return mainTask.progress;
  }
  const completedCount = linkedCustomTasks.filter((ct) => ct.progress === 100).length;
  return Math.round((completedCount / linkedCustomTasks.length) * 100);
}
