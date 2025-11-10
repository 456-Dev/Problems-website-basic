"use client";

import { useEffect, useState } from "react";
import VideoGrid from "@/components/VideoGrid";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import AllEpisodesList from "@/components/AllEpisodesList";

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      // Fetch directly from YouTube API (client-side)
      const { fetchLatestShorts } = await import("@/lib/youtube");
      const videos = await fetchLatestShorts();
      
      setVideos(videos);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-4">
        {/* Intro Text with Search */}
        <div className="text-center mb-6">
          <p className="text-white text-lg md:text-xl mb-1">
            <strong>Did I interview you today?</strong>
          </p>
          <p className="text-white text-lg md:text-xl mb-4">
            Episodes are published within 24 hours
          </p>
          
          {/* Search previous episodes */}
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search previous episodes by question or date..."
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                
                // Scroll down when user starts typing
                if (searchTerm.length > 0) {
                  const searchSection = document.getElementById('all-episodes');
                  searchSection?.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Sync the search to bottom list
                const bottomSearch = document.getElementById('bottom-search') as HTMLInputElement;
                if (bottomSearch) {
                  bottomSearch.value = searchTerm;
                  bottomSearch.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
              className="w-full px-4 py-3 bg-black text-white border-2 border-white focus:border-vintage-yellow outline-none font-bold text-center"
            />
          </div>
        </div>

        {/* Videos Section */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12 border-2 border-vintage-red bg-black p-6">
            <div className="text-vintage-red text-lg mb-3">Error: {error}</div>
            <button
              onClick={fetchVideos}
              className="px-4 py-2 bg-vintage-yellow text-black font-bold border-2 border-white hover:bg-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 border-2 border-white bg-black p-6">
            <p className="text-2xl mb-2">📹</p>
            <p className="text-lg text-white">No videos yet</p>
          </div>
        ) : (
          <>
            <VideoGrid videos={videos} />
            
            {/* Full searchable list - includes data.json episodes */}
            <AllEpisodesList apiVideos={videos} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-white border-t-2 border-white mt-12 bg-black">
        <p className="text-sm">© 2025 Question The Day</p>
      </footer>
    </main>
  );
}

