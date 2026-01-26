"use client";

import { useEffect, useState } from "react";
import type { Video } from "@/app/page";

interface AllEpisodesListProps {
  apiVideos: Video[];
}

export default function AllEpisodesList({ apiVideos }: AllEpisodesListProps) {
  const [allEpisodes, setAllEpisodes] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The YouTube API now fetches ALL videos (not just 50)
    // So we can just use apiVideos directly
    console.log('All videos from YouTube API:', apiVideos.length);
    setAllEpisodes(apiVideos);
    setLoading(false);
  }, [apiVideos]);

  if (loading) {
    return (
      <div className="mt-16 border-t-4 border-white pt-8">
        <p className="text-white text-center">Loading all episodes...</p>
      </div>
    );
  }

  return (
    <div id="all-episodes" className="mt-16 border-t-4 border-white pt-8">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">All Episodes ({allEpisodes.length})</h2>
      
      {/* Search bar */}
      <div className="mb-6">
        <input
          id="bottom-search"
          type="text"
          placeholder="Search episodes by question or date..."
          onInput={(e) => {
            const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
            const listItems = document.querySelectorAll('.episode-item');
            listItems.forEach((item) => {
              const text = item.textContent?.toLowerCase() || '';
              const parent = item.parentElement;
              if (parent) {
                if (text.includes(searchTerm)) {
                  parent.style.display = '';
                } else {
                  parent.style.display = 'none';
                }
              }
            });
          }}
          className="w-full px-4 py-3 bg-black text-white border-2 border-white focus:border-vintage-yellow outline-none font-bold"
        />
      </div>

      {/* List of all videos */}
      <div className="space-y-2">
        {allEpisodes.map((video) => (
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

