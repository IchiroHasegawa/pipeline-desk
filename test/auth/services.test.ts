import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { startTestMongo, type TestMongo } from "../setup/mongo";
import { connectMongo, disconnectMongo } from "@/lib/db/mongo";
import { Profile } from "@/lib/models/Profile";
import { Session } from "@/lib/models/Session";
import { PasswordResetToken } from "@/lib/models/PasswordResetToken";
import { verifyPassword } from "@/lib/auth/passwords";
import { verifyAccessToken, rotateRefreshToken } from "@/lib/auth/tokens";
import { signupWithPassword } from "@/lib/auth/signup";
import { loginWithPassword, logout } from "@/lib/auth/login";
import { requestPasswordReset, consumePasswordReset } from "@/lib/auth/reset";
import { grantOwner } from "@/lib/auth/roles";
import { setEmailSender, type OutgoingEmail } from "@/lib/email/resend";
import { ForbiddenError } from "@/lib/permissions/errors";
import type { Actor } from "@/lib/permissions";

let mongo: TestMongo;
let sent: OutgoingEmail[] = [];

beforeAll(async () => {
  process.env.AUTH_JWT_SECRET = "test-secret-for-services";
  process.env.APP_URL = "https://productionos.example";
  mongo = await startTestMongo();
  await connectMongo(mongo.uri);
  await Promise.all([
    Profile.syncIndexes(),
    Session.syncIndexes(),
    PasswordResetToken.syncIndexes(),
  ]);
  // No test ever sends real mail.
  setEmailSender(async (msg) => {
    sent.push(msg);
  });
});

afterEach(async () => {
  sent = [];
  await Promise.all([
    Profile.deleteMany({}),
    Session.deleteMany({}),
    PasswordResetToken.deleteMany({}),
  ]);
});

afterAll(async () => {
  setEmailSender(null);
  await disconnectMongo();
  await mongo.stop();
});

const signup = { email: "a@x.com", username: "aa_user", password: "pw12345678" };
const owner = (): Actor => ({ _id: "o1", accountStatus: "active", systemRole: "owner" });
const plainUser = (): Actor => ({ _id: "u1", accountStatus: "active", systemRole: "user" });

/** Pulls the reset token back out of the link in the sent email. */
function tokenFromLastEmail(): string {
  const url = sent.at(-1)!.text.match(/token=([A-Za-z0-9_-]+)/);
  return url![1];
}

describe("signupWithPassword", () => {
  it("hashes the password and never stores it in plaintext", async () => {
    const { profile } = await signupWithPassword(signup);
    const row = await Profile.findById(profile._id).select("+passwordHash").lean();
    expect(row!.passwordHash).not.toBe(signup.password);
    expect(await verifyPassword(signup.password, row!.passwordHash)).toBe(true);
  });

  /**
   * The one line the access-token phase changes. Under Postgres,
   * handle_new_user() hardcoded 'active', which made the column default dead
   * code; here the decision is explicit and in exactly one place.
   */
  it("sets accountStatus explicitly to active and systemRole to user", async () => {
    const { profile } = await signupWithPassword(signup);
    expect([profile.accountStatus, profile.systemRole]).toEqual(["active", "user"]);
  });

  it("returns a usable session pair", async () => {
    const { accessToken, refreshToken } = await signupWithPassword(signup);
    expect(verifyAccessToken(accessToken)).not.toBeNull();
    expect(await rotateRefreshToken(refreshToken)).not.toBeNull();
  });

  it("never returns the password hash on the profile", async () => {
    const { profile } = await signupWithPassword(signup);
    expect(JSON.parse(JSON.stringify(profile))).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email differing only in case", async () => {
    await signupWithPassword(signup);
    await expect(
      signupWithPassword({ ...signup, email: "A@X.COM", username: "bb_user" })
    ).rejects.toThrow();
  });

  it("rejects a username that breaks the schema rules", async () => {
    await expect(signupWithPassword({ ...signup, username: "no" })).rejects.toThrow();
    await expect(signupWithPassword({ ...signup, username: "has space" })).rejects.toThrow();
  });

  it("stores displayName when given", async () => {
    const { profile } = await signupWithPassword({ ...signup, displayName: "Ada" });
    expect(profile.displayName).toBe("Ada");
  });
});

describe("loginWithPassword", () => {
  it("returns a session pair for correct credentials", async () => {
    await signupWithPassword(signup);
    const result = await loginWithPassword(signup.email, signup.password);
    expect(result).not.toBeNull();
    expect(verifyAccessToken(result!.accessToken)).not.toBeNull();
  });

  it("accepts the email in any case", async () => {
    await signupWithPassword(signup);
    expect(await loginWithPassword("A@X.CoM", signup.password)).not.toBeNull();
  });

  // Identical answers, so login cannot be used to enumerate accounts.
  it.each([
    ["a wrong password", "a@x.com", "wrong-password"],
    ["an unknown email", "nobody@x.com", "pw12345678"],
  ])("returns null for %s", async (_n, email, password) => {
    await signupWithPassword(signup);
    expect(await loginWithPassword(email, password)).toBeNull();
  });

  it("refuses a suspended or disabled account", async () => {
    await signupWithPassword(signup);
    await Profile.updateOne({ email: signup.email }, { $set: { accountStatus: "disabled" } });
    expect(await loginWithPassword(signup.email, signup.password)).toBeNull();
  });

  it("logout revokes the refresh token", async () => {
    const { refreshToken } = await signupWithPassword(signup);
    await logout(refreshToken);
    expect(await rotateRefreshToken(refreshToken)).toBeNull();
  });
});

describe("password reset", () => {
  it("emails a link containing a token", async () => {
    await signupWithPassword(signup);
    await requestPasswordReset(signup.email);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe(signup.email);
    expect(sent[0].text).toContain("https://productionos.example");
  });

  it("stores only a hash of the reset token", async () => {
    await signupWithPassword(signup);
    await requestPasswordReset(signup.email);
    const token = tokenFromLastEmail();
    expect(await PasswordResetToken.findOne({ tokenHash: token })).toBeNull();
    expect(await PasswordResetToken.countDocuments()).toBe(1);
  });

  // Must not reveal whether an address has an account.
  it("resolves silently for an unknown email and sends nothing", async () => {
    await expect(requestPasswordReset("nobody@x.com")).resolves.toBeUndefined();
    expect(sent).toHaveLength(0);
    expect(await PasswordResetToken.countDocuments()).toBe(0);
  });

  it("changes the password and lets the new one log in", async () => {
    await signupWithPassword(signup);
    await requestPasswordReset(signup.email);
    expect(await consumePasswordReset(tokenFromLastEmail(), "newpw12345")).toBe(true);
    expect(await loginWithPassword(signup.email, "newpw12345")).not.toBeNull();
    expect(await loginWithPassword(signup.email, signup.password)).toBeNull();
  });

  it("is single-use", async () => {
    await signupWithPassword(signup);
    await requestPasswordReset(signup.email);
    const token = tokenFromLastEmail();
    expect(await consumePasswordReset(token, "newpw12345")).toBe(true);
    expect(await consumePasswordReset(token, "otherpw1234")).toBe(false);
  });

  it("kills existing sessions, so a thief holding a refresh token loses it", async () => {
    const { refreshToken } = await signupWithPassword(signup);
    await requestPasswordReset(signup.email);
    await consumePasswordReset(tokenFromLastEmail(), "newpw12345");
    expect(await rotateRefreshToken(refreshToken)).toBeNull();
  });

  it("refuses an unknown token", async () => {
    expect(await consumePasswordReset("never-issued", "newpw12345")).toBe(false);
  });

  it("refuses an expired token", async () => {
    await signupWithPassword(signup);
    await requestPasswordReset(signup.email);
    await PasswordResetToken.updateOne({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await consumePasswordReset(tokenFromLastEmail(), "newpw12345")).toBe(false);
  });
});

describe("grantOwner", () => {
  // Replaces the prevent_system_role_update trigger: this is the only code
  // path allowed to write systemRole.
  it("promotes a profile when an owner asks", async () => {
    await signupWithPassword(signup);
    await grantOwner(owner(), signup.email);
    expect((await Profile.findOne({ email: signup.email }).lean())!.systemRole).toBe("owner");
  });

  it("refuses a non-owner", async () => {
    await signupWithPassword(signup);
    await expect(grantOwner(plainUser(), signup.email)).rejects.toThrow(ForbiddenError);
    expect((await Profile.findOne({ email: signup.email }).lean())!.systemRole).toBe("user");
  });

  it("refuses a disabled owner", async () => {
    await signupWithPassword(signup);
    await expect(
      grantOwner({ ...owner(), accountStatus: "disabled" }, signup.email)
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws for an unknown email rather than silently doing nothing", async () => {
    await expect(grantOwner(owner(), "nobody@x.com")).rejects.toThrow(/not found/i);
  });
});
