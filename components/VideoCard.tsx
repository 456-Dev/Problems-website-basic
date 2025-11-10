"use client";

import type { Video } from "@/app/page";

interface VideoCardProps {
  video: Video;
  index: number;
  onClick: () => void;
}

export default function VideoCard({ video, index, onClick }: VideoCardProps) {
  // Parse episode number from title (looks for patterns like #123, Ep 123, Episode 123, etc.)
  const parseEpisodeNumber = (title: string): string | null => {
    const patterns = [
      /#(\d+)/,           // #123
      /ep\.?\s*(\d+)/i,   // Ep 123, Ep. 123
      /episode\s*(\d+)/i, // Episode 123
      /\((\d+)\)/,        // (123)
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const episodeNumber = parseEpisodeNumber(video.title);

  return (
    <div
      className="cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <div className="relative" style={{ aspectRatio: '9/16' }}>
        {/* Full vertical thumbnail */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />

        {/* Black overlay on bottom 40% */}
        <div className="absolute bottom-0 left-0 right-0 bg-black flex flex-col" style={{ height: '40%' }}>
          {/* Top section: Episode number on left, play button on right */}
          <div className="flex items-center justify-between px-3 pt-1 pb-0">
            {/* Episode Number - Top Left */}
            {episodeNumber && (
              <span 
                className="text-5xl font-bold -ml-1"
                style={{
                  color: '#ffff00',
                  WebkitTextStroke: '1px #00ff00',
                  textShadow: '1.5px 1.5px 0 #ff0000'
                }}
              >
                #{episodeNumber}
              </span>
            )}
            
            {/* Red Play Button - Centered with number */}
            <div className="w-10 h-10 bg-vintage-red border-2 border-white flex items-center justify-center">
              <div className="text-xl font-bold text-white">▶</div>
            </div>
          </div>

          {/* Bottom section: Click to Watch button spanning full width (green) */}
          <div className="bg-vintage-green border-t-2 border-white hover:bg-white transition-colors mt-1">
            <p className="text-black font-bold text-center py-2 text-sm">Click to Watch</p>
          </div>
        </div>
      </div>
    </div>
  );
}

