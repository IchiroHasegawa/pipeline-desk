"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ListPanel, { ListPanelItem } from "@/components/shell/ListPanel";

import DayBranchTree, { DayWithTasks } from "@/components/scenes/DayBranchTree";
import CustomTasksPanel from "@/components/scenes/CustomTasksPanel";
import EpisodeStrip, { EpisodeStripItem } from "@/components/episodes/EpisodeStrip";
import AddDialog from "@/components/scenes/AddDialog";

import { computeMainTaskProgress } from "@/lib/timeline/taskRollup";
import {
  createDay,
  createCustomTask,
  setCustomTaskComplete,
  deleteDayV2,
  deleteCustomTask,
  getMainTasksForScene,
} from "@/lib/data/v2/productionRepositoryV2";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  // Animate episode line X position: ~958 at rest, ~473 when a day is focused
  const episodeLineX = focusedDayId ? 473 : 958;

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
    return scenes.map((s) => ({
      id: s.id,
      label: s.sceneName,
      thumbnailUrl: s.previewImage,
    }));
  }, [scenes]);

  // Focused day object
  const focusedDay = useMemo(() => {
    return daysWithTasks.find((d) => d.id === focusedDayId);
  }, [daysWithTasks, focusedDayId]);

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
        <svg className="w-full h-full overflow-visible pointer-events-none">
          <DayBranchTree
            episodeLineX={episodeLineX}
            days={daysWithTasks}
            selectedDayId={selectedDayId}
            focusedDayId={focusedDayId}
            selectedTaskId={selectedTaskId}
            onSelectDay={handleDaySelect}
            onOpenDay={handleDayOpen}
            onSelectTask={handleTaskSelect}
          />
        </svg>

        {/* Custom Tasks Panel (Figma 70:409) at offset (1611, 226) */}
        {focusedDay && (
          <CustomTasksPanel
            tasks={focusedDay.tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={handleTaskSelect}
            onToggleComplete={handleToggleTaskComplete}
          />
        )}

        {/* Main Tasks Panel (Figma 70:412) at offset (1765, 225) */}
        {selectedSceneId && (
          <aside
            aria-label="Main Tasks Panel"
            className="absolute z-30 pointer-events-auto w-[124px] bg-[var(--color-panel,#f0f0f0)] border border-[var(--color-line,#000000)] rounded-[var(--radius-card,7px)] shadow-lg overflow-hidden transition-all duration-300 font-sans"
            style={{
              left: "calc((1765 / 1920) * 100%)",
              top: "calc((225 / 1080) * 100%)",
              height: "414px",
            }}
          >
            {/* Header bar */}
            <div className="h-[36px] px-3 flex items-center border-b border-[var(--color-line-soft,#a9a9a9)] bg-[var(--color-panel,#f0f0f0)]">
              <span className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink,#000000)] tracking-tight">
                Main Tasks
              </span>
            </div>

            {/* Task list body */}
            <div className="p-2 flex flex-col gap-3 relative h-[378px] overflow-y-auto">
              {/* Hairline vertical rail */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[0.5px] bg-[var(--color-line,#000000)] pointer-events-none" />

              {isLoadingMainTasks ? (
                <div className="py-6 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] font-mono">
                  Loading...
                </div>
              ) : mainTasks.length === 0 ? (
                <div className="py-6 text-center text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)]">
                  No tasks
                </div>
              ) : (
                mainTasks.map((task) => {
                  // Real-time progress rollup calculation
                  const displayedPct = computeMainTaskProgress(task, allCustomTasks);

                  return (
                    <div key={task.id} className="relative pl-4 flex flex-col gap-1">
                      {/* Row Dot */}
                      <div className="absolute left-[5px] top-1.5 w-[5px] h-[5px] rounded-full bg-[var(--color-ink,#000000)] -translate-x-1/2" />

                      <div className="flex flex-row items-center justify-between">
                        <span className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)] truncate max-w-[80px]">
                          {task.name}
                        </span>
                        <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink-muted,#707070)]">
                          {displayedPct}%
                        </span>
                      </div>

                      {/* Progress Bar Track */}
                      <div className="w-[110px] h-[4px] bg-[var(--color-line-soft,#a9a9a9)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-progress,#000000)] transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, displayedPct))}%` }}
                        />
                      </div>

                      <span className="text-[9px] font-mono text-[var(--color-ink-muted,#707070)] truncate">
                        Last commit 2d ago
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* Scene Strip Picker at (221, 938) */}
        <EpisodeStrip
          items={stripItems}
          selectedId={selectedSceneId}
          onSelect={handleSceneSelect}
          onOpenManage={handleSceneOpenManage}
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
      </div>
    </CanvasShell>
  );
};

export default ScenesView;
