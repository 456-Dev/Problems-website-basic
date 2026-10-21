"use client";

import { useEffect, useState } from "react";

// Auto-advancing still viewer with prev/next and a thumbnail strip.
export default function Stills({ srcs, every = 5000 }: { srcs: string[]; every?: number }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (d: number) => setI((n) => (n + d + srcs.length) % srcs.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(1), every);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, every, srcs.length]);

  return (
    <div className="stills" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="stills-frame">
        {srcs.map((s, n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s} src={s} alt={`Film still ${n + 1}`} className={n === i ? "on" : ""}
               loading={n < 2 ? "eager" : "lazy"} />
        ))}
        <button className="stills-nav prev" aria-label="Previous still" onClick={() => go(-1)}>‹</button>
        <button className="stills-nav next" aria-label="Next still" onClick={() => go(1)}>›</button>
        <span className="stills-count">{String(i + 1).padStart(2, "0")} / {srcs.length}</span>
      </div>
      <div className="stills-strip">
        {srcs.map((s, n) => (
          <button key={s} className={n === i ? "on" : ""} onClick={() => setI(n)} aria-label={`Still ${n + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s} alt="" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
