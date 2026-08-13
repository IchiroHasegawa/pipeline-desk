"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CanvasShell from "@/components/shell/CanvasShell";
import VerticalNav from "@/components/shell/VerticalNav";
import TransformTools, { ToolAction } from "@/components/shell/TransformTools";
import BoardSpace from "@/components/board/BoardSpace";
import BoardToolbar, { BoardTool } from "@/components/board/BoardToolbar";
import ProjectListPanel from "@/components/assets-v2/ProjectListPanel";
import {
  createElement,
  deleteElement,
  moveElements,
} from "@/lib/data/v2/boardRepository";
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectProject = (projectId: string) => {
    if (projectId === currentProjectId) return;
    router.push(`/assets/assembly?projectId=${projectId}`);
  };

  const handleCreateElement = async (input: CreateElementInput) => {
    const newElement = await createElement(input);
    setElements((prev) => [...prev, newElement]);
    setActiveTool("select");
    return newElement;
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

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          await handleCreateElement({
            boardId,
            elementType: "asset",
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
    <CanvasShell
      nav={<VerticalNav active="assets" activeAssetsSubsection="assembly" />}
      tools={<TransformTools actions={toolActions} />}
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
        />

        {/* Board Space Area */}
        <main className="flex-1 h-full relative">
          <BoardSpace
            boardId={boardId}
            elements={elements}
            activeTool={activeTool}
            onElementsChange={setElements}
            onElementCreate={handleCreateElement}
            onElementDelete={handleDeleteElement}
            onElementMove={handleMoveElements}
          />

          {/* Bottom Floating Toolbar */}
          <BoardToolbar activeTool={activeTool} onToolSelect={setActiveTool} />
        </main>
      </div>
    </CanvasShell>
  );
};

export default AssetsAssemblyClient;
