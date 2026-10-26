import { describe, it, expect } from "vitest";
import {
  requireActiveUser,
  requireOwner,
  canAccessTodo,
  canReadProfile,
  type Actor,
} from "@/lib/permissions";
import { UnauthorizedError, ForbiddenError } from "@/lib/permissions/errors";

const actor = (over: Partial<Actor> = {}): Actor => ({
  _id: "u1",
  accountStatus: "active",
  systemRole: "user",
  ...over,
});

describe("requireActiveUser", () => {
  it("returns the actor when active", () => {
    const a = actor();
    expect(requireActiveUser(a)).toBe(a);
  });

  it("throws UnauthorizedError when there is no actor", () => {
    expect(() => requireActiveUser(null)).toThrow(UnauthorizedError);
  });

  // Replaces is_active_user(), which 22 of the 26 RLS policies used.
  it.each(["suspended", "disabled"] as const)(
    "throws ForbiddenError for a %s account",
    (accountStatus) => {
      expect(() => requireActiveUser(actor({ accountStatus }))).toThrow(ForbiddenError);
    }
  );
});

describe("requireOwner", () => {
  it("returns an active owner", () => {
    const a = actor({ systemRole: "owner" });
    expect(requireOwner(a)).toBe(a);
  });

  it("throws ForbiddenError for an active non-owner", () => {
    expect(() => requireOwner(actor())).toThrow(ForbiddenError);
  });

  it("throws UnauthorizedError when there is no actor", () => {
    expect(() => requireOwner(null)).toThrow(UnauthorizedError);
  });

  // An owner whose account was disabled must not keep owner powers.
  it("throws ForbiddenError for a disabled owner", () => {
    expect(() =>
      requireOwner(actor({ systemRole: "owner", accountStatus: "disabled" }))
    ).toThrow(ForbiddenError);
  });
});

describe("canAccessTodo", () => {
  // RLS: is_active_user() AND user_id = auth.uid()
  it("is true only for the owning profile", () => {
    expect(canAccessTodo(actor(), { profileId: "u1" })).toBe(true);
    expect(canAccessTodo(actor(), { profileId: "u2" })).toBe(false);
  });

  it("is false for an inactive account even on its own todo", () => {
    expect(canAccessTodo(actor({ accountStatus: "suspended" }), { profileId: "u1" })).toBe(false);
  });

  // Owner is deliberately NOT a global override: the Postgres policy had no
  // owner exemption, so neither does this.
  it("does not let an owner read someone else's todo", () => {
    expect(canAccessTodo(actor({ systemRole: "owner" }), { profileId: "u2" })).toBe(false);
  });
});

describe("canReadProfile", () => {
  // RLS: auth.uid() = id AND is_active_user()
  it("is true only for your own profile", () => {
    expect(canReadProfile(actor(), { _id: "u1" })).toBe(true);
    expect(canReadProfile(actor(), { _id: "u2" })).toBe(false);
  });

  it("is false for an inactive account", () => {
    expect(canReadProfile(actor({ accountStatus: "disabled" }), { _id: "u1" })).toBe(false);
  });
});

describe("errors", () => {
  it("carry the HTTP status a route handler should return", () => {
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
  });

  it("are real Error subclasses so instanceof and stack traces work", () => {
    expect(new UnauthorizedError()).toBeInstanceOf(Error);
    expect(new ForbiddenError()).toBeInstanceOf(Error);
    expect(new ForbiddenError("nope").message).toBe("nope");
  });
});
