import crypto from "node:crypto";
import type { FileRole } from "@/lib/models/AssetFile";
import { cloudinaryResourceType } from "./router";

/**
 * Cloudinary upload signing and delivery URLs.
 *
 * **Signed uploads, not unsigned presets.** An unsigned preset is effectively a
 * world-writable bucket: anyone who reads the cloud name from a delivery URL
 * can upload into it. Signing keeps the secret on the server and hands the
 * browser a narrow, expiring permission to upload one file to one folder.
 *
 * The SDK is deliberately not used here. Signing is a dozen lines of SHA-1 and
 * doing it directly keeps the secret out of a dependency's hands and makes the
 * algorithm visible to the test that verifies it.
 */

/** How long a handed-out upload signature stays usable. */
export const CLOUDINARY_SIGNATURE_TTL_SECONDS = 10 * 60;

/** Square crop for the asset grid. */
export const THUMBNAIL_TRANSFORMATION = "c_fill,w_320,h_320,q_auto,f_auto";

export type SignableParams = Record<string, string | number | undefined>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable.`);
  return value;
}

/**
 * Cloudinary's documented algorithm: take the params to be signed, sort by
 * key, join as `k=v&k=v`, append the API secret, SHA-1 the result.
 *
 * Blank values are excluded — Cloudinary omits them when it recomputes the
 * signature, so including them here produces one the server rejects.
 */
export function signUploadParams(params: SignableParams): {
  signature: string;
  signed: Record<string, string | number>;
} {
  const secret = requireEnv("CLOUDINARY_API_SECRET");

  const signed: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    signed[key] = value;
  }

  const payload = Object.keys(signed)
    .sort()
    .map((key) => `${key}=${signed[key]}`)
    .join("&");

  const signature = crypto
    .createHash("sha1")
    .update(payload + secret)
    .digest("hex");

  return { signature, signed };
}

/** Where one asset's files live in Cloudinary, by role. */
export function assetFolderFor(assetId: string, fileRole: FileRole): string {
  const bucket =
    fileRole === "Preview" ? "preview" : fileRole === "Source" ? "source" : "versions";
  return `productionos/assets/${assetId}/${bucket}`;
}

/**
 * A public id has to survive being pasted into a URL path, and must not be
 * able to climb out of its folder. Strips the extension (Cloudinary derives
 * format from the upload itself, and a trailing `.png` yields `/f.png.png`).
 */
export function toPublicId(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^./\\]+$/, "");
  const base = withoutExtension.split(/[/\\]/).pop() ?? withoutExtension;
  return (
    base
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 180) || "file"
  );
}

export type UploadTargetFacts = {
  assetId: string;
  fileRole: FileRole;
  mimeType: string;
  fileName: string;
};

export type UploadTarget = {
  uploadUrl: string;
  resourceType: "image" | "video" | "raw";
  /** POST these as form fields alongside the file. Contains no secret. */
  params: Record<string, string | number>;
  expiresAt: Date;
};

/**
 * Everything the browser needs to upload one file directly to Cloudinary.
 *
 * The folder is part of the signed payload, so a captured signature cannot be
 * replayed against a different asset — and it expires, so it cannot be
 * replayed indefinitely either.
 */
export function buildUploadTarget(facts: UploadTargetFacts): UploadTarget {
  const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requireEnv("CLOUDINARY_API_KEY");

  const resourceType = cloudinaryResourceType(facts.mimeType);
  const timestamp = Math.floor(Date.now() / 1000);

  const { signature, signed } = signUploadParams({
    folder: assetFolderFor(facts.assetId, facts.fileRole),
    public_id: toPublicId(facts.fileName),
    timestamp,
  });

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    resourceType,
    params: { ...signed, api_key: apiKey, signature },
    expiresAt: new Date((timestamp + CLOUDINARY_SIGNATURE_TTL_SECONDS) * 1000),
  };
}

export type DeliveryOptions = {
  publicId: string;
  resourceType: "image" | "video" | "raw";
  transformation?: string;
  /**
   * Pins a specific upload. Without it a delivery URL points at "whatever is
   * there now", so a replaced file can change under a cached page.
   */
  version?: number;
};

export function deliveryUrl(options: DeliveryOptions): string {
  const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
  const segments = [
    `https://res.cloudinary.com/${cloudName}`,
    options.resourceType,
    "upload",
  ];
  if (options.transformation) segments.push(options.transformation);
  if (options.version) segments.push(`v${options.version}`);
  segments.push(options.publicId);
  return segments.join("/");
}
