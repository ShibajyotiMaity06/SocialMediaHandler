// components/AdaptationDashboard.jsx

'use client';

import { useState } from 'react';
import PlatformCard from './PlatformCard';
import { PLATFORM_CONFIG } from '@/app/api/lib/constants';

export default function AdaptationDashboard({ videoId, videoTitle }) {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [extractedContent, setExtractedContent] = useState(null);
  const [adaptations, setAdaptations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [error, setError] = useState(null);

  const platforms = ['twitter', 'linkedin', 'tiktok', 'instagram', 'youtube_shorts'];

  // Step 1: Analyze
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
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
          videoId, // For caching
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Adaptation failed');
      }

      setAdaptations(result.data);
      
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
        setAdaptations(prev => prev.map(a => 
          a.platform === platform 
            ? { ...a, hooks: [...a.hooks, ...result.data.map(v => v.hook)] }
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
    setAdaptations(prev => prev.map(a =>
      a.platform === platform ? { ...a, selectedHook: hook } : a
    ));
  };

  return (
    <div className="flex-grow w-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800/50 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white flex items-center gap-3">
          <span className="text-indigo-500">✨</span> Content Adaptation Studio
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Video: <span className="text-gray-900 dark:text-gray-200">{videoTitle}</span></p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-2xl p-6 mb-8 shadow-sm">
          <p className="text-red-800 dark:text-red-400 font-medium flex items-center gap-2">⚠️ {error}</p>
        </div>
      )}

      {/* Step 1: Analyze */}
      {!extractedContent && (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800/50 rounded-3xl p-10 text-center relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner text-2xl font-bold">1</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Step 1: Analyze Video Content
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              We'll extract key points, identify the niche, and prepare content for adaptation using advanced AI.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-10 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing...
                </span>
              ) : '🚀 Start Analysis'}
            </button>
            {isAnalyzing && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 animate-pulse">This usually takes 10-15 seconds...</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Platforms */}
      {extractedContent && adaptations.length === 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
          <div className="bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-lg border border-emerald-200 dark:border-emerald-800/50 rounded-3xl p-6 sm:p-8">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Analysis Complete
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm">
                <span className="block text-xs uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 font-bold mb-1">Niche</span> 
                <span className="font-semibold text-gray-900 dark:text-white capitalize">{extractedContent.niche}</span>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm">
                <span className="block text-xs uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 font-bold mb-1">Type</span> 
                <span className="font-semibold text-gray-900 dark:text-white capitalize">{extractedContent.contentType}</span>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-4 shadow-sm">
                <span className="block text-xs uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 font-bold mb-1">Tone</span> 
                <span className="font-semibold text-gray-900 dark:text-white capitalize">{extractedContent.tone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800/50 rounded-3xl p-8 sm:p-10 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-inner text-xl font-bold">2</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Target Platforms</h2>
                <p className="text-gray-500 dark:text-gray-400">Choose where you want to repurpose this content</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
              {platforms.map(platform => {
                const config = PLATFORM_CONFIG[platform];
                const isSelected = selectedPlatforms.includes(platform);

                 return (
                  <div
                    key={platform}
                    onClick={() => {
                      setSelectedPlatforms(prev =>
                        isSelected
                          ? prev.filter(p => p !== platform)
                          : [...prev, platform]
                      );
                    }}
                    className={`
                      cursor-pointer rounded-2xl p-4 sm:p-6 transition-all duration-300 border-2 relative overflow-hidden group
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-md shadow-indigo-500/10 translate-y-[-2px]'
                        : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white/50 dark:bg-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/80 hover:shadow-sm'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 text-indigo-500 drop-shadow-sm scale-in">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                    <div className="flex flex-col items-center justify-center gap-3 h-full">
                      <span className={`text-3xl sm:text-4xl transition-transform duration-300 ${isSelected ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>{config.icon}</span>
                      <span className={`font-bold text-center text-sm sm:text-base ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}>{config.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAdapt}
              disabled={isAdapting || selectedPlatforms.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 transform hover:-translate-y-1 disabled:hover:translate-y-0 disabled:shadow-none text-lg flex items-center justify-center gap-2"
            >
              {isAdapting ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Adapting for {selectedPlatforms.length} platforms...
                </>
              ) : (
                `✨ Generate Magic for ${selectedPlatforms.length || '?'} ${selectedPlatforms.length === 1 ? 'platform' : 'platforms'}`
              )}
            </button>

            {isAdapting && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 animate-pulse font-medium">
                This takes 30-60 seconds. Crafting platform-specific viral hooks and formatting...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {adaptations.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-3xl font-extrabold mb-3 flex items-center gap-3">
              🎉 Your Content is Ready!
            </h2>
            <p className="text-indigo-100 text-lg max-w-2xl font-medium">
              We've generated platform-optimized posts based on your video. Review the hooks, tweak as needed, and copy!
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {adaptations.map(adaptation => (
              <div key={adaptation.platform} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <PlatformCard
                  adaptation={adaptation}
                  onHookChange={(hook) => handleHookChange(adaptation.platform, hook)}
                  onRequestVariations={() => 
                    handleRequestVariations(adaptation.platform, adaptation.selectedHook || adaptation.hooks[0])
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}