import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { Session } from "@/lib/models/Session";
import {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeSession,
  revokeAllSessionsFor,
} from "@/lib/auth/tokens";

let mongo: TestMongo;

beforeAll(async () => {
  process.env.AUTH_JWT_SECRET = "test-secret-for-tokens";
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await Session.syncIndexes();
});

afterEach(async () => {
  await Session.deleteMany({});
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

describe("access tokens", () => {
  it("round-trips a valid token", () => {
    expect(verifyAccessToken(signAccessToken("p1"))).toEqual({ profileId: "p1" });
  });

  it("expires in 15 minutes", () => {
    const decoded = jwt.decode(signAccessToken("p1")) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  /**
   * Review Focus 3 — every invalid token must read as *unauthenticated*, never
   * as authenticated and never as a thrown 500.
   */
  it.each([
    ["absent", ""],
    ["malformed", "not-a-jwt"],
    ["only two segments", "aaa.bbb"],
    ["wrong signature", jwt.sign({ profileId: "p1" }, "the-wrong-secret")],
    ["expired", jwt.sign({ profileId: "p1" }, "test-secret-for-tokens", { expiresIn: "-1s" })],
    ["no profileId claim", jwt.sign({ sub: "p1" }, "test-secret-for-tokens")],
  ])("returns null for a %s access token", (_name, token) => {
    expect(verifyAccessToken(token)).toBeNull();
  });

  it("throws at signing time when no secret is configured", () => {
    const saved = process.env.AUTH_JWT_SECRET;
    delete process.env.AUTH_JWT_SECRET;
    try {
      expect(() => signAccessToken("p1")).toThrow(/AUTH_JWT_SECRET/);
    } finally {
      process.env.AUTH_JWT_SECRET = saved;
    }
  });
});

describe("refresh tokens", () => {
  it("stores only a hash of the token", async () => {
    const token = await issueRefreshToken("p1");
    expect(await Session.findOne({ refreshTokenHash: token })).toBeNull();
    expect(await Session.countDocuments({ profileId: "p1" })).toBe(1);
  });

  it("rotates a valid token into a new pair", async () => {
    const token = await issueRefreshToken("p1");
    const rotated = await rotateRefreshToken(token);
    expect(rotated).not.toBeNull();
    expect(verifyAccessToken(rotated!.accessToken)).toEqual({ profileId: "p1" });
    expect(rotated!.refreshToken).not.toBe(token);
  });

  it("refuses to reuse a rotated token", async () => {
    const token = await issueRefreshToken("p1");
    await rotateRefreshToken(token);
    expect(await rotateRefreshToken(token)).toBeNull();
  });

  it("refuses to rotate a revoked token", async () => {
    const token = await issueRefreshToken("p1");
    await revokeSession(token);
    expect(await rotateRefreshToken(token)).toBeNull();
  });

  it("refuses to rotate an unknown token", async () => {
    expect(await rotateRefreshToken("never-issued")).toBeNull();
  });

  it("refuses to rotate an expired token", async () => {
    const token = await issueRefreshToken("p1");
    await Session.updateOne(
      { profileId: "p1" },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    );
    expect(await rotateRefreshToken(token)).toBeNull();
  });

  it("revokes every session for a profile at once", async () => {
    const a = await issueRefreshToken("p1");
    const b = await issueRefreshToken("p1");
    const other = await issueRefreshToken("p2");
    await revokeAllSessionsFor("p1");
    expect(await rotateRefreshToken(a)).toBeNull();
    expect(await rotateRefreshToken(b)).toBeNull();
    expect(await rotateRefreshToken(other)).not.toBeNull();
  });

  it("issues tokens that are not guessable from each other", async () => {
    const a = await issueRefreshToken("p1");
    const b = await issueRefreshToken("p1");
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43); // >= 32 bytes, base64url
  });

  it("leaves exactly one usable session after a rotation", async () => {
    const token = await issueRefreshToken("p1");
    const rotated = await rotateRefreshToken(token);
    const usable = await Session.countDocuments({
      profileId: "p1",
      revokedAt: { $exists: false },
    });
    expect(usable).toBe(1);
    expect(await rotateRefreshToken(rotated!.refreshToken)).not.toBeNull();
  });
});
