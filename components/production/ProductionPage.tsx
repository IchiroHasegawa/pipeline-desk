"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import TopNav from "@/components/layout/TopNav";
import { mockProjects } from "@/data/mockProductions";
import { getProjects } from "@/lib/data/productionRepository";
import type { Project } from "@/types/production";

import BottomTaskPanel from "./BottomTaskPanel";
import EnvironmentDropdown from "./EnvironmentDropdown";
import EpisodeDropdown from "./EpisodeDropdown";
import EpisodeTable from "./EpisodeTable";
import ProductionToolbar from "./ProductionToolbar";
import ProjectDropdown from "./ProjectDropdown";
import RightDetailsPanel from "./RightDetailsPanel";
import EnvironmentForm from "./EnvironmentForm";
import JobForm from "./JobForm";
import SceneForm from "./SceneForm";
import ProjectForm from "./ProjectForm";
import SceneTable from "./SceneTable";
import ProjectTable from "./ProjectTable";
import EnvironmentTable from "./EnvironmentTable";

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
  
  const [selectedProjectId, setSelectedProjectId] = useState("ALL");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("ALL");
  const [episodeFilterId, setEpisodeFilterId] = useState<"ALL" | string>("ALL");
  
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingEnvironment, setIsAddingEnvironment] = useState(false);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isAddingScene, setIsAddingScene] = useState(false);

  const [loadState, setLoadState] = useState<LoadState>({
    isLoading: true,
    errorMessage: null,
    dataSource: "supabase",
  });

  const applyLoadedProjects = useCallback(
    (loadedProjects: Project[], dataSource: DataSource) => {
      setProjects(loadedProjects);
      setSelectedProjectId("ALL");
      setSelectedEnvironmentId("ALL");
      setEpisodeFilterId("ALL");
      setSelectedEpisodeId(null);
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
    if (!isMountedRef.current) return;

    setLoadState((current) => ({
      ...current,
      isLoading: true,
      errorMessage: null,
    }));

    try {
      const loadedProjects = await getProjects();
      if (!isMountedRef.current) return;
      applyLoadedProjects(loadedProjects, "supabase");
    } catch (error) {
      if (!isMountedRef.current) return;
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
      setSelectedProjectId("ALL");
      setSelectedEnvironmentId("ALL");
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProductionData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadProductionData]);

  const selectedProject = useMemo(() => {
    if (selectedProjectId === "ALL") return null;
    return projects.find((project) => project.id === selectedProjectId) ?? null;
  }, [projects, selectedProjectId]);

  const selectedEnvironment = useMemo(() => {
    if (!selectedProject || selectedEnvironmentId === "ALL") return null;
    return selectedProject.environments.find(
      (environment) => environment.id === selectedEnvironmentId
    ) ?? null;
  }, [selectedProject, selectedEnvironmentId]);

  const displayedEpisodes = useMemo(() => {
    if (!selectedEnvironment) return [];
    if (episodeFilterId === "ALL") return selectedEnvironment.episodes;
    return selectedEnvironment.episodes.filter(
      (episode) => episode.id === episodeFilterId
    );
  }, [selectedEnvironment, episodeFilterId]);

  const selectedEpisode = useMemo(() => {
    if (!selectedEnvironment || selectedEpisodeId === null) return null;
    return selectedEnvironment.episodes.find(
      (episode) => episode.id === selectedEpisodeId
    ) ?? null;
  }, [selectedEnvironment, selectedEpisodeId]);

  const viewLevel = 
    selectedProjectId === "ALL" ? "PROJECT" :
    selectedEnvironmentId === "ALL" ? "ENVIRONMENT" :
    episodeFilterId === "ALL" ? "JOB" : "SCENE";

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    setSelectedEnvironmentId("ALL");
    setEpisodeFilterId("ALL");
    setSelectedEpisodeId(null);
    setSelectedSceneId(null);
  }

  function handleEnvironmentChange(environmentId: string) {
    setSelectedEnvironmentId(environmentId);
    setEpisodeFilterId("ALL");
    setSelectedEpisodeId(null);
    setSelectedSceneId(null);
  }

  function handleEpisodeFilterChange(episodeId: "ALL" | string) {
    setEpisodeFilterId(episodeId);
    setSelectedSceneId(null);
    if (episodeId !== "ALL") {
      setSelectedEpisodeId(episodeId);
    } else {
      setSelectedEpisodeId(null);
    }
  }
  
  function handleAdd() {
    if (viewLevel === "PROJECT") {
      setIsAddingProject(true);
    } else if (viewLevel === "ENVIRONMENT") {
      setIsAddingEnvironment(true);
    } else if (viewLevel === "JOB") {
      setIsAddingJob(true);
    } else if (viewLevel === "SCENE") {
      setIsAddingScene(true);
    }
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

        {viewLevel !== "PROJECT" && (
          <div className="flex items-center gap-1">
            <EnvironmentDropdown
              productions={selectedProject?.environments ?? []}
              selectedProductionId={selectedEnvironmentId}
              onChangeProduction={handleEnvironmentChange}
            />
          </div>
        )}

        {(viewLevel === "JOB" || viewLevel === "SCENE") && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Job:</label>
            <EpisodeDropdown
              episodes={selectedEnvironment?.episodes ?? []}
              selectedEpisodeId={episodeFilterId}
              onChangeEpisode={handleEpisodeFilterChange}
            />
          </div>
        )}
      </div>

      {loadState.dataSource === "mock" && loadState.errorMessage && (
        <DevelopmentFallbackWarning
          errorMessage={loadState.errorMessage}
          onRetry={loadProductionData}
        />
      )}

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ProductionToolbar viewLevel={viewLevel} onAdd={handleAdd} />

          {loadState.isLoading ? (
            <LoadingMessage />
          ) : loadState.errorMessage && loadState.dataSource !== "mock" ? (
            <ErrorMessage
              message="Production data could not be loaded from Supabase."
              onRetry={loadProductionData}
            />
          ) : viewLevel === "PROJECT" ? (
            <ProjectTable 
              projects={projects}
              selectedProjectId={null}
              onSelectProject={(p) => handleProjectChange(p.id)}
            />
          ) : viewLevel === "ENVIRONMENT" && selectedProject ? (
            <EnvironmentTable
              environments={selectedProject.environments}
              selectedEnvironmentId={null}
              onSelectEnvironment={(env) => handleEnvironmentChange(env.id)}
            />
          ) : viewLevel === "JOB" && selectedEnvironment ? (
            <EpisodeTable
              episodes={displayedEpisodes}
              selectedEpisodeId={null}
              onSelectEpisode={(ep) => handleEpisodeFilterChange(ep.id)}
            />
          ) : viewLevel === "SCENE" && selectedEpisode ? (
            <SceneTable
              scenes={selectedEpisode.scenes}
              selectedSceneId={selectedSceneId}
              onSelectScene={(scene) => setSelectedSceneId(scene.id)}
            />
          ) : null}

          {viewLevel === "SCENE" && selectedEpisode && !loadState.isLoading && (
            <BottomTaskPanel episode={selectedEpisode} />
          )}
        </section>

        {viewLevel === "SCENE" && selectedEpisode && selectedEnvironment && !loadState.isLoading && (
          <RightDetailsPanel
            episode={selectedEpisode}
            environmentName={selectedEnvironment.name}
          />
        )}
      </main>

      {isAddingProject && (
        <ProjectForm
          project={null}
          onClose={() => {
            setIsAddingProject(false);
            void loadProductionData();
          }}
        />
      )}

      {isAddingEnvironment && selectedProject && (
        <EnvironmentForm
          projectId={selectedProject.id}
          environment={null}
          onClose={() => {
            setIsAddingEnvironment(false);
            void loadProductionData();
          }}
        />
      )}
      
      {isAddingJob && selectedEnvironment && (
        <JobForm
          environmentId={selectedEnvironment.id}
          job={null}
          onClose={() => {
            setIsAddingJob(false);
            void loadProductionData();
          }}
        />
      )}
      
      {isAddingScene && selectedEpisode && (
        <SceneForm
          jobId={selectedEpisode.id}
          scene={null}
          onClose={() => {
            setIsAddingScene(false);
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
