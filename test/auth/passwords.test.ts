import { describe, it, expect } from "vitest";
import bcrypt from "bcrypt";
import { hashPassword, verifyPassword, BCRYPT_COST } from "@/lib/auth/passwords";

describe("passwords", () => {
  it("uses a cost factor of 12", async () => {
    expect(BCRYPT_COST).toBe(12);
    const hash = await hashPassword("correct horse");
    expect(bcrypt.getRounds(hash)).toBe(12);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct horse");
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
  });

  it("produces a different hash for the same password (salted)", async () => {
    const [a, b] = await Promise.all([hashPassword("same"), hashPassword("same")]);
    expect(a).not.toBe(b);
    expect(await verifyPassword("same", a)).toBe(true);
    expect(await verifyPassword("same", b)).toBe(true);
  });

  it("returns false rather than throwing on a malformed hash", async () => {
    // A corrupted or empty stored hash must read as "wrong password", not
    // crash the login route with a 500.
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "not-a-bcrypt-hash")).toBe(false);
  });

  it("rejects an empty password instead of hashing it", async () => {
    await expect(hashPassword("")).rejects.toThrow(/password/i);
  });
});
