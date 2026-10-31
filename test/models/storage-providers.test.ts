import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { syncAllIndexes } from "@/lib/models";
import { AssetFile } from "@/lib/models/AssetFile";
import { AssetStorageLocation } from "@/lib/models/AssetStorageLocation";
import { StorageConnection } from "@/lib/models/StorageConnection";

let mongo: TestMongo;

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await syncAllIndexes();
});

afterEach(async () => {
  await Promise.all([
    AssetFile.deleteMany({}),
    AssetStorageLocation.deleteMany({}),
    StorageConnection.deleteMany({}),
  ]);
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

const file = { assetId: "a1", fileUrl: "u", fileName: "f.png", fileFormat: "png" };

describe("AssetFile accepts Cloudinary files", () => {
  it("stores a cloudinary-provider file with its public id", async () => {
    const f = await AssetFile.create({
      ...file,
      provider: "cloudinary",
      cloudinaryPublicId: "productionos/a1/source/f",
      cloudinaryResourceType: "image",
      cloudinaryFormat: "png",
      cloudinaryVersion: 1730000000,
    });
    expect(f.provider).toBe("cloudinary");
    expect(f.cloudinaryPublicId).toBe("productionos/a1/source/f");
  });

  it("still accepts google_drive files", async () => {
    const f = await AssetFile.create({ ...file, provider: "google_drive", driveFileId: "d1" });
    expect(f.provider).toBe("google_drive");
  });

  it("rejects a provider outside the two", async () => {
    await expect(AssetFile.create({ ...file, provider: "s3" })).rejects.toThrow(/validation/i);
  });

  it.each(["image", "video", "raw"])("accepts the %s resource type", async (t) => {
    await expect(
      AssetFile.create({ ...file, provider: "cloudinary", cloudinaryResourceType: t })
    ).resolves.toBeTruthy();
  });

  it("rejects a resource type Cloudinary does not have", async () => {
    await expect(
      AssetFile.create({ ...file, provider: "cloudinary", cloudinaryResourceType: "audio" })
    ).rejects.toThrow(/validation/i);
  });

  it("enforces a unique cloudinaryPublicId when present", async () => {
    await AssetFile.create({ ...file, provider: "cloudinary", cloudinaryPublicId: "p1" });
    await expect(
      AssetFile.create({ ...file, provider: "cloudinary", cloudinaryPublicId: "p1" })
    ).rejects.toThrow(/duplicate key/i);
  });

  // Same partial-index reasoning as driveFileId: the field is optional, so a
  // total unique index would reject every second Drive file.
  it("allows many files with no cloudinaryPublicId", async () => {
    await AssetFile.create({ ...file, provider: "google_drive", driveFileId: "d1" });
    await AssetFile.create({ ...file, provider: "google_drive", driveFileId: "d2" });
    expect(await AssetFile.countDocuments()).toBe(2);
  });

  it("lets one asset hold a Drive source and a Cloudinary preview", async () => {
    await AssetFile.create({
      ...file,
      fileRole: "Source",
      provider: "google_drive",
      driveFileId: "d1",
    });
    await AssetFile.create({
      ...file,
      fileRole: "Preview",
      provider: "cloudinary",
      cloudinaryPublicId: "p1",
    });
    expect(await AssetFile.countDocuments({ assetId: "a1" })).toBe(2);
  });
});

describe("AssetStorageLocation accepts both providers", () => {
  const driveLocation = {
    assetId: "a1",
    provider: "google_drive",
    rootFolderId: "r",
    assetFolderId: "a",
    sourceFolderId: "s",
    previewFolderId: "p",
    versionsFolderId: "v",
  };

  /**
   * The folder ids are Drive-specific and were unconditionally required, so a
   * Cloudinary location could not be stored at all. They are now required only
   * for the google_drive provider.
   */
  it("stores a cloudinary location with a folder path and no Drive ids", async () => {
    const loc = await AssetStorageLocation.create({
      assetId: "a1",
      provider: "cloudinary",
      cloudinaryFolder: "productionos/a1",
    });
    expect(loc.provider).toBe("cloudinary");
    expect(loc.rootFolderId).toBeUndefined();
  });

  it("still requires the Drive folder ids for a google_drive location", async () => {
    await expect(
      AssetStorageLocation.create({ assetId: "a2", provider: "google_drive" })
    ).rejects.toThrow(/validation/i);
  });

  it("requires a folder path for a cloudinary location", async () => {
    await expect(
      AssetStorageLocation.create({ assetId: "a3", provider: "cloudinary" })
    ).rejects.toThrow(/validation/i);
  });

  // This is the seam the whole design rests on.
  it("lets one asset have a location in BOTH providers at once", async () => {
    await AssetStorageLocation.create(driveLocation);
    await AssetStorageLocation.create({
      assetId: "a1",
      provider: "cloudinary",
      cloudinaryFolder: "productionos/a1",
    });
    expect(await AssetStorageLocation.countDocuments({ assetId: "a1" })).toBe(2);
  });

  it("still rejects two locations for the same asset and provider", async () => {
    await AssetStorageLocation.create(driveLocation);
    await expect(AssetStorageLocation.create(driveLocation)).rejects.toThrow(/duplicate key/i);
  });
});

describe("StorageConnection stays Drive-only", () => {
  /**
   * Deliberate: a storage connection exists to hold an OAuth refresh token.
   * Cloudinary is configured by environment with a static API secret and has
   * no per-connection state, so a Cloudinary connection row would be a record
   * that can never be filled in — encryptedRefreshToken is required.
   */
  it("accepts a google_drive connection", async () => {
    await expect(
      StorageConnection.create({
        provider: "google_drive",
        status: "Connected",
        encryptedRefreshToken: "t",
      })
    ).resolves.toBeTruthy();
  });

  it("rejects a cloudinary connection, which has no refresh token to hold", async () => {
    await expect(
      StorageConnection.create({
        provider: "cloudinary",
        status: "Connected",
        encryptedRefreshToken: "t",
      })
    ).rejects.toThrow(/validation/i);
  });
});
