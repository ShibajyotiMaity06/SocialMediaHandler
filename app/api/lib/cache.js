// app/api/lib/cache.js

// Global in-memory cache (persists across API calls during runtime)
const cache = new Map();

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000;

export function getCached(key) {
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  // Check if expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  console.log(`[CACHE HIT] ${key}`);
  return cached.data;
}

export function setCached(key, data) {
  console.log(`[CACHE SET] ${key}`);
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCache() {
  cache.clear();
}

// Cache keys
export const CACHE_KEYS = {
  extraction: (videoId) => `extraction:${videoId}`,
  adaptation: (videoId, platforms) => `adaptation:${videoId}:${platforms.join(',')}`,
  transcript: (videoId) => `transcript:${videoId}`,
};