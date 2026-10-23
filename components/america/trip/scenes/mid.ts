// The middle of the country: Kansas on a dead-straight I-70 (wheat, then green), Tulsa, Muskogee,
// Little Rock, the Horseshoe and Hernando, Graceland and Memphis, Nashville and Buc-ee's.
import { W, HOLDS, roadX, room, free, beside, hash, top, bottom } from "../core";
import type { SceneMod, Px } from "../kit";
import { pine, bldg, stars, river, person, cowboy, pivot, word, wordW, pick, usFlag, flagPole,
  eTree, eDogwood, eHouse, eRock, eCow, eSunflower, eHay } from "../kit";
import type { Live } from "../fx";

/* ---------- local helpers ---------- */

type S = "l" | "r";
// x for w wide on a given side, centred in the room there (hugs the road and runs off the edge if too wide)
const at = (y: number, h: number, w: number, side: S) => free(y, h, w, side);
// a mown/dirt pad under a landmark so it reads against the fields
function pad(px: Px, x: number, y: number, w: number, h: number, c = "#b89a62", e = "#a0844e") {
  px(x, y, w, h, c); px(x, y, w, 1, e); px(x, y + h - 1, w, 1, e); px(x, y, 1, h, e); px(x + w - 1, y, 1, h, e);
}
// a waving flag on a pole (pole static, flag live)
function wave(px: Px, live: Live[], x: number, y: number, ph = 10, w = 7, h = 4) {
  px(x, y, 1, ph, "#cfcfcf"); px(x, y - 1, 1, 1, "#ffd23f");
  live.push({ k: "flag", x: x + 1, y, w, h, kind: "us" });
}
// an Irish tricolor on a pole, waving
function irish(px: Px, live: Live[], x: number, y: number, ph = 10, w = 8, h = 5) {
  px(x, y, 1, ph, "#cfcfcf"); px(x, y - 1, 1, 1, "#ffd23f");
  live.push({ k: "fn", fn: (f, t) => {
    for (let c = 0; c < w; c++) {
      const wv = Math.round(Math.sin(t * 5 - c * 0.7 + x) * 0.9 * (c / w));
      f(x + 1 + c, y + wv, 1, h, c < w / 3 ? "#169b62" : c < (2 * w) / 3 ? "#f4f4f4" : "#ff883e");
    }
  } });
}
// smooth value noise in 0..1 (for patchy fields)
function noise(x: number, y: number, s: number, seed = 0) {
  const gx = Math.floor(x / s), gy = Math.floor(y / s), fx = x / s - gx, fy = y / s - gy;
  const v = (a: number, b: number) => hash(a * 7919 + b * 104729 + seed * 1301);
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const top = v(gx, gy) + (v(gx + 1, gy) - v(gx, gy)) * sx, bot = v(gx, gy + 1) + (v(gx + 1, gy + 1) - v(gx, gy + 1)) * sx;
  return top + (bot - top) * sy;
}
// golden wheat in straight rows that run with the road
function wheat(px: Px, y0: number, h: number) {
  for (let y = y0; y < y0 + h; y++) for (let x = 0; x < W; x++) {
    const tram = x % 26 === 9 || x % 26 === 11;
    const n = hash(x * 31 + y * 7);
    px(x, y, 1, 1, tram ? "#d8b450" : x % 3 === 0 ? "#c8962a" : n < 0.08 ? "#f4dc78" : x % 3 === 1 ? "#e8c040" : "#ddb236");
  }
}
// patchwork green with a few gold leftovers
function patchy(px: Px, y0: number, h: number, gold = 0) {
  const P = ["#4f9a32", "#5fae38", "#7abc42", "#8ac84a", "#a8c850", "#d8b848", "#c8a03a"];
  for (let y = y0; y < y0 + h; y++) for (let x = 0; x < W; x++) {
    const fade = Math.max(0, 1 - (y - y0) / 40) * gold;
    let n = noise(x, y, 11) * 0.75 + noise(x, y, 4, 3) * 0.25 + fade * 0.6;
    n = Math.min(0.999, n);
    const c = P[Math.floor(n * P.length)];
    px(x, y, 1, 1, (y + Math.floor(x / 9)) % 3 === 0 ? shadeC(c, 14) : c);
  }
}
const shadeC = (c: string, d: number) => "#" + [1, 3, 5].map((i) => Math.max(0, parseInt(c.slice(i, i + 2), 16) - d).toString(16).padStart(2, "0")).join("");
// a person 3 wide 9 tall with hair color and optional cap
function folk(px: Px, x: number, y: number, o: { skin?: string; hair?: string; shirt: string; pants?: string; cap?: string; shoes?: string }) {
  const skin = o.skin ?? "#e0b090";
  px(x, y, 3, 1, o.cap ?? o.hair ?? "#3a2a1a"); if (o.cap) px(x + 3, y, 1, 1, o.cap);
  px(x, y + 1, 3, 2, skin); if (o.hair) px(x, y + 1, 1, 2, o.hair);
  px(x, y + 3, 3, 3, o.shirt); px(x - 1, y + 3, 1, 3, skin); px(x + 3, y + 3, 1, 3, skin);
  px(x, y + 6, 1, 2, o.pants ?? "#2a2a3a"); px(x + 2, y + 6, 1, 2, o.pants ?? "#2a2a3a");
  px(x, y + 8, 1, 1, o.shoes ?? "#1a1a1a"); px(x + 2, y + 8, 1, 1, o.shoes ?? "#1a1a1a");
}
// side-view semi truck, 22 wide
function semi(px: Px, x: number, y: number, cab = "#e0302f", box = "#f2f2f2") {
  px(x, y, 16, 7, box); px(x, y + 6, 16, 1, "#b8b8b8");
  px(x + 17, y + 2, 5, 5, cab); px(x + 18, y + 3, 3, 2, "#9ad0e8"); px(x + 16, y + 3, 1, 4, "#5a5a5a");
  for (const dx of [2, 5, 12, 18]) px(x + dx, y + 7, 2, 2, "#111");
}
// a parked car, side view, 7 wide
function car(px: Px, x: number, y: number, c: string) { px(x, y + 1, 7, 2, c); px(x + 1, y, 5, 1, c); px(x + 2, y, 3, 1, "#cfe8ff"); px(x + 1, y + 3, 1, 1, "#111"); px(x + 5, y + 3, 1, 1, "#111"); }
// stone/brick wall texture
function blocks(px: Px, x: number, y: number, w: number, h: number, a: string, b: string, mortar: string) {
  px(x, y, w, h, a);
  for (let r = 0; r < h; r++) {
    if (r % 3 === 2) { px(x, y + r, w, 1, mortar); continue; }
    const off = Math.floor(r / 3) % 2 ? 2 : 0;
    for (let c = off; c < w; c += 5) { px(x + c, y + r, 1, 1, mortar); if (hash(c * 13 + r * 7 + x) > 0.6) px(x + c + 1, y + r, 2, 1, b); }
  }
}
// a lattice mast, w wide, h tall
function lattice(px: Px, x: number, y: number, w: number, h: number, c: string) {
  px(x, y, 1, h, c); px(x + w - 1, y, 1, h, c);
  for (let r = 0; r < h; r += 3) { px(x, y + r, w, 1, c); for (let k = 1; k < w - 1; k++) px(x + k, y + r + Math.min(2, k), 1, 1, c); }
}

// word() plus the letters the shared font lacks
const MORE: Record<string, string> = { J: "011001001101010" };
function word2(px: Px, x: number, y: number, str: string, fg: string) {
  [...str].forEach((ch, n) => { if (MORE[ch]) MORE[ch].split("").forEach((b, k) => { if (b === "1") px(x + n * 4 + (k % 3), y + Math.floor(k / 3), 1, 1, fg); }); else word(px, x + n * 4, y, ch, fg, null); });
}


/* ---------- the long Kansas sundown ---------- */

// how far into the sundown row y is: 0 at Colby, 1 at the Oklahoma line
const sun = (y: number) => Math.min(1, Math.max(0, (y - top("silo")) / (bottom("plains") - top("silo"))));
const mix = (a: string, b: string, u: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - u) + parseInt(b.slice(i, i + 2), 16) * u).toString(16).padStart(2, "0")).join("");
// endless corn rows running with the road, lit low from the west: gold going to fire, the furrows going purple.
// patch > 0 mixes in patches of greener corn (Hays)
function corn(px: Px, y0: number, h: number, patch = 0) {
  for (let y = y0; y < y0 + h; y++) {
    const u = sun(y);
    const lit = mix("#e8b030", "#ff6a1a", u), litG = mix("#a8b030", "#e8701a", u), hi = mix("#fff0a0", "#ffd04a", u);
    const fur = mix("#7a5a18", "#4a1838", u), fur2 = mix("#9a7020", "#7a2a3a", u);
    for (let x = 0; x < W; x++) {
      const row = x % 4, g = patch && noise(x, y, 13, 5) < 0.42 * patch;
      const L = g ? litG : lit, leaf = (y + (Math.floor(x / 4) % 3)) % 3 === 0;
      let c = row === 0 ? fur : row === 3 ? fur2 : row === 1 ? L : leaf ? mix(L, hi, 0.45) : mix(L, fur2, 0.18);
      if (row === 1 && hash(x * 31 + y * 7) < 0.02) c = hi;                 // a tassel catching the last light
      px(x, y, 1, 1, c);
    }
  }
}
// rects of everything a scene draws, so the turbines can go in the gaps
type R4 = [number, number, number, number];
function recorder(px: Px, rec: R4[]): Px { return (x, y, w, h, c) => { rec.push([x, y, w, h]); px(x, y, w, h, c); }; }
const hit = (rec: R4[], x: number, y: number, w: number, h: number) => rec.some(([a, b, c, d]) => a < x + w && a + c > x && b < y + h && b + d > y);
// a field of turbines filling every gap between ya and yb; their red lights flash together, faster and
// redder and in rolling waves the further into the sundown you get, until they've got you
function windfarm(px: Px, live: Live[], rec: R4[], ya: number, yb: number, seed: number) {
  const T: [number, number][] = [];
  for (let gy = ya; gy < yb - 20; gy += 13) for (let gx = 4 + ((Math.round((gy - ya) / 13)) % 2) * 6; gx < W - 2; gx += 12) {
    const x = Math.round(gx + (hash(gx * 7 + gy + seed) - 0.5) * 4), y = Math.round(gy + (hash(gx + gy * 3 + seed) - 0.5) * 4);
    const r = room(y - 8, 28);
    if (x + 11 > r.lo - 6 && x - 8 < r.hi + 6) continue;
    if (hit(rec, x - 6, y - 4, 13, 25)) continue;
    T.push([x, y]); rec.push([x - 6, y - 4, 13, 25]);
  }
  for (const [x, y] of T) {
    const u = sun(y);
    px(x, y, 1, 18, mix("#f2f2f2", "#ffc89a", u)); px(x + 1, y, 1, 18, mix("#cfcfcf", "#a85a5a", u)); px(x - 1, y - 1, 3, 2, "#f2f2f2");
    for (let k = 1; k < 9; k++) px(x + 1 + k, y + 18 + Math.floor(k / 3), 1, 1, mix("#7a5a18", "#3a1030", u));   // its shadow, long, off to the east
  }
  T.forEach(([x, y], i) => live.push(blades(x + 1, y, 7, 1.4 + hash(i + seed) * 0.4, i)));
  live.push({ k: "fn", fn: (f, t, ctx) => {
    for (const [x, y] of T) {
      const u = sun(y), sp = 0.9 + u * 1.4, ph = (t * sp - u * u * (y * 0.03 + Math.abs(x - 64) * 0.04)) % 1;
      if (ph > 0.18 + u * 0.12) continue;
      const a = 1 - ph / (0.18 + u * 0.12);
      const R = 1 + Math.round(u * 3);
      for (let d = R; d >= 1; d--) { ctx.globalAlpha = 0.18 * a * (0.5 + u) * (1 - d / (R + 1)); f(x - d, y - 1, 2 + 2 * d, 1, "#ff2a1a"); f(x, y - 1 - d, 2, 1 + 2 * d, "#ff2a1a"); }
      ctx.globalAlpha = 1; f(x, y - 1, 2, 1, a > 0.5 ? "#ff3a2a" : "#b01010");
    }
  } });
}

/* ---------- animated bits ---------- */

// wind turbine blades turning about (cx, cy)
const blades = (cx: number, cy: number, r: number, sp: number, ph: number): Live => ({ k: "fn", fn: (f, t) => {
  for (let b = 0; b < 3; b++) {
    const a = t * sp + ph + (b * 2 * Math.PI) / 3;
    for (let k = 1; k <= r; k++) f(cx + Math.cos(a) * k, cy + Math.sin(a) * k, 1, 1, k > r - 2 ? "#d8d8d8" : "#f8f8f8");
  }
  f(cx - 1, cy - 1, 2, 2, "#cfcfcf");
} });
// an old farm windmill wheel, spinning
const wheel = (cx: number, cy: number, sp: number): Live => ({ k: "fn", fn: (f, t) => {
  for (let b = 0; b < 8; b++) { const a = t * sp + (b * Math.PI) / 4; for (let k = 1; k <= 4; k++) f(cx + Math.cos(a) * k, cy + Math.sin(a) * k, 1, 1, k === 4 ? "#c8c8c8" : "#efefef"); }
  f(cx, cy, 1, 1, "#444");
} });
// a combine working the wheat, up and down a strip, chaff behind it
const combine = (x: number, a: number, b: number): Live => ({ k: "fn", fn: (f, t, ctx) => {
  const span = b - a, p = (t * 4) % (2 * span), down = p < span, y = Math.round(down ? a + p : b - (p - span));
  const hy = down ? y + 8 : y - 2;
  f(x - 5, hy, 11, 2, "#ffd23f"); f(x - 5, hy + (down ? 1 : 0), 11, 1, "#c8a020");
  f(x - 3, y, 7, 8, "#2f8a3a"); f(x - 2, y + (down ? 4 : 1), 3, 3, "#cfe8ff"); f(x + 3, y + 1, 3, 1, "#2f8a3a");
  f(x - 3, y + (down ? 0 : 7), 7, 1, "#1f6a2a");
  for (let k = 0; k < 6; k++) { const u = (t * 1.5 + k / 6) % 1; ctx.globalAlpha = 0.6 * (1 - u); f(x - 2 + hash(k) * 5, (down ? y - 1 - u * 8 : y + 9 + u * 8), 2, 1, "#f0dc90"); ctx.globalAlpha = 1; }
} });

// cows that wander and graze inside a box (x0..x1, ya..yb), never leaving it
const herd = (n: number, x0: number, x1: number, ya: number, yb: number, seed: number): Live => ({ k: "fn", fn: (f, t) => {
  for (let k = 0; k < n; k++) {
    const h1 = hash(seed * 31 + k * 7), h2 = hash(seed * 17 + k * 13), sp = 0.12 + h1 * 0.1;
    const ax = t * sp + h2 * 6.28, ay = t * sp * 0.7 + h1 * 6.28;
    const x = Math.round(x0 + (x1 - x0 - 8) * (0.5 + 0.5 * Math.sin(ax))), y = Math.round(ya + (yb - ya - 5) * (0.5 + 0.5 * Math.sin(ay)));
    const vx = Math.cos(ax), dir = vx >= 0 ? 1 : -1, graze = Math.abs(vx) < 0.35;
    const holstein = k % 3 === 0, body = holstein ? "#f2f2f2" : k % 3 === 1 ? "#7a4a2a" : "#3a2a22";
    f(x + 1, y + 1, 6, 3, body); if (holstein) { f(x + 2, y + 1, 2, 2, "#1a1a1a"); f(x + 5, y + 2, 1, 2, "#1a1a1a"); }
    const hx = dir > 0 ? x + 7 : x - 1, hy = graze ? y + 3 : y;
    f(hx, hy, 2, 2, holstein ? "#1a1a1a" : body); f(dir > 0 ? hx + 1 : hx, hy + 1, 1, 1, "#e8b0a0");
    f(dir > 0 ? x : x + 7, y + 1, 1, 2, holstein ? "#1a1a1a" : body);                                        // tail
    const leg = graze ? 0 : Math.floor(t * 5 + k) % 2;
    f(x + 1 + leg, y + 4, 1, 1, "#2a1a10"); f(x + 5 - leg, y + 4, 1, 1, "#2a1a10");
  }
} });
// a box beside the road on one side between rows ya..yb (for herds), clear of the shoulder
function field(side: S, ya: number, yb: number, w = 34) {
  const r = room(ya, yb - ya);
  return side === "l" ? { x0: Math.max(1, Math.round(r.lo - 8 - w)), x1: Math.round(r.lo - 8) } : { x0: Math.round(r.hi + 8), x1: Math.min(W - 1, Math.round(r.hi + 8 + w)) };
}

// a cute dog seen from above: floppy ears, black nose, wagging tail. d = facing (0 down, 1 right, 2 left), s = 0.75 for a puppy
type F = (x: number, y: number, w: number, h: number, c: string) => void;
function topDog(f: F, x: number, y: number, col: string, ear: string, t: number, k: number, d: 0 | 1 | 2, pup = false) {
  const wag = Math.floor(t * 12 + k) % 2 ? 1 : -1, leg = Math.floor(t * 10 + k) % 2;
  if (d === 0) {
    const L = pup ? 4 : 5;
    f(x, y, 3, L, col);                                                                   // body
    f(x + 1 + wag, y - 2, 1, 2, col);                                                     // tail, wagging
    f(x - 1, y + 1 + leg, 1, 1, col); f(x + 3, y + 2 - leg, 1, 1, col); f(x - 1, y + L - 2 + leg, 1, 1, col); f(x + 3, y + L - 1 - leg, 1, 1, col);
    f(x - 0, y + L, 3, 3, col); f(x - 1, y + L, 1, 3, ear); f(x + 3, y + L, 1, 3, ear);   // head, floppy ears
    f(x + 1, y + L + 3, 1, 1, "#111"); f(x, y + L + 1, 1, 1, "#111"); f(x + 2, y + L + 1, 1, 1, "#111");
    if (leg) f(x + 1, y + L + 4, 1, 1, "#ff7a8a");                                        // tongue
  } else {
    const s = d === 1 ? 1 : -1, L = pup ? 4 : 5, hx = s > 0 ? x + L : x - 3;
    f(x, y, L, 3, col);
    f(s > 0 ? x - 2 : x + L, y + 1 + wag, 2, 1, col);
    f(x + leg, y + 3, 1, 1, col); f(x + L - 1 - leg, y + 3, 1, 1, col);
    f(hx, y - 1, 3, 3, col); f(hx, y - 2, 1, 2, ear); f(hx + 2, y - 2, 1, 2, ear);
    f(s > 0 ? hx + 3 : hx - 1, y, 1, 1, "#111"); f(hx + 1, y - 1, 1, 1, "#111");
    if (leg) f(s > 0 ? hx + 3 : hx - 1, y + 1, 1, 1, "#ff7a8a");
  }
}

/* ---------- the scenes ---------- */

export const SC_MID: Partial<Record<string, SceneMod>> = {
  truckstop: { // The Oasis on I-70: a truck stop with fake palms, a Bigfoot statue, a flag the size of a barn
    ground: ["#e8c040", "#d8ac30"],
    edge: pick(eHay),
    under: ({ px, y0, h }) => wheat(px, y0, h),
    draw: ({ px, y0, live }) => {
      let x = 0, y = 0;
      // the truck stop
      y = y0 + 25; x = at(y - 14, 50, 58, "r") + 4; x = Math.min(x, W - 62);
      pad(px, x - 2, y - 2, 60, 46, "#8a8a8e", "#6a6a6e");
      for (let k = 0; k < 6; k++) px(x + 2 + k * 9, y + 38, 1, 4, "#e8e8e8");                                   // parking stripes
      px(x, y, 34, 4, "#e0302f"); px(x, y + 4, 34, 1, "#f2f2f2"); px(x, y + 5, 34, 1, "#2f8a4a");                // the canopy
      px(x + 2, y + 6, 1, 9, "#cfcfcf"); px(x + 31, y + 6, 1, 9, "#cfcfcf");
      for (const dx of [7, 15, 23]) { px(x + dx, y + 9, 3, 6, "#e8e8e8"); px(x + dx + 1, y + 10, 1, 2, "#2faa4a"); px(x + dx, y + 15, 3, 1, "#5a5a5a"); }
      car(px, x + 4, y + 11, "#3a6fd8");
      px(x, y + 19, 30, 1, "#7a3a1a"); px(x - 1, y + 18, 32, 1, "#9a4a22");                                    // the store
      px(x, y + 20, 30, 11, "#e8d8b0"); px(x + 2, y + 23, 8, 4, "#9ad0e8"); px(x + 20, y + 23, 8, 4, "#9ad0e8"); px(x + 13, y + 23, 4, 8, "#5a3a1a");
      px(x + 2, y + 21, 26, 1, "#2f8a4a");
      for (const dx of [-3, 32]) { px(x + dx, y + 19, 1, 12, "#7a4a22"); px(x + dx - 3, y + 18, 7, 1, "#2f8a3a"); px(x + dx - 2, y + 17, 5, 1, "#3faa4a"); px(x + dx - 4, y + 19, 1, 1, "#2f8a3a"); px(x + dx + 4, y + 19, 1, 1, "#2f8a3a"); }
      px(x + 47, y - 12, 1, 30, "#9a9a9a");                                                                     // the tall sign
      px(x + 36, y - 22, 23, 11, "#1f6a3a"); px(x + 37, y - 21, 21, 9, "#2f8a4a"); word(px, x + 38, y - 19, "OASIS", "#ffd23f", null);
      px(x + 37, y - 13, 21, 1, "#ffd23f");
      semi(px, x + 34, y + 2); semi(px, x + 34, y + 12, "#3a6fd8", "#e8e8e8"); semi(px, x + 34, y + 22, "#2a2a2a", "#c8302a");
      // Bigfoot, mid-stride on his plinth
      y = y0 + 62; x = at(y, 30, 18, "l");
      pad(px, x - 2, y - 2, 22, 34, "#7aa84a", "#6a983a");
      px(x + 1, y + 26, 16, 4, "#8a8a8e"); px(x + 1, y + 26, 16, 1, "#aaaab0");
      const B = "#4a2e1a", BL = "#6a4428";
      px(x + 7, y, 5, 5, B); px(x + 8, y + 2, 3, 2, "#8a6a50"); px(x + 8, y + 2, 1, 1, "#111"); px(x + 10, y + 2, 1, 1, "#111");
      px(x + 5, y + 5, 9, 10, B); px(x + 6, y + 6, 3, 6, BL);
      px(x + 3, y + 6, 2, 8, B); px(x + 2, y + 13, 2, 2, B);                       // arm swinging back
      px(x + 14, y + 5, 2, 7, B); px(x + 15, y + 11, 2, 2, B);                     // arm forward
      px(x + 5, y + 15, 3, 6, B); px(x + 4, y + 21, 3, 5, B); px(x + 3, y + 25, 4, 1, B);  // leg back
      px(x + 11, y + 15, 3, 5, B); px(x + 12, y + 20, 3, 6, B); px(x + 12, y + 25, 4, 1, B); // leg forward
      for (let k = 0; k < 6; k++) px(x + 5 + hash(k * 3) * 9, y + 6 + hash(k * 5) * 9, 1, 1, BL);
      // a flag as big as a barn
      y = y0 + 70; x = at(y - 6, 40, 30, "r");
      px(x + 2, y + 32, 7, 2, "#8a8a8e"); px(x + 5, y - 6, 1, 38, "#d8d8d8"); px(x + 5, y - 7, 1, 1, "#ffd23f");
      live.push({ k: "flag", x: x + 6, y: y - 6, w: 20, h: 11, kind: "us" });
      live.push(herd(3, x + 8, x + 36, y + 18, y + 32, 1));
      // a combine going up and down the wheat out past it all
      live.push(combine(at(y0 + 90, 30, 12, "r") + 30 > W - 8 ? W - 9 : at(y0 + 90, 30, 12, "r") + 30, y0 + 84, y0 + 120));
      { const b = field("l", y0 + 100, y0 + 124, 30); live.push(herd(4, b.x0, b.x1, y0 + 100, y0 + 124, 2)); }
    },
  },
  silo: { // Colby, the sun going down: corn to the horizon, the elevator, a crossroad, and the wind farm starting to blink
    ground: ["#e8b838", "#d8a42c"],
    under: ({ px, y0, h }) => {
      corn(px, y0, h);
      for (let x = 0; x < W; x++) { px(x, y0 + 138, 1, 5, "#b89a62"); if (hash(x) > 0.7) px(x, y0 + 139 + (x % 3), 1, 1, "#a0844e"); }  // the county road
    },
    draw: ({ px: px0, y0, h, live }) => {
      const rec: R4[] = [], px = recorder(px0, rec);
      let x = 0, y = 0;
      // the elevator: four concrete bins and the headhouse, COLBY down the side
      y = y0 + 6; x = at(y, 44, 34, "r");
      pad(px, x - 3, y + 30, 40, 10);
      for (let k = 0; k < 4; k++) { const bx = x + k * 6; px(bx, y + 8, 6, 30, "#d8dce0"); px(bx, y + 8, 1, 30, "#f2f4f6"); px(bx + 5, y + 8, 1, 30, "#a8acb2"); px(bx, y + 7, 6, 1, "#a8acb2"); }
      px(x + 24, y, 8, 38, "#c8ccd2"); px(x + 24, y, 8, 1, "#9aa0a8"); px(x + 25, y + 2, 2, 2, "#5a6a7a"); px(x + 29, y + 2, 2, 2, "#5a6a7a");
      px(x + 31, y + 4, 1, 34, "#8a8f99");
      word(px, x + 2, y + 14, "COLBY", "#3a3f4a", null);
      px(x + 32, y + 20, 4, 1, "#8a8f99"); px(x + 35, y + 20, 1, 12, "#8a8f99");                 // the spout
      semi(px, x + 8, y + 31, "#2f8a3a", "#c8a050");
      // the farm by the crossroad, a pickup on the dirt road
      y = y0 + 120; x = at(y, 16, 30, "l");
      pad(px, x - 1, y - 1, 30, 16, "#7aa84a", "#6a983a");
      px(x, y + 5, 14, 9, "#b8302a"); for (let r = 0; r < 5; r++) px(x + 5 - r, y + r, 4 + 2 * r, 1, "#5a2a1a");
      px(x + 5, y + 8, 4, 6, "#f2f2f2"); px(x + 6, y + 9, 2, 5, "#7a1a14");
      px(x + 17, y + 7, 9, 7, "#ece6d8"); px(x + 16, y + 5, 11, 2, "#5a5a6a"); px(x + 19, y + 9, 2, 2, "#8ab0d8");
      px(at(y0 + 138, 5, 8, "r") + 20, y0 + 138, 8, 3, "#c8302a"); px(at(y0 + 138, 5, 8, "r") + 21, y0 + 137, 4, 1, "#9ad0e8");
      // a green road sign at the crossroad
      x = beside(y0 + 144, 10, 18, "r", 2);
      px(x + 8, y0 + 150, 1, 6, "#9a9a9a"); px(x, y0 + 144, 21, 7, "#1f6a3a"); px(x + 1, y0 + 145, 19, 5, "#2f8a4a"); word(px, x + 1, y0 + 145, "COLBY", "#f2f2f2", null);
      rec.push([0, y0 + 137, W, 7]);                                                                            // keep the county road clear
      // a scarecrow out in the rows, arms out, hat, a crow on his arm
      y = y0 + 64; x = at(y, 18, 14, "l") + 2;
      pad(px, x - 2, y + 14, 16, 4, "#b89a62", "#a0844e");
      px(x + 6, y + 3, 1, 15, "#6a4a2a"); px(x, y + 6, 13, 1, "#6a4a2a");
      px(x + 4, y, 5, 1, "#3a2a1a"); px(x + 3, y + 1, 7, 1, "#3a2a1a"); px(x + 5, y + 2, 3, 3, "#e8c890"); px(x + 5, y + 3, 1, 1, "#111"); px(x + 7, y + 3, 1, 1, "#111");
      px(x + 3, y + 5, 7, 6, "#3a6fd8"); px(x + 4, y + 5, 1, 6, "#e0302f"); px(x + 1, y + 6, 2, 2, "#e8c890"); px(x + 10, y + 6, 2, 2, "#e8c890");
      px(x + 11, y + 4, 2, 2, "#111"); px(x + 13, y + 5, 1, 1, "#e8a020");
      // a farmstead with grain bins way down the road, a pickup out front
      y = y0 + 200; x = at(y, 30, 40, "r");
      pad(px, x - 2, y - 2, 42, 32, "#8aa84a", "#7a983a");
      for (let k = 0; k < 3; k++) { const bx = x + k * 9; px(bx, y + 4, 8, 14, "#c8ccd2"); px(bx, y + 4, 1, 14, "#e8ecf0"); px(bx + 7, y + 4, 1, 14, "#9aa0a8"); for (let r = 0; r < 4; r++) px(bx + 3 - r, y + r, 2 + 2 * r, 1, "#a8acb2"); }
      px(x + 28, y + 8, 12, 10, "#ece6d8"); for (let r = 0; r < 4; r++) px(x + 33 - r, y + 4 + r, 2 + 2 * r, 1, "#5a5a6a"); px(x + 31, y + 11, 2, 2, "#ffe9a0"); px(x + 36, y + 12, 2, 6, "#5a3a1a");
      car(px, x + 4, y + 22, "#c8302a"); car(px, x + 16, y + 22, "#3a6fd8");
      windfarm(px0, live, rec, y0 + 10, y0 + h, 1);
      // a crop duster sweeping low over the corn, back and forth, spray behind it
      live.push({ k: "fn", fn: (f, t, ctx) => {
        const P = 9, u = (t % P) / P, dir = u < 0.5 ? 1 : -1, v = u < 0.5 ? u * 2 : (u - 0.5) * 2;
        const x = dir > 0 ? -16 + v * (W + 32) : W + 16 - v * (W + 32), y = y0 + (dir > 0 ? 92 : 176);
        f(x - 4, y, 9, 2, "#ffd23f"); f(x - 1, y - 3, 3, 8, "#ffd23f"); f(x + dir * 5, y, 1, 2, "#e0302f"); f(x - dir * 5, y - 1, 1, 4, "#ffd23f");
        f(x + dir * 2, y, 1, 1, "#3a6fd8");
        for (let k = 1; k < 10; k++) { ctx.globalAlpha = 0.35 * (1 - k / 10); f(x - dir * (4 + k * 2), y + 1 + (k % 2), 2, 2, "#f2f2e0"); } ctx.globalAlpha = 1;
      } });
    },
  },
  plains: { // Hays at sundown: patchy corn on fire with the light, the cross, the cathedral, the billboard, the adult store, bison, and the turbines blinking us to sleep
    ground: ["#7abc42", "#6aaa3a"],
    under: ({ px, y0, h }) => corn(px, y0, h, 1),
    draw: ({ px: px0, y0, h, live }) => {
      const rec: R4[] = [], px = recorder(px0, rec);
      let x = 0, y = 0;
      // JESUS IS REAL, across from the adult store
      y = y0 + 6; x = at(y, 26, 30, "r");
      px(x + 6, y + 14, 1, 10, "#7a5a3a"); px(x + 22, y + 14, 1, 10, "#7a5a3a");
      px(x, y, 30, 15, "#111"); px(x + 1, y + 1, 28, 13, "#f2f2f2");
      word2(px, x + 5, y + 2, "JESUS", "#111"); word(px, x + 2, y + 8, "IS REAL", "#c8202a", null);
      y = y0 + 10; x = at(y, 24, 28, "l");
      pad(px, x - 2, y + 4, 32, 22, "#9a9a9e", "#7a7a7e");
      px(x, y + 12, 26, 12, "#2a2a32"); px(x, y + 11, 26, 1, "#111"); px(x + 11, y + 17, 4, 7, "#111");
      px(x + 3, y, 20, 10, "#ffd23f"); px(x + 3, y + 9, 20, 1, "#c8a020"); word(px, x + 7, y + 2, "XXX", "#e0302f", null);
      px(x + 12, y + 10, 1, 2, "#9a9a9a");
      px(x + 2, y + 15, 6, 1, "#ff5ad1"); px(x + 18, y + 15, 6, 1, "#ff5ad1"); car(px, x + 2, y + 25 - 4, "#8a8a8a");
      // the big white cross on the rise, and the twin-towered Cathedral of the Plains
      y = y0 + 84; x = at(y, 36, 30, "r");
      for (let r = 0; r < 8; r++) px(x + 14 - r * 2, y + 28 + r, 4 + r * 4, 1, "#5f9a3a");
      px(x + 14, y, 3, 30, "#f8f8f8"); px(x + 16, y, 1, 30, "#d8d8d8"); px(x + 8, y + 7, 15, 3, "#f8f8f8"); px(x + 8, y + 9, 15, 1, "#d8d8d8");
      y = y0 + 122; x = at(y, 30, 26, "l");
      pad(px, x - 2, y + 22, 30, 6, "#7aa84a", "#6a983a");
      px(x, y + 10, 24, 14, "#d8c8a0"); for (let r = 0; r < 6; r++) px(x + 8 - r, y + 4 + r, 8 + 2 * r, 1, "#a8402a");
      for (const dx of [0, 19]) { px(x + dx, y - 2, 5, 26, "#e0d0a8"); px(x + dx + 1, y - 6, 3, 4, "#5aa88a"); px(x + dx + 2, y - 8, 1, 2, "#5aa88a"); px(x + dx + 2, y + 2, 1, 3, "#5a4a3a"); }
      px(x + 10, y + 13, 4, 11, "#5a3a1a"); for (const dx of [7, 16]) px(x + dx, y + 13, 2, 5, "#7aa0c8");
      px(x + 11, y + 9, 2, 2, "#e0302f");
      // bison in Frontier Park
      y = y0 + 168; x = at(y, 20, 34, "r");
      pad(px, x - 1, y - 1, 34, 20, "#8aa84a", "#8a6a42");
      for (const [dx, dy] of [[3, 3], [14, 9], [23, 4]]) {
        px(x + dx, y + dy + 1, 7, 4, "#5a3a22"); px(x + dx - 1, y + dy, 4, 4, "#3a2414"); px(x + dx + 1, y + dy - 1, 2, 1, "#3a2414");
        px(x + dx - 2, y + dy + 1, 1, 2, "#3a2414"); px(x + dx + 1, y + dy + 5, 1, 2, "#2a1a10"); px(x + dx + 5, y + dy + 5, 1, 2, "#2a1a10");
        px(x + dx - 1, y + dy, 1, 1, "#e8e0c8");
      }
      // windmills, wheels turning
      for (const [ry, side] of [[60, "l"], [196, "l"], [226, "r"]] as const) {
        y = y0 + ry; x = at(y - 4, 20, 10, side) + 5;
        for (let r = 0; r < 16; r++) { px(x - Math.floor(r / 4), y + r, 1, 1, "#8a8a8a"); px(x + Math.floor(r / 4), y + r, 1, 1, "#8a8a8a"); }
        for (let r = 4; r < 16; r += 4) px(x - Math.floor(r / 4), y + r, 2 * Math.floor(r / 4) + 1, 1, "#8a8a8a");
        px(x + 1, y - 1, 5, 1, "#9a9a9a"); px(x + 5, y - 3, 1, 3, "#e0302f");
        live.push(wheel(x, y - 1, 2 + ry * 0.01));
        px(x + 3, y + 14, 6, 2, "#6a8a9a");                                  // the stock tank
      }
      { const b = field("r", y0 + 236, y0 + 264, 36); live.push(herd(5, b.x0, b.x1, y0 + 236, y0 + 264, 3)); rec.push([b.x0, y0 + 236, b.x1 - b.x0, 28]); }
      { const b = field("l", y0 + 150, y0 + 178, 30); live.push(herd(3, b.x0, b.x1, y0 + 150, y0 + 178, 7)); rec.push([b.x0, y0 + 150, b.x1 - b.x0, 28]); }
      windfarm(px0, live, rec, y0, y0 + h, 2);
      // the hypnosis: a red pulse that breathes up from the Oklahoma line, slower and deeper as it goes
      live.push({ k: "fn", fn: (f, t, ctx) => {
        const p = 0.5 + 0.5 * Math.sin(t * 2.4);
        for (let yy = y0 + 40; yy < y0 + h; yy += 2) { const u = (yy - y0 - 40) / (h - 40); ctx.globalAlpha = 0.16 * u * u * (0.35 + 0.65 * p); f(0, yy, W, 2, "#ff1a3a"); }
        for (let k = 0; k < 3; k++) {                                                                          // rings rolling out from the road
          const v = (t * 0.35 + k / 3) % 1, r = 6 + v * 70, cx = roadX(y0 + h - 4), cy = y0 + h - 4; ctx.globalAlpha = 0.22 * (1 - v);
          for (let a = 0; a < 64; a++) { const th = (a / 64) * Math.PI; f(cx + Math.cos(th) * r, cy - Math.sin(th) * r * 0.7, 1, 1, "#ff4a4a"); }
        }
        ctx.globalAlpha = 1;
      } });
    },
  },
  tulsa: { // night: the crash into the Trade Winds (the van parks here, trip/scare.ts runs). Then morning: Route 66, the Driller, downtown, the Center of the Universe, the girl sweeping, a fox
    ground: ["#6aaa3a", "#5f9a34"],
    edge: pick(eTree, eHouse),
    under: ({ px, y0, h }) => {
      for (let k = 0; k < 14; k++) { const x = Math.floor(hash(k * 3 + 1) * W), y = y0 + 70 + Math.floor(hash(k * 7 + 2) * (h - 70)); px(x, y, 7, 4, "#5a9a32"); px(x + 1, y + 1, 5, 2, "#4f8a2c"); }
      // the night is still on at the top: dark ground fading into morning green
      const NIGHT = ["#1a2228", "#1e2a2c", "#24342e", "#2c4030", "#365032", "#426436", "#507838", "#5e8e3a"];
      for (let y = 0; y < 72; y++) { const v = y / 9, k = Math.floor(v); px(0, y0 + y, W, 1, NIGHT[Math.min(7, k)]); if (k < 7 && v - k > 0.5) for (let x = (y % 2); x < W; x += 2) px(x, y0 + y, 1, 1, NIGHT[k + 1]); }
      for (let k = 0; k < 40; k++) px(Math.floor(hash(k * 13) * W), y0 + Math.floor(hash(k * 29) * 30), 1, 1, "#3a4a4a");
      // a city street crossing under the highway by the Center of the Universe
      const sy = y0 + 162;
      for (let x = 0; x < W; x++) { px(x, sy, 1, 6, "#4a4a4e"); if (x % 5 < 3) px(x, sy + 3, 1, 1, "#e8e8e8"); px(x, sy - 1, 1, 1, "#b8b8b0"); px(x, sy + 6, 1, 1, "#b8b8b0"); }
    },
    draw: ({ px, y0, live, says }) => {
      let x = 0, y = 0;
      // the Trade Winds, right where the van ends up in the bar: motel wing, the bar, the sign, neon on
      const hy = HOLDS[1].y;
      y = hy - 26; x = beside(y, 50, 46, "r", 1);
      pad(px, x - 2, y + 18, 50, 32, "#3a3a40", "#2a2a30");
      for (let k = 0; k < 6; k++) px(x + 2 + k * 7, y + 42, 1, 6, "#8a8a8a");                                      // parking stripes
      px(x + 2, y + 20, 30, 12, "#3a3448"); px(x + 2, y + 19, 30, 1, "#1a1624");                                     // the motel wing
      for (let k = 0; k < 5; k++) { px(x + 4 + k * 6, y + 23, 3, 9, k === 2 ? "#d8f05a" : "#1a1624"); px(x + 4 + k * 6, y + 21, 3, 1, "#d8f05a"); px(x + 3 + k * 6, y + 26, 1, 2, k % 2 ? "#ffe9a0" : "#5a5a7a"); }
      px(x + 33, y + 16, 12, 16, "#2a1e30"); px(x + 33, y + 15, 12, 1, "#ff5ad1");                                    // the bar, the wall the van comes through
      px(x + 35, y + 19, 3, 3, "#ff5ad1"); px(x + 40, y + 19, 3, 3, "#5af0ff"); px(x + 37, y + 25, 4, 7, "#1a1018");
      px(x + 34, y + 30, 1, 1, "#ffe9a0"); px(x + 33, y + 33, 3, 1, "#8a6a5a"); px(x + 31, y + 34, 2, 1, "#c8c8d8"); px(x + 36, y + 35, 1, 1, "#c8c8d8");   // rubble + glass
      px(x + 2, y, 26, 12, "#1a1624"); px(x + 2, y + 12, 26, 1, "#d8f05a");
      word(px, x + 4, y + 1, "TRADE", "#d8f05a", null); word(px, x + 4, y + 6, "WINDS", "#8a7ab8", null);
      px(x + 30, y + 2, 1, 16, "#9a9a9a"); px(x + 28, y, 5, 3, "#ff5ad1");
      ((x: number, y: number) => live.push({ k: "fn", fn: (f, t) => {                                                                        // neon flicker
        if (Math.floor(t * 7) % 9 !== 0) { f(x + 2, y + 12, 26, 1, "#f0ff7a"); f(x + 28, y, 5, 3, "#ff8ae8"); }
        if (Math.floor(t * 3) % 5 === 1) f(x + 37, y + 25, 4, 7, "#5a2a5a");
      } }))(x, y);
      // the bar dogs playing chase round the lot: a lab, a brown one, a spotted puppy
      ((x0: number, y0d: number) => live.push({ k: "fn", fn: (f, t) => {
        const W2 = 34, H2 = 8, per = 2 * (W2 + H2);
        [["#e8c890", "#b8905a", 0, false], ["#7a4a2a", "#4a2a14", per / 3, false], ["#f2f2f2", "#c8a070", (2 * per) / 3, true]].forEach(([c, e, off, pup], k) => {
          const p = (t * 11 + (off as number)) % per;
          let x: number, y: number, d: 0 | 1 | 2;
          if (p < W2) { x = x0 + p; y = y0d; d = 1; } else if (p < W2 + H2) { x = x0 + W2; y = y0d + p - W2; d = 0; }
          else if (p < 2 * W2 + H2) { x = x0 + W2 - (p - W2 - H2); y = y0d + H2; d = 2; } else { x = x0; y = y0d + H2 - (p - 2 * W2 - H2); d = 0; }
          topDog(f, Math.round(x), Math.round(y), c as string, e as string, t, k, d, pup as boolean);
        });
      } }))(x + 4, y + 36);
      // the bar dogs got out: as we drive away they run with us down the shoulder, all morning
      live.push({ k: "fn", fn: (f, t) => {
        const ya = hy + 12, yb = y0 + 206, span = yb - ya;
        [["#e8c890", "#b8905a", 0, 14, false], ["#7a4a2a", "#4a2a14", 9, 15.5, false], ["#f2f2f2", "#c8a070", 20, 13, true], ["#1a1a1a", "#4a4a4a", 31, 16.5, false]].forEach(([c, e, off, v, pup], k) => {
          const y = ya + ((t * (v as number) + (off as number)) % span), x = Math.round(roadX(y) - 12 - (k % 2) * 4);
          topDog(f, x, Math.round(y), c as string, e as string, t, k, 0, pup as boolean);
        });
      } });
      // MORNING. Route 66
      y = y0 + 72; x = beside(y, 16, 11, "l", 2);
      px(x + 5, y + 10, 1, 7, "#9a9a9a");
      px(x, y, 11, 9, "#111"); px(x + 1, y + 1, 9, 7, "#f2f2f2"); px(x + 2, y + 9, 7, 1, "#111"); px(x + 4, y + 10, 3, 1, "#111");
      for (const dx of [2, 6]) { px(x + dx, y + 2, 3, 1, "#111"); px(x + dx, y + 3, 1, 4, "#111"); px(x + dx, y + 4, 3, 1, "#111"); px(x + dx + 2, y + 4, 1, 3, "#111"); px(x + dx, y + 6, 3, 1, "#111"); }
      // the Golden Driller, hand on his derrick, catching the first sun
      y = y0 + 74; x = at(y, 50, 32, "r");
      pad(px, x - 2, y + 42, 34, 6, "#9a9a9e", "#7a7a7e");
      lattice(px, x + 22, y, 7, 44, "#8a8a8a"); px(x + 21, y - 1, 9, 1, "#6a6a6a");
      const G = "#e8b830", GD = "#b8861a", GL = "#ffe07a";
      px(x + 8, y + 3, 7, 2, G); px(x + 7, y + 5, 9, 1, GD);
      px(x + 9, y + 6, 5, 5, G); px(x + 10, y + 7, 1, 1, GD); px(x + 12, y + 7, 1, 1, GD); px(x + 10, y + 9, 3, 1, GD);
      px(x + 7, y + 11, 9, 13, G); px(x + 8, y + 12, 2, 10, GL); px(x + 7, y + 18, 9, 1, GD);
      px(x + 16, y + 11, 3, 3, G); px(x + 18, y + 9, 4, 2, G);
      px(x + 4, y + 12, 3, 9, G); px(x + 3, y + 20, 3, 2, GD);
      px(x + 7, y + 24, 4, 14, G); px(x + 12, y + 24, 4, 14, G); px(x + 8, y + 25, 1, 12, GL); px(x + 11, y + 24, 1, 14, GD);
      px(x + 6, y + 38, 5, 2, GD); px(x + 12, y + 38, 5, 2, GD);
      px(x + 3, y + 40, 18, 3, "#9a9a9a"); word(px, x + 2, y + 44, "TULSA", "#f2f2f2", null);
      live.push({ k: "glint", x: x + 4, y: y + 3, w: 15, h: 36 });
      // deco downtown: Philtower's tiled roof, Mid-Continent, the BOK glass
      y = y0 + 96; x = at(y - 8, 52, 40, "l");
      bldg(px, x, y + 10, 9, 34, "#c8a878", "#f2e8c8", () => 0.6);
      for (let r = 0; r < 8; r++) px(x + 4 - Math.floor(r / 2), y + 2 + r, 1 + 2 * Math.floor(r / 2), 1, r % 2 ? "#2f8a6a" : "#c8402a");
      px(x + 4, y, 1, 2, "#ffd23f");
      bldg(px, x + 11, y + 4, 10, 40, "#d8d0c0", "#8a7a6a", () => 0.7); px(x + 11, y + 3, 10, 1, "#b8a890"); px(x + 13, y + 1, 6, 2, "#b8a890");
      px(x + 23, y - 6, 12, 50, "#5a7a9a"); for (let r = 0; r < 50; r += 2) px(x + 23, y - 6 + r, 12, 1, "#7a9aba"); px(x + 23, y - 6, 3, 50, "#8ab0d0");
      px(x + 36, y + 24, 4, 20, "#a8705a");
      // the Center of the Universe: brick rings by the road, the echo spreading
      y = y0 + 148; x = beside(y, 14, 26, "r", 3);
      for (let k = 0; k < 4; k++) {
        const rx = 12 - k * 3, ry = 7 - k * 2, c = ["#a8543a", "#c8b090", "#a8543a", "#d8c8a8"][k];
        for (let d = -ry; d <= ry; d++) { const ww = Math.round(rx * Math.sqrt(1 - (d * d) / (ry * ry))); px(x + 13 - ww, y + 7 + d, 2 * ww + 1, 1, c); }
      }
      px(x + 12, y + 6, 3, 2, "#3a3a3a");
      folk(px, x + 12, y - 2, { shirt: "#3a6fd8", hair: "#6a4a2a" });
      { const cx = x + 13, cy = y + 3;
        live.push({ k: "fn", fn: (f, t, ctx) => {
          for (let k = 0; k < 3; k++) { const u = (t * 0.6 + k / 3) % 1, r = 2 + u * 14; ctx.globalAlpha = 0.6 * (1 - u);
            for (let a = 0; a < 24; a++) { const th = (a / 24) * 2 * Math.PI; f(cx + Math.cos(th) * r, cy + Math.sin(th) * r * 0.6, 1, 1, "#ffffff"); } ctx.globalAlpha = 1; }
        } }); }
      px(x + 27 < W - 4 ? x + 26 : x - 6, y + 4, 4, 3, "#3a3020");                                                    // the plaque
      says.push({ a: y0 + 120, b: y0 + 168, who: "them", text: "“Welcome to Tulsa, Oklahoma, the center of the universe.”" });
      // the girl sweeping the street, pushing her cart
      { const sy = y0 + 158, x0 = 4, x1 = Math.round(room(sy, 10).lo - 20);
        live.push({ k: "fn", fn: (f, t, ctx) => {
          const span = x1 - x0, p = (t * 3) % (2 * span), dir = p < span ? 1 : -1, gx = Math.round(x0 + (p < span ? p : 2 * span - p));
          const cx = gx + dir * 5;
          f(cx - 1, sy + 3, 4, 4, "#5a6a7a"); f(cx - 1, sy + 2, 4, 1, "#8a9aaa"); f(cx - 1, sy + 7, 1, 1, "#111"); f(cx + 2, sy + 7, 1, 1, "#111");
          f(gx, sy, 3, 1, "#f0d070"); f(gx - dir, sy + 1, 1, 2, "#f0d070");
          f(gx, sy + 1, 3, 2, "#f0c8a0"); f(gx, sy + 3, 3, 3, "#ff8a1f"); f(gx + 1, sy + 3, 1, 3, "#ffd23f");
          const leg = Math.floor(t * 6) % 2; f(gx + leg, sy + 6, 1, 2, "#2a3a5a"); f(gx + 2 - leg, sy + 6, 1, 2, "#2a3a5a");
          const sw = Math.round(Math.sin(t * 9) * 2);
          f(gx - dir * 2, sy + 3, 1, 4, "#8a6a42"); f(gx - dir * 3 + sw, sy + 7, 3, 1, "#d8b050");
          for (let k = 0; k < 3; k++) { const u = (t * 2 + k / 3) % 1; ctx.globalAlpha = 0.5 * (1 - u); f(gx - dir * (3 + u * 5) + sw, sy + 7 - u * 3, 1, 1, "#c8b890"); ctx.globalAlpha = 1; }
        } }); }
      // the fox, running laps of the park
      { y = y0 + 172; const r = room(y, 30), fx0 = Math.round(r.hi + 10), fw = Math.min(46, W - 4 - fx0), cx = fx0 + fw / 2, cy = y + 16;
        for (let k = 0; k < 5; k++) { const tx = fx0 + hash(k * 9) * (fw - 4), ty = y + 4 + hash(k * 4) * 24; px(tx, ty, 5, 4, "#2f7a2a"); px(tx + 1, ty - 1, 3, 1, "#3f8a3a"); px(tx + 2, ty + 4, 1, 2, "#5a3a1a"); }
        live.push({ k: "fn", fn: (f, t) => {
          const a = t * 1.3, rx = fw / 2 - 3, ry = 11 + 3 * Math.sin(a * 2);
          const fx = Math.round(cx + Math.cos(a) * rx), fy = Math.round(cy + Math.sin(a * 2) * ry * 0.6), dir = -Math.sin(a) >= 0 ? 1 : -1;
          f(fx - 2, fy, 5, 2, "#e0702a"); f(fx + dir * 3, fy - 1, 2, 2, "#e0702a"); f(fx + dir * 3 + (dir > 0 ? 1 : 0), fy - 2, 1, 1, "#3a1a0a");
          f(fx + dir * 4 + (dir > 0 ? 0 : -1), fy, 1, 1, "#1a1a1a"); f(fx + dir * 2, fy + 1, 1, 1, "#f2f2f2");
          const tx = fx - dir * 4; f(dir > 0 ? tx - 1 : tx, fy - 1, 3, 2, "#e0702a"); f(dir > 0 ? tx - 2 : tx + 2, fy - 1, 1, 1, "#f8f8f8");
          const leg = Math.floor(t * 12) % 2; f(fx - 1 + leg, fy + 2, 1, 1, "#3a1a0a"); f(fx + 2 - leg, fy + 2, 1, 1, "#3a1a0a");
        } }); }
    },
  },
  oregon: { // Muskogee: the jeweler on her bench with her iguana, the journalist with his camera and coffee, the old town
    ground: ["#c8743a", "#b8652f"],
    edge: pick(eRock, eTree),
    under: ({ px, y0, h }) => { for (let k = 0; k < 22; k++) { const x = Math.floor(hash(k * 5 + 77) * W), y = y0 + Math.floor(hash(k * 11 + 3) * h); px(x, y, 6, 3, "#5aa83a"); px(x + 1, y - 1, 4, 1, "#6ab84a"); } },
    draw: ({ px, y0, live, says }) => {
      let x = 0, y = 0;
      // the jewelry store: sandstone front, DIAMONDS, her bench, her iguana on a leash
      y = y0 + 4; x = at(y, 36, 40, "r");
      pad(px, x - 2, y + 22, 44, 14, "#c8c4b8", "#a8a498");                                         // the sidewalk
      blocks(px, x, y, 40, 22, "#c8a070", "#b08858", "#8a6a48");
      px(x + 3, y + 2, 34, 7, "#1a1a1a"); word(px, x + 4, y + 3, "DIAMONDS", "#f2f2f2", null);
      px(x + 2, y + 10, 36, 2, "#7a1a1a");
      px(x + 3, y + 12, 14, 9, "#9ad0e8"); px(x + 23, y + 12, 14, 9, "#9ad0e8"); px(x + 18, y + 12, 4, 10, "#3a2a1a");
      for (let k = 0; k < 4; k++) { px(x + 5 + k * 3, y + 18, 2, 1, "#ffd23f"); px(x + 25 + k * 3, y + 17, 2, 1, "#e8f4ff"); }
      live.push({ k: "glint", x: x + 3, y: y + 13, w: 34, h: 7 });
      says.push({ a: y0 - 6, b: y0 + 36, who: "them", text: "“I live in a community with the second highest poverty level in the state.”" });
      // her: grey hair, dark green tee, on the green bench
      const by = y + 26;
      px(x + 2, by + 3, 14, 1, "#1f4a2a"); px(x + 2, by + 1, 14, 1, "#1f4a2a"); px(x + 3, by + 4, 1, 3, "#1f4a2a"); px(x + 14, by + 4, 1, 3, "#1f4a2a");
      px(x + 6, by - 6, 4, 2, "#c8c8c8"); px(x + 6, by - 4, 4, 3, "#e0b090"); px(x + 5, by - 5, 1, 3, "#c8c8c8"); px(x + 7, by - 3, 1, 1, "#111");
      px(x + 5, by - 1, 6, 4, "#2f5a3a"); px(x + 6, by, 3, 1, "#5aa86a"); px(x + 11, by + 2, 3, 1, "#e0b090");
      px(x + 5, by + 3, 5, 2, "#2a3a5a"); px(x + 9, by + 5, 1, 2, "#e0b090"); px(x + 9, by + 7, 2, 1, "#f2f2f2");
      // the iguana, tail swishing, leash to her hand
      { const ix = x + 18, iy = by + 6;
        px(x + 13, by + 2, 1, 1, "#e0302f"); for (let k = 0; k < 5; k++) px(x + 14 + k, by + 2 + Math.floor(k / 1.5), 1, 1, "#e0302f");
        px(ix, iy, 9, 3, "#4ab83a"); px(ix + 9, iy, 3, 2, "#4ab83a"); px(ix + 11, iy, 1, 1, "#111"); px(ix + 1, iy - 1, 7, 1, "#2f8a2a");
        for (let k = 0; k < 4; k++) px(ix + 1 + k * 2, iy - 1, 1, 1, "#7ae85a");
        px(ix + 1, iy + 3, 1, 1, "#2f8a2a"); px(ix + 7, iy + 3, 1, 1, "#2f8a2a"); px(ix + 8, iy + 2, 2, 1, "#9ae86a");
        live.push({ k: "fn", fn: (f, t) => {
          for (let k = 0; k < 9; k++) f(ix - 1 - k, iy + 1 + Math.round(Math.sin(t * 2.5 - k * 0.5) * (k / 4)), 1, 1, k % 3 === 2 ? "#2f8a2a" : "#4ab83a");
          if (Math.floor(t * 3) % 4 === 0) { f(ix + 12, iy + 1, 2, 1, "#e0302f"); }
        } }); }
      // the journalist: navy tank, navy cap, camera on a strap, iced coffee; she sits on the bench by the stone wall
      y = y0 + 52; x = at(y, 30, 40, "l");
      blocks(px, x, y + 6, 40, 10, "#c8b090", "#b09870", "#8a7a5a");
      px(x + 3, y - 2, 10, 7, "#1f3a2a"); px(x + 4, y - 1, 8, 1, "#c8c8a8"); for (let r = 1; r < 5; r += 1) px(x + 4, y - 1 + r, 6 + (r % 2) * 2, 1, "#8a9a7a"); px(x + 7, y + 5, 2, 2, "#3a3a3a");
      const sy = y + 18;
      pad(px, x - 2, y + 16, 44, 14, "#c8c4b8", "#a8a498");
      px(x + 2, sy + 2, 14, 1, "#1a1a1a"); px(x + 2, sy, 14, 1, "#1a1a1a"); px(x + 3, sy + 3, 1, 3, "#1a1a1a"); px(x + 14, sy + 3, 1, 3, "#1a1a1a");
      px(x + 6, sy - 7, 5, 1, "#5ac83a"); px(x + 6, sy - 6, 4, 1, "#5ac83a"); px(x + 6, sy - 5, 4, 3, "#a8703a"); px(x + 8, sy - 4, 1, 1, "#111");   // her: green cap, tanned
      px(x + 5, sy - 2, 6, 4, "#6a6a72"); px(x + 4, sy - 1, 1, 3, "#a8703a"); px(x + 11, sy - 1, 1, 3, "#a8703a"); px(x + 5, sy + 2, 6, 2, "#3a3a4a"); px(x + 10, sy + 4, 1, 3, "#3a3a4a");
      says.push({ a: y0 + 40, b: y0 + 84, who: "them", text: "“I read in a book, I think it was ‘the body keeps the score’.”" });
      { const jx = x + 22, jy = sy - 12;                                                                // him, standing, tall
        px(jx, jy, 4, 2, "#1f2a4a"); px(jx + 4, jy + 1, 2, 1, "#1f2a4a"); px(jx, jy + 2, 4, 3, "#a8784a"); px(jx + 1, jy + 3, 1, 1, "#111"); px(jx + 3, jy + 3, 1, 1, "#111");
        px(jx, jy + 5, 4, 6, "#1f2a4a"); px(jx + 1, jy + 6, 2, 1, "#f2f2f2"); px(jx - 1, jy + 5, 1, 5, "#a8784a"); px(jx + 4, jy + 5, 1, 4, "#a8784a");
        px(jx + 1, jy + 5, 1, 3, "#e8e8e8"); px(jx + 2, jy + 8, 1, 1, "#e8e8e8");                     // lanyard + badge
        px(jx - 3, jy + 9, 3, 2, "#111"); px(jx - 2, jy + 9, 1, 1, "#5a5a5a"); px(jx - 1, jy + 5, 1, 4, "#111");   // camera on its strap
        px(jx + 5, jy + 6, 2, 3, "#d8eef8"); px(jx + 5, jy + 7, 2, 2, "#8a5a32"); px(jx + 6, jy + 4, 1, 2, "#2faa4a");  // iced coffee
        px(jx, jy + 11, 1, 6, "#2a2a3a"); px(jx + 3, jy + 11, 1, 6, "#2a2a3a"); px(jx, jy + 17, 2, 1, "#f2f2f2"); px(jx + 3, jy + 17, 2, 1, "#f2f2f2"); }
      // the old town, dressed up as a film set: false fronts, extras, the crew
      y = y0 + 104; x = at(y, 36, 44, "l");
      for (const [dx, w, c, fr, sign] of [[0, 13, "#8a5a32", "#a06a3a", "BAR"], [15, 12, "#6a4a2a", "#9a6a3a", "INN"], [29, 12, "#7a3a2a", "#a85a3a", "TEA"]] as const) {
        px(x + dx, y + 5, w, 13, c); px(x + dx, y, w, 5, fr); px(x + dx, y - 1, w, 1, "#4a3018");
        word(px, x + dx + Math.floor((w - wordW(sign)) / 2), y + 1, sign, "#2a1a0a", null);
        px(x + dx + Math.floor(w / 2) - 1, y + 12, 3, 6, "#2a1a0a"); px(x + dx + 1, y + 7, 2, 3, "#e8d080"); px(x + dx + w - 3, y + 7, 2, 3, "#e8d080");
        px(x + dx, y + 10, w, 1, "#5a3a1a");
      }
      px(x - 1, y + 18, 44, 4, "#e0b080");
      live.push({ k: "walk", x0: x, x1: x + 38, y: y + 22, shirt: "#6a2a4a", hat: "#3a2a1a", ph: 0, brim: true });
      live.push({ k: "walk", x0: x, x1: x + 38, y: y + 22, shirt: "#e8e0d0", hat: "#f2e8c8", ph: 11 });
      y = y0 + 138; x = at(y, 24, 34, "l");
      px(x + 2, y + 2, 7, 5, "#1a1a1a"); px(x + 9, y + 3, 2, 3, "#3a3a3a"); px(x + 1, y, 3, 3, "#2a2a2a"); px(x + 5, y, 3, 3, "#2a2a2a");   // the film camera
      px(x + 5, y + 7, 1, 8, "#5a5a5a"); px(x + 2, y + 14, 7, 1, "#5a5a5a");
      folk(px, x + 11, y + 6, { shirt: "#1a1a1a", cap: "#1a1a1a" });
      px(x + 15, y + 2, 14, 1, "#5a5a5a"); px(x + 28, y + 1, 3, 3, "#3a3a3a"); folk(px, x + 16, y + 6, { shirt: "#5a5a6a", hair: "#3a2a1a" });  // the boom
      px(x + 22, y + 9, 10, 6, "#f2f2f2"); px(x + 22, y + 9, 10, 1, "#1a1a1a"); px(x + 26, y + 15, 1, 3, "#5a5a5a");                          // a reflector
      // a covered wagon and oxen, Oregon Trail style, on the other side
      y = y0 + 70; x = at(y, 20, 40, "r");
      for (const dx of [0, 22]) {
        px(x + dx + 2, y + 6, 12, 5, "#8a5a32"); for (let r = 0; r < 6; r++) px(x + dx + 2 + (r < 2 ? 2 - r : 0), y + r, 12 - (r < 2 ? 2 * (2 - r) : 0), 1, "#f2ece0");
        px(x + dx + 3, y + 11, 3, 3, "#3a2a1a"); px(x + dx + 10, y + 11, 3, 3, "#3a2a1a"); px(x + dx + 4, y + 12, 1, 1, "#c8a060"); px(x + dx + 11, y + 12, 1, 1, "#c8a060");
        px(x + dx + 15, y + 7, 4, 3, "#7a4a2a"); px(x + dx + 18, y + 6, 2, 2, "#7a4a2a"); px(x + dx + 18, y + 5, 1, 1, "#e8e0c8");
      }
    },
  },
  clinton: { // Little Rock: the glass library over the river, Bill on the roof with his sax, downtown, dogwoods everywhere
    ground: ["#3f9a3a", "#378a33"],
    edge: pick(eDogwood, eTree, eDogwood),
    draw: ({ px, y0, rnd, live }) => {
      let x = 0, y = 0;
      river(px, y0 + 44, 14);
      // the library: a long glass box out over the water
      y = y0 + 34; x = at(y - 16, 34, 44, "r");
      px(x + 30, y + 10, 3, 14, "#7a808a"); px(x + 4, y + 10, 3, 10, "#7a808a");
      px(x, y, 44, 10, "#a8c4d8"); px(x, y, 44, 1, "#e8f4ff"); px(x, y + 9, 44, 1, "#6a8aa0");
      for (let k = 0; k < 44; k += 4) px(x + k, y + 1, 1, 8, "#6a8aa0");
      for (let k = 2; k < 42; k += 8) px(x + k, y + 3, 2, 4, "#e8f4ff");
      px(x + 36, y - 10, 1, 10, "#cfcfcf"); live.push({ k: "flag", x: x + 37, y: y - 10, w: 7, h: 4, kind: "us" });
      live.push({ k: "bill", x: x + 8, y });
      // the old bridge across, walkers on it
      { const bx = at(y0 + 40, 22, 8, "l") + 4;
        for (let yy = y0 + 40; yy < y0 + 62; yy++) { px(bx - 1, yy, 1, 1, "#7a5a3a"); px(bx + 6, yy, 1, 1, "#7a5a3a"); px(bx, yy, 6, 1, "#a8805a"); }
        for (let yy = y0 + 42; yy < y0 + 62; yy += 4) { px(bx - 2, yy, 1, 3, "#5a5a6a"); px(bx + 7, yy, 1, 3, "#5a5a6a"); }
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 3; k++) { const yy = y0 + 40 + ((t * 3 + k * 7) % 22); f(bx + 1 + k * 2, yy, 1, 2, ["#e0302f", "#ffd23f", "#3a6fd8"][k]); f(bx + 1 + k * 2, yy - 1, 1, 1, "#e0b090"); } } }); }
      // downtown
      y = y0 + 80; x = at(y, 44, 44, "r");
      bldg(px, x, y + 14, 8, 30, "#7a808a", "#e8eef4", rnd); bldg(px, x + 9, y, 10, 44, "#5a6a7a", "#cfe0ee", rnd); px(x + 13, y - 3, 2, 3, "#9aa0a8");
      bldg(px, x + 20, y + 8, 9, 36, "#8a909a", "#e8eef4", rnd); bldg(px, x + 30, y + 18, 8, 26, "#a87a5a", "#f2e0c8", rnd); bldg(px, x + 39, y + 24, 5, 20, "#6a707a", "#e8eef4", rnd);
      // Little Rock Central High: the big Collegiate Gothic front, the reflecting pool, and a couple just taking it in
      y = y0 + 74; x = at(y, 52, 42, "l");
      pad(px, x - 2, y + 30, 46, 22, "#c8c4b8", "#a8a498");
      const BR = "#b8704a", BRD = "#985a3a", ST = "#e8dcc0";
      px(x, y + 8, 42, 22, BR); for (let r = 0; r < 22; r += 2) px(x, y + 8 + r, 42, 1, BRD);                       // the long wings
      px(x, y + 7, 42, 1, ST); for (let k = 0; k < 42; k += 3) px(x + k, y + 6, 2, 1, ST);                          // parapet
      for (let fl = 0; fl < 3; fl++) for (let k = 0; k < 42; k += 4) if (k < 13 || k > 27) px(x + 1 + k, y + 10 + fl * 6, 2, 4, "#5a6a7a");
      px(x + 13, y, 16, 30, "#d8c8a0"); px(x + 13, y, 16, 1, ST); for (let k = 0; k < 16; k += 3) px(x + 13 + k, y - 2, 2, 2, "#d8c8a0");   // the center bay
      px(x + 12, y, 1, 30, "#c8b890"); px(x + 29, y, 1, 30, "#c8b890");
      for (let k = 0; k < 4; k++) { px(x + 15 + k * 4, y + 4, 2, 5, "#f2ecd8"); px(x + 15 + k * 4, y + 3, 2, 1, "#c8b890"); }   // the four statues
      px(x + 15, y + 11, 12, 1, ST); word(px, x + 15, y + 13, "CHS", "#7a5a3a", null);
      for (const dx of [15, 20, 24]) { px(x + dx, y + 21, 3, 9, "#3a2a1a"); px(x + dx, y + 20, 3, 1, "#c8b890"); }  // arched doors
      px(x + 8, y + 33, 22, 7, "#5a9ac8"); px(x + 8, y + 33, 22, 1, "#d8d0c0"); px(x + 10, y + 35, 8, 1, "#9ad0f0");   // the reflecting pool
      live.push({ k: "glint", x: x + 9, y: y + 34, w: 20, h: 5 });
      ((x: number, y: number) => live.push({ k: "fn", fn: (f, t, ctx) => { const u = (t * 1.2) % 1; ctx.globalAlpha = 0.8 * (1 - u); f(x + 19, y + 36 - u * 4, 1, 2, "#f2fbff"); ctx.globalAlpha = 1; } }))(x, y);
      x -= 6;
      // the couple: white, grey-haired, her hand to her heart, him pointing up at the tower
      folk(px, x + 40, y + 40, { shirt: "#5a7ab8", skin: "#f2d0b8", hair: "#d8d8d8", pants: "#c8b890" });
      folk(px, x + 45, y + 40, { shirt: "#e88aa0", skin: "#f2d0b8", hair: "#e8e0c8", pants: "#4a5a8a" });
      px(x + 39, y + 41, 1, 2, "#f2d0b8"); px(x + 38, y + 40, 1, 1, "#f2d0b8");
      ((x: number, y: number) => live.push({ k: "fn", fn: (f, t) => { const b = Math.floor(t * 2) % 2; f(x + 43, y + 35 - b, 1, 2, "#ffd23f"); f(x + 43, y + 38 - b, 1, 1, "#ffd23f"); f(x + 47, y + 36 + b, 1, 1, "#ffffff"); } }))(x, y);   // "!" and a sparkle
    },
  },
  casino: { // the Horseshoe in Tunica, Hernando's water tower and its cookie-cutter grey subdivisions, the sweet shop with sprinkles
    ground: ["#3a5a32", "#33502c"],
    edge: pick(eTree),
    draw: ({ px, y0, rnd, live, says }) => {
      let x = 0, y = 0;
      y = y0 + 4; x = at(y, 46, 46, "l");
      stars(px, x, y, 46, 8, rnd, 6);
      pad(px, x - 2, y + 34, 50, 12, "#4a4a4e", "#3a3a3e");
      for (let k = 0; k < 6; k++) { car(px, x + 1 + k * 8, y + 37, ["#e0302f", "#f2f2f2", "#3a6fd8", "#1a1a1a", "#ffd23f", "#8a8a8a"][k]); px(x + k * 8, y + 36, 1, 6, "#e8e8e8"); }
      px(x, y + 18, 46, 16, "#3a2a50"); px(x, y + 17, 46, 1, "#ffd23f"); px(x, y + 33, 46, 1, "#ffd23f");
      for (let k = 0; k < 11; k++) px(x + 2 + k * 4, y + 21, 2, 3, "#ffd88a");
      for (let k = 0; k < 11; k++) px(x + 2 + k * 4, y + 26, 2, 3, "#ff8ad8");
      px(x + 19, y + 28, 8, 5, "#ffe8a0");
      live.push({ k: "glint", x, y: y + 17, w: 46, h: 17 });
      { const cx = x + 23, cy = y + 9;                                  // the giant horseshoe
        for (let a = 0; a < 48; a++) { const th = Math.PI * (0.15 + 1.7 * a / 47) + Math.PI / 2; px(cx + Math.round(9 * Math.cos(th)), cy - Math.round(8 * Math.sin(th)), 2, 2, "#e8b830"); }
        for (const [dx, dy] of [[-7, -4], [6, -4], [-8, 1], [7, 1], [-4, -7], [3, -7]]) px(cx + dx, cy + dy, 1, 1, "#7a5a1a"); }
      // Hernando's water tower
      y = y0 + 56; x = at(y, 34, 36, "l");
      px(x, y + 2, 36, 10, "#d8dce0"); px(x + 1, y + 1, 34, 1, "#e8eaee"); px(x + 2, y, 32, 1, "#c8ccd2"); px(x, y + 11, 36, 1, "#a8acb2");
      word(px, x + 3, y + 4, "HERNANDO", "#2a3a6a", null);
      for (const dx of [4, 13, 22, 31]) px(x + dx, y + 12, 1, 20, "#9aa0a8");
      for (let r = 14; r < 32; r += 6) px(x + 4, y + r, 28, 1, "#b8bcc2");
      px(x + 17, y + 12, 2, 20, "#a8acb2");
      // the subdivisions: identical grey houses, identical lawns, identical driveways, identical grey cars. One guy pressure-washing.
      const house = (hx: number, hy: number) => {
        px(hx - 1, hy + 9, 11, 3, "#7ab04a");                                               // the lawn strip
        px(hx, hy + 3, 9, 6, "#a8acb2"); for (let r2 = 0; r2 < 3; r2++) px(hx + 3 - r2, hy + r2, 3 + r2 * 2, 1, r2 === 0 ? "#8a8e96" : "#6a6e76");
        px(hx - 1, hy + 3, 11, 1, "#5a5e66");
        px(hx + 1, hy + 5, 4, 4, "#e8e8e8"); px(hx + 1, hy + 6, 4, 1, "#c8c8cc"); px(hx + 6, hy + 5, 2, 2, "#5a6a7a"); px(hx + 6, hy + 7, 2, 2, "#4a4a52");
        px(hx + 1, hy + 9, 4, 3, "#c8c8c4");                                                // driveway
      };
      const subdiv = (x0: number, x1: number, sy: number, rows: number) => {
        const n = Math.max(1, Math.floor((x1 - x0) / 11));
        for (let row = 0; row < rows; row++) {
          const hy = sy + row * 24;
          px(x0 - 2, hy + 12, n * 11 + 3, 4, "#5a5a5e"); for (let k = x0; k < x0 + n * 11; k += 6) px(k, hy + 14, 3, 1, "#8a8a8e");   // the street
          for (let k = 0; k < n; k++) house(x0 + k * 11, hy);
          for (let k = 0; k < n; k++) if ((k + row) % 3 === 1) car(px, x0 + k * 11 + 1, hy + 17, "#8a8e96");
        }
      };
      { const r = room(y0 + 8, 82), x0 = Math.round(r.hi + 12); subdiv(x0, W - 1, y0 + 6, 4);
        // him: second row, first house, washing a blue car out front
        const hy = y0 + 30, cx = x0 + 4, gx = x0 - 3;
        px(x0 - 2, hy + 16, 16, 6, "#6a6e74");                                              // the wet, darker concrete
        car(px, cx, hy + 17, "#2a5ad8");
        folk(px, gx, hy + 13, { shirt: "#f2f2f2", skin: "#6a4028", cap: "#1a1a1a", pants: "#3a4a6a" });
        live.push({ k: "fn", fn: (f, t, ctx) => {
          const tip = gx + 4, wy = hy + 17, sw = Math.sin(t * 3) * 1.2;
          f(gx + 3, wy, 2, 1, "#ffd23f"); f(tip + 1, wy, 1, 1, "#3a3a3a");                         // the wand
          for (let k = 0; k < 16; k++) {                                                            // the spray fanning onto the car
            const u = (t * 3.2 + k / 16) % 1, x = tip + 2 + u * 8, y = wy + (hash(k) - 0.5) * u * 4 + sw * u;
            ctx.globalAlpha = 0.95 - u * 0.5; f(x, y, 1, 1, k % 3 ? "#f2fbff" : "#9ad8ff");
          }
          ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 7); f(cx, hy + 15, 8, 4, "#e8f8ff"); ctx.globalAlpha = 1;   // mist off the car
          if (Math.floor(t * 5) % 3 === 0) f(cx + 1 + Math.floor(t * 5) % 5, hy + 17, 1, 1, "#ffffff");
          for (let k = 0; k < 3; k++) { const u = (t * 1.5 + k / 3) % 1; ctx.globalAlpha = 1 - u; f(cx + 1 + k * 2, hy + 21 + u * 2, 1, 1, "#7ab8e8"); }
          ctx.globalAlpha = 1;
        } }); }
      { const r = room(y0 + 96, 52); subdiv(4, Math.round(r.lo - 8), y0 + 96, 2); }
      // the donut shop: pink and white awning, a smiling donut on the roof, little tables, a line of happy people
      y = y0 + 98; x = at(y, 46, 40, "r");
      pad(px, x - 2, y + 30, 44, 16, "#e8e2d8", "#c8c4b8");
      px(x + 1, y + 16, 36, 14, "#fbe4ec"); px(x + 1, y + 29, 36, 1, "#d8a8b8");
      for (let k = 0; k < 9; k++) { px(x + 1 + k * 4, y + 14, 4, 3, k % 2 ? "#ff7ab8" : "#ffffff"); px(x + 2 + k * 4, y + 17, 2, 1, k % 2 ? "#ff7ab8" : "#ffffff"); }   // scalloped awning
      px(x + 4, y + 20, 12, 7, "#cfe8ff"); for (let k = 0; k < 4; k++) px(x + 5 + k * 3, y + 24, 2, 2, ["#ff7ab8", "#c8823a", "#ffd23f", "#8a5a3a"][k]);   // the case of donuts
      px(x + 22, y + 20, 5, 10, "#c8823a"); px(x + 23, y + 21, 3, 3, "#cfe8ff"); px(x + 29, y + 20, 6, 5, "#cfe8ff");
      { const cx = x + 19, cy = y + 6;                                                                            // the donut, smiling
        for (let k = -7; k <= 7; k++) { const ww = Math.round(Math.sqrt(49 - k * k) * 1.6); px(cx - ww, cy + Math.round(k * 0.8), 2 * ww + 1, 1, k < 1 ? "#ff8ac8" : "#d8944a"); }
        px(cx - 2, cy - 1, 5, 2, "#fbe4ec");
        px(cx - 6, cy - 1, 1, 2, "#2a1a1a"); px(cx + 6, cy - 1, 1, 2, "#2a1a1a"); px(cx - 8, cy + 1, 2, 1, "#ff5a8a"); px(cx + 7, cy + 1, 2, 1, "#ff5a8a");
        px(cx - 2, cy + 3, 1, 1, "#2a1a1a"); px(cx - 1, cy + 4, 3, 1, "#2a1a1a"); px(cx + 2, cy + 3, 1, 1, "#2a1a1a");
        for (let k = 0; k < 14; k++) px(cx - 9 + hash(k * 3) * 18, cy - 5 + hash(k * 7) * 3, 1, 1, ["#ffd23f", "#5af0ff", "#ffffff", "#2faa4a", "#3a6fd8"][k % 5]); }
      for (const tx of [x + 3, x + 29]) { px(tx, y + 35, 6, 1, "#ff7ab8"); px(tx + 1, y + 34, 4, 1, "#ffffff"); px(tx + 3, y + 36, 1, 4, "#9a9a9a"); px(tx + 1, y + 39, 5, 1, "#e8e8e8"); }   // umbrella tables
      folk(px, x + 1, y + 35, { shirt: "#ffd23f", hair: "#3a2a1a", skin: "#8a5a3a" }); folk(px, x + 8, y + 35, { shirt: "#5af0ff", hair: "#f0d070" });
      folk(px, x + 27, y + 35, { shirt: "#ff8ac8", hair: "#6a3a1a" }); folk(px, x + 34, y + 35, { shirt: "#2faa4a", hair: "#1a1a1a", skin: "#c08a5a" });
      for (let k = 0; k < 3; k++) folk(px, x + 14 + k * 4, y + 31 + (k % 2), { shirt: ["#e0302f", "#b04ad8", "#3a6fd8"][k], hair: ["#3a2a1a", "#d8c070", "#1a1a1a"][k], skin: ["#e0b090", "#f0c8a0", "#8a5a3a"][k] });
      ((x: number, y: number) => live.push({ k: "fn", fn: (f, t, ctx) => {
        const hop = Math.floor(t * 4) % 2;                                                                       // a kid hopping with a donut
        f(x + 11, y + 41 - hop, 2, 1, "#5a3a1a"); f(x + 11, y + 42 - hop, 2, 2, "#f0c8a0"); f(x + 11, y + 44 - hop, 2, 2, "#ff7ab8"); f(x + 13, y + 43 - hop, 2, 2, "#ff8ac8");
        for (let k = 0; k < 2; k++) { const u = (t * 0.5 + k / 2) % 1; ctx.globalAlpha = 1 - u;                   // hearts floating up off the tables
          const hx = (k ? x + 31 : x + 5), hy = y + 32 - u * 10; f(hx, hy, 1, 1, "#ff5a8a"); f(hx + 2, hy, 1, 1, "#ff5a8a"); f(hx, hy + 1, 3, 1, "#ff5a8a"); f(hx + 1, hy + 2, 1, 1, "#ff5a8a"); ctx.globalAlpha = 1; }
      } }))(x, y);
      says.push({ a: y0 + 92, b: y0 + 140, who: "them", text: "“You got a sister?”" });
      { const fx = x - 13 < 0 ? x + 42 : x - 13, fy = y + 14;
        px(fx, fy, 1, 16, "#cfcfcf"); px(fx + 1, fy, 3, 6, "#c8202a"); px(fx + 4, fy, 1, 6, "#ffd23f"); px(fx + 5, fy, 5, 6, "#2a3a8a"); px(fx + 10, fy, 1, 6, "#ffd23f"); px(fx + 11, fy, 3, 6, "#c8202a");
        px(fx + 6, fy + 2, 3, 2, "#f2f2f2"); px(fx + 7, fy + 1, 1, 1, "#ffd23f"); }
    },
  },
  graceland: { // Graceland: the gates, the mansion, Elvis, the iPad tour; the Lisa Marie; the Pyramid on the Mississippi, and the Bass Pro guy walking us through every kind of gun
    ground: ["#5f9a45", "#548a3c"],
    edge: pick(eTree),
    draw: ({ px, y0, live, says }) => {
      let x = 0, y = 0;
      // the music gates
      y = y0 + 40; x = at(y, 14, 44, "r");
      px(x, y + 4, 12, 8, "#e8e4d8"); px(x + 32, y + 4, 12, 8, "#e8e4d8"); px(x, y + 3, 12, 1, "#c8c4b8"); px(x + 32, y + 3, 12, 1, "#c8c4b8");
      px(x + 12, y, 20, 12, "#f2f2f2"); px(x + 13, y + 1, 18, 10, "#2a2a2a");
      for (const [dx, dy] of [[3, 6], [7, 3], [11, 7], [15, 4]]) { px(x + 13 + dx, y + 1 + dy, 2, 2, "#f2f2f2"); px(x + 15 + dx, y + 1 + dy - 4, 1, 5, "#f2f2f2"); }
      px(x + 13, y + 9, 18, 1, "#f2f2f2"); px(x + 22, y, 1, 12, "#9a9a9a");
      // the mansion
      y = y0 + 8; x = at(y - 6, 30, 46, "r");
      pad(px, x - 2, y + 18, 50, 12, "#6ab84a", "#5aa83a");
      px(x, y + 4, 44, 14, "#f2ece0"); px(x - 1, y + 3, 46, 1, "#8a8a8a"); px(x, y + 2, 44, 1, "#6a6a6a");
      px(x + 14, y - 3, 16, 7, "#f2ece0"); for (let r = 0; r < 4; r++) px(x + 22 - 2 - r * 2, y - 6 + r, 4 + r * 4, 1, "#8a8a8a");
      for (let k = 0; k < 4; k++) px(x + 15 + k * 4, y + 4, 2, 14, "#ffffff");
      for (const dx of [2, 8, 34, 40]) { px(x + dx, y + 7, 3, 4, "#5a7a9a"); px(x + dx - 1, y + 7, 1, 4, "#2a4a2a"); px(x + dx + 3, y + 7, 1, 4, "#2a4a2a"); px(x + dx, y + 13, 3, 3, "#5a7a9a"); }
      px(x + 20, y + 12, 4, 6, "#5a3a1a");
      for (const dx of [-4, 46]) { px(x + dx, y + 8, 5, 6, "#2f7a2a"); px(x + dx + 2, y + 14, 1, 3, "#5a3a1a"); }
      // Elvis in the white jumpsuit
      { const ex = x + 3, ey = y + 13;
        px(ex + 1, ey, 4, 2, "#111"); px(ex + 4, ey - 1, 2, 1, "#111"); px(ex + 1, ey + 2, 3, 3, "#f0c8a0"); px(ex + 1, ey + 2, 1, 2, "#111");
        px(ex, ey + 5, 6, 7, "#ffffff"); px(ex - 1, ey + 5, 1, 2, "#ffffff"); px(ex + 6, ey + 5, 2, 1, "#ffffff"); px(ex + 1, ey + 5, 4, 1, "#ffd23f");
        px(ex, ey + 9, 6, 1, "#ffd23f"); px(ex + 2, ey + 6, 1, 3, "#e0302f");
        px(ex, ey + 12, 2, 4, "#ffffff"); px(ex + 4, ey + 12, 2, 4, "#ffffff"); px(ex - 1, ey + 15, 3, 1, "#ffffff"); px(ex + 4, ey + 15, 3, 1, "#ffffff");
        px(ex + 9, ey + 1, 1, 1, "#ffd23f"); px(ex + 10, ey - 1, 1, 3, "#ffd23f"); px(ex + 12, ey + 2, 1, 1, "#ffd23f"); px(ex + 13, ey, 1, 3, "#ffd23f"); }
      // the iPad tour: headphones on, screens glowing, following the guide's paddle around the lawn
      { const ly0 = y + 46, ly1 = y + 82, lx0 = at(ly0, ly1 - ly0, 48, "r"), lx1 = Math.min(W - 1, lx0 + 48);
        pad(px, lx0, ly0, lx1 - lx0, ly1 - ly0, "#6ab84a", "#5aa83a");
        for (let k = 0; k < lx1 - lx0 - 8; k++) { px(lx0 + 4 + k, ly0 + 4, 1, 1, "#d8cfb8"); px(lx0 + 4 + k, ly1 - 8, 1, 1, "#d8cfb8"); }   // the garden path, a loop
        for (let k = 0; k < ly1 - ly0 - 12; k++) { px(lx0 + 4, ly0 + 4 + k, 1, 1, "#d8cfb8"); px(lx1 - 5, ly0 + 4 + k, 1, 1, "#d8cfb8"); }
        const sx = lx0 + 14, sy2 = ly0 + 14; px(sx, sy2, 18, 7, "#f2f2f2"); px(sx, sy2 + 3, 18, 1, "#3a6fd8"); for (let k = 0; k < 5; k++) px(sx + 1 + k * 3, sy2 + 1, 2, 2, "#9ad0e8"); px(sx + 2, sy2 + 7, 2, 1, "#111"); px(sx + 13, sy2 + 7, 2, 1, "#111");   // the shuttle, parked in the middle
        const W2 = lx1 - lx0 - 9, H2 = ly1 - ly0 - 12, per = 2 * (W2 + H2);
        const pos = (p: number): [number, number] => { p = ((p % per) + per) % per;
          if (p < W2) return [lx0 + 4 + p, ly0 + 4]; if (p < W2 + H2) return [lx1 - 5, ly0 + 4 + p - W2];
          if (p < 2 * W2 + H2) return [lx1 - 5 - (p - W2 - H2), ly1 - 8]; return [lx0 + 4, ly1 - 8 - (p - 2 * W2 - H2)]; };
        const T = [["#ffd23f", "#e0b090", "#5a3a1a"], ["#3a6fd8", "#8a5a3a", "#111"], ["#f2f2f2", "#f0c8a0", "#d8c070"], ["#2faa4a", "#e0b090", "#8a8a8a"], ["#ff8ad8", "#c08a5a", "#3a2a1a"], ["#ff8a1f", "#f0c8a0", "#6a4a2a"]];
        live.push({ k: "fn", fn: (f, t) => {
          const stop = t % 12 > 6, lead = (Math.floor(t / 12) * 6 + Math.min(t % 12, 6)) * 3.2;            // walk a while, stop and look a while
          const g = pos(lead);
          f(g[0], g[1] - 13, 1, 6, "#5a5a5a"); f(g[0] - 2, g[1] - 16, 5, 4, "#e0302f"); f(g[0] - 1, g[1] - 15, 3, 2, "#f2f2f2");   // the paddle
          const step = stop ? 0 : Math.floor(t * 5) % 2;
          const man = (x2: number, y2: number, sh: string, sk: string, hr: string, ipad: boolean, k: number) => {
            f(x2, y2 - 8, 3, 1, hr); f(x2, y2 - 7, 3, 2, sk); f(x2, y2 - 5, 3, 3, sh); f(x2 - 1, y2 - 5, 1, 2, sk); f(x2 + 3, y2 - 5, 1, 2, sk);
            f(x2 + step, y2 - 2, 1, 2, "#2a2a3a"); f(x2 + 2 - step, y2 - 2, 1, 2, "#2a2a3a");
            if (ipad) { f(x2 - 1, y2 - 7, 1, 1, "#111"); f(x2 + 3, y2 - 7, 1, 1, "#111"); f(x2, y2 - 8, 3, 1, "#111");
              f(x2 + 1, y2 - 5, 3, 2, "#2a2a2a"); f(x2 + 2, y2 - 5, 2, 1, (t * 0.8 + k * 0.37) % 1 < 0.8 ? "#9ae8ff" : "#f2ffff"); }
          };
          man(g[0] - 1, g[1], "#e0302f", "#e0b090", "#3a2a1a", false, 0);
          T.forEach(([sh, sk, hr], k) => { const q = pos(lead - 5 - k * 4.2 + (k % 2) * 0.6); man(q[0] - 1 + (k % 2 ? 1 : -1), q[1], sh, sk, hr, true, k); });
        } }); }
      // the Lisa Marie, parked across the road
      y = y0 + 64; x = at(y, 20, 46, "l");
      pad(px, x - 2, y + 12, 50, 8, "#8a8a8e", "#6a6a6e");
      px(x + 2, y + 6, 40, 5, "#f2f2f2"); px(x + 2, y + 8, 40, 1, "#3a5ab8"); px(x + 42, y + 7, 3, 3, "#f2f2f2"); px(x + 44, y + 7, 1, 2, "#9ad0e8");
      for (let k = 0; k < 8; k++) px(x + 10 + k * 4, y + 7, 1, 1, "#5a7a9a");
      px(x, y, 3, 8, "#f2f2f2"); px(x + 3, y + 2, 2, 5, "#f2f2f2"); word(px, x - 1, y - 6, "TCB", "#ffd23f", "#3a5ab8");
      px(x + 18, y + 11, 14, 2, "#d8d8d8"); px(x + 20, y + 13, 3, 2, "#5a5a5a"); px(x + 28, y + 13, 3, 2, "#5a5a5a");
      px(x + 8, y + 11, 1, 3, "#3a3a3a"); px(x + 36, y + 11, 1, 3, "#3a3a3a");
      // the Pyramid: a huge stainless-steel and glass pyramid on the river, a sunburst of glints across it
      y = y0 + 98; x = at(y, 60, 66, "l");
      { const PH = 58, cx = x + 33;
        pad(px, x - 2, y + PH - 2, 70, 6, "#9a9a9e", "#7a7a7e");
        for (let r = 0; r < PH; r++) {
          const half = Math.round(r * 0.56), y2 = y + r;
          for (let dx = -half; dx <= half; dx++) {
            const left = dx < 0, u = Math.abs(dx) / Math.max(1, half);
            let c = left ? (u > 0.85 ? "#f2f6fa" : "#c8d4de") : (u > 0.85 ? "#6a7888" : "#8a98a8");
            if (r % 5 === 0) c = left ? "#e8eef4" : "#9aa8b6";                                         // the floor bands
            if (Math.abs(dx) % 6 === 0 && dx !== 0) c = left ? "#b0bcc8" : "#7a8898";                     // the panel seams
            if (dx === 0) c = "#ffffff";
            px(cx + dx, y2, 1, 1, c);
          }
        }
        px(cx - 4, y - 4, 9, 3, "#3a3a4a"); px(cx - 3, y - 3, 7, 1, "#9ad0e8"); px(cx - 1, y - 7, 1, 3, "#cfcfcf"); px(cx, y - 8, 1, 1, "#ff3b3b");   // the lookout up top
        for (let k = 0; k < 3; k++) px(cx - 3 + k * 3, y - 5, 1, 1, ["#e0302f", "#ffd23f", "#3a6fd8"][k]);
        px(cx - 6, y + PH - 9, 12, 7, "#2a3a4a"); px(cx - 5, y + PH - 8, 10, 1, "#9ad0e8");          // the entrance
        px(cx - 17, y + PH - 18, 34, 7, "#1a3a2a"); word(px, cx - 15, y + PH - 17, "BASS PRO", "#f2f2f2", null);   // the sign over it
        // the Bass Pro guy out front: camo, cap, a rifle held up like a waiter with a wine
        { const gx = cx + 9, gy = y + PH - 10;
          folk(px, gx, gy, { shirt: "#5a6a3a", cap: "#3a4a2a", pants: "#6a5a3a", skin: "#e0b090" });
          px(gx + 1, gy + 3, 1, 1, "#3a4a2a"); px(gx + 2, gy + 5, 1, 1, "#8a7a4a");
          px(gx + 4, gy + 1, 1, 6, "#3a2a1a"); px(gx + 4, gy - 3, 1, 4, "#5a5a5a"); px(gx + 3, gy + 6, 3, 1, "#6a4a2a"); }
        ((x: number, y: number) => live.push({ k: "fn", fn: (f, t, ctx) => {                                                       // the sun sliding across the steel
          const u = (t * 0.15) % 1, ry = Math.round(u * PH);
          ctx.globalAlpha = 0.55; const half = Math.round(ry * 0.56); f(cx - half, y + ry, half, 1, "#ffffff"); f(cx - half + 1, y + ry + 1, Math.max(1, half - 2), 1, "#ffffff"); ctx.globalAlpha = 1;
          for (let k = 0; k < 4; k++) if ((t * 1.1 + hash(k * 5)) % 1 < 0.25) { const rr = Math.round(hash(k * 3) * PH), dd = Math.round((hash(k * 7) - 0.8) * rr * 0.56); f(cx + dd, y + rr, 1, 1, "#ffffff"); f(cx + dd - 1, y + rr, 3, 1, "#ffffff"); f(cx + dd, y + rr - 1, 1, 3, "#ffffff"); }
        } }))(x, y); }
      // passing the Pyramid: the guided tour of the gun counter, deadpan, one at a time
      { const L = ["Welcome to Bass Pro. Let me walk you through the guns.", "That's a bolt-action rifle.", "That's a semi-auto.", "Lever-action.", "Pump shotgun.", "Over-under.", "Revolver.", "Pistol.", "AR-15.", "Anything else I can help you with?"];
        // the van parks at the Pyramid (HOLDS[2]) while he goes down the list
        const HY = HOLDS[2].y, n = L.length - 1;
        says.push({ a: HY - 28, b: HY + 1, who: "them", text: `“${L[0]}”`, hold: 2, u0: 0, u1: 1 / n });
        L.slice(1).forEach((text, k) => says.push({ a: HY - 0.5, b: HY + 1, who: "them", text: `“${text}”`, hold: 2, u0: (k + 1) / n, u1: k === n - 1 ? 1.01 : (k + 2) / n })); }
      // a big MEMPHIS sign on the other side
      y = y0 + 108; x = at(y, 22, 34, "r");
      px(x + 8, y + 12, 1, 10, "#7a7a7a"); px(x + 24, y + 12, 1, 10, "#7a7a7a");
      px(x, y, 32, 12, "#1a1a2a"); px(x + 1, y + 1, 30, 10, "#2a2a4a"); word(px, x + 3, y + 3, "MEMPHIS", "#ff5ad1", null);
      live.push({ k: "glint", x: x + 1, y: y + 1, w: 30, h: 10 });
      river(px, y0 + 160, 14);
      { const mx = beside(y0 + 160, 14, 26, "r", 1);                  // the M bridge's arches beside the road
        for (let k = 0; k < 26; k++) { const a = Math.abs(Math.sin((k / 25) * 2 * Math.PI)); px(mx + k, y0 + 160 + 6 - Math.round(a * 6), 1, 1, "#e8eef4"); }
        px(mx, y0 + 166, 26, 1, "#9a9a9a"); }
    },
  },
  nashville: { // Nashville at night: the Batman building, cranes everywhere, Tootsie's and the hats, the Cumberland and its footbridge; then Buc-ee's
    ground: ["#2a3448", "#333d55"],
    edge: pick(eTree),
    under: ({ px, y0 }) => { for (let y = 0; y < 116; y++) for (let x = 0; x < W; x++) if (hash(x * 13 + y * 31) < 0.03) px(x, y0 + y, 1, 1, "#3a4a68"); },
    draw: ({ px, y0, rnd, live }) => {
      let x = 0, y = 0;
      // the Batman building
      y = y0 + 6; x = at(y, 52, 24, "r");
      stars(px, x - 4, y - 4, 30, 8, rnd, 6);
      px(x + 1, y + 11, 22, 40, "#7a86a8"); px(x + 2, y + 12, 20, 38, "#4a5578"); px(x + 4, y + 6, 16, 6, "#4a5578"); px(x + 3, y + 5, 18, 1, "#7a86a8");
      px(x + 4, y - 4, 2, 10, "#4a5578"); px(x + 18, y - 4, 2, 10, "#4a5578"); px(x + 4, y - 6, 1, 2, "#5a6090"); px(x + 19, y - 6, 1, 2, "#5a6090");
      for (let yy = y + 14; yy < y + 48; yy += 3) for (let xx = x + 4; xx < x + 20; xx += 2) if (hash(xx * 7 + yy) > 0.35) px(xx, yy, 1, 1, "#ffe9a0");
      px(x + 10, y + 8, 4, 3, "#e8e8f0"); px(x + 11, y + 9, 1, 1, "#2a2a3a");
      ((x: number, y: number) => live.push({ k: "fn", fn: (f, t) => { if (Math.floor(t * 1.5) % 2) { f(x + 4, y - 7, 1, 1, "#ff3b3b"); f(x + 19, y - 7, 1, 1, "#ff3b3b"); } } }))(x, y);
      // construction site with a tower crane
      crane(px, live, Math.max(2, at(y0 + 14, 60, 40, "l")), y0 + 14, 1);
      // Tootsie's and the honky-tonks
      y = y0 + 62; x = at(y, 52, 34, "r");
      px(x, y, 34, 34, "#3a1f5a"); px(x, y - 2, 34, 2, "#5a3a8a");
      px(x + 2, y + 1, 30, 7, "#1a0f2a"); word(px, x + 2, y + 2, "TOOTSIES", "#ff8ad8", null);
      for (let f2 = 0; f2 < 3; f2++) {
        const fy = y + 10 + f2 * 8;
        px(x + 1, fy, 32, 6, "#2a1a3a"); px(x, fy + 6, 34, 1, "#6a4a9a");
        live.push({ k: "club", x: x + 1, y: fy, w: 32, h: 2 });
        for (let k = 0; k < 8; k++) px(x + 2 + k * 4, fy + 3, 2, 3, ["#f0c8a0", "#c08a5a", "#8a5a3a"][(k + f2) % 3]);
        for (let k = 0; k < 8; k++) { if ((k + f2) % 2) { px(x + 1 + k * 4, fy + 2, 4, 1, "#c8a060"); px(x + 2 + k * 4, fy + 1, 2, 1, "#c8a060"); } else px(x + 2 + k * 4, fy + 2, 2, 1, ["#ffd23f", "#1a1a1a", "#f2f2f2"][(k + f2) % 3]); }
      }
      px(x + 15, y + 30, 4, 4, "#ffd23f");
      for (let k = 0; k < 3; k++) irish(px, live, x + 2 + k * 11, y - 12, 10);                 // Irish flags up on the roof

      for (let k = 0; k < 5; k++) cowboy(px, x + 2 + k * 7, y + 37, ["#e0302f", "#3a6fd8", "#f2f2f2", "#ff5ad1", "#ffd23f"][k], ["#c8a060", "#1a1a1a", "#f2f2f2", "#c8a060", "#8a5a2a"][k]);
      live.push({ k: "walk", x0: x + 1, x1: x + 30, y: y + 47, shirt: "#e0302f", hat: "#c8a060", ph: 0, brim: true });
      live.push({ k: "walk", x0: x + 1, x1: x + 30, y: y + 47, shirt: "#3a6fd8", hat: "#f2f2f2", ph: 9, brim: true, skin: "#8a5a3a" });
      // and down Broadway, more of them, both sides
      for (const [ry, side] of [[56, "l"], [64, "r"], [100, "l"], [104, "r"], [112, "l"], [196, "l"]] as const) { const yy = y0 + ry; irish(px, live, beside(yy, 10, 9, side, 1) + (side === "l" ? 0 : 0), yy, 10); }
      // a second site across the road: the frame of a tower going up
      site(px, live, at(y0 + 80, 46, 30, "l"), y0 + 80, 26);
      // the Cumberland, the road bridge, and the footbridge beside it
      river(px, y0 + 120, 16, "#2a4a7a");
      { const bx = Math.round(roadX(y0 + 128)) - 22;
        for (let yy = y0 + 116; yy < y0 + 140; yy++) { px(bx, yy, 7, 1, "#6a5a4a"); px(bx - 1, yy, 1, 1, "#4a6a8a"); px(bx + 7, yy, 1, 1, "#4a6a8a"); }
        for (let yy = y0 + 117; yy < y0 + 139; yy += 3) { px(bx - 2, yy, 1, 3, "#5a7a9a"); px(bx + 8, yy, 1, 3, "#5a7a9a"); px(bx - 2, yy + 1, 1, 1, "#8ab0d0"); px(bx + 8, yy + 2, 1, 1, "#8ab0d0"); }
        for (let yy = y0 + 118; yy < y0 + 138; yy += 5) { px(bx - 1, yy, 1, 1, "#ffe9a0"); px(bx + 7, yy, 1, 1, "#ffe9a0"); }
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 4; k++) { const d = k % 2 ? 1 : -1, yy = d > 0 ? y0 + 116 + ((t * 4 + k * 6) % 22) : y0 + 138 - ((t * 4 + k * 6) % 22);
          f(bx + 1 + k * 1.5, yy, 1, 2, ["#e0302f", "#ffd23f", "#f2f2f2", "#5af0ff"][k]); f(bx + 1 + k * 1.5, yy - 1, 1, 1, "#e0b090"); } } }); }
      crane(px, live, at(y0 + 140, 56, 40, "l"), y0 + 142, -1);
      site(px, live, at(y0 + 136, 46, 30, "r"), y0 + 136, 26);
      // Buc-ee's: the beaver, the pumps, the endless store
      y = y0 + 198; x = at(y, 30, 48, "r");
      pad(px, x - 2, y + 4, 52, 26, "#5a5a62", "#4a4a52");
      px(x + 2, y + 20, 44, 9, "#d8c8a8"); px(x + 1, y + 19, 46, 1, "#c8202a"); for (let k = 0; k < 6; k++) px(x + 4 + k * 7, y + 22, 5, 4, "#9ad0e8");
      for (let k = 0; k < 5; k++) { px(x + 4 + k * 8, y + 7, 3, 6, "#e8e8e8"); px(x + 5 + k * 8, y + 8, 1, 2, "#e0302f"); }
      px(x + 2, y + 5, 44, 2, "#c8202a"); px(x + 2, y + 5, 44, 1, "#ffd23f");
      { const cx = x + 24, cy = y - 5;
        px(cx, cy + 9, 1, 8, "#7a7a7a");
        for (let k = -9; k <= 9; k++) { const ww = Math.round(Math.sqrt(81 - k * k)); px(cx - ww, cy + k, 2 * ww + 1, 1, Math.abs(k) > 7 || ww > 7 ? "#c8202a" : "#ffd23f"); }
        px(cx - 4, cy - 4, 9, 9, "#8a5a2a"); px(cx - 5, cy - 6, 3, 2, "#8a5a2a"); px(cx + 3, cy - 6, 3, 2, "#8a5a2a");
        px(cx - 5, cy - 7, 11, 2, "#c8202a"); px(cx - 2, cy - 2, 1, 1, "#000"); px(cx + 2, cy - 2, 1, 1, "#000"); px(cx - 1, cy + 1, 3, 1, "#3a2010"); px(cx - 1, cy + 2, 3, 2, "#f2f2f2"); px(cx, cy + 2, 1, 2, "#c8c8c8"); }
      flagPole(px, x - 6 < 1 ? x + 49 : x - 6, y - 4, 14, 7, 4);
    },
  },
};

// a tower crane on a building site: yellow lattice mast, jib out over the lot, hook going up and down, red light on top
function crane(px: Px, live: Live[], x: number, y: number, dir: 1 | -1) {
  const mx = x + (dir > 0 ? 8 : 30), top = y + 2, J = 30;
  lattice(px, mx, top + 6, 3, 50, "#f0c020");
  px(mx - 1, top + 3, 5, 3, "#3a3a3a"); px(mx, top + 4, 2, 1, "#9ad0e8");                                         // the cab
  const j0 = dir > 0 ? mx + 3 : mx - J, cj = dir > 0 ? mx - 9 : mx + 3;
  for (let k = 0; k < J; k++) { px(j0 + k, top, 1, 1, "#f0c020"); px(j0 + k, top + 2, 1, 1, "#f0c020"); if (k % 3 === 0) px(j0 + k, top + 1, 1, 1, "#f0c020"); }
  px(cj, top, 9, 3, "#f0c020"); px(dir > 0 ? cj : cj + 6, top + 1, 3, 4, "#8a8a8a");                             // counter-jib + weights
  px(mx + 1, top - 5, 1, 5, "#f0c020");
  // the lot below: dirt, cones, a dozer
  const lx = Math.min(j0, cj), ly = top + 50;
  px(lx, ly, 30, 8, "#7a5a3a"); for (let k = 0; k < 5; k++) px(lx + 2 + k * 6, ly - 1, 1, 2, "#ff8a1f");
  px(lx + 19, ly + 2, 7, 4, "#ffd23f"); px(lx + 18, ly + 5, 9, 1, "#3a3a3a"); px(lx + 26, ly + 3, 2, 3, "#8a8a8a");
  folk(px, lx + 4, ly - 6, { shirt: "#ff8a1f", cap: "#ffd23f" }); folk(px, lx + 12, ly - 5, { shirt: "#ff8a1f", cap: "#f2f2f2", skin: "#8a5a3a" });
  live.push({ k: "fn", fn: (f, t) => {
    const tr = (Math.sin(t * 0.4 * dir) + 1) / 2, hx = Math.round(dir > 0 ? j0 + 6 + tr * (J - 8) : j0 + 2 + tr * (J - 8));
    const hy = top + 3 + Math.round(((Math.sin(t * 0.7) + 1) / 2) * 34);
    f(hx - 1, top + 3, 3, 1, "#3a3a3a"); for (let yy = top + 4; yy < hy; yy++) f(hx, yy, 1, 1, "#9a9a9a");
    f(hx - 1, hy, 3, 2, "#e0302f"); f(hx - 3, hy + 2, 7, 2, "#8a5a3a");                                          // a pallet of beams
    if (Math.floor(t * 1.2) % 2) f(mx + 1, top - 6, 1, 1, "#ff3b3b");
  } });
}
// a building frame going up: floors of grey slab, orange netting, a worker on top
function site(px: Px, live: Live[], x: number, y: number, w = 30) {
  for (let f2 = 0; f2 < 5; f2++) { const fy = y + 8 + f2 * 7; px(x, fy, w, 2, "#9a9aa2"); for (let k = 0; k < w; k += 6) px(x + k, fy + 2, 2, 5, "#7a7a82"); }
  px(x + w - 2, y + 8, 2, 37, "#7a7a82");
  for (let yy = y + 10; yy < y + 24; yy++) for (let xx = x + 2; xx < x + 16; xx++) if ((xx + yy) % 2 === 0) px(xx, yy, 1, 1, "#ff8a1f");
  for (let k = 0; k < Math.floor(w / 5); k++) px(x + 2 + k * 5, y + 4, 1, 4, "#8a5a3a");                                              // rebar sticking up
  px(x, y + 44, w, 2, "#5a5a5a"); for (let k = 0; k < Math.floor(w / 7) + 1; k++) { px(x + k * 7, y + 41, 1, 3, "#ff8a1f"); px(x + k * 7 - 1, y + 43, 3, 1, "#ff8a1f"); }
  live.push({ k: "fn", fn: (f, t) => { const wx = x + 4 + ((t * 3) % (w - 10)); f(wx, y + 1, 3, 1, "#ffd23f"); f(wx, y + 2, 3, 2, "#e0b090"); f(wx, y + 4, 3, 3, "#ff8a1f"); if (Math.floor(t * 4) % 3 === 0) f(wx + 4, y + 3, 1, 1, "#fff6c0"); } });
}

