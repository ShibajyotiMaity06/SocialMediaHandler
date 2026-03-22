import crypto from "crypto";

const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

function toBase64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function getXOAuthConfig() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri =
    process.env.X_OAUTH_REDIRECT_URI || process.env.X_OAUTH_REDIRECT_URL;
  const scope =
    process.env.X_OAUTH_SCOPES ||
    "tweet.read tweet.write users.read offline.access";

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing X OAuth env vars. Required: X_CLIENT_ID, X_CLIENT_SECRET, X_OAUTH_REDIRECT_URI"
    );
  }

  return { clientId, clientSecret, redirectUri, scope };
}

export function generatePkcePair() {
  const codeVerifier = toBase64Url(crypto.randomBytes(64));
  const codeChallenge = toBase64Url(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );
  return { codeVerifier, codeChallenge };
}

export function generateState() {
  return toBase64Url(crypto.randomBytes(32));
}

export function getStateExpiryDate() {
  return new Date(Date.now() + FIVE_MINUTES_MS);
}

export function buildXAuthorizeUrl({ state, codeChallenge }) {
  const { clientId, redirectUri, scope } = getXOAuthConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${X_AUTHORIZE_URL}?${params.toString()}`;
}

function getBasicAuthHeader(clientId, clientSecret) {
  const encoded = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  return `Basic ${encoded}`;
}

async function requestXToken(form) {
  const { clientId, clientSecret } = getXOAuthConfig();

  const response = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getBasicAuthHeader(clientId, clientSecret),
    },
    body: form.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = data?.error_description || data?.error || "Token request failed";
    throw new Error(`X OAuth token request failed: ${detail}`);
  }

  return data;
}

export async function exchangeCodeForXTokens({ code, codeVerifier }) {
  const { redirectUri } = getXOAuthConfig();

  const form = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  return requestXToken(form);
}

export async function refreshXAccessToken(refreshToken) {
  const form = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  return requestXToken(form);
}