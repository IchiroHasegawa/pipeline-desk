"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import {
  AppShell,
  type RailAction,
  type BreadcrumbItem,
  PlaceholderArt,
} from "@/components/app-shell";
import { AssetFormDialog } from "@/components/forms/AssetFormDialog";
import { projectAssetsHref } from "@/lib/routes/app";
import { formatBytes } from "@/lib/format/production";
import type { ProjectV2, AssetV2 } from "@/types/production-v2";

export interface AssetsPosterViewProps {
  projects: ProjectV2[];
  assetCounts?: Record<string, number>;
  assetFileBytes?: Record<string, number>;
}

export const AssetsPosterView: React.FC<AssetsPosterViewProps> = ({
  projects,
  assetCounts = {},
  assetFileBytes = {},
}) => {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  const breadcrumbs: BreadcrumbItem[] = [{ label: "Assets" }];

  const actions: RailAction[] = [
    {
      key: "create-asset",
      icon: Plus,
      label: "Create asset",
      onSelect: () => setIsCreateOpen(true),
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

  const handleAssetCreated = (newAsset: AssetV2) => {
    if (newAsset.projectId) {
      router.push(projectAssetsHref(newAsset.projectId, "assets"));
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <AppShell
        actions={actions}
        bottomAction={bottomAction}
        railLabel="Assets"
        breadcrumb={breadcrumbs}
        header={{
          title: "Assets",
          subtitle: `${projects.length} project${projects.length === 1 ? "" : "s"}`,
          right: searchOpen ? (
            <div className="flex h-[38px] w-[280px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
              <Search size={15} className="text-[var(--po-ink-3)]" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
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
          {visibleProjects.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <p className="text-[14px] text-[var(--po-ink-3)]">
                {searchQuery
                  ? `No projects found matching "${searchQuery}".`
                  : "No projects available."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6">
              {visibleProjects.map((project) => {
                const count = assetCounts[project.id] ?? 0;
                const bytes = assetFileBytes[project.id] ?? 0;

                const metaText =
                  bytes > 0
                    ? `${count} asset${count === 1 ? "" : "s"} · ${formatBytes(bytes)}`
                    : `${count} asset${count === 1 ? "" : "s"}`;

                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(projectAssetsHref(project.id))}
                    className="group flex flex-col gap-3 cursor-pointer"
                  >
                    {/* Poster Card: 3/4 aspect ratio */}
                    <div className="relative aspect-3/4 w-full overflow-hidden rounded-[20px] shadow-[var(--po-shadow-sm)] border border-[var(--po-line)] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[var(--po-shadow-lift)]">
                      <PlaceholderArt seed={project.id} className="absolute inset-0 h-full w-full object-cover" />
                      {project.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col gap-0.5 px-1">
                      <span className="text-[15px] font-semibold text-[var(--po-ink)] group-hover:text-[var(--po-accent)] transition-colors truncate">
                        {project.title}
                      </span>
                      <span className="text-[12px] text-[var(--po-ink-3)] truncate">
                        {project.projectCode} · {metaText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>

      {/* Create Asset Dialog */}
      <AssetFormDialog
        isOpen={isCreateOpen}
        projects={projects}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleAssetCreated}
      />
    </>
  );
};
