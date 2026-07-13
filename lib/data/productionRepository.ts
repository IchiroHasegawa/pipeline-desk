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
  
  const { error: envError } = await supabase
    .from("production_environments")
    .delete()
    .eq("project_id", id);
    
  if (envError) {
    throw new Error(`Failed to cascade delete environments: ${envError.message}`);
  }

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

  const { error } = await supabase
    .from("production_environments")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete environment: ${error.message}`);
  }
}

export async function createJobs(environmentId: string, jobs: Omit<Episode, 'id' | 'scenes' | 'createdAt'>[]): Promise<string[]> {
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

  const { data, error } = await supabase
    .from("episodes")
    .insert(records)
    .select("id");

  if (error) {
    throw new Error(`Failed to create jobs: ${error.message}`);
  }
  
  return data?.map(d => d.id) || [];
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

  const { error } = await supabase
    .from("episodes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete job: ${error.message}`);
  }
}

export async function createScenes(jobId: string, scenes: Omit<Scene, 'id' | 'tasks' | 'createdAt'>[]): Promise<string[]> {
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

  const { data, error } = await supabase
    .from("scenes")
    .insert(records)
    .select("id");

  if (error) {
    throw new Error(`Failed to create scenes: ${error.message}`);
  }
  
  return data?.map(d => d.id) || [];
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

  const { error } = await supabase
    .from("scenes")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete scene: ${error.message}`);
  }
}

type AssetCategoryRecord = {
  id: string;
  name: string;
  created_at: string;
};

type AssetFileRecord = {
  id: string;
  asset_id: string;
  file_name: string;
  file_url: string;
  file_format: string;
  file_size_bytes: number;
  provider: string | null;
  drive_file_id: string | null;
  drive_parent_folder_id: string | null;
  original_file_name: string | null;
  extension: string | null;
  mime_type: string | null;
  file_role: string | null;
  version_number: number | null;
  drive_created_time: string | null;
  upload_status: string | null;
  source_file_id: string | null;
  created_at: string;
  updated_at: string | null;
};

type AssetRecord = {
  id: string;
  asset_name: string;
  asset_code: string;
  description: string | null;
  priority: number | null;
  category_id: string | null;
  asset_type: string | null;
  workflow: string | null;
  tags: string[] | null;
  preview_url: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  asset_categories: AssetCategoryRecord | null;
  asset_files: AssetFileRecord[] | null;
};

const assetSelect = `
  id,
  asset_name,
  asset_code,
  description,
  priority,
  category_id,
  asset_type,
  workflow,
  tags,
  preview_url,
  status,
  created_at,
  updated_at,
  asset_categories (
    id,
    name,
    created_at
  ),
  asset_files (
    id,
    asset_id,
    file_name,
    file_url,
    file_format,
    file_size_bytes,
    provider,
    drive_file_id,
    drive_parent_folder_id,
    original_file_name,
    extension,
    mime_type,
    file_role,
    version_number,
    drive_created_time,
    upload_status,
    source_file_id,
    created_at,
    updated_at
  )
`;

function mapAssetCategory(record: AssetCategoryRecord): AssetCategory {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.created_at,
  };
}

function mapAssetFile(record: AssetFileRecord) {
  return {
    id: record.id,
    assetId: record.asset_id,
    fileName: record.file_name,
    fileUrl: record.file_url,
    fileFormat: record.file_format,
    sizeBytes: record.file_size_bytes,
    provider: record.provider,
    driveFileId: record.drive_file_id,
    driveParentFolderId: record.drive_parent_folder_id,
    originalFileName: record.original_file_name,
    extension: record.extension,
    mimeType: record.mime_type,
    fileRole: record.file_role,
    versionNumber: record.version_number,
    driveCreatedTime: record.drive_created_time,
    uploadStatus: record.upload_status,
    sourceFileId: record.source_file_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapAsset(record: AssetRecord): Asset {
  return {
    id: record.id,
    assetName: record.asset_name,
    assetCode: record.asset_code,
    description: record.description ?? "",
    priority: record.priority ?? 4,
    categoryId: record.category_id,
    category: record.asset_categories
      ? mapAssetCategory(record.asset_categories)
      : undefined,
    assetType: record.asset_type ?? "General",
    workflow: record.workflow ?? "Basic",
    tags: record.tags ?? [],
    previewUrl: record.preview_url 
      ? (record.preview_url.startsWith('http') || record.preview_url.startsWith('/'))
        ? record.preview_url 
        : `/api/assets/${record.id}/preview?v=${new Date(record.updated_at || record.created_at).getTime()}`
      : "",
    status: record.status === "Retired" ? "Retired" : "Active",
    files: [...(record.asset_files ?? [])]
      .sort((first, second) => first.created_at.localeCompare(second.created_at))
      .map(mapAssetFile),
    tasks: [],
    notes: [],
    createdAt: record.created_at,
    updatedAt: record.updated_at ?? undefined,
  };
}

export async function getAssets(): Promise<Asset[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("assets")
    .select(assetSelect)
    .order("created_at", { ascending: true })
    .returns<AssetRecord[]>();

  if (error) {
    throw new Error(`Failed to load assets: ${error.message}`);
  }

  return (data ?? []).map(mapAsset);
}

export async function createAsset(
  asset: Pick<
    Asset,
    | "assetName"
    | "assetCode"
    | "description"
    | "priority"
    | "categoryId"
    | "assetType"
    | "workflow"
    | "tags"
    | "status"
  > & { previewUrl?: string }
): Promise<Asset> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("assets")
    .insert({
      asset_name: asset.assetName.trim(),
      asset_code: asset.assetCode.trim(),
      description: asset.description.trim() || null,
      priority: asset.priority,
      category_id: asset.categoryId,
      asset_type: asset.assetType.trim() || "General",
      workflow: asset.workflow || "Basic",
      tags: asset.tags,
      preview_url: asset.previewUrl ?? null,
      status: asset.status,
    })
    .select(assetSelect)
    .single<AssetRecord>();

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`);
  }

  return mapAsset(data);
}

export async function getAssetCategories(): Promise<AssetCategory[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("asset_categories")
    .select("id, name, created_at")
    .order("created_at", { ascending: true })
    .returns<AssetCategoryRecord[]>();

  if (error) {
    throw new Error(`Failed to load asset categories: ${error.message}`);
  }

  return (data ?? []).map(mapAssetCategory);
}

export async function createAssetCategory(name: string): Promise<AssetCategory> {
  const supabase = createClient();
  const categoryName = name.trim();

  const { data, error } = await supabase
    .from("asset_categories")
    .insert({ name: categoryName })
    .select("id, name, created_at")
    .single<AssetCategoryRecord>();

  if (error) {
    throw new Error(`Failed to create asset category: ${error.message}`);
  }

  return mapAssetCategory(data);
}

export type AssignResult = {
  createdCount: number;
  skippedCount: number;
  failedCount?: number;
  message?: string;
};

export type TargetDescriptor = {
  id: string;
  type: "project" | "environment" | "episode" | "scene";
};

export async function assignAssetsToTargets(
  assetIds: string[],
  targets: TargetDescriptor[]
): Promise<AssignResult> {
  const supabase = createClient();
  let createdCount = 0;
  let skippedCount = 0;
  
  if (assetIds.length === 0 || targets.length === 0) {
    return { createdCount: 0, skippedCount: 0 };
  }

  const projects = targets.filter(t => t.type === "project");
  const envs = targets.filter(t => t.type === "environment");
  const jobs = targets.filter(t => t.type === "episode");
  const scenes = targets.filter(t => t.type === "scene");

  try {
    if (projects.length > 0) {
      const inserts = projects.flatMap(p => assetIds.map(aid => ({ asset_id: aid, project_id: p.id })));
      const { data, error } = await supabase.from("asset_project_links")
        .upsert(inserts, { onConflict: "asset_id,project_id", ignoreDuplicates: true })
        .select();
      if (error) throw error;
      if (data) {
        createdCount += data.length;
        skippedCount += (inserts.length - data.length);
      }
    }
    
    if (envs.length > 0) {
      const inserts = envs.flatMap(p => assetIds.map(aid => ({ asset_id: aid, environment_id: p.id })));
      const { data, error } = await supabase.from("asset_environment_links")
        .upsert(inserts, { onConflict: "asset_id,environment_id", ignoreDuplicates: true })
        .select();
      if (error) throw error;
      if (data) {
        createdCount += data.length;
        skippedCount += (inserts.length - data.length);
      }
    }
    
    if (jobs.length > 0) {
      const inserts = jobs.flatMap(p => assetIds.map(aid => ({ asset_id: aid, episode_id: p.id })));
      const { data, error } = await supabase.from("asset_job_links")
        .upsert(inserts, { onConflict: "asset_id,episode_id", ignoreDuplicates: true })
        .select();
      if (error) throw error;
      if (data) {
        createdCount += data.length;
        skippedCount += (inserts.length - data.length);
      }
    }
    
    if (scenes.length > 0) {
      const inserts = scenes.flatMap(p => assetIds.map(aid => ({ asset_id: aid, scene_id: p.id })));
      const { data, error } = await supabase.from("asset_scene_links")
        .upsert(inserts, { onConflict: "asset_id,scene_id", ignoreDuplicates: true })
        .select();
      if (error) throw error;
      if (data) {
        createdCount += data.length;
        skippedCount += (inserts.length - data.length);
      }
    }

    return { createdCount, skippedCount };
  } catch (error) {
    console.error("Failed to assign assets", error);
    return { createdCount, skippedCount, failedCount: 1, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function removeAssetLinks(
  assetIds: string[],
  targets: TargetDescriptor[]
): Promise<number> {
  const supabase = createClient();
  let deletedCount = 0;
  
  if (assetIds.length === 0 || targets.length === 0) {
    return 0;
  }

  const projects = targets.filter(t => t.type === "project");
  const envs = targets.filter(t => t.type === "environment");
  const jobs = targets.filter(t => t.type === "episode");
  const scenes = targets.filter(t => t.type === "scene");

  try {
    if (projects.length > 0) {
       const { data, error } = await supabase.from("asset_project_links")
         .delete()
         .in("project_id", projects.map(p => p.id))
         .in("asset_id", assetIds)
         .select();
       if (error) throw error;
       if (data) deletedCount += data.length;
    }
    
    if (envs.length > 0) {
       const { data, error } = await supabase.from("asset_environment_links")
         .delete()
         .in("environment_id", envs.map(p => p.id))
         .in("asset_id", assetIds)
         .select();
       if (error) throw error;
       if (data) deletedCount += data.length;
    }
    
    if (jobs.length > 0) {
       const { data, error } = await supabase.from("asset_job_links")
         .delete()
         .in("episode_id", jobs.map(p => p.id))
         .in("asset_id", assetIds)
         .select();
       if (error) throw error;
       if (data) deletedCount += data.length;
    }
    
    if (scenes.length > 0) {
       const { data, error } = await supabase.from("asset_scene_links")
         .delete()
         .in("scene_id", scenes.map(p => p.id))
         .in("asset_id", assetIds)
         .select();
       if (error) throw error;
       if (data) deletedCount += data.length;
    }
    
    return deletedCount;
  } catch (error) {
    console.error("Failed to remove asset links", error);
    throw error;
  }
}

export async function loadAssociationsForTargets(targets: TargetDescriptor[]): Promise<Set<string>> {
  const supabase = createClient();
  const assignedAssetIds = new Set<string>();

  if (targets.length === 0) return assignedAssetIds;

  const projects = targets.filter(t => t.type === "project");
  const envs = targets.filter(t => t.type === "environment");
  const jobs = targets.filter(t => t.type === "episode");
  const scenes = targets.filter(t => t.type === "scene");

  const promises = [];

  if (projects.length > 0) {
    promises.push(supabase.from("asset_project_links").select("asset_id").in("project_id", projects.map(p => p.id)));
  }
  if (envs.length > 0) {
    promises.push(supabase.from("asset_environment_links").select("asset_id").in("environment_id", envs.map(p => p.id)));
  }
  if (jobs.length > 0) {
    promises.push(supabase.from("asset_job_links").select("asset_id").in("episode_id", jobs.map(p => p.id)));
  }
  if (scenes.length > 0) {
    promises.push(supabase.from("asset_scene_links").select("asset_id").in("scene_id", scenes.map(p => p.id)));
  }

  const results = await Promise.all(promises);

  for (const { data, error } of results) {
    if (error) {
      console.error("Failed to load associations", error);
      continue;
    }
    if (data) {
      data.forEach(row => assignedAssetIds.add(row.asset_id));
    }
  }

  return assignedAssetIds;
}
