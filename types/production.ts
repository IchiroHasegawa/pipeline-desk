export type TaskStatus =
  | "Unassigned"
  | "In Progress"
  | "Pending"
  | "To Validate"
  | "Review"
  | "Approved"
  | "Rejected"
  | "Standby";

export type ProductionTask = {
  id: string;
  name: string;
  progress: number;
  status: TaskStatus;
  assignee: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

export type Scene = {
  id: string;
  sceneName: string;
  previewImage: string;
  description?: string;
  note: string;
  status: "Active" | "Retired";
  workflow?: string;
  numberOfFrames: number;
  priority: number;
  tasks: ProductionTask[];
  createdAt: string;
};

export type Episode = {
  id: string;
  episodeName: string;
  previewImage: string;
  description: string;
  code: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Retired";
  jobWorkflow?: string;
  sceneWorkflow?: string;
  scenes: Scene[];
  createdAt: string;
};

export type ProductionEnvironment = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  status: "Active" | "Retired";
  episodes: Episode[];
  createdAt: string;
};

export type Project = {
  id: string;
  title: string;
  projectCode: string;
  description: string;
  thumbnailUrl: string;
  status: "Active" | "Retired";
  environments: ProductionEnvironment[];
  createdAt: string;
};

export type AssetCategory = {
  id: string;
  name: string;
  createdAt: string;
};

export type AssetFile = {
  id: string;
  assetId: string;
  fileName: string;
  fileUrl: string;
  fileFormat: string;
  sizeBytes: number;
  createdAt: string;
};

export type Asset = {
  id: string;
  assetName: string;
  assetCode: string;
  description: string;
  priority: number;
  categoryId: string | null;
  category?: AssetCategory;
  assetType: string;
  workflow: string;
  tags: string[];
  previewUrl: string;
  status: "Active" | "Retired";
  files?: AssetFile[];
  tasks?: ProductionTask[];
  createdAt: string;
  updatedAt?: string;
};

export type AssetAssignment = {
  id: string;
  assetId: string;
  projectId?: string;
  environmentId?: string;
  episodeId?: string;
  sceneId?: string;
  createdAt: string;
};