/**
 * Helper to resolve the usable preview image source URL for an asset.
 * - Returns null when empty/falsy
 * - Returns the value itself when it starts with http:, https:, data:, blob:, or /
 * - Otherwise returns `/api/assets/${asset.id}/preview` to stream from Google Drive
 */
export function assetPreviewSrc(asset: {
  id: string;
  previewUrl: string | null | undefined;
}): string | null {
  if (!asset.previewUrl) return null;
  const trimmed = asset.previewUrl.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http:") ||
    trimmed.startsWith("https:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return `/api/assets/${asset.id}/preview`;
}
