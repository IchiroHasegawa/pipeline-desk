"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import BottomNav from "@/components/shell/BottomNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import BoardSpace from "@/components/board/BoardSpace";
import BoardToolbar, { BoardTool } from "@/components/board/BoardToolbar";
import ProjectListPanel, { DropTarget } from "@/components/assets-v2/ProjectListPanel";
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

export type AssetsAssemblyClientProps = {
  projects: ProjectV2[];
  currentProjectId: string;
  boardId: string;
  initialElements: BoardElement[];
};

export const AssetsAssemblyClient: React.FC<AssetsAssemblyClientProps> = ({
  projects,
  currentProjectId,
  boardId,
  initialElements,
}) => {
  const router = useRouter();
  const [elements, setElements] = useState<BoardElement[]>(initialElements);
  const [activeTool, setActiveTool] = useState<BoardTool>("select");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [hoveredDropTarget, setHoveredDropTarget] = useState<DropTarget>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElements(initialElements);
  }, [boardId, initialElements]);

  const handleSelectProject = (projectId: string) => {
    if (projectId === currentProjectId) return;
    router.replace(`/assets/assembly?projectId=${projectId}`, { scroll: false });
  };

  const handleCreateElement = async (input: CreateElementInput) => {
    const newElement = await createElement(input);
    setElements((prev) => [...prev, newElement]);
    setActiveTool("select");
    return newElement;
  };

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
        alert(
          "Asset created, but this project has no Default Asset Workflow set in Project Settings. No workflow tasks were generated."
        );
      }
    } catch (err: unknown) {
      console.error("Failed to upload asset:", err);
      alert(err instanceof Error ? err.message : "Failed to create asset.");
    }
  };

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
      alert(err instanceof Error ? err.message : "Failed to assign to project.");
      setElements(previousElements);
    }
  };

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
      alert(err instanceof Error ? err.message : "Failed to assign to episode.");
      setElements(previousElements);
    }
  };

  const handleDeleteElement = async (id: string) => {
    await deleteElement(id);
    setElements((prev) => prev.filter((el) => el.id !== id));
  };

  const handleMoveElements = async (
    moves: Array<{ id: string; x: number; y: number; zIndex?: number }>
  ) => {
    await moveElements(moves);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;

    const uploadItems: Array<{ filename: string; dataUrl: string; x: number; y: number }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve((event.target?.result as string) || "");
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

  const toolActions: ToolAction[] = [
    {
      id: "hide",
      label: "HIDE",
      onSelect: () => setIsPanelCollapsed((prev) => !prev),
    },
    {
      id: "add",
      label: "ADD",
      onSelect: () => fileInputRef.current?.click(),
    },
    {
      id: "sub",
      label: "SUB",
      onSelect: () => {},
    },
  ];

  return (
    <>
      <CanvasShell
        nav={null}
        tools={<TransformTools actions={toolActions} />}
        toolsPosition={isPanelCollapsed ? { x: 53, y: 55 } : { x: 360, y: 56 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="relative w-full h-full flex flex-row overflow-hidden select-none">
          {/* Left Project List Panel (Collapsible via width animation, no remount) */}
          <ProjectListPanel
            projects={projects}
            currentProjectId={currentProjectId}
            isCollapsed={isPanelCollapsed}
            onSelectProject={handleSelectProject}
            hoveredDropTarget={hoveredDropTarget}
          />

          {/* Board Space Area */}
          <main className="flex-1 h-full relative">
            <BoardSpace
              boardId={boardId}
              elements={elements}
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
            />
          </main>

          {/*
            Tools bar (842, 981) 235 × 59 — DESIGN_SPEC §13.
            Positioned against the viewport frame, not the board column, so the
            coordinates hold whether or not the 330px panel is collapsed.
          */}
          <BoardToolbar
            activeTool={activeTool}
            onToolSelect={setActiveTool}
            position={{ x: 842, y: 981 }}
          />
        </div>
      </CanvasShell>

      <BottomNav />
    </>
  );
};

export default AssetsAssemblyClient;
