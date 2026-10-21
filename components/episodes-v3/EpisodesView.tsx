"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, SlidersHorizontal, Search, X } from "lucide-react";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  ProcessProgress,
} from "@/types/production-v2";
import { AppShell } from "@/components/app-shell/AppShell";
import type { RailAction } from "@/components/app-shell/ActionRail";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { ErrorState } from "@/components/app-shell/ErrorState";
import { EpisodeFormDialog } from "@/components/episodes/EpisodeFormDialog";
import { createEpisodeV2 } from "@/app/actions/production";
import {
  durationDays,
  formatDuration,
  formatDateRange,
} from "@/lib/format/production";
import {
  projectsHref,
  episodeManageHref,
} from "@/lib/routes/app";
import { EpisodeCard } from "./EpisodeCard";
import { DeleteEpisodeDialog } from "./DeleteEpisodeDialog";

export interface EpisodesViewProps {
  project: ProjectV2;
  initialEpisodes: EpisodeV2[];
  processProgress: Record<string, ProcessProgress[]>;
  scenesByEpisode: Record<string, SceneV2[]>;
  taskRollup: {
    byEpisode: Record<string, { total: number; complete: number }>;
    byScene: Record<string, { total: number; complete: number }>;
  };
  workflowNameById: Record<string, string>;
  initialError: string | null;
}

export const EpisodesView: React.FC<EpisodesViewProps> = ({
  project,
  initialEpisodes,
  processProgress: initialProgress,
  scenesByEpisode: initialScenes,
  taskRollup: initialRollup,
  workflowNameById,
  initialError,
}) => {
  const router = useRouter();

  const [episodes, setEpisodes] = useState<EpisodeV2[]>(initialEpisodes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  const selectedEpisode = useMemo(() => {
    return episodes.find((e) => e.id === selectedId) ?? null;
  }, [episodes, selectedId]);

  // Client-side search filter by episodeName or code, case-insensitive
  const visibleEpisodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter(
      (e) =>
        e.episodeName.toLowerCase().includes(q) ||
        (e.code && e.code.toLowerCase().includes(q))
    );
  }, [episodes, searchQuery]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleCreateEpisode = async (data: {
    projectId: string;
    episodeName: string;
    code?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    jobWorkflowId?: string;
    sceneWorkflowId?: string;
  }) => {
    const newEp = await createEpisodeV2(data);
    // Append the new episode with empty progress, scenes and rollup
    setEpisodes((prev) => [...prev, newEp]);
    setSelectedId(newEp.id);
  };

  const handleDeleted = (deletedId: string) => {
    setEpisodes((prev) => prev.filter((e) => e.id !== deletedId));
    if (selectedId === deletedId) {
      setSelectedId(null);
    }
  };

  // Project subtitle formatting: "<projectCode> · <date range and duration>"
  const projectSubtitle = useMemo(() => {
    const days = durationDays(project.startDate, project.endDate);
    const dur = formatDuration(days, Boolean(project.startDate));
    const range = formatDateRange(project.startDate, project.endDate);
    const durSuffix = project.startDate ? ` · ${dur}` : "";
    return `${project.projectCode} · ${range}${durSuffix}`;
  }, [project.projectCode, project.startDate, project.endDate]);

  // Rail Actions (matching prototype; no kbd hints)
  const railActions: readonly RailAction[] = [
    {
      key: "create",
      icon: Plus,
      label: "Create episode",
      onSelect: () => setIsCreateOpen(true),
    },
    {
      key: "delete",
      icon: Trash2,
      label: "Delete episode",
      disabled: !selectedEpisode,
      hint: !selectedEpisode ? "Select an episode first" : undefined,
      onSelect: () => {
        if (selectedEpisode) {
          setIsDeleteOpen(true);
        }
      },
    },
    {
      key: "manage",
      icon: SlidersHorizontal,
      label: "Manage episode",
      disabled: !selectedEpisode,
      hint: !selectedEpisode ? "Select an episode first" : undefined,
      onSelect: () => {
        if (selectedEpisode) {
          router.push(episodeManageHref(project.id, selectedEpisode.id));
        }
      },
    },
  ];

  const bottomAction: RailAction = {
    key: "search",
    icon: Search,
    label: "Search episodes",
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

  // Header Search Input Slot
  const headerRight = searchOpen ? (
    <div className="flex h-[40px] w-[300px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
      <Search size={16} className="text-[var(--po-ink-3)]" />
      <input
        autoFocus
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search episodes..."
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
  ) : undefined;

  return (
    <AppShell
      actions={railActions}
      bottomAction={bottomAction}
      railLabel="Episodes"
      breadcrumb={[
        { label: "Projects", href: projectsHref() },
        { label: project.title },
      ]}
      header={{
        title: "Episodes",
        count: visibleEpisodes.length,
        subtitle: projectSubtitle,
        right: headerRight,
      }}
    >
      {/* State Rendering */}
      {errorMsg ? (
        <ErrorState
          title="Couldn't load episodes"
          message={errorMsg}
          onRetry={() => {
            setErrorMsg(null);
            window.location.reload();
          }}
        />
      ) : episodes.length === 0 ? (
        <EmptyState
          title="No episodes yet"
          description="Create your first episode to start tracking scenes and tasks."
          actionLabel="Create episode"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : visibleEpisodes.length === 0 ? (
        <EmptyState
          title="No episodes match"
          description={`No episodes match "${searchQuery}".`}
          actionLabel="Clear search"
          onAction={() => setSearchQuery("")}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {visibleEpisodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              projectId={project.id}
              processProgress={initialProgress[episode.id] ?? []}
              scenes={initialScenes[episode.id] ?? []}
              sceneRollup={initialRollup.byScene}
              episodeRollup={initialRollup.byEpisode[episode.id]}
              workflowName={
                episode.sceneWorkflow
                  ? workflowNameById[episode.sceneWorkflow]
                  : undefined
              }
              isSelected={selectedId === episode.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <DeleteEpisodeDialog
        isOpen={isDeleteOpen}
        episode={selectedEpisode}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={handleDeleted}
      />

      {/* Create Episode Dialog */}
      <EpisodeFormDialog
        isOpen={isCreateOpen}
        projectId={project.id}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateEpisode}
      />
    </AppShell>
  );
};
