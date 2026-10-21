"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Film } from "lucide-react";
import type { SceneV2 } from "@/types/production-v2";
import { episodeScenesHref } from "@/lib/routes/app";

export interface SceneTileRowProps {
  projectId: string;
  episodeId: string;
  scenes: SceneV2[];
  sceneRollup: Record<string, { total: number; complete: number }>;
}

export const SceneTileRow: React.FC<SceneTileRowProps> = ({
  projectId,
  episodeId,
  scenes,
  sceneRollup,
}) => {
  const router = useRouter();

  if (scenes.length === 0) {
    return (
      <div className="mt-auto grid grid-cols-5 gap-[10px]">
        <div className="col-span-5 flex aspect-[9.2/1] items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-[var(--po-line-2)] text-[13px] text-[var(--po-ink-3)]">
          <Film size={16} />
          <span>No scenes yet</span>
        </div>
      </div>
    );
  }

  const hasMore = scenes.length > 5;
  const displayScenes = hasMore ? scenes.slice(0, 4) : scenes.slice(0, 5);
  const moreCount = scenes.length - 4;

  const handleSceneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(episodeScenesHref(projectId, episodeId));
  };

  return (
    <div className="mt-auto grid grid-cols-5 gap-[10px]">
      {displayScenes.map((scene) => {
        const rollup = sceneRollup[scene.id] ?? { total: 0, complete: 0 };
        const pct =
          rollup.total > 0
            ? Math.max(0, Math.min(100, Math.round((rollup.complete / rollup.total) * 100)))
            : 0;

        const sceneInitials =
          scene.sceneName
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 2)
            .toUpperCase() || "SC";

        return (
          <div
            key={scene.id}
            role="button"
            tabIndex={0}
            onClick={handleSceneClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSceneClick(e as unknown as React.MouseEvent);
              }
            }}
            className="group relative aspect-video cursor-pointer overflow-hidden rounded-[12px] border border-[var(--po-line)] bg-[var(--po-sunken)] transition-transform duration-150 hover:scale-[1.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
            style={{
              background: scene.previewImage
                ? undefined
                : "linear-gradient(145deg, var(--po-ph1), var(--po-ph2))",
            }}
          >
            {scene.previewImage ? (
              <img
                src={scene.previewImage}
                alt={scene.sceneName}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-x-0 top-3 flex items-center justify-center text-[18px] font-semibold tracking-[-0.02em] text-[var(--po-ink-3)] opacity-60 select-none">
                {sceneInitials}
              </div>
            )}

            {/* Dark gradient overlay at bottom for readability */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-35% to-black/60" />

            {/* Scene name and task progress bar */}
            <div className="pointer-events-none absolute inset-x-[10px] bottom-[9px] flex flex-col gap-[6px]">
              <span className="truncate text-[12px] font-semibold tracking-[0.02em] text-white">
                {scene.sceneName}
              </span>
              <div className="flex h-[3px] overflow-hidden rounded-[2px] bg-white/30">
                <div
                  className="h-full bg-[var(--po-accent)] transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleSceneClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSceneClick(e as unknown as React.MouseEvent);
            }
          }}
          className="flex aspect-video cursor-pointer items-center justify-center gap-[6px] rounded-[12px] border border-[var(--po-line)] bg-[var(--po-sunken)] text-[13px] font-medium text-[var(--po-ink-2)] transition-transform duration-150 hover:scale-[1.025] hover:bg-[var(--po-chip)] hover:text-[var(--po-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
        >
          <span>+{moreCount} more</span>
          <ArrowRight size={13} />
        </div>
      )}
    </div>
  );
};
