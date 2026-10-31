import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { syncAllIndexes } from "@/lib/models";
import { AssetFile } from "@/lib/models/AssetFile";
import { AssetStorageLocation } from "@/lib/models/AssetStorageLocation";
import { planUpload, recordUploadedFile } from "@/lib/storage/service";
import { ForbiddenError } from "@/lib/permissions/errors";
import type { Actor } from "@/lib/permissions";

let mongo: TestMongo;
const alice: Actor = { _id: "alice", accountStatus: "active", systemRole: "user" };
const MB = 1024 * 1024;

beforeAll(async () => {
  Object.assign(process.env, {
    CLOUDINARY_CLOUD_NAME: "demo-cloud",
    CLOUDINARY_API_KEY: "222333444555666",
    CLOUDINARY_API_SECRET: "test-secret-value",
  });
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await syncAllIndexes();
});

afterEach(async () => {
  await Promise.all([AssetFile.deleteMany({}), AssetStorageLocation.deleteMany({})]);
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

const small = {
  assetId: "a1",
  fileRole: "Source" as const,
  fileName: "hero.png",
  mimeType: "image/png",
  sizeBytes: 2 * MB,
};

const large = { ...small, sizeBytes: 500 * MB, fileName: "master.mov", mimeType: "video/quicktime" };

describe("planUpload", () => {
  it("requires an active account", async () => {
    await expect(
      planUpload({ ...alice, accountStatus: "disabled" }, small)
    ).rejects.toThrow(ForbiddenError);
  });

  it("hands back a signed Cloudinary target for a small image", async () => {
    const plan = await planUpload(alice, small);
    expect(plan.provider).toBe("cloudinary");
    expect(plan.cloudinary?.uploadUrl).toContain("/demo-cloud/image/upload");
    expect(plan.cloudinary?.params.signature).toMatch(/^[a-f0-9]{40}$/);
    expect(plan.drive).toBeUndefined();
  });

  it("never leaks the API secret in the plan", async () => {
    const plan = await planUpload(alice, small);
    expect(JSON.stringify(plan)).not.toContain("test-secret-value");
  });

  it("defers to Drive for a large file and asks for a derived preview", async () => {
    const plan = await planUpload(alice, large);
    expect(plan.provider).toBe("drive");
    expect(plan.derivePreview).toBe(true);
    // The Drive session is minted by the existing route; this only says so.
    expect(plan.cloudinary).toBeUndefined();
  });

  it("gives a reason a UI can show the user", async () => {
    expect((await planUpload(alice, large)).reason).toMatch(/exceeds/i);
  });

  it("creates the Cloudinary storage location on first use", async () => {
    await planUpload(alice, small);
    const loc = await AssetStorageLocation.findOne({
      assetId: "a1",
      provider: "cloudinary",
    }).lean();
    expect(loc?.cloudinaryFolder).toBe("productionos/assets/a1");
  });

  it("does not create a second location on a repeat upload", async () => {
    await planUpload(alice, small);
    await planUpload(alice, { ...small, fileName: "other.png" });
    expect(
      await AssetStorageLocation.countDocuments({ assetId: "a1", provider: "cloudinary" })
    ).toBe(1);
  });

  it("does not create a Cloudinary location for a Drive-bound upload", async () => {
    await planUpload(alice, large);
    expect(await AssetStorageLocation.countDocuments({ provider: "cloudinary" })).toBe(0);
  });
});

describe("recordUploadedFile", () => {
  it("records a Cloudinary file with its provider fields", async () => {
    const f = await recordUploadedFile(alice, {
      assetId: "a1",
      fileRole: "Source",
      fileName: "hero.png",
      mimeType: "image/png",
      sizeBytes: 2 * MB,
      provider: "cloudinary",
      cloudinary: {
        publicId: "productionos/assets/a1/source/hero",
        resourceType: "image",
        format: "png",
        version: 1730000000,
        secureUrl: "https://res.cloudinary.com/demo-cloud/image/upload/v1730000000/hero.png",
      },
    });

    expect(f.provider).toBe("cloudinary");
    expect(f.cloudinaryPublicId).toBe("productionos/assets/a1/source/hero");
    expect(f.cloudinaryVersion).toBe(1730000000);
    expect(f.recordStatus).toBe("Active");
    expect(f.fileUrl).toContain("res.cloudinary.com");
  });

  it("records a Drive file with its provider fields", async () => {
    const f = await recordUploadedFile(alice, {
      assetId: "a1",
      fileRole: "Source",
      fileName: "master.mov",
      mimeType: "video/quicktime",
      sizeBytes: 500 * MB,
      provider: "drive",
      drive: {
        fileId: "drive-abc",
        parentFolderId: "folder-1",
        webViewLink: "https://drive.google.com/file/d/drive-abc/view",
      },
    });

    expect(f.provider).toBe("google_drive");
    expect(f.driveFileId).toBe("drive-abc");
    expect(f.cloudinaryPublicId).toBeUndefined();
  });

  it("lets one asset hold a Drive source and its Cloudinary preview", async () => {
    await recordUploadedFile(alice, {
      assetId: "a1",
      fileRole: "Source",
      fileName: "master.mov",
      mimeType: "video/quicktime",
      sizeBytes: 500 * MB,
      provider: "drive",
      drive: { fileId: "drive-abc", parentFolderId: "f1", webViewLink: "https://drive/x" },
    });
    await recordUploadedFile(alice, {
      assetId: "a1",
      fileRole: "Preview",
      fileName: "master-preview.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 80_000,
      provider: "cloudinary",
      cloudinary: {
        publicId: "productionos/assets/a1/preview/master-preview",
        resourceType: "image",
        format: "jpg",
        version: 1730000001,
        secureUrl: "https://res.cloudinary.com/demo-cloud/image/upload/x.jpg",
      },
    });

    const files = await AssetFile.find({ assetId: "a1" }).lean();
    expect(files).toHaveLength(2);
    expect(files.map((f) => f.provider).sort()).toEqual(["cloudinary", "google_drive"]);
  });

  it("refuses a Cloudinary record with no public id", async () => {
    await expect(
      recordUploadedFile(alice, {
        assetId: "a1",
        fileRole: "Source",
        fileName: "x.png",
        mimeType: "image/png",
        sizeBytes: 1,
        provider: "cloudinary",
      })
    ).rejects.toThrow(/cloudinary/i);
  });

  it("refuses a Drive record with no file id", async () => {
    await expect(
      recordUploadedFile(alice, {
        assetId: "a1",
        fileRole: "Source",
        fileName: "x.mov",
        mimeType: "video/quicktime",
        sizeBytes: 1,
        provider: "drive",
      })
    ).rejects.toThrow(/drive/i);
  });

  it("requires an active account", async () => {
    await expect(
      recordUploadedFile({ ...alice, accountStatus: "suspended" }, {
        assetId: "a1",
        fileRole: "Source",
        fileName: "x.png",
        mimeType: "image/png",
        sizeBytes: 1,
        provider: "cloudinary",
        cloudinary: {
          publicId: "p",
          resourceType: "image",
          format: "png",
          version: 1,
          secureUrl: "https://x",
        },
      })
    ).rejects.toThrow(ForbiddenError);
  });
});
