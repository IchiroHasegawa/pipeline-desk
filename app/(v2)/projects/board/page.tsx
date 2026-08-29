import React from "react";
import {
  getProjectsV2,
  getProjectBoardStats,
} from "@/lib/data/v2/productionRepositoryV2";
import ProjectBoardView from "@/components/projects/ProjectBoardView";
import type { ProjectV2, ProjectBoardStats } from "@/types/production-v2";

export const dynamic = "force-dynamic";

export default async function ProjectBoardPage() {
  let initialProjects: ProjectV2[] = [];
  let stats: Record<string, ProjectBoardStats> = {};
  let initialError: string | null = null;

  try {
    const [projectsRes, statsRes] = await Promise.all([
      getProjectsV2(),
      getProjectBoardStats(),
    ]);
    initialProjects = projectsRes;
    stats = statsRes;
  } catch (err: unknown) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return (
    <ProjectBoardView
      initialProjects={initialProjects}
      stats={stats}
      initialError={initialError}
    />
  );
}
