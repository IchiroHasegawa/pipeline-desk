"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/layout/TopNav";
import AssetManageTable from "@/components/assets/AssetManageTable";
import AssetDetailsPanel from "@/components/assets/AssetDetailsPanel";
import AssetBottomPanel from "@/components/assets/AssetBottomPanel";
import AssetForm from "@/components/assets/AssetForm";
import { getAssets, getAssetCategories } from "@/lib/data/productionRepository";
import type { Asset, AssetCategory } from "@/types/production";
import { Filter, ListFilter, Plus, Search } from "lucide-react";

export default function AssetsManagePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      const [fetchedAssets, fetchedCategories] = await Promise.all([
        getAssets(),
        getAssetCategories(),
      ]);
      setAssets(fetchedAssets);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleAssetAdded = () => {
    setIsAddingAsset(false);
    loadData();
  };

  const filteredAssets = assets.filter((a) =>
    a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.assetCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full flex-col bg-black text-white">
      <TopNav />

      <main className="flex min-h-0 flex-1 flex-col">
        {/* Top Toolbar */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#121212] px-4 py-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Assets Manage
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1.5 h-3 w-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Quick search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-6 w-48 rounded border border-[#2a2a2a] bg-zinc-900 pl-7 pr-2 text-xs text-[#e0e0e0] outline-none focus:border-zinc-500"
                />
              </div>
              <button className="flex h-6 items-center justify-center rounded border border-[#2a2a2a] bg-zinc-900 px-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                <Filter className="h-3 w-3" />
              </button>
              <button className="flex h-6 items-center justify-center rounded border border-[#2a2a2a] bg-zinc-900 px-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
                <ListFilter className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingAsset(true)}
              className="flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-500"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Asset
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <AssetManageTable
              assets={filteredAssets}
              selectedAssetId={selectedAsset?.id || null}
              onSelectAsset={setSelectedAsset}
            />

            {selectedAsset && (
              <AssetBottomPanel asset={selectedAsset} />
            )}
          </div>

          {selectedAsset && (
            <AssetDetailsPanel asset={selectedAsset} />
          )}
        </div>
      </main>

      {isAddingAsset && (
        <AssetForm onClose={handleAssetAdded} categories={categories} />
      )}
    </div>
  );
}
