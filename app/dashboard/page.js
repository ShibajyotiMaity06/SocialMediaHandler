"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState(null);
  const [adaptations, setAdaptations] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

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

    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setError("Please enter a YouTube URL");
      return;
    }

    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      setError("Invalid YouTube URL. Please enter a valid video link.");
      return;
    }

    setLoading(true);

    try {
      // Check usage limit first
      const checkRes = await fetch("/api/usage/check", { method: "POST" });
      const checkData = await checkRes.json();

      if (!checkData.allowed) {
        setShowLimitModal(true);
        setLoading(false);
        return;
      }

      // Navigate to adapt page
      router.push(`/adapt/${videoId}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#070709] text-slate-200">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-6 mb-6">
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
            <div className="flex items-center gap-4">
              {usage && (
                <div className="bg-[#1a1a24] border border-white/5 rounded-xl px-4 py-2 text-center">
                  <div className="text-lg font-bold text-white">
                    {usage.videos_used}/{usage.videos_limit}
                  </div>
                  <div className="text-xs text-slate-500">Videos used</div>
                </div>
              )}
              <Link
                href="/pricing"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
              >
                Upgrade to Growth →
              </Link>
            </div>
          </div>
        </div>

        {/* Analyze New Video Card */}
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎬</span>
            <div>
              <h2 className="text-lg font-bold text-white">
                Analyze New Video
              </h2>
              <p className="text-slate-400 text-sm">
                Paste YouTube URL to get started
              </p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} className="flex gap-3">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                if (error) setError("");
              }}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-grow px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
              ) : (
                "Analyze →"
              )}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-sm text-red-400 font-medium">{error}</p>
          )}
        </div>

        {/* Recent Adaptations */}
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-6">
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
            <div className="space-y-3">
              {adaptations.slice(0, 5).map((adaptation) => (
                <div
                  key={adaptation._id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
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
                  </div>
                  <Link
                    href={`/adapt/${adaptation.video_id}`}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors ml-3"
                  >
                    View
                  </Link>
                </div>
              ))}

              {adaptations.length > 5 && (
                <Link
                  href="/history"
                  className="block text-center text-sm text-indigo-400 font-semibold hover:text-indigo-300 transition-colors py-2"
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
          <div className="bg-[#111116] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Video Limit Reached
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                You've used {usage?.videos_used}/{usage?.videos_limit} videos
                this month on the Free plan.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-bold text-white mb-2">
                  Upgrade to Growth ($19/mo) for:
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
    </div>
  );
}
