"use client";

import { useEffect, useRef, useState } from "react";
import { stops } from "@/lib/america";
import {
  W, HT, ROAD_END, SCENES, SAYS, SEQ, sceneAt, roadX, vanX, vanAt, progressAt, holdAt, bendAt,
  drawStrip, drawLive, drawCanopy, type Strip, type HD,
} from "./pixelTrip";
import { drawSeq, panelAt } from "./trip/scare";
import { render3D, outSide, type Proj } from "./trip/pop3d";
import { drawUs } from "./trip/us";

// The 8-bit road trip at the bottom of the page: a phone-wide map seen from above,
// LA at the top and Staten Island at the bottom, a little landscape per stop. When you reach
// it, the frame holds still on screen and the map scrolls top to bottom as you keep
// scrolling, our white minivan driving the highway with you. Here and there the van
// parks for a bit while something happens. Click or drag to jump.

const CAR_COLORS = ["#e0302f", "#3a6fd8", "#ffd23f", "#2faa4a", "#ff8a1f", "#b04ad8", "#8a8a8a", "#e8e8e8"];

type Car = { south: boolean; y: number; v: number; c: string };

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
  const plane = useRef<HTMLDivElement>(null);
  const v3in = useRef<HTMLCanvasElement>(null);      // the 3D van etc. inside the map (under bridges and trees)
  const v3out = useRef<HTMLCanvasElement>(null);     // ...and over it, when the map tilts away in Kansas
  const panR = useRef({ y: 0, s: 4 });
  const holdR = useRef<{ i: number; u: number } | null>(null);
  const [music, setMusic] = useState(false);              // the 8-bit song (Chip.tsx) playing?
  useEffect(() => {
    const on = (e: Event) => setMusic((e as CustomEvent<boolean>).detail);
    addEventListener("oqa-music-state", on);
    return () => removeEventListener("oqa-music-state", on);
  }, []);

  const cost = useRef(0);                              // ms the 3D layer takes per frame (it backs off on slow phones)
  // how far out of the van we are: we get out at every hold but the crash
  const outAt = () => {
    const h = holdR.current, sm = (u: number) => { const v = Math.min(1, Math.max(0, u)); return v * v * (3 - 2 * v); };
    return h && h.i !== SEQ.hold ? sm(h.u / 0.15) * sm((1 - h.u) / 0.15) : 0;
  };
  // the van, Jason and me, and whatever pops up out of Kansas: real 3D, drawn every frame
  const draw3D = (t: number) => {
    const b = box.current, pl = plane.current;
    if (!b || !pl) return;
    const vy = van.current, bend = bendAt(vy), tilted = bend.tilt > 0 || bend.spin > 0;
    const use = tilted ? v3out.current : v3in.current, other = tilted ? v3in.current : v3out.current;
    if (!use) return;
    const dpr = tilted ? 1 : Math.min(1.5, devicePixelRatio || 1), cw = b.clientWidth, ch = b.clientHeight;
    if (v3in.current) v3in.current.style.display = tilted ? "none" : "";
    for (const c of [use, other]) if (c && (c.width !== Math.round(cw * dpr) || c.height !== Math.round(ch * dpr))) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); }
    other?.getContext("2d")?.clearRect(0, 0, other.width, other.height);
    const g = use.getContext("2d");
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
    const { y: py, s } = panR.current, lean = 0.55 * (1 - bend.tilt);
    let proj: Proj;
    if (!tilted) proj = (x, y, z) => [x * s, py + y * s - z * s * lean, -(y + z * 0.5)];
    else {
      const tr = getComputedStyle(pl).transform, M = new DOMMatrix(tr === "none" ? undefined : tr), ox = cw / 2, oy = ch / 2;
      const zs = 1 + bend.spin * 1.25 + bend.tilt * 0.5;              // the CSS scale() is 2D: heights need it too
      const { m11, m12, m14, m21, m22, m24, m31, m32, m34, m41, m42, m44 } = M;
      proj = (x, y, z) => {                                          // M · (x, y, z, 1), no allocations
        const X = x * s - ox, Y = py + y * s - oy, Z = z * s * zs;
        const w = m14 * X + m24 * Y + m34 * Z + m44;
        if (w <= 0.05) return null;
        return [(m11 * X + m21 * Y + m31 * Z + m41) / w + ox, (m12 * X + m22 * Y + m32 * Z + m42) / w + oy - z * s * lean, w * 1000 - (y + z * 0.5) * 0.01];
      };
    }
    const a = vanX(vy + 2) - vanX(vy - 2), n = Math.hypot(a, 4);
    const out = outAt();
    render3D(g, { proj, t, vy, spin: bend.spin, dusk: bend.dusk, van: { x: vanX(vy), y: vy, fx: a / n, fy: 4 / n }, out, side: outSide(vy), w: cw, h: ch, pops: true, near: bend.tilt < 0.3, max: cost.current > 12 ? 6 : tilted ? 14 : 20 });
  };


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
      { const vy = van.current, o = outAt(), f = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
        if (o > 0) drawUs(f, still ? 0 : now / 1000, vanX(vy), vy, o, outSide(vy)); }
      const t0 = performance.now();
      draw3D(still ? 0 : now / 1000);
      cost.current = cost.current * 0.9 + (performance.now() - t0) * 0.1;
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
      setSeq(seqU.current); setHold(hd); holdR.current = hd;
      setVy(van.current);
      panR.current = { s, y: Math.min(0, Math.max(b.clientHeight - HT * s, b.clientHeight * 0.5 - van.current * s)) };
      setPan(panR.current);
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
  // the plane tips back, then swings round so we're driving left to right across the screen
  const map = { transform: bend.tilt || bend.spin ? `perspective(700px) rotateX(${(bend.tilt * 62).toFixed(2)}deg) rotateZ(${(-bend.spin * 90).toFixed(2)}deg) scale(${(1 + bend.spin * 1.25 + bend.tilt * 0.5).toFixed(3)})` : undefined };

  return (
    <section className="oqa-trek" id="trip" ref={sec} aria-label="The road trip, LA to NYC" style={{ height: `${Math.round((HT / 128) * 52)}vh` }}>
      <div className="oqa-road-col">
        <p className="oqa-road-end">LA</p>
        <div className="oqa-strip" ref={box}
          onPointerDown={(e) => { if (e.pointerType !== "mouse") return; drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); jump(e.clientY); }}
          onPointerMove={(e) => { if (drag.current) jump(e.clientY); }}
          onPointerUp={() => { drag.current = false; }}
          onPointerCancel={() => { drag.current = false; }}>
          {(bend.tilt > 0 || bend.spin > 0) && <div className="oqa-sky" style={{ opacity: Math.max(bend.tilt, bend.spin) }} />}
          <div className="oqa-plane" style={map} ref={plane}>
          <canvas ref={canvas} width={W} height={HT} style={{ height: HT * pan.s, transform: `translateY(${pan.y}px)` }} />
          {hds.map((h, k) => !h.top && (
            <canvas key={k} ref={(el) => { hdEls.current[k] = el; }} className="oqa-hd" width={Math.round(h.w * (h.res ?? 8))} height={Math.round(h.h * (h.res ?? 8))}
              style={{ left: h.x * pan.s, width: h.w * pan.s, height: h.h * pan.s, transform: `translateY(${pan.y + h.y * pan.s}px)` }} />
          ))}
          <canvas ref={fx} width={W} height={HT} style={{ height: HT * pan.s, transform: `translateY(${pan.y}px)` }} />
          <canvas ref={v3in} className="oqa-3d" aria-hidden />
          <canvas ref={over} width={W} height={HT} style={{ height: HT * pan.s, transform: `translateY(${pan.y}px)` }} />
          {hds.map((h, k) => h.top && (
            <canvas key={k} ref={(el) => { hdEls.current[k] = el; }} className="oqa-hd top" width={Math.round(h.w * (h.res ?? 8))} height={Math.round(h.h * (h.res ?? 8))}
              style={{ left: h.x * pan.s, width: h.w * pan.s, height: h.h * pan.s, transform: `translateY(${pan.y + h.y * pan.s}px)` }} />
          ))}
          </div>
          {bend.dusk > 0 && <div className="oqa-dusk" style={{ opacity: bend.dusk * 0.6 }} />}
          <canvas ref={v3out} className="oqa-3d" aria-hidden />
          <canvas ref={scareEl} key={seq < 0 ? "off" : panelAt(seq)} className={`oqa-seq${seq >= 0 ? " on" : ""}`} width={384} height={384} aria-hidden />
          <div className="oqa-road-here"><b>{day(stop.date)}</b>{def.label ?? stop.place}</div>
          {says.map((q) => (
            <p key={q.text} className={`oqa-road-say ${q.who}${q.href ? " link" : ""}`} style={{ top: Math.max(150, pan.y + (vy - 9) * pan.s) }}>
              {q.href ? <a href={q.href} target="_blank" rel="noopener">{q.text}</a> : q.text}</p>
          ))}
          <button type="button" className={`oqa-music${music ? " on" : ""}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => dispatchEvent(new Event("oqa-music"))}
            aria-label={music ? "Pause the music" : "Play the music"}>{music ? "♫ ON ❚❚" : "♫ MUSIC ▶"}</button>
        </div>
        <p className="oqa-road-end">STATEN ISLAND</p>
      </div>
    </section>
  );
}
