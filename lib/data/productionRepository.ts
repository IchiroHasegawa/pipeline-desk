import type {
  Episode,
  ProductionEnvironment,
  ProductionTask,
  Project,
  Scene,
  Asset,
  AssetCategory
} from "@/types/production";

import { createClient } from "@/lib/supabase/client";

type ProjectRecord = {
  id: string;
  title: string;
  project_code: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
};

type ProductionTaskRecord = {
  id: string;
  name: string;
  progress: number | null;
  status: ProductionTask["status"] | null;
  assignee: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number | null;
  created_at: string;
};

type SceneNoteRecord = {
  id: string;
  content: string;
  created_at: string;
};

type SceneRecord = {
  id: string;
  scene_name: string;
  description: string | null;
  preview_image: string | null;
  sort_order: number | null;
  status: string;
  workflow: string | null;
  number_of_frames: number;
  priority: number;
  production_tasks: ProductionTaskRecord[] | null;
  scene_notes: SceneNoteRecord[] | null;
  created_at: string;
};

type EpisodeRecord = {
  id: string;
  environment_id: string;
  episode_name: string;
  description: string | null;
  preview_image: string | null;
  code: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number | null;
  status: string;
  job_workflow: string | null;
  scene_workflow: string | null;
  scenes: SceneRecord[] | null;
  created_at: string;
};

type ProductionEnvironmentRecord = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  episodes: EpisodeRecord[] | null;
  created_at: string;
};

const productionEnvironmentSelect = `
  id,
  project_id,
  name,
  description,
  thumbnail_url,
  status,
  created_at,
  episodes (
    id,
    environment_id,
    episode_name,
    description,
    preview_image,
    code,
    start_date,
    end_date,
    sort_order,
    status,
    job_workflow,
    scene_workflow,
    created_at,
    scenes (
      id,
      scene_name,
      description,
      preview_image,
      sort_order,
      status,
      workflow,
      number_of_frames,
      priority,
      created_at,
      production_tasks (
        id,
        name,
        progress,
        status,
        assignee,
        start_date,
        end_date,
        sort_order,
        created_at
      ),
      scene_notes (
        id,
        content,
        created_at
      )
    )
  )
`;

function compareBySortOrderThenCreatedAt<T>(
  getSortOrder: (item: T) => number | null,
  getCreatedAt: (item: T) => string
) {
  return (first: T, second: T) => {
    const firstSortOrder = getSortOrder(first) ?? Number.MAX_SAFE_INTEGER;
    const secondSortOrder = getSortOrder(second) ?? Number.MAX_SAFE_INTEGER;

    if (firstSortOrder !== secondSortOrder) {
      return firstSortOrder - secondSortOrder;
    }

    return getCreatedAt(first).localeCompare(getCreatedAt(second));
  };
}

function mapProductionTask(record: ProductionTaskRecord): ProductionTask {
  return {
    id: record.id,
    name: record.name,
    progress: record.progress ?? 0,
    status: record.status ?? "Unassigned",
    assignee: record.assignee ?? "Unassigned",
    startDate: record.start_date ?? undefined,
    endDate: record.end_date ?? undefined,
    createdAt: record.created_at,
  };
}

function mapScene(record: SceneRecord): Scene {
  const notes = [...(record.scene_notes ?? [])].sort((first, second) =>
    first.created_at.localeCompare(second.created_at)
  );

  const tasks = [...(record.production_tasks ?? [])]
    .sort(
      compareBySortOrderThenCreatedAt(
        (task) => task.sort_order,
        (task) => task.created_at
      )
    )
    .map(mapProductionTask);

  return {
    id: record.id,
    sceneName: record.scene_name,
    previewImage: record.preview_image ?? "",
    description: record.description ?? undefined,
    note: notes.map((note) => note.content).join("\n\n"),
    status: record.status as "Active" | "Retired",
    workflow: record.workflow ?? undefined,
    numberOfFrames: record.number_of_frames,
    priority: record.priority,
    tasks,
    createdAt: record.created_at,
  };
}

function mapEpisode(record: EpisodeRecord): Episode {
  const scenes = [...(record.scenes ?? [])]
    .sort(
      compareBySortOrderThenCreatedAt(
        (scene) => scene.sort_order,
        (scene) => scene.created_at
      )
    )
    .map(mapScene);

  return {
    id: record.id,
    episodeName: record.episode_name,
    previewImage: record.preview_image ?? "",
    description: record.description ?? "",
    code: record.code ?? "",
    startDate: record.start_date ?? "",
    endDate: record.end_date ?? "",
    status: record.status as "Active" | "Retired",
    jobWorkflow: record.job_workflow ?? undefined,
    sceneWorkflow: record.scene_workflow ?? undefined,
    scenes,
    createdAt: record.created_at,
  };
}

function mapProductionEnvironment(
  record: ProductionEnvironmentRecord
): ProductionEnvironment {
  const episodes = [...(record.episodes ?? [])]
    .sort(
      compareBySortOrderThenCreatedAt(
        (episode) => episode.sort_order,
        (episode) => episode.created_at
      )
    )
    .map(mapEpisode);

  return {
    id: record.id,
    projectId: record.project_id,
    name: record.name,
    description: record.description ?? "",
    thumbnailUrl: record.thumbnail_url ?? "",
    status: record.status as "Active" | "Retired",
    episodes,
    createdAt: record.created_at,
  };
}

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      title,
      project_code,
      description,
      thumbnail_url,
      status,
      created_at,
      production_environments (
        ${productionEnvironmentSelect}
      )
    `)
    .order("created_at", { ascending: true })
    .returns<(ProjectRecord & { production_environments: ProductionEnvironmentRecord[] | null })[]>();

  if (error) {
    throw new Error(`Failed to load projects: ${error.message}`);
  }

  return (data ?? []).map((record) => {
    const environments = [...(record.production_environments ?? [])]
      .sort((first, second) => first.created_at.localeCompare(second.created_at))
      .map(mapProductionEnvironment);

    return {
      id: record.id,
      title: record.title,
      projectCode: record.project_code,
      description: record.description ?? "",
      thumbnailUrl: record.thumbnail_url ?? "",
      status: record.status as "Active" | "Retired",
      environments,
      createdAt: record.created_at,
    };
  });
}

export async function createProject(project: Omit<Project, 'id' | 'environments' | 'createdAt'>): Promise<Project> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: project.title,
      project_code: project.projectCode,
      description: project.description || null,
      thumbnail_url: project.thumbnailUrl || null,
      status: project.status,
    })
    .select(`
      id,
      title,
      project_code,
      description,
      thumbnail_url,
      status,
      created_at
    `)
    .single<ProjectRecord>();

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return {
    id: data.id,
    title: data.title,
    projectCode: data.project_code,
    description: data.description ?? "",
    thumbnailUrl: data.thumbnail_url ?? "",
    status: data.status as "Active" | "Retired",
    environments: [],
    createdAt: data.created_at,
  };
}

export async function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'environments'>>): Promise<void> {
  const supabase = createClient();
  const dbUpdates: {
    title?: string;
    project_code?: string;
    description?: string | null;
    thumbnail_url?: string | null;
    status?: string;
  } = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.projectCode !== undefined) dbUpdates.project_code = updates.projectCode;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl || null;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { error } = await supabase
    .from("projects")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }
}

export async function retireProject(id: string): Promise<void> {
  return updateProject(id, { status: "Retired" });
}

export async function restoreProject(id: string): Promise<void> {
  return updateProject(id, { status: "Active" });
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

export async function getProductionEnvironments(): Promise<
  ProductionEnvironment[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("production_environments")
    .select(productionEnvironmentSelect)
    .order("created_at", { ascending: true })
    .returns<ProductionEnvironmentRecord[]>();

  if (error) {
    throw new Error(`Failed to load production environments: ${error.message}`);
  }

  return (data ?? []).map(mapProductionEnvironment);
}

export async function getEnvironmentsByProject(projectId: string): Promise<ProductionEnvironment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("production_environments")
    .select(productionEnvironmentSelect)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })
    .returns<ProductionEnvironmentRecord[]>();

  if (error) {
    throw new Error(`Failed to load environments: ${error.message}`);
  }

  return (data ?? []).map(mapProductionEnvironment);
}

export async function createEnvironment(environment: Omit<ProductionEnvironment, 'id' | 'episodes' | 'createdAt'>): Promise<ProductionEnvironment> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("production_environments")
    .insert({
      project_id: environment.projectId,
      name: environment.name,
      description: environment.description || null,
      thumbnail_url: environment.thumbnailUrl || null,
      status: environment.status,
    })
    .select(`
      id,
      project_id,
      name,
      description,
      thumbnail_url,
      status,
      created_at
    `)
    .single<ProductionEnvironmentRecord>();

  if (error) {
    throw new Error(`Failed to create environment: ${error.message}`);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    name: data.name,
    description: data.description ?? "",
    thumbnailUrl: data.thumbnail_url ?? "",
    status: data.status as "Active" | "Retired",
    episodes: [],
    createdAt: data.created_at,
  };
}

export async function updateEnvironment(id: string, updates: Partial<Omit<ProductionEnvironment, 'id' | 'episodes' | 'projectId' | 'createdAt'>>): Promise<void> {
  const supabase = createClient();
  const dbUpdates: {
    name?: string;
    description?: string | null;
    thumbnail_url?: string | null;
    status?: string;
  } = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl || null;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { error } = await supabase
    .from("production_environments")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update environment: ${error.message}`);
  }
}

export async function retireEnvironment(id: string): Promise<void> {
  return updateEnvironment(id, { status: "Retired" });
}

export async function restoreEnvironment(id: string): Promise<void> {
  return updateEnvironment(id, { status: "Active" });
}

export async function deleteEnvironment(id: string): Promise<void> {
  const supabase = createClient();
  
  // Check if jobs/episodes exist
  const { count, error: countError } = await supabase
    .from("episodes")
    .select("*", { count: "exact", head: true })
    .eq("environment_id", id);
    
  if (countError) {
    throw new Error(`Failed to check environment jobs: ${countError.message}`);
  }
  
  if (count && count > 0) {
    throw new Error(`Cannot delete this environment because it contains ${count} job(s). You must retire, move, or delete them first.`);
  }

  const { error } = await supabase
    .from("production_environments")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete environment: ${error.message}`);
  }
}

export async function createJobs(environmentId: string, jobs: Omit<Episode, 'id' | 'scenes' | 'createdAt'>[]): Promise<void> {
  const supabase = createClient();
  
  const records = jobs.map((job) => ({
    environment_id: environmentId,
    episode_name: job.episodeName,
    description: job.description || null,
    preview_image: job.previewImage || null,
    code: job.code || null,
    start_date: job.startDate || null,
    end_date: job.endDate || null,
    status: job.status,
    job_workflow: job.jobWorkflow || null,
    scene_workflow: job.sceneWorkflow || null,
  }));

  const { error } = await supabase
    .from("episodes")
    .insert(records);

  if (error) {
    throw new Error(`Failed to create jobs: ${error.message}`);
  }
}

export async function updateJob(id: string, updates: Partial<Omit<Episode, 'id' | 'scenes'>>): Promise<void> {
  const supabase = createClient();
  
  const dbUpdates: {
    episode_name?: string;
    description?: string | null;
    preview_image?: string | null;
    code?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
    job_workflow?: string | null;
    scene_workflow?: string | null;
  } = {};
  
  if (updates.episodeName !== undefined) dbUpdates.episode_name = updates.episodeName;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.previewImage !== undefined) dbUpdates.preview_image = updates.previewImage || null;
  if (updates.code !== undefined) dbUpdates.code = updates.code || null;
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate || null;
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate || null;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.jobWorkflow !== undefined) dbUpdates.job_workflow = updates.jobWorkflow || null;
  if (updates.sceneWorkflow !== undefined) dbUpdates.scene_workflow = updates.sceneWorkflow || null;

  const { error } = await supabase
    .from("episodes")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update job: ${error.message}`);
  }
}

export async function retireJob(id: string): Promise<void> {
  return updateJob(id, { status: "Retired" });
}

export async function restoreJob(id: string): Promise<void> {
  return updateJob(id, { status: "Active" });
}

export async function deleteJob(id: string): Promise<void> {
  const supabase = createClient();
  
  // NOTE: Phase 4D will add scene checking here similar to how we check jobs for environment deletion.
  // For now, we allow deletion as jobs might be empty.
  
  const { count, error: countError } = await supabase
    .from("scenes")
    .select("*", { count: "exact", head: true })
    .eq("episode_id", id);
    
  if (countError) {
    throw new Error(`Failed to check job scenes: ${countError.message}`);
  }
  
  if (count && count > 0) {
    throw new Error(`Cannot delete this job because it contains ${count} scene(s).`);
  }

  const { error } = await supabase
    .from("episodes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete job: ${error.message}`);
  }
}

export async function createScenes(jobId: string, scenes: Omit<Scene, 'id' | 'tasks' | 'createdAt'>[]): Promise<void> {
  const supabase = createClient();
  
  const records = scenes.map((scene) => ({
    episode_id: jobId,
    scene_name: scene.sceneName,
    description: scene.description || null,
    preview_image: scene.previewImage || null,
    status: scene.status,
    workflow: scene.workflow || null,
    number_of_frames: scene.numberOfFrames,
    priority: scene.priority,
  }));

  const { error } = await supabase
    .from("scenes")
    .insert(records);

  if (error) {
    throw new Error(`Failed to create scenes: ${error.message}`);
  }
}

export async function updateScene(id: string, updates: Partial<Omit<Scene, 'id' | 'tasks'>>): Promise<void> {
  const supabase = createClient();
  
  const dbUpdates: {
    scene_name?: string;
    description?: string | null;
    preview_image?: string | null;
    status?: string;
    workflow?: string | null;
    number_of_frames?: number;
    priority?: number;
  } = {};
  
  if (updates.sceneName !== undefined) dbUpdates.scene_name = updates.sceneName;
  if (updates.description !== undefined) dbUpdates.description = updates.description || null;
  if (updates.previewImage !== undefined) dbUpdates.preview_image = updates.previewImage || null;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.workflow !== undefined) dbUpdates.workflow = updates.workflow || null;
  if (updates.numberOfFrames !== undefined) dbUpdates.number_of_frames = updates.numberOfFrames;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

  const { error } = await supabase
    .from("scenes")
    .update(dbUpdates)
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to update scene: ${error.message}`);
  }
}

export async function retireScene(id: string): Promise<void> {
  return updateScene(id, { status: "Retired" });
}

export async function restoreScene(id: string): Promise<void> {
  return updateScene(id, { status: "Active" });
}

export async function deleteScene(id: string): Promise<void> {
  const supabase = createClient();
  
  const { count, error: countError } = await supabase
    .from("production_tasks")
    .select("*", { count: "exact", head: true })
    .eq("scene_id", id);
    
  if (countError) {
    throw new Error(`Failed to check scene tasks: ${countError.message}`);
  }
  
  if (count && count > 0) {
    throw new Error(`Cannot delete this scene because it contains ${count} task(s).`);
  }

  const { error } = await supabase
    .from("scenes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete scene: ${error.message}`);
  }
}

export async function getAssets(): Promise<Asset[]> {
  // STUB
  return [];
}

export async function createAsset(_asset: Partial<Asset>): Promise<void> {
  // STUB
}

export async function getAssetCategories(): Promise<AssetCategory[]> {
  // STUB
  return [];
}

export async function createAssetCategory(name: string): Promise<AssetCategory> {
  // STUB
  return { id: 'temp', name, createdAt: new Date().toISOString() };
}


