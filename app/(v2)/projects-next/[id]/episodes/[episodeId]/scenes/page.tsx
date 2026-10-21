// TEMPORARY route — becomes /projects/[id]/episodes/[episodeId]/scenes at cutover.

import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getScenesByEpisode,
  getSceneBoardTasks,
  getTaskStatusOptionsByWorkflow,
  getAssignableUsers,
  getEpisodeProcessProgress,
  getSceneWorkflows,
} from "@/lib/data/v2/productionRepositoryV2";
import { ScenesView } from "@/components/scenes-v3/ScenesView";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  SceneBoardTask,
  TaskStatusOption,
  AssignableUser,
  ProcessProgress,
} from "@/types/production-v2";

export const dynamic = "force-dynamic";

interface ScenesNextPageProps {
  params: Promise<{ id: string; episodeId: string }>;
}

export default async function ScenesNextPage({ params }: ScenesNextPageProps) {
  const { id, episodeId } = await params;

  let project: ProjectV2 | null = null;
  let episode: EpisodeV2 | null = null;
  let scenes: SceneV2[] = [];
  let tasksByScene: Record<string, SceneBoardTask[]> = {};
  let statusOptionsByWorkflow: Record<string, TaskStatusOption[]> = {};
  let users: AssignableUser[] = [];
  let processProgress: ProcessProgress[] = [];
  let workflowName: string | undefined = undefined;
  let initialError: string | null = null;

  try {
    const [projectRes, episodesRes, scenesRes, usersRes, progressRes, workflowsRes] =
      await Promise.all([
        getProjectV2(id),
        getEpisodesByProject(id),
        getScenesByEpisode(episodeId),
        getAssignableUsers(),
        getEpisodeProcessProgress([episodeId]),
        getSceneWorkflows(),
      ]);

    project = projectRes;
    episode = episodesRes.find((e) => e.id === episodeId) || null;
    scenes = scenesRes;
    users = usersRes;
    processProgress = progressRes[episodeId] ?? [];

    if (episode?.sceneWorkflow) {
      workflowName = workflowsRes.find((w) => w.id === episode?.sceneWorkflow)?.name;
    }

    // Tasks are keyed by scene id, and statuses are scoped by the workflows those tasks use
    tasksByScene = await getSceneBoardTasks(scenes.map((s) => s.id));

    const statusWorkflowIds = Object.values(tasksByScene)
      .flat()
      .map((task) => task.taskStatusWorkflowId)
      .filter((workflowId): workflowId is string => workflowId !== null);

    statusOptionsByWorkflow = await getTaskStatusOptionsByWorkflow(
      statusWorkflowIds
    );
  } catch (err: unknown) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  if (!episode && !initialError) {
    notFound();
  }

  return (
    <ScenesView
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
          jobWorkflow: null,
          sceneWorkflow: null,
          status: "Active",
          createdAt: new Date().toISOString(),
        }
      }
      initialScenes={scenes}
      tasksByScene={tasksByScene}
      statusOptionsByWorkflow={statusOptionsByWorkflow}
      users={users}
      processProgress={processProgress}
      workflowName={workflowName}
      initialError={initialError}
    />
  );
}
