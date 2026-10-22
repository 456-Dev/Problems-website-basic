"use client";

import { useEffect, useRef, useState } from "react";

// The page's scrollbar: a strip of highway down the right edge. A minivan drives
// LA -> NYC as you scroll; click or drag anywhere on the road to jump there.
export default function RoadRail() {
  const [p, setP] = useState(0);
  const road = useRef<HTMLDivElement>(null);
  const drag = useRef(false);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);

  const jump = (clientY: number) => {
    const r = road.current?.getBoundingClientRect();
    if (!r) return;
    const f = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    scrollTo({ top: f * (document.documentElement.scrollHeight - innerHeight) });
  };

  return (
    <aside className="oqa-rail" aria-hidden="true">
      <span className="oqa-rail-end">LA</span>
      <div
        className="oqa-road-v"
        ref={road}
        style={{ ["--p" as string]: p, ["--dash" as string]: `${Math.round(p * 2400)}px` }}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); jump(e.clientY); }}
        onPointerMove={(e) => { if (drag.current) jump(e.clientY); }}
        onPointerUp={() => { drag.current = false; }}
        onPointerCancel={() => { drag.current = false; }}
      >
        <div className="oqa-road-trail" />
        <svg className="oqa-van" viewBox="0 0 30 56">
          {/* top-down minivan, nose pointing down the road */}
          <rect x="1" y="9" width="4" height="9" rx="1.5" className="tire" />
          <rect x="25" y="9" width="4" height="9" rx="1.5" className="tire" />
          <rect x="1" y="38" width="4" height="9" rx="1.5" className="tire" />
          <rect x="25" y="38" width="4" height="9" rx="1.5" className="tire" />
          <rect x="3.5" y="2" width="23" height="51" rx="7" className="body" />
          <rect x="7" y="5" width="16" height="5" rx="2" className="glass" />
          <rect x="6.5" y="13" width="17" height="21" rx="3" className="roof" />
          <path d="M6.5 38h17l-2 7h-13z" className="glass" />
          <rect x="1.5" y="36" width="3" height="2.5" rx="1" className="body" />
          <rect x="25.5" y="36" width="3" height="2.5" rx="1" className="body" />
          <circle cx="9" cy="51" r="1.4" className="light" />
          <circle cx="21" cy="51" r="1.4" className="light" />
        </svg>
      </div>
      <span className="oqa-rail-end">NYC</span>
    </aside>
  );
}
