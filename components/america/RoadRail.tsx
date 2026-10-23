"use client";

import { useEffect, useRef, useState } from "react";
import { stops } from "@/lib/america";
import { W, SH, SCENES, roadX, drawStrip } from "./pixelTrip";

// The page's scrollbar: an 8-bit road trip down the right edge, LA at the top,
// NYC at the bottom, one little landscape per stop. The minivan drives as you
// scroll; click or drag the strip to jump.
export default function RoadRail() {
  const [p, setP] = useState(0);
  const [view, setView] = useState({ h: 600, scale: 2 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const H = SCENES.length * SH;

  useEffect(() => {
    const c = canvas.current;
    if (c) { const ctx = c.getContext("2d"); if (ctx) drawStrip(ctx); }
    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0);
      const b = box.current;
      if (b) setView({ h: b.clientHeight, scale: b.clientWidth / W });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);

  const jump = (clientY: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const f = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    scrollTo({ top: f * (document.documentElement.scrollHeight - innerHeight) });
  };

  // world position of the van, and a strip offset that keeps it on screen
  const s = view.scale;
  const wy = p * (H - 1);
  const offset = Math.min(0, Math.max(view.h - H * s, view.h * 0.45 - wy * s));
  const vanY = offset + wy * s;
  const vanX = roadX(wy) * s;
  const stop = stops[Math.min(stops.length - 1, Math.floor(wy / SH))];

  return (
    <aside className="oqa-rail" aria-hidden="true">
      <span className="oqa-rail-end">LA</span>
      <div
        className="oqa-strip"
        ref={box}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); jump(e.clientY); }}
        onPointerMove={(e) => { if (drag.current) jump(e.clientY); }}
        onPointerUp={() => { drag.current = false; }}
        onPointerCancel={() => { drag.current = false; }}
      >
        <canvas ref={canvas} width={W} height={H} style={{ transform: `translateY(${offset}px)`, height: H * s }} />
        <svg className="oqa-van" viewBox="0 0 6 10" style={{ left: vanX, top: vanY, width: 6 * s, height: 10 * s }}>
          {/* 8-bit minivan from above, nose down */}
          <rect x="0" y="1" width="1" height="2" fill="#111" /><rect x="5" y="1" width="1" height="2" fill="#111" />
          <rect x="0" y="6" width="1" height="2" fill="#111" /><rect x="5" y="6" width="1" height="2" fill="#111" />
          <rect x="1" y="0" width="4" height="10" fill="#e0302f" />
          <rect x="1" y="2" width="4" height="4" fill="#ff6a5a" />
          <rect x="2" y="1" width="2" height="1" fill="#1a2a3a" />
          <rect x="1" y="7" width="4" height="1" fill="#1a2a3a" />
          <rect x="1" y="9" width="1" height="1" fill="#fff6a0" /><rect x="4" y="9" width="1" height="1" fill="#fff6a0" />
        </svg>
      </div>
      <span className="oqa-rail-here">{stop.place}<b>Day {stop.day}</b></span>
      <span className="oqa-rail-end">NYC</span>
    </aside>
  );
}
