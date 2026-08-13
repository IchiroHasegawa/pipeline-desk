import React from "react";
import { getProjectsV2 } from "@/lib/data/v2/productionRepositoryV2";
import AssetsManagePosterClient from "@/components/assets-v2/AssetsManagePosterClient";

export const dynamic = "force-dynamic";

export default async function AssetsManagePage() {
  const projects = await getProjectsV2();

  return <AssetsManagePosterClient projects={projects} />;
}
