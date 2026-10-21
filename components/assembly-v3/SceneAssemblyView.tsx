"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  AppShell,
  type RailAction,
  type BreadcrumbItem,
  ConfirmDialog,
} from "@/components/app-shell";
import {
  BoardCanvas,
  type BoardCanvasHandle,
} from "@/components/board-v3/BoardCanvas";
import {
  BoardToolbar,
  type BoardTool,
} from "@/components/board-v3/BoardToolbar";
import { AssemblySidePanel } from "@/components/assembly-v3/AssemblySidePanel";
import {
  createElement,
  deleteElement,
  moveElements,
} from "@/app/actions/board";
import type {
  ProjectV2,
  EpisodeV2,
  SceneV2,
  AssetV2,
  BoardElement,
  CreateElementInput,
} from "@/types/production-v2";

export interface SceneAssemblyViewProps {
  project: ProjectV2;
  episode: EpisodeV2;
  scene: SceneV2;
  siblingScenes: SceneV2[];
  episodeAssets: AssetV2[];
  projectAssets: AssetV2[];
  boardId: string;
  initialElements: BoardElement[];
  targetKeyframeId?: string | null;
}

export const SceneAssemblyView: React.FC<SceneAssemblyViewProps> = ({
  project,
  episode,
  scene,
  siblingScenes,
  episodeAssets,
  projectAssets,
  boardId,
  initialElements,
  targetKeyframeId = null,
}) => {
  const [elements, setElements] = useState<BoardElement[]>(initialElements);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<BoardTool>("select");
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Folder delete confirmation state
  const [confirmState, setConfirmState] = useState<{
    message: string;
    resolve: (val: boolean) => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<BoardCanvasHandle>(null);

  // Filter elements by search query
  const visibleElements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return elements;
    return elements.filter((el) => {
      const textStr = (
        (el.title || "") +
        " " +
        (el.body || "") +
        " " +
        el.elementType
      ).toLowerCase();
      return textStr.includes(q);
    });
  }, [elements, searchQuery]);

  // Counts for summary badge
  const counts = useMemo(() => {
    let keyframes = 0;
    let assets = 0;
    let folders = 0;
    let comments = 0;

    for (const el of elements) {
      if (el.elementType === "keyframe") keyframes++;
      else if (el.elementType === "asset") assets++;
      else if (el.elementType === "folder") folders++;
      else if (el.elementType === "comment") comments++;
    }

    return { keyframes, assets, folders, comments };
  }, [elements]);

  // Create Element Handler
  const handleCreateElement = async (input: CreateElementInput) => {
    try {
      const newElement = await createElement(input);
      setElements((prev) => [...prev, newElement]);
      setActiveTool("select");
      return newElement;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      throw err;
    }
  };

  // Delete Element Handler
  const handleDeleteElement = async (id: string) => {
    try {
      await deleteElement(id);
      setElements((prev) => prev.filter((el) => el.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  // Move Elements Handler
  const handleMoveElements = async (
    moves: Array<{ id: string; x: number; y: number; zIndex?: number }>
  ) => {
    try {
      await moveElements(moves);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  // Folder delete confirmation handler passed to BoardCanvas
  const handleConfirmDelete = useCallback((message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        message,
        resolve,
      });
    });
  }, []);

  // Add Keyframes from file picker
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
          try {
            await handleCreateElement({
              boardId,
              elementType: "keyframe",
              x: 200 + i * 40,
              y: 200 + i * 40,
              imageUrl: dataUrl,
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMessage(msg);
          }
        }
      };
      reader.readAsDataURL(files[i]);
    }

    // Reset input so re-uploading same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Projects", href: "/projects-next" },
    {
      label: project.title,
      href: `/projects-next/${project.id}/episodes`,
    },
    {
      label: episode.episodeName,
      href: `/projects-next/${project.id}/episodes/${episode.id}/scenes`,
    },
    {
      label: scene.sceneName,
      href: `/projects-next/${project.id}/episodes/${episode.id}/scenes/${scene.id}/manage`,
    },
    { label: "Scene Assembly" },
  ];

  // Action Rail items
  const actions: RailAction[] = [
    {
      key: "add-keyframe",
      icon: Plus,
      label: "Add keyframes",
      onSelect: () => fileInputRef.current?.click(),
    },
    {
      key: "toggle-panel",
      icon: isSidebarHidden ? PanelLeftOpen : PanelLeftClose,
      label: isSidebarHidden ? "Show panel" : "Hide panel",
      active: !isSidebarHidden,
      onSelect: () => setIsSidebarHidden((prev) => !prev),
    },
    {
      key: "delete-selected",
      icon: Trash2,
      label: "Delete selected",
      disabled: selectedIds.length === 0,
      hint:
        selectedIds.length === 0
          ? "Select an element to delete"
          : `Delete ${selectedIds.length} selected element${
              selectedIds.length > 1 ? "s" : ""
            }`,
      onSelect: () => {
        canvasRef.current?.deleteSelection();
      },
    },
  ];

  // Bottom action: Search
  const bottomAction: RailAction = {
    key: "search",
    icon: Search,
    label: "Search board",
    active: searchOpen,
    onSelect: () => {
      setSearchOpen((prev) => {
        if (prev) {
          setSearchQuery("");
        }
        return !prev;
      });
    },
  };

  return (
    <>
      <AppShell
        actions={actions}
        bottomAction={bottomAction}
        railLabel="Scene Assembly"
        breadcrumb={breadcrumbItems}
        contentClassName="overflow-hidden p-0"
        header={{
          title: "Scene Assembly",
          subtitle: `${scene.sceneName} · ${scene.numberOfFrames ?? 0} frames`,
          right: searchOpen ? (
            <div className="flex h-[38px] w-[280px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
              <Search size={15} className="text-[var(--po-ink-3)]" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search board, scenes, assets..."
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
        {/* Hidden File Input for Keyframes */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Main Canvas Workspace Container */}
        <div className="relative flex h-full w-full overflow-hidden">
          {/* Inline Error Notice */}
          {errorMessage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full border border-[#E5534B]/30 bg-[#E5534B]/10 px-4 py-2 text-[13px] text-[#E5534B] shadow-lg backdrop-blur-md">
              <AlertTriangle size={15} />
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="ml-2 hover:opacity-80"
                aria-label="Dismiss error"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Left Side Panel (Floating style / Docked) */}
          {!isSidebarHidden && (
            <AssemblySidePanel
              currentScene={scene}
              siblingScenes={siblingScenes}
              episodeAssets={episodeAssets}
              projectAssets={projectAssets}
              projectId={project.id}
              episodeId={episode.id}
              searchQuery={searchQuery}
              onClose={() => setIsSidebarHidden(true)}
            />
          )}

          {/* Board Workspace */}
          <div className="relative flex-1 h-full min-w-0 overflow-hidden bg-[var(--po-bg)]">
            <BoardCanvas
              ref={canvasRef}
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
              onSelectionChange={setSelectedIds}
              confirmDelete={handleConfirmDelete}
            />

            {/* Bottom Floating Toolbar */}
            <BoardToolbar
              activeTool={activeTool}
              onToolSelect={setActiveTool}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
            />

            {/* Bottom-Left Summary Badge */}
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-[var(--po-line)] bg-[var(--po-card)]/90 px-3 py-1.5 text-[12px] font-medium text-[var(--po-ink-2)] shadow-sm backdrop-blur-xs select-none">
              <span>{counts.keyframes} keyframes</span>
              <span>·</span>
              <span>{counts.assets} assets</span>
              <span>·</span>
              <span>{counts.folders} folders</span>
              <span>·</span>
              <span>{counts.comments} comments</span>
            </div>
          </div>
        </div>
      </AppShell>

      {/* Confirm Dialog for Folder deletion */}
      <ConfirmDialog
        isOpen={!!confirmState}
        title="Delete Folder"
        description={confirmState?.message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          confirmState?.resolve(true);
          setConfirmState(null);
        }}
        onCancel={() => {
          confirmState?.resolve(false);
          setConfirmState(null);
        }}
      />
    </>
  );
};

export default SceneAssemblyView;
