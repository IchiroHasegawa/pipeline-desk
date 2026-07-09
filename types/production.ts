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
  scenes: Scene[];
};

export type ProductionEnvironment = {
  id: string;
  name: string;
  description: string;
  episodes: Episode[];
};