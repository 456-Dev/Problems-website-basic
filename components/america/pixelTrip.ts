// Draws the 8-bit road trip strip: one little landscape per stop, left (LA) to
// right (NYC), side view, with the highway running along the bottom. Pure canvas, no assets.

export const CW = 64;     // width of one stop's landscape, in "pixels"
export const HH = 84;     // strip height
export const GY = 58;     // top of the ground
export const ROAD_Y = 70; // top edge of the highway (west lane 71-74, dashes 75, east lane 76-79)
const W = CW;             // sprites below size water to one cell

export type Scene =
  | "venice" | "oc" | "vegas" | "desert" | "arches" | "vail" | "lake" | "denver" | "truckstop" | "silo"
  | "plains" | "tulsa" | "oregon" | "clinton" | "river" | "casino" | "watertower" | "graceland" | "memphis"
  | "nashville" | "bucees" | "gatlinburg" | "smoky" | "waffle" | "fair" | "dish" | "suburb" | "dc"
  | "jersey" | "liberty";

// one per stop, in driving order (matches lib/america.ts)
export const SCENES: Scene[] = [
  "venice", "oc", "vegas", "desert", "arches", "vail", "lake", "denver", "truckstop", "silo",
  "plains", "tulsa", "oregon", "clinton", "river", "casino", "watertower", "graceland", "memphis", "nashville",
  "bucees", "gatlinburg", "smoky", "waffle", "fair", "dish", "suburb", "dc",
  "jersey", "liberty",
];
export const WW = SCENES.length * CW;

const GROUND: Record<Scene, [string, string]> = {
  venice: ["#e8c98a", "#d9b56f"], oc: ["#7fae4a", "#709c40"], vegas: ["#2a1d3a", "#3a2850"],
  desert: ["#d98c4a", "#c4763a"], arches: ["#cf6f3c", "#b85c2e"], vail: ["#3f7a3a", "#356a31"],
  lake: ["#3f7a3a", "#35693a"], denver: ["#6c8a3e", "#5f7a35"], truckstop: ["#d8b54a", "#c9a23c"],
  silo: ["#d1ad48", "#bf9a3a"], plains: ["#d8b54a", "#c9a23c"], tulsa: ["#8a9a4a", "#7c8b41"],
  oregon: ["#a8945a", "#968250"], clinton: ["#5c8a3e", "#517a36"], river: ["#5c8a3e", "#517a36"],
  casino: ["#241a33", "#33264a"], watertower: ["#7a9a45", "#6b893c"], graceland: ["#5f9a45", "#548a3c"],
  memphis: ["#5c7a3e", "#516b36"], nashville: ["#1f2340", "#2b3055"], bucees: ["#8a9a5a", "#7c8b4e"],
  gatlinburg: ["#2f6b3a", "#285c32"], smoky: ["#22483a", "#1c3c30"], waffle: ["#3f6a3a", "#355a32"],
  fair: ["#5f9a45", "#548a3c"], dish: ["#5a8f42", "#4f7f3a"], suburb: ["#6a9a4a", "#5d8a41"],
  dc: ["#6aa04a", "#5d9041"], jersey: ["#4f7a3a", "#456b33"], liberty: ["#2f5f8a", "#28527a"],
};

const NIGHT = new Set<Scene>(["vegas", "casino", "nashville"]);
// the last stop of most days is caught at sundown
const EVE = new Set<Scene>(["arches", "tulsa", "river", "memphis", "smoky", "waffle", "dc"]);
const WET = new Set<Scene>(["clinton", "river", "memphis", "liberty"]);
const PEAKS = new Set<Scene>(["vail", "lake", "denver", "gatlinburg"]);
const MESAS = new Set<Scene>(["desert", "arches", "vegas"]);
const FLAT = new Set<Scene>(["plains", "silo", "truckstop", "tulsa", "venice"]);
const LX = 26;                                   // where a cell's landmark sits
const sceneY0 = (sc: Scene) => (sc === "memphis" || sc === "clinton" ? GY - 32 : GY - 52);

// where the Rockies fire burns, in strip pixels (RoadRail animates flames there)
export function fireSpot(): [number, number] {
  const i = SCENES.indexOf("lake");
  return [i * CW + LX + 10, sceneY0("lake") + 52 - 21];
}

type Px = (x: number, y: number, w: number, h: number, c: string) => void;
let cellX = 0;                                   // the cell being drawn (water fills just that cell)
let eve = false;                                 // is that cell at sundown (lights on)

// sky colors, top / middle / horizon
const SKY = {
  day: [[0x3f, 0x86, 0xcc], [0x7a, 0xb8, 0xe6], [0xc4, 0xe2, 0xf4]],
  eve: [[0x2a, 0x24, 0x60], [0xc4, 0x56, 0x7a], [0xff, 0xb0, 0x60]],
  night: [[0x07, 0x06, 0x1a], [0x15, 0x11, 0x3a], [0x2e, 0x24, 0x60]],
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const tod = (sc: Scene) => (NIGHT.has(sc) ? SKY.night : EVE.has(sc) ? SKY.eve : SKY.day);

// the far ridgeline behind a stop: height and colour at strip column t
const RF = 20;
function ridge(sc: Scene, t: number): [number, string] {
  const night = NIGHT.has(sc), ev = EVE.has(sc);
  if (sc === "smoky") return [18 + 4 * Math.sin(t / 7), "#47527c"];
  if (PEAKS.has(sc)) return [14 + 9 * Math.abs(Math.sin(t / 11)) + 3 * Math.sin(t / 4.1), "#7d8cab"];
  if (MESAS.has(sc)) return [Math.sin(t / 13) > 0.2 ? 12 : 4, night ? "#3a2a4a" : ev ? "#a8584a" : "#c98a62"];
  if (FLAT.has(sc)) return [2, ev ? "#8a6a7a" : "#9ab8a0"];
  return [3 + 2 * Math.sin(t / 9) + 1.5 * Math.sin(t / 3.7), night ? "#2a2348" : ev ? "#6a4a6e" : "#8fb08a"];
}

// what a stop's bare ground looks like on row y (grass, water, verge)
const hex = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16));
const lerpHex = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return "#" + A.map((v, k) => Math.round(v + (B[k] - v) * t).toString(16).padStart(2, "0")).join("");
};
function baseRow(sc: Scene, y: number): number[] {
  const [g1, g2] = GROUND[sc], wet = WET.has(sc);
  if (y > ROAD_Y + 10) return hex(wet ? "#2f6fb0" : g2);
  if (wet && y === GY + 3) return hex("#5f9fe0");
  if (wet && y >= GY + 2) return hex("#2f6fb0");
  return hex(g1);
}

// Dither each stop's bare ground and water into the next stop's across the seam,
// so grass turns to sand turns to river gradually. Signs, trees and landmarks stay put.
function blendGround(ctx: CanvasRenderingContext2D) {
  const F = 16, img = ctx.getImageData(0, GY, WW, HH - GY), d = img.data;
  const same = (at: number, c: number[]) => Math.abs(d[at] - c[0]) + Math.abs(d[at + 1] - c[1]) + Math.abs(d[at + 2] - c[2]) < 6;
  for (let i = 1; i < SCENES.length; i++) {
    const a = SCENES[i - 1], b = SCENES[i];
    for (let u = -F; u < F; u++) {
      const x = i * CW + u, own = u < 0 ? a : b, other = u < 0 ? b : a;
      const w = 0.5 * (1 - (Math.abs(u + 0.5) - 0.5) / F);   // ~0.5 at the seam, 0 at the band's edge
      for (let y = GY; y < HH; y++) {
        if (y >= ROAD_Y && y <= ROAD_Y + 10) continue;          // leave the highway alone
        const at = ((y - GY) * WW + x) * 4, mine = baseRow(own, y);
        const fleck = hex(GROUND[own][1]);
        if (!same(at, mine) && !same(at, fleck)) continue;      // something's drawn here
        if (BAYER[(y & 3) * 4 + (x & 3)] / 16 >= w) continue;
        const c = baseRow(other, y);
        d[at] = c[0]; d[at + 1] = c[1]; d[at + 2] = c[2];
      }
    }
  }
  ctx.putImageData(img, 0, GY);
}

// One continuous sky for the whole strip: each stop has its own time of day, and
// neighbours fade into each other over a wide band, dithered like an old console.
function paintSky(ctx: CanvasRenderingContext2D) {
  const img = ctx.createImageData(WW, GY), d = img.data, F = 26, STEP = 10;
  const mix = (a: number[], b: number[], t: number) => a.map((v, k) => v + (b[k] - v) * t);
  for (let x = 0; x < WW; x++) {
    const i = Math.floor(x / CW), u = x - i * CW;
    let pal = tod(SCENES[i]);
    const nb = u < F && i > 0 ? i - 1 : u >= CW - F && i < SCENES.length - 1 ? i + 1 : -1;
    if (nb >= 0) {
      const e = u < F ? u : CW - 1 - u, w = 0.5 + 0.5 * (e / F), t = 1 - w * w * (3 - 2 * w);
      const o = tod(SCENES[nb]);
      pal = pal.map((c, k) => mix(c, o[k], t));
    }
    for (let y = 0; y < GY; y++) {
      const f = y / (GY - 1), c = f < 0.5 ? mix(pal[0], pal[1], f / 0.5) : mix(pal[1], pal[2], (f - 0.5) / 0.5);
      const off = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * STEP, at = (y * WW + x) * 4;
      for (let k = 0; k < 3; k++) d[at + k] = Math.max(0, Math.min(255, Math.round((c[k] + off) / STEP) * STEP));
      d[at + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function drawStrip(ctx: CanvasRenderingContext2D) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const px: Px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

  paintSky(ctx);
  SCENES.forEach((sc, i) => { if (sc === "smoky") smokies(ctx, px, i * CW); });   // first, so the neighbours draw over its spill
  SCENES.forEach((sc, i) => {
    const x0 = i * CW, night = NIGHT.has(sc), [g1, g2] = GROUND[sc];
    eve = EVE.has(sc);
    // clouds by day (pink at sundown), stars by night
    if (night) stars(px, x0 + 6, 1, CW - 12, 30, rnd, 14);
    else for (let k = 0; k < 2; k++) {
      const cx = x0 + 4 + Math.floor(rnd() * (CW - 18)), cy = 4 + Math.floor(rnd() * 22);
      const [c1, c2] = eve ? ["#ffc4a8", "#d8708a"] : ["#ffffff", "#e2eef8"];
      px(cx, cy + 1, 12, 2, c1); px(cx + 2, cy, 6, 1, c1); px(cx + 1, cy + 3, 10, 1, c2);
    }
    if (sc === "venice") { px(x0 + 46, 6, 7, 7, "#ffe27a"); px(x0 + 47, 5, 5, 9, "#ffe27a"); px(x0 + 45, 7, 9, 5, "#ffe27a"); }
    if (sc === "vegas") { px(x0 + 50, 5, 5, 5, "#f4f0d0"); px(x0 + 52, 5, 3, 3, "#0b0a24"); }
    // far-off ridgeline, eased into the neighbours' ridgelines near the edges
    if (sc !== "smoky") for (let x = 0; x < CW; x++) {
      const t = x0 + x, nb = x < RF && i > 0 ? i - 1 : x >= CW - RF && i < SCENES.length - 1 ? i + 1 : -1;
      let [h, c] = ridge(sc, t);
      if (nb >= 0) {
        const e = x < RF ? x : CW - 1 - x, w = 0.5 + 0.5 * (e / RF), k = 1 - w * w * (3 - 2 * w);
        const [h2, c2] = ridge(SCENES[nb], t);
        h += (h2 - h) * k;
        c = lerpHex(c, c2, k);
      }
      px(t, GY - Math.round(h), 1, Math.round(h), c);
      if (PEAKS.has(sc) && h > 19) px(t, GY - Math.round(h), 1, 2, "#f2f2f2");
    }
    // ground, with grass flecks
    px(x0, GY, CW, ROAD_Y - GY, g1);
    for (let k = 0; k < 40; k++) px(x0 + Math.floor(rnd() * CW), GY + Math.floor(rnd() * (ROAD_Y - GY)), 1, 1, g2);
    px(x0, ROAD_Y + 11, CW, HH - ROAD_Y - 11, g2);
    if (WET.has(sc)) { px(x0, GY + 2, CW, ROAD_Y - GY - 2, "#2f6fb0"); px(x0, GY + 3, CW, 1, "#5f9fe0"); px(x0, ROAD_Y + 11, CW, HH - ROAD_Y - 11, "#2f6fb0"); }
    // the highway (a bridge where there's water)
    for (let x = x0; x < x0 + CW; x++) {
      px(x, ROAD_Y, 1, 11, "#3a3a3e"); px(x, ROAD_Y, 1, 1, "#e8e8e8"); px(x, ROAD_Y + 10, 1, 1, "#e8e8e8");
      if (x % 6 < 3) px(x, ROAD_Y + 5, 1, 1, "#ffd23f");
      if (WET.has(sc)) { px(x, ROAD_Y - 3, 1, 1, "#9a9aa2"); if (x % 4 === 0) px(x, ROAD_Y - 2, 1, 2, "#9a9aa2"); px(x, ROAD_Y + 11, 1, 1, "#7a7a82"); }
    }
    // a green mile sign at the start of every stop, telephone pole mid-cell
    px(x0 + 3, GY - 3, 1, 9, "#8a8a8a"); px(x0 + 6, GY - 3, 1, 9, "#8a8a8a");
    px(x0 + 1, GY - 10, 8, 7, "#1f7a3a"); px(x0 + 1, GY - 10, 8, 1, "#e8e8e8");
    px(x0 + 2, GY - 8, 6, 1, "#e8e8e8"); px(x0 + 2, GY - 6, 4, 1, "#e8e8e8");
    px(x0 + 50, GY - 20, 1, 22, "#6a4a2a"); px(x0 + 48, GY - 19, 5, 1, "#6a4a2a");
    // something small by the road, by region
    filler(sc, x0 + 13, px);
    // the landmark
    cellX = x0;
    const clip: Px = (x, y, w, h, c) => {
      const xa = Math.max(x, x0), xb = Math.min(x + w, x0 + CW), yb = Math.min(y + h, ROAD_Y);
      if (xb > xa && yb > y) px(xa, y, xb - xa, yb - y, c);
    };
    drawScene(sc, x0 + LX, sceneY0(sc), clip, rnd);
  });
  blendGround(ctx);
  // sundown light: warm the evening stops, feathered into their neighbours
  ctx.globalCompositeOperation = "multiply";
  SCENES.forEach((sc, i) => {
    if (!EVE.has(sc)) return;
    const a = i * CW - 20, b = (i + 1) * CW + 20, g = ctx.createLinearGradient(a, 0, b, 0);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.3, "#ffcfa8"); g.addColorStop(0.7, "#ffcfa8"); g.addColorStop(1, "#ffffff");
    ctx.fillStyle = g; ctx.fillRect(a, 0, b - a, ROAD_Y);
  });
  ctx.globalCompositeOperation = "source-over";
  // telephone wires, sagging pole to pole
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < SCENES.length - 1; i++) {
    const a = i * CW + 50;
    for (let x = 0; x < CW; x++) px(a + x, GY - 18 + Math.round(3 * Math.sin((x / CW) * Math.PI)), 1, 1, "#222");
  }
  ctx.globalAlpha = 1;
}

function filler(sc: Scene, x: number, px: Px) {
  const b = ROAD_Y - 2;
  if (sc === "venice" || sc === "oc") palm(px, x + 3, b - 9);
  else if (sc === "desert" || sc === "arches" || sc === "vegas") { px(x + 3, b - 7, 1, 7, "#2f8a3a"); px(x + 2, b - 5, 1, 2, "#2f8a3a"); px(x + 4, b - 6, 1, 2, "#2f8a3a"); }
  else if (PEAKS.has(sc) || sc === "fair") { pine(px, x + 3, b - 8); pine(px, x + 8, b - 6); }
  else if (FLAT.has(sc)) { px(x, b - 3, 9, 3, "#c9a23c"); px(x + 1, b - 4, 7, 1, "#e0c060"); }        // a hay bale
  else if (sc === "smoky") { pine(px, x + 3, b - 8, "#12302a"); pine(px, x + 7, b - 7, "#12302a"); }
  else if (!WET.has(sc) && !NIGHT.has(sc)) { px(x + 1, b - 3, 6, 3, "#3f7a3a"); px(x + 2, b - 4, 4, 1, "#4f8f45"); }
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
function peak(px: Px, x: number, y: number, h: number, c = "#6a6f7a") {
  for (let r = 0; r < h; r++) px(x - r, y + r, 2 * r + 1, 1, r < h / 3 ? "#f2f2f2" : c);
}
function bldg(px: Px, x: number, y: number, w: number, h: number, c: string, win: string, rnd: () => number) {
  px(x, y, w, h, c);
  if (eve) win = "#ffd27a";                       // lights coming on
  for (let yy = y + 1; yy < y + h - 1; yy += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rnd() > 0.35) px(xx, yy, 1, 1, win);
}
function stars(px: Px, x: number, y: number, w: number, h: number, rnd: () => number, k = 6) {
  for (let i = 0; i < k; i++) px(x + Math.floor(rnd() * w), y + Math.floor(rnd() * h), 1, 1, "#ffffff");
}
function water(px: Px, _y: number, _h: number) {
  px(cellX, GY + 2, W, ROAD_Y - GY - 2, "#2f6fb0"); px(cellX, GY + 3, W, 1, "#5f9fe0");
}
function bridge(_px: Px, _y: number, _h: number) { /* the road is already a bridge in wet cells */ }

// the Great Smokies at sunset: a low striped sun behind ridge after ridge, fog in every valley
function smokies(ctx: CanvasRenderingContext2D, px: Px, x0: number) {
  const sx = x0 + 40, sy = GY - 27;
  for (let dy = -8; dy <= 8; dy++) {
    if (dy > 1 && dy % 3 === 0) continue;          // retro sunset stripes
    const w = Math.round(Math.sqrt(64 - dy * dy));
    px(sx - w, sy + dy, 2 * w + 1, 1, dy < -3 ? "#ffe08a" : dy < 2 ? "#ffb85a" : "#ff8a4a");
  }
  const LAYERS = ["#c8a0bc", "#9c86b0", "#6e6a98", "#47527c", "#2a3a58"];
  const SPILL = 22;                                 // ridges run on into the next stops, thinning out
  LAYERS.forEach((c, k) => {
    const base = GY - 30 + k * 6, amp = 4 + k;
    for (let x = -SPILL; x < CW + SPILL; x++) {
      const t = x0 + x, h = amp * (0.6 * Math.sin(t / (7 + k * 2) + k * 1.7) + 0.4 * Math.sin(t / (3.1 + k) + k));
      const top = Math.round(base - h), out = x < 0 ? -x : x >= CW ? x - CW + 1 : 0;
      if (!out) { px(t, top, 1, GY - top, c); continue; }
      const keep = 1 - out / SPILL;
      for (let y = top + Math.round((1 - keep) * 10); y < GY; y++)
        if (BAYER[(y & 3) * 4 + (t & 3)] / 16 < keep) px(t, y, 1, 1, c);
    }
    if (k < LAYERS.length - 1) {                    // fog lying in the valley in front of this ridge
      const fog = ctx.createLinearGradient(x0 - SPILL, 0, x0 + CW + SPILL, 0);
      fog.addColorStop(0, "rgba(244,220,228,0)"); fog.addColorStop(0.3, "#f4dce4"); fog.addColorStop(0.7, "#f4dce4"); fog.addColorStop(1, "rgba(244,220,228,0)");
      ctx.fillStyle = fog;
      ctx.globalAlpha = 0.65 - k * 0.08; ctx.fillRect(x0 - SPILL, base + 2, CW + 2 * SPILL, 3);
      ctx.globalAlpha = 0.25; ctx.fillRect(x0 - SPILL, base + 1, CW + 2 * SPILL, 1); ctx.fillRect(x0 - SPILL, base + 5, CW + 2 * SPILL, 1);
      ctx.globalAlpha = 1;
    }
  });
}

// 3x5 letters for the Waffle House sign
const GLYPH: Record<string, string> = {
  W: "101101111111101", A: "010101111101101", F: "111100110100100", L: "100100100100111",
  E: "111100110100111", H: "101101111101101", O: "111101101101111", U: "101101101101111", S: "111100111001111",
};
function word(px: Px, x: number, y: number, s: string) {
  [...s].forEach((ch, n) => {
    px(x + n * 4 - 1, y - 1, 5, 7, "#ffd23f");
    GLYPH[ch].split("").forEach((bit, k) => { if (bit === "1") px(x + n * 4 + (k % 3), y + Math.floor(k / 3), 1, 1, "#111"); });
  });
}

/* ---------- one scene per stop ---------- */

function drawScene(sc: Scene, L: number, y0: number, px: Px, rnd: () => number) {
  const b = y0 + 52; // baseline near the bottom of the scene
  switch (sc) {
    case "venice": // the Pacific, palms, a red-and-blue lifeguard tower on the sand
      px(L - 26, b - 6, 40, 6, "#3a8fd6"); px(L - 26, b - 6, 40, 1, "#7fc0f0"); px(L - 26, b - 3, 40, 1, "#5fa8e8");
      px(L + 12, b - 1, 4, 1, "#f4f4f4"); px(L + 8, b - 4, 3, 1, "#f4f4f4");
      px(L + 20, b - 10, 8, 5, "#3a6fd8"); px(L + 19, b - 11, 10, 1, "#e0302f"); px(L + 21, b - 9, 2, 2, "#cfe8ff");
      px(L + 20, b - 5, 1, 10, "#f2f2f2"); px(L + 27, b - 5, 1, 10, "#f2f2f2"); px(L + 24, b - 5, 1, 10, "#d8d8d8");
      palm(px, L + 2, b - 6); palm(px, L + 33, b - 4);
      break;
    case "oc": // orange groves
      for (const [x, y] of [[-2, -4], [7, -2], [16, -4], [25, -1], [34, -3]]) {
        px(L + x - 3, b + y - 5, 7, 5, "#2f7a2a"); px(L + x - 2, b + y - 6, 5, 1, "#3a8f32"); px(L + x, b + y, 1, 4, "#6a4a22");
        px(L + x - 2, b + y - 4, 1, 1, "#ff8a1f"); px(L + x + 1, b + y - 3, 1, 1, "#ff8a1f"); px(L + x - 1, b + y - 2, 1, 1, "#ff8a1f"); px(L + x + 2, b + y - 5, 1, 1, "#ff8a1f");
      }
      px(L + 10, b + 5, 6, 3, "#a8743e"); px(L + 11, b + 4, 1, 1, "#ff8a1f"); px(L + 13, b + 4, 1, 1, "#ff8a1f"); // a crate
      break;
    case "vegas": // the Strat tower, neon, and the Welcome sign
      stars(px, L, y0 + 2, 16, 8, rnd);
      px(L + 3, y0 + 4, 1, 4, "#cfcfcf"); px(L + 1, y0 + 8, 5, 3, "#d8d8e8"); px(L + 2, y0 + 11, 3, 1, "#ff5ad1");
      px(L + 3, y0 + 12, 1, 26, "#b8b8c8"); px(L + 2, y0 + 30, 3, 8, "#b8b8c8");
      bldg(px, L + 7, b - 22, 4, 22, "#4a3a6a", "#ff5ad1", rnd); bldg(px, L + 12, b - 16, 4, 16, "#3b3b5c", "#5af0ff", rnd);
      px(L + 5, b + 2, 7, 4, "#f2f2f2"); px(L + 6, b + 1, 5, 1, "#f2f2f2"); px(L + 8, b, 1, 1, "#e0302f");
      px(L + 6, b + 3, 5, 1, "#e0302f"); px(L + 8, b + 6, 1, 3, "#9a9a9a");
      break;
    case "desert":
      px(L + 1, b - 9, 13, 9, "#a8432a"); px(L + 3, b - 12, 9, 3, "#a8432a"); px(L + 3, b - 12, 9, 1, "#c45a38");
      for (const x of [2, 12]) { px(L + x, b + 3, 1, 7, "#2f8a3a"); px(L + x - 1, b + 5, 1, 2, "#2f8a3a"); px(L + x + 1, b + 4, 1, 2, "#2f8a3a"); }
      break;
    case "arches": // Delicate Arch
      px(L + 2, b - 22, 3, 22, "#a8432a"); px(L + 11, b - 18, 3, 18, "#a8432a");
      px(L + 3, b - 24, 4, 2, "#bf5534"); px(L + 6, b - 25, 4, 2, "#bf5534"); px(L + 9, b - 23, 3, 2, "#bf5534"); px(L + 11, b - 21, 2, 3, "#bf5534");
      px(L, b, 16, 2, "#b85c2e");
      break;
    case "vail": // peaks, a ski run and a chairlift
      peak(px, L + 8, b - 30, 18);
      for (let r = 0; r < 14; r++) px(L + 2 + r, b - 26 + r * 2, 2, 2, "#f2f2f2");
      for (let r = 0; r < 16; r++) px(L + r, b - 22 + r, 1, 1, "#333");
      px(L + 5, b - 18, 1, 2, "#e0302f"); px(L + 10, b - 13, 1, 2, "#3a6fd8");
      pine(px, L + 2, b); pine(px, L + 13, b + 2);
      break;
    case "lake": // the Rockies, with the wildfire from the film
      for (let k = 0; k < 60; k++) { const r = rnd(); px(L + 8 + Math.floor(r * 8 + k / 10), y0 + 2 + Math.floor(k / 3), 2, 1, k % 3 ? "#9a9a9a" : "#c8c8c8"); }
      peak(px, L + 7, b - 32, 14); peak(px, L + 13, b - 26, 8, "#575c66");
      px(L + 10, b - 20, 6, 3, "#3a2a22");
      px(L - 6, b - 1, 26, 4, "#2f6fb0"); px(L - 3, b, 5, 1, "#7fb6e8"); px(L + 9, b + 1, 3, 1, "#7fb6e8");
      pine(px, L + 1, b - 3); pine(px, L + 13, b - 1);
      break;
    case "denver":
      peak(px, L + 3, b - 30, 9); peak(px, L + 12, b - 28, 9);
      bldg(px, L + 1, b - 12, 4, 12, "#8a8f99", "#dfe6ee", rnd); bldg(px, L + 6, b - 18, 4, 18, "#7a808a", "#dfe6ee", rnd);
      bldg(px, L + 11, b - 14, 4, 14, "#8a8f99", "#dfe6ee", rnd);
      px(L + 1, b + 3, 3, 4, "#3a6fd8"); px(L + 2, b + 2, 2, 1, "#3a6fd8"); // the big blue bear, peeking
      break;
    case "truckstop": // a semi and a tall sign
      px(L + 12, b - 26, 1, 20, "#9a9a9a"); px(L + 9, b - 30, 7, 5, "#e0302f"); px(L + 10, b - 29, 5, 1, "#ffd23f");
      px(L + 1, b - 6, 9, 5, "#f2f2f2"); px(L + 10, b - 5, 4, 4, "#3a6fd8"); px(L + 12, b - 4, 2, 2, "#cfe8ff");
      for (const x of [2, 6, 11]) px(L + x, b - 1, 2, 2, "#111");
      break;
    case "silo":
      px(L + 2, b - 22, 5, 22, "#c8ccd2"); px(L + 2, b - 24, 5, 2, "#9aa0a8"); px(L + 3, b - 25, 3, 1, "#9aa0a8");
      px(L + 8, b - 16, 5, 16, "#c8ccd2"); px(L + 8, b - 18, 5, 2, "#9aa0a8");
      px(L, b, 16, 2, "#7a4a22");
      break;
    case "plains": // wheat, and a giant white roadside cross shining over Hays
      for (let r = 1; r < 11; r += 3) px(L - 26, b + r, 64, 1, "#b88f2a");
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1]]) // light rays
        for (let k = 3; k < 8; k++) px(L + 10 + dx * (k + (dy ? 0 : 6)), b - 30 + dy * k, 1, 1, "#fff2b0");
      px(L + 8, b - 43, 5, 44, "#2a2a2a"); px(L + 1, b - 34, 19, 5, "#2a2a2a");          // outline
      px(L + 9, b - 42, 3, 42, "#ffffff"); px(L + 2, b - 33, 17, 3, "#ffffff");
      px(L + 11, b - 42, 1, 42, "#d8d8e0"); px(L + 2, b - 31, 17, 1, "#d8d8e0");          // shade
      px(L + 5, b - 1, 11, 3, "#9a9a9a"); px(L + 6, b - 2, 9, 1, "#b8b8b8");
      break;
    case "tulsa": // the Golden Driller
      px(L + 12, b - 34, 1, 34, "#8a8a8a"); px(L + 14, b - 34, 1, 34, "#8a8a8a");
      for (let y = b - 34; y < b; y += 4) px(L + 12, y, 3, 1, "#8a8a8a");
      px(L + 5, b - 30, 3, 3, "#e8b830"); px(L + 4, b - 31, 5, 1, "#c99a20");               // head + hard hat
      px(L + 4, b - 27, 5, 9, "#e8b830"); px(L + 9, b - 26, 3, 1, "#e8b830");                // body, arm to the derrick
      px(L + 3, b - 26, 1, 5, "#e8b830");
      px(L + 4, b - 18, 2, 10, "#d8a828"); px(L + 7, b - 18, 2, 10, "#d8a828");             // legs
      px(L + 2, b - 8, 10, 2, "#9a9a9a");
      break;
    case "oregon": // Muskogee as an Oregon Trail stop: false fronts, a wagon, oxen, and a fresh grave
      for (const [x, w, h, c, f] of [[-13, 10, 10, "#8a5a32", "#a06a3a"], [-1, 9, 8, "#6a4a2a", "#7f5a32"], [10, 8, 11, "#9a6a3a", "#b07a44"]] as const) {
        px(L + x, b - h, w, h, c); px(L + x, b - h - 5, w, 5, f); px(L + x - 1, b - h - 6, w + 2, 1, "#4a3018");
        px(L + x + 1, b - h - 4, w - 2, 2, "#e8d8a0"); for (let k = 2; k < w - 2; k += 2) px(L + x + k, b - h - 3, 1, 1, "#4a3018");
        px(L + x + Math.floor(w / 2) - 1, b - 5, 2, 5, "#2a1a0a"); px(L + x + 1, b - h + 2, 2, 2, "#e8d080");
        px(L + x - 1, b - h + 1, w + 2, 1, "#5a3a1a");                                       // porch roof
      }
      px(L - 15, b, 52, 3, "#b8a070");                                                       // dirt street
      px(L + 15, b + 2, 9, 1, "#f2ead8"); px(L + 14, b + 3, 11, 4, "#f2ead8");               // covered wagon
      for (const x of [16, 19, 22]) px(L + x, b + 3, 1, 4, "#c8bca0");
      px(L + 14, b + 7, 11, 2, "#7a4a22"); px(L + 15, b + 9, 3, 3, "#3a2a1a"); px(L + 21, b + 9, 3, 3, "#3a2a1a");
      px(L + 16, b + 10, 1, 1, "#9a8a6a"); px(L + 22, b + 10, 1, 1, "#9a8a6a");
      px(L + 25, b + 8, 3, 1, "#5a3a1a");
      px(L + 28, b + 6, 6, 3, "#6a4a2a"); px(L + 34, b + 5, 2, 3, "#6a4a2a"); px(L + 34, b + 4, 1, 1, "#f2f2f2"); px(L + 36, b + 4, 1, 1, "#f2f2f2");
      px(L + 28, b + 9, 1, 2, "#4a3018"); px(L + 33, b + 9, 1, 2, "#4a3018");               // ox
      px(L - 21, b + 3, 3, 5, "#9a9a9a"); px(L - 22, b + 4, 5, 1, "#9a9a9a"); px(L - 21, b + 8, 3, 1, "#6a5a3a"); // a grave (dysentery)
      break;
    case "clinton": { // the glass library over the Arkansas River, Bill on the roof in shades, blowing the sax
      water(px, y0 + 32, 8); bridge(px, y0 + 32, 8);
      px(L - 1, y0 + 22, 15, 6, "#a8c4d8"); px(L - 1, y0 + 22, 15, 1, "#e8f4ff");
      for (let x = 0; x < 15; x += 3) px(L - 1 + x, y0 + 23, 1, 5, "#6a8aa0");
      px(L + 10, y0 + 28, 2, 4, "#7a808a");
      const r = y0 + 22;                                                                     // the roof
      px(L + 4, r - 11, 4, 1, "#f2f2f2"); px(L + 3, r - 10, 1, 2, "#f2f2f2");               // white hair
      px(L + 4, r - 10, 4, 3, "#f0a888"); px(L + 4, r - 9, 4, 1, "#111"); px(L + 7, r - 8, 1, 1, "#d06a5a"); // shades, red nose
      px(L + 3, r - 7, 5, 5, "#2a2f4a"); px(L + 5, r - 7, 1, 3, "#e0302f");                 // suit + tie
      px(L + 4, r - 2, 1, 2, "#2a2f4a"); px(L + 6, r - 2, 1, 2, "#2a2f4a");
      px(L + 8, r - 9, 1, 1, "#e8b830"); px(L + 9, r - 8, 1, 5, "#e8b830"); px(L + 10, r - 3, 2, 1, "#e8b830"); // the sax
      px(L + 11, r - 5, 2, 2, "#e8b830"); px(L + 8, r - 6, 1, 1, "#f0a888");
      px(L + 13, r - 10, 1, 1, "#ffd23f"); px(L + 15, r - 13, 1, 3, "#ffd23f"); px(L + 16, r - 13, 1, 1, "#ffd23f"); // notes
      px(L + 18, r - 16, 1, 2, "#ffd23f"); px(L + 19, r - 17, 1, 1, "#ffd23f");
      px(L - 1, r - 4, 3, 4, "#e0302f"); px(L, r - 3, 1, 1, "#ffd23f");                     // his fries
      px(L - 1, r - 6, 1, 2, "#ffd23f"); px(L, r - 7, 1, 3, "#ffd23f"); px(L + 1, r - 6, 1, 2, "#ffd23f");
      break;
    }
    case "river":
      water(px, y0 + 20, 7); bridge(px, y0 + 20, 7);
      bldg(px, L + 1, b - 16, 4, 16, "#7a808a", "#e8eef4", rnd); bldg(px, L + 7, b - 20, 5, 20, "#6a707a", "#e8eef4", rnd);
      break;
    case "casino":
      stars(px, L, y0 + 2, 16, 10, rnd, 5);
      px(L, b - 14, 16, 14, "#3a2a50"); px(L + 1, b - 19, 14, 5, "#ffd23f"); px(L + 2, b - 18, 12, 3, "#e0302f");
      px(L + 4, b - 17, 1, 1, "#ffd23f"); px(L + 7, b - 17, 2, 1, "#ffd23f"); px(L + 11, b - 17, 1, 1, "#ffd23f");
      for (let k = 0; k < 9; k++) px(L + 1 + Math.floor(rnd() * 14), b - 12 + Math.floor(rnd() * 10), 1, 1, "#ff5ad1");
      break;
    case "watertower":
      px(L + 4, b - 26, 9, 6, "#c8ccd2"); px(L + 5, b - 27, 7, 1, "#9aa0a8"); px(L + 6, b - 24, 5, 1, "#3a6fd8");
      px(L + 5, b - 20, 1, 12, "#9aa0a8"); px(L + 11, b - 20, 1, 12, "#9aa0a8"); px(L + 8, b - 20, 1, 12, "#9aa0a8");
      px(L + 1, b - 6, 6, 6, "#e8e2d0"); px(L + 1, b - 8, 6, 2, "#7a2f1f");
      break;
    case "graceland": // the mansion, the jet, and the King himself
      px(L + 2, y0 + 7, 13, 2, "#f2f2f2"); px(L + 6, y0 + 4, 2, 9, "#f2f2f2"); px(L + 13, y0 + 5, 2, 3, "#f2f2f2"); // the jet
      px(L + 4, y0 + 7, 4, 1, "#3a6fd8");
      px(L, b - 16, 16, 9, "#f2f2f2"); px(L + 4, b - 20, 8, 4, "#f2f2f2"); px(L + 4, b - 21, 8, 1, "#8a8a8a");
      for (let k = 0; k < 4; k++) px(L + 5 + 2 * k, b - 15, 1, 8, "#d0d0d0");
      px(L + 7, b - 11, 2, 4, "#5a3a1a");
      px(L + 2, b - 3, 3, 2, "#111"); px(L + 4, b - 4, 2, 1, "#111");                       // pompadour
      px(L + 2, b - 1, 3, 2, "#f0c8a0");                                                     // face
      px(L + 1, b + 1, 5, 6, "#ffffff"); px(L, b + 2, 1, 3, "#ffffff"); px(L + 6, b + 2, 1, 3, "#ffffff"); // jumpsuit
      px(L + 1, b + 4, 5, 1, "#ffd23f"); px(L + 1, b + 1, 1, 1, "#ffd23f"); px(L + 5, b + 1, 1, 1, "#ffd23f");
      px(L + 1, b + 7, 2, 3, "#ffffff"); px(L + 4, b + 7, 2, 3, "#ffffff");
      px(L + 8, b + 1, 1, 1, "#ffd23f"); px(L + 10, b - 1, 1, 1, "#ffd23f"); px(L + 9, b - 2, 1, 2, "#ffd23f");           // music notes
      break;
    case "memphis": // the Pyramid and the M bridge over the Mississippi
      water(px, y0 + 34, 9); bridge(px, y0 + 34, 9);
      for (let r = 0; r < 14; r++) px(L + 8 - r, y0 + 18 + r, 2 * r + 1, 1, r % 4 === 0 ? "#e8eef4" : "#b8c0c8");
      px(L - 1, y0 + 34, 17, 1, "#9a9a9a");
      for (let r = 0; r < 4; r++) { px(L + 1 + r, y0 + 30 + r, 1, 1, "#d8d8d8"); px(L + 8 - r, y0 + 30 + r, 1, 1, "#d8d8d8"); px(L + 8 + r, y0 + 30 + r, 1, 1, "#d8d8d8"); px(L + 15 - r, y0 + 30 + r, 1, 1, "#d8d8d8"); }
      break;
    case "nashville": // the Batman building and a guitar
      stars(px, L, y0 + 2, 16, 8, rnd, 5);
      bldg(px, L + 1, b - 16, 4, 16, "#3a3f60", "#ffd23f", rnd);
      px(L + 7, b - 28, 6, 28, "#2f3450"); px(L + 7, b - 32, 1, 4, "#2f3450"); px(L + 12, b - 32, 1, 4, "#2f3450");
      for (let y = b - 26; y < b - 2; y += 3) px(L + 8, y, 4, 1, "#5a6090");
      px(L + 3, b + 4, 5, 4, "#c8702a"); px(L + 4, b + 2, 3, 2, "#c8702a"); px(L + 5, b + 4, 1, 1, "#111"); px(L + 5, b - 3, 1, 5, "#5a3a1a");
      break;
    case "bucees":
      px(L + 7, b - 22, 2, 22, "#7a7a7a");
      px(L + 2, b - 34, 12, 12, "#ffd23f"); px(L + 1, b - 33, 1, 10, "#ffd23f"); px(L + 14, b - 33, 1, 10, "#ffd23f");
      px(L + 4, b - 32, 8, 8, "#8a5a2a"); px(L + 4, b - 33, 2, 1, "#8a5a2a"); px(L + 10, b - 33, 2, 1, "#8a5a2a");
      px(L + 6, b - 30, 1, 1, "#000"); px(L + 9, b - 30, 1, 1, "#000"); px(L + 7, b - 27, 2, 2, "#f2f2f2");
      px(L, b - 4, 16, 4, "#c8ccd2"); px(L + 2, b - 3, 3, 2, "#e0302f");
      break;
    case "gatlinburg": // the Space Needle, a giant pancake sign, and a bear head-first in the trash
      for (let k = 0; k < 30; k++) px(L + Math.floor(rnd() * 16), y0 + 2 + Math.floor(rnd() * 10), 2, 1, "#a9c4b8");
      px(L + 8, b - 34, 1, 4, "#cfcfcf"); px(L + 5, b - 30, 7, 3, "#e8e8e8"); px(L + 6, b - 27, 5, 1, "#9a9a9a");
      px(L + 7, b - 26, 3, 24, "#d8d8d8");
      px(L - 8, b - 24, 1, 24, "#7a7a7a");                                                   // pancake sign
      px(L - 13, b - 27, 11, 2, "#d8903e"); px(L - 12, b - 29, 9, 2, "#e8a850"); px(L - 13, b - 31, 11, 2, "#d8903e");
      px(L - 12, b - 32, 9, 1, "#7a3a1a"); px(L - 10, b - 34, 4, 2, "#fff0a0");
      px(L - 12, b - 31, 1, 3, "#7a3a1a"); px(L - 5, b - 31, 1, 5, "#7a3a1a");              // syrup drips
      px(L + 17, b - 8, 9, 8, "#8a8f99"); px(L + 16, b - 9, 11, 1, "#6a6f79");              // trash can
      for (const x of [19, 21, 23]) px(L + x, b - 7, 1, 6, "#6a6f79");
      px(L + 16, b - 17, 11, 8, "#1a1a1a"); px(L + 17, b - 18, 9, 1, "#1a1a1a");              // bear, head in the can, butt up
      px(L + 21, b - 19, 2, 1, "#3a3a3a");                                                   // stubby tail
      px(L + 14, b - 16, 2, 7, "#1a1a1a"); px(L + 27, b - 16, 2, 7, "#1a1a1a");              // legs kicking
      px(L + 13, b - 10, 3, 2, "#1a1a1a"); px(L + 27, b - 10, 3, 2, "#1a1a1a");
      px(L + 13, b - 9, 2, 1, "#c89a6a"); px(L + 28, b - 9, 2, 1, "#c89a6a");                // paw pads
      px(L + 27, b - 1, 6, 1, "#9aa0a8"); px(L + 29, b - 2, 2, 1, "#9aa0a8");               // lid, knocked off
      px(L + 30, b - 22, 2, 1, "#f2f2f2"); px(L + 12, b - 22, 1, 2, "#e0302f"); px(L + 32, b - 15, 2, 1, "#ffd23f"); // flying trash
      px(L + 26, b - 25, 1, 1, "#e8a850"); px(L + 10, b - 17, 2, 1, "#f2f2f2");
      pine(px, L + 2, b - 6); pine(px, L + 3, b + 2);
      break;
    case "smoky": // the layered ridges are the backdrop; just dark pines up front
      pine(px, L + 6, b - 6, "#12302a"); pine(px, L + 10, b - 4, "#12302a"); pine(px, L + 30, b - 5, "#12302a");
      pine(px, L + 2, b + 2, "#0e2620"); pine(px, L + 24, b + 3, "#0e2620");
      break;
    case "waffle": // a Waffle House in Cherokee, sign lit at sundown
      px(L - 15, b - 12, 26, 1, "#4a3a2a"); px(L - 15, b - 11, 26, 2, "#ffd23f");             // roof + yellow band
      px(L - 14, b - 9, 24, 9, "#d8c8a0"); px(L - 14, b - 1, 24, 1, "#8a6a4a");
      for (let x = -12; x < 8; x += 4) px(L + x, b - 7, 3, 3, "#ffe9a0");                      // lit windows
      px(L + 4, b - 6, 2, 6, "#5a3a1a");
      px(L + 20, b - 20, 1, 20, "#7a7a7a");                                                    // the sign
      px(L + 8, b - 35, 25, 15, "#111");
      word(px, L + 10, b - 33, "WAFFLE"); word(px, L + 12, b - 26, "HOUSE");
      px(L - 6, b + 4, 6, 3, "#c8ccd2"); px(L - 5, b + 3, 4, 1, "#c8ccd2"); px(L - 5, b + 7, 1, 1, "#111"); px(L - 2, b + 7, 1, 1, "#111"); // parked car
      break;
    case "fair": { // Marion's fair: a Ferris wheel, a striped tent, pennants
      const cx = L + 4, cy = b - 20, R = 14, CAB = ["#e0302f", "#ffd23f", "#3a6fd8", "#2faa4a", "#ff8a1f", "#b04ad8", "#ff5ad1", "#5af0ff"];
      px(cx - 1, cy, 1, b - cy, "#8a8a8a"); px(cx - 8, b - 1, 16, 1, "#8a8a8a");
      for (let k = 1; k < 8; k++) { px(cx - 1 - k, cy + k * 2.5, 1, 3, "#8a8a8a"); px(cx - 1 + k, cy + k * 2.5, 1, 3, "#8a8a8a"); }
      for (let a = 0; a < 64; a++) { const t = (a / 64) * 2 * Math.PI; px(cx + Math.round(R * Math.cos(t)), cy + Math.round(R * Math.sin(t)), 1, 1, "#f2f2f2"); }
      for (let s = 0; s < 8; s++) {
        const t = (s / 8) * 2 * Math.PI;
        for (let r = 2; r < R; r += 2) px(cx + Math.round(r * Math.cos(t)), cy + Math.round(r * Math.sin(t)), 1, 1, "#bdbdbd");
        px(cx + Math.round(R * Math.cos(t)) - 1, cy + Math.round(R * Math.sin(t)) + 1, 3, 2, CAB[s]);
      }
      px(cx - 1, cy - 1, 3, 3, "#ffd23f");
      for (let r = 0; r < 6; r++) for (let x = -r; x <= r; x++) px(L + 28 + x, b - 14 + r, 1, 1, (x + 10) % 2 ? "#e0302f" : "#f2f2f2"); // tent
      for (let x = 22; x < 35; x++) px(L + x, b - 8, 1, 8, (x % 2) ? "#e0302f" : "#f2f2f2");
      px(L + 28, b - 17, 1, 3, "#8a8a8a"); px(L + 29, b - 17, 2, 1, "#ffd23f"); px(L + 27, b - 4, 3, 4, "#3a1a1a");
      for (let x = -20; x < 22; x++) if (x % 3 === 0) px(L + x, b - 4 + Math.round(2 * Math.sin((x + 20) / 13)), 1, 2, CAB[(x + 21) % 8]); // pennants
      break;
    }
    case "dish": // the Green Bank Telescope
      px(L, b - 24, 16, 1, "#f2f2f2"); px(L + 1, b - 23, 14, 1, "#f2f2f2"); px(L + 3, b - 22, 10, 1, "#dcdcdc");
      px(L + 7, b - 30, 1, 6, "#cfcfcf"); px(L + 6, b - 31, 3, 1, "#cfcfcf");
      px(L + 5, b - 21, 1, 15, "#9a9a9a"); px(L + 10, b - 21, 1, 15, "#9a9a9a"); px(L + 5, b - 14, 6, 1, "#9a9a9a");
      px(L + 3, b - 6, 10, 2, "#7a7a7a");
      break;
    case "suburb":
      px(L + 1, b - 7, 6, 7, "#d8c8a8"); px(L, b - 9, 8, 2, "#6a4a3a");
      px(L + 9, b - 7, 6, 7, "#b8c8d8"); px(L + 8, b - 9, 8, 2, "#4a4a5a");
      break;
    case "dc": // the Capitol and the Monument over the reflecting pool
      px(L - 12, b - 6, 19, 7, "#f2f2f2"); px(L - 7, b - 10, 9, 4, "#f2f2f2"); px(L - 5, b - 13, 5, 3, "#f2f2f2"); px(L - 3, b - 15, 1, 2, "#f2f2f2");
      for (let x = -11; x < 7; x += 2) px(L + x, b - 5, 1, 5, "#c8c8c8");
      px(L - 14, b + 1, 23, 1, "#d8d8d8");
      px(L + 16, b - 32, 3, 32, "#f2f2f2"); px(L + 17, b - 34, 1, 2, "#f2f2f2"); px(L + 16, b, 3, 1, "#c8c8c8");
      px(L + 8, b + 3, 20, 3, "#2f6fb0"); px(L + 16, b + 3, 3, 2, "#9ac8f0");
      break;
    case "jersey": // Paterson's Great Falls, a chrome diner, the Turnpike
      px(L + 16, b - 26, 18, 6, "#7a7a72"); px(L + 19, b - 20, 12, 18, "#5fa8e8");
      for (let k = 0; k < 10; k++) px(L + 20 + Math.floor(rnd() * 10), b - 20 + Math.floor(rnd() * 16), 1, 2, "#e8f4ff");
      px(L + 16, b - 2, 18, 3, "#2f6fb0"); px(L + 14, b - 20, 2, 22, "#6a6a62"); px(L + 34, b - 20, 2, 22, "#6a6a62");
      px(L - 6, b - 8, 18, 8, "#d8dce4"); px(L - 6, b - 6, 18, 1, "#e0302f"); px(L - 5, b - 5, 16, 2, "#3a6fd8");
      for (let x = -4; x < 11; x += 3) px(L + x, b - 5, 1, 2, "#cfe8ff");
      px(L - 2, b - 11, 8, 3, "#e0302f"); px(L - 1, b - 10, 6, 1, "#ffd23f");
      px(L - 4, b + 2, 10, 5, "#1f7a3a"); px(L - 3, b + 3, 8, 1, "#f2f2f2"); px(L - 2, b + 5, 3, 1, "#f2f2f2"); px(L, b + 7, 1, 3, "#9a9a9a");
      break;
    case "liberty": // Lady Liberty in the harbor, Manhattan behind her
      bldg(px, L + 14, b - 18, 4, 18, "#7a808a", "#e8eef4", rnd); bldg(px, L + 19, b - 26, 4, 26, "#6a707a", "#e8eef4", rnd);
      bldg(px, L + 24, b - 14, 3, 14, "#8a909a", "#e8eef4", rnd); bldg(px, L + 28, b - 21, 4, 21, "#7a808a", "#e8eef4", rnd);
      px(L + 20, b - 30, 2, 4, "#6a707a"); px(L + 20, b - 32, 1, 2, "#cfcfcf");
      px(L - 6, b - 14, 3, 14, "#5fae96"); px(L - 6, b - 17, 3, 3, "#5fae96"); px(L - 4, b - 21, 1, 5, "#5fae96"); px(L - 4, b - 22, 1, 1, "#ffd23f");
      px(L - 9, b, 9, 3, "#7a6a5a");
      px(L + 4, b + 5, 7, 2, "#ff8a2a"); px(L + 5, b + 4, 4, 1, "#f2f2f2"); // the ferry
      break;
  }
}
