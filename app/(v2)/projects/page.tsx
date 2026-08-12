import React from "react";
import { getProjectsV2 } from "@/lib/data/v2/productionRepositoryV2";
import ProjectsView from "@/components/projects/ProjectsView";
import type { ProjectV2 } from "@/types/production-v2";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let initialProjects: ProjectV2[] = [];
  let initialError: string | null = null;

  try {
    initialProjects = await getProjectsV2();
  } catch (err: unknown) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return (
    <ProjectsView
      initialProjects={initialProjects}
      initialError={initialError}
    />
  );
}
