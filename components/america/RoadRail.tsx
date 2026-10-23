"use client";

import { useEffect, useRef, useState } from "react";
import { stops } from "@/lib/america";
import { W, SH, SCENES, roadX, drawStrip, fireSpot } from "./pixelTrip";

// The page's scrollbar: an 8-bit road trip down the right edge, LA at the top,
// NYC at the bottom, one little landscape per stop. Traffic runs both ways on
// the highway; our white minivan drives as you scroll. Click or drag to jump.

const CAR_COLORS = ["#e0302f", "#3a6fd8", "#ffd23f", "#2faa4a", "#ff8a1f", "#b04ad8", "#8a8a8a", "#e8e8e8"];

type Car = { up: boolean; y: number; v: number; c: string };

export default function RoadRail() {
  const [p, setP] = useState(0);
  const [view, setView] = useState({ h: 600, scale: 2 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const H = SCENES.length * SH;

  // the landscape, drawn once
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) drawStrip(ctx);
  }, []);

  // traffic + the Rockies fire, animated
  useEffect(() => {
    const ctx = fx.current?.getContext("2d");
    if (!ctx) return;
    let seed = 11;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const cars: Car[] = Array.from({ length: 34 }, (_, i) => ({
      up: i % 2 === 1, y: rnd() * H, v: 14 + rnd() * 16, c: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)],
    }));
    const [fxX, fxY] = fireSpot();
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      for (const car of cars) {
        if (!still) car.y = (car.y + (car.up ? -1 : 1) * car.v * dt + H) % H;
        const x = Math.round(roadX(car.y) + (car.up ? -3 : 1));
        const y = Math.round(car.y);
        ctx.fillStyle = car.c; ctx.fillRect(x, y, 2, 4);
        ctx.fillStyle = "#1a2a3a"; ctx.fillRect(x, car.up ? y + 1 : y + 2, 2, 1);           // windshield faces forward
        ctx.fillStyle = car.up ? "#fff6a0" : "#ff3b3b"; ctx.fillRect(x, y, 2, 1);           // lights
      }
      const flick = still ? 0 : Math.floor(now / 120);
      for (let k = 0; k < 9; k++) {
        const fxk = fxX + (k % 5), fyk = fxY + 2 - ((k * 7 + flick) % 4);
        ctx.fillStyle = ["#ff3b1f", "#ff8a1f", "#ffd23f"][(k + flick) % 3];
        ctx.fillRect(fxk, fyk, 1, 2);
      }
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [H]);

  // follow the page scroll
  useEffect(() => {
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
  const vanX = (roadX(wy) + 2) * s;           // in the southbound lane
  const vs = Math.max(2, s * 1.4);            // the van is drawn a bit bigger than traffic so you can find it
  const stop = stops[Math.min(stops.length - 1, Math.floor(wy / SH))];
  const layer = { transform: `translateY(${offset}px)`, height: H * s };

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
        <canvas ref={canvas} width={W} height={H} style={layer} />
        <canvas ref={fx} width={W} height={H} style={layer} />
        <svg className="oqa-van" viewBox="-1 -1 8 12" style={{ left: vanX, top: vanY, width: 8 * vs, height: 12 * vs }}>
          {/* 8-bit white minivan from above, nose down, black outline */}
          <rect x="-0.5" y="-0.5" width="7" height="11" fill="#000" />
          <rect x="0" y="1" width="1" height="2" fill="#222" /><rect x="5" y="1" width="1" height="2" fill="#222" />
          <rect x="0" y="6" width="1" height="2" fill="#222" /><rect x="5" y="6" width="1" height="2" fill="#222" />
          <rect x="1" y="0" width="4" height="10" fill="#e6e6e6" />
          <rect x="1" y="2" width="4" height="4" fill="#ffffff" />
          <rect x="1" y="0" width="1" height="1" fill="#e0302f" /><rect x="4" y="0" width="1" height="1" fill="#e0302f" />
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
