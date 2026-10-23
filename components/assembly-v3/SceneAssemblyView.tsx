"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelTopClose,
  PanelTopOpen,
  Search,
  X,
  AlertTriangle,
  Layers,
} from "lucide-react";
import {
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
import { AssemblyLayout } from "@/components/assembly-v3/AssemblyLayout";
import { ZoomControls } from "@/components/assembly-v3/ZoomControls";
import {
  createElement,
  deleteElement,
  moveElements,
} from "@/app/actions/board";
import {
  projectsHref,
  projectEpisodesHref,
  episodeScenesHref,
  sceneManageHref,
} from "@/lib/routes/app";
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
  const [isTopBarHidden, setIsTopBarHidden] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
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
    { label: "Projects", href: projectsHref() },
    {
      label: project.title,
      href: projectEpisodesHref(project.id),
    },
    {
      label: episode.episodeName,
      href: episodeScenesHref(project.id, episode.id),
    },
    {
      label: scene.sceneName,
      href: sceneManageHref(project.id, episode.id, scene.id),
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
    {
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
    },
  ];

  // Rail bottom pill: Two hide/show toggles matching prototype
  const bottomActions: RailAction[] = [
    {
      key: "toggle-panel",
      icon: isSidebarHidden ? PanelLeftOpen : PanelLeftClose,
      label: isSidebarHidden ? "Show side panel" : "Hide side panel",
      onSelect: () => setIsSidebarHidden((prev) => !prev),
    },
    {
      key: "toggle-top-bar",
      icon: isTopBarHidden ? PanelTopOpen : PanelTopClose,
      label: isTopBarHidden ? "Show top bar" : "Hide top bar",
      onSelect: () => setIsTopBarHidden((prev) => !prev),
    },
  ];

  return (
    <>
      {/* Hidden File Input for Keyframes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Inline Error Notice */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 rounded-full border border-[#E5534B]/30 bg-[#E5534B]/10 px-4 py-2 text-[13px] text-[#E5534B] shadow-lg backdrop-blur-md">
          <AlertTriangle size={15} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-2 hover:opacity-80 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <AssemblyLayout
        railActions={actions}
        bottomActions={bottomActions}
        railLabel="Scene Assembly"
        breadcrumb={breadcrumbItems}
        title="Scene Assembly"
        subtitle={`${scene.sceneName} · ${scene.numberOfFrames ?? 0} frames`}
        isTopBarHidden={isTopBarHidden}
        isSidePanelHidden={isSidebarHidden}
        topBarRight={
          searchOpen ? (
            <div className="flex h-[34px] w-[260px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
              <Search size={14} className="text-[var(--po-ink-3)]" />
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
                  className="text-[var(--po-ink-3)] hover:text-[var(--po-ink)] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ) : undefined
        }
        sidePanel={
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
        }
        summary={
          <>
            <Layers size={14} className="text-[var(--po-ink-3)] shrink-0" />
            <span>{counts.keyframes} keyframes</span>
            <span className="opacity-40">·</span>
            <span>{counts.assets} assets</span>
            <span className="opacity-40">·</span>
            <span>{counts.folders} folders</span>
            <span className="opacity-40">·</span>
            <span>{counts.comments} comments</span>
          </>
        }
        toolbar={
          <BoardToolbar
            activeTool={activeTool}
            onToolSelect={setActiveTool}
          />
        }
        zoomControls={
          <ZoomControls
            zoom={zoom}
            onZoomIn={() => canvasRef.current?.zoomIn()}
            onZoomOut={() => canvasRef.current?.zoomOut()}
            onResetZoom={() => canvasRef.current?.resetZoom()}
            onFitToContent={() => canvasRef.current?.fitToContent()}
          />
        }
      >
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
          onZoomChange={setZoom}
        />
      </AssemblyLayout>

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
