"use client";

import { useEffect, useState } from "react";
import type { Video } from "@/app/page";

interface VideoComment {
  id: string;
  videoId: string;
  name: string;
  text: string;
  timestamp: number;
}

interface VideoModalProps {
  video: Video;
  onClose: () => void;
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Prevent scrolling when modal is open
    document.body.style.overflow = "hidden";

    // Close on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
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
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/95 animate-fade-in overflow-y-auto py-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-6 right-0 z-10 text-vintage-yellow hover:text-vintage-red transition-colors text-2xl font-bold bg-black border-4 border-white glossy-btn px-4 py-1"
          aria-label="Close"
        >
          [X CLOSE]
        </button>

        {/* Video container */}
        <div className="relative bg-black border-4 border-vintage-yellow overflow-hidden mt-8">
          <div className="relative aspect-[9/16] max-h-[70vh] mx-auto">
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          <div className="p-4 bg-black border-t-4 border-vintage-yellow flex justify-center">
            <a
              href="https://youtube.com/@bignosemichael"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-vintage-red text-white font-bold border-2 border-white glossy-btn hover:bg-white hover:text-vintage-red transition-colors"
            >
              Subscribe
            </a>
          </div>

          {/* Answers section */}
          <div className="p-4 bg-black border-t-4 border-vintage-yellow">
            <h3 className="text-vintage-yellow font-bold text-lg mb-3">
              YOUR ANSWER ({comments.length})
            </h3>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={40}
                  className="md:w-48 px-3 py-2 bg-black text-white border-2 border-white focus:border-vintage-yellow outline-none text-sm"
                />
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="How would YOU answer this question?"
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

            {comments.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="border border-white p-2">
                    <p className="text-vintage-yellow font-bold text-xs">{c.name}</p>
                    <p className="text-white text-sm">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
