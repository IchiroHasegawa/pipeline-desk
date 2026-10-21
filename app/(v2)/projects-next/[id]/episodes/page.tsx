// TEMPORARY route — becomes /projects/[id]/episodes at cutover

import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getSceneWorkflows,
  getEpisodeProcessProgress,
  getScenesForEpisodes,
  getEpisodeTaskRollup,
} from "@/lib/data/v2/productionRepositoryV2";
import { EpisodesView } from "@/components/episodes-v3/EpisodesView";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  ProcessProgress,
} from "@/types/production-v2";

export const dynamic = "force-dynamic";

interface EpisodesNextPageProps {
  params: Promise<{ id: string }>;
}

export default async function EpisodesNextPage({ params }: EpisodesNextPageProps) {
  const { id } = await params;

  let project: ProjectV2 | null = null;
  let episodes: EpisodeV2[] = [];
  let workflows: Array<{ id: string; name: string }> = [];
  let processProgress: Record<string, ProcessProgress[]> = {};
  let scenesByEpisode: Record<string, SceneV2[]> = {};
  let taskRollup: {
    byEpisode: Record<string, { total: number; complete: number }>;
    byScene: Record<string, { total: number; complete: number }>;
  } = { byEpisode: {}, byScene: {} };
  let initialError: string | null = null;

  try {
    const [projectRes, episodesRes, workflowsRes] = await Promise.all([
      getProjectV2(id),
      getEpisodesByProject(id),
      getSceneWorkflows(),
    ]);
    project = projectRes;
    episodes = episodesRes;
    workflows = workflowsRes;

    const episodeIds = episodes.map((e) => e.id);
    const [progressRes, scenesRes, rollupRes] = await Promise.all([
      getEpisodeProcessProgress(episodeIds),
      getScenesForEpisodes(episodeIds),
      getEpisodeTaskRollup(episodeIds),
    ]);
    processProgress = progressRes;
    scenesByEpisode = scenesRes;
    taskRollup = rollupRes;
  } catch (err: unknown) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  if (!project && !initialError) {
    notFound();
  }

  const workflowNameById: Record<string, string> = Object.fromEntries(
    workflows.map((w) => [w.id, w.name])
  );

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
      processProgress={processProgress}
      scenesByEpisode={scenesByEpisode}
      taskRollup={taskRollup}
      workflowNameById={workflowNameById}
      initialError={initialError}
    />
  );
}
