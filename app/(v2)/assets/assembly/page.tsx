import React from "react";
import {
  getProjectsV2,
} from "@/lib/data/v2/productionRepositoryV2";
import {
  getOrCreateBoard,
  getBoardElements,
} from "@/lib/data/v2/boardRepository";
import AssetsAssemblyClient from "@/components/assets-v2/AssetsAssemblyClient";

export const dynamic = "force-dynamic";

type AssetsAssemblyPageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function AssetsAssemblyPage({
  searchParams,
}: AssetsAssemblyPageProps) {
  const { projectId } = await searchParams;
  const projects = await getProjectsV2();

  const currentProjectId =
    projectId || (projects.length > 0 ? projects[0].id : "");

  const boardId = currentProjectId
    ? await getOrCreateBoard({ projectId: currentProjectId })
    : "";

  const elements = boardId ? await getBoardElements(boardId) : [];

  return (
    <AssetsAssemblyClient
      projects={projects}
      currentProjectId={currentProjectId}
      boardId={boardId}
      initialElements={elements}
    />
  );
}
