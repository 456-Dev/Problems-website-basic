// The last stretch: under a storm through New Jersey, then north-up over the harbor (the original
// design): down through Jersey City and Bayonne, over the Bayonne Bridge, across Staten Island to the Verrazzano.
import { W, ROAD_END, roadX, hash } from "../core";
import { HARBOR } from "../../harbor";
import type { SceneMod, Px } from "../kit";
import type { Live } from "../fx";
import { pine, person, flagPole, pick, eTree, eHouse } from "../kit";

/* ---------- the harbor map ---------- */

const HH = HARBOR.h;
const M = (x: number, y: number) => HARBOR.rows[Math.floor(y)]?.[Math.floor(x)] ?? ".";
const land = (x: number, y: number) => M(x, y) !== ".";
const hr = (x: number, y: number, k = 0) => hash(x * 7919 + y * 104729 + k * 31337);
const near = (x: number, y: number, [cx, cy]: [number, number], rx: number, ry = rx) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;

// distance from land, for shallow → deep water
let DEPTH: number[][] | null = null;
function depth() {
  if (DEPTH) return DEPTH;
  const d = Array.from({ length: HH }, (_, y) => Array.from({ length: W }, (_, x): number => (land(x, y) ? 0 : 99)));
  for (let pass = 0; pass < 8; pass++) for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) if (d[y][x]) {
    const n = Math.min(d[y - 1]?.[x] ?? 99, d[y + 1]?.[x] ?? 99, d[y][x - 1] ?? 99, d[y][x + 1] ?? 99) + 1;
    if (n < d[y][x]) d[y][x] = n;
  }
  return (DEPTH = d);
}
const inQuad = (x: number, y: number, q: [number, number][]) => {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) { const [xi, yi] = q[i], [xj, yj] = q[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
};
const WATER = ["#5aa8dc", "#4796d0", "#3a86c4", "#3078b8", "#2a6aac", "#25609f"];

// zones on Staten Island (rows/cols in harbor space)
const FRESHKILLS = HARBOR.freshkills, GREENBELT = HARBOR.greenbelt;
const GOV = HARBOR.gov;
const isGov = (x: number, y: number) => M(x, y) === "m" && near(x, y, GOV, 3, 3);
const roadAt = (x: number, yy: number, pad = 7) => yy < ROAD_END + 3 && Math.abs(x - roadX(yy)) < pad;

const ROOF = ["#b8503a", "#8a8f99", "#a8683a", "#6a6a72", "#c8c4bc", "#7a4a3a"];
const BROWN = ["#8a4a3a", "#9a5a44", "#7a4434", "#a86a50", "#6a3a2e"];

function harborGround(px: Px, y0: number) {
  const D = depth();
  for (let y = 0; y < HH; y++) for (let x = 0; x < W; x++) {
    const c = M(x, y), X = x, Y = y0 + y, r = hr(x, y);
    if (c === ".") {
      const d = D[y][x];
      px(X, Y, 1, 1, WATER[Math.min(5, d - 1)]);
      if (d > 1 && r < 0.035) px(X, Y, 2, 1, "#7ec0ec");                    // little wave ticks
      continue;
    }
    if (c === "s") {                                                       // Staten Island
      if (near(x, y, FRESHKILLS, 10, 11)) {                                // Freshkills: grassy mounds over the old landfill
        const m = Math.sin(x * 0.7) * Math.cos(y * 0.55);
        px(X, Y, 1, 1, m > 0.35 ? "#b8d870" : m > -0.2 ? "#9ac85a" : "#7aa84a");
        if (r < 0.02) px(X, Y, 1, 1, "#e8e8e0");                           // a methane vent
        continue;
      }
      if (near(x, y, GREENBELT, 9, 10)) { px(X, Y, 1, 1, r < 0.5 ? "#2f6a32" : r < 0.8 ? "#285c2c" : "#3f8a3a"); continue; }
      const street = y % 5 === 0 || (x + Math.floor(y / 5)) % 6 === 0;
      if (street) { px(X, Y, 1, 1, "#b4b4ac"); continue; }
      px(X, Y, 1, 1, r < 0.18 ? "#4f9a3a" : "#6aa84a");                     // lawns, and a house on most lots
      if ((x + y) % 2 === 0 && r > 0.3) px(X, Y, 1, 1, ROOF[Math.floor(r * 60) % ROOF.length]);
      continue;
    }
    if (c === "j") {                                                       // New Jersey: refineries, the port, Bayonne
      const port = near(x, y, HARBOR.portliz, 11, 9), tanks = near(x, y, HARBOR.linden, 11, 13);
      if (port) {                                                          // container stacks
        if (y % 3 === 2 || x % 9 === 0) { px(X, Y, 1, 1, "#7a7a78"); continue; }
        px(X, Y, 1, 1, ["#b8402f", "#2f6fb0", "#c8a030", "#3a7a5a", "#c8c8c0", "#8a5a3a"][Math.floor(hr(Math.floor(x / 3), Math.floor(y / 3), 3) * 6)]);
        continue;
      }
      if (tanks) { px(X, Y, 1, 1, "#8a8a80"); continue; }
      if (near(x, y, HARBOR.liberty, 8, 8)) { px(X, Y, 1, 1, r < 0.3 ? "#3f8a3a" : "#5aa04a"); continue; }   // Liberty State Park
      const blk = hr(Math.floor((x + (Math.floor(y / 3) % 2) * 2) / 4), Math.floor(y / 3), 8), st = y % 3 === 0 && x % 11 !== 0 ? false : y % 3 === 0 || x % 11 === 0;
      px(X, Y, 1, 1, st ? "#94968e" : blk < 0.12 ? "#6f9058" : blk < 0.55 ? "#a2a49a" : blk < 0.85 ? "#acaca2" : "#9a9c92");
      if (!st && blk >= 0.12 && r < 0.1) px(X, Y, 1, 1, r < 0.04 ? "#c8c8c0" : "#7e8078");
      continue;
    }
    if (c === "b") {                                                       // Brooklyn: brownstone blocks, street trees
      const st = y % 4 === 0 || x % 6 === 0;
      if (st) { px(X, Y, 1, 1, r < 0.25 ? "#3f8a3a" : "#8a8680"); continue; }
      px(X, Y, 1, 1, BROWN[Math.floor(r * 50) % BROWN.length]);
      if (r > 0.9) px(X, Y, 1, 1, "#d8d0c4");
      continue;
    }
    if (isGov(x, y)) { px(X, Y, 1, 1, r < 0.3 ? "#3f8a3a" : "#5aa04a"); continue; }   // Governors Island
    if (inQuad(x, y, HARBOR.cp)) { px(X, Y, 1, 1, r < 0.12 ? "#2a6a2c" : r < 0.2 ? "#5a9ad0" : "#3f8a3a"); continue; }   // Central Park
    px(X, Y, 1, 1, (y % 3 === 0 || x % 4 === 0) ? "#5a5a62" : "#7a7a84");             // Manhattan streets under the towers
  }
  // Linden's tank farm: white tanks
  const [lx, ly] = HARBOR.linden;
  for (let k = 0; k < 22; k++) {
    const x = lx - 9 + Math.floor(hr(k, 1, 5) * 18), y = ly - 10 + Math.floor(hr(k, 2, 5) * 20);
    if (M(x, y) !== "j" || M(x + 2, y + 2) !== "j") continue;
    px(x, y0 + y, 3, 3, "#e8e8e4"); px(x, y0 + y, 3, 1, "#ffffff"); px(x + 2, y0 + y + 1, 1, 2, "#b8b8b0");
  }
}

/* ---------- landmarks, back to front ---------- */

type Item = { y: number; draw: (px: Px) => void };

function shadeHex(c: string, d: number) {
  return "#" + [1, 3, 5].map((i) => Math.min(255, Math.max(0, parseInt(c.slice(i, i + 2), 16) + d)).toString(16).padStart(2, "0")).join("");
}
// a Manhattan tower: base at (x, y), rising h; face colour c; kind 0 = windows, 1 = glass mullions, 2 = banded masonry
function tower(px: Px, x: number, y: number, w: number, h: number, c: string, kind: number) {
  const dark = shadeHex(c, -34), lite = shadeHex(c, 30);
  px(x, y - h, w, h, c); px(x + w - 1, y - h, 1, h, dark); px(x, y - h, w, 1, lite);
  if (kind === 0) for (let r = y - h + 2; r < y - 1; r += 2) for (let k = 0; k < w - 1; k++) { if (hash(x * 31 + r * 7 + k) > 0.3) px(x + k, r, 1, 1, lite); }
  else if (kind === 1) for (let k = 0; k < w - 1; k += 2) px(x + k, y - h + 1, 1, h - 1, lite);
  else for (let r = y - h + 2; r < y; r += 3) px(x, r, w - 1, 1, dark);
  if (kind === 2 && h < 12) { px(x + 1, y - h - 2, 1, 2, "#7a4a2a"); px(x, y - h - 2, 3, 1, "#8a5a3a"); }   // a wooden water tower
}
function oneWTC(px: Px, x: number, y: number) {
  const h = 36;
  for (let r = 0; r < h; r++) {
    const u = r / h, w = Math.max(2, Math.round(5 - 3 * u));               // tapers to the top
    const xx = x + Math.round((5 - w) / 2);
    px(xx, y - r, w, 1, r % 2 ? "#9ab8d8" : "#b8d0e8");
    px(xx + w - 1, y - r, 1, 1, "#6a88a8");
    if ((r + Math.floor(u * 5)) % 7 === 0) px(xx, y - r, 1, 1, "#e8f4ff");
  }
  px(x + 2, y - h - 9, 1, 9, "#e8eef4"); px(x + 2, y - h - 10, 1, 1, "#ffffff");
}
function empire(px: Px, x: number, y: number) {
  const C = "#c8bca0", D = "#9a8e78";
  const tiers: [number, number][] = [[7, 14], [5, 12], [3, 9], [1, 5]];
  let r0 = y;
  for (const [w, h] of tiers) {
    const xx = x + Math.floor((7 - w) / 2);
    px(xx, r0 - h, w, h, C); px(xx + w - 1, r0 - h, 1, h, D);
    for (let k = 1; k < w - 1; k += 2) px(xx + k, r0 - h + 1, 1, h - 1, "#e0d8c0");
    r0 -= h;
  }
  px(x + 3, r0 - 7, 1, 7, "#d8d8d8"); px(x + 3, r0 - 8, 1, 1, "#ff3b3b");
}
function chrysler(px: Px, x: number, y: number) {
  px(x, y - 26, 5, 26, "#b8b4ac"); px(x + 4, y - 26, 1, 26, "#8a8680");
  for (let r = y - 24; r < y; r += 2) px(x + 1, r, 3, 1, "#d8d4cc");
  for (let k = 0; k < 4; k++) { const w = 5 - k; px(x + Math.floor(k / 2), y - 27 - k * 2, w, 2, "#e8eef4"); px(x + 2, y - 27 - k * 2, 1, 1, "#1a1a2a"); }   // the sunburst crown
  px(x + 2, y - 39, 1, 5, "#f2f6fa");
}

// the Brooklyn Bridge, side on: two gothic stone towers, the cables swooping between
function brooklynBridge(px: Px, x0: number, x1: number, y: number) {
  const t1 = x0 + Math.round((x1 - x0) * 0.28), t2 = x0 + Math.round((x1 - x0) * 0.72), th = 9;
  const cable = (xa: number, ya: number, xb: number, yb: number, sag: number) => {
    for (let x = xa; x <= xb; x++) {
      const u = (x - xa) / Math.max(1, xb - xa), cy = Math.round(ya + (yb - ya) * u + sag * 4 * u * (1 - u));
      px(x, cy, 1, 1, "#d8d8d0");
      if (x % 2 === 0 && cy < y - 1) px(x, cy + 1, 1, y - cy - 1, "#a8a8a0");
    }
  };
  cable(x0, y - 1, t1, y - th, 0); cable(t1, y - th, t2, y - th, 6); cable(t2, y - th, x1, y - 1, 0);
  for (const t of [t1, t2]) {
    px(t - 1, y - th, 3, th + 2, "#c8b48c"); px(t + 1, y - th, 1, th + 2, "#9a8a6a");
    px(t - 1, y - th + 2, 1, 3, "#5a4a3a"); px(t + 1, y - th + 2, 1, 3, "#5a4a3a");   // the pointed arches
  }
  px(x0, y, x1 - x0 + 1, 2, "#6a5a4a"); px(x0, y, x1 - x0 + 1, 1, "#9a8a6a");
}

// the Verrazzano-Narrows, seen at an angle like the skyline: the deck from (ax, ay) to (bx, by) across the
// Narrows, two great towers standing up off it, the main cables swooping between, and its reflection below
function verrazzano(px: Px, ax: number, ay: number, bx: number, by: number) {
  const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  const P = (u: number) => [ax + (bx - ax) * u, ay + (by - ay) * u] as [number, number];
  const TH = 21, ut = [0.18, 0.82];
  const cab = (u0: number, u1: number, h0: number, h1: number, sag: number, c: string, sus: boolean) => {
    const m = Math.ceil(n * (u1 - u0));
    for (let k = 0; k <= m; k++) {
      const v = k / m, u = u0 + (u1 - u0) * v, [x, y] = P(u);
      const hgt = Math.round(h0 + (h1 - h0) * v - sag * 4 * v * (1 - v));
      px(x, y - hgt, 1, 1, c);
      if (sus && k % 2 === 0 && hgt > 2) px(x, y - hgt + 1, 1, hgt - 1, "#c0ccd4");
    }
  };
  for (const [c, off] of [["#b8c4ca", 1], ["#ffffff", 0]] as const) {                  // two main cables, near and far
    cab(0, ut[0], 1, TH - off, -3, c, !off); cab(ut[0], ut[1], TH - off, TH - off, TH - 7, c, !off); cab(ut[1], 1, TH - off, 1, -3, c, !off);
  }
  for (let k = 0; k <= n; k++) { const [x, y] = P(k / n); px(x, y, 1, 3, "#5a6068"); px(x, y, 1, 1, "#d8dce0"); px(x, y + 1, 1, 1, "#3a3a3e"); if (k % 5 < 2) px(x, y + 1, 1, 1, "#ffd23f"); }
  for (const u of ut) {                                                                // the towers: two legs, three struts, a red beacon
    const [tx, ty] = P(u), x = Math.round(tx), y = Math.round(ty) - TH;
    px(x - 1, y, 1, TH + 3, "#e8eef0"); px(x + 1, y, 1, TH + 3, "#8a989e");
    for (const r of [0, 7, 14]) px(x - 1, y + r, 3, 1, "#c8d2d8");
    px(x, y - 2, 1, 2, "#e0302f");
    px(x - 2, y + TH + 3, 5, 2, "#c8c0b0");
  }
}
// its shadow / reflection on the water under the deck: a dark band and the towers' wobble
function verrazzanoWater(px: Px, y0: number, ax: number, ay: number, bx: number, by: number) {
  const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  for (let k = 0; k <= n; k++) {
    const u = k / n, x = Math.round(ax + (bx - ax) * u), y = Math.round(ay + (by - ay) * u);
    for (let d = 3; d < 6; d++) if (M(x, y + d - y0) === ".") px(x, y + d, 1, 1, d < 5 ? "#1d4a7c" : "#2a5a90");
  }
  for (const u of [0.18, 0.82]) {
    const x = Math.round(ax + (bx - ax) * u), y = Math.round(ay + (by - ay) * u);
    for (let d = 5; d < 18; d++) if (M(x, y + d - y0) === "." && d % 3) px(x + (d % 2), y + d, 2, 1, "#9ab4c8");
  }
}

// Lady Liberty, small and simple: star fort, pedestal, green robe, crown, torch up
function libertySmall(px: Px, live: Live[], x: number, y: number) {
  px(x - 4, y - 1, 9, 2, "#8a7e6a"); px(x - 3, y - 2, 7, 1, "#a89c88");
  px(x - 1, y - 5, 3, 3, "#c8bca8"); px(x - 1, y - 5, 3, 1, "#e0d8c8");
  px(x - 1, y - 12, 3, 7, "#5fae96"); px(x + 1, y - 12, 1, 7, "#3f8a76"); px(x - 2, y - 7, 1, 2, "#4f9e86");
  px(x - 1, y - 14, 2, 2, "#5fae96"); px(x - 2, y - 15, 1, 1, "#8ad0bc"); px(x, y - 16, 1, 1, "#8ad0bc"); px(x + 1, y - 15, 1, 1, "#8ad0bc");
  px(x + 1, y - 17, 1, 5, "#5fae96");
  live.push({ k: "fn", fn: (f, t) => { f(x + 1, y - 19, 1, 2, Math.floor(t * 6) % 2 ? "#ffd23f" : "#ff8a1f"); } });
}

// the Bayonne Bridge in 3D. The map is seen from the south with height going up the screen, so the arch is
// built in world space (ground x, y + height z) and projected: screen = (x, y - z). Depth = ground y (south
// is nearer). It's split in two canvases: `far` sits under the van/cars (deck, hangers, anything north of the
// van, the tug in the Kill Van Kull that slips under the deck), `near` sits over them (the parts of the arch
// south of the van, so it passes under the steel instead of over it, plus shore piers/trees tucking the feet in).
let by0 = 0;                                                             // the harbor scene's top row, for the tug
type Seg = { d: number; draw: (g: CanvasRenderingContext2D) => void };
function bayonneGeo(a: number, b: number) {
  const R = 10, HW = 4.2, RIB = 5.4;                                   // rise, half deck width, rib offset (map px)
  const C = (y: number): [number, number] => [roadX(y), y];
  const N = (y: number): [number, number] => { const dx = roadX(y + 0.5) - roadX(y - 0.5), l = Math.hypot(dx, 1); return [1 / l, -dx / l]; };   // ground normal, points east-ish
  const z = (y: number) => { const u = (y - a) / (b - a); return R * 4 * u * (1 - u) - 1.2; };
  const P = (y: number, off: number, h: number): [number, number, number] => { const [cx, cy] = C(y), [nx, ny] = N(y); return [cx + nx * off, cy + ny * off, h]; };
  return { R, HW, RIB, z, P };
}
function bayonne3D(g: CanvasRenderingContext2D, w: number, h: number, bx: number, by: number, a: number, b: number, layer: "far" | "near", vy: number, t: number) {
  g.clearRect(0, 0, w, h);
  const S = w / Math.max(1, Math.round(w / 8));
  const { HW, RIB, z, P } = bayonneGeo(a, b);
  const X = (p: [number, number, number]) => (p[0] - bx) * S, Yp = (p: [number, number, number]) => (p[1] - p[2] - by) * S;
  const cut = vy + 1.5;                                                  // world rows south of this are in front of the van
  const mine = (d: number) => (layer === "near" ? d > cut : d <= cut);
  const segs: Seg[] = [];
  const seg = (p: [number, number, number], q: [number, number, number], wd: number, col: string | ((g: CanvasRenderingContext2D) => string | CanvasGradient)) => {
    const d = Math.max(p[1], q[1]); if (!mine(d)) return;
    segs.push({ d, draw: (g) => { g.beginPath(); g.moveTo(X(p), Yp(p)); g.lineTo(X(q), Yp(q)); g.lineWidth = wd * S; g.strokeStyle = typeof col === "string" ? col : col(g); g.lineCap = "round"; g.stroke(); } });
  };
  const step = 0.5;
  // the tug in the Kill Van Kull, under the deck
  if (layer === "far") { const [kx, ky] = HARBOR.kvk, u = (Math.sin(t * 0.15) + 1) / 2, x = kx - 4 + u * 9, y = by0 + ky + Math.round(u * 2);
    if (M(Math.floor(x), Math.floor(y - by0)) === ".") segs.push({ d: -1e9, draw: (g) => {
      const q = (xx: number, yy: number, ww: number, hh: number, c: string) => { g.fillStyle = c; g.fillRect((xx - bx) * S, (yy - by) * S, ww * S, hh * S); };
      g.globalAlpha = 0.5; q(x - 3, y + 0.5, 3, 1, "#e8f4ff"); g.globalAlpha = 1;
      q(x, y, 3, 2, "#8a5a3a"); q(x + 3, y, 2, 2, "#e0302f"); q(x + 3, y, 1, 1, "#f2f2f2"); } }); }
  // shadow of the arch on the water (sun low in the west: thrown east-southeast)
  if (layer === "far") segs.push({ d: -1e8, draw: (g) => { g.save(); g.globalAlpha = 0.22; g.strokeStyle = "#06141f"; g.lineCap = "round";
    for (const o of [-RIB, RIB]) { g.beginPath(); for (let y = a; y <= b; y += step) { const p = P(y, o, 0), s2 = Math.max(0, z(y)); const xx = (p[0] + s2 * 0.55 - bx) * S, yy = (p[1] + s2 * 0.25 - by) * S; y === a ? g.moveTo(xx, yy) : g.lineTo(xx, yy); } g.lineWidth = S * 1.3; g.stroke(); }
    g.restore(); } });
  // piers down to the water at each end of the main span, and the deck girders
  for (const y of [a + 1, b - 1]) for (const o of [-HW, HW]) { const top = P(y, o, 0), bot = P(y, o, -3); seg(bot, top, 1.3, "#6a6e74"); }
  for (let y = a - 2; y < b + 2; y += step) {
    for (const o of [-HW - 0.4, HW + 0.4]) { const p = P(y, o, 0.3), q = P(y + step, o, 0.3); const nearSide = o > 0;
      if (layer === "far") { seg(P(y, o, -0.6), P(y + step, o, -0.6), 1.1, "#2a3038"); seg(p, q, 0.55, nearSide ? "#d4dbe2" : "#9aa4ae"); } }
  }
  // hangers: straight down from each rib to the deck edge
  for (let y = a + 1.5; y < b - 1; y += 1.25) { const zz = z(y); if (zz < 1.2) continue;
    for (const o of [-RIB, RIB]) { const top = P(y, o, zz - 0.6), bot = P(y, (o > 0 ? 1 : -1) * (HW + 0.4), 0.3); seg(bot, top, 0.16, o > 0 ? "rgba(214,222,230,0.95)" : "rgba(150,160,172,0.85)"); } }
  // cross bracing between the ribs over the top: the Bayonne's K-truss, where the arch clears the deck
  for (let y = a + 3; y < b - 3; y += 2.2) { const z1 = z(y), z2 = z(y + 2.2); if (Math.min(z1, z2) < 4) continue;
    seg(P(y, -RIB, z1), P(y, RIB, z1), 0.35, "#5a646e"); seg(P(y, -RIB, z1), P(y + 2.2, RIB, z2), 0.25, "#6a7480"); }
  // the two ribs: a deep steel box, lit from the west (upper left) - far rib darker
  for (const o of [-RIB, RIB]) {
    const lit = o < 0;                                                     // west rib catches the sun
    const runs: [number, number, number][][] = []; let cur: [number, number, number][] | null = null;
    for (let y = a; y <= b + 1e-6; y += step) { const p = P(y, o, z(y));
      if (mine(p[1])) { if (!cur) { cur = []; runs.push(cur); } cur.push(p); } else if (cur) { cur.push(p); cur = null; } }
    for (const run of runs) {
      const d = Math.max(...run.map((p) => p[1]));
      const poly = (g: CanvasRenderingContext2D, dx: number, dz: number, wd: number, col: string) => { g.beginPath(); run.forEach((p, k) => { const xx = X(p) + dx * S, yy = Yp(p) - dz * S; k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }); g.lineWidth = wd * S; g.strokeStyle = col; g.lineCap = "butt"; g.lineJoin = "round"; g.stroke(); };
      segs.push({ d, draw: (g) => { poly(g, 0, 0, 2, "#2c343e"); poly(g, 0, 0, 1.4, lit ? "#8e9aa8" : "#a8b4c2"); poly(g, -0.25, 0.35, 0.45, lit ? "#e8eef4" : "#f6f9fc"); } });
    }
  }
  segs.sort((u, v) => u.d - v.d).forEach((s) => s.draw(g));
  // a glint on the crown, only on whichever canvas owns the crown right now
  const m = (a + b) / 2, cp = P(m, -RIB, z(m) + 0.3);
  if (mine(cp[1])) { const gx = X(cp), gy = Yp(cp), r = S * (2.6 + Math.sin(t * 1.3) * 0.4);
    const sp = g.createRadialGradient(gx, gy, 0, gx, gy, r); sp.addColorStop(0, "rgba(255,255,255,0.9)"); sp.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = sp; g.fillRect(gx - r, gy - r, r * 2, r * 2); }
  // the shores tuck the feet in: a concrete abutment + a few trees drawn over each foot, on the near canvas
  if (layer === "near") for (const [y, k] of [[b + 1.5, 0], [a - 1.5, 1]] as [number, number][]) {
    for (const o of [-RIB - 1.2, RIB + 1.2]) { const p = P(y, o, 0); g.fillStyle = "#8a8c88"; g.fillRect((p[0] - 1.5 - bx) * S, (p[1] - 1.6 - by) * S, 3 * S, 2.4 * S); g.fillStyle = "#b4b6b0"; g.fillRect((p[0] - 1.5 - bx) * S, (p[1] - 1.6 - by) * S, 3 * S, 0.7 * S); }
    for (let j = 0; j < 3; j++) { const o = (j % 2 ? 1 : -1) * (RIB + 3 + j * 1.6), p = P(y + (k ? -1 : 1) * (0.8 + j * 0.7), o, 0);
      const cx = (p[0] - bx) * S, cy = (p[1] - by) * S, r = S * (1.5 + (j % 2) * 0.4);
      g.fillStyle = "#3a2a1a"; g.fillRect(cx - S * 0.25, cy - S * 0.6, S * 0.5, S * 1.2);
      g.fillStyle = "#1f5a2a"; g.beginPath(); g.arc(cx, cy - r, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#3a8a3a"; g.beginPath(); g.arc(cx - r * 0.3, cy - r * 1.25, r * 0.55, 0, Math.PI * 2); g.fill(); }
  }
  void h;
}

// a steel arch / truss, side on, for the Goethals and the Bayonne Bridge
function arch(px: Px, ax: number, ay: number, bx: number, by: number, rise: number, c: string) {
  const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  for (let k = 0; k <= n; k++) {
    const u = k / n, x = ax + (bx - ax) * u, y = ay + (by - ay) * u, a = Math.round(rise * 4 * u * (1 - u));
    px(x, y, 1, 2, "#5a5a62"); px(x, y - a, 1, 1, c);
    if (k % 2 === 0 && a > 1) px(x, y - a + 1, 1, a - 1, shadeHex(c, -30));
  }
}

/* ---------- the storm ---------- */

// The last stretch of New Jersey is a storm you drive through: it darkens as you go in (anvil clouds,
// wind), the middle is a downpour with lightning, and at the far side it breaks up into sunlit cumulus
// with god rays slanting through the gaps, out onto Staten Island. Rows are relative to the clouds scene.
const sm = (a: number, b: number, v: number) => { const u = Math.min(1, Math.max(0, (v - a) / (b - a))); return u * u * (3 - 2 * u); };
const storm = (yy: number) => sm(8, 46, yy) * (1 - sm(92, 124, yy));   // 0 = fair, 1 = the worst of it

type Puff = [number, number, number, number];       // dx, dy, r, layer: 0 = shaded base, 1 = body, 2 = lit tops
type Cloud = { x: number; y: number; puffs: Puff[]; s: number; v: number; d: number };
const CLOUDS: Cloud[] = (() => {
  const spots: [number, number, number][] = [         // (x, y, size): a few fair-weather ones, the storm shelf, then the clearing
    [16, 4, 0.8], [96, 2, 0.7], [58, 18, 1.0], [118, 26, 1.0],
    [18, 34, 1.4], [108, 38, 1.5], [60, 42, 0.8], [38, 54, 1.25], [122, 60, 1.3], [6, 74, 1.4], [92, 76, 1.35], [66, 90, 0.75],
    [28, 96, 1.3], [118, 98, 1.2], [100, 114, 1.05], [20, 116, 1.0],
    [76, 130, 0.9], [14, 136, 0.8], [118, 142, 0.75], [48, 146, 0.7],
  ];
  return spots.map(([cx, cy, s], k): Cloud => {
    const puffs: Puff[] = [];
    const H = (i: number, j: number) => hash(k * 1013 + i * 37 + j * 7);
    for (let i = 0; i < 7; i++) puffs.push([(H(i, 1) - 0.5) * 26 * s, (H(i, 2) - 0.3) * 9 * s, (5 + H(i, 3) * 4) * s, 0]);
    for (let i = 0; i < 6; i++) puffs.push([(H(i, 4) - 0.55) * 18 * s, (H(i, 5) - 0.65) * 9 * s, (4.5 + H(i, 6) * 3.5) * s, 1]);
    for (let i = 0; i < 5; i++) puffs.push([(H(i, 7) - 0.65) * 13 * s, (H(i, 8) - 0.8) * 8 * s, (2.5 + H(i, 9) * 3) * s, 2]);
    for (let i = 0; i < 9; i++) { const a = H(i, 10) * Math.PI * 2; puffs.push([Math.cos(a) * 11 * s, Math.sin(a) * 5 * s - 1.5 * s, (2.5 + H(i, 11) * 2) * s, Math.sin(a) < 0 ? 1 : 0]); }
    return { x: cx, y: cy, puffs, s, v: 0.25 + hash(k * 5) * 0.35, d: storm(cy) };
  });
})();
// storm clouds get pushed along by the wind; fair ones just bob
const cloudX = (c: Cloud, t: number) => c.x + Math.sin(t * 0.05 * c.v + c.x) * 4 + c.d * Math.sin(t * 0.4 * c.v + c.y) * 5;

const FAIR: [string, string, string, string][] = [   // highlight, mid, shade, edge per layer
  ["#eef1f7", "#c9d0e0", "#9aa5c2", "rgba(140,150,182,0)"],
  ["#fbfcfe", "#dde2ec", "#b0bad0", "rgba(170,180,204,0)"],
  ["#ffffff", "#f1f4f9", "#cdd5e4", "rgba(205,213,228,0)"],
];
const FOUL: [string, string, string, string][] = [
  ["#4a525a", "#2e353d", "#1c2228", "rgba(24,30,36,0)"],
  ["#68727a", "#454e57", "#2a3138", "rgba(40,46,54,0)"],
  ["#8a949c", "#5f6a72", "#3c454e", "rgba(60,68,78,0)"],
];
const rgb = (c: string) => c.startsWith("#") ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const mix = (a: string, b: string, u: number, alpha = 1) => { const A = rgb(a), B = rgb(b); return `rgba(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(",")},${alpha})`; };

// each cloud is painted once onto its own little canvas (they only drift after that)
const SPRITES = new Map<string, HTMLCanvasElement>();
function cloudSprite(c: Cloud, k: number, s: number) {
  const key = `${k}:${s}`;
  let cv = SPRITES.get(key);
  if (cv) return cv;
  const R = Math.ceil(30 * c.s * s);
  cv = document.createElement("canvas"); cv.width = cv.height = 2 * R;
  const g = cv.getContext("2d")!, cx = R, cy = R, d = c.d;
  for (let layer = 0; layer < 3; layer++) {
    const ps = c.puffs.filter((p) => p[3] === layer).sort((a, b) => b[1] - a[1]);
    for (const [dx, dy, r] of ps) {                                   // the shaded side of each puff
      const x = cx + dx * s + r * 0.22 * s, y = cy + dy * s + r * 0.3 * s, Rr = r * s;
      const gr = g.createRadialGradient(x, y, Rr * 0.3, x, y, Rr);
      gr.addColorStop(0, mix(layer ? "#8c96ba" : "#68749c", "#141a20", d, 0.88)); gr.addColorStop(1, mix("#7882aa", "#141a20", d, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, Rr, 0, Math.PI * 2); g.fill();
    }
    const F = FAIR[layer], Q = FOUL[layer];
    for (const [dx, dy, r] of ps) {                                   // then the body over it
      const x = cx + dx * s, y = cy + dy * s, Rr = r * s;
      const gr = g.createRadialGradient(x - Rr * 0.38, y - Rr * 0.42, Rr * 0.05, x + Rr * 0.1, y + Rr * 0.1, Rr * 1.02);
      gr.addColorStop(0, mix(F[0], Q[0], d)); gr.addColorStop(0.42, mix(F[1], Q[1], d)); gr.addColorStop(0.82, mix(F[2], Q[2], d)); gr.addColorStop(1, mix(F[2], Q[2], d, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, Rr, 0, Math.PI * 2); g.fill();
    }
  }
  g.save(); g.globalCompositeOperation = "lighter";                   // sun on the very tops (fair ones only)
  for (const [dx, dy, r, layer] of c.puffs) {
    if (layer < 2 || d > 0.6) continue;
    const x = cx + (dx - r * 0.45) * s, y = cy + (dy - r * 0.5) * s, Rr = r * s * 0.8;
    const gr = g.createRadialGradient(x, y, 0, x, y, Rr);
    gr.addColorStop(0, `rgba(255,232,180,${0.4 * (1 - d)})`); gr.addColorStop(1, "rgba(255,232,180,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, Rr, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  SPRITES.set(key, cv);
  return cv;
}

// a jagged bolt from (x, y0) down to (x1, y1), with a branch or two
function bolt(g: CanvasRenderingContext2D, s: number, x: number, ya: number, x1: number, yb: number, seed: number) {
  const pts: [number, number][] = [[x, ya]];
  const n = 9;
  for (let i = 1; i < n; i++) { const u = i / n; pts.push([x + (x1 - x) * u + (hash(seed * 31 + i) - 0.5) * 7, ya + (yb - ya) * u]); }
  pts.push([x1, yb]);
  const line = (p: [number, number][], wdt: number, c: string) => { g.strokeStyle = c; g.lineWidth = wdt * s; g.lineJoin = "miter"; g.beginPath(); p.forEach(([a, b], k) => (k ? g.lineTo(a * s, b * s) : g.moveTo(a * s, b * s))); g.stroke(); };
  const br = [pts[3], [pts[3][0] + 6 + hash(seed) * 6, pts[3][1] + 7], [pts[3][0] + 9 + hash(seed + 1) * 6, pts[3][1] + 13]] as [number, number][];
  const br2 = [pts[5], [pts[5][0] - 5 - hash(seed + 2) * 5, pts[5][1] + 6]] as [number, number][];
  for (const p of [pts, br, br2]) { line(p, 3.2, "rgba(170,190,255,0.35)"); line(p, 1.4, "rgba(220,230,255,0.8)"); line(p, 0.6, "#ffffff"); }
}

// one frame of the storm over the clouds scene. oy = rows of harbor-side padding above the scene;
// vy = the van's row relative to the scene top (the storm gets meaner while you're in it)
function drawStorm(g: CanvasRenderingContext2D, w: number, h: number, t: number, oy: number, vy: number) {
  const s = w / W, rows = h / s, inside = storm(vy);
  g.clearRect(0, 0, w, h);
  // the light: green-grey murk down the middle of the storm
  const lg = g.createLinearGradient(0, 0, 0, h);
  for (let k = 0; k <= 12; k++) { const yy = (k / 12) * rows - oy, a = storm(yy); lg.addColorStop(k / 12, `rgba(${Math.round(22 + 10 * (1 - a))},${Math.round(34 + 6 * (1 - a))},${30},${(0.62 * a).toFixed(3)})`); }
  g.fillStyle = lg; g.fillRect(0, 0, w, h);
  // the clearing: god rays slanting down-right through the breaking clouds
  g.save(); g.globalCompositeOperation = "lighter";
  for (let k = 0; k < 11; k++) {
    const ang = 0.42 + hash(k * 13) * 0.35;                          // every shaft at its own angle
    const x0 = (hash(k * 19 + 3) * 150 - 40) * s, wid = (2 + hash(k * 7) * 7) * s, y0 = (oy + 100 + hash(k * 23) * 30) * s, len = h - y0;
    const a = (0.16 + 0.08 * Math.sin(t * 0.5 + k * 1.7)) * (1 - inside * 0.5);
    for (const [f, aa] of [[1, 0.35], [0.6, 0.35], [0.28, 0.4]]) {
      const ww = wid * f, off = (wid - ww) / 2;
      const gr = g.createLinearGradient(x0, y0, x0 + len * ang, y0 + len);
      gr.addColorStop(0, "rgba(255,240,200,0)"); gr.addColorStop(0.18, `rgba(255,244,205,${a * aa * 2.4})`); gr.addColorStop(0.7, `rgba(255,238,195,${a * aa * 1.4})`); gr.addColorStop(1, "rgba(255,238,195,0)");
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x0 + off, y0); g.lineTo(x0 + off + ww, y0); g.lineTo(x0 + off + ww * 1.8 + len * ang, y0 + len); g.lineTo(x0 + off + len * ang, y0 + len); g.closePath(); g.fill();
    }
  }
  g.restore();
  // the clouds: drifting sprites, storm ones shoved around by the wind
  CLOUDS.forEach((c, k) => {
    const cv = cloudSprite(c, k, s), R = cv.width / 2, cx = cloudX(c, t) * s, cy = (c.y + oy) * s;
    const sh = g.createRadialGradient(cx + 4 * s, cy + 6 * s, 2, cx + 4 * s, cy + 6 * s, 22 * c.s * s);
    sh.addColorStop(0, `rgba(30,40,60,${0.28 + 0.2 * c.d})`); sh.addColorStop(1, "rgba(30,40,60,0)");
    g.fillStyle = sh; g.fillRect(cx - R, cy - R, 2 * R + 8 * s, 2 * R + 8 * s);
    g.globalAlpha = 1 - 0.18 * c.d;                                   // storm clouds are ragged: you glimpse the road through them
    for (const dx of [0, W * s, -W * s]) if (cx + dx > -R && cx + dx - R < w) g.drawImage(cv, cx + dx - R, cy - R);
    g.globalAlpha = 1;
  });
  // rain, slanting with the wind, heaviest in the middle
  const wind = 0.38 + 0.12 * Math.sin(t * 0.7);
  for (const [n, len, sp, c] of [[260, 5, 70, "rgba(170,190,205,0.32)"], [140, 8, 95, "rgba(205,220,232,0.5)"]] as const) {
    g.strokeStyle = c; g.lineWidth = 0.45 * s; g.beginPath();
    for (let k = 0; k < n; k++) {
      const yy = ((hash(k * 3 + len) * 170 + t * sp) % 170) - 8, a = storm(yy) * (0.7 + 0.6 * inside);
      if (hash(k * 7 + len) > a) continue;
      const x = ((hash(k * 5 + len) * 160 + yy * wind) % 150) - 10;
      g.moveTo(x * s, (yy + oy) * s); g.lineTo((x + len * wind) * s, (yy + oy + len) * s);
    }
    g.stroke();
  }
  // lightning: more often, and closer, when the van is in it
  const P = 1.9 - 0.9 * inside, n = Math.floor(t / P), ph = t - n * P;
  if (ph < 0.26 && hash(n * 17) < 0.35 + 0.6 * inside) {
    const near = inside > 0.4 && hash(n * 5) < 0.6;
    const yb = near ? Math.min(118, Math.max(40, vy + 6 + hash(n * 3) * 14)) : 44 + hash(n * 3) * 60;
    const xb = near ? (hash(n * 11) < 0.5 ? 18 : 108) + (hash(n * 13) - 0.5) * 20 : 8 + hash(n * 11) * 112;
    const flick = ph < 0.05 || (ph > 0.1 && ph < 0.14) ? 1 : 0.35;
    const fl = g.createLinearGradient(0, 0, 0, h);
    for (let k = 0; k <= 8; k++) { const yy = (k / 8) * rows - oy; fl.addColorStop(k / 8, `rgba(225,235,255,${(0.42 * flick * (0.25 + storm(yy)) * (1 - ph / 0.26)).toFixed(3)})`); }
    g.fillStyle = fl; g.fillRect(0, 0, w, h);
    if (flick === 1 || ph < 0.18) {
      bolt(g, s, xb + (hash(n) - 0.5) * 14, yb - 34 + oy, xb, yb + oy, n);
      const gl = g.createRadialGradient(xb * s, (yb + oy) * s, 0, xb * s, (yb + oy) * s, 14 * s);
      gl.addColorStop(0, "rgba(255,255,255,0.7)"); gl.addColorStop(1, "rgba(200,220,255,0)");
      g.fillStyle = gl; g.beginPath(); g.arc(xb * s, (yb + oy) * s, 14 * s, 0, Math.PI * 2); g.fill();
    }
  }
  // ragged scud racing under the cloud base
  for (let k = 0; k < 12; k++) {
    const yy = 30 + hash(k * 41) * 80, a = storm(yy);
    if (a < 0.2) continue;
    const x = ((hash(k * 9) * 160 + t * (6 + hash(k) * 8)) % 170 - 20) * s, y = (yy + oy) * s;
    const gr = g.createRadialGradient(x, y, 0, x, y, 14 * s);
    gr.addColorStop(0, `rgba(70,80,88,${0.45 * a})`); gr.addColorStop(1, "rgba(70,80,88,0)");
    g.save(); g.translate(x, y); g.scale(2.8, 0.4); g.translate(-x, -y);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 14 * s, 0, Math.PI * 2); g.fill(); g.restore();
  }
}

/* ---------- the scenes ---------- */

export const SC_HARBOR: Partial<Record<string, SceneMod>> = {
  clouds: {
    ground: ["#4f7a3a", "#456b33"],
    edge: pick(eTree, eHouse, eTree),
    under: ({ px, y0, h }) => {
      // central Jersey: little towns and woods, and the marsh along the Arthur Kill at the bottom
      for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
        const r = hr(x, y + 999);
        if (y > h - 34) { const u = (y - (h - 34)) / 34; if (r < u * 0.9) px(x, y0 + y, 1, 1, r < u * 0.3 ? "#8aa860" : "#6f8f4a"); }
        else {
          const town = hash(Math.floor(x / 14) * 71 + Math.floor(y / 12) * 13), far = Math.abs(x - roadX(y0 + y)) > 8;
          if (!far) continue;
          if (town < 0.3) { if ((y % 4 === 0 || x % 5 === 0)) px(x, y0 + y, 1, 1, "#8a8a80"); else if (r < 0.5) px(x, y0 + y, 1, 1, ROOF[Math.floor(r * 40) % ROOF.length]); }
          else if (town > 0.72) px(x, y0 + y, 1, 1, r < 0.5 ? "#2f6030" : "#3a7038");
        }
      }
    },
    draw: ({ px, y0, h, live, hd }) => {
      // a refinery tank farm down by the Kill
      { const ty = y0 + h - 30, tx = roadX(ty) > W / 2 ? 6 : W - 34;
        for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) {
          const x = tx + k * 6 + (r % 2) * 3, y = ty + r * 6;
          px(x, y + 1, 5, 3, "#c8c8c4"); px(x + 1, y, 3, 5, "#c8c8c4"); px(x + 1, y + 1, 3, 3, "#ececea"); px(x + 1, y + 1, 1, 1, "#ffffff"); px(x + 3, y + 3, 1, 1, "#9a9a96");
        }
        px(tx - 2, ty - 4, 1, 22, "#9a9a96"); px(tx - 3, ty - 6, 3, 2, "#e0302f"); }
      // the downpour hitting the ground and the road: splashes, and sheets of spray off the asphalt
      live.push({ k: "fn", fn: (f, t, ctx) => {
        for (let k = 0; k < 160; k++) {
          const yy = 6 + Math.floor(hash(k * 3 + 1) * (h - 20)), a = storm(yy);
          if (hash(k * 5 + 2) > a) continue;
          const onRoad = k % 3 === 0, x = onRoad ? roadX(y0 + yy) - 4 + Math.floor(hash(k * 7) * 9) : Math.floor(hash(k * 7) * W);
          const ph = (t * 2.2 + hash(k * 11)) % 1;
          if (ph < 0.35) { ctx.globalAlpha = 0.7 * (1 - ph / 0.35); f(x - 1, y0 + yy, 3, 1, "#c8dcec"); f(x, y0 + yy - 1, 1, 1, "#e8f2fa"); ctx.globalAlpha = 1; }
        }
        ctx.globalAlpha = 0.18;                                            // the road shines wet in the middle of it
        for (let yy = 30; yy < h - 30; yy += 2) { const a = storm(yy); if (a > 0.5 && (yy + Math.floor(t * 3)) % 6 < 2) f(roadX(y0 + yy) - 3, y0 + yy, 7, 1, "#dfe8f0"); }
        ctx.globalAlpha = 1;
      } });
      // cloud shadows on the ground (under the van), sliding with the clouds
      live.push({ k: "fn", fn: (f, t, ctx) => {
        ctx.globalAlpha = 0.2;
        for (const c of CLOUDS) {                         // one soft-edged blot per cluster, thrown down-right
          const cx = cloudX(c, t) + 6, cy = y0 + c.y + 9, rx = 17 * c.s, ry = 8 * c.s;
          for (let k = -Math.ceil(ry); k <= ry; k++) {
            const ww = Math.round(rx * Math.sqrt(Math.max(0, 1 - (k / ry) ** 2)) * (0.85 + 0.15 * Math.sin(k * 1.7 + c.x)));
            f(cx - ww, cy + k, 2 * ww + 1, 1, "#0a1830");
          }
        }
        ctx.globalAlpha = 1;
      } });
      // the storm, above the van: we drive in under it, through the worst of it, and come out over Staten Island
      const oy = 12;
      hd.push({ x: 0, y: y0 - oy, w: W, h: h + oy + 10, res: 3, top: true, anim: true, draw: (g, w, hh, t, vy) => drawStorm(g, w, hh, t, oy, vy - y0) });
    },
  },
  harbor: {
    ground: ["#2a6aac", "#3078b8"],
    under: ({ px, y0 }) => harborGround(px, y0),
    draw: ({ px, y0, live, canopy, says, hd }) => {
      const Y = (y: number) => y0 + y;
      // a few flags on Staten Island lawns (July 14th now: no more flags on every pole)
      const flags: [number, number][] = [];
      for (let k = 0; k < 600 && flags.length < 2; k++) {
        const x = 2 + Math.floor(hr(k, 11) * (W - 8)), y = 6 + Math.floor(hr(k, 12) * (HH - 20));
        const c = M(x, y + 9);
        if (c !== "s" || M(x + 5, y) === "." || M(x, y) === "." || [0, 3, 6, 9].some((d) => roadAt(x, Y(y + d), 9) || roadAt(x + 6, Y(y + d), 9))) continue;
        if (near(x, y, FRESHKILLS, 11, 12) || near(x, y, GREENBELT, 10, 11) || near(x, y, HARBOR.vzS, 14, 14)) continue;
        if (flags.some(([a, b]) => Math.abs(a - x) < 20 && Math.abs(b - y) < 20)) continue;
        flagPole(px, x, Y(y), 9, 5, 3); flags.push([x, y]);
      }
      // Greenbelt pines
      for (let k = 0; k < 14; k++) { const x = GREENBELT[0] - 7 + Math.floor(hr(k, 21) * 14), y = GREENBELT[1] - 8 + Math.floor(hr(k, 22) * 14); if (![0, 2, 4, 6, 8].some((d) => roadAt(x, Y(y + d), 9))) pine(px, x, Y(y), k % 2 ? "#1f5a2a" : "#174a24"); }
      // the Goethals and the Bayonne arch, side on
      { const [gx, gy] = HARBOR.goethals; arch(px, gx - 7, Y(gy + 2), gx + 7, Y(gy - 2), 4, "#4a7a8a"); }

      // Fort Wadsworth by the bridge
      { const [fx, fy] = HARBOR.wadsworth; px(fx - 6, Y(fy) + 2, 5, 3, "#a89c88"); px(fx - 5, Y(fy) + 3, 3, 1, "#7a6e5a"); }
      // the St. George ferry terminal
      { const [sx, sy] = HARBOR.stgeorge; px(sx - 3, Y(sy) - 3, 7, 4, "#d8dce0"); px(sx - 3, Y(sy) - 3, 7, 1, "#ffffff"); px(sx - 2, Y(sy) - 1, 5, 1, "#3a5a8a"); }

      // back to front: Liberty, Ellis, Governors, the towers, the Brooklyn Bridge
      const items: Item[] = [];
      const LX = HARBOR.liberty[0], LY = HARBOR.liberty[1] + 3;               // Liberty Island, open bay water all round her
      items.push({ y: GOV[1] + 2, draw: (p) => { p(GOV[0] - 1, Y(GOV[1]) - 2, 3, 3, "#c8a050"); p(GOV[0], Y(GOV[1]) - 1, 1, 1, "#8a6a30"); } });
      // towers on a grid over Manhattan, plus Jersey City's waterfront and downtown Brooklyn
      const special = (x: number, y: number) => near(x, y, HARBOR.wtc, 3, 3) || near(x, y, HARBOR.esb, 4, 3) || near(x, y, HARBOR.chrysler, 3, 3) || near(x, y, [LX, LY - 8], 5, 10);
      const PAL = ["#8a96a8", "#a8b4c4", "#6a7a90", "#c8c0b0", "#b8b0a8", "#7a8aa0", "#d0d4d8", "#9aa8b4", "#b89a80"];
      for (let y = 2; y < HH - 1; y += 2) for (let x = 1 + (y % 4 === 0 ? 0 : 2); x < W - 2; x += 4) {
        const c = M(x, y);
        const jc = c === "j" && near(x, y, HARBOR.jc, 5, 9) && !roadAt(x, Y(y), 9) && !roadAt(x + 4, Y(y), 9);
        const db = c === "b" && near(x, y, HARBOR.dtbk, 5, 4);
        if (c !== "m" && !jc && !db) continue;
        if ((c === "m" && (isGov(x, y) || inQuad(x, y, HARBOR.cp) || M(x + 3, y) === "." || M(x, y + 1) === ".")) || special(x, y)) continue;
        const dW = Math.hypot(x - HARBOR.wtc[0], (y - HARBOR.wtc[1]) * 1.3), dE = Math.hypot(x - HARBOR.esb[0], (y - HARBOR.esb[1]) * 1.2);
        let h = 4 + 15 * Math.exp(-((dW / 8) ** 2)) + 17 * Math.exp(-((dE / 10) ** 2)) + hr(x, y, 9) * 5;
        if (jc) h = 10 + hr(x, y, 4) * 12;
        if (db) h = 6 + hr(x, y, 4) * 8;
        const w = 3 + Math.floor(hr(x, y, 2) * 2), col = PAL[Math.floor(hr(x, y, 5) * PAL.length)], kind = h > 18 ? Math.floor(hr(x, y, 6) * 2) : 2;
        items.push({ y, draw: (p) => tower(p, x - 1, Y(y), w, Math.round(h), col, kind) });
      }
      items.push({ y: HARBOR.wtc[1], draw: (p) => oneWTC(p, HARBOR.wtc[0] - 2, Y(HARBOR.wtc[1])) });
      items.push({ y: HARBOR.esb[1], draw: (p) => empire(p, HARBOR.esb[0] - 3, Y(HARBOR.esb[1])) });
      items.push({ y: HARBOR.chrysler[1], draw: (p) => chrysler(p, HARBOR.chrysler[0] - 2, Y(HARBOR.chrysler[1])) });
      { const [ex0, ey0] = HARBOR.esb;                                         // billionaires' row pencils, north of the Empire State
        items.push({ y: ey0 - 9, draw: (p) => { tower(p, ex0 + 1, Y(ey0 - 10), 2, 34, "#c8ccd4", 1); tower(p, ex0 + 6, Y(ey0 - 8), 2, 28, "#2a2e3a", 1); } }); }
      items.push({ y: 998, draw: (p) => brooklynBridge(p, HARBOR.bkbA[0] - 6, HARBOR.bkbB[0] + 8, Y(HARBOR.bkbA[1] + 2)) });    // in front of the skyline, the classic view
      items.push({ y: 999, draw: (p) => libertySmall(p, live, LX, Y(LY)) });   // and Lady Liberty in front of it all: small, simple, green
      items.sort((a, b) => a.y - b.y).forEach((it) => it.draw(px));

      // at the end of the road, the last interview: a guy in a Yankees cap on the corner
      { const [ex2, ey2] = HARBOR.vzS, gx = Math.round(roadX(Y(ey2 - 8))) - 12, gy = Y(ey2 - 10);
        person(px, gx, gy, "#2a3a8a", "#1a2a5a", "#3a3a4a", "#c8946a"); px(gx + 1, gy, 1, 1, "#f2f2f2");
        void ex2;
        // the last words of the trip are the first words of the film: it plays backwards, starting where we ended
        says.push({ a: ROAD_END - 62, b: ROAD_END - 46, who: "us", text: "“Are you happy?”" });
        says.push({ a: ROAD_END - 46, b: ROAD_END - 30, who: "them", text: "“Yes. Very much.”" });
        says.push({ a: ROAD_END - 30, b: ROAD_END - 12, who: "them", text: "“Should we get the show on the road?”" });
        says.push({ a: ROAD_END - 12, b: ROAD_END + 1, who: "us", text: "“We are going to start where we ended and end where we began!”" });
      }
      // the Verrazzano and the Bayonne arch sit above the van and the boats
      const ex = Math.round(roadX(ROAD_END)), ey = ROAD_END - y0;                 // from the end of the road
      const VZ: [number, number, number, number] = [ex + 3, Y(ey) + 1, ex + 38, Y(ey) - 6];    // across the Narrows to Bay Ridge
      verrazzanoWater(px, y0, ...VZ);
      canopy.push((f) => verrazzano(f, ...VZ));
      // the Bayonne Bridge: a smooth 3D steel arch over the Kill Van Kull, bowed out to the east beside the deck
      { const ys: number[] = [];
        for (let y = y0; y < ROAD_END; y++) if (M(roadX(y), y - y0) === ".") ys.push(y);
        if (ys.length) {
          const a = ys[0] - 3, b = ys[ys.length - 1] + 3;
          let lo = 999, hi = -999; for (let y = a - 4; y <= b + 4; y++) { lo = Math.min(lo, roadX(y)); hi = Math.max(hi, roadX(y)); }
          const bx = Math.floor(Math.min(lo, HARBOR.kvk[0] - 6) - 14), bw = Math.ceil(Math.max(hi, HARBOR.kvk[0] + 8) + 20) - bx, by = a - 18, bh = b - a + 26;
          by0 = y0;
          for (const layer of ["far", "near"] as const)
            hd.push({ x: bx, y: by, w: bw, h: bh, res: 8, anim: true, top: layer === "near", draw: (g, w, hh, t, vy) => bayonne3D(g, w, hh, bx, by, a, b, layer, vy, t) });
        } }

      // boats: two orange ferries, a container ship in through the Narrows, a tug, sailboats; gulls; sparkle
      // a route through the water: along polyline P at u (0..1)
      const along = (P: [number, number][], u: number): [number, number] => {
        const L = P.slice(1).map((q, k) => Math.hypot(q[0] - P[k][0], q[1] - P[k][1])), tot = L.reduce((a, b) => a + b, 0);
        let d = u * tot, k = 0; while (k < L.length - 1 && d > L[k]) { d -= L[k]; k++; }
        const v = Math.min(1, d / L[k]); return [P[k][0] + (P[k + 1][0] - P[k][0]) * v, P[k][1] + (P[k + 1][1] - P[k][1]) * v];
      };
      const FERRY: [number, number][] = [[HARBOR.stgeorge[0] + 3, HARBOR.stgeorge[1] - 1], [LX + 13, LY - 6], [HARBOR.battery[0] + 3, HARBOR.battery[1] + 2]];
      const SHIP: [number, number][] = [[HARBOR.lowerbay[0] + 10, HARBOR.lowerbay[1] - 6], [HARBOR.lowerbay[0], HARBOR.lowerbay[1]], [(HARBOR.vzS[0] + HARBOR.vzB[0]) / 2 + 1, (HARBOR.vzS[1] + HARBOR.vzB[1]) / 2], [HARBOR.shipB[0] + 4, HARBOR.shipB[1]]];
      live.push({ k: "fn", fn: (f, t, ctx) => {
        const D = depth();
        for (let k = 0; k < 40; k++) {
          const x = Math.floor(hash(k * 7 + 1) * W), y = Math.floor(hash(k * 7 + 2) * HH);
          if (M(x, y) === "." && D[y][x] > 1 && (t * 0.9 + hash(k * 3)) % 1 < 0.25) f(x, Y(y), 1, 1, "#f2fbff");
        }
        for (const ph of [0, 0.5]) {                                            // the orange Staten Island ferries
          const a = t * 0.1 + ph * Math.PI * 2, u = (Math.sin(a) + 1) / 2, [x, y] = along(FERRY, u), dir = Math.cos(a) > 0 ? 1 : -1;
          ctx.globalAlpha = 0.6; f(x + dir, Y(y) - dir * 4, 2, 3, "#e8f4ff"); ctx.globalAlpha = 1;
          f(x - 2, Y(y) - 1, 5, 4, "#ff7a1a"); f(x - 1, Y(y), 3, 2, "#f2f2f2"); f(x - 1, Y(y) + 1, 3, 1, "#1a2a3a");
        }
        { const [x, y] = along(SHIP, (t * 0.01) % 1);                            // a container ship in through the Narrows
          if (M(x, y) === "." && M(x + 2, y + 3) === ".") {
            f(x - 1, Y(y) - 4, 4, 9, "#2a2a3a"); f(x, Y(y) - 3, 2, 3, "#c8402f"); f(x, Y(y), 2, 2, "#2f6fb0"); f(x, Y(y) + 2, 2, 1, "#e8b830");
            f(x, Y(y) + 4, 2, 1, "#f2f2f2");
            ctx.globalAlpha = 0.5; f(x + 1, Y(y) - 7, 2, 3, "#e8f4ff"); ctx.globalAlpha = 1;
          } }
        for (let k = 0; k < 7; k++) {                                            // sailboats out in the Lower Bay
          const [bx, by] = k < 4 ? HARBOR.lowerbay : HARBOR.raritan, x = bx - 10 + hash(k * 5) * 22 + Math.sin(t * 0.1 + k) * 4, y = by - 10 + hash(k * 9) * 22;
          if (M(x, y) !== "." || M(x + 2, y + 3) !== ".") continue;
          f(x, Y(y) + 3, 3, 1, "#f2f2f2"); f(x + 1, Y(y), 1, 3, "#ffffff"); f(x + 2, Y(y) + 1, 1, 2, k % 2 ? "#e0302f" : "#f2f2f2");
        }
        for (let k = 0; k < 9; k++) {                                            // gulls
          const a = t * (0.3 + hash(k) * 0.3) + k * 2, cx = 64 + hash(k * 3) * 56, cy = 30 + hash(k * 11) * 90;
          const x = cx + Math.cos(a) * 10, y = cy + Math.sin(a) * 5, up = Math.floor(t * 6 + k) % 2;
          f(x - 1, Y(y) - up, 1, 1, "#ffffff"); f(x, Y(y), 1, 1, "#ffffff"); f(x + 1, Y(y) - up, 1, 1, "#ffffff");
        }
      } });
    },
  },
};
