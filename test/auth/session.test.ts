import { describe, it, expect } from "vitest";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
  clearedCookieOptions,
} from "@/lib/auth/session";

describe("session cookies", () => {
  it("names both cookies distinctly", () => {
    expect(ACCESS_COOKIE).not.toBe(REFRESH_COOKIE);
  });

  it.each([
    ["access", accessCookieOptions()],
    ["refresh", refreshCookieOptions()],
  ])("marks the %s cookie httpOnly, Secure and SameSite=Lax on path /", (_n, opts) => {
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
  });

  it("gives the refresh cookie a much longer life than the access cookie", () => {
    expect(refreshCookieOptions().maxAge).toBeGreaterThan(accessCookieOptions().maxAge);
  });

  it("matches the token lifetimes", () => {
    expect(accessCookieOptions().maxAge).toBe(15 * 60);
    expect(refreshCookieOptions().maxAge).toBe(60 * 24 * 60 * 60);
  });

  it("clears a cookie with maxAge 0 while keeping the other attributes", () => {
    const cleared = clearedCookieOptions();
    expect(cleared.maxAge).toBe(0);
    expect(cleared.httpOnly).toBe(true);
    expect(cleared.path).toBe("/");
  });
});
