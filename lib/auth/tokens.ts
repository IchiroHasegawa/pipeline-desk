import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Session } from "@/lib/models/Session";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 60;

export type AccessClaims = { profileId: string };

function secret(): string {
  const value = process.env.AUTH_JWT_SECRET;
  if (!value) {
    throw new Error("Missing AUTH_JWT_SECRET environment variable.");
  }
  return value;
}

export function signAccessToken(profileId: string): string {
  return jwt.sign({ profileId }, secret(), {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

/**
 * Returns the claims, or **null for every invalid token** — absent, malformed,
 * expired, wrongly signed, or missing the claim we need. It never throws.
 *
 * This is the behaviour, not defensive padding: the proxy runs on every
 * request, and a bad cookie must read as "not signed in" rather than turning
 * every page into a 500.
 */
export function verifyAccessToken(token: string): AccessClaims | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, secret(), { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || decoded === null) return null;
    const profileId = (decoded as Record<string, unknown>).profileId;
    return typeof profileId === "string" && profileId ? { profileId } : null;
  } catch {
    return null;
  }
}

/** 32 random bytes, base64url. The plaintext is never stored. */
function newRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueRefreshToken(profileId: string): Promise<string> {
  const token = newRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await Session.create({ profileId, refreshTokenHash: hashToken(token), expiresAt });
  return token;
}

/**
 * Exchanges a refresh token for a fresh access/refresh pair, revoking the old
 * session so a token cannot be replayed.
 *
 * Revoke-then-issue runs in **one transaction**: a crash between the two would
 * otherwise leave the user with no valid session and no new one, i.e. silently
 * signed out. Returns null if the token is unknown, already revoked, or
 * expired.
 */
export async function rotateRefreshToken(
  token: string
): Promise<{ accessToken: string; refreshToken: string } | null > {
  if (!token) return null;

  const session = await mongoose.startSession();
  try {
    let result: { accessToken: string; refreshToken: string } | null = null;

    await session.withTransaction(async () => {
      const existing = await Session.findOne({
        refreshTokenHash: hashToken(token),
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      }).session(session);

      if (!existing) {
        result = null;
        return;
      }

      await Session.updateOne(
        { _id: existing._id },
        { $set: { revokedAt: new Date() } },
        { session }
      );

      const nextToken = newRefreshToken();
      await Session.create(
        [
          {
            profileId: existing.profileId,
            refreshTokenHash: hashToken(nextToken),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
          },
        ],
        { session, ordered: true }
      );

      result = {
        accessToken: signAccessToken(existing.profileId),
        refreshToken: nextToken,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

export async function revokeSession(token: string): Promise<void> {
  if (!token) return;
  await Session.updateOne(
    { refreshTokenHash: hashToken(token), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}

/**
 * Revokes every live session for a profile. Used when a password changes and
 * when an account is suspended or disabled — the point at which "already
 * signed in elsewhere" has to stop working.
 */
export async function revokeAllSessionsFor(profileId: string): Promise<void> {
  await Session.updateMany(
    { profileId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}
