"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import BoardHeader from "@/components/shell/BoardHeader";
import BottomNav from "@/components/shell/BottomNav";
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
  AssignableUser,
} from "@/types/production-v2";

export type AssetsManageEpisodeClientProps = {
  project: ProjectV2;
  episodes: EpisodeV2[];
  assets: AssetV2[];
  assetTasksMap?: Record<string, AssetTaskV2[]>;
  statuses?: string[];
  allProjects: ProjectV2[];
  users?: AssignableUser[];
};

export const AssetsManageEpisodeClient: React.FC<AssetsManageEpisodeClientProps> = ({
  project,
  episodes,
  assets,
  assetTasksMap = {},
  statuses = ["To Do", "In Progress", "Review", "Done"],
  allProjects,
  users = [],
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"eps" | "asts">("eps");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasksMap, setTasksMap] = useState<Record<string, AssetTaskV2[]>>(assetTasksMap);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasksMap(assetTasksMap);
  }, [assetTasksMap]);

  const visibleEpisodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter(
      (e) =>
        e.episodeName.toLowerCase().includes(q) ||
        (e.code && e.code.toLowerCase().includes(q))
    );
  }, [episodes, searchQuery]);

  const visibleAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.assetCode && a.assetCode.toLowerCase().includes(q))
    );
  }, [assets, searchQuery]);

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
    <>
      <CanvasShell
        nav={null}
        tools={<TransformTools actions={toolActions} />}
        toolsPosition={{ x: 79, y: 62 }}
      >
        <div className="relative w-full h-full overflow-auto font-sans select-none flex flex-col">
          <div className="shrink-0 pt-[38px] px-[99px] pb-4">
            <BoardHeader
              createLabel="Create Assets"
              manageLabel="Manage Assets"
              onCreate={() => setIsAddOpen(true)}
              onManage={() => router.push("/assets/manage")}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          <div className="relative flex-1 min-h-0">
            {/* Header block (99, 100) -> preserving existing title block below header */}
            <div className="absolute left-[99px] top-[10px] flex flex-col gap-1">
              <span className="text-[var(--text-caption,11px)] font-mono text-[var(--color-ink-muted,#707070)] font-medium">
                {project.isSystem ? "★ System Project" : project.projectCode || "PROJECT"}
              </span>
              <h1 className="text-[var(--text-heading,28px)] font-bold text-[var(--color-ink,#000000)] tracking-tight">
                {project.title}
              </h1>
            </div>

            {/* Tabs & rule — EpsAstsTabs positions itself per DESIGN_SPEC §11 */}
            <EpsAstsTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Content section (96, 258) */}
            <div className="absolute left-[96px] top-[168px] pb-16">
              {activeTab === "eps" ? (
                <EpisodeThumbGrid
                  episodes={visibleEpisodes}
                  assets={visibleAssets}
                  activeTab={activeTab}
                  onSelectEpisode={handleSelectEpisode}
                />
              ) : (
                <AssetRowTable
                  assets={visibleAssets}
                  assetTasksMap={tasksMap}
                  statuses={statuses}
                  users={users}
                  onTaskChange={handleTaskChange}
                />
              )}
            </div>
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

      <BottomNav />
    </>
  );
};

export default AssetsManageEpisodeClient;
