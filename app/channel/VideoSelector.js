"use client";

import { useState } from "react";

export default function VideoSelector({ videos }) {
  const [selectedVideo, setSelectedVideo] = useState(null);

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold">
        Select a video to analyze
      </h2>

      <div className="space-y-3 mt-3">
        {videos.map((item) => {
          const vid = item.snippet.resourceId.videoId;

          return (
            <div
              key={vid}
              onClick={() => setSelectedVideo(vid)}
              className={`p-3 border rounded cursor-pointer flex gap-3 items-center
                ${selectedVideo === vid ? "bg-blue-100 border-blue-500" : ""}`}
            >
              <img
                src={item.snippet.thumbnails.default.url}
                className="w-20 h-14 rounded"
              />

              <p className="text-sm">{item.snippet.title}</p>
            </div>
          );
        })}
      </div>

      <button
        disabled={!selectedVideo}
        onClick={() => {
          window.location.href = `/analyse/${selectedVideo}`;
        }}
        className={`mt-6 px-4 py-2 rounded text-white cursor-pointer
          ${selectedVideo ? "bg-blue-600" : "bg-gray-400"}`}
      >
        Analyze
      </button>
    </div>
  );
}