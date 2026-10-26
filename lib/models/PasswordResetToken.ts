import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A single-use password-reset token.
 *
 * Stored hashed, like refresh tokens: the plaintext only ever exists in the
 * email that was sent. `consumedAt` is what makes it single-use — the row is
 * kept rather than deleted so a replayed link is distinguishable from an
 * unknown one.
 */
const PasswordResetTokenSchema = new Schema(
  {
    _id: { type: String, required: true, default: () => crypto.randomUUID() },
    profileId: { type: String, required: true, ref: "Profile", index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
  },
  { timestamps: true, collection: "password_reset_tokens" }
);

PasswordResetTokenSchema.index({ tokenHash: 1 }, { unique: true });

export type PasswordResetTokenDoc = InferSchemaType<typeof PasswordResetTokenSchema> & {
  _id: string;
};

export const PasswordResetToken: Model<PasswordResetTokenDoc> =
  (mongoose.models.PasswordResetToken as Model<PasswordResetTokenDoc>) ??
  mongoose.model<PasswordResetTokenDoc>("PasswordResetToken", PasswordResetTokenSchema);
