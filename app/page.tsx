"use client";

import { useEffect, useState } from "react";
import VideoGrid from "@/components/VideoGrid";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import AllEpisodesList from "@/components/AllEpisodesList";
import ViewCounter from "@/components/ViewCounter";
import QuestionSuggestionBox from "@/components/QuestionSuggestionBox";

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
  location?: string;
}

export interface AskedQuestion {
  episode: number;
  question: string;
  date: string;
  url: string;
  location: string;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingQuestions, setExistingQuestions] = useState<string[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<AskedQuestion[]>([]);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchVideos();
    fetchExistingQuestions();
    fetchAskedQuestionsFromSheets();
  }, []);

  const fetchVideos = async (loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Fetch 25 videos from YouTube API
      const { fetchLatestShorts } = await import("@/lib/youtube");
      const currentCount = videos.length;
      const fetchCount = currentCount + 25;
      const newVideos = await fetchLatestShorts(fetchCount);
      
      // Get only the new videos we don't have yet
      const videosToAdd = newVideos.slice(currentCount);
      
      if (videosToAdd.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        setLoading(false);
        return;
      }
      
      // Location already comes from YouTube API metadata
      setVideos(loadMore ? [...videos, ...videosToAdd] : videosToAdd);
      setHasMore(videosToAdd.length === 25); // If we got 25, there might be more
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreVideos = () => {
    fetchVideos(true);
  };

  const fetchExistingQuestions = async () => {
    try {
      const response = await fetch("/data.json");
      const data = await response.json();
      
      // Extract question text from episode names
      const questions = data.lines.map((line: any) => {
        // Remove episode number from the name (e.g., "[QTD Episode 1]")
        const questionText = line.name.replace(/\[QTD Episode \d+\]/gi, "").trim();
        return questionText;
      });
      
      setExistingQuestions(questions);
    } catch (err) {
      console.error("Error fetching existing questions:", err);
    }
  };

  const fetchAskedQuestionsFromSheets = async () => {
    try {
      const sheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
      if (!sheetsUrl) return;

      const response = await fetch(`${sheetsUrl}?action=getAskedQuestions`);
      const data = await response.json();
      
      if (data.status === 'success' && data.questions) {
        setAskedQuestions(data.questions);
      }
    } catch (err) {
      console.error("Error fetching asked questions from sheets:", err);
    }
  };


  return (
    <main className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-4">
        {/* Intro Text */}
        <div className="text-center mb-6">
          <p className="text-white text-lg md:text-xl mb-1">
            <strong>Did I interview you today?</strong>
          </p>
          <p className="text-white text-lg md:text-xl">
            Episodes are published within 24 hours
          </p>
        </div>

        {/* Question Suggestion Box - below intro section with divider */}
        <div className="mt-2 mb-10">
          {/* Divider: high saturation green, yellow, red with better blocking */}
          <div className="mb-0">
            <div style={{ height: '2px', backgroundColor: '#00ff00' }}></div>
            <div style={{ height: '6px', backgroundColor: '#ffff00' }}></div>
            <div style={{ height: '2px', backgroundColor: '#ff0000' }}></div>
          </div>
          <QuestionSuggestionBox existingQuestions={existingQuestions} />
        </div>

        {/* Videos Section */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12 border-2 border-vintage-red bg-black p-6">
            <div className="text-vintage-red text-lg mb-3">Error: {error}</div>
            <button
              onClick={() => fetchVideos(false)}
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
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8 mb-8">
                <button
                  onClick={loadMoreVideos}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-vintage-yellow text-black font-bold border-2 border-white hover:bg-white transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load Next 25 Episodes'}
                </button>
              </div>
            )}
            
            {/* Random 5 episodes */}
            <AllEpisodesList apiVideos={videos} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-white border-t-2 border-white mt-12 bg-black">
        <div className="flex flex-col items-center gap-2">
          <ViewCounter />
          
          <p className="text-sm">
            Contact me at <a href="mailto:michaellinares314@gmail.com" className="text-vintage-yellow hover:underline">michaellinares314@gmail.com</a>
            {' '} or {' '}
            <a 
              href="https://www.instagram.com/bignosemichael" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-vintage-yellow hover:underline"
            >
              @bignosemichael
            </a>
            {' '} on Instagram
          </p>
          <p className="text-sm">© 2025 Question The Day</p>
        </div>
      </footer>
    </main>
  );
}

