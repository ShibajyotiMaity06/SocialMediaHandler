'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import PlatformCard from './PlatformCard';
import { PLATFORM_CONFIG } from '@/app/api/lib/constants';

const DEFAULT_PLATFORMS = ['instagram', 'linkedin', 'twitter'];
const MAX_BATCH_VIDEOS = 3;
const CREATOR_PLUS_TIERS = new Set(['creator', 'pro', 'agency']);

function normalizeHookText(hook) {
  if (typeof hook === 'string') return hook.trim();
  if (!hook || typeof hook !== 'object') return '';
  return String(hook.text || hook.hook || hook.value || hook.title || '').trim();
}

function makeVideoState(videoId, index) {
  return {
    videoId,
    label: `Video ${index + 1}`,
    title: `Video ${index + 1}`,
    extractedContent: null,
    adaptations: [],
    activePlatform: null,
    isProcessing: false,
    isSaving: false,
    error: null,
  };
}

export default function BatchAdaptationDashboard({ initialVideoIds = [] }) {
  const { data: session } = useSession();
  const normalizedIds = useMemo(() => {
    const seen = new Set();
    const ids = [];

    for (const candidate of initialVideoIds) {
      const value = String(candidate || '').trim();
      if (!/^[a-zA-Z0-9_-]{11}$/.test(value)) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      ids.push(value);
      if (ids.length === MAX_BATCH_VIDEOS) break;
    }

    return ids;
  }, [initialVideoIds]);

  const [usage, setUsage] = useState(null);
  const [activeVideoId, setActiveVideoId] = useState(normalizedIds[0] || null);
  const [videos, setVideos] = useState(normalizedIds.map((videoId, idx) => makeVideoState(videoId, idx)));
  const [globalError, setGlobalError] = useState('');
  const [processingAll, setProcessingAll] = useState(false);

  const userTier = String(usage?.tier || session?.user?.tier || 'free').toLowerCase();
  const isCreatorPlus = CREATOR_PLUS_TIERS.has(userTier);

  useEffect(() => {
    async function loadUsage() {
      try {
        const response = await fetch('/api/usage');
        const data = await response.json();
        if (response.ok) {
          setUsage(data);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadUsage();
  }, []);

  useEffect(() => {
    async function loadVideoTitles() {
      const updates = await Promise.all(
        videos.map(async (video) => {
          try {
            const res = await fetch(
              `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.videoId}&format=json`
            );
            if (!res.ok) return { videoId: video.videoId, title: video.label };
            const data = await res.json();
            return { videoId: video.videoId, title: String(data?.title || video.label) };
          } catch {
            return { videoId: video.videoId, title: video.label };
          }
        })
      );

      setVideos((prev) =>
        prev.map((video) => {
          const found = updates.find((entry) => entry.videoId === video.videoId);
          return found ? { ...video, title: found.title } : video;
        })
      );
    }

    if (videos.length > 0) {
      loadVideoTitles();
    }
  }, [videos.length]);

  async function refreshUsage() {
    try {
      const res = await fetch('/api/usage');
      const data = await res.json();
      if (res.ok) setUsage(data);
      return data;
    } catch {
      return usage;
    }
  }

  async function analyzeAndAdaptVideo(videoId) {
    setVideos((prev) =>
      prev.map((video) =>
        video.videoId === videoId
          ? { ...video, isProcessing: true, error: null, adaptations: [] }
          : video
      )
    );

    try {
      const usageSnapshot = usage || (await refreshUsage());
      const remaining = Math.max(
        Number(usageSnapshot?.videos_limit || 0) - Number(usageSnapshot?.videos_used || 0),
        0
      );

      if (remaining < 1) {
        throw new Error('No video credits remaining. Upgrade your plan to continue.');
      }

      const incrementRes = await fetch('/api/usage/increment', { method: 'POST' });
      const incrementData = await incrementRes.json();
      if (!incrementRes.ok) {
        throw new Error(incrementData.error || 'Unable to reserve video credit.');
      }

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) {
        throw new Error(analyzeData.error || 'Analysis failed for this video.');
      }

      const extractedContent = analyzeData.data;

      const adaptRes = await fetch('/api/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: DEFAULT_PLATFORMS,
          extractedContent,
          videoId,
        }),
      });
      const adaptData = await adaptRes.json();
      if (!adaptRes.ok) {
        throw new Error(adaptData.error || 'Adaptation failed for this video.');
      }

      setVideos((prev) =>
        prev.map((video) =>
          video.videoId === videoId
            ? {
                ...video,
                extractedContent,
                adaptations: Array.isArray(adaptData.data) ? adaptData.data : [],
                activePlatform: adaptData?.data?.[0]?.platform || null,
                isSaving: true,
              }
            : video
        )
      );

      try {
        await fetch('/api/adaptations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_id: videoId,
            video_title: videos.find((v) => v.videoId === videoId)?.title || videoId,
            extracted_content: extractedContent,
            platforms: DEFAULT_PLATFORMS,
          }),
        });
      } catch (saveError) {
        console.error('Failed to save adaptation', saveError);
      }

      await refreshUsage();

      setVideos((prev) =>
        prev.map((video) =>
          video.videoId === videoId
            ? {
                ...video,
                isSaving: false,
                isProcessing: false,
              }
            : video
        )
      );
    } catch (error) {
      const message = String(error?.message || 'Failed to process video.');
      setVideos((prev) =>
        prev.map((video) =>
          video.videoId === videoId
            ? {
                ...video,
                isProcessing: false,
                isSaving: false,
                error: message,
              }
            : video
        )
      );
    }
  }

  async function handleProcessAll() {
    setGlobalError('');
    setProcessingAll(true);

    try {
      const usageSnapshot = usage || (await refreshUsage());
      const remaining = Math.max(
        Number(usageSnapshot?.videos_limit || 0) - Number(usageSnapshot?.videos_used || 0),
        0
      );

      if (remaining < videos.length) {
        throw new Error(`You need ${videos.length} credits, but only ${remaining} remaining.`);
      }

      for (const video of videos) {
        await analyzeAndAdaptVideo(video.videoId);
      }
    } catch (error) {
      setGlobalError(String(error?.message || 'Bulk processing failed.'));
    } finally {
      setProcessingAll(false);
    }
  }

  async function handleRequestVariations(videoId, platform) {
    const video = videos.find((entry) => entry.videoId === videoId);
    const adaptation = video?.adaptations?.find((item) => item.platform === platform);

    if (!video?.extractedContent || !adaptation) return;

    try {
      const response = await fetch('/api/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseHook: normalizeHookText(adaptation.selectedHook) || normalizeHookText(adaptation.hooks?.[0]),
          platform,
          extractedContent: video.extractedContent,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate variations');

      const generated = Array.isArray(result.data)
        ? result.data.map((item) => item?.hook).filter(Boolean)
        : [];

      setVideos((prev) =>
        prev.map((entry) => {
          if (entry.videoId !== videoId) return entry;

          return {
            ...entry,
            adaptations: entry.adaptations.map((item) =>
              item.platform === platform
                ? {
                    ...item,
                    hooks: [...(Array.isArray(item.hooks) ? item.hooks : []), ...generated],
                  }
                : item
            ),
          };
        })
      );
    } catch (error) {
      setGlobalError(String(error?.message || 'Failed to generate hook variations.'));
    }
  }

  function handleHookChange(videoId, platform, hook) {
    const normalized = normalizeHookText(hook);

    setVideos((prev) =>
      prev.map((entry) => {
        if (entry.videoId !== videoId) return entry;
        return {
          ...entry,
          adaptations: entry.adaptations.map((item) =>
            item.platform === platform ? { ...item, selectedHook: normalized } : item
          ),
        };
      })
    );
  }

  if (!normalizedIds.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-red-200">
          Invalid batch request. Please choose at least one valid YouTube video and try again.
        </div>
      </div>
    );
  }

  if (normalizedIds.length > 1 && !isCreatorPlus) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
          <h1 className="text-xl font-bold text-white mb-2">Batch Processing is a Creator feature</h1>
          <p className="text-amber-100/80 text-sm mb-4">
            Analyze up to 3 videos in one run by upgrading to the Creator tier ($49/mo).
          </p>
          <Link
            href="/pricing"
            className="inline-flex px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold"
          >
            Upgrade to Creator
          </Link>
        </div>
      </div>
    );
  }

  const activeVideo = videos.find((video) => video.videoId === activeVideoId) || videos[0];
  const videoTabsGridClass =
    videos.length === 1 ? 'grid-cols-1' : videos.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="flex-grow w-full py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-slate-200">
      <div className="mb-6 rounded-3xl border border-white/10 bg-[#161B22]/80 backdrop-blur-xl p-6 sm:p-8">
        <h1 className="text-3xl font-black text-white mb-2">Batch Adaptation Studio</h1>
        <p className="text-sm text-slate-400 mb-4">
          Processing {videos.length} video{videos.length > 1 ? 's' : ''} with separate analysis.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleProcessAll}
            disabled={processingAll}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm disabled:opacity-50"
          >
            {processingAll ? 'Processing all videos...' : 'Process All Videos'}
          </button>

          <span className="text-xs text-slate-400">
            Usage: {usage?.videos_used ?? 0}/{usage?.videos_limit ?? '-'}
          </span>
        </div>

        {globalError && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {globalError}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#161B22]/80 backdrop-blur-xl overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <div className={`grid ${videoTabsGridClass} border-b border-white/10 bg-white/[0.02]`}>
          {videos.map((video, index) => {
            const isActive = activeVideo.videoId === video.videoId;
            const done = video.adaptations.length > 0;
            const statusClass = video.isProcessing
              ? 'text-cyan-300'
              : done
                ? 'text-emerald-300'
                : 'text-slate-400';

            return (
              <button
                key={video.videoId}
                type="button"
                onClick={() => setActiveVideoId(video.videoId)}
                className={`group relative px-5 py-4 text-left transition-all border-r border-white/10 last:border-r-0 min-h-[116px] ${
                  isActive
                    ? 'bg-gradient-to-b from-white/[0.12] to-white/[0.05] text-white'
                    : 'text-slate-400 hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400 to-indigo-500" />
                )}
                <p className="text-xs font-bold uppercase tracking-wide mb-1">Video {index + 1}</p>
                <p className="text-sm font-semibold line-clamp-2 min-h-[40px] group-hover:text-white transition-colors">
                  {video.title}
                </p>
                <p className={`text-[11px] mt-1 ${statusClass}`}>
                  {video.isProcessing ? 'Processing...' : done ? 'Completed' : 'Pending'}
                </p>
              </button>
            );
          })}
        </div>

        {activeVideo && (
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{activeVideo.title}</h2>
                <p className="text-xs text-slate-500">https://youtube.com/watch?v={activeVideo.videoId}</p>
              </div>
              <button
                type="button"
                onClick={() => analyzeAndAdaptVideo(activeVideo.videoId)}
                disabled={activeVideo.isProcessing || processingAll}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-50"
              >
                {activeVideo.isProcessing ? 'Processing...' : 'Process This Video'}
              </button>
            </div>

            {activeVideo.error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {activeVideo.error}
              </div>
            )}

            {activeVideo.extractedContent && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                  <p className="text-[11px] text-slate-500 uppercase font-bold mb-1">Niche</p>
                  <p className="text-sm font-semibold text-white capitalize">{activeVideo.extractedContent.niche || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                  <p className="text-[11px] text-slate-500 uppercase font-bold mb-1">Type</p>
                  <p className="text-sm font-semibold text-white capitalize">{activeVideo.extractedContent.contentType || 'N/A'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                  <p className="text-[11px] text-slate-500 uppercase font-bold mb-1">Tone</p>
                  <p className="text-sm font-semibold text-white capitalize">{activeVideo.extractedContent.tone || 'N/A'}</p>
                </div>
              </div>
            )}

            {activeVideo.adaptations.length > 0 && (
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0B0E14]/40">
                <div className="flex overflow-x-auto border-b border-white/10">
                  {activeVideo.adaptations.map((adaptation) => {
                    const config = PLATFORM_CONFIG[adaptation.platform];
                    const isActivePlatform = activeVideo.activePlatform === adaptation.platform;

                    return (
                      <button
                        key={adaptation.platform}
                        type="button"
                        onClick={() => {
                          setVideos((prev) =>
                            prev.map((video) =>
                              video.videoId === activeVideo.videoId
                                ? { ...video, activePlatform: adaptation.platform }
                                : video
                            )
                          );
                        }}
                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${
                          isActivePlatform ? 'text-white bg-white/5' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {config?.name || adaptation.platform}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 sm:p-6">
                  {activeVideo.adaptations.map((adaptation) => {
                    if (adaptation.platform !== activeVideo.activePlatform) return null;

                    return (
                      <PlatformCard
                        key={`${activeVideo.videoId}-${adaptation.platform}`}
                        adaptation={adaptation}
                        userTier={userTier}
                        onHookChange={(hook) => handleHookChange(activeVideo.videoId, adaptation.platform, hook)}
                        onRequestVariations={() => handleRequestVariations(activeVideo.videoId, adaptation.platform)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {!activeVideo.isProcessing && activeVideo.adaptations.length === 0 && !activeVideo.error && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-400 text-sm">
                Run processing to generate analysis and platform-specific adaptations for this video.
              </div>
            )}

            {activeVideo.isSaving && (
              <p className="mt-3 text-xs text-slate-500">Saving adaptation history...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
