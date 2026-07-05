"use client";

import { useEffect, useRef, useState } from "react";
import type { Video } from "@/app/page";

interface VideoComment {
  id: string;
  videoId: string;
  name: string;
  text: string;
  timestamp: number;
}

interface VideoModalProps {
  videos: Video[];
  index: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export default function VideoModal({ videos, index, onClose, onNavigate }: VideoModalProps) {
  const video = videos[index];
  const hasPrev = index > 0;
  const hasNext = index < videos.length - 1;

  const [comments, setComments] = useState<VideoComment[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goPrev = () => hasPrev && onNavigate(index - 1);
  const goNext = () => hasNext && onNavigate(index + 1);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, videos.length]);

  // Reset per-video UI state and reload comments when the video changes
  useEffect(() => {
    setComments([]);
    setStatus("");
    setAnswer("");
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  const fetchComments = async () => {
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
      if (!scriptUrl) return;

      const response = await fetch(`${scriptUrl}?action=getComments&videoId=${video.id}`);
      const data = await response.json();
      if (data.status === "success" && data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) return;

    const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;
    if (!scriptUrl) {
      setStatus("Comments aren't available right now.");
      return;
    }

    const newComment: VideoComment = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      videoId: video.id,
      name: name.trim() || "Anonymous",
      text: trimmed,
      timestamp: Date.now(),
    };

    setSubmitting(true);
    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "addComment", comment: newComment }),
      });

      setComments([newComment, ...comments]);
      setAnswer("");
      setStatus("Answer posted!");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      console.error("Failed to post comment:", error);
      setStatus("Couldn't post — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Swipe left/right to move between videos (horizontal so it doesn't fight scroll)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
    }
    touchStart.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/95 animate-fade-in overflow-y-auto py-6"
      onClick={onClose}
    >
      {/* Prev / Next side arrows (desktop) */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        disabled={!hasPrev}
        aria-label="Previous video"
        className="nav-arrow hidden md:flex fixed left-3 top-1/2 -translate-y-1/2 z-[60] items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        disabled={!hasNext}
        aria-label="Next video"
        className="nav-arrow hidden md:flex fixed right-3 top-1/2 -translate-y-1/2 z-[60] items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed"
      >
        ›
      </button>

      <div
        className="relative w-full max-w-md mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Top bar: counter + close */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm font-bold">
            {index + 1} / {videos.length}
          </span>
          <button
            onClick={onClose}
            className="text-vintage-yellow hover:text-vintage-red transition-colors text-lg font-bold bg-black border-2 border-white glossy-btn px-3 py-0.5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Glossy screen bezel */}
        <div className="glossy-frame relative bg-black overflow-hidden">
          <div className="relative aspect-[9/16] max-h-[72vh] mx-auto">
            <iframe
              key={video.id}
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
            {/* Glass reflection overlay (pointer-events off so it doesn't block the player) */}
            <div className="screen-glare" />
          </div>
        </div>

        {/* Mobile prev/next + subscribe row */}
        <div className="mt-2 flex items-stretch gap-2">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="md:hidden flex-1 px-3 py-2 bg-black text-white font-bold border-2 border-white glossy-btn disabled:opacity-30 text-sm"
          >
            ‹ PREV
          </button>
          <a
            href="https://youtube.com/@bignosemichael"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-3 py-2 bg-vintage-red text-white font-bold border-2 border-white glossy-btn hover:bg-white hover:text-vintage-red transition-colors text-sm"
          >
            Subscribe
          </a>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="md:hidden flex-1 px-3 py-2 bg-black text-white font-bold border-2 border-white glossy-btn disabled:opacity-30 text-sm"
          >
            NEXT ›
          </button>
        </div>

        {/* Collapsible answers — keeps the modal light, video stays the focus */}
        <div className="mt-2 border-2 border-white bg-black">
          <button
            onClick={() => setShowAnswers((s) => !s)}
            className="w-full flex items-center justify-between px-3 py-2 text-vintage-yellow font-bold text-sm hover:bg-white/5 transition-colors"
          >
            <span>💬 YOUR ANSWER {comments.length > 0 && `(${comments.length})`}</span>
            <span>{showAnswers ? "▲" : "▼"}</span>
          </button>

          {showAnswers && (
            <div className="p-3 border-t-2 border-white">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={40}
                  className="px-3 py-2 bg-black text-white border-2 border-white focus:border-vintage-yellow outline-none text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="How would YOU answer this?"
                    maxLength={300}
                    className="flex-1 px-3 py-2 bg-black text-white border-2 border-white focus:border-vintage-yellow outline-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !answer.trim()}
                    className="px-4 py-2 bg-vintage-green text-black font-bold border-2 border-white glossy-btn hover:bg-vintage-yellow transition-colors text-sm disabled:opacity-50"
                  >
                    {submitting ? "..." : "POST"}
                  </button>
                </div>
                {status && <p className="text-vintage-green font-bold text-sm">{status}</p>}
              </form>

              {comments.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="border border-white/60 p-2">
                      <p className="text-vintage-yellow font-bold text-xs">{c.name}</p>
                      <p className="text-white text-sm">{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-sm text-center py-1">Be the first to answer.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
