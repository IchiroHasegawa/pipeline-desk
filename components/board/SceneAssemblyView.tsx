/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import BoardHeader from "@/components/shell/BoardHeader";
import BottomNav from "@/components/shell/BottomNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import BoardSpace from "@/components/board/BoardSpace";
import BoardToolbar, { BoardTool } from "@/components/board/BoardToolbar";
import {
  createElement,
  deleteElement,
  moveElements,
} from "@/app/actions/board";
import type {
  EpisodeV2,
  SceneV2,
  BoardElement,
  CreateElementInput,
} from "@/types/production-v2";

export type SceneAssemblyViewProps = {
  episode: EpisodeV2;
  scene: SceneV2;
  siblingScenes: SceneV2[];
  boardId: string;
  initialElements: BoardElement[];
  targetKeyframeId?: string | null;
};

export const SceneAssemblyView: React.FC<SceneAssemblyViewProps> = ({
  episode,
  scene,
  siblingScenes,
  boardId,
  initialElements,
  targetKeyframeId = null,
}) => {
  const router = useRouter();

  const [elements, setElements] = useState<BoardElement[]>(initialElements);
  const [activeTool, setActiveTool] = useState<BoardTool>("select");
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sort scenes so current scene is enlarged at top
  const sortedScenes = useCallback(() => {
    const current = siblingScenes.find((s) => s.id === scene.id);
    const others = siblingScenes.filter((s) => s.id !== scene.id);
    return current ? [current, ...others] : siblingScenes;
  }, [siblingScenes, scene.id])();

  const visibleScenes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedScenes;
    return sortedScenes.filter((s) => s.sceneName.toLowerCase().includes(q));
  }, [sortedScenes, searchQuery]);

  const visibleElements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return elements;
    return elements.filter((el) => {
      const textStr = ((el.title || "") + " " + (el.body || "") + " " + el.elementType).toLowerCase();
      return textStr.includes(q);
    });
  }, [elements, searchQuery]);

  // Create Element Handler
  const handleCreateElement = async (input: CreateElementInput) => {
    const newElement = await createElement(input);
    setElements((prev) => [...prev, newElement]);
    setActiveTool("select");
    return newElement;
  };

  // Delete Element Handler
  const handleDeleteElement = async (id: string) => {
    await deleteElement(id);
    setElements((prev) => prev.filter((el) => el.id !== id));
  };

  // Move Elements Handler
  const handleMoveElements = async (
    moves: Array<{ id: string; x: number; y: number; zIndex?: number }>
  ) => {
    await moveElements(moves);
  };

  // Add Keyframe File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          await handleCreateElement({
            boardId,
            elementType: "keyframe",
            x: 200 + i * 40,
            y: 200 + i * 40,
            imageUrl: dataUrl,
          });
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const toolActions: ToolAction[] = [
    {
      id: "hide",
      label: "HIDE",
      onSelect: () => setIsSidebarHidden((prev) => !prev),
    },
    {
      id: "add",
      label: "ADD",
      onSelect: () => fileInputRef.current?.click(),
    },
    {
      id: "sub",
      label: "SUB",
      onSelect: () => {
        // Selection delete handled via BoardSpace keyboard/context
      },
    },
  ];

  return (
    <>
      <CanvasShell
        nav={null}
        tools={<TransformTools actions={toolActions} />}
        toolsPosition={{ x: 100.9, y: 86.6 }}
      >
        {/* Hidden File Input for ADD keyframe button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
          <div className="shrink-0 pt-[38px] px-[100px] pb-4 z-30">
            <BoardHeader
              createLabel="Add Keyframes"
              onCreate={() => fileInputRef.current?.click()}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          <div className="relative flex-1 min-h-0 overflow-hidden">
            {/* Board fills the frame; the scenes list floats above it (DESIGN_SPEC §9) */}
            <div className="absolute inset-0">
              <BoardSpace
                boardId={boardId}
                elements={visibleElements}
                activeTool={activeTool}
                scope={{ type: "scene", sceneId: scene.id }}
                onToolSelect={setActiveTool}
                onElementsChange={setElements}
                onElementCreate={handleCreateElement}
                onElementDelete={handleDeleteElement}
                onElementMove={handleMoveElements}
                preSelectedId={targetKeyframeId}
              />
            </div>

            {/*
              Scenes list — DESIGN_SPEC §9.
              Heading (14.9, 190.6) 155 × 41; current scene thumb (14.9, 217.6)
              267 × 133; other thumbs x 15, y 375.6 + 124·n, 199 × 99.
            */}
            {!isSidebarHidden && (
              <aside
                aria-label="Scenes list"
                className="absolute left-0 top-0 w-[300px] h-full z-20 overflow-y-auto overflow-x-hidden pointer-events-none"
              >
                <h2 className="absolute left-[14.9px] top-[10px] w-[155px] h-[41px] flex items-center text-[var(--text-section,18px)] leading-none font-medium text-[var(--color-ink,#000000)]">
                  Scenes list
                </h2>

                {visibleScenes.map((s, idx) => {
                  const isCurrent = s.id === scene.id;
                  const left = isCurrent ? 14.9 : 15;
                  const top = isCurrent ? 50 : 208 + (idx - 1) * 124;
                  const width = isCurrent ? 267 : 199;
                  const height = isCurrent ? 133 : 99;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-current={isCurrent ? "true" : undefined}
                      onClick={() => {
                        if (!isCurrent) {
                          router.push(
                            `/projects/${episode.projectId}/episodes/${episode.id}/scenes/${s.id}/assembly`
                          );
                        }
                      }}
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                      }}
                      className={`absolute block overflow-hidden bg-[var(--color-placeholder,#d9d9d9)] transition-all pointer-events-auto outline-none ${
                        isCurrent
                          ? "border-2 border-[var(--color-ink,#000000)] cursor-default"
                          : "border border-[var(--color-line-soft,#a9a9a9)] opacity-80 hover:opacity-100 cursor-pointer"
                      }`}
                    >
                      {s.previewImage ? (
                        <img
                          src={s.previewImage}
                          alt={s.sceneName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center px-2 text-[var(--text-caption,11px)] text-[var(--color-ink-muted,#707070)] truncate">
                          {s.sceneName}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Absolutely positioned thumbs: establishes the scroll height. */}
                <div
                  aria-hidden="true"
                  style={{
                    height: `${375.6 + Math.max(0, visibleScenes.length - 1) * 124 + 24}px`,
                  }}
                />
              </aside>
            )}

            {/* Tools bar (840.9, 979.6) 235 × 59 */}
            <BoardToolbar
              activeTool={activeTool}
              onToolSelect={setActiveTool}
              position={{ x: 840.9, y: 979.6 }}
            />
          </div>
        </div>
      </CanvasShell>

      <BottomNav />
    </>
  );
};

export default SceneAssemblyView;
