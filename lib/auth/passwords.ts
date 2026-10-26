import bcrypt from "bcrypt";

/**
 * Cost factor 12. High enough to be slow for an attacker with the hashes,
 * low enough that a login does not block a request for long.
 */
export const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  if (!plain) {
    throw new Error("Cannot hash an empty password.");
  }
  return bcrypt.hash(plain, BCRYPT_COST);
}

/**
 * Returns false for a wrong password **and** for a stored hash that is empty
 * or malformed. A corrupted hash is a wrong password, not a 500 on the login
 * route — bcrypt.compare throws on some malformed inputs rather than
 * returning false.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
