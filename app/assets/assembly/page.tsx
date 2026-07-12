"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/layout/TopNav";
import AssetAssemblyLeftPanel from "@/components/assets/AssetAssemblyLeftPanel";
import AssetAssemblyRightPanel from "@/components/assets/AssetAssemblyRightPanel";
import { getAssets } from "@/lib/data/productionRepository";
import type { Asset } from "@/types/production";

type AssignmentTarget = {
  type: "project" | "environment" | "episode" | "scene";
  id: string;
  name: string;
};

export default function AssetsAssemblyPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<AssignmentTarget | null>(null);

  useEffect(() => {
    getAssets().then(setAssets).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-black text-white">
      <TopNav />
      
      <div className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#121212] px-4 py-2">
        <h1 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          Assets Assembly
        </h1>
      </div>

      <main className="flex min-h-0 flex-1">
        <AssetAssemblyLeftPanel 
          selectedTarget={selectedTarget}
          onSelectTarget={setSelectedTarget}
        />
        
        <AssetAssemblyRightPanel 
          target={selectedTarget}
          assets={assets}
        />
      </main>
    </div>
  );
}
