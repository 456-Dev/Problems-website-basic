"use client";

import { useEffect, useState } from "react";
import VideoCard from "./VideoCard";
import VideoModal from "./VideoModal";
import type { Video } from "@/app/page";

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Open a video from the "random episodes" list (dispatched as a CustomEvent)
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as Video;
      const idx = videos.findIndex((v) => v.id === detail.id);
      if (idx !== -1) setSelectedIndex(idx);
    };
    window.addEventListener("openVideo", handleOpen);
    return () => window.removeEventListener("openVideo", handleOpen);
  }, [videos]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {videos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={video}
            index={index}
            onClick={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      {selectedIndex !== null && videos[selectedIndex] && (
        <VideoModal
          videos={videos}
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={(newIndex) => setSelectedIndex(newIndex)}
        />
      )}
    </>
  );
}
