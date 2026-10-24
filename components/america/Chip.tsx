"use client";

import { useEffect, useRef, useState } from "react";

// The Grooms, "I Deserve A Little Bit More" (the original recording), playing front to back under the whole page.
// Browsers won't play sound until you touch the page, so it starts on your first tap or key.
// Any .oqa-music button toggles it (they send "oqa-music"; we answer with "oqa-music-state").

export const SONG = "/assets/america/deserve.mp3";

export default function Chip() {
  const a = useRef<HTMLAudioElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = a.current;
    if (!el) return;
    const say = () => { setOn(!el.paused); dispatchEvent(new CustomEvent("oqa-music-state", { detail: !el.paused })); };
    el.addEventListener("play", say); el.addEventListener("pause", say);
    const toggle = () => { if (el.paused) el.play().catch(() => {}); else el.pause(); };
    let started = false;
    const first = (e: Event) => {
      if (started) return;
      started = true;
      if ((e.target as Element | null)?.closest?.(".oqa-music")) return;   // that button handles itself
      el.play().catch(() => {});
    };
    addEventListener("oqa-music", toggle);
    for (const k of ["pointerdown", "keydown"]) addEventListener(k, first, { capture: true });
    return () => {
      removeEventListener("oqa-music", toggle);
      for (const k of ["pointerdown", "keydown"]) removeEventListener(k, first, { capture: true });
      el.removeEventListener("play", say); el.removeEventListener("pause", say);
    };
  }, []);

  return (
    <>
      <audio ref={a} src={SONG} loop preload="metadata" />
      <button type="button" className={`oqa-music oqa-music-fixed${on ? " on" : ""}`} onClick={() => dispatchEvent(new Event("oqa-music"))}
        aria-label={on ? "Pause the music" : "Play the music"}>{on ? "♫ ❚❚" : "♫ ▶"}</button>
    </>
  );
}
