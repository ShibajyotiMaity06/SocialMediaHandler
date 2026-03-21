// components/PlatformCard.jsx

'use client';

import { useState } from 'react';
import { PLATFORM_CONFIG } from '@/app/api/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CircularProgress = ({ score, category }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const colors = {
    Strong: "text-emerald-500",
    Moderate: "text-amber-500",
    Weak: "text-red-500"
  }[category] || "text-indigo-500";

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-200 dark:text-white/10" />
          <circle 
            cx="24" cy="24" r="20" 
            stroke="currentColor" 
            strokeWidth="3" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            className={`transition-all duration-1000 ease-out ${colors}`} 
            strokeLinecap="round" 
          />
        </svg>
        <span className={`absolute text-sm font-bold ${colors} drop-shadow-sm`}>{score}</span>
      </div>
      <div className="flex flex-col">
        <span className={`font-bold text-base leading-tight ${colors}`}>{category}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">PPS Score</span>
      </div>
    </div>
  );
};

export default function PlatformCard({
  adaptation,
  userTier = 'free',
  onHookChange,
  onRequestVariations
}) {
  const router = useRouter();
  const [showIntel, setShowIntel] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [imageCreditsMeta, setImageCreditsMeta] = useState(null);
  const [imageError, setImageError] = useState('');

  const config = PLATFORM_CONFIG[adaptation.platform];
  const isFree = userTier === 'free';

  if (adaptation.error) {
    return (
      <div className="bg-red-50/5 dark:bg-red-900/10 backdrop-blur-xl border border-red-500/20 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-3 text-red-400">
          <span className="text-3xl">{config.icon}</span>
          <h3 className="font-bold text-xl">{config.name}</h3>
        </div>
        <p className="text-red-300 font-medium leading-relaxed">{adaptation.error}</p>
      </div>
    );
  }

  const handleRequestVariations = async () => {
    setIsLoadingVariations(true);
    await onRequestVariations();
    setIsLoadingVariations(false);
  };

  const handleCopy = () => {
    const fullPost = `${adaptation.selectedHook}\n\n${adaptation.mainPost}\n\n${adaptation.hashtags.map(t => `#${t}`).join(' ')}`;
    navigator.clipboard.writeText(fullPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openImageModal = () => {
    const defaultPrompt = `${adaptation.selectedHook}\n\n${adaptation.mainPost}`.trim();
    setImagePrompt(defaultPrompt);
    setGeneratedImageUrl('');
    setImageCreditsMeta(null);
    setImageError('');
    setShowImageModal(true);
  };

  const handleGenerateImage = async () => {
    const finalPrompt = imagePrompt.trim();
    if (!finalPrompt) {
      setImageError('Please add prompt text or post text first.');
      return;
    }

    try {
      setIsGeneratingImage(true);
      setImageError('');

      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          postText: `${adaptation.selectedHook}\n\n${adaptation.mainPost}`,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Image generation failed');
      }

      setGeneratedImageUrl(result.image_data_url);
      setImageCreditsMeta({
        used: result.images_used,
        limit: result.images_limit,
        remaining: result.images_remaining,
      });
    } catch (error) {
      setImageError(error.message || 'Failed to generate image.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSchedule = () => {
    const title = adaptation.selectedHook?.slice(0, 80) || `New ${config.name} post`;
    const content = `${adaptation.selectedHook}\n\n${adaptation.mainPost}`;
    const params = new URLSearchParams({
      title,
      platform: adaptation.platform,
      content,
    });
    router.push(`/scheduled?${params.toString()}`);
  };

  const isLongPost = adaptation.mainPost.length > 300;
  const displayPost = isExpanded || !isLongPost 
    ? adaptation.mainPost 
    : `${adaptation.mainPost.substring(0, 300)}...`;

  return (
    <div className="bg-white/5 dark:bg-[#111116]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 lg:p-8 flex flex-col relative overflow-hidden shadow-2xl">
      {/* Subtle Glow Background based on Platform Color */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-32 ${config.color.replace('text-', 'bg-').replace('100', '500').replace('800', '500')} opacity-[0.03] blur-3xl pointer-events-none`}></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="flex items-center gap-6">
          {adaptation.pps && <CircularProgress score={adaptation.pps.score} category={adaptation.pps.category} />}
        </div>
        
        <button
          onClick={() => setShowIntel(!showIntel)}
          className="text-indigo-400 font-bold text-sm bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-2.5 rounded-xl transition-colors border border-indigo-500/20"
        >
          {showIntel ? 'Hide' : 'View'} Performance Intel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* Left Column: Hooks & Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Hook Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
              <span>Select Hook</span>
              <span className="bg-white/5 py-1 px-3 rounded-md">{adaptation.hooks.length} options</span>
            </div>
            <div className="space-y-3">
              {adaptation.hooks.map((hook, idx) => {
                const isSelected = adaptation.selectedHook === hook;
                return (
                  <div
                    key={idx}
                    onClick={() => onHookChange(hook)}
                    className={`
                      cursor-pointer rounded-2xl p-4 transition-all duration-300 border relative overflow-hidden group
                      ${isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/40 shadow-sm'
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                      }
                    `}
                  >
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                    <p className={`font-semibold text-[15px] leading-relaxed ${isSelected ? 'text-indigo-100' : 'text-slate-300 group-hover:text-white'}`}>
                      {hook}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRequestVariations}
              disabled={isLoadingVariations}
              className="mt-4 text-sm font-bold text-indigo-400 hover:text-indigo-300 disabled:text-slate-500 flex items-center gap-1.5 transition-colors group px-2"
            >
              {isLoadingVariations ? (
                <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</>
              ) : (
                <><span className="text-xl leading-none group-hover:scale-125 transition-transform">+</span> Generate more hooks</>
              )}
            </button>
          </div>

          {/* Main Post Preview */}
          <div className="bg-white/5 rounded-3xl p-6 mb-8 flex-grow flex flex-col relative group">
            <span className="absolute top-0 right-0 p-6 text-slate-600 opacity-20 group-hover:opacity-40 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14 6H2V22H18V10H14V6ZM14 4L20 10H14V4ZM20 22C21.1 22 22 21.1 22 20V8L14 0H2C0.9 0 0 0.9 0 2V22C0 23.1 0.9 24 2 24H20C21.1 24 22 23.1 22 22Z"/></svg>
            </span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Post Preview</p>
            
            <div className="text-[15px] leading-[1.8] text-white/80 font-medium whitespace-pre-wrap relative z-10 flex-grow">
              <span className="text-indigo-300 font-bold block mb-4 text-lg leading-snug">{adaptation.selectedHook}</span>
              {displayPost}
              
              {isLongPost && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="block mt-4 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {isExpanded ? 'Show Less ∧' : 'Read More ∨'}
                </button>
              )}
            </div>

            {/* Hashtags */}
            <div className="mt-8 flex flex-wrap gap-2.5 relative z-10">
              {adaptation.hashtags.map((tag, idx) => (
                <span key={idx} className="bg-white/10 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/5">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Intel (if shown) & Actions */}
        <div className={`flex flex-col flex-none w-full lg:w-72 xl:w-80 gap-6 transition-all duration-500 ${showIntel ? 'opacity-100 translate-x-0' : 'hidden lg:flex lg:opacity-100 lg:translate-x-0'}`}>
          {/* Full Intel Panel (when mobile visible or desktop) */}
          {showIntel && adaptation.pps && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/20">
                <p className="font-bold text-xs uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
                  <span>💡</span> AI Suggestion
                </p>
                <p className="text-sm font-medium text-emerald-200/90 leading-relaxed">{adaptation.pps.improvement}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Why this score:</p>
                <ul className="space-y-3">
                  {adaptation.pps.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start text-sm text-slate-300 font-medium leading-relaxed">
                      <span className="text-indigo-500 mr-2 mt-0.5 opacity-70">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Visual Strategy</p>
                <p className="text-sm text-slate-300 font-medium leading-relaxed mb-5">{adaptation.visualSuggestion}</p>
                
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Call to Action</p>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{adaptation.cta}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto space-y-3 pt-6 lg:pt-0">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`
                w-full py-4 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-3
                ${copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-white text-[#070709] hover:bg-slate-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 border border-transparent'
                }
              `}
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  Copy Post text
                </>
              )}
            </button>

            {/* Premium action grid */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {isFree ? (
                <Link href="/pricing" className="py-3.5 px-4 rounded-xl border border-white/5 bg-white/5 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/10 transition-colors group">
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">🖼️</span> Image
                  <span className="ml-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/20">🔒 Upgrade</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={openImageModal}
                  className="py-3.5 px-4 rounded-xl border border-white/5 bg-white/5 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/10 transition-colors group"
                >
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">🖼️</span> Generate Image
                </button>
              )}
              
              {isFree ? (
                <Link href="/pricing" className="py-3.5 px-4 rounded-xl border border-white/5 bg-white/5 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/10 transition-colors group">
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">📅</span> Schedule
                  <span className="ml-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/20">🔒 Upgrade</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleSchedule}
                  className="py-3.5 px-4 rounded-xl border border-white/5 bg-white/5 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/10 transition-colors group"
                >
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">📅</span> Schedule
                </button>
              )}

              <Link href={isFree ? "/pricing" : "#"} className="col-span-2 lg:col-span-1 py-3.5 px-4 rounded-xl border border-white/5 bg-white/5 text-slate-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 hover:border-white/10 transition-colors group">
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">🚀</span> Auto-post
                {isFree && <span className="ml-1 text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/20">🔒 Upgrade</span>}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#12141a] p-5">
            <h4 className="text-lg font-bold text-white mb-1">Generate AI Image</h4>
            <p className="text-xs text-slate-400 mb-4">
              Enter prompt text or use your post text as the image prompt. Each generation consumes 1 image credit.
            </p>

            <div className="space-y-3">
              <textarea
                rows={5}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image to generate"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 resize-none"
              />

              {imageError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {imageError}
                </div>
              )}

              {imageCreditsMeta && (
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                  Images used: {imageCreditsMeta.used}/{imageCreditsMeta.limit} • Remaining: {imageCreditsMeta.remaining}
                </div>
              )}

              {generatedImageUrl && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                  <img
                    src={generatedImageUrl}
                    alt="Generated visual"
                    className="w-full max-h-[420px] object-contain rounded-lg bg-black/20"
                  />
                  <a
                    href={generatedImageUrl}
                    download={`currents-${adaptation.platform}-image.png`}
                    className="inline-flex px-4 py-2 rounded-lg bg-white text-[#070709] text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Download Image
                  </a>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  disabled={isGeneratingImage}
                  className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-slate-300 text-sm hover:bg-white/10 disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-[#061220] font-bold text-sm hover:brightness-110 disabled:opacity-50"
                >
                  {isGeneratingImage ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}