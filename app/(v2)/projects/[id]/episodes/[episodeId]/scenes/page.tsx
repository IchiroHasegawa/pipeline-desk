import React from "react";
import { notFound } from "next/navigation";
import {
  getProjectV2,
  getEpisodesByProject,
  getScenesByEpisode,
  getSceneBoardTasks,
  getTaskStatusOptionsByWorkflow,
  getAssignableUsers,
} from "@/lib/data/v2/productionRepositoryV2";
import SceneBoardView from "@/components/scenes/SceneBoardView";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  SceneBoardTask,
  TaskStatusOption,
  AssignableUser,
} from "@/types/production-v2";

export const dynamic = "force-dynamic";

type ScenesPageProps = {
  params: Promise<{ id: string; episodeId: string }>;
};

export default async function ScenesPage({ params }: ScenesPageProps) {
  const { id, episodeId } = await params;

  let project: ProjectV2 | null = null;
  let episode: EpisodeV2 | null = null;
  let scenes: SceneV2[] = [];
  let tasksByScene: Record<string, SceneBoardTask[]> = {};
  let statusOptionsByWorkflow: Record<string, TaskStatusOption[]> = {};
  let users: AssignableUser[] = [];
  let initialError: string | null = null;

  try {
    // The existing scenes route resolves the episode out of the project's
    // episode list; there is no getEpisodeV2, so this does the same rather
    // than adding one.
    const [projectRes, episodesRes, scenesRes, usersRes] = await Promise.all([
      getProjectV2(id),
      getEpisodesByProject(id),
      getScenesByEpisode(episodeId),
      getAssignableUsers(),
    ]);

    project = projectRes;
    episode = episodesRes.find((e) => e.id === episodeId) || null;
    scenes = scenesRes;
    users = usersRes;

    // Sequential, not part of the Promise.all above: tasks are keyed by scene
    // id and the statuses are scoped by the status workflows those tasks turn
    // out to use. Each step is still one query for the whole page.
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
    <SceneBoardView
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
      initialError={initialError}
    />
  );
}
