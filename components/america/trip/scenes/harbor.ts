// The last stretch: under a bank of clouds through New Jersey, then out over the Outerbridge
// and up Staten Island to the Verrazzano, with the harbor, Lady Liberty and Manhattan ahead.
import { W, ROAD_END, roadX, hash } from "../core";
import { HARBOR } from "../../harbor";
import type { SceneMod, Px } from "../kit";
import { pine, usFlag, flagPole, pick, eTree, eHouse } from "../kit";

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
const WATER = ["#5aa8dc", "#4796d0", "#3a86c4", "#3078b8", "#2a6aac", "#25609f"];

// zones on Staten Island (rows/cols in harbor space)
const FRESHKILLS: [number, number] = [49, 50], GREENBELT: [number, number] = [48, 72];
const GOV = HARBOR.gov;
const isGov = (x: number, y: number) => M(x, y) === "m" && y <= 136 && near(x, y, GOV, 5, 6);
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

// Lady Liberty on her star fort, torch up. Base (x, y) = bottom center of the island.
function liberty(px: Px, x: number, y: number) {
  for (let k = -2; k <= 2; k++) { const w = 15 - Math.abs(k) * 3; px(x - Math.floor(w / 2), y + k - 2, w, 1, "#5aa04a"); }   // the island
  px(x - 4, y - 3, 9, 2, "#c8bca8"); px(x - 5, y - 2, 1, 1, "#c8bca8"); px(x + 5, y - 2, 1, 1, "#c8bca8"); px(x, y - 4, 1, 1, "#c8bca8");   // Fort Wood
  px(x - 3, y - 5, 7, 2, "#c8bca8"); px(x - 3, y - 4, 7, 1, "#a89c88");
  const p = y - 5;                                                          // the pedestal
  px(x - 2, p - 9, 5, 9, "#d8ccb4"); px(x + 2, p - 9, 1, 9, "#b0a48c"); px(x - 2, p - 9, 5, 1, "#ece4d0");
  px(x - 2, p - 5, 5, 1, "#b0a48c"); px(x - 1, p - 7, 1, 1, "#8a7e6a"); px(x + 1, p - 7, 1, 1, "#8a7e6a");
  // the statue itself, 13 x 24, drawn from a little map; her right side falls into shadow
  const ART = [
    ".F...........",
    "FfF..........",
    "FFF..........",
    ".H...........",
    ".A...c.c.c...",
    ".A....ccc....",
    ".A...chhhc...",
    ".A....hhh....",
    ".A....hHh....",
    "..A..GGgGG...",
    "..AAGGGgGGG..",
    "....GGgGGGTT.",
    "....GgGGGgTT.",
    "....GGgGGGTT.",
    "....GgGGgGTd.",
    "....GGgGGGG..",
    "...GGgGGGgG..",
    "...GgGGgGGGd.",
    "...GGgGGGgGd.",
    "...GgGGgGGGd.",
    "..GGgGGGgGGd.",
    "..GgGGgGGGGd.",
    "..GGGGGGGGGd.",
    ".dddddddddd..",
  ];
  const COL: Record<string, string> = { F: "#ffd23f", f: "#ff8a1f", H: "#c8961a", A: "#4fa88c", c: "#7ad0b4", h: "#6fc4a8", G: "#5fb89c", g: "#9ae0c8", T: "#3f8a78", d: "#2f6a5a" };
  const top = p - 9 - ART.length;
  ART.forEach((row, r) => [...row].forEach((ch, k) => { if (ch !== ".") px(x - 6 + k, top + r, 1, 1, COL[ch]); }));
}

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
  const h = 44;
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

// the Verrazzano-Narrows: deck from (ax, ay) to (bx, by), side on, two great towers, the cables between
function verrazzano(px: Px, ax: number, ay: number, bx: number, by: number) {
  const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  const P = (u: number) => [ax + (bx - ax) * u, ay + (by - ay) * u] as [number, number];
  const TH = 24, ut = [0.17, 0.83];
  for (let k = 0; k <= n; k++) { const [x, y] = P(k / n); px(x, y + 3, 1, 2, "#1f5a90"); }       // shadow on the water
  const cab = (u0: number, u1: number, h0: number, h1: number, sag: number) => {        // cables and suspenders
    const m = Math.ceil(n * (u1 - u0));
    for (let k = 0; k <= m; k++) {
      const v = k / m, u = u0 + (u1 - u0) * v, [x, y] = P(u);
      const hgt = Math.round(h0 + (h1 - h0) * v - sag * 4 * v * (1 - v));
      px(x, y - hgt, 1, 1, "#e8eef2");
      if (k % 2 === 0 && hgt > 2) px(x, y - hgt + 1, 1, hgt - 1, "#9aa8b0");
    }
  };
  cab(0, ut[0], 2, TH, 0); cab(ut[0], ut[1], TH, TH, TH - 3); cab(ut[1], 1, TH, 2, 0);
  for (let k = 0; k <= n; k++) { const [x, y] = P(k / n); px(x, y, 1, 3, "#5a6068"); px(x, y, 1, 1, "#c8ccd0"); px(x, y + 1, 1, 1, "#3a3a3e"); }
  for (const u of ut) {                                                                // the towers: two legs, struts, a flag
    const [tx, ty] = P(u), x = Math.round(tx), y = Math.round(ty) - TH;
    px(x - 1, y, 1, TH + 3, "#a8b4b8"); px(x + 1, y, 1, TH + 3, "#7a8a90");
    for (const r of [0, 8, 16]) px(x - 1, y + r, 3, 1, "#a8b4b8");
    px(x - 1, y + TH + 3, 3, 2, "#c8c0b0");
    px(x, y - 4, 1, 4, "#cfcfcf"); usFlag(px, x + 1, y - 4, 4, 3);
  }
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

/* ---------- the clouds ---------- */

// cumulus clusters over New Jersey: map coords relative to the clouds scene, drifting slowly.
// Each puff is [dx, dy, r, layer]: 0 = the broad shaded base, 1 = the body, 2 = the sunlit cauliflower tops
type Puff = [number, number, number, number];
type Cloud = { x: number; y: number; puffs: Puff[]; s: number; v: number };
const CLOUDS: Cloud[] = (() => {
  const spots: [number, number, number][] = [   // (x, y, size)
    [16, 14, 1.0], [94, 6, 0.85], [60, 32, 1.2], [120, 38, 0.75], [6, 58, 0.85], [42, 70, 1.25], [104, 74, 1.1],
    [76, 104, 1.0], [14, 110, 1.15], [120, 122, 0.8], [54, 136, 1.2], [98, 154, 0.95], [8, 156, 0.75], [70, 172, 0.7],
  ];
  return spots.map(([cx, cy, s], k): Cloud => {
    const puffs: Puff[] = [];
    const H = (i: number, j: number) => hash(k * 1013 + i * 37 + j * 7);
    for (let i = 0; i < 7; i++) puffs.push([(H(i, 1) - 0.5) * 26 * s, (H(i, 2) - 0.3) * 9 * s, (5 + H(i, 3) * 4) * s, 0]);
    for (let i = 0; i < 6; i++) puffs.push([(H(i, 4) - 0.55) * 18 * s, (H(i, 5) - 0.65) * 9 * s, (4.5 + H(i, 6) * 3.5) * s, 1]);
    for (let i = 0; i < 5; i++) puffs.push([(H(i, 7) - 0.65) * 13 * s, (H(i, 8) - 0.8) * 8 * s, (2.5 + H(i, 9) * 3) * s, 2]);
    for (let i = 0; i < 9; i++) {                     // little curls round the rim
      const a = H(i, 10) * Math.PI * 2;
      puffs.push([Math.cos(a) * 11 * s, Math.sin(a) * 5 * s - 1.5 * s, (2.5 + H(i, 11) * 2) * s, Math.sin(a) < 0 ? 1 : 0]);
    }
    return { x: cx, y: cy, puffs, s, v: 0.25 + hash(k * 5) * 0.35 };
  });
})();
const cloudX = (c: Cloud, t: number) => c.x + Math.sin(t * 0.05 * c.v + c.x) * 4;

const BODY: [string, string, string, string][] = [   // highlight, mid, shade, edge per layer
  ["#eef1f7", "#c9d0e0", "#9aa5c2", "rgba(140,150,182,0)"],
  ["#fbfcfe", "#dde2ec", "#b0bad0", "rgba(170,180,204,0)"],
  ["#ffffff", "#f1f4f9", "#cdd5e4", "rgba(205,213,228,0)"],
];
function drawClouds(g: CanvasRenderingContext2D, w: number, h: number, t: number, oy: number) {
  const s = w / W;                                    // canvas px per map px
  g.clearRect(0, 0, w, h);
  // warm haze from the sun, up and to the left
  const hz = g.createLinearGradient(0, 0, w * 0.8, h * 0.6);
  hz.addColorStop(0, "rgba(255,236,190,0.16)"); hz.addColorStop(1, "rgba(255,236,190,0)");
  g.fillStyle = hz; g.fillRect(0, 0, w, h);
  // god rays: shafts of sun slanting down-right through the gaps, soft-edged, breathing slowly
  g.save(); g.globalCompositeOperation = "lighter";
  const ang = 0.55;                                   // dx per dy
  for (let k = 0; k < 9; k++) {
    const x0 = (hash(k * 19 + 3) * 170 - 60) * s, wid = (2.5 + hash(k * 7) * 7) * s, len = h * (0.75 + hash(k * 3) * 0.5);
    const a = 0.09 + 0.06 * Math.sin(t * 0.5 + k * 1.7), y0 = hash(k * 23) * 50 * s;
    for (const [f, aa] of [[1, 0.35], [0.6, 0.35], [0.28, 0.4]]) {
      const ww = wid * f, off = (wid - ww) / 2;
      const gr = g.createLinearGradient(x0, y0, x0 + len * ang, y0 + len);
      gr.addColorStop(0, `rgba(255,244,205,${a * aa * 2.4})`); gr.addColorStop(0.55, `rgba(255,238,195,${a * aa * 1.6})`); gr.addColorStop(1, "rgba(255,238,195,0)");
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x0 + off, y0); g.lineTo(x0 + off + ww, y0); g.lineTo(x0 + off + ww * 1.8 + len * ang, y0 + len); g.lineTo(x0 + off + len * ang, y0 + len); g.closePath(); g.fill();
    }
  }
  g.restore();
  for (const c of CLOUDS) {
    const cx = cloudX(c, t) * s, cy = (c.y + oy) * s;
    // a soft blue shadow under the whole cluster, thrown down-right
    const R0 = 22 * c.s * s, sh = g.createRadialGradient(cx + 4 * s, cy + 6 * s, R0 * 0.2, cx + 4 * s, cy + 6 * s, R0);
    sh.addColorStop(0, "rgba(70,84,120,0.32)"); sh.addColorStop(1, "rgba(70,84,120,0)");
    g.save(); g.translate(cx + 4 * s, cy + 6 * s); g.scale(1.5, 0.8); g.translate(-cx - 4 * s, -cy - 6 * s);
    g.fillStyle = sh; g.beginPath(); g.arc(cx + 4 * s, cy + 6 * s, R0, 0, Math.PI * 2); g.fill(); g.restore();
    for (let layer = 0; layer < 3; layer++) {
      const ps = c.puffs.filter((p) => p[3] === layer).sort((a, b) => b[1] - a[1]);
      // the shaded side of each puff, then the lit body over it
      for (const [dx, dy, r] of ps) {
        const x = cx + dx * s + r * 0.22 * s, y = cy + dy * s + r * 0.3 * s, R = r * s;
        const gr = g.createRadialGradient(x, y, R * 0.3, x, y, R);
        gr.addColorStop(0, layer ? "rgba(140,150,186,0.85)" : "rgba(104,116,156,0.9)"); gr.addColorStop(1, "rgba(120,130,170,0)");
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
      }
      const [c0, c1, c2, c3] = BODY[layer];
      for (const [dx, dy, r] of ps) {
        const x = cx + dx * s, y = cy + dy * s, R = r * s;
        const gr = g.createRadialGradient(x - R * 0.38, y - R * 0.42, R * 0.05, x + R * 0.1, y + R * 0.1, R * 1.02);
        gr.addColorStop(0, c0); gr.addColorStop(0.42, c1); gr.addColorStop(0.82, c2); gr.addColorStop(1, c3);
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
      }
    }
    // warm sun on the very tops
    g.save(); g.globalCompositeOperation = "lighter";
    for (const [dx, dy, r, layer] of c.puffs) {
      if (layer < 2) continue;
      const x = cx + (dx - r * 0.45) * s, y = cy + (dy - r * 0.5) * s, R = r * s * 0.8;
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, "rgba(255,232,180,0.4)"); gr.addColorStop(1, "rgba(255,232,180,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  // thin wisps drifting through
  for (let k = 0; k < 9; k++) {
    const x = ((hash(k * 9) * 160 + t * (0.6 + hash(k) * 0.8)) % 170 - 20) * s, y = (hash(k * 41) * 160 + oy) * s;
    const gr = g.createRadialGradient(x, y, 0, x, y, 16 * s);
    gr.addColorStop(0, "rgba(255,255,255,0.3)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.save(); g.translate(x, y); g.scale(2.6, 0.45); g.translate(-x, -y);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 16 * s, 0, Math.PI * 2); g.fill(); g.restore();
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
      // a refinery tank farm down by the Kill, flags out on the lawns
      { const ty = y0 + h - 30, tx = roadX(ty) > W / 2 ? 6 : W - 34;
        for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) {
          const x = tx + k * 6 + (r % 2) * 3, y = ty + r * 6;
          px(x, y + 1, 5, 3, "#c8c8c4"); px(x + 1, y, 3, 5, "#c8c8c4"); px(x + 1, y + 1, 3, 3, "#ececea"); px(x + 1, y + 1, 1, 1, "#ffffff"); px(x + 3, y + 3, 1, 1, "#9a9a96");
        }
        px(tx - 2, ty - 4, 1, 22, "#9a9a96"); px(tx - 3, ty - 6, 3, 2, "#e0302f"); }
      for (let k = 0; k < 10; k++) {
        const y = y0 + 8 + Math.floor(hr(k, 7) * (h - 50)), x = 2 + Math.floor(hr(k, 8) * (W - 10));
        if (roadAt(x, y, 10) || roadAt(x + 5, y + 10, 10)) continue;
        flagPole(px, x, y, 9, 5, 3);
      }
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
      // the bank of clouds, above the van: we drive under them and come out over Staten Island
      const oy = 12;
      hd.push({ x: 0, y: y0 - oy, w: W, h: h + oy + 26, res: 3, top: true, anim: true, draw: (g, w, hh, t) => drawClouds(g, w, hh, t, oy) });
    },
  },
  harbor: {
    ground: ["#2a6aac", "#3078b8"],
    under: ({ px, y0 }) => harborGround(px, y0),
    draw: ({ px, y0, live, canopy }) => {
      const Y = (y: number) => y0 + y;
      // flags all over Staten Island and Brooklyn
      const flags: [number, number][] = [];
      for (let k = 0; k < 600 && flags.length < 22; k++) {
        const x = 2 + Math.floor(hr(k, 11) * (W - 8)), y = 6 + Math.floor(hr(k, 12) * (HH - 20));
        const c = M(x, y + 9);
        if ((c !== "s" && c !== "b") || M(x + 5, y) === "." || M(x, y) === "." || roadAt(x, Y(y), 9) || roadAt(x + 5, Y(y + 9), 9)) continue;
        if (near(x, y, FRESHKILLS, 11, 12) || near(x, y, GREENBELT, 10, 11) || near(x, y, [57, 118], 10, 26)) continue;
        if (y > 70 && y < 112 && x < 52 && x > 14) continue;              // keep the Verrazzano clear
        if (flags.some(([a, b]) => Math.abs(a - x) < 12 && Math.abs(b - y) < 12)) continue;
        if (c === "b" && flags.filter(([a, b]) => M(a, b + 9) === "b").length >= 6) continue;
        flagPole(px, x, Y(y), 9, 5, 3); flags.push([x, y]);
      }
      // Greenbelt pines
      for (let k = 0; k < 14; k++) { const x = GREENBELT[0] - 7 + Math.floor(hr(k, 21) * 14), y = GREENBELT[1] - 8 + Math.floor(hr(k, 22) * 14); if (!roadAt(x, Y(y), 8)) pine(px, x, Y(y), k % 2 ? "#1f5a2a" : "#174a24"); }
      // the Goethals and the Bayonne arch, side on
      { const [gx, gy] = HARBOR.goethals; arch(px, gx - 7, Y(gy + 2), gx + 7, Y(gy - 2), 4, "#4a7a8a"); }
      { const [bx, by] = HARBOR.bayonne; arch(px, bx - 4, Y(by + 2), bx + 9, Y(by - 2), 7, "#9aa0a8"); }
      // Fort Wadsworth by the bridge
      { const [fx, fy] = HARBOR.wadsworth; px(fx - 6, Y(fy) + 2, 5, 3, "#a89c88"); px(fx - 5, Y(fy) + 3, 3, 1, "#7a6e5a"); }
      // the St. George ferry terminal
      { const [sx, sy] = HARBOR.stgeorge; px(sx - 3, Y(sy) - 3, 7, 4, "#d8dce0"); px(sx - 3, Y(sy) - 3, 7, 1, "#ffffff"); px(sx - 2, Y(sy) - 1, 5, 1, "#3a5a8a"); flagPole(px, sx + 4, Y(sy) - 12, 10, 6, 4); }

      // back to front: Liberty, Ellis, Governors, the towers, the Brooklyn Bridge
      const items: Item[] = [];
      const LX = 57, LY = 133;                                                  // out in the water, clear of the ferry lane
      items.push({ y: LY, draw: (p) => liberty(p, LX, Y(LY)) });
      items.push({ y: GOV[1] + 2, draw: (p) => { p(GOV[0] - 1, Y(GOV[1]) - 2, 3, 3, "#c8a050"); p(GOV[0], Y(GOV[1]) - 1, 1, 1, "#8a6a30"); flagPole(p, GOV[0] + 2, Y(GOV[1]) - 9, 8, 4, 3); } });
      // towers on a grid over Manhattan, plus Jersey City's waterfront and downtown Brooklyn
      const special = (x: number, y: number) => near(x, y, HARBOR.wtc, 3, 3) || near(x, y, HARBOR.esb, 4, 3) || near(x, y, [84, 165], 3, 3);
      const PAL = ["#8a96a8", "#a8b4c4", "#6a7a90", "#c8c0b0", "#b8b0a8", "#7a8aa0", "#d0d4d8", "#9aa8b4", "#b89a80"];
      for (let y = 110; y < HH - 1; y += 2) for (let x = 50 + (y % 4 === 0 ? 0 : 2); x < 104; x += 4) {
        const c = M(x, y);
        const jc = c === "j" && y > 108 && y < 135 && near(x, y, [82, 120], 6, 12);
        const db = false;
        if (c !== "m" && !jc && !db) continue;
        if (c === "m" && (isGov(x, y) || M(x + 3, y) === "." || M(x, y + 1) === "." || special(x, y))) continue;
        const dW = Math.hypot(x - HARBOR.wtc[0], (y - HARBOR.wtc[1]) * 1.3), dE = Math.hypot(x - HARBOR.esb[0], (y - HARBOR.esb[1]) * 1.2);
        let h = 5 + 20 * Math.exp(-((dW / 8) ** 2)) + 22 * Math.exp(-((dE / 10) ** 2)) + hr(x, y, 9) * 7;
        if (jc) h = 10 + hr(x, y, 4) * 12;
        if (db) h = 6 + hr(x, y, 4) * 8;
        const w = 3 + Math.floor(hr(x, y, 2) * 2), col = PAL[Math.floor(hr(x, y, 5) * PAL.length)], kind = h > 18 ? Math.floor(hr(x, y, 6) * 2) : 2;
        items.push({ y, draw: (p) => tower(p, x - 1, Y(y), w, Math.round(h), col, kind) });
      }
      items.push({ y: HARBOR.wtc[1], draw: (p) => oneWTC(p, HARBOR.wtc[0] - 2, Y(HARBOR.wtc[1])) });
      items.push({ y: HARBOR.esb[1], draw: (p) => empire(p, HARBOR.esb[0] - 3, Y(HARBOR.esb[1])) });
      items.push({ y: 165, draw: (p) => chrysler(p, 82, Y(165)) });
      items.push({ y: 172, draw: (p) => { tower(p, 77, Y(172), 2, 36, "#c8ccd4", 1); tower(p, 87, Y(174), 2, 30, "#2a2e3a", 1); } });   // billionaires' row pencils
      items.push({ y: 999, draw: (p) => brooklynBridge(p, 57, 72, Y(146)) });    // in front of the skyline, the classic view
      items.sort((a, b) => a.y - b.y).forEach((it) => it.draw(px));
      px(HARBOR.battery[0] - 7, Y(HARBOR.battery[1]) - 10, 1, 12, "#cfcfcf");
      live.push({ k: "flag", x: HARBOR.battery[0] - 6, y: Y(HARBOR.battery[1]) - 10, w: 7, h: 5, kind: "us" });

      // the Verrazzano and the Outerbridge truss sit above the van and the boats
      const [ex, ey] = HARBOR.vzS;
      canopy.push((f) => verrazzano(f, ex + 2, Y(ey) + 2, 20, Y(ey) + 15));
      canopy.push((f) => {
        for (let y = y0; y < y0 + 30; y++) {
          const x = roadX(y);
          if (M(x, y - y0) !== "." || y >= ROAD_END) continue;
          f(x - 6, y, 1, 1, "#4a6a5a"); f(x + 6, y, 1, 1, "#4a6a5a");
          if (y % 3 === 0) { f(x - 6, y, 13, 1, "#6a8a7a"); f(x - 5, y - 1, 1, 1, "#4a6a5a"); f(x + 5, y + 1, 1, 1, "#4a6a5a"); }
        }
      });

      // boats: two orange ferries, a container ship in through the Narrows, a tug, sailboats; gulls; sparkle
      const [gx, gy] = HARBOR.stgeorge, [btx, bty] = HARBOR.battery;
      live.push({ k: "fn", fn: (f, t, ctx) => {
        const D = depth();
        for (let k = 0; k < 40; k++) {
          const x = Math.floor(hash(k * 7 + 1) * W), y = Math.floor(hash(k * 7 + 2) * HH);
          if (M(x, y) === "." && D[y][x] > 1 && (t * 0.9 + hash(k * 3)) % 1 < 0.25) f(x, Y(y), 1, 1, "#f2fbff");
        }
        for (const ph of [0, 0.5]) {
          const a = t * 0.12 + ph * Math.PI * 2, u = (Math.sin(a) + 1) / 2;
          const x = gx + 3 + (btx - 6 - gx) * u, y = gy + 4 + (bty - 6 - gy) * u, dir = Math.cos(a) > 0 ? 1 : -1;
          ctx.globalAlpha = 0.6; f(x - dir * 2, Y(y) - dir * 4, 2, 3, "#e8f4ff"); ctx.globalAlpha = 1;
          f(x - 2, Y(y) - 1, 5, 4, "#ff7a1a"); f(x - 1, Y(y), 3, 2, "#f2f2f2"); f(x - 1, Y(y) + 1, 3, 1, "#1a2a3a");
        }
        { const u = (t * 0.008) % 1, x = 6 + u * 40, y = 70 + u * 52;
          if (M(x, y) === "." && M(x + 4, y + 4) === ".") {
            f(x - 1, Y(y) - 4, 4, 9, "#2a2a3a"); f(x, Y(y) - 3, 2, 3, "#c8402f"); f(x, Y(y), 2, 2, "#2f6fb0"); f(x, Y(y) + 2, 2, 1, "#e8b830");
            f(x, Y(y) + 4, 2, 1, "#f2f2f2");
            ctx.globalAlpha = 0.5; f(x, Y(y) - 7, 2, 3, "#e8f4ff"); ctx.globalAlpha = 1;
          } }
        { const u = (t * 0.015 + 0.3) % 1, x = 76 + u * 22, y = 86 + u * 24;
          if (M(x, y) === ".") { f(x, Y(y), 3, 2, "#8a5a3a"); f(x + 3, Y(y) + 2, 2, 2, "#e0302f"); f(x + 3, Y(y) + 2, 1, 1, "#f2f2f2"); } }
        for (let k = 0; k < 6; k++) {
          const x = 4 + hash(k * 5) * 30 + Math.sin(t * 0.1 + k) * 6, y = 25 + hash(k * 9) * 60;
          if (M(x, y) !== "." || M(x + 2, y + 3) !== ".") continue;
          f(x, Y(y) + 3, 3, 1, "#f2f2f2"); f(x + 1, Y(y), 1, 3, "#ffffff"); f(x + 2, Y(y) + 1, 1, 2, k % 2 ? "#e0302f" : "#f2f2f2");
        }
        for (let k = 0; k < 9; k++) {
          const a = t * (0.3 + hash(k) * 0.3) + k * 2, cx = 20 + hash(k * 3) * 80, cy = 40 + hash(k * 11) * 110;
          const x = cx + Math.cos(a) * 10, y = cy + Math.sin(a) * 5, up = Math.floor(t * 6 + k) % 2;
          f(x - 1, Y(y) - up, 1, 1, "#ffffff"); f(x, Y(y), 1, 1, "#ffffff"); f(x + 1, Y(y) - up, 1, 1, "#ffffff");
        }
        if (Math.floor(t * 7) % 3 === 0) f(LX - 5, Y(LY) - 37, 1, 1, "#ffffff");    // the torch flickers
      } });
    },
  },
};
