// The crash at the Trade Winds, Tulsa. The sun goes down over Kansas, the map bends away, and the
// van parks in the Tulsa hold; while you keep scrolling, RoadRail shows drawSeq full-frame:
//   CRASH   the van comes through the bar wall, bricks and glass everywhere
//   BAR     inside: red light, the bartender and her TIP jar, rattlesnakes, a pit viper on the bar,
//           the dog under the pool table, the regulars turning round to look at you
//   NEWS    the TV over the bar: the most dramatic BREAKING NEWS ever broadcast
//   HALL    out the back, a motel hallway, the lights going, something at the far end
//   SCARE   it's right there
// Chunky 96x96 pixels on a 384 canvas. Each cut remounts the canvas in RoadRail (white flash + shake).

import { GLYPH } from "./kit";

const N = 96;
const CUTS = [0, 0.16, 0.4, 0.62, 0.8];          // where each panel starts, as a fraction of the hold
export const PANELS = CUTS.length;
export const panelAt = (u: number) => { let k = 0; while (k < PANELS - 1 && u >= CUTS[k + 1]) k++; return k; };

const h1 = (n: number) => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const MORE: Record<string, string> = {
  J: "011001001101010", Z: "111001010100111", "!": "010010010000010", "?": "111001011000010", ".": "000000000000010",
  "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111", "4": "101101111001001",
};

let last = -1, t0 = 0;                           // when the current panel came up (for the timed beats)

type Pf = (x: number, y: number, w: number, h: number, c: string) => void;
type Af = (a: number, fn: () => void) => void;
type Tf = (x: number, y: number, str: string, c: string, sc?: number) => void;
type Wf = (str: string, sc?: number) => number;

export function drawSeq(ctx: CanvasRenderingContext2D, w: number, h: number, u: number, t: number) {
  const k = panelAt(u);
  if (k !== last) { last = k; t0 = t; }
  const tau = t - t0, s = w / N;
  const P: Pf = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) * s, Math.round(y) * s, Math.max(1, Math.round(ww)) * s, Math.max(1, Math.round(hh)) * s); };
  const A: Af = (a, fn) => { ctx.globalAlpha = a; fn(); ctx.globalAlpha = 1; };
  const txt: Tf = (x, y, str, c, sc = 1) => {
    [...str].forEach((ch, n) => { const g = MORE[ch] ?? GLYPH[ch] ?? GLYPH[" "]; g.split("").forEach((b, i) => { if (b === "1") P(x + (n * 4 + (i % 3)) * sc, y + Math.floor(i / 3) * sc, sc, sc, c); }); });
  };
  const tw: Wf = (str, sc = 1) => (str.length * 4 - 1) * sc;
  ctx.clearRect(0, 0, w, h);
  [crash, bar, news, hall, scare][k](P, A, txt, tw, t, tau);
  // a scanline grain over everything, like a camera that's been dropped
  A(0.12, () => { for (let y = 0; y < N; y += 2) P(0, y, N, 1, "#000"); });
}

/* ---------- CRASH: the van through the wall ---------- */
function crash(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number) {
  for (let y = 0; y < 40; y++) P(0, y, N, 1, ["#0a0612", "#140a1e", "#24102a", "#3a1430"][Math.min(3, Math.floor(y / 10))]);   // the night
  for (let k = 0; k < 18; k++) P(h1(k * 7) * N, h1(k * 3) * 26, 1, 1, "#d8d8f0");
  for (let y = 26; y < N; y++) for (let x = 0; x < N; x++) {                                                              // the bar wall
    const row = Math.floor((y - 26) / 3), off = row % 2 ? 3 : 0;
    P(x, y, 1, 1, (y - 26) % 3 === 2 || (x + off) % 6 === 0 ? "#2a1210" : (x * 7 + row * 13) % 11 === 0 ? "#7a3a2a" : "#5a2a22");
  }
  if (Math.floor(t * 9) % 7) { P(6, 30, tw("BAR", 2) + 4, 14, "#1a0810"); txt(8, 32, "BAR", "#ff3b8a", 2); }
  // the hole, ragged, and the van's nose punching out of it
  const grow = Math.min(1, tau / 0.25), R = 18 + grow * 16;
  for (let y = -R; y <= R; y++) { const ww = Math.sqrt(Math.max(0, R * R - y * y)) * (1 + 0.15 * Math.sin(y * 1.7)); P(50 - ww, 64 + y * 0.8, ww * 2, 1, "#08040a"); }
  const vs = 0.7 + grow * 0.35, vx = 50 - 26 * vs, vy = 52 - 10 * vs;
  const V = (x: number, y: number, ww: number, hh: number, c: string) => P(vx + x * vs, vy + y * vs, ww * vs, hh * vs, c);
  V(0, 10, 52, 30, "#e8e8e8"); V(2, 0, 48, 12, "#f2f2f2"); V(6, 2, 40, 10, "#1a2a3a"); V(8, 3, 14, 3, "#5a7a9a");
  for (let k = 0; k < 6; k++) V(10 + k * 6, 4 + (k % 3), 1, 6, "#c8e8ff");                                                   // the windshield cracking
  V(4, 18, 10, 6, "#fff6c0"); V(38, 18, 10, 6, "#fff6c0"); V(16, 22, 20, 6, "#2a2a2e"); V(18, 30, 16, 4, "#c8c8c8");
  V(0, 38, 8, 6, "#111"); V(44, 38, 8, 6, "#111"); V(24, 31, 4, 2, "#e0302f");
  A(0.35 + 0.2 * Math.sin(t * 20), () => { P(vx - 10, vy + 14 * vs, 30, 14, "#fff6c0"); P(vx + 36 * vs, vy + 14 * vs, 30, 14, "#fff6c0"); });
  for (let k = 0; k < 46; k++) {                                                                                             // bricks and glass, at you
    const a = h1(k * 11) * Math.PI * 2, sp = 20 + h1(k * 5) * 60, d = (tau * sp + h1(k) * 8) % 70;
    const x = 50 + Math.cos(a) * d, y = 62 + Math.sin(a) * d * 0.8 + d * d * 0.004, sz = 1 + Math.floor(d / 18);
    P(x, y, sz + 1, sz, k % 4 === 0 ? "#e8f8ff" : k % 3 === 0 ? "#8a8a8a" : "#7a3a2a");
  }
  A(Math.max(0, 0.9 - tau * 2.5), () => P(0, 0, N, N, "#ffffff"));                                                          // the impact
}

/* ---------- BAR: the regulars ---------- */
function bar(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number) {
  const fl = Math.floor(t * 11) % 13 === 0 ? 0.55 : 1;                                       // the light keeps dropping out
  P(0, 0, N, N, "#241010");
  for (let y = 0; y < 44; y++) P(0, y, N, 1, y % 8 === 0 ? "#3a1a16" : "#341814");
  for (const sy of [8, 20]) { P(4, sy + 8, 88, 2, "#4a2a1a"); for (let x = 6; x < 90; x += 3) P(x, sy + 2 + (x % 5 === 0 ? 1 : 0), 2, 6 - (x % 5 === 0 ? 1 : 0), ["#3a7a3a", "#8a4a1a", "#c8c8a0", "#5a2a5a", "#d8a040"][x % 5]); }
  if (Math.floor(t * 3) % 4) txt(70, 2, "OPEN", "#ff3b3b");
  // the bartender: cap, glasses, plaid shirt, staring. Her eyes catch red.
  P(40, 26, 12, 4, "#3a3a4a"); P(39, 29, 14, 1, "#2a2a3a"); P(41, 30, 10, 9, "#c89a7a"); P(42, 33, 3, 2, "#111"); P(47, 33, 3, 2, "#111");
  P(42, 33, 8, 1, "#3a3a3a"); const red = Math.floor(t * 2) % 5 ? "#ff3b3b" : "#111"; P(43, 34, 1, 1, red); P(48, 34, 1, 1, red);
  P(44, 37, 4, 1, "#5a2a2a");
  for (let y = 39; y < 50; y++) for (let x = 37; x < 55; x++) P(x, y, 1, 1, (x % 4 === 0 || y % 4 === 0) ? "#2a3a6a" : "#8a2a2a");
  // the bar top, the TIP jar, a pit viper sliding along it
  P(0, 48, N, 6, "#5a3018"); P(0, 48, N, 1, "#8a5a32"); P(0, 54, N, 18, "#3a1e10");
  P(60, 38, 12, 10, "#d8e8e0"); P(61, 38, 10, 1, "#f2f2f2"); txt(61, 41, "TIP", "#2a2a2a"); P(63, 45, 3, 2, "#3a8a3a");
  { const sx = (t * 9) % 120 - 20;
    for (let k = 0; k < 16; k++) P(sx - k, 46 + Math.round(Math.sin(t * 6 - k * 0.6) * 1.2), 2, 2, k % 3 === 0 ? "#2a3a1a" : "#6a7a2a");
    P(sx + 1, 45, 3, 3, "#5a6a22"); P(sx + 3, 46, 1, 1, "#ff3b3b"); if (Math.floor(t * 6) % 3 === 0) P(sx + 4, 47, 3, 1, "#e0302f"); }
  // the rattlesnake tank, the rattle going
  P(4, 34, 24, 14, "#1a2a1a"); P(4, 34, 24, 1, "#8a9a8a"); P(4, 47, 24, 1, "#8a9a8a"); P(4, 34, 1, 14, "#8a9a8a"); P(27, 34, 1, 14, "#8a9a8a");
  for (let a = 0; a < 40; a++) { const r = 2 + a * 0.13, th = a * 0.55; P(16 + Math.cos(th) * r * 1.4, 42 + Math.sin(th) * r * 0.7, 2, 1, a % 4 < 2 ? "#a8884a" : "#4a3a1a"); }
  P(14, 37, 3, 2, "#a8884a"); P(15, 37, 1, 1, "#ff3b3b"); if (Math.floor(t * 4) % 2) P(13, 38, 2, 1, "#e0302f");
  { const sh = Math.floor(t * 14) % 2; P(24, 39 - sh, 2, 4, "#d8c890"); }
  // the regulars on their stools, backs to you. Then one by one they turn round.
  for (let k = 0; k < 4; k++) {
    const x = 6 + k * 24, turn = tau > 0.4 + k * 0.3;
    P(x + 2, 62, 12, 16, "#0a0606"); P(x + 4, 56, 8, 7, "#0a0606"); P(x + 6, 78, 4, 18, "#0a0606"); P(x + 2, 77, 12, 2, "#2a2020");
    if (turn) { A(0.4, () => { P(x + 4, 58, 4, 3, "#ff2a2a"); P(x + 8, 58, 4, 3, "#ff2a2a"); }); P(x + 5, 59, 2, 1, "#ff2a2a"); P(x + 9, 59, 2, 1, "#ff2a2a"); }
  }
  // the dog under the pool table
  P(64, 80, 30, 6, "#1a4a2a"); P(64, 79, 30, 1, "#5a3a1a"); P(66, 86, 2, 10, "#3a2010"); P(90, 86, 2, 10, "#3a2010");
  { const dx = 70 + Math.sin(t * 0.8) * 8; P(dx, 89, 9, 4, "#d8c8a8"); P(dx + 8, 87, 4, 4, "#d8c8a8"); P(dx + 10, 88, 1, 1, "#ffd23f"); P(dx, 93, 1, 3, "#d8c8a8"); P(dx + 7, 93, 1, 3, "#d8c8a8"); }
  // the lamp swinging over it all
  { const sw = Math.sin(t * 2.2) * 10; P(48 + sw * 0.5, 0, 1, 8, "#3a3a3a"); P(45 + sw, 8, 7, 3, "#2a2a2a");
    A(0.3 * fl, () => { for (let y = 11; y < 60; y++) { const ww = (y - 11) * 0.7; P(48 + sw - ww, y, ww * 2, 1, "#ffb04a"); } }); }
  A(1 - fl, () => P(0, 0, N, N, "#000"));
}

/* ---------- NEWS: the TV over the bar ---------- */
function news(P: Pf, A: Af, txt: Tf, tw: Wf, t: number) {
  P(0, 0, N, N, "#0a0606");
  P(4, 6, 88, 66, "#1a1a1a"); P(6, 8, 84, 62, "#2a2a2e");
  const X = 8, Y = 10, SW = 80, SH = 58;
  for (let y = 0; y < SH; y++) P(X, Y + y, SW, 1, y < SH / 2 ? "#0a1a5a" : "#1a2a7a");
  for (let a = 0; a < 16; a++) { const th = a * Math.PI / 8 + t * 1.5; for (let r = 4; r < 44; r += 2) { const x = X + 40 + Math.cos(th) * r, y = Y + 22 + Math.sin(th) * r * 0.7; if (x > X && x < X + SW - 1 && y > Y && y < Y + SH - 1) P(x, y, 1, 1, a % 2 ? "#c8202a" : "#3a5ad8"); } }
  // the anchor: big hair, red dress, eyebrows all the way up, mouth going, jabbing a finger at you
  const ax = X + 30, ay = Y + 10;
  P(ax - 2, ay, 20, 16, "#f0d070"); P(ax, ay + 2, 16, 14, "#f0c8a0"); P(ax - 3, ay + 4, 3, 16, "#f0d070"); P(ax + 16, ay + 4, 3, 16, "#f0d070");
  P(ax + 2, ay + 4, 5, 1, "#5a3a1a"); P(ax + 9, ay + 4, 5, 1, "#5a3a1a"); P(ax + 2, ay + 3, 2, 1, "#5a3a1a"); P(ax + 12, ay + 3, 2, 1, "#5a3a1a");
  P(ax + 3, ay + 6, 3, 3, "#ffffff"); P(ax + 10, ay + 6, 3, 3, "#ffffff"); P(ax + 4, ay + 7, 1, 1, "#111"); P(ax + 11, ay + 7, 1, 1, "#111");
  const m = Math.floor(t * 9) % 3; P(ax + 5, ay + 11, 6, 1 + m, "#7a1a1a"); P(ax + 5, ay + 11, 6, 1, "#c84a5a");
  P(ax - 4, ay + 16, 24, 12, "#c8202a"); P(ax + 6, ay + 16, 4, 3, "#f0c8a0");
  P(ax + 18, ay + 20, 6, 2, "#f0c8a0"); P(ax + 23, ay + 18 + (Math.floor(t * 4) % 2) * 2, 2, 4, "#f0c8a0");
  const fl = Math.floor(t * 5) % 2;
  P(X, Y + 2, 36, 9, fl ? "#ffffff" : "#c8202a"); txt(X + 3, Y + 4, "BREAKING", fl ? "#c8202a" : "#ffffff");
  P(X + 62, Y + 2, 18, 9, "#ffd23f"); txt(X + 64, Y + 4, "LIVE", "#111");
  P(X, Y + 37, SW, 14, "#c8202a"); P(X, Y + 37, SW, 1, "#ffd23f");
  txt(X + 2, Y + 39, "WHITE HOUSE", "#ffffff"); txt(X + 2, Y + 45, "IN CHAOS!!!", "#ffd23f");
  P(X + 54, Y + 39, 24, 10, "#111"); txt(X + 56, Y + 41, "ALERT", Math.floor(t * 8) % 2 ? "#ff3b3b" : "#ffffff");
  P(X, Y + 50, SW, 8, "#0a0a2a");
  { const msg = "PARKINSONS?  PANIC IN WASHINGTON  WHAT ARE THEY HIDING?  STAY TUNED  ", wpx = tw(msg) + 4, off = (t * 26) % wpx;
    for (const o of [0, wpx]) txt(X + 2 - off + o, Y + 52, msg, "#ffffff"); }
  P(0, 6, 8, 66, "#1a1a1a"); P(88, 6, 8, 66, "#1a1a1a"); P(6, 8, 2, 62, "#2a2a2e"); P(88, 8, 2, 62, "#2a2a2e");   // the bezel over the ticker's ends
  A(0.25 + 0.15 * fl, () => P(0, 72, N, 24, "#3a4aa8"));                                       // its glow on the bar, faces lit blue
  for (let k = 0; k < 3; k++) { const x = 16 + k * 28; P(x, 80, 10, 16, "#06060a"); P(x + 2, 76, 6, 6, "#06060a"); A(0.6, () => P(x + 2, 77, 6, 3, "#5a6ad8")); }
  if (Math.floor(t * 2.3) % 6 === 0) A(0.5, () => { for (let y = 8; y < 70; y += 3) P(6, y + Math.floor(t * 40) % 3, 84, 1, "#ffffff"); });
}

/* ---------- HALL: out the back ---------- */
function hall(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number) {
  P(0, 0, N, N, "#06060a");
  const vx = 48, vy = 44;                                                                   // a motel corridor in one-point perspective
  for (let x = 0; x < N; x++) { const half = 6 + (Math.abs(x - vx) / 48) * 46; P(x, vy - half, 1, half * 2, x < vx ? "#4a4a3a" : "#42423a"); }
  for (let y = 0; y < N; y++) { const half = 6 + (Math.abs(y - vy) / 52) * 46; if (y < vy - 6 || y > vy + 6) P(vx - half, y, half * 2, 1, y < vy ? "#2a2a24" : "#3a2420"); }
  for (let y = vy + 8; y < N; y += 4) P(vx - (y - vy) * 0.85, y, (y - vy) * 1.7, 1, "#4a2a1a");
  P(vx - 6, vy - 8, 12, 16, "#0a0a0a");
  for (let k = 0; k < 3; k++) { const d = 1 - k * 0.28, dw = 8 * d, dh = 26 * d, ox = 40 * d;      // doors down both walls, numbered
    P(vx - 8 - ox, vy - dh / 2, dw, dh, "#5a2a1a"); P(vx + 8 + ox - dw, vy - dh / 2, dw, dh, "#5a2a1a");
    if (k === 0) { txt(vx - 8 - ox, vy - dh / 2 - 7, "12", "#c8a060"); txt(vx + ox, vy - dh / 2 - 7, "13", "#c8a060"); } }
  const on = Math.floor(t * 6) % 9 !== 0 && !(tau > 1.4 && Math.floor(t * 12) % 3 === 0);     // the lights, going
  for (let k = 0; k < 3; k++) { const d = 1 - k * 0.3, y = vy - 8 - 34 * d; P(vx - 7 * d, y, 14 * d, 2, on ? "#f8f8d8" : "#3a3a30"); if (on) A(0.1, () => P(vx - 30 * d, y + 2, 60 * d, 40 * d, "#f8f8d8")); }
  // something at the far end. Every time the lights drop, it's closer.
  const near = Math.min(1, Math.floor(tau * 1.6) * 0.22), fh = 10 + near * 34, fw = fh * 0.32, fy = vy + 8 - fh * 0.75;
  P(vx - fw / 2, fy, fw, fh, "#d8d8d0"); P(vx - fw / 2 - 1, fy, fw + 2, fh * 0.35, "#0a0a0a"); P(vx - fw / 2 - 1, fy, 1, fh * 0.6, "#0a0a0a"); P(vx + fw / 2, fy, 1, fh * 0.6, "#0a0a0a");
  P(vx - fw * 0.28, fy + fh * 0.2, Math.max(1, fw * 0.18), 1, "#ff2a2a"); P(vx + fw * 0.1, fy + fh * 0.2, Math.max(1, fw * 0.18), 1, "#ff2a2a");
  if (!on) A(0.88, () => P(0, 0, N, N, "#000"));
}

/* ---------- SCARE ---------- */
function scare(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number) {
  P(0, 0, N, N, "#000");
  if (tau < 0.09 || (tau > 0.6 && Math.floor(t * 17) % 11 === 0)) {                                 // static
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x += 2) { const v = h1(x * 131 + y * 977 + Math.floor(t * 60) * 7); P(x, y, 2, 1, v > 0.6 ? "#e8e8e8" : v > 0.3 ? "#6a6a6a" : "#1a1a1a"); }
    return;
  }
  const z = Math.min(1.25, 0.45 + (tau - 0.09) * 7), jx = (Math.floor(t * 40) % 3 - 1) * 2, jy = Math.floor(t * 33) % 3 - 1;   // it lunges at the glass
  const F: Pf = (x, y, w, hh, c) => P(48 + (x - 48) * z + jx, 50 + (y - 50) * z + jy, w * z + 1, hh * z + 1, c);
  for (let k = 0; k < 30; k++) F(14 + k * 2.4, 4, 2, 30 + h1(k) * 60, "#050505");                  // hair hanging in strands
  for (let y = 14; y < 92; y++) { const half = y < 40 ? 14 + (y - 14) * 0.5 : 27 - Math.max(0, (y - 70) * 0.9); F(48 - half, y, half * 2, 1, y % 7 === 0 ? "#b8b8b0" : "#d0d0c8"); }
  for (let k = 0; k < 12; k++) F(26 + k * 4, 4, 2, 22 + h1(k * 3) * 10, "#050505");
  for (const [x, y, l] of [[30, 30, 9], [64, 26, 11], [40, 70, 8], [58, 74, 10]]) for (let k = 0; k < l; k++) F(x + Math.sin(k) * 2, y + k, 1, 1, "#6a5a5a");   // cracks
  for (const ex of [36, 60]) {                                                                         // the eyes: huge, black, a red pinprick in each
    for (let y = -9; y <= 9; y++) { const ww = Math.sqrt(81 - y * y) * 1.2; F(ex - ww, 44 + y, ww * 2, 1, "#000"); }
    F(ex - 1, 45, 3, 3, Math.floor(t * 9) % 5 === 0 ? "#ffffff" : "#ff1a1a"); F(ex, 44, 1, 1, "#ffd0d0");
    F(ex - 1, 54, 2, 9, "#3a0a0a");
  }
  for (let y = 0; y < 22; y++) { const ww = Math.sin((y / 22) * Math.PI) * 15 + 4; F(48 - ww, 66 + y, ww * 2, 1, y < 2 ? "#5a1010" : "#0a0000"); }   // the mouth, far too wide
  for (let k = 0; k < 8; k++) { F(36 + k * 3.4, 67, 2, 3 + (k % 2) * 2, "#e8e0c8"); F(37 + k * 3.2, 84 - (k % 2) * 2, 2, 3, "#d8d0b8"); }
  A(0.25 + 0.2 * Math.sin(t * 30), () => P(0, 0, N, N, "#8a0000"));
  if (Math.floor(t * 13) % 4 === 0) for (let k = 0; k < 4; k++) P(0, h1(Math.floor(t * 13) * 7 + k) * N, N, 2, "#e8e8e8");   // tear lines
}
