import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 *   CHECK (element_type IN ('keyframe','asset','folder','comment','arrow'))
 *   CHECK (element_type <> 'arrow'
 *          OR (from_element_id IS NOT NULL AND to_element_id IS NOT NULL
 *              AND from_element_id <> to_element_id))
 *   CHECK (element_type <> 'keyframe'
 *          OR (asset_id IS NOT NULL OR asset_file_id IS NOT NULL OR image_url IS NOT NULL))
 *   CHECK (parent_folder_id IS NULL OR parent_folder_id <> id)
 *   UNIQUE (board_id, keyframe_number)
 *     WHERE element_type = 'keyframe' AND keyframe_number IS NOT NULL
 *
 * `created_by` defaulted to `auth.uid()` in Postgres. There is no database
 * session under custom auth, so the application supplies it.
 */
export const ELEMENT_TYPES = ["keyframe", "asset", "folder", "comment", "arrow"] as const;

const BoardElementSchema = new Schema(
  {
    _id: uuidPk,
    boardId: refTo("Board", true),
    elementType: { type: String, required: true, enum: ELEMENT_TYPES },

    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    width: { type: Number },
    height: { type: Number },
    zIndex: { type: Number, required: true, default: 0 },

    title: { type: String },
    body: { type: String },
    colour: { type: String },
    imageUrl: { type: String },
    keyframeNumber: { type: Number },

    assetId: refTo("Asset"),
    assetFileId: refTo("AssetFile"),
    parentFolderId: refTo("BoardElement"),
    fromElementId: refTo("BoardElement"),
    toElementId: refTo("BoardElement"),
    createdBy: refTo("Profile"),
  },
  { ...timestamped, collection: "board_elements" }
);

BoardElementSchema.index(
  { boardId: 1, keyframeNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      elementType: "keyframe",
      keyframeNumber: { $exists: true },
    },
  }
);

BoardElementSchema.pre("validate", function () {
  if (this.elementType === "arrow") {
    if (!this.fromElementId || !this.toElementId) {
      this.invalidate("fromElementId", "an arrow needs both fromElementId and toElementId");
    } else if (this.fromElementId === this.toElementId) {
      this.invalidate("toElementId", "an arrow cannot start and end on the same element");
    }
  }

  if (this.elementType === "keyframe" && !this.assetId && !this.assetFileId && !this.imageUrl) {
    this.invalidate(
      "imageUrl",
      "a keyframe needs one of assetId, assetFileId or imageUrl"
    );
  }

  if (this.parentFolderId && this.parentFolderId === this._id) {
    this.invalidate("parentFolderId", "an element cannot be its own parent folder");
  }
});

export type BoardElementDoc = InferSchemaType<typeof BoardElementSchema> & { _id: string };

export const BoardElement: Model<BoardElementDoc> =
  (mongoose.models.BoardElement as Model<BoardElementDoc>) ??
  mongoose.model<BoardElementDoc>("BoardElement", BoardElementSchema);
