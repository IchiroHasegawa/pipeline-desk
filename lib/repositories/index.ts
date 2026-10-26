/**
 * Repository barrel.
 *
 * Every function in here takes the acting user as its first argument and runs
 * a permission guard before touching the database, and every read returns
 * `.lean()` plain objects. Route handlers, server actions and server
 * components use these; they do not import models directly.
 */
export { baseRepo, type BaseRepo, type ListOptions } from "./base";
export { profiles } from "./profiles";
export { projects, episodes, scenes, days, sceneNotes } from "./projects";
export {
  assets,
  assetFiles,
  assetCategories,
  assetStorageLocations,
  storageConnections,
  assetProjectLinks,
  assetSceneLinks,
  assetJobLinks,
} from "./assets";
export { productionTasks, assetTasks } from "./tasks";
export { workflows, workflowProcesses, workflowTaskStatuses } from "./workflows";
export { boards, boardElements, todos } from "./boards";
