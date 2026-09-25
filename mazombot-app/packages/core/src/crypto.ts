import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM. A chave vem de ENCRYPTION_KEY (32 bytes em base64) —
 * nunca commitar essa env, gerar uma por ambiente (dev/staging/prod).
 * Gerar uma nova: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Isso protege token de bot e API key de gateway em repouso no banco —
 * se o banco vazar, os segredos não vazam junto em texto puro.
 */
const key = Buffer.from(process.env.ENCRYPTION_KEY ?? "", "base64");

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
