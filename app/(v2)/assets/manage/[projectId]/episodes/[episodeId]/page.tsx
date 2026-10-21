
import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getAssetsByEpisode,
  getProjectsV2,
  getAssetBoardTasks,
  getAssetFileStats,
  getTaskStatusOptionsByWorkflow,
  getAssignableUsers,
  getActiveAssetWorkflows,
} from "@/lib/data/v2/productionRepositoryV2";
import { EpisodeAssetsView } from "@/components/assets-v3";

export const dynamic = "force-dynamic";

type EpisodeAssetsManageNextPageProps = {
  params: Promise<{ projectId: string; episodeId: string }>;
};

export default async function EpisodeAssetsManageNextPage({
  params,
}: EpisodeAssetsManageNextPageProps) {
  const { projectId, episodeId } = await params;

  const [project, episodesList, assets, allProjects, users, assetWorkflows] = await Promise.all([
    getProjectV2(projectId),
    getEpisodesByProject(projectId),
    getAssetsByEpisode(episodeId),
    getProjectsV2(),
    getAssignableUsers(),
    getActiveAssetWorkflows(),
  ]);

  const episode = episodesList.find((e) => e.id === episodeId) || null;

  if (!project || !episode) {
    notFound();
  }

  const assetIds = assets.map((a) => a.id);
  const [tasksMap, fileStatsMap] = await Promise.all([
    getAssetBoardTasks(assetIds),
    getAssetFileStats(assetIds),
  ]);

  // Collect distinct task status workflows
  const workflowIds = Array.from(
    new Set(
      Object.values(tasksMap)
        .flat()
        .map((t) => t.taskStatusWorkflowId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const workflowOptions = await getTaskStatusOptionsByWorkflow(workflowIds);

  return (
    <EpisodeAssetsView
      project={project}
      episode={episode}
      assets={assets}
      tasksByAssetId={tasksMap}
      fileStatsByAssetId={fileStatsMap}
      workflowOptions={workflowOptions}
      assignableUsers={users}
      allProjects={allProjects}
      assetWorkflows={assetWorkflows}
    />
  );
}
