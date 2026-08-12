import React from "react";
import { notFound } from "next/navigation";
import {
  getEpisodesByProject,
  getScenesByEpisode,
  getSceneV2,
} from "@/lib/data/v2/productionRepositoryV2";
import {
  getOrCreateBoard,
  getBoardElements,
} from "@/lib/data/v2/boardRepository";
import SceneAssemblyView from "@/components/board/SceneAssemblyView";

export const dynamic = "force-dynamic";

type SceneAssemblyPageProps = {
  params: Promise<{ id: string; episodeId: string; sceneId: string }>;
  searchParams: Promise<{ keyframeId?: string }>;
};

export default async function SceneAssemblyPage({
  params,
  searchParams,
}: SceneAssemblyPageProps) {
  const { id, episodeId, sceneId } = await params;
  const { keyframeId } = await searchParams;

  const [episodesList, siblingScenes, scene] = await Promise.all([
    getEpisodesByProject(id),
    getScenesByEpisode(episodeId),
    getSceneV2(sceneId),
  ]);

  const episode = episodesList.find((e) => e.id === episodeId) || null;

  if (!episode || !scene) {
    notFound();
  }

  const boardId = await getOrCreateBoard({ sceneId });
  const elements = await getBoardElements(boardId);

  return (
    <SceneAssemblyView
      episode={episode}
      scene={scene}
      siblingScenes={siblingScenes}
      boardId={boardId}
      initialElements={elements}
      targetKeyframeId={keyframeId || null}
    />
  );
}
