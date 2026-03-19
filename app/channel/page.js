import { getChannelData } from "@/app/api/lib/yt";
import VideoSelector from "./VideoSelector";
import { League_Gothic } from "next/font/google";

export default async function ChannelQueryPage({ searchParams }) {
  const { url } = await searchParams;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!url) {
    return (
      <div>
        Try: /channel?url=https://www.youtube.com/@MrBeast
      </div>
    );
  }

  let channelData = null;
  let latestVideos = [];

  try {
    channelData = await getChannelData(url, apiKey);

    const videosUrl = `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${channelData.uploadsPlaylist}&maxResults=10&key=${apiKey}`;
    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();
    latestVideos = videosData.items || [];
  } catch (error) {
    console.error(error);
  }

  if (!channelData) {
    return <div>Channel not found or invalid URL</div>;
  }

  return (
    <div className="m-5 max-wl-3xl mx-auto">
        <h1 className="text-2xl font-bold text-blue">{channelData.title}</h1>

        <p>
            Subscribers : {""}
            {channelData.subscriberCount?new Intl.NumberFormat().format(channelData.subscriberCount) : "Hidden"}

        </p>

        <p>
            Views:{new Intl.NumberFormat().format(channelData.viewCount)}
        </p>
        <VideoSelector videos={latestVideos} />
    </div>
  );
}
