"use client";

import { useEffect, useRef, useState } from "react";
import { stops } from "@/lib/america";
import { CW, HH, WW, ROAD_Y, SCENES, drawStrip, fireSpot } from "./pixelTrip";

// The page's scrollbar: an 8-bit road trip pinned along the bottom edge, LA on
// the left, NYC on the right, one little side-view landscape per stop. Traffic
// runs both ways on the highway; our white minivan drives east as you scroll.
// Click or drag to jump.

const CAR_COLORS = ["#e0302f", "#3a6fd8", "#ffd23f", "#2faa4a", "#ff8a1f", "#b04ad8", "#8a8a8a", "#e8e8e8"];

type Car = { east: boolean; x: number; v: number; c: string };

export default function RoadRail() {
  const [p, setP] = useState(0);
  const [view, setView] = useState({ w: 1200, scale: 2 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);

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
    const cars: Car[] = Array.from({ length: 40 }, (_, i) => ({
      east: i % 2 === 1, x: rnd() * WW, v: 14 + rnd() * 18, c: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)],
    }));
    const [fxX, fxY] = fireSpot();
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, WW, HH);
      for (const car of cars) {
        if (!still) car.x = (car.x + (car.east ? 1 : -1) * car.v * dt + WW) % WW;
        const x = Math.round(car.x), y = car.east ? ROAD_Y + 6 : ROAD_Y + 1;
        ctx.fillStyle = car.c; ctx.fillRect(x, y + 1, 6, 2); ctx.fillRect(x + 1, y, 4, 1);  // body + cabin
        ctx.fillStyle = "#1a2a3a"; ctx.fillRect(car.east ? x + 3 : x + 1, y, 2, 1);        // windshield faces forward
        ctx.fillStyle = "#111"; ctx.fillRect(x + 1, y + 3, 1, 1); ctx.fillRect(x + 4, y + 3, 1, 1); // wheels
        ctx.fillStyle = "#fff6a0"; ctx.fillRect(car.east ? x + 5 : x, y + 1, 1, 1);         // headlight
        ctx.fillStyle = "#ff3b3b"; ctx.fillRect(car.east ? x : x + 5, y + 1, 1, 1);         // tail light
      }
      const flick = still ? 0 : Math.floor(now / 120);
      for (let k = 0; k < 12; k++) {
        const fxk = fxX + (k % 6), fyk = fxY + 2 - ((k * 7 + flick) % 5);
        ctx.fillStyle = ["#ff3b1f", "#ff8a1f", "#ffd23f"][(k + flick) % 3];
        ctx.fillRect(fxk, fyk, 1, 2);
      }
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // follow the page scroll
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      setP(max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0);
      const b = box.current;
      if (b) setView({ w: b.clientWidth, scale: b.clientHeight / HH });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);

  const jump = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    scrollTo({ top: f * (document.documentElement.scrollHeight - innerHeight) });
  };

  // world position of the van, and a strip offset that keeps it on screen
  const s = view.scale;
  const wx = 10 + p * (WW - 20);       // keep the van fully on the road at both ends
  const offset = Math.min(0, Math.max(view.w - WW * s, view.w * 0.4 - wx * s));
  const vanX = offset + wx * s;
  const vs = s * 1.25;                         // the van is drawn a bit bigger than traffic so you can find it
  const n = SCENES.length;
  const at = Math.min(n - 1, Math.floor(wx / CW));
  const stop = stops[Math.min(stops.length - 1, at)];
  const layer = { transform: `translateX(${offset}px)`, width: WW * s, height: "100%" };

  return (
    <aside className="oqa-rail" aria-hidden="true">
      <div
        className="oqa-strip"
        ref={box}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); jump(e.clientX); }}
        onPointerMove={(e) => { if (drag.current) jump(e.clientX); }}
        onPointerUp={() => { drag.current = false; }}
        onPointerCancel={() => { drag.current = false; }}
      >
        <canvas ref={canvas} width={WW} height={HH} style={layer} />
        <canvas ref={fx} width={WW} height={HH} style={layer} />
        <svg className="oqa-van" viewBox="-1 -1 14 9"
          style={{ left: vanX, top: (ROAD_Y + 10) * s, width: 14 * vs, height: 9 * vs }}>
          {/* 8-bit white minivan, side view, heading east, black outline */}
          <rect x="-0.5" y="0.5" width="13" height="6" fill="#000" />
          <rect x="0" y="1" width="11" height="5" fill="#e6e6e6" />
          <rect x="0" y="1" width="9" height="1" fill="#ffffff" />
          <rect x="1" y="2" width="2" height="2" fill="#1a2a3a" /><rect x="4" y="2" width="2" height="2" fill="#1a2a3a" />
          <rect x="7" y="2" width="2" height="2" fill="#1a2a3a" />
          <rect x="9" y="2" width="2" height="2" fill="#1a2a3a" /><rect x="11" y="3" width="1" height="3" fill="#e6e6e6" />
          <rect x="11" y="4" width="1" height="1" fill="#fff6a0" /><rect x="0" y="4" width="1" height="1" fill="#e0302f" />
          <rect x="1" y="5" width="3" height="3" fill="#000" /><rect x="8" y="5" width="3" height="3" fill="#000" />
          <rect x="2" y="6" width="1" height="1" fill="#9a9a9a" /><rect x="9" y="6" width="1" height="1" fill="#9a9a9a" />
        </svg>
        <span className="oqa-rail-end west">LA</span>
        <span className="oqa-rail-end east">NYC</span>
        <span className="oqa-rail-here"><b>Day {stop.day}</b>{stop.place}</span>
      </div>
      <div className="oqa-rail-trip">
        <i style={{ width: `${p * 100}%` }} />
        {stops.map((st, k) => (
          <em key={k} className={k <= at ? "past" : ""} style={{ left: `${((k + 0.5) / n) * 100}%` }} />
        ))}
      </div>
    </aside>
  );
}
