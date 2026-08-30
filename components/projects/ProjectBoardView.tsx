"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import BoardHeader from "@/components/shell/BoardHeader";
import BottomNav from "@/components/shell/BottomNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ProjectFormDialog from "@/components/projects/ProjectFormDialog";
import ProjectBoardRow from "@/components/projects/ProjectBoardRow";
import { createProjectV2, deleteProjectV2 } from "@/app/actions/production";
import type { ProjectV2, ProjectBoardStats } from "@/types/production-v2";

export type ProjectBoardViewProps = {
  stats: Record<string, ProjectBoardStats>;
  initialProjects: ProjectV2[];
  initialError?: string | null;
};

export const ProjectBoardView: React.FC<ProjectBoardViewProps> = ({
  initialProjects,
  stats,
  initialError = null,
}) => {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectV2[]>(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);

  // Client-side filter. Panels keep the order getProjectsV2 returned them in.
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

  const handleOpen = useCallback(
    (id: string) => {
      router.push(`/projects/${id}/episodes`);
    },
    [router]
  );

  const handleDeleteSelected = async () => {
    if (!selectedId) return;
    try {
      await deleteProjectV2(selectedId);
      setProjects((prev) => prev.filter((p) => p.id !== selectedId));
      setSelectedId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  // WHOLE and RESTORE are timeline-focus concepts and have no meaning here.
  const toolActions: ToolAction[] = [
    { id: "add", label: "ADD", onSelect: () => setIsCreateOpen(true) },
    {
      id: "sub",
      label: "SUB",
      onSelect: handleDeleteSelected,
      disabled: !selectedId,
    },
  ];

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

  // Layout states
  if (errorMsg) {
    return (
      <CanvasShell
        nav={<BottomNav />}
        tools={<TransformTools actions={toolActions} />}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-[var(--radius-card,7px)] p-8 max-w-md shadow-sm">
            <p className="text-[var(--text-section,18px)] text-[var(--color-ink)] font-medium mb-4">
              Error Loading Projects
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
    );
  }

  if (projects.length === 0) {
    return (
      <CanvasShell
        nav={<BottomNav />}
        tools={<TransformTools actions={toolActions} />}
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div className="border border-dashed border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-card,7px)] p-10 max-w-md bg-white/50">
            <p className="text-[var(--text-section,18px)] text-[var(--color-ink,#000000)] font-medium mb-2">
              No Projects Found
            </p>
            <p className="text-[var(--text-list,12px)] text-[var(--color-ink-muted,#707070)] mb-6">
              Create your first project to start building your production timeline.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2 bg-[var(--color-ink,#000000)] text-[var(--color-canvas,#ffffff)] text-[var(--text-caption,11px)] font-medium rounded-[var(--radius-sm,3px)] cursor-pointer"
            >
              + Create First Project
            </button>
          </div>

          <ProjectFormDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreateProject}
          />
        </div>
      </CanvasShell>
    );
  }

  return (
    <>
      <CanvasShell
        // BottomNav is fixed to the viewport's bottom-left, but CanvasShell's
        // nav slot is hard-positioned top-right at (1632.5, 38). Rather than
        // change that slot — every other page still depends on it — the slot is
        // left empty and BottomNav renders as a sibling. `nav` stays a required
        // prop; React.ReactNode already admits null, so no signature change.
        nav={null}
        tools={<TransformTools actions={toolActions} />}
        toolsPosition={{ x: 101.5, y: 87 }}
      >
        <div className="w-full h-full relative overflow-hidden flex flex-col">
          <div className="shrink-0 pt-[38px] px-[101.5px] pb-4">
            <BoardHeader
              createLabel="Create Project"
              manageLabel="Manage Project"
              onCreate={() => setIsCreateOpen(true)}
              // TODO: the Manage Project page is not in scope for this phase.
              onManage={() => {}}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          <div className="flex-1 min-h-0 relative">
            <ProjectBoardRow
              projects={visibleProjects}
              onOpen={handleOpen}
              stats={stats}
              selectedId={selectedId}
              onSelect={handleSelect}
              onError={setErrorMsg}
            />
          </div>

          <ProjectFormDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreateProject}
          />
        </div>
      </CanvasShell>

      <BottomNav />
    </>
  );
};

export default ProjectBoardView;
