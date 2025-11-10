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
    // Load data.json episodes
    fetch('/data.json')
      .then(res => res.json())
      .then(data => {
        const localEpisodes = data.lines.map((line: any) => {
          const videoIdMatch = line.videoId.match(/shorts\/([^?]+)/);
          const videoId = videoIdMatch ? videoIdMatch[1] : '';
          
          return {
            id: videoId,
            title: line.name,
            description: line.video_type || '',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            publishedAt: '2024-10-31T00:00:00Z',
            url: line.videoId,
          };
        });

        console.log('Local episodes from data.json:', localEpisodes.length);
        console.log('API videos:', apiVideos.length);

        // Combine local episodes with API videos (API videos first for newer episodes)
        // Remove duplicates by video ID
        const apiVideoIds = new Set(apiVideos.map(v => v.id));
        const uniqueLocalEpisodes = localEpisodes.filter((ep: Video) => !apiVideoIds.has(ep.id));
        
        const combined = [...apiVideos, ...uniqueLocalEpisodes];
        console.log('Total combined episodes:', combined.length);
        
        setAllEpisodes(combined);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading data.json:', error);
        setAllEpisodes(apiVideos);
        setLoading(false);
      });
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

