/**
 * Two-provider asset storage: Cloudinary for small media and all previews,
 * Google Drive for large masters and anything non-media.
 *
 * The routing decision is a pure function, because uploads go directly from
 * the browser to the provider — the server never sees the file and so must
 * choose before any bytes move.
 */
export {
  routeUpload,
  cloudinaryResourceType,
  isImage,
  isVideo,
  isMedia,
  CLOUDINARY_IMAGE_MAX_BYTES,
  CLOUDINARY_VIDEO_MAX_BYTES,
  type StorageProvider,
  type UploadFacts,
  type RoutingDecision,
} from "./router";

export {
  signUploadParams,
  buildUploadTarget,
  deliveryUrl,
  assetFolderFor,
  toPublicId,
  THUMBNAIL_TRANSFORMATION,
  CLOUDINARY_SIGNATURE_TTL_SECONDS,
  type UploadTarget,
  type DeliveryOptions,
} from "./cloudinary";

export {
  planUpload,
  recordUploadedFile,
  type UploadRequest,
  type UploadPlan,
  type RecordRequest,
} from "./service";
