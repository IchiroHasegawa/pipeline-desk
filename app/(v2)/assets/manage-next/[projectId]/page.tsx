// TEMPORARY route — becomes /assets/manage/[projectId] at cutover

import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getAssetsByProject,
  getAssetsByEpisode,
  getProjectsV2,
  getAssetBoardTasks,
  getAssetFileStats,
  getTaskStatusOptionsByWorkflow,
  getAssignableUsers,
  getActiveAssetWorkflows,
} from "@/lib/data/v2/productionRepositoryV2";
import { ProjectAssetsView } from "@/components/assets-v3";

export const dynamic = "force-dynamic";

type ProjectAssetsManageNextPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: "episodes" | "assets" }>;
};

export default async function ProjectAssetsManageNextPage({
  params,
  searchParams,
}: ProjectAssetsManageNextPageProps) {
  const { projectId } = await params;
  const { tab } = await searchParams;

  const [project, episodes, assets, allProjects, users, assetWorkflows] = await Promise.all([
    getProjectV2(projectId),
    getEpisodesByProject(projectId),
    getAssetsByProject(projectId),
    getProjectsV2(),
    getAssignableUsers(),
    getActiveAssetWorkflows(),
  ]);

  if (!project) {
    notFound();
  }

  // Get asset counts for each episode in this project
  const episodeAssetsResults = await Promise.all(
    episodes.map(async (e) => {
      const epAssets = await getAssetsByEpisode(e.id);
      return { episodeId: e.id, count: epAssets.length };
    })
  );

  const assetCountsByEpisode: Record<string, number> = {};
  for (const r of episodeAssetsResults) {
    assetCountsByEpisode[r.episodeId] = r.count;
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
    <ProjectAssetsView
      project={project}
      episodes={episodes}
      assets={assets}
      assetCountsByEpisode={assetCountsByEpisode}
      tasksByAssetId={tasksMap}
      fileStatsByAssetId={fileStatsMap}
      workflowOptions={workflowOptions}
      assignableUsers={users}
      allProjects={allProjects}
      assetWorkflows={assetWorkflows}
      initialTab={tab === "assets" ? "assets" : "episodes"}
    />
  );
}
