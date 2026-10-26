import { Profile, type ProfileDoc } from "@/lib/models/Profile";
import { verifyPassword } from "./passwords";
import { issueRefreshToken, revokeSession, signAccessToken } from "./tokens";
import type { AuthResult } from "./signup";

/**
 * Signs in with email and password.
 *
 * Returns **null** for an unknown email, a wrong password, and a
 * non-active account alike. The caller cannot tell which, so login cannot be
 * used to enumerate accounts or to discover that an address was suspended.
 *
 * Email matching is case-insensitive: addresses are stored lowercased, so the
 * lookup lowercases too.
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<AuthResult | null> {
  if (!email || !password) return null;

  const withHash = await Profile.findOne({ email: email.trim().toLowerCase() })
    .select("+passwordHash")
    .lean();

  if (!withHash) return null;
  if (withHash.accountStatus !== "active") return null;
  if (!(await verifyPassword(password, withHash.passwordHash))) return null;

  const profile = (await Profile.findById(withHash._id).lean()) as ProfileDoc;

  return {
    profile,
    accessToken: signAccessToken(profile._id),
    refreshToken: await issueRefreshToken(profile._id),
  };
}

/** Revokes the one session. Other devices stay signed in, as they should. */
export async function logout(refreshToken: string): Promise<void> {
  await revokeSession(refreshToken);
}
