// Draws the 8-bit road trip strip: one little landscape per stop, top (LA) to
// bottom (NYC), with a highway winding through all of them. Pure canvas, no assets.

export const W = 40;      // strip width in "pixels"
export const SH = 64;     // height of one stop's landscape

export type Scene =
  | "venice" | "oc" | "vegas" | "desert" | "arches" | "vail" | "lake" | "denver" | "truckstop" | "silo"
  | "plains" | "tulsa" | "town" | "clinton" | "river" | "casino" | "watertower" | "graceland" | "memphis"
  | "nashville" | "bucees" | "gatlinburg" | "smoky" | "hills" | "dam" | "dish" | "suburb" | "dc"
  | "jersey" | "liberty";

// one per stop, in driving order (matches lib/america.ts)
export const SCENES: Scene[] = [
  "venice", "oc", "vegas", "desert", "arches", "vail", "lake", "denver", "truckstop", "silo",
  "plains", "tulsa", "town", "clinton", "river", "casino", "watertower", "graceland", "memphis", "nashville",
  "bucees", "gatlinburg", "smoky", "smoky", "hills", "dam", "hills", "dish", "suburb", "dc",
  "jersey", "liberty",
];

const GROUND: Record<Scene, [string, string]> = {
  venice: ["#e8c98a", "#d9b56f"], oc: ["#7fae4a", "#709c40"], vegas: ["#2a1d3a", "#3a2850"],
  desert: ["#d98c4a", "#c4763a"], arches: ["#cf6f3c", "#b85c2e"], vail: ["#3f7a3a", "#356a31"],
  lake: ["#3f7a3a", "#35693a"], denver: ["#6c8a3e", "#5f7a35"], truckstop: ["#d8b54a", "#c9a23c"],
  silo: ["#d1ad48", "#bf9a3a"], plains: ["#d8b54a", "#c9a23c"], tulsa: ["#8a9a4a", "#7c8b41"],
  town: ["#7a9a45", "#6b893c"], clinton: ["#5c8a3e", "#517a36"], river: ["#5c8a3e", "#517a36"],
  casino: ["#241a33", "#33264a"], watertower: ["#7a9a45", "#6b893c"], graceland: ["#5f9a45", "#548a3c"],
  memphis: ["#5c7a3e", "#516b36"], nashville: ["#1f2340", "#2b3055"], bucees: ["#8a9a5a", "#7c8b4e"],
  gatlinburg: ["#2f6b3a", "#285c32"], smoky: ["#2f6b3a", "#285c32"], hills: ["#4f8a3c", "#457a35"],
  dam: ["#4a7f3a", "#406f33"], dish: ["#5a8f42", "#4f7f3a"], suburb: ["#6a9a4a", "#5d8a41"],
  dc: ["#6aa04a", "#5d9041"], jersey: ["#4f7a3a", "#456b33"], liberty: ["#2f5f8a", "#28527a"],
};

// where the Rockies fire burns, in strip pixels (RoadRail animates flames there)
export function fireSpot(): [number, number] {
  const i = SCENES.indexOf("lake"), y0 = i * SH, L = roadX(y0 + SH / 2) > 20 ? 1 : 23;
  return [L + 10, y0 + 52 - 21];
}

export const roadX = (y: number) => 20 + 9 * Math.sin(y / 23) + 3 * Math.sin(y / 7.3);

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
    const L = roadX(y0 + SH / 2) > 20 ? 1 : 23;
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
      break;
    case "plains": // wheat and a windmill
      for (let r = 0; r < 26; r += 3) px(L - 1, y0 + 6 + r, 17, 1, "#b88f2a");
      px(L + 10, b - 18, 1, 18, "#cfcfcf"); px(L + 7, b - 19, 7, 1, "#cfcfcf"); px(L + 10, b - 22, 1, 7, "#cfcfcf");
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
    case "town":
      px(L + 1, b - 8, 7, 8, "#c25a3a"); px(L + 1, b - 10, 7, 2, "#7a2f1f"); px(L + 4, b - 4, 1, 4, "#3a2a1a");
      px(L + 9, b - 6, 6, 6, "#e8e2d0"); px(L + 9, b - 8, 6, 2, "#4a4a5a"); px(L + 12, b - 13, 1, 5, "#ffffff");
      break;
    case "clinton": // the glass library, cantilevered out over the Arkansas River
      water(px, y0 + 32, 8); bridge(px, y0 + 32, 8);
      px(L - 1, y0 + 22, 15, 6, "#a8c4d8"); px(L - 1, y0 + 22, 15, 1, "#e8f4ff");
      for (let x = 0; x < 15; x += 3) px(L - 1 + x, y0 + 23, 1, 5, "#6a8aa0");
      px(L + 10, y0 + 28, 2, 4, "#7a808a");
      px(L + 2, b - 2, 1, 6, "#cfcfcf"); px(L + 3, b - 2, 4, 3, "#3a3fa0"); px(L + 3, b - 2, 2, 1, "#e0302f");
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
    case "gatlinburg": // the Space Needle in the Smokies
      for (let k = 0; k < 30; k++) px(L + Math.floor(rnd() * 16), y0 + 2 + Math.floor(rnd() * 10), 2, 1, "#a9c4b8");
      px(L + 8, b - 34, 1, 4, "#cfcfcf"); px(L + 5, b - 30, 7, 3, "#e8e8e8"); px(L + 6, b - 27, 5, 1, "#9a9a9a");
      px(L + 7, b - 26, 3, 24, "#d8d8d8");
      pine(px, L + 2, b - 6); pine(px, L + 13, b - 4); pine(px, L + 3, b + 2);
      break;
    case "smoky":
      for (let k = 0; k < 40; k++) px(L + Math.floor(rnd() * 16), y0 + 4 + Math.floor(rnd() * 14), 2, 1, "#a9c4b8");
      pine(px, L + 2, b - 14); pine(px, L + 7, b - 18); pine(px, L + 12, b - 12); pine(px, L + 4, b - 4); pine(px, L + 10, b - 2);
      break;
    case "hills":
      px(L - 1, b - 8, 17, 8, "#3a7a30"); px(L + 2, b - 11, 10, 3, "#3a7a30");
      pine(px, L + 3, b - 18, "#2a6a2a"); px(L + 9, b - 4, 4, 4, "#c25a3a"); px(L + 9, b - 6, 4, 2, "#7a2f1f");
      break;
    case "dam":
      px(L, b - 16, 16, 6, "#2f6fb0"); px(L, b - 10, 16, 3, "#b8b8b0"); px(L + 2, b - 7, 12, 6, "#7fb6e8");
      for (let x = 3; x < 14; x += 3) px(L + x, b - 7, 1, 6, "#e8f4ff");
      break;
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
