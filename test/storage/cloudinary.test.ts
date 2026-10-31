import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import {
  signUploadParams,
  buildUploadTarget,
  deliveryUrl,
  assetFolderFor,
  CLOUDINARY_SIGNATURE_TTL_SECONDS,
} from "@/lib/storage/cloudinary";

const ENV = {
  CLOUDINARY_CLOUD_NAME: "demo-cloud",
  CLOUDINARY_API_KEY: "222333444555666",
  CLOUDINARY_API_SECRET: "test-secret-value",
};

beforeEach(() => {
  Object.assign(process.env, ENV);
});

afterEach(() => {
  for (const k of Object.keys(ENV)) delete process.env[k];
});

describe("signUploadParams", () => {
  /**
   * Verified against Cloudinary's documented algorithm — sort the params by
   * key, join as k=v&k=v, append the API secret, SHA-1 — rather than against
   * our own re-implementation, which would only prove the code matches itself.
   */
  it("matches Cloudinary's documented signature algorithm", () => {
    const params = { folder: "productionos/a1", public_id: "f", timestamp: 1730000000 };
    const { signature } = signUploadParams(params);

    const expected = crypto
      .createHash("sha1")
      .update("folder=productionos/a1&public_id=f&timestamp=1730000000" + ENV.CLOUDINARY_API_SECRET)
      .digest("hex");

    expect(signature).toBe(expected);
  });

  it("sorts parameters by key regardless of the order given", () => {
    const a = signUploadParams({ timestamp: 1, folder: "x", public_id: "p" });
    const b = signUploadParams({ public_id: "p", folder: "x", timestamp: 1 });
    expect(a.signature).toBe(b.signature);
  });

  it("omits empty values rather than signing them", () => {
    // Cloudinary excludes blank parameters from the signature; including them
    // produces a signature the server will reject.
    const withBlank = signUploadParams({ timestamp: 1, folder: "x", public_id: "" });
    const without = signUploadParams({ timestamp: 1, folder: "x" });
    expect(withBlank.signature).toBe(without.signature);
  });

  it("never returns the API secret", () => {
    const signed = signUploadParams({ timestamp: 1 });
    expect(JSON.stringify(signed)).not.toContain(ENV.CLOUDINARY_API_SECRET);
  });

  it("throws a named error when the secret is not configured", () => {
    delete process.env.CLOUDINARY_API_SECRET;
    expect(() => signUploadParams({ timestamp: 1 })).toThrow(/CLOUDINARY_API_SECRET/);
  });
});

describe("buildUploadTarget", () => {
  const facts = {
    assetId: "a1",
    fileRole: "Source" as const,
    mimeType: "image/png",
    fileName: "hero shot.png",
  };

  it("points at the right cloud and resource type", () => {
    const t = buildUploadTarget(facts);
    expect(t.uploadUrl).toBe("https://api.cloudinary.com/v1_1/demo-cloud/image/upload");
    expect(t.resourceType).toBe("image");
  });

  it("uses the video endpoint for video", () => {
    const t = buildUploadTarget({ ...facts, mimeType: "video/mp4" });
    expect(t.uploadUrl).toContain("/video/upload");
  });

  it("uses the raw endpoint for anything else", () => {
    const t = buildUploadTarget({ ...facts, mimeType: "application/zip" });
    expect(t.uploadUrl).toContain("/raw/upload");
  });

  it("scopes the folder to the asset and role", () => {
    expect(buildUploadTarget(facts).params.folder).toBe("productionos/assets/a1/source");
    expect(buildUploadTarget({ ...facts, fileRole: "Preview" }).params.folder).toBe(
      "productionos/assets/a1/preview"
    );
  });

  it("returns the api key but never the secret", () => {
    const t = buildUploadTarget(facts);
    expect(t.params.api_key).toBe(ENV.CLOUDINARY_API_KEY);
    expect(JSON.stringify(t)).not.toContain(ENV.CLOUDINARY_API_SECRET);
  });

  it("includes a signature and a timestamp", () => {
    const t = buildUploadTarget(facts);
    expect(t.params.signature).toMatch(/^[a-f0-9]{40}$/);
    expect(t.params.timestamp).toBeGreaterThan(1_700_000_000);
  });

  // A leaked signature must not be replayable forever, nor usable against
  // another asset's folder.
  it("expires, so a captured signature cannot be replayed indefinitely", () => {
    const t = buildUploadTarget(facts);
    expect(t.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
      CLOUDINARY_SIGNATURE_TTL_SECONDS * 1000 + 1000
    );
  });

  it("signs the folder, so the signature cannot be reused for another asset", () => {
    const a = buildUploadTarget(facts);
    const b = buildUploadTarget({ ...facts, assetId: "a2" });
    expect(a.params.signature).not.toBe(b.params.signature);
  });

  it("sanitises the public id out of the file name", () => {
    // Spaces and slashes in a public id break delivery URLs and could escape
    // the asset's folder.
    const t = buildUploadTarget({ ...facts, fileName: "../../etc/hero shot.PNG" });
    expect(t.params.public_id).not.toContain("/");
    expect(t.params.public_id).not.toContain(" ");
    expect(t.params.public_id).not.toContain("..");
  });

  it("drops the extension from the public id", () => {
    // Cloudinary derives format from the upload; a public id ending in .png
    // yields URLs like /f.png.png.
    expect(buildUploadTarget(facts).params.public_id).not.toMatch(/\.png$/i);
  });
});

describe("assetFolderFor", () => {
  it.each([
    ["Source", "productionos/assets/a1/source"],
    ["Preview", "productionos/assets/a1/preview"],
    ["Version", "productionos/assets/a1/versions"],
    ["Versions", "productionos/assets/a1/versions"],
  ])("maps the %s role to %s", (role, expected) => {
    expect(assetFolderFor("a1", role as "Source")).toBe(expected);
  });
});

describe("deliveryUrl", () => {
  it("builds a plain delivery url", () => {
    expect(deliveryUrl({ publicId: "productionos/assets/a1/source/f", resourceType: "image" }))
      .toBe("https://res.cloudinary.com/demo-cloud/image/upload/productionos/assets/a1/source/f");
  });

  it("inserts transformations before the public id", () => {
    const url = deliveryUrl({
      publicId: "productionos/assets/a1/source/f",
      resourceType: "image",
      transformation: "c_fill,w_320,h_320",
    });
    expect(url).toContain("/upload/c_fill,w_320,h_320/productionos/");
  });

  it("pins a version when one is given, so a cached url cannot drift", () => {
    const url = deliveryUrl({
      publicId: "f",
      resourceType: "image",
      version: 1730000000,
    });
    expect(url).toContain("/upload/v1730000000/f");
  });

  it("offers a thumbnail transformation for the asset grid", async () => {
    const { THUMBNAIL_TRANSFORMATION } = await import("@/lib/storage/cloudinary");
    const url = deliveryUrl({
      publicId: "f",
      resourceType: "image",
      transformation: THUMBNAIL_TRANSFORMATION,
    });
    expect(url).toMatch(/\/upload\/[^/]*c_fill[^/]*\/f$/);
  });
});
