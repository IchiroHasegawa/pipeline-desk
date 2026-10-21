"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, SlidersHorizontal, Search, X } from "lucide-react";
import type {
  ProjectV2,
  ProjectBoardStats,
  EpisodeV2,
  ProcessProgress,
} from "@/types/production-v2";
import { AppShell } from "@/components/app-shell/AppShell";
import type { RailAction } from "@/components/app-shell/ActionRail";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { ErrorState } from "@/components/app-shell/ErrorState";
import { ProjectFormDialog } from "@/components/forms/ProjectFormDialog";
import { createProjectV2 } from "@/app/actions/production";
import { ProjectCard } from "./ProjectCard";
import { ProjectDetailsPanel } from "./ProjectDetailsPanel";
import { DeleteProjectDialog } from "./DeleteProjectDialog";

export interface ProjectsViewProps {
  initialProjects: ProjectV2[];
  stats: Record<string, ProjectBoardStats>;
  episodesByProject: Record<string, EpisodeV2[]>;
  processProgress: Record<string, ProcessProgress[]>;
  initialError: string | null;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  initialProjects,
  stats,
  episodesByProject,
  processProgress,
  initialError,
}) => {
  const [projects, setProjects] = useState<ProjectV2[]>(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedId) ?? null;
  }, [projects, selectedId]);

  // Client-side search filter by title or projectCode, case-insensitive
  const visibleProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleCreateProject = async (data: {
    title: string;
    projectCode: string;
    description?: string;
    startDate: string;
    endDate?: string;
    thumbnailUrl?: string;
  }) => {
    const newProj = await createProjectV2(data);
    setProjects((prev) => [newProj, ...prev]);
    setSelectedId(newProj.id);
  };

  const handleDeleted = (deletedId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== deletedId));
    if (selectedId === deletedId) {
      setSelectedId(null);
      setIsDetailsOpen(false);
    }
  };

  // Rail Actions (matching prototype; no kbd hints)
  const railActions: readonly RailAction[] = [
    {
      key: "create",
      icon: Plus,
      label: "Create project",
      onSelect: () => setIsCreateOpen(true),
    },
    {
      key: "delete",
      icon: Trash2,
      label: "Delete project",
      disabled: !selectedProject || selectedProject.isSystem,
      hint: !selectedProject
        ? "Select a project first"
        : selectedProject.isSystem
        ? "The system project can't be deleted"
        : undefined,
      onSelect: () => {
        if (selectedProject && !selectedProject.isSystem) {
          setIsDeleteOpen(true);
        }
      },
    },
    {
      key: "manage",
      icon: SlidersHorizontal,
      label: "Manage project",
      disabled: !selectedProject,
      hint: !selectedProject ? "Select a project first" : undefined,
      onSelect: () => {
        if (selectedProject) {
          setIsDetailsOpen(true);
        }
      },
    },
  ];

  const bottomAction: RailAction = {
    key: "search",
    icon: Search,
    label: "Search projects",
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
        placeholder="Search projects..."
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
      railLabel="Projects"
      breadcrumb={[{ label: "Projects" }]}
      header={{
        title: "Projects",
        count: visibleProjects.length,
        right: headerRight,
      }}
    >
      {/* State Rendering */}
      {errorMsg ? (
        <ErrorState
          title="Couldn't load projects"
          message={errorMsg}
          onRetry={() => {
            setErrorMsg(null);
            window.location.reload();
          }}
        />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking episodes, scenes and assets."
          actionLabel="Create project"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : visibleProjects.length === 0 ? (
        <EmptyState
          title="No projects match"
          description={`No projects match "${searchQuery}".`}
          actionLabel="Clear search"
          onAction={() => setSearchQuery("")}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              stats={stats[project.id]}
              episodes={episodesByProject[project.id] ?? []}
              processProgress={processProgress}
              isSelected={selectedId === project.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Slide-over details panel */}
      {isDetailsOpen && selectedProject && (
        <ProjectDetailsPanel
          project={selectedProject}
          stats={stats[selectedProject.id]}
          onClose={() => setIsDetailsOpen(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      <DeleteProjectDialog
        isOpen={isDeleteOpen}
        project={selectedProject}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={handleDeleted}
      />

      {/* Create Project Dialog */}
      <ProjectFormDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateProject}
      />
    </AppShell>
  );
};
