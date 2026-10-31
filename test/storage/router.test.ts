import { describe, it, expect } from "vitest";
import {
  routeUpload,
  CLOUDINARY_IMAGE_MAX_BYTES,
  CLOUDINARY_VIDEO_MAX_BYTES,
} from "@/lib/storage/router";

const MB = 1024 * 1024;

describe("routeUpload — previews are always Cloudinary", () => {
  // The upload route already restricts Preview to images, so size never
  // applies: a Preview row is Cloudinary's job by definition.
  it.each([1, 50 * MB])("sends a Preview to cloudinary at %i bytes", (sizeBytes) => {
    const r = routeUpload({ fileRole: "Preview", mimeType: "image/png", sizeBytes });
    expect(r.provider).toBe("cloudinary");
  });

  it("never asks to derive a preview of a preview", () => {
    const r = routeUpload({ fileRole: "Preview", mimeType: "image/png", sizeBytes: 1 });
    expect(r.derivePreview).toBe(false);
  });
});

describe("routeUpload — small media goes to Cloudinary", () => {
  it.each([
    ["image/png", 1],
    ["image/jpeg", CLOUDINARY_IMAGE_MAX_BYTES - 1],
    ["image/webp", 5 * MB],
    ["video/mp4", CLOUDINARY_VIDEO_MAX_BYTES - 1],
    ["video/quicktime", 20 * MB],
  ])("routes %s at %i bytes to cloudinary", (mimeType, sizeBytes) => {
    expect(routeUpload({ fileRole: "Source", mimeType, sizeBytes }).provider).toBe("cloudinary");
  });

  // A file Cloudinary already holds needs no second copy derived elsewhere.
  it("does not ask for a derived preview when the original is on Cloudinary", () => {
    const r = routeUpload({ fileRole: "Source", mimeType: "image/png", sizeBytes: 1 });
    expect(r.derivePreview).toBe(false);
  });
});

describe("routeUpload — the threshold boundary", () => {
  // Exactly at the limit is accepted; one byte over is not. Stated explicitly
  // because an off-by-one here means Cloudinary rejects an upload the router
  // already promised it.
  it("accepts an image exactly at the limit", () => {
    const r = routeUpload({
      fileRole: "Source",
      mimeType: "image/png",
      sizeBytes: CLOUDINARY_IMAGE_MAX_BYTES,
    });
    expect(r.provider).toBe("cloudinary");
  });

  it("sends an image one byte over the limit to drive", () => {
    const r = routeUpload({
      fileRole: "Source",
      mimeType: "image/png",
      sizeBytes: CLOUDINARY_IMAGE_MAX_BYTES + 1,
    });
    expect(r.provider).toBe("drive");
  });

  it("accepts a video exactly at the limit", () => {
    const r = routeUpload({
      fileRole: "Source",
      mimeType: "video/mp4",
      sizeBytes: CLOUDINARY_VIDEO_MAX_BYTES,
    });
    expect(r.provider).toBe("cloudinary");
  });

  it("sends a video one byte over the limit to drive", () => {
    const r = routeUpload({
      fileRole: "Source",
      mimeType: "video/mp4",
      sizeBytes: CLOUDINARY_VIDEO_MAX_BYTES + 1,
    });
    expect(r.provider).toBe("drive");
  });

  it("uses the image limit for images and the video limit for video", () => {
    // A size that is over the image limit but under the video one must split.
    const between = CLOUDINARY_IMAGE_MAX_BYTES + 1;
    expect(routeUpload({ fileRole: "Source", mimeType: "image/png", sizeBytes: between }).provider).toBe("drive");
    expect(routeUpload({ fileRole: "Source", mimeType: "video/mp4", sizeBytes: between }).provider).toBe("cloudinary");
  });
});

describe("routeUpload — non-media always goes to Drive", () => {
  /**
   * "Small" means small *media*, not small file. A 2 MB .blend or .zip gains
   * nothing from Cloudinary — no transformations, no derivatives — and Drive
   * is the right home for project files.
   */
  it.each([
    ["application/zip", 1],
    ["application/octet-stream", 1],
    ["application/pdf", 1],
    ["text/plain", 1],
    ["application/x-blender", 100],
  ])("routes %s to drive even at %i bytes", (mimeType, sizeBytes) => {
    expect(routeUpload({ fileRole: "Source", mimeType, sizeBytes }).provider).toBe("drive");
  });

  it("does not ask for a derived preview of a non-media file", () => {
    // Nothing can make a thumbnail of a zip, so asking would guarantee a failure.
    const r = routeUpload({ fileRole: "Source", mimeType: "application/zip", sizeBytes: 9 * MB });
    expect(r.derivePreview).toBe(false);
  });
});

describe("routeUpload — derived previews for Drive-stored media", () => {
  it.each([
    ["image/png", CLOUDINARY_IMAGE_MAX_BYTES + 1],
    ["video/mp4", CLOUDINARY_VIDEO_MAX_BYTES + 1],
  ])("asks for a Cloudinary preview of the large %s on drive", (mimeType, sizeBytes) => {
    const r = routeUpload({ fileRole: "Source", mimeType, sizeBytes });
    expect(r.provider).toBe("drive");
    expect(r.derivePreview).toBe(true);
  });
});

describe("routeUpload — versions follow the same rule as sources", () => {
  it.each(["Version", "Versions"] as const)("routes a small %s to cloudinary", (fileRole) => {
    expect(routeUpload({ fileRole, mimeType: "image/png", sizeBytes: 1 }).provider).toBe("cloudinary");
  });

  it("routes a large Version to drive", () => {
    const r = routeUpload({
      fileRole: "Versions",
      mimeType: "image/png",
      sizeBytes: CLOUDINARY_IMAGE_MAX_BYTES + 1,
    });
    expect(r.provider).toBe("drive");
  });
});

describe("routeUpload — defensive inputs", () => {
  it("routes an unknown mime type to drive rather than guessing", () => {
    expect(routeUpload({ fileRole: "Source", mimeType: "", sizeBytes: 1 }).provider).toBe("drive");
  });

  it("rejects a negative size rather than routing it", () => {
    expect(() =>
      routeUpload({ fileRole: "Source", mimeType: "image/png", sizeBytes: -1 })
    ).toThrow(/size/i);
  });

  it("treats a mime type with parameters as its base type", () => {
    // Browsers send things like "text/plain; charset=utf-8".
    const r = routeUpload({
      fileRole: "Source",
      mimeType: "image/jpeg; charset=binary",
      sizeBytes: 1,
    });
    expect(r.provider).toBe("cloudinary");
  });

  it("is case-insensitive about the mime type", () => {
    expect(routeUpload({ fileRole: "Source", mimeType: "IMAGE/PNG", sizeBytes: 1 }).provider).toBe("cloudinary");
  });

  it("explains itself, so a UI can say why a file went where", () => {
    expect(routeUpload({ fileRole: "Source", mimeType: "application/zip", sizeBytes: 1 }).reason)
      .toMatch(/not media/i);
    expect(routeUpload({ fileRole: "Preview", mimeType: "image/png", sizeBytes: 1 }).reason)
      .toMatch(/preview/i);
  });
});

describe("Cloudinary resource type", () => {
  it.each([
    ["image/png", "image"],
    ["video/mp4", "video"],
    ["application/zip", "raw"],
  ])("maps %s to the %s resource type", async (mimeType, expected) => {
    const { cloudinaryResourceType } = await import("@/lib/storage/router");
    expect(cloudinaryResourceType(mimeType)).toBe(expected);
  });
});

describe("routeUpload — Cloudinary's pixel ceiling", () => {
  /**
   * Found by querying the live account: `media_limits.image_max_px` is 25 MP,
   * enforced independently of file size. A well-compressed 8000x4000 JPEG can
   * be 5 MB and 32 MP — comfortably under the size limit and still rejected.
   *
   * Dimensions are optional because only the browser knows them before upload.
   * When they are absent the size rule alone applies, which is the behaviour
   * that existed before this check.
   */
  it("sends an over-megapixel image to drive despite a small file size", () => {
    const r = routeUpload({
      fileRole: "Source",
      mimeType: "image/jpeg",
      sizeBytes: 5 * MB,
      widthPx: 8000,
      heightPx: 4000, // 32 MP
    });
    expect(r.provider).toBe("drive");
    expect(r.derivePreview).toBe(true);
    expect(r.reason).toMatch(/megapixel|pixel/i);
  });

  it("keeps an image at exactly the pixel ceiling on cloudinary", () => {
    const r = routeUpload({
      fileRole: "Source",
      mimeType: "image/jpeg",
      sizeBytes: 1 * MB,
      widthPx: 5000,
      heightPx: 5000, // exactly 25 MP
    });
    expect(r.provider).toBe("cloudinary");
  });

  it("applies the size rule alone when dimensions are unknown", () => {
    const r = routeUpload({ fileRole: "Source", mimeType: "image/jpeg", sizeBytes: 5 * MB });
    expect(r.provider).toBe("cloudinary");
  });

  it("ignores dimensions for video, which has no such ceiling", () => {
    const r = routeUpload({
      fileRole: "Source",
      mimeType: "video/mp4",
      sizeBytes: 1 * MB,
      widthPx: 7680,
      heightPx: 4320, // 33 MP of 8K video
    });
    expect(r.provider).toBe("cloudinary");
  });

  // A Preview is Cloudinary's by definition, but an oversized one would still
  // be rejected on arrival, so the ceiling has to apply there too.
  it("sends an over-megapixel Preview to drive rather than promising Cloudinary", () => {
    const r = routeUpload({
      fileRole: "Preview",
      mimeType: "image/png",
      sizeBytes: 1 * MB,
      widthPx: 9000,
      heightPx: 9000,
    });
    expect(r.provider).toBe("drive");
  });
});
