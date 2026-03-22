import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getEncryptionSecret() {
  const secret =
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || process.env.X_TOKEN_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error(
      "Missing SOCIAL_TOKEN_ENCRYPTION_KEY (or X_TOKEN_ENCRYPTION_KEY) environment variable"
    );
  }

  return secret;
}

function getEncryptionKey() {
  return crypto.createHash("sha256").update(getEncryptionSecret()).digest();
}

export function encryptText(plainText) {
  if (typeof plainText !== "string" || !plainText) {
    throw new Error("encryptText expects a non-empty string");
  }

  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptText(payload) {
  if (typeof payload !== "string" || !payload.includes(":")) {
    throw new Error("Invalid encrypted payload");
  }

  const [ivB64, tagB64, encryptedB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}