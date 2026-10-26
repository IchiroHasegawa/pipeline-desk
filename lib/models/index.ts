/**
 * Model barrel.
 *
 * Importing this registers every model with Mongoose before any query runs.
 * That matters because `ref` is resolved lazily by name: a populate against a
 * model whose module was never imported throws `MissingSchemaError` at
 * runtime, and which modules happen to be loaded varies with the route.
 */
export { Profile, ACCOUNT_STATUSES, SYSTEM_ROLES, type ProfileDoc } from "./Profile";
export { Session, type SessionDoc } from "./Session";
export { PasswordResetToken, type PasswordResetTokenDoc } from "./PasswordResetToken";

export { Project, type ProjectDoc } from "./Project";
export { Episode, type EpisodeDoc } from "./Episode";
export { Scene, type SceneDoc } from "./Scene";
export { Day, type DayDoc } from "./Day";
export { SceneNote, type SceneNoteDoc } from "./SceneNote";

export { Asset, type AssetDoc } from "./Asset";
export { AssetFile, FILE_ROLES, RECORD_STATUSES, type AssetFileDoc } from "./AssetFile";
export { AssetCategory, type AssetCategoryDoc } from "./AssetCategory";
export { AssetStorageLocation, type AssetStorageLocationDoc } from "./AssetStorageLocation";
export { StorageConnection, CONNECTION_STATUSES, type StorageConnectionDoc } from "./StorageConnection";
export { AssetAssignment, type AssetAssignmentDoc } from "./AssetAssignment";
export { AssetProjectLink, type AssetProjectLinkDoc } from "./AssetProjectLink";
export { AssetSceneLink, type AssetSceneLinkDoc } from "./AssetSceneLink";
export { AssetJobLink, type AssetJobLinkDoc } from "./AssetJobLink";

export { Workflow, WORKFLOW_TYPES, type WorkflowDoc } from "./Workflow";
export {
  WorkflowProcess,
  PROCESS_TYPES,
  TAKE_RETAKE_MODES,
  type WorkflowProcessDoc,
} from "./WorkflowProcess";
export { WorkflowTaskStatus, type WorkflowTaskStatusDoc } from "./WorkflowTaskStatus";
export { ProductionTask, type ProductionTaskDoc } from "./ProductionTask";
export { AssetTask, type AssetTaskDoc } from "./AssetTask";

export { Board, type BoardDoc } from "./Board";
export { BoardElement, ELEMENT_TYPES, type BoardElementDoc } from "./BoardElement";
export { Todo, type TodoDoc } from "./Todo";

import { Profile } from "./Profile";
import { Session } from "./Session";
import { PasswordResetToken } from "./PasswordResetToken";
import { Project } from "./Project";
import { Episode } from "./Episode";
import { Scene } from "./Scene";
import { Day } from "./Day";
import { SceneNote } from "./SceneNote";
import { Asset } from "./Asset";
import { AssetFile } from "./AssetFile";
import { AssetCategory } from "./AssetCategory";
import { AssetStorageLocation } from "./AssetStorageLocation";
import { StorageConnection } from "./StorageConnection";
import { AssetAssignment } from "./AssetAssignment";
import { AssetProjectLink } from "./AssetProjectLink";
import { AssetSceneLink } from "./AssetSceneLink";
import { AssetJobLink } from "./AssetJobLink";
import { Workflow } from "./Workflow";
import { WorkflowProcess } from "./WorkflowProcess";
import { WorkflowTaskStatus } from "./WorkflowTaskStatus";
import { ProductionTask } from "./ProductionTask";
import { AssetTask } from "./AssetTask";
import { Board } from "./Board";
import { BoardElement } from "./BoardElement";
import { Todo } from "./Todo";

/** Every model, for index syncing and test teardown. */
export const ALL_MODELS = [
  Profile,
  Session,
  PasswordResetToken,
  Project,
  Episode,
  Scene,
  Day,
  SceneNote,
  Asset,
  AssetFile,
  AssetCategory,
  AssetStorageLocation,
  StorageConnection,
  AssetAssignment,
  AssetProjectLink,
  AssetSceneLink,
  AssetJobLink,
  Workflow,
  WorkflowProcess,
  WorkflowTaskStatus,
  ProductionTask,
  AssetTask,
  Board,
  BoardElement,
  Todo,
] as const;

/** Creates every declared index. Call once after connecting, not per request. */
export async function syncAllIndexes(): Promise<void> {
  for (const model of ALL_MODELS) {
    await model.syncIndexes();
  }
}
