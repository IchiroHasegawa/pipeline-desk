"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import TopNav from "@/components/layout/TopNav";
import { mockProjects } from "@/data/mockProductions";
import { getProjects } from "@/lib/data/productionRepository";
import type { Episode, Project } from "@/types/production";

import BottomTaskPanel from "./BottomTaskPanel";
import EnvironmentDropdown from "./EnvironmentDropdown";
import EpisodeDropdown from "./EpisodeDropdown";
import EpisodeTable from "./EpisodeTable";
import ProductionToolbar from "./ProductionToolbar";
import ProjectDropdown from "./ProjectDropdown";
import RightDetailsPanel from "./RightDetailsPanel";
import EnvironmentSettings from "./EnvironmentSettings";
import EnvironmentForm from "./EnvironmentForm";
import JobSettings from "./JobSettings";
import SceneSettings from "./SceneSettings";
import SceneTable from "./SceneTable";
import { Settings } from "lucide-react";

type DataSource = "supabase" | "mock";

type LoadState = {
  isLoading: boolean;
  errorMessage: string | null;
  dataSource: DataSource;
};

const isDevelopment = process.env.NODE_ENV === "development";

export default function ProductionPage() {
  const isMountedRef = useRef(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
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
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const [isManagingEnvironments, setIsManagingEnvironments] = useState(false);
  const [isCreatingFirstEnvironment, setIsCreatingFirstEnvironment] = useState(false);
  const [isManagingJobs, setIsManagingJobs] = useState(false);
  const [isManagingScenes, setIsManagingScenes] = useState(false);

  const [loadState, setLoadState] = useState<LoadState>({
    isLoading: true,
    errorMessage: null,
    dataSource: "supabase",
  });

  const applyLoadedProjects = useCallback(
    (loadedProjects: Project[], dataSource: DataSource) => {
      const firstProject = loadedProjects[0];
      const firstEnvironment = firstProject?.environments[0] ?? null;
      const firstEpisode = firstEnvironment?.episodes[0] ?? null;

      setProjects(loadedProjects);
      setSelectedProjectId(firstProject?.id ?? "");
      setSelectedEnvironmentId(firstEnvironment?.id ?? "");
      setEpisodeFilterId("ALL");
      setSelectedEpisodeId(firstEpisode?.id ?? null);
      setSelectedSceneId(null);
      setIsManagingScenes(false);
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
      const loadedProjects = await getProjects();

      if (!isMountedRef.current) {
        return;
      }

      applyLoadedProjects(loadedProjects, "supabase");
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
        applyLoadedProjects(mockProjects, "mock");
        setLoadState({
          isLoading: false,
          errorMessage,
          dataSource: "mock",
        });
        return;
      }

      setProjects([]);
      setSelectedProjectId("");
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
  }, [applyLoadedProjects]);

  useEffect(() => {
    isMountedRef.current = true;

    async function loadInitialProductionData() {
      try {
        const loadedProjects = await getProjects();

        if (!isMountedRef.current) {
          return;
        }

        applyLoadedProjects(loadedProjects, "supabase");
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
          applyLoadedProjects(mockProjects, "mock");
          setLoadState({
            isLoading: false,
            errorMessage,
            dataSource: "mock",
          });
          return;
        }

        setProjects([]);
        setSelectedProjectId("");
        setSelectedEnvironmentId("");
        setEpisodeFilterId("ALL");
        setSelectedEpisodeId(null);
        setSelectedSceneId(null);
        setIsManagingScenes(false);
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
  }, [applyLoadedProjects]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === selectedProjectId) ?? projects[0];
  }, [projects, selectedProjectId]);

  const selectedEnvironment = useMemo(() => {
    if (!selectedProject) return null;
    return (
      selectedProject.environments.find(
        (environment) => environment.id === selectedEnvironmentId
      ) ?? selectedProject.environments[0]
    );
  }, [selectedProject, selectedEnvironmentId]);

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

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    
    // Automatically select the first environment of the new project
    const newProject = projects.find(p => p.id === projectId);
    const firstEnvironment = newProject?.environments[0];
    
    setSelectedEnvironmentId(firstEnvironment?.id ?? "");
    setEpisodeFilterId("ALL");
    setSelectedEpisodeId(null);
    setSelectedSceneId(null);
    setIsManagingEnvironments(false);
    setIsManagingJobs(false);
    setIsManagingScenes(false);
    setIsCreatingFirstEnvironment(false);
  }

  function handleEnvironmentChange(environmentId: string) {
    setSelectedEnvironmentId(environmentId);

    // Return to the complete job overview and clear detail selections.
    setEpisodeFilterId("ALL");
    setSelectedEpisodeId(null);
    setSelectedSceneId(null);
    setIsManagingJobs(false);
    setIsManagingScenes(false);
  }

  function handleEpisodeFilterChange(episodeId: "ALL" | string) {
    setEpisodeFilterId(episodeId);
    setSelectedSceneId(null);
    setIsManagingScenes(false);

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
        <ProjectDropdown
          projects={projects}
          selectedProjectId={selectedProjectId}
          onChangeProject={handleProjectChange}
        />

        <div className="flex items-center gap-1">
          <EnvironmentDropdown
            productions={selectedProject?.environments ?? []}
            selectedProductionId={selectedEnvironmentId}
            onChangeProduction={handleEnvironmentChange}
          />
          {selectedProject && (
            <button 
              onClick={() => setIsManagingEnvironments(true)}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors ml-1"
              title="Manage Environments"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Job:</label>

          <EpisodeDropdown
            episodes={selectedEnvironment?.episodes ?? []}
            selectedEpisodeId={episodeFilterId}
            onChangeEpisode={handleEpisodeFilterChange}
          />
          {selectedEnvironment && episodeFilterId === "ALL" && (
            <button 
              onClick={() => setIsManagingJobs(true)}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors ml-1"
              title="Manage Jobs"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          {selectedEpisode && (
            <button 
              onClick={() => setIsManagingScenes(true)}
              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors ml-1"
              title="Manage Scenes"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
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

          {isManagingEnvironments && selectedProject ? (
            <EnvironmentSettings
              projectId={selectedProject.id}
              projectName={selectedProject.title}
              onClose={() => {
                setIsManagingEnvironments(false);
                void loadProductionData();
              }}
            />
          ) : isManagingJobs && selectedEnvironment ? (
            <JobSettings
              environment={selectedEnvironment}
              onSelectJob={(job) => {
                handleEpisodeFilterChange(job.id);
                setIsManagingJobs(false);
              }}
              onClose={() => setIsManagingJobs(false)}
              onRefresh={loadProductionData}
            />
          ) : isManagingScenes && selectedEpisode ? (
            <SceneSettings
              job={selectedEpisode}
              onClose={() => setIsManagingScenes(false)}
              onRefresh={loadProductionData}
            />
          ) : loadState.isLoading ? (
            <LoadingMessage />
          ) : loadState.errorMessage && loadState.dataSource !== "mock" ? (
            <ErrorMessage
              message="Production data could not be loaded from Supabase."
              onRetry={loadProductionData}
            />
          ) : !selectedEnvironment ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-sm text-zinc-500">
              <p>No production environment is available.</p>
              <button
                onClick={() => setIsCreatingFirstEnvironment(true)}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500"
              >
                Create Environment
              </button>
            </div>
          ) : displayedEpisodes.length === 0 ? (
            <EmptyMessage message="No jobs are available in this environment." />
          ) : selectedEpisode ? (
            <SceneTable
              scenes={selectedEpisode.scenes}
              selectedSceneId={selectedSceneId}
              onSelectScene={(scene) => setSelectedSceneId(scene.id)}
            />
          ) : (
            <EpisodeTable
              episodes={displayedEpisodes}
              selectedEpisodeId={null}
              onSelectEpisode={handleSelectEpisode}
            />
          )}

          {selectedEpisode && !loadState.isLoading && !isManagingEnvironments && !isManagingJobs && !isManagingScenes && (
            <BottomTaskPanel episode={selectedEpisode} />
          )}
        </section>

        {selectedEpisode && selectedEnvironment && !loadState.isLoading && !isManagingEnvironments && !isManagingJobs && !isManagingScenes && (
          <RightDetailsPanel
            episode={selectedEpisode}
            environmentName={selectedEnvironment.name}
          />
        )}
      </main>

      {isCreatingFirstEnvironment && selectedProject && (
        <EnvironmentForm
          projectId={selectedProject.id}
          environment={null}
          onClose={() => {
            setIsCreatingFirstEnvironment(false);
            void loadProductionData();
          }}
        />
      )}
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



