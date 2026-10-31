import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { Asset } from "@/lib/models/Asset";
import { AssetFile } from "@/lib/models/AssetFile";
import { AssetCategory } from "@/lib/models/AssetCategory";
import { AssetStorageLocation } from "@/lib/models/AssetStorageLocation";
import { StorageConnection } from "@/lib/models/StorageConnection";
import { AssetAssignment } from "@/lib/models/AssetAssignment";
import { AssetProjectLink } from "@/lib/models/AssetProjectLink";
import { AssetSceneLink } from "@/lib/models/AssetSceneLink";
import { AssetJobLink } from "@/lib/models/AssetJobLink";

let mongo: TestMongo;
const models = [
  Asset,
  AssetFile,
  AssetCategory,
  AssetStorageLocation,
  StorageConnection,
  AssetAssignment,
  AssetProjectLink,
  AssetSceneLink,
  AssetJobLink,
];

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await Promise.all(models.map((m) => m.syncIndexes()));
});

afterEach(async () => {
  await Promise.all(models.map((m) => m.deleteMany({})));
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

const asset = { assetCode: "CH_001", assetName: "Hero", assetType: "Character" };
const file = { assetId: "a1", fileUrl: "u", fileName: "f.png", fileFormat: "png" };

describe("Asset", () => {
  it("requires assetCode, assetName and assetType", async () => {
    await expect(Asset.create({})).rejects.toThrow(/validation/i);
  });

  it("defaults tags to an empty array, priority to 4 and sortOrder to 0", async () => {
    const a = await Asset.create(asset);
    expect(a.tags).toEqual([]);
    expect([a.priority, a.sortOrder]).toEqual([4, 0]);
  });

  it("stores tags as a list of strings", async () => {
    await Asset.create({ ...asset, tags: ["prop", "hero"] });
    expect((await Asset.findOne({ assetCode: "CH_001" }).lean())!.tags).toEqual(["prop", "hero"]);
  });

  it("enforces a unique assetNumber when one is set", async () => {
    await Asset.create({ ...asset, assetNumber: 1 });
    await expect(Asset.create({ ...asset, assetCode: "CH_002", assetNumber: 1 })).rejects.toThrow(
      /duplicate key/i
    );
  });

  // assetNumber comes from a Postgres sequence and is nullable, so the unique
  // index must be partial or the second numberless asset would collide.
  it("allows many assets with no assetNumber", async () => {
    await Asset.create(asset);
    await expect(Asset.create({ ...asset, assetCode: "CH_002" })).resolves.toBeTruthy();
  });

  it("does not require assetCode to be unique", async () => {
    // Postgres has no unique index on asset_code — only on asset_number.
    await Asset.create(asset);
    await expect(Asset.create(asset)).resolves.toBeTruthy();
  });
});

describe("AssetFile", () => {
  it("requires assetId, fileUrl, fileName and fileFormat", async () => {
    await expect(AssetFile.create({})).rejects.toThrow(/validation/i);
  });

  it("defaults fileSizeBytes to 0", async () => {
    expect((await AssetFile.create(file)).fileSizeBytes).toBe(0);
  });

  // CHECK (file_role IN ('Source','Preview','Version','Versions'))
  it.each(["Source", "Preview", "Version", "Versions"])("accepts fileRole %o", async (fileRole) => {
    await expect(AssetFile.create({ ...file, fileRole })).resolves.toBeTruthy();
  });

  it("rejects a fileRole outside the contract", async () => {
    await expect(AssetFile.create({ ...file, fileRole: "Thumbnail" })).rejects.toThrow(
      /validation/i
    );
  });

  // CHECK (record_status IN ('Queued','Preparing','Uploading','Active','Retired','Trashed','Failed','Cancelled','Missing'))
  it("accepts Active as a recordStatus and rejects Complete", async () => {
    await expect(AssetFile.create({ ...file, recordStatus: "Active" })).resolves.toBeTruthy();
    await expect(AssetFile.create({ ...file, recordStatus: "Complete" })).rejects.toThrow(
      /validation/i
    );
  });

  // Postgres had CHECK (provider = 'google_drive'). Cloudinary was added
  // deliberately; see test/models/storage-providers.test.ts. Anything outside
  // the two is still refused.
  it("rejects a provider outside the supported two", async () => {
    await expect(AssetFile.create({ ...file, provider: "s3" })).rejects.toThrow(/validation/i);
  });

  it("accepts both supported providers", async () => {
    await expect(AssetFile.create({ ...file, provider: "google_drive" })).resolves.toBeTruthy();
    await expect(AssetFile.create({ ...file, provider: "cloudinary" })).resolves.toBeTruthy();
  });

  // CHECK ((file_role = 'Source') OR (current_file_id IS NULL))
  it("allows currentFileId only on a Source file", async () => {
    await expect(
      AssetFile.create({ ...file, fileRole: "Source", currentFileId: "f9" })
    ).resolves.toBeTruthy();
    await expect(
      AssetFile.create({ ...file, fileRole: "Preview", currentFileId: "f9" })
    ).rejects.toThrow(/validation/i);
  });

  it("enforces a unique driveFileId when present", async () => {
    await AssetFile.create({ ...file, driveFileId: "d1" });
    await expect(AssetFile.create({ ...file, driveFileId: "d1" })).rejects.toThrow(
      /duplicate key/i
    );
  });

  // Review Focus 1: driveFileId is optional, so its unique index must be partial.
  it("allows many files with no driveFileId", async () => {
    await AssetFile.create(file);
    await expect(AssetFile.create(file)).resolves.toBeTruthy();
    expect(await AssetFile.countDocuments()).toBe(2);
  });

  it("enforces unique (sourceFileId, versionNumber) when both are set", async () => {
    await AssetFile.create({ ...file, sourceFileId: "s1", versionNumber: 1 });
    await expect(
      AssetFile.create({ ...file, sourceFileId: "s1", versionNumber: 1 })
    ).rejects.toThrow(/duplicate key/i);
  });

  it("allows many files with no sourceFileId or versionNumber", async () => {
    await AssetFile.create(file);
    await expect(AssetFile.create(file)).resolves.toBeTruthy();
  });
});

describe("AssetCategory", () => {
  it("enforces a unique name", async () => {
    await AssetCategory.create({ name: "Characters" });
    await expect(AssetCategory.create({ name: "Characters" })).rejects.toThrow(/duplicate key/i);
  });
});

describe("AssetStorageLocation", () => {
  const loc = {
    assetId: "a1",
    provider: "google_drive",
    rootFolderId: "r",
    assetFolderId: "a",
    sourceFolderId: "s",
    previewFolderId: "p",
    versionsFolderId: "v",
  };

  it("enforces unique (assetId, provider)", async () => {
    await AssetStorageLocation.create(loc);
    await expect(AssetStorageLocation.create(loc)).rejects.toThrow(/duplicate key/i);
  });

  it("requires every mandatory folder id", async () => {
    await expect(
      AssetStorageLocation.create({ assetId: "a2", provider: "google_drive" })
    ).rejects.toThrow(/validation/i);
  });
});

describe("StorageConnection", () => {
  const conn = { provider: "google_drive", status: "Connected", encryptedRefreshToken: "t" };

  it("requires an encryptedRefreshToken", async () => {
    await expect(
      StorageConnection.create({ provider: "google_drive", status: "Connected" })
    ).rejects.toThrow(/validation/i);
  });

  it.each(["Connected", "Disconnected", "Error"])("accepts status %o", async (status) => {
    await expect(StorageConnection.create({ ...conn, status })).resolves.toBeTruthy();
  });

  it("rejects a status outside the contract", async () => {
    await expect(StorageConnection.create({ ...conn, status: "Pending" })).rejects.toThrow(
      /validation/i
    );
  });
});

describe("AssetAssignment", () => {
  // CHECK: exactly one of project_id / episode_id / scene_id is set
  it.each([
    ["projectId", { projectId: "p1" }],
    ["episodeId", { episodeId: "e1" }],
    ["sceneId", { sceneId: "s1" }],
  ])("accepts an assignment scoped to %s alone", async (_n, scope) => {
    await expect(AssetAssignment.create({ assetId: "a1", ...scope })).resolves.toBeTruthy();
  });

  it("rejects an assignment with no scope", async () => {
    await expect(AssetAssignment.create({ assetId: "a1" })).rejects.toThrow(/validation/i);
  });

  it.each([
    ["projectId + episodeId", { projectId: "p1", episodeId: "e1" }],
    ["episodeId + sceneId", { episodeId: "e1", sceneId: "s1" }],
    ["all three", { projectId: "p1", episodeId: "e1", sceneId: "s1" }],
  ])("rejects an assignment scoped to %s", async (_n, scope) => {
    await expect(AssetAssignment.create({ assetId: "a1", ...scope })).rejects.toThrow(
      /validation/i
    );
  });
});

describe("link collections", () => {
  it.each([
    ["AssetProjectLink", AssetProjectLink, { assetId: "a1", projectId: "p1" }],
    ["AssetSceneLink", AssetSceneLink, { assetId: "a1", sceneId: "s1" }],
    ["AssetJobLink", AssetJobLink, { assetId: "a1", episodeId: "e1" }],
  ])("%s rejects a duplicate pair", async (_n, Model, row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (Model as any).create(row);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect((Model as any).create(row)).rejects.toThrow(/duplicate key/i);
  });

  it("AssetProjectLink allows one asset in two projects", async () => {
    await AssetProjectLink.create({ assetId: "a1", projectId: "p1" });
    await expect(AssetProjectLink.create({ assetId: "a1", projectId: "p2" })).resolves.toBeTruthy();
  });
});
