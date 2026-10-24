/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import NextLink from "next/link";
import {
  ChevronLeft,
  GripVertical,
  Film,
  Box,
} from "lucide-react";
import { PlaceholderArt } from "@/components/app-shell";
import { sceneAssemblyHref } from "@/lib/routes/app";
import { assetPreviewSrc } from "@/lib/format/assets";
import type { SceneV2, AssetV2 } from "@/types/production-v2";

export interface AssemblySidePanelProps {
  currentScene: SceneV2;
  siblingScenes: SceneV2[];
  episodeAssets: AssetV2[];
  projectAssets: AssetV2[];
  projectId: string;
  episodeId: string;
  searchQuery?: string;
  onAddAsset?: (asset: AssetV2) => void;
  onClose?: () => void;
}

export const AssemblySidePanel: React.FC<AssemblySidePanelProps> = ({
  currentScene,
  siblingScenes,
  episodeAssets,
  projectAssets,
  projectId,
  episodeId,
  searchQuery = "",
  onAddAsset,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"scenes" | "assets">("scenes");

  const q = searchQuery.trim().toLowerCase();

  // Filter scenes
  const filteredSiblings = useMemo(() => {
    const others = siblingScenes.filter((s) => s.id !== currentScene.id);
    if (!q) return others;
    return others.filter((s) => s.sceneName.toLowerCase().includes(q));
  }, [siblingScenes, currentScene.id, q]);

  const isCurrentVisible = useMemo(() => {
    if (!q) return true;
    return currentScene.sceneName.toLowerCase().includes(q);
  }, [currentScene.sceneName, q]);

  // Filter assets
  const filteredEpisodeAssets = useMemo(() => {
    if (!q) return episodeAssets;
    return episodeAssets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.assetCode && a.assetCode.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q))
    );
  }, [episodeAssets, q]);

  const filteredProjectAssets = useMemo(() => {
    if (!q) return projectAssets;
    return projectAssets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.assetCode && a.assetCode.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q))
    );
  }, [projectAssets, q]);

  const handleAssetDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    asset: AssetV2
  ) => {
    const payload = JSON.stringify({
      assetId: asset.id,
      name: asset.name,
      previewUrl: assetPreviewSrc(asset),
    });
    e.dataTransfer.setData("application/x-production-asset", payload);
    e.dataTransfer.setData("text/plain", asset.name);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside
      aria-label="Scene Assembly Sidebar"
      className="relative flex h-full w-full flex-col overflow-hidden bg-[var(--po-card)] text-[var(--po-ink)] select-none"
      style={{
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      }}
    >
      {/* Panel Top Header: Tabs and Collapse button */}
      <div className="flex flex-col gap-3 border-b border-[var(--po-line)] p-3">
        <div className="flex items-center justify-between">
          {/* Segmented Control Tabs */}
          <div className="flex h-[32px] rounded-full bg-[var(--po-sunken)] p-0.5 text-[12px] font-medium text-[var(--po-ink-2)]">
            <button
              type="button"
              onClick={() => setActiveTab("scenes")}
              className={`flex items-center gap-1.5 rounded-full px-3 transition-colors ${
                activeTab === "scenes"
                  ? "bg-[var(--po-card)] font-semibold text-[var(--po-ink)] shadow-xs"
                  : "hover:text-[var(--po-ink)]"
              }`}
            >
              <Film size={13} />
              <span>Scenes</span>
              <span className="text-[11px] opacity-70">
                {siblingScenes.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("assets")}
              className={`flex items-center gap-1.5 rounded-full px-3 transition-colors ${
                activeTab === "assets"
                  ? "bg-[var(--po-card)] font-semibold text-[var(--po-ink)] shadow-xs"
                  : "hover:text-[var(--po-ink)]"
              }`}
            >
              <Box size={13} />
              <span>Assets</span>
              <span className="text-[11px] opacity-70">
                {episodeAssets.length + projectAssets.length}
              </span>
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Hide sidebar"
              aria-label="Hide sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--po-ink-2)] transition-colors hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)]"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {activeTab === "assets" && (
          <p className="m-0 text-[11px] text-[var(--po-ink-2)]">
            Drag onto the board to reference
          </p>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "scenes" && (
          <div className="flex flex-col gap-4">
            {/* Current Scene Card */}
            {isCurrentVisible && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--po-ink-2)]">
                  <span>Current Scene</span>
                  <span className="rounded-full bg-[var(--po-accent)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--po-accent)]">
                    Active
                  </span>
                </div>
                <div className="group relative flex flex-col overflow-hidden rounded-[14px] border-2 border-[var(--po-accent)] bg-[var(--po-sunken)] shadow-xs">
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[var(--po-chip)]">
                    {currentScene.previewImage ? (
                      <img
                        src={currentScene.previewImage}
                        alt={currentScene.sceneName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PlaceholderArt seed={currentScene.id} className="h-full w-full object-cover" />
                    )}
                  </div>
                  {/* Details */}
                  <div className="flex flex-col p-2.5">
                    <span className="truncate text-[13px] font-semibold text-[var(--po-ink)]">
                      {currentScene.sceneName}
                    </span>
                    <span className="text-[11px] text-[var(--po-ink-2)]">
                      {currentScene.numberOfFrames ?? 0} frames
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sibling Scenes */}
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--po-ink-2)]">
                Other Scenes ({filteredSiblings.length})
              </div>

              {filteredSiblings.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-[var(--po-ink-2)]">
                  {q ? "No matching scenes" : "No other scenes in this episode"}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredSiblings.map((s) => (
                    <NextLink
                      key={s.id}
                      href={sceneAssemblyHref(projectId, episodeId, s.id)}
                      className="group flex items-center gap-3 rounded-[12px] border border-[var(--po-line)] bg-[var(--po-card)] p-2 transition-all hover:border-[var(--po-accent)] hover:bg-[var(--po-chip)]"
                    >
                      <div className="relative h-[48px] w-[72px] flex-none overflow-hidden rounded-[8px] bg-[var(--po-chip)]">
                        {s.previewImage ? (
                          <img
                            src={s.previewImage}
                            alt={s.sceneName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PlaceholderArt seed={s.id} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] font-medium text-[var(--po-ink)] group-hover:text-[var(--po-accent)]">
                          {s.sceneName}
                        </span>
                        <span className="text-[11px] text-[var(--po-ink-2)]">
                          {s.numberOfFrames ?? 0} frames
                        </span>
                      </div>
                    </NextLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "assets" && (
          <div className="flex flex-col gap-5">
            {/* Section 1: This Episode */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--po-ink-2)]">
                <span>This Episode</span>
                <span className="rounded-full bg-[var(--po-chip)] px-1.5 py-0.2 text-[10px] text-[var(--po-ink-2)]">
                  {filteredEpisodeAssets.length}
                </span>
              </div>

              {filteredEpisodeAssets.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[var(--po-line-2)] p-4 text-center text-[12px] text-[var(--po-ink-2)]">
                  {q ? "No matching assets" : "No episode assets"}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredEpisodeAssets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable={true}
                      onDragStart={(e) => handleAssetDragStart(e, asset)}
                      onDoubleClick={() => onAddAsset?.(asset)}
                      className="group flex cursor-grab items-center gap-2.5 rounded-[10px] border border-[var(--po-line)] bg-[var(--po-card)] p-2 transition-all hover:border-[var(--po-accent)] hover:bg-[var(--po-chip)] active:cursor-grabbing"
                    >
                      <GripVertical
                        size={14}
                        className="text-[var(--po-ink-2)] opacity-40 group-hover:opacity-100"
                      />
                      <div className="relative h-9 w-9 flex-none overflow-hidden rounded-[7px] bg-[var(--po-chip)]">
                        {(() => {
                          const src = assetPreviewSrc(asset);
                          return src ? (
                            <img
                              src={src}
                              alt={asset.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PlaceholderArt seed={asset.id} className="h-full w-full object-cover" />
                          );
                        })()}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[12px] font-medium text-[var(--po-ink)]">
                          {asset.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--po-ink-2)]">
                          {asset.category && (
                            <span className="capitalize">{asset.category}</span>
                          )}
                          {asset.assetCode && (
                            <span>• {asset.assetCode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Project Assets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--po-ink-2)]">
                <span>Project</span>
                <span className="rounded-full bg-[var(--po-chip)] px-1.5 py-0.2 text-[10px] text-[var(--po-ink-2)]">
                  {filteredProjectAssets.length}
                </span>
              </div>

              {filteredProjectAssets.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[var(--po-line-2)] p-4 text-center text-[12px] text-[var(--po-ink-2)]">
                  {q ? "No matching assets" : "No project assets"}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredProjectAssets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable={true}
                      onDragStart={(e) => handleAssetDragStart(e, asset)}
                      onDoubleClick={() => onAddAsset?.(asset)}
                      className="group flex cursor-grab items-center gap-2.5 rounded-[10px] border border-[var(--po-line)] bg-[var(--po-card)] p-2 transition-all hover:border-[var(--po-accent)] hover:bg-[var(--po-chip)] active:cursor-grabbing"
                    >
                      <GripVertical
                        size={14}
                        className="text-[var(--po-ink-2)] opacity-40 group-hover:opacity-100"
                      />
                      <div className="relative h-9 w-9 flex-none overflow-hidden rounded-[7px] bg-[var(--po-chip)]">
                        {(() => {
                          const src = assetPreviewSrc(asset);
                          return src ? (
                            <img
                              src={src}
                              alt={asset.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PlaceholderArt seed={asset.id} className="h-full w-full object-cover" />
                          );
                        })()}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[12px] font-medium text-[var(--po-ink)]">
                          {asset.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--po-ink-2)]">
                          {asset.category && (
                            <span className="capitalize">{asset.category}</span>
                          )}
                          {asset.assetCode && (
                            <span>• {asset.assetCode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
