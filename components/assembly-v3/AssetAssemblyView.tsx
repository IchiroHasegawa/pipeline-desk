"use client";

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
  AlertTriangle,
  ExternalLink,
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
import {
  AssetAssemblyProjectPanel,
  type DropTarget,
} from "./AssetAssemblyProjectPanel";
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
}

export const AssetAssemblyView: React.FC<AssetAssemblyViewProps> = ({
  projects,
  currentProjectId,
  boardId,
  initialElements,
}) => {
  const router = useRouter();
  const [elements, setElements] = useState<BoardElement[]>(initialElements);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<BoardTool>("select");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [hoveredDropTarget, setHoveredDropTarget] = useState<DropTarget>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

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
        if (!hasDefaultWorkflow) {
          noWorkflowCount++;
        }
        setElements((prev) => [...prev, element]);
      }
      if (noWorkflowCount > 0) {
        const projectTitle = currentProject?.title || "this project";
        setWarningMessage(
          `${noWorkflowCount} asset(s) created, but ${projectTitle} has no Default Asset Workflow, so no tasks were generated. Set one in Settings → Projects.`
        );
      }
    } catch (err: unknown) {
      console.error("Failed to upload asset:", err);
      const msg = err instanceof Error ? err.message : "Failed to create asset.";
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
    // Optimistically remove from current board
    setElements((prev) => prev.filter((el) => !elementIds.includes(el.id)));

    try {
      await assignBoardElementsToProject(elementIds, targetProjectId);
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
    targetProjectId: string
  ) => {
    const previousElements = [...elements];
    // If target project is different from current board, optimistically remove
    if (targetProjectId !== currentProjectId) {
      setElements((prev) => prev.filter((el) => !elementIds.includes(el.id)));
    }

    try {
      await assignBoardElementsToEpisode(
        elementIds,
        targetEpisodeId,
        targetProjectId
      );
    } catch (err: unknown) {
      console.error("Failed to assign elements to episode:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to assign to episode.";
      setErrorMessage(msg);
      setElements(previousElements);
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

    const uploadItems: Array<{
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
        uploadItems.push({
          filename: file.name,
          dataUrl,
          x: 200 + i * 40,
          y: 200 + i * 40,
        });
      }
    }

    if (uploadItems.length > 0) {
      await handleUploadAssets(uploadItems);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Folder Delete Confirmation
  const handleConfirmDelete = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  // Breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    return [{ label: "Asset Assembly" }];
  }, []);

  // Top Action Rail Actions
  const actions: readonly RailAction[] = [
    {
      key: "upload",
      icon: Plus,
      label: "Upload assets",
      onSelect: () => {
        fileInputRef.current?.click();
      },
    },
    {
      key: "delete",
      icon: Trash2,
      label: "Delete item",
      disabled: selectedIds.length === 0,
      hint:
        selectedIds.length === 0
          ? "Select an item on the board"
          : `Delete ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""}`,
      onSelect: () => {
        canvasRef.current?.deleteSelection();
      },
    },
  ];

  // Bottom Action: Toggle Side Panel
  const bottomAction: RailAction = {
    key: "togglePanel",
    icon: isPanelCollapsed ? PanelLeftOpen : PanelLeftClose,
    label: isPanelCollapsed ? "Show panel" : "Hide panel",
    onSelect: () => {
      setIsPanelCollapsed((prev) => !prev);
    },
  };

  return (
    <>
      <AppShell
        actions={actions}
        bottomAction={bottomAction}
        railLabel="ASSET ASSEMBLY"
        breadcrumb={breadcrumbItems}
        contentClassName="overflow-hidden p-0"
        header={{
          title: "Asset Assembly",
          subtitle: currentProject
            ? `${currentProject.title} · ${
                currentProject.isSystem
                  ? "System Inbox"
                  : currentProject.projectCode
              }`
            : undefined,
          right: (
            <div className="flex items-center gap-2.5">
              {/* Search Toggle / Input */}
              {searchOpen ? (
                <div className="flex h-[38px] w-[260px] items-center gap-2 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-3 shadow-[var(--po-shadow-sm)]">
                  <Search size={15} className="text-[var(--po-ink-3)]" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search board elements..."
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
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="text-[var(--po-ink-3)] hover:text-[var(--po-ink)] ml-0.5"
                    aria-label="Close search"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] text-[var(--po-ink-2)] hover:text-[var(--po-ink)] shadow-[var(--po-shadow-sm)] transition-colors"
                  aria-label="Search board"
                  title="Search board"
                >
                  <Search size={16} />
                </button>
              )}

              {/* Manage Assets Link */}
              <button
                type="button"
                onClick={() =>
                  router.push(projectAssetsHref(currentProjectId, "assets"))
                }
                className="flex h-[38px] items-center gap-1.5 rounded-full border border-[var(--po-line-2)] bg-[var(--po-card)] px-4 text-[12px] font-semibold text-[var(--po-ink)] shadow-[var(--po-shadow-sm)] hover:border-[var(--po-ink-2)] transition-colors"
              >
                <span>Manage Assets</span>
                <ExternalLink size={12} className="text-[var(--po-ink-3)]" />
              </button>
            </div>
          ),
        }}
      >
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

          {/* Inline Warning Notice */}
          {warningMessage && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full border border-[var(--po-accent)]/40 bg-[var(--po-card)]/90 px-4 py-2 text-[13px] text-[var(--po-ink)] shadow-lg backdrop-blur-md">
              <AlertTriangle size={15} className="text-[var(--po-accent)] shrink-0" />
              <span>{warningMessage}</span>
              <button
                type="button"
                onClick={() => setWarningMessage(null)}
                className="ml-2 text-[var(--po-ink-2)] hover:text-[var(--po-ink)]"
                aria-label="Dismiss warning"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Left Project / Episode List Panel */}
          <AssetAssemblyProjectPanel
            projects={projects}
            currentProjectId={currentProjectId}
            isCollapsed={isPanelCollapsed}
            onSelectProject={handleSelectProject}
            hoveredDropTarget={hoveredDropTarget}
          />

          {/* Board Workspace */}
          <div className="relative flex-1 h-full min-w-0 overflow-hidden bg-[var(--po-bg)]">
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
            />

            {/* Bottom Floating Toolbar */}
            <BoardToolbar
              activeTool={activeTool}
              onToolSelect={setActiveTool}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
            />

            {/* Bottom-Left Summary Badge */}
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-[var(--po-line)] bg-[var(--po-card)]/90 px-3 py-1.5 text-[12px] font-medium text-[var(--po-ink-2)] shadow-sm backdrop-blur-xs select-none">
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

export default AssetAssemblyView;
