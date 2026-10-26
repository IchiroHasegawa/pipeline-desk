/**
 * Services: the Postgres functions and views, ported to application code.
 *
 * These own the logic that used to live inside the database — the
 * transactional task generator, the board upsert, and the three reporting
 * views — and they call into lib/permissions like everything else.
 */
export {
  generateWorkflowTasks,
  GENERATABLE_ENTITY_TYPES,
  type GeneratableEntityType,
} from "./workflowTasks";
export { getOrCreateBoard, type BoardRef } from "./boards";
export {
  projectEpisodeStatus,
  projectCommitDays,
  projectAssetStats,
  COMMIT_DAY_TIMEZONE,
  type ProjectEpisodeStatusRow,
  type ProjectCommitDayRow,
  type ProjectAssetStatsRow,
} from "./stats";
