"use client";

import { useEffect } from "react";
import type { Video } from "@/app/page";

interface VideoModalProps {
  video: Video;
  onClose: () => void;
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl mx-4 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-vintage-yellow hover:text-vintage-red transition-colors text-3xl font-bold bg-black border-4 border-white px-4 py-1"
          aria-label="Close"
        >
          [X CLOSE]
        </button>

        {/* Video container */}
        <div className="relative bg-black border-4 border-vintage-yellow overflow-hidden">
          <div className="relative aspect-[9/16] max-h-[80vh] mx-auto">
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Minimal info - just subscribe button */}
          <div className="p-4 bg-black border-t-4 border-vintage-yellow flex justify-center">
            <a
              href="https://youtube.com/@bignosemichael"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-vintage-red text-white font-bold border-2 border-white hover:bg-white hover:text-vintage-red transition-colors"
            >
              Subscribe
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

