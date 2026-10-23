"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trash2,
  ArrowLeft,
  Film,
  Flag,
  Clapperboard,
  X,
} from "lucide-react";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  SceneBoardTask,
  TaskStatusOption,
  AssignableUser,
  TodoV2,
} from "@/types/production-v2";
import { AppShell } from "@/components/app-shell/AppShell";
import type { RailAction } from "@/components/app-shell/ActionRail";
import { Select, type SelectOption } from "@/components/app-shell/Select";
import { PlaceholderArt } from "@/components/app-shell";
import { DeleteSceneDialog } from "@/components/scenes-v3/DeleteSceneDialog";
import { useTaskEditing } from "@/lib/hooks/useTaskEditing";
import { createTodo, setTodoComplete } from "@/app/actions/todos";
import { deriveSceneStatus, formatPriority } from "@/lib/format/production";
import {
  projectsHref,
  projectEpisodesHref,
  episodeScenesHref,
  sceneManageHref,
  sceneAssemblyHref,
} from "@/lib/routes/app";
import { TaskRow } from "./TaskRow";
import { TodoRail } from "./TodoRail";
import { CommitRail } from "./CommitRail";

export interface KeyframeOption {
  id: string;
  name: string;
  previewUrl?: string;
}

export interface SceneManageViewProps {
  project: ProjectV2;
  episode: EpisodeV2;
  scene: SceneV2;
  siblingScenes: SceneV2[];
  keyframes?: KeyframeOption[];
  initialTasks: SceneBoardTask[];
  statusOptionsByWorkflow: Record<string, TaskStatusOption[]>;
  initialOpenTodos: TodoV2[];
  initialCommits: TodoV2[];
  initialLatestCommitsByTask: Record<string, TodoV2>;
  assignableUsers: AssignableUser[];
}

const EMPTY_TASKS: SceneBoardTask[] = [];

export const SceneManageView: React.FC<SceneManageViewProps> = ({
  project,
  episode,
  scene,
  siblingScenes,
  keyframes = [],
  initialTasks,
  statusOptionsByWorkflow,
  initialOpenTodos,
  initialCommits,
  initialLatestCommitsByTask,
  assignableUsers,
}) => {
  const router = useRouter();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(
    keyframes.length > 0 ? keyframes[0].id : null
  );

  // Optimistic task editing for scene tasks
  const initialGroupedTasks = useMemo(
    () => ({ [scene.id]: initialTasks }),
    [scene.id, initialTasks]
  );

  const {
    tasks: tasksByGroup,
    busyIds,
    changeStatus,
    changeAssignee,
    error: taskError,
    clearError: clearTaskError,
  } = useTaskEditing({
    initialTasks: initialGroupedTasks,
    statusOptionsByWorkflow,
  });

  const sceneTasks = tasksByGroup[scene.id] ?? EMPTY_TASKS;

  // Sort scene tasks by processPosition, then name
  const sortedTasks = useMemo(() => {
    const list = [...sceneTasks];
    list.sort((a, b) => {
      const ap = a.processPosition;
      const bp = b.processPosition;
      if (ap === null && bp === null) return a.name.localeCompare(b.name);
      if (ap === null) return 1;
      if (bp === null) return -1;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [sceneTasks]);

  // To Dos and Commits state
  const [openTodos, setOpenTodos] = useState<TodoV2[]>(initialOpenTodos);
  const [commits, setCommits] = useState<TodoV2[]>(initialCommits);
  const [latestCommitsMap, setLatestCommitsMap] = useState<Record<string, TodoV2>>(
    initialLatestCommitsByTask
  );
  const [todoError, setTodoError] = useState<string | null>(null);

  const handleAddTodo = async (title: string) => {
    setTodoError(null);
    try {
      const newTodo = await createTodo({
        scope: { kind: "scene", sceneId: scene.id },
        title,
      });
      setOpenTodos((prev) => [newTodo, ...prev]);
    } catch (err: unknown) {
      setTodoError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };

  const handleCompleteTodo = async (todoId: string) => {
    setTodoError(null);
    const targetTodo = openTodos.find((t) => t.id === todoId);
    if (!targetTodo) return;

    const completedTodo: TodoV2 = {
      ...targetTodo,
      completedAt: new Date().toISOString(),
    };

    const previousLatest = targetTodo.taskId
      ? latestCommitsMap[targetTodo.taskId]
      : undefined;

    // Optimistic state updates
    setOpenTodos((prev) => prev.filter((t) => t.id !== todoId));
    setCommits((prev) => [completedTodo, ...prev]);
    if (targetTodo.taskId) {
      setLatestCommitsMap((prev) => ({
        ...prev,
        [targetTodo.taskId!]: completedTodo,
      }));
    }

    try {
      await setTodoComplete(todoId, true);
    } catch (err: unknown) {
      // Rollback on failure
      setOpenTodos((prev) => [targetTodo, ...prev]);
      setCommits((prev) => prev.filter((c) => c.id !== todoId));
      if (targetTodo.taskId) {
        setLatestCommitsMap((prev) => {
          const next = { ...prev };
          if (previousLatest) {
            next[targetTodo.taskId!] = previousLatest;
          } else {
            delete next[targetTodo.taskId!];
          }
          return next;
        });
      }
      setTodoError(err instanceof Error ? err.message : String(err));
    }
  };

  // Status computation
  const completionByStatusId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const list of Object.values(statusOptionsByWorkflow)) {
      for (const opt of list) {
        map[opt.id] = opt.completionPercentage;
      }
    }
    return map;
  }, [statusOptionsByWorkflow]);

  const sceneStatus = useMemo(() => {
    return deriveSceneStatus(sceneTasks, completionByStatusId);
  }, [sceneTasks, completionByStatusId]);

  const statusLabel =
    sceneStatus === "complete"
      ? "Completed"
      : sceneStatus === "in_progress"
      ? "In progress"
      : "Not started";

  const statusDotColor =
    sceneStatus === "complete"
      ? "var(--po-ok)"
      : sceneStatus === "in_progress"
      ? "var(--po-accent)"
      : "var(--po-ink-3)";

  // Sibling scene dropdown options
  const siblingSelectOptions = useMemo<SelectOption[]>(() => {
    return siblingScenes.map((s) => ({
      value: s.id,
      label: s.sceneName,
    }));
  }, [siblingScenes]);

  const handleSiblingChange = useCallback(
    (targetSceneId: string) => {
      if (targetSceneId === scene.id) return;
      router.replace(
        sceneManageHref(project.id, episode.id, targetSceneId)
      );
    },
    [project.id, episode.id, scene.id, router]
  );

  // Keyframe and preview image selection
  const selectedKeyframe = useMemo(() => {
    return keyframes.find((k) => k.id === selectedKeyframeId) ?? null;
  }, [keyframes, selectedKeyframeId]);

  const activePreviewUrl = selectedKeyframe?.previewUrl || scene.previewImage || null;


  const handleOpenAssembly = useCallback(
    (keyframeId?: string | null) => {
      router.push(
        sceneAssemblyHref(
          project.id,
          episode.id,
          scene.id,
          keyframeId ?? selectedKeyframeId
        )
      );
    },
    [project.id, episode.id, scene.id, selectedKeyframeId, router]
  );

  const railActions: readonly RailAction[] = [
    {
      key: "open-assembly",
      icon: LayoutDashboard,
      label: "Open Assembly",
      onSelect: () => handleOpenAssembly(),
    },
    {
      key: "delete-scene",
      icon: Trash2,
      label: "Delete scene",
      onSelect: () => setIsDeleteOpen(true),
    },
  ];

  const bottomAction: RailAction = {
    key: "back",
    icon: ArrowLeft,
    label: "Back to scenes",
    onSelect: () => router.push(episodeScenesHref(project.id, episode.id)),
  };

  const headerSubtitle = `${episode.code || episode.episodeName} · ${
    scene.numberOfFrames ?? 0
  } frames`;

  return (
    <AppShell
      actions={railActions}
      bottomAction={bottomAction}
      railLabel="Scene Manage"
      breadcrumb={[
        { label: "Projects", href: projectsHref() },
        { label: project.title, href: projectEpisodesHref(project.id) },
        { label: episode.episodeName, href: episodeScenesHref(project.id, episode.id) },
        { label: scene.sceneName },
      ]}
      header={{
        title: scene.sceneName,
        subtitle: headerSubtitle,
        right: (
          <Select
            value={scene.id}
            options={siblingSelectOptions}
            onChange={handleSiblingChange}
            ariaLabel="Switch scene"
            size="md"
          />
        ),
      }}
    >
      <div className="flex flex-1 min-h-0 min-w-0 flex-col gap-4">
        {/* Dismissible inline error notice for task mutations */}
        {taskError && (
          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E5534B]/30 bg-[#E5534B]/10 px-4 py-2.5 text-[13px] text-[#E5534B] flex-none">
            <span>{taskError}</span>
            <button
              type="button"
              onClick={clearTaskError}
              aria-label="Dismiss error"
              className="cursor-pointer text-[#E5534B] opacity-80 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 3-column Layout: Main Table Column, To Do Rail, Commit Rail */}
        <div className="grid grid-cols-[minmax(0,1fr)_300px_300px] gap-4 flex-1 min-h-0">
          {/* Main Column */}
          <div className="flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
            {/* Top Preview & Scene Details Hero Card */}
            <div className="flex flex-col rounded-[20px] bg-[var(--po-card)] border border-[var(--po-line)] p-4 shadow-[var(--po-shadow-sm)] flex-none gap-3">
              <div className="grid grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">
                {/* Preview Image with double-click to open assembly */}
                <div className="flex flex-col gap-2">
                  <div
                    onDoubleClick={() => handleOpenAssembly()}
                    title="Double-click to open Assembly"
                    className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-[var(--po-sunken)] cursor-pointer group shadow-xs"
                  >
                    {activePreviewUrl ? (
                      <img
                        src={activePreviewUrl}
                        alt={scene.sceneName}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-102"
                      />
                    ) : (
                      <PlaceholderArt
                        seed={selectedKeyframe?.id || scene.id}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Keyframe Strip (Single-click changes preview, double-click opens assembly with keyframeId) */}
                  {keyframes.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {keyframes.map((kf) => {
                        const isSelected = kf.id === selectedKeyframeId;
                        return (
                          <button
                            key={kf.id}
                            type="button"
                            onClick={() => setSelectedKeyframeId(kf.id)}
                            onDoubleClick={() => handleOpenAssembly(kf.id)}
                            title={`${kf.name} (Double-click to open in Assembly)`}
                            className={`group relative h-[38px] w-[58px] flex-none overflow-hidden rounded-[7px] border transition-all cursor-pointer bg-[var(--po-sunken)] ${
                              isSelected
                                ? "border-[var(--po-accent)] ring-1.5 ring-[var(--po-accent)]"
                                : "border-[var(--po-line)] hover:border-[var(--po-line-2)]"
                            }`}
                          >
                            {kf.previewUrl ? (
                              <img
                                src={kf.previewUrl}
                                alt={kf.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PlaceholderArt
                                seed={kf.id}
                                className="h-full w-full object-cover"
                              />
                            )}
                            <span className="absolute bottom-0.5 left-0.5 rounded-[3px] bg-black/65 px-1 py-0.2 text-[8.5px] font-semibold text-white">
                              {kf.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Metadata & Actions Right Side */}
                <div className="flex flex-col justify-between self-stretch gap-3 min-w-0">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <h2 className="m-0 truncate text-[22px] font-semibold tracking-[-0.02em] text-[var(--po-ink)]">
                          {scene.sceneName}
                        </h2>
                        {/* Status Badge */}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--po-chip)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--po-ink)] flex-none">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: statusDotColor }}
                          />
                          {statusLabel}
                        </span>
                      </div>

                      {/* Open Assembly Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenAssembly()}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--po-ink)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--po-panel)] transition-opacity hover:opacity-90 cursor-pointer flex-none shadow-xs"
                      >
                        <LayoutDashboard size={14} />
                        <span>Open Assembly</span>
                      </button>
                    </div>

                    {/* Description */}
                    <p className="m-0 text-[13.5px] leading-[1.55] text-[var(--po-ink-2)] line-clamp-3">
                      {scene.description || "No description provided for this scene."}
                    </p>
                  </div>

                  {/* Metadata Indicators Row */}
                  <div className="flex items-center gap-5 text-[12.5px] text-[var(--po-ink-2)] border-t border-[var(--po-line)] pt-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Film size={14} className="text-[var(--po-ink-3)]" />
                      <span>{scene.numberOfFrames ?? 0} frames</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Flag size={14} className="text-[var(--po-ink-3)]" />
                      <span>{formatPriority(scene.priority)} priority</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clapperboard size={14} className="text-[var(--po-ink-3)]" />
                      <span className="truncate max-w-[140px]">
                        {episode.code || episode.episodeName}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Process Tasks Table Section */}
            <div className="flex flex-col flex-1 min-h-[300px] rounded-[20px] bg-[var(--po-card)] border border-[var(--po-line)] shadow-[var(--po-shadow-sm)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--po-line)] flex-none">
                <div className="flex items-center gap-2.5">
                  <h3 className="m-0 text-[15px] font-semibold text-[var(--po-ink)]">
                    Tasks
                  </h3>
                  <span className="rounded-full bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink-2)]">
                    {sortedTasks.length}
                  </span>
                </div>
              </div>

              {sortedTasks.length === 0 ? (
                <div className="p-12 text-center text-[13px] text-[var(--po-ink-3)]">
                  This scene has no tasks
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-auto">
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_minmax(120px,1.2fr)_160px_minmax(120px,1fr)_160px_140px] items-center gap-4 px-4 py-2 text-[12px] font-medium text-[var(--po-ink-3)] border-b border-[var(--po-line)] bg-[var(--po-sunken)]/40 flex-none sticky top-0 z-10 shadow-xs">
                    <span>#</span>
                    <span>Process</span>
                    <span>Status</span>
                    <span>Completion</span>
                    <span>Assignee</span>
                    <span>Last commit</span>
                  </div>

                  {/* Task Rows */}
                  {sortedTasks.map((task, idx) => {
                    const statusOptions =
                      (task.taskStatusWorkflowId
                        ? statusOptionsByWorkflow[task.taskStatusWorkflowId]
                        : null) || [];
                    const isBusy = busyIds.has(task.id);
                    const latestCommit = latestCommitsMap[task.id];

                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        index={idx}
                        statusOptions={statusOptions}
                        users={assignableUsers}
                        latestCommit={latestCommit}
                        isBusy={isBusy}
                        onStatusChange={changeStatus}
                        onAssigneeChange={changeAssignee}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column 1: To Do Rail */}
          <div className="h-full min-h-0">
            <TodoRail
              todos={openTodos}
              onAddTodo={handleAddTodo}
              onCompleteTodo={handleCompleteTodo}
              actionError={todoError}
              onClearError={() => setTodoError(null)}
            />
          </div>

          {/* Right Column 2: Commit Rail */}
          <div className="h-full min-h-0">
            <CommitRail commits={commits} />
          </div>
        </div>
      </div>

      {/* Delete Scene Modal Dialog */}
      <DeleteSceneDialog
        isOpen={isDeleteOpen}
        scene={scene}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() =>
          router.replace(episodeScenesHref(project.id, episode.id))
        }
      />
    </AppShell>
  );
};
