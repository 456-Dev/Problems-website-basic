// Draws the 8-bit road trip strip: one little landscape per stop (some stops share
// one), top (LA) to bottom (NYC), with a highway winding through all of them.
// Pure canvas, no assets. drawStrip = the still map, drawLive = the moving bits,
// drawCanopy = trees that sit above the van (the Smokies trail).

export const W = 64;      // strip width in "pixels"
const OX = 12;            // the original 40-wide trip sits in the middle, with country on both sides

export type Scene =
  | "venice" | "oc" | "vegas" | "desert" | "arches" | "vail" | "lake" | "denver" | "truckstop" | "silo"
  | "plains" | "tulsa" | "oregon" | "clinton" | "casino" | "graceland" | "nashville" | "gatlinburg"
  | "smoky" | "waffle" | "fair" | "dish" | "dc" | "jersey" | "liberty";

// in driving order; `stop` = index into lib/america.ts stops, label overrides the place name
export type Def = { sc: Scene; h: number; stop: number; label?: string };
export const SCENES: Def[] = [
  { sc: "venice", h: 80, stop: 0 }, { sc: "oc", h: 92, stop: 1 }, { sc: "vegas", h: 92, stop: 2 },
  { sc: "desert", h: 64, stop: 3 }, { sc: "arches", h: 84, stop: 4 }, { sc: "vail", h: 80, stop: 5 },
  { sc: "lake", h: 116, stop: 6 }, { sc: "denver", h: 64, stop: 7 }, { sc: "truckstop", h: 80, stop: 8 },
  { sc: "silo", h: 72, stop: 9 }, { sc: "plains", h: 84, stop: 10 }, { sc: "tulsa", h: 108, stop: 11 },
  { sc: "oregon", h: 84, stop: 12 }, { sc: "clinton", h: 84, stop: 13, label: "Little Rock" },
  { sc: "casino", h: 96, stop: 15, label: "Horseshoe · Hernando" },
  { sc: "graceland", h: 112, stop: 17, label: "Graceland · Memphis" },
  { sc: "nashville", h: 116, stop: 19, label: "Nashville · Buc-ee's" },
  { sc: "gatlinburg", h: 100, stop: 21 }, { sc: "smoky", h: 96, stop: 22 }, { sc: "waffle", h: 84, stop: 23 },
  { sc: "fair", h: 64, stop: 24 }, { sc: "dish", h: 88, stop: 25 }, { sc: "dc", h: 64, stop: 27 },
  { sc: "jersey", h: 76, stop: 28 }, { sc: "liberty", h: 64, stop: 29 },
];
export const Y0: number[] = [];
export const HT = SCENES.reduce((a, d) => (Y0.push(a), a + d.h), 0);
export const sceneAt = (y: number) => { let i = 0; while (i < SCENES.length - 1 && Y0[i + 1] <= y) i++; return i; };

const GROUND: Record<Scene, [string, string]> = {
  venice: ["#e8c98a", "#d9b56f"], oc: ["#7fae4a", "#709c40"], vegas: ["#2a1d3a", "#3a2850"],
  desert: ["#d98c4a", "#c4763a"], arches: ["#cf6f3c", "#b85c2e"], vail: ["#4f8a42", "#457a3a"],
  lake: ["#3f7a3a", "#35693a"], denver: ["#6c8a3e", "#5f7a35"], truckstop: ["#d8b54a", "#c9a23c"],
  silo: ["#d1ad48", "#bf9a3a"], plains: ["#d8b54a", "#c9a23c"], tulsa: ["#8a9a4a", "#7c8b41"],
  oregon: ["#a8945a", "#968250"], clinton: ["#5c8a3e", "#517a36"], casino: ["#3a5a32", "#33502c"],
  graceland: ["#5f9a45", "#548a3c"], nashville: ["#2a3448", "#333d55"], gatlinburg: ["#2f6b3a", "#285c32"],
  smoky: ["#2f6b3a", "#285c32"], waffle: ["#4f8a3c", "#457a35"], fair: ["#5f9a45", "#548a3c"],
  dish: ["#5a8f42", "#4f7f3a"], dc: ["#6aa04a", "#5d9041"], jersey: ["#4f7a3a", "#456b33"], liberty: ["#2f5f8a", "#28527a"],
};

export const roadX = (y: number) => OX + 20 + 9 * Math.sin(y / 23) + 3 * Math.sin(y / 7.3);

// the Smokies: the van turns off onto a trail and vanishes under the trees
const SMOKY = SCENES.findIndex((d) => d.sc === "smoky");
export const TRAIL = { a: Y0[SMOKY] + 24, b: Y0[SMOKY] + 74 };
const TDIR = roadX((TRAIL.a + TRAIL.b) / 2) > OX + 20 ? -1 : 1;
export function vanX(y: number) {
  if (y <= TRAIL.a || y >= TRAIL.b) return roadX(y);
  return roadX(y) + TDIR * 16 * Math.sin((Math.PI * (y - TRAIL.a)) / (TRAIL.b - TRAIL.a));
}

type Px = (x: number, y: number, w: number, h: number, c: string) => void;

// x for something w wide, h tall at row y, on whichever side of the road has more room
function free(y: number, h: number, w: number) {
  let lo = 99, hi = 0;
  for (let k = 0; k <= h; k++) { const r = roadX(y + k); lo = Math.min(lo, r); hi = Math.max(hi, r); }
  const left = lo - 6, right = W - 1 - (hi + 6);
  if (left >= right) return Math.max(1, Math.round((left - w) / 2) + 1);
  return Math.min(W - 1 - w, Math.round(hi + 6 + (right - w) / 2));
}

// moving things, positioned while the map is drawn
export type Live =
  | { k: "fire"; x: number; y: number; w: number; h: number }
  | { k: "boom"; x: number; y: number; c: string; ph: number }
  | { k: "dogs"; x: number; y: number; w: number; h: number }
  | { k: "walk"; x0: number; x1: number; y: number; shirt: string; hat: string; ph: number }
  | { k: "club"; x: number; y: number; w: number; h: number };

export function drawStrip(ctx: CanvasRenderingContext2D): Live[] {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const px: Px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const live: Live[] = [];

  SCENES.forEach(({ sc, h }, i) => {
    const y0 = Y0[i];
    const [g1, g2] = GROUND[sc];
    px(0, y0, W, h, g1);
    for (let k = 0; k < h * 1.1; k++) px(Math.floor(rnd() * W), y0 + Math.floor(rnd() * h), 1, 1, g2);
    if (sc === "smoky") smokies(ctx, px, y0, h);
    if (sc === "lake") rockies(ctx, px, y0);
    if (sc === "plains") for (let r = 0; r < h; r += 3) px(0, y0 + 1 + r, W, 1, "#c4a03a");
  });

  // the dirt trail off the highway in the Smokies (under the road, so the road stays clean)
  for (let y = TRAIL.a; y < TRAIL.b; y++) px(vanX(y) - 2, y, 5, 1, "#7a5a36");

  // the highway: asphalt, white edge lines, dashed yellow center
  for (let y = 0; y < HT; y++) {
    const x = roadX(y);
    px(x - 4, y, 9, 1, "#3a3a3e");
    px(x - 5, y, 1, 1, "#5a5a5e"); px(x + 5, y, 1, 1, "#5a5a5e");
    px(x - 4, y, 1, 1, "#e8e8e8"); px(x + 4, y, 1, 1, "#e8e8e8");
    if (y % 6 < 3) px(x, y, 1, 1, "#ffd23f");
  }

  // landmarks last, on whichever side the road isn't
  SCENES.forEach(({ sc, h }, i) => {
    const y0 = Y0[i];
    const kit = EDGE[sc];
    if (kit) for (let k = 0; k < Math.floor(h / 16); k++) {
      const left = k % 2 === 0, x = left ? 2 + Math.floor(rnd() * 5) : W - 9 + Math.floor(rnd() * 4), y = y0 + 6 + k * 13 + Math.floor(rnd() * 5);
      const far = left ? x + 8 < roadX(y) - 6 && x + 8 < roadX(y + 9) - 6 : x - 1 > roadX(y) + 6 && x - 1 > roadX(y + 9) + 6;
      if (far) kit(px, x, y);
    }
    drawScene(sc, y0, h, px, rnd, live, ctx);
  });
  return live;
}

/* ---------- the moving layer ---------- */

const hash = (n: number) => {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const FLAME = ["#ff3b1f", "#ff8a1f", "#ffd23f"];
const DISCO = ["#ff5ad1", "#5af0ff", "#ffd23f", "#7a5aff", "#2faa4a", "#ff3b3b"];

export function drawLive(ctx: CanvasRenderingContext2D, now: number, still: boolean, live: Live[]) {
  const t = still ? 2.2 : now / 1000;
  const f = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  for (const L of live) {
    if (L.k === "fire") {
      const n = Math.floor((L.w * L.h) / 5), tick = Math.floor(t * 8);
      for (let k = 0; k < n; k++) {
        const x = L.x + Math.floor(hash(k * 3 + 1) * L.w), y = L.y + Math.floor(hash(k * 3 + 2) * L.h);
        const up = (k + tick) % 4;
        f(x, y - up, 1, 1 + (up % 2), FLAME[(k + tick) % 3]);
      }
      for (let k = 0; k < 22; k++) {                       // smoke blowing up and off the fire
        const life = (t * 0.35 + hash(k * 7 + 5)) % 1;
        const x = L.x + hash(k * 7 + 3) * L.w + life * 9, y = L.y - life * 26;
        ctx.globalAlpha = 0.65 * (1 - life); f(x, y, 2, 2, k % 3 ? "#8a8a8a" : "#b8b8b8"); ctx.globalAlpha = 1;
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
      f(x, L.y, 3, 2, L.hat); f(x, L.y + 2, 3, 1, "#e8c0a0"); f(x, L.y + 3, 3, 3, L.shirt);
      const leg = Math.floor(t * 4 + L.ph) % 2;
      f(x + leg, L.y + 6, 1, 2, "#2a2a2a"); f(x + 2 - leg, L.y + 6, 1, 2, "#2a2a2a");
    } else if (L.k === "club") {
      const tick = Math.floor(t * 6);
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        const r = hash(x * 97 + y * 13 + tick * 7919);
        if (r < 0.35) f(L.x + x, L.y + y, 1, 1, DISCO[Math.floor(r * 100) % DISCO.length]);
      }
    }
  }
}

// trees that cover the Smokies trail, drawn above the van
export function drawCanopy(ctx: CanvasRenderingContext2D) {
  const f = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const a = TRAIL.a + 12, b = TRAIL.b - 12, G = ["#12302a", "#1c4a36", "#2a6a48", "#173c30"];
  for (let y = a - 4; y < b + 4; y += 2) {                // a lumpy blob of treetops over the trail
    const edge = Math.min(y - a + 4, b + 4 - y), r = Math.min(9, 3 + edge);
    for (let k = 0; k < 3; k++) {
      const x = vanX(Math.min(b, Math.max(a, y))) + (hash(y * 5 + k) - 0.5) * r * 1.6, w = 3 + Math.floor(hash(y * 7 + k) * r);
      f(x - w / 2, y - 1, w, 3, G[(y + k) % 4]);
      f(x - w / 2 + 1, y - 2, Math.max(1, w - 2), 1, G[(y + k + 2) % 4]);
    }
  }
  for (let y = a; y < b; y += 5) f(vanX(y) + (hash(y) - 0.5) * 6, y, 1, 1, "#3a8a5a");
}

/* ---------- little sprites ---------- */

function palm(px: Px, x: number, y: number) {
  px(x, y, 1, 9, "#7a4a22");
  px(x - 3, y, 3, 1, "#2f8a3a"); px(x + 1, y, 3, 1, "#2f8a3a"); px(x - 4, y + 1, 1, 1, "#2f8a3a"); px(x + 4, y + 1, 1, 1, "#2f8a3a");
  px(x - 2, y - 1, 5, 1, "#3faa4a"); px(x - 1, y - 2, 3, 1, "#3faa4a");
}
function pine(px: Px, x: number, y: number, c = "#1f5a2a") {
  for (let r = 0; r < 6; r++) px(x - Math.floor(r / 2), y + r, 1 + 2 * Math.floor(r / 2), 1, c);
  px(x, y + 6, 1, 2, "#5a3a1a");
}
function peak(px: Px, x: number, y: number, h: number, c = "#6a6f7a", snow = "#f2f2f2") {
  for (let r = 0; r < h; r++) px(x - r, y + r, 2 * r + 1, 1, r < h / 3 ? snow : c);
}
function bldg(px: Px, x: number, y: number, w: number, h: number, c: string, win: string, rnd: () => number) {
  px(x, y, w, h, c);
  for (let yy = y + 1; yy < y + h - 1; yy += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rnd() > 0.35) px(xx, yy, 1, 1, win);
}
function stars(px: Px, x: number, y: number, w: number, h: number, rnd: () => number, k = 6) {
  for (let i = 0; i < k; i++) px(x + Math.floor(rnd() * w), y + Math.floor(rnd() * h), 1, 1, "#ffffff");
}
function water(px: Px, y: number, h: number) {
  px(0, y, W, h, "#2f6fb0"); px(0, y + 1, W, 1, "#5f9fe0");
}
function bridge(px: Px, y: number, h: number) {
  for (let yy = y - 1; yy < y + h + 1; yy++) { px(roadX(yy) - 6, yy, 13, 1, "#8a8a92"); px(roadX(yy) - 4, yy, 9, 1, "#3a3a3e"); if (yy % 6 < 3) px(roadX(yy), yy, 1, 1, "#ffd23f"); }
}
// a little person, 3 wide and 8 tall
function person(px: Px, x: number, y: number, shirt: string, hat = "#3a2a1a", pants = "#2a2a3a", skin = "#e0b090") {
  px(x, y, 3, 1, hat); px(x, y + 1, 3, 2, skin); px(x, y + 3, 3, 3, shirt);
  px(x, y + 6, 1, 2, pants); px(x + 2, y + 6, 1, 2, pants);
}

// the Great Smokies: blue ridge after ridge across the whole stop, fog in every valley
function smokies(ctx: CanvasRenderingContext2D, px: Px, y0: number, h: number) {
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
// the Rockies: big snowy peaks wall to wall, a nearer darker range, haze between
function rockies(ctx: CanvasRenderingContext2D, px: Px, y0: number) {
  for (const [cx, hh] of [[4, 26], [17, 34], [31, 28], [44, 38], [58, 30]]) {
    for (let r = 0; r < hh; r++) {
      const top = y0 + 46 - hh + r;
      px(cx - r * 0.8, top, Math.round(r * 1.6) + 1, 1, r < hh * 0.32 ? "#f4f6f8" : "#6a7090");
      if (r > hh * 0.32) px(cx, top, Math.round(r * 0.8) + 1, 1, "#525878");                     // the shadow side
    }
  }
  ctx.globalAlpha = 0.45; px(0, y0 + 36, W, 3, "#eef4f6"); ctx.globalAlpha = 1;
  for (const [cx, hh] of [[10, 16], [26, 20], [38, 15], [52, 19]]) {
    for (let r = 0; r < hh; r++) {
      const top = y0 + 50 - hh + r;
      px(cx - r, top, 2 * r + 1, 1, r < 4 ? "#dfe6ee" : "#3f4a5a");
      if (r >= 4) px(cx, top, r + 1, 1, "#33404e");
    }
  }
}
// a farm windmill: lattice tower, a wheel of blades, a tail vane
function windmill(px: Px, x: number, y: number) {
  for (let r = 0; r < 13; r++) { px(x - Math.floor(r / 4), y + r, 1, 1, "#8a8a8a"); px(x + Math.floor(r / 4), y + r, 1, 1, "#8a8a8a"); }
  for (let r = 3; r < 13; r += 3) px(x - Math.floor(r / 4), y + r, 2 * Math.floor(r / 4) + 1, 1, "#8a8a8a");
  for (const [dx, dy] of [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]]) px(x + dx, y - 1 + dy, 1, 1, "#e8e8e8");
  px(x, y - 1, 1, 1, "#444"); px(x + 1, y - 1, 4, 1, "#9a9a9a"); px(x + 4, y - 3, 1, 3, "#e0302f");
}
// a white wind turbine
function turbine(px: Px, x: number, y: number) {
  px(x, y, 1, 16, "#e8e8e8"); px(x - 1, y - 1, 3, 2, "#f2f2f2");
  px(x, y - 8, 1, 7, "#f2f2f2");
  for (let k = 1; k < 6; k++) { px(x + k, y + Math.ceil(k * 0.6), 1, 1, "#f2f2f2"); px(x - k, y + Math.ceil(k * 0.6), 1, 1, "#f2f2f2"); }
}
// 3x5 letters
const GLYPH: Record<string, string> = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", K: "101101110101101",
  L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "111101101101111", P: "110101110100100",
  R: "110101110101101", S: "111100111001111", T: "111010010010010", U: "101101101101111", V: "101101101101010",
  W: "101101111111101", X: "101101010101101", Y: "101101010010010", " ": "000000000000000",
};
function word(px: Px, x: number, y: number, s: string, fg = "#111", bg: string | null = "#ffd23f") {
  [...s].forEach((ch, n) => {
    if (bg) px(x + n * 4 - 1, y - 1, 5, 7, bg);
    GLYPH[ch].split("").forEach((bit, k) => { if (bit === "1") px(x + n * 4 + (k % 3), y + Math.floor(k / 3), 1, 1, fg); });
  });
}
const wordW = (s: string) => s.length * 4 - 1;

// small things for the outer edges, by region
type Edge = (px: Px, x: number, y: number) => void;
const ePine: Edge = (px, x, y) => pine(px, x + 3, y);
const ePalm: Edge = (px, x, y) => palm(px, x + 4, y + 2);
const eCactus: Edge = (px, x, y) => { px(x + 3, y, 2, 8, "#2f8a3a"); px(x + 1, y + 2, 1, 3, "#2f8a3a"); px(x + 1, y + 4, 2, 1, "#2f8a3a"); px(x + 6, y + 1, 1, 3, "#2f8a3a"); px(x + 5, y + 3, 2, 1, "#2f8a3a"); };
const eHay: Edge = (px, x, y) => { px(x + 1, y + 2, 5, 4, "#d8b048"); px(x + 2, y + 3, 3, 2, "#b88f2a"); };
const eTree: Edge = (px, x, y) => { px(x + 1, y, 5, 5, "#2f7a2a"); px(x, y + 1, 7, 3, "#2f7a2a"); px(x + 2, y + 1, 2, 1, "#5aa84a"); px(x + 3, y + 5, 1, 2, "#5a3a1a"); };
const eHouse: Edge = (px, x, y) => { px(x + 1, y + 3, 6, 4, "#e8e2d0"); px(x, y + 1, 8, 2, "#7a2f1f"); px(x + 3, y + 5, 1, 2, "#5a3a1a"); };
const eRock: Edge = (px, x, y) => { px(x + 1, y + 3, 5, 3, "#8a7a6a"); px(x + 2, y + 2, 3, 1, "#a8988a"); };
const eBoat: Edge = (px, x, y) => { px(x + 1, y + 3, 6, 2, "#f2f2f2"); px(x + 3, y + 1, 2, 2, "#e0302f"); };
const eCow: Edge = (px, x, y) => { px(x + 1, y + 3, 5, 3, "#7a4a2a"); px(x + 6, y + 2, 2, 2, "#7a4a2a"); px(x + 1, y + 6, 1, 1, "#3a2a1a"); px(x + 5, y + 6, 1, 1, "#3a2a1a"); };
const pick = (...k: Edge[]): Edge => { let n = 0; return (px, x, y) => k[n++ % k.length](px, x, y); };
const EDGE: Partial<Record<Scene, Edge>> = {
  venice: pick(ePalm, eRock), oc: pick(eTree, ePalm), desert: pick(eCactus, eRock), arches: pick(eCactus, eRock),
  vegas: pick(eCactus, eRock), vail: pick(ePine), lake: pick(ePine, eRock), denver: pick(ePine, eHouse),
  truckstop: pick(eCow, eHay), silo: pick(eHay), plains: pick(eHay), tulsa: pick(eTree), oregon: pick(eRock, eHay),
  clinton: pick(eTree), casino: pick(eTree, eHouse), graceland: pick(eTree), nashville: pick(eTree), gatlinburg: pick(ePine),
  smoky: pick(ePine), waffle: pick(ePine, eTree), fair: pick(eTree, eHouse), dish: pick(ePine), dc: pick(eTree),
  jersey: pick(eTree, eHouse), liberty: pick(eBoat),
};

/* ---------- one scene per stop ---------- */

function drawScene(sc: Scene, y0: number, h: number, px: Px, rnd: () => number, live: Live[], ctx: CanvasRenderingContext2D) {
  const L = OX + (roadX(y0 + h / 2) > OX + 20 ? 1 : 23);
  const b = y0 + h - 12; // baseline near the bottom of the scene
  let x = 0, y = 0;
  switch (sc) {
    case "venice": { // ocean, a hermit crab, the lifeguard tower, the courts, a guy on an e-bike
      y = y0 + 2; x = free(y, 16, 20);
      px(x, y, 20, 11, "#3a8fd6"); px(x, y + 3, 20, 1, "#7fc0f0"); px(x, y + 11, 20, 2, "#f4f4f4");
      px(x + 14, y + 16, 4, 2, "#e8823a"); px(x + 15, y + 15, 2, 1, "#f4b07a"); px(x + 16, y + 16, 1, 1, "#b85a22"); // hermit crab
      px(x + 13, y + 17, 1, 1, "#c0302a"); px(x + 12, y + 16, 1, 1, "#111"); px(x + 13, y + 18, 1, 1, "#c0302a"); px(x + 17, y + 18, 1, 1, "#c0302a");
      y = y0 + 20; x = free(y, 12, 13);
      px(x + 2, y + 2, 7, 5, "#3a6fd8"); px(x + 1, y + 1, 9, 1, "#e0302f"); px(x + 3, y + 3, 2, 2, "#cfe8ff");
      px(x + 2, y + 7, 1, 5, "#f2f2f2"); px(x + 8, y + 7, 1, 5, "#f2f2f2"); px(x + 9, y + 7, 4, 1, "#f2f2f2");
      y = y0 + 37; x = free(y, 12, 18);                                                       // the courts, from above
      px(x, y, 18, 12, "#2f7a9a"); px(x + 1, y + 1, 16, 10, "#3a8fb0");
      px(x + 1, y + 1, 16, 1, "#f2f2f2"); px(x + 1, y + 10, 16, 1, "#f2f2f2"); px(x + 1, y + 1, 1, 10, "#f2f2f2"); px(x + 16, y + 1, 1, 10, "#f2f2f2");
      px(x + 9, y + 1, 1, 10, "#f2f2f2"); px(x + 2, y + 4, 3, 4, "#d8603a"); px(x + 14, y + 4, 3, 4, "#d8603a");
      px(x + 1, y + 5, 1, 2, "#ff8a1f"); px(x + 16, y + 5, 1, 2, "#ff8a1f");
      px(x + 6, y + 4, 2, 2, "#3a2a1a"); px(x + 11, y + 7, 2, 2, "#f0c8a0"); px(x + 8, y + 3, 1, 1, "#ff8a1f");
      y = y0 + 55; x = free(y, 11, 13);                                                       // e-bike guy, side view
      person(px, x + 4, y, "#2fa8a0", "#f2f2f2", "#2a3a5a");
      for (const wx of [x, x + 8]) { px(wx, y + 8, 3, 1, "#111"); px(wx, y + 10, 3, 1, "#111"); px(wx - 1, y + 9, 1, 1, "#111"); px(wx + 3, y + 9, 1, 1, "#111"); }
      px(x + 2, y + 8, 8, 1, "#e0302f"); px(x + 4, y + 7, 3, 2, "#111"); px(x + 9, y + 5, 1, 4, "#9a9a9a"); px(x + 8, y + 5, 2, 1, "#111");
      px(x - 3, y + 6, 2, 1, "#f2f2f2"); px(x - 4, y + 8, 3, 1, "#f2f2f2");                   // whoosh
      palm(px, free(y0 + 68, 8, 9) + 4, y0 + 68);
      break;
    }
    case "oc": { // the gas plant at the LA line, office towers, and The Marketplace
      y = y0 + 3; x = free(y, 20, 24);
      for (const [dx, r] of [[5, 5], [16, 4]]) {
        for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k) * 2) + 1; px(x + dx - Math.floor(ww / 2), y + 8 + k, ww, 1, k < -r / 2 ? "#ffffff" : "#d8dce0"); }
        px(x + dx - r, y + 9 + r, 1, 3, "#8a8a8a"); px(x + dx + r, y + 9 + r, 1, 3, "#8a8a8a");
      }
      px(x, y + 16, 24, 1, "#9a9a9a"); px(x + 11, y + 6, 1, 11, "#9a9a9a");                     // pipes
      px(x + 21, y - 2, 2, 16, "#b8b8b8"); px(x + 21, y - 2, 2, 2, "#e0302f"); px(x + 21, y + 4, 2, 1, "#e0302f");
      px(x + 21, y - 4, 2, 2, "#ff8a1f"); px(x + 21, y - 5, 1, 1, "#ffd23f");                   // the flare
      y = y0 + 26; x = free(y, 24, 22);
      bldg(px, x, y + 6, 6, 18, "#6a8aa8", "#cfe8ff", rnd); bldg(px, x + 7, y, 7, 24, "#4a6a88", "#cfe8ff", rnd);
      bldg(px, x + 15, y + 9, 6, 15, "#8aa0b8", "#e8f4ff", rnd); px(x + 9, y - 1, 3, 1, "#e0302f");
      y = y0 + 56; x = free(y, 30, 26);                                                       // purple strip mall
      px(x, y, 26, 2, "#4a2a6a"); px(x, y + 2, 26, 10, "#8a4ac8"); px(x, y + 2, 26, 1, "#a86ae8");
      for (let k = 0; k < 6; k++) { px(x + 1 + k * 4, y + 6, 3, 4, "#cfe8ff"); px(x + 1 + k * 4, y + 4, 3, 1, ["#ff5ad1", "#ffd23f", "#5af0ff"][k % 3]); }
      px(x + 2, y + 12, 22, 1, "#5a5a5a");
      px(x + 1, y + 13, 24, 8, "#4a4a4e"); for (let k = 0; k < 6; k++) px(x + 2 + k * 4, y + 14, 1, 6, "#e8e8e8");
      px(x + 4, y + 15, 2, 3, "#e0302f"); px(x + 13, y + 16, 2, 3, "#3a6fd8"); px(x + 20, y + 15, 2, 3, "#f2f2f2");
      const sw = wordW("MARKET") + 2, sx = x + Math.floor((26 - sw) / 2);                      // the pylon sign
      px(sx - 1, y - 21, sw + 2, 21, "#5a2a8a");
      word(px, sx + 4, y - 19, "THE", "#ffffff", null); word(px, sx + 1, y - 13, "MARKET", "#ffffff", null); word(px, sx + 3, y - 7, "PLACE", "#ffd23f", null);
      break;
    }
    case "vegas": { // the Strat, neon, the Welcome sign, fireworks, and a Walmart at the Nevada line
      y = y0 + 4; x = free(y, 50, 16);
      stars(px, x, y, 16, 10, rnd, 8);
      px(x + 3, y + 2, 1, 4, "#cfcfcf"); px(x + 1, y + 6, 5, 3, "#d8d8e8"); px(x + 2, y + 9, 3, 1, "#ff5ad1");
      px(x + 3, y + 10, 1, 30, "#b8b8c8"); px(x + 2, y + 32, 3, 8, "#b8b8c8");
      bldg(px, x + 7, y + 18, 4, 22, "#4a3a6a", "#ff5ad1", rnd); bldg(px, x + 12, y + 24, 4, 16, "#3b3b5c", "#5af0ff", rnd);
      px(x + 5, y + 43, 7, 4, "#f2f2f2"); px(x + 6, y + 42, 5, 1, "#f2f2f2"); px(x + 8, y + 41, 1, 1, "#e0302f");
      px(x + 6, y + 44, 5, 1, "#e0302f"); px(x + 8, y + 47, 1, 3, "#9a9a9a");
      for (const [k, c] of [[0, "#ff5ad1"], [1, "#5af0ff"], [2, "#ffd23f"], [3, "#2faa4a"]] as const) {
        const fy = y0 + 8 + k * 9, fx = free(fy, 8, 9) + 4;
        live.push({ k: "boom", x: fx, y: fy, c, ph: k * 0.7 });
      }
      y = y0 + 64; x = free(y, 22, 30);
      px(x, y + 9, 30, 2, "#0a4a8a"); px(x, y + 11, 30, 8, "#0071ce"); px(x + 13, y + 14, 4, 5, "#cfe8ff");
      word(px, x + 1, y + 2, "WALMART", "#ffffff", null); px(x, y + 1, 30, 1, "#0071ce"); px(x, y + 7, 30, 1, "#0071ce");
      px(x, y + 1, 1, 7, "#0071ce"); px(x + 29, y + 1, 1, 7, "#0071ce");
      for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0], [-1, -1], [1, 1], [1, -1], [-1, 1]]) px(x + 27 + dx * 0 + dx, y - 2 + dy, 1, 1, "#ffc220");
      break;
    }
    case "desert": { // Bicknell: the mesa, and Guy Fieri in a turban at the grill
      px(L + 1, b - 9, 13, 9, "#a8432a"); px(L + 3, b - 12, 9, 3, "#a8432a"); px(L + 3, b - 12, 9, 1, "#c45a38");
      for (const xx of [2, 12]) { px(L + xx, b + 3, 1, 7, "#2f8a3a"); px(L + xx - 1, b + 5, 1, 2, "#2f8a3a"); px(L + xx + 1, b + 4, 1, 2, "#2f8a3a"); }
      y = y0 + 6; x = free(y, 20, 14);
      px(x + 3, y, 7, 2, "#f2f2f2"); px(x + 2, y + 2, 9, 3, "#e8e8e8"); px(x + 4, y + 1, 3, 1, "#ff8a1f"); px(x + 3, y + 3, 7, 1, "#d8d8d8"); px(x + 6, y + 2, 1, 1, "#e0302f"); // turban
      px(x + 3, y + 5, 7, 4, "#f0b890"); px(x + 3, y + 6, 7, 1, "#111"); px(x + 4, y + 6, 2, 1, "#3a3a3a"); px(x + 7, y + 6, 2, 1, "#3a3a3a"); // wraparounds
      px(x + 5, y + 8, 3, 2, "#e8e0c0"); px(x + 6, y + 10, 1, 1, "#e8e0c0");                    // frosted goatee
      px(x + 1, y + 10, 11, 7, "#1a1a1a");                                                     // flame shirt
      for (const [dx, hh, c] of [[2, 3, "#ff3b1f"], [4, 4, "#ff8a1f"], [7, 3, "#ff3b1f"], [9, 4, "#ffd23f"], [5, 2, "#ffd23f"]] as const) px(x + dx, y + 17 - hh, 1, hh, c);
      px(x, y + 11, 1, 4, "#f0b890"); px(x + 12, y + 11, 1, 3, "#f0b890"); px(x + 12, y + 10, 2, 1, "#9a9a9a"); // spatula
      px(x + 2, y + 17, 3, 3, "#3a5a8a"); px(x + 8, y + 17, 3, 3, "#3a5a8a");
      break;
    }
    case "arches": { // Delicate Arch, a cliff jumper, and The Body Keeps the Score
      y = y0 + 4; x = free(y, 26, 16);
      px(x + 2, y + 4, 3, 22, "#a8432a"); px(x + 11, y + 8, 3, 18, "#a8432a");
      px(x + 3, y + 2, 4, 2, "#bf5534"); px(x + 6, y + 1, 4, 2, "#bf5534"); px(x + 9, y + 3, 3, 2, "#bf5534"); px(x + 11, y + 5, 2, 3, "#bf5534");
      y = y0 + 34; x = free(y, 24, 20);                                                       // the cliff, the jump, the pool
      px(x, y, 7, 22, "#9a3a22"); px(x, y, 7, 1, "#c45a38"); person(px, x + 2, y - 8, "#e0302f", "#3a2a1a", "#3a6fd8");
      px(x + 10, y + 5, 3, 1, "#f0c8a0"); px(x + 11, y + 6, 2, 3, "#ffd23f"); px(x + 10, y + 9, 1, 2, "#3a6fd8"); px(x + 13, y + 9, 1, 2, "#3a6fd8"); px(x + 9, y + 6, 1, 1, "#f0c8a0"); px(x + 14, y + 5, 1, 1, "#f0c8a0");
      px(x + 7, y + 17, 13, 6, "#2f8ab8"); px(x + 8, y + 18, 4, 1, "#7fd0f0"); px(x + 14, y + 16, 1, 1, "#e8f8ff"); px(x + 16, y + 15, 1, 1, "#e8f8ff"); px(x + 12, y + 15, 1, 1, "#e8f8ff");
      y = y0 + 62; x = free(y, 20, 23);                                                       // the book, lying in the sand
      px(x, y, 23, 20, "#1a1a1a"); px(x + 1, y + 1, 21, 18, "#f2ead8"); px(x + 1, y + 18, 21, 1, "#c8bca0");
      word(px, x + 4, y + 2, "BODY", "#1a1a1a", null); word(px, x + 2, y + 8, "KEEPS", "#e0302f", null); word(px, x + 2, y + 14 - 1, "SCORE", "#1a1a1a", null);
      break;
    }
    case "vail": { // cutesy alpine village, a gondola, and a man with a pencil mustache
      y = y0 + 3; x = free(y, 30, 20);
      peak(px, x + 10, y, 18, "#7a8aa0");
      for (let r = 0; r < 18; r++) px(x + 1 + r, y + 6 + r, 1, 1, "#333");
      px(x + 6, y + 10, 3, 2, "#e0302f"); px(x + 7, y + 12, 1, 1, "#333"); px(x + 13, y + 17, 3, 2, "#ffd23f"); px(x + 14, y + 19, 1, 1, "#333");
      y = y0 + 36; x = free(y, 14, 24);                                                       // chalets
      for (const [dx, c] of [[0, "#f2ead8"], [9, "#f8f0e0"], [17, "#efe4cc"]] as const) {
        for (let r = 0; r < 4; r++) px(x + dx + 3 - r, y + r, 2 * r + 1, 1, r === 0 ? "#ffffff" : "#6a3a1a");
        px(x + dx, y + 4, 7, 7, c); px(x + dx, y + 6, 7, 1, "#8a5a2a"); px(x + dx + 1, y + 8, 2, 2, "#5a8ac8"); px(x + dx + 4, y + 8, 2, 3, "#6a3a1a");
        px(x + dx + 1, y + 10, 2, 1, "#e0302f");                                                // flower box
      }
      y = y0 + 54; x = free(y, 18, 14);                                                       // the mustache man
      px(x + 3, y, 7, 1, "#2f6a2a"); px(x + 2, y + 1, 9, 2, "#2f6a2a"); px(x + 9, y - 2, 1, 3, "#e0302f");
      px(x + 3, y + 3, 7, 5, "#f0c8a0"); px(x + 4, y + 4, 1, 1, "#111"); px(x + 8, y + 4, 1, 1, "#111");
      px(x + 4, y + 6, 5, 1, "#1a1a1a");                                                       // pencil-thin
      px(x + 2, y + 8, 9, 5, "#f2f2f2"); px(x + 3, y + 8, 1, 5, "#2f6a2a"); px(x + 9, y + 8, 1, 5, "#2f6a2a");
      px(x + 3, y + 13, 7, 3, "#6a4a2a"); px(x + 3, y + 16, 2, 2, "#f0c8a0"); px(x + 8, y + 16, 2, 2, "#f0c8a0");
      px(x + 11, y + 9, 1, 3, "#f0c8a0"); px(x + 11, y + 6, 2, 3, "#ffd23f");                   // a beer stein
      break;
    }
    case "lake": { // the Rockies, epic, with the wildfire from the film (much bigger now)
      y = y0 + 52; x = free(y, 30, 28);                                                        // the burn
      px(x, y, 28, 26, "#3a2a22"); px(x + 2, y + 2, 24, 22, "#2a1e18");
      for (let k = 0; k < 12; k++) px(x + 2 + Math.floor(rnd() * 24), y + 1 + Math.floor(rnd() * 24), 1, 3, "#1a1210");
      live.push({ k: "fire", x: x + 1, y: y + 2, w: 26, h: 23 });
      y = y0 + 86; x = free(y, 14, 22);                                                        // the lake
      px(x, y, 22, 12, "#2f6fb0"); px(x + 2, y + 2, 7, 1, "#7fb6e8"); px(x + 11, y + 6, 6, 1, "#7fb6e8");
      pine(px, x + 2, y + 13); pine(px, x + 18, y + 12);
      break;
    }
    case "denver":
      peak(px, L + 3, b - 30, 9); peak(px, L + 12, b - 28, 9);
      bldg(px, L + 1, b - 12, 4, 12, "#8a8f99", "#dfe6ee", rnd); bldg(px, L + 6, b - 18, 4, 18, "#7a808a", "#dfe6ee", rnd);
      bldg(px, L + 11, b - 14, 4, 14, "#8a8f99", "#dfe6ee", rnd);
      px(L + 1, b + 3, 3, 4, "#3a6fd8"); px(L + 2, b + 2, 2, 1, "#3a6fd8"); // the big blue bear, peeking
      break;
    case "truckstop": { // The Oasis: the pumps, the semis, and Bigfoot by the door
      y = y0 + 4; x = free(y, 22, 22);
      px(x, y, 22, 3, "#2f8a4a"); px(x, y + 3, 22, 1, "#e0302f"); px(x + 3, y + 4, 1, 8, "#cfcfcf"); px(x + 18, y + 4, 1, 8, "#cfcfcf");
      for (const dx of [7, 13]) { px(x + dx, y + 7, 3, 5, "#e8e8e8"); px(x + dx + 1, y + 8, 1, 1, "#2faa4a"); }
      px(x + 1, y + 14, 9, 5, "#f2f2f2"); px(x + 10, y + 15, 4, 4, "#e0302f"); px(x + 12, y + 16, 2, 2, "#cfe8ff");
      for (const dx of [2, 6, 11]) px(x + dx, y + 19, 2, 2, "#111");
      y = y0 + 32; x = free(y, 22, 18);                                                         // Bigfoot
      px(x + 1, y + 1, 16, 18, "#c8d8c8"); px(x + 1, y + 1, 16, 1, "#2f6a4a"); px(x + 3, y + 3, 4, 3, "#9ad0e8"); px(x + 11, y + 3, 4, 3, "#9ad0e8");
      px(x + 3, y + 8, 5, 10, "#2a1e16"); px(x + 2, y + 7, 7, 3, "#2a1e16"); px(x + 4, y + 6, 3, 1, "#2a1e16");
      px(x + 4, y + 8, 1, 1, "#e8c890"); px(x + 6, y + 8, 1, 1, "#e8c890"); px(x + 1, y + 10, 1, 6, "#2a1e16"); px(x + 9, y + 10, 1, 6, "#2a1e16");
      person(px, x + 12, y + 10, "#3a4a9a", "#8a5a2a");
      y = y0 + 58; x = free(y, 14, 26);
      px(x + 12, y - 4, 1, 16, "#9a9a9a"); px(x + 7, y - 9, 11, 6, "#e0302f"); px(x + 8, y - 8, 9, 1, "#ffd23f"); px(x + 8, y - 6, 9, 1, "#ffd23f");
      for (let k = 0; k < 3; k++) eCow(px, x + k * 8, y + 6 + (k % 2) * 3);
      break;
    }
    case "silo": { // Colby: grain silos, turbines, and the little town hall
      px(L + 2, b - 22, 5, 22, "#c8ccd2"); px(L + 2, b - 24, 5, 2, "#9aa0a8"); px(L + 3, b - 25, 3, 1, "#9aa0a8");
      px(L + 8, b - 16, 5, 16, "#c8ccd2"); px(L + 8, b - 18, 5, 2, "#9aa0a8");
      px(L, b, 16, 2, "#7a4a22");
      y = y0 + 6; x = free(y, 16, 18);
      px(x, y + 6, 18, 9, "#a8603a"); px(x, y + 5, 18, 1, "#e8e2d0"); px(x + 6, y + 2, 6, 3, "#e8e2d0"); px(x + 8, y + 1, 2, 1, "#e8e2d0");
      for (const dx of [2, 5, 12, 15]) px(x + dx, y + 8, 1, 3, "#f2e8b0");
      px(x + 8, y + 10, 2, 5, "#5a3a1a"); px(x + 7, y + 15, 4, 1, "#cfcfcf");
      px(x + 9, y - 6, 1, 7, "#cfcfcf"); px(x + 10, y - 6, 4, 2, "#3a3fa0"); px(x + 10, y - 4, 4, 1, "#e0302f");
      turbine(px, free(y0 + 30, 16, 12) + 6, y0 + 36);
      break;
    }
    case "plains": { // Hays: wheat, a small Catholic church, an XXX store, windmills
      y = y0 + 4; x = free(y, 24, 14);
      px(x + 6, y, 1, 3, "#f2f2f2"); px(x + 5, y + 1, 3, 1, "#f2f2f2");
      for (let r = 0; r < 6; r++) px(x + 6 - Math.floor(r / 2), y + 3 + r, 1 + 2 * Math.floor(r / 2), 1, "#d8d0c0");
      px(x + 4, y + 9, 5, 6, "#ece6d8"); px(x + 5, y + 10, 3, 2, "#3a6fd8"); px(x + 6, y + 10, 1, 2, "#e0302f");
      for (let r = 0; r < 3; r++) px(x + 6 - 3 - r, y + 15 + r, 7 + 2 * r, 1, "#7a2f1f");
      px(x + 1, y + 18, 11, 7, "#ece6d8"); px(x + 5, y + 21, 3, 4, "#7a2a1f"); px(x + 2, y + 20, 1, 2, "#8ab0d8"); px(x + 10, y + 20, 1, 2, "#8ab0d8");
      y = y0 + 34; x = free(y, 18, 18);                                                         // XXX
      px(x, y + 8, 18, 9, "#3a3a42"); px(x, y + 7, 18, 1, "#1a1a1a"); px(x + 8, y + 12, 3, 5, "#111");
      px(x + 1, y, 16, 7, "#ffd23f"); word(px, x + 3, y + 1, "XXX", "#e0302f", null);
      px(x + 2, y + 10, 4, 1, "#ff5ad1"); px(x + 13, y + 10, 4, 1, "#ff5ad1");
      x = free(y0 + 56, 26, 18); windmill(px, x + 4, y0 + 58); windmill(px, x + 14, y0 + 66);
      break;
    }
    case "tulsa": { // the Golden Driller, the Center of the Universe, a pool table with two dogs, the Trade Winds
      y = y0 + 3; x = free(y, 34, 16);
      px(x + 12, y, 1, 34, "#8a8a8a"); px(x + 14, y, 1, 34, "#8a8a8a");
      for (let yy = y; yy < y + 34; yy += 4) px(x + 12, yy, 3, 1, "#8a8a8a");
      px(x + 5, y + 4, 3, 3, "#e8b830"); px(x + 4, y + 3, 5, 1, "#c99a20");
      px(x + 4, y + 7, 5, 9, "#e8b830"); px(x + 9, y + 8, 3, 1, "#e8b830"); px(x + 3, y + 8, 1, 5, "#e8b830");
      px(x + 4, y + 16, 2, 10, "#d8a828"); px(x + 7, y + 16, 2, 10, "#d8a828"); px(x + 2, y + 26, 10, 2, "#9a9a9a");
      y = y0 + 40; x = free(y, 14, 16);                                                         // the Center of the Universe
      for (const [r, c] of [[7, "#a8603a"], [5, "#c87a4a"], [3, "#a8603a"], [1, "#d8d0c0"]] as const)
        for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k) * 2) + 1; px(x + 8 - Math.floor(ww / 2), y + 7 + Math.round(k * 0.6), ww, 1, c); }
      person(px, x + 7, y, "#e0302f"); px(x + 11, y + 1, 1, 1, "#f2f2f2"); px(x + 12, y, 1, 1, "#f2f2f2"); px(x + 13, y + 2, 1, 1, "#f2f2f2"); px(x + 3, y + 1, 1, 1, "#f2f2f2");
      y = y0 + 58; x = free(y, 14, 18);                                                         // pool table, dogs run laps
      px(x + 2, y + 3, 14, 8, "#5a3018"); px(x + 3, y + 4, 12, 6, "#1f7a3a");
      for (const [dx, dy] of [[3, 4], [14, 4], [3, 9], [14, 9], [8, 4], [8, 9]]) px(x + dx, y + dy, 1, 1, "#111");
      px(x + 6, y + 6, 1, 1, "#f2f2f2"); px(x + 10, y + 7, 1, 1, "#e0302f"); px(x + 11, y + 5, 1, 1, "#ffd23f"); px(x + 12, y + 7, 1, 1, "#3a6fd8");
      live.push({ k: "dogs", x: x, y: y + 1, w: 17, h: 12 });
      y = y0 + 80; x = free(y, 22, 24);                                                         // the spooky Trade Winds Inn
      px(x, y + 12, 24, 10, "#3a3448"); px(x, y + 11, 24, 1, "#1a1624");
      for (let k = 0; k < 5; k++) px(x + 1 + k * 5, y + 14, 3, 3, k === 3 ? "#d8f05a" : "#1a1624");
      px(x + 2, y, 21, 11, "#1a1624"); word(px, x + 3, y + 1, "TRADE", "#d8f05a", null); word(px, x + 3, y + 6 - 1 + 1, "WINDS", "#8a7ab8", null);
      px(x + 18, y + 17, 3, 4, "#e8e8f0"); px(x + 18, y + 21, 1, 1, "#e8e8f0"); px(x + 20, y + 21, 1, 1, "#e8e8f0"); px(x + 19, y + 18, 1, 1, "#111"); // ghost
      px(x - 1, y + 2, 2, 1, "#111"); px(x + 23, y - 1, 2, 1, "#111");                          // bats
      break;
    }
    case "oregon": { // Muskogee: an old-west town that's a film set, people in costume walking through
      y = y0 + 6;
      for (const [dx, w, c, f] of [[0, 7, "#8a5a32", "#a06a3a"], [8, 8, "#6a4a2a", "#9a6a3a"]] as const) {
        x = free(y, 18, 16) + dx;
        px(x, y + 4, w, 12, c); px(x, y, w, 4, f); px(x, y - 1, w, 1, "#4a3018");
        px(x + 1, y + 1, w - 2, 2, "#e8d8a0"); px(x + Math.floor(w / 2) - 1, y + 11, 2, 5, "#2a1a0a");
        px(x + 1, y + 6, 2, 2, "#e8d080"); px(x, y + 9, w, 1, "#5a3a1a");
        px(x + w - 1, y + 2, 1, 14, "#c8b890");                                                // plywood brace: it's a set
      }
      x = free(y + 16, 4, 16);
      px(x - 3, y + 16, 22, 4, "#c8b080");
      y = y0 + 30; x = free(y, 18, 18);
      live.push({ k: "walk", x0: x, x1: x + 15, y, shirt: "#6a2a4a", hat: "#3a2a1a", ph: 0 });
      live.push({ k: "walk", x0: x, x1: x + 15, y: y + 9, shirt: "#e8e0d0", hat: "#f2e8c8", ph: 7 });
      y = y0 + 52; x = free(y, 18, 24);                                                         // the crew: camera, light, director's chair
      px(x + 2, y + 2, 6, 4, "#1a1a1a"); px(x + 8, y + 3, 2, 2, "#3a3a3a"); px(x + 1, y, 3, 3, "#2a2a2a"); px(x + 5, y, 3, 3, "#2a2a2a");
      px(x + 4, y + 6, 1, 6, "#5a5a5a"); px(x + 2, y + 11, 5, 1, "#5a5a5a");
      px(x + 12, y + 1, 4, 3, "#f2f2d0"); px(x + 13, y + 4, 1, 8, "#5a5a5a"); px(x + 11, y + 11, 4, 1, "#5a5a5a");
      px(x + 17, y + 6, 5, 1, "#1a1a1a"); px(x + 17, y + 3, 1, 3, "#1a1a1a"); px(x + 17, y + 3, 5, 2, "#1a1a1a"); px(x + 18, y + 7, 1, 4, "#8a6a42"); px(x + 21, y + 7, 1, 4, "#8a6a42");
      px(x + 18, y + 2, 3, 1, "#f2f2f2");                                                       // "DIRECTOR"
      person(px, x + 8, y + 12, "#1a1a1a", "#1a1a1a");
      px(x + 13, y + 14, 6, 1, "#5a5a5a"); px(x + 18, y + 13, 2, 3, "#3a3a3a");                  // boom mic
      break;
    }
    case "clinton": { // Little Rock: the glass library over the Arkansas River, Bill with the sax, downtown
      water(px, y0 + 34, 8); bridge(px, y0 + 34, 8);
      y = y0 + 24; x = free(y, 10, 16);
      px(x - 1, y, 15, 6, "#a8c4d8"); px(x - 1, y, 15, 1, "#e8f4ff");
      for (let k = 0; k < 15; k += 3) px(x - 1 + k, y + 1, 1, 5, "#6a8aa0");
      px(x + 10, y + 6, 2, 4, "#7a808a");
      { const r = y;
        px(x + 3, r - 11, 4, 1, "#f2f2f2"); px(x + 3, r - 10, 4, 3, "#f0a888"); px(x + 3, r - 9, 4, 1, "#111"); px(x + 6, r - 8, 1, 1, "#d06a5a");
        px(x + 2, r - 7, 5, 5, "#2a2f4a"); px(x + 4, r - 7, 1, 3, "#e0302f"); px(x + 3, r - 2, 1, 2, "#2a2f4a"); px(x + 5, r - 2, 1, 2, "#2a2f4a");
        px(x + 7, r - 9, 1, 1, "#e8b830"); px(x + 8, r - 8, 1, 5, "#e8b830"); px(x + 9, r - 4, 2, 1, "#e8b830"); px(x + 10, r - 6, 2, 2, "#e8b830");
        px(x + 12, r - 11, 1, 1, "#ffd23f"); px(x + 13, r - 14, 1, 3, "#ffd23f"); px(x + 14, r - 14, 1, 1, "#ffd23f");
        px(x - 1, r - 4, 2, 3, "#e0302f"); px(x - 1, r - 6, 1, 2, "#ffd23f"); px(x, r - 6, 1, 2, "#ffd23f"); }
      y = y0 + 48; x = free(y, 24, 18);
      bldg(px, x, y + 6, 5, 18, "#7a808a", "#e8eef4", rnd); bldg(px, x + 6, y, 6, 24, "#6a707a", "#e8eef4", rnd); bldg(px, x + 13, y + 9, 5, 15, "#8a909a", "#e8eef4", rnd);
      break;
    }
    case "casino": { // Horseshoe in Tunica, then Hernando: water tower and the donut shop
      y = y0 + 3; x = free(y, 28, 18);
      stars(px, x, y, 18, 6, rnd, 4);
      px(x, y + 14, 18, 14, "#3a2a50"); px(x + 1, y + 15, 16, 1, "#ffd23f");
      for (let k = 0; k < 9; k++) px(x + 1 + Math.floor(rnd() * 16), y + 17 + Math.floor(rnd() * 9), 1, 1, "#ff5ad1");
      { const cx = x + 9, cy = y + 7;                                                            // the big gold horseshoe
        for (let a = 0; a < 36; a++) { const th = Math.PI * (0.15 + 1.7 * a / 35) + Math.PI / 2; px(cx + Math.round(6 * Math.cos(th)), cy - Math.round(6 * Math.sin(th)), 2, 2, "#e8b830"); }
        for (const [dx, dy] of [[-5, -3], [4, -3], [-6, 1], [5, 1]]) px(cx + dx, cy + dy, 1, 1, "#7a5a1a"); }
      y = y0 + 38; x = free(y, 24, 14);
      px(x + 3, y, 9, 6, "#c8ccd2"); px(x + 4, y - 1, 7, 1, "#9aa0a8"); px(x + 4, y + 2, 7, 1, "#3a6fd8");
      px(x + 4, y + 6, 1, 14, "#9aa0a8"); px(x + 10, y + 6, 1, 14, "#9aa0a8"); px(x + 7, y + 6, 1, 14, "#9aa0a8");
      y = y0 + 66; x = free(y, 22, 22);                                                          // the donut shop
      px(x + 1, y + 11, 20, 9, "#f2e8d8"); px(x + 1, y + 10, 20, 1, "#e85a9a");
      for (let k = 0; k < 4; k++) px(x + 2 + k * 5, y + 12, 4, 1, k % 2 ? "#e85a9a" : "#f2f2f2");
      px(x + 3, y + 14, 6, 4, "#cfe8ff"); px(x + 13, y + 14, 3, 6, "#8a5a32");
      { const cx = x + 11, cy = y + 5;                                                           // giant donut on the roof
        for (let k = -5; k <= 5; k++) { const ww = Math.round(Math.sqrt(25 - k * k) * 2) + 1; px(cx - Math.floor(ww / 2), cy + Math.round(k * 0.8), ww, 1, k < 1 ? "#ff7ab8" : "#c8823a"); }
        px(cx - 1, cy - 1, 3, 2, "#3a5a32");
        for (const [dx, dy, c] of [[-3, -2, "#ffd23f"], [2, -3, "#5af0ff"], [3, -1, "#f2f2f2"], [-2, -3, "#2faa4a"], [-4, 0, "#3a6fd8"]] as const) px(cx + dx, cy + dy, 1, 1, c); }
      break;
    }
    case "graceland": { // the jet, the mansion, the King; then the Pyramid and the M bridge
      y = y0 + 4; x = free(y, 10, 16);
      px(x + 2, y + 3, 13, 2, "#f2f2f2"); px(x + 6, y, 2, 9, "#f2f2f2"); px(x + 13, y + 1, 2, 3, "#f2f2f2"); px(x + 4, y + 3, 4, 1, "#3a6fd8");
      y = y0 + 18; x = free(y, 30, 16);
      px(x, y + 4, 16, 9, "#f2f2f2"); px(x + 4, y, 8, 4, "#f2f2f2"); px(x + 4, y - 1, 8, 1, "#8a8a8a");
      for (let k = 0; k < 4; k++) px(x + 5 + 2 * k, y + 5, 1, 8, "#d0d0d0");
      px(x + 7, y + 9, 2, 4, "#5a3a1a");
      const e = y + 17;
      px(x + 2, e, 3, 2, "#111"); px(x + 4, e - 1, 2, 1, "#111"); px(x + 2, e + 2, 3, 2, "#f0c8a0");
      px(x + 1, e + 4, 5, 6, "#ffffff"); px(x, e + 5, 1, 3, "#ffffff"); px(x + 6, e + 5, 1, 3, "#ffffff");
      px(x + 1, e + 7, 5, 1, "#ffd23f"); px(x + 1, e + 4, 1, 1, "#ffd23f"); px(x + 5, e + 4, 1, 1, "#ffd23f");
      px(x + 1, e + 10, 2, 3, "#ffffff"); px(x + 4, e + 10, 2, 3, "#ffffff");
      px(x + 8, e + 4, 1, 1, "#ffd23f"); px(x + 10, e + 2, 1, 1, "#ffd23f"); px(x + 9, e + 1, 1, 2, "#ffd23f");
      water(px, y0 + 90, 10); bridge(px, y0 + 90, 10);
      y = y0 + 66; x = free(y, 24, 22);
      for (let r = 0; r < 20; r++) px(x + 11 - r * 0.55, y + r + 4, Math.round(r * 1.1) + 1, 1, r % 4 === 0 ? "#e8eef4" : "#b8c0c8");
      px(x + 11, y + 1, 1, 3, "#cfcfcf");
      for (let r = 0; r < 4; r++) { px(x + 1 + r, y0 + 86 + r, 1, 1, "#d8d8d8"); px(x + 8 - r, y0 + 86 + r, 1, 1, "#d8d8d8"); px(x + 8 + r, y0 + 86 + r, 1, 1, "#d8d8d8"); px(x + 15 - r, y0 + 86 + r, 1, 1, "#d8d8d8"); }
      break;
    }
    case "nashville": { // the Batman building, a three-floor club going off, then Buc-ee's
      y = y0 + 3; x = free(y, 34, 16);
      stars(px, x, y, 16, 6, rnd, 5);
      bldg(px, x + 1, y + 16, 4, 16, "#3a3f60", "#ffd23f", rnd);
      px(x + 7, y + 4, 6, 28, "#2f3450"); px(x + 7, y, 1, 4, "#2f3450"); px(x + 12, y, 1, 4, "#2f3450");
      for (let yy = y + 6; yy < y + 30; yy += 3) px(x + 8, yy, 4, 1, "#5a6090");
      px(x + 14, y + 26, 2, 6, "#c8702a"); px(x + 14, y + 22, 1, 4, "#5a3a1a");
      y = y0 + 40; x = free(y, 34, 26);                                                         // the club, cut away
      px(x, y, 26, 32, "#1a1424"); px(x, y - 2, 26, 2, "#3a2a4a");
      for (let f2 = 0; f2 < 4; f2++) {
        const fy = y + 1 + f2 * 8;
        px(x + 1, fy, 24, 6, "#2a1a3a"); px(x, fy + 6, 26, 1, "#5a4a6a");
        live.push({ k: "club", x: x + 1, y: fy, w: 24, h: 2 });
        for (let k = 0; k < 6; k++) px(x + 2 + k * 4, fy + 3, 2, 3, ["#f0c8a0", "#c08a5a", "#8a5a3a"][(k + f2) % 3]);
        for (let k = 0; k < 6; k++) px(x + 2 + k * 4, fy + 2, 2, 1, ["#ffd23f", "#e0302f", "#1a1a1a", "#f2f2f2"][(k + 2 * f2) % 4]);
      }
      px(x + 11, y + 26, 4, 7, "#ffd23f");                                                       // the door, a line outside
      for (let k = 0; k < 4; k++) person(px, x + 17 + (k % 2) * 4 - (k > 1 ? 8 : 0), y + 34, ["#e0302f", "#3a6fd8", "#f2f2f2", "#ff5ad1"][k]);
      y = y0 + 88; x = free(y, 24, 18);                                                         // Buc-ee's
      px(x + 8, y + 12, 2, 6, "#7a7a7a");
      px(x + 3, y, 12, 12, "#ffd23f"); px(x + 2, y + 1, 1, 10, "#ffd23f"); px(x + 15, y + 1, 1, 10, "#ffd23f");
      px(x + 5, y + 2, 8, 8, "#8a5a2a"); px(x + 5, y + 1, 2, 1, "#8a5a2a"); px(x + 11, y + 1, 2, 1, "#8a5a2a");
      px(x + 7, y + 4, 1, 1, "#000"); px(x + 10, y + 4, 1, 1, "#000"); px(x + 8, y + 7, 2, 2, "#f2f2f2");
      px(x, y + 18, 18, 5, "#c8ccd2"); px(x + 2, y + 19, 3, 2, "#e0302f");
      break;
    }
    case "gatlinburg": { // Space Needle, pancakes, moonshine, a mini-golf dinosaur, and the bear in the trash
      for (let k = 0; k < 20; k++) px(Math.floor(rnd() * W), y0 + 2 + Math.floor(rnd() * 6), 2, 1, "#a9c4b8");
      y = y0 + 6; x = free(y, 36, 16);
      px(x + 10, y, 1, 4, "#cfcfcf"); px(x + 7, y + 4, 7, 3, "#e8e8e8"); px(x + 8, y + 7, 5, 1, "#9a9a9a"); px(x + 9, y + 8, 3, 26, "#d8d8d8");
      px(x + 3, y + 14, 1, 20, "#7a7a7a");
      px(x, y + 10, 7, 2, "#d8903e"); px(x + 1, y + 8, 5, 2, "#e8a850"); px(x, y + 6, 7, 2, "#d8903e");
      px(x + 1, y + 5, 5, 1, "#7a3a1a"); px(x + 2, y + 4, 3, 1, "#fff0a0"); px(x, y + 6, 1, 3, "#7a3a1a"); px(x + 6, y + 6, 1, 4, "#7a3a1a");
      y = y0 + 46; x = free(y, 18, 22);                                                         // moonshine + a guy in a coonskin cap
      px(x + 2, y + 4, 9, 11, "#d8c8a8"); px(x + 4, y + 2, 5, 2, "#d8c8a8"); px(x + 5, y, 3, 2, "#8a5a32"); px(x + 8, y + 3, 3, 4, "#d8c8a8");
      px(x + 2, y + 8, 9, 4, "#f2ead8"); word(px, x + 2, y + 8 - 1 + 1, "XXX", "#1a1a1a", null);
      px(x + 14, y + 4, 3, 2, "#6a4a2a"); px(x + 17, y + 5, 3, 1, "#3a2a1a"); px(x + 13, y + 6, 1, 1, "#3a2a1a");
      person(px, x + 14, y + 5, "#5a7a3a", "#6a4a2a", "#3a5a8a");
      px(x + 13, y + 9, 1, 2, "#f0c8a0"); px(x + 12, y + 8, 1, 2, "#e8e8e8");
      y = y0 + 66; x = free(y, 14, 20);                                                         // mini-golf T. rex
      px(x, y + 10, 20, 4, "#2faa4a"); px(x + 17, y + 11, 1, 1, "#111"); px(x + 17, y + 8, 1, 3, "#f2f2f2"); px(x + 18, y + 8, 2, 1, "#e0302f");
      px(x + 4, y + 2, 7, 6, "#3a9a4a"); px(x + 9, y - 2, 5, 4, "#3a9a4a"); px(x + 12, y, 2, 1, "#f2f2f2"); px(x + 11, y - 1, 1, 1, "#111");
      px(x + 1, y + 4, 4, 2, "#3a9a4a"); px(x, y + 5, 2, 1, "#3a9a4a"); px(x + 5, y + 8, 2, 2, "#3a9a4a"); px(x + 9, y + 8, 2, 2, "#3a9a4a"); px(x + 11, y + 4, 2, 1, "#3a9a4a");
      y = y0 + 84; x = free(y, 14, 16);                                                         // the bear, butt up in the trash
      px(x + 1, y + 6, 6, 6, "#8a8f99"); px(x + 2, y + 7, 1, 4, "#6a6f79"); px(x + 4, y + 7, 1, 4, "#6a6f79");
      px(x, y, 8, 6, "#1a1a1a"); px(x + 3, y - 1, 2, 1, "#3a3a3a"); px(x - 1, y + 1, 1, 4, "#1a1a1a"); px(x + 8, y + 1, 1, 4, "#1a1a1a");
      px(x + 9, y + 11, 4, 1, "#9aa0a8"); px(x + 10, y - 3, 1, 1, "#f2f2f2"); px(x + 12, y + 1, 2, 1, "#ffd23f");
      break;
    }
    case "smoky": // the layered ridges are the ground; the trail turns off and the woods swallow the van
      for (const yy of [y0 + 6, y0 + h - 14]) { const xx = free(yy, 10, 14); pine(px, xx + 3, yy, "#12302a"); pine(px, xx + 9, yy + 2, "#12302a"); }
      break;
    case "waffle": { // a Waffle House in Cherokee, and Rivian chargers
      y = y0 + 4; x = free(y, 36, 26);
      px(x + 12, y + 16, 1, 6, "#7a7a7a");
      px(x, y, 25, 16, "#111");
      word(px, x + 2, y + 2, "WAFFLE"); word(px, x + 4, y + 9, "HOUSE");
      y = y0 + 26; x = free(y, 14, 16);
      px(x, y, 16, 1, "#4a3a2a"); px(x, y + 1, 16, 2, "#ffd23f");
      px(x + 1, y + 3, 14, 9, "#d8c8a0"); px(x + 1, y + 11, 14, 1, "#8a6a4a");
      for (let k = 2; k < 13; k += 4) px(x + k, y + 5, 3, 3, "#ffe9a0");
      px(x + 12, y + 6, 2, 6, "#5a3a1a");
      y = y0 + 48; x = free(y, 26, 22);                                                          // Rivian Adventure Network
      px(x, y, 22, 2, "#3a3a3e"); px(x, y + 2, 22, 1, "#ffd23f");
      for (let k = 0; k < 4; k++) { px(x + 1 + k * 6, y + 4, 2, 8, "#e8e8e8"); px(x + 1 + k * 6, y + 6, 2, 1, "#ffd23f"); px(x + 3 + k * 6, y + 8, 1, 3, "#1a1a1a"); }
      px(x, y + 13, 22, 10, "#4a4a4e"); for (let k = 0; k < 4; k++) px(x + k * 6, y + 13, 1, 10, "#e8e8e8");
      px(x + 1, y + 15, 4, 7, "#3f5a3a"); px(x + 2, y + 16, 2, 2, "#1a2a3a"); px(x + 1, y + 21, 1, 1, "#fff6c0"); px(x + 4, y + 21, 1, 1, "#fff6c0"); // an R1T
      px(x + 7, y + 15, 4, 7, "#e8e8e8"); px(x + 8, y + 16, 2, 2, "#1a2a3a"); px(x + 7, y + 21, 1, 1, "#fff6c0"); px(x + 10, y + 21, 1, 1, "#fff6c0");
      break;
    }
    case "fair": { // Marion: low-key. A pop-up tent, folding tables, a grill, a flag
      y = y0 + 8; x = free(y, 22, 24);
      px(x + 1, y, 14, 2, "#f2f2f2"); px(x, y + 2, 16, 1, "#d8d8d8"); px(x + 1, y + 3, 1, 8, "#9a9a9a"); px(x + 14, y + 3, 1, 8, "#9a9a9a");
      px(x + 3, y + 7, 10, 1, "#8a6a42"); px(x + 4, y + 8, 1, 3, "#5a5a5a"); px(x + 11, y + 8, 1, 3, "#5a5a5a");
      px(x + 5, y + 6, 2, 1, "#e0302f"); px(x + 9, y + 6, 1, 1, "#ffd23f");
      person(px, x + 6, y + 3, "#3a6a9a", "#3a2a1a");
      px(x + 18, y + 6, 4, 3, "#1a1a1a"); px(x + 19, y + 9, 1, 2, "#5a5a5a"); px(x + 21, y + 9, 1, 2, "#5a5a5a"); px(x + 19, y + 3, 1, 2, "#b8b8b8"); px(x + 20, y + 1, 1, 2, "#d8d8d8");
      y = y0 + 34; x = free(y, 22, 16);
      px(x + 1, y, 1, 22, "#cfcfcf");
      px(x + 2, y, 13, 9, "#c8202a");
      for (let k = 0; k < 13; k++) { const yy = Math.round((k * 8) / 12); px(x + 2 + k, y + yy, 1, 1, "#2a3a8a"); px(x + 2 + k, y + 8 - yy, 1, 1, "#2a3a8a"); }
      for (const [dx, dy] of [[2, 1], [4, 3], [8, 4], [10, 2], [12, 1], [10, 6], [4, 6]]) px(x + 2 + dx, y + dy, 1, 1, "#f2f2f2");
      person(px, x + 6, y + 13, "#8a8a6a", "#e0302f"); person(px, x + 11, y + 12, "#f2f2f2", "#5a4a3a");
      break;
    }
    case "dish": { // the Green Bank Telescope, an alien, and the dam
      y = y0 + 4; x = free(y, 32, 18);
      px(x + 1, y + 6, 16, 1, "#f2f2f2"); px(x + 2, y + 7, 14, 1, "#f2f2f2"); px(x + 4, y + 8, 10, 1, "#dcdcdc");
      px(x + 8, y, 1, 6, "#cfcfcf"); px(x + 7, y - 1, 3, 1, "#cfcfcf");
      px(x + 6, y + 9, 1, 15, "#9a9a9a"); px(x + 11, y + 9, 1, 15, "#9a9a9a"); px(x + 6, y + 16, 6, 1, "#9a9a9a");
      px(x + 4, y + 24, 10, 2, "#7a7a7a");
      px(x + 14, y + 18, 3, 3, "#6ae85a"); px(x + 14, y + 19, 1, 1, "#111"); px(x + 16, y + 19, 1, 1, "#111"); px(x + 15, y + 21, 1, 3, "#6ae85a");
      px(x + 14, y + 22, 1, 1, "#6ae85a"); px(x + 16, y + 22, 1, 1, "#6ae85a"); px(x + 17, y + 17, 1, 1, "#6ae85a"); px(x + 13, y + 17, 1, 1, "#6ae85a");
      y = y0 + 44; x = free(y, 32, 26);                                                          // the dam
      px(x, y, 26, 12, "#2f6fb0"); px(x + 2, y + 3, 8, 1, "#5f9fe0"); px(x + 14, y + 7, 7, 1, "#5f9fe0");
      px(x - 1, y + 12, 28, 4, "#c8c4b8"); px(x - 1, y + 12, 28, 1, "#e8e4d8");
      for (let k = 2; k < 26; k += 5) px(x + k, y + 13, 1, 3, "#9a968a");
      px(x + 10, y + 16, 6, 12, "#8ac8f0"); for (let k = 0; k < 6; k++) px(x + 10 + Math.floor(rnd() * 6), y + 17 + Math.floor(rnd() * 10), 1, 2, "#f2fbff");
      px(x + 7, y + 28, 12, 2, "#e8f8ff");
      break;
    }
    case "dc": // the Capitol and the Monument over the reflecting pool
      px(L + 1, y0 + 14, 9, 4, "#f2f2f2"); px(L + 3, y0 + 11, 5, 3, "#f2f2f2"); px(L + 4, y0 + 9, 3, 2, "#f2f2f2"); px(L + 5, y0 + 8, 1, 1, "#f2f2f2");
      for (let k = 2; k < 10; k += 2) px(L + k, y0 + 15, 1, 3, "#c8c8c8");
      px(L + 12, b - 32, 3, 28, "#f2f2f2"); px(L + 13, b - 34, 1, 2, "#f2f2f2"); px(L + 12, b - 4, 3, 1, "#c8c8c8");
      px(L, b - 1, 16, 4, "#2f6fb0"); px(L + 12, b, 3, 2, "#9ac8f0");
      break;
    case "jersey": { // Paterson's Great Falls, and the food market
      y = y0 + 4; x = free(y, 26, 18);
      px(x, y, 18, 5, "#7a7a72"); px(x + 3, y + 5, 12, 16, "#5fa8e8");
      for (let k = 0; k < 10; k++) px(x + 4 + Math.floor(rnd() * 10), y + 5 + Math.floor(rnd() * 15), 1, 2, "#e8f4ff");
      px(x + 1, y + 21, 16, 3, "#2f6fb0"); px(x + 2, y + 20, 14, 1, "#f2fbff");
      y = y0 + 36; x = free(y, 30, 24);
      for (let k = 0; k < 3; k++) {                                                              // market stalls
        const sx2 = x + k * 8, c = ["#e0302f", "#2faa4a", "#3a6fd8"][k];
        for (let s2 = 0; s2 < 7; s2++) px(sx2 + s2, y, 1, 3, s2 % 2 ? c : "#f2f2f2");
        px(sx2, y + 3, 1, 6, "#8a6a42"); px(sx2 + 6, y + 3, 1, 6, "#8a6a42"); px(sx2, y + 7, 7, 2, "#a8743e");
        for (let s2 = 0; s2 < 3; s2++) px(sx2 + 1 + s2 * 2, y + 6, 1, 1, ["#ff8a1f", "#e0302f", "#ffd23f", "#2faa4a", "#b04ad8"][(k + s2) % 5]);
      }
      for (let k = 0; k < 4; k++) person(px, x + 1 + k * 6, y + 12 + (k % 2) * 3, ["#ffd23f", "#e0302f", "#f2f2f2", "#b04ad8"][k], ["#1a1a1a", "#5a3a1a", "#e8e8e8", "#1a1a1a"][k]);
      break;
    }
    case "liberty":
      bldg(px, L, y0 + 4, 3, 10, "#7a808a", "#e8eef4", rnd); bldg(px, L + 4, y0 + 2, 3, 12, "#6a707a", "#e8eef4", rnd);
      bldg(px, L + 8, y0 + 5, 3, 9, "#8a909a", "#e8eef4", rnd);
      px(L + 6, b - 14, 3, 14, "#5fae96"); px(L + 6, b - 17, 3, 3, "#5fae96"); px(L + 8, b - 21, 1, 5, "#5fae96"); px(L + 8, b - 22, 1, 1, "#ffd23f");
      px(L + 4, b, 7, 3, "#7a6a5a");
      px(L - 1, b + 6, 7, 2, "#ff8a2a"); // the ferry
      break;
  }
}
