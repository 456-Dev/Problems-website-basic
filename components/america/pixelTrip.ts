// Draws the 8-bit road trip strip: a little landscape per stop (some stops share
// one, some get extra stretches of road), top (LA) to bottom (Staten Island), with a
// highway winding through all of it. Pure canvas, no assets.
// drawStrip = the still map, drawLive = the moving bits, drawCanopy = things that
// sit above the van (trees, a footbridge, a tunnel). SAYS = speech bubbles by road position.

import { HARBOR } from "./harbor";

export const W = 64;      // strip width in "pixels"
const OX = 12;            // the original 40-wide trip sits in the middle, with country on both sides

export type Scene =
  | "venice" | "oc" | "vegas" | "desert" | "arches" | "vail" | "lake" | "denver" | "truckstop" | "silo"
  | "plains" | "tulsa" | "oregon" | "clinton" | "casino" | "graceland" | "nashville" | "gatlinburg"
  | "smoky" | "waffle" | "tunnel" | "antique" | "fair" | "dish" | "sunset" | "mcd" | "dc" | "jersey"
  | "clouds" | "harbor";

// in driving order; `stop` = index into lib/america.ts stops, label overrides the place name
export type Def = { sc: Scene; h: number; stop: number; label?: string };
export const SCENES: Def[] = [
  { sc: "venice", h: 80, stop: 0 }, { sc: "oc", h: 92, stop: 1 }, { sc: "vegas", h: 92, stop: 2 },
  { sc: "desert", h: 64, stop: 3 }, { sc: "arches", h: 96, stop: 4 }, { sc: "vail", h: 80, stop: 5 },
  { sc: "lake", h: 132, stop: 6 }, { sc: "denver", h: 88, stop: 7 }, { sc: "truckstop", h: 80, stop: 8 },
  { sc: "silo", h: 80, stop: 9 }, { sc: "plains", h: 92, stop: 10 }, { sc: "tulsa", h: 108, stop: 11 },
  { sc: "oregon", h: 96, stop: 12 }, { sc: "clinton", h: 88, stop: 13, label: "Little Rock" },
  { sc: "casino", h: 96, stop: 15, label: "Horseshoe · Hernando" },
  { sc: "graceland", h: 112, stop: 17, label: "Graceland · Memphis" },
  { sc: "nashville", h: 124, stop: 19, label: "Nashville · Buc-ee's" },
  { sc: "gatlinburg", h: 100, stop: 21 }, { sc: "smoky", h: 96, stop: 22 }, { sc: "waffle", h: 84, stop: 23 },
  { sc: "tunnel", h: 100, stop: 23, label: "Up into the mountains" },
  { sc: "antique", h: 92, stop: 24 }, { sc: "fair", h: 96, stop: 24 }, { sc: "dish", h: 96, stop: 25 },
  { sc: "sunset", h: 140, stop: 25, label: "Appalachia, sundown" },
  { sc: "mcd", h: 150, stop: 26 }, { sc: "dc", h: 112, stop: 27 }, { sc: "jersey", h: 104, stop: 28 },
  { sc: "clouds", h: 72, stop: 29, label: "Almost there" }, { sc: "harbor", h: 84, stop: 29 },
];
export const Y0: number[] = [];
export const HT = SCENES.reduce((a, d) => (Y0.push(a), a + d.h), 0);
export const sceneAt = (y: number) => { let i = 0; while (i < SCENES.length - 1 && Y0[i + 1] <= y) i++; return i; };
const at = (sc: Scene) => SCENES.findIndex((d) => d.sc === sc);

const GROUND: Record<Scene, [string, string]> = {
  venice: ["#e8c98a", "#d9b56f"], oc: ["#7fae4a", "#709c40"], vegas: ["#2a1d3a", "#3a2850"],
  desert: ["#d98c4a", "#c4763a"], arches: ["#cf6f3c", "#b85c2e"], vail: ["#4f8a42", "#457a3a"],
  lake: ["#3f7a3a", "#35693a"], denver: ["#5a5e66", "#666a72"], truckstop: ["#e8c040", "#d8ac30"],
  silo: ["#e8b838", "#d8a42c"], plains: ["#e8c040", "#d8ac30"], tulsa: ["#6aaa3a", "#5f9a34"],
  oregon: ["#c8743a", "#b8652f"], clinton: ["#3f9a3a", "#378a33"], casino: ["#3a5a32", "#33502c"],
  graceland: ["#5f9a45", "#548a3c"], nashville: ["#2a3448", "#333d55"], gatlinburg: ["#2f6b3a", "#285c32"],
  smoky: ["#2f6b3a", "#285c32"], waffle: ["#4f8a3c", "#457a35"], tunnel: ["#3f7a3a", "#35693a"],
  antique: ["#7a9a45", "#6b893c"], fair: ["#2f4a32", "#28402b"], dish: ["#5a8f42", "#4f7f3a"],
  sunset: ["#3a2a4a", "#33253f"], mcd: ["#6a9a4a", "#5d8a41"], dc: ["#2f6a32", "#285c2c"],
  jersey: ["#4f7a3a", "#456b33"], clouds: ["#4f7a3a", "#456b33"], harbor: ["#2f6fb0", "#3a7cbc"],
};

// the highway wanders; through Appalachia at sundown it wanders a lot more
const SUN = at("sunset");
export const roadX = (y: number) => {
  let x = OX + 20 + 9 * Math.sin(y / 23) + 3 * Math.sin(y / 7.3);
  const u = (y - Y0[SUN]) / SCENES[SUN].h;
  if (u > 0 && u < 1) x += 9 * Math.sin(Math.PI * u) * Math.sin(y / 7);
  return x;
};

// the trip ends on Staten Island: harbor map shifted so the island sits under the road's end
const HB = at("harbor");
export const ROAD_END = Y0[HB] + HARBOR.si[1] + 5;
const HDX = Math.round(roadX(ROAD_END) - HARBOR.si[0]);
const harborAt = (x: number, y: number) => {
  const r = HARBOR.rows[Math.floor(y - Y0[HB])], mx = Math.floor(x) - HDX;
  return r ? r[Math.min(HARBOR.w - 1, Math.max(0, mx))] : ".";
};

// places the van leaves the highway: a trail into the Smokies, the McDonald's drive-thru
type Detour = { a: number; b: number; dir: number; amp: number };
const mk = (sc: Scene, a: number, b: number, amp: number): Detour => {
  const y0 = Y0[at(sc)], m = y0 + (a + b) / 2;
  return { a: y0 + a, b: y0 + b, dir: roadX(m) > OX + 20 ? -1 : 1, amp };
};
export const TRAIL = mk("smoky", 24, 74, 16);
export const DRIVE = mk("mcd", 22, 128, 17);
export function vanX(y: number) {
  for (const d of [TRAIL, DRIVE]) if (y > d.a && y < d.b) {
    const u = (y - d.a) / (d.b - d.a);
    const s = d === DRIVE ? Math.min(1, Math.sin(Math.PI * u) * 2.2) : Math.sin(Math.PI * u);
    return roadX(y) + d.dir * d.amp * s;
  }
  return roadX(y);
}

// speech bubbles, shown while the van is between a and b
export type Say = { a: number; b: number; text: string; who: "us" | "them" | "note" };
const mcdQ = (() => {
  const lines: [Say["who"], string][] = [
    ["note", "First interview after hearing the news"],
    ["us", "What is one question you would ask everyone in America?"], ["them", "What is the meaning of life?"],
    ["us", "Answer your own question."], ["them", "Help others."],
    ["us", "Are you happy?"], ["them", "No."],
  ];
  const a = DRIVE.a + 2, step = (DRIVE.b - 4 - a) / lines.length;
  return lines.map(([who, text], k): Say => ({ a: a + k * step, b: a + (k + 1) * step, who, text }));
})();
export const SAYS: Say[] = [
  { a: TRAIL.a - 14, b: TRAIL.b + 4, who: "us", text: "“hey Jason, turn right onto this trail”" },
  { a: Y0[SUN] + 40, b: Y0[SUN] + 110, who: "us", text: "“Michael! Trump got shot in Pennsylvania!”" },
  ...mcdQ,
];

type Px = (x: number, y: number, w: number, h: number, c: string) => void;

// x for something w wide, h tall at row y, on whichever side of the road has more room
function room(y: number, h: number) {
  let lo = 99, hi = 0;
  for (let k = -1; k <= h + 1; k++) { const r = Math.max(roadX(y + k), vanX(y + k)) , l = Math.min(roadX(y + k), vanX(y + k)); lo = Math.min(lo, l); hi = Math.max(hi, r); }
  return { lo, hi, left: lo - 6, right: W - 1 - (hi + 6) };
}
// (too wide for the gap? it hugs the road and runs off the edge of the map instead of onto the road)
function free(y: number, h: number, w: number) {
  const { lo, hi, left, right } = room(y, h);
  if (left >= right) return w <= left ? Math.max(1, Math.round((left - w) / 2) + 1) : Math.floor(lo - 6 - w);
  return w <= right ? Math.min(W - 1 - w, Math.round(hi + 6 + (right - w) / 2)) : Math.ceil(hi + 7);
}
// the row in [ya, yb] where something h tall has the most room beside the road
function roomiest(ya: number, yb: number, h: number) {
  let best = ya, bw = -1;
  for (let y = ya; y <= yb; y++) { const r = room(y, h), m = Math.max(r.left, r.right); if (m > bw) { bw = m; best = y; } }
  return best;
}

// moving things, positioned while the map is drawn
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
  | { k: "hd"; x: number; y: number; w: number; h: number };

// set globalThis.__tripOverlap = [] to collect landmark pixels that land on the road
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
    UNDER[sc]?.(ctx, px, y0, h, rnd, live);
  });

  // side roads: dirt trail in the Smokies, the drive-thru lane
  for (let y = TRAIL.a; y < TRAIL.b; y++) px(vanX(y) - 2, y, 5, 1, "#7a5a36");
  for (let y = DRIVE.a; y < DRIVE.b; y++) { px(vanX(y) - 3, y, 7, 1, "#4a4a4e"); if (y % 6 < 3) px(vanX(y), y, 1, 1, "#e8e8e8"); }

  // the highway: asphalt, white edge lines, dashed yellow center; bridges over the harbor
  for (let y = 0; y < ROAD_END; y++) {
    const x = roadX(y);
    if (y >= Y0[HB] && harborAt(x, y) === ".") px(x - 6, y, 13, 1, "#9a9aa2");
    px(x - 4, y, 9, 1, "#3a3a3e");
    px(x - 5, y, 1, 1, "#5a5a5e"); px(x + 5, y, 1, 1, "#5a5a5e");
    px(x - 4, y, 1, 1, "#e8e8e8"); px(x + 4, y, 1, 1, "#e8e8e8");
    if (y % 6 < 3) px(x, y, 1, 1, "#ffd23f");
  }
  px(roadX(ROAD_END) - 5, ROAD_END, 11, 2, "#e0302f"); px(roadX(ROAD_END) - 4, ROAD_END + 2, 9, 1, "#f2f2f2");   // end of the road

  // landmarks last, beside the road
  const dbg = (globalThis as { __tripOverlap?: string[] }).__tripOverlap;
  SCENES.forEach(({ sc, h }, i) => {
    const y0 = Y0[i];
    const spx: Px = dbg ? (x, y, w, hh, c) => {
      for (let yy = Math.round(y); yy < Math.round(y) + hh; yy++) {
        const r = roadX(yy), v = vanX(yy), x0 = Math.round(x), x1 = x0 + w - 1;
        if (yy < ROAD_END && ((x1 >= r - 5 && x0 <= r + 5) || (v !== r && x1 >= v - 3 && x0 <= v + 3))) { dbg.push(`${sc}@${yy - y0}:${x0}-${x1} r${Math.round(r)} v${Math.round(v)}`); break; }
      }
      px(x, y, w, hh, c);
    } : px;
    const kit = EDGE[sc];
    if (kit) for (let k = 0; k < Math.floor(h / 16); k++) {
      const left = k % 2 === 0, x = left ? 2 + Math.floor(rnd() * 5) : W - 9 + Math.floor(rnd() * 4), y = y0 + 6 + k * 13 + Math.floor(rnd() * 5);
      const r = room(y, 9);
      const far = left ? x + 8 < r.lo - 6 : x - 1 > r.hi + 6;
      if (far) kit(spx, x, y);
    }
    drawScene(sc, y0, h, spx, rnd, live, ctx);
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
const PRIDE = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"];

export function drawLive(ctx: CanvasRenderingContext2D, now: number, still: boolean, live: Live[]) {
  const t = still ? 2.2 : now / 1000;
  const f = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  for (const L of live) {
    if (L.k === "fire") {
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

// things above the van: trees over the Smokies trail, Denver's green footbridge, the tunnel
export function drawCanopy(ctx: CanvasRenderingContext2D) {
  const f = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  { const a = TRAIL.a + 12, b = TRAIL.b - 12, G = ["#12302a", "#1c4a36", "#2a6a48", "#173c30"];
    for (let y = a - 4; y < b + 4; y += 2) {
      const edge = Math.min(y - a + 4, b + 4 - y), r = Math.min(9, 3 + edge);
      for (let k = 0; k < 3; k++) {
        const x = vanX(Math.min(b, Math.max(a, y))) + (hash(y * 5 + k) - 0.5) * r * 1.6, w = 3 + Math.floor(hash(y * 7 + k) * r);
        f(x - w / 2, y - 1, w, 3, G[(y + k) % 4]);
        f(x - w / 2 + 1, y - 2, Math.max(1, w - 2), 1, G[(y + k + 2) % 4]);
      }
    }
    for (let y = a; y < b; y += 5) f(vanX(y) + (hash(y) - 0.5) * 6, y, 1, 1, "#3a8a5a"); }
  { const y = Y0[at("denver")] + 44, x = roadX(y + 2);                     // the green walkway over the street
    f(x - 12, y, 25, 5, "#2f8a4a"); f(x - 12, y + 1, 25, 3, "#3faa5a");
    for (let k = -12; k < 13; k += 3) { f(x + k, y, 1, 5, "#1f6a3a"); f(x + k + 1, y + 2, 1, 1, "#1f6a3a"); }
    f(x - 12, y - 1, 25, 1, "#bfe8c8"); f(x - 4, y + 2, 1, 1, "#ff5ad1"); f(x + 3, y + 1, 1, 1, "#ffd23f"); f(x + 7, y + 2, 1, 1, "#5af0ff"); }
  { const y0 = Y0[at("tunnel")], a = y0 + 12, b = y0 + 40;                 // the mountain the tunnel goes through
    for (let y = a; y < b; y++) { const x = roadX(y); f(x - 7, y, 15, 1, (y * 7 + Math.floor(x)) % 5 === 0 ? "#5a5048" : "#6a6058"); }
    for (let y = a; y < b; y += 3) f(roadX(y) - 6 + ((y * 3) % 11), y, 2, 1, "#2f6a32");
    for (const [yy, s] of [[a, 1], [b - 1, -1]] as const) {
      const x = roadX(yy);
      f(x - 7, yy - s, 15, 1, "#8a8278"); f(x - 6, yy, 13, 1, "#9a928a");
      f(x - 4, yy + (s > 0 ? 1 : -1), 9, 1, "#1a1614");
    } }
}

/* ---------- the out-of-place 3D render (Green Bank) ---------- */

// smooth, shaded, nothing like the rest: drawn onto its own hi-res canvas
export function drawDish3D(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const g = (x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => { const gr = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  // soft ground shadow
  const sh = ctx.createRadialGradient(w * 0.5, h * 0.93, 2, w * 0.5, h * 0.93, w * 0.45);
  sh.addColorStop(0, "rgba(0,0,0,0.45)"); sh.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = sh; ctx.fillRect(0, h * 0.8, w, h * 0.2);
  // lattice tower
  ctx.fillStyle = g(w * 0.3, 0, w * 0.7, 0, [[0, "#b9bec6"], [0.5, "#ffffff"], [1, "#8a909a"]]);
  ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.9); ctx.lineTo(w * 0.42, h * 0.45); ctx.lineTo(w * 0.58, h * 0.45); ctx.lineTo(w * 0.7, h * 0.9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(90,96,108,0.8)"; ctx.lineWidth = Math.max(1, w / 90);
  for (let k = 0; k < 6; k++) { const y = h * (0.47 + k * 0.072); ctx.beginPath(); ctx.moveTo(w * (0.42 - k * 0.019), y); ctx.lineTo(w * (0.58 + k * 0.019), y + h * 0.072); ctx.moveTo(w * (0.58 + k * 0.019), y); ctx.lineTo(w * (0.42 - k * 0.019), y + h * 0.072); ctx.stroke(); }
  // base
  ctx.fillStyle = g(0, h * 0.86, 0, h * 0.94, [[0, "#d8dce2"], [1, "#7a808a"]]); ctx.fillRect(w * 0.22, h * 0.86, w * 0.56, h * 0.07);
  // the dish: a tilted ellipse with a glossy highlight
  ctx.save(); ctx.translate(w * 0.5, h * 0.3); ctx.rotate(-0.35);
  ctx.fillStyle = g(-w * 0.45, 0, w * 0.45, 0, [[0, "#7a828e"], [0.35, "#f4f6fa"], [0.55, "#ffffff"], [1, "#9aa2ae"]]);
  ctx.beginPath(); ctx.ellipse(0, 0, w * 0.46, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = g(0, -h * 0.1, 0, h * 0.12, [[0, "rgba(40,48,60,0.35)"], [1, "rgba(255,255,255,0)"]]);
  ctx.beginPath(); ctx.ellipse(0, h * 0.01, w * 0.4, h * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  const spec = ctx.createRadialGradient(-w * 0.12, -h * 0.04, 1, -w * 0.12, -h * 0.04, w * 0.22);
  spec.addColorStop(0, "rgba(255,255,255,0.95)"); spec.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = spec;
  ctx.beginPath(); ctx.ellipse(0, 0, w * 0.46, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  // feed arm sweeping up and over
  ctx.strokeStyle = g(w * 0.3, 0, w * 0.45, 0, [[0, "#c8ccd4"], [1, "#6a707a"]]); ctx.lineWidth = Math.max(2, w / 30); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(w * 0.36, h * 0.03); ctx.quadraticCurveTo(w * 0.4, -h * 0.22, w * 0.02, -h * 0.24); ctx.stroke();
  ctx.fillStyle = g(0, -h * 0.28, 0, -h * 0.2, [[0, "#ffffff"], [1, "#8a909a"]]); ctx.fillRect(-w * 0.04, -h * 0.28, w * 0.1, h * 0.07);
  ctx.restore();
  // a cheesy render-engine lens flare
  const fl = ctx.createRadialGradient(w * 0.82, h * 0.12, 0, w * 0.82, h * 0.12, w * 0.18);
  fl.addColorStop(0, "rgba(255,255,240,0.9)"); fl.addColorStop(0.3, "rgba(255,240,200,0.35)"); fl.addColorStop(1, "rgba(255,240,200,0)");
  ctx.fillStyle = fl; ctx.fillRect(0, 0, w, h);
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
// a river across the whole stop; the road crosses it on a bridge
function river(px: Px, y: number, h: number, c = "#2f6fb0") {
  px(0, y, W, h, c); px(0, y + 1, W, 1, "#5f9fe0");
  for (let yy = y - 1; yy < y + h + 1; yy++) { px(roadX(yy) - 6, yy, 13, 1, "#8a8a92"); px(roadX(yy) - 4, yy, 9, 1, "#3a3a3e"); if (yy % 6 < 3) px(roadX(yy), yy, 1, 1, "#ffd23f"); }
}
// a little person, 3 wide and 8 tall
function person(px: Px, x: number, y: number, shirt: string, hat = "#3a2a1a", pants = "#2a2a3a", skin = "#e0b090") {
  px(x, y, 3, 1, hat); px(x, y + 1, 3, 2, skin); px(x, y + 3, 3, 3, shirt);
  px(x, y + 6, 1, 2, pants); px(x + 2, y + 6, 1, 2, pants);
}
function cowboy(px: Px, x: number, y: number, shirt: string, hat = "#c8a060") {
  px(x - 1, y + 1, 5, 1, hat); px(x, y, 3, 1, hat); px(x, y + 2, 3, 1, "#e0b090");
  px(x, y + 3, 3, 3, shirt); px(x, y + 6, 1, 2, "#3a5a8a"); px(x + 2, y + 6, 1, 2, "#3a5a8a");
}
// patchwork crop fields, center-pivot circles (the plains seen from the plane window)
function fields(px: Px, rnd: () => number, y0: number, h: number, pal: string[]) {
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
function pivot(px: Px, cx: number, cy: number, r: number, c = "#4ab83a") {
  for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k)); px(cx - ww, cy + k, 2 * ww + 1, 1, k % 2 ? c : shade(c)); }
  px(cx, cy, r, 1, "#cfcfcf");
}
const shade = (c: string) => "#" + [1, 3, 5].map((i) => Math.max(0, parseInt(c.slice(i, i + 2), 16) - 22).toString(16).padStart(2, "0")).join("");

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
function windmill(px: Px, x: number, y: number) {
  for (let r = 0; r < 13; r++) { px(x - Math.floor(r / 4), y + r, 1, 1, "#8a8a8a"); px(x + Math.floor(r / 4), y + r, 1, 1, "#8a8a8a"); }
  for (let r = 3; r < 13; r += 3) px(x - Math.floor(r / 4), y + r, 2 * Math.floor(r / 4) + 1, 1, "#8a8a8a");
  for (const [dx, dy] of [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]]) px(x + dx, y - 1 + dy, 1, 1, "#e8e8e8");
  px(x, y - 1, 1, 1, "#444"); px(x + 1, y - 1, 4, 1, "#9a9a9a"); px(x + 4, y - 3, 1, 3, "#e0302f");
}
function turbine(px: Px, x: number, y: number) {
  px(x, y, 1, 16, "#e8e8e8"); px(x - 1, y - 1, 3, 2, "#f2f2f2");
  px(x, y - 8, 1, 7, "#f2f2f2");
  for (let k = 1; k < 6; k++) { px(x + k, y + Math.ceil(k * 0.6), 1, 1, "#f2f2f2"); px(x - k, y + Math.ceil(k * 0.6), 1, 1, "#f2f2f2"); }
}
const GLYPH: Record<string, string> = {
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", K: "101101110101101",
  L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "111101101101111", P: "110101110100100",
  Q: "010101101111011", R: "110101110101101", S: "111100111001111", T: "111010010010010", U: "101101101101111", V: "101101101101010",
  W: "101101111111101", X: "101101010101101", Y: "101101010010010", " ": "000000000000000",
};
function word(px: Px, x: number, y: number, s: string, fg = "#111", bg: string | null = "#ffd23f") {
  [...s].forEach((ch, n) => {
    if (bg) px(x + n * 4 - 1, y - 1, 5, 7, bg);
    GLYPH[ch].split("").forEach((bit, k) => { if (bit === "1") px(x + n * 4 + (k % 3), y + Math.floor(k / 3), 1, 1, fg); });
  });
}
const wordW = (s: string) => s.length * 4 - 1;

type Edge = (px: Px, x: number, y: number) => void;
const ePine: Edge = (px, x, y) => pine(px, x + 3, y);
const ePalm: Edge = (px, x, y) => palm(px, x + 4, y + 2);
const eCactus: Edge = (px, x, y) => { px(x + 3, y, 2, 8, "#2f8a3a"); px(x + 1, y + 2, 1, 3, "#2f8a3a"); px(x + 1, y + 4, 2, 1, "#2f8a3a"); px(x + 6, y + 1, 1, 3, "#2f8a3a"); px(x + 5, y + 3, 2, 1, "#2f8a3a"); };
const eHay: Edge = (px, x, y) => { px(x + 1, y + 2, 5, 4, "#d8b048"); px(x + 2, y + 3, 3, 2, "#b88f2a"); };
const eTree: Edge = (px, x, y) => { px(x + 1, y, 5, 5, "#2f7a2a"); px(x, y + 1, 7, 3, "#2f7a2a"); px(x + 2, y + 1, 2, 1, "#5aa84a"); px(x + 3, y + 5, 1, 2, "#5a3a1a"); };
const eDogwood: Edge = (px, x, y) => { px(x + 1, y, 5, 5, "#f2a8c8"); px(x, y + 1, 7, 3, "#f2a8c8"); px(x + 2, y + 1, 2, 1, "#ffffff"); px(x + 3, y + 5, 1, 2, "#5a3a1a"); };
const eHouse: Edge = (px, x, y) => { px(x + 1, y + 3, 6, 4, "#e8e2d0"); px(x, y + 1, 8, 2, "#7a2f1f"); px(x + 3, y + 5, 1, 2, "#5a3a1a"); };
const eRock: Edge = (px, x, y) => { px(x + 1, y + 3, 5, 3, "#8a7a6a"); px(x + 2, y + 2, 3, 1, "#a8988a"); };
const eCow: Edge = (px, x, y) => { px(x + 1, y + 3, 5, 3, "#7a4a2a"); px(x + 6, y + 2, 2, 2, "#7a4a2a"); px(x + 1, y + 6, 1, 1, "#3a2a1a"); px(x + 5, y + 6, 1, 1, "#3a2a1a"); };
const eSunflower: Edge = (px, x, y) => { for (const [dx, dy] of [[1, 1], [5, 2], [3, 4], [6, 6], [1, 6]]) { px(x + dx, y + dy, 2, 2, "#ffd21f"); px(x + dx, y + dy, 1, 1, "#6a3a1a"); } };
const eOwl: Edge = (px, x, y) => { px(x + 3, y + 2, 1, 6, "#6a4a2a"); px(x + 2, y, 3, 3, "#6a5a4a"); px(x + 2, y + 1, 1, 1, "#ffd23f"); px(x + 4, y + 1, 1, 1, "#ffd23f"); };
const pick = (...k: Edge[]): Edge => { let n = 0; return (px, x, y) => k[n++ % k.length](px, x, y); };
const EDGE: Partial<Record<Scene, Edge>> = {
  venice: pick(ePalm, eRock), oc: pick(eTree, ePalm), desert: pick(eCactus, eRock), arches: pick(eCactus, eRock),
  vegas: pick(eCactus, eRock), vail: pick(ePine), lake: pick(ePine, eRock), truckstop: pick(eCow, eSunflower),
  silo: pick(eSunflower, eHay), plains: pick(eSunflower, eHay), tulsa: pick(eTree, eCow), oregon: pick(eRock, eTree),
  clinton: pick(eDogwood, eTree), casino: pick(eTree, eHouse), graceland: pick(eTree), nashville: pick(eTree), gatlinburg: pick(ePine),
  smoky: pick(ePine), waffle: pick(ePine, eTree), tunnel: pick(ePine), antique: pick(eTree, eCow), fair: pick(eOwl, ePine),
  dish: pick(ePine), mcd: pick(eTree), dc: pick(eTree), jersey: pick(eTree, eHouse),
};

/* ---------- under the road: big ground pieces ---------- */

type Under = (ctx: CanvasRenderingContext2D, px: Px, y0: number, h: number, rnd: () => number, live: Live[]) => void;
const KANSAS = ["#e8c040", "#7ac83a", "#d89a3a", "#4ab83a", "#f0d860", "#a8d84a", "#c87a3a"];
const UNDER: Partial<Record<Scene, Under>> = {
  smoky: (ctx, px, y0, h) => smokies(ctx, px, y0, h),
  truckstop: (ctx, px, y0, h, rnd) => { fields(px, rnd, y0, h, KANSAS); pivot(px, 8, y0 + 64, 6); pivot(px, 56, y0 + 22, 7, "#5ac83a"); },
  silo: (ctx, px, y0, h, rnd) => { fields(px, rnd, y0, h, KANSAS); pivot(px, 54, y0 + 66, 7); },
  plains: (ctx, px, y0, h, rnd) => { fields(px, rnd, y0, h, KANSAS); pivot(px, 7, y0 + 80, 6, "#5ac83a"); },
  oregon: (ctx, px, y0, h, rnd) => { for (let k = 0; k < 14; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * h); px(x, y, 6, 3, "#5aa83a"); px(x + 1, y - 1, 4, 1, "#6ab84a"); } },
  tulsa: (ctx, px, y0, h, rnd) => { for (let k = 0; k < 10; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * h); px(x, y, 7, 4, "#c8643a"); px(x + 1, y + 1, 5, 2, "#d8743a"); } },
  lake: (ctx, px, y0, h, rnd, live) => {
    // a sky full of smoke and orange glow, a wall of snowy peaks in front of it
    for (let y = 0; y < 30; y++) px(0, y0 + y, W, 1, ["#c86a3a", "#d87a3a", "#e89a4a", "#a8a0a8", "#8aa0b8"][Math.min(4, Math.floor(y / 6))]);
    const ridge: number[] = [];
    for (let x = 0; x < W; x++) ridge.push(y0 + 60);
    for (const [cx, hh] of [[4, 30], [17, 40], [31, 34], [44, 44], [58, 36]]) for (let r = 0; r < hh; r++) {
      const top = y0 + 60 - hh + r, x0 = Math.round(cx - r * 0.8), ww = Math.round(r * 1.6) + 1;
      px(x0, top, ww, 1, r < hh * 0.3 ? "#f4f6f8" : "#6a7090");
      if (r > hh * 0.3) px(cx, top, Math.round(r * 0.8) + 1, 1, "#525878");
      for (let x = Math.max(0, x0); x < Math.min(W, x0 + ww); x++) ridge[x] = Math.min(ridge[x], top);
    }
    live.push({ k: "fire", x: 0, y: y0, w: W, h: 9, ridge });
    live.push({ k: "plume", x: 6, y: y0 + 14, w: 52, rise: 230 });
    ctx.globalAlpha = 0.45; px(0, y0 + 48, W, 3, "#eef4f6"); ctx.globalAlpha = 1;
    for (const [cx, hh] of [[10, 18], [26, 24], [38, 17], [52, 22]]) for (let r = 0; r < hh; r++) {
      const top = y0 + 66 - hh + r;
      px(cx - r, top, 2 * r + 1, 1, r < 4 ? "#dfe6ee" : "#3f4a5a");
      if (r >= 4) px(cx, top, r + 1, 1, "#33404e");
    }
  },
  sunset: (ctx, px, y0, h) => {
    const SKY = ["#2a1f4a", "#4a2a6a", "#7a3a7a", "#b84a6a", "#e86a4a", "#f8a04a", "#ffd07a"];
    for (let y = 0; y < 36; y++) px(0, y0 + y, W, 1, SKY[Math.min(6, Math.floor(y / 5.2))]);
    for (let k = -6; k <= 6; k++) { const ww = Math.round(Math.sqrt(36 - k * k)); if (k <= 0) px(44 - ww, y0 + 33 + k, 2 * ww + 1, 1, "#fff0b0"); }
    const R = ["#6a3a6a", "#4a2a5a", "#38224a", "#2a1a3a", "#1f1430"];
    R.forEach((c, k) => {
      const base = y0 + 34 + k * ((h - 34) / 5);
      for (let x = 0; x < W; x++) {
        const top = Math.round(base - (4 + k) * (0.55 * Math.sin(x / (6 + k) + k * 2.1) + 0.45 * Math.sin(x / (2.7 + k) + k)) - 3);
        px(x, top, 1, base + (h - 34) / 5 + 3 - top, c);
      }
      ctx.globalAlpha = 0.35; px(0, base + 2, W, 2, "#f8a07a"); ctx.globalAlpha = 1;
    });
  },
  harbor: (ctx, px, y0, h) => {
    const C: Record<string, string> = { ".": "#2f6fb0", j: "#9a9a88", s: "#4fb03a", m: "#8a8f99", b: "#a8907a" };
    for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
      const c = harborAt(x, y0 + y); px(x, y0 + y, 1, 1, C[c]);
      if (c === "m" && (x * 7 + y * 3) % 4 === 0) px(x, y0 + y, 1, 1, "#d8dce4");
      if (c === "b" && (x * 5 + y * 3) % 5 === 0) px(x, y0 + y, 1, 1, "#7a5a4a");
      if (c === "j" && (x * 5 + y * 3) % 7 === 0) px(x, y0 + y, 1, 1, "#7a8a6a");
      if (c === "." && (x * 13 + y * 7) % 23 === 0) px(x, y0 + y, 2, 1, "#5f9fe0");
    }
  },
  dc: (ctx, px, y0, h, rnd) => {           // the road comes in through the forest
    for (let k = 0; k < 90; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * 40); px(x - 2, y, 5, 4, ["#1f5a2a", "#2a6a32", "#174a24"][k % 3]); px(x - 1, y - 1, 3, 1, "#3a7a3a"); }
  },
  tunnel: (ctx, px, y0) => {               // the mountain, then the overlook and the lakes far below
    for (let y = y0 + 8; y < y0 + 44; y++) for (let x = 0; x < W; x++) px(x, y, 1, 1, (x * 7 + y * 3) % 9 === 0 ? "#5a5048" : (y - y0 < 12 || y - y0 > 40) ? "#7a7068" : "#6a6058");
    for (let x = 0; x < W; x += 3) pine(px, x, y0 + 2 + (x % 5), "#1f5a2a");
  },
};

/* ---------- one scene per stop ---------- */

function drawScene(sc: Scene, y0: number, h: number, px: Px, rnd: () => number, live: Live[], ctx: CanvasRenderingContext2D) {
  const L = OX + (roadX(y0 + h / 2) > OX + 20 ? 1 : 23);
  const b = y0 + h - 12; // baseline near the bottom of the scene
  let x = 0, y = 0;
  switch (sc) {
    case "venice": {
      y = y0 + 2; x = free(y, 16, 20);
      px(x, y, 20, 11, "#3a8fd6"); px(x, y + 3, 20, 1, "#7fc0f0"); px(x, y + 11, 20, 2, "#f4f4f4");
      px(x + 14, y + 16, 4, 2, "#e8823a"); px(x + 15, y + 15, 2, 1, "#f4b07a"); px(x + 16, y + 16, 1, 1, "#b85a22");
      px(x + 13, y + 17, 1, 1, "#c0302a"); px(x + 12, y + 16, 1, 1, "#111"); px(x + 13, y + 18, 1, 1, "#c0302a"); px(x + 17, y + 18, 1, 1, "#c0302a");
      y = y0 + 20; x = free(y, 12, 13);
      px(x + 2, y + 2, 7, 5, "#3a6fd8"); px(x + 1, y + 1, 9, 1, "#e0302f"); px(x + 3, y + 3, 2, 2, "#cfe8ff");
      px(x + 2, y + 7, 1, 5, "#f2f2f2"); px(x + 8, y + 7, 1, 5, "#f2f2f2"); px(x + 9, y + 7, 4, 1, "#f2f2f2");
      y = y0 + 37; x = free(y, 12, 18);
      px(x, y, 18, 12, "#2f7a9a"); px(x + 1, y + 1, 16, 10, "#3a8fb0");
      px(x + 1, y + 1, 16, 1, "#f2f2f2"); px(x + 1, y + 10, 16, 1, "#f2f2f2"); px(x + 1, y + 1, 1, 10, "#f2f2f2"); px(x + 16, y + 1, 1, 10, "#f2f2f2");
      px(x + 9, y + 1, 1, 10, "#f2f2f2"); px(x + 2, y + 4, 3, 4, "#d8603a"); px(x + 14, y + 4, 3, 4, "#d8603a");
      px(x + 1, y + 5, 1, 2, "#ff8a1f"); px(x + 16, y + 5, 1, 2, "#ff8a1f");
      px(x + 6, y + 4, 2, 2, "#3a2a1a"); px(x + 11, y + 7, 2, 2, "#f0c8a0"); px(x + 8, y + 3, 1, 1, "#ff8a1f");
      y = y0 + 55; x = free(y, 11, 14) + 4;
      person(px, x + 4, y, "#2fa8a0", "#f2f2f2", "#2a3a5a");
      for (const wx of [x, x + 8]) { px(wx, y + 8, 3, 1, "#111"); px(wx, y + 10, 3, 1, "#111"); px(wx - 1, y + 9, 1, 1, "#111"); px(wx + 3, y + 9, 1, 1, "#111"); }
      px(x + 2, y + 8, 8, 1, "#e0302f"); px(x + 4, y + 7, 3, 2, "#111"); px(x + 9, y + 5, 1, 4, "#9a9a9a"); px(x + 8, y + 5, 2, 1, "#111");
      px(x - 3, y + 6, 2, 1, "#f2f2f2"); px(x - 4, y + 8, 3, 1, "#f2f2f2");
      palm(px, free(y0 + 68, 8, 9) + 4, y0 + 68);
      break;
    }
    case "oc": {
      y = y0 + 3; x = free(y, 20, 24);
      for (const [dx, r] of [[5, 5], [16, 4]]) {
        for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k) * 2) + 1; px(x + dx - Math.floor(ww / 2), y + 8 + k, ww, 1, k < -r / 2 ? "#ffffff" : "#d8dce0"); }
        px(x + dx - r, y + 9 + r, 1, 3, "#8a8a8a"); px(x + dx + r, y + 9 + r, 1, 3, "#8a8a8a");
      }
      px(x, y + 16, 24, 1, "#9a9a9a"); px(x + 11, y + 6, 1, 11, "#9a9a9a");
      px(x + 21, y + 1, 2, 13, "#b8b8b8"); px(x + 21, y + 1, 2, 2, "#e0302f"); px(x + 21, y + 6, 2, 1, "#e0302f");
      px(x + 21, y - 1, 2, 2, "#ff8a1f"); px(x + 21, y - 2, 1, 1, "#ffd23f");
      y = y0 + 26; x = free(y, 24, 22);
      bldg(px, x, y + 6, 6, 18, "#6a8aa8", "#cfe8ff", rnd); bldg(px, x + 7, y, 7, 24, "#4a6a88", "#cfe8ff", rnd);
      bldg(px, x + 15, y + 9, 6, 15, "#8aa0b8", "#e8f4ff", rnd); px(x + 9, y - 1, 3, 1, "#e0302f");
      y = roomiest(y0 + 52, y0 + 66, 42) ; x = free(y - 21, 42, 26);
      px(x, y, 26, 2, "#4a2a6a"); px(x, y + 2, 26, 10, "#8a4ac8"); px(x, y + 2, 26, 1, "#a86ae8");
      for (let k = 0; k < 6; k++) { px(x + 1 + k * 4, y + 6, 3, 4, "#cfe8ff"); px(x + 1 + k * 4, y + 4, 3, 1, ["#ff5ad1", "#ffd23f", "#5af0ff"][k % 3]); }
      px(x + 2, y + 12, 22, 1, "#5a5a5a");
      px(x + 1, y + 13, 24, 8, "#4a4a4e"); for (let k = 0; k < 6; k++) px(x + 2 + k * 4, y + 14, 1, 6, "#e8e8e8");
      px(x + 4, y + 15, 2, 3, "#e0302f"); px(x + 13, y + 16, 2, 3, "#3a6fd8"); px(x + 20, y + 15, 2, 3, "#f2f2f2");
      { const sw = wordW("MARKET") + 2, sx = x + Math.floor((26 - sw) / 2);
        px(sx - 1, y - 21, sw + 2, 21, "#5a2a8a");
        word(px, sx + 4, y - 19, "THE", "#ffffff", null); word(px, sx + 1, y - 13, "MARKET", "#ffffff", null); word(px, sx + 3, y - 7, "PLACE", "#ffd23f", null); }
      break;
    }
    case "vegas": {
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
      y = roomiest(y0 + 58, y0 + 68, 20); x = free(y, 20, 30);
      px(x, y + 9, 30, 2, "#0a4a8a"); px(x, y + 11, 30, 8, "#0071ce"); px(x + 13, y + 14, 4, 5, "#cfe8ff");
      word(px, x + 1, y + 2, "WALMART", "#ffffff", null); px(x, y + 1, 30, 1, "#0071ce"); px(x, y + 7, 30, 1, "#0071ce");
      px(x, y + 1, 1, 7, "#0071ce"); px(x + 29, y + 1, 1, 7, "#0071ce");
      break;
    }
    case "desert": {
      y = y0 + 40; x = free(y, 12, 14);
      px(x + 1, y + 3, 13, 9, "#a8432a"); px(x + 3, y, 9, 3, "#a8432a"); px(x + 3, y, 9, 1, "#c45a38");
      y = y0 + 6; x = free(y, 20, 14);
      px(x + 3, y, 7, 2, "#f2f2f2"); px(x + 2, y + 2, 9, 3, "#e8e8e8"); px(x + 4, y + 1, 3, 1, "#ff8a1f"); px(x + 3, y + 3, 7, 1, "#d8d8d8"); px(x + 6, y + 2, 1, 1, "#e0302f");
      px(x + 3, y + 5, 7, 4, "#f0b890"); px(x + 3, y + 6, 7, 1, "#111"); px(x + 4, y + 6, 2, 1, "#3a3a3a"); px(x + 7, y + 6, 2, 1, "#3a3a3a");
      px(x + 5, y + 8, 3, 2, "#e8e0c0"); px(x + 6, y + 10, 1, 1, "#e8e0c0");
      px(x + 1, y + 10, 11, 7, "#1a1a1a");
      for (const [dx, hh, c] of [[2, 3, "#ff3b1f"], [4, 4, "#ff8a1f"], [7, 3, "#ff3b1f"], [9, 4, "#ffd23f"], [5, 2, "#ffd23f"]] as const) px(x + dx, y + 17 - hh, 1, hh, c);
      px(x, y + 11, 1, 4, "#f0b890"); px(x + 12, y + 11, 1, 3, "#f0b890"); px(x + 12, y + 10, 2, 1, "#9a9a9a");
      px(x + 2, y + 17, 3, 3, "#3a5a8a"); px(x + 8, y + 17, 3, 3, "#3a5a8a");
      break;
    }
    case "arches": { // Delicate Arch, the cliff jump, The Body Keeps the Score (its cover, not its words), bikers with pride flags
      y = y0 + 4; x = free(y, 26, 16);
      px(x + 2, y + 4, 3, 22, "#a8432a"); px(x + 11, y + 8, 3, 18, "#a8432a");
      px(x + 3, y + 2, 4, 2, "#bf5534"); px(x + 6, y + 1, 4, 2, "#bf5534"); px(x + 9, y + 3, 3, 2, "#bf5534"); px(x + 11, y + 5, 2, 3, "#bf5534");
      y = y0 + 36; x = free(y - 8, 32, 20);
      px(x, y, 7, 22, "#9a3a22"); px(x, y, 7, 1, "#c45a38"); person(px, x + 2, y - 8, "#e0302f", "#3a2a1a", "#3a6fd8");
      px(x + 10, y + 5, 3, 1, "#f0c8a0"); px(x + 11, y + 6, 2, 3, "#ffd23f"); px(x + 10, y + 9, 1, 2, "#3a6fd8"); px(x + 13, y + 9, 1, 2, "#3a6fd8"); px(x + 9, y + 6, 1, 1, "#f0c8a0"); px(x + 14, y + 5, 1, 1, "#f0c8a0");
      px(x + 7, y + 17, 13, 6, "#2f8ab8"); px(x + 8, y + 18, 4, 1, "#7fd0f0"); px(x + 14, y + 16, 1, 1, "#e8f8ff"); px(x + 16, y + 15, 1, 1, "#e8f8ff"); px(x + 12, y + 15, 1, 1, "#e8f8ff");
      y = y0 + 68; x = free(y, 16, 15);                                                       // the book: white cover, blue title, orange band
      px(x, y, 15, 16, "#1a1a1a"); px(x + 1, y + 1, 13, 14, "#f4f2ec");
      for (const [yy, w2] of [[2, 11], [4, 9], [6, 11], [8, 7]] as const) px(x + 2, y + yy, w2, 1, "#1f3a6a");
      px(x + 1, y + 10, 13, 2, "#e8702a"); px(x + 2, y + 13, 8, 1, "#8a8a8a");
      live.push({ k: "bikers", a: y0 + 6, b: y0 + h - 4 });
      break;
    }
    case "vail": { // the alpine village; a retired army man and his wife, still sweet on each other
      y = y0 + 3; x = free(y, 14, 22);
      peak(px, x + 10, y, 11, "#7a8aa0");
      for (let r = 0; r < 12; r++) px(x + 4 + r, y + 3 + r, 1, 1, "#333");
      px(x + 7, y + 6, 3, 2, "#e0302f"); px(x + 8, y + 8, 1, 1, "#333"); px(x + 12, y + 10, 3, 2, "#ffd23f"); px(x + 13, y + 12, 1, 1, "#333");
      y = y0 + 36; x = free(y, 14, 24);
      for (const [dx, c] of [[0, "#f2ead8"], [9, "#f8f0e0"], [17, "#efe4cc"]] as const) {
        for (let r = 0; r < 4; r++) px(x + dx + 3 - r, y + r, 2 * r + 1, 1, r === 0 ? "#ffffff" : "#6a3a1a");
        px(x + dx, y + 4, 7, 7, c); px(x + dx, y + 6, 7, 1, "#8a5a2a"); px(x + dx + 1, y + 8, 2, 2, "#5a8ac8"); px(x + dx + 4, y + 8, 2, 3, "#6a3a1a");
        px(x + dx + 1, y + 10, 2, 1, "#e0302f");
      }
      y = y0 + 54; x = free(y, 18, 22);
      // him: garrison cap, grey temples, the pencil mustache, olive coat with ribbons
      px(x + 2, y, 7, 2, "#4a5a2a"); px(x + 2, y + 2, 1, 2, "#c8c8c8"); px(x + 8, y + 2, 1, 2, "#c8c8c8");
      px(x + 3, y + 2, 5, 5, "#f0c8a0"); px(x + 4, y + 3, 1, 1, "#111"); px(x + 6, y + 3, 1, 1, "#111"); px(x + 4, y + 5, 3, 1, "#1a1a1a");
      px(x + 2, y + 7, 7, 7, "#5a6a32"); px(x + 3, y + 8, 2, 1, "#e0302f"); px(x + 3, y + 9, 2, 1, "#ffd23f"); px(x + 5, y + 7, 1, 7, "#c8a830");
      px(x + 3, y + 14, 2, 4, "#3a3a2a"); px(x + 6, y + 14, 2, 4, "#3a3a2a");
      // her: white bun, pearls, lavender dress; their hands meet
      px(x + 13, y + 1, 4, 2, "#f2f2f2"); px(x + 12, y + 3, 6, 4, "#f0c8a0"); px(x + 12, y + 2, 1, 3, "#e8e8e8"); px(x + 17, y + 2, 1, 3, "#e8e8e8");
      px(x + 13, y + 4, 1, 1, "#111"); px(x + 16, y + 4, 1, 1, "#111"); px(x + 14, y + 6, 2, 1, "#d06a7a");
      px(x + 12, y + 7, 6, 1, "#f2f2f2"); px(x + 11, y + 8, 8, 8, "#b89ad8"); px(x + 12, y + 16, 2, 2, "#f0c8a0"); px(x + 16, y + 16, 2, 2, "#f0c8a0");
      px(x + 9, y + 10, 2, 1, "#f0c8a0");
      px(x + 9, y - 3, 1, 1, "#e0302f"); px(x + 11, y - 3, 1, 1, "#e0302f"); px(x + 9, y - 2, 3, 1, "#e0302f"); px(x + 10, y - 1, 1, 1, "#e0302f"); // a little heart
      break;
    }
    case "lake": { // the Rockies: fire behind the peaks, me getting my head shaved on a summit in a lightning storm
      y = y0 + 70; x = free(y, 26, 22);
      px(x, y + 12, 22, 4, "#6a6f7a"); px(x + 3, y + 10, 16, 2, "#7a808a"); px(x + 2, y + 16, 18, 8, "#575c66");
      // me: seated, grey suit, half my hair gone, hair on the rock
      px(x + 4, y + 2, 4, 3, "#f0c8a0"); px(x + 4, y + 1, 2, 1, "#3a2a1a"); px(x + 4, y + 2, 1, 1, "#3a2a1a");
      px(x + 3, y + 5, 6, 5, "#8a8f99"); px(x + 5, y + 5, 2, 2, "#f2f2f2"); px(x + 5, y + 6, 1, 2, "#e0302f");
      px(x + 3, y + 10, 7, 2, "#8a8f99"); px(x + 9, y + 10, 1, 3, "#6a6f7a");
      px(x + 2, y + 12, 1, 1, "#3a2a1a"); px(x + 7, y + 12, 1, 1, "#3a2a1a"); px(x + 11, y + 11, 1, 1, "#3a2a1a");
      // Jason: behind me with the clippers, green Cummins tee
      px(x + 12, y - 2, 4, 2, "#5a3a1a"); px(x + 12, y, 4, 3, "#f0c8a0"); px(x + 13, y + 1, 1, 1, "#111");
      px(x + 11, y + 3, 6, 6, "#2f8a3a"); px(x + 13, y + 4, 2, 2, "#e0302f"); px(x + 13, y + 4, 1, 1, "#f2f2f2");
      px(x + 9, y + 3, 2, 1, "#f0c8a0"); px(x + 8, y + 2, 2, 1, "#3a3a3a");
      px(x + 12, y + 9, 2, 3, "#3a4a6a"); px(x + 15, y + 9, 2, 3, "#3a4a6a");
      live.push({ k: "bolt", x: x + 8, y: y0 + 34, y1: y - 2 });
      y = y0 + 106; x = free(y, 16, 24);
      px(x, y, 24, 12, "#2f6fb0"); px(x + 2, y + 2, 7, 1, "#7fb6e8"); px(x + 13, y + 6, 6, 1, "#7fb6e8");
      pine(px, x + 2, y + 13); pine(px, x + 20, y + 12);
      live.push({ k: "glint", x, y: y + 1, w: 24, h: 10 });
      break;
    }
    case "denver": { // straight through downtown, under the green walkway
      for (let yy = y0 + 2; yy < y0 + h - 6; yy += 13) {
        const r = room(yy, 11);
        for (let xx = 1; xx + 5 < r.lo - 6; xx += 6) bldg(px, xx, yy, 5, 10 + Math.floor(rnd() * 2), ["#8a8f99", "#7a808a", "#9aa0aa", "#6a8aa8"][Math.floor(rnd() * 4)], "#dfe6ee", rnd);
        for (let xx = Math.ceil(r.hi + 7); xx + 5 <= W - 1; xx += 6) bldg(px, xx, yy, 5, 10 + Math.floor(rnd() * 2), ["#8a8f99", "#7a808a", "#9aa0aa", "#a8705a"][Math.floor(rnd() * 4)], "#dfe6ee", rnd);
      }
      y = y0 + 60; x = free(y, 8, 6);
      px(x, y + 2, 4, 6, "#3a6fd8"); px(x + 1, y, 3, 2, "#3a6fd8"); px(x + 2, y + 1, 1, 1, "#111"); // the big blue bear, peeking
      for (let k = 0; k < 2; k++) live.push({ k: "walk", x0: free(y0 + 30 + k * 30, 8, 12), x1: free(y0 + 30 + k * 30, 8, 12) + 8, y: y0 + 30 + k * 30, shirt: ["#e0302f", "#ffd23f"][k], hat: "#3a2a1a", ph: k * 3 });
      break;
    }
    case "truckstop": {
      y = y0 + 4; x = free(y, 22, 22);
      px(x, y, 22, 3, "#2f8a4a"); px(x, y + 3, 22, 1, "#e0302f"); px(x + 3, y + 4, 1, 8, "#cfcfcf"); px(x + 18, y + 4, 1, 8, "#cfcfcf");
      for (const dx of [7, 13]) { px(x + dx, y + 7, 3, 5, "#e8e8e8"); px(x + dx + 1, y + 8, 1, 1, "#2faa4a"); }
      px(x + 1, y + 14, 9, 5, "#f2f2f2"); px(x + 10, y + 15, 4, 4, "#e0302f"); px(x + 12, y + 16, 2, 2, "#cfe8ff");
      for (const dx of [2, 6, 11]) px(x + dx, y + 19, 2, 2, "#111");
      y = y0 + 32; x = free(y, 22, 18);
      px(x + 1, y + 1, 16, 18, "#c8d8c8"); px(x + 1, y + 1, 16, 1, "#2f6a4a"); px(x + 3, y + 3, 4, 3, "#9ad0e8"); px(x + 11, y + 3, 4, 3, "#9ad0e8");
      px(x + 3, y + 8, 5, 10, "#2a1e16"); px(x + 2, y + 7, 7, 3, "#2a1e16"); px(x + 4, y + 6, 3, 1, "#2a1e16");
      px(x + 4, y + 8, 1, 1, "#e8c890"); px(x + 6, y + 8, 1, 1, "#e8c890"); px(x + 1, y + 10, 1, 6, "#2a1e16"); px(x + 9, y + 10, 1, 6, "#2a1e16");
      person(px, x + 12, y + 10, "#3a4a9a", "#8a5a2a");
      y = y0 + 58; x = free(y - 9, 26, 26);
      px(x + 12, y - 4, 1, 16, "#9a9a9a"); px(x + 7, y - 9, 11, 6, "#e0302f"); px(x + 8, y - 8, 9, 1, "#ffd23f"); px(x + 8, y - 6, 9, 1, "#ffd23f");
      for (let k = 0; k < 3; k++) eCow(px, x + k * 8, y + 6 + (k % 2) * 3);
      break;
    }
    case "silo": {
      y = y0 + 44; x = free(y, 26, 16);
      px(x + 2, y + 2, 5, 22, "#c8ccd2"); px(x + 2, y, 5, 2, "#9aa0a8"); px(x + 3, y - 1, 3, 1, "#9aa0a8");
      px(x + 8, y + 8, 5, 16, "#c8ccd2"); px(x + 8, y + 6, 5, 2, "#9aa0a8");
      y = y0 + 6; x = free(y - 6, 22, 18);
      px(x, y + 6, 18, 9, "#a8603a"); px(x, y + 5, 18, 1, "#e8e2d0"); px(x + 6, y + 2, 6, 3, "#e8e2d0"); px(x + 8, y + 1, 2, 1, "#e8e2d0");
      for (const dx of [2, 5, 12, 15]) px(x + dx, y + 8, 1, 3, "#f2e8b0");
      px(x + 8, y + 10, 2, 5, "#5a3a1a"); px(x + 7, y + 15, 4, 1, "#cfcfcf");
      px(x + 9, y - 6, 1, 7, "#cfcfcf"); px(x + 10, y - 6, 4, 2, "#3a3fa0"); px(x + 10, y - 4, 4, 1, "#e0302f");
      turbine(px, free(y0 + 22, 22, 12) + 6, y0 + 30);
      break;
    }
    case "plains": {
      y = y0 + 4; x = free(y, 24, 14);
      px(x + 6, y, 1, 3, "#f2f2f2"); px(x + 5, y + 1, 3, 1, "#f2f2f2");
      for (let r = 0; r < 6; r++) px(x + 6 - Math.floor(r / 2), y + 3 + r, 1 + 2 * Math.floor(r / 2), 1, "#d8d0c0");
      px(x + 4, y + 9, 5, 6, "#ece6d8"); px(x + 5, y + 10, 3, 2, "#3a6fd8"); px(x + 6, y + 10, 1, 2, "#e0302f");
      for (let r = 0; r < 3; r++) px(x + 6 - 3 - r, y + 15 + r, 7 + 2 * r, 1, "#7a2f1f");
      px(x + 1, y + 18, 11, 7, "#ece6d8"); px(x + 5, y + 21, 3, 4, "#7a2a1f"); px(x + 2, y + 20, 1, 2, "#8ab0d8"); px(x + 10, y + 20, 1, 2, "#8ab0d8");
      y = y0 + 34; x = free(y, 18, 18);
      px(x, y + 8, 18, 9, "#3a3a42"); px(x, y + 7, 18, 1, "#1a1a1a"); px(x + 8, y + 12, 3, 5, "#111");
      px(x + 1, y, 16, 7, "#ffd23f"); word(px, x + 3, y + 1, "XXX", "#e0302f", null);
      px(x + 2, y + 10, 4, 1, "#ff5ad1"); px(x + 13, y + 10, 4, 1, "#ff5ad1");
      x = free(y0 + 56, 26, 18); windmill(px, x + 4, y0 + 58); windmill(px, x + 14, y0 + 66);
      break;
    }
    case "tulsa": {
      y = y0 + 3; x = free(y, 30, 16);
      px(x + 12, y, 1, 28, "#8a8a8a"); px(x + 14, y, 1, 28, "#8a8a8a");
      for (let yy = y; yy < y + 28; yy += 4) px(x + 12, yy, 3, 1, "#8a8a8a");
      px(x + 5, y + 4, 3, 3, "#e8b830"); px(x + 4, y + 3, 5, 1, "#c99a20");
      px(x + 4, y + 7, 5, 9, "#e8b830"); px(x + 9, y + 8, 3, 1, "#e8b830"); px(x + 3, y + 8, 1, 5, "#e8b830");
      px(x + 4, y + 16, 2, 10, "#d8a828"); px(x + 7, y + 16, 2, 10, "#d8a828"); px(x + 2, y + 26, 10, 2, "#9a9a9a");
      y = y0 + 40; x = free(y, 14, 16);
      for (const [r, c] of [[7, "#a8603a"], [5, "#c87a4a"], [3, "#a8603a"], [1, "#d8d0c0"]] as const)
        for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k) * 2) + 1; px(x + 8 - Math.floor(ww / 2), y + 7 + Math.round(k * 0.6), ww, 1, c); }
      person(px, x + 7, y, "#e0302f"); px(x + 11, y + 1, 1, 1, "#f2f2f2"); px(x + 12, y, 1, 1, "#f2f2f2"); px(x + 13, y + 2, 1, 1, "#f2f2f2"); px(x + 3, y + 1, 1, 1, "#f2f2f2");
      y = y0 + 58; x = free(y, 15, 19);
      px(x + 2, y + 3, 14, 8, "#5a3018"); px(x + 3, y + 4, 12, 6, "#1f7a3a");
      for (const [dx, dy] of [[3, 4], [14, 4], [3, 9], [14, 9], [8, 4], [8, 9]]) px(x + dx, y + dy, 1, 1, "#111");
      px(x + 6, y + 6, 1, 1, "#f2f2f2"); px(x + 10, y + 7, 1, 1, "#e0302f"); px(x + 11, y + 5, 1, 1, "#ffd23f"); px(x + 12, y + 7, 1, 1, "#3a6fd8");
      live.push({ k: "dogs", x: x + 1, y: y + 1, w: 16, h: 12 });
      y = y0 + 80; x = free(y, 22, 24);
      px(x, y + 12, 24, 10, "#3a3448"); px(x, y + 11, 24, 1, "#1a1624");
      for (let k = 0; k < 5; k++) px(x + 1 + k * 5, y + 14, 3, 3, k === 3 ? "#d8f05a" : "#1a1624");
      px(x + 2, y, 21, 11, "#1a1624"); word(px, x + 3, y + 1, "TRADE", "#d8f05a", null); word(px, x + 3, y + 6, "WINDS", "#8a7ab8", null);
      px(x + 18, y + 17, 3, 4, "#e8e8f0"); px(x + 18, y + 21, 1, 1, "#e8e8f0"); px(x + 20, y + 21, 1, 1, "#e8e8f0"); px(x + 19, y + 18, 1, 1, "#111");
      px(x + 1, y + 2, 2, 1, "#111"); px(x + 22, y + 13, 2, 1, "#111");
      break;
    }
    case "oregon": { // Muskogee: the old town is a film set; costumed extras, the crew, a journalist on the story
      y = y0 + 6;
      for (const [dx, w, c, f] of [[0, 7, "#8a5a32", "#a06a3a"], [8, 8, "#6a4a2a", "#9a6a3a"]] as const) {
        x = free(y - 1, 18, 16) + dx;
        px(x, y + 4, w, 12, c); px(x, y, w, 4, f); px(x, y - 1, w, 1, "#4a3018");
        px(x + 1, y + 1, w - 2, 2, "#e8d8a0"); px(x + Math.floor(w / 2) - 1, y + 11, 2, 5, "#2a1a0a");
        px(x + 1, y + 6, 2, 2, "#e8d080"); px(x, y + 9, w, 1, "#5a3a1a");
        px(x + w - 1, y + 2, 1, 14, "#c8b890");
      }
      x = free(y + 16, 4, 18);
      px(x, y + 16, 18, 4, "#e0b080");
      y = y0 + 30; x = free(y, 18, 18);
      live.push({ k: "walk", x0: x, x1: x + 15, y, shirt: "#6a2a4a", hat: "#3a2a1a", ph: 0 });
      live.push({ k: "walk", x0: x, x1: x + 15, y: y + 9, shirt: "#e8e0d0", hat: "#f2e8c8", ph: 7 });
      y = y0 + 52; x = free(y, 18, 24);
      px(x + 2, y + 2, 6, 4, "#1a1a1a"); px(x + 8, y + 3, 2, 2, "#3a3a3a"); px(x + 1, y, 3, 3, "#2a2a2a"); px(x + 5, y, 3, 3, "#2a2a2a");
      px(x + 4, y + 6, 1, 6, "#5a5a5a"); px(x + 2, y + 11, 5, 1, "#5a5a5a");
      px(x + 12, y + 1, 4, 3, "#f2f2d0"); px(x + 13, y + 4, 1, 8, "#5a5a5a"); px(x + 11, y + 11, 4, 1, "#5a5a5a");
      px(x + 17, y + 6, 5, 1, "#1a1a1a"); px(x + 17, y + 3, 1, 3, "#1a1a1a"); px(x + 17, y + 3, 5, 2, "#1a1a1a"); px(x + 18, y + 7, 1, 4, "#8a6a42"); px(x + 21, y + 7, 1, 4, "#8a6a42");
      px(x + 18, y + 2, 3, 1, "#f2f2f2");
      person(px, x + 8, y + 12, "#1a1a1a", "#1a1a1a");
      px(x + 13, y + 14, 6, 1, "#5a5a5a"); px(x + 18, y + 13, 2, 3, "#3a3a3a");
      y = y0 + 76; x = free(y, 12, 16);                                                         // the journalist: blazer, mic, notepad
      person(px, x + 2, y, "#c8302f", "#1a1a1a", "#1a1a2a", "#6a4028");
      px(x + 5, y + 3, 2, 1, "#6a4028"); px(x + 7, y + 2, 1, 2, "#3a3a3a"); px(x + 7, y + 1, 1, 1, "#1a1a1a"); px(x + 7, y + 4, 1, 1, "#3a6fd8");
      px(x, y + 4, 2, 2, "#f2f2f2");
      person(px, x + 11, y, "#5a7a9a", "#3a2a1a"); px(x + 9, y + 2, 2, 2, "#1a1a1a");                 // the person she's interviewing
      break;
    }
    case "clinton": { // Little Rock: the glass library over the river, Bill blowing the sax, downtown, dogwoods
      river(px, y0 + 36, 8);
      y = y0 + 26; x = free(y - 12, 22, 16);
      px(x - 1, y, 15, 6, "#a8c4d8"); px(x - 1, y, 15, 1, "#e8f4ff");
      for (let k = 0; k < 15; k += 3) px(x - 1 + k, y + 1, 1, 5, "#6a8aa0");
      px(x + 10, y + 6, 2, 4, "#7a808a");
      px(x - 1, y - 4, 2, 3, "#e0302f"); px(x - 1, y - 6, 1, 2, "#ffd23f"); px(x, y - 6, 1, 2, "#ffd23f");
      live.push({ k: "bill", x, y });
      y = y0 + 52; x = free(y, 24, 18);
      bldg(px, x, y + 6, 5, 18, "#7a808a", "#e8eef4", rnd); bldg(px, x + 6, y, 6, 24, "#6a707a", "#e8eef4", rnd); bldg(px, x + 13, y + 9, 5, 15, "#8a909a", "#e8eef4", rnd);
      break;
    }
    case "casino": {
      y = y0 + 3; x = free(y, 28, 18);
      stars(px, x, y, 18, 6, rnd, 4);
      px(x, y + 14, 18, 14, "#3a2a50"); px(x + 1, y + 15, 16, 1, "#ffd23f");
      for (let k = 0; k < 9; k++) px(x + 1 + Math.floor(rnd() * 16), y + 17 + Math.floor(rnd() * 9), 1, 1, "#ff5ad1");
      { const cx = x + 9, cy = y + 7;
        for (let a = 0; a < 36; a++) { const th = Math.PI * (0.15 + 1.7 * a / 35) + Math.PI / 2; px(cx + Math.round(6 * Math.cos(th)), cy - Math.round(6 * Math.sin(th)), 2, 2, "#e8b830"); }
        for (const [dx, dy] of [[-5, -3], [4, -3], [-6, 1], [5, 1]]) px(cx + dx, cy + dy, 1, 1, "#7a5a1a"); }
      y = y0 + 38; x = free(y - 1, 22, 14);
      px(x + 3, y, 9, 6, "#c8ccd2"); px(x + 4, y - 1, 7, 1, "#9aa0a8"); px(x + 4, y + 2, 7, 1, "#3a6fd8");
      px(x + 4, y + 6, 1, 14, "#9aa0a8"); px(x + 10, y + 6, 1, 14, "#9aa0a8"); px(x + 7, y + 6, 1, 14, "#9aa0a8");
      y = y0 + 66; x = free(y, 22, 22);
      px(x + 1, y + 11, 20, 9, "#f2e8d8"); px(x + 1, y + 10, 20, 1, "#e85a9a");
      for (let k = 0; k < 4; k++) px(x + 2 + k * 5, y + 12, 4, 1, k % 2 ? "#e85a9a" : "#f2f2f2");
      px(x + 3, y + 14, 6, 4, "#cfe8ff"); px(x + 13, y + 14, 3, 6, "#8a5a32");
      { const cx = x + 11, cy = y + 5;
        for (let k = -5; k <= 5; k++) { const ww = Math.round(Math.sqrt(25 - k * k) * 2) + 1; px(cx - Math.floor(ww / 2), cy + Math.round(k * 0.8), ww, 1, k < 1 ? "#ff7ab8" : "#c8823a"); }
        px(cx - 1, cy - 1, 3, 2, "#3a5a32");
        for (const [dx, dy, c] of [[-3, -2, "#ffd23f"], [2, -3, "#5af0ff"], [3, -1, "#f2f2f2"], [-2, -3, "#2faa4a"], [-4, 0, "#3a6fd8"]] as const) px(cx + dx, cy + dy, 1, 1, c); }
      break;
    }
    case "graceland": {
      y = y0 + 4; x = free(y, 10, 16);
      px(x + 2, y + 3, 13, 2, "#f2f2f2"); px(x + 6, y, 2, 9, "#f2f2f2"); px(x + 13, y + 1, 2, 3, "#f2f2f2"); px(x + 4, y + 3, 4, 1, "#3a6fd8");
      y = y0 + 18; x = free(y - 1, 31, 16);
      px(x, y + 4, 16, 9, "#f2f2f2"); px(x + 4, y, 8, 4, "#f2f2f2"); px(x + 4, y - 1, 8, 1, "#8a8a8a");
      for (let k = 0; k < 4; k++) px(x + 5 + 2 * k, y + 5, 1, 8, "#d0d0d0");
      px(x + 7, y + 9, 2, 4, "#5a3a1a");
      { const e = y + 17;
        px(x + 2, e, 3, 2, "#111"); px(x + 4, e - 1, 2, 1, "#111"); px(x + 2, e + 2, 3, 2, "#f0c8a0");
        px(x + 1, e + 4, 5, 6, "#ffffff"); px(x, e + 5, 1, 3, "#ffffff"); px(x + 6, e + 5, 1, 3, "#ffffff");
        px(x + 1, e + 7, 5, 1, "#ffd23f"); px(x + 1, e + 4, 1, 1, "#ffd23f"); px(x + 5, e + 4, 1, 1, "#ffd23f");
        px(x + 1, e + 10, 2, 3, "#ffffff"); px(x + 4, e + 10, 2, 3, "#ffffff");
        px(x + 8, e + 4, 1, 1, "#ffd23f"); px(x + 10, e + 2, 1, 1, "#ffd23f"); px(x + 9, e + 1, 1, 2, "#ffd23f"); }
      river(px, y0 + 92, 10);
      y = y0 + 64; x = free(y, 24, 22);
      for (let r = 0; r < 20; r++) px(x + 11 - r * 0.55, y + r + 4, Math.round(r * 1.1) + 1, 1, r % 4 === 0 ? "#e8eef4" : "#b8c0c8");
      px(x + 11, y + 1, 1, 3, "#cfcfcf");
      break;
    }
    case "nashville": {
      y = y0 + 3; x = free(y, 34, 17);
      stars(px, x, y, 16, 6, rnd, 5);
      bldg(px, x + 1, y + 16, 4, 16, "#3a3f60", "#ffd23f", rnd);
      px(x + 7, y + 4, 6, 28, "#2f3450"); px(x + 7, y, 1, 4, "#2f3450"); px(x + 12, y, 1, 4, "#2f3450");
      for (let yy = y + 6; yy < y + 30; yy += 3) px(x + 8, yy, 4, 1, "#5a6090");
      px(x + 14, y + 26, 2, 6, "#c8702a"); px(x + 14, y + 22, 1, 4, "#5a3a1a");
      y = roomiest(y0 + 40, y0 + 50, 48); x = free(y - 2, 48, 26);
      px(x, y, 26, 32, "#1a1424"); px(x, y - 2, 26, 2, "#3a2a4a");
      for (let f2 = 0; f2 < 4; f2++) {
        const fy = y + 1 + f2 * 8;
        px(x + 1, fy, 24, 6, "#2a1a3a"); px(x, fy + 6, 26, 1, "#5a4a6a");
        live.push({ k: "club", x: x + 1, y: fy, w: 24, h: 2 });
        for (let k = 0; k < 6; k++) px(x + 2 + k * 4, fy + 3, 2, 3, ["#f0c8a0", "#c08a5a", "#8a5a3a"][(k + f2) % 3]);
        for (let k = 0; k < 6; k++) { if ((k + f2) % 2) { px(x + 1 + k * 4, fy + 2, 4, 1, "#c8a060"); px(x + 2 + k * 4, fy + 1, 2, 1, "#c8a060"); } else px(x + 2 + k * 4, fy + 2, 2, 1, ["#ffd23f", "#1a1a1a", "#f2f2f2"][(k + f2) % 3]); }
      }
      px(x + 11, y + 26, 4, 7, "#ffd23f");
      for (let k = 0; k < 4; k++) cowboy(px, x + 2 + k * 6, y + 35, ["#e0302f", "#3a6fd8", "#f2f2f2", "#ff5ad1"][k], ["#c8a060", "#1a1a1a", "#f2f2f2", "#c8a060"][k]);
      live.push({ k: "walk", x0: x + 1, x1: x + 22, y: y + 46, shirt: "#e0302f", hat: "#c8a060", ph: 0, brim: true });
      live.push({ k: "walk", x0: x + 1, x1: x + 22, y: y + 46, shirt: "#3a6fd8", hat: "#f2f2f2", ph: 9, brim: true, skin: "#8a5a3a" });
      y = y0 + 98; x = free(y, 24, 18);
      px(x + 8, y + 12, 2, 6, "#7a7a7a");
      px(x + 3, y, 12, 12, "#ffd23f"); px(x + 2, y + 1, 1, 10, "#ffd23f"); px(x + 15, y + 1, 1, 10, "#ffd23f");
      px(x + 5, y + 2, 8, 8, "#8a5a2a"); px(x + 5, y + 1, 2, 1, "#8a5a2a"); px(x + 11, y + 1, 2, 1, "#8a5a2a");
      px(x + 7, y + 4, 1, 1, "#000"); px(x + 10, y + 4, 1, 1, "#000"); px(x + 8, y + 7, 2, 2, "#f2f2f2");
      px(x, y + 18, 18, 5, "#c8ccd2"); px(x + 2, y + 19, 3, 2, "#e0302f");
      break;
    }
    case "gatlinburg": {
      for (let k = 0; k < 20; k++) { const xx = Math.floor(rnd() * W), yy = y0 + 2 + Math.floor(rnd() * 6); if (Math.abs(xx - roadX(yy)) > 7) px(xx, yy, 2, 1, "#a9c4b8"); }
      y = y0 + 6; x = free(y, 36, 16);
      px(x + 10, y, 1, 4, "#cfcfcf"); px(x + 7, y + 4, 7, 3, "#e8e8e8"); px(x + 8, y + 7, 5, 1, "#9a9a9a"); px(x + 9, y + 8, 3, 26, "#d8d8d8");
      px(x + 3, y + 14, 1, 20, "#7a7a7a");
      px(x, y + 10, 7, 2, "#d8903e"); px(x + 1, y + 8, 5, 2, "#e8a850"); px(x, y + 6, 7, 2, "#d8903e");
      px(x + 1, y + 5, 5, 1, "#7a3a1a"); px(x + 2, y + 4, 3, 1, "#fff0a0"); px(x, y + 6, 1, 3, "#7a3a1a"); px(x + 6, y + 6, 1, 4, "#7a3a1a");
      y = y0 + 46; x = free(y, 18, 21);
      px(x + 2, y + 4, 9, 11, "#d8c8a8"); px(x + 4, y + 2, 5, 2, "#d8c8a8"); px(x + 5, y, 3, 2, "#8a5a32"); px(x + 8, y + 3, 3, 4, "#d8c8a8");
      px(x + 2, y + 8, 9, 4, "#f2ead8"); word(px, x + 2, y + 8, "XXX", "#1a1a1a", null);
      px(x + 14, y + 4, 3, 2, "#6a4a2a"); px(x + 17, y + 5, 3, 1, "#3a2a1a"); px(x + 13, y + 6, 1, 1, "#3a2a1a");
      person(px, x + 14, y + 5, "#5a7a3a", "#6a4a2a", "#3a5a8a");
      px(x + 13, y + 9, 1, 2, "#f0c8a0"); px(x + 12, y + 8, 1, 2, "#e8e8e8");
      y = y0 + 68; x = free(y - 2, 16, 20);
      px(x, y + 10, 20, 4, "#2faa4a"); px(x + 17, y + 11, 1, 1, "#111"); px(x + 17, y + 8, 1, 3, "#f2f2f2"); px(x + 18, y + 8, 2, 1, "#e0302f");
      px(x + 4, y + 2, 7, 6, "#3a9a4a"); px(x + 9, y - 2, 5, 4, "#3a9a4a"); px(x + 12, y, 2, 1, "#f2f2f2"); px(x + 11, y - 1, 1, 1, "#111");
      px(x + 1, y + 4, 4, 2, "#3a9a4a"); px(x, y + 5, 2, 1, "#3a9a4a"); px(x + 5, y + 8, 2, 2, "#3a9a4a"); px(x + 9, y + 8, 2, 2, "#3a9a4a"); px(x + 11, y + 4, 2, 1, "#3a9a4a");
      y = y0 + 86; x = free(y - 3, 15, 15) + 1;
      px(x + 1, y + 6, 6, 6, "#8a8f99"); px(x + 2, y + 7, 1, 4, "#6a6f79"); px(x + 4, y + 7, 1, 4, "#6a6f79");
      px(x, y, 8, 6, "#1a1a1a"); px(x + 3, y - 1, 2, 1, "#3a3a3a"); px(x - 1, y + 1, 1, 4, "#1a1a1a"); px(x + 8, y + 1, 1, 4, "#1a1a1a");
      px(x + 9, y + 11, 3, 1, "#9aa0a8"); px(x + 10, y - 3, 1, 1, "#f2f2f2"); px(x + 12, y + 1, 2, 1, "#ffd23f");
      break;
    }
    case "smoky":
      for (const yy of [y0 + 6, y0 + h - 14]) { const xx = free(yy, 10, 14); pine(px, xx + 3, yy, "#12302a"); pine(px, xx + 9, yy + 2, "#12302a"); }
      break;
    case "waffle": {
      y = roomiest(y0 + 2, y0 + 8, 22); x = free(y - 1, 23, 26) + 1;
      px(x + 12, y + 16, 1, 6, "#7a7a7a");
      px(x, y, 25, 16, "#111");
      word(px, x + 2, y + 2, "WAFFLE"); word(px, x + 4, y + 9, "HOUSE");
      y = y0 + 28; x = free(y, 13, 16);
      px(x, y, 16, 1, "#4a3a2a"); px(x, y + 1, 16, 2, "#ffd23f");
      px(x + 1, y + 3, 14, 9, "#d8c8a0"); px(x + 1, y + 11, 14, 1, "#8a6a4a");
      for (let k = 2; k < 13; k += 4) px(x + k, y + 5, 3, 3, "#ffe9a0");
      px(x + 12, y + 6, 2, 6, "#5a3a1a");
      y = y0 + 52; x = free(y, 24, 22);
      px(x, y, 22, 2, "#3a3a3e"); px(x, y + 2, 22, 1, "#ffd23f");
      for (let k = 0; k < 4; k++) { px(x + 1 + k * 6, y + 4, 2, 8, "#e8e8e8"); px(x + 1 + k * 6, y + 6, 2, 1, "#ffd23f"); px(x + 3 + k * 6, y + 8, 1, 3, "#1a1a1a"); }
      px(x, y + 13, 22, 10, "#4a4a4e"); for (let k = 0; k < 4; k++) px(x + k * 6, y + 13, 1, 10, "#e8e8e8");
      px(x + 1, y + 15, 4, 7, "#3f5a3a"); px(x + 2, y + 16, 2, 2, "#1a2a3a"); px(x + 1, y + 21, 1, 1, "#fff6c0"); px(x + 4, y + 21, 1, 1, "#fff6c0");
      px(x + 7, y + 15, 4, 7, "#e8e8e8"); px(x + 8, y + 16, 2, 2, "#1a2a3a"); px(x + 7, y + 21, 1, 1, "#fff6c0"); px(x + 10, y + 21, 1, 1, "#fff6c0");
      break;
    }
    case "tunnel": { // through the mountain, then out on a cliff over the lakes
      y = y0 + 52;
      const LAKES = [[9, 14, 10, 8], [54, 22, 11, 10], [14, 38, 12, 7], [52, 42, 9, 5]];
      for (let x2 = 0; x2 < W; x2++) if (Math.abs(x2 - roadX(y)) > 6) { px(x2, y, 1, 2, "#8a8278"); if (x2 % 3 === 0) px(x2, y - 2, 1, 2, "#5a5048"); }
      for (let yy = y + 2; yy < y0 + h; yy++) for (let x2 = 0; x2 < W; x2++) {
        const r = roadX(yy); if (Math.abs(x2 - r) < 7) continue;
        const v = Math.max(...LAKES.map(([cx, cy, rx, ry]) => 1 - ((x2 - cx) / rx) ** 2 - ((yy - y - cy) / ry) ** 2));
        px(x2, yy, 1, 1, v > 0.25 ? (v > 0.8 && (x2 + yy) % 3 === 0 ? "#4ab8e0" : "#2f9ac8") : v > 0 ? "#d8e8c8" : (yy - y < 4 ? "#7a7068" : (x2 * 3 + yy) % 7 === 0 ? "#2f7a32" : "#3f8a3a"));
      }
      for (const [cx, cy] of [[9, 14], [55, 21]]) { const ix = cx, iy = y + cy; px(ix - 2, iy, 5, 2, "#3f8a3a"); pine(px, ix, iy - 5, "#1f5a2a"); }
      live.push({ k: "glint", x: 0, y: y + 4, w: W, h: h - 58 });
      break;
    }
    case "antique": { // the dam, then the farm antique store flying three flags
      y = y0 + 4; x = free(y, 28, 26);
      px(x, y, 26, 11, "#2f6fb0"); px(x + 2, y + 3, 8, 1, "#5f9fe0"); px(x + 14, y + 7, 7, 1, "#5f9fe0");
      px(x - 1, y + 11, 28, 4, "#c8c4b8"); px(x - 1, y + 11, 28, 1, "#e8e4d8");
      for (let k = 2; k < 26; k += 5) px(x + k, y + 12, 1, 3, "#9a968a");
      px(x + 10, y + 15, 6, 11, "#8ac8f0");
      live.push({ k: "falls", x: x + 10, y: y + 15, w: 6, h: 11 });
      px(x + 7, y + 26, 12, 2, "#e8f8ff");
      y = y0 + 40; x = free(y + 2, 40, 26);
      px(x, y + 8, 18, 12, "#a8302a"); for (let r = 0; r < 5; r++) px(x + 4 - r, y + 3 + r, 10 + 2 * r, 1, "#5a2a1a");
      px(x + 6, y + 13, 6, 7, "#3a1a14"); px(x + 7, y + 13, 1, 7, "#f2f2f2"); px(x + 10, y + 13, 1, 7, "#f2f2f2"); px(x + 2, y + 10, 3, 3, "#f2e8b0");
      px(x + 1, y + 21, 3, 3, "#8a6a42"); px(x + 2, y + 22, 1, 1, "#3a2a1a");                    // a wagon wheel, an old tractor, a rusty sign
      px(x + 6, y + 21, 6, 3, "#c84a2a"); px(x + 6, y + 24, 2, 2, "#1a1a1a"); px(x + 10, y + 23, 3, 3, "#1a1a1a"); px(x + 9, y + 19, 1, 2, "#5a5a5a");
      px(x + 14, y + 21, 4, 3, "#c8a030"); px(x + 15, y + 22, 2, 1, "#8a3a1a");
      for (let k = 0; k < 3; k++) {
        const fx = x + k * 9, fy = y + 28;
        px(fx, fy, 1, 12, "#cfcfcf");
        live.push({ k: "flag", x: fx + 1, y: fy, w: 7, h: 5, kind: (["dixie", "ferrari", "weed"] as const)[k] });
      }
      break;
    }
    case "fair": { // the state fair after dark: a mountain string band, and the animals watching from the dark
      y = roomiest(y0 + 5, y0 + 12, 22); x = free(y - 3, 22, 26);
      px(x, y + 12, 26, 4, "#d8b048"); px(x, y + 12, 26, 1, "#e8c858"); px(x, y + 16, 26, 2, "#a8803a");    // hay-bale stage
      for (let k = 0; k < 8; k++) px(x + 1 + k * 3, y - 2, 1, 1, ["#ffd23f", "#ff8a1f", "#fff6c0"][k % 3]);  // string lights
      px(x, y - 3, 26, 1, "#3a3a3a");
      // banjo, fiddle, washtub bass, washboard: overalls all round
      const band: [string, number][] = [["#3a5a9a", 0], ["#3a5a9a", 7], ["#3a5a9a", 13], ["#3a5a9a", 20]];
      band.forEach(([c, dx], k) => {
        px(x + dx + 1, y + 2, 3, 1, ["#6a4a2a", "#1a1a1a", "#c8a060", "#5a3a1a"][k]); px(x + dx + 1, y + 3, 3, 2, "#e0b090");
        px(x + dx + 1, y + 5, 3, 5, c); px(x + dx + 1, y + 5, 3, 1, "#e0302f"); px(x + dx + 1, y + 10, 1, 2, "#2a2a3a"); px(x + dx + 3, y + 10, 1, 2, "#2a2a3a");
      });
      px(x + 3, y + 6, 3, 3, "#e8e2d0"); px(x + 6, y + 5, 2, 1, "#6a4a2a");                       // banjo
      px(x + 10, y + 3, 2, 1, "#8a4a1a"); px(x + 11, y + 2, 1, 1, "#d8d8d8");                    // fiddle
      px(x + 16, y + 8, 4, 4, "#9aa0a8"); px(x + 17, y + 2, 1, 6, "#8a6a42");                     // washtub bass
      px(x + 23, y + 5, 2, 4, "#c8ccd2");                                                         // washboard
      y = y0 + 40; x = free(y, 16, 20);
      px(x + 1, y, 14, 2, "#f2f2f2"); px(x, y + 2, 16, 1, "#d8d8d8"); px(x + 1, y + 3, 1, 7, "#9a9a9a"); px(x + 14, y + 3, 1, 7, "#9a9a9a");
      px(x + 3, y + 7, 10, 1, "#8a6a42"); px(x + 5, y + 6, 2, 1, "#e0302f"); person(px, x + 7, y + 2, "#3a6a9a");
      // possum, raccoon, owl, crow, black cat, coyote: eyes that catch the light
      const eyes: [number, number, string][] = [];
      for (let k = 0; k < 8; k++) {
        const yy = y0 + 4 + Math.floor((k * (h - 10)) / 8), side = k % 2, r = room(yy, 4);
        const xx = side ? Math.min(W - 6, Math.round(r.hi + 8 + (k % 3) * 3)) : Math.max(1, Math.round(r.lo - 12 - (k % 3) * 3));
        if ((side && xx > r.hi + 6) || (!side && xx + 4 < r.lo - 6)) {
          const kind = k % 6;
          if (kind === 0) { px(xx, yy + 1, 4, 2, "#b8b8b8"); px(xx + 4, yy + 2, 2, 1, "#f2a8b8"); px(xx - 1, yy + 1, 1, 1, "#f2f2f2"); } // possum
          if (kind === 1) { px(xx, yy + 1, 4, 2, "#5a5a5a"); px(xx, yy + 1, 4, 1, "#1a1a1a"); px(xx + 4, yy + 2, 2, 1, "#3a3a3a"); }          // raccoon
          if (kind === 2) { px(xx + 1, yy + 3, 1, 4, "#5a3a1a"); px(xx, yy, 3, 3, "#6a5a4a"); }                                         // owl on a post
          if (kind === 3) { px(xx, yy + 1, 3, 2, "#111"); px(xx + 3, yy + 1, 1, 1, "#3a3a3a"); }                                       // crow
          if (kind === 4) { px(xx, yy + 1, 3, 3, "#111"); px(xx, yy, 1, 1, "#111"); px(xx + 2, yy, 1, 1, "#111"); px(xx + 3, yy + 3, 2, 1, "#111"); } // black cat
          if (kind === 5) { px(xx, yy + 1, 5, 2, "#8a7a5a"); px(xx, yy, 1, 1, "#8a7a5a"); px(xx + 2, yy + 3, 1, 1, "#8a7a5a"); }         // coyote
          eyes.push([xx, yy + (kind === 2 ? 1 : kind === 4 ? 1 : 1), kind === 2 ? "#ffd23f" : kind === 4 ? "#7aff5a" : "#ff5a3a"]);
        }
      }
      live.push({ k: "eyes", pts: eyes });
      break;
    }
    case "dish": { // the Green Bank Telescope (rendered, badly out of place), an alien behind a tree
      y = y0 + 4; x = free(y, 46, 30);
      live.push({ k: "hd", x, y, w: 30, h: 46 });
      y = y0 + 60; x = free(y - 6, 24, 14);
      px(x + 1, y - 6, 12, 8, "#2f7a2a"); px(x, y - 4, 14, 5, "#2f7a2a"); px(x + 3, y - 5, 4, 1, "#5aa84a"); px(x + 2, y + 2, 10, 2, "#2a6a26");
      live.push({ k: "peek", x: x + 7, y: y + 4 });
      break;
    }
    case "sunset":
      break;
    case "mcd": { // the drive-thru, where the first interview after the news happened
      const m = (DRIVE.a + DRIVE.b) / 2;
      y = Math.round(m - 14);
      let lo = 99, hi = 0; for (let k = -18; k < 30; k++) { lo = Math.min(lo, vanX(y + k)); hi = Math.max(hi, vanX(y + k)); }
      x = Math.round(DRIVE.dir > 0 ? hi + 5 : lo - 5 - 14);
      px(x, y, 14, 26, "#c8302a"); px(x, y, 14, 3, "#ffd23f"); px(x + 2, y + 6, 10, 6, "#f2e8b0");
      px(DRIVE.dir > 0 ? x : x + 13, y + 14, 1, 4, "#cfe8ff");                                    // the window
      px(x + 2, y + 18, 4, 6, "#cfe8ff"); px(x + 8, y + 18, 4, 6, "#cfe8ff");
      { const ax = Math.round(DRIVE.dir > 0 ? x + 3 : x + 1), ay = y - 16;                         // golden arches on a pole
        px(ax + 4, ay + 10, 1, 6, "#9a9a9a");
        for (const ox of [0, 5]) { px(ax + ox, ay + 2, 1, 8, "#ffc72c"); px(ax + ox + 4, ay + 2, 1, 8, "#ffc72c"); px(ax + ox + 1, ay, 3, 1, "#ffc72c"); px(ax + ox + 1, ay + 1, 1, 1, "#ffc72c"); px(ax + ox + 3, ay + 1, 1, 1, "#ffc72c"); } }
      px(DRIVE.dir > 0 ? x + 15 : x - 4, y + 2, 3, 5, "#1a1a1a"); px(DRIVE.dir > 0 ? x + 15 : x - 4, y + 3, 3, 1, "#ffd23f");   // menu board
      person(px, DRIVE.dir > 0 ? x - 1 : x + 12, y + 18, "#e0302f", "#3a2a1a", "#2a2a3a", "#c08a5a"); // our interviewee, out by the lane
      break;
    }
    case "dc": { // out of the forest into D.C.: the Capitol, the Monument, scooters everywhere, the Beast going by
      y = y0 + 48; x = free(y, 14, 12);
      px(x + 1, y + 6, 9, 4, "#f2f2f2"); px(x + 3, y + 3, 5, 3, "#f2f2f2"); px(x + 4, y + 1, 3, 2, "#f2f2f2"); px(x + 5, y, 1, 1, "#f2f2f2");
      for (let k = 2; k < 10; k += 2) px(x + k, y + 7, 1, 3, "#c8c8c8");
      y = y0 + 64; x = free(y, 34, 12);
      px(x + 4, y, 3, 28, "#f2f2f2"); px(x + 5, y - 2, 1, 2, "#f2f2f2"); px(x + 4, y + 28, 3, 1, "#c8c8c8");
      px(x, y + 30, 12, 3, "#2f6fb0"); px(x + 4, y + 31, 3, 1, "#9ac8f0");
      live.push({ k: "scoot", a: y0 + 40, b: y0 + h - 2 });
      live.push({ k: "beast", a: y0 + 8, b: y0 + h - 2 });
      break;
    }
    case "jersey": { // Paterson's Great Falls, as big as we can make them, then the food market
      y = roomiest(y0 + 2, y0 + 8, 46); x = free(y, 46, 26);
      px(x, y, 26, 6, "#3a7ac0");                                                               // the Passaic, sliding up to the edge
      for (let k = 0; k < 5; k++) px(x + 2 + k * 5, y + 1 + (k % 3), 3, 1, "#7ab8e8");
      for (let yy = y + 6; yy < y + 34; yy++) {                                                  // jagged basalt walls of the gorge
        const wl = 3 + Math.round(2 * Math.sin(yy * 0.7) + hash(yy) * 2), wr = 3 + Math.round(2 * Math.cos(yy * 0.5) + hash(yy + 99) * 2);
        px(x, yy, wl, 1, "#2a2824"); px(x + 26 - wr, yy, wr, 1, "#2a2824");
        if (yy % 3 === 0) { px(x + 1, yy, 1, 1, "#4a4640"); px(x + 24, yy, 1, 1, "#4a4640"); }
        px(x + wl, yy, 26 - wl - wr, 1, "#5aa0d8");
      }
      px(x + 1, y + 5, 24, 2, "#1f1d1a"); px(x + 3, y + 5, 20, 1, "#e8f6ff");                      // the lip, white where it pours over
      live.push({ k: "falls", x: x + 5, y: y + 7, w: 16, h: 25 });
      px(x, y + 34, 26, 8, "#2f6fb0"); px(x + 3, y + 34, 20, 2, "#f2fbff"); px(x + 1, y + 37, 8, 1, "#9ad0f0"); px(x + 15, y + 39, 9, 1, "#9ad0f0");
      for (let k = 0; k < 6; k++) for (let a2 = 0; a2 < 20; a2++) {                             // a rainbow across the spray
        const th = Math.PI * (0.1 + 0.8 * a2 / 19), cx = x + 13, cy = y + 34;
        px(cx + Math.round((12 - k) * Math.cos(th)), cy - Math.round((10 - k) * Math.sin(th)), 1, 1, PRIDE[k]);
      }
      y = y0 + 64; x = free(y, 30, 24);
      for (let k = 0; k < 3; k++) {
        const sx2 = x + k * 8, c = ["#e0302f", "#2faa4a", "#3a6fd8"][k];
        for (let s2 = 0; s2 < 7; s2++) px(sx2 + s2, y, 1, 3, s2 % 2 ? c : "#f2f2f2");
        px(sx2, y + 3, 1, 6, "#8a6a42"); px(sx2 + 6, y + 3, 1, 6, "#8a6a42"); px(sx2, y + 7, 7, 2, "#a8743e");
        for (let s2 = 0; s2 < 3; s2++) px(sx2 + 1 + s2 * 2, y + 6, 1, 1, ["#ff8a1f", "#e0302f", "#ffd23f", "#2faa4a", "#b04ad8"][(k + s2) % 5]);
      }
      for (let k = 0; k < 4; k++) person(px, x + 1 + k * 6, y + 12 + (k % 2) * 3, ["#ffd23f", "#e0302f", "#f2f2f2", "#b04ad8"][k], ["#1a1a1a", "#5a3a1a", "#e8e8e8", "#1a1a1a"][k]);
      break;
    }
    case "clouds":
      live.push({ k: "clouds", y: y0, h });
      break;
    case "harbor": {
      const [lx, ly] = HARBOR.liberty, sx = lx + HDX, sy = Y0[HB] + ly;
      px(sx - 1, sy, 3, 2, "#7a6a5a"); px(sx, sy - 6, 1, 6, "#5fae96"); px(sx + 1, sy - 8, 1, 3, "#5fae96"); px(sx + 1, sy - 9, 1, 1, "#ffd23f");
      live.push({ k: "ferry", x0: HARBOR.george[0] + HDX + 2, y0: Y0[HB] + HARBOR.george[1], x1: HARBOR.battery[0] + HDX - 1, y1: Y0[HB] + HARBOR.battery[1] + 2 });
      break;
    }
  }
}
