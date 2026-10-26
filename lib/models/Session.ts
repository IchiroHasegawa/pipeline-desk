import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A refresh-token session.
 *
 * GoTrue's sessions were effectively stateless, which means they could not be
 * revoked. Storing the refresh token's **hash** gives revocation — needed
 * because accounts must be lockable, and because the access-token phase has to
 * be able to cut someone off.
 *
 * Only the hash is stored: a database leak must not yield usable tokens.
 */
const SessionSchema = new Schema(
  {
    _id: { type: String, required: true, default: () => crypto.randomUUID() },
    profileId: { type: String, required: true, ref: "Profile", index: true },
    refreshTokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true, collection: "sessions" }
);

SessionSchema.index({ refreshTokenHash: 1 }, { unique: true });

export type SessionDoc = InferSchemaType<typeof SessionSchema> & { _id: string };

export const Session: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc>) ??
  mongoose.model<SessionDoc>("Session", SessionSchema);
