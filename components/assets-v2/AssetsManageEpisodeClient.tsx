"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import EpsAstsTabs from "@/components/assets-v2/EpsAstsTabs";
import EpisodeThumbGrid from "@/components/assets-v2/EpisodeThumbGrid";
import AssetFormDialog from "@/components/assets-v2/AssetFormDialog";
import type { ProjectV2, EpisodeV2, AssetV2 } from "@/types/production-v2";

export type AssetsManageEpisodeClientProps = {
  project: ProjectV2;
  episodes: EpisodeV2[];
  assets: AssetV2[];
  allProjects: ProjectV2[];
};

export const AssetsManageEpisodeClient: React.FC<AssetsManageEpisodeClientProps> = ({
  project,
  episodes,
  assets,
  allProjects,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"eps" | "asts">("eps");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleSelectEpisode = (episodeId: string) => {
    router.push(`/assets/manage/${project.id}/episodes/${episodeId}`);
  };

  const handleAssetCreated = () => {
    router.refresh();
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
      <div className="w-full h-full overflow-auto p-12 flex flex-col gap-6 font-sans">
        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink-muted,#707070)]">
            {project.isSystem ? "★ System Project" : project.projectCode}
          </span>
          <h1 className="text-[var(--text-heading,28px)] font-bold text-[var(--color-ink,#000000)]">
            {project.title}
          </h1>
        </div>

        {/* Tabs & Content */}
        <EpsAstsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <EpisodeThumbGrid
          episodes={episodes}
          assets={assets}
          activeTab={activeTab}
          onSelectEpisode={handleSelectEpisode}
        />
      </div>

      <AssetFormDialog
        isOpen={isAddOpen}
        projects={allProjects}
        defaultProjectId={project.id}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAssetCreated}
      />
    </CanvasShell>
  );
};

export default AssetsManageEpisodeClient;
