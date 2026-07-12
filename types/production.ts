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
};

export type ProductionEnvironment = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  status: "Active" | "Retired";
  episodes: Episode[];
};

export type Project = {
  id: string;
  title: string;
  projectCode: string;
  description: string;
  thumbnailUrl: string;
  status: "Active" | "Retired";
  environments: ProductionEnvironment[];
};