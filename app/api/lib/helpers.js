// Helper to get current month string in YYYY-MM format
export function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Tier limits config
export const TIER_LIMITS = {
  free: { videos: 2, images: 0 },
  growth: { videos: 12, images: 5 },
  creator: { videos: 50, images: 25 },
  agency: { videos: 999999, images: 100 },
};
