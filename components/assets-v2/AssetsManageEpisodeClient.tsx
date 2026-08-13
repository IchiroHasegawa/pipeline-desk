"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import EpsAstsTabs from "@/components/assets-v2/EpsAstsTabs";
import EpisodeThumbGrid from "@/components/assets-v2/EpisodeThumbGrid";
import AssetRowTable from "@/components/assets-v2/AssetRowTable";
import AssetFormDialog from "@/components/assets-v2/AssetFormDialog";
import { updateAssetTask } from "@/app/actions/production";
import type {
  ProjectV2,
  EpisodeV2,
  AssetV2,
  AssetTaskV2,
} from "@/types/production-v2";

export type AssetsManageEpisodeClientProps = {
  project: ProjectV2;
  episodes: EpisodeV2[];
  assets: AssetV2[];
  assetTasksMap?: Record<string, AssetTaskV2[]>;
  statuses?: string[];
  allProjects: ProjectV2[];
};

export const AssetsManageEpisodeClient: React.FC<AssetsManageEpisodeClientProps> = ({
  project,
  episodes,
  assets,
  assetTasksMap = {},
  statuses = ["To Do", "In Progress", "Review", "Done"],
  allProjects,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"eps" | "asts">("eps");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tasksMap, setTasksMap] = useState<Record<string, AssetTaskV2[]>>(assetTasksMap);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasksMap(assetTasksMap);
  }, [assetTasksMap]);

  const handleSelectEpisode = (episodeId: string) => {
    router.push(`/assets/manage/${project.id}/episodes/${episodeId}`);
  };

  const handleAssetCreated = () => {
    router.refresh();
  };

  const handleTaskChange = async (
    taskId: string,
    updates: { assignee?: string | null; status?: string }
  ) => {
    const nextMap = { ...tasksMap };
    Object.keys(nextMap).forEach((assetId) => {
      nextMap[assetId] = nextMap[assetId].map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      );
    });
    setTasksMap(nextMap);

    try {
      await updateAssetTask(taskId, updates);
    } catch (err: unknown) {
      console.error("Failed to update asset task:", err);
      router.refresh();
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
      toolsPosition={{ x: 79, y: 62 }}
    >
      <div className="relative w-full h-full overflow-auto font-sans select-none">
        {/* Header block (99, 100) */}
        <div className="absolute left-[99px] top-[100px] flex flex-col gap-1">
          <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink-muted,#707070)] font-medium">
            {project.isSystem ? "★ System Project" : project.projectCode || "PROJECT"}
          </span>
          <h1 className="text-[var(--text-heading,28px)] font-bold text-[var(--color-ink,#000000)] tracking-tight">
            {project.title}
          </h1>
        </div>

        {/* Tabs & Rule section */}
        <div className="absolute left-[43px] top-[145px] w-[1353.5px]">
          <EpsAstsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content section (96, 258) */}
        <div className="absolute left-[96px] top-[258px] pb-16">
          {activeTab === "eps" ? (
            <EpisodeThumbGrid
              episodes={episodes}
              assets={assets}
              activeTab={activeTab}
              onSelectEpisode={handleSelectEpisode}
            />
          ) : (
            <AssetRowTable
              assets={assets}
              assetTasksMap={tasksMap}
              statuses={statuses}
              onTaskChange={handleTaskChange}
            />
          )}
        </div>
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
