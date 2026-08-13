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
} from "@/app/actions/todos";
import type {
  EpisodeV2,
  SceneV2,
  MainTaskV2,
  TodoV2,
} from "@/types/production-v2";

export type SceneManageViewProps = {
  episode: EpisodeV2;
  scene: SceneV2;
  siblingScenes: SceneV2[];
  keyframes?: Array<{ id: string; name: string; previewUrl?: string }>;
  initialTasks: MainTaskV2[];
  initialOpenTodos: TodoV2[];
  initialCommits: TodoV2[];
  initialLatestCommitsByTask?: Record<string, TodoV2>;
};

export const SceneManageView: React.FC<SceneManageViewProps> = ({
  episode,
  scene,
  siblingScenes,
  keyframes = [],
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

  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(
    keyframes.length > 0 ? keyframes[0].id : null
  );

  // Keyframe items for the strip picker below the preview
  const stripItems: EpisodeStripItem[] = useMemo(() => {
    if (keyframes.length > 0) {
      return keyframes.map((kf) => ({
        id: kf.id,
        label: kf.name,
        thumbnailUrl: kf.previewUrl,
      }));
    }
    return [
      {
        id: scene.id,
        label: scene.sceneName,
        thumbnailUrl: scene.previewImage,
      },
    ];
  }, [keyframes, scene]);

  // Sibling scene items for the right column list
  const entityItems = useMemo(() => {
    return siblingScenes.map((s) => ({
      id: s.id,
      label: s.sceneName,
      thumbnailUrl: s.previewImage,
    }));
  }, [siblingScenes]);

  // Keyframe strip interaction handlers
  const handleKeyframeSelect = useCallback((keyframeId: string) => {
    // Single click -> update preview only
    setSelectedKeyframeId(keyframeId);
  }, []);

  const handleKeyframeOpenAssembly = useCallback(
    (keyframeId: string) => {
      // Double click -> navigate to Scene Assembly with keyframe pre-selected
      router.push(
        `/projects/${episode.projectId}/episodes/${episode.id}/scenes/${scene.id}/assembly?keyframeId=${keyframeId}`
      );
    },
    [episode.projectId, episode.id, scene.id, router]
  );

  const handleOpenAssembly = useCallback(() => {
    router.push(
      `/projects/${episode.projectId}/episodes/${episode.id}/scenes/${scene.id}/assembly`
    );
  }, [episode.projectId, episode.id, scene.id, router]);

  // Entity list selection
  const handleSceneSelect = useCallback(
    (targetSceneId: string) => {
      if (targetSceneId === scene.id) return;
      router.replace(
        `/projects/${episode.projectId}/episodes/${episode.id}/scenes/${targetSceneId}/manage`
      );
    },
    [episode.projectId, episode.id, scene.id, router]
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
      scope: { kind: "scene", sceneId: scene.id },
      title,
    });
    setOpenTodos((prev) => [newTodo, ...prev]);
  };

  const toolActions: ToolAction[] = [
    { id: "sap", label: "SAP", onSelect: handleOpenAssembly },
    {
      id: "add",
      label: "ADD",
      onSelect: () =>
        router.push(
          `/projects/${episode.projectId}/episodes/${episode.id}/scenes`
        ),
    },
    {
      id: "sub",
      label: "SUB",
      onSelect: () => {},
    },
  ];

  const currentPreviewUrl =
    keyframes.find((k) => k.id === selectedKeyframeId)?.previewUrl ||
    scene.previewImage;

  return (
    <ManageLayout
      parentName={episode.code || episode.episodeName}
      title={scene.sceneName}
      parentThumbnailUrl={episode.previewImage}
      preview={
        <div
          onDoubleClick={handleOpenAssembly}
          className="w-full h-full cursor-pointer relative group"
        >
          {currentPreviewUrl ? (
            <img
              src={currentPreviewUrl}
              alt={scene.sceneName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-center font-mono text-[var(--color-ink-muted,#707070)] bg-[var(--color-placeholder,#d9d9d9)]">
              <span className="text-[14px]">Scene Preview Player</span>
              <span className="text-[11px] opacity-70">
                Double-click to open Assembly
              </span>
            </div>
          )}
        </div>
      }
      stripHeading="Keyframes"
      strip={
        <EpisodeStrip
          items={stripItems}
          selectedId={selectedKeyframeId}
          onSelect={handleKeyframeSelect}
          onOpenManage={handleKeyframeOpenAssembly}
          embedded={true}
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
          heading="Scenes"
          items={entityItems}
          currentId={scene.id}
          onSelect={handleSceneSelect}
        />
      }
      tools={<TransformTools actions={toolActions} />}
      toolsPosition={{ x: 637.5, y: 117 }}
    />
  );
};

export default SceneManageView;
