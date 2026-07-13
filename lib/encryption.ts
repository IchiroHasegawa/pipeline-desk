import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

export function encryptToken(text: string): string {
  const keyString = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
  if (!keyString) {
    throw new Error("Missing GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY environment variable.");
  }
  
  // Ensure the key is 32 bytes for aes-256-gcm
  const key = crypto.createHash("sha256").update(keyString).digest();
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Return format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedData: string): string {
  const keyString = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
  if (!keyString) {
    throw new Error("Missing GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY environment variable.");
  }
  
  const key = crypto.createHash("sha256").update(keyString).digest();
  
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format.");
  }
  
  const [ivHex, authTagHex, encryptedText] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
