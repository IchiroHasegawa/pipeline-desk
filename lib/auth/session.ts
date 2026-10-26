import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_DAYS } from "./tokens";

/**
 * Cookie contract for the session pair.
 *
 * Kept as plain option objects rather than wrapping Next's `cookies()`: these
 * are the same in a route handler, a server action and the proxy, and keeping
 * them free of Next imports means they are unit-testable and usable from all
 * three. The actual set/delete calls live with the handlers (Plan 2).
 *
 * `sameSite: "lax"` rather than "strict" so a normal top-level navigation back
 * into the app arrives authenticated; the app is not an OAuth callback target
 * that needs "none".
 */
export const ACCESS_COOKIE = "po_access" as const;
export const REFRESH_COOKIE = "po_refresh" as const;

export type SessionCookieOptions = {
  httpOnly: true;
  secure: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

const base = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const;

export function accessCookieOptions(): SessionCookieOptions {
  return { ...base, maxAge: ACCESS_TOKEN_TTL_SECONDS };
}

export function refreshCookieOptions(): SessionCookieOptions {
  return { ...base, maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 };
}

/** Same attributes, zero lifetime — used to clear either cookie on logout. */
export function clearedCookieOptions(): SessionCookieOptions {
  return { ...base, maxAge: 0 };
}
