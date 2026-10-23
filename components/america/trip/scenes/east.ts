// east scenes: Gatlinburg, the Smokies, Cherokee, up into the mountains, West Virginia
// (the fair, Green Bank), Appalachia at sundown, then night: the McDonald's drive-thru and D.C.
import { W, MID, TRAIL, DRIVE, roadX, vanX, room, free, roomiest, hash } from "../core";
import type { SceneMod, Px } from "../kit";
import { pine, person, smokies, word, wordW, GLYPH, pick, flagPole, usFlag, ePine, eTree, eOwl, eCow } from "../kit";
import type { Live } from "../fx";

/* ---------- local helpers ---------- */

// GLYPH letters at any pixel size
function bigWord(px: Px, x: number, y: number, s: string, fg: string, bg: string | null, k = 2) {
  [...s].forEach((ch, n) => {
    if (bg) px(x + n * 4 * k - k, y - k, 5 * k, 7 * k, bg);
    (GLYPH[ch] ?? GLYPH[" "]).split("").forEach((bit, i) => { if (bit === "1") px(x + (n * 4 + (i % 3)) * k, y + Math.floor(i / 3) * k, k, k, fg); });
  });
}
const bigW = (s: string, k = 2) => (s.length * 4 - 1) * k;
// a soft square halo (for lights at night)
function halo(ctx: CanvasRenderingContext2D, px: Px, x: number, y: number, r: number, c: string, a = 0.22) {
  for (let k = r; k > 0; k--) { ctx.globalAlpha = a / k; px(x - k, y - k, 2 * k + 1, 2 * k + 1, c); }
  ctx.globalAlpha = 1;
}
// a person facing us, holding something
function tourist(px: Px, x: number, y: number, shirt: string, hat: string, skin = "#e0b090", held?: string) {
  person(px, x, y, shirt, hat, "#2a3a5a", skin);
  if (held) px(x + 3, y + 4, 2, 2, held);
}
// a storefront seen from the street: roof, sign board, awning, display windows, a door
type Shop = { w: number; h: number; min: number; draw: (px: Px, x: number, y: number, w: number, h: number, side: "l" | "r") => void };
function front(px: Px, x: number, y: number, w: number, h: number, wall: string, roof: string, sign: string, fg: string, bg: string, awn: string) {
  px(x, y, w, 2, roof); px(x, y + 2, w, h - 2, wall);
  const tw = wordW(sign);
  px(x + 1, y + 3, w - 2, 7, bg);
  word(px, x + Math.floor((w - tw) / 2), y + 4, sign, fg, null);
  for (let k = 0; k < w; k++) px(x + k, y + 11, 1, 2 + (k % 2), k % 4 < 2 ? awn : shadeOf(awn));
  const d = x + Math.floor(w / 2) - 1;
  px(d, y + h - 7, 3, 7, "#3a2418"); px(d + 2, y + h - 4, 1, 1, "#e8c050");
  px(x + 2, y + 15, Math.max(1, d - x - 4), h - 19, "#bfe0ee"); px(d + 5, y + 15, Math.max(1, x + w - d - 7), h - 19, "#bfe0ee");
  px(x + 2, y + 15, Math.max(1, d - x - 4), 1, "#e8f6ff");
}
function shadeOf(c: string, n = 30) { return "#" + [1, 3, 5].map((i) => Math.max(0, parseInt(c.slice(i, i + 2), 16) - n).toString(16).padStart(2, "0")).join(""); }
// walkers that follow the road's curve on a sidewalk (off = signed distance from the road's center)
function sidewalkers(live: Live[], a: number, b: number, off: number[], cols: string[], n = 8) {
  live.push({ k: "fn", fn: (f, t) => {
    for (let k = 0; k < n; k++) {
      const dir = k % 2 ? 1 : -1, span = b - a, p = (t * (2.2 + hash(k * 7) * 1.6) + hash(k) * span) % span, y = dir > 0 ? a + p : b - p;
      const x = Math.round(roadX(y) + off[k % off.length]) - 1, leg = Math.floor(t * 4 + k) % 2;
      f(x, y, 3, 1, ["#3a2a1a", "#e8c050", "#1a1a1a", "#c8202a"][k % 4]); f(x, y + 1, 3, 2, ["#e0b090", "#8a5a3a", "#c08a5a"][k % 3]);
      f(x, y + 3, 3, 3, cols[k % cols.length]); f(x + leg, y + 6, 1, 2, "#2a2a3a"); f(x + 2 - leg, y + 6, 1, 2, "#2a2a3a");
      if (k % 3 === 0) f(x + 3, y + 4, 2, 2, ["#ff5ad1", "#ffd23f", "#f2f2f2"][k % 3]);           // a shopping bag
    }
  } });
}

/* ---------- Gatlinburg: the strip, at street level ---------- */

const SYRUP = "#8a4a12";
function stack(px: Px, x: number, y: number, n: number, w: number) {           // a stack of pancakes, front view
  for (let k = 0; k < n; k++) { const yy = y + k * 3; px(x + 1, yy, w - 2, 1, "#f2c070"); px(x, yy + 1, w, 2, "#d8903e"); px(x, yy + 2, w, 1, "#b8702a"); }
  px(x + Math.floor(w / 2) - 2, y - 2, 4, 2, "#fff2a0"); px(x + Math.floor(w / 2) - 1, y - 3, 2, 1, "#fff8d0");   // butter pat
  px(x + 1, y, w - 2, 1, SYRUP);
}
const SHOPS: Record<string, Shop> = {
  ripleys: { w: 40, h: 26, min: 32, draw: (px, x, y, w, h) => {
    front(px, x, y, w, h, "#2a4a9a", "#1a2a5a", "RIPLEYS", "#ffd23f", "#c8202a", "#ffd23f");
    // a shark bursting out of the wall
    const sx = x + w - 15, sy = y + 15;
    px(sx, sy + 2, 12, 4, "#8a96a8"); px(sx + 2, sy + 5, 9, 1, "#e8ecf2"); px(sx + 5, sy - 1, 3, 3, "#8a96a8"); px(sx - 2, sy + 1, 3, 2, "#8a96a8"); px(sx - 3, sy, 2, 1, "#8a96a8"); px(sx - 3, sy + 4, 2, 1, "#8a96a8");
    px(sx + 9, sy + 3, 1, 1, "#111"); for (let k = 0; k < 3; k++) px(sx + 8 + k, sy + 5, 1, 1, "#ffffff");
    px(sx - 1, sy + 7, 14, 1, "#5a3a2a"); px(sx + 1, sy + 8, 2, 1, "#5a3a2a"); px(sx + 9, sy + 8, 1, 1, "#5a3a2a");   // cracked wall
  } },
  moonshine: { w: 42, h: 24, min: 38, draw: (px, x, y, w, h) => {
    front(px, x, y, w, h, "#7a5232", "#3a2414", "MOONSHINE", "#f2e8c8", "#2a1a10", "#3a2414");
    for (let k = 3; k < h - 2; k += 2) px(x, y + k, w, 1, "#6a4428");
    for (let k = 0; k < 4; k++) { const jx = x + 3 + k * 4; px(jx, y + 16, 3, 4, "#d8eef2"); px(jx, y + 15, 3, 1, "#b8b8b8"); px(jx + 1, y + 18, 1, 2, "#f2f2e0"); }
    for (let k = 0; k < 2; k++) { const bx = x + w - 10 + k * 5; px(bx, y + h - 6, 4, 6, "#8a5a2a"); px(bx, y + h - 5, 4, 1, "#3a3a3a"); px(bx, y + h - 2, 4, 1, "#3a3a3a"); }
  } },
  fudge: { w: 30, h: 22, min: 26, draw: (px, x, y, w, h) => {
    front(px, x, y, w, h, "#e88aa8", "#a84a6a", "FUDGE", "#5a2a14", "#f8d0dc", "#8a4a2a");
    for (let k = 0; k < 3; k++) { px(x + 3 + k * 4, y + 17, 3, 2, ["#5a2a14", "#f2e8d0", "#8a5a2a"][k]); px(x + 3 + k * 4, y + 17, 3, 1, "#c88a5a"); }
  } },
  taffy: { w: 30, h: 22, min: 26, draw: (px, x, y, w, h) => {
    front(px, x, y, w, h, "#7ad8b8", "#3a8a7a", "TAFFY", "#ff5ad1", "#f2fff8", "#ff8ac8");
    px(x + 3, y + 15, 9, 6, "#9aa0a8"); px(x + 7, y + 15, 1, 6, "#5a6068");                    // the taffy puller in the window
    for (let k = 0; k < 6; k++) px(x + w - 12 + (k % 3) * 3, y + 16 + Math.floor(k / 3) * 3, 2, 1, ["#ff8ac8", "#ffd23f", "#5af0ff", "#8ae85a", "#ff8a1f", "#c88aff"][k]);
  } },
  wax: { w: 32, h: 26, min: 26, draw: (px, x, y, w, h) => {
    front(px, x, y, w, h, "#6a3a8a", "#3a1a5a", "WAX", "#ffd23f", "#2a1040", "#ffd23f");
    // a melting wax figure out front
    const fx = x + w - 8, fy = y + h - 11;
    px(fx, fy, 4, 3, "#f0d0b0"); px(fx, fy - 1, 4, 1, "#111"); px(fx - 1, fy + 3, 6, 5, "#f2f2f2"); px(fx + 1, fy + 3, 2, 1, "#ffd23f");
    px(fx + 4, fy + 2, 1, 3, "#f0d0b0"); px(fx - 1, fy + 8, 1, 3, "#f2f2f2"); px(fx + 1, fy + 8, 2, 3, "#f2f2f2"); px(fx - 2, fy + 10, 8, 1, "#e8e0d8");
  } },
  haunted: { w: 34, h: 28, min: 30, draw: (px, x, y, w, h) => {
    front(px, x, y, w, h, "#3a3448", "#1a1424", "HAUNTED", "#8aff6a", "#120c1a", "#5a2a6a");
    for (let k = 0; k < 3; k++) px(x + 3, y + 16 + k * 3, 10, 1, "#7a5a3a");
    for (let k = 0; k < 4; k++) px(x + 1 + k * 9, y - 2 + (k % 2), 2, 2, "#1a1424");      // bats on the roof
  } },
  tees: { w: 30, h: 22, min: 26, draw: (px, x, y, w, h) => {
    front(px, x, y, w, h, "#f2f2f2", "#3a3a3a", "TEES", "#111", "#5af0ff", "#ff5ad1");
    for (let k = 0; k < 5; k++) { const tx = x + 2 + k * 5; px(tx, y + 15, 4, 4, ["#ff5ad1", "#3a6fd8", "#ffd23f", "#2faa4a", "#ff8a1f"][k]); px(tx - 1, y + 15, 1, 2, "#f2f2f2"); px(tx + 4, y + 15, 1, 2, "#f2f2f2"); px(tx + 1, y + 16, 2, 2, "#f2f2f2"); }
  } },
  corndog: { w: 26, h: 22, min: 22, draw: (px, x, y, w, h) => {
    px(x, y + 8, w, h - 8, "#e0302f"); px(x, y + 8, w, 2, "#ffd23f"); px(x + 2, y + 12, w - 4, 4, "#1a1a1a"); px(x + 3, y + 13, w - 6, 2, "#ffe9a0");
    // the giant corn dog on the roof
    px(x + 6, y, 14, 6, "#c8822a"); px(x + 7, y + 1, 12, 1, "#e0a040"); px(x + 4, y + 2, 2, 2, "#c8822a"); px(x + 20, y + 3, 4, 1, "#e8d8b0");
    px(x + 8, y + 2, 1, 1, "#e0302f"); px(x + 11, y + 3, 2, 1, "#ffd23f");
  } },
  golf: { w: 36, h: 30, min: 30, draw: (px, x, y, w, h) => {      // hillbilly golf: the incline car up the hill
    for (let r = 0; r < h; r++) px(x, y + r, Math.min(w, 8 + r * 1.2), 1, r % 3 ? "#3f9a3a" : "#4fb048");
    for (let k = 0; k < 14; k++) px(x + 4 + k * 1.6, y + 4 + k * 1.6, 2, 1, "#5a5048");
    px(x + 12, y + 10, 5, 4, "#e0302f"); px(x + 13, y + 11, 3, 1, "#cfe8ff");
    px(x + 4, y + h - 9, 5, 8, "#7a5232"); px(x + 5, y + h - 8, 1, 1, "#ffd23f");             // the outhouse
    px(x + w - 12, y + h - 6, 1, 6, "#cfcfcf"); px(x + w - 11, y + h - 6, 3, 2, "#e0302f"); px(x + w - 13, y + h - 1, 3, 1, "#2a2a2a");
    bigWord(px, x + w - 16, y + 2, "GOLF", "#ffd23f", null, 1);
  } },
  pancakes: { w: 50, h: 58, min: 40, draw: (px, x, y, w, h) => {     // THE pancake house: a giant stack on the roof
    px(x, y + 33, w, h - 33, "#8a5a32"); for (let k = 35; k < h; k += 3) px(x, y + k, w, 1, "#7a4a28");    // log cabin
    for (let r = 0; r < 5; r++) px(x + 5 - r, y + 28 + r, w - 10 + 2 * r, 1, "#5a2e18");
    px(x, y, w, 10, "#ffd23f"); px(x + 1, y + 1, w - 2, 8, "#fff2c0");
    word(px, x + Math.floor((w - wordW("PANCAKES")) / 2), y + 2, "PANCAKES", "#8a3a1a", null);
    const sw = Math.min(30, w - 8), sx = x + Math.floor((w - sw) / 2);
    stack(px, sx, y + 13, 5, sw);                                                             // the giant stack, butter and all
    for (let k = 0; k < 3; k++) { const tx = x + 3 + k * 10; px(tx, y + 48, 8, 2, "#f2f2f2"); px(tx + 3, y + 50, 2, 4, "#5a3a1a"); stack(px, tx + 2, y + 45, 1, 4);
      person(px, tx - 2, y + 45, ["#e0302f", "#3a6fd8", "#2faa4a"][k], ["#1a1a1a", "#c8a060", "#e8e8e8"][k]); }
    px(x + 2, y + 36, 10, 6, "#ffe9a0"); px(x + 14, y + 36, 10, 6, "#ffe9a0"); px(x + w - 12, y + 36, 10, 6, "#ffe9a0");
    for (let k = 0; k < 4; k++) person(px, x + w - 14 + k * 3, y + 50, ["#ff5ad1", "#ffd23f", "#f2f2f2", "#3a6fd8"][k], "#3a2a1a");   // the line out the door
  } },
  hotcakes: { w: 40, h: 26, min: 34, draw: (px, x, y, w, h) => {
    front(px, x, y, w, h, "#f2e0b8", "#8a3a1a", "HOTCAKES", "#f2f2f2", "#8a3a1a", "#e0302f");
    stack(px, x + 3, y + 17, 2, 8); stack(px, x + w - 11, y + 17, 2, 8);
  } },
};
const SHOP_L = ["moonshine", "wax", "tees", "golf", "fudge", "haunted", "corndog"];
const SHOP_R = ["ripleys", "taffy", "hotcakes", "corndog", "wax", "moonshine", "tees"];

function needle(px: Px, x: number, y: number) {                     // the Space Needle, Gatlinburg's
  px(x + 5, y, 1, 4, "#cfcfcf"); px(x, y + 4, 11, 2, "#e8e8e8"); px(x + 1, y + 6, 9, 2, "#cfe8ff"); px(x, y + 8, 11, 1, "#9a9a9a");
  px(x + 4, y + 9, 3, 36, "#d8d8d8"); px(x + 4, y + 9, 1, 36, "#b8b8b8");
  for (let k = 12; k < 44; k += 5) px(x + 3, y + k, 5, 1, "#a8a8a8");
}
function bear(px: Px, x: number, y: number) {                       // a black bear in the trash
  px(x + 6, y + 4, 6, 7, "#8a8f99"); px(x + 7, y + 5, 1, 5, "#6a6f79"); px(x + 9, y + 5, 1, 5, "#6a6f79");
  px(x, y, 9, 6, "#1a1a1a"); px(x + 3, y - 1, 3, 1, "#2a2a2a"); px(x - 1, y + 1, 1, 4, "#1a1a1a"); px(x + 8, y + 2, 2, 3, "#1a1a1a");
  px(x - 2, y - 1, 2, 2, "#1a1a1a"); px(x - 3, y, 1, 1, "#7a5a3a"); px(x + 11, y + 11, 3, 1, "#e0302f"); px(x + 12, y + 2, 2, 1, "#ffd23f");
}

/* ---------- West Virginia's famous monsters ---------- */

function mothman(px: Px, x: number, y: number) {                  // ~40 wide, 34 tall; eyes drawn live
  const D = "#141012", M = "#2a2426", L = "#3a3234";
  for (let r = 0; r < 24; r++) {                                  // the wings: long ragged sweeps, darker at the tips
    const span = Math.round(18 - Math.abs(r - 5) * 0.75 - (r > 14 ? (r - 14) * 0.8 : 0));
    if (span <= 0) continue;
    for (let k = 0; k < span; k++) { const c = k < 3 ? D : (k + r) % 7 === 0 ? L : M; px(x + 15 - k, y + 4 + r, 1, 1, c); px(x + 25 + k, y + 4 + r, 1, 1, c); }
  }
  for (let k = 0; k < 3; k++) { px(x - 2 + k * 6, y + 3 + k * 2, 1, 1, D); px(x + 42 - k * 6, y + 3 + k * 2, 1, 1, D); }  // claw tips
  px(x + 16, y, 9, 9, D); px(x + 15, y + 2, 11, 6, D); px(x + 16, y - 2, 2, 2, D); px(x + 23, y - 2, 2, 2, D);   // the head: no neck
  px(x + 15, y + 9, 11, 15, D); px(x + 17, y + 10, 7, 12, M);
  px(x + 16, y + 24, 3, 10, D); px(x + 22, y + 24, 3, 10, D); px(x + 15, y + 34, 4, 1, D); px(x + 22, y + 34, 4, 1, D);
}
function slenderman(px: Px, x: number, y: number) {               // 9 wide, 38 tall
  px(x + 3, y, 4, 5, "#f2f2f2"); px(x + 3, y + 5, 4, 1, "#d8d8d8");
  px(x + 2, y + 6, 6, 15, "#141414"); px(x + 4, y + 6, 2, 3, "#f2f2f2"); px(x + 4, y + 7, 2, 6, "#8a1010");
  px(x + 1, y + 7, 1, 17, "#141414"); px(x + 8, y + 7, 1, 17, "#141414"); px(x, y + 23, 2, 2, "#f2f2f2"); px(x + 8, y + 23, 2, 2, "#f2f2f2");
  px(x + 2, y + 21, 2, 16, "#141414"); px(x + 6, y + 21, 2, 16, "#141414"); px(x + 1, y + 37, 3, 1, "#0a0a0a"); px(x + 6, y + 37, 3, 1, "#0a0a0a");
  for (let k = 0; k < 4; k++) for (let s = 0; s < 8; s++) px(x + 9 + s + k, y + 8 + k * 3 + Math.round(Math.sin(s * 0.9 + k) * 1.5), 1, 1, "#141414");   // tendrils
}
function flatwoods(px: Px, x: number, y: number) {                // the Flatwoods Monster, Braxton County: spade hood, glowing face
  for (let r = 0; r < 12; r++) { const w = Math.round(14 - Math.abs(r - 3) * 1.3); if (w > 0) px(x + 8 - Math.floor(w / 2), y + r, w, 1, "#a8202a"); }
  px(x + 7, y - 2, 2, 2, "#a8202a"); px(x + 5, y + 5, 6, 5, "#2a1a12"); px(x + 6, y + 6, 1, 1, "#ffb84a"); px(x + 9, y + 6, 1, 1, "#ffb84a");
  for (let r = 0; r < 14; r++) px(x + 4 - Math.floor(r / 3), y + 12 + r, 9 + 2 * Math.floor(r / 3), 1, r % 4 === 0 ? "#3a6a3a" : "#2a5a2a");
  px(x + 1, y + 15, 2, 4, "#2a1a12"); px(x + 13, y + 15, 2, 4, "#2a1a12");
}

/* ---------- the hi-res bits ---------- */

function drawNoCell(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#8a8f99"); g.addColorStop(1, "#5a5f68");
  ctx.fillStyle = g; ctx.fillRect(w * 0.18, h * 0.55, w * 0.05, h * 0.45); ctx.fillRect(w * 0.77, h * 0.55, w * 0.05, h * 0.45);
  const px = w * 0.04, py = h * 0.04, pw = w * 0.92, ph = h * 0.66, r = w * 0.03;
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#d0202a"; ctx.lineWidth = w * 0.035;
  ctx.beginPath(); ctx.roundRect(px, py, pw, ph, r); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#d0202a"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(h * 0.17)}px "Arial Black", Arial, sans-serif`;
  ctx.fillText("NO CELL", w * 0.56, py + ph * 0.3);
  ctx.fillText("SERVICE", w * 0.56, py + ph * 0.6);
  ctx.fillStyle = "#1a1a1a"; ctx.font = `700 ${Math.round(h * 0.065)}px Arial, sans-serif`;
  ctx.fillText("NATIONAL RADIO QUIET ZONE", w * 0.5, py + ph * 0.86);
  // a phone, crossed out
  const cx = w * 0.15, cy = py + ph * 0.45, pw2 = w * 0.08, ph2 = h * 0.3;
  ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.roundRect(cx - pw2 / 2, cy - ph2 / 2, pw2, ph2, w * 0.012); ctx.fill();
  ctx.fillStyle = "#9ad0f0"; ctx.fillRect(cx - pw2 * 0.36, cy - ph2 * 0.38, pw2 * 0.72, ph2 * 0.66);
  ctx.strokeStyle = "#d0202a"; ctx.lineWidth = w * 0.025; ctx.beginPath(); ctx.arc(cx, cy, ph2 * 0.62, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - ph2 * 0.44, cy - ph2 * 0.44); ctx.lineTo(cx + ph2 * 0.44, cy + ph2 * 0.44); ctx.stroke();
}
// the alien, leaning out from behind the trunk: looks, ducks back
function drawAlien(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h);
  const u = (t % 4) / 4, out = u < 0.15 ? u / 0.15 : u < 0.55 ? 1 : u < 0.7 ? 1 - (u - 0.55) / 0.15 : 0;
  const tx = w * 0.42, ax = tx - w * 0.12 + out * w * 0.34, ay = h * 0.3;
  const sk = ctx.createRadialGradient(ax - w * 0.06, ay - h * 0.06, 2, ax, ay, w * 0.3);
  sk.addColorStop(0, "#c8ffb0"); sk.addColorStop(0.5, "#6ae85a"); sk.addColorStop(1, "#2a8a3a");
  ctx.fillStyle = sk;
  ctx.beginPath(); ctx.ellipse(ax, ay + h * 0.32, w * 0.09, h * 0.2, 0, 0, Math.PI * 2); ctx.fill();          // body
  ctx.beginPath(); ctx.ellipse(ax, ay, w * 0.2, h * 0.15, 0, 0, Math.PI * 2); ctx.fill();                     // the big head
  ctx.beginPath(); ctx.ellipse(ax, ay + h * 0.12, w * 0.08, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  for (const s of [-1, 1]) {                                                                                     // almond eyes
    ctx.save(); ctx.translate(ax + s * w * 0.085, ay + h * 0.01); ctx.rotate(s * 0.5);
    ctx.fillStyle = "#0a0a10"; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.075, h * 0.035, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); ctx.ellipse(-w * 0.02, -h * 0.01, w * 0.018, h * 0.008, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = "#4ac84a"; ctx.lineWidth = w * 0.025; ctx.lineCap = "round";                               // a long hand on the bark
  ctx.beginPath(); ctx.moveTo(ax - w * 0.05, ay + h * 0.25); ctx.quadraticCurveTo(tx - w * 0.05, ay + h * 0.18, tx + w * 0.02, ay + h * 0.2); ctx.stroke();
  // the trunk, in front of him
  const tr = ctx.createLinearGradient(tx - w * 0.14, 0, tx + w * 0.14, 0);
  tr.addColorStop(0, "#3a2410"); tr.addColorStop(0.45, "#7a5232"); tr.addColorStop(1, "#2a1808");
  ctx.fillStyle = tr; ctx.fillRect(tx - w * 0.13, 0, w * 0.22, h);
  ctx.strokeStyle = "rgba(20,10,0,0.45)"; ctx.lineWidth = w * 0.012;
  for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(tx - w * 0.1 + k * w * 0.03, 0); ctx.lineTo(tx - w * 0.1 + k * w * 0.03 + Math.sin(k) * w * 0.02, h); ctx.stroke(); }
  for (const s of [-1, 1]) {                                                                                     // fingers wrapped round the front
    ctx.fillStyle = "#6ae85a"; ctx.beginPath(); ctx.ellipse(tx + w * 0.02 + s * w * 0.03, ay + h * 0.2, w * 0.02, h * 0.012, 0.3, 0, Math.PI * 2); if (out > 0.3) ctx.fill();
  }
}

/* ---------- scenes ---------- */

export const SC_EAST: Partial<Record<string, SceneMod>> = {
  gatlinburg: {
    ground: ["#8a847a", "#7e786e"],
    under: ({ px, y0, h }) => {                     // the whole strip is paved; mountains rise behind the town
      for (let x = 0; x < W; x++) { const t = Math.round(8 + 5 * Math.sin(x / 9) + 3 * Math.sin(x / 3.7)); px(x, y0, 1, t, "#2f6b3a"); px(x, y0, 1, Math.max(0, t - 6), "#3f7a48"); }
      for (let y = y0 + 12; y < y0 + h; y++) { const r = roadX(y); px(r - 8, y, 2, 1, "#c8c0b0"); px(r + 7, y, 2, 1, "#c8c0b0"); if (y % 7 === 0) { px(r - 8, y, 2, 1, "#a8a090"); px(r + 7, y, 2, 1, "#a8a090"); } }
    },
    draw: ({ ctx, px, y0, h, live, canopy }) => {
      for (let k = 0; k < 40; k++) { const xx = Math.floor(hash(k * 3) * W), yy = y0 + Math.floor(hash(k * 5) * 10); if (Math.abs(xx - roadX(yy)) > 12 && Math.abs(xx - roadX(yy + 6)) > 12) pine(px, xx, yy, "#1f5a2a"); }
      // THE pancake house goes where there's the most room; the other shops fill both sides around it
      const py = roomiest(y0 + 40, y0 + 110, 60), pr = room(py, 60), pSide: "l" | "r" = pr.left >= pr.right ? "l" : "r";
      const pw = Math.min(58, pSide === "l" ? Math.floor(pr.lo - 10) : Math.floor(W - 1 - (pr.hi + 10)));
      const pxx = pSide === "l" ? Math.floor(pr.lo - 10 - pw) : Math.ceil(pr.hi + 10);
      SHOPS.pancakes.draw(px, pxx, py, pw, 58, pSide);
      flagPole(px, pSide === "l" ? pxx + pw - 1 : pxx, py - 6, 8, 5, 3);
      const place = (list: string[], side: "l" | "r", start: number) => {
        let yy = y0 + start, n = 0, guard = 0;
        while (yy < y0 + h - 30 && guard++ < 40) {
          if (yy + 26 > y0 + h - 24) break;
          if (side === pSide && yy + 30 > py - 2 && yy < py + 60) { yy = py + 62; continue; }
          const r0 = room(yy, 26), avail = side === "l" ? Math.floor(r0.lo - 10) : Math.floor(W - 1 - (r0.hi + 10));
          let s = SHOPS[list[n % list.length]], tries = 0;
          while (s.min > avail && tries++ < list.length) { n++; s = SHOPS[list[n % list.length]]; }
          if (s.min > avail) { yy += 6; continue; }
          if (side === pSide && yy + s.h > py - 2 && yy < py + 60) { yy = py + 62; continue; }
          const r = room(yy, s.h), av2 = side === "l" ? Math.floor(r.lo - 10) : Math.floor(W - 1 - (r.hi + 10)), w = Math.min(av2, s.w + 12);
          if (w >= s.min) {
            const x = side === "l" ? Math.floor(r.lo - 10 - w) : Math.ceil(r.hi + 10);
            s.draw(px, x, yy, w, s.h, side);
            if (n % 2 === 0) flagPole(px, side === "l" ? x + w - 1 : x, yy - 6, 8, 5, 3);
          }
          yy += s.h + 3; n++;
        }
      };
      place(SHOP_L, "l", 14); place(SHOP_R, "r", 22);
      // the Space Needle and the tram up to Ober, back behind the shops
      { const y = y0 + 2, r = room(y, 46), x = r.lo > W - r.hi ? 2 : W - 13; needle(px, x, y); }
      // the bear, raiding a trash can on the sidewalk
      { const y = y0 + h - 18, r = room(y, 14), x = Math.ceil(r.hi + 10); bear(px, Math.min(W - 15, x), y); }
      // a big PANCAKES billboard at the end of town
      { const y = y0 + h - 20, r = room(y, 18), x = Math.max(1, Math.floor(r.lo - 10 - 46));
        px(x + 10, y + 12, 2, 8, "#5a3a1a"); px(x + 34, y + 12, 2, 8, "#5a3a1a");
        px(x, y, 46, 13, "#ffd23f"); px(x + 1, y + 1, 44, 11, "#fff2c0"); stack(px, x + 3, y + 4, 2, 8);
        word(px, x + 13, y + 2, "PANCAKES", "#8a3a1a", null); px(x + 13, y + 9, 26, 1, "#8a3a1a"); px(x + 38, y + 8, 1, 3, "#8a3a1a"); px(x + 39, y + 9, 1, 1, "#8a3a1a"); }
      // syrup slowly running down the big stack, steam off the plates
      { const sw = Math.min(30, pw - 8), sx = pxx + Math.floor((pw - sw) / 2) + Math.floor(sw / 2) - 6, sy = py + 13;
        live.push({ k: "fn", fn: (f, t, ctx) => {
          for (let d = 0; d < 4; d++) { const len = 1 + Math.floor(((t * 0.7 + d * 0.37) % 1) * 9); f(sx + 2 + d * 3, sy + 1, 1, len, SYRUP); f(sx + 2 + d * 3, sy + len, 1, 1, "#b8701a"); }
          for (let k2 = 0; k2 < 3; k2++) { const u = (t * 0.6 + k2 / 3) % 1; ctx.globalAlpha = 0.7 * (1 - u); f(pxx + 6 + k2 * 10 + Math.sin(u * 6), py + 44 - u * 7, 1, 2, "#ffffff"); ctx.globalAlpha = 1; }
        } }); }
      sidewalkers(live, y0 + 12, y0 + h - 2, [-9, 8], ["#e0302f", "#3a6fd8", "#ffd23f", "#2faa4a", "#ff5ad1", "#f2f2f2"], 12);
      // a banner across the street
      canopy.push((f) => {
        const y = y0 + 16, x = roadX(y + 3);
        f(x - 23, y - 1, 1, 9, "#5a3a1a"); f(x + 23, y - 1, 1, 9, "#5a3a1a");
        f(x - 22, y, 45, 7, "#2a4a9a"); f(x - 22, y, 45, 1, "#c8202a"); f(x - 22, y + 6, 45, 1, "#c8202a");
        const s = "GATLINBURG", tw = wordW(s);
        [...s].forEach((ch, n) => (GLYPH[ch]).split("").forEach((bit, i) => { if (bit === "1") f(x - Math.floor(tw / 2) + n * 4 + (i % 3), y + 1 + Math.floor(i / 3), 1, 1, "#f2f2f2"); }));
      });
    },
  },
  smoky: {
    ground: ["#2f6b3a", "#285c32"],
    edge: pick(ePine),
    under: ({ ctx, px, y0, h, canopy }) => {
      smokies(ctx, px, y0, h);
      canopy.push((f) => {                 // trees over the trail: the van disappears under them
        const a = TRAIL.a + 12, b = TRAIL.b - 12, G = ["#12302a", "#1c4a36", "#2a6a48", "#173c30"];
        for (let y = a - 4; y < b + 4; y += 2) {
          const edge = Math.min(y - a + 4, b + 4 - y), r = Math.min(12, 3 + edge);
          for (let k = 0; k < 4; k++) {
            const x = vanX(Math.min(b, Math.max(a, y))) + (hash(y * 5 + k) - 0.5) * r * 1.8, w = 3 + Math.floor(hash(y * 7 + k) * r);
            f(x - w / 2, y - 1, w, 3, G[(y + k) % 4]);
            f(x - w / 2 + 1, y - 2, Math.max(1, w - 2), 1, G[(y + k + 2) % 4]);
          }
        }
        for (let y = a; y < b; y += 5) f(vanX(y) + (hash(y) - 0.5) * 8, y, 1, 1, "#3a8a5a");
      });
    },
    draw: ({ px, y0, h, live }) => {
      // the park sign at the gate
      { const y = y0 + 6, x = free(y, 14, 34);
        px(x + 4, y + 9, 2, 5, "#4a3020"); px(x + 28, y + 9, 2, 5, "#4a3020"); px(x, y, 34, 10, "#5a3a22"); px(x + 1, y + 1, 32, 8, "#6a4a2a");
        word(px, x + 3, y + 2, "SMOKIES", "#f2e8c8", null); px(x + 31, y + 2, 1, 6, "#f2e8c8"); }
      // Laurel Falls off to the side, a few elk in the meadow
      { const y = y0 + 40, x = free(y, 30, 12, roadX(y) > MID ? "l" : "r");
        px(x, y, 12, 4, "#4a4a44"); px(x + 4, y + 2, 4, 22, "#bfe6f6"); px(x + 2, y + 24, 8, 4, "#2f6fb0"); px(x + 1, y + 23, 10, 1, "#e8f8ff");
        live.push({ k: "falls", x: x + 4, y: y + 3, w: 4, h: 20 }); }
      for (let k = 0; k < 3; k++) { const y = y0 + 100 + k * 10, x = free(y, 8, 10, roadX(y) > MID ? "l" : "r") + (k % 2) * 4;
        px(x + 1, y + 3, 6, 3, "#8a5a2a"); px(x + 7, y + 1, 2, 3, "#6a4020"); px(x + 6, y - 1, 1, 2, "#d8c8a8"); px(x + 8, y - 1, 1, 2, "#d8c8a8"); px(x + 1, y + 6, 1, 2, "#3a2a1a"); px(x + 6, y + 6, 1, 2, "#3a2a1a"); px(x, y + 3, 1, 2, "#e8d8b0"); }
      for (const yy of [y0 + 24, y0 + h - 18]) { const xx = free(yy, 10, 18); pine(px, xx + 3, yy, "#12302a"); pine(px, xx + 9, yy + 2, "#12302a"); pine(px, xx + 15, yy, "#12302a"); }
    },
  },
  waffle: {
    ground: ["#4f8a3c", "#457a35"],
    edge: pick(ePine, eTree),
    // Cherokee: the Waffle House, its yellow sign up high, the river and the painted bears
    draw: ({ ctx, px, y0, h }) => {
      let y = roomiest(y0 + 4, y0 + 12, 34), x = free(y - 1, 36, 52);
      px(x + 25, y + 30, 2, 8, "#7a7a7a");
      px(x, y, 52, 30, "#111");
      bigWord(px, x + 4, y + 3, "WAFFLE", "#111", "#ffd23f", 2); bigWord(px, x + 8, y + 17, "HOUSE", "#111", "#ffd23f", 2);
      y = y0 + 50; x = free(y, 22, 34);
      px(x, y, 34, 1, "#4a3a2a"); px(x, y + 1, 34, 3, "#ffd23f");
      px(x + 1, y + 4, 32, 14, "#e8d8b0"); px(x + 1, y + 17, 32, 1, "#8a6a4a");
      for (let k = 3; k < 30; k += 6) px(x + k, y + 7, 4, 4, "#ffe9a0");
      px(x + 26, y + 10, 3, 8, "#5a3a1a");
      person(px, x + 10, y + 19, "#3a3a3a", "#1a1a1a"); person(px, x + 18, y + 19, "#e8e8e8", "#1a1a1a");
      flagPole(px, x - 3, y - 8, 14, 7, 4);
      // the Oconaluftee: a river under the road
      { const ry = y0 + 82, raw: Px = (x, y, w, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, hh); };
        for (let x2 = 0; x2 < W; x2++) { const yy = ry + Math.round(3 * Math.sin(x2 / 11)); raw(x2, yy, 1, 6, "#3a7ac0"); raw(x2, yy + 1, 1, 1, "#7ab8e8"); if ((x2 * 7) % 13 === 0) raw(x2, yy + 3, 2, 1, "#e8f8ff"); }
        for (let yy = ry - 3; yy < ry + 10; yy++) { const r = roadX(yy); raw(r - 6, yy, 13, 1, "#8a8a92"); raw(r - 4, yy, 9, 1, "#3a3a3e"); raw(r - 4, yy, 1, 1, "#e8e8e8"); raw(r + 4, yy, 1, 1, "#e8e8e8"); if (yy % 6 < 3) raw(r, yy, 1, 1, "#ffd23f"); } }
      // painted bear statues along the walk
      for (let k = 0; k < 4; k++) { const yy = y0 + 98 + (k % 2) * 12, xx = free(yy, 8, 40, k < 2 ? "l" : "r") + (k % 2) * 16;
        const c = ["#3a6fd8", "#e0302f", "#ffd23f", "#2faa4a"][k];
        px(xx, yy + 2, 8, 4, c); px(xx + 6, yy, 3, 3, c); px(xx + 6, yy - 1, 1, 1, c); px(xx + 8, yy + 1, 1, 1, "#111");
        px(xx + 1, yy + 6, 1, 2, c); px(xx + 6, yy + 6, 1, 2, c); px(xx + 2, yy + 3, 3, 1, "#f2f2f2"); px(xx - 1, yy + 8, 11, 1, "#9a9a9a"); }
    },
  },
  tunnel: {
    ground: ["#3f7a3a", "#35693a"],
    edge: pick(ePine),
    under: ({ px, y0 }) => {               // the mountain, then the overlook and the lakes far below
      for (let y = y0 + 8; y < y0 + 44; y++) for (let x = 0; x < W; x++) px(x, y, 1, 1, (x * 7 + y * 3) % 9 === 0 ? "#5a5048" : (y - y0 < 12 || y - y0 > 40) ? "#7a7068" : "#6a6058");
      for (let x = 0; x < W; x += 3) pine(px, x, y0 + 2 + (x % 5), "#1f5a2a");
      for (let x = 0; x < W; x += 4) pine(px, x + 1, y0 + 36 + (x % 3), "#2a6a30");
    },
    // through the mountain, then out on a cliff over the lakes
    draw: ({ px, y0, h, live, canopy }) => {
      const y = y0 + 52;
      const LAKES = [[20, 18, 18, 9], [104, 26, 20, 11], [30, 50, 24, 9], [100, 60, 16, 7], [18, 80, 14, 6], [110, 88, 14, 6]];
      for (let x2 = 0; x2 < W; x2++) if (Math.abs(x2 - roadX(y)) > 6) { px(x2, y, 1, 2, "#8a8278"); if (x2 % 3 === 0) px(x2, y - 2, 1, 2, "#5a5048"); }
      for (let yy = y + 2; yy < y0 + h; yy++) for (let x2 = 0; x2 < W; x2++) {
        const r = roadX(yy); if (Math.abs(x2 - r) < 7) continue;
        const v = Math.max(...LAKES.map(([cx, cy, rx, ry]) => 1 - ((x2 - cx) / rx) ** 2 - ((yy - y - cy) / ry) ** 2));
        px(x2, yy, 1, 1, v > 0.25 ? (v > 0.8 && (x2 + yy) % 3 === 0 ? "#4ab8e0" : "#2f9ac8") : v > 0 ? "#d8e8c8" : (yy - y < 4 ? "#7a7068" : (x2 * 3 + yy) % 7 === 0 ? "#2f7a32" : "#3f8a3a"));
      }
      for (const [cx, cy] of [[20, 18], [104, 26], [30, 50]]) { const iy = y + cy; px(cx - 3, iy, 7, 2, "#3f8a3a"); pine(px, cx, iy - 5, "#1f5a2a"); pine(px, cx + 3, iy - 4, "#1f5a2a"); }
      // a little boat with a wake
      live.push({ k: "fn", fn: (f, t) => { const u = (t * 0.04) % 1, bx = 104 - 14 + u * 28, by = y + 26 + Math.sin(u * 6) * 3; f(bx, by, 3, 1, "#f2f2f2"); f(bx - 3, by, 3, 1, "#8ad0f0"); } });
      live.push({ k: "glint", x: 0, y: y + 4, w: W, h: h - 58 });
      // overlook railing + a scenic sign, two people taking it in
      { const ox = free(y - 8, 8, 30); px(ox, y - 3, 30, 1, "#5a3a22"); for (let k = 0; k < 30; k += 4) px(ox + k, y - 3, 1, 3, "#5a3a22");
        person(px, ox + 8, y - 11, "#e0302f", "#3a2a1a"); person(px, ox + 13, y - 11, "#3a6fd8", "#ffd23f"); }
      canopy.push((f) => {                 // the mountain the tunnel goes through
        const a = y0 + 12, b = y0 + 40;
        for (let yy = a; yy < b; yy++) { const x = roadX(yy); f(x - 7, yy, 15, 1, (yy * 7 + Math.floor(x)) % 5 === 0 ? "#5a5048" : "#6a6058"); }
        for (let yy = a; yy < b; yy += 3) f(roadX(yy) - 6 + ((yy * 3) % 11), yy, 2, 1, "#2f6a32");
        for (const [yy, s] of [[a, 1], [b - 1, -1]] as const) {
          const x = roadX(yy);
          f(x - 7, yy - s, 15, 1, "#8a8278"); f(x - 6, yy, 13, 1, "#9a928a");
          f(x - 4, yy + (s > 0 ? 1 : -1), 9, 1, "#1a1614");
        }
      });
    },
  },
  antique: {
    ground: ["#7a9a45", "#6b893c"],
    edge: pick(eTree, eCow),
    // the dam, then the farm antique store flying its flags
    draw: ({ px, y0, live }) => {
      let y = y0 + 4, x = free(y, 32, 44);
      px(x, y, 44, 13, "#2f6fb0"); px(x + 3, y + 3, 12, 1, "#5f9fe0"); px(x + 22, y + 8, 12, 1, "#5f9fe0");
      px(x - 1, y + 13, 46, 5, "#c8c4b8"); px(x - 1, y + 13, 46, 1, "#e8e4d8");
      for (let k = 2; k < 44; k += 5) px(x + k, y + 14, 1, 4, "#9a968a");
      for (const fx of [12, 26]) { px(x + fx, y + 18, 7, 12, "#8ac8f0"); live.push({ k: "falls", x: x + fx, y: y + 18, w: 7, h: 12 }); }
      px(x + 8, y + 30, 30, 2, "#e8f8ff");
      y = y0 + 58; x = free(y - 14, 66, 36);
      px(x, y + 10, 30, 16, "#a8302a"); for (let r = 0; r < 7; r++) px(x + 6 - r, y + 3 + r, 18 + 2 * r, 1, "#5a2a1a");
      px(x + 10, y + 16, 10, 10, "#3a1a14"); px(x + 11, y + 16, 1, 10, "#f2f2f2"); px(x + 18, y + 16, 1, 10, "#f2f2f2"); px(x + 14, y + 16, 2, 10, "#f2f2f2");
      px(x + 3, y + 13, 4, 4, "#f2e8b0"); px(x + 23, y + 13, 4, 4, "#f2e8b0");
      px(x + 7, y - 6, 1, 6, "#5a3a1a"); px(x + 22, y - 6, 1, 6, "#5a3a1a"); px(x - 2, y - 13, 34, 8, "#f2e8c8"); px(x - 2, y - 13, 34, 1, "#5a2a1a");
      word(px, x, y - 11, "ANTIQUES", "#5a2a1a", null);
      px(x + 1, y + 28, 4, 4, "#8a6a42"); px(x + 2, y + 29, 2, 2, "#3a2a1a");                     // a wagon wheel, an old tractor, a rusty sign
      px(x + 8, y + 28, 8, 4, "#c84a2a"); px(x + 8, y + 32, 3, 3, "#1a1a1a"); px(x + 14, y + 31, 4, 4, "#1a1a1a"); px(x + 12, y + 26, 1, 2, "#5a5a5a");
      px(x + 20, y + 28, 6, 4, "#c8a030"); px(x + 21, y + 29, 4, 1, "#8a3a1a");
      for (let k = 0; k < 5; k++) {
        const fx = x + k * 9, fy = y + 38;
        px(fx, fy, 1, 13, "#cfcfcf");
        live.push({ k: "flag", x: fx + 1, y: fy, w: 7, h: 5, kind: (["us", "dixie", "ferrari", "weed", "us"] as const)[k] });
      }
    },
  },
  fair: {
    ground: ["#3f6a42", "#38603a"],
    night: true,
    edge: pick(eOwl, ePine),
    // the county fair after dark: a mountain string band, a Ferris wheel, the animals watching —
    // and the Mothman looming over all of it
    draw: ({ ctx, px, y0, h, live, glow }) => {
      let y = roomiest(y0 + 5, y0 + 12, 24), x = free(y - 3, 24, 40);
      px(x, y + 14, 40, 5, "#d8b048"); px(x, y + 14, 40, 1, "#e8c858"); px(x, y + 19, 40, 2, "#a8803a");    // hay-bale stage
      px(x, y - 3, 40, 1, "#3a3a3a");
      const band: [string, number][] = [["#3a5a9a", 2], ["#3a5a9a", 11], ["#3a5a9a", 20], ["#3a5a9a", 30]];
      band.forEach(([c, dx], k) => {
        px(x + dx + 1, y + 2, 3, 1, ["#6a4a2a", "#1a1a1a", "#c8a060", "#5a3a1a"][k]); px(x + dx + 1, y + 3, 3, 2, "#e0b090");
        px(x + dx + 1, y + 5, 3, 6, c); px(x + dx + 1, y + 5, 3, 1, "#e0302f"); px(x + dx + 1, y + 11, 1, 3, "#2a2a3a"); px(x + dx + 3, y + 11, 1, 3, "#2a2a3a");
      });
      px(x + 5, y + 6, 3, 3, "#e8e2d0"); px(x + 8, y + 5, 3, 1, "#6a4a2a");
      px(x + 14, y + 3, 2, 1, "#8a4a1a"); px(x + 15, y + 2, 1, 1, "#d8d8d8");
      px(x + 23, y + 8, 5, 5, "#9aa0a8"); px(x + 24, y + 1, 1, 7, "#8a6a42");
      px(x + 34, y + 5, 3, 5, "#c8ccd2");
      usFlag(px, x + 1, y + 15, 7, 4); usFlag(px, x + 32, y + 15, 7, 4);
      const lights: [number, number][] = []; for (let k = 0; k < 13; k++) lights.push([x + 1 + k * 3, y - 2]);
      // a Ferris wheel and a corn dog stand
      const wy = y0 + 58, wr = 14, wx = free(wy - wr, wr * 2 + 6, wr * 2 + 2) + wr + 1;
      px(wx - 8, wy, 1, wr + 4, "#8a8a8a"); px(wx + 8, wy, 1, wr + 4, "#8a8a8a"); px(wx - 7, wy + 6, 1, 1, "#8a8a8a");
      live.push({ k: "fn", fn: (f, t) => {
        for (let a = 0; a < 48; a++) { const th = a / 48 * Math.PI * 2; f(wx + Math.cos(th) * wr, wy + Math.sin(th) * wr, 1, 1, "#d8d8e8"); }
        for (let k = 0; k < 8; k++) {
          const th = k / 8 * Math.PI * 2 + t * 0.4, cx = wx + Math.cos(th) * wr, cy = wy + Math.sin(th) * wr;
          for (let s = 1; s < wr; s += 2) f(wx + Math.cos(th) * s, wy + Math.sin(th) * s, 1, 1, "#9a9aa8");
          f(cx - 1, cy, 3, 2, ["#e0302f", "#ffd23f", "#3a6fd8", "#2faa4a"][k % 4]);
          f(cx, cy - 1, 1, 1, Math.floor(t * 3 + k) % 2 ? "#fff6c0" : "#ff8a1f");
        }
        f(wx - 1, wy - 1, 3, 3, "#f2f2f2");
      } });
      { const sy = y0 + 84, sx = free(sy, 14, 20);
        px(sx, sy + 4, 20, 9, "#e0302f"); px(sx, sy + 4, 20, 2, "#ffd23f"); px(sx + 2, sy + 7, 16, 3, "#ffe9a0"); px(sx + 6, sy, 9, 4, "#c8822a"); px(sx + 15, sy + 1, 3, 1, "#e8d8b0");
        lights.push([sx + 2, sy + 8], [sx + 8, sy + 8], [sx + 14, sy + 8]);
        person(px, sx + 4, sy + 14, "#3a6a9a", "#c8a060"); person(px, sx + 12, sy + 14, "#e8e8e8", "#1a1a1a"); }
      // the midway: game booths with their bulbs on, folks wandering between
      { const my2 = y0 + 106, side2: "l" | "r" = room(my2, 30).left >= room(my2, 30).right ? "r" : "l";
        for (let k = 0; k < 3; k++) {
          const by = my2 + k * 14, r = room(by, 12), bw = 18, bx = side2 === "l" ? Math.floor(r.lo - 10 - bw) : Math.ceil(r.hi + 10);
          const c = ["#3a6fd8", "#2faa4a", "#b04ad8"][k];
          px(bx, by, bw, 3, c); px(bx, by + 3, bw, 1, "#ffd23f"); px(bx + 1, by + 4, bw - 2, 7, "#2a1e16"); px(bx, by + 11, bw, 1, "#8a6a42");
          for (let j = 0; j < 4; j++) px(bx + 3 + j * 4, by + 6, 2, 2, ["#ff5ad1", "#ffd23f", "#5af0ff", "#ff8a1f"][(j + k) % 4]);   // the prizes
          for (let j = 0; j < 5; j++) lights.push([bx + 1 + j * 4, by - 1]);
          person(px, bx + (side2 === "l" ? bw + 2 : -5), by + 3, ["#e0302f", "#f2f2f2", "#ffd23f"][k], "#3a2a1a");
        } }
      // the Mothman, Point Pleasant's own, on a ridge above the fair
      const my = y0 + 104, mx = free(my - 4, 40, 44, room(y0 + 116, 30).left >= room(y0 + 116, 30).right ? "l" : "r") + 1;
      mothman(px, mx, my);
      live.push({ k: "fn", fn: (f, t, ctx) => {
        const on = (t * 0.5) % 1 > 0.08;
        if (on) for (const ex of [mx + 17, mx + 22]) {
          for (let k = 2; k > 0; k--) { ctx.globalAlpha = 0.18; f(ex - k, my + 3 - k, 2 + 2 * k, 2 + 2 * k, "#ff2010"); }
          ctx.globalAlpha = 1; f(ex, my + 3, 2, 2, "#ff2a1a"); f(ex, my + 3, 1, 1, "#ffd0a0");
        }
      } });
      // possum, raccoon, owl, crow, black cat, coyote: eyes that catch the light
      const eyes: [number, number, string][] = [];
      for (let k = 0; k < 12; k++) {
        const yy = y0 + 4 + Math.floor((k * (h - 10)) / 12), side = k % 2, r = room(yy, 4);
        const xx = side ? Math.min(W - 6, Math.round(r.hi + 8 + (k % 3) * 9)) : Math.max(1, Math.round(r.lo - 12 - (k % 3) * 9));
        if ((side && xx > r.hi + 6) || (!side && xx + 4 < r.lo - 6)) {
          const kind = k % 6;
          if (kind === 0) { px(xx, yy + 1, 4, 2, "#b8b8b8"); px(xx + 4, yy + 2, 2, 1, "#f2a8b8"); px(xx - 1, yy + 1, 1, 1, "#f2f2f2"); }
          if (kind === 1) { px(xx, yy + 1, 4, 2, "#5a5a5a"); px(xx, yy + 1, 4, 1, "#1a1a1a"); px(xx + 4, yy + 2, 2, 1, "#3a3a3a"); }
          if (kind === 2) { px(xx + 1, yy + 3, 1, 4, "#5a3a1a"); px(xx, yy, 3, 3, "#6a5a4a"); }
          if (kind === 3) { px(xx, yy + 1, 3, 2, "#111"); px(xx + 3, yy + 1, 1, 1, "#3a3a3a"); }
          if (kind === 4) { px(xx, yy + 1, 3, 3, "#111"); px(xx, yy, 1, 1, "#111"); px(xx + 2, yy, 1, 1, "#111"); px(xx + 3, yy + 3, 2, 1, "#111"); }
          if (kind === 5) { px(xx, yy + 1, 5, 2, "#8a7a5a"); px(xx, yy, 1, 1, "#8a7a5a"); px(xx + 2, yy + 3, 1, 1, "#8a7a5a"); }
          eyes.push([xx, yy + 1, kind === 2 ? "#ffd23f" : kind === 4 ? "#7aff5a" : "#ff5a3a"]);
        }
      }
      live.push({ k: "eyes", pts: eyes });
      glow.push((f) => { for (const [lx, ly] of lights) { halo(ctx, f, lx, ly, 3, "#ffd88a", 0.35); f(lx, ly, 1, 1, ["#ffd23f", "#ff8a1f", "#fff6c0"][(lx + ly) % 3]); } halo(ctx, f, wx, wy, 16, "#ffe0a0", 0.12); });
    },
  },
  dish: {
    ground: ["#5a8f42", "#4f7f3a"],
    edge: pick(ePine),
    // Green Bank: the telescope (rendered, badly out of place), NO CELL SERVICE, an alien behind
    // a tree, and the woods full of famous monsters
    draw: ({ px, y0, h, live, hd }) => {
      let y = y0 + 4, x = free(y, 64, 44);
      hd.push({ x, y, w: 44, h: 64, draw: (g, w, hh) => drawDish3D(g, w, hh) });
      // the sign: big, by the road
      y = y0 + 74; x = free(y, 26, 40, roadX(y) > MID ? "l" : "r");
      hd.push({ x, y, w: 40, h: 26, res: 10, draw: (g, w, hh) => drawNoCell(g, w, hh) });
      // the alien behind a tree (the canopy is pixels, the alien + trunk hi-res)
      y = y0 + 112; x = free(y - 10, 40, 26);
      for (let r = 0; r < 12; r++) { const w = Math.round(26 - Math.abs(r - 5) * 2.2); px(x + 13 - Math.floor(w / 2), y - 12 + r, w, 1, r % 3 ? "#2f7a2a" : "#3a8a32"); }
      px(x + 8, y - 10, 4, 1, "#5aa84a");
      hd.push({ x: x + 3, y: y - 2, w: 20, h: 26, anim: true, draw: drawAlien });
      // Slenderman among the pines, the Flatwoods Monster in a clearing
      { const sy = y0 + 136, sx = free(sy, 40, 30, roadX(sy) > MID ? "l" : "r");
        for (let k = 0; k < 5; k++) pine(px, sx + k * 6 + (k % 2), sy + (k % 3) * 8, "#1a4a24");
        slenderman(px, sx + 11, sy + 2); }
      { const fy = y0 + 150, fx = free(fy, 28, 18, roadX(fy) > MID ? "r" : "l"); flatwoods(px, fx, fy);
        live.push({ k: "fn", fn: (f, t) => { if ((t * 1.3) % 1 < 0.5) { f(fx + 6, fy + 6, 1, 1, "#fff0a0"); f(fx + 9, fy + 6, 1, 1, "#fff0a0"); } } }); }
      // the Jersey Devil, flapping across the treetops (big)
      live.push({ k: "fn", fn: (f0, t) => {
        const u = (t * 0.045) % 1, jx = -30 + u * (W + 60), jy = y0 + 26 + Math.sin(u * 9) * 10, flap = Math.floor(t * 5) % 2;
        const f = (x: number, y: number, w: number, h: number, c: string) => f0(jx + x * 2, jy + y * 2, w * 2, h * 2, c);
        const D = "#3a2418";
        f(0, 2, 9, 3, D); f(8, 0, 3, 3, D); f(10, -1, 2, 1, D); f(11, 1, 2, 2, D); f(9, 1, 1, 1, "#ff3010");   // horse head
        f(8, -2, 1, 2, "#d8c8a8"); f(10, -2, 1, 1, "#d8c8a8");
        for (let s2 = 0; s2 < 8; s2++) { const wy = flap ? -s2 * 0.7 : s2 * 0.4; f(2 + s2, 1 + wy - (flap ? 2 : 0), 1, 2, "#2a1a10"); }  // bat wings
        f(1, 5, 1, 2, D); f(7, 5, 1, 2, D); f(-4, 3, 4, 1, D); f(-5, 2, 1, 1, D); f(-5, 4, 1, 1, D); // hooves, forked tail
      } });
    },
  },
  sunset: {
    ground: ["#3a2a4a", "#33253f"],
    under: ({ ctx, px, y0, h }) => {
      const SKY = ["#2a1f4a", "#4a2a6a", "#7a3a7a", "#b84a6a", "#e86a4a", "#f8a04a", "#ffd07a"];
      for (let y = 0; y < 44; y++) px(0, y0 + y, W, 1, SKY[Math.min(6, Math.floor(y / 6.3))]);
      for (let k = -9; k <= 0; k++) { const ww = Math.round(Math.sqrt(81 - k * k)); px(92 - ww, y0 + 41 + k, 2 * ww + 1, 1, k > -3 ? "#fff6c8" : "#fff0b0"); }
      for (let k = 0; k < 4; k++) { ctx.globalAlpha = 0.5; px(70 + k * 3, y0 + 18 + k * 5, 26 - k * 4, 1, "#ffe0b0"); ctx.globalAlpha = 1; }
      const R = ["#6a3a6a", "#4a2a5a", "#38224a", "#2a1a3a", "#1f1430"];
      R.forEach((c, k) => {
        const base = y0 + 42 + k * ((h - 42) / 5);
        for (let x = 0; x < W; x++) {
          const top = Math.round(base - (5 + k * 1.5) * (0.55 * Math.sin(x / (9 + k * 2) + k * 2.1) + 0.45 * Math.sin(x / (3.7 + k) + k)) - 4);
          px(x, top, 1, base + (h - 42) / 5 + 4 - top, c);
        }
        ctx.globalAlpha = 0.35; px(0, base + 2, W, 2, "#f8a07a"); ctx.globalAlpha = 1;
      });
    },
    draw: ({ px, y0, live }) => {
      // a radio tower on a ridge, its light blinking; birds heading home
      const ty = y0 + 50, tx = free(ty, 30, 9);
      for (let r = 0; r < 28; r++) px(tx + 4 - Math.floor(r / 10), ty + r, 1 + 2 * Math.floor(r / 10), 1, "#1a1020");
      live.push({ k: "fn", fn: (f, t) => { if ((t * 0.9) % 1 < 0.5) f(tx + 4, ty - 1, 1, 1, "#ff3b3b");
        for (let k = 0; k < 5; k++) { const bx = (t * 6 + k * 7) % (W + 20) - 10, by = y0 + 10 + k * 2 + Math.sin(t * 2 + k) * 1.5, w = Math.floor(t * 4 + k) % 2; f(bx, by, 1, 1, "#1a1020"); f(bx - 1, by - w, 1, 1, "#1a1020"); f(bx + 1, by - w, 1, 1, "#1a1020"); } } });
      // a farmhouse with its porch light on
      { const fy = y0 + 110, fx = free(fy, 14, 16); px(fx + 1, fy + 5, 14, 8, "#1a1220"); for (let r = 0; r < 5; r++) px(fx + 8 - r - 1, fy + r, 2 * r + 2, 1, "#120c18");
        px(fx + 4, fy + 8, 2, 2, "#ffd88a"); px(fx + 10, fy + 8, 2, 2, "#ffd88a"); }
    },
  },
  mcd: {
    ground: ["#4a6a3a", "#40603a"],
    night: true,
    edge: pick(eTree),
    // night falls: the drive-thru, where the first interview after the news happened
    draw: ({ ctx, px, y0, h, glow }) => {
      const m = (DRIVE.a + DRIVE.b) / 2, dir = DRIVE.dir;
      const y = Math.round(m - 24);
      let lo = 999, hi = -999; for (let k = -24; k < 52; k++) { lo = Math.min(lo, vanX(y + k)); hi = Math.max(hi, vanX(y + k)); }
      const BW = 24, BH = 46, x = Math.round(dir > 0 ? hi + 6 : lo - 6 - BW);
      // the parking lot behind it
      const lx = dir > 0 ? x + BW + 9 : 1, lw = dir > 0 ? W - 1 - lx : x - 9;
      if (lw > 6) { px(lx, y - 6, lw, BH + 14, "#3a3a3e"); for (let k = 0; k < lw; k += 6) { px(lx + k, y - 6, 1, 8, "#d8d8d8"); px(lx + k, y + BH, 1, 8, "#d8d8d8"); }
        for (let k = 0; k * 6 + 2 < lw - 3; k++) { if (hash(k) > 0.45) px(lx + 2 + k * 6, y - 5, 3, 5, ["#e0302f", "#3a6fd8", "#e8e8e8", "#2a2a2a"][k % 4]); if (hash(k + 9) > 0.5) px(lx + 2 + k * 6, y + BH + 2, 3, 5, ["#ffd23f", "#8a8a8a", "#2faa4a"][k % 3]); } }
      for (let yy = DRIVE.a + 24; yy < DRIVE.b - 24; yy++) {                                    // the lot, inside the drive-thru loop
        const r = roadX(yy), v = vanX(yy), a = Math.ceil(Math.min(r, v) + (dir > 0 ? 7 : 5)), b2 = Math.floor(Math.max(r, v) - (dir > 0 ? 5 : 7));
        if (b2 - a < 4) continue;
        px(a, yy, b2 - a + 1, 1, "#3a3a3e");
        if (yy % 7 === 0) px(a + 1, yy, b2 - a - 1, 1, "#c8c8c8");
        else if (yy % 7 === 3 && hash(yy) > 0.35) { const cx = a + 2 + Math.floor(hash(yy * 3) * Math.max(1, b2 - a - 6)); px(cx, yy - 2, 3, 5, ["#e0302f", "#3a6fd8", "#e8e8e8", "#ffd23f"][yy % 4]); px(cx, yy - 1, 3, 1, "#1a2a3a"); }
      }
      px(x, y, BW, BH, "#c8302a"); px(x, y, BW, 4, "#ffd23f"); px(x, y + 4, BW, 1, "#8a1a14");
      px(x + 3, y + 8, BW - 6, 10, "#f2e8b0"); px(x + 3, y + 22, BW - 6, 10, "#f2e8b0"); px(x + BW / 2 - 1, y + 8, 1, 24, "#8a1a14");
      px(dir > 0 ? x : x + BW - 1, y + 20, 1, 6, "#cfe8ff");                                    // the window
      px(x + 4, y + 36, 6, 9, "#cfe8ff"); px(x + 14, y + 36, 6, 9, "#cfe8ff");
      // golden arches up on a tall pole
      const ax = Math.round(dir > 0 ? x + 2 : x + 2), ay = y - 30;
      px(ax + 9, ay + 13, 2, 17, "#9a9a9a");
      const arch = (f: Px, c: string) => { for (const ox of [0, 10]) { f(ax + ox, ay + 3, 2, 10, c); f(ax + ox + 8, ay + 3, 2, 10, c); f(ax + ox + 2, ay, 6, 2, c); f(ax + ox + 1, ay + 1, 2, 2, c); f(ax + ox + 7, ay + 1, 2, 2, c); } };
      arch(px, "#ffc72c");
      const mb = dir > 0 ? x + BW + 3 : x - 7;
      px(mb, y + 4, 5, 9, "#1a1a1a"); px(mb + 1, y + 5, 3, 7, "#ffd23f");                          // menu board
      person(px, dir > 0 ? x - 2 : x + BW - 1, y + 28, "#e0302f", "#3a2a1a", "#2a2a3a", "#c08a5a"); // our interviewee, out by the lane
      flagPole(px, dir > 0 ? x + BW - 2 : x + 1, y - 22, 20, 8, 5);
      // a motel across the highway, VACANCY in neon
      const neon: [number, number][] = [];
      { const my = y0 + 40, side2: "l" | "r" = dir > 0 ? "l" : "r", r = room(my, 60), mw = 26, mx = side2 === "l" ? Math.floor(r.lo - 10 - mw) : Math.ceil(r.hi + 10);
        for (let k = 0; k < 6; k++) { const ry = my + 8 + k * 8; px(mx, ry, mw, 7, "#c8b898"); px(mx, ry, mw, 1, "#8a7a6a"); for (let j = 0; j < 4; j++) { px(mx + 2 + j * 6, ry + 2, 2, 5, "#5a3a2a"); px(mx + 5 + j * 6, ry + 2, 2, 2, "#2a3040"); if (hash(k * 5 + j) > 0.5) neon.push([mx + 5 + j * 6, ry + 2]); } }
        px(mx + 2, my - 14, 1, 14, "#5a5a5a"); px(mx - 4, my - 22, 28, 9, "#1a1a1a");
        word(px, mx - 2, my - 20, "VACANCY", "#ff3b6a", null);
        for (let k = 0; k < 3; k++) px(mx + mw + 2, my + 10 + k * 14, 3, 6, ["#3a6fd8", "#8a8a8a", "#e0302f"][k]);
        neon.push([-1, my - 20], [mx, 0]); }
      // streetlights along the highway
      const lamps: [number, number][] = [];
      for (let ly = y0 + 8; ly < y0 + h - 4; ly += 22) { const r = room(ly, 2), s = (ly / 22) % 2 < 1 ? -1 : 1, lxx = s < 0 ? Math.floor(r.lo - 8) : Math.ceil(r.hi + 7);
        if (ly > y - 34 && ly < y + BH + 8) continue;
        px(lxx, ly, 1, 7, "#5a5a5a"); px(lxx + (s < 0 ? 1 : -2), ly, 2, 1, "#5a5a5a"); lamps.push([lxx + (s < 0 ? 2 : -2), ly]); }
      glow.push((f) => {
        halo(ctx, f, ax + 10, ay + 6, 10, "#ffc72c", 0.4); arch(f, "#ffd84a");
        halo(ctx, f, x + BW / 2, y + 20, 18, "#ffe0a0", 0.18);
        f(x + 3, y + 8, BW - 6, 10, "#fff4c8"); f(x + 3, y + 22, BW - 6, 10, "#fff4c8"); f(x + 4, y + 36, 6, 9, "#fff8e0"); f(x + 14, y + 36, 6, 9, "#fff8e0");
        f(x, y, BW, 4, "#ffd23f"); f(mb + 1, y + 5, 3, 7, "#ffe46a"); halo(ctx, f, mb + 2, y + 8, 5, "#ffe46a", 0.3);
        for (const [a, b] of lamps) { halo(ctx, f, a, b + 2, 7, "#ffd88a", 0.28); f(a, b, 1, 1, "#fff6d0"); }
        const [, vy] = neon[neon.length - 2], [vx] = neon[neon.length - 1];
        halo(ctx, f, vx + 12, vy + 2, 12, "#ff3b6a", 0.2); word(f, vx - 2, vy, "VACANCY", "#ff5a8a", null);
        for (const [a, b] of neon.slice(0, -2)) { f(a, b, 2, 2, "#ffe0a0"); halo(ctx, f, a, b, 2, "#ffd88a", 0.2); }
      });
    },
  },
  dc: {
    ground: ["#2f6a32", "#285c2c"],
    night: true,
    edge: pick(eTree),
    under: ({ px, y0, h, rnd }) => {
      // the road comes in through the forest...
      for (let k = 0; k < 160; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * 36); px(x - 2, y, 5, 4, ["#1f5a2a", "#2a6a32", "#174a24"][k % 3]); px(x - 1, y - 1, 3, 1, "#3a7a3a"); }
      // ...into town: brick sidewalks along the rowhouse blocks
      for (let y = y0 + 40; y < y0 + 124; y++) { const r = roadX(y); px(0, y, Math.max(0, Math.floor(r - 6)), 1, "#8a7468"); px(Math.ceil(r + 6), y, W, 1, "#8a7468"); if (y % 5 === 0) { px(r - 9, y, 3, 1, "#6a5448"); px(r + 7, y, 3, 1, "#6a5448"); } }
      // the Mall: lawn, paths
      for (let y = y0 + 128; y < y0 + h; y++) { const r = roadX(y); for (let x = 0; x < W; x++) if (Math.abs(x - r) > 6) px(x, y, 1, 1, (x * 5 + y * 3) % 11 === 0 ? "#3a7a3a" : "#2f6e34"); }
    },
    // out of the forest into D.C. at night: rowhouses at street level, then the Mall: the Capitol,
    // the Monument, the White House, and the motorcade on its own avenue
    draw: ({ ctx, px, y0, h, live, glow }) => {
      const wins: [number, number][] = [];
      // rowhouses facing the road, both sides
      const ROW = ["#8a3a2a", "#a84a32", "#6a5a7a", "#c8b898", "#4a6a8a", "#9a5a3a", "#e8d8b8", "#5a7a5a"];
      for (const side of ["l", "r"] as const) {
        let yy = y0 + 42 + (side === "r" ? 6 : 0), n = side === "r" ? 3 : 0;
        while (yy < y0 + 112) {
          const hh = 14, r = room(yy, hh), avail = side === "l" ? Math.floor(r.lo - 10) : Math.floor(W - 1 - (r.hi + 10)), w = Math.min(avail, 46);
          if (w > 12) {
            const x = side === "l" ? Math.floor(r.lo - 10 - w) : Math.ceil(r.hi + 10);
            for (let hx = 0; hx < w; hx += 12) {
              const hw = Math.min(12, w - hx), c = ROW[(n + hx / 12) % ROW.length];
              px(x + hx, yy, hw, hh, c); px(x + hx, yy, hw, 2, shadeOf(c, 40)); px(x + hx, yy + 2, hw, 1, "#e8e0d0");
              for (let wx = 2; wx < hw - 2; wx += 4) { px(x + hx + wx, yy + 4, 2, 3, "#2a3040"); wins.push([x + hx + wx, yy + 4]); }
              if (hw >= 8) { const dx = side === "l" ? hw - 4 : 1; px(x + hx + dx, yy + 9, 3, 5, "#2a1810"); px(x + hx + dx - 1, yy + hh - 1, 5, 1, "#b8b0a8"); wins.push([x + hx + dx + 1, yy + 10]); }
              if ((n + hx) % 3 === 0 && hw >= 8) usFlag(px, x + hx + 3, yy + 8, 5, 3);
            }
            if (n % 2 === 0) { const tx = side === "l" ? x + w + 1 : x - 3; px(tx, yy + 6, 2, 3, "#1f5a2a"); px(tx, yy + 9, 1, 3, "#3a2a1a"); }
          }
          yy += hh + 4; n++;
        }
      }
      // people and scooters on the sidewalks
      sidewalkers(live, y0 + 40, y0 + 120, [-8, 7], ["#e0302f", "#f2f2f2", "#3a6fd8", "#ffd23f"], 10);
      live.push({ k: "fn", fn: (f, t) => {
        for (let k = 0; k < 6; k++) {
          const dir = k % 2 ? 1 : -1, span = 80, p = (t * (9 + k * 1.3) + k * 19) % span, y = dir > 0 ? y0 + 40 + p : y0 + 120 - p;
          const x = Math.round(roadX(y) + (k % 3 === 0 ? -9 : 8));
          f(x, y, 1, 4, "#4ad62a"); f(x - 1, y + (dir > 0 ? 3 : 0), 3, 1, "#4ad62a"); f(x, y + 1, 1, 2, ["#e8c0a0", "#8a5a3a", "#c08a5a"][k % 3]);
          f(x, y + (dir > 0 ? 4 : -1), 1, 1, "#fff6a0");
        }
      } });
      // the Mall, and the avenue the motorcade takes, running beside the highway
      const A = y0 + 128, B = y0 + h - 4, side = roadX((A + B) / 2) > MID ? -1 : 1, avX = (yy: number) => roadX(yy) + side * 17;
      for (let yy = A; yy < B; yy++) { const ax = avX(yy); px(ax - 3, yy, 7, 1, "#3a3a40"); px(ax - 4, yy, 1, 1, "#6a6a70"); px(ax + 4, yy, 1, 1, "#6a6a70"); if (yy % 6 < 3) px(ax, yy, 1, 1, "#d8d8d8"); }
      const far = (yy: number, w: number) => side > 0 ? Math.ceil(avX(yy) + 7) : Math.floor(avX(yy) - 7 - w);
      const near = (yy: number, w: number) => side > 0 ? Math.floor(roadX(yy) - 8 - w) : Math.ceil(roadX(yy) + 8);
      // the Capitol
      let cy = A + 4, cx = far(cy, 36);
      px(cx, cy + 14, 36, 10, "#e8e8ec"); px(cx, cy + 14, 36, 1, "#ffffff"); for (let k = 2; k < 36; k += 3) px(cx + k, cy + 17, 1, 6, "#b8b8c0");
      px(cx + 11, cy + 9, 14, 6, "#f2f2f2"); for (let r = 0; r < 4; r++) px(cx + 13 - r + 2, cy + 5 + r, 6 + 2 * r, 1, "#f2f2f2");
      px(cx + 16, cy + 2, 4, 3, "#f2f2f2"); px(cx + 17, cy, 2, 2, "#e8e8e8"); px(cx + 18, cy - 2, 1, 2, "#c8c8c8");
      for (let k = 12; k < 25; k += 2) px(cx + k, cy + 10, 1, 4, "#c8c8d0");
      px(cx + 15, cy + 25, 6, 3, "#c8c8d0"); flagPole(px, cx + 33, cy + 2, 12, 6, 4);
      // the reflecting pool and the Monument
      const my = A + 8, mr = room(my, 46), mx = side > 0 ? Math.floor(mr.lo - 22) : Math.ceil(mr.hi + 9);
      px(mx + 2, my + 44, 8, 22, "#2f5a8a"); px(mx + 3, my + 45, 2, 20, "#5a8ab8");
      px(mx + 4, my + 2, 4, 40, "#f2f2f2"); px(mx + 4, my + 2, 1, 40, "#d8d8dc"); px(mx + 5, my, 2, 2, "#f2f2f2"); px(mx + 5, my - 1, 1, 1, "#f2f2f2"); px(mx + 2, my + 42, 8, 2, "#c8c8c8");
      for (let k = 0; k < 10; k++) { const fx = mx + 6 + Math.round(9 * Math.cos(k / 10 * Math.PI * 2)), fy = my + 42 + Math.round(3 * Math.sin(k / 10 * Math.PI * 2)); px(fx, fy - 4, 1, 4, "#9a9a9a"); px(fx + 1, fy - 4, 2, 1, "#c8202a"); px(fx + 1, fy - 3, 2, 1, "#f2f2f2"); }
      // the Smithsonian Castle, rows of elms along the Mall
      { const sy = A + 46, sx = far(sy, 30);
        px(sx, sy + 6, 30, 10, "#8a3a2a"); for (const tx of [2, 13, 24]) { px(sx + tx, sy, 4, 8, "#7a3020"); px(sx + tx + 1, sy - 2, 2, 2, "#6a2818"); }
        for (let k = 2; k < 28; k += 3) px(sx + k, sy + 9, 1, 3, "#2a1810"); wins.push([sx + 4, sy + 9], [sx + 22, sy + 9]); }
      for (let yy = A + 4; yy < B - 6; yy += 7) for (const off of [-1, 1]) { const ex = Math.round(avX(yy) + side * 8 * off + (off < 0 ? side * -2 : 0)); if (off < 0) continue; px(ex - 1, yy, 3, 3, "#1f5a2a"); px(ex, yy - 1, 1, 1, "#2a6a32"); }
      // the White House, where the avenue ends
      const wy = B - 24, wx = far(wy, 28);
      px(wx, wy + 6, 26, 10, "#f2f2f2"); px(wx + 9, wy + 3, 8, 3, "#f2f2f2"); for (let k = 10; k < 17; k += 2) px(wx + k, wy + 6, 1, 6, "#d0d0d8");
      for (let k = 2; k < 25; k += 4) px(wx + k, wy + 9, 2, 3, "#2a3040"); px(wx + 12, wy + 12, 2, 4, "#2a2018"); flagPole(px, wx + 12, wy - 6, 9, 5, 3);
      px(wx - 2, wy + 17, 30, 3, "#3f8a3a"); px(wx + 11, wy + 16, 4, 6, "#c8c0b0");
      // the motorcade: lights flashing, the Beast in the middle, on its avenue
      live.push({ k: "fn", fn: (f, t) => {
        const span = B - A, head = B - ((t * 9) % (span + 40)), blink = Math.floor(t * 6) % 2;
        const car = (yy: number, c: string, w = 3, hh = 5) => { if (yy > A && yy < B - hh) { const x = Math.round(avX(yy)) - 1; f(x, yy, w, hh, c); return x; } return -999; };
        const m1 = car(head, "#1a1a1a", 2, 3); if (m1 > -999) { f(m1, head, 1, 1, blink ? "#3a6fff" : "#ff3b3b"); f(m1 + 1, head, 1, 1, blink ? "#ff3b3b" : "#3a6fff"); }
        const s1 = car(head + 6, "#111"); if (s1 > -999) f(s1, head + 5, 3, 1, "#fff6a0");
        const b = car(head + 13, "#0a0a0a", 3, 8);
        if (b > -999) { f(b, head + 13, 1, 1, "#e0302f"); f(b + 2, head + 13, 1, 1, "#3a6fd8"); f(b + 1, head + 16, 1, 1, "#f2f2f2"); f(b + 1, head + 15, 1, 1, "#f0c8a0"); f(b, head + 12, 3, 1, "#fff6a0"); }
        car(head + 24, "#111"); const m2 = car(head + 31, "#1a1a1a", 2, 3); if (m2 > -999) f(m2 + 1, head + 31, 1, 1, blink ? "#ff3b3b" : "#3a6fff");
        if ((t * 0.8) % 1 < 0.5) f(mx + 5, my - 1, 1, 1, "#ff3b3b");                                    // the Monument's warning lights
        if ((t * 0.8 + 0.5) % 1 < 0.5) f(mx + 6, my + 6, 1, 1, "#ff3b3b");
      } });
      // streetlights on the Mall
      const lamps: [number, number][] = [];
      for (let yy = A + 2; yy < B - 4; yy += 16) { const lx = Math.round(avX(yy) + side * 5); px(lx, yy, 1, 4, "#5a5a5a"); lamps.push([lx, yy]); }
      glow.push((f) => {
        for (const [a, b] of wins) if (hash(a * 31 + b) > 0.3) { f(a, b, 2, 3, hash(a + b * 7) > 0.5 ? "#ffd88a" : "#fff0c0"); halo(ctx, f, a, b + 1, 2, "#ffd88a", 0.18); }
        // the Capitol and the Monument, floodlit
        halo(ctx, f, cx + 18, cy + 10, 16, "#e8f0ff", 0.22);
        f(cx + 11, cy + 9, 14, 6, "#ffffff"); for (let r = 0; r < 4; r++) f(cx + 13 - r + 2, cy + 5 + r, 6 + 2 * r, 1, "#ffffff"); f(cx + 16, cy + 2, 4, 3, "#ffffff");
        f(cx, cy + 14, 36, 2, "#f8f8ff");
        halo(ctx, f, mx + 6, my + 20, 12, "#e8f0ff", 0.18); f(mx + 4, my + 2, 4, 40, "#ffffff"); f(mx + 4, my + 2, 1, 40, "#e0e0e8");
        halo(ctx, f, wx + 13, wy + 10, 12, "#e8f0ff", 0.18); f(wx, wy + 6, 26, 3, "#ffffff");
        for (const [a, b] of lamps) { halo(ctx, f, a, b + 1, 6, "#ffd88a", 0.28); f(a, b, 1, 1, "#fff6d0"); }
        for (let yy = y0 + 44; yy < y0 + 122; yy += 14) for (const s of [-8, 7]) { const lx = Math.round(roadX(yy) + s); halo(ctx, f, lx, yy, 5, "#ffd88a", 0.2); f(lx, yy, 1, 1, "#fff6d0"); }
      });
    },
  },
};

/* ---------- the out-of-place 3D render (Green Bank) ---------- */

// smooth, shaded, nothing like the rest: drawn onto its own hi-res canvas
function drawDish3D(ctx: CanvasRenderingContext2D, w: number, h: number) {
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

