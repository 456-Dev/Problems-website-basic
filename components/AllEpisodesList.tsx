"use client";

import { useEffect, useState } from "react";
import type { Video } from "@/app/page";

interface AllEpisodesListProps {
  apiVideos: Video[];
}

export default function AllEpisodesList({ apiVideos }: AllEpisodesListProps) {
  const [randomEpisodes, setRandomEpisodes] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (apiVideos.length > 0) {
      randomizeEpisodes();
      setLoading(false);
    }
  }, [apiVideos]);

  const randomizeEpisodes = () => {
    // Get 5 random episodes from the array
    const shuffled = [...apiVideos].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    setRandomEpisodes(selected);
  };

  if (loading || apiVideos.length === 0) {
    return null;
  }

  return (
    <div id="random-episodes" className="mt-16 border-t-4 border-white pt-8">
      <div className="flex items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white text-center">5 Random Episodes</h2>
        <button
          onClick={randomizeEpisodes}
          className="px-4 py-2 bg-vintage-yellow text-black font-bold border-2 border-white hover:bg-white transition-colors"
        >
          🎲 Randomize
        </button>
      </div>

      {/* List of random videos */}
      <div className="space-y-2">
        {randomEpisodes.map((video) => (
          <div key={video.id} className="border-2 border-white hover:border-vintage-yellow transition-colors">
            <button
              onClick={() => {
                const event = new CustomEvent('openVideo', { detail: video });
                window.dispatchEvent(event);
              }}
              className="episode-item w-full text-left px-4 py-3 bg-black hover:bg-vintage-yellow hover:text-black transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white hover:text-black flex-1">
                  {video.title}
                </span>
                <span className="text-sm text-gray-400 hover:text-black ml-4">
                  {new Date(video.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

