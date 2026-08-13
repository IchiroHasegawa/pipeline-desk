import React from "react";
import { getProjectsV2 } from "@/lib/data/v2/productionRepositoryV2";
import {
  getOrCreateBoard,
  getBoardElements,
} from "@/lib/data/v2/boardRepository";
import AssetsAssemblyClient from "@/components/assets-v2/AssetsAssemblyClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AssetsAssemblyPageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function AssetsAssemblyPage({
  searchParams,
}: AssetsAssemblyPageProps) {
  const { projectId: rawProjectId } = await searchParams;
  const supabase = await createClient();
  const projects = await getProjectsV2();

  let resolvedProjectId = rawProjectId || "";

  if (!resolvedProjectId) {
    // 2. Look up the system project (Unknown / Inbox)
    const { data: sysProject, error: sysError } = await supabase
      .from("projects")
      .select("id")
      .eq("is_system", true)
      .limit(1)
      .maybeSingle();

    if (!sysError && sysProject?.id) {
      resolvedProjectId = sysProject.id;
    } else if (projects.length > 0) {
      const unknownProject = projects.find((p) => p.isSystem);
      resolvedProjectId = unknownProject ? unknownProject.id : projects[0].id;
    }
  }

  // 5. If the system project is missing and no project can be resolved, render clear error state
  if (!resolvedProjectId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-canvas,#ffffff)] font-sans text-sm text-red-600 p-6">
        <div className="flex flex-col gap-2 max-w-md border border-red-300 rounded p-6 bg-red-50">
          <h2 className="font-bold text-base">Assembly Board Unavailable</h2>
          <p>
            No active or system project could be found to load the inbox board.
            Please ensure at least one project exists in the system.
          </p>
        </div>
      </div>
    );
  }

  // 3. Call getOrCreateBoard({ projectId: resolvedId })
  const boardId = await getOrCreateBoard({ projectId: resolvedProjectId });

  // 4. Fetch board elements
  const elements = await getBoardElements(boardId);

  return (
    <AssetsAssemblyClient
      key={boardId}
      projects={projects}
      currentProjectId={resolvedProjectId}
      boardId={boardId}
      initialElements={elements}
    />
  );
}
