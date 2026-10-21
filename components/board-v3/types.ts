export type DropTarget =
  | { type: "project"; projectId: string }
  | { type: "episode"; episodeId: string; projectId: string }
  | null;
