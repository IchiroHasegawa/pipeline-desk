export type ProjectV2 = {
  id: string;
  title: string;
  projectCode: string;
  description: string;
  thumbnailUrl: string;
  status: "Active" | "Retired";
  isSystem: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

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



