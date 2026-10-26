import { Profile } from "@/lib/models/Profile";
import { requireOwner, type Actor } from "@/lib/permissions";

/**
 * Promotes an account to owner.
 *
 * This replaces the `prevent_system_role_update` trigger, which silently
 * reverted any change to `system_role` made as the `authenticated` or `anon`
 * role. With no database-level guard left, **this is the only code path
 * allowed to write `systemRole`** — repositories must never expose it in a
 * general-purpose update.
 *
 * Throws rather than returning false: a silent no-op here would look like a
 * successful promotion.
 */
export async function grantOwner(actor: Actor, targetEmail: string): Promise<void> {
  requireOwner(actor);

  const result = await Profile.updateOne(
    { email: targetEmail.trim().toLowerCase() },
    { $set: { systemRole: "owner" } }
  );

  if (result.matchedCount === 0) {
    throw new Error(`No account found for ${targetEmail} — not found.`);
  }
}

/**
 * Demotes an owner back to a plain user. Separate function rather than a
 * `setRole(role)` so neither direction can happen by passing a variable.
 */
export async function revokeOwner(actor: Actor, targetEmail: string): Promise<void> {
  requireOwner(actor);

  const result = await Profile.updateOne(
    { email: targetEmail.trim().toLowerCase() },
    { $set: { systemRole: "user" } }
  );

  if (result.matchedCount === 0) {
    throw new Error(`No account found for ${targetEmail} — not found.`);
  }
}
