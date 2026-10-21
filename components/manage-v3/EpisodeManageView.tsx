"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Film, Trash2, ArrowLeft, X } from "lucide-react";
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
import { DeleteEpisodeDialog } from "@/components/episodes-v3/DeleteEpisodeDialog";
import { useTaskEditing } from "@/lib/hooks/useTaskEditing";
import { createTodo, setTodoComplete } from "@/app/actions/todos";
import { formatDateRange } from "@/lib/format/production";
import {
  projectsHref,
  projectEpisodesHref,
  episodeScenesHref,
  episodeManageHref,
  sceneManageHref,
} from "@/lib/routes/app";
import { TaskRow } from "./TaskRow";
import { TodoRail } from "./TodoRail";
import { CommitRail } from "./CommitRail";

export interface EpisodeManageViewProps {
  project: ProjectV2;
  episode: EpisodeV2;
  siblingEpisodes: EpisodeV2[];
  scenes: SceneV2[];
  initialEpisodeTasks: SceneBoardTask[];
  sceneTasksByScene: Record<string, SceneBoardTask[]>;
  statusOptionsByWorkflow: Record<string, TaskStatusOption[]>;
  initialOpenTodos: TodoV2[];
  initialCommits: TodoV2[];
  initialLatestCommitsByTask: Record<string, TodoV2>;
  assignableUsers: AssignableUser[];
}

interface ProcessColumn {
  key: string;
  name: string;
  colour: string | null;
  position: number | null;
}

const EMPTY_TASKS: SceneBoardTask[] = [];

export const EpisodeManageView: React.FC<EpisodeManageViewProps> = ({
  project,
  episode,
  siblingEpisodes,
  scenes,
  initialEpisodeTasks,
  sceneTasksByScene,
  statusOptionsByWorkflow,
  initialOpenTodos,
  initialCommits,
  initialLatestCommitsByTask,
  assignableUsers,
}) => {
  const router = useRouter();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Optimistic task editing for episode tasks
  const initialGroupedTasks = useMemo(
    () => ({ [episode.id]: initialEpisodeTasks }),
    [episode.id, initialEpisodeTasks]
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

  const episodeTasks = tasksByGroup[episode.id] ?? EMPTY_TASKS;

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
        scope: { kind: "episode", episodeId: episode.id },
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

  // Union of scene task processes ordered by processPosition
  const processColumns = useMemo<ProcessColumn[]>(() => {
    const colMap = new Map<string, ProcessColumn>();

    for (const taskList of Object.values(sceneTasksByScene)) {
      for (const t of taskList) {
        const key = t.sourceWorkflowProcessId || t.name;
        if (!colMap.has(key)) {
          colMap.set(key, {
            key,
            name: t.processName || t.name,
            colour: t.processColour,
            position: t.processPosition,
          });
        }
      }
    }

    const cols = Array.from(colMap.values());
    cols.sort((a, b) => {
      const ap = a.position;
      const bp = b.position;
      if (ap === null && bp === null) return a.name.localeCompare(b.name);
      if (ap === null) return 1;
      if (bp === null) return -1;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });

    return cols;
  }, [sceneTasksByScene]);

  // Sibling episode dropdown options
  const siblingSelectOptions = useMemo<SelectOption[]>(() => {
    return siblingEpisodes.map((e) => ({
      value: e.id,
      label: e.episodeName,
    }));
  }, [siblingEpisodes]);

  const handleSiblingChange = useCallback(
    (targetEpisodeId: string) => {
      if (targetEpisodeId === episode.id) return;
      router.replace(episodeManageHref(project.id, targetEpisodeId));
    },
    [project.id, episode.id, router]
  );

  const railActions: readonly RailAction[] = [
    {
      key: "open-scenes",
      icon: Film,
      label: "Open scenes",
      onSelect: () => router.push(episodeScenesHref(project.id, episode.id)),
    },
    {
      key: "delete-episode",
      icon: Trash2,
      label: "Delete episode",
      onSelect: () => setIsDeleteOpen(true),
    },
  ];

  const bottomAction: RailAction = {
    key: "back",
    icon: ArrowLeft,
    label: "Back to scenes",
    onSelect: () => router.push(episodeScenesHref(project.id, episode.id)),
  };

  const headerSubtitle = `${episode.code || "EP"} · ${formatDateRange(
    episode.startDate,
    episode.endDate
  )}`;

  return (
    <AppShell
      actions={railActions}
      bottomAction={bottomAction}
      railLabel="Episode Manage"
      breadcrumb={[
        { label: "Projects", href: projectsHref() },
        { label: project.title, href: projectEpisodesHref(project.id) },
        { label: episode.episodeName, href: episodeScenesHref(project.id, episode.id) },
        { label: "Manage" },
      ]}
      header={{
        title: episode.episodeName,
        subtitle: headerSubtitle,
        right: (
          <Select
            value={episode.id}
            options={siblingSelectOptions}
            onChange={handleSiblingChange}
            ariaLabel="Switch episode"
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
            {/* Episode Tasks Section */}
            <div className="flex flex-col rounded-[20px] bg-[var(--po-card)] border border-[var(--po-line)] shadow-[var(--po-shadow-sm)] overflow-hidden flex-none">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--po-line)]">
                <div className="flex items-center gap-2.5">
                  <h3 className="m-0 text-[15px] font-semibold text-[var(--po-ink)]">
                    Episode tasks
                  </h3>
                  <span className="rounded-full bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink-2)]">
                    {episodeTasks.length}
                  </span>
                </div>
              </div>

              {episodeTasks.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[var(--po-ink-3)]">
                  This episode has no tasks
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_minmax(120px,1.2fr)_160px_minmax(120px,1fr)_160px_140px] items-center gap-4 px-4 py-2 text-[12px] font-medium text-[var(--po-ink-3)] border-b border-[var(--po-line)] bg-[var(--po-sunken)]/40">
                    <span>#</span>
                    <span>Process</span>
                    <span>Status</span>
                    <span>Completion</span>
                    <span>Assignee</span>
                    <span>Last commit</span>
                  </div>
                  {/* Task Rows */}
                  {episodeTasks.map((task, idx) => {
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

            {/* Scenes Overview Table Section */}
            <div className="flex flex-col flex-1 min-h-[300px] rounded-[20px] bg-[var(--po-card)] border border-[var(--po-line)] shadow-[var(--po-shadow-sm)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--po-line)] flex-none">
                <div className="flex items-center gap-2.5">
                  <h3 className="m-0 text-[15px] font-semibold text-[var(--po-ink)]">
                    Scenes overview
                  </h3>
                  <span className="rounded-full bg-[var(--po-chip)] px-2 py-0.5 text-[11px] font-semibold text-[var(--po-ink-2)]">
                    {scenes.length}
                  </span>
                </div>
              </div>

              {scenes.length === 0 ? (
                <div className="p-12 text-center text-[13px] text-[var(--po-ink-3)]">
                  No scenes yet
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <div className="min-w-max">
                    {/* Sticky Table Header */}
                    <div className="sticky top-0 z-10 flex items-center border-b border-[var(--po-line)] bg-[var(--po-card)] text-[12px] font-medium text-[var(--po-ink-3)] shadow-xs">
                      <div className="w-[200px] flex-none px-4 py-3">Scene</div>
                      <div className="w-[80px] flex-none px-2 py-3 text-center">Frames</div>
                      {processColumns.map((col, idx) => (
                        <div
                          key={col.key}
                          className="w-[160px] flex-none px-3 py-3 flex items-center gap-2 text-[var(--po-ink)]"
                        >
                          <span
                            className="flex h-4 w-4 flex-none items-center justify-center rounded-[4px] text-[9.5px] font-semibold text-white"
                            style={{
                              backgroundColor: col.colour || "var(--po-ink-3)",
                            }}
                          >
                            {col.position ?? idx + 1}
                          </span>
                          <span className="truncate">{col.name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Scene Rows */}
                    {scenes.map((scene) => {
                      const sceneTasks = sceneTasksByScene[scene.id] || [];
                      const initials = (scene.sceneName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2) || "SC").toUpperCase();

                      return (
                        <div
                          key={scene.id}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            router.push(
                              sceneManageHref(project.id, episode.id, scene.id)
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(
                                sceneManageHref(project.id, episode.id, scene.id)
                              );
                            }
                          }}
                          className="flex items-center border-b border-[var(--po-line)] min-h-[50px] transition-colors hover:bg-[var(--po-chip)] cursor-pointer"
                        >
                          {/* Thumbnail & Scene Name */}
                          <div className="w-[200px] flex-none flex items-center gap-2.5 px-4 py-2 min-w-0">
                            <div className="relative h-[28px] w-[48px] flex-none overflow-hidden rounded-[6px] bg-[var(--po-sunken)]">
                              {scene.previewImage ? (
                                <img
                                  src={scene.previewImage}
                                  alt={scene.sceneName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[var(--po-ink-3)] opacity-70">
                                  {initials}
                                </div>
                              )}
                            </div>
                            <span className="truncate text-[13px] font-semibold text-[var(--po-ink)]">
                              {scene.sceneName}
                            </span>
                          </div>

                          {/* Frames */}
                          <div className="w-[80px] flex-none px-2 py-2 text-center text-[12px] text-[var(--po-ink-2)]">
                            {scene.numberOfFrames ?? "—"}
                          </div>

                          {/* Process Columns Cells */}
                          {processColumns.map((col) => {
                            const task = sceneTasks.find(
                              (t) =>
                                (t.sourceWorkflowProcessId &&
                                  t.sourceWorkflowProcessId === col.key) ||
                                t.name === col.name
                            );

                            if (!task) {
                              return (
                                <div
                                  key={col.key}
                                  className="w-[160px] flex-none px-3 py-2 text-[12px] text-[var(--po-ink-3)]"
                                >
                                  —
                                </div>
                              );
                            }

                            const workflowOptions =
                              task.taskStatusWorkflowId
                                ? statusOptionsByWorkflow[task.taskStatusWorkflowId]
                                : null;
                            const statusOption = workflowOptions?.find(
                              (opt) => opt.id === task.taskStatusDefinitionId
                            );

                            const statusName = statusOption?.name || task.status;
                            const statusColour = statusOption?.colour || "var(--po-ink-3)";

                            return (
                              <div
                                key={col.key}
                                className="w-[160px] flex-none px-3 py-2 flex items-center"
                              >
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                                  style={{
                                    backgroundColor: `color-mix(in srgb, ${statusColour} 14%, transparent)`,
                                    color: "var(--po-ink)",
                                  }}
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full flex-none"
                                    style={{ backgroundColor: statusColour }}
                                  />
                                  <span className="truncate max-w-[100px]">
                                    {statusName}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
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

      {/* Delete Episode Modal Dialog */}
      <DeleteEpisodeDialog
        isOpen={isDeleteOpen}
        episode={episode}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => router.replace(projectEpisodesHref(project.id))}
      />
    </AppShell>
  );
};
