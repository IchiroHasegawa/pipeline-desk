// TEMPORARY route — becomes /projects/[id]/episodes/[episodeId]/manage at cutover.

import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getScenesByEpisode,
  getEpisodeBoardTasks,
  getSceneBoardTasks,
  getTaskStatusOptionsByWorkflow,
  getAssignableUsers,
} from "@/lib/data/v2/productionRepositoryV2";
import {
  getOpenTodos,
  getCommits,
  getLatestCommitByTask,
} from "@/lib/data/v2/todoRepository";
import { EpisodeManageView } from "@/components/manage-v3/EpisodeManageView";

export const dynamic = "force-dynamic";

interface EpisodeManageNextPageProps {
  params: Promise<{ id: string; episodeId: string }>;
}

export default async function EpisodeManageNextPage({
  params,
}: EpisodeManageNextPageProps) {
  const { id, episodeId } = await params;
  console.log("[EpisodeManageNextPage] Loading:", { id, episodeId });

  const [
    project,
    siblingEpisodes,
    scenes,
    episodeTasks,
    openTodos,
    commits,
    assignableUsers,
  ] = await Promise.all([
    getProjectV2(id),
    getEpisodesByProject(id),
    getScenesByEpisode(episodeId),
    getEpisodeBoardTasks(episodeId),
    getOpenTodos({ kind: "episode", episodeId }),
    getCommits({ kind: "episode", episodeId }),
    getAssignableUsers(),
  ]);

  const episode = siblingEpisodes.find((e) => e.id === episodeId) || null;

  if (!project || !episode) {
    notFound();
  }

  const sceneIds = scenes.map((s) => s.id);
  const episodeTaskIds = episodeTasks.map((t) => t.id);

  const [sceneTasksByScene, latestCommitsByTask] = await Promise.all([
    getSceneBoardTasks(sceneIds),
    getLatestCommitByTask(episodeTaskIds),
  ]);

  // Distinct workflow IDs from BOTH episode and scene tasks
  const episodeWorkflowIds = episodeTasks
    .map((t) => t.taskStatusWorkflowId)
    .filter((w): w is string => Boolean(w));
  const sceneWorkflowIds = Object.values(sceneTasksByScene)
    .flat()
    .map((t) => t.taskStatusWorkflowId)
    .filter((w): w is string => Boolean(w));

  const allStatusWorkflowIds = Array.from(
    new Set([...episodeWorkflowIds, ...sceneWorkflowIds])
  );
  const statusOptionsByWorkflow = await getTaskStatusOptionsByWorkflow(
    allStatusWorkflowIds
  );

  return (
    <EpisodeManageView
      project={project}
      episode={episode}
      siblingEpisodes={siblingEpisodes}
      scenes={scenes}
      initialEpisodeTasks={episodeTasks}
      sceneTasksByScene={sceneTasksByScene}
      statusOptionsByWorkflow={statusOptionsByWorkflow}
      initialOpenTodos={openTodos}
      initialCommits={commits}
      initialLatestCommitsByTask={latestCommitsByTask}
      assignableUsers={assignableUsers}
    />
  );
}
