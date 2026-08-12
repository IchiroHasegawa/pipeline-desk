import React from "react";
import { notFound } from "next/navigation";
import {
  getEpisodesByProject,
  getScenesByEpisode,
  getDaysWithTasks,
} from "@/lib/data/v2/productionRepositoryV2";
import ScenesView from "@/components/scenes/ScenesView";
import type { DayWithTasks } from "@/components/scenes/DayBranchTree";
import type { EpisodeV2, SceneV2 } from "@/types/production-v2";

export const dynamic = "force-dynamic";

type ScenesPageProps = {
  params: Promise<{ id: string; episodeId: string }>;
};

export default async function ScenesPage({ params }: ScenesPageProps) {
  const { id, episodeId } = await params;

  let episode: EpisodeV2 | null = null;
  let scenes: SceneV2[] = [];
  let daysWithTasks: DayWithTasks[] = [];
  let initialError: string | null = null;

  try {
    const [episodesList, scenesRes, daysRes] = await Promise.all([
      getEpisodesByProject(id),
      getScenesByEpisode(episodeId),
      getDaysWithTasks(episodeId),
    ]);

    episode = episodesList.find((e) => e.id === episodeId) || null;
    scenes = scenesRes;
    daysWithTasks = daysRes;
  } catch (err: unknown) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  if (!episode && !initialError) {
    notFound();
  }

  return (
    <ScenesView
      episode={
        episode || {
          id: episodeId,
          projectId: id,
          episodeName: "Episode",
          code: "EP",
          description: "",
          previewImage: "",
          startDate: null,
          endDate: null,
          sortOrder: null,
          status: "Active",
          createdAt: new Date().toISOString(),
        }
      }
      scenes={scenes}
      initialDaysWithTasks={daysWithTasks}
      initialError={initialError}
    />
  );
}
