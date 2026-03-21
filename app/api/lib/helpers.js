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
  test: { videos: 2, images: 0 },
  growth: { videos: 12, images: 5 },
  creator: { videos: 50, images: 25 },
  pro: { videos: 100, images: 50 },
  agency: { videos: 999999, images: 100 },
};

// Razorpay plan prices in paise (INR * 100)
export const PLAN_PRICES = {
  test: { amountInPaise: 100, label: "Test" }, // ₹1 for testing
  growth: { amountInPaise: 190000, label: "Growth" },
  creator: { amountInPaise: 490000, label: "Creator" },
  pro: { amountInPaise: 1190000, label: "Pro" },
  agency: { amountInPaise: 990000, label: "Agency" },
};

// Image credit add-on packs (INR * 100)
export const ADDON_PACKS = {
  add10: { amountInPaise: 50000, label: "+10 image credits", credits: 10 },
  add20: { amountInPaise: 80000, label: "+20 image credits", credits: 20 },
  add50: { amountInPaise: 150000, label: "+50 image credits", credits: 50 },
};
