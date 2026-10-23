"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Check,
  ExternalLink,
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
import {
  AssetAssemblyProjectPanel,
  type DropTarget,
  type Target,
} from "./AssetAssemblyProjectPanel";
import { AssemblyLayout } from "./AssemblyLayout";
import { ZoomControls } from "./ZoomControls";
import {
  createElement,
  deleteElement,
  moveElements,
  createBoardAssetElement,
  assignBoardElementsToProject,
  assignBoardElementsToEpisode,
} from "@/app/actions/board";
import type {
  ProjectV2,
  BoardElement,
  CreateElementInput,
} from "@/types/production-v2";
import { assetAssemblyHref, projectAssetsHref } from "@/lib/routes/app";

export interface AssetAssemblyViewProps {
  projects: ProjectV2[];
  currentProjectId: string;
  boardId: string;
  initialElements: BoardElement[];
  initialLinkCounts?: {
    byProject: Record<string, number>;
    byEpisode: Record<string, number>;
  };
}

export const AssetAssemblyView: React.FC<AssetAssemblyViewProps> = ({
  projects,
  currentProjectId,
  boardId,
  initialElements,
  initialLinkCounts,
}) => {
  const router = useRouter();
  const [elements, setElements] = useState<BoardElement[]>(initialElements);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<BoardTool>("select");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isTopBarHidden, setIsTopBarHidden] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [hoveredDropTarget, setHoveredDropTarget] = useState<DropTarget>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Link counts state (initialized from server prop, updated on assignments)
  const [linkCounts, setLinkCounts] = useState<{
    byProject: Record<string, number>;
    byEpisode: Record<string, number>;
  }>(initialLinkCounts || { byProject: {}, byEpisode: {} });

  // Target state for assignment
  const [target, setTarget] = useState<Target>({
    projectId: currentProjectId,
    episodeId: null,
  });

  const [isAssigning, setIsAssigning] = useState(false);

  // Auto-dismiss notices
  useEffect(() => {
    if (!successNotice) return;
    const timer = setTimeout(() => setSuccessNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [successNotice]);

  useEffect(() => {
    if (!warningMessage) return;
    const timer = setTimeout(() => setWarningMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [warningMessage]);

  // Update target when currentProjectId changes
  const [prevCurrentProjectId, setPrevCurrentProjectId] = useState(currentProjectId);
  if (prevCurrentProjectId !== currentProjectId) {
    setPrevCurrentProjectId(currentProjectId);
    setTarget({ projectId: currentProjectId, episodeId: null });
  }

  // Folder delete confirmation state
  const [confirmState, setConfirmState] = useState<{
    message: string;
    resolve: (val: boolean) => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<BoardCanvasHandle>(null);

  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === currentProjectId) || null;
  }, [projects, currentProjectId]);

  // Synchronize elements when initialElements prop changes
  const [prevInitialElements, setPrevInitialElements] = useState(initialElements);
  if (initialElements !== prevInitialElements) {
    setPrevInitialElements(initialElements);
    setElements(initialElements);
  }

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

  // Selected asset count for checkboxes and summary
  const selectedAssetCount = useMemo(() => {
    return elements.filter(
      (el) => selectedIds.includes(el.id) && el.elementType === "asset" && el.assetId
    ).length;
  }, [elements, selectedIds]);

  // Counts for summary badge
  const counts = useMemo(() => {
    let assets = 0;
    let folders = 0;
    let comments = 0;

    for (const el of elements) {
      if (el.elementType === "asset") assets++;
      else if (el.elementType === "folder") folders++;
      else if (el.elementType === "comment") comments++;
    }

    return { assets, folders, comments };
  }, [elements]);

  // Project Selection Handler
  const handleSelectProject = (projectId: string) => {
    if (projectId === currentProjectId) return;
    router.replace(assetAssemblyHref(projectId), { scroll: false });
  };

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

  // Upload Assets Handler
  const handleUploadAssets = async (
    items: Array<{ filename: string; dataUrl: string; x: number; y: number }>
  ) => {
    try {
      let noWorkflowCount = 0;
      for (const item of items) {
        const { element, hasDefaultWorkflow } = await createBoardAssetElement({
          boardId,
          projectId: currentProjectId,
          filename: item.filename,
          imageUrl: item.dataUrl,
          x: item.x,
          y: item.y,
        });
        if (!hasDefaultWorkflow) noWorkflowCount++;
        setElements((prev) => [...prev, element]);
      }
      if (noWorkflowCount > 0) {
        setWarningMessage(
          `${noWorkflowCount} asset(s) uploaded without default workflow status.`
        );
      }
      // Update link counts for current project
      setLinkCounts((prev) => ({
        ...prev,
        byProject: {
          ...prev.byProject,
          [currentProjectId]: (prev.byProject[currentProjectId] || 0) + items.length,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload assets.";
      setErrorMessage(msg);
    }
  };

  // Assign Board Elements to Project
  const handleAssignToProject = async (
    elementIds: string[],
    targetProjectId: string
  ) => {
    if (targetProjectId === currentProjectId) return;
    const previousElements = [...elements];
    // Optimistically remove from current board only when project differs
    setElements((prev) => prev.filter((el) => !elementIds.includes(el.id)));

    try {
      await assignBoardElementsToProject(elementIds, targetProjectId);
      setLinkCounts((prev) => {
        const byProject = { ...prev.byProject };
        byProject[currentProjectId] = Math.max(
          0,
          (byProject[currentProjectId] || 0) - elementIds.length
        );
        byProject[targetProjectId] =
          (byProject[targetProjectId] || 0) + elementIds.length;
        return { ...prev, byProject };
      });
      const targetProj = projects.find((p) => p.id === targetProjectId);
      const name = targetProj
        ? targetProj.isSystem
          ? "Inbox"
          : targetProj.title
        : "project";
      setSuccessNotice(`Assigned ${elementIds.length} asset(s) to ${name}`);
      canvasRef.current?.clearSelection?.();
      setSelectedIds([]);
    } catch (err: unknown) {
      console.error("Failed to assign elements to project:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to assign to project.";
      setErrorMessage(msg);
      setElements(previousElements);
    }
  };

  // Assign Board Elements to Episode
  const handleAssignToEpisode = async (
    elementIds: string[],
    targetEpisodeId: string,
    targetProjectId: string,
    targetEpisodeName?: string
  ) => {
    const previousElements = [...elements];
    // Only remove from current board when target project differs from current project
    if (targetProjectId !== currentProjectId) {
      setElements((prev) => prev.filter((el) => !elementIds.includes(el.id)));
    }

    try {
      await assignBoardElementsToEpisode(
        elementIds,
        targetEpisodeId,
        targetProjectId
      );
      setLinkCounts((prev) => {
        const byProject = { ...prev.byProject };
        const byEpisode = { ...prev.byEpisode };
        if (targetProjectId !== currentProjectId) {
          byProject[currentProjectId] = Math.max(
            0,
            (byProject[currentProjectId] || 0) - elementIds.length
          );
          byProject[targetProjectId] =
            (byProject[targetProjectId] || 0) + elementIds.length;
        }
        byEpisode[targetEpisodeId] =
          (byEpisode[targetEpisodeId] || 0) + elementIds.length;
        return { ...prev, byProject, byEpisode };
      });
      const epName = targetEpisodeName || "episode";
      setSuccessNotice(`Assigned ${elementIds.length} asset(s) to ${epName}`);
      canvasRef.current?.clearSelection?.();
      setSelectedIds([]);
    } catch (err: unknown) {
      console.error("Failed to assign elements to episode:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to assign to episode.";
      setErrorMessage(msg);
      setElements(previousElements);
    }
  };

  // Button Assign Execution
  const handleAssignButton = async () => {
    const selectedElements = elements.filter((el) =>
      selectedIds.includes(el.id)
    );
    const assetElements = selectedElements.filter(
      (el) => el.elementType === "asset" && el.assetId
    );
    const nonAssetCount = selectedElements.length - assetElements.length;

    if (nonAssetCount > 0) {
      setWarningMessage(
        `Ignored ${nonAssetCount} non-asset item${
          nonAssetCount > 1 ? "s" : ""
        } (only assets can be assigned).`
      );
    }

    if (assetElements.length === 0) return;

    setIsAssigning(true);
    try {
      const ids = assetElements.map((el) => el.id);
      if (target.episodeId) {
        await handleAssignToEpisode(ids, target.episodeId, target.projectId);
      } else {
        await handleAssignToProject(ids, target.projectId);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Delete Element Handler
  const handleDeleteElement = async (id: string) => {
    try {
      await deleteElement(id);
      setElements((prev) => prev.filter((el) => el.id !== id));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete element.";
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
      const msg =
        err instanceof Error ? err.message : "Failed to move elements.";
      setErrorMessage(msg);
    }
  };

  // File Input Change Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;

    const items: Array<{
      filename: string;
      dataUrl: string;
      x: number;
      y: number;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) =>
          resolve((event.target?.result as string) || "");
        reader.readAsDataURL(file);
      });
      if (dataUrl) {
        items.push({
          filename: file.name,
          dataUrl,
          x: 200 + i * 40,
          y: 200 + i * 40,
        });
      }
    }

    if (items.length > 0) {
      await handleUploadAssets(items);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Custom Delete Confirm Callback
  const handleConfirmDelete = (message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ message, resolve });
    });
  };

  // Action Rail breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Asset Assembly", href: "/assets/assembly" },
  ];

  // Rail main actions (top pill): Pages, Add, Delete, Search
  const actions: RailAction[] = [
    {
      key: "new",
      icon: Plus,
      label: "Upload asset",
      onSelect: () => {
        fileInputRef.current?.click();
      },
    },
    {
      key: "delete",
      icon: Trash2,
      label: "Delete selection",
      disabled: selectedIds.length === 0,
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
      key: "togglePanel",
      icon: isPanelCollapsed ? PanelLeftOpen : PanelLeftClose,
      label: isPanelCollapsed ? "Show side panel" : "Hide side panel",
      onSelect: () => {
        setIsPanelCollapsed((prev) => !prev);
      },
    },
    {
      key: "toggleTopBar",
      icon: isTopBarHidden ? PanelTopOpen : PanelTopClose,
      label: isTopBarHidden ? "Show top bar" : "Hide top bar",
      onSelect: () => {
        setIsTopBarHidden((prev) => !prev);
      },
    },
  ];

  return (
    <>
      {/* File Input for Board Assets */}
      <input
        id="board-asset-file-input"
        data-testid="board-asset-file-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="sr-only"
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
            <X size={13} />
          </button>
        </div>
      )}

      {/* Inline Warning Notice */}
      {warningMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-[13px] text-amber-500 font-medium shadow-lg backdrop-blur-md">
          <AlertTriangle size={15} />
          <span>{warningMessage}</span>
          <button
            type="button"
            onClick={() => setWarningMessage(null)}
            className="ml-2 hover:opacity-80 cursor-pointer"
            aria-label="Dismiss warning"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Inline Success Notice */}
      {successNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 rounded-full border border-[var(--po-ok)]/30 bg-[var(--po-ok)]/15 px-4 py-2 text-[13px] text-[var(--po-ok)] font-medium shadow-lg backdrop-blur-md">
          <Check size={15} />
          <span>{successNotice}</span>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="ml-2 hover:opacity-80 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <AssemblyLayout
        railActions={actions}
        bottomActions={bottomActions}
        railLabel="Asset Assembly"
        breadcrumb={breadcrumbItems}
        title="Asset Assembly"
        subtitle={
          currentProject
            ? `${currentProject.isSystem ? "Inbox" : currentProject.title} · ${
                currentProject.isSystem
                  ? "System Inbox"
                  : currentProject.projectCode
              }`
            : undefined
        }
        isTopBarHidden={isTopBarHidden}
        isSidePanelHidden={isPanelCollapsed}
        topBarRight={
          <div className="flex items-center gap-2.5">
            {/* Search Toggle / Input */}
            {searchOpen && (
              <div className="flex h-[34px] w-[240px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
                <Search size={14} className="text-[var(--po-ink-3)]" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search board..."
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
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-[var(--po-ink-3)] hover:text-[var(--po-ink)] ml-0.5 cursor-pointer"
                  aria-label="Close search"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Manage Assets Link */}
            <button
              type="button"
              onClick={() =>
                router.push(projectAssetsHref(currentProjectId, "assets"))
              }
              className="flex h-[34px] items-center gap-1.5 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3.5 text-[12px] font-semibold text-[var(--po-ink)] shadow-[var(--po-shadow-sm)] hover:border-[var(--po-ink-2)] transition-colors cursor-pointer"
            >
              <span>Manage Assets</span>
              <ExternalLink size={12} className="text-[var(--po-ink-3)]" />
            </button>
          </div>
        }
        sidePanel={
          <AssetAssemblyProjectPanel
            projects={projects}
            currentProjectId={currentProjectId}
            isCollapsed={isPanelCollapsed}
            target={target}
            onSetTarget={setTarget}
            onSelectProject={handleSelectProject}
            hoveredDropTarget={hoveredDropTarget}
            linkCounts={linkCounts}
            selectedAssetCount={selectedAssetCount}
            isAssigning={isAssigning}
            onAssign={handleAssignButton}
          />
        }
        summary={
          <>
            <Layers size={14} className="text-[var(--po-ink-3)] shrink-0" />
            <span>{counts.assets} assets</span>
            <span className="opacity-40">·</span>
            <span>{counts.folders} folders</span>
            <span className="opacity-40">·</span>
            <span>{counts.comments} comments</span>
            {selectedAssetCount > 0 && (
              <>
                <span className="opacity-40">·</span>
                <span className="font-semibold text-[var(--po-ink)]">
                  {selectedAssetCount} selected
                </span>
              </>
            )}
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
          scope={{ type: "project", projectId: currentProjectId }}
          onToolSelect={setActiveTool}
          onElementsChange={setElements}
          onElementCreate={handleCreateElement}
          onUploadAssets={handleUploadAssets}
          onAssignToProject={handleAssignToProject}
          onAssignToEpisode={handleAssignToEpisode}
          onHoverDropTarget={setHoveredDropTarget}
          onElementDelete={handleDeleteElement}
          onElementMove={handleMoveElements}
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

export default AssetAssemblyView;
