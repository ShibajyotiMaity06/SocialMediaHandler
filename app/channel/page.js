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
      <div className="bg-gradient-to-r from-indigo-950/60 via-[#271556]/60 to-slate-950/60 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 md:p-8 mb-8 shadow-[0_0_30px_rgba(99,102,241,0.1)] flex flex-col md:flex-row items-center gap-6 md:gap-8">
        
        {/* Profile Image */}
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#a855f7] flex flex-shrink-0 items-center justify-center text-white text-5xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          {channelData.title.charAt(0).toUpperCase()}
        </div>

        <div className="flex-grow flex flex-col justify-center text-center md:text-left w-full">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            {channelData.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {/* Metric Card 1 */}
            <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 mb-1">Subscribers</span>
              <span className="text-xl sm:text-2xl font-bold text-white">
                {channelData.subscriberCount ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(channelData.subscriberCount) : "Hidden"}
              </span>
            </div>
            
            {/* Metric Card 2 */}
            <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 mb-1">Total Views</span>
              <span className="text-xl sm:text-2xl font-bold text-white">
                {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(channelData.viewCount)}
              </span>
            </div>

            {/* Metric Card 3 */}
            <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center shadow-lg">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 mb-1">Videos</span>
              <span className="text-xl sm:text-2xl font-bold text-white">
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
