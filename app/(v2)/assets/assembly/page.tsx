// Production OS Phase 7b: Asset Assembly Redesign
import React from "react";
import {
  getProjectsV2,
  getAssetLinkCounts,
} from "@/lib/data/v2/productionRepositoryV2";
import {
  getOrCreateBoard,
  getBoardElements,
} from "@/lib/data/v2/boardRepository";
import { AssetAssemblyView } from "@/components/assembly-v3/AssetAssemblyView";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AssetsAssemblyNextPageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function AssetsAssemblyNextPage({
  searchParams,
}: AssetsAssemblyNextPageProps) {
  const { projectId: rawProjectId } = await searchParams;
  const supabase = await createClient();
  const [projects, linkCounts] = await Promise.all([
    getProjectsV2(),
    getAssetLinkCounts(),
  ]);

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
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--po-bg)] font-sans text-sm text-[var(--po-ink)] p-6">
        <div className="flex flex-col gap-2 max-w-md border border-[var(--po-line)] rounded-[20px] p-6 bg-[var(--po-card)] shadow-[var(--po-shadow-sm)]">
          <h2 className="font-bold text-base text-[var(--po-ink)]">
            Assembly Board Unavailable
          </h2>
          <p className="text-[13px] text-[var(--po-ink-2)]">
            No active or system project could be found to load the inbox board.
            Please ensure at least one project exists in the system.
          </p>
        </div>
      </div>
    );
  }

  // 3. Call getOrCreateBoard({ projectId: resolvedProjectId })
  const boardId = await getOrCreateBoard({ projectId: resolvedProjectId });

  // 4. Fetch board elements
  const elements = await getBoardElements(boardId);

  return (
    <AssetAssemblyView
      key={boardId}
      projects={projects}
      currentProjectId={resolvedProjectId}
      boardId={boardId}
      initialElements={elements}
      initialLinkCounts={linkCounts}
    />
  );
}
