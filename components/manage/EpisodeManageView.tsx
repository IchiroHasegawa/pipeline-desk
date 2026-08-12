/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import ManageLayout from "@/components/manage/ManageLayout";
import CommitRail from "@/components/manage/CommitRail";
import TodoRail from "@/components/manage/TodoRail";
import MainTaskGrid from "@/components/manage/MainTaskGrid";
import EntityListPanel from "@/components/manage/EntityListPanel";
import EpisodeStrip, { EpisodeStripItem } from "@/components/episodes/EpisodeStrip";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";

import {
  createTodo,
  setTodoComplete,
} from "@/lib/data/v2/todoRepository";
import { deleteEpisodeV2 } from "@/lib/data/v2/productionRepositoryV2";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  MainTaskV2,
  TodoV2,
} from "@/types/production-v2";

export type EpisodeManageViewProps = {
  project: ProjectV2;
  episode: EpisodeV2;
  scenes: SceneV2[];
  siblingEpisodes: EpisodeV2[];
  initialTasks: MainTaskV2[];
  initialOpenTodos: TodoV2[];
  initialCommits: TodoV2[];
  initialLatestCommitsByTask?: Record<string, TodoV2>;
};

export const EpisodeManageView: React.FC<EpisodeManageViewProps> = ({
  project,
  episode,
  scenes,
  siblingEpisodes,
  initialTasks,
  initialOpenTodos,
  initialCommits,
  initialLatestCommitsByTask = {},
}) => {
  const router = useRouter();

  const [openTodos, setOpenTodos] = useState<TodoV2[]>(initialOpenTodos);
  const [commits, setCommits] = useState<TodoV2[]>(initialCommits);
  const [latestCommitsMap, setLatestCommitsMap] = useState<Record<string, TodoV2>>(
    initialLatestCommitsByTask
  );
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    scenes.length > 0 ? scenes[0].id : null
  );

  // Scene items for the strip picker below the preview
  const stripItems: EpisodeStripItem[] = useMemo(() => {
    return scenes.map((s) => ({
      id: s.id,
      label: s.sceneName,
      thumbnailUrl: s.previewImage,
    }));
  }, [scenes]);

  // Sibling episode items for the right column list
  const entityItems = useMemo(() => {
    return siblingEpisodes.map((ep) => ({
      id: ep.id,
      label: ep.code || ep.episodeName,
      thumbnailUrl: ep.previewImage,
    }));
  }, [siblingEpisodes]);

  // Strip navigation
  const handleSceneSelect = useCallback(
    (sceneId: string) => {
      setSelectedSceneId(sceneId);
      router.push(`/projects/${project.id}/episodes/${episode.id}/scenes/${sceneId}/manage`);
    },
    [project.id, episode.id, router]
  );

  // Entity list selection
  const handleEpisodeSelect = useCallback(
    (targetEpisodeId: string) => {
      if (targetEpisodeId === episode.id) return;
      router.replace(`/projects/${project.id}/episodes/${targetEpisodeId}/manage`);
    },
    [project.id, episode.id, router]
  );

  // Toggle To Do completion (To Do -> Commit move)
  const handleToggleTodoComplete = async (todoId: string, complete: boolean) => {
    if (complete) {
      const targetTodo = openTodos.find((t) => t.id === todoId);
      if (!targetTodo) return;

      const updatedTodo: TodoV2 = {
        ...targetTodo,
        completedAt: new Date().toISOString(),
      };

      // Optimistic UI state updates
      setOpenTodos((prev) => prev.filter((t) => t.id !== todoId));
      setCommits((prev) => [updatedTodo, ...prev]);

      if (targetTodo.taskId) {
        setLatestCommitsMap((prev) => ({
          ...prev,
          [targetTodo.taskId!]: updatedTodo,
        }));
      }

      try {
        await setTodoComplete(todoId, true);
      } catch (err: unknown) {
        console.error("Failed to complete To Do:", err);
        // Rollback on error
        setOpenTodos((prev) => [targetTodo, ...prev]);
        setCommits((prev) => prev.filter((c) => c.id !== todoId));
      }
    }
  };

  // Add new To Do handler
  const handleCreateTodo = async (title: string) => {
    const newTodo = await createTodo({
      scope: { kind: "episode", episodeId: episode.id },
      title,
    });
    setOpenTodos((prev) => [newTodo, ...prev]);
  };

  // Delete Episode handler
  const handleDeleteEpisode = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete episode "${episode.code || episode.episodeName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await deleteEpisodeV2(episode.id);
      router.replace(`/projects/${project.id}/episodes`);
    } catch (err: unknown) {
      alert(`Failed to delete episode: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const toolActions: ToolAction[] = [
    { id: "add", label: "ADD", onSelect: () => router.push(`/projects/${project.id}/episodes`) },
    { id: "sub", label: "SUB", onSelect: handleDeleteEpisode },
  ];

  return (
    <ManageLayout
      parentName={project.title}
      title={episode.code || episode.episodeName}
      preview={
        episode.previewImage ? (
          <img
            src={episode.previewImage}
            alt={episode.episodeName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center font-mono text-[var(--color-ink-muted,#707070)]">
            <span className="text-[14px]">Episode Preview Player</span>
            <span className="text-[11px] opacity-70">
              {episode.code || episode.episodeName}
            </span>
          </div>
        )
      }
      stripHeading="Scenes"
      strip={
        <EpisodeStrip
          items={stripItems}
          selectedId={selectedSceneId}
          onSelect={handleSceneSelect}
          onOpenManage={handleSceneSelect}
        />
      }
      commitRail={<CommitRail commits={commits} />}
      tasks={
        <MainTaskGrid
          tasks={initialTasks}
          latestCommitsByTask={latestCommitsMap}
        />
      }
      todoRail={
        <TodoRail
          todos={openTodos}
          onToggleComplete={handleToggleTodoComplete}
          onCreateTodo={handleCreateTodo}
        />
      }
      entityList={
        <EntityListPanel
          heading="Episodes"
          items={entityItems}
          currentId={episode.id}
          onSelect={handleEpisodeSelect}
        />
      }
      tools={<TransformTools actions={toolActions} />}
    />
  );
};

export default EpisodeManageView;
