// app/api/lib/youtube.js

import { YoutubeTranscript } from "youtube-transcript";

/* ------------------------------------------
   CHANNEL HELPERS
------------------------------------------ */

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
  } catch {}

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

/* ------------------------------------------
   CHANNEL DATA
------------------------------------------ */

export async function getChannelData(channelUrl, apiKey) {
  const param = getChannelLookupParam(channelUrl);

  const url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&${param}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  if (!data.items?.[0]) throw new Error("Channel not found");

  const channel = data.items[0];

  return {
    id: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    subscriberCount: channel.statistics.subscriberCount,
    viewCount: channel.statistics.viewCount,
    videoCount: channel.statistics.videoCount,
    uploadsPlaylist: channel.contentDetails.relatedPlaylists.uploads,
  };
}

/* ------------------------------------------
   VIDEO DATA
------------------------------------------ */

export async function getVideoData(videoId, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const video = data.items[0];

  return {
    id: videoId,
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnail: video.snippet.thumbnails.high.url,
    duration: video.contentDetails.duration,
    views: video.statistics.viewCount,
    likes: video.statistics.likeCount || "0",
    publishedAt: video.snippet.publishedAt,
    channelTitle: video.snippet.channelTitle,
  };
}

export async function searchTrendingVideosByNiche(
  niche,
  apiKey,
  daysBack = 5,
  maxResults = 25
) {
  const safeDaysBack = Math.max(3, Math.min(5, Number(daysBack) || 5));
  const safeMaxResults = Math.max(5, Math.min(50, Number(maxResults) || 25));
  const publishedAfter = new Date(Date.now() - safeDaysBack * 24 * 60 * 60 * 1000).toISOString();

  const searchUrl =
    "https://www.googleapis.com/youtube/v3/search?" +
    new URLSearchParams({
      part: "snippet",
      type: "video",
      order: "viewCount",
      maxResults: String(safeMaxResults),
      q: niche,
      publishedAfter,
      key: apiKey,
    }).toString();

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`YouTube search failed: ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  const videoIds = (searchData.items || []).map((item) => item?.id?.videoId).filter(Boolean);

  if (videoIds.length === 0) {
    return [];
  }

  const videoUrl =
    "https://www.googleapis.com/youtube/v3/videos?" +
    new URLSearchParams({
      part: "snippet,statistics",
      id: videoIds.join(","),
      key: apiKey,
    }).toString();

  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    throw new Error(`YouTube videos lookup failed: ${videoRes.status}`);
  }

  const videoData = await videoRes.json();

  return (videoData.items || []).map((item) => ({
    videoId: item.id,
    title: item.snippet?.title || "",
    description: item.snippet?.description || "",
    channelTitle: item.snippet?.channelTitle || "",
    publishedAt: item.snippet?.publishedAt || null,
    thumbnail: item.snippet?.thumbnails?.high?.url || "",
    viewCount: Number(item.statistics?.viewCount || 0),
    likeCount: Number(item.statistics?.likeCount || 0),
    commentCount: Number(item.statistics?.commentCount || 0),
    url: `https://www.youtube.com/watch?v=${item.id}`,
  }));
}


export async function getVideoTranscript(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map((t) => t.text).join(" ");
  } catch (error) {
    console.error("[TRANSCRIPT ERROR]", error.message);
    return null;
  }
}