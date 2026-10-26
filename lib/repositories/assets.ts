import mongoose, { type QueryFilter, type Model } from "mongoose";
import { Asset, type AssetDoc } from "@/lib/models/Asset";
import { AssetFile, type AssetFileDoc, type FileRole } from "@/lib/models/AssetFile";
import { AssetCategory, type AssetCategoryDoc } from "@/lib/models/AssetCategory";
import {
  AssetStorageLocation,
  type AssetStorageLocationDoc,
} from "@/lib/models/AssetStorageLocation";
import { StorageConnection, type StorageConnectionDoc } from "@/lib/models/StorageConnection";
import { AssetProjectLink, type AssetProjectLinkDoc } from "@/lib/models/AssetProjectLink";
import { AssetSceneLink, type AssetSceneLinkDoc } from "@/lib/models/AssetSceneLink";
import { AssetJobLink, type AssetJobLinkDoc } from "@/lib/models/AssetJobLink";
import { baseRepo } from "./base";
import { requireActiveUser, type Actor } from "@/lib/permissions";

const assetBase = baseRepo<AssetDoc>(Asset, { immutable: ["assetNumber"] });

export const assets = {
  ...assetBase,

  /**
   * Replaces the Postgres `nextval('asset_number_seq')` default.
   *
   * Mongo has no sequences. This takes the current maximum and adds one inside
   * a transaction, so two concurrent creates cannot read the same maximum. The
   * partial unique index on assetNumber is the backstop: if this ever did race,
   * the second insert errors rather than silently duplicating a number.
   */
  async createWithNumber(
    actor: Actor,
    data: Record<string, unknown>
  ): Promise<AssetDoc> {
    requireActiveUser(actor);

    const session = await mongoose.startSession();
    try {
      let created: AssetDoc | null = null;

      await session.withTransaction(async () => {
        const highest = await Asset.findOne({ assetNumber: { $exists: true } })
          .sort({ assetNumber: -1 })
          .select("assetNumber")
          .session(session)
          .lean();

        const assetNumber = (highest?.assetNumber ?? 0) + 1;

        const docs = await Asset.create([{ ...data, assetNumber }], {
          session,
          ordered: true,
        });
        created = docs[0].toObject() as AssetDoc;
      });

      return created as unknown as AssetDoc;
    } finally {
      await session.endSession();
    }
  },

  async listByCategory(actor: Actor, categoryId: string): Promise<AssetDoc[]> {
    requireActiveUser(actor);
    return Asset.find({ categoryId })
      .sort({ sortOrder: 1, assetName: 1 })
      .lean<AssetDoc[]>()
      .exec();
  },

  /** Assets linked to a project, resolved through the link collection. */
  async listByProject(actor: Actor, projectId: string): Promise<AssetDoc[]> {
    requireActiveUser(actor);
    const links = await AssetProjectLink.find({ projectId }).select("assetId").lean().exec();
    if (links.length === 0) return [];
    return Asset.find({ _id: { $in: links.map((l) => l.assetId) } })
      .sort({ sortOrder: 1, assetName: 1 })
      .lean<AssetDoc[]>()
      .exec();
  },
};

export const assetFiles = {
  ...baseRepo<AssetFileDoc>(AssetFile),

  async listByAsset(actor: Actor, assetId: string): Promise<AssetFileDoc[]> {
    requireActiveUser(actor);
    return AssetFile.find({ assetId })
      .sort({ createdAt: -1 })
      .lean<AssetFileDoc[]>()
      .exec();
  },

  async listByAssetAndRole(
    actor: Actor,
    assetId: string,
    fileRole: FileRole
  ): Promise<AssetFileDoc[]> {
    requireActiveUser(actor);
    return AssetFile.find({ assetId, fileRole })
      .sort({ versionNumber: -1, createdAt: -1 })
      .lean<AssetFileDoc[]>()
      .exec();
  },

  async getByDriveFileId(actor: Actor, driveFileId: string): Promise<AssetFileDoc | null> {
    requireActiveUser(actor);
    return AssetFile.findOne({ driveFileId }).lean<AssetFileDoc>().exec();
  },

  /** Versions of a source file, newest first. */
  async listVersions(actor: Actor, sourceFileId: string): Promise<AssetFileDoc[]> {
    requireActiveUser(actor);
    return AssetFile.find({ sourceFileId })
      .sort({ versionNumber: -1 })
      .lean<AssetFileDoc[]>()
      .exec();
  },
};

export const assetCategories = {
  ...baseRepo<AssetCategoryDoc>(AssetCategory),

  async listOrdered(actor: Actor): Promise<AssetCategoryDoc[]> {
    requireActiveUser(actor);
    return AssetCategory.find()
      .sort({ sortOrder: 1, name: 1 })
      .lean<AssetCategoryDoc[]>()
      .exec();
  },
};

export const assetStorageLocations = {
  ...baseRepo<AssetStorageLocationDoc>(AssetStorageLocation),

  async getForAsset(
    actor: Actor,
    assetId: string,
    provider: "google_drive" = "google_drive"
  ): Promise<AssetStorageLocationDoc | null> {
    requireActiveUser(actor);
    return AssetStorageLocation.findOne({ assetId, provider })
      .lean<AssetStorageLocationDoc>()
      .exec();
  },
};

export const storageConnections = {
  // The refresh token is select:false and written only by the Drive connect
  // flow, never by a generic patch.
  ...baseRepo<StorageConnectionDoc>(StorageConnection, {
    immutable: ["encryptedRefreshToken"],
  }),

  async getActive(
    actor: Actor,
    provider: "google_drive" = "google_drive"
  ): Promise<StorageConnectionDoc | null> {
    requireActiveUser(actor);
    return StorageConnection.findOne({ provider, status: "Connected" })
      .lean<StorageConnectionDoc>()
      .exec();
  },

  /** The encrypted token, for the Drive client only. */
  async getWithToken(
    actor: Actor,
    id: string
  ): Promise<StorageConnectionDoc | null> {
    requireActiveUser(actor);
    return StorageConnection.findById(id)
      .select("+encryptedRefreshToken")
      .lean<StorageConnectionDoc>()
      .exec();
  },
};

/**
 * The three many-to-many link collections. Each exposes link/unlink rather
 * than create/delete, because the operation callers mean is "attach this asset
 * to that thing", and linking twice should be harmless.
 */
function linkRepo<TDoc>(
  model: Model<TDoc>,
  otherKey: "projectId" | "sceneId" | "episodeId"
) {
  const base = baseRepo<TDoc>(model);
  return {
    ...base,

    async link(actor: Actor, assetId: string, otherId: string): Promise<void> {
      requireActiveUser(actor);
      // Idempotent: the compound unique index makes a repeat insert an error,
      // so upsert expresses "ensure linked" without the caller catching.
      await model.updateOne(
        { assetId, [otherKey]: otherId } as QueryFilter<TDoc>,
        { $setOnInsert: { assetId, [otherKey]: otherId } },
        { upsert: true }
      );
    },

    async unlink(actor: Actor, assetId: string, otherId: string): Promise<boolean> {
      requireActiveUser(actor);
      const { deletedCount } = await model.deleteOne({
        assetId,
        [otherKey]: otherId,
      } as QueryFilter<TDoc>);
      return deletedCount > 0;
    },

    async listAssetIdsFor(actor: Actor, otherId: string): Promise<string[]> {
      requireActiveUser(actor);
      const rows = await model
        .find({ [otherKey]: otherId } as QueryFilter<TDoc>)
        .select("assetId")
        .lean<{ assetId: string }[]>()
        .exec();
      return rows.map((r) => r.assetId);
    },

    async listFor(actor: Actor, assetId: string): Promise<TDoc[]> {
      requireActiveUser(actor);
      return model
        .find({ assetId } as QueryFilter<TDoc>)
        .lean<TDoc[]>()
        .exec();
    },
  };
}

export const assetProjectLinks = linkRepo<AssetProjectLinkDoc>(AssetProjectLink, "projectId");
export const assetSceneLinks = linkRepo<AssetSceneLinkDoc>(AssetSceneLink, "sceneId");
export const assetJobLinks = linkRepo<AssetJobLinkDoc>(AssetJobLink, "episodeId");
