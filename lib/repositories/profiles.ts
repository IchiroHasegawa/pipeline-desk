import { Profile, type ProfileDoc } from "@/lib/models/Profile";
import { baseRepo } from "./base";
import {
  canReadProfile,
  requireActiveUser,
  requireOwner,
  ForbiddenError,
  type Actor,
} from "@/lib/permissions";

/**
 * `systemRole` and `passwordHash` are immutable here by design:
 *   - systemRole replaces the prevent_system_role_update trigger; only
 *     lib/auth/roles.ts may write it.
 *   - passwordHash is written only by signup and password reset.
 *   - accountStatus is listed too: suspending an account must revoke its
 *     sessions, which a bare field write would skip.
 */
const base = baseRepo<ProfileDoc>(Profile, {
  immutable: ["systemRole", "passwordHash", "accountStatus"],
});

export const profiles = {
  ...base,

  /** The signed-in user's own profile. The common case by far. */
  async getOwn(actor: Actor): Promise<ProfileDoc | null> {
    requireActiveUser(actor);
    return Profile.findById(actor._id).lean<ProfileDoc>().exec();
  },

  /**
   * RLS was `auth.uid() = id AND is_active_user()` — a profile is readable
   * only by its owner. Throws rather than returning null so a call site that
   * expected broader access fails visibly instead of looking like "no such
   * user".
   */
  async getById(actor: Actor, id: string): Promise<ProfileDoc | null> {
    requireActiveUser(actor);
    if (!canReadProfile(actor, { _id: id })) {
      throw new ForbiddenError("You can only read your own profile.");
    }
    return Profile.findById(id).lean<ProfileDoc>().exec();
  },

  /**
   * Every profile. Owner-only, and not reachable through `list` — there was no
   * Postgres policy permitting it, so it is a deliberate new capability that
   * the account-approval phase needs.
   */
  async listAllAsOwner(actor: Actor): Promise<ProfileDoc[]> {
    requireOwner(actor);
    return Profile.find().sort({ createdAt: 1 }).lean<ProfileDoc[]>().exec();
  },

  async getByEmail(actor: Actor, email: string): Promise<ProfileDoc | null> {
    requireOwner(actor);
    return Profile.findOne({ email: email.trim().toLowerCase() })
      .lean<ProfileDoc>()
      .exec();
  },
};
