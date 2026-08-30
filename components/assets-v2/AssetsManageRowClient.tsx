/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import BottomNav from "@/components/shell/BottomNav";
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
    <>
      <CanvasShell
        nav={null}
        tools={<TransformTools actions={toolActions} />}
        toolsPosition={{ x: 505, y: 28 }}
      >
        <div className="relative w-full h-full overflow-auto font-sans">
          {/* Project thumbnail (31, 29) 131 × 200 — DESIGN_SPEC §12 */}
          <div className="absolute left-[31px] top-[29px] w-[131px] h-[200px] bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line,#000000)] rounded-[var(--radius-sm,3px)] overflow-hidden">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-ink-muted,#707070)] text-[10px] text-center p-2">
                <span>[PROJECT]</span>
                <span className="opacity-75">{project.projectCode}</span>
              </div>
            )}
          </div>

          {/* Project Title (191, 129) 184 × 38 */}
          <h1 className="absolute left-[191px] top-[129px] w-[184px] h-[38px] flex items-center text-[var(--text-heading,24px)] leading-none font-bold text-[var(--color-ink,#000000)] truncate">
            {project.title}
          </h1>

          {/* Episode Title (191, 212) 184 × 38 */}
          <h2 className="absolute left-[191px] top-[212px] w-[184px] h-[38px] flex items-center text-[var(--text-section,18px)] leading-none font-medium text-[var(--color-ink-muted,#707070)] truncate">
            {episode.code || episode.episodeName}
          </h2>

          <AssetRowTable
            assets={assets}
            assetTasksMap={tasksMap}
            statuses={statuses}
            onTaskChange={handleTaskChange}
          />
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

      <BottomNav />
    </>
  );
};

export default AssetsManageRowClient;
