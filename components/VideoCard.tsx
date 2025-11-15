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

  // Parse title - remove episode number and everything after question mark
  const parseTitle = (title: string): string => {
    // Remove common episode patterns
    let cleanTitle = title
      .replace(/#\d+/g, '')
      .replace(/ep\.?\s*\d+/gi, '')
      .replace(/episode\s*\d+/gi, '')
      .replace(/\(\d+\)/g, '')
      .replace(/[|•–-]/g, '')
      .trim();
    
    // Remove everything after the question mark (including the ?)
    const questionMarkIndex = cleanTitle.indexOf('?');
    if (questionMarkIndex !== -1) {
      cleanTitle = cleanTitle.substring(0, questionMarkIndex + 1);
    }
    
    return cleanTitle || video.title;
  };

  // Format ISO date to "Nov 15th, 2024"
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinal = (n: number): string => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };
    
    return `${month} ${day}${getOrdinal(day)}, ${year}`;
  };

  // Parse date from description (looks for "Date: MM/DD/YY" or similar)
  const parseDate = (description: string, publishedAt: string): string => {
    const datePattern = /date:\s*([^\n]+)/i;
    const match = description.match(datePattern);
    return match ? match[1] : formatDate(publishedAt);
  };

  // Parse location from description (looks for "Location: XXXX" or similar)
  const parseLocation = (description: string): string => {
    const locationPattern = /location:\s*([^\n]+)/i;
    const match = description.match(locationPattern);
    return match ? match[1].trim() : 'New York, USA';
  };

  const episodeNumber = parseEpisodeNumber(video.title);
  const cleanTitle = parseTitle(video.title);
  const date = parseDate(video.description, video.publishedAt);
  const location = parseLocation(video.description);

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
          loading="lazy"
          decoding="async"
        />

        {/* Black overlay on top 20% - Title, Date, Location */}
        <div className="absolute top-1 flex flex-col justify-end" style={{ height: '13%', backgroundColor: 'rgba(0, 0, 0, 255)', paddingBottom: '3px', left: '-2px', right: '-2px' }}>
          {/* Title - centered, smaller, 75% white */}
          <div className="px-2 flex items-center justify-center" style={{ marginBottom: '6px' }}>
            <p 
              className="font-bold leading-tight text-center"
              style={{ 
                fontSize: '9px',
                color: 'rgba(255, 255, 255, 0.75)',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                fontFamily: 'Helvetica, Arial, sans-serif',
                padding: '2px 2px'
              }}
            >
              {cleanTitle}
            </p>
          </div>
          
          {/* Date and Location row - centered */}
          <div className="flex items-center justify-center">
            {/* Date */}
            <span 
              className="text-black font-bold px-1 py-0 text-xs"
              style={{ 
                backgroundColor: 'rgb(0, 143, 0)',
                fontSize: '9px',
                fontFamily: 'Helvetica, Arial, sans-serif'
              }}
            >
              {date}
            </span>
            
            {/* Yellow separator - same height as date/location */}
            <span 
              className="px-0.1 py-0.5"
              style={{ backgroundColor: 'rgb(154, 154, 0)', fontSize: '9px',}}
            >
              &nbsp;&nbsp;
            </span>
            
            {/* Location */}
            <span 
              className="text-black font-bold px-1 py-0 text-xs"
              style={{ 
                backgroundColor: 'rgb(154, 0, 0)',
                fontSize: '9px',
                fontFamily: 'Helvetica, Arial, sans-serif'
              }}
            >
              {location}
            </span>
          </div>
        </div>

        {/* Black overlay on bottom 38% (2% shorter) - 100% black */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col" style={{ height: '40%', backgroundColor: 'rgb(0, 0, 0)' }}>
          {/* Top section: Episode number on left, play button on right */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
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

