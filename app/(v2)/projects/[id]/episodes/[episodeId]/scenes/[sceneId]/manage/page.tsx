import React from "react";
import { notFound } from "next/navigation";
import {
  getEpisodesByProject,
  getScenesByEpisode,
  getSceneV2,
  getMainTasksForScene,
} from "@/lib/data/v2/productionRepositoryV2";
import {
  getOpenTodos,
  getCommits,
  getLatestCommitByTask,
} from "@/lib/data/v2/todoRepository";
import { getKeyframesForSceneBoard } from "@/lib/data/v2/boardRepository";
import SceneManageView from "@/components/manage/SceneManageView";

export const dynamic = "force-dynamic";

type SceneManagePageProps = {
  params: Promise<{ id: string; episodeId: string; sceneId: string }>;
};

export default async function SceneManagePage({ params }: SceneManagePageProps) {
  const { id, episodeId, sceneId } = await params;

  const [episodesList, siblingScenes, scene, tasks, openTodos, commits, keyframeElements] =
    await Promise.all([
      getEpisodesByProject(id),
      getScenesByEpisode(episodeId),
      getSceneV2(sceneId),
      getMainTasksForScene(sceneId),
      getOpenTodos({ kind: "scene", sceneId }),
      getCommits({ kind: "scene", sceneId }),
      getKeyframesForSceneBoard(sceneId),
    ]);

  const episode = episodesList.find((e) => e.id === episodeId) || null;

  if (!episode || !scene) {
    notFound();
  }

  const taskIds = tasks.map((t) => t.id);
  const latestCommitsByTask = await getLatestCommitByTask(taskIds);

  const keyframes = keyframeElements.map((kf, idx) => ({
    id: kf.id,
    name: kf.keyframeNumber !== null ? `#${kf.keyframeNumber}` : `#${idx + 1}`,
    previewUrl: kf.imageUrl || undefined,
  }));

  return (
    <SceneManageView
      episode={episode}
      scene={scene}
      siblingScenes={siblingScenes}
      keyframes={keyframes}
      initialTasks={tasks}
      initialOpenTodos={openTodos}
      initialCommits={commits}
      initialLatestCommitsByTask={latestCommitsByTask}
    />
  );
}
