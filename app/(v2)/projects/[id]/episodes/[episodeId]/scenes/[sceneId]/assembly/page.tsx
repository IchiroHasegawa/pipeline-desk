
import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getScenesByEpisode,
  getSceneV2,
  getAssetsByEpisode,
  getAssetsByProject,
} from "@/lib/data/v2/productionRepositoryV2";
import {
  getOrCreateBoard,
  getBoardElements,
} from "@/lib/data/v2/boardRepository";
import { SceneAssemblyView } from "@/components/assembly-v3/SceneAssemblyView";

export const dynamic = "force-dynamic";

type SceneAssemblyNextPageProps = {
  params: Promise<{ id: string; episodeId: string; sceneId: string }>;
  searchParams: Promise<{ keyframeId?: string }>;
};

export default async function SceneAssemblyNextPage({
  params,
  searchParams,
}: SceneAssemblyNextPageProps) {
  const { id, episodeId, sceneId } = await params;
  const { keyframeId } = await searchParams;

  const [
    project,
    episodesList,
    siblingScenes,
    scene,
    episodeAssets,
    rawProjectAssets,
  ] = await Promise.all([
    getProjectV2(id),
    getEpisodesByProject(id),
    getScenesByEpisode(episodeId),
    getSceneV2(sceneId),
    getAssetsByEpisode(episodeId),
    getAssetsByProject(id),
  ]);

  const episode = episodesList.find((e) => e.id === episodeId) || null;

  if (!project || !episode || !scene) {
    notFound();
  }

  const boardId = await getOrCreateBoard({ sceneId });
  const elements = await getBoardElements(boardId);

  // Deduplicate project assets: remove any asset already linked to this episode
  const episodeAssetIds = new Set(episodeAssets.map((a) => a.id));
  const dedupedProjectAssets = rawProjectAssets.filter(
    (a) => !episodeAssetIds.has(a.id)
  );

  return (
    <SceneAssemblyView
      project={project}
      episode={episode}
      scene={scene}
      siblingScenes={siblingScenes}
      episodeAssets={episodeAssets}
      projectAssets={dedupedProjectAssets}
      boardId={boardId}
      initialElements={elements}
      targetKeyframeId={keyframeId || null}
    />
  );
}
