import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 *   CHECK ((scene_id IS NOT NULL AND project_id IS NULL)
 *       OR (scene_id IS NULL AND project_id IS NOT NULL))
 *   UNIQUE (project_id) WHERE project_id IS NOT NULL
 *   UNIQUE (scene_id)   WHERE scene_id   IS NOT NULL
 *
 * One board per project and one per scene — this pair is what
 * `get_or_create_board` keys on, and why the service can be a plain upsert.
 *
 * Both unique indexes **must** be partial: a project-scoped board has no
 * sceneId, so a total index on sceneId would make the second project board
 * collide with the first on their shared absent value.
 */
const BoardSchema = new Schema(
  {
    _id: uuidPk,
    // indexed: false — each carries its own named partial unique index below.
    projectId: refTo("Project", false, false),
    sceneId: refTo("Scene", false, false),
  },
  { ...timestamped, collection: "boards" }
);

// Named after their Postgres counterparts, which also avoids colliding with
// the auto-generated `projectId_1` / `sceneId_1` names.
BoardSchema.index(
  { projectId: 1 },
  {
    name: "boards_project_uniq",
    unique: true,
    partialFilterExpression: { projectId: { $exists: true } },
  }
);

BoardSchema.index(
  { sceneId: 1 },
  {
    name: "boards_scene_uniq",
    unique: true,
    partialFilterExpression: { sceneId: { $exists: true } },
  }
);

BoardSchema.pre("validate", function () {
  const scopes = [this.projectId, this.sceneId].filter((v) => v !== undefined && v !== null);
  if (scopes.length !== 1) {
    this.invalidate(
      "projectId",
      "a board must be scoped to exactly one of projectId or sceneId"
    );
  }
});

export type BoardDoc = InferSchemaType<typeof BoardSchema> & { _id: string };

export const Board: Model<BoardDoc> =
  (mongoose.models.Board as Model<BoardDoc>) ?? mongoose.model<BoardDoc>("Board", BoardSchema);
