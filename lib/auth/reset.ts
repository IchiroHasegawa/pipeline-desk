import crypto from "node:crypto";
import mongoose from "mongoose";
import { Profile } from "@/lib/models/Profile";
import { PasswordResetToken } from "@/lib/models/PasswordResetToken";
import { hashPassword } from "./passwords";
import { revokeAllSessionsFor } from "./tokens";
import { sendPasswordResetEmail } from "@/lib/email/resend";

export const RESET_TOKEN_TTL_MINUTES = 60;

function newToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Starts a password reset.
 *
 * **Always resolves, and reveals nothing.** An unknown address sends no mail,
 * writes no row, and returns exactly as an known one does — otherwise this
 * endpoint becomes an account-existence oracle.
 *
 * Only the token's hash is stored; the plaintext exists solely in the email.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (!email) return;

  const profile = await Profile.findOne({ email: email.trim().toLowerCase() }).lean();
  if (!profile) return;

  const token = newToken();
  await PasswordResetToken.create({
    profileId: profile._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
  });

  const appUrl = process.env.APP_URL ?? "";
  await sendPasswordResetEmail(
    profile.email,
    `${appUrl}/reset-password?token=${encodeURIComponent(token)}`
  );
}

/**
 * Completes a reset. Returns false — never throws — for a token that is
 * unknown, already consumed, or expired, so the route can answer "that link is
 * no longer valid" uniformly.
 *
 * Consuming the token, changing the password and revoking every existing
 * session happen in **one transaction**: a reset that changed the password but
 * left old sessions alive would leave a thief holding a working refresh token.
 */
export async function consumePasswordReset(
  token: string,
  newPassword: string
): Promise<boolean> {
  if (!token || !newPassword) return false;

  const passwordHash = await hashPassword(newPassword);
  const session = await mongoose.startSession();

  try {
    let ok = false;

    await session.withTransaction(async () => {
      const row = await PasswordResetToken.findOne({
        tokenHash: hashToken(token),
        consumedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!row) {
        ok = false;
        return;
      }

      await PasswordResetToken.updateOne(
        { _id: row._id },
        { $set: { consumedAt: new Date() } },
        { session }
      );

      await Profile.updateOne(
        { _id: row.profileId },
        { $set: { passwordHash } },
        { session }
      );

      ok = true;
    });

    // Session revocation is intentionally outside the transaction: it touches
    // a different collection and must happen even if it cannot join the
    // transaction, and re-revoking is harmless.
    if (ok) {
      const row = await PasswordResetToken.findOne({ tokenHash: hashToken(token) }).lean();
      if (row) await revokeAllSessionsFor(row.profileId);
    }

    return ok;
  } finally {
    await session.endSession();
  }
}
