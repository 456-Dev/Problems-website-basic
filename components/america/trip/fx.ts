// The moving layer: everything that animates, drawn every frame over the still map.
// Scenes push Live entries; new ones should just be { k: "fn", fn } closures.

import { W, roadX, hash } from "./core";

export type F = (x: number, y: number, w: number, h: number, c: string) => void;

export type Live =
  | { k: "fire"; x: number; y: number; w: number; h: number; ridge?: number[] }
  | { k: "plume"; x: number; y: number; w: number; rise: number }
  | { k: "bolt"; x: number; y: number; y1: number }
  | { k: "boom"; x: number; y: number; c: string; ph: number }
  | { k: "dogs"; x: number; y: number; w: number; h: number }
  | { k: "walk"; x0: number; x1: number; y: number; shirt: string; hat: string; ph: number; brim?: boolean; skin?: string }
  | { k: "club"; x: number; y: number; w: number; h: number }
  | { k: "bikers"; a: number; b: number }
  | { k: "bill"; x: number; y: number }
  | { k: "eyes"; pts: [number, number, string][] }
  | { k: "flag"; x: number; y: number; w: number; h: number; kind: "dixie" | "ferrari" | "weed" | "us" }
  | { k: "peek"; x: number; y: number }
  | { k: "glint"; x: number; y: number; w: number; h: number }
  | { k: "scoot"; a: number; b: number }
  | { k: "beast"; a: number; b: number }
  | { k: "falls"; x: number; y: number; w: number; h: number }
  | { k: "clouds"; y: number; h: number }
  | { k: "ferry"; x0: number; y0: number; x1: number; y1: number }
  | { k: "fn"; fn: (f: F, t: number, ctx: CanvasRenderingContext2D) => void };

export const FLAME = ["#ff3b1f", "#ff8a1f", "#ffd23f"];
export const DISCO = ["#ff5ad1", "#5af0ff", "#ffd23f", "#7a5aff", "#2faa4a", "#ff3b3b"];
export const PRIDE = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"];

export function drawLive(ctx: CanvasRenderingContext2D, now: number, still: boolean, live: Live[]) {
  const t = still ? 2.2 : now / 1000;
  const f = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  for (const L of live) {
    if (L.k === "fn") L.fn(f, t, ctx);
    else if (L.k === "fire") {
      const n = Math.floor((L.w * L.h) / 3), tick = Math.floor(t * 9);
      for (let k = 0; k < n; k++) {
        const x = L.x + Math.floor(hash(k * 3 + 1) * L.w);
        const base = L.ridge ? L.ridge[x] : L.y + L.h;
        const hgt = L.ridge ? 3 + hash(k * 5 + x) * L.h : L.h;
        const y = base - Math.floor(hash(k * 3 + 2) * hgt) - ((k + tick) % 3);
        if (L.ridge && y >= base) continue;
        f(x, y, 1, 1 + ((k + tick) % 2), FLAME[(k + tick) % 3]);
      }
    } else if (L.k === "plume") {
      for (let k = 0; k < 160; k++) {                      // smoke boils up off the fire and drifts away north-west, thinning out
        const life = (t * 0.05 + hash(k * 7 + 5)) % 1;
        const x = L.x + hash(k * 7 + 3) * L.w - life * 22 + Math.sin(life * 9 + k) * 4 * life, y = L.y - life * L.rise;
        const s = 2 + Math.floor(life * 5);
        ctx.globalAlpha = 0.75 * (1 - life); f(x, y, s, s, k % 3 ? "#7a7a7e" : "#a8a4a0"); ctx.globalAlpha = 1;
      }
    } else if (L.k === "bolt") {
      const u = (t % 3.4) / 3.4;
      if (u < 0.09) {
        let x = L.x;
        for (let y = L.y; y < L.y1; y++) { if (y % 3 === 0) x += hash(y * 31 + Math.floor(t / 3.4)) > 0.5 ? 1 : -1; f(x, y, 1, 1, u < 0.05 ? "#ffffff" : "#fff6a0"); }
        ctx.globalAlpha = 0.25; f(L.x - 30, L.y, 64, L.y1 - L.y + 12, "#e8f0ff"); ctx.globalAlpha = 1;
      }
    } else if (L.k === "boom") {
      const P = 2.6, u = ((t + L.ph) % P) / P;
      if (u < 0.2) f(L.x, L.y + 12 - (u / 0.2) * 12, 1, 2, "#fff6c0");
      else if (u < 0.85) {
        const r = 1 + ((u - 0.2) / 0.65) * 6;
        for (let a = 0; a < 10; a++) {
          const th = (a / 10) * 2 * Math.PI;
          f(L.x + r * Math.cos(th), L.y + r * Math.sin(th) + (u - 0.2) * 3, 1, 1, u > 0.7 && a % 2 ? "#fff6c0" : L.c);
        }
      }
    } else if (L.k === "dogs") {
      const per = 2 * (L.w + L.h);
      [[9, 0, "#8a5a2a"], [12, per / 2, "#f2f2f2"]].forEach(([v, off, c]) => {
        const p = (t * (v as number) + (off as number)) % per;
        let x: number, y: number;
        if (p < L.w) { x = L.x + p; y = L.y; } else if (p < L.w + L.h) { x = L.x + L.w; y = L.y + p - L.w; }
        else if (p < 2 * L.w + L.h) { x = L.x + L.w - (p - L.w - L.h); y = L.y + L.h; } else { x = L.x; y = L.y + L.h - (p - 2 * L.w - L.h); }
        f(x - 1, y - 1, 3, 2, c as string); f(x + 1, y - 2, 1, 1, c as string); f(x - 2, y - 2, 1, 1, c as string);
        const leg = Math.floor(t * 10) % 2; f(x - 1 + leg, y + 1, 1, 1, "#3a2a1a"); f(x + 1 - leg, y + 1, 1, 1, "#3a2a1a");
      });
    } else if (L.k === "walk") {
      const span = L.x1 - L.x0, p = (t * 3 + L.ph) % (2 * span), x = L.x0 + (p < span ? p : 2 * span - p);
      if (L.brim) { f(x - 1, L.y + 1, 5, 1, L.hat); f(x, L.y, 3, 1, L.hat); } else f(x, L.y, 3, 2, L.hat);
      f(x, L.y + 2, 3, 1, L.skin ?? "#e8c0a0"); f(x, L.y + 3, 3, 3, L.shirt);
      const leg = Math.floor(t * 4 + L.ph) % 2;
      f(x + leg, L.y + 6, 1, 2, "#2a2a3a"); f(x + 2 - leg, L.y + 6, 1, 2, "#2a2a3a");
    } else if (L.k === "club") {
      const tick = Math.floor(t * 6);
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        const r = hash(x * 97 + y * 13 + tick * 7919);
        if (r < 0.35) f(L.x + x, L.y + y, 1, 1, DISCO[Math.floor(r * 100) % DISCO.length]);
      }
    } else if (L.k === "bikers") {                       // a pack riding north in the other lane, pride flags up high
      for (let k = 0; k < 5; k++) {
        const y = L.b - ((t * 7 + k * 9) % (L.b - L.a)), x = Math.round(roadX(y)) + 1 + (k % 2);
        f(x, y, 2, 4, "#1a1a1a"); f(x, y + 1, 2, 1, ["#e0302f", "#3a6fd8", "#f2f2f2", "#ffd23f", "#2faa4a"][k]);
        f(x + 2, y + 1, 1, 1, "#e8c0a0");
        f(x + 2, y - 6, 1, 8, "#cfcfcf");
        for (let s = 0; s < 6; s++) { const wv = Math.round(Math.sin(t * 8 + s * 0.9 + k) * 0.8); f(x + 3 + s, y - 6 + wv, 1, 6, "#000"); for (let c = 0; c < 6; c++) f(x + 3 + s, y - 6 + wv + c, 1, 1, PRIDE[c]); }
      }
    } else if (L.k === "bill") {                         // Bill on the roof, blowing the sax, bobbing to it
      const bob = Math.floor(t * 2.5) % 2, x = L.x, r = L.y + bob;
      f(x + 3, r - 11, 4, 1, "#f2f2f2"); f(x + 3, r - 10, 4, 3, "#f0a888"); f(x + 3, r - 9, 4, 1, "#111"); f(x + 6, r - 8, 1, 1, "#d06a5a");
      f(x + 2, r - 7, 5, 5, "#2a2f4a"); f(x + 4, r - 7, 1, 3, "#e0302f"); f(x + 3, L.y - 2, 1, 2, "#2a2f4a"); f(x + 5, L.y - 2, 1, 2, "#2a2f4a");
      f(x + 7, r - 9, 1, 1, "#e8b830"); f(x + 8, r - 8, 1, 5, "#e8b830"); f(x + 9, r - 4 + bob, 2, 1, "#e8b830"); f(x + 10, r - 6 + bob, 2, 2, "#e8b830");
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.6 + k / 3) % 1, nx = x + 11 + u * 6 + Math.sin(u * 8 + k) * 1.5, ny = r - 7 - u * 12;
        ctx.globalAlpha = 1 - u; f(nx, ny, 1, 1, "#ffd23f"); f(nx + 1, ny - 3, 1, 3, "#ffd23f"); f(nx + 2, ny - 3, 1, 1, "#ffd23f"); ctx.globalAlpha = 1;
      }
    } else if (L.k === "eyes") {
      L.pts.forEach(([x, y, c], k) => { if ((t * 0.7 + hash(k)) % 1 > 0.12) { f(x, y, 1, 1, c); f(x + 2, y, 1, 1, c); } });
    } else if (L.k === "flag") {
      for (let x = 0; x < L.w; x++) {
        const wv = Math.round(Math.sin(t * 5 - x * 0.7) * 0.9 * (x / L.w));
        for (let y = 0; y < L.h; y++) f(L.x + x, L.y + y + wv, 1, 1, flagPx(L.kind, x, y, L.w, L.h));
      }
    } else if (L.k === "peek") {                         // the alien leans out from behind the trunk, looks, ducks back
      const u = (t % 4) / 4, out = u < 0.15 ? u / 0.15 : u < 0.55 ? 1 : u < 0.7 ? 1 - (u - 0.55) / 0.15 : 0;
      const x = L.x + Math.round(out * 4) - 2;
      f(x, L.y, 4, 4, "#6ae85a"); f(x + 1, L.y + 1, 1, 2, "#111"); f(x + 3, L.y + 1, 1, 2, "#111"); f(x, L.y - 2, 1, 2, "#6ae85a"); f(x + 3, L.y - 2, 1, 2, "#6ae85a");
      f(x + 1, L.y + 4, 2, 3, "#6ae85a");
      f(L.x - 2, L.y - 3, 3, 14, "#5a3a1a"); f(L.x - 1, L.y - 3, 1, 14, "#6a4a2a");     // the trunk, in front of him
    } else if (L.k === "glint") {
      for (let k = 0; k < 7; k++) if ((t * 1.3 + hash(k * 9)) % 1 < 0.3) f(L.x + hash(k * 3 + 1) * L.w, L.y + hash(k * 3 + 2) * L.h, 1, 1, "#f2fbff");
    } else if (L.k === "scoot") {                        // Lime scooters everywhere
      for (let k = 0; k < 9; k++) {
        const dir = k % 2 ? 1 : -1, span = L.b - L.a, p = (t * (10 + k * 1.7) + k * 23) % span, y = dir > 0 ? L.a + p : L.b - p;
        const side = k % 3 === 0 ? 0 : k % 3 === 1 ? -9 : 9, x = Math.round(roadX(y) + (side === 0 ? (dir > 0 ? -2 : 2) : side + (k % 2)));
        f(x, y, 1, 4, "#4ad62a"); f(x - 1, y + (dir > 0 ? 3 : 0), 3, 1, "#4ad62a"); f(x, y + 1, 1, 2, ["#e8c0a0", "#8a5a3a", "#c08a5a"][k % 3]);
        f(x, y + (dir > 0 ? 0 : 3), 1, 1, "#1a1a1a");
      }
    } else if (L.k === "beast") {                        // the motorcade north through D.C., the Beast in the middle
      const span = L.b - L.a, head = L.b - ((t * 9) % (span + 30));
      const car = (y: number, c: string, w = 3, h = 5) => { if (y > L.a && y < L.b) { const x = Math.round(roadX(y)) + 1; f(x, y, w, h, c); return x; } return -1; };
      const blink = Math.floor(t * 6) % 2;
      const m = car(head, "#1a1a1a", 2, 3); if (m >= 0) { f(m, head, 1, 1, blink ? "#3a6fff" : "#ff3b3b"); }
      car(head + 6, "#111"); const b = car(head + 13, "#0a0a0a", 3, 8);
      if (b >= 0) { f(b, head + 13, 1, 1, "#e0302f"); f(b + 2, head + 13, 1, 1, "#3a6fd8"); f(b + 1, head + 16, 1, 1, "#f2f2f2"); f(b + 1, head + 15, 1, 1, "#f0c8a0"); }
      car(head + 23, "#111"); const m2 = car(head + 30, "#1a1a1a", 2, 3); if (m2 >= 0) f(m2 + 1, head + 30, 1, 1, blink ? "#ff3b3b" : "#3a6fff");
    } else if (L.k === "falls") {
      for (let x = 0; x < L.w; x++) for (let k = 0; k < 3; k++) {
        const y = L.y + ((t * 30 + hash(x * 7 + k * 101) * L.h) % L.h);
        f(L.x + x, y, 1, 2, k ? "#e8f8ff" : "#ffffff");
      }
      for (let k = 0; k < 16; k++) {
        const u = (t * 0.5 + hash(k * 13)) % 1; ctx.globalAlpha = 0.7 * (1 - u);
        f(L.x - 2 + hash(k) * (L.w + 4), L.y + L.h - u * 7, 2, 1, "#ffffff"); ctx.globalAlpha = 1;
      }
    } else if (L.k === "clouds") {                       // a towering, churning cloud stack right before the island
      const blobs = 34;
      for (let k = 0; k < blobs; k++) {
        const r = 3 + hash(k * 5) * 7, cx = (hash(k * 11) * 72 - 4 + t * (1 + hash(k) * 2)) % 76 - 6;
        const cy = L.y + 6 + hash(k * 17) * (L.h - 12) + Math.sin(t * 0.7 + k) * 2;
        const lit = hash(k * 3) > 0.4;
        ctx.globalAlpha = 0.9;
        for (let dy = -r; dy <= r; dy++) { const ww = Math.round(Math.sqrt(r * r - dy * dy)); f(cx - ww, cy + dy, 2 * ww + 1, 1, dy < -r / 3 && lit ? "#ffffff" : dy > r / 2 ? "#9aa0b8" : "#d8dcea"); }
        ctx.globalAlpha = 1;
      }
      for (let k = 0; k < 5; k++) { ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t + k); f(6 + k * 12 + Math.sin(t * 0.3 + k) * 3, L.y, 2, L.h, "#fff6c0"); ctx.globalAlpha = 1; }
    } else if (L.k === "ferry") {
      const u = (Math.sin(t * 0.25) + 1) / 2, x = L.x0 + (L.x1 - L.x0) * u, y = L.y0 + (L.y1 - L.y0) * u;
      f(x - 1, y - 1, 4, 3, "#ff8a2a"); f(x, y - 1, 2, 1, "#f2f2f2");
      ctx.globalAlpha = 0.6; f(x - 2 * Math.sign(L.x1 - L.x0) * (Math.cos(t * 0.25) > 0 ? 1 : -1), y, 2, 1, "#e8f4ff"); ctx.globalAlpha = 1;
    }
  }
}

function flagPx(kind: string, x: number, y: number, w: number, h: number) {
  if (kind === "dixie") {                                // red field, blue saltire, white stars
    const a = Math.abs(y - (x * (h - 1)) / (w - 1)) < 1, b = Math.abs(y - ((w - 1 - x) * (h - 1)) / (w - 1)) < 1;
    return a || b ? ((x + y) % 3 === 0 ? "#f2f2f2" : "#2a3a8a") : "#c8202a";
  }
  if (kind === "ferrari") {                              // yellow, the black horse, a green-white-red stripe on top
    if (y === 0) return ["#2faa4a", "#f2f2f2", "#e0302f"][Math.floor((x * 3) / w)];
    const hx = x - Math.floor(w / 2) + 1, hy = y - 2;
    const horse = (hy >= 0 && hy < h - 3) && ((hx === 0) || (hx === 1 && hy < 3) || (hx === -1 && hy > 1) || (hx === 1 && hy === h - 4));
    return horse ? "#111" : "#ffd23f";
  }
  if (kind === "weed") {                                 // black flag, a green leaf
    const cx = Math.floor(w / 2), dx = Math.abs(x - cx), dy = y - 1;
    return (dy >= 0 && dy < h - 2 && (dx === 0 || (dx === 1 && dy > 1 && dy < h - 3) || (dx === 2 && (dy === 2 || dy === 3)))) ? "#3aa83a" : "#111";
  }
  return y < Math.ceil(h / 2) && x < Math.ceil(w / 2) ? ((x + y) % 2 ? "#f2f2f2" : "#2a3a8a") : y % 2 ? "#f2f2f2" : "#c8202a";
}

