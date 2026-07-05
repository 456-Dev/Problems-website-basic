"use client";

import { useEffect } from "react";

/**
 * A soft light that follows the cursor and lights up the page as it moves,
 * giving the flat black UI real depth. Pointer-driven on desktop; on touch
 * devices (no cursor) it stays hidden and the CSS ambient glow carries the look.
 */
export default function AmbientLight() {
  useEffect(() => {
    // Skip on devices without a fine pointer (phones/tablets)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--spot-x", `${e.clientX}px`);
        document.documentElement.style.setProperty("--spot-y", `${e.clientY}px`);
        document.documentElement.style.setProperty("--spot-on", "1");
        raf = 0;
      });
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="cursor-spotlight" aria-hidden="true" />;
}
