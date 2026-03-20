// components/PlatformCard.jsx

'use client';

import { useState } from 'react';
import { PLATFORM_CONFIG } from '@/app/api/lib/constants';
import PPSBadge from './PPSBadge';

export default function PlatformCard({ 
  adaptation, 
  onHookChange,
  onRequestVariations 
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const config = PLATFORM_CONFIG[adaptation.platform];

  if (adaptation.error) {
    return (
      <div className="border border-red-200 dark:border-red-800/50 rounded-3xl p-6 sm:p-8 bg-red-50/50 dark:bg-red-900/10 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl drop-shadow-sm">{config.icon}</span>
          <h3 className="font-bold text-xl text-red-900 dark:text-red-400">{config.name}</h3>
        </div>
        <p className="text-red-700 dark:text-red-300 font-medium">{adaptation.error}</p>
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

  return (
    <div className="h-full flex flex-col p-6 sm:p-8 relative">
      <div className={`absolute top-0 left-0 w-full h-2 ${config.color.replace('text-', 'bg-').replace('100', '500')} opacity-80`}></div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-white/50 dark:border-slate-700/50 ${config.color.replace('text-', 'bg-').replace('800', '100').replace('200','800')} dark:bg-slate-800`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">{config.name}</h3>
            {adaptation.pps && <div className="mt-1"><PPSBadge pps={adaptation.pps} /></div>}
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-xl transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} Intel
        </button>
      </div>

      <div className="flex-grow flex flex-col">
        {/* Hook Selector */}
        <div className="mb-6">
          <label className="flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            <span>Select Hook</span>
            <span className="bg-gray-100 dark:bg-slate-800 text-gray-500 text-xs px-2 py-1 rounded-md">{adaptation.hooks.length} options</span>
          </label>
          <div className="space-y-3">
            {adaptation.hooks.map((hook, idx) => (
              <div
                key={idx}
                onClick={() => onHookChange(hook)}
                className={`
                  p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 relative overflow-hidden group
                  ${adaptation.selectedHook === hook
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white/50 dark:bg-slate-800/50'
                  }
                `}
              >
                {adaptation.selectedHook === hook && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                )}
                <p className={`font-medium text-sm sm:text-base leading-snug ${adaptation.selectedHook === hook ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                  {hook}
                </p>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleRequestVariations}
            disabled={isLoadingVariations}
            className="mt-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 disabled:text-gray-400 flex items-center gap-1 transition-colors group"
          >
            {isLoadingVariations ? (
              <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</>
            ) : (
              <><span className="text-lg group-hover:scale-125 transition-transform">+</span> Generate more hooks</>
            )}
          </button>
        </div>

        {/* Main Post Preview */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-5 mb-auto border border-gray-100 dark:border-slate-700 shadow-inner">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Post Preview</p>
          <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-800 dark:text-gray-100 font-medium">
            <strong className="text-indigo-600 dark:text-indigo-400 text-lg block mb-4">{adaptation.selectedHook}</strong>
            {adaptation.mainPost}
          </div>
          
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {adaptation.hashtags.map((tag, idx) => (
                <span key={idx} className="bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        {showDetails && adaptation.pps && (
          <div className="border-t border-gray-200 dark:border-slate-700 py-6 mt-6 space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30">
              <p className="font-bold text-sm text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <span>💡</span> AI Improvement Suggestion
              </p>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 leading-relaxed">{adaptation.pps.improvement}</p>
            </div>

            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Why this score:</p>
              <ul className="space-y-2">
                {adaptation.pps.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    <span className="text-indigo-500 mt-0.5">•</span> {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                <p className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Visual Suggestion</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{adaptation.visualSuggestion}</p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                <p className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Call to Action</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{adaptation.cta}</p>
              </div>
            </div>
          </div>
        )}

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`
            w-full mt-6 py-4 px-6 rounded-2xl font-bold shadow-lg transition-all duration-300 transform flex items-center justify-center gap-2
            ${copied 
              ? 'bg-emerald-500 text-white shadow-emerald-500/30 -translate-y-1' 
              : 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-gray-900 hover:shadow-xl hover:-translate-y-1'
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Copy For {config.name}
            </>
          )}
        </button>
      </div>
    </div>
  );
}