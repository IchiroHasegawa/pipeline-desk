"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TopNav from "@/components/layout/TopNav";
import AuthGate from "@/components/auth/AuthGate";
import AssetAssemblyLeftPanel, { ProductionTarget } from "@/components/assets/AssetAssemblyLeftPanel";
import AssetAssemblyRightPanel from "@/components/assets/AssetAssemblyRightPanel";
import { 
  getAssets, 
  getAssetCategories, 
  getProjects, 
  loadAssociationsForTargets, 
  assignAssetsToTargets, 
  removeAssetLinks 
} from "@/lib/data/productionRepository";
import { mockProjects } from "@/data/mockProductions";
import type { Asset, AssetCategory, Project } from "@/types/production";
import { DevelopmentFallbackWarning, LoadingMessage, ErrorMessage } from "@/components/ui/LoadingState";

type DataSource = "supabase" | "mock";

type LoadState = {
  isLoading: boolean;
  errorMessage: string | null;
  dataSource: DataSource;
};

export default function AssetsAssemblyPage() {
  return (
    <div className="flex h-screen w-full flex-col bg-black text-white">
      <TopNav />
      <AuthGate>
        <AssetsAssemblyContent />
      </AuthGate>
    </div>
  );
}

function AssetsAssemblyContent() {
  const isMountedRef = useRef(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  
  const [selectedProductionTargets, setSelectedProductionTargets] = useState<Map<string, ProductionTarget>>(new Map());
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  
  const [assignedAssetIds, setAssignedAssetIds] = useState<Set<string>>(new Set());
  const [isAssociating, setIsAssociating] = useState(false);
  const [associationMessage, setAssociationMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [loadState, setLoadState] = useState<LoadState>({
    isLoading: true,
    errorMessage: null,
    dataSource: "supabase",
  });

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoadState((current) => ({
      ...current,
      isLoading: true,
      errorMessage: null,
    }));

    try {
      const [loadedProjects, loadedAssets, loadedCategories] = await Promise.all([
        getProjects(),
        getAssets(),
        getAssetCategories(),
      ]);

      if (!isMountedRef.current) return;

      setProjects(loadedProjects);
      setAssets(loadedAssets);
      setCategories(loadedCategories);
      
      setLoadState({
        isLoading: false,
        errorMessage: null,
        dataSource: "supabase",
      });
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Failed to load assembly data from Supabase", error);

      const errorMessage = error instanceof Error ? error.message : "Failed to load assembly data.";

      if (process.env.NODE_ENV === "development") {
        setProjects(mockProjects);
        setAssets([]);
        setCategories([]);
        setLoadState({
          isLoading: false,
          errorMessage,
          dataSource: "mock",
        });
        return;
      }

      setLoadState({
        isLoading: false,
        errorMessage,
        dataSource: "supabase",
      });
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const handleToggleTarget = (target: ProductionTarget, checked: boolean) => {
    setSelectedProductionTargets((prev) => {
      const newMap = new Map(prev);
      if (checked) newMap.set(target.id, target);
      else newMap.delete(target.id);
      return newMap;
    });
  };

  const handleToggleAsset = (id: string, checked: boolean) => {
    setSelectedAssetIds((prev) => {
      const newSet = new Set(prev);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  const handleToggleAllInCategory = (categoryAssets: Asset[], checked: boolean) => {
    setSelectedAssetIds((prev) => {
      const newSet = new Set(prev);
      categoryAssets.forEach((a) => {
        if (checked) newSet.add(a.id);
        else newSet.delete(a.id);
      });
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedProductionTargets(new Map());
    setSelectedAssetIds(new Set());
  };

  useEffect(() => {
    async function fetchAssociations() {
      if (selectedProductionTargets.size === 0) {
        setAssignedAssetIds(new Set());
        return;
      }
      try {
        const targetList = Array.from(selectedProductionTargets.values());
        const assigned = await loadAssociationsForTargets(targetList);
        setAssignedAssetIds(assigned);
      } catch (error) {
        console.error("Failed to load associations", error);
      }
    }
    void fetchAssociations();
  }, [selectedProductionTargets]);

  const handleAssignAssets = async () => {
    if (selectedAssetIds.size === 0 || selectedProductionTargets.size === 0) return;
    
    setIsAssociating(true);
    setAssociationMessage(null);
    try {
      const targetList = Array.from(selectedProductionTargets.values());
      const result = await assignAssetsToTargets(Array.from(selectedAssetIds), targetList);
      
      // Reload associations
      const assigned = await loadAssociationsForTargets(targetList);
      setAssignedAssetIds(assigned);

      // Trigger Google Drive folder movement
      try {
        await fetch("/api/google-drive/assets/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetIds: Array.from(selectedAssetIds) }),
        });
      } catch (err) {
        console.error("Failed to trigger asset folder movement", err);
      }
      
      setAssociationMessage({
        type: 'success',
        text: `${result.createdCount} new Asset associations created. ${result.skippedCount > 0 ? `${result.skippedCount} existing associations skipped.` : ''}`
      });
      setTimeout(() => setAssociationMessage(null), 5000);
    } catch {
      setAssociationMessage({
        type: 'error',
        text: "Unable to create Asset associations."
      });
    } finally {
      setIsAssociating(false);
    }
  };

  const handleRemoveAssociations = async () => {
    if (selectedAssetIds.size === 0 || selectedProductionTargets.size === 0) return;
    
    setIsAssociating(true);
    setAssociationMessage(null);
    try {
      const targetList = Array.from(selectedProductionTargets.values());
      const deletedCount = await removeAssetLinks(Array.from(selectedAssetIds), targetList);
      
      // Reload associations
      const assigned = await loadAssociationsForTargets(targetList);
      setAssignedAssetIds(assigned);

      // Trigger Google Drive folder movement — clear all links and move back to Global Library
      try {
        await fetch("/api/google-drive/assets/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetIds: Array.from(selectedAssetIds), removeAllLinks: true }),
        });
      } catch (err) {
        console.error("Failed to trigger asset folder movement on removal", err);
      }
      
      setAssociationMessage({
        type: 'success',
        text: `${deletedCount} Asset associations removed.`
      });
      setTimeout(() => setAssociationMessage(null), 5000);
    } catch {
      setAssociationMessage({
        type: 'error',
        text: "Unable to remove Asset associations."
      });
    } finally {
      setIsAssociating(false);
    }
  };

  return (
    <>
      {loadState.dataSource === "mock" && loadState.errorMessage && (
        <DevelopmentFallbackWarning
          errorMessage={loadState.errorMessage}
          onRetry={loadData}
        />
      )}

      {loadState.isLoading ? (
        <LoadingMessage message="Loading assembly data..." />
      ) : loadState.errorMessage && loadState.dataSource !== "mock" ? (
        <ErrorMessage message={loadState.errorMessage} onRetry={loadData} />
      ) : (
        <main className="flex min-h-0 flex-1 overflow-hidden">
          <AssetAssemblyLeftPanel
            projects={projects}
            selectedTargets={new Set(selectedProductionTargets.keys())}
            onToggleTarget={handleToggleTarget}
          />
          <AssetAssemblyRightPanel
            assets={assets}
            categories={categories}
            selectedProductionTargets={Array.from(selectedProductionTargets.values())}
            selectedAssetIds={selectedAssetIds}
            assignedAssetIds={assignedAssetIds}
            isAssociating={isAssociating}
            associationMessage={associationMessage}
            onToggleAsset={handleToggleAsset}
            onToggleAllInCategory={handleToggleAllInCategory}
            onClearSelection={handleClearSelection}
            onAssignAssets={handleAssignAssets}
            onRemoveAssociations={handleRemoveAssociations}
          />
        </main>
      )}
    </>
  );
}
