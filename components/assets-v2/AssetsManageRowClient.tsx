/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import AssetRowTable from "@/components/assets-v2/AssetRowTable";
import AssetFormDialog from "@/components/assets-v2/AssetFormDialog";
import { updateAssetTask } from "@/app/actions/production";
import type {
  ProjectV2,
  EpisodeV2,
  AssetV2,
  AssetTaskV2,
} from "@/types/production-v2";

export type AssetsManageRowClientProps = {
  project: ProjectV2;
  episode: EpisodeV2;
  assets: AssetV2[];
  assetTasksMap: Record<string, AssetTaskV2[]>;
  statuses: string[];
  allProjects: ProjectV2[];
};

export const AssetsManageRowClient: React.FC<AssetsManageRowClientProps> = ({
  project,
  episode,
  assets,
  assetTasksMap,
  statuses,
  allProjects,
}) => {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tasksMap, setTasksMap] = useState<Record<string, AssetTaskV2[]>>(assetTasksMap);

  const handleTaskChange = async (
    taskId: string,
    updates: { assignee?: string | null; status?: string }
  ) => {
    // Optimistic UI state update
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
      toolsPosition={{ x: 505, y: 28 }}
    >
      <div className="w-full h-full overflow-auto p-8 flex flex-col gap-6 font-sans">
        {/* Header Block */}
        <div className="flex flex-row items-center gap-6">
          <div className="w-[131px] h-[200px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] overflow-hidden shrink-0">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center font-mono text-[var(--color-ink-muted,#707070)] text-[10px] text-center p-2">
                <span>[PROJECT]</span>
                <span className="opacity-75">{project.projectCode}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink-muted,#707070)]">
              {project.title}
            </span>
            <h1 className="text-[var(--text-heading,28px)] font-bold text-[var(--color-ink,#000000)]">
              {episode.code || episode.episodeName}
            </h1>
            <h2 className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink-muted,#707070)]">
              {episode.episodeName}
            </h2>
          </div>
        </div>

        {/* 4-Column Table */}
        <div className="pt-2">
          <AssetRowTable
            assets={assets}
            assetTasksMap={tasksMap}
            statuses={statuses}
            onTaskChange={handleTaskChange}
          />
        </div>
      </div>

      <AssetFormDialog
        isOpen={isAddOpen}
        projects={allProjects}
        defaultProjectId={project.id}
        defaultEpisodeId={episode.id}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </CanvasShell>
  );
};

export default AssetsManageRowClient;
