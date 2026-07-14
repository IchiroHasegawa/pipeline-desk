"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import TopNav from "@/components/layout/TopNav";
import ManageDialog from "@/components/shared/ManageDialog";
import { DevelopmentFallbackWarning, LoadingMessage, ErrorMessage } from "@/components/ui/LoadingState";
import { mockProjects } from "@/data/mockProductions";
import { getProjects } from "@/lib/data/productionRepository";
import type { Project, ProductionEnvironment, Episode, Scene } from "@/types/production";

import BottomTaskPanel from "./BottomTaskPanel";
import EnvironmentDropdown from "./EnvironmentDropdown";
import EnvironmentForm from "./EnvironmentForm";
import EnvironmentTable from "./EnvironmentTable";
import EpisodeDropdown from "./EpisodeDropdown";
import EpisodeTable from "./EpisodeTable";
import JobForm from "./JobForm";
import ProductionToolbar from "./ProductionToolbar";
import ProjectDropdown from "./ProjectDropdown";
import ProjectForm from "./ProjectForm";
import ProjectTable from "./ProjectTable";
import RightDetailsPanel from "./RightDetailsPanel";
import SceneForm from "./SceneForm";
import SceneTable from "./SceneTable";
import type { ProductionRowItem } from "./productionTableUtils";

type DataSource = "supabase" | "mock";
type ViewLevel = "PROJECT" | "ENVIRONMENT" | "JOB" | "SCENE";
type ActiveSelection = { type: ProductionRowItem["type"]; id: string } | null;

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
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>(null);

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingEnvironment, setIsAddingEnvironment] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<ProductionEnvironment | null>(null);
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [editingJob, setEditingJob] = useState<Episode | null>(null);
  const [isAddingScene, setIsAddingScene] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  const [loadState, setLoadState] = useState<LoadState>({
    isLoading: true,
    errorMessage: null,
    dataSource: "supabase",
  });

  const applyLoadedProjects = useCallback((loadedProjects: Project[], dataSource: DataSource) => {
    setProjects(loadedProjects);
    setLoadState({ isLoading: false, errorMessage: null, dataSource });
  }, []);

  const loadProductionData = useCallback(async () => {
    await Promise.resolve();
    if (!isMountedRef.current) return;

    setLoadState((current) => ({ ...current, isLoading: true, errorMessage: null }));

    try {
      const loadedProjects = await getProjects();
      if (!isMountedRef.current) return;
      applyLoadedProjects(loadedProjects, "supabase");
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Failed to load production data from Supabase", error);

      const errorMessage = error instanceof Error ? error.message : "Production data could not be loaded from Supabase.";

      if (isDevelopment) {
        applyLoadedProjects(mockProjects, "mock");
        setLoadState({ isLoading: false, errorMessage, dataSource: "mock" });
        return;
      }

      setProjects([]);
      setLoadState({ isLoading: false, errorMessage, dataSource: "supabase" });
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
    return selectedProject.environments.find((environment) => environment.id === selectedEnvironmentId) ?? null;
  }, [selectedProject, selectedEnvironmentId]);

  const displayedEpisodes = useMemo(() => {
    if (!selectedEnvironment) return [];
    if (episodeFilterId === "ALL") return selectedEnvironment.episodes;
    return selectedEnvironment.episodes.filter((episode) => episode.id === episodeFilterId);
  }, [selectedEnvironment, episodeFilterId]);

  const selectedEpisode = useMemo(() => {
    if (!selectedEnvironment || episodeFilterId === "ALL") return null;
    return selectedEnvironment.episodes.find((episode) => episode.id === episodeFilterId) ?? null;
  }, [selectedEnvironment, episodeFilterId]);

  const viewLevel: ViewLevel =
    selectedProjectId === "ALL" ? "PROJECT" :
    selectedEnvironmentId === "ALL" ? "ENVIRONMENT" :
    episodeFilterId === "ALL" ? "JOB" : "SCENE";

  const detailSelection: ProductionRowItem | null = (() => {
    if (!activeSelection) return null;

    if (activeSelection.type === "project") {
      const project = projects.find((item) => item.id === activeSelection.id);
      return project ? { type: "project", item: project } : null;
    }

    const project = projects.find((item) =>
      item.environments.some((environment) => {
        if (activeSelection.type === "environment" && environment.id === activeSelection.id) return true;
        return environment.episodes.some((episode) => {
          if (activeSelection.type === "job" && episode.id === activeSelection.id) return true;
          return episode.scenes.some((scene) => activeSelection.type === "scene" && scene.id === activeSelection.id);
        });
      })
    );

    if (!project) return null;

    for (const environment of project.environments) {
      if (activeSelection.type === "environment" && environment.id === activeSelection.id) {
        return { type: "environment", item: environment };
      }

      for (const episode of environment.episodes) {
        if (activeSelection.type === "job" && episode.id === activeSelection.id) {
          return { type: "job", item: episode };
        }

        const scene = episode.scenes.find((item) => activeSelection.type === "scene" && item.id === activeSelection.id);
        if (scene) return { type: "scene", item: scene };
      }
    }

    return null;
  })();

  function handleProjectChange(projectId: string) {
    setSelectedProjectId(projectId);
    setSelectedEnvironmentId("ALL");
    setEpisodeFilterId("ALL");
    setActiveSelection(null);
  }

  function handleEnvironmentChange(environmentId: string) {
    setSelectedEnvironmentId(environmentId);
    setEpisodeFilterId("ALL");
    setActiveSelection(null);
  }

  function handleEpisodeFilterChange(episodeId: "ALL" | string) {
    setEpisodeFilterId(episodeId);
    setActiveSelection(null);
  }

  function handleAdd() {
    if (viewLevel === "PROJECT") setIsAddingProject(true);
    else if (viewLevel === "ENVIRONMENT") setIsAddingEnvironment(true);
    else if (viewLevel === "JOB") setIsAddingJob(true);
    else if (viewLevel === "SCENE") setIsAddingScene(true);
  }

  function refreshWithoutDrillIn() {
    void loadProductionData();
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#0a0a0a] text-[#e0e0e0]">
      <TopNav />

      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-[#2a2a2a] bg-zinc-900 px-4 py-2">
        <ProjectDropdown projects={projects} selectedProjectId={selectedProjectId} onChangeProject={handleProjectChange} />

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
        <DevelopmentFallbackWarning errorMessage={loadState.errorMessage} onRetry={loadProductionData} />
      )}

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <ProductionToolbar viewLevel={viewLevel} onAdd={handleAdd} onManage={() => setIsManageDialogOpen(true)} />

          {loadState.isLoading ? (
            <LoadingMessage />
          ) : loadState.errorMessage && loadState.dataSource !== "mock" ? (
            <ErrorMessage message="Production data could not be loaded from Supabase." onRetry={loadProductionData} />
          ) : viewLevel === "PROJECT" ? (
            <ProjectTable
              projects={projects}
              selectedProjectId={detailSelection?.type === "project" ? detailSelection.item.id : null}
              onSelectProject={(project) => setActiveSelection({ type: "project", id: project.id })}
              onOpenProject={(project) => handleProjectChange(project.id)}
            />
          ) : viewLevel === "ENVIRONMENT" && selectedProject ? (
            <EnvironmentTable
              environments={selectedProject.environments}
              selectedEnvironmentId={detailSelection?.type === "environment" ? detailSelection.item.id : null}
              onSelectEnvironment={(environment) => setActiveSelection({ type: "environment", id: environment.id })}
              onOpenEnvironment={(environment) => handleEnvironmentChange(environment.id)}
            />
          ) : viewLevel === "JOB" && selectedEnvironment ? (
            <EpisodeTable
              episodes={displayedEpisodes}
              selectedEpisodeId={detailSelection?.type === "job" ? detailSelection.item.id : null}
              onSelectEpisode={(episode) => setActiveSelection({ type: "job", id: episode.id })}
              onOpenEpisode={(episode) => handleEpisodeFilterChange(episode.id)}
            />
          ) : viewLevel === "SCENE" && selectedEpisode ? (
            <SceneTable
              scenes={selectedEpisode.scenes}
              selectedSceneId={detailSelection?.type === "scene" ? detailSelection.item.id : null}
              onSelectScene={(scene) => setActiveSelection({ type: "scene", id: scene.id })}
            />
          ) : null}

          {!loadState.isLoading && <BottomTaskPanel selection={detailSelection} />}
        </section>

        {!loadState.isLoading && <RightDetailsPanel selection={detailSelection} />}
      </main>

      {(isAddingProject || editingProject) && (
        <ProjectForm project={editingProject} onClose={() => { setIsAddingProject(false); setEditingProject(null); refreshWithoutDrillIn(); }} />
      )}

      {(isAddingEnvironment || editingEnvironment) && selectedProject && (
        <EnvironmentForm projectId={selectedProject.id} environment={editingEnvironment} onClose={() => { setIsAddingEnvironment(false); setEditingEnvironment(null); refreshWithoutDrillIn(); }} />
      )}

      {(isAddingJob || editingJob) && selectedEnvironment && (
        <JobForm environmentId={selectedEnvironment.id} job={editingJob} onClose={() => { setIsAddingJob(false); setEditingJob(null); refreshWithoutDrillIn(); }} />
      )}

      {(isAddingScene || editingScene) && selectedEpisode && (
        <SceneForm jobId={selectedEpisode.id} scene={editingScene} onClose={() => { setIsAddingScene(false); setEditingScene(null); refreshWithoutDrillIn(); }} />
      )}

      {isManageDialogOpen && (
        <ManageDialog
          isHidden={!!editingProject || !!editingEnvironment || !!editingJob || !!editingScene || isAddingProject || isAddingEnvironment || isAddingJob || isAddingScene}
          isOpen={isManageDialogOpen}
          onClose={() => setIsManageDialogOpen(false)}
          title={`Manage ${viewLevel === "PROJECT" ? "Projects" : viewLevel === "ENVIRONMENT" ? "Environments" : viewLevel === "JOB" ? "Jobs" : "Scenes"}`}
          items={
            viewLevel === "PROJECT" ? projects :
            viewLevel === "ENVIRONMENT" ? (selectedProject?.environments ?? []) :
            viewLevel === "JOB" ? displayedEpisodes :
            (selectedEpisode?.scenes ?? [])
          }
          onRefresh={loadProductionData}
          entityType={
            viewLevel === "PROJECT" ? "Project" :
            viewLevel === "ENVIRONMENT" ? "Environment" :
            viewLevel === "JOB" ? "Job" : "Scene"
          }
          onEdit={(item: any) => {
            if (viewLevel === "PROJECT") setEditingProject(item);
            else if (viewLevel === "ENVIRONMENT") setEditingEnvironment(item);
            else if (viewLevel === "JOB") setEditingJob(item);
            else if (viewLevel === "SCENE") setEditingScene(item);
          }}
        />
      )}
    </div>
  );
}

