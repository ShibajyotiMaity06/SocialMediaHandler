"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Prism from "@/components/Prism";
import ConnectXButton from "@/components/ConnectXButton";

const TIER_SEQUENCE = ["free", "growth", "creator", "agency"];
const CREATOR_PLUS_TIERS = new Set(["creator", "pro", "agency"]);
const MAX_BATCH_VIDEOS = 3;

function shouldShowPaymentPopupFromUrl() {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  const paymentStatus = url.searchParams.get("payment");
  return paymentStatus === "success" || paymentStatus === "addon_success";
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState(null);
  const [adaptations, setAdaptations] = useState([]);
  const [videoUrls, setVideoUrls] = useState([""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showCreatorUpgradeModal, setShowCreatorUpgradeModal] = useState(false);
  const [showPaymentSuccessPopup, setShowPaymentSuccessPopup] = useState(
    shouldShowPaymentPopupFromUrl
  );

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch usage and recent adaptations
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/usage")
        .then((r) => r.json())
        .then((data) => setUsage(data))
        .catch(console.error);

      fetch("/api/adaptations")
        .then((r) => r.json())
        .then((data) => setAdaptations(data.adaptations || []))
        .catch(console.error);
    }
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const paymentStatus = url.searchParams.get("payment");
    if (paymentStatus === "success" || paymentStatus === "addon_success") {
      url.searchParams.delete("payment");
      url.searchParams.delete("provider");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }
  }, []);

  function extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    setError("");

    const normalizedUrls = videoUrls.map((url) => url.trim()).filter(Boolean);

    if (normalizedUrls.length === 0) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (normalizedUrls.length > MAX_BATCH_VIDEOS) {
      setError(`You can process up to ${MAX_BATCH_VIDEOS} videos at once.`);
      return;
    }

    const currentTierValue = String(usage?.tier || session?.user?.tier || "free").toLowerCase();
    const isCreatorPlus = CREATOR_PLUS_TIERS.has(currentTierValue);

    if (!isCreatorPlus && normalizedUrls.length > 1) {
      setShowCreatorUpgradeModal(true);
      return;
    }

    const videoIds = normalizedUrls.map(extractVideoId);
    if (videoIds.some((id) => !id)) {
      setError("One or more links are invalid. Please use valid YouTube video URLs.");
      return;
    }

    const uniqueVideoIds = [...new Set(videoIds)];

    if (!isCreatorPlus && uniqueVideoIds.length > 1) {
      setShowCreatorUpgradeModal(true);
      return;
    }

    setLoading(true);

    try {
      let usageSnapshot = usage;
      if (!usageSnapshot) {
        const usageRes = await fetch("/api/usage");
        usageSnapshot = await usageRes.json();
        if (usageRes.ok) {
          setUsage(usageSnapshot);
        }
      }

      const remaining = Math.max(
        Number(usageSnapshot?.videos_limit || 0) - Number(usageSnapshot?.videos_used || 0),
        0
      );

      if (remaining < uniqueVideoIds.length) {
        setShowLimitModal(true);
        setLoading(false);
        return;
      }

      if (uniqueVideoIds.length === 1) {
        router.push(`/adapt/${uniqueVideoIds[0]}`);
      } else {
        router.push(`/adapt/batch?videoIds=${encodeURIComponent(uniqueVideoIds.join(","))}`);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function updateVideoUrl(index, value) {
    setVideoUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
    if (error) setError("");
  }

  function handleAddMoreInput() {
    const currentTierValue = String(usage?.tier || session?.user?.tier || "free").toLowerCase();
    const isCreatorPlus = CREATOR_PLUS_TIERS.has(currentTierValue);

    if (!isCreatorPlus) {
      setShowCreatorUpgradeModal(true);
      return;
    }

    setVideoUrls((prev) => {
      if (prev.length >= MAX_BATCH_VIDEOS) return prev;
      return [...prev, ""];
    });
  }

  function handleRemoveInput(index) {
    setVideoUrls((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const videosUsed = usage?.videos_used ?? 0;
  const videosLimit = Math.max(usage?.videos_limit ?? 1, 1);
  const usageRatio = Math.min(videosUsed / videosLimit, 1);
  const currentTier = String(usage?.tier || session?.user?.tier || "free").toLowerCase();
  const currentTierIndex = TIER_SEQUENCE.indexOf(currentTier);
  const nextTier =
    currentTierIndex >= 0 && currentTierIndex < TIER_SEQUENCE.length - 1
      ? TIER_SEQUENCE[currentTierIndex + 1]
      : null;
  const upgradeButtonLabel = nextTier
    ? `Upgrade to ${nextTier.charAt(0).toUpperCase()}${nextTier.slice(1)} →`
    : "You are on highest tier";
  const isCreatorPlus = CREATOR_PLUS_TIERS.has(currentTier);

  const getPlatformIconSrc = (platform) => {
    const p = String(platform || "").toLowerCase();
    if (p.includes("youtube")) return "/youtube.png";
    if (p.includes("instagram")) return "/insta.png";
    if (p.includes("tiktok")) return "/tiktok.png";
    if (p.includes("linkedin")) return "/linkedin.png";
    return null;
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-slate-200 overflow-hidden">
      {/* Prism Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={1}
        />
      </div>
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-[#070709]/50 z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full h-full">
        <Navbar />

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Welcome Header */}
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl p-6 mb-6 shadow-[0_15px_50px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Welcome, {session.user?.name?.split(" ")[0]}! 👋
              </h1>
              <p className="text-slate-400 text-sm">
                You're on the{" "}
                <span className="uppercase font-bold text-indigo-400">
                  {usage?.tier || "free"}
                </span>{" "}
                plan
              </p>
            </div>
            <div className="flex items-center gap-5">
              <ConnectXButton />
              {usage && (
                <div className="relative w-[104px] h-[78px] flex items-center justify-center">
                  <svg viewBox="0 0 104 62" className="w-full h-full">
                    <path
                      d="M 14 54 A 38 38 0 0 1 90 54"
                      fill="none"
                      stroke="rgba(255,255,255,0.22)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      pathLength="100"
                    />
                    <path
                      d="M 14 54 A 38 38 0 0 1 90 54"
                      fill="none"
                      stroke="url(#usageGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      pathLength="100"
                      strokeDasharray={`${usageRatio * 100} 100`}
                      style={{ transition: "stroke-dasharray 500ms ease" }}
                    />
                    <defs>
                      <linearGradient id="usageGradient" x1="10" y1="40" x2="70" y2="40" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#7c3aed" />
                        <stop offset="1" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
                    <div className="text-[20px] font-extrabold text-white leading-[0.9] tracking-tight">
                      {videosUsed}/{videosLimit}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5">Videos used</div>
                  </div>
                </div>
              )}
              {nextTier ? (
                <Link
                  href="/pricing"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                >
                  {upgradeButtonLabel}
                </Link>
              ) : (
                <span className="px-4 py-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-sm font-bold">
                  {upgradeButtonLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Analyze New Video Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl p-6 mb-6 shadow-[0_15px_50px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎬</span>
            <div>
              <h2 className="text-lg font-bold text-white">
                Analyze Videos
              </h2>
              <p className="text-slate-400 text-sm">
                Paste up to 3 YouTube links. Batch mode is Creator tier and above.
              </p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="space-y-3">
            {videoUrls.map((url, index) => (
              <div key={`video-input-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateVideoUrl(index, e.target.value)}
                  placeholder={`Video ${index + 1}: https://youtube.com/watch?v=...`}
                  className="flex-grow px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                />
                {videoUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInput(index)}
                    className="px-3 py-2 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5"
                    title="Remove"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddMoreInput}
                disabled={videoUrls.length >= MAX_BATCH_VIDEOS}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add More ({videoUrls.length}/{MAX_BATCH_VIDEOS})
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Checking...
                  </span>
                ) : videoUrls.filter((entry) => entry.trim()).length > 1 ? (
                  "Analyze Batch →"
                ) : (
                  "Analyze →"
                )}
              </button>
            </div>

            {!isCreatorPlus && (
              <p className="text-xs text-amber-300/80">
                Add More for batch processing is available on Creator tier ($10/mo).
              </p>
            )}
          </form>

          {error && (
            <p className="mt-3 text-sm text-red-400 font-medium">{error}</p>
          )}
        </div>

        {/* Recent Adaptations */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl p-6 shadow-[0_15px_50px_rgba(0,0,0,0.35)]">
          <h2 className="text-lg font-bold text-white mb-4">
            Recent Adaptations
          </h2>

          {adaptations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium">No videos analyzed yet</p>
              <p className="text-sm mt-1">
                Paste a YouTube URL above to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {adaptations.slice(0, 5).map((adaptation) => (
                <div
                  key={adaptation._id}
                  className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/10 rounded-xl hover:bg-white/[0.08] transition-colors"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${adaptation.video_id}/mqdefault.jpg`}
                    alt={adaptation.video_title || "Video thumbnail"}
                    className="w-24 h-14 rounded-lg object-cover border border-white/10 flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {adaptation.video_title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {new Date(adaptation.created_at).toLocaleDateString()}
                      </span>
                      {adaptation.platforms?.length > 0 && (
                        <span className="text-xs text-slate-500">
                          • {adaptation.platforms.length} platforms
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      {(adaptation.platforms || []).slice(0, 5).map((platform, idx) => {
                        const src = getPlatformIconSrc(platform);
                        if (!src) return null;
                        return (
                          <img
                            key={`${platform}-${idx}`}
                            src={src}
                            alt={String(platform)}
                            title={String(platform)}
                            className="w-3.5 h-3.5 object-contain opacity-90"
                            loading="lazy"
                          />
                        );
                      })}
                    </div>
                  </div>
                  <Link
                    href={`/adapt/${adaptation.video_id}`}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-400/20 rounded-lg hover:bg-indigo-500/30 transition-colors ml-1"
                  >
                    View
                  </Link>
                </div>
              ))}

              {adaptations.length > 5 && (
                <Link
                  href="/history"
                  className="md:col-span-2 block text-center text-sm text-indigo-400 font-semibold hover:text-indigo-300 transition-colors py-2"
                >
                  View all {adaptations.length} adaptations →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111116]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Video Limit Reached
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                You've used {usage?.videos_used}/{usage?.videos_limit} videos
                this month. Please upgrade to continue processing videos.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-bold text-white mb-2">
                  Upgrade your plan for:
                </p>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• 12 videos/month</li>
                  <li>• 5 AI images/month</li>
                  <li>• Scheduling & more</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/pricing"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm text-center hover:shadow-lg transition-all"
                >
                  Upgrade Now →
                </Link>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-medium text-sm hover:bg-white/5 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreatorUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111116]/90 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h2 className="text-xl font-bold text-white mb-2">Batch processing is locked</h2>
              <p className="text-slate-300 text-sm mb-5">
                Add More and multi-video batch analysis are available on Creator tier ($10/mo).
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreatorUpgradeModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-medium text-sm hover:bg-white/5 transition-colors"
                >
                  Maybe Later
                </button>
                <Link
                  href="/pricing"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm text-center hover:shadow-lg transition-all"
                >
                  Upgrade to Creator
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPaymentSuccessPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111116]/90 backdrop-blur-xl border border-emerald-400/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-xl font-bold text-white mb-2">Payment successful</h2>
              <p className="text-slate-300 text-sm mb-5">
                Your payment has been processed successfully.
              </p>
              <button
                type="button"
                onClick={() => setShowPaymentSuccessPopup(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#041015] font-bold text-sm hover:brightness-110 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
