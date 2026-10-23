// Draws the 8-bit road trip strip: one little landscape per stop, top (LA) to
// bottom (NYC), with a dirt road winding through all of them. Pure canvas, no assets.

export const W = 40;      // strip width in "pixels"
export const SH = 64;     // height of one stop's landscape

export type Scene =
  | "beach" | "vegas" | "desert" | "arches" | "peaks" | "lake" | "denver" | "plains" | "silo"
  | "city" | "town" | "river" | "casino" | "graceland" | "nashville" | "bucees" | "smoky"
  | "hills" | "dam" | "dish" | "suburb" | "monument" | "falls" | "liberty";

// one per stop, in driving order (matches lib/america.ts)
export const SCENES: Scene[] = [
  "beach", "beach", "vegas", "desert", "arches", "peaks", "lake", "denver", "plains", "silo",
  "plains", "city", "town", "river", "casino", "town", "graceland", "river", "nashville", "bucees",
  "smoky", "smoky", "smoky", "hills", "dam", "hills", "dish", "suburb", "monument", "falls", "liberty",
];

const GROUND: Record<Scene, [string, string]> = {
  beach: ["#e8c98a", "#d9b56f"], vegas: ["#2a1d3a", "#3a2850"], desert: ["#d98c4a", "#c4763a"],
  arches: ["#cf6f3c", "#b85c2e"], peaks: ["#3f7a3a", "#356a31"], lake: ["#3f7a3a", "#35693a"],
  denver: ["#6c8a3e", "#5f7a35"], plains: ["#d8b54a", "#c9a23c"], silo: ["#d1ad48", "#bf9a3a"],
  city: ["#5d6b4a", "#525f41"], town: ["#7a9a45", "#6b893c"], river: ["#5c8a3e", "#517a36"],
  casino: ["#241a33", "#33264a"], graceland: ["#5f9a45", "#548a3c"], nashville: ["#1f2340", "#2b3055"],
  bucees: ["#8a9a5a", "#7c8b4e"], smoky: ["#2f6b3a", "#285c32"], hills: ["#4f8a3c", "#457a35"],
  dam: ["#4a7f3a", "#406f33"], dish: ["#5a8f42", "#4f7f3a"], suburb: ["#6a9a4a", "#5d8a41"],
  monument: ["#6aa04a", "#5d9041"], falls: ["#4f7a3a", "#456b33"], liberty: ["#2f5f8a", "#28527a"],
};

export const roadX = (y: number) => 20 + 9 * Math.sin(y / 23) + 3 * Math.sin(y / 7.3);

export function drawStrip(ctx: CanvasRenderingContext2D) {
  const n = SCENES.length;
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const px = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

  SCENES.forEach((sc, i) => {
    const y0 = i * SH;
    const [g1, g2] = GROUND[sc];
    px(0, y0, W, SH, g1);
    for (let k = 0; k < 70; k++) px(Math.floor(rnd() * W), y0 + Math.floor(rnd() * SH), 1, 1, g2);
  });

  // the dirt road
  for (let y = 0; y < n * SH; y++) {
    const x = roadX(y);
    px(x - 3, y, 7, 1, "#8b5a2b");
    px(x - 4, y, 1, 1, "#6b4220");
    px(x + 4, y, 1, 1, "#6b4220");
    if (y % 5 === 0) px(x - 1 + ((y / 5) % 3), y, 1, 1, "#a8743e");
  }
  // landmarks last, on whichever side the road isn't (15px wide area starting at L)
  SCENES.forEach((sc, i) => {
    const y0 = i * SH;
    const L = roadX(y0 + SH / 2) > 20 ? 2 : 23;
    drawScene(sc, L, y0, px, rnd);
  });
}

type Px = (x: number, y: number, w: number, h: number, c: string) => void;

function palm(px: Px, x: number, y: number) {
  px(x, y, 1, 8, "#7a4a22");
  px(x - 2, y - 1, 5, 1, "#2f8a3a"); px(x - 3, y, 2, 1, "#2f8a3a"); px(x + 2, y, 2, 1, "#2f8a3a");
  px(x - 1, y - 2, 3, 1, "#3faa4a");
}
function pine(px: Px, x: number, y: number, c = "#1f5a2a") {
  for (let r = 0; r < 6; r++) px(x - Math.floor(r / 2), y + r, 1 + 2 * Math.floor(r / 2), 1, c);
  px(x, y + 6, 1, 2, "#5a3a1a");
}
function peak(px: Px, x: number, y: number, h: number, c = "#6a6f7a") {
  for (let r = 0; r < h; r++) {
    px(x - r, y + r, 2 * r + 1, 1, r < h / 3 ? "#f2f2f2" : c);
  }
}
function bldg(px: Px, x: number, y: number, w: number, h: number, c: string, win: string, rnd: () => number) {
  px(x, y, w, h, c);
  for (let yy = y + 1; yy < y + h - 1; yy += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rnd() > 0.35) px(xx, yy, 1, 1, win);
}

function drawScene(sc: Scene, L: number, y0: number, px: Px, rnd: () => number) {
  const b = y0 + 50; // a baseline near the bottom of the scene
  switch (sc) {
    case "beach":
      px(L - 2, y0 + 2, 17, 14, "#3a8fd6"); px(L - 2, y0 + 16, 17, 2, "#f4f4f4");
      palm(px, L + 3, y0 + 30); palm(px, L + 10, y0 + 40); px(L + 6, b, 4, 2, "#e04a4a");
      break;
    case "vegas":
      bldg(px, L, b - 20, 4, 20, "#3b3b5c", "#ffd23f", rnd); bldg(px, L + 5, b - 28, 5, 28, "#4a3a6a", "#ff5ad1", rnd);
      bldg(px, L + 11, b - 16, 4, 16, "#3b3b5c", "#5af0ff", rnd);
      px(L + 6, b - 33, 3, 3, "#ff3b3b"); px(L + 7, b - 35, 1, 2, "#ffd23f");
      for (let k = 0; k < 6; k++) px(L + Math.floor(rnd() * 15), y0 + 2 + Math.floor(rnd() * 10), 1, 1, "#ffffff");
      break;
    case "desert":
      px(L + 1, b - 9, 12, 9, "#a8432a"); px(L + 3, b - 11, 8, 2, "#a8432a");
      px(L + 3, b + 4, 1, 6, "#2f8a3a"); px(L + 2, b + 6, 1, 2, "#2f8a3a"); px(L + 4, b + 5, 1, 2, "#2f8a3a");
      break;
    case "arches":
      px(L, b - 16, 15, 4, "#a8432a"); px(L, b - 12, 4, 12, "#a8432a"); px(L + 11, b - 12, 4, 12, "#a8432a");
      px(L + 1, b - 18, 13, 2, "#bf5534");
      break;
    case "peaks":
      peak(px, L + 7, b - 22, 14); peak(px, L + 12, b - 16, 9, "#575c66");
      pine(px, L + 2, b - 4); pine(px, L + 6, b - 2);
      break;
    case "lake":
      peak(px, L + 7, b - 30, 12);
      px(L - 1, b - 14, 16, 8, "#2f6fb0"); px(L + 2, b - 12, 4, 1, "#7fb6e8");
      pine(px, L + 1, b - 3); pine(px, L + 12, b - 1);
      break;
    case "denver":
      peak(px, L + 3, b - 26, 8); peak(px, L + 11, b - 24, 8);
      bldg(px, L + 2, b - 12, 4, 12, "#8a8f99", "#dfe6ee", rnd); bldg(px, L + 7, b - 16, 4, 16, "#7a808a", "#dfe6ee", rnd);
      break;
    case "plains":
      for (let r = 0; r < 26; r += 3) px(L - 1, y0 + 8 + r, 16, 1, "#b88f2a");
      px(L + 10, b - 14, 1, 14, "#cfcfcf"); px(L + 7, b - 15, 7, 1, "#cfcfcf"); px(L + 10, b - 18, 1, 7, "#cfcfcf");
      break;
    case "silo":
      px(L + 2, b - 18, 5, 18, "#c8ccd2"); px(L + 2, b - 20, 5, 2, "#9aa0a8");
      px(L + 8, b - 14, 5, 14, "#c8ccd2"); px(L + 8, b - 16, 5, 2, "#9aa0a8");
      px(L, b - 2, 15, 2, "#7a4a22");
      break;
    case "city":
      bldg(px, L, b - 18, 4, 18, "#7a808a", "#e8eef4", rnd); bldg(px, L + 5, b - 24, 4, 24, "#6a707a", "#e8eef4", rnd);
      bldg(px, L + 10, b - 14, 5, 14, "#8a909a", "#e8eef4", rnd);
      break;
    case "town":
      px(L + 1, b - 8, 7, 8, "#c25a3a"); px(L + 1, b - 10, 7, 2, "#7a2f1f"); px(L + 4, b - 4, 1, 4, "#3a2a1a");
      px(L + 9, b - 6, 5, 6, "#e8e2d0"); px(L + 9, b - 8, 5, 2, "#4a4a5a"); px(L + 11, b - 12, 1, 4, "#ffffff");
      break;
    case "river":
      px(0, y0 + 20, W, 7, "#2f6fb0"); px(0, y0 + 22, W, 1, "#7fb6e8");
      for (let y = y0 + 19; y < y0 + 28; y++) px(roadX(y) - 4, y, 9, 1, y % 2 ? "#9a6a3a" : "#7a4a22"); // a bridge for the road
      bldg(px, L + 1, b - 14, 4, 14, "#7a808a", "#e8eef4", rnd); bldg(px, L + 7, b - 18, 5, 18, "#6a707a", "#e8eef4", rnd);
      break;
    case "casino":
      px(L, b - 14, 15, 14, "#3a2a50"); px(L + 1, b - 18, 13, 4, "#ffd23f");
      px(L + 3, b - 17, 9, 2, "#e0302f");
      for (let k = 0; k < 8; k++) px(L + 1 + Math.floor(rnd() * 13), b - 12 + Math.floor(rnd() * 10), 1, 1, "#ff5ad1");
      break;
    case "graceland":
      px(L, b - 10, 15, 10, "#f2f2f2"); px(L + 4, b - 13, 7, 3, "#f2f2f2"); px(L + 4, b - 14, 7, 1, "#7a7a7a");
      for (let k = 0; k < 4; k++) px(L + 5 + 2 * k, b - 9, 1, 9, "#d8d8d8");
      px(L + 7, b - 4, 2, 4, "#5a3a1a");
      break;
    case "nashville":
      bldg(px, L + 1, b - 16, 4, 16, "#3a3f60", "#ffd23f", rnd);
      px(L + 7, b - 24, 5, 24, "#2f3450"); px(L + 7, b - 27, 1, 3, "#2f3450"); px(L + 11, b - 27, 1, 3, "#2f3450"); // the "batman" building
      for (let k = 0; k < 5; k++) px(L + Math.floor(rnd() * 15), y0 + 2 + Math.floor(rnd() * 8), 1, 1, "#ffffff");
      break;
    case "bucees":
      px(L + 7, b - 22, 1, 22, "#7a7a7a");
      px(L + 3, b - 30, 9, 9, "#ffd23f"); px(L + 5, b - 28, 5, 5, "#8a5a2a"); px(L + 6, b - 27, 1, 1, "#000"); px(L + 8, b - 27, 1, 1, "#000");
      px(L, b - 4, 15, 4, "#c8ccd2");
      break;
    case "smoky":
      for (let k = 0; k < 40; k++) px(L - 1 + Math.floor(rnd() * 16), y0 + 4 + Math.floor(rnd() * 14), 2, 1, "#a9c4b8"); // the smoke
      pine(px, L + 2, b - 14); pine(px, L + 7, b - 18); pine(px, L + 12, b - 12); pine(px, L + 4, b - 4); pine(px, L + 10, b - 2);
      break;
    case "hills":
      px(L - 1, b - 8, 16, 8, "#3a7a30"); px(L + 2, b - 11, 10, 3, "#3a7a30");
      pine(px, L + 3, b - 18, "#2a6a2a"); px(L + 9, b - 4, 4, 4, "#c25a3a"); px(L + 9, b - 6, 4, 2, "#7a2f1f");
      break;
    case "dam":
      px(L, b - 14, 15, 6, "#2f6fb0"); px(L, b - 8, 15, 3, "#b8b8b0"); px(L + 2, b - 5, 11, 5, "#7fb6e8");
      break;
    case "dish":
      px(L, b - 24, 15, 1, "#f2f2f2"); px(L + 1, b - 23, 13, 1, "#f2f2f2"); px(L + 3, b - 22, 9, 1, "#dcdcdc");
      px(L + 7, b - 30, 1, 6, "#cfcfcf"); px(L + 6, b - 31, 3, 1, "#cfcfcf");          // feed arm
      px(L + 5, b - 21, 1, 15, "#9a9a9a"); px(L + 9, b - 21, 1, 15, "#9a9a9a"); px(L + 5, b - 14, 5, 1, "#9a9a9a");
      px(L + 3, b - 6, 9, 2, "#7a7a7a");
      break;
    case "suburb":
      px(L + 1, b - 7, 6, 7, "#d8c8a8"); px(L, b - 9, 8, 2, "#6a4a3a");
      px(L + 9, b - 7, 6, 7, "#b8c8d8"); px(L + 8, b - 9, 8, 2, "#4a4a5a");
      break;
    case "monument":
      px(L + 6, b - 30, 3, 26, "#f2f2f2"); px(L + 7, b - 32, 1, 2, "#f2f2f2");
      px(L, b - 2, 15, 3, "#2f6fb0");
      break;
    case "falls":
      px(L, b - 24, 15, 6, "#7a7a72"); px(L + 3, b - 18, 9, 16, "#5fa8e8");
      for (let k = 0; k < 6; k++) px(L + 4 + Math.floor(rnd() * 7), b - 18 + Math.floor(rnd() * 16), 1, 2, "#e8f4ff");
      px(L, b - 2, 15, 3, "#2f6fb0");
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
