import { ProductionTask, type ProductionTaskDoc } from "@/lib/models/ProductionTask";
import { AssetTask, type AssetTaskDoc } from "@/lib/models/AssetTask";
import { baseRepo } from "./base";
import { requireActiveUser, type Actor } from "@/lib/permissions";

/**
 * `sourceWorkflowProcessId` is immutable through the repository: it is the
 * uniqueness key of both tasks' indexes, and re-pointing it by a generic patch
 * would either collide confusingly or silently detach a task from the workflow
 * that generated it. Only the generation service sets it.
 */
export const productionTasks = {
  ...baseRepo<ProductionTaskDoc>(ProductionTask, {
    immutable: ["sourceWorkflowProcessId"],
  }),

  async listByScene(actor: Actor, sceneId: string): Promise<ProductionTaskDoc[]> {
    requireActiveUser(actor);
    return ProductionTask.find({ sceneId })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<ProductionTaskDoc[]>()
      .exec();
  },

  async listByEpisode(actor: Actor, episodeId: string): Promise<ProductionTaskDoc[]> {
    requireActiveUser(actor);
    return ProductionTask.find({ episodeId })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<ProductionTaskDoc[]>()
      .exec();
  },

  async listByDay(actor: Actor, dayId: string): Promise<ProductionTaskDoc[]> {
    requireActiveUser(actor);
    return ProductionTask.find({ dayId })
      .sort({ sortOrder: 1 })
      .lean<ProductionTaskDoc[]>()
      .exec();
  },

  /** Tasks for every scene in one query — the board and timeline views. */
  async listByScenes(actor: Actor, sceneIds: string[]): Promise<ProductionTaskDoc[]> {
    requireActiveUser(actor);
    if (sceneIds.length === 0) return [];
    return ProductionTask.find({ sceneId: { $in: sceneIds } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<ProductionTaskDoc[]>()
      .exec();
  },

  async setProgress(
    actor: Actor,
    id: string,
    progress: number
  ): Promise<ProductionTaskDoc | null> {
    requireActiveUser(actor);
    // Goes through findByIdAndUpdate with validators so the 0-100 CHECK is
    // enforced rather than bypassed by a raw $set.
    return ProductionTask.findByIdAndUpdate(
      id,
      { progress },
      { returnDocument: 'after', runValidators: true }
    )
      .lean<ProductionTaskDoc>()
      .exec();
  },
};

export const assetTasks = {
  ...baseRepo<AssetTaskDoc>(AssetTask, { immutable: ["sourceWorkflowProcessId"] }),

  async listByAsset(actor: Actor, assetId: string): Promise<AssetTaskDoc[]> {
    requireActiveUser(actor);
    return AssetTask.find({ assetId })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<AssetTaskDoc[]>()
      .exec();
  },

  async listByAssets(actor: Actor, assetIds: string[]): Promise<AssetTaskDoc[]> {
    requireActiveUser(actor);
    if (assetIds.length === 0) return [];
    return AssetTask.find({ assetId: { $in: assetIds } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<AssetTaskDoc[]>()
      .exec();
  },

  async setProgress(actor: Actor, id: string, progress: number): Promise<AssetTaskDoc | null> {
    requireActiveUser(actor);
    return AssetTask.findByIdAndUpdate(id, { progress }, { returnDocument: 'after', runValidators: true })
      .lean<AssetTaskDoc>()
      .exec();
  },
};
