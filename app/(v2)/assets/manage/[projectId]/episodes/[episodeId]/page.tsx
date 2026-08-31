import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getAssetsByEpisode,
  getAssetTasks,
  getWorkflowTaskStatuses,
  getProjectsV2,
  getAssignableUsers,
} from "@/lib/data/v2/productionRepositoryV2";
import AssetsManageRowClient from "@/components/assets-v2/AssetsManageRowClient";

export const dynamic = "force-dynamic";

type AssetManageRowPageProps = {
  params: Promise<{ projectId: string; episodeId: string }>;
};

export default async function AssetManageRowPage({
  params,
}: AssetManageRowPageProps) {
  const { projectId, episodeId } = await params;

  const [project, episodesList, assets, statuses, allProjects, users] = await Promise.all([
    getProjectV2(projectId),
    getEpisodesByProject(projectId),
    getAssetsByEpisode(episodeId),
    getWorkflowTaskStatuses(),
    getProjectsV2(),
    getAssignableUsers(),
  ]);

  const episode = episodesList.find((e) => e.id === episodeId) || null;

  if (!project || !episode) {
    notFound();
  }

  const assetIds = assets.map((a) => a.id);
  const assetTasksMap = await getAssetTasks(assetIds);

  return (
    <AssetsManageRowClient
      project={project}
      episode={episode}
      assets={assets}
      assetTasksMap={assetTasksMap}
      statuses={statuses}
      allProjects={allProjects}
      users={users}
    />
  );
}
