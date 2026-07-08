export type TaskStatus =
  | "Unassigned"
  | "In Progress"
  | "Review"
  | "Approved"
  | "Rejected";

export type ProductionTask = {
  id: string;
  name: string;
  progress: number;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  assignee?: string;
};

export type EpisodeJob = {
  id: string;
  jobName: string;
  previewImage: string;
  description?: string;
  code: string;
  workflow: string;
  startDate: string;
  endDate: string;
  tasks: ProductionTask[];
  notes: string[];
};

export type ProductionEnvironment = {
  id: string;
  name: string;
  description: string;
  jobs: EpisodeJob[];
};