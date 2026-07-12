"use client";

import { useState, useMemo } from "react";
import { Link, CheckSquare, Square, Search } from "lucide-react";
import type { Asset } from "@/types/production";

type AssignmentTarget = {
  type: "project" | "environment" | "episode" | "scene";
  id: string;
  name: string;
};

type AssetAssemblyRightPanelProps = {
  target: AssignmentTarget | null;
  assets: Asset[];
};

export default function AssetAssemblyRightPanel({ target, assets }: AssetAssemblyRightPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  const filteredAssets = useMemo(() => {
    return assets.filter(a => 
      a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.assetCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  const groupedAssets = useMemo(() => {
    const groups = new Map<string, Asset[]>();
    filteredAssets.forEach(asset => {
      const catName = asset.category?.name || "Uncategorized";
      const existing = groups.get(catName) || [];
      groups.set(catName, [...existing, asset]);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredAssets]);

  const toggleAsset = (id: string) => {
    setSelectedAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAllInCategory = (categoryAssets: Asset[]) => {
    const allSelected = categoryAssets.every(a => selectedAssetIds.has(a.id));
    setSelectedAssetIds(prev => {
      const newSet = new Set(prev);
      categoryAssets.forEach(a => {
        if (allSelected) newSet.delete(a.id);
        else newSet.add(a.id);
      });
      return newSet;
    });
  };

  const handleAssign = () => {
    if (!target) return;
    // In a real app, this would call an API like assignAssets(target, Array.from(selectedAssetIds))
    alert(`Assigned ${selectedAssetIds.size} assets to ${target.type}: ${target.name}`);
    setSelectedAssetIds(new Set());
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0">
      <div className="p-4 border-b border-[#2a2a2a] bg-[#121212] flex items-center justify-between shrink-0 h-16">
        <div>
          <h2 className="text-sm font-bold text-white">
            {target ? `Assigning to: ${target.name}` : "Select a hierarchy target to begin assignment"}
          </h2>
          {target && (
            <p className="text-xs text-zinc-500 capitalize">{target.type} Level</p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
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
          
          <button
            onClick={handleAssign}
            disabled={!target || selectedAssetIds.size === 0}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            <Link className="h-3.5 w-3.5" />
            Assign {selectedAssetIds.size > 0 ? `(${selectedAssetIds.size})` : ""}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {!target ? (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Select a project, environment, job, or scene from the left panel to assign assets to it.
          </div>
        ) : groupedAssets.length === 0 ? (
          <div className="text-zinc-500 text-center">No assets found matching your criteria.</div>
        ) : (
          groupedAssets.map(([category, catAssets]) => {
            const allSelected = catAssets.every(a => selectedAssetIds.has(a.id));
            const someSelected = catAssets.some(a => selectedAssetIds.has(a.id)) && !allSelected;
            
            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => selectAllInCategory(catAssets)} className="text-zinc-400 hover:text-white transition-colors">
                      {allSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className={`w-4 h-4 ${someSelected ? "text-blue-500 opacity-50" : ""}`} />}
                    </button>
                    <h3 className="text-xs font-bold uppercase text-zinc-400">{category}</h3>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{catAssets.length} assets</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {catAssets.map(asset => {
                    const selected = selectedAssetIds.has(asset.id);
                    return (
                      <div 
                        key={asset.id}
                        onClick={() => toggleAsset(asset.id)}
                        className={`group relative flex flex-col rounded-lg border bg-zinc-900 transition-all cursor-pointer overflow-hidden ${
                          selected ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,1)]" : "border-[#2a2a2a] hover:border-zinc-500"
                        }`}
                      >
                        <div className="absolute top-2 left-2 z-10">
                          {selected ? <CheckSquare className="w-4 h-4 text-blue-500 bg-black/50 rounded-sm" /> : <Square className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-sm" />}
                        </div>
                        
                        {asset.previewUrl ? (
                          <div 
                            className="aspect-video w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${asset.previewUrl})` }}
                          />
                        ) : (
                          <div className="aspect-video w-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-xl font-black text-zinc-700">{asset.assetName.substring(0, 2).toUpperCase()}</span>
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
