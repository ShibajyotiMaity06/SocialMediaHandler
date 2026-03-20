// components/VideoSelector.jsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoSelector({ videos }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const router = useRouter();

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

  const selectedVideoTitle = videos.find((video) => getVideoId(video) === selectedVideo)?.snippet?.title;

  const handleAnalyze = () => {
    if (selectedVideo) {
      router.push(`/adapt/${selectedVideo}`);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Videos</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Select a video to AI-analyze and repurpose</p>
        </div>
        
        {selectedVideo && (
          <button
            onClick={handleAnalyze}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2"
          >
            <span>✨ AI Adapt</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => {
          const videoId = getVideoId(video);
          const isSelected = selectedVideo === videoId;
          const thumbnailUrl = getThumbnail(video);
          const isDisabled = !videoId;

          return (
            <div
              key={`${videoId || 'invalid'}-${video?.snippet?.publishedAt || video?.snippet?.title}`}
              onClick={() => {
                if (!isDisabled) {
                  setSelectedVideo(videoId);
                }
              }}
              role="button"
              aria-pressed={isSelected}
              tabIndex={isDisabled ? -1 : 0}
              onKeyDown={(event) => {
                if (!isDisabled && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  setSelectedVideo(videoId);
                }
              }}
              className={`
                group relative flex flex-col bg-white dark:bg-slate-800/50 backdrop-blur-sm
                rounded-2xl overflow-hidden transition-all duration-300 border-2
                ${isSelected 
                  ? 'border-blue-500 shadow-xl shadow-blue-500/20 translate-y-[-4px]' 
                  : 'border-transparent shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-slate-700 hover:translate-y-[-2px]'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 z-20 bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transform scale-in">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}

              <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-slate-700">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={video?.snippet?.title || 'Video thumbnail'}
                    className={`w-full h-full object-cover transition-transform duration-500 ${!isDisabled && !isSelected && 'group-hover:scale-105'} ${isSelected && 'scale-105 filter brightness-110'}`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m18-5l-4.5-4.5M21 10v9m0-9H3m18 0l-4.5 4.5" /></svg>
                  </div>
                )}
                <div className={`absolute inset-0 bg-blue-600/20 mix-blend-overlay transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className={`font-bold line-clamp-2 leading-snug mb-2 ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {video?.snippet?.title || 'Untitled video'}
                </h3>
                
                <div className="mt-auto flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {video?.snippet?.publishedAt ? new Date(video.snippet.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                  </span>
                  
                  {isSelected && (
                    <span className="text-blue-600 dark:text-blue-400 font-bold">Selected</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}