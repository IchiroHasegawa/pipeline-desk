import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { Profile } from "@/lib/models/Profile";
import { Session } from "@/lib/models/Session";
import { PasswordResetToken } from "@/lib/models/PasswordResetToken";

let mongo: TestMongo;

beforeAll(async () => {
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await Promise.all([
    Profile.syncIndexes(),
    Session.syncIndexes(),
    PasswordResetToken.syncIndexes(),
  ]);
});

afterEach(async () => {
  await Promise.all([
    Profile.deleteMany({}),
    Session.deleteMany({}),
    PasswordResetToken.deleteMany({}),
  ]);
});

afterAll(async () => {
  await disconnectMongo();
  await mongo.stop();
});

const base = { _id: "p1", email: "a@x.com", username: "aa_user", passwordHash: "h" };

describe("Profile", () => {
  it("hides passwordHash by default and reveals it only when asked", async () => {
    await Profile.create(base);
    expect((await Profile.findById("p1").lean())!.passwordHash).toBeUndefined();
    const withHash = await Profile.findById("p1").select("+passwordHash").lean();
    expect(withHash!.passwordHash).toBe("h");
  });

  it("omits passwordHash after JSON serialisation", async () => {
    const doc = await Profile.create(base);
    expect(JSON.parse(JSON.stringify(doc))).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email differing only in case", async () => {
    await Profile.create(base);
    await expect(
      Profile.create({ _id: "p2", email: "A@X.com", username: "bb_user", passwordHash: "h" })
    ).rejects.toThrow(/duplicate key/i);
  });

  it("rejects a duplicate username differing only in case", async () => {
    await Profile.create(base);
    await expect(
      Profile.create({ _id: "p3", email: "c@x.com", username: "AA_USER", passwordHash: "h" })
    ).rejects.toThrow(/duplicate key/i);
  });

  it("preserves the username's original casing", async () => {
    // The live account is `realTNEU`. Uniqueness is case-insensitive (Postgres
    // indexed lower(username)) but the stored value must not be downcased, or
    // every existing display name silently changes.
    await Profile.create({ ...base, username: "realTNEU" });
    expect((await Profile.findById("p1").lean())!.username).toBe("realTNEU");
  });

  it("lowercases the email, as GoTrue did", async () => {
    await Profile.create({ ...base, email: "MiXeD@X.com" });
    expect((await Profile.findById("p1").lean())!.email).toBe("mixed@x.com");
  });

  it("defaults accountStatus to active and systemRole to user", async () => {
    const p = await Profile.create(base);
    expect([p.accountStatus, p.systemRole]).toEqual(["active", "user"]);
  });

  it.each(["pending", "banned", ""])("rejects accountStatus %o", async (status) => {
    await expect(
      Profile.create({ ...base, accountStatus: status })
    ).rejects.toThrow(/validation/i);
  });

  it("rejects a systemRole outside the contract's CHECK values", async () => {
    await expect(
      Profile.create({ ...base, systemRole: "admin" })
    ).rejects.toThrow(/validation/i);
  });

  // CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
  it.each([["aa", "too short"], ["a".repeat(31), "too long"]])(
    "rejects a username that is %s",
    async (username) => {
      await expect(Profile.create({ ...base, username })).rejects.toThrow(/validation/i);
    }
  );

  // CHECK (username ~ '^[a-zA-Z0-9_]+$')
  it.each(["has space", "has-dash", "has.dot", "has@at"])(
    "rejects the username %o for its characters",
    async (username) => {
      await expect(Profile.create({ ...base, username })).rejects.toThrow(/validation/i);
    }
  );

  it("requires email, username and passwordHash", async () => {
    await expect(Profile.create({ _id: "p9" })).rejects.toThrow(/validation/i);
  });
});

describe("Session", () => {
  it("enforces a unique refreshTokenHash", async () => {
    const row = { profileId: "p1", refreshTokenHash: "rth", expiresAt: new Date() };
    await Session.create(row);
    await expect(Session.create(row)).rejects.toThrow(/duplicate key/i);
  });

  it("starts un-revoked", async () => {
    const s = await Session.create({
      profileId: "p1",
      refreshTokenHash: "rth2",
      expiresAt: new Date(),
    });
    expect(s.revokedAt).toBeUndefined();
  });
});

describe("PasswordResetToken", () => {
  it("enforces a unique tokenHash", async () => {
    const row = { profileId: "p1", tokenHash: "th", expiresAt: new Date() };
    await PasswordResetToken.create(row);
    await expect(PasswordResetToken.create(row)).rejects.toThrow(/duplicate key/i);
  });

  it("starts unconsumed", async () => {
    const t = await PasswordResetToken.create({
      profileId: "p1",
      tokenHash: "th2",
      expiresAt: new Date(),
    });
    expect(t.consumedAt).toBeUndefined();
  });
});
