"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, X, PanelRight } from "lucide-react";
import {
  AppShell,
  type RailAction,
  type BreadcrumbItem,
} from "@/components/app-shell";
import { AssetTable } from "./AssetTable";
import { AssetDetailPanel } from "./AssetDetailPanel";
import { DeleteAssetDialog } from "./DeleteAssetDialog";
import { AssetFormDialog } from "@/components/assets-v2/AssetFormDialog";
import { assetsHref, projectAssetsHref } from "@/lib/routes/app";
import type {
  ProjectV2,
  EpisodeV2,
  AssetV2,
  AssetBoardTask,
  TaskStatusOption,
  AssignableUser,
} from "@/types/production-v2";

export interface EpisodeAssetsViewProps {
  project: ProjectV2;
  episode: EpisodeV2;
  assets: AssetV2[];
  tasksByAssetId: Record<string, AssetBoardTask[]>;
  fileStatsByAssetId: Record<string, { fileCount: number; totalBytes: number }>;
  workflowOptions: Record<string, TaskStatusOption[]>;
  assignableUsers: AssignableUser[];
  allProjects: ProjectV2[];
  assetWorkflows?: Array<{ id: string; name: string }>;
}

export const EpisodeAssetsView: React.FC<EpisodeAssetsViewProps> = ({
  project,
  episode,
  assets: initialAssets,
  tasksByAssetId: initialTasksMap,
  fileStatsByAssetId,
  workflowOptions,
  assignableUsers,
  allProjects,
  assetWorkflows = [],
}) => {
  const router = useRouter();
  const [assets, setAssets] = useState<AssetV2[]>(initialAssets);
  const [tasksMap, setTasksMap] = useState<Record<string, AssetBoardTask[]>>(initialTasksMap);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [detailAsset, setDetailAsset] = useState<AssetV2 | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedAssetId) || null,
    [assets, selectedAssetId]
  );

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Assets", href: assetsHref() },
    {
      label: project.title,
      href: projectAssetsHref(project.id, "episodes"),
    },
    { label: episode.episodeName },
  ];

  const handleAssetCreated = (newAsset: AssetV2) => {
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAssetId(newAsset.id);
    router.refresh();
  };

  const handleAssetDeleted = () => {
    if (selectedAssetId) {
      setAssets((prev) => prev.filter((a) => a.id !== selectedAssetId));
      if (detailAsset?.id === selectedAssetId) {
        setDetailAsset(null);
      }
      setSelectedAssetId(null);
    }
  };

  const actions: RailAction[] = [
    {
      key: "create-asset",
      icon: Plus,
      label: "Create asset",
      onSelect: () => setIsCreateOpen(true),
    },
    {
      key: "detail-asset",
      icon: PanelRight,
      label: "Asset details",
      disabled: !selectedAsset,
      hint: selectedAsset ? undefined : "Select an asset first",
      onSelect: () => {
        if (selectedAsset) setDetailAsset(selectedAsset);
      },
    },
    {
      key: "delete-asset",
      icon: Trash2,
      label: "Delete asset",
      disabled: !selectedAsset,
      hint: selectedAsset ? undefined : "Select an asset first",
      onSelect: () => {
        if (selectedAsset) setIsDeleteOpen(true);
      },
    },
  ];

  const bottomAction: RailAction = {
    key: "search",
    icon: Search,
    label: "Search assets",
    active: searchOpen,
    onSelect: () => {
      setSearchOpen((prev) => {
        if (prev) setSearchQuery("");
        return !prev;
      });
    },
  };

  return (
    <>
      <AppShell
        actions={actions}
        bottomAction={bottomAction}
        railLabel="Assets"
        breadcrumb={breadcrumbs}
        header={{
          title: episode.episodeName,
          subtitle: `${project.title} · ${assets.length} assets`,
          right: searchOpen ? (
            <div className="flex h-[38px] w-[280px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
              <Search size={15} className="text-[var(--po-ink-3)]" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="flex-1 min-w-0 border-none bg-transparent text-[13px] text-[var(--po-ink)] outline-none placeholder:text-[var(--po-ink-3)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[var(--po-ink-3)] hover:text-[var(--po-ink)]"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ) : undefined,
        }}
      >
        <div className="h-full w-full overflow-y-auto px-9 py-6">
          <AssetTable
            assets={assets}
            tasksByAssetId={tasksMap}
            workflowOptions={workflowOptions}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(id) =>
              setSelectedAssetId((prev) => (prev === id ? null : id))
            }
            onOpenDetail={(asset) => setDetailAsset(asset)}
            searchQuery={searchQuery}
          />
        </div>
      </AppShell>

      {/* Asset Detail Slide-over Panel */}
      <AssetDetailPanel
        asset={detailAsset}
        tasks={detailAsset ? tasksMap[detailAsset.id] || [] : []}
        fileStats={detailAsset ? fileStatsByAssetId[detailAsset.id] : undefined}
        workflowOptions={workflowOptions}
        assignableUsers={assignableUsers}
        scopeLabel={`${project.title} · ${episode.episodeName}`}
        onClose={() => setDetailAsset(null)}
        onTaskUpdated={(updatedTask) => {
          setTasksMap((prev) => ({
            ...prev,
            [updatedTask.assetId]: (prev[updatedTask.assetId] || []).map((t) =>
              t.id === updatedTask.id ? updatedTask : t
            ),
          }));
        }}
      />

      {/* Delete Asset Dialog */}
      <DeleteAssetDialog
        isOpen={isDeleteOpen}
        asset={selectedAsset}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={handleAssetDeleted}
      />

      {/* Create Asset Dialog */}
      <AssetFormDialog
        isOpen={isCreateOpen}
        projects={allProjects}
        assetWorkflows={assetWorkflows}
        defaultProjectId={project.id}
        defaultEpisodeId={episode.id}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleAssetCreated}
      />
    </>
  );
};
