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
  const [error, setError] = useState<string | null>(null);
  const [existingQuestions, setExistingQuestions] = useState<string[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<AskedQuestion[]>([]);

  useEffect(() => {
    fetchVideos();
    fetchExistingQuestions();
    fetchAskedQuestionsFromSheets();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      // Fetch directly from YouTube API (client-side)
      const { fetchLatestShorts } = await import("@/lib/youtube");
      const videos = await fetchLatestShorts();
      
      setVideos(videos);
      
      // Fetch location data and merge with videos
      await mergeLocationData(videos);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
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

  const mergeLocationData = async (videosToMerge: Video[]) => {
    try {
      const sheetsUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
      if (!sheetsUrl) return;

      const response = await fetch(`${sheetsUrl}?action=getAskedQuestions`);
      const data = await response.json();
      
      if (data.status === 'success' && data.questions) {
        // Merge location data with videos
        const mergedVideos = videosToMerge.map(video => {
          // Extract episode number from video title
          const episodeMatch = video.title.match(/#(\d+)|episode\s*(\d+)|ep\.?\s*(\d+)/i);
          const episodeNumber = episodeMatch ? parseInt(episodeMatch[1] || episodeMatch[2] || episodeMatch[3]) : null;
          
          // Find matching location from asked questions
          if (episodeNumber) {
            const matchedQuestion = data.questions.find((q: AskedQuestion) => q.episode === episodeNumber);
            if (matchedQuestion && matchedQuestion.location) {
              return { ...video, location: matchedQuestion.location };
            }
          }
          
          return video;
        });
        
        setVideos(mergedVideos);
      }
    } catch (err) {
      console.error("Error merging location data:", err);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <Header />
      
      {/* Question Suggestion Box - at top */}
      <QuestionSuggestionBox existingQuestions={existingQuestions} />
      
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
            
            {/* Random 5 episodes */}
            <AllEpisodesList apiVideos={videos} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-white border-t-2 border-white mt-12 bg-black">
        <div className="flex flex-col items-center gap-2">
          <ViewCounter />
          <p className="text-sm">© 2025 Question The Day</p>
        </div>
      </footer>
    </main>
  );
}

