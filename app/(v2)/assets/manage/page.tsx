
import React from "react";
import {
  getProjectsV2,
  getProjectBoardStats,
} from "@/lib/data/v2/productionRepositoryV2";
import { AssetsPosterView } from "@/components/assets-v3";

export const dynamic = "force-dynamic";

export default async function AssetsManageNextPage() {
  const projects = await getProjectsV2();
  const boardStats = await getProjectBoardStats();

  const assetCounts: Record<string, number> = {};
  const assetFileBytes: Record<string, number> = {};

  for (const p of projects) {
    const stats = boardStats[p.id];
    assetCounts[p.id] = stats?.assets.assetCount ?? 0;
    assetFileBytes[p.id] = stats?.assets.totalBytes ?? 0;
  }

  return (
    <AssetsPosterView
      projects={projects}
      assetCounts={assetCounts}
      assetFileBytes={assetFileBytes}
    />
  );
}
