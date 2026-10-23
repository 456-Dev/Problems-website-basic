"use client";

import { useEffect, useRef, useState } from "react";
import { stops } from "@/lib/america";
import {
  W, HT, ROAD_END, SCENES, SAYS, SEQ, sceneAt, roadX, vanX, vanAt, progressAt, holdAt, bendAt,
  drawStrip, drawLive, drawCanopy, type Strip, type HD,
} from "./pixelTrip";
import { drawSeq, panelAt } from "./trip/scare";

// The 8-bit road trip at the bottom of the page: a phone-wide map seen from above,
// LA at the top and Staten Island at the bottom, a little landscape per stop. When you reach
// it, the frame holds still on screen and the map scrolls top to bottom as you keep
// scrolling, our white minivan driving the highway with you. Here and there the van
// parks for a bit while something happens. Click or drag to jump.

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

// "July 4th 2024" → "July 4th"
const day = (d: string) => d.replace(/\s*\d{4}$/, "");

export default function RoadRail() {
  const [vy, setVy] = useState(12);              // the van's row on the strip
  const van = useRef(12);
  const [pan, setPan] = useState({ y: 0, s: 4 });   // map offset (css px) and pixel scale
  const [seq, setSeq] = useState(-1);               // the crash sequence: -1 = off, else 0..1 through it
  const seqU = useRef(-1);
  const [hold, setHold] = useState<{ i: number; u: number } | null>(null);
  const sec = useRef<HTMLElement>(null);
  const drag = useRef(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const over = useRef<HTMLCanvasElement>(null);
  const strip = useRef<Strip>({ live: [], hd: [], canopy: [], says: [] });
  const [hds, setHds] = useState<HD[]>([]);
  const hdEls = useRef<(HTMLCanvasElement | null)[]>([]);
  const scareEl = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);

  // the landscape, drawn once
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) strip.current = drawStrip(ctx);
    setHds(strip.current.hd);
    const o = over.current?.getContext("2d");
    if (o) drawCanopy(o, strip.current.canopy);
  }, []);

  // the hi-res bits (Green Bank's dish, the alien, the clouds...): on purpose nothing like the pixels around them
  useEffect(() => {
    hds.forEach((h, k) => { const c = hdEls.current[k], g = c?.getContext("2d"); if (c && g) h.draw(g, c.width, c.height, 2.2, van.current); });
  }, [hds]);

  // traffic, the van, and everything else that moves
  useEffect(() => {
    const ctx = fx.current?.getContext("2d");
    if (!ctx) return;
    let seed = 11;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const cars: Car[] = Array.from({ length: 70 }, (_, i) => ({
      south: i % 2 === 1, y: rnd() * ROAD_END, v: 12 + rnd() * 14, c: CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)],
    }));
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, HT);
      for (const car of cars) {
        if (!still) car.y = (car.y + (car.south ? 1 : -1) * car.v * dt + ROAD_END) % ROAD_END;
        // seen from above: southbound keeps to the left lane (screen right of travel), northbound the other
        const y = Math.round(car.y), x = Math.round(roadX(y) + (car.south ? -3 : 1));
        ctx.fillStyle = car.c; ctx.fillRect(x, y, 2, 4);
        ctx.fillStyle = "#1a2a3a"; ctx.fillRect(x, car.south ? y + 2 : y + 1, 2, 1);       // windshield faces forward
        ctx.fillStyle = car.south ? "#ff3b3b" : "#fff6a0"; ctx.fillRect(x, y, 2, 1);
      }
      drawLive(ctx, now, still, strip.current.live);
      drawVan(ctx, van.current);
      if (!still) strip.current.hd.forEach((h, k) => {
        if (!h.anim) return;
        const c = hdEls.current[k], g = c?.getContext("2d");
        if (!c || !g) return;
        const r = c.getBoundingClientRect();                      // only the ones on screen
        if (r.bottom < -50 || r.top > innerHeight + 50) return;
        h.draw(g, c.width, c.height, now / 1000, van.current);
      });
      const sc = scareEl.current, sg = sc?.getContext("2d");
      if (sc && sg && seqU.current >= 0) drawSeq(sg, sc.width, sc.height, seqU.current, now / 1000);
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
      van.current = vanAt(p);
      const hd = holdAt(p);
      seqU.current = hd && hd.i === SEQ.hold ? hd.u : -1;
      setSeq(seqU.current); setHold(hd);
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
    const p = progressAt(Math.min(ROAD_END, Math.max(12, y)));
    scrollTo({ top: sc.offsetTop + p * (sc.offsetHeight - innerHeight) });
  };

  const def = SCENES[sceneAt(vy)];
  const stop = stops[def.stop];
  const says = [...SAYS, ...strip.current.says].filter((q) => vy >= q.a && vy < q.b
    && (q.hold === undefined || (hold && hold.i === q.hold && hold.u >= (q.u0 ?? 0) && hold.u < (q.u1 ?? 1.01)) || (!hold && vy < q.b - 1)));
  const bend = bendAt(vy);
  const map = { transform: bend.tilt ? `perspective(900px) rotateX(${(bend.tilt * 38).toFixed(2)}deg) scale(${(1 + bend.tilt * 0.25).toFixed(3)})` : undefined };

  return (
    <section className="oqa-trek" ref={sec} aria-label="The road trip, LA to NYC" style={{ height: `${Math.round((HT / 128) * 52)}vh` }}>
      <div className="oqa-road-col">
        <p className="oqa-road-end">LA</p>
        <div className="oqa-strip" ref={box}
          onPointerDown={(e) => { if (e.pointerType !== "mouse") return; drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); jump(e.clientY); }}
          onPointerMove={(e) => { if (drag.current) jump(e.clientY); }}
          onPointerUp={() => { drag.current = false; }}
          onPointerCancel={() => { drag.current = false; }}>
          <div className="oqa-plane" style={map}>
          <canvas ref={canvas} width={W} height={HT} style={{ height: HT * pan.s, transform: `translateY(${pan.y}px)` }} />
          {hds.map((h, k) => !h.top && (
            <canvas key={k} ref={(el) => { hdEls.current[k] = el; }} className="oqa-hd" width={Math.round(h.w * (h.res ?? 8))} height={Math.round(h.h * (h.res ?? 8))}
              style={{ left: h.x * pan.s, width: h.w * pan.s, height: h.h * pan.s, transform: `translateY(${pan.y + h.y * pan.s}px)` }} />
          ))}
          {[fx, over].map((ref, k) => (
            <canvas key={k} ref={ref} width={W} height={HT}
              style={{ height: HT * pan.s, transform: `translateY(${pan.y}px)` }} />
          ))}
          {hds.map((h, k) => h.top && (
            <canvas key={k} ref={(el) => { hdEls.current[k] = el; }} className="oqa-hd top" width={Math.round(h.w * (h.res ?? 8))} height={Math.round(h.h * (h.res ?? 8))}
              style={{ left: h.x * pan.s, width: h.w * pan.s, height: h.h * pan.s, transform: `translateY(${pan.y + h.y * pan.s}px)` }} />
          ))}
          </div>
          {bend.dusk > 0 && <div className="oqa-dusk" style={{ opacity: bend.dusk }} />}
          <canvas ref={scareEl} key={seq < 0 ? "off" : panelAt(seq)} className={`oqa-seq${seq >= 0 ? " on" : ""}`} width={384} height={384} aria-hidden />
          <div className="oqa-road-here"><b>{day(stop.date)}</b>{def.label ?? stop.place}</div>
          {says.map((q) => (
            <p key={q.text} className={`oqa-road-say ${q.who}${q.href ? " link" : ""}`} style={{ top: pan.y + (vy - 9) * pan.s }}>
              {q.href ? <a href={q.href} target="_blank" rel="noopener">{q.text}</a> : q.text}</p>
          ))}
        </div>
        <p className="oqa-road-end">STATEN ISLAND</p>
      </div>
    </section>
  );
}
