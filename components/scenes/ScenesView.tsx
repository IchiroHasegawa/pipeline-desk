"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ListPanel, { ListPanelItem } from "@/components/shell/ListPanel";

import DayBranchTree, { DayWithTasks } from "@/components/scenes/DayBranchTree";
import CustomTasksPanel from "@/components/scenes/CustomTasksPanel";
import MainTasksPanel from "@/components/shared/MainTasksPanel";
import EpisodeStrip, { EpisodeStripItem } from "@/components/episodes/EpisodeStrip";
import AddDialog from "@/components/scenes/AddDialog";
import SceneFormDialog from "@/components/scenes/SceneFormDialog";

import {
  SCENE_LINE_X_ENTRANCE,
  SCENE_LINE_X_FOCUS,
  SCENE_ZOOM_FOCUS,
} from "@/lib/timeline/timelineGeometry";
import {
  createDay,
  createCustomTask,
  setCustomTaskComplete,
  deleteDayV2,
  deleteCustomTask,
  getMainTasksForScene,
} from "@/app/actions/production";
import type { EpisodeV2, SceneV2, CustomTaskV2, MainTaskV2 } from "@/types/production-v2";

export type ScenesViewProps = {
  episode: EpisodeV2;
  scenes: SceneV2[];
  initialDaysWithTasks: DayWithTasks[];
  initialError?: string | null;
};

export const ScenesView: React.FC<ScenesViewProps> = ({
  episode,
  scenes,
  initialDaysWithTasks,
  initialError = null,
}) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [addedScenes, setAddedScenes] = useState<SceneV2[]>([]);

  const extraScenes = useMemo(
    () => addedScenes.filter((s) => !scenes.some((existing) => existing.id === s.id)),
    [scenes, addedScenes]
  );

  const sceneList = useMemo(() => [...scenes, ...extraScenes], [scenes, extraScenes]);

  const [daysWithTasks, setDaysWithTasks] = useState<DayWithTasks[]>(initialDaysWithTasks);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [focusedDayId, setFocusedDayId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    scenes.length > 0 ? scenes[0].id : null
  );

  const [mainTasks, setMainTasks] = useState<MainTaskV2[]>([]);
  const [isLoadingMainTasks, setIsLoadingMainTasks] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSceneFormOpen, setIsSceneFormOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  // DESIGN_SPEC §7: line x 957.8 at rest, 473.2 when a day is focused;
  // branch/segment lengths scale by 3.15× in the focused state.
  const isFocused = focusedDayId !== null;
  const episodeLineX = isFocused ? SCENE_LINE_X_FOCUS : SCENE_LINE_X_ENTRANCE;
  const zoom = isFocused ? SCENE_ZOOM_FOCUS : 1;

  // Flatten all custom tasks across all days for rollup calculation
  const allCustomTasks = useMemo(() => {
    return daysWithTasks.flatMap((d) => d.tasks);
  }, [daysWithTasks]);

  // Map custom tasks grouped by day ID for AddDialog selection
  const customTasksByDayMap = useMemo(() => {
    const map: Record<string, CustomTaskV2[]> = {};
    daysWithTasks.forEach((d) => {
      map[d.id] = d.tasks;
    });
    return map;
  }, [daysWithTasks]);

  // Fetch Main Tasks lazily when selected scene changes
  useEffect(() => {
    let cancelled = false;
    async function loadSceneTasks() {
      if (!selectedSceneId) {
        if (!cancelled) setMainTasks([]);
        return;
      }
      try {
        setIsLoadingMainTasks(true);
        const tasks = await getMainTasksForScene(selectedSceneId);
        if (!cancelled) {
          setMainTasks(tasks);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Failed to load main tasks for scene:", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMainTasks(false);
        }
      }
    }
    loadSceneTasks();
    return () => {
      cancelled = true;
    };
  }, [selectedSceneId]);

  // List items for ListPanel (Days/Dates)
  const listItems: ListPanelItem[] = useMemo(() => {
    return daysWithTasks.map((d) => ({
      id: d.id,
      label: d.dayDate,
    }));
  }, [daysWithTasks]);

  // Scene items for EpisodeStrip
  const stripItems: EpisodeStripItem[] = useMemo(() => {
    return sceneList.map((s) => ({
      id: s.id,
      label: s.sceneName,
      thumbnailUrl: s.previewImage,
    }));
  }, [sceneList]);

  // Focused day object
  const focusedDay = useMemo(() => {
    return daysWithTasks.find((d) => d.id === focusedDayId);
  }, [daysWithTasks, focusedDayId]);

  const handleSceneCreated = (newScene: SceneV2) => {
    setAddedScenes((prev) => [...prev, newScene]);
    setSelectedSceneId(newScene.id);
    router.refresh();
  };

  // Handlers
  const handleListSelect = useCallback((id: string) => {
    // ListPanel click -> Select AND Focus day
    setSelectedDayId(id);
    setFocusedDayId(id);
    setSelectedTaskId(null);
  }, []);

  const handleDaySelect = useCallback((id: string) => {
    setSelectedDayId(id);
    setSelectedTaskId(null);
  }, []);

  const handleDayOpen = useCallback((id: string) => {
    setSelectedDayId(id);
    setFocusedDayId(id);
    setSelectedTaskId(null);
  }, []);

  const handleTaskSelect = useCallback((id: string) => {
    setSelectedTaskId(id);
  }, []);

  const handleSceneSelect = useCallback((id: string) => {
    // Single click scene thumbnail -> Select scene
    setSelectedSceneId(id);
  }, []);

  const handleSceneOpenManage = useCallback(
    (sceneId: string) => {
      // Double click scene thumbnail -> Navigate to Scene Manage
      router.push(`/projects/${episode.projectId}/episodes/${episode.id}/scenes/${sceneId}/manage`);
    },
    [episode.projectId, episode.id, router]
  );

  // Toggle Custom Task completion optimistically
  const handleToggleTaskComplete = async (taskId: string, complete: boolean) => {
    const newProgress = complete ? 100 : 0;
    const newStatus = complete ? "Completed" : "Not Started";

    // Optimistically update local daysWithTasks state
    setDaysWithTasks((prevDays) =>
      prevDays.map((day) => ({
        ...day,
        tasks: day.tasks.map((task) =>
          task.id === taskId ? { ...task, progress: newProgress, status: newStatus } : task
        ),
      }))
    );

    try {
      await setCustomTaskComplete(taskId, complete);
    } catch (err: unknown) {
      console.error("Failed to update custom task completion:", err);
      // Rollback on error
      window.location.reload();
    }
  };

  // Create Day handler
  const handleCreateDay = async (data: { dayDate: string; title?: string; description?: string }) => {
    const newDay = await createDay({
      episodeId: episode.id,
      dayDate: data.dayDate,
      title: data.title,
      description: data.description,
    });
    const newDayWithTasks: DayWithTasks = { ...newDay, tasks: [] };
    setDaysWithTasks((prev) => [...prev, newDayWithTasks]);
    setSelectedDayId(newDay.id);
    setFocusedDayId(newDay.id);
  };

  // Create Custom Task handler
  const handleCreateTask = async (data: {
    name: string;
    dayId: string;
    contributesToTaskId?: string;
    branchesFromTaskId?: string;
    description?: string;
  }) => {
    const newTask = await createCustomTask({
      dayId: data.dayId,
      name: data.name,
      contributesToTaskId: data.contributesToTaskId,
      branchesFromTaskId: data.branchesFromTaskId,
    });

    setDaysWithTasks((prev) =>
      prev.map((day) =>
        day.id === data.dayId ? { ...day, tasks: [...day.tasks, newTask] } : day
      )
    );
    setSelectedTaskId(newTask.id);
  };

  // Delete Selected Item
  const handleDeleteSelected = async () => {
    if (selectedTaskId) {
      try {
        await deleteCustomTask(selectedTaskId);
        setDaysWithTasks((prev) =>
          prev.map((day) => ({
            ...day,
            tasks: day.tasks.filter((t) => t.id !== selectedTaskId),
          }))
        );
        setSelectedTaskId(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
      }
    } else if (selectedDayId) {
      if (
        !window.confirm(
          "Are you sure you want to delete this Day? All custom tasks on this day will also be removed."
        )
      ) {
        return;
      }
      try {
        await deleteDayV2(selectedDayId);
        setDaysWithTasks((prev) => prev.filter((d) => d.id !== selectedDayId));
        if (focusedDayId === selectedDayId) setFocusedDayId(null);
        setSelectedDayId(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
      }
    }
  };

  // Tools
  const toolActions: ToolAction[] = [
    { id: "add", label: "ADD", onSelect: () => setIsAddOpen(true) },
    {
      id: "sub",
      label: "SUB",
      onSelect: handleDeleteSelected,
      disabled: !selectedDayId && !selectedTaskId,
    },
    {
      id: "whole",
      label: "WHOLE",
      onSelect: () => setFocusedDayId(null),
    },
    {
      id: "restore",
      label: "RESTORE",
      onSelect: () => {
        setFocusedDayId(null);
        setSelectedDayId(null);
        setSelectedTaskId(null);
      },
    },
  ];

  // Handle escape key to clear focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusedDayId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (errorMsg) {
    return (
      <CanvasShell
        nav={<VerticalNav active="project" />}
        tools={<TransformTools actions={toolActions} />}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[var(--color-panel,#f0f0f0)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] p-8 max-w-md">
            <p className="text-[var(--text-section,18px)] text-[var(--color-ink,#000000)] font-medium mb-4">
              Error Loading Scenes
            </p>
            <p className="text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)] mb-6">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] text-[var(--text-caption,11px)] font-medium rounded-[var(--radius-sm,3px)] cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </CanvasShell>
    );
  }

  return (
    <CanvasShell
      nav={<VerticalNav active="project" />}
      tools={<TransformTools actions={toolActions} />}
      toolsPosition={{ x: 101, y: 86 }}
      list={
        <ListPanel
          items={listItems}
          selectedId={selectedDayId}
          onSelect={handleListSelect}
          emptyLabel="No dates"
        />
      }
    >
      <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        {/* Main Canvas rendering vertical episode line & Day/Task branches */}
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full overflow-visible"
        >
          <DayBranchTree
            episodeLineX={episodeLineX}
            zoom={zoom}
            days={daysWithTasks}
            selectedDayId={selectedDayId}
            focusedDayId={focusedDayId}
            selectedTaskId={selectedTaskId}
            onSelectDay={handleDaySelect}
            onOpenDay={handleDayOpen}
            onSelectTask={handleTaskSelect}
          />
        </svg>

        {/* DESIGN_SPEC §7: both panels show simultaneously on the Scene page. */}
        <CustomTasksPanel
          tasks={focusedDay ? focusedDay.tasks : []}
          selectedTaskId={selectedTaskId}
          onSelectTask={handleTaskSelect}
          onToggleComplete={handleToggleTaskComplete}
        />

        <MainTasksPanel
          mainTasks={mainTasks}
          customTasks={allCustomTasks}
          isLoading={isLoadingMainTasks}
        />

        {/* Scene Strip Picker at (221, 938) */}
        <EpisodeStrip
          items={stripItems}
          selectedId={selectedSceneId}
          onSelect={handleSceneSelect}
          onOpenManage={handleSceneOpenManage}
          onCreate={() => setIsSceneFormOpen(true)}
          createLabel="New Scene"
        />

        {/* Two-step Add Dialog */}
        <AddDialog
          isOpen={isAddOpen}
          days={daysWithTasks}
          mainTasks={mainTasks}
          customTasksByDay={customTasksByDayMap}
          defaultDayId={selectedDayId}
          onClose={() => setIsAddOpen(false)}
          onCreateDay={handleCreateDay}
          onCreateTask={handleCreateTask}
        />

        {/* Create Scene Dialog */}
        <SceneFormDialog
          isOpen={isSceneFormOpen}
          episodeId={episode.id}
          onClose={() => setIsSceneFormOpen(false)}
          onSuccess={handleSceneCreated}
        />
      </div>
    </CanvasShell>
  );
};

export default ScenesView;
