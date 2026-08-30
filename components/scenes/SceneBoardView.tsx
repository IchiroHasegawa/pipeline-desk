"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import BoardHeader from "@/components/shell/BoardHeader";
import BottomNav from "@/components/shell/BottomNav";
import SceneFormDialog from "@/components/scenes/SceneFormDialog";
import SceneTaskCard from "@/components/scenes/SceneTaskCard";
import { BOARD_ACCENT, HAIRLINE } from "@/lib/design/boardTokens";
import { updateTaskStatus, updateTaskAssignee } from "@/app/actions/production";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  SceneBoardTask,
  TaskStatusOption,
  AssignableUser,
} from "@/types/production-v2";

export type SceneBoardViewProps = {
  project: ProjectV2;
  episode: EpisodeV2;
  initialScenes: SceneV2[];
  tasksByScene: Record<string, SceneBoardTask[]>;
  statusOptionsByWorkflow: Record<string, TaskStatusOption[]>;
  users: AssignableUser[];
  initialError?: string | null;
};

const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = Math.round((PREVIEW_WIDTH * 9) / 16); // 16:9
const NAME_COLUMN_WIDTH = 240;
const NOTES_COLUMN_WIDTH = 180;
const COLUMN_GAP = 20;
const ROW_PADDING_Y = 16;

const PROJECT_THUMB_WIDTH = 112;
const PROJECT_THUMB_HEIGHT = Math.round((PROJECT_THUMB_WIDTH * 9) / 16);

const SOFT_LINE = "var(--color-line-soft, #a9a9a9)";

/** Column widths are shared by the header rule and every row, so they align. */
const ColumnHeader: React.FC = () => (
  <div
    className="flex flex-row items-end"
    style={{
      gap: COLUMN_GAP + "px",
      paddingBottom: "8px",
      borderBottom: HAIRLINE + " solid var(--color-line, #000000)",
    }}
  >
    {[
      { label: "Preview", width: PREVIEW_WIDTH },
      { label: "Scene name", width: NAME_COLUMN_WIDTH },
      { label: "Tasks", width: null },
      { label: "Notes", width: NOTES_COLUMN_WIDTH },
    ].map((col) => (
      <span
        key={col.label}
        className={col.width === null ? "flex-1 min-w-0" : "shrink-0"}
        style={{
          width: col.width === null ? undefined : col.width + "px",
          fontSize: "var(--text-caption, 11px)",
          color: "var(--color-ink-muted, #707070)",
        }}
      >
        {col.label}
      </span>
    ))}
  </div>
);

type SceneRowProps = {
  scene: SceneV2;
  tasks: SceneBoardTask[];
  statusOptionsByWorkflow: Record<string, TaskStatusOption[]>;
  users: AssignableUser[];
  busyTaskIds: Set<string>;
  onOpenManage: (sceneId: string) => void;
  onStatusChange: (taskId: string, statusDefinitionId: string) => void;
  onAssigneeChange: (taskId: string, profileId: string | null) => void;
};

const SceneRow: React.FC<SceneRowProps> = ({
  scene,
  tasks,
  statusOptionsByWorkflow,
  users,
  busyTaskIds,
  onOpenManage,
  onStatusChange,
  onAssigneeChange,
}) => (
  <div
    className="flex flex-row items-start"
    style={{
      gap: COLUMN_GAP + "px",
      paddingTop: ROW_PADDING_Y + "px",
      paddingBottom: ROW_PADDING_Y + "px",
      borderBottom: HAIRLINE + " solid " + SOFT_LINE,
    }}
  >
    {/*
      A div, not a button: the hover View control is a real button, and nesting
      one button inside another is invalid HTML.
    */}
    <div
      className="group relative shrink-0 overflow-hidden"
      style={{
        width: PREVIEW_WIDTH + "px",
        height: PREVIEW_HEIGHT + "px",
        backgroundColor: "var(--color-placeholder, #d9d9d9)",
        borderRadius: "var(--radius-sm, 3px)",
      }}
    >
      {scene.previewImage ? (
        <img
          src={scene.previewImage}
          alt={scene.sceneName}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontSize: "var(--text-caption, 11px)",
            color: "var(--color-ink-muted, #707070)",
          }}
        >
          No preview
        </span>
      )}

      <button
        type="button"
        onClick={() => onOpenManage(scene.id)}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 cursor-pointer opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 outline-none focus-visible:ring-1 focus-visible:ring-white"
        style={{
          backgroundColor: BOARD_ACCENT,
          color: "var(--color-canvas, #ffffff)",
          fontSize: "var(--text-caption, 11px)",
          borderRadius: "var(--radius-sm, 3px)",
        }}
      >
        View
      </button>
    </div>

    <div
      className="shrink-0 flex flex-col gap-1"
      style={{ width: NAME_COLUMN_WIDTH + "px" }}
    >
      <span
        style={{
          fontSize: "var(--text-body, 15px)",
          color: "var(--color-ink, #000000)",
        }}
      >
        {scene.sceneName}
      </span>
      {scene.description && (
        <span
          className="leading-snug"
          style={{
            fontSize: "var(--text-list, 12px)",
            color: "var(--color-ink-muted, #707070)",
          }}
        >
          {scene.description}
        </span>
      )}
    </div>

    {/* Cards wrap onto further lines rather than scrolling sideways. */}
    <div className="flex-1 min-w-0 flex flex-row flex-wrap gap-3">
      {tasks.length === 0 ? (
        <span
          style={{
            fontSize: "var(--text-list, 12px)",
            color: "var(--color-ink-muted, #707070)",
          }}
        >
          No tasks
        </span>
      ) : (
        tasks.map((task) => (
          <SceneTaskCard
            key={task.id}
            task={task}
            statusOptions={
              task.taskStatusWorkflowId
                ? statusOptionsByWorkflow[task.taskStatusWorkflowId] || []
                : []
            }
            users={users}
            busy={busyTaskIds.has(task.id)}
            onStatusChange={onStatusChange}
            onAssigneeChange={onAssigneeChange}
          />
        ))
      )}
    </div>

    <div
      className="shrink-0 self-stretch"
      style={{
        width: NOTES_COLUMN_WIDTH + "px",
        borderLeft: HAIRLINE + " solid " + SOFT_LINE,
      }}
    />
  </div>
);

export const SceneBoardView: React.FC<SceneBoardViewProps> = ({
  project,
  episode,
  initialScenes,
  tasksByScene,
  statusOptionsByWorkflow,
  users,
  initialError = null,
}) => {
  const router = useRouter();

  const [scenes, setScenes] = useState<SceneV2[]>(initialScenes);
  const [tasks, setTasks] =
    useState<Record<string, SceneBoardTask[]>>(tasksByScene);
  const [busyTaskIds, setBusyTaskIds] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  const visibleScenes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return scenes;
    return scenes.filter((s) => s.sceneName.toLowerCase().includes(q));
  }, [scenes, searchQuery]);

  const handleOpenManage = useCallback(
    (sceneId: string) => {
      router.push(
        "/projects/" +
          project.id +
          "/episodes/" +
          episode.id +
          "/scenes/" +
          sceneId +
          "/manage"
      );
    },
    [router, project.id, episode.id]
  );

  const setBusy = useCallback((taskId: string, busy: boolean) => {
    setBusyTaskIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }, []);

  /*
    Read straight off state rather than out of the setTasks updater: React
    defers updater functions, so anything captured inside one is not available
    by the time the write below needs it to roll back.
  */
  const findTask = useCallback(
    (taskId: string): SceneBoardTask | null =>
      Object.values(tasks)
        .flat()
        .find((task) => task.id === taskId) ?? null,
    [tasks]
  );

  /** Apply a patch to one task wherever it sits. */
  const patchTask = useCallback(
    (taskId: string, patch: Partial<SceneBoardTask>) => {
      setTasks((prev) => {
        const next: Record<string, SceneBoardTask[]> = {};
        for (const [sceneId, list] of Object.entries(prev)) {
          next[sceneId] = list.map((task) =>
            task.id === taskId ? { ...task, ...patch } : task
          );
        }
        return next;
      });
    },
    []
  );

  const restoreTask = useCallback((previous: SceneBoardTask) => {
    setTasks((prev) => {
      const next: Record<string, SceneBoardTask[]> = {};
      for (const [sceneId, list] of Object.entries(prev)) {
        next[sceneId] = list.map((task) =>
          task.id === previous.id ? previous : task
        );
      }
      return next;
    });
  }, []);

  const handleStatusChange = useCallback(
    async (taskId: string, statusDefinitionId: string) => {
      // The name is written alongside the id server-side; mirroring it here
      // keeps the optimistic card consistent with what the write will store.
      const option = Object.values(statusOptionsByWorkflow)
        .flat()
        .find((s) => s.id === statusDefinitionId);

      const previous = findTask(taskId);
      patchTask(taskId, {
        taskStatusDefinitionId: statusDefinitionId,
        status: option ? option.name : undefined,
      });

      setBusy(taskId, true);
      try {
        await updateTaskStatus(taskId, statusDefinitionId);
      } catch (err: unknown) {
        if (previous) restoreTask(previous);
        setErrorMsg(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(taskId, false);
      }
    },
    [statusOptionsByWorkflow, findTask, patchTask, restoreTask, setBusy]
  );

  const handleAssigneeChange = useCallback(
    async (taskId: string, profileId: string | null) => {
      const previous = findTask(taskId);
      patchTask(taskId, { assignee: profileId });

      setBusy(taskId, true);
      try {
        await updateTaskAssignee(taskId, profileId);
      } catch (err: unknown) {
        if (previous) restoreTask(previous);
        setErrorMsg(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(taskId, false);
      }
    },
    [findTask, patchTask, restoreTask, setBusy]
  );

  const handleSceneCreated = (newScene: SceneV2) => {
    setScenes((prev) => [...prev, newScene]);
    setTasks((prev) => ({ ...prev, [newScene.id]: [] }));
    /*
      createSceneV2 generates the scene's tasks through generate_workflow_tasks,
      so the row lands with tasks the client has not seen. The refresh pulls
      them in; the empty entry above just keeps the row renderable until then.
    */
    router.refresh();
  };

  if (errorMsg) {
    return (
      <>
        <CanvasShell nav={null} tools={null}>
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-[var(--radius-card,7px)] p-8 max-w-md shadow-sm">
              <p className="text-[var(--text-section,18px)] text-[var(--color-ink)] font-medium mb-4">
                Error Loading Scenes
              </p>
              <p className="text-[var(--text-list,12px)] text-[var(--color-ink)] mb-6 opacity-90 leading-relaxed">
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-canvas)] text-[var(--text-caption,11px)] font-medium rounded-[var(--radius-sm,3px)] cursor-pointer hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            </div>
          </div>
        </CanvasShell>

        <BottomNav />
      </>
    );
  }

  return (
    <>
      <CanvasShell
        // Same arrangement the Project and Episode boards use: BottomNav is
        // fixed to the viewport's bottom-left while CanvasShell's nav slot is
        // hard-positioned top-right, so the slot is left empty and BottomNav
        // renders as a sibling. This page has no transform tools either.
        nav={null}
        tools={null}
      >
        <div className="w-full h-full relative overflow-hidden flex flex-col">
          <div className="shrink-0 pt-[38px] px-[101.5px] pb-4">
            <BoardHeader
              createLabel="Create Scene"
              manageLabel="Manage Scenes"
              onCreate={() => setIsCreateOpen(true)}
              // TODO: Manage Scenes needs a selection model the header does not
              // have yet — inert, as on the Project and Episode boards.
              onManage={() => {}}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          <div className="shrink-0 px-[101.5px] pb-5 flex flex-row items-center gap-4">
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: PROJECT_THUMB_WIDTH + "px",
                height: PROJECT_THUMB_HEIGHT + "px",
                backgroundColor: "var(--color-placeholder, #d9d9d9)",
                borderRadius: "var(--radius-sm, 3px)",
              }}
            >
              {project.thumbnailUrl && (
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Project title, with the episode title stacked below it. */}
            <div className="min-w-0 flex flex-col gap-1">
              <span
                className="truncate"
                style={{
                  fontSize: "var(--text-section, 18px)",
                  fontWeight: 500,
                  color: "var(--color-ink, #000000)",
                }}
              >
                {project.title}
              </span>
              <span
                className="truncate"
                style={{
                  fontSize: "var(--text-body, 15px)",
                  color: "var(--color-ink, #000000)",
                }}
              >
                {episode.episodeName}
              </span>
              {episode.code && (
                <span
                  style={{
                    fontSize: "var(--text-caption, 11px)",
                    color: "var(--color-ink-muted, #707070)",
                  }}
                >
                  {episode.code}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-[101.5px] pb-[80px]">
            <ColumnHeader />

            {visibleScenes.length === 0 ? (
              <p
                className="pt-6"
                style={{
                  fontSize: "var(--text-list, 12px)",
                  color: "var(--color-ink-muted, #707070)",
                }}
              >
                {scenes.length === 0
                  ? "No scenes yet. Use Create Scene to add the first one."
                  : "No scenes match this search."}
              </p>
            ) : (
              visibleScenes.map((scene) => (
                <SceneRow
                  key={scene.id}
                  scene={scene}
                  tasks={tasks[scene.id] || []}
                  statusOptionsByWorkflow={statusOptionsByWorkflow}
                  users={users}
                  busyTaskIds={busyTaskIds}
                  onOpenManage={handleOpenManage}
                  onStatusChange={handleStatusChange}
                  onAssigneeChange={handleAssigneeChange}
                />
              ))
            )}
          </div>

          <SceneFormDialog
            isOpen={isCreateOpen}
            episodeId={episode.id}
            defaultSceneWorkflowId={episode.sceneWorkflow}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={handleSceneCreated}
          />
        </div>
      </CanvasShell>

      <BottomNav />
    </>
  );
};

export default SceneBoardView;
