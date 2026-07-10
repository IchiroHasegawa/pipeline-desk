"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import TopNav from "@/components/layout/TopNav";
import { mockProductions } from "@/data/mockProductions";
import { getProductionEnvironments } from "@/lib/data/productionRepository";
import type { Episode, ProductionEnvironment } from "@/types/production";

import BottomTaskPanel from "./BottomTaskPanel";
import EnvironmentDropdown from "./EnvironmentDropdown";
import EpisodeDropdown from "./EpisodeDropdown";
import EpisodeTable from "./EpisodeTable";
import ProductionToolbar from "./ProductionToolbar";
import RightDetailsPanel from "./RightDetailsPanel";

type DataSource = "supabase" | "mock";

type LoadState = {
  isLoading: boolean;
  errorMessage: string | null;
  dataSource: DataSource;
};

const isDevelopment = process.env.NODE_ENV === "development";

export default function ProductionPage() {
  const isMountedRef = useRef(true);
  const [environments, setEnvironments] = useState<ProductionEnvironment[]>([]);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("");

  // Controls whether the table shows ALL episodes or one selected episode.
  const [episodeFilterId, setEpisodeFilterId] = useState<"ALL" | string>(
    "ALL"
  );

  // Controls which episode is displayed in the right and bottom panels.
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(
    null
  );

  // Reserved for scene selection; Phase 3B only preserves clearing behavior.
  const [, setSelectedSceneId] = useState<string | null>(null);

  const [loadState, setLoadState] = useState<LoadState>({
    isLoading: true,
    errorMessage: null,
    dataSource: "supabase",
  });

  const applyLoadedEnvironments = useCallback(
    (loadedEnvironments: ProductionEnvironment[], dataSource: DataSource) => {
      const firstEnvironment = loadedEnvironments[0];
      const firstEpisode = firstEnvironment?.episodes[0] ?? null;

      setEnvironments(loadedEnvironments);
      setSelectedEnvironmentId(firstEnvironment?.id ?? "");
      setEpisodeFilterId("ALL");
      setSelectedEpisodeId(firstEpisode?.id ?? null);
      setSelectedSceneId(null);
      setLoadState({
        isLoading: false,
        errorMessage: null,
        dataSource,
      });
    },
    []
  );

  const loadProductionData = useCallback(async () => {
    await Promise.resolve();

    if (!isMountedRef.current) {
      return;
    }

    setLoadState((current) => ({
      ...current,
      isLoading: true,
      errorMessage: null,
    }));

    try {
      const loadedEnvironments = await getProductionEnvironments();

      if (!isMountedRef.current) {
        return;
      }

      applyLoadedEnvironments(loadedEnvironments, "supabase");
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      console.error("Failed to load production data from Supabase", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Production data could not be loaded from Supabase.";

      if (isDevelopment) {
        applyLoadedEnvironments(mockProductions, "mock");
        setLoadState({
          isLoading: false,
          errorMessage,
          dataSource: "mock",
        });
        return;
      }

      setEnvironments([]);
      setSelectedEnvironmentId("");
      setEpisodeFilterId("ALL");
      setSelectedEpisodeId(null);
      setSelectedSceneId(null);
      setLoadState({
        isLoading: false,
        errorMessage,
        dataSource: "supabase",
      });
    }
  }, [applyLoadedEnvironments]);

  useEffect(() => {
    isMountedRef.current = true;

    async function loadInitialProductionData() {
      try {
        const loadedEnvironments = await getProductionEnvironments();

        if (!isMountedRef.current) {
          return;
        }

        applyLoadedEnvironments(loadedEnvironments, "supabase");
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        console.error("Failed to load production data from Supabase", error);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Production data could not be loaded from Supabase.";

        if (isDevelopment) {
          applyLoadedEnvironments(mockProductions, "mock");
          setLoadState({
            isLoading: false,
            errorMessage,
            dataSource: "mock",
          });
          return;
        }

        setEnvironments([]);
        setSelectedEnvironmentId("");
        setEpisodeFilterId("ALL");
        setSelectedEpisodeId(null);
        setSelectedSceneId(null);
        setLoadState({
          isLoading: false,
          errorMessage,
          dataSource: "supabase",
        });
      }
    }

    void loadInitialProductionData();

    return () => {
      isMountedRef.current = false;
    };
  }, [applyLoadedEnvironments]);

  const selectedEnvironment = useMemo(() => {
    return (
      environments.find(
        (environment) => environment.id === selectedEnvironmentId
      ) ?? environments[0]
    );
  }, [environments, selectedEnvironmentId]);

  const displayedEpisodes = useMemo(() => {
    if (!selectedEnvironment) {
      return [];
    }

    if (episodeFilterId === "ALL") {
      return selectedEnvironment.episodes;
    }

    return selectedEnvironment.episodes.filter(
      (episode) => episode.id === episodeFilterId
    );
  }, [selectedEnvironment, episodeFilterId]);

  const selectedEpisode = useMemo(() => {
    if (!selectedEnvironment || selectedEpisodeId === null) {
      return null;
    }

    return (
      selectedEnvironment.episodes.find(
        (episode) => episode.id === selectedEpisodeId
      ) ?? null
    );
  }, [selectedEnvironment, selectedEpisodeId]);

  function handleEnvironmentChange(environmentId: string) {
    setSelectedEnvironmentId(environmentId);

    // Return to the complete episode overview and clear detail selections.
    setEpisodeFilterId("ALL");
    setSelectedEpisodeId(null);
    setSelectedSceneId(null);
  }

  function handleEpisodeFilterChange(episodeId: "ALL" | string) {
    setEpisodeFilterId(episodeId);
    setSelectedSceneId(null);

    if (episodeId !== "ALL") {
      setSelectedEpisodeId(episodeId);
      return;
    }

    setSelectedEpisodeId(null);
  }

  function handleSelectEpisode(episode: Episode) {
    setSelectedEpisodeId(episode.id);
    setSelectedSceneId(null);
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#0a0a0a] text-[#e0e0e0]">
      <TopNav />

      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-[#2a2a2a] bg-zinc-900 px-4 py-2">
        <EnvironmentDropdown
          productions={environments}
          selectedProductionId={selectedEnvironmentId}
          onChangeProduction={handleEnvironmentChange}
        />

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Episode:</label>

          <EpisodeDropdown
            episodes={selectedEnvironment?.episodes ?? []}
            selectedEpisodeId={episodeFilterId}
            onChangeEpisode={handleEpisodeFilterChange}
          />
        </div>
      </div>

      {loadState.dataSource === "mock" && loadState.errorMessage && (
        <DevelopmentFallbackWarning
          errorMessage={loadState.errorMessage}
          onRetry={loadProductionData}
        />
      )}

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ProductionToolbar />

          {loadState.isLoading ? (
            <LoadingMessage />
          ) : loadState.errorMessage && loadState.dataSource !== "mock" ? (
            <ErrorMessage
              message="Production data could not be loaded from Supabase."
              onRetry={loadProductionData}
            />
          ) : !selectedEnvironment ? (
            <EmptyMessage message="No production environment is available." />
          ) : displayedEpisodes.length === 0 ? (
            <EmptyMessage message="No episodes are available in this environment." />
          ) : (
            <EpisodeTable
              episodes={displayedEpisodes}
              selectedEpisodeId={selectedEpisode?.id ?? null}
              onSelectEpisode={handleSelectEpisode}
            />
          )}

          {selectedEpisode && !loadState.isLoading && (
            <BottomTaskPanel episode={selectedEpisode} />
          )}
        </section>

        {selectedEpisode && selectedEnvironment && !loadState.isLoading && (
          <RightDetailsPanel
            episode={selectedEpisode}
            environmentName={selectedEnvironment.name}
          />
        )}
      </main>
    </div>
  );
}

function DevelopmentFallbackWarning({
  errorMessage,
  onRetry,
}: {
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-100">
      <span>
        Development warning: Supabase data failed to load. Mock production data
        is being displayed.
      </span>
      <button
        onClick={onRetry}
        className="rounded border border-yellow-500/40 px-2 py-1 font-bold text-yellow-50 transition-colors hover:bg-yellow-500/20"
        title={errorMessage}
      >
        Retry
      </button>
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-4">
      <div className="rounded border border-[#2a2a2a] bg-[#121212] px-4 py-3 text-sm text-zinc-300">
        Loading production data from Supabase...
      </div>
    </div>
  );
}

function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-4">
      <div className="space-y-3 rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
        <p>{message}</p>
        <button
          onClick={onRetry}
          className="rounded border border-red-400/40 px-3 py-1 text-xs font-bold transition-colors hover:bg-red-500/20"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-500">
      {message}
    </div>
  );
}



