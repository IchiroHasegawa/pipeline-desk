import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getEpisodeProcessProgress,
} from "@/lib/data/v2/productionRepositoryV2";
import EpisodeBoardView from "@/components/episodes/EpisodeBoardView";
import type {
  ProjectV2,
  EpisodeV2,
  ProcessProgress,
} from "@/types/production-v2";

export const dynamic = "force-dynamic";

type EpisodesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EpisodesPage({ params }: EpisodesPageProps) {
  const { id } = await params;

  let project: ProjectV2 | null = null;
  let episodes: EpisodeV2[] = [];
  let processProgress: Record<string, ProcessProgress[]> = {};
  let initialError: string | null = null;

  try {
    const [projRes, epRes] = await Promise.all([
      getProjectV2(id),
      getEpisodesByProject(id),
    ]);
    project = projRes;
    episodes = epRes;

    // Not part of the Promise.all above: the rollup is keyed by episode id, so
    // it cannot be issued until the episode list has come back. It is still one
    // round of queries for every episode at once, never one per episode.
    processProgress = await getEpisodeProcessProgress(episodes.map((e) => e.id));
  } catch (err: unknown) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  if (!project && !initialError) {
    notFound();
  }

  return (
    <EpisodeBoardView
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
      processProgress={processProgress}
      initialError={initialError}
    />
  );
}
