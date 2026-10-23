"use client";

import { useEffect, useRef, useState } from "react";
import { stops } from "@/lib/america";
import { W, SH, HT, SCENES, roadX, drawStrip, fireSpot } from "./pixelTrip";

// The 8-bit road trip at the bottom of the page: a phone-wide map seen from above,
// LA at the top and NYC at the bottom, one little landscape per stop. When you reach
// it, the frame holds still on screen and the map scrolls top to bottom as you keep
// scrolling, our white minivan driving the highway with you. Click or drag to jump.

const CAR_COLORS = ["#e0302f", "#3a6fd8", "#ffd23f", "#2faa4a", "#ff8a1f", "#b04ad8", "#8a8a8a", "#e8e8e8"];

type Car = { south: boolean; y: number; v: number; c: string };

// our white minivan from above, black outline, nose pointing the way the road goes
function drawVan(ctx: CanvasRenderingContext2D, vy: number) {
  const y = Math.round(vy), x = Math.round(roadX(y)), slope = roadX(y + 2) - roadX(y - 2);
  const f = (a: number, b: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h); };
  if (Math.abs(slope) < 4) {                       // driving down the strip
    const l = x - 4, t = y - 6;
    f(l, t, 7, 12, "#000"); f(l + 1, t + 1, 5, 10, "#e6e6e6"); f(l + 2, t + 3, 3, 5, "#ffffff");
    f(l + 1, t + 8, 5, 2, "#1a2a3a"); f(l + 2, t + 1, 3, 1, "#1a2a3a");
    f(l + 1, t + 10, 1, 1, "#fff6a0"); f(l + 5, t + 10, 1, 1, "#fff6a0"); f(l + 1, t + 1, 1, 1, "#e0302f"); f(l + 5, t + 1, 1, 1, "#e0302f");
  } else {                                         // across a switchback, east or west
    const east = slope > 0, l = x - 6, t = y - 4;
    f(l, t, 12, 7, "#000"); f(l + 1, t + 1, 10, 5, "#e6e6e6"); f(l + 4, t + 2, 4, 3, "#ffffff");
    f(east ? l + 8 : l + 2, t + 1, 2, 5, "#1a2a3a"); f(east ? l + 1 : l + 10, t + 2, 1, 3, "#1a2a3a");
    f(east ? l + 10 : l + 1, t + 1, 1, 1, "#fff6a0"); f(east ? l + 10 : l + 1, t + 5, 1, 1, "#fff6a0");
  }
}

export default function RoadRail() {
  const [vy, setVy] = useState(12);              // the van's row on the strip
  const van = useRef(12);
  const [pan, setPan] = useState({ y: 0, s: 4 });   // map offset (css px) and pixel scale
  const sec = useRef<HTMLElement>(null);
  const drag = useRef(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);

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
    const cars: Car[] = Array.from({ length: 44 }, (_, i) => ({
      south: i % 2 === 1, y: rnd() * HT, v: 12 + rnd() * 14, c: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)],
    }));
    const [fxX, fxY] = fireSpot();
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, HT);
      for (const car of cars) {
        if (!still) car.y = (car.y + (car.south ? 1 : -1) * car.v * dt + HT) % HT;
        // seen from above: southbound keeps to the left lane (screen right of travel), northbound the other
        const y = Math.round(car.y), x = Math.round(roadX(y)) + (car.south ? -5 : 2);
        ctx.fillStyle = car.c; ctx.fillRect(x, y, 4, 6);
        ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.fillRect(x, y + 2, 4, 2);
        ctx.fillStyle = "#1a2a3a"; ctx.fillRect(x, car.south ? y + 4 : y + 1, 4, 1);       // windshield faces forward
        ctx.fillStyle = "#fff6a0"; ctx.fillRect(x, car.south ? y + 5 : y, 1, 1); ctx.fillRect(x + 3, car.south ? y + 5 : y, 1, 1);
      }
      const flick = still ? 0 : Math.floor(now / 120);
      for (let k = 0; k < 12; k++) {
        ctx.fillStyle = ["#ff3b1f", "#ff8a1f", "#ffd23f"][(k + flick) % 3];
        ctx.fillRect(fxX + (k % 6), fxY + 2 - ((k * 7 + flick) % 5), 1, 2);
      }
      drawVan(ctx, van.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // how far through the section you've scrolled drives the van; the map pans to keep it in view
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const b = box.current, sc = sec.current;
      if (!b || !sc) return;
      const r = sc.getBoundingClientRect(), s = b.clientWidth / W;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      van.current = 12 + p * (HT - 22);
      setVy(van.current);
      setPan({ s, y: Math.min(0, Math.max(b.clientHeight - HT * s, b.clientHeight * 0.5 - van.current * s)) });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  // click or drag on the map: scroll the page to put the van there
  const jump = (clientY: number) => {
    const b = box.current, sc = sec.current;
    if (!b || !sc) return;
    const y = (clientY - b.getBoundingClientRect().top - pan.y) / pan.s;
    const p = Math.min(1, Math.max(0, (y - 12) / (HT - 22)));
    scrollTo({ top: sc.offsetTop + p * (sc.offsetHeight - innerHeight) });
  };

  const at = Math.min(SCENES.length - 1, Math.floor(vy / SH));
  const stop = stops[Math.min(stops.length - 1, at)];

  return (
    <section className="oqa-trek" ref={sec} aria-label="The road trip, LA to NYC" style={{ height: `${SCENES.length * 45}vh` }}>
      <div className="oqa-road-col">
        <p className="oqa-road-end">LA</p>
        <div className="oqa-strip" ref={box}
          onPointerDown={(e) => { if (e.pointerType !== "mouse") return; drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); jump(e.clientY); }}
          onPointerMove={(e) => { if (drag.current) jump(e.clientY); }}
          onPointerUp={() => { drag.current = false; }}
          onPointerCancel={() => { drag.current = false; }}>
          {[canvas, fx].map((ref, k) => (
            <canvas key={k} ref={ref} width={W} height={HT}
              style={{ height: HT * pan.s, transform: `translateY(${pan.y}px)` }} />
          ))}
          <div className="oqa-road-here"><b>Day {stop.day}</b>{stop.place}</div>
        </div>
        <p className="oqa-road-end">NYC</p>
      </div>
    </section>
  );
}
