"use client";

import { useState, useMemo } from "react";
import { Link, CheckSquare, Square, Search, XCircle, Trash2 } from "lucide-react";
import type { Asset, AssetCategory } from "@/types/production";
import type { ProductionTarget } from "./AssetAssemblyLeftPanel";

type AssetAssemblyRightPanelProps = {
  assets: Asset[];
  categories: AssetCategory[];
  selectedProductionTargets: ProductionTarget[];
  selectedAssetIds: Set<string>;
  onToggleAsset: (id: string, checked: boolean) => void;
  onToggleAllInCategory: (categoryAssets: Asset[], checked: boolean) => void;
  onClearSelection: () => void;
};

export default function AssetAssemblyRightPanel({
  assets,
  categories,
  selectedProductionTargets,
  selectedAssetIds,
  onToggleAsset,
  onToggleAllInCategory,
  onClearSelection,
}: AssetAssemblyRightPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories]);

  const groupedAssets = useMemo(() => {
    const groups = new Map<string, Asset[]>();
    
    // Initialize all known categories
    sortedCategories.forEach((cat) => {
      groups.set(cat.name, []);
    });
    
    // Also capture any uncategorized or dynamic categories not in the official list
    filteredAssets.forEach((asset) => {
      const catName = asset.category?.name || "Uncategorized";
      const existing = groups.get(catName) || [];
      existing.push(asset);
      groups.set(catName, existing);
    });

    // Sort assets inside each group by sortOrder then createdAt
    for (const [cat, items] of groups.entries()) {
      groups.set(
        cat,
        items.sort((a, b) => {
          const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          if (orderDiff !== 0) return orderDiff;
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        })
      );
    }

    return groups;
  }, [filteredAssets, sortedCategories]);

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0">
      <div className="p-4 border-b border-[#2a2a2a] bg-[#121212] flex flex-wrap items-center justify-between shrink-0 h-16 gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase">Assets List</h2>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="relative">
            <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-full border border-[#2a2a2a] bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-[#e0e0e0] outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#0a0a0a] px-4 py-2">
        <div className="flex items-center gap-6">
          <div className="text-xs">
            <span className="text-zinc-500">Selected Production Items: </span>
            <span className="font-bold text-white">{selectedProductionTargets.length}</span>
          </div>
          <div className="text-xs">
            <span className="text-zinc-500">Selected Assets: </span>
            <span className="font-bold text-white">{selectedAssetIds.size}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearSelection}
            disabled={selectedAssetIds.size === 0 && selectedProductionTargets.length === 0}
            className="flex items-center gap-1 rounded border border-[#2a2a2a] px-3 py-1 text-xs font-bold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            Clear Selection
          </button>
          
          <button
            disabled
            className="flex items-center gap-1 rounded border border-red-900/50 px-3 py-1 text-xs font-bold text-red-500 opacity-50 cursor-not-allowed"
            title="Remove Association is disabled in Stage 1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove Association
          </button>

          <button
            disabled
            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white opacity-50 cursor-not-allowed"
            title="Assign Selected Assets is disabled in Stage 1"
          >
            <Link className="h-3.5 w-3.5" />
            Assign Selected Assets
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {assets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-500">
            No Assets have been created.
          </div>
        ) : (
          Array.from(groupedAssets.entries()).map(([category, catAssets]) => {
            const allSelected = catAssets.length > 0 && catAssets.every((a) => selectedAssetIds.has(a.id));
            const someSelected = catAssets.some((a) => selectedAssetIds.has(a.id)) && !allSelected;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleAllInCategory(catAssets, !allSelected)}
                      disabled={catAssets.length === 0}
                      className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className={`w-4 h-4 ${someSelected ? "text-blue-500 opacity-50" : ""}`} />
                      )}
                    </button>
                    <h3 className="text-xs font-bold uppercase text-zinc-400">{category}</h3>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{catAssets.length} assets</span>
                </div>

                {catAssets.length === 0 ? (
                  <div className="text-zinc-600 text-xs italic py-2">No Assets in this Category.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {catAssets.map((asset) => {
                      const selected = selectedAssetIds.has(asset.id);
                      return (
                        <div
                          key={asset.id}
                          onClick={() => onToggleAsset(asset.id, !selected)}
                          className={`group relative flex flex-col rounded-lg border bg-zinc-900 transition-all cursor-pointer overflow-hidden ${
                            selected
                              ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]"
                              : "border-[#2a2a2a] hover:border-zinc-500"
                          }`}
                        >
                          <div className="absolute top-2 left-2 z-10">
                            {selected ? (
                              <CheckSquare className="w-4 h-4 text-blue-500 bg-black/50 rounded-sm" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-sm" />
                            )}
                          </div>

                          {asset.previewUrl ? (
                            <div
                              className="aspect-video w-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${asset.previewUrl})` }}
                            />
                          ) : (
                            <div className="aspect-video w-full bg-zinc-800 flex items-center justify-center">
                              <span className="text-xl font-black text-zinc-700">
                                {asset.assetName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}

                          <div className="p-3 flex flex-col bg-zinc-900">
                            <span className="text-sm font-bold text-white truncate">{asset.assetName}</span>
                            <span className="text-xs text-zinc-500 font-mono mt-0.5">{asset.assetCode}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
