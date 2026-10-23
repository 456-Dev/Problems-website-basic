// The sprite kit for the trip: little reusable pixel things (trees, people, buildings, letters, flags)
// plus the types every scene module shares.

import { W, roadX } from "./core";
import type { Say } from "./core";
import type { Live } from "./fx";

export type Px = (x: number, y: number, w: number, h: number, c: string) => void;
// something drawn on its own smooth hi-res canvas over the pixels (res = canvas px per map px)
export type HD = { x: number; y: number; w: number; h: number; res?: number; top?: boolean; anim?: boolean; draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, vy: number) => void };
export type Fn = (f: Px) => void;
export type Ctx = {
  ctx: CanvasRenderingContext2D; px: Px; y0: number; h: number; rnd: () => number;
  live: Live[];      // things that move (fx.ts)
  hd: HD[];          // hi-res overlays
  canopy: Fn[];      // static things drawn above the van (bridges, trees over a trail)
  glow: Fn[];        // lights drawn after the night tint
  says: Say[];       // speech bubbles: shown while the van is between rows a and b (see core Say)
};
export type SceneMod = {
  ground?: [string, string];
  night?: boolean;                 // tint the scene dark after drawing, then draw its glow
  edge?: Edge;                     // scattered filler beside the road
  under?: (c: Ctx) => void;        // big ground pieces, drawn before the road
  draw?: (c: Ctx) => void;         // landmarks, drawn after the road
};

export function palm(px: Px, x: number, y: number) {
  px(x, y, 1, 9, "#7a4a22");
  px(x - 3, y, 3, 1, "#2f8a3a"); px(x + 1, y, 3, 1, "#2f8a3a"); px(x - 4, y + 1, 1, 1, "#2f8a3a"); px(x + 4, y + 1, 1, 1, "#2f8a3a");
  px(x - 2, y - 1, 5, 1, "#3faa4a"); px(x - 1, y - 2, 3, 1, "#3faa4a");
}
export function pine(px: Px, x: number, y: number, c = "#1f5a2a") {
  for (let r = 0; r < 6; r++) px(x - Math.floor(r / 2), y + r, 1 + 2 * Math.floor(r / 2), 1, c);
  px(x, y + 6, 1, 2, "#5a3a1a");
}
export function peak(px: Px, x: number, y: number, h: number, c = "#6a6f7a", snow = "#f2f2f2") {
  for (let r = 0; r < h; r++) px(x - r, y + r, 2 * r + 1, 1, r < h / 3 ? snow : c);
}
export function bldg(px: Px, x: number, y: number, w: number, h: number, c: string, win: string, rnd: () => number) {
  px(x, y, w, h, c);
  for (let yy = y + 1; yy < y + h - 1; yy += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rnd() > 0.35) px(xx, yy, 1, 1, win);
}
export function stars(px: Px, x: number, y: number, w: number, h: number, rnd: () => number, k = 6) {
  for (let i = 0; i < k; i++) px(x + Math.floor(rnd() * w), y + Math.floor(rnd() * h), 1, 1, "#ffffff");
}
// a river across the whole stop; the road crosses it on a bridge
export function river(px: Px, y: number, h: number, c = "#2f6fb0") {
  px(0, y, W, h, c); px(0, y + 1, W, 1, "#5f9fe0");
  for (let yy = y - 1; yy < y + h + 1; yy++) { px(roadX(yy) - 6, yy, 13, 1, "#8a8a92"); px(roadX(yy) - 4, yy, 9, 1, "#3a3a3e"); if (yy % 6 < 3) px(roadX(yy), yy, 1, 1, "#ffd23f"); }
}
// a little person, 3 wide and 8 tall
export function person(px: Px, x: number, y: number, shirt: string, hat = "#3a2a1a", pants = "#2a2a3a", skin = "#e0b090") {
  px(x, y, 3, 1, hat); px(x, y + 1, 3, 2, skin); px(x, y + 3, 3, 3, shirt);
  px(x, y + 6, 1, 2, pants); px(x + 2, y + 6, 1, 2, pants);
}
export function cowboy(px: Px, x: number, y: number, shirt: string, hat = "#c8a060") {
  px(x - 1, y + 1, 5, 1, hat); px(x, y, 3, 1, hat); px(x, y + 2, 3, 1, "#e0b090");
  px(x, y + 3, 3, 3, shirt); px(x, y + 6, 1, 2, "#3a5a8a"); px(x + 2, y + 6, 1, 2, "#3a5a8a");
}
// patchwork crop fields, center-pivot circles (the plains seen from the plane window)
export function fields(px: Px, rnd: () => number, y0: number, h: number, pal: string[]) {
  for (let y = y0; y < y0 + h; ) {
    const fh = 10 + Math.floor(rnd() * 12);
    for (let x = 0; x < W; ) {
      const fw = 10 + Math.floor(rnd() * 14), c = pal[Math.floor(rnd() * pal.length)];
      const hh = Math.min(fh, y0 + h - y);
      px(x, y, fw, hh, c);
      for (let k = 1; k < hh; k += 2) px(x, y + k, fw, 1, shade(c));
      px(x, y, fw, 1, "#c8a85a");
      x += fw;
    }
    y += fh;
  }
}
export function pivot(px: Px, cx: number, cy: number, r: number, c = "#4ab83a") {
  for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k)); px(cx - ww, cy + k, 2 * ww + 1, 1, k % 2 ? c : shade(c)); }
  px(cx, cy, r, 1, "#cfcfcf");
}
export const shade = (c: string) => "#" + [1, 3, 5].map((i) => Math.max(0, parseInt(c.slice(i, i + 2), 16) - 22).toString(16).padStart(2, "0")).join("");

export function smokies(ctx: CanvasRenderingContext2D, px: Px, y0: number, h: number) {
  const LAYERS = ["#a8c4cc", "#84a4b8", "#62829e", "#456482", "#2e4a64"], step = (h - 26) / 5;
  LAYERS.forEach((c, k) => {
    const base = y0 + 12 + k * step, amp = 3 + k;
    for (let x = 0; x < W; x++) {
      const hh = amp * (0.6 * Math.sin(x / (5 + k * 2) + k * 1.7) + 0.4 * Math.sin(x / (2.3 + k) + k));
      const top = Math.round(base - hh);
      px(x, top, 1, base + step + 2 - top, c);
    }
    if (k < LAYERS.length - 1) {
      ctx.globalAlpha = 0.6; px(0, base + 3, W, 2, "#eef4f6");
      ctx.globalAlpha = 0.25; px(0, base + 2, W, 1, "#eef4f6"); px(0, base + 5, W, 1, "#eef4f6");
      ctx.globalAlpha = 1;
    }
  });
}
export function windmill(px: Px, x: number, y: number) {
  for (let r = 0; r < 13; r++) { px(x - Math.floor(r / 4), y + r, 1, 1, "#8a8a8a"); px(x + Math.floor(r / 4), y + r, 1, 1, "#8a8a8a"); }
  for (let r = 3; r < 13; r += 3) px(x - Math.floor(r / 4), y + r, 2 * Math.floor(r / 4) + 1, 1, "#8a8a8a");
  for (const [dx, dy] of [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]]) px(x + dx, y - 1 + dy, 1, 1, "#e8e8e8");
  px(x, y - 1, 1, 1, "#444"); px(x + 1, y - 1, 4, 1, "#9a9a9a"); px(x + 4, y - 3, 1, 3, "#e0302f");
}
export function turbine(px: Px, x: number, y: number) {
  px(x, y, 1, 16, "#e8e8e8"); px(x - 1, y - 1, 3, 2, "#f2f2f2");
  px(x, y - 8, 1, 7, "#f2f2f2");
  for (let k = 1; k < 6; k++) { px(x + k, y + Math.ceil(k * 0.6), 1, 1, "#f2f2f2"); px(x - k, y + Math.ceil(k * 0.6), 1, 1, "#f2f2f2"); }
}
export const GLYPH: Record<string, string> = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", K: "101101110101101",
  L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "111101101101111", P: "110101110100100",
  Q: "010101101111011", R: "110101110101101", S: "111100111001111", T: "111010010010010", U: "101101101101111", V: "101101101101010",
  W: "101101111111101", X: "101101010101101", Y: "101101010010010", " ": "000000000000000",
};
export function word(px: Px, x: number, y: number, s: string, fg = "#111", bg: string | null = "#ffd23f") {
  [...s].forEach((ch, n) => {
    if (bg) px(x + n * 4 - 1, y - 1, 5, 7, bg);
    GLYPH[ch].split("").forEach((bit, k) => { if (bit === "1") px(x + n * 4 + (k % 3), y + Math.floor(k / 3), 1, 1, fg); });
  });
}
export const wordW = (s: string) => s.length * 4 - 1;

export type Edge = (px: Px, x: number, y: number) => void;
export const ePine: Edge = (px, x, y) => pine(px, x + 3, y);
export const ePalm: Edge = (px, x, y) => palm(px, x + 4, y + 2);
export const eCactus: Edge = (px, x, y) => { px(x + 3, y, 2, 8, "#2f8a3a"); px(x + 1, y + 2, 1, 3, "#2f8a3a"); px(x + 1, y + 4, 2, 1, "#2f8a3a"); px(x + 6, y + 1, 1, 3, "#2f8a3a"); px(x + 5, y + 3, 2, 1, "#2f8a3a"); };
export const eHay: Edge = (px, x, y) => { px(x + 1, y + 2, 5, 4, "#d8b048"); px(x + 2, y + 3, 3, 2, "#b88f2a"); };
export const eTree: Edge = (px, x, y) => { px(x + 1, y, 5, 5, "#2f7a2a"); px(x, y + 1, 7, 3, "#2f7a2a"); px(x + 2, y + 1, 2, 1, "#5aa84a"); px(x + 3, y + 5, 1, 2, "#5a3a1a"); };
export const eDogwood: Edge = (px, x, y) => { px(x + 1, y, 5, 5, "#f2a8c8"); px(x, y + 1, 7, 3, "#f2a8c8"); px(x + 2, y + 1, 2, 1, "#ffffff"); px(x + 3, y + 5, 1, 2, "#5a3a1a"); };
export const eHouse: Edge = (px, x, y) => { px(x + 1, y + 3, 6, 4, "#e8e2d0"); px(x, y + 1, 8, 2, "#7a2f1f"); px(x + 3, y + 5, 1, 2, "#5a3a1a"); };
export const eRock: Edge = (px, x, y) => { px(x + 1, y + 3, 5, 3, "#8a7a6a"); px(x + 2, y + 2, 3, 1, "#a8988a"); };
export const eCow: Edge = (px, x, y) => { px(x + 1, y + 3, 5, 3, "#7a4a2a"); px(x + 6, y + 2, 2, 2, "#7a4a2a"); px(x + 1, y + 6, 1, 1, "#3a2a1a"); px(x + 5, y + 6, 1, 1, "#3a2a1a"); };
export const eSunflower: Edge = (px, x, y) => { for (const [dx, dy] of [[1, 1], [5, 2], [3, 4], [6, 6], [1, 6]]) { px(x + dx, y + dy, 2, 2, "#ffd21f"); px(x + dx, y + dy, 1, 1, "#6a3a1a"); } };
export const eOwl: Edge = (px, x, y) => { px(x + 3, y + 2, 1, 6, "#6a4a2a"); px(x + 2, y, 3, 3, "#6a5a4a"); px(x + 2, y + 1, 1, 1, "#ffd23f"); px(x + 4, y + 1, 1, 1, "#ffd23f"); };
export const pick = (...k: Edge[]): Edge => { let n = 0; return (px, x, y) => k[n++ % k.length](px, x, y); };



// a still American flag, w x h (canton top-left; stars as a dot pattern)
export function usFlag(px: Px, x: number, y: number, w: number, h: number) {
  for (let r = 0; r < h; r++) px(x, y + r, w, 1, r % 2 ? "#f2f2f2" : "#c8202a");
  const cw = Math.ceil(w * 0.45), chh = Math.ceil(h * 0.55);
  px(x, y, cw, chh, "#2a3a8a");
  for (let r = 0; r < chh; r++) for (let c = r % 2; c < cw; c += 2) if (r % 2 === 0 || c > 0) px(x + c, y + r, 1, 1, (r + c) % 2 ? "#2a3a8a" : "#f2f2f2");
}
// a flag on a pole, pole first: h = pole height
export function flagPole(px: Px, x: number, y: number, h = 10, fw = 5, fh = 3) {
  px(x, y, 1, h, "#cfcfcf"); px(x, y - 1, 1, 1, "#ffd23f"); usFlag(px, x + 1, y, fw, fh);
}
