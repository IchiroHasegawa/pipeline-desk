import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
} from "@/lib/data/v2/productionRepositoryV2";
import EpisodesView from "@/components/episodes/EpisodesView";
import type { ProjectV2, EpisodeV2 } from "@/types/production-v2";

export const dynamic = "force-dynamic";

type EpisodesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EpisodesPage({ params }: EpisodesPageProps) {
  const { id } = await params;

  let project: ProjectV2 | null = null;
  let episodes: EpisodeV2[] = [];
  let initialError: string | null = null;

  try {
    const [projRes, epRes] = await Promise.all([
      getProjectV2(id),
      getEpisodesByProject(id),
    ]);
    project = projRes;
    episodes = epRes;
  } catch (err: unknown) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  if (!project && !initialError) {
    notFound();
  }

  return (
    <EpisodesView
      project={
        project || {
          id,
          title: "Project",
          projectCode: "PROJ",
          description: "",
          thumbnailUrl: "",
          status: "Active",
          isSystem: false,
          startDate: null,
          endDate: null,
          boardLayout: {},
          createdAt: new Date().toISOString(),
        }
      }
      initialEpisodes={episodes}
      initialError={initialError}
    />
  );
}
