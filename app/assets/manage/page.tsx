"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/layout/TopNav";
import AuthGate from "@/components/auth/AuthGate";
import AssetManageTable from "@/components/assets/AssetManageTable";
import AssetDetailsPanel from "@/components/assets/AssetDetailsPanel";
import AssetBottomPanel from "@/components/assets/AssetBottomPanel";
import AssetForm from "@/components/assets/AssetForm";
import SyncDriveFoldersModal from "@/components/assets/SyncDriveFoldersModal";
import ManageDialog from "@/components/shared/ManageDialog";
import { getAssets, getAssetCategories } from "@/lib/data/productionRepository";
import type { Asset, AssetCategory } from "@/types/production";
import { Filter, ListFilter, Plus, Search, Upload, RefreshCw } from "lucide-react";

export default function AssetsManagePage() {
  return (
    <div className="flex h-screen w-full flex-col bg-black text-white">
      <TopNav />
      <AuthGate>
        <AssetsManageContent />
      </AuthGate>
    </div>
  );
}

function AssetsManageContent() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoadError(null);
      const [fetchedAssets, fetchedCategories] = await Promise.all([
        getAssets(),
        getAssetCategories(),
      ]);
      setAssets(fetchedAssets);
      setCategories(fetchedCategories);
      setSelectedAsset((currentAsset) => {
        if (!currentAsset) {
          return fetchedAssets[0] ?? null;
        }

        return fetchedAssets.find((asset) => asset.id === currentAsset.id) ?? null;
      });
    } catch (error) {
      console.error("Failed to load assets:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load assets.");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleAssetCreated = (asset: Asset) => {
    setAssets((currentAssets) => {
      if (currentAssets.some(a => a.id === asset.id)) return currentAssets;
      return [...currentAssets, asset];
    });
    setSelectedAsset(asset);
    // Do not call setIsAddingAsset(false) here. Let AssetForm decide when to close via onClose prop.
    loadData();
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col">
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
                onChange={(event) => setSearchQuery(event.target.value)}
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
          <button
            onClick={() => setIsManageDialogOpen(true)}
            className="flex items-center rounded bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            <Upload className="mr-1 h-3 w-3" />
            Manage Assets
          </button>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center rounded bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white ml-2"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Sync Missing Drive Folders
          </button>
        </div>
      </div>

      {loadError && (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-100">
          {loadError}
          <button
            type="button"
            onClick={loadData}
            className="ml-3 font-bold text-white underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <AssetManageTable
            assets={filteredAssets}
            selectedAssetId={selectedAsset?.id || null}
            onSelectAsset={setSelectedAsset}
          />

          {selectedAsset && <AssetBottomPanel asset={selectedAsset} />}
        </div>

        {selectedAsset && <AssetDetailsPanel asset={selectedAsset} />}
      </div>

      {(isAddingAsset || editingAsset) && (
        <AssetForm
          asset={editingAsset || undefined}
          onClose={() => { setIsAddingAsset(false); setEditingAsset(null); loadData(); }}
          onCreated={handleAssetCreated}
          categories={categories}
        />
      )}
      <SyncDriveFoldersModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} />
      {isManageDialogOpen && (
        <ManageDialog
          isHidden={!!editingAsset || isAddingAsset}
          isOpen={isManageDialogOpen}
          onClose={() => setIsManageDialogOpen(false)}
          title="Manage Assets"
          items={filteredAssets}
          onRefresh={loadData}
          entityType="Asset"
          onEdit={(item: any) => setEditingAsset(item)}
        />
      )}
    </main>
  );
}
