"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import BoardHeader from "@/components/shell/BoardHeader";
import BottomNav from "@/components/shell/BottomNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import ProjectPosterGrid from "@/components/assets-v2/ProjectPosterGrid";
import AssetFormDialog from "@/components/assets-v2/AssetFormDialog";
import type { ProjectV2, AssetV2 } from "@/types/production-v2";

export type AssetsManagePosterClientProps = {
  projects: ProjectV2[];
};

export const AssetsManagePosterClient: React.FC<AssetsManagePosterClientProps> = ({
  projects,
}) => {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const visibleProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const handleSelectProject = (projectId: string) => {
    router.push(`/assets/manage/${projectId}`);
  };

  const handleAssetCreated = (newAsset: AssetV2) => {
    if (newAsset.projectId) {
      router.push(`/assets/manage/${newAsset.projectId}`);
    }
  };

  const toolActions: ToolAction[] = [
    { id: "add", label: "ADD", onSelect: () => setIsAddOpen(true) },
    { id: "sub", label: "SUB", onSelect: () => {} },
  ];

  return (
    <>
      <CanvasShell
        nav={null}
        tools={<TransformTools actions={toolActions} />}
        toolsPosition={{ x: 105, y: 62 }}
      >
        <div className="relative w-full h-full overflow-auto select-none font-sans flex flex-col">
          <div className="shrink-0 pt-[38px] px-[78px] pb-4">
            <BoardHeader
              createLabel="Create Assets"
              manageLabel="Manage Assets"
              onCreate={() => setIsAddOpen(true)}
              // Already on the Manage Assets landing page
              onManage={() => {}}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          <div className="relative flex-1 min-h-0">
            {/* Title at (78, 180) -> preserving existing title block below header */}
            <h1 className="absolute left-[78px] top-[100px] text-[var(--text-heading,24px)] font-bold text-[var(--color-ink,#000000)] tracking-tight">
              Asset Projects Library
            </h1>
            {/* Poster Grid at (78, 227) */}
            <div className="absolute left-[78px] top-[147px] pb-16">
              <ProjectPosterGrid projects={visibleProjects} onSelectProject={handleSelectProject} />
            </div>
          </div>
        </div>

        <AssetFormDialog
          isOpen={isAddOpen}
          projects={projects}
          onClose={() => setIsAddOpen(false)}
          onSuccess={handleAssetCreated}
        />
      </CanvasShell>

      <BottomNav />
    </>
  );
};

export default AssetsManagePosterClient;
