import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getScenesByEpisode,
  getMainTasksForEpisode,
  getAssignableUsers,
} from "@/lib/data/v2/productionRepositoryV2";
import {
  getOpenTodos,
  getCommits,
  getLatestCommitByTask,
} from "@/lib/data/v2/todoRepository";
import EpisodeManageView from "@/components/manage/EpisodeManageView";

export const dynamic = "force-dynamic";

type EpisodeManagePageProps = {
  params: Promise<{ id: string; episodeId: string }>;
};

export default async function EpisodeManagePage({ params }: EpisodeManagePageProps) {
  const { id, episodeId } = await params;

  const [project, siblingEpisodes, scenes, tasks, openTodos, commits, assignableUsers] =
    await Promise.all([
      getProjectV2(id),
      getEpisodesByProject(id),
      getScenesByEpisode(episodeId),
      getMainTasksForEpisode(episodeId),
      getOpenTodos({ kind: "episode", episodeId }),
      getCommits({ kind: "episode", episodeId }),
      getAssignableUsers(),
    ]);

  const episode = siblingEpisodes.find((e) => e.id === episodeId) || null;

  if (!project || !episode) {
    notFound();
  }

  const taskIds = tasks.map((t) => t.id);
  const latestCommitsByTask = await getLatestCommitByTask(taskIds);

  return (
    <EpisodeManageView
      project={project}
      episode={episode}
      scenes={scenes}
      siblingEpisodes={siblingEpisodes}
      initialTasks={tasks}
      initialOpenTodos={openTodos}
      initialCommits={commits}
      initialLatestCommitsByTask={latestCommitsByTask}
      assignableUsers={assignableUsers}
    />
  );
}
