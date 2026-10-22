"use client";

import { useCallback, useEffect, useRef } from "react";

// Minimal YouTube IFrame API wrapper: mount a player into `id`, then playAt(seconds).
type YTPlayer = { seekTo(s: number, allow: boolean): void; playVideo(): void };
declare global {
  interface Window {
    YT?: { Player: new (id: string, opts: object) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function useYouTube(id: string, videoId: string) {
  const player = useRef<YTPlayer | null>(null);
  const ready = useRef(false);
  const pending = useRef<number | null>(null);

  useEffect(() => {
    const make = () => {
      if (player.current || !window.YT) return;
      player.current = new window.YT.Player(id, {
        videoId,
        playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onReady: () => {
            ready.current = true;
            if (pending.current !== null) {
              player.current?.seekTo(pending.current, true);
              player.current?.playVideo();
              pending.current = null;
            }
          },
        },
      });
    };
    if (window.YT?.Player) return make();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); make(); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  }, [id, videoId]);

  return useCallback((seconds: number) => {
    if (ready.current && player.current) {
      player.current.seekTo(seconds, true);
      player.current.playVideo();
    } else {
      pending.current = seconds;
    }
  }, []);
}
