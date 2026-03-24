// components/VideoSelector.jsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const MAX_BATCH_VIDEOS = 3;
const CREATOR_PLUS_TIERS = new Set(['creator', 'pro', 'agency']);

export default function VideoSelector({ videos }) {
  const { data: session } = useSession();
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();
  const userTier = String(session?.user?.tier || 'free').toLowerCase();
  const isCreatorPlus = CREATOR_PLUS_TIERS.has(userTier);

  const getVideoId = (video) => {
    return (
      video?.snippet?.resourceId?.videoId ||
      video?.contentDetails?.videoId ||
      video?.id ||
      null
    );
  };

  const getThumbnail = (video) => {
    return (
      video?.snippet?.thumbnails?.maxres?.url ||
      video?.snippet?.thumbnails?.high?.url ||
      video?.snippet?.thumbnails?.medium?.url ||
      video?.snippet?.thumbnails?.default?.url ||
      ''
    );
  };

  const handleAnalyze = (videoId) => {
    if (videoId) {
      router.push(`/adapt/${videoId}`);
    }
  };

  const toggleVideoSelection = (videoId) => {
    if (!videoId) return;

    setSelectedVideoIds((prev) => {
      if (prev.includes(videoId)) {
        return prev.filter((id) => id !== videoId);
      }

      if (!isCreatorPlus && prev.length >= 1) {
        setShowUpgradeModal(true);
        return prev;
      }

      if (prev.length >= MAX_BATCH_VIDEOS) {
        return prev;
      }

      return [...prev, videoId];
    });
  };

  const handleBatchAnalyze = () => {
    if (selectedVideoIds.length === 0) return;

    if (!isCreatorPlus && selectedVideoIds.length > 1) {
      setShowUpgradeModal(true);
      return;
    }

    router.push(`/adapt/batch?videoIds=${encodeURIComponent(selectedVideoIds.join(','))}`);
  };

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">Recent Videos</h2>
        <p className="text-sm text-slate-400">Select up to 3 videos and process them in batch</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleBatchAnalyze}
            disabled={selectedVideoIds.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Selected ({selectedVideoIds.length}/{MAX_BATCH_VIDEOS})
          </button>
          {selectedVideoIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedVideoIds([])}
              className="px-3 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/5"
            >
              Clear
            </button>
          )}
          {!isCreatorPlus && (
            <span className="text-[11px] text-amber-300/80">
              Multi-video batch is available on Creator tier ($24/mo)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {videos.map((video, idx) => {
          const videoId = getVideoId(video);
          const thumbnailUrl = getThumbnail(video);
          const isDisabled = !videoId;
          const isSelected = Boolean(videoId) && selectedVideoIds.includes(videoId);

          // Rotate some mock platforms for UI fidelity based on the screenshot
          const platforms = [
            <><span className="font-bold text-slate-300">in</span> Instagram</>,
            <><svg className="w-3.5 h-3.5 inline mr-1 text-slate-300" viewBox="0 0 24 24" fill="currentColor"><path d="M11.999 7.377a4.623 4.623 0 1 0 0 9.248 4.623 4.623 0 0 0 0-9.248zm0 7.627a3.004 3.004 0 1 1 0-6.008 3.004 3.004 0 0 1 0 6.008z" /><circle cx="15.61" cy="8.39" r="1.09" /><path d="M11.999 2.1c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.584.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.1c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" /></svg> Instagram</>,
            <><span className="font-bold text-slate-300">𝕏</span> Instagram</>,
            <><span className="font-bold text-slate-300">in</span> Instagram</>,
          ];
          const mockPlatform = platforms[idx % platforms.length];

          return (
            <div
              key={`${videoId || 'invalid'}-${idx}`}
              className={`
                flex flex-col bg-[#111116] border border-white/10 rounded-2xl overflow-hidden
                transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]
                ${isDisabled ? 'opacity-50 grayscale' : ''}
                ${isSelected ? 'ring-2 ring-indigo-500/70 border-indigo-400/40' : ''}
              `}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-[#1a1a24]">
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={() => toggleVideoSelection(videoId)}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-400 text-white'
                        : 'bg-black/60 border-white/30 text-white/80'
                    }`}
                    title="Select for batch"
                  >
                    {isSelected ? '✓' : ''}
                  </button>
                )}
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={video?.snippet?.title || 'Video thumbnail'}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m18-5l-4.5-4.5M21 10v9m0-9H3m18 0l-4.5 4.5" /></svg>
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-2">
                  {video?.snippet?.title || 'Untitled video'}
                </h3>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {video?.snippet?.publishedAt ? new Date(video.snippet.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                </div>

                <div className="flex flex-col gap-2 mb-4 mt-1">
                  <div className="flex items-center text-red-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.86-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M9.996,15.005l0-6.01l5.518,3.005L9.996,15.005z" /></svg>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    {mockPlatform}
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => !isDisabled && handleAnalyze(videoId)}
                    className={`w-full py-2.5 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#a855f7] text-white font-bold text-sm tracking-wide transition-opacity flex justify-center items-center gap-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  >
                    Analyze Single <span className="text-base ml-0.5">✨</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111116]/90 border border-amber-400/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-bold text-white mb-2">Batch mode is locked</h3>
              <p className="text-sm text-slate-300 mb-5">
                Upgrade to Creator tier ($24/mo) to analyze up to 3 videos in one batch.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/pricing')}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
