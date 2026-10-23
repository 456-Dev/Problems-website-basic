// Draws the 8-bit road trip strip: one little landscape per stop, top (LA) to
// bottom (NYC), with a highway winding through all of them. Pure canvas, no assets.

export const W = 64;      // strip width in "pixels"
const OX = 12;            // the original 40-wide trip sits in the middle, with country on both sides
export const SH = 64;     // height of one stop's landscape

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
export const HT = SCENES.length * SH;

const GROUND: Record<Scene, [string, string]> = {
  venice: ["#e8c98a", "#d9b56f"], oc: ["#7fae4a", "#709c40"], vegas: ["#2a1d3a", "#3a2850"],
  desert: ["#d98c4a", "#c4763a"], arches: ["#cf6f3c", "#b85c2e"], vail: ["#3f7a3a", "#356a31"],
  lake: ["#3f7a3a", "#35693a"], denver: ["#6c8a3e", "#5f7a35"], truckstop: ["#d8b54a", "#c9a23c"],
  silo: ["#d1ad48", "#bf9a3a"], plains: ["#d8b54a", "#c9a23c"], tulsa: ["#8a9a4a", "#7c8b41"],
  oregon: ["#a8945a", "#968250"], clinton: ["#5c8a3e", "#517a36"], river: ["#5c8a3e", "#517a36"],
  casino: ["#241a33", "#33264a"], watertower: ["#7a9a45", "#6b893c"], graceland: ["#5f9a45", "#548a3c"],
  memphis: ["#5c7a3e", "#516b36"], nashville: ["#1f2340", "#2b3055"], bucees: ["#8a9a5a", "#7c8b4e"],
  gatlinburg: ["#2f6b3a", "#285c32"], smoky: ["#2f6b3a", "#285c32"], waffle: ["#4f8a3c", "#457a35"],
  fair: ["#5f9a45", "#548a3c"], dish: ["#5a8f42", "#4f7f3a"], suburb: ["#6a9a4a", "#5d8a41"],
  dc: ["#6aa04a", "#5d9041"], jersey: ["#4f7a3a", "#456b33"], liberty: ["#2f5f8a", "#28527a"],
};

// where the Rockies fire burns, in strip pixels (RoadRail animates flames there)
export function fireSpot(): [number, number] {
  const i = SCENES.indexOf("lake"), y0 = i * SH, L = OX + (roadX(y0 + SH / 2) > OX + 20 ? 1 : 23);
  return [L + 10, y0 + 52 - 21];
}

export const roadX = (y: number) => OX + 20 + 9 * Math.sin(y / 23) + 3 * Math.sin(y / 7.3);

type Px = (x: number, y: number, w: number, h: number, c: string) => void;

export function drawStrip(ctx: CanvasRenderingContext2D) {
  const n = SCENES.length;
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const px: Px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

  SCENES.forEach((sc, i) => {
    const y0 = i * SH;
    const [g1, g2] = GROUND[sc];
    px(0, y0, W, SH, g1);
    for (let k = 0; k < 70; k++) px(Math.floor(rnd() * W), y0 + Math.floor(rnd() * SH), 1, 1, g2);
    if (sc === "smoky") smokies(ctx, px, y0);
  });

  // the highway: asphalt, white edge lines, dashed yellow center
  for (let y = 0; y < n * SH; y++) {
    const x = roadX(y);
    px(x - 4, y, 9, 1, "#3a3a3e");
    px(x - 5, y, 1, 1, "#5a5a5e"); px(x + 5, y, 1, 1, "#5a5a5e");
    px(x - 4, y, 1, 1, "#e8e8e8"); px(x + 4, y, 1, 1, "#e8e8e8");
    if (y % 6 < 3) px(x, y, 1, 1, "#ffd23f");
  }

  // landmarks last, on whichever side the road isn't (L = left edge of a ~16px area)
  SCENES.forEach((sc, i) => {
    const y0 = i * SH;
    const L = OX + (roadX(y0 + SH / 2) > OX + 20 ? 1 : 23);
    // a little country on both outer edges
    const kit = EDGE[sc];
    if (kit) for (let k = 0; k < 4; k++) {
      const left = k % 2 === 0, x = left ? 2 + Math.floor(rnd() * 5) : W - 9 + Math.floor(rnd() * 4), y = y0 + 6 + k * 13 + Math.floor(rnd() * 5);
      const far = left ? x + 8 < roadX(y) - 6 && x + 8 < roadX(y + 9) - 6 : x - 1 > roadX(y) + 6 && x - 1 > roadX(y + 9) + 6;
      if (far) kit(px, x, y);
    }
    drawScene(sc, L, y0, px, rnd);
  });
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

// the Great Smokies: blue ridge after ridge across the whole stop, fog in every valley
function smokies(ctx: CanvasRenderingContext2D, px: Px, y0: number) {
  const LAYERS = ["#a8c4cc", "#84a4b8", "#62829e", "#456482", "#2e4a64"];
  LAYERS.forEach((c, k) => {
    const base = y0 + 12 + k * 10, amp = 3 + k;
    for (let x = 0; x < W; x++) {
      const h = amp * (0.6 * Math.sin(x / (5 + k * 2) + k * 1.7) + 0.4 * Math.sin(x / (2.3 + k) + k));
      const top = Math.round(base - h);
      px(x, top, 1, base + 10 - top, c);
    }
    if (k < LAYERS.length - 1) {
      ctx.globalAlpha = 0.6; px(0, base + 3, W, 2, "#eef4f6");
      ctx.globalAlpha = 0.25; px(0, base + 2, W, 1, "#eef4f6"); px(0, base + 5, W, 1, "#eef4f6");
      ctx.globalAlpha = 1;
    }
  });
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
const pick = (...k: Edge[]): Edge => { let n = 0; return (px, x, y) => k[n++ % k.length](px, x, y); };
const EDGE: Partial<Record<Scene, Edge>> = {
  venice: pick(ePalm, eRock), oc: pick(eTree, ePalm), desert: pick(eCactus, eRock), arches: pick(eCactus, eRock),
  vegas: pick(eCactus, eRock), vail: pick(ePine), lake: pick(ePine, eRock), denver: pick(ePine, eHouse),
  truckstop: pick(eHay), silo: pick(eHay), plains: pick(eHay), tulsa: pick(eHay, eTree), oregon: pick(eRock, eHay),
  clinton: pick(eTree), river: pick(eTree, eHouse), casino: pick(eTree), watertower: pick(eTree, eHouse),
  graceland: pick(eTree), memphis: pick(eTree, eHouse), nashville: pick(eTree), bucees: pick(eTree, eHay),
  gatlinburg: pick(ePine), smoky: pick(ePine), waffle: pick(ePine, eTree), fair: pick(eTree, eHouse),
  dish: pick(ePine), suburb: pick(eHouse, eTree), dc: pick(eTree), jersey: pick(eTree, eHouse), liberty: pick(eBoat),
};

/* ---------- one scene per stop ---------- */

function drawScene(sc: Scene, L: number, y0: number, px: Px, rnd: () => number) {
  const b = y0 + 52; // baseline near the bottom of the scene
  switch (sc) {
    case "venice": // ocean, palms, a red-and-blue lifeguard tower
      px(L - 1, y0 + 2, 17, 13, "#3a8fd6"); px(L - 1, y0 + 6, 17, 1, "#7fc0f0"); px(L - 1, y0 + 15, 17, 2, "#f4f4f4");
      px(L + 2, y0 + 22, 7, 5, "#3a6fd8"); px(L + 1, y0 + 21, 9, 1, "#e0302f"); px(L + 3, y0 + 23, 2, 2, "#cfe8ff");
      px(L + 2, y0 + 27, 1, 5, "#f2f2f2"); px(L + 8, y0 + 27, 1, 5, "#f2f2f2"); px(L + 9, y0 + 27, 4, 1, "#f2f2f2");
      palm(px, L + 4, b - 12); palm(px, L + 12, b - 6);
      break;
    case "oc": // orange groves
      for (const [x, y] of [[2, 8], [10, 12], [4, 26], [12, 30], [6, 42]]) {
        px(L + x - 3, y0 + y, 7, 5, "#2f7a2a"); px(L + x - 2, y0 + y - 1, 5, 1, "#3a8f32"); px(L + x, y0 + y + 5, 1, 3, "#6a4a22");
        px(L + x - 2, y0 + y + 1, 1, 1, "#ff8a1f"); px(L + x + 1, y0 + y + 2, 1, 1, "#ff8a1f"); px(L + x - 1, y0 + y + 3, 1, 1, "#ff8a1f"); px(L + x + 2, y0 + y, 1, 1, "#ff8a1f");
      }
      px(L + 1, b + 2, 6, 3, "#a8743e"); px(L + 2, b + 1, 1, 1, "#ff8a1f"); px(L + 4, b + 1, 1, 1, "#ff8a1f"); // a crate
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
      px(L - 1, b - 14, 17, 8, "#2f6fb0"); px(L + 2, b - 12, 5, 1, "#7fb6e8"); px(L + 9, b - 10, 3, 1, "#7fb6e8");
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
      turbine(px, L + 4, y0 + 10); turbine(px, L + 12, y0 + 14);
      break;
    case "plains": // Hays: wheat, a giant white roadside cross, and windmills
      for (let r = 0; r < 60; r += 3) px(L - 1, y0 + 2 + r, 17, 1, "#c4a03a");
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) for (let k = 4; k < 8; k++) px(L + 6 + dx * k, y0 + 17 + dy * k, 1, 1, "#fff6c0");
      px(L + 4, y0 + 4, 5, 38, "#222"); px(L, y0 + 14, 13, 5, "#222");                       // outline
      px(L + 5, y0 + 5, 3, 36, "#ffffff"); px(L + 1, y0 + 15, 11, 3, "#ffffff");
      px(L + 7, y0 + 5, 1, 36, "#d8d8e0"); px(L + 1, y0 + 17, 11, 1, "#d8d8e0");
      px(L + 3, y0 + 41, 7, 2, "#9a9a9a");
      windmill(px, L + 13, y0 + 46); windmill(px, L + 3, y0 + 50);
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
    case "oregon": // Muskogee as an Oregon Trail stop: false-front storefronts, a wagon, an ox, a grave
      for (const [x, w, c, f] of [[0, 7, "#8a5a32", "#a06a3a"], [8, 8, "#6a4a2a", "#9a6a3a"]] as const) {
        px(L + x, y0 + 14, w, 12, c); px(L + x, y0 + 10, w, 4, f); px(L + x, y0 + 9, w, 1, "#4a3018");
        px(L + x + 1, y0 + 11, w - 2, 2, "#e8d8a0"); px(L + x + Math.floor(w / 2) - 1, y0 + 21, 2, 5, "#2a1a0a");
        px(L + x + 1, y0 + 16, 2, 2, "#e8d080"); px(L + x, y0 + 19, w, 1, "#5a3a1a");
      }
      px(L - 1, y0 + 26, 18, 3, "#c8b080");                                                  // dirt street
      px(L + 2, b - 16, 7, 1, "#f2ead8"); px(L + 1, b - 15, 9, 5, "#f2ead8");                // covered wagon
      for (const x of [3, 5, 7]) px(L + x, b - 15, 1, 5, "#c8bca0");
      px(L + 1, b - 10, 9, 2, "#7a4a22"); px(L + 1, b - 8, 3, 3, "#3a2a1a"); px(L + 7, b - 8, 3, 3, "#3a2a1a");
      px(L + 10, b - 9, 2, 1, "#5a3a1a"); px(L + 12, b - 11, 4, 3, "#6a4a2a"); px(L + 15, b - 12, 1, 1, "#f2f2f2"); // ox
      px(L + 12, b - 8, 1, 2, "#4a3018"); px(L + 15, b - 8, 1, 2, "#4a3018");
      px(L + 4, b + 2, 1, 5, "#9a9a9a"); px(L + 3, b + 3, 3, 1, "#9a9a9a"); px(L + 2, b + 7, 5, 1, "#6a5a3a"); // a grave (dysentery)
      break;
    case "clinton": // the glass library, cantilevered out over the Arkansas River
      water(px, y0 + 32, 8); bridge(px, y0 + 32, 8);
      px(L - 1, y0 + 22, 15, 6, "#a8c4d8"); px(L - 1, y0 + 22, 15, 1, "#e8f4ff");
      for (let x = 0; x < 15; x += 3) px(L - 1 + x, y0 + 23, 1, 5, "#6a8aa0");
      px(L + 10, y0 + 28, 2, 4, "#7a808a");
      px(L + 2, b - 2, 1, 6, "#cfcfcf"); px(L + 3, b - 2, 4, 3, "#3a3fa0"); px(L + 3, b - 2, 2, 1, "#e0302f");
      { const r = y0 + 22;                                                                   // Bill on the roof, shades on, blowing the sax
        px(L + 3, r - 11, 4, 1, "#f2f2f2"); px(L + 3, r - 10, 4, 3, "#f0a888"); px(L + 3, r - 9, 4, 1, "#111"); px(L + 6, r - 8, 1, 1, "#d06a5a");
        px(L + 2, r - 7, 5, 5, "#2a2f4a"); px(L + 4, r - 7, 1, 3, "#e0302f"); px(L + 3, r - 2, 1, 2, "#2a2f4a"); px(L + 5, r - 2, 1, 2, "#2a2f4a");
        px(L + 7, r - 9, 1, 1, "#e8b830"); px(L + 8, r - 8, 1, 5, "#e8b830"); px(L + 9, r - 4, 2, 1, "#e8b830"); px(L + 10, r - 6, 2, 2, "#e8b830");
        px(L + 12, r - 11, 1, 1, "#ffd23f"); px(L + 13, r - 14, 1, 3, "#ffd23f"); px(L + 14, r - 14, 1, 1, "#ffd23f");
        px(L - 1, r - 4, 2, 3, "#e0302f"); px(L - 1, r - 6, 1, 2, "#ffd23f"); px(L, r - 6, 1, 2, "#ffd23f"); }   // his fries
      break;
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
      for (let k = 0; k < 20; k++) px(L + Math.floor(rnd() * 16), y0 + 2 + Math.floor(rnd() * 8), 2, 1, "#a9c4b8");
      px(L + 10, b - 34, 1, 4, "#cfcfcf"); px(L + 7, b - 30, 7, 3, "#e8e8e8"); px(L + 8, b - 27, 5, 1, "#9a9a9a");
      px(L + 9, b - 26, 3, 24, "#d8d8d8");
      px(L + 3, b - 20, 1, 14, "#7a7a7a");                                                    // pancake sign
      px(L, b - 24, 7, 2, "#d8903e"); px(L + 1, b - 26, 5, 2, "#e8a850"); px(L, b - 28, 7, 2, "#d8903e");
      px(L + 1, b - 29, 5, 1, "#7a3a1a"); px(L + 2, b - 30, 3, 1, "#fff0a0"); px(L, b - 28, 1, 3, "#7a3a1a"); px(L + 6, b - 28, 1, 4, "#7a3a1a");
      px(L + 1, b + 2, 6, 6, "#8a8f99"); px(L + 2, b + 3, 1, 4, "#6a6f79"); px(L + 4, b + 3, 1, 4, "#6a6f79"); // trash can
      px(L, b - 4, 8, 6, "#1a1a1a"); px(L + 3, b - 5, 2, 1, "#3a3a3a");                      // bear, butt up
      px(L - 1, b - 3, 1, 4, "#1a1a1a"); px(L + 8, b - 3, 1, 4, "#1a1a1a");
      px(L + 9, b + 7, 4, 1, "#9aa0a8"); px(L + 10, b - 7, 1, 1, "#f2f2f2"); px(L + 12, b - 3, 2, 1, "#ffd23f"); // lid, flying trash
      pine(px, L + 14, b - 6);
      break;
    case "smoky": // the layered ridges are the ground; a few dark pines up front
      pine(px, L + 3, b - 2, "#12302a"); pine(px, L + 9, b, "#12302a"); pine(px, L + 13, b - 3, "#12302a");
      break;
    case "waffle": { // a Waffle House in Cherokee
      const sx = L === OX + 1 ? OX + 1 : OX + 40 - 24;
      px(sx + 11, y0 + 21, 1, 10, "#7a7a7a");
      px(sx - 2, y0 + 5, 25, 16, "#111");
      word(px, sx, y0 + 7, "WAFFLE"); word(px, sx + 2, y0 + 14, "HOUSE");
      px(L, b - 12, 16, 1, "#4a3a2a"); px(L, b - 11, 16, 2, "#ffd23f");
      px(L + 1, b - 9, 14, 9, "#d8c8a0"); px(L + 1, b - 1, 14, 1, "#8a6a4a");
      for (let x = 2; x < 13; x += 4) px(L + x, b - 7, 3, 3, "#ffe9a0");
      px(L + 12, b - 6, 2, 6, "#5a3a1a");
      px(L + 3, b + 4, 6, 3, "#c8ccd2"); px(L + 4, b + 3, 4, 1, "#c8ccd2");                   // parked car
      break;
    }
    case "fair": { // Marion's fair: a Ferris wheel, a striped tent, pennants
      const cx = L + 8, cy = y0 + 18, R = 7, CAB = ["#e0302f", "#ffd23f", "#3a6fd8", "#2faa4a", "#ff8a1f", "#b04ad8", "#ff5ad1", "#5af0ff"];
      for (let k = 1; k < 13; k++) { px(cx - Math.floor(k / 3), cy + k, 1, 1, "#8a8a8a"); px(cx + Math.floor(k / 3), cy + k, 1, 1, "#8a8a8a"); }
      for (let a = 0; a < 40; a++) { const t = (a / 40) * 2 * Math.PI; px(cx + Math.round(R * Math.cos(t)), cy + Math.round(R * Math.sin(t)), 1, 1, "#f2f2f2"); }
      for (let s2 = 0; s2 < 8; s2++) {
        const t = (s2 / 8) * 2 * Math.PI;
        for (let r = 2; r < R; r += 2) px(cx + Math.round(r * Math.cos(t)), cy + Math.round(r * Math.sin(t)), 1, 1, "#bdbdbd");
        px(cx + Math.round(R * Math.cos(t)) - 1, cy + Math.round(R * Math.sin(t)), 2, 2, CAB[s2]);
      }
      px(cx, cy, 1, 1, "#ffd23f");
      for (let r = 0; r < 5; r++) for (let x = -r; x <= r; x++) px(L + 8 + x, b - 14 + r, 1, 1, (x + 10) % 2 ? "#e0302f" : "#f2f2f2");
      for (let x = 2; x < 15; x++) px(L + x, b - 9, 1, 7, x % 2 ? "#e0302f" : "#f2f2f2");
      px(L + 8, b - 17, 1, 3, "#8a8a8a"); px(L + 9, b - 17, 2, 1, "#ffd23f"); px(L + 7, b - 5, 3, 3, "#3a1a1a");
      for (let x = 0; x < 16; x++) if (x % 2 === 0) px(L + x, b + 3 + Math.round(Math.sin(x / 5)), 1, 2, CAB[x % 8]);
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
      px(L + 1, y0 + 14, 9, 4, "#f2f2f2"); px(L + 3, y0 + 11, 5, 3, "#f2f2f2"); px(L + 4, y0 + 9, 3, 2, "#f2f2f2"); px(L + 5, y0 + 8, 1, 1, "#f2f2f2");
      for (let x = 2; x < 10; x += 2) px(L + x, y0 + 15, 1, 3, "#c8c8c8");
      px(L + 12, b - 32, 3, 28, "#f2f2f2"); px(L + 13, b - 34, 1, 2, "#f2f2f2"); px(L + 12, b - 4, 3, 1, "#c8c8c8");
      px(L, b - 1, 16, 4, "#2f6fb0"); px(L + 12, b, 3, 2, "#9ac8f0");
      break;
    case "jersey": // Paterson's Great Falls, a chrome diner, the Turnpike
      px(L, y0 + 6, 16, 5, "#7a7a72"); px(L + 3, y0 + 11, 10, 15, "#5fa8e8");
      for (let k = 0; k < 8; k++) px(L + 4 + Math.floor(rnd() * 8), y0 + 11 + Math.floor(rnd() * 14), 1, 2, "#e8f4ff");
      px(L + 1, y0 + 26, 14, 3, "#2f6fb0");
      px(L, b - 8, 16, 8, "#d8dce4"); px(L, b - 6, 16, 1, "#e0302f"); px(L + 1, b - 5, 14, 2, "#3a6fd8");
      for (let x = 2; x < 15; x += 3) px(L + x, b - 5, 1, 2, "#cfe8ff");
      px(L + 4, b - 11, 8, 3, "#e0302f"); px(L + 5, b - 10, 6, 1, "#ffd23f");
      px(L + 3, b + 3, 10, 5, "#1f7a3a"); px(L + 4, b + 4, 8, 1, "#f2f2f2"); px(L + 5, b + 6, 3, 1, "#f2f2f2"); px(L + 7, b + 8, 1, 3, "#9a9a9a");
      break;
    case "liberty":
      bldg(px, L, y0 + 4, 3, 10, "#7a808a", "#e8eef4", rnd); bldg(px, L + 4, y0 + 2, 3, 12, "#6a707a", "#e8eef4", rnd);
      bldg(px, L + 8, y0 + 5, 3, 9, "#8a909a", "#e8eef4", rnd);
      px(L + 6, b - 14, 3, 14, "#5fae96"); px(L + 6, b - 17, 3, 3, "#5fae96"); px(L + 8, b - 21, 1, 5, "#5fae96"); px(L + 8, b - 22, 1, 1, "#ffd23f");
      px(L + 4, b, 7, 3, "#7a6a5a");
      px(L - 1, b + 6, 7, 2, "#ff8a2a"); // the ferry
      break;
  }
}
