import type {
  Episode,
  ProductionEnvironment,
  ProductionTask,
  Scene,
} from "@/types/production";

import { createClient } from "@/lib/supabase/client";

type ProductionTaskRecord = {
  id: string;
  name: string;
  progress: number | null;
  status: ProductionTask["status"] | null;
  assignee: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number | null;
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
  production_tasks: ProductionTaskRecord[] | null;
  scene_notes: SceneNoteRecord[] | null;
};

type EpisodeRecord = {
  id: string;
  episode_name: string;
  description: string | null;
  preview_image: string | null;
  code: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number | null;
  scenes: SceneRecord[] | null;
};

type ProductionEnvironmentRecord = {
  id: string;
  name: string;
  description: string | null;
  episodes: EpisodeRecord[] | null;
};

const productionEnvironmentSelect = `
  id,
  name,
  description,
  episodes (
    id,
    episode_name,
    description,
    preview_image,
    code,
    start_date,
    end_date,
    sort_order,
    scenes (
      id,
      scene_name,
      description,
      preview_image,
      sort_order,
      production_tasks (
        id,
        name,
        progress,
        status,
        assignee,
        start_date,
        end_date,
        sort_order
      ),
      scene_notes (
        id,
        content,
        created_at
      )
    )
  )
`;

function compareBySortOrderThenName<T>(
  getSortOrder: (item: T) => number | null,
  getName: (item: T) => string
) {
  return (first: T, second: T) => {
    const firstSortOrder = getSortOrder(first) ?? Number.MAX_SAFE_INTEGER;
    const secondSortOrder = getSortOrder(second) ?? Number.MAX_SAFE_INTEGER;

    if (firstSortOrder !== secondSortOrder) {
      return firstSortOrder - secondSortOrder;
    }

    return getName(first).localeCompare(getName(second));
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
  };
}

function mapScene(record: SceneRecord): Scene {
  const notes = [...(record.scene_notes ?? [])].sort((first, second) =>
    first.created_at.localeCompare(second.created_at)
  );

  const tasks = [...(record.production_tasks ?? [])]
    .sort(
      compareBySortOrderThenName(
        (task) => task.sort_order,
        (task) => task.name
      )
    )
    .map(mapProductionTask);

  return {
    id: record.id,
    sceneName: record.scene_name,
    previewImage: record.preview_image ?? "",
    description: record.description ?? undefined,
    note: notes.map((note) => note.content).join("\n\n"),
    tasks,
  };
}

function mapEpisode(record: EpisodeRecord): Episode {
  const scenes = [...(record.scenes ?? [])]
    .sort(
      compareBySortOrderThenName(
        (scene) => scene.sort_order,
        (scene) => scene.scene_name
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
    scenes,
  };
}

function mapProductionEnvironment(
  record: ProductionEnvironmentRecord
): ProductionEnvironment {
  const episodes = [...(record.episodes ?? [])]
    .sort(
      compareBySortOrderThenName(
        (episode) => episode.sort_order,
        (episode) => episode.episode_name
      )
    )
    .map(mapEpisode);

  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
    episodes,
  };
}

export async function getProductionEnvironments(): Promise<
  ProductionEnvironment[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("production_environments")
    .select(productionEnvironmentSelect)
    .order("name", { ascending: true })
    .returns<ProductionEnvironmentRecord[]>();

  if (error) {
    throw new Error(`Failed to load production environments: ${error.message}`);
  }

  return (data ?? []).map(mapProductionEnvironment);
}
