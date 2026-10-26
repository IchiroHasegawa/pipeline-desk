import type { ProfileDoc } from "@/lib/models/Profile";
import { ForbiddenError, UnauthorizedError } from "./errors";

/**
 * The single place authorization decisions are made.
 *
 * Under Supabase this logic lived in 26 Postgres RLS policies, 22 of which
 * were the bare predicate `is_active_user()`. MongoDB has no row-level
 * security, so every one of them becomes a call into this module — and
 * nowhere else. The access-token phase extends this file; it must not grow
 * authorization checks scattered through route handlers and components.
 *
 * Guards throw (so a handler cannot forget to branch); predicates return
 * booleans (for filtering a list you already hold).
 */
export type Actor = Pick<ProfileDoc, "_id" | "accountStatus" | "systemRole">;

export { UnauthorizedError, ForbiddenError, isAuthorizationError } from "./errors";

/** Replaces `is_active_user()` — the predicate behind 22 of the 26 policies. */
export function requireActiveUser(actor: Actor | null | undefined): Actor {
  if (!actor) {
    throw new UnauthorizedError("You must be signed in.");
  }
  if (actor.accountStatus !== "active") {
    throw new ForbiddenError("This Production OS account is unavailable.");
  }
  return actor;
}

/**
 * Owner-only access. Replaces the `system_role = 'owner'` checks the proxy
 * made inline. Note an owner whose account is not active gets nothing: the
 * active check runs first, deliberately.
 */
export function requireOwner(actor: Actor | null | undefined): Actor {
  const active = requireActiveUser(actor);
  if (active.systemRole !== "owner") {
    throw new ForbiddenError("This action is restricted to owners.");
  }
  return active;
}

function isActive(actor: Actor): boolean {
  return actor.accountStatus === "active";
}

/**
 * RLS was: `is_active_user() AND user_id = auth.uid()`.
 *
 * There is no owner override, because the Postgres policy had none — an owner
 * cannot read another person's todos.
 */
export function canAccessTodo(actor: Actor, todo: { profileId: string }): boolean {
  return isActive(actor) && todo.profileId === actor._id;
}

/** RLS was: `auth.uid() = id AND is_active_user()`. */
export function canReadProfile(actor: Actor, profile: { _id: string }): boolean {
  return isActive(actor) && profile._id === actor._id;
}
