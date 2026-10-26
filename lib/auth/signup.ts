import { Profile, type ProfileDoc } from "@/lib/models/Profile";
import { hashPassword } from "./passwords";
import { issueRefreshToken, signAccessToken } from "./tokens";

export type SignupInput = {
  email: string;
  username: string;
  password: string;
  displayName?: string;
};

export type AuthResult = {
  profile: ProfileDoc;
  accessToken: string;
  refreshToken: string;
};

/**
 * Creates an account and signs it in.
 *
 * This absorbs the `handle_new_user` trigger. Note where `accountStatus` is
 * decided: **here, explicitly, in one place.** Under Postgres the trigger
 * hardcoded `'active'` while the column also carried a default, so the default
 * was dead code and changing it would have had no effect on signup. The
 * access-token phase changes this single line.
 */
export async function signupWithPassword(input: SignupInput): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);

  const created = await Profile.create({
    email: input.email,
    username: input.username,
    displayName: input.displayName,
    passwordHash,
    accountStatus: "active",
    systemRole: "user",
  });

  // Re-read without the hash so no caller can leak it, even by accident.
  const profile = (await Profile.findById(created._id).lean()) as ProfileDoc;

  return {
    profile,
    accessToken: signAccessToken(profile._id),
    refreshToken: await issueRefreshToken(profile._id),
  };
}
