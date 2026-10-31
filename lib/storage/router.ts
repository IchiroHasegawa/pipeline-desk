import type { FileRole } from "@/lib/models/AssetFile";

/**
 * Decides which provider a file goes to, before any bytes move.
 *
 * It has to be decided up front: uploads are resumable and go **directly from
 * the browser** to the provider, so the server never sees the file and cannot
 * change its mind afterwards. All this function gets is what the client
 * declares — role, MIME type, size.
 *
 * Pure, with no I/O and no account lookups, so it gives the same answer on the
 * server and in the browser and is exhaustively testable.
 */
export type StorageProvider = "cloudinary" | "drive";

export type UploadFacts = {
  fileRole: FileRole;
  mimeType: string;
  sizeBytes: number;
};

export type RoutingDecision = {
  provider: StorageProvider;
  /**
   * True when the original is going to Drive but a Cloudinary preview should
   * be derived from it, so large masters still get a fast thumbnail.
   *
   * Only the *decision* lives here. Deriving the preview means downscaling in
   * the browser, which already holds the bytes — Cloudinary cannot fetch the
   * original, because Drive files are private, and pulling a multi-gigabyte
   * master through our server to re-upload it is not acceptable.
   */
  derivePreview: boolean;
  /** Why, in words a UI can show. */
  reason: string;
};

function envBytes(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Account-plan limits, not design truths — hence overridable.
 *
 * These defaults assume the free tier. **Verify against the real account
 * before the cutover:** set too high, the router promises Cloudinary an upload
 * Cloudinary will then reject, which is the worst failure mode because it
 * happens after the user has waited.
 */
export const CLOUDINARY_IMAGE_MAX_BYTES = envBytes(
  "CLOUDINARY_IMAGE_MAX_BYTES",
  10 * 1024 * 1024
);

export const CLOUDINARY_VIDEO_MAX_BYTES = envBytes(
  "CLOUDINARY_VIDEO_MAX_BYTES",
  100 * 1024 * 1024
);

/** Strips any `; charset=…` parameter and lowercases. */
function baseMime(mimeType: string): string {
  return (mimeType ?? "").split(";")[0].trim().toLowerCase();
}

export function isImage(mimeType: string): boolean {
  return baseMime(mimeType).startsWith("image/");
}

export function isVideo(mimeType: string): boolean {
  return baseMime(mimeType).startsWith("video/");
}

export function isMedia(mimeType: string): boolean {
  return isImage(mimeType) || isVideo(mimeType);
}

/** Cloudinary's own taxonomy for the upload endpoint. */
export function cloudinaryResourceType(mimeType: string): "image" | "video" | "raw" {
  if (isImage(mimeType)) return "image";
  if (isVideo(mimeType)) return "video";
  return "raw";
}

export function routeUpload(facts: UploadFacts): RoutingDecision {
  const { fileRole, mimeType, sizeBytes } = facts;

  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    throw new Error(`Invalid file size: ${sizeBytes}`);
  }

  // Previews are Cloudinary's whole purpose, and the upload route already
  // restricts them to images, so size never enters into it.
  if (fileRole === "Preview") {
    return {
      provider: "cloudinary",
      derivePreview: false,
      reason: "Previews are always stored on Cloudinary.",
    };
  }

  // "Small" means small *media*. A 2 MB .blend or .zip gains nothing from
  // Cloudinary — no transformations, no derivatives — so Drive is its home
  // whatever its size.
  if (!isMedia(mimeType)) {
    return {
      provider: "drive",
      derivePreview: false,
      reason: "Stored on Google Drive because it is not media, so Cloudinary offers nothing for it.",
    };
  }

  const limit = isImage(mimeType) ? CLOUDINARY_IMAGE_MAX_BYTES : CLOUDINARY_VIDEO_MAX_BYTES;

  if (sizeBytes <= limit) {
    return {
      provider: "cloudinary",
      derivePreview: false,
      reason: "Stored on Cloudinary, which serves and transforms it directly.",
    };
  }

  return {
    provider: "drive",
    derivePreview: true,
    reason: `Stored on Google Drive because it exceeds Cloudinary's ${Math.round(
      limit / (1024 * 1024)
    )} MB limit; a preview will be derived for fast browsing.`,
  };
}
