"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, SlidersHorizontal, Search, X } from "lucide-react";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  SceneBoardTask,
  TaskStatusOption,
  AssignableUser,
  ProcessProgress,
} from "@/types/production-v2";
import { AppShell } from "@/components/app-shell/AppShell";
import type { RailAction } from "@/components/app-shell/ActionRail";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { ErrorState } from "@/components/app-shell/ErrorState";
import { SceneFormDialog } from "@/components/forms/SceneFormDialog";
import { useTaskEditing } from "@/lib/hooks/useTaskEditing";
import { formatDateRange } from "@/lib/format/production";
import {
  projectsHref,
  projectEpisodesHref,
  sceneManageHref,
} from "@/lib/routes/app";
import { SceneCard } from "./SceneCard";
import { EpisodeProcessStrip } from "./EpisodeProcessStrip";
import { DeleteSceneDialog } from "./DeleteSceneDialog";

export interface ScenesViewProps {
  project: ProjectV2;
  episode: EpisodeV2;
  initialScenes: SceneV2[];
  tasksByScene: Record<string, SceneBoardTask[]>;
  statusOptionsByWorkflow: Record<string, TaskStatusOption[]>;
  users: AssignableUser[];
  processProgress: ProcessProgress[];
  workflowName?: string;
  initialError?: string | null;
}

export const ScenesView: React.FC<ScenesViewProps> = ({
  project,
  episode,
  initialScenes,
  tasksByScene,
  statusOptionsByWorkflow,
  users,
  processProgress,
  workflowName,
  initialError = null,
}) => {
  const router = useRouter();

  const [scenes, setScenes] = useState<SceneV2[]>(initialScenes);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Initial load error replaces page with ErrorState; mutation error shows inline
  const [loadError, setLoadError] = useState<string | null>(initialError);

  const {
    tasks,
    busyIds: busyTaskIds,
    changeStatus: handleStatusChange,
    changeAssignee: handleAssigneeChange,
    error: actionError,
    clearError,
  } = useTaskEditing({
    initialTasks: tasksByScene,
    statusOptionsByWorkflow,
  });

  const completionByStatusId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const list of Object.values(statusOptionsByWorkflow)) {
      for (const opt of list) {
        map[opt.id] = opt.completionPercentage;
      }
    }
    return map;
  }, [statusOptionsByWorkflow]);

  const selectedScene = useMemo(() => {
    return scenes.find((s) => s.id === selectedId) ?? null;
  }, [scenes, selectedId]);

  // Client-side search filter by sceneName, case-insensitive
  const visibleScenes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return scenes;
    return scenes.filter((s) => s.sceneName.toLowerCase().includes(q));
  }, [scenes, searchQuery]);

  const handleSceneCreated = (newScene: SceneV2) => {
    setScenes((prev) => [...prev, newScene]);
    setIsCreateOpen(false);
    setSelectedId(newScene.id);
    router.refresh();
  };

  const handleSceneDeleted = (deletedSceneId: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== deletedSceneId));
    if (selectedId === deletedSceneId) {
      setSelectedId(null);
    }
    setIsDeleteOpen(false);
    router.refresh();
  };

  const handleOpenManage = useCallback(
    (sceneId: string) => {
      router.push(sceneManageHref(project.id, episode.id, sceneId));
    },
    [router, project.id, episode.id]
  );

  // Subtitle formatting: "<episode code> · <workflow name if known> · <date range>"
  const episodeSubtitle = useMemo(() => {
    const codePart = episode.code || "EP";
    const wfPart = workflowName ? `${workflowName} workflow` : "";
    const datePart = formatDateRange(episode.startDate, episode.endDate);
    const parts = [codePart, wfPart, datePart].filter(Boolean);
    return parts.join(" · ");
  }, [episode.code, episode.startDate, episode.endDate, workflowName]);

  // Rail Actions (no kbd hints)
  const railActions: readonly RailAction[] = [
    {
      key: "create",
      icon: Plus,
      label: "Create scene",
      onSelect: () => setIsCreateOpen(true),
    },
    {
      key: "delete",
      icon: Trash2,
      label: "Delete scene",
      disabled: !selectedScene,
      hint: !selectedScene ? "Select a scene first" : undefined,
      onSelect: () => {
        if (selectedScene) {
          setIsDeleteOpen(true);
        }
      },
    },
    {
      key: "manage",
      icon: SlidersHorizontal,
      label: "Manage scene",
      disabled: !selectedScene,
      hint: !selectedScene ? "Select a scene first" : undefined,
      onSelect: () => {
        if (selectedScene) {
          handleOpenManage(selectedScene.id);
        }
      },
    },
  ];

  const bottomAction: RailAction = {
    key: "search",
    icon: Search,
    label: "Search scenes",
    active: searchOpen,
    onSelect: () => {
      setSearchOpen((prev) => {
        if (prev) {
          setSearchQuery("");
        }
        return !prev;
      });
    },
  };

  // Header Right: Search Bar & EpisodeProcessStrip
  const headerRight = (
    <div className="flex items-center gap-3">
      {searchOpen && (
        <div className="flex h-[40px] w-[260px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
          <Search size={16} className="text-[var(--po-ink-3)]" />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scenes..."
            className="flex-1 min-w-0 border-none bg-transparent text-[14px] text-[var(--po-ink)] outline-none placeholder:text-[var(--po-ink-3)]"
          />
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery("");
            }}
            aria-label="Close search"
            className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-[var(--po-ink-3)] transition-colors hover:text-[var(--po-ink)]"
          >
            <X size={15} />
          </button>
        </div>
      )}
      <EpisodeProcessStrip progress={processProgress} />
    </div>
  );

  return (
    <AppShell
      actions={railActions}
      bottomAction={bottomAction}
      railLabel="Scenes"
      breadcrumb={[
        { label: "Projects", href: projectsHref() },
        { label: project.title, href: projectEpisodesHref(project.id) },
        { label: episode.episodeName },
      ]}
      header={{
        title: "Scenes",
        count: visibleScenes.length,
        subtitle: episodeSubtitle,
        right: headerRight,
      }}
    >
      {/* Dismissible inline error notice for task mutations */}
      {actionError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[12px] border border-[#E5534B]/30 bg-[#E5534B]/10 px-4 py-2.5 text-[13px] text-[#E5534B]">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss error"
            className="cursor-pointer text-[#E5534B] opacity-80 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* State Rendering */}
      {loadError ? (
        <ErrorState
          title="Couldn't load scenes"
          message={loadError}
          onRetry={() => {
            setLoadError(null);
            window.location.reload();
          }}
        />
      ) : scenes.length === 0 ? (
        <EmptyState
          title="No scenes yet"
          description="Create your first scene to generate workflow tasks and track progress."
          actionLabel="Create scene"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : visibleScenes.length === 0 ? (
        <EmptyState
          title="No scenes match"
          description={`No scenes match "${searchQuery}".`}
          actionLabel="Clear search"
          onAction={() => setSearchQuery("")}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-4">
          {visibleScenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              tasks={tasks[scene.id] ?? []}
              statusOptionsByWorkflow={statusOptionsByWorkflow}
              completionByStatusId={completionByStatusId}
              users={users}
              busyTaskIds={busyTaskIds}
              isSelected={selectedId === scene.id}
              onSelect={setSelectedId}
              onOpen={handleOpenManage}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
            />
          ))}
        </div>
      )}

      {/* Create Scene Dialog */}
      <SceneFormDialog
        isOpen={isCreateOpen}
        episodeId={episode.id}
        defaultSceneWorkflowId={episode.sceneWorkflow}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleSceneCreated}
      />

      {/* Delete Scene Dialog */}
      <DeleteSceneDialog
        isOpen={isDeleteOpen}
        scene={selectedScene}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={handleSceneDeleted}
      />
    </AppShell>
  );
};
