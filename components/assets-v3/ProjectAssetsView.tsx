"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Search, X, Clapperboard, PanelRight } from "lucide-react";
import {
  AppShell,
  type RailAction,
  type BreadcrumbItem,
} from "@/components/app-shell";
import { AssetTable } from "./AssetTable";
import { AssetDetailPanel } from "./AssetDetailPanel";
import { DeleteAssetDialog } from "./DeleteAssetDialog";
import { AssetFormDialog } from "@/components/forms/AssetFormDialog";
import {
  assetsHref,
  projectAssetsHref,
  episodeAssetsHref,
} from "@/lib/routes/app";
import type {
  ProjectV2,
  EpisodeV2,
  AssetV2,
  AssetBoardTask,
  TaskStatusOption,
  AssignableUser,
} from "@/types/production-v2";

export interface ProjectAssetsViewProps {
  project: ProjectV2;
  episodes: EpisodeV2[];
  assets: AssetV2[];
  assetCountsByEpisode: Record<string, number>;
  tasksByAssetId: Record<string, AssetBoardTask[]>;
  fileStatsByAssetId: Record<string, { fileCount: number; totalBytes: number }>;
  workflowOptions: Record<string, TaskStatusOption[]>;
  assignableUsers: AssignableUser[];
  allProjects: ProjectV2[];
  assetWorkflows?: Array<{ id: string; name: string }>;
  initialTab?: "episodes" | "assets";
}

export const ProjectAssetsView: React.FC<ProjectAssetsViewProps> = ({
  project,
  episodes,
  assets: initialAssets,
  assetCountsByEpisode,
  tasksByAssetId: initialTasksMap,
  fileStatsByAssetId,
  workflowOptions,
  assignableUsers,
  allProjects,
  assetWorkflows = [],
  initialTab = "episodes",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state synced with URL ?tab
  const currentTab = (searchParams.get("tab") as "episodes" | "assets") || initialTab;

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
    { label: project.title },
  ];

  const handleTabChange = (tab: "episodes" | "assets") => {
    setSelectedAssetId(null);
    router.replace(projectAssetsHref(project.id, tab));
  };

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

  // Filter episodes by query if on episodes tab
  const visibleEpisodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return episodes;
    return episodes.filter(
      (e) =>
        e.episodeName.toLowerCase().includes(q) ||
        (e.code || "").toLowerCase().includes(q)
    );
  }, [episodes, searchQuery]);

  return (
    <>
      <AppShell
        actions={actions}
        bottomAction={bottomAction}
        railLabel="Assets"
        breadcrumb={breadcrumbs}
        header={{
          title: project.title,
          subtitle: `${project.projectCode} · ${assets.length} assets`,
          right: (
            <div className="flex items-center gap-3">
              {/* Episodes / Assets Pill Switcher */}
              <div className="flex items-center rounded-full border border-[var(--po-line)] bg-[var(--po-sunken)] p-1 text-[13px] font-medium">
                <button
                  type="button"
                  onClick={() => handleTabChange("episodes")}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 transition-all ${
                    currentTab === "episodes"
                      ? "bg-[var(--po-card)] text-[var(--po-ink)] shadow-[var(--po-shadow-sm)] font-semibold"
                      : "text-[var(--po-ink-2)] hover:text-[var(--po-ink)]"
                  }`}
                >
                  <span>Episodes</span>
                  <span className="rounded-full bg-[var(--po-chip)] px-1.5 py-0.2 text-[11px] font-semibold text-[var(--po-ink-3)]">
                    {episodes.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("assets")}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 transition-all ${
                    currentTab === "assets"
                      ? "bg-[var(--po-card)] text-[var(--po-ink)] shadow-[var(--po-shadow-sm)] font-semibold"
                      : "text-[var(--po-ink-2)] hover:text-[var(--po-ink)]"
                  }`}
                >
                  <span>Assets</span>
                  <span className="rounded-full bg-[var(--po-chip)] px-1.5 py-0.2 text-[11px] font-semibold text-[var(--po-ink-3)]">
                    {assets.length}
                  </span>
                </button>
              </div>

              {/* Search Field */}
              {searchOpen && (
                <div className="flex h-[38px] w-[260px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
                  <Search size={15} className="text-[var(--po-ink-3)]" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      currentTab === "episodes"
                        ? "Search episodes..."
                        : "Search assets..."
                    }
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
              )}
            </div>
          ),
        }}
      >
        <div className="h-full w-full overflow-y-auto px-9 py-6">
          {currentTab === "episodes" ? (
            /* Episodes Thumbnail Grid */
            visibleEpisodes.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <p className="text-[14px] text-[var(--po-ink-3)]">
                  {searchQuery
                    ? `No episodes match "${searchQuery}".`
                    : "No episodes in this project yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4.5">
                {visibleEpisodes.map((ep) => {
                  const count = assetCountsByEpisode[ep.id] ?? 0;
                  return (
                    <div
                      key={ep.id}
                      onClick={() =>
                        router.push(episodeAssetsHref(project.id, ep.id))
                      }
                      className="group flex flex-col gap-2.5 rounded-[18px] border border-[var(--po-line)] bg-[var(--po-card)] p-2 cursor-pointer shadow-[var(--po-shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--po-shadow-lift)]"
                    >
                      {/* 16:9 Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden rounded-[12px] bg-gradient-to-br from-[var(--po-ph1)] to-[var(--po-ph2)] border border-[var(--po-line)] flex items-center justify-center">
                        <Clapperboard
                          size={28}
                          className="text-[var(--po-ink-3)] opacity-40 group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Episode Title & Asset Count */}
                      <div className="flex items-center justify-between px-1.5 pb-1">
                        <span className="text-[14px] font-semibold text-[var(--po-ink)] group-hover:text-[var(--po-accent)] transition-colors truncate">
                          {ep.episodeName}
                        </span>
                        <span className="text-[12px] font-medium text-[var(--po-ink-3)] shrink-0">
                          {count} asset{count === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Assets Table */
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
          )}
        </div>
      </AppShell>

      {/* Asset Detail Slide-over Panel */}
      <AssetDetailPanel
        asset={detailAsset}
        tasks={detailAsset ? tasksMap[detailAsset.id] || [] : []}
        fileStats={detailAsset ? fileStatsByAssetId[detailAsset.id] : undefined}
        workflowOptions={workflowOptions}
        assignableUsers={assignableUsers}
        scopeLabel={project.title}
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
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleAssetCreated}
      />
    </>
  );
};
