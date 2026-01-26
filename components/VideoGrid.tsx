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
  const [visibleCount, setVisibleCount] = useState(25);
  const [isAnimating, setIsAnimating] = useState(false);

  // Listen for video selection from list
  if (typeof window !== 'undefined') {
    window.addEventListener('openVideo', ((e: CustomEvent) => {
      setSelectedVideo(e.detail);
    }) as EventListener);
  }

  const visibleVideos = videos.slice(0, visibleCount);
  const hasMore = visibleCount < videos.length;
  const remainingCount = videos.length - visibleCount;

  const loadMore = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 25, videos.length));
      setIsAnimating(false);
    }, 300);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {visibleVideos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={video}
            index={index}
            onClick={() => setSelectedVideo(video)}
          />
        ))}
        
        {/* Show More Button as a Card */}
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isAnimating}
            className="relative bg-vintage-green border-4 border-white hover:bg-vintage-yellow transition-all flex flex-col items-center justify-center p-4 group cursor-pointer disabled:opacity-50"
            style={{ aspectRatio: '9/16' }}
          >
            <div className="text-center">
              <p className="text-black font-bold text-4xl mb-2">▼</p>
              <p className="text-black font-bold text-base mb-1">LOAD</p>
              <p className="text-black font-bold text-base mb-1">MORE</p>
              <p className="text-black font-bold text-xl mb-2 mt-2">+25</p>
              <p className="text-black font-bold text-sm">
                ({remainingCount} remaining)
              </p>
            </div>
          </button>
        )}
        
        {/* CTA Tile at the very end */}
        {!hasMore && (
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
        )}
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

