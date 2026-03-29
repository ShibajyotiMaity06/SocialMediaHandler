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
  test: {
    amountInPaise: 100,
    amountInCents: 1,
    label: "Test",
    dodoProductEnvKey: "DODO_PRODUCT_ID_TEST",
  }, // ₹1 / $0.01 for testing
  growth: {
    amountInPaise: 47400,
    amountInCents: 500,
    label: "Growth",
    dodoProductEnvKey: "DODO_PRODUCT_ID_GROWTH",
  },
  creator: {
    amountInPaise: 94800,
    amountInCents: 1000,
    label: "Creator",
    dodoProductEnvKey: "DODO_PRODUCT_ID_CREATOR",
  },
  pro: {
    amountInPaise: 1190000,
    amountInCents: 11900,
    label: "Pro",
    dodoProductEnvKey: "DODO_PRODUCT_ID_PRO",
  },
  agency: {
    amountInPaise: 990000,
    amountInCents: 9900,
    label: "Agency",
    dodoProductEnvKey: "DODO_PRODUCT_ID_AGENCY",
  },
};

// Image credit add-on packs (INR * 100)
export const ADDON_PACKS = {
  add10: {
    amountInPaise: 50000,
    amountInCents: 500,
    label: "+10 image credits",
    credits: 10,
    dodoProductEnvKey: "DODO_PRODUCT_ID_ADDON_10",
  },
  add20: {
    amountInPaise: 80000,
    amountInCents: 800,
    label: "+20 image credits",
    credits: 20,
    dodoProductEnvKey: "DODO_PRODUCT_ID_ADDON_20",
  },
  add50: {
    amountInPaise: 150000,
    amountInCents: 1500,
    label: "+50 image credits",
    credits: 50,
    dodoProductEnvKey: "DODO_PRODUCT_ID_ADDON_50",
  },
};
