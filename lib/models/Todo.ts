import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { uuidPk, refTo, timestamped } from "./_shared";

/**
 *   CHECK ((episode_id IS NOT NULL AND scene_id IS NULL)
 *       OR (episode_id IS NULL AND scene_id IS NOT NULL))
 *   CHECK (length(btrim(title)) > 0)
 *
 * `user_id` defaulted to `auth.uid()` in Postgres and is NOT NULL. There is no
 * database session under custom auth, so `profileId` is required here and the
 * repository must pass the acting user. A missing value fails loudly rather
 * than quietly creating an unowned todo.
 */
const TodoSchema = new Schema(
  {
    _id: uuidPk,
    profileId: refTo("Profile", true),
    title: { type: String, required: true, trim: true, minlength: 1 },
    description: { type: String },
    episodeId: refTo("Episode"),
    sceneId: refTo("Scene"),
    taskId: refTo("ProductionTask"),
    sortOrder: { type: Number },
    completedAt: { type: Date },
  },
  { ...timestamped, collection: "todos" }
);

TodoSchema.pre("validate", function () {
  const scopes = [this.episodeId, this.sceneId].filter((v) => v !== undefined && v !== null);
  if (scopes.length !== 1) {
    this.invalidate("sceneId", "a todo must be scoped to exactly one of episodeId or sceneId");
  }
});

export type TodoDoc = InferSchemaType<typeof TodoSchema> & { _id: string };

export const Todo: Model<TodoDoc> =
  (mongoose.models.Todo as Model<TodoDoc>) ?? mongoose.model<TodoDoc>("Todo", TodoSchema);
