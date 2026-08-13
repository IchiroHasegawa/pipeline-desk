"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
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
    <CanvasShell
      nav={<VerticalNav active="assets" activeAssetsSubsection="manage" />}
      tools={<TransformTools actions={toolActions} />}
    >
      <div className="w-full h-full overflow-auto p-12">
        <h1 className="text-[var(--text-heading,28px)] font-bold text-[var(--color-ink,#000000)] mb-6 font-sans">
          Asset Projects Library
        </h1>
        <ProjectPosterGrid projects={projects} onSelectProject={handleSelectProject} />
      </div>

      <AssetFormDialog
        isOpen={isAddOpen}
        projects={projects}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAssetCreated}
      />
    </CanvasShell>
  );
};

export default AssetsManagePosterClient;
