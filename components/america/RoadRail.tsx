"use client";

import { useEffect, useRef, useState } from "react";
import { stops } from "@/lib/america";
import { W, HT, SCENES, TRAIL, sceneAt, roadX, vanX, drawStrip, drawLive, drawCanopy, type Live } from "./pixelTrip";

// The 8-bit road trip at the bottom of the page: a phone-wide map seen from above,
// LA at the top and NYC at the bottom, a little landscape per stop. When you reach
// it, the frame holds still on screen and the map scrolls top to bottom as you keep
// scrolling, our white minivan driving the highway with you. Click or drag to jump.

const CAR_COLORS = ["#e0302f", "#3a6fd8", "#ffd23f", "#2faa4a", "#ff8a1f", "#b04ad8", "#8a8a8a", "#e8e8e8"];

type Car = { south: boolean; y: number; v: number; c: string };

// our white minivan from above, black outline, heading down the map
function drawVan(ctx: CanvasRenderingContext2D, vy: number) {
  const y = Math.round(vy), l = Math.round(vanX(y)) - 3, t = y - 5;
  const f = (a: number, b: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(a, b, w, h); };
  f(l, t, 6, 10, "#000"); f(l + 1, t + 1, 4, 8, "#e6e6e6"); f(l + 1, t + 3, 4, 3, "#ffffff");
  f(l + 1, t + 6, 4, 2, "#1a2a3a"); f(l + 1, t + 1, 1, 1, "#e0302f"); f(l + 4, t + 1, 1, 1, "#e0302f");
  f(l + 1, t + 8, 1, 1, "#fff6a0"); f(l + 4, t + 8, 1, 1, "#fff6a0");
}

export default function RoadRail() {
  const [vy, setVy] = useState(12);              // the van's row on the strip
  const van = useRef(12);
  const [pan, setPan] = useState({ y: 0, s: 4 });   // map offset (css px) and pixel scale
  const sec = useRef<HTMLElement>(null);
  const drag = useRef(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const over = useRef<HTMLCanvasElement>(null);
  const live = useRef<Live[]>([]);
  const box = useRef<HTMLDivElement>(null);

  // the landscape, drawn once
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) live.current = drawStrip(ctx);
    const o = over.current?.getContext("2d");
    if (o) drawCanopy(o);
  }, []);

  // traffic, the van, and everything else that moves (fire, fireworks, dogs, the club)
  useEffect(() => {
    const ctx = fx.current?.getContext("2d");
    if (!ctx) return;
    let seed = 11;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const cars: Car[] = Array.from({ length: 34 }, (_, i) => ({
      south: i % 2 === 1, y: rnd() * HT, v: 12 + rnd() * 14, c: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)],
    }));
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, HT);
      for (const car of cars) {
        if (!still) car.y = (car.y + (car.south ? 1 : -1) * car.v * dt + HT) % HT;
        // seen from above: southbound keeps to the left lane (screen right of travel), northbound the other
        const y = Math.round(car.y), x = Math.round(roadX(y) + (car.south ? -3 : 1));
        ctx.fillStyle = car.c; ctx.fillRect(x, y, 2, 4);
        ctx.fillStyle = "#1a2a3a"; ctx.fillRect(x, car.south ? y + 2 : y + 1, 2, 1);       // windshield faces forward
        ctx.fillStyle = car.south ? "#ff3b3b" : "#fff6a0"; ctx.fillRect(x, y, 2, 1);
      }
      drawLive(ctx, now, still, live.current);
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

  const def = SCENES[sceneAt(vy)];
  const stop = stops[def.stop];
  const lost = vy > TRAIL.a - 14 && vy < TRAIL.b + 4;    // the Smokies detour

  return (
    <section className="oqa-trek" ref={sec} aria-label="The road trip, LA to NYC" style={{ height: `${Math.round((HT / 64) * 45)}vh` }}>
      <div className="oqa-road-col">
        <p className="oqa-road-end">LA</p>
        <div className="oqa-strip" ref={box}
          onPointerDown={(e) => { if (e.pointerType !== "mouse") return; drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); jump(e.clientY); }}
          onPointerMove={(e) => { if (drag.current) jump(e.clientY); }}
          onPointerUp={() => { drag.current = false; }}
          onPointerCancel={() => { drag.current = false; }}>
          {[canvas, fx, over].map((ref, k) => (
            <canvas key={k} ref={ref} width={W} height={HT}
              style={{ height: HT * pan.s, transform: `translateY(${pan.y}px)` }} />
          ))}
          <div className="oqa-road-here"><b>Day {stop.day}</b>{def.label ?? stop.place}</div>
          {lost && <p className="oqa-road-say" style={{ top: pan.y + (TRAIL.a - 4) * pan.s }}>&ldquo;hey Jason, turn right onto this trail&rdquo;</p>}
        </div>
        <p className="oqa-road-end">NYC</p>
      </div>
    </section>
  );
}
