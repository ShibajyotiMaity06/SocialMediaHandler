// app/adapt/[videoId]/page.js

import { getVideoData } from '@/app/api/lib/yt';
import AdaptationDashboard from '@/components/AdaptationDashboard';

export default async function AdaptPage({ params }) {
  const { videoId } = await params;
  const apiKey = process.env.YOUTUBE_API_KEY;

  let videoData = null;

  try {
    videoData = await getVideoData(videoId, apiKey);
  } catch (error) {
    console.error(error);
  }

  if (!videoData) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl max-w-lg border border-red-200 dark:border-red-800 text-center shadow-sm">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">⚠️ Video not found</h1>
          <p>The requested video could not be fetched or does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col pt-4">
      <AdaptationDashboard 
        videoId={videoId}
        videoTitle={videoData.title}
      />
    </div>
  );
}