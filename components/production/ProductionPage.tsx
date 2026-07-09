"use client";

import { useMemo, useState } from "react";

import TopNav from "@/components/layout/TopNav";
import { mockProductions } from "@/data/mockProductions";
import type { Episode } from "@/types/production";

import BottomTaskPanel from "./BottomTaskPanel";
import EnvironmentDropdown from "./EnvironmentDropdown";
import EpisodeDropdown from "./EpisodeDropdown";
import EpisodeTable from "./EpisodeTable";
import ProductionToolbar from "./ProductionToolbar";
import RightDetailsPanel from "./RightDetailsPanel";

export default function ProductionPage() {
  const [environments] = useState(mockProductions);

  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState(
    mockProductions[0]?.id ?? ""
  );

  // Controls whether the table shows ALL episodes or one selected episode.
  const [episodeFilterId, setEpisodeFilterId] = useState<"ALL" | string>(
    "ALL"
  );

  // Controls which episode is displayed in the right and bottom panels.
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(
    mockProductions[0]?.episodes[0]?.id ?? null
  );

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
    if (!selectedEnvironment) {
      return null;
    }

    return (
      selectedEnvironment.episodes.find(
        (episode) => episode.id === selectedEpisodeId
      ) ??
      selectedEnvironment.episodes[0] ??
      null
    );
  }, [selectedEnvironment, selectedEpisodeId]);

  function handleEnvironmentChange(environmentId: string) {
    const nextEnvironment = environments.find(
      (environment) => environment.id === environmentId
    );

    setSelectedEnvironmentId(environmentId);

    // Return to the complete episode overview.
    setEpisodeFilterId("ALL");

    // Select the first episode in the new environment.
    setSelectedEpisodeId(
      nextEnvironment?.episodes[0]?.id ?? null
    );
  }

  function handleEpisodeFilterChange(
    episodeId: "ALL" | string
  ) {
    setEpisodeFilterId(episodeId);

    if (episodeId !== "ALL") {
      setSelectedEpisodeId(episodeId);
      return;
    }

    const selectedEpisodeStillExists =
      selectedEnvironment?.episodes.some(
        (episode) => episode.id === selectedEpisodeId
      );

    if (!selectedEpisodeStillExists) {
      setSelectedEpisodeId(
        selectedEnvironment?.episodes[0]?.id ?? null
      );
    }
  }

  function handleSelectEpisode(episode: Episode) {
    setSelectedEpisodeId(episode.id);
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
          <label className="text-xs text-gray-400">
            Episode:
          </label>

          <EpisodeDropdown
            episodes={selectedEnvironment?.episodes ?? []}
            selectedEpisodeId={episodeFilterId}
            onChangeEpisode={handleEpisodeFilterChange}
          />
        </div>
      </div>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ProductionToolbar />

          {!selectedEnvironment ? (
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

          {selectedEpisode && (
            <BottomTaskPanel episode={selectedEpisode} />
          )}
        </section>

        {selectedEpisode && selectedEnvironment && (
          <RightDetailsPanel
            episode={selectedEpisode}
            environmentName={selectedEnvironment.name}
          />
        )}
      </main>
    </div>
  );
}

function EmptyMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-500">
      {message}
    </div>
  );
}