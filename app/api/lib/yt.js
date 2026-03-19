// lib/youtube.js (server-side util)
function getChannelLookupParam(channelInput) {
  const raw = decodeURIComponent(String(channelInput || "")).trim();
  if (!raw) throw new Error("Invalid channel URL");

  if (raw.startsWith("@")) {
    return `forHandle=${encodeURIComponent(raw.slice(1))}`;
  }

  if (/^UC[a-zA-Z0-9_-]{22}$/.test(raw)) {
    return `id=${encodeURIComponent(raw)}`;
  }

  let normalized = raw;
  if (/^www\./i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  if (!/^https?:\/\//i.test(normalized) && /^(channel|user|c)\//i.test(normalized)) {
    normalized = `https://www.youtube.com/${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const first = parts[0] || "";
    const second = parts[1] || "";

    if (first.startsWith("@")) {
      return `forHandle=${encodeURIComponent(first.slice(1))}`;
    }
    if (first === "channel" && second) {
      return `id=${encodeURIComponent(second)}`;
    }
    if ((first === "user" || first === "c") && second) {
      return `forUsername=${encodeURIComponent(second)}`;
    }
  } catch {
    // Fall through to regex fallback for partial values.
  }

  const handleMatch = raw.match(/@([a-zA-Z0-9._-]+)/);
  if (handleMatch?.[1]) {
    return `forHandle=${encodeURIComponent(handleMatch[1])}`;
  }

  const idMatch = raw.match(/channel\/([a-zA-Z0-9_-]+)/);
  if (idMatch?.[1]) {
    return `id=${encodeURIComponent(idMatch[1])}`;
  }

  const userMatch = raw.match(/user\/([^\/?]+)/);
  if (userMatch?.[1]) {
    return `forUsername=${encodeURIComponent(userMatch[1])}`;
  }

  throw new Error("Invalid channel URL");
}

export async function getChannelData(channelUrl, apiKey) {
  const param = getChannelLookupParam(channelUrl);

  const url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&${param}&key=${apiKey}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();

  if (!data.items?.[0]) throw new Error('Channel not found');

  const channel = data.items[0];
  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    subscriberCount: channel.statistics.subscriberCount,
    viewCount: channel.statistics.viewCount,
    videoCount: channel.statistics.videoCount,
    uploadsPlaylist: channel.contentDetails.relatedPlaylists.uploads
  };
}
