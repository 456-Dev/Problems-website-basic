"use client";

import { useState } from "react";
import VideoCard from "./VideoCard";
import VideoModal from "./VideoModal";
import type { Video } from "@/app/page";

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Listen for video selection from list
  if (typeof window !== 'undefined') {
    window.addEventListener('openVideo', ((e: CustomEvent) => {
      setSelectedVideo(e.detail);
    }) as EventListener);
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {videos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={video}
            index={index}
            onClick={() => setSelectedVideo(video)}
          />
        ))}
        
        {/* CTA Tile at the end - matches thumbnail aspect ratio */}
        <a
          href="https://youtube.com/@bignosemichael"
          target="_blank"
          rel="noopener noreferrer"
          className="relative bg-vintage-yellow border-4 border-white hover:bg-white transition-colors flex items-center justify-center p-4 group cursor-pointer"
          style={{ aspectRatio: '9/16' }}
        >
          <div className="text-center">
            <p className="text-black font-bold text-base mb-1">To watch</p>
            <p className="text-black font-bold text-base mb-1">more episodes,</p>
            <p className="text-black font-bold text-base mb-2">visit</p>
            <p className="text-black font-bold text-xl mb-1">@bignosemichael</p>
            <p className="text-black font-bold text-base">on YouTube</p>
          </div>
        </a>
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}

