import { getChannelData } from "@/app/api/lib/yt";
import VideoSelector from "@/components/VideoSelector";
import Image from "next/image";

export default async function ChannelQueryPage({ searchParams }) {
  const { url } = await searchParams;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!url) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl max-w-lg border border-red-200 dark:border-red-800 text-center">
          <h2 className="font-bold text-xl mb-2">Invalid Request</h2>
          <p>Please provide a valid YouTube URL. Try: /channel?url=https://www.youtube.com/@MrBeast</p>
          <a href="/main" className="mt-4 inline-block px-4 py-2 bg-red-100 dark:bg-red-800/40 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors">Go Back</a>
        </div>
      </div>
    );
  }

  let channelData = null;
  let latestVideos = [];

  try {
    channelData = await getChannelData(url, apiKey);

    const videosUrl = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${channelData.uploadsPlaylist}&maxResults=12&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();
    latestVideos = videosData.items || [];
  } catch (error) {
    console.error(error);
  }

  if (!channelData) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-6 rounded-2xl max-w-lg border border-orange-200 dark:border-orange-800 text-center">
          <h2 className="font-bold text-xl mb-2">Channel Not Found</h2>
          <p>We couldn't find a channel for the URL provided.</p>
          <a href="/main" className="mt-4 inline-block px-4 py-2 bg-orange-100 dark:bg-orange-800/40 rounded-lg font-medium hover:bg-orange-200 dark:hover:bg-orange-800/60 transition-colors">Try Again</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Channel Header Card */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-slate-800/50 rounded-3xl p-6 sm:p-10 mb-10 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 pointer-events-none"></div>
        
        {/* Profile Image (Placeholder since API doesn't return avatar, but we'll use a neat gradient circle) */}
        <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 flex-shrink-0 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-lg border-4 border-white dark:border-slate-800">
          {channelData.title.charAt(0).toUpperCase()}
        </div>

        <div className="relative z-10 flex-grow text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2 mb-6">
            {channelData.title}
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr">
            {/* Metric Card 1 */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Subscribers</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {channelData.subscriberCount ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(channelData.subscriberCount) : "Hidden"}
              </span>
            </div>
            
            {/* Metric Card 2 */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Views</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(channelData.viewCount)}
              </span>
            </div>

            {/* Metric Card 3 */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col items-center justify-center col-span-2 md:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Videos</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat().format(channelData.videoCount || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid Section */}
      <VideoSelector videos={latestVideos} />
    </div>
  );
}
