import { publishPostToX } from "./x-client.js";

export async function postToPlatform(platform, { userId, content }) {
  const normalized = String(platform || "").toLowerCase();

  if (normalized === "x" || normalized === "twitter") {
    return publishPostToX({ userId, content });
  }

  throw new Error(`Unsupported platform: ${platform}`);
}