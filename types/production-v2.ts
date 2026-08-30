import { GRAPH_SIZES, DEFAULT_GRAPH_LAYOUT, type GraphId } from "@/lib/design/boardTokens";

export type GraphPosition = { x: number; y: number; z: number };

/** Per-project card positions. Missing keys fall back to DEFAULT_GRAPH_LAYOUT. */
export type BoardLayout = Partial<Record<GraphId, GraphPosition>>;

export type ProjectV2 = {
  id: string;
  title: string;
  projectCode: string;
  assetCodePrefix?: string | null;
  defaultAssetWorkflowId?: string | null;
  description: string;
  thumbnailUrl: string;
  status: "Active" | "Retired";
  isSystem: boolean;
  startDate: string | null;
  endDate: string | null;
  boardLayout: BoardLayout;
  createdAt: string;
};

/**
 * board_layout is jsonb, so the value can be anything: {}, unknown keys, or
 * non-numeric coordinates. Anything that is not a complete {x,y,z} of finite
 * numbers under a known GraphId is dropped, and that graph falls back to
 * DEFAULT_GRAPH_LAYOUT at render time.
 *
 * Shared by both mapProjectV2 implementations — the repository's and the server
 * action's — which have diverged before.
 */
export function parseBoardLayout(raw: unknown): BoardLayout {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const source = raw as Record<string, unknown>;
  const out: BoardLayout = {};

  for (const key of Object.keys(DEFAULT_GRAPH_LAYOUT) as GraphId[]) {
    const candidate = source[key];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }

    const { x, y, z } = candidate as Record<string, unknown>;
    if (
      typeof x === "number" && Number.isFinite(x) &&
      typeof y === "number" && Number.isFinite(y) &&
      typeof z === "number" && Number.isFinite(z)
    ) {
      out[key] = { x, y, z };
    }
  }

  return out;
}

/** Known graph ids, for server-side validation of a client payload. */
export const GRAPH_IDS = Object.keys(GRAPH_SIZES) as GraphId[];

export type BoardScope =
  | { type: "scene"; sceneId: string }
  | { type: "project"; projectId: string };

export type EpisodeV2 = {
  id: string;
  projectId: string;
  episodeName: string;
  code: string;
  description: string;
  previewImage: string;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number | null;
  jobWorkflow: string | null;
  sceneWorkflow: string | null;
  status: "Active" | "Retired";
  createdAt: string;
};

export type SceneV2 = {
  id: string;
  episodeId: string;
  sceneName: string;
  description: string;
  previewImage: string;
  sortOrder: number | null;
  status: "Active" | "Retired";
  numberOfFrames: number;
  priority: number;
  createdAt: string;
};

export type DayV2 = {
  id: string;
  episodeId: string;
  dayDate: string;
  title: string | null;
  description: string | null;
  sortOrder: number | null;
  createdAt: string;
};

/** A Main Task: production_tasks where day_id IS NULL. */
export type MainTaskV2 = {
  id: string;
  episodeId: string | null;
  sceneId: string | null;
  name: string;
  progress: number;
  status: string;
  assignee: string | null;
  sortOrder: number | null;
  sourceWorkflowProcessId: string | null;
  /**
   * The authoritative status. production_tasks.status is free text that lost
   * its CHECK in migration 023; migration 037 reads completion from
   * workflow_task_statuses.completion_percentage via this id instead.
   */
  taskStatusDefinitionId: string | null;
  /** Which workflow scopes the statuses this task may be moved to. */
  taskStatusWorkflowId: string | null;
  createdAt: string;
};

/** A Custom Task: production_tasks where day_id IS NOT NULL. */
export type CustomTaskV2 = {
  id: string;
  dayId: string;
  name: string;
  progress: number;
  status: string;
  sortOrder: number | null;
  contributesToTaskId: string | null;
  branchesFromTaskId: string | null;
  createdAt: string;
};

export type TodoV2 = {
  id: string;
  episodeId: string | null;
  sceneId: string | null;
  taskId: string | null;
  userId: string;
  title: string;
  description: string | null;
  sortOrder: number | null;
  /** null = open To Do; set = a commit, and when it happened */
  completedAt: string | null;
  createdAt: string;
};

export type TodoScope =
  | { kind: "episode"; episodeId: string }
  | { kind: "scene"; sceneId: string };

export type ElementType = "keyframe" | "asset" | "folder" | "comment" | "arrow";

export type BoardElement = {
  id: string;
  boardId: string;
  elementType: ElementType;
  parentFolderId: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  title: string | null;
  body: string | null;
  colour: string | null;
  assetId: string | null;
  assetFileId: string | null;
  imageUrl: string | null;
  keyframeNumber: number | null;
  fromElementId: string | null;
  toElementId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateElementInput = {
  boardId: string;
  elementType: ElementType;
  parentFolderId?: string | null;
  x: number;
  y: number;
  width?: number;
  height?: number;
  zIndex?: number;
  title?: string | null;
  body?: string | null;
  colour?: string | null;
  assetId?: string | null;
  assetFileId?: string | null;
  imageUrl?: string | null;
  fromElementId?: string | null;
  toElementId?: string | null;
};

export type AssetV2 = {
  id: string;
  name: string;
  assetCode: string | null;
  category: string | null;
  priority: string | null;
  projectId: string | null;
  episodeId: string | null;
  previewUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  hasDefaultWorkflow?: boolean;
};

export type AssetTaskV2 = {
  id: string;
  assetId: string;
  taskName: string;
  status: string;
  assignee: string | null;
  sortOrder: number | null;
  createdAt: string;
};




export type ProjectBoardStats = {
  episodeStatus: { notStarted: number; inProgress: number; complete: number; total: number };
  commitDays: { day: string; count: number }[];
  assets: { assetCount: number; fileCount: number; totalBytes: number };
};

/** Fallback for a project absent from all three board views. */
export const EMPTY_PROJECT_BOARD_STATS: ProjectBoardStats = {
  episodeStatus: { notStarted: 0, inProgress: 0, complete: 0, total: 0 },
  commitDays: [],
  assets: { assetCount: 0, fileCount: 0, totalBytes: 0 },
};

/**
 * One process of an episode's scene workflow, rolled up across every scene.
 *
 * total is ALL scenes in the episode, not only those carrying a task for this
 * process — a scene missing the process counts against the percentage, which is
 * the point of the measure.
 */
export type ProcessProgress = {
  processId: string;
  processName: string;
  colour: string | null;
  position: number;
  completeScenes: number;
  totalScenes: number;
  percent: number;
};

/**
 * One status a task may be moved to. Scoped to a single workflow — statuses
 * live under workflow_task_statuses.workflow_id, so a global list would offer
 * options that do not belong to the task.
 */
export type TaskStatusOption = {
  id: string;
  name: string;
  colour: string;
  completionPercentage: number;
};

/**
 * A scene's Main Task with the workflow process it came from, which is what
 * gives the board card its colour strip and its number badge.
 *
 * The process fields are null when source_workflow_process_id is null — a task
 * created outside generate_workflow_tasks, which nothing currently does.
 */
export type SceneBoardTask = MainTaskV2 & {
  processName: string | null;
  processColour: string | null;
  processPosition: number | null;
};

/** A profile that can be put in production_tasks.assignee. */
export type AssignableUser = {
  id: string;
  displayName: string;
};
