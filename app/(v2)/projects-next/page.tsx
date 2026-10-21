// TEMPORARY route — becomes /projects at cutover

import React from "react";
import {
  getProjectsV2,
  getProjectBoardStats,
  getEpisodesForProjects,
  getEpisodeProcessProgress,
} from "@/lib/data/v2/productionRepositoryV2";
import { ProjectsView } from "@/components/projects-v3/ProjectsView";
import type {
  ProjectV2,
  ProjectBoardStats,
  EpisodeV2,
  ProcessProgress,
} from "@/types/production-v2";

export const dynamic = "force-dynamic";

export default async function ProjectsNextPage() {
  let initialProjects: ProjectV2[] = [];
  let stats: Record<string, ProjectBoardStats> = {};
  let episodesByProject: Record<string, EpisodeV2[]> = {};
  let processProgress: Record<string, ProcessProgress[]> = {};
  let initialError: string | null = null;

  try {
    const [projectsRes, statsRes] = await Promise.all([
      getProjectsV2(),
      getProjectBoardStats(),
    ]);
    initialProjects = projectsRes;
    stats = statsRes;

    const projectIds = initialProjects.map((p) => p.id);
    episodesByProject = await getEpisodesForProjects(projectIds);

    const first5EpisodeIds = initialProjects.flatMap((p) =>
      (episodesByProject[p.id] || []).slice(0, 5).map((e) => e.id)
    );
    processProgress = await getEpisodeProcessProgress(first5EpisodeIds);
  } catch (err: unknown) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return (
    <ProjectsView
      initialProjects={initialProjects}
      stats={stats}
      episodesByProject={episodesByProject}
      processProgress={processProgress}
      initialError={initialError}
    />
  );
}
