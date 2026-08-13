/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sort scenes so current scene is enlarged at top
  const sortedScenes = useCallback(() => {
    const current = siblingScenes.find((s) => s.id === scene.id);
    const others = siblingScenes.filter((s) => s.id !== scene.id);
    return current ? [current, ...others] : siblingScenes;
  }, [siblingScenes, scene.id])();

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
    <CanvasShell
      nav={<VerticalNav active="project" />}
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

      <div className="relative w-full h-full flex flex-row overflow-hidden select-none">
        {/* Left Scenes List Sidebar */}
        {!isSidebarHidden && (
          <aside className="w-[300px] h-full border-r border-[var(--color-line,#000000)] bg-[var(--color-canvas,#ffffff)] flex flex-col p-4 z-20 shadow-xs">
            <h2 className="text-[var(--text-section,18px)] font-medium text-[var(--color-ink,#000000)] mb-3">
              Scenes list
            </h2>

            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
              {sortedScenes.map((s) => {
                const isCurrent = s.id === scene.id;
                const width = isCurrent ? "267px" : "199px";
                const height = isCurrent ? "133px" : "99px";

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (!isCurrent) {
                        router.push(
                          `/projects/${episode.projectId}/episodes/${episode.id}/scenes/${s.id}/assembly`
                        );
                      }
                    }}
                    className={`flex flex-col gap-1.5 p-2 rounded-[var(--radius-sm,3px)] cursor-pointer transition-all ${
                      isCurrent
                        ? "border-2 border-black bg-[var(--color-selection,#d9d9d9)] shadow-sm"
                        : "border border-[var(--color-line-soft,#a9a9a9)] hover:bg-[var(--color-panel,#f0f0f0)]"
                    }`}
                  >
                    <div
                      style={{ width, height }}
                      className="bg-[var(--color-placeholder,#d9d9d9)] border border-[var(--color-line-soft,#a9a9a9)] rounded-[var(--radius-xs,1px)] overflow-hidden flex items-center justify-center"
                    >
                      {s.previewImage ? (
                        <img
                          src={s.previewImage}
                          alt={s.sceneName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted,#707070)]">
                          [SCENE THUMB]
                        </span>
                      )}
                    </div>
                    <span className="text-[var(--text-list,12px)] font-medium text-[var(--color-ink,#000000)] truncate max-w-[250px]">
                      {s.sceneName}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Board Canvas Area */}
        <main className="flex-1 h-full relative">
          <BoardSpace
            boardId={boardId}
            elements={elements}
            activeTool={activeTool}
            scope={{ type: "scene", sceneId: scene.id }}
            onToolSelect={setActiveTool}
            onElementsChange={setElements}
            onElementCreate={handleCreateElement}
            onElementDelete={handleDeleteElement}
            onElementMove={handleMoveElements}
            preSelectedId={targetKeyframeId}
          />

          {/* Bottom Centre Floating Toolbar */}
          <BoardToolbar activeTool={activeTool} onToolSelect={setActiveTool} />
        </main>
      </div>
    </CanvasShell>
  );
};

export default SceneAssemblyView;
