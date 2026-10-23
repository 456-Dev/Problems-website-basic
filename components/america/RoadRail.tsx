"use client";

import { useEffect, useRef, useState } from "react";
import { stops } from "@/lib/america";
import { CW, HH, WW, ROAD_Y, SCENES, drawStrip, fireSpot, roadOff, roadOffF } from "./pixelTrip";

// An 8-bit road trip along the bottom of the page, LA on the left, NYC on the
// right, one little landscape per stop, seen from above. Traffic runs both ways on the
// highway; our white minivan drives east on its own. Click or drag to move it.

const TRIP_SECS = 75;   // one full drive, LA to NYC

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
        const x = Math.round(car.x), y = (car.east ? ROAD_Y + 6 : ROAD_Y + 1) + roadOff(x + 3);
        // seen from above: body, a darker roof, windshield facing the way it drives
        ctx.fillStyle = car.c; ctx.fillRect(x, y, 6, 3);
        ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(x + 2, y, 2, 3);
        ctx.fillStyle = "#1a2a3a"; ctx.fillRect(car.east ? x + 4 : x + 1, y, 1, 3);
        ctx.fillStyle = "#fff6a0"; ctx.fillRect(car.east ? x + 5 : x, y, 1, 1); ctx.fillRect(car.east ? x + 5 : x, y + 2, 1, 1);
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

  // the van drives itself LA -> NYC while the strip is on screen; drag or click to move it
  useEffect(() => {
    const b = box.current;
    if (!b) return;
    const size = () => setView({ w: b.clientWidth, scale: b.clientHeight / HH });
    size();
    addEventListener("resize", size);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false, raf = 0, last = 0, hold = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
      if (!drag.current) {
        if (hold > 0) hold -= dt;
        else setP((q) => {
          const n = q + dt / TRIP_SECS;
          if (n >= 1) { hold = 3; return q >= 1 ? 0 : 1; }   // park in NYC a beat, then back to LA
          return n;
        });
      }
      if (seen) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting && !still;
      cancelAnimationFrame(raf); last = 0;
      if (seen) raf = requestAnimationFrame(tick);
    });
    io.observe(b);
    return () => { io.disconnect(); cancelAnimationFrame(raf); removeEventListener("resize", size); };
  }, []);

  const jump = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setP(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));   // the strip's width is the whole trip
  };

  // world position of the van, and a strip offset that keeps it on screen
  const s = view.scale;
  const wx = 10 + p * (WW - 20);       // keep the van fully on the road at both ends
  const offset = Math.min(0, Math.max(view.w - WW * s, view.w * 0.4 - wx * s));
  const vanX = offset + wx * s;
  const vs = s * 1.25;
  const tilt = Math.atan2(roadOffF(wx + 2) - roadOffF(wx - 2), 4);   // follow the bends                         // the van is drawn a bit bigger than traffic so you can find it
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
        <svg className="oqa-van" viewBox="-1 -1 14 8"
          style={{ left: vanX, top: (ROAD_Y + 7.5 + roadOffF(wx)) * s, width: 14 * vs, height: 8 * vs,
                   transform: `translate(-50%, -50%) rotate(${tilt}rad)` }}>
          {/* 8-bit white minivan from above, heading east, black outline */}
          <rect x="-1" y="-1" width="14" height="8" fill="#000" />
          <rect x="0" y="0" width="12" height="6" fill="#e6e6e6" />
          <rect x="3" y="1" width="6" height="4" fill="#ffffff" />
          <rect x="3" y="1" width="6" height="1" fill="#cfcfcf" /><rect x="3" y="4" width="6" height="1" fill="#cfcfcf" />
          <rect x="9" y="0" width="2" height="6" fill="#1a2a3a" /><rect x="0" y="1" width="1" height="4" fill="#1a2a3a" />
          <rect x="11" y="0" width="1" height="1" fill="#fff6a0" /><rect x="11" y="5" width="1" height="1" fill="#fff6a0" />
          <rect x="0" y="0" width="1" height="1" fill="#e0302f" /><rect x="0" y="5" width="1" height="1" fill="#e0302f" />
          <rect x="9" y="-1" width="1" height="1" fill="#e6e6e6" /><rect x="9" y="6" width="1" height="1" fill="#e6e6e6" />
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
