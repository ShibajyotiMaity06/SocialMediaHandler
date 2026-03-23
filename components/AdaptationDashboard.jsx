// components/AdaptationDashboard.jsx

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PlatformCard from './PlatformCard';
import { PLATFORM_CONFIG } from '@/app/api/lib/constants';
import Link from 'next/link';

function normalizeHookText(hook) {
  if (typeof hook === 'string') return hook.trim();
  if (!hook || typeof hook !== 'object') return '';
  return String(hook.text || hook.hook || hook.value || hook.title || '').trim();
}

export default function AdaptationDashboard({ videoId, videoTitle }) {
  const { data: session } = useSession();
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [extractedContent, setExtractedContent] = useState(null);
  const [adaptations, setAdaptations] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [saved, setSaved] = useState(false);

  const platforms = ['twitter', 'linkedin', 'tiktok', 'instagram', 'youtube_shorts'];
  const userTier = session?.user?.tier || 'free';

  // Fetch usage on mount
  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(data => setUsage(data))
      .catch(console.error);
  }, []);

  // Step 1: Analyze
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const usageCheckRes = await fetch('/api/usage/check', { method: 'POST' });
      const usageCheck = await usageCheckRes.json();

      if (!usageCheckRes.ok) {
        throw new Error(usageCheck.error || 'Failed to validate usage limit');
      }

      if (!usageCheck.allowed) {
        throw new Error(
          `Video limit reached (${usageCheck.videos_used}/${usageCheck.videos_limit}). Upgrade to continue.`
        );
      }

      // Increment usage first
      await fetch('/api/usage/increment', { method: 'POST' });

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      setExtractedContent(result.data);

      // Refresh usage
      const usageRes = await fetch('/api/usage');
      const usageData = await usageRes.json();
      setUsage(usageData);

      if (result.cached) {
        console.log('✅ Used cached extraction - no API calls made!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Adapt
  const handleAdapt = async () => {
    if (!extractedContent || selectedPlatforms.length === 0) return;

    setIsAdapting(true);
    setError(null);

    try {
      const response = await fetch('/api/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          extractedContent,
          videoId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Adaptation failed');
      }

      setAdaptations(result.data);
      if (result.data && result.data.length > 0) {
        setActiveTab(result.data[0].platform);
      }

      // Save adaptation to DB
      try {
        await fetch('/api/adaptations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_id: videoId,
            video_title: videoTitle,
            extracted_content: extractedContent,
            platforms: selectedPlatforms,
          }),
        });
        setSaved(true);
      } catch (saveErr) {
        console.error('Failed to save adaptation:', saveErr);
      }

      if (result.cached) {
        console.log('✅ Used cached adaptations - no API calls made!');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdapting(false);
    }
  };

  // Request hook variations
  const handleRequestVariations = async (platform, baseHook) => {
    try {
      const response = await fetch('/api/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseHook,
          platform,
          extractedContent,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const newHooks = Array.isArray(result.data)
          ? result.data.map(v => v?.hook).filter(Boolean)
          : [];

        setAdaptations(prev => prev.map(a =>
          a.platform === platform
            ? { ...a, hooks: [...(Array.isArray(a.hooks) ? a.hooks : []), ...newHooks] }
            : a
        ));
      } else {
        alert(result.error);
      }
    } catch (err) {
      console.error('Failed to generate variations:', err);
      alert('Failed to generate hook variations');
    }
  };

  // Change hook
  const handleHookChange = (platform, hook) => {
    const normalizedHook = normalizeHookText(hook);
    setAdaptations(prev => prev.map(a =>
      a.platform === platform ? { ...a, selectedHook: normalizedHook } : a
    ));
  };

  return (
    <div className="flex-grow w-full py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-slate-200">
      
      {/* Hero Section */}
      <div className="relative mb-12 group animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-[2.5rem] blur-xl transition duration-1000"></div>
        <div className="relative bg-[#161B22]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative z-10 flex-1">
            <h1 className="text-4xl sm:text-5xl font-black mb-3 tracking-tight text-white">
              Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Adaptation Studio</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg flex items-center gap-2">
              <span className="text-white/90 font-semibold line-clamp-1">{videoTitle}</span>
            </p>
          </div>

          {/* Usage indicator */}
          {usage && (
            <div className="relative z-10 flex flex-col md:items-end gap-1 bg-[#0B0E14]/60 backdrop-blur-md rounded-2xl p-5 border border-white/5 md:min-w-[200px]">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Credits</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{usage.videos_limit - usage.videos_used}</span>
                <span className="text-md font-bold text-slate-500">/ {usage.videos_limit}</span>
              </div>
              {userTier === 'free' && (
                <Link href="/pricing" className="mt-1 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400 hover:opacity-80 transition-opacity">
                  Upgrade to Growth →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8 backdrop-blur-md">
          <p className="text-red-400 font-medium flex items-center gap-2">⚠️ {error}</p>
        </div>
      )}

      {/* Step 1: Analyze */}
      {!extractedContent && (
        <div className="bg-[#161B22]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-10 text-center relative group hover:bg-[#161B22]/80 transition-all duration-500">
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold border border-blue-500/20">1</div>
            <h2 className="text-2xl font-bold text-white mb-4">Analyze Video Content</h2>
            <p className="text-slate-400 mb-8">We will extract key points, identify the niche, and prepare content for adaptation.</p>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white py-3 px-8 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300"
            >
              {isAnalyzing ? 'Analyzing...' : '🚀 Start Analysis'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Platforms */}
      {extractedContent && adaptations.length === 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700">
          {/* Analysis Results Brief */}
          <div className="bg-[#161B22]/40 backdrop-blur-lg border border-white/5 rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <span className="block text-xs uppercase text-slate-500 font-bold mb-1">Niche</span>
                <span className="font-semibold text-white capitalize">{extractedContent.niche}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <span className="block text-xs uppercase text-slate-500 font-bold mb-1">Type</span>
                <span className="font-semibold text-white capitalize">{extractedContent.contentType}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <span className="block text-xs uppercase text-slate-500 font-bold mb-1">Tone</span>
                <span className="font-semibold text-white capitalize">{extractedContent.tone}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#161B22]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 sm:p-10 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Select Target Platforms</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {platforms.map(platform => {
                const config = PLATFORM_CONFIG[platform];
                const isSelected = selectedPlatforms.includes(platform);
                return (
                  <div
                    key={platform}
                    onClick={() => {
                      setSelectedPlatforms(prev =>
                        isSelected ? prev.filter(p => p !== platform) : [...prev, platform]
                      );
                    }}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 border backdrop-blur-md
                      ${isSelected
                        ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'border-white/5 bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-3 h-full">
                      {config.iconImage ? (
                        <img
                          src={config.iconImage}
                          alt={config.name}
                          className={`w-8 h-8 object-contain ${isSelected ? 'opacity-100' : 'opacity-75'}`}
                        />
                      ) : (
                        <span className={`text-3xl ${isSelected ? 'text-indigo-400' : 'opacity-70'}`}>{config.icon}</span>
                      )}
                      <span className={`font-bold text-sm ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>{config.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleAdapt}
              disabled={isAdapting || selectedPlatforms.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white py-4 px-6 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
            >
              {isAdapting ? 'Adapting...' : `✨ Generate Magic for ${selectedPlatforms.length} platforms`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results (Unified Glass Container) */}
      {adaptations.length > 0 && (
        <div className="bg-[#161B22]/80 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
          
          {/* Header Banner inside the Glass Card */}
          <div className="m-4 sm:m-6 p-6 rounded-[16px] bg-gradient-to-r from-[#2c1d45] to-[#1c1b3b] border border-purple-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-white">
                  🎉 Your Content is Ready!
                </h2>
                <p className="text-purple-200/70 text-sm">
                  We have generated platform-optimized posts based on your video. Review the hooks, tweak as needed, and copy!
                </p>
                {usage && userTier === 'free' && (
                  <p className="text-xs text-purple-300/50 mt-2">
                    Videos remaining: {usage.videos_limit - usage.videos_used}/{usage.videos_limit} • <Link href="/pricing" className="underline hover:text-purple-300">Upgrade to Growth</Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Platform Tabs inside the Glass Card */}
          <div className="flex px-4 sm:px-8 border-b border-white/10 overflow-x-auto no-scrollbar">
            {adaptations.map((a) => {
              const config = PLATFORM_CONFIG[a.platform];
              const isActive = activeTab === a.platform;
              return (
                <button
                  key={a.platform}
                  onClick={() => setActiveTab(a.platform)}
                  className={`
                    px-6 py-4 font-bold text-sm flex items-center gap-2 transition-all relative whitespace-nowrap
                    ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'}
                  `}
                >
                  {config.iconImage ? (
                    <img src={config.iconImage} alt={config.name} className="w-4 h-4 object-contain opacity-90" />
                  ) : (
                    <span className="text-lg opacity-80">{config.icon}</span>
                  )}
                  {config.name}
                  {/* Glowing Active Indicator underneath the tab */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-400 to-purple-400 shadow-[0_-2px_10px_rgba(168,85,247,0.5)]"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Render Active Tab Content */}
          <div className="p-4 sm:p-8 bg-[#0B0E14]/40">
            {adaptations.map((adaptation) => {
              if (adaptation.platform !== activeTab) return null;
              
              return (
                <div key={adaptation.platform} className="animate-in fade-in duration-500">
                  {/* Note: If PlatformCard currently has hard gray backgrounds, 
                      you may want to update its internal container to use:
                      className="bg-white/5 border border-white/10 rounded-xl"
                  */}
                  <PlatformCard
                    adaptation={adaptation}
                    userTier={userTier}
                    onHookChange={(hook) => handleHookChange(adaptation.platform, hook)}
                    onRequestVariations={() =>
                      handleRequestVariations(
                        adaptation.platform,
                        normalizeHookText(adaptation.selectedHook) || normalizeHookText(adaptation.hooks?.[0])
                      )
                    }
                  />
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}