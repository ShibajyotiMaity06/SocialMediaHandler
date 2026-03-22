import dbConnect from "./mongodb.js";
import { decryptText, encryptText } from "./crypto.js";
import SocialAccount from "./models/SocialAccount.js";
import { refreshXAccessToken } from "./x-auth.js";

const EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function toExpiryDate(expiresInSeconds) {
  const seconds = Number(expiresInSeconds || 0);
  if (!seconds) {
    return new Date(Date.now() + 60 * 60 * 1000);
  }
  return new Date(Date.now() + seconds * 1000);
}

function parseScope(scopeValue) {
  if (Array.isArray(scopeValue)) return scopeValue;
  if (typeof scopeValue !== "string") return [];
  return scopeValue
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveXTokens({ userId, tokenPayload }) {
  await dbConnect();

  const accessToken = tokenPayload?.access_token;
  const refreshToken = tokenPayload?.refresh_token;

  if (!accessToken || !refreshToken) {
    throw new Error("X OAuth response is missing access_token or refresh_token");
  }

  const expiresAt = toExpiryDate(tokenPayload?.expires_in);

  const account = await SocialAccount.findOneAndUpdate(
    { user_id: userId, platform: "x" },
    {
      user_id: userId,
      platform: "x",
      access_token_enc: encryptText(accessToken),
      refresh_token_enc: encryptText(refreshToken),
      expires_at: expiresAt,
      token_type: tokenPayload?.token_type || "bearer",
      scopes: parseScope(tokenPayload?.scope),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return account;
}

export async function getXAccount(userId) {
  await dbConnect();
  return SocialAccount.findOne({ user_id: userId, platform: "x" });
}

export async function isXConnected(userId) {
  const account = await getXAccount(userId);
  return Boolean(account);
}

async function refreshAccountToken(accountDoc) {
  const refreshToken = decryptText(accountDoc.refresh_token_enc);
  const payload = await refreshXAccessToken(refreshToken);

  const nextRefreshToken = payload.refresh_token || refreshToken;
  accountDoc.access_token_enc = encryptText(payload.access_token);
  accountDoc.refresh_token_enc = encryptText(nextRefreshToken);
  accountDoc.expires_at = toExpiryDate(payload.expires_in);
  accountDoc.token_type = payload.token_type || accountDoc.token_type || "bearer";
  accountDoc.scopes = parseScope(payload.scope);
  await accountDoc.save();

  return payload.access_token;
}

export async function getValidXAccessToken(userId) {
  const account = await getXAccount(userId);
  if (!account) {
    throw new Error("X account is not connected for this user");
  }

  const nowWithBuffer = Date.now() + EXPIRY_BUFFER_MS;
  const expiresAtMs = new Date(account.expires_at).getTime();

  if (!expiresAtMs || expiresAtMs <= nowWithBuffer) {
    return refreshAccountToken(account);
  }

  return decryptText(account.access_token_enc);
}

export async function publishPostToX({ userId, content }) {
  if (!content || !content.trim()) {
    throw new Error("Tweet content cannot be empty");
  }

  const maxChars = Number(process.env.X_POST_MAX_CHARS || 280);
  if (content.length > maxChars) {
    throw new Error(`Tweet content exceeds ${maxChars} characters`);
  }

  const accessToken = await getValidXAccessToken(userId);

  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text: content }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = payload?.detail || payload?.title || "Tweet publish failed";
    throw new Error(`X publish failed: ${detail}`);
  }

  return payload;
}