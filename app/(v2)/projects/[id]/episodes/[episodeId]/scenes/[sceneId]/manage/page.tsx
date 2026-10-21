
import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getScenesByEpisode,
  getSceneV2,
  getSceneBoardTasks,
  getTaskStatusOptionsByWorkflow,
  getAssignableUsers,
} from "@/lib/data/v2/productionRepositoryV2";
import {
  getOpenTodos,
  getCommits,
  getLatestCommitByTask,
} from "@/lib/data/v2/todoRepository";
import { getKeyframesForSceneBoard } from "@/lib/data/v2/boardRepository";
import { SceneManageView } from "@/components/manage-v3/SceneManageView";

export const dynamic = "force-dynamic";

interface SceneManageNextPageProps {
  params: Promise<{ id: string; episodeId: string; sceneId: string }>;
}

export default async function SceneManageNextPage({
  params,
}: SceneManageNextPageProps) {
  const { id, episodeId, sceneId } = await params;
  console.log("[SceneManageNextPage] Loading:", { id, episodeId, sceneId });

  const [
    project,
    episodesList,
    siblingScenes,
    scene,
    openTodos,
    commits,
    keyframeElements,
    assignableUsers,
    sceneTasksMap,
  ] = await Promise.all([
    getProjectV2(id),
    getEpisodesByProject(id),
    getScenesByEpisode(episodeId),
    getSceneV2(sceneId),
    getOpenTodos({ kind: "scene", sceneId }),
    getCommits({ kind: "scene", sceneId }),
    getKeyframesForSceneBoard(sceneId),
    getAssignableUsers(),
    getSceneBoardTasks([sceneId]),
  ]);

  const episode = episodesList.find((e) => e.id === episodeId) || null;

  if (!project || !episode || !scene) {
    notFound();
  }

  const tasks = sceneTasksMap[sceneId] || [];
  const taskIds = tasks.map((t) => t.id);

  const [latestCommitsByTask, statusOptionsByWorkflow] = await Promise.all([
    getLatestCommitByTask(taskIds),
    getTaskStatusOptionsByWorkflow(
      tasks
        .map((t) => t.taskStatusWorkflowId)
        .filter((w): w is string => Boolean(w))
    ),
  ]);

  const keyframes = keyframeElements.map((kf, idx) => ({
    id: kf.id,
    name: kf.keyframeNumber !== null ? `#${kf.keyframeNumber}` : `#${idx + 1}`,
    previewUrl: kf.imageUrl || undefined,
  }));

  return (
    <SceneManageView
      project={project}
      episode={episode}
      scene={scene}
      siblingScenes={siblingScenes}
      keyframes={keyframes}
      initialTasks={tasks}
      statusOptionsByWorkflow={statusOptionsByWorkflow}
      initialOpenTodos={openTodos}
      initialCommits={commits}
      initialLatestCommitsByTask={latestCommitsByTask}
      assignableUsers={assignableUsers}
    />
  );
}
