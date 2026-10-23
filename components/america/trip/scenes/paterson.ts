// Paterson, NJ: the love of the trip. Top to bottom: the Great Falls of the Passaic (a quinceañera
// shoot at the overlook, the footbridge over the chasm, a block party across the way), the river under
// the road, the raceways (pickup ball on the old mill lot, the water wheel, the Rogers locomotive shop),
// Lou Costello with his bat, the food trucks, Main Street with every flag in town, Lambert Castle up on
// Garret Mountain, St. John's spires, and the market.

import { W, roadX, room, hash } from "../core";
import type { SceneMod, Px } from "../kit";
import { pine, person, usFlag, GLYPH, eTree, pick } from "../kit";
import type { F } from "../fx";

/* ---------- little local kit ---------- */

const EXTRA: Record<string, string> = {
  J: "001001001101111", Z: "111001010100111", "'": "010010000000000", "?": "111001010000010", "!": "010010010000010",
  "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111", "4": "101101111001001",
  "5": "111100111001111", "6": "111100111101111", "7": "111001001001001", "8": "111101111101111", "9": "111101111001111",
  ".": "000000000000010", "-": "000000111000000", "&": "010101010101011",
};
const glyph = (ch: string) => GLYPH[ch] ?? EXTRA[ch] ?? GLYPH[" "];
function text(px: Px, x: number, y: number, s: string, fg: string) {
  [...s].forEach((ch, n) => glyph(ch).split("").forEach((b, k) => { if (b === "1") px(x + n * 4 + (k % 3), y + Math.floor(k / 3), 1, 1, fg); }));
}
const tw = (s: string) => s.length * 4 - 1;
// a sign: background box with the word centered
function sign(px: Px, x: number, y: number, w: number, s: string, fg: string, bg: string) {
  px(x, y, w, 7, bg); text(px, x + Math.max(1, Math.floor((w - tw(s)) / 2)), y + 1, s, fg);
}

const SKIN = ["#f0c8a0", "#e0b090", "#c08a5a", "#8a5a3a", "#6a4028", "#d8a070"];
const SHIRT = ["#e0302f", "#3a6fd8", "#ffd23f", "#2faa4a", "#ff8a1f", "#b04ad8", "#f2f2f2", "#1a1a1a", "#ff5ad1", "#5af0ff", "#2a3a8a"];
const HAIR = ["#1a1a1a", "#3a2a1a", "#5a3a1a", "#1a1a1a", "#8a6a3a", "#2a1a10"];

// flags of the neighborhoods: color at (x, y) of a w x h flag
type FlagFn = (x: number, y: number, w: number, h: number) => string;
const FLAGS: Record<string, FlagFn> = {
  us: (x, y, w, h) => (y < Math.ceil(h * 0.55) && x < Math.ceil(w * 0.45)) ? ((x + y) % 2 ? "#2a3a8a" : "#f2f2f2") : y % 2 ? "#f2f2f2" : "#c8202a",
  dominican: (x, y, w, h) => {
    const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
    if (x === cx || y === cy) return x === cx && y === cy ? "#2faa4a" : "#f2f2f2";
    return (x < cx) === (y < cy) ? "#1a3a8a" : "#c8202a";
  },
  peru: (x, y, w) => (x < w / 3 || x >= (2 * w) / 3 ? "#d8102a" : "#f2f2f2"),
  palestine: (x, y, w, h) => (x < h / 2 - Math.abs(y - (h - 1) / 2) + 1 ? "#d8102a" : y < h / 3 ? "#111" : y < (2 * h) / 3 ? "#f2f2f2" : "#1a8a3a"),
  bangladesh: (x, y, w, h) => ((x - w * 0.42) ** 2 + (y - (h - 1) / 2) ** 2 < (h * 0.32) ** 2 + 0.6 ? "#e0202a" : "#0a6a3a"),
  puertorico: (x, y, w, h) => (x < h / 2 - Math.abs(y - (h - 1) / 2) + 1 ? (x === 1 && y === Math.floor(h / 2) ? "#f2f2f2" : "#2a5ad8") : y % 2 ? "#f2f2f2" : "#d8202a"),
  colombia: (x, y, w, h) => (y < h / 2 ? "#ffd21f" : y < (3 * h) / 4 ? "#1a3a9a" : "#d8202a"),
  turkey: (x, y, w, h) => { const d = (x - w * 0.35) ** 2 + (y - (h - 1) / 2) ** 2, e = (x - w * 0.45) ** 2 + (y - (h - 1) / 2) ** 2; return d < 3.2 && e > 1.6 ? "#f2f2f2" : x === Math.round(w * 0.65) && y === Math.floor(h / 2) ? "#f2f2f2" : "#e0102a"; },
  mexico: (x, y, w) => (x < w / 3 ? "#0a7a3a" : x < (2 * w) / 3 ? (x === Math.floor(w / 2) ? "#8a6a2a" : "#f2f2f2") : "#d8202a"),
  jamaica: (x, y, w, h) => { const a = Math.abs(y - (x * (h - 1)) / (w - 1)) < 0.8, b = Math.abs(y - ((w - 1 - x) * (h - 1)) / (w - 1)) < 0.8; return a || b ? "#ffd21f" : (x < w / 2) === (y < h / 2) && Math.abs(x - w / 2) > Math.abs(y - h / 2) * (w / h) ? "#111" : Math.abs(x - (w - 1) / 2) * (h / w) > Math.abs(y - (h - 1) / 2) ? "#111" : "#0a8a3a"; },
};
const FLAG_ORDER = ["dominican", "peru", "palestine", "bangladesh", "puertorico", "colombia", "turkey", "mexico", "jamaica"];

// a waving flag (live)
function waving(f: F, t: number, x: number, y: number, w: number, h: number, kind: string, ph = 0) {
  const fn = FLAGS[kind];
  for (let i = 0; i < w; i++) {
    const wv = Math.round(Math.sin(t * 5 + ph - i * 0.7) * 0.9 * (i / w));
    for (let j = 0; j < h; j++) f(x + i, y + j + wv, 1, 1, fn(i, j, w, h));
  }
}
function stillFlag(px: Px, x: number, y: number, w: number, h: number, kind: string) {
  const fn = FLAGS[kind];
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) px(x + i, y + j, 1, 1, fn(i, j, w, h));
}

// a walker: 3 wide, 7 tall. dir: "h" walks left-right, "v" walks up-down
type Walker = { x0: number; x1: number; y0: number; y1: number; sp: number; ph: number; skin: string; shirt: string; hair: string; pants: string; kid?: boolean; bag?: string };
function drawWalker(f: F, t: number, w: Walker) {
  const span = Math.max(Math.abs(w.x1 - w.x0), Math.abs(w.y1 - w.y0)) || 1, p = (t * w.sp + w.ph) % (2 * span), u = (p < span ? p : 2 * span - p) / span;
  const x = Math.round(w.x0 + (w.x1 - w.x0) * u), y = Math.round(w.y0 + (w.y1 - w.y0) * u), leg = Math.floor(t * 5 + w.ph) % 2;
  const k = w.kid ? 1 : 0;
  f(x, y + k, 3, 1, w.hair); f(x, y + 1 + k, 3, 1, w.skin);
  f(x, y + 2 + k, 3, 2 - k, w.shirt); f(x - 1, y + 2 + k + leg, 1, 1, w.skin); f(x + 3, y + 3 + k - leg, 1, 1, w.skin);
  f(x, y + 4, 3, 1, w.pants); f(x + leg * 2, y + 5, 1, 1, w.pants); f(x + 2 - leg * 2, y + 5, 1, 1, "#1a1a1a");
  if (w.bag) f(x + 3, y + 3, 2, 2, w.bag);
}

/* ---------- the scene ---------- */

export const SC_PATERSON: Partial<Record<string, SceneMod>> = {
  jersey: {
    ground: ["#4f7a3a", "#466f34"],
    edge: pick(eTree),
    draw: ({ ctx, px, y0, h, live, hd, canopy, says }) => {
      const raw: Px = (x, y, w, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, hh); };
      const R = (y: number) => roadX(y0 + y);
      const L = (a: number, b: number) => Math.floor(room(y0 + a, b - a).lo - 7);        // last free column left of the road
      const Rt = (a: number, b: number) => Math.ceil(room(y0 + a, b - a).hi + 7);        // first free column right of it
      const La = (a: number, b: number) => L(a - y0, b - y0), Ra = (a: number, b: number) => Rt(a - y0, b - y0);
      const walkers: Walker[] = [];
      let wseed = 3;
      const wr = () => ((wseed = (wseed * 9301 + 49297) % 233280) / 233280);
      const pickc = <T,>(a: T[]) => a[Math.floor(wr() * a.length)];
      const folk = (x0: number, y0_: number, x1: number, y1: number, kid = false, bag?: string): Walker =>
        ({ x0, y0: y0_, x1, y1, sp: 2 + wr() * 3, ph: wr() * 40, skin: pickc(SKIN), shirt: pickc(SHIRT), hair: pickc(HAIR), pants: pickc(["#2a2a3a", "#3a5a8a", "#1a1a1a", "#5a4a3a", "#2a3a6a"]), kid, bag });

      /* ===== 1. the Great Falls (left of the road, rows 0-96) ===== */
      const FX = 1, FW = Math.min(60, L(0, 96) - FX), X1 = FX + FW, fy = y0 + 2;
      const wob = (k: number, a = 1.5) => Math.round(a * Math.sin(k * 0.55) + (hash(k * 31 + 7) - 0.5) * 2);
      const lipY = fy + 18, CH = 30, poolY = lipY + 1 + CH;
      // cliff-top woods around the whole gorge
      px(FX, fy, FW, poolY + 12 - fy, "#2f6a32");
      for (let k = 0; k < 90; k++) px(FX + Math.floor(hash(k * 5 + 1) * FW), fy + Math.floor(hash(k * 7 + 2) * (poolY + 12 - fy)), 2, 1, k % 3 ? "#28602c" : "#3f7a3a");
      // the upper Passaic, sliding in from the west toward the lip
      const riverR = (r: number) => X1 - 4 + wob(r) - (r < 4 ? (4 - r) * 3 : 0);
      for (let r = 0; r < 18; r++) {
        const y = fy + r, xe = riverR(r), c = r < 6 ? "#2a62a0" : r < 12 ? "#3a7ac0" : "#4a8ad0";
        px(0, y, xe, 1, c); px(xe, y, 1, 1, "#7a7062");
        if (r === 0) px(0, y, xe, 1, "#7a7062");
      }
      for (const [dx, dy] of [[6, 7], [19, 10], [33, 5], [45, 11], [12, 14], [28, 15]]) { px(FX + dx, fy + dy, 3, 2, "#3a3630"); px(FX + dx, fy + dy, 2, 1, "#5a564e"); }
      live.push({ k: "fn", fn: (f, t) => {                                       // the current, speeding up toward the edge
        for (let k = 0; k < 26; k++) { const r = 2 + Math.floor(hash(k * 3) * 15), len = 3 + (r > 10 ? 3 : 0), x = ((t * (8 + r) + hash(k) * 99) % (riverR(r) + 6)) - 6; if (x > 0 && x + len < riverR(r)) f(x, fy + r, len, 1, r > 12 ? "#9ad0f0" : "#6aa8e0"); }
      } });
      // the lip: basalt knobs, water pouring over in three sheets
      const POUR: [number, number][] = [[FX + 5, FX + 18], [FX + 21, FX + 38], [FX + 41, X1 - 7]];
      px(FX + 3, lipY - 1, FW - 7, 2, "#1f1d1a");
      for (const [a2, b2] of POUR) { px(a2, lipY - 1, b2 - a2, 1, "#e8f6ff"); px(a2, lipY, b2 - a2, 1, "#bfe2f8"); }
      // the chasm: jagged basalt walls, the curtain, rock fins splitting the sheets
      const xl = (c: number) => FX + 4 + wob(c + 50) + (c > 20 ? Math.floor((c - 20) / 2) : 0);
      const xr = (c: number) => X1 - 5 + wob(c + 90) - (c > 22 ? Math.floor((c - 22) / 2) : 0);
      const fin = (c: number, x: number) => c < 14 && POUR.slice(0, 2).some(([, b2]) => x >= b2 && x < b2 + 3 - Math.floor(c / 6));
      for (let c = 0; c < CH; c++) {
        const y = lipY + 1 + c, l = xl(c), r = xr(c), g = c / CH;
        px(l - 4, y, 4, 1, "#24221e"); px(r, y, 4, 1, "#24221e");
        px(l - 4, y, 1, 1, "#3a3630"); px(r + 3, y, 1, 1, "#3a3630");
        if (hash(c * 13) > 0.55) px(l - 3 + Math.floor(hash(c) * 2), y, 1, 1, "#2f5a2a");
        if (hash(c * 17) > 0.55) px(r + 1 + Math.floor(hash(c + 9) * 2), y, 1, 1, "#2f5a2a");
        for (let x = l; x < r; x++) px(x, y, 1, 1, fin(c, x) ? (x % 2 ? "#2a2824" : "#3a3630") : g < 0.25 ? "#5aa0d8" : g < 0.6 ? "#8ac4ec" : g < 0.85 ? "#c8e6fa" : "#eef8ff");
      }
      live.push({ k: "fn", fn: (f, t, c2) => {                                   // white water falling, churning at the bottom
        for (let x = xl(0); x < xr(0); x++) for (let k = 0; k < 2; k++) {
          const c = Math.floor((t * 26 + hash(x * 7 + k * 101) * CH) % CH);
          if (fin(c, x) || x < xl(c) || x >= xr(c)) continue;
          f(x, lipY + 1 + c, 1, 2 + (c > 12 ? 1 : 0), c > 18 ? "#ffffff" : "#e0f2ff");
        }
        for (let k = 0; k < 22; k++) { const u = (t * 0.9 + hash(k * 5)) % 1, x = xl(CH - 2) + hash(k * 11) * (xr(CH - 2) - xl(CH - 2) - 3); c2.globalAlpha = 1 - u; f(x, poolY - 3 + u * 4, 3, 2, "#ffffff"); c2.globalAlpha = 1; }
      } });
      // the plunge pool
      const pcx = FX + FW / 2, prx = FW / 2 - 4;
      for (let k = 0; k < 11; k++) { const ww = Math.round(prx * Math.sqrt(1 - ((k - 3) / 8) ** 2)); px(pcx - ww, poolY + k, 2 * ww, 1, k < 2 ? "#eef8ff" : k < 4 ? "#7ab8e8" : "#2f6fb0"); px(pcx - ww - 1, poolY + k, 1, 1, "#3a3630"); px(pcx + ww, poolY + k, 1, 1, "#3a3630"); }
      for (let k = 0; k < 6; k++) px(pcx - prx + 6 + k * 8, poolY + 5 + (k % 3), 4, 1, "#9ad0f0");
      live.push({ k: "fn", fn: (f, t, c) => {
        for (let k = 0; k < 44; k++) {                                            // spray boiling up off the pool
          const u = (t * 0.35 + hash(k * 17)) % 1, x = pcx - prx + hash(k * 3) * prx * 2 + Math.sin(t + k) * 2, y = poolY + 3 - u * 18;
          c.globalAlpha = 0.5 * (1 - u); f(x, y, 2 + (k % 3), 2, "#ffffff"); c.globalAlpha = 1;
        }
        c.globalAlpha = 0.32 + 0.18 * Math.sin(t * 0.8);                           // the rainbow in the spray
        const RB = ["#ff3b3b", "#ff8a1f", "#ffd23f", "#2faa4a", "#3a6fd8", "#7a3ad8"];
        for (let b2 = 0; b2 < 6; b2++) for (let a2 = 0; a2 < 46; a2++) {
          const th = Math.PI * (0.1 + 0.8 * a2 / 45);
          f(pcx + Math.round((prx - 3 - b2) * Math.cos(th)), poolY + 7 - Math.round((14 - b2) * Math.sin(th)), 1, 1, RB[b2]);
        }
        c.globalAlpha = 1;
      } });
      // the Wesley Mathews footbridge, spanning the chasm right in front of the falls
      const bY = lipY + 9;
      px(FX + 1, bY, FW - 2, 3, "#4a4a52"); px(FX + 1, bY, FW - 2, 1, "#a8a8b0"); px(FX + 1, bY + 2, FW - 2, 1, "#2a2a32");
      for (let x = FX + 2; x < X1 - 2; x += 3) px(x, bY - 1, 1, 1, "#8a8a92");
      for (let x = xl(9); x < xr(9); x++) { const u = (x - xl(9)) / (xr(9) - xl(9)); px(x, bY + 3 + Math.round(Math.sin(Math.PI * u) * -1 + 2), 1, 1, "#3a3a42"); }
      for (let k = 0; k < 4; k++) walkers.push({ ...folk(FX + 3, bY - 6, X1 - 6, bY - 6), sp: 2 + k });
      // trees on the cliff tops, both sides of the gorge
      for (let k = 0; k < 6; k++) { const c = 4 + k * 5; pine(px, xl(c) - 9 + (k % 2) * 2, lipY + c - 3, "#1f4a26"); if (xr(c) + 6 < X1) pine(px, xr(c) + 5, lipY + c - 2, "#1f4a26"); }
      // the river finds its way out of the pool, down the west side to the bridge
      for (let y = poolY + 9; y < y0 + 100; y++) { const x = FX + 1 + Math.round(Math.sin(y / 5)); px(x, y, 5, 1, "#2f6fb0"); px(x + 1, y, 1, 1, "#5f9fe0"); }
      // Overlook Park above the falls: a quinceañera photo shoot with the falls behind her; picnic tables
      const opY = poolY + 12;
      px(FX + 7, opY, FW - 7, y0 + 97 - opY, "#5a9a45");
      for (let k = 0; k < 60; k++) px(FX + 7 + Math.floor(hash(k * 5) * (FW - 7)), opY + Math.floor(hash(k * 9) * 30), 1, 1, "#4f8a3c");
      px(FX + 7, opY, FW - 7, 1, "#8a8278");                                              // stone rail along the overlook
      for (let x = FX + 7; x < FX + FW; x += 4) px(x, opY - 1, 1, 2, "#a8a096");
      { const qx = FX + 20, qy = opY + 6;                                          // the quinceañera: a huge turquoise ball gown, a tiara
        for (let r = 0; r < 9; r++) { const ww = 3 + Math.round(r * 1.3); px(qx + 2 - Math.floor(ww / 2), qy + 5 + r, ww, 1, r % 3 === 2 ? "#5ae0d8" : "#2ac8c0"); }
        px(qx - 4, qy + 13, 13, 1, "#1aa8a0");
        px(qx + 1, qy + 2, 3, 3, "#c08a5a"); px(qx + 1, qy + 1, 3, 1, "#1a1a1a"); px(qx, qy + 2, 1, 4, "#1a1a1a"); px(qx + 4, qy + 2, 1, 4, "#1a1a1a");
        px(qx + 1, qy, 3, 1, "#ffd23f"); px(qx + 2, qy - 1, 1, 1, "#fff6c0");
        px(qx + 1, qy + 5, 3, 2, "#2ac8c0"); px(qx - 1, qy + 5, 1, 2, "#c08a5a"); px(qx + 5, qy + 5, 1, 2, "#c08a5a"); px(qx + 6, qy + 4, 2, 2, "#ff5ad1");   // a bouquet
        // her court in matching ties, her mom fixing the train
        for (let k = 0; k < 3; k++) person(px, [qx - 11, qx - 7, qx + 11][k], qy + 3, "#1a1a1a", "#1a1a1a", "#1a1a1a", ["#c08a5a", "#8a5a3a", "#e0b090"][k]);
        person(px, qx + 7, qy + 9, "#ff5ad1", "#1a1a1a", "#2a2a3a", "#c08a5a");
        // the photographer crouched in front with the flash going off
        const cx = qx + 3, cy = qy + 18;
        person(px, cx, cy, "#2a2a2a", "#3a2a1a", "#2a2a3a", "#8a5a3a"); px(cx - 1, cy + 2, 2, 2, "#1a1a1a");
        live.push({ k: "fn", fn: (f, t, c) => { const p2 = (t * 0.7) % 1; if (p2 < 0.08) { c.globalAlpha = 1 - p2 / 0.08; f(cx - 3, cy - 1, 5, 5, "#ffffff"); f(qx - 3, qy - 2, 12, 16, "rgba(255,255,255,0.35)"); c.globalAlpha = 1; } } });
      }
      for (const [dx, dy] of [[9, 4], [30, 28], [9, 28]]) { px(FX + dx, opY + dy, 7, 3, "#8a5a32"); px(FX + dx, opY + dy - 1, 7, 1, "#a06a3a"); px(FX + dx + 1, opY + dy + 3, 1, 1, "#5a3a1a"); px(FX + dx + 5, opY + dy + 3, 1, 1, "#5a3a1a"); }
      walkers.push(folk(FX + 53, opY + 9, FX + 55, opY + 24), folk(FX + 40, opY + 2, FX + 40, opY + 14, true), folk(FX + 31, opY + 2, FX + 46, opY + 2));
      // a family on a blanket
      px(FX + 43, opY + 24, 8, 5, "#e0302f"); px(FX + 43, opY + 26, 8, 1, "#f2f2f2");
      person(px, FX + 44, opY + 20, "#ffd23f", "#1a1a1a", "#2a2a3a", "#c08a5a"); person(px, FX + 48, opY + 21, "#3a6fd8", "#3a2a1a", "#2a2a3a", "#8a5a3a");

      /* ===== a block party on the street across from the falls ===== */
      { const sx = Rt(4, 60), sw = Math.min(40, W - 2 - sx), sy = y0 + 6;
        if (sw > 24) {
          // a row of three-family houses with stoops
          for (let k = 0; k * 10 + 9 <= sw; k++) {
            const hx = sx + k * 10, c = ["#e8d8b8", "#5a7aa8", "#c8a040", "#a8503a"][k % 4];
            px(hx, sy, 9, 18, c); px(hx, sy, 9, 2, "#4a3a2a"); px(hx + 1, sy + 2, 7, 1, shadeC(c));
            for (let r = sy + 4; r < sy + 14; r += 5) { px(hx + 1, r, 2, 3, "#cfe8ff"); px(hx + 6, r, 2, 3, "#cfe8ff"); }
            px(hx + 3, sy + 13, 3, 5, "#4a2a1a"); px(hx + 2, sy + 18, 5, 2, "#9a9a92");      // door, stoop
          }
          // the street, closed off with sawhorses, music going
          const ry = sy + 22;
          px(sx, ry, sw, 30, "#5a5a5e"); px(sx, ry, sw, 1, "#a8a8a8"); px(sx, ry + 29, sw, 1, "#a8a8a8");
          for (const bx2 of [sx + 1, sx + sw - 6]) { px(bx2, ry + 12, 5, 1, "#ff8a1f"); px(bx2, ry + 13, 5, 1, "#f2f2f2"); px(bx2, ry + 14, 1, 2, "#8a8a8a"); px(bx2 + 4, ry + 14, 1, 2, "#8a8a8a"); }
          // the grill, smoke drifting off it; a folding table of food; the speakers
          const gx = sx + 3, gy = ry + 3;
          px(gx, gy, 6, 3, "#1a1a1a"); px(gx + 1, gy + 1, 4, 1, "#ff6a1a"); px(gx + 1, gy + 3, 1, 2, "#3a3a3a"); px(gx + 4, gy + 3, 1, 2, "#3a3a3a");
          person(px, gx + 7, gy - 1, "#f2f2f2", "#e0302f", "#2a2a3a", "#8a5a3a");
          live.push({ k: "fn", fn: (f, t, c) => { for (let k = 0; k < 8; k++) { const u = (t * 0.25 + k / 8) % 1; c.globalAlpha = 0.5 * (1 - u); f(gx + 2 + u * 10 + Math.sin(u * 7 + k) * 2, gy - 2 - u * 12, 2 + Math.floor(u * 3), 2, "#d8d8dc"); c.globalAlpha = 1; } } });
          const tx = sx + 14; px(tx, ry + 4, 12, 3, "#f2f2f2");
          for (let k = 0; k < 5; k++) px(tx + 1 + k * 2, ry + 4, 1, 1, ["#ffd23f", "#e0302f", "#2faa4a", "#8a5a2a", "#ff8a1f"][k]);
          const spx = sx + sw - 5;
          live.push({ k: "fn", fn: (f, t) => { const b = Math.floor(t * 4) % 2; for (const yy of [ry + 2, ry + 20]) { f(spx, yy, 4, 6, "#1a1a1a"); f(spx + 1, yy + 1 - b, 2, 2 + b, "#5a5a5a"); f(spx + 1, yy + 4, 2, 1, "#3a3a3a"); } } });
          // dancers: bachata, a whole line of them, and kids with a jump rope
          live.push({ k: "fn", fn: (f, t) => {
            for (let k = 0; k < 6; k++) {
              const bx2 = sx + 6 + (k % 3) * 9 + Math.round(Math.sin(t * 3 + k) * 2), by2 = ry + 10 + Math.floor(k / 3) * 8 + Math.round(Math.cos(t * 6 + k) * 0.6);
              f(bx2, by2, 2, 1, HAIR[k % HAIR.length]); f(bx2, by2 + 1, 2, 1, SKIN[(k * 2) % SKIN.length]); f(bx2, by2 + 2, 2, 2, SHIRT[(k * 3 + 1) % SHIRT.length]);
              const st = Math.floor(t * 6 + k) % 2; f(bx2 + st, by2 + 4, 1, 1, "#2a2a3a"); f(bx2 + 1 - st, by2 + 4, 1, 1, "#2a2a3a");
            }
            const jx = sx + 4, jy = ry + 22, a = t * 7;                   // double dutch
            f(jx, jy, 1, 3, "#c08a5a"); f(jx + 12, jy, 1, 3, "#8a5a3a");
            for (let x = 1; x < 12; x++) f(jx + x, jy + 1 + Math.round(Math.sin((x / 12) * Math.PI) * 3 * Math.cos(a)), 1, 1, "#ffd23f");
            f(jx + 5, jy - Math.max(0, Math.round(Math.sin(a) * 2)), 2, 3, "#ff5ad1");
          } });
        }
        // row houses with laundry lines below the party
        const hy0 = y0 + 68;
        for (let k = 0; k < 4; k++) {
          const hx = sx + k * 9; if (hx + 8 > W - 1) break;
          const c = ["#a8503a", "#e8d8b8", "#5a7aa8", "#c8a040"][k];
          px(hx, hy0, 8, 12, c); px(hx, hy0, 8, 2, "#5a3a2a"); px(hx + 1, hy0 + 4, 2, 2, "#cfe8ff"); px(hx + 5, hy0 + 4, 2, 2, "#cfe8ff"); px(hx + 3, hy0 + 8, 2, 4, "#5a3a1a");
          px(hx + 1, hy0 + 2, 6, 1, shadeC(c));
        }
        // laundry line between the houses and a pole, shirts flapping
        live.push({ k: "fn", fn: (f, t) => {
          const lx = sx, ly = hy0 + 17, lw = Math.min(34, W - 2 - sx);
          f(lx, ly, lw, 1, "#5a5a5a"); f(lx, ly - 2, 1, 8, "#8a6a42"); f(lx + lw - 1, ly - 2, 1, 8, "#8a6a42");
          for (let k = 0; k < 6; k++) {
            const x = lx + 2 + k * 5, sw = Math.round(Math.sin(t * 3 + k) * 0.8), c = SHIRT[(k * 3) % SHIRT.length];
            f(x, ly, 1, 1, "#d8d8d8"); f(x + 4, ly, 1, 1, "#d8d8d8");                     // clothespins
            if (k % 3 === 2) { f(x + 1 + sw, ly + 1, 3, 1, "#3a5a8a"); f(x + 1 + sw, ly + 2, 1, 3, "#3a5a8a"); f(x + 3 + sw, ly + 2, 1, 3, "#3a5a8a"); }   // jeans
            else { f(x + sw, ly + 1, 5, 1, c); f(x + 1 + sw, ly + 2, 3, 3, c); }          // a T-shirt
          }
        } });
        // an open fire hydrant, kids running through the spray
        { const hx = sx + 3, hy = hy0 + 22;
          px(hx, hy, 2, 3, "#e0302f"); px(hx - 1, hy + 1, 4, 1, "#c8202a");
          live.push({ k: "fn", fn: (f, t, c) => {
            for (let k = 0; k < 26; k++) { const u = (t * 1.6 + hash(k * 7)) % 1, x = hx + 3 + u * 16, y = hy + 1 - Math.sin(u * Math.PI) * 5 + hash(k) * 2; c.globalAlpha = 0.85 - u * 0.5; f(x, y, 1, 1, k % 3 ? "#bfe6ff" : "#ffffff"); c.globalAlpha = 1; }
            c.globalAlpha = 0.5; f(hx + 10, hy + 4, 12, 2, "#5f9fe0"); c.globalAlpha = 1;
          } });
          for (let k = 0; k < 3; k++) walkers.push({ ...folk(hx + 6, hy - 2, hx + 22, hy - 2, true), sp: 4 + k * 2 });
        }
      }

      /* ===== 2. the Passaic, out of the gorge and under the road (rows 96-106) ===== */
      const rvY = y0 + 98;
      // channel from the pool down to the river, along the left edge of Overlook Park
      for (let x = 0; x < W; x++) {
        const wob = Math.round(Math.sin(x / 9) * 1.5);
        raw(x, rvY + wob, 1, 9, "#2f6fb0"); raw(x, rvY + wob, 1, 1, "#5f9fe0"); raw(x, rvY + wob + 8, 1, 1, "#2a5a8a");
      }
      for (let yy = rvY - 3; yy < rvY + 12; yy++) { const x = roadX(yy); raw(x - 6, yy, 13, 1, "#8a8a92"); raw(x - 4, yy, 9, 1, "#3a3a3e"); raw(x - 4, yy, 1, 1, "#e8e8e8"); raw(x + 4, yy, 1, 1, "#e8e8e8"); if (yy % 6 < 3) raw(x, yy, 1, 1, "#ffd23f"); }
      live.push({ k: "glint", x: 0, y: rvY + 1, w: W, h: 7 });
      // a kayak on the river
      live.push({ k: "fn", fn: (f, t) => { const x = ((t * 4) % (W + 20)) - 10; if (Math.abs(x - roadX(rvY + 4)) > 8) { f(x, rvY + 4, 6, 2, "#ffd23f"); f(x + 2, rvY + 3, 2, 1, "#e0302f"); f(x + 1 + Math.round(Math.sin(t * 6)), rvY + 2, 1, 5, "#8a6a42"); } } });

      /* ===== 3. the mill district on the raceways, right of the road (rows 108-205) ===== */
      const mx0 = Rt(108, 205), mw = W - 2 - mx0, my = y0 + 116;
      { // the upper raceway: a stone canal running down the mills
        const rx = mx0;
        for (let y = rvY + 8; y < y0 + 204; y++) { px(rx, y, 6, 1, "#8a7a6a"); px(rx + 1, y, 4, 1, "#3a7ac0"); if (y % 9 === 0) px(rx, y, 6, 1, "#6a5a4a"); }
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 14; k++) { const y = rvY + 8 + ((t * 12 + k * 7) % (y0 + 196 - rvY)); f(rx + 1 + (k % 4), y, 1, 2, "#9ad0f0"); } } });
        // mills: long red-brick buildings with arched windows, smokestacks
        const mill = (x: number, y: number, w: number, hh: number, c = "#9a3a26") => {
          px(x, y - 3, w, 3, "#6a2418"); for (let k = x + 2; k < x + w - 2; k += 4) px(k, y - 2, 2, 1, "#9ad0e8");   // monitor roof, skylights
          px(x, y, w, hh, c); px(x, y, w, 2, "#5a2a1a");
          for (let r = y + 3; r < y + hh - 2; r += 4) for (let cx = x + 1; cx < x + w - 1; cx += 3) { px(cx, r, 2, 2, "#e8d080"); px(cx, r, 2, 1, "#5a2a1a"); }
          for (let r = y + 2; r < y + hh; r += 4) px(x, r, w, 1, "#8a3222");
        };
        const bx = rx + 8, bw = Math.min(mw - 8, 46);
        // the old mill lot: a blacktop court, pickup game going, a mural on the mill wall behind it
        { const cy0 = my - 6, cw = bw - 2;
          px(bx, cy0, cw, 26, "#3a3a40"); px(bx + 1, cy0 + 1, cw - 2, 24, "#4a4a52");
          px(bx + 1, cy0 + 12, cw - 2, 1, "#e8e8e8"); px(bx + 1, cy0 + 1, cw - 2, 1, "#e8e8e8"); px(bx + 1, cy0 + 24, cw - 2, 1, "#e8e8e8");
          for (const [hy, d] of [[cy0 + 2, 1], [cy0 + 23, -1]] as const) { const hx = bx + Math.floor(cw / 2) - 3; px(hx, hy, 7, 1, "#f2f2f2"); px(hx + 2, hy + d, 3, 1, "#ff6a1a"); for (let r = 0; r < 4; r++) px(hx + 1 + (r % 2), hy + d * (2 + r), 5 - (r % 2) * 2, 1, "#e8e8e8"); }
          // the mural: a big painted sun and a face, all color
          const my2 = cy0 - 14, mx2 = Math.max(bx, Ra(my2 - 1, my2 + 14));
          const mw2 = bx + cw - mx2;
          px(mx2, my2, mw2, 13, "#9a3a26"); px(mx2, my2, mw2, 1, "#6a2418");
          const MC = ["#ffd23f", "#ff5ad1", "#2ac8c0", "#ff8a1f", "#7a3ad8", "#2faa4a"];
          for (let x = 1; x < mw2 - 1; x++) px(mx2 + x, my2 + 9 + Math.round(Math.sin(x / 3) * 1.5), 1, 3, MC[Math.floor(x / 5) % MC.length]);
          for (let a = 0; a < 12; a++) { const th = (a / 12) * Math.PI * 2; px(mx2 + 8 + Math.round(Math.cos(th) * 4), my2 + 6 + Math.round(Math.sin(th) * 4), 1, 1, "#ffd23f"); }
          px(mx2 + 6, my2 + 4, 5, 5, "#ff8a1f"); px(mx2 + 7, my2 + 5, 1, 1, "#1a1a1a"); px(mx2 + 9, my2 + 5, 1, 1, "#1a1a1a");
          px(mx2 + mw2 - 16, my2 + 2, 8, 7, "#8a5a3a"); px(mx2 + mw2 - 16, my2 + 2, 8, 2, "#1a1a1a"); px(mx2 + mw2 - 14, my2 + 5, 1, 1, "#f2f2f2"); px(mx2 + mw2 - 11, my2 + 5, 1, 1, "#f2f2f2"); px(mx2 + mw2 - 14, my2 + 7, 4, 1, "#e0302f");
          live.push({ k: "fn", fn: (f, t) => {                                  // five on five-ish, the ball going up
            const bxx = bx + cw / 2 + Math.sin(t * 0.9) * (cw / 2 - 5), byy = cy0 + 12 + Math.sin(t * 0.6) * 9;
            for (let k = 0; k < 8; k++) {
              const x = Math.max(bx + 2, Math.min(bx + cw - 4, bxx + Math.sin(t * 1.3 + k * 1.9) * (4 + k))), y = Math.max(cy0 + 2, Math.min(cy0 + 20, byy + Math.cos(t + k * 2.1) * (3 + k * 0.7)));
              f(x, y, 2, 1, "#1a1a1a"); f(x, y + 1, 2, 2, k % 2 ? "#f2f2f2" : "#e0302f"); f(x + (Math.floor(t * 6 + k) % 2), y + 3, 1, 1, SKIN[k % SKIN.length]);
            }
            const up = Math.abs(Math.sin(t * 3)) * 4; f(bxx, byy - up, 2, 2, "#ff7a1a");
          } });
        }
        // the bell-tower mill
        const tx = bx + bw - 9, ty = my + 38;
        mill(bx, ty, bw - 10, 20, "#a8442a");
        px(tx, ty - 8, 9, 30, "#9a3a26"); px(tx + 1, ty - 12, 7, 4, "#e8e2d0"); px(tx + 2, ty - 15, 5, 3, "#2f8a6a"); px(tx + 4, ty - 17, 1, 2, "#ffd23f");
        px(tx + 2, ty - 6, 5, 5, "#f2f2f2"); px(tx + 4, ty - 5, 1, 2, "#111"); px(tx + 4, ty - 4, 2, 1, "#111");   // a clock
        // the Ivanhoe wheelhouse: a water wheel turning in the raceway
        live.push({ k: "fn", fn: (f, t) => {
          const cx = rx + 3, cy = ty + 12, a0 = t * 1.6;
          for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; f(cx + Math.round(Math.cos(a) * 6), cy + Math.round(Math.sin(a) * 6), 1, 1, "#5a3a1a"); }
          for (let k = 0; k < 8; k++) { const a = a0 + (k * Math.PI) / 4; for (let r = 1; r <= 5; r++) f(cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r), 1, 1, "#a07a4a"); f(cx + Math.round(Math.cos(a) * 7), cy + Math.round(Math.sin(a) * 7), 1, 1, "#c89a5a"); }
          f(cx - 1, cy - 1, 3, 3, "#3a2a1a");
          for (let k = 0; k < 5; k++) { const u = (t * 1.5 + k / 5) % 1; f(cx - 6 + Math.round(u * 3), cy + 5 + Math.round(u * 4), 1, 1, "#e8f8ff"); }
        } });
        // Paterson Museum = the old Rogers locomotive erecting shop, a steam engine out front
        const pmY = ty + 26;
        mill(bx, pmY, bw, 14, "#8a3a2a");
        sign(px, bx + 2, pmY + 4, bw - 4, "MUSEUM", "#ffd23f", "#3a1a10");
        const ly = pmY + 18;
        px(bx, ly + 5, bw, 1, "#5a4a3a"); px(bx, ly + 7, bw, 1, "#5a4a3a"); for (let x = bx; x < bx + bw; x += 2) px(x, ly + 5, 1, 3, "#6a5a4a");
        { const lx = bx + 6;                                                   // the locomotive, side-on
          px(lx, ly, 18, 5, "#1a1a1a"); px(lx + 13, ly - 4, 6, 9, "#1a1a1a"); px(lx + 14, ly - 3, 3, 2, "#e8d080");
          px(lx + 2, ly - 3, 2, 3, "#1a1a1a"); px(lx + 1, ly - 4, 4, 1, "#2a2a2a"); px(lx + 6, ly - 1, 3, 1, "#c8a030");
          px(lx - 2, ly + 2, 2, 3, "#e0302f"); for (const wx of [lx + 2, lx + 8, lx + 14]) { px(wx, ly + 4, 3, 3, "#e0302f"); px(wx + 1, ly + 5, 1, 1, "#1a1a1a"); }
          live.push({ k: "fn", fn: (f, t, c) => { for (let k = 0; k < 6; k++) { const u = (t * 0.4 + k / 6) % 1; c.globalAlpha = 0.6 * (1 - u); f(lx + 2 - u * 6, ly - 5 - u * 9, 2 + Math.floor(u * 3), 2, "#e8e8ec"); c.globalAlpha = 1; } } });
          px(lx + 20, ly - 2, 1, 7, "#cfcfcf"); }
        walkers.push(folk(bx + 2, ty - 9, bx + bw - 12, ty - 9, true), folk(bx + 3, ty - 9, bx + bw - 14, ty - 9));
      }

      /* ===== Lou Costello Memorial Park, left of the road (rows 108-200) ===== */
      { const cx1 = L(108, 200), cw = cx1 - 2, cy = y0 + 112;
        if (cw > 18) {
          px(2, cy, cw, 52, "#5aa045"); for (let k = 0; k < 40; k++) px(2 + Math.floor(hash(k * 3 + 5) * cw), cy + Math.floor(hash(k * 7 + 1) * 52), 1, 1, "#4f9040");
          px(2, cy, cw, 1, "#8a8278"); px(2, cy + 51, cw, 1, "#8a8278");
          // the statue: bowler hat, bat on his shoulder
          const sx = 2 + Math.floor(cw / 2) - 3, sy = cy + 6;
          px(sx - 2, sy + 12, 10, 4, "#a8a8a0"); px(sx - 1, sy + 11, 8, 1, "#c8c8c0");
          px(sx, sy, 5, 1, "#3a3a32"); px(sx + 1, sy - 1, 3, 1, "#3a3a32");      // bowler
          px(sx + 1, sy + 1, 3, 2, "#8a7a5a"); px(sx, sy + 3, 5, 5, "#6a5a3a"); px(sx + 1, sy + 8, 1, 3, "#5a4a2a"); px(sx + 3, sy + 8, 1, 3, "#5a4a2a");
          for (let k = 0; k < 6; k++) px(sx + 4 + k, sy + 2 - Math.floor(k / 2), 1, 1, "#8a6a3a");   // the bat
          sign(px, 2 + Math.floor((cw - 35) / 2), sy + 17, 35, "WHO'S ON", "#ffd23f", "#2a2a2a"); sign(px, 2 + Math.floor((cw - 35) / 2), sy + 23, 35, "FIRST?", "#ffd23f", "#2a2a2a");
          // a little sandlot diamond, a kid at bat
          const dy = cy + 36, dx = 2 + Math.floor(cw / 2);
          for (let k = 0; k <= 6; k++) { px(dx - k, dy + k, 1, 1, "#c8a070"); px(dx + k, dy + k, 1, 1, "#c8a070"); px(dx - 6 + k, dy + 6 + k, 1, 1, "#c8a070"); px(dx + 6 - k, dy + 6 + k, 1, 1, "#c8a070"); }
          for (const [ox, oy] of [[0, 0], [-6, 6], [6, 6], [0, 12]]) px(dx + ox, dy + oy, 1, 1, "#f2f2f2");
          live.push({ k: "fn", fn: (f, t) => {
            const p = (t * 0.6) % 1, swing = p > 0.45 && p < 0.55;
            f(dx - 1, dy + 11, 3, 3, "#e0302f"); f(dx - 1, dy + 10, 3, 1, "#1a3a8a");
            if (swing) f(dx + 2, dy + 11, 3, 1, "#8a6a42"); else f(dx + 2, dy + 9, 1, 3, "#8a6a42");
            const bx = p < 0.5 ? dx : dx + (p - 0.5) * 30, by = p < 0.5 ? dy + 1 + p * 20 : dy + 11 - (p - 0.5) * 50;
            f(bx, by, 1, 1, "#ffffff");
            f(dx - 1, dy - 1 + Math.round(Math.sin(t * 3)), 3, 2, "#2faa4a");     // the pitcher
          } });
        }
        // brick walk-ups with fire escapes below the park
        for (let k = 0; k < 4; k++) {
          const hx = 2 + k * 9, hy = cy + 56; if (hx + 8 > cx1) break;
          px(hx, hy, 8, 30, ["#9a4a32", "#7a5a4a", "#a8603a", "#6a4a3a"][k]); px(hx, hy, 8, 1, "#3a2a1a");
          for (let r = hy + 3; r < hy + 28; r += 5) { px(hx + 1, r, 2, 2, "#cfe8ff"); px(hx + 5, r, 2, 2, "#cfe8ff"); px(hx, r + 2, 8, 1, "#2a2a2a"); }
          if (k % 2 === 0) stillFlag(px, hx + 2, hy - 4, 5, 3, ["dominican", "peru"][k / 2]);
        }
      }

      /* ===== 4. downtown (rows 200-312): City Hall, Lambert Castle up the hill, Main Street across the road ===== */
      // the food trucks, left of the road: chimi, anticuchos on the grill, a halal cart; picnic tables, a line
      { const cL = L(200, 244), cw = Math.min(54, cL - 4), cx = Math.max(2, cL - cw - 1), cy = y0 + 206;
        px(cx - 1, cy, cw + 2, 34, "#8a8a86"); for (let x = cx; x < cx + cw; x += 6) px(x, cy + 15, 3, 1, "#e8e8e8");
        const TRUCKS: [string, string, string][] = [["CHIMI", "#ffd23f", "#2a5ad8"], ["TACOS", "#f2f2f2", "#d8102a"], ["HALAL", "#f2f2f2", "#0a6a3a"]];
        TRUCKS.forEach(([nm, fg, bg], k) => {
          const tx = cx + 1 + k * 23; if (tx + 21 > cx + cw) return;
          px(tx, cy + 2, 21, 11, bg); px(tx, cy + 2, 21, 1, shadeC(bg)); px(tx + 16, cy + 3, 5, 4, "#9ad0f0");
          px(tx + 1, cy + 7, 10, 4, "#2a2a2a"); px(tx + 2, cy + 8, 8, 2, "#ffe9a0");                      // the serving window
          sign(px, tx, cy - 5, 21, nm, fg, "#1a1a1a");
          px(tx + 2, cy + 13, 3, 2, "#1a1a1a"); px(tx + 15, cy + 13, 3, 2, "#1a1a1a");
          live.push({ k: "fn", fn: (f, t, c) => { for (let q = 0; q < 5; q++) { const u = (t * 0.3 + q / 5 + k * 0.3) % 1; c.globalAlpha = 0.45 * (1 - u); f(tx + 4 + u * 4 + Math.sin(u * 6 + q) * 2, cy + 1 - u * 10, 2, 2, "#e8e8ec"); c.globalAlpha = 1; } } });
          for (let q = 0; q < 3; q++) walkers.push({ ...folk(tx + 2 + q * 4, cy + 17, tx + 3 + q * 4, cy + 19, q === 2, q === 0 ? "#f2f2f2" : undefined), sp: 0.4 });   // the line
        });
        for (let k = 0; k * 13 + 10 <= cw; k++) {                                      // picnic tables, people eating
          const px2 = cx + 2 + k * 13, py2 = cy + 26;
          px(px2, py2, 10, 3, "#8a5a32"); px(px2, py2 - 1, 10, 1, "#a06a3a"); px(px2 + 1, py2 + 3, 1, 1, "#5a3a1a"); px(px2 + 8, py2 + 3, 1, 1, "#5a3a1a");
          px(px2 + 2, py2 + 1, 2, 1, "#f2f2f2"); px(px2 + 6, py2 + 1, 2, 1, "#ffd23f");
          person(px, px2 - 1, py2 - 6, SHIRT[(k * 4) % SHIRT.length], HAIR[k % HAIR.length], "#2a2a3a", SKIN[(k * 3) % SKIN.length]);
          person(px, px2 + 7, py2 - 6, SHIRT[(k * 4 + 2) % SHIRT.length], HAIR[(k + 2) % HAIR.length], "#2a2a3a", SKIN[(k * 3 + 1) % SKIN.length]);
        }
      }
      // Garret Mountain + Lambert Castle, right of the road
      { const gx = Rt(204, 244), gw = W - 1 - gx, gy = y0 + 204;
        for (let y = 0; y < 40; y++) {
          const edge = Math.min(gw, Math.round(gw * (0.5 + 0.5 * Math.sin((Math.PI * y) / 40)) + Math.sin(y / 3) * 1.5));
          px(W - 1 - edge, gy + y, edge + 1, 1, y % 7 === 0 ? "#2f6a32" : "#3a7a3a"); px(W - 1 - edge, gy + y, 1, 1, "#6a6058");
        }
        for (let k = 0; k < 7; k++) pine(px, W - 4 - Math.floor(hash(k * 13) * 8), gy + 4 + k * 5, "#1f5a2a");
        const cx = W - 16 - Math.min(26, gw - 18), cy = gy + 16;
        px(cx, cy, 22, 13, "#8a8a82"); for (let x = cx; x < cx + 22; x += 2) px(x, cy - 1, 1, 1, "#8a8a82");
        for (let r = cy + 2; r < cy + 13; r += 3) for (let x = cx + (r % 2); x < cx + 22; x += 4) px(x, r, 2, 1, "#7a7a72");
        px(cx - 3, cy - 6, 7, 19, "#9a9a92"); for (let x = cx - 3; x < cx + 4; x += 2) px(x, cy - 7, 1, 1, "#9a9a92");
        px(cx - 1, cy - 2, 2, 3, "#2a2a3a"); for (const wx of [6, 12, 17]) px(cx + wx, cy + 4, 2, 3, "#2a2a3a");
        px(cx + 8, cy + 8, 4, 5, "#4a3a2a");
        walkers.push(folk(W - 7, cy - 4, W - 7, cy + 10));
      }

      // Main Street crosses the highway: shops on both sides of it, both sides of the road
      const SHOPS: [string, string, string][] = [   // sign, sign color, facade
        ["PANADERIA", "#ffd23f", "#e0302f"], ["KNAFEH", "#f2f2f2", "#1a8a3a"], ["POLLO", "#ffd23f", "#c8202a"], ["BARBER", "#e0302f", "#2a3a8a"],
        ["HALAL", "#f2f2f2", "#0a6a3a"], ["BAKLAVA", "#e0102a", "#f2c860"], ["CEVICHE", "#f2f2f2", "#d8102a"], ["FRUTAS", "#2faa4a", "#ffd23f"],
        ["MISHTI", "#ffd23f", "#b04ad8"], ["BODEGA", "#1a1a1a", "#5af0ff"], ["JEWELRY", "#ffd23f", "#2a2a2a"], ["PUPUSAS", "#f2f2f2", "#2a6ad8"],
        ["MOFONGO", "#ffd23f", "#e0602a"], ["SHAWARMA", "#f2f2f2", "#8a3a1a"], ["CHIFA", "#ffd23f", "#c81a1a"], ["CAFE", "#f2f2f2", "#6a3a1a"],
      ];
      const BRICK = ["#9a4a32", "#7a5a4a", "#a8603a", "#6a4a3a", "#8a3a2a", "#b8705a", "#5a5a6a"];
      let si = 0;
      const shopRow = (yt: number) => {                     // a row of storefronts, 20 tall, facing down onto the street
        for (const [a, b] of [[2, La(yt, yt + 20)], [Ra(yt, yt + 20), W - 2]]) {
          let x = a;
          while (x < b - 8) {
            let k = 0, sh = SHOPS[si % SHOPS.length];
            while (k < SHOPS.length && tw(sh[0]) + 4 > b - x) { si++; k++; sh = SHOPS[si % SHOPS.length]; }
            const w = k < SHOPS.length ? tw(sh[0]) + 4 : b - x;
            const [nm, sc, fac] = sh; si++;
            if (w < 8) break;
            if (k >= SHOPS.length) {                                              // no room for a shop: a narrow walk-up
              const c = BRICK[(si * 5) % BRICK.length];
              px(x, yt, w, 20, c); px(x, yt, w, 1, shadeC(c));
              for (let r = yt + 2; r < yt + 16; r += 4) for (let wx = x + 1; wx < x + w - 1; wx += 3) px(wx, r, 2, 2, "#cfe8ff");
              px(x + Math.floor(w / 2) - 1, yt + 16, 3, 4, "#2a1a10"); px(x, yt + 19, w, 1, "#5a5a5a");
              x += w + 1; continue;
            }
            const brick = BRICK[(si * 3) % BRICK.length];
            px(x, yt, w, 6, brick); px(x, yt, w, 1, shadeC(brick));                 // the flat above the shop
            for (let wx = x + 1; wx < x + w - 2; wx += 4) { px(wx, yt + 2, 2, 3, "#cfe8ff"); px(wx, yt + 2, 2, 1, "#8ab0d0"); }
            px(x, yt + 6, w, 1, "#2a2a2a");
            px(x, yt + 7, w, 13, fac);
            if (k < SHOPS.length) sign(px, x + 1, yt + 7, w - 2, nm, sc, "#1a1a1a");
            px(x, yt + 14, w, 2, sc); for (let s2 = 0; s2 < w; s2 += 2) px(x + s2, yt + 16, 1, 1, sc);   // awning, scalloped
            px(x + 1, yt + 17, w - 6, 3, "#cfe8ff"); px(x + w - 4, yt + 16, 3, 4, "#2a1a10");          // window, door
            if (nm === "FRUTAS") for (let s2 = 0; s2 < w - 6; s2 += 2) px(x + 1 + s2, yt + 19, 2, 1, ["#ff8a1f", "#ffd23f", "#2faa4a", "#e0302f"][s2 % 4]);
            if (nm === "JEWELRY") live.push({ k: "glint", x: x + 1, y: yt + 17, w: w - 6, h: 3 });
            if (nm === "BARBER") { const bx = x + w - 5; live.push({ k: "fn", fn: (f, t) => { for (let q = 0; q < 5; q++) f(bx, yt + 15 + q, 1, 1, ["#f2f2f2", "#e0302f", "#2a3a8a"][(q + Math.floor(t * 6)) % 3]); } }); }
            if ((si % 3) === 0) { const fk = FLAG_ORDER[(si * 7) % FLAG_ORDER.length], fx = x + 1 + ((si * 5) % Math.max(1, w - 6)); live.push({ k: "fn", fn: (f, t) => waving(f, t, fx, yt + 1, 5, 3, fk, si) }); }
            x += w + 1;
          }
        }
      };
      const mainY = y0 + 246;
      shopRow(mainY);
      // the street: sidewalk, two lanes, sidewalk; the highway crosses it at a light
      const stY = mainY + 20;
      for (let x = 0; x < W; x++) {
        const r = roadX(stY + 5);
        if (Math.abs(x - r) <= 6) continue;
        raw(x, stY, 1, 3, "#a8a8a8"); raw(x, stY + 3, 1, 8, "#46464a"); raw(x, stY + 11, 1, 3, "#a8a8a8");
        if (x % 6 < 3) raw(x, stY + 7, 1, 1, "#e8e8e8");
      }
      { const r = roadX(stY + 5);                                                    // crosswalks either side of the intersection
        for (const cx of [Math.round(r - 9), Math.round(r + 7)]) for (let y = stY + 3; y < stY + 11; y += 2) raw(cx, y, 3, 1, "#f2f2f2");
        raw(Math.round(r) + 8, stY - 4, 1, 4, "#2a2a2a"); raw(Math.round(r) + 8, stY - 7, 1, 3, "#1a1a1a");
        live.push({ k: "fn", fn: (f, t) => { const g = Math.floor(t / 3) % 2; f(Math.round(r) + 8, stY - 7, 1, 1, g ? "#3a1010" : "#ff3b3b"); f(Math.round(r) + 8, stY - 5, 1, 1, g ? "#3aff5a" : "#103a10"); } });
      }
      shopRow(stY + 14);
      // strings of flags stretched across Main Street, every flag in the neighborhood
      { const segs = [[3, La(stY, stY + 14) - 2], [Ra(stY, stY + 14) + 1, W - 3]];
        live.push({ k: "fn", fn: (f, t) => {
          let n = 0;
          for (const [a2, b2] of segs) for (let x = a2 + 4; x < b2 - 2; x += 11) {
            const sag = (y: number) => Math.round(Math.sin((Math.PI * (y - stY)) / 14) * 2);
            for (let y = stY; y <= stY + 13; y++) f(x + sag(y), y, 1, 1, "#2a2a2a");
            waving(f, t, x + 1 + sag(stY + 3), stY + 2, 4, 3, FLAG_ORDER[n++ % FLAG_ORDER.length], x);
            waving(f, t, x + 1 + sag(stY + 8), stY + 7, 4, 3, FLAG_ORDER[(n++ + 3) % FLAG_ORDER.length], x + 2);
          }
        } });
        for (const [a2, b2] of segs) for (let x = a2; x < b2; x += 22) { px(x, stY - 6, 1, 7, "#2a2a2a"); px(x - 1, stY - 7, 3, 1, "#fff6a0"); px(x, stY + 11, 1, 7, "#2a2a2a"); px(x - 1, stY + 17, 3, 1, "#fff6a0"); }   // lampposts
      }
      // traffic on Main Street: cars and the 74 bus, stopping for the light
      live.push({ k: "fn", fn: (f, t) => {
        const r = roadX(stY + 5), green = Math.floor(t / 3) % 2 === 1;
        for (let k = 0; k < 4; k++) {
          const east = k % 2 === 0, len = k === 1 ? 12 : 4, span = W + 30;
          let x = ((t * (8 + k * 2) + k * 37) % span) - 15;
          if (!east) x = W - x;
          const stop = east ? r - 11 - len : r + 10;
          if (!green && (east ? x > stop - 6 && x < stop : x < stop + 6 && x > stop)) x = stop;
          const y = east ? stY + 8 : stY + 4, c = k === 1 ? "#f2f2f2" : ["#e0302f", "#ffd23f", "#3a6fd8", "#2faa4a"][k];
          f(x, y, len, 2, c); if (k === 1) { f(x, y, len, 1, "#2a6ad8"); f(x + 2, y + 1, len - 4, 1, "#3a4a5a"); }
          f(east ? x + len - 1 : x, y, 1, 2, "#fff6a0");
        }
      } });
      // people on both sidewalks
      for (const yy of [stY - 5, stY + 11]) for (const [a, b] of [[3, La(yy, yy + 8) - 4], [Ra(yy, yy + 8), W - 5]]) {
        if (b - a < 8) continue;
        for (let k = 0; k < (yy < stY ? 2 : 4); k++) walkers.push(folk(a, yy, b, yy, k === 3, k === 1 ? pickc(["#ff8a1f", "#f2f2f2", "#2faa4a", "#e0302f"]) : undefined));
      }
      // the plaza below the shops: a coco helado cart, a mango man, kids, a domino table
      { const py = stY + 36, pa = 4, pb = La(py, py + 14) - 2;
        px(pa - 2, py - 1, pb - pa + 4, 14, "#b8b8b0"); for (let x = pa; x < pb; x += 4) px(x, py - 1 + ((x / 4) % 2) * 7, 2, 1, "#a0a098");
        const carts: [number, string][] = [[pa + 2, "#ff5ad1"], [pa + 14, "#ffd23f"]];
        for (const [vx, c] of carts) {
          px(vx, py + 5, 7, 3, "#f2f2f2"); px(vx + 1, py + 8, 1, 1, "#1a1a1a"); px(vx + 5, py + 8, 1, 1, "#1a1a1a");
          for (let q = 0; q < 3; q++) px(vx + 1 + q * 2, py + 4, 1, 1, ["#ff5ad1", "#ffd23f", "#5af0ff", "#ff8a1f"][(q + vx) % 4]);
          live.push({ k: "fn", fn: (f, t) => { const r = Math.round(Math.sin(t * 2 + vx) * 0.5); f(vx - 1 + r, py, 9, 2, c); f(vx + 1 + r, py - 1, 5, 1, c); f(vx + 3, py + 2, 1, 3, "#8a8a8a"); } });
        }
        // dominoes under an umbrella
        const dx = pa + 28; if (dx + 10 < pb) {
          px(dx, py + 4, 8, 5, "#5a8a3a"); for (let q = 0; q < 4; q++) px(dx + 1 + q * 2, py + 6, 1, 1, "#f2f2f2");
          person(px, dx - 3, py + 2, "#f2f2f2", "#1a1a1a", "#2a2a3a", "#8a5a3a"); person(px, dx + 8, py + 2, "#e0302f", "#d8d8d8", "#2a2a3a", "#c08a5a");
          live.push({ k: "fn", fn: (f, t) => { if (Math.floor(t * 1.5) % 4 === 0) f(dx + 3, py + 5, 2, 1, "#f2f2f2"); } });
        }
        if (pb - pa > 20) for (let k = 0; k < 3; k++) walkers.push(folk(pa, py + 4, pb - 4, py + 4, true));
      }
      { // and on the right of the road: a mural wall, PATERSON in big letters
        const mx = Ra(stY + 34, stY + 50), mw = W - 2 - mx, my = stY + 36;
        if (mw > 30) {
          px(mx, my, mw, 12, "#2a2a3a");
          const MC = ["#ff5ad1", "#ffd23f", "#5af0ff", "#2faa4a", "#ff8a1f", "#e0302f", "#b04ad8", "#3a6fd8"];
          for (let k = 0; k < mw; k += 3) px(mx + k, my + 9 + (k % 2), 3, 3 - (k % 2), MC[k % MC.length]);
          const word = mw >= tw("PATERSON") + 2 ? "PATERSON" : "SILK";
          [...word].forEach((ch, n) => text(px, mx + Math.floor((mw - tw(word)) / 2) + n * 4, my + 2, ch, MC[n % MC.length]));
          px(mx + 2, my + 8, 3, 1, "#f2f2f2");
          walkers.push(folk(mx + 1, my + 14, mx + mw - 4, my + 14));
        }
      }

      // the Jehovah's Witnesses' literature cart on the corner, and what they told us
      { const jy = stY + 38, jx = La(jy - 2, jy + 12) - 18;
        if (jx > 40) {
          px(jx + 3, jy, 7, 9, "#5a6a8a"); px(jx + 4, jy + 1, 5, 7, "#f2f2f2");
          for (let r = 0; r < 3; r++) px(jx + 4, jy + 2 + r * 2, 5, 1, ["#2a7ab8", "#e8b830", "#2faa4a"][r]);
          px(jx + 3, jy + 9, 1, 2, "#3a3a3a"); px(jx + 9, jy + 9, 1, 2, "#3a3a3a"); px(jx + 2, jy + 10, 2, 1, "#1a1a1a"); px(jx + 9, jy + 10, 2, 1, "#1a1a1a");
          person(px, jx - 2, jy + 1, "#2a2a3a", "#8a8a8a", "#2a2a3a", "#e0b090");          // in a suit
          person(px, jx + 12, jy + 1, "#b89ad8", "#3a2a1a", "#3a3a5a", "#8a5a3a");          // in a lavender dress
        }
        says.push({ a: jy - 34, b: jy - 18, who: "us", text: "“If you could ask everyone in America one question, what would you ask?”" });
        says.push({ a: jy - 18, b: jy + 2, who: "them", text: "“Peace on Earth.”" });
      }

      /* ===== 5. St. John's Cathedral + the market (rows 314-378) ===== */
      { // the cathedral's twin spires, left of the road
        const cL = L(316, 378);
        if (cL > 22) {
          const cx = Math.max(2, Math.floor(cL / 2) - 11), cy = y0 + 330;
          px(cx, cy, 22, 30, "#b8a890"); px(cx, cy, 22, 1, "#8a7a62");
          for (const sx of [cx, cx + 16]) { px(sx, cy - 10, 6, 14, "#a8987e"); for (let r = 0; r < 8; r++) px(sx + 3 - Math.floor(r / 3), cy - 18 + r, 1 + 2 * Math.floor(r / 3), 1, "#5a6a6a"); px(sx + 3, cy - 20, 1, 2, "#ffd23f"); px(sx + 2, cy - 6, 2, 3, "#3a3a5a"); }
          for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = dx * dx + dy * dy; if (d <= 18) px(cx + 11 + dx, cy + 10 + dy, 1, 1, d <= 2 ? "#ffd23f" : (Math.abs(dx) === Math.abs(dy) || dx === 0 || dy === 0) ? "#2a2a3a" : d <= 9 ? "#c8202a" : "#2a5ad8"); }   // rose window
          px(cx + 9, cy + 20, 4, 10, "#4a3a2a");
          for (let r = cy + 14; r < cy + 28; r += 5) { px(cx + 2, r, 2, 3, "#3a6fd8"); px(cx + 18, r, 2, 3, "#e0302f"); }
          walkers.push(folk(cx - 1, cy + 32, cx + 20, cy + 32), folk(cx + 2, cy + 34, cx + 22, cy + 34, true));
          // pigeons on the steps, flying off now and then
          live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 7; k++) { const u = (t * 0.25 + hash(k * 3)) % 1, up = u > 0.75 ? (u - 0.75) * 60 : 0; f(cx + 3 + k * 3 + up * 0.6, cy + 36 - up, 2, 1, "#7a7a8a"); if (up && Math.floor(t * 8 + k) % 2) f(cx + 3 + k * 3 + up * 0.6 - 1, cy + 35 - up, 1, 1, "#9a9aaa"); } } });
        }
        // the market, right of the road: stalls under awnings, crates of fruit, a crowd
        const mx = Rt(318, 366), mww = Math.min(W - 2 - mx, 56), my2 = y0 + 320;
        if (mww > 24) {
          sign(px, mx, my2, Math.min(mww, tw("FARMERS MARKET") + 2), mww > tw("FARMERS MARKET") + 2 ? "FARMERS MARKET" : "MARKET", "#ffd23f", "#2a5a2a");
          const COLS = ["#e0302f", "#2faa4a", "#3a6fd8", "#ff8a1f", "#b04ad8", "#ffd23f"];
          for (let r = 0; r < 2; r++) for (let k = r ? 0 : 2; k * 10 + 9 <= mww; k++) {
            const sx2 = mx + k * 10, sy2 = my2 + 10 + r * 17, c = COLS[(k + r * 2) % COLS.length];
            px(sx2, sy2, 9, 3, c); for (let s = 0; s < 9; s += 2) px(sx2 + s, sy2 + 3, 1, 1, c);
            px(sx2, sy2 + 4, 1, 6, "#8a6a42"); px(sx2 + 8, sy2 + 4, 1, 6, "#8a6a42"); px(sx2, sy2 + 8, 9, 2, "#a8743e");
            for (let s = 0; s < 4; s++) px(sx2 + 1 + s * 2, sy2 + 7, 2, 1, ["#ff8a1f", "#e0302f", "#ffd23f", "#2faa4a", "#b04ad8", "#8a5a2a"][(k + r + s) % 6]);
            px(sx2 + 3, sy2 + 4, 3, 1, HAIR[(k + r) % HAIR.length]); px(sx2 + 3, sy2 + 5, 3, 1, SKIN[(k * 2 + r) % SKIN.length]); px(sx2 + 3, sy2 + 6, 3, 1, SHIRT[(k + r * 3) % SHIRT.length]);   // the vendor
          }
          { // Mister Softee, parked at the end of the market, jingle going
            const tx = mx, ty = my2 + 13;
            px(tx, ty + 2, 18, 8, "#f2f2f2"); px(tx, ty + 2, 18, 1, "#d8d8e0"); px(tx, ty + 7, 18, 1, "#3a6fd8"); px(tx + 13, ty + 3, 5, 4, "#9ad0f0");
            px(tx + 3, ty + 3, 6, 4, "#2a2a3a"); px(tx + 4, ty + 4, 4, 2, "#ffd23f");     // the window
            px(tx + 9, ty - 2, 3, 3, "#f2e8d8"); px(tx + 9, ty - 3, 3, 1, "#ff5ad1"); px(tx + 10, ty + 1, 1, 2, "#c8903a");     // the cone on the roof
            for (const wx of [tx + 3, tx + 13]) { px(wx, ty + 10, 3, 2, "#1a1a1a"); }
            person(px, tx + 20, ty + 2, "#ffd23f", "#1a1a1a", "#2a2a3a", "#c08a5a"); person(px, tx + 24, ty + 3, "#e0302f", "#3a2a1a", "#3a5a8a", "#8a5a3a");
            live.push({ k: "fn", fn: (f, t, c) => { for (let k = 0; k < 4; k++) { const u = (t * 0.5 + k / 4) % 1; c.globalAlpha = 1 - u; const nx = tx + 13 + u * 12 + Math.sin(u * 9 + k) * 2, ny = ty + 1 - u * 6; f(nx, ny, 2, 2, "#ff5ad1"); f(nx + 1, ny - 3, 1, 3, "#ff5ad1"); c.globalAlpha = 1; } } });
          }
          person(px, mx + mww - 6, my2 + 2, "#f2f2f2", "#d8d8d8", "#3a3a4a", "#c8946a");    // the old man with the cap
          says.push({ a: my2 - 6, b: my2 + 14, who: "them", text: "“No gun, no marijuana. I don't need that.”" });
          says.push({ a: my2 + 14, b: my2 + 36, who: "them", text: "“Otherwise, this country is beautiful.”" });
          for (let k = 0; k < 9; k++) walkers.push(folk(mx, my2 + 21 + (k % 2) * 17, mx + mww - 4, my2 + 21 + (k % 2) * 17, k % 4 === 2, k % 2 ? pickc(["#f2f2f2", "#2faa4a", "#ff8a1f"]) : undefined));
        }
      }

      /* ===== the NJ Transit Main Line crosses over the highway on the way out of town ===== */
      { const oy = y0 + 369, oh = 9;
        for (let x = 0; x < W; x++) raw(x, oy + oh, 1, 2, "rgba(0,0,0,0.25)");             // the bridge's shadow on the road
        for (let x = 0; x < W; x += 1) if (Math.abs(x - roadX(oy)) > 7) { raw(x, oy - 2, 1, oh + 4, "#7a7064"); if ((x * 3) % 7 === 0) raw(x, oy - 2, 1, 1, "#5a5048"); }   // embankment
        hd.push({ x: 0, y: oy, w: W, h: oh, res: 8, top: true, anim: true, draw: (g, w2, h2, t) => {
          const s2 = w2 / W, b = (x: number, y: number, ww: number, hh: number, c: string) => { g.fillStyle = c; g.fillRect(Math.round(x * s2), Math.round(y * s2), Math.ceil(ww * s2), Math.ceil(hh * s2)); };
          g.clearRect(0, 0, w2, h2);
          b(0, 2, W, 6, "#4a4e56"); b(0, 2, W, 1, "#8a8e96"); b(0, 7, W, 1, "#2a2e36");
          for (let x = 0; x < W; x += 4) { b(x, 3, 1, 4, "#3a3e46"); b(x + 2, 4, 1, 1, "#9aa0a8"); }
          b(0, 3, W, 1, "#6a5a4a"); b(0, 6, W, 1, "#6a5a4a");                               // rails
          const span = W + 140, x0 = ((t * 22) % span) - 80;                                // a train every few seconds
          for (let k = 0; k < 4; k++) {
            const cx = x0 + k * 19; if (cx > W || cx + 18 < 0) continue;
            b(cx, 2, 18, 5, "#c8ccd4"); b(cx, 2, 18, 1, "#e8ecf2");
            b(cx, 5, 18, 1, "#1a3a8a"); b(cx, 4, 18, 1, k % 2 ? "#ff6a1a" : "#c8287a");
            for (let wx = cx + 2; wx < cx + 17; wx += 3) b(wx, 3, 2, 1, "#2a3a4a");
            if (k === 3) { b(cx + 17, 2, 1, 5, "#ffd23f"); }
          }
        } });
      }

      /* ===== everyone walking, and birds over all of it ===== */
      live.push({ k: "fn", fn: (f, t) => walkers.forEach((w) => drawWalker(f, t, w)) });
      const dbg = (globalThis as { __tripOverlap?: string[] }).__tripOverlap;      // nobody walks on the highway
      if (dbg) walkers.forEach((w, i) => { for (let u = 0; u <= 1; u += 0.05) { const x = w.x0 + (w.x1 - w.x0) * u, y = w.y0 + (w.y1 - w.y0) * u; for (let yy = y; yy < y + 7; yy++) { const r = roadX(yy); if (x + 3 >= r - 5 && x - 1 <= r + 5) { dbg.push(`jersey@walker${i}:${Math.round(x)},${Math.round(y - y0)} r${Math.round(r)}`); return; } } } });
      live.push({ k: "fn", fn: (f, t) => {                                      // a flock of pigeons wheeling over town
        const a = t * 0.3, fx0 = 64 + Math.sin(a) * 50, fy0 = y0 + 190 + Math.sin(a * 0.6) * 150;
        for (let k = 0; k < 10; k++) {
          const cx = fx0 + Math.sin(k * 2.1 + t * 0.7) * 6 + (k % 4) * 3, cy = fy0 + Math.cos(k * 1.7 + t * 0.5) * 4 + Math.floor(k / 4) * 2;
          const flap = Math.floor(t * 9 + k) % 2;
          f(cx, cy, 2, 1, "#6a6a7a"); f(cx - 1, cy - flap, 1, 1, "#c8c8d4"); f(cx + 2, cy - flap, 1, 1, "#c8c8d4"); f(cx + 2, cy + 1, 1, 1, "#3a3a48");
        }
      } });
      live.push({ k: "fn", fn: (f, t) => {                                      // gulls over the falls
        for (let k = 0; k < 4; k++) { const x = ((t * (5 + k) + k * 40) % (W + 20)) - 10, y = y0 + 10 + k * 14 + Math.sin(t + k) * 3, fl = Math.floor(t * 6 + k) % 2; f(x - 2, y - fl, 2, 1, "#f2f2f2"); f(x, y, 1, 1, "#f2f2f2"); f(x + 1, y - fl, 2, 1, "#f2f2f2"); }
      } });
      void hd; void canopy; void R;
    },
  },
};

function shadeC(c: string) {
  return "#" + [1, 3, 5].map((i) => Math.max(0, parseInt(c.slice(i, i + 2), 16) - 26).toString(16).padStart(2, "0")).join("");
}
void usFlag;
