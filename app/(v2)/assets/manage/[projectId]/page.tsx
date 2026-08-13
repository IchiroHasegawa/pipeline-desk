import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getAssetsByProject,
  getProjectsV2,
} from "@/lib/data/v2/productionRepositoryV2";
import AssetsManageEpisodeClient from "@/components/assets-v2/AssetsManageEpisodeClient";

export const dynamic = "force-dynamic";

type AssetsManageEpisodePageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function AssetsManageEpisodePage({
  params,
}: AssetsManageEpisodePageProps) {
  const { projectId } = await params;

  const [project, episodes, assets, allProjects] = await Promise.all([
    getProjectV2(projectId),
    getEpisodesByProject(projectId),
    getAssetsByProject(projectId),
    getProjectsV2(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <AssetsManageEpisodeClient
      project={project}
      episodes={episodes}
      assets={assets}
      allProjects={allProjects}
    />
  );
}
