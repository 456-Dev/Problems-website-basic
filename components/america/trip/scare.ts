// The night at the Trade Winds, Tulsa. The map goes dark after the Kansas sundown (just the headlights and
// the turbines' red dots), the van parks in the Tulsa hold, and while you keep scrolling RoadRail shows drawSeq full-frame:
//   BLACK   nothing. Two red turbine dots blinking, then even those go out
//   SMASH   the jump scare: full-bright red, the pool table, a break shot, the BEER neon. The Trade Winds
//   LADY    the bartender, weathered but sweet, behind her bar. We ask her the three questions
//   FOX     the TV over the bar: BREAKING, "DEMENTED PRESIDENT BIDEN"
//   CRAZY   the regulars, rambling and screaming: a guy up on a chair
//   FOX     again, closer: split screen, the podium
//   CRAZY   again, outside by the motel doors, a woman in a bathrobe screaming at the night
//   LAUGH   Jason, close up, laughing it all off
//   CALM    and then it's quiet. Sunrise over Tulsa
// Chunky 96x96 pixels on a 384 canvas. Each cut remounts the canvas in RoadRail (white flash + shake), which is what
// makes BLACK -> SMASH land as a scare.

import { GLYPH } from "./kit";

const N = 96;
const CUTS = [0, 0.05, 0.1, 0.4, 0.48, 0.56, 0.64, 0.72, 0.86];   // where each panel starts, as a fraction of the hold
export const PANELS = CUTS.length;
export const panelAt = (u: number) => { let k = 0; while (k < PANELS - 1 && u >= CUTS[k + 1]) k++; return k; };

const h1 = (n: number) => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const MORE: Record<string, string> = {
  J: "011001001101010", Z: "111001010100111", "!": "010010010000010", "?": "111001011000010", ".": "000000000000010",
  "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111", "4": "101101111001001",
  "/": "001001010100100", ":": "000010000010000", "-": "000000111000000",
};

let last = -1, t0 = 0;                           // when the current panel came up (for the timed beats)

type Pf = (x: number, y: number, w: number, h: number, c: string) => void;
type Af = (a: number, fn: () => void) => void;
type Tf = (x: number, y: number, str: string, c: string, sc?: number) => void;
type Wf = (str: string, sc?: number) => number;
type Panel = (P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) => void;

export function drawSeq(ctx: CanvasRenderingContext2D, w: number, h: number, u: number, t: number) {
  const k = panelAt(u);
  if (k !== last) { last = k; t0 = t; }
  const tau = t - t0, s = w / N, v = Math.min(1, Math.max(0, (u - CUTS[k]) / ((CUTS[k + 1] ?? 1) - CUTS[k])));   // v = how far through this panel you've scrolled
  const P: Pf = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) * s, Math.round(y) * s, Math.max(1, Math.round(ww)) * s, Math.max(1, Math.round(hh)) * s); };
  const A: Af = (a, fn) => { ctx.globalAlpha = a; fn(); ctx.globalAlpha = 1; };
  const txt: Tf = (x, y, str, c, sc = 1) => {
    [...str].forEach((ch, n) => { const g = MORE[ch] ?? GLYPH[ch] ?? GLYPH[" "]; g.split("").forEach((b, i) => { if (b === "1") P(x + (n * 4 + (i % 3)) * sc, y + Math.floor(i / 3) * sc, sc, sc, c); }); });
  };
  const tw: Wf = (str, sc = 1) => (str.length * 4 - 1) * sc;
  ctx.clearRect(0, 0, w, h);
  ([black, smash, lady, fox1, crazy1, fox2, crazy2, laugh, calm] as Panel[])[k](P, A, txt, tw, t, tau, v);
  // a scanline grain over everything, like a camera that's been dropped
  if (k > 0 && k < 8) A(0.07, () => { for (let y = 0; y < N; y += 2) P(0, y, N, 1, "#000"); });
}

// break a line of words into rows of at most n characters
const wrap = (s: string, n: number) => s.split(" ").reduce<string[]>((rows, wd) => {
  const r = rows[rows.length - 1]; if (r !== undefined && (r + " " + wd).length <= n) rows[rows.length - 1] = r + " " + wd; else rows.push(wd); return rows;
}, []);

/* ---------- BLACK: the dark, just the turbines' red dots ---------- */
function black(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) {
  P(0, 0, N, N, "#020203");
  if (v > 0.75) return;                                                                        // and then even they go out
  for (const [x, y, ph] of [[22, 40, 0], [71, 37, 0.45]]) {
    const on = (t * 0.9 + ph) % 1 < 0.5;
    if (on) { A(0.25, () => P(x - 2, y - 2, 5, 5, "#5a0808")); P(x - 1, y - 1, 3, 3, "#ff1a1a"); P(x, y, 1, 1, "#ff8a7a"); }
    else P(x, y, 1, 1, "#2a0404");
  }
}

/* ---------- SMASH: the jump scare. Full-bright red, the break shot, BEER ---------- */
function smash(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number) {
  const j = Math.max(0, 1 - tau * 2.5), jx = Math.round(Math.sin(t * 61) * 3 * j), jy = Math.round(Math.cos(t * 47) * 2 * j);   // the camera still shaking
  const Q: Pf = (x, y, w, h, c) => P(x + jx, y + jy, w, h, c);
  // a red-lit room, blown out
  for (let y = 0; y < N; y++) Q(-4, y, N + 8, 1, y < 44 ? (y < 22 ? "#a80a0a" : "#c81414") : "#7a0606");
  // BEER, giant neon, burning
  const msg = "BEER", sc = 5, bx = 48 - tw(msg, sc) / 2;
  A(0.5, () => Q(bx - 6, 2, tw(msg, sc) + 12, 36, "#ff5a3a"));
  txt(bx + jx - 1, 6 + jy, msg, "#ff2a1a", sc); txt(bx + jx + 1, 6 + jy, msg, "#ff2a1a", sc); txt(bx + jx, 6 + jy, msg, "#ffffff", sc);
  // the pool table rushing at you, low and wide, the lamp over it
  Q(46, 30, 4, 8, "#1a0404"); Q(30, 38, 36, 4, "#1a0404");
  A(0.35, () => { for (let y = 42; y < 60; y++) { const ww = 18 + (y - 42) * 1.6; Q(48 - ww, y, ww * 2, 1, "#ffe25a"); } });
  for (let y = 56; y < 84; y++) { const ww = 34 + (y - 56) * 1.3; Q(48 - ww, y, ww * 2, 1, "#14a03a"); }   // the felt
  for (let y = 52; y < 56; y++) { const ww = 38 + (y - 52) * 1.3; Q(48 - ww, y, ww * 2, 1, "#4a1a0a"); }   // the far rail
  Q(-4, 84, N + 8, 12, "#3a1006"); Q(-4, 84, N + 8, 2, "#6a2a10");
  // the break: the cue ball smashing into the rack, balls everywhere
  const bc = ["#ffd23f", "#2a5ad8", "#e0302f", "#1a1a1a", "#ff8a1f", "#1a8a3a", "#7a2aa8", "#ffffff"];
  for (let k = 0; k < 15; k++) {
    const a = h1(k * 13) * Math.PI * 2, d = Math.min(1, tau * 1.8) * (10 + h1(k * 7) * 30), sz = 4;
    Q(48 + Math.cos(a) * d * 1.4 - sz / 2, 66 + Math.sin(a) * d * 0.45 - sz / 2, sz, sz - 1, bc[k % 8 === 7 ? 0 : k % 8]);
  }
  Q(46, 74 - Math.max(0, 0.15 - tau) * 40, 5, 4, "#ffffff");
  if (tau < 0.5) { const msg2 = "CRACK!", sc2 = 2; txt(48 - tw(msg2, sc2) / 2 + jx, 88 + jy, msg2, "#ffffff", sc2); }
  A(Math.max(0, 0.8 - tau * 2), () => P(0, 0, N, N, "#ffffff"));                                // the flash
}

/* ---------- LADY: the bartender, and our three questions ---------- */
const QS = ["WHAT IS ONE QUESTION YOU WOULD ASK EVERYONE IN AMERICA?", "ANSWER YOUR OWN QUESTION.", "ARE YOU HAPPY?"];
function lady(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) {
  const qn = Math.min(2, Math.floor(v * 3)), sub = v * 3 - qn;                                   // which question, and how far into it
  // dark wood wall in red light, a shelf of bottles, the BEER neon
  P(0, 0, N, N, "#2a0c08");
  for (let y = 28; y < 62; y++) P(0, y, N, 1, y % 5 === 0 ? "#3a120a" : "#4a180c");
  P(64, 40, 30, 2, "#1a0604"); for (let x = 65; x < 93; x += 3) P(x, 33 + (x % 2), 2, 7 - (x % 2), ["#3aa84a", "#e8a02a", "#e8e8e8", "#3a6ad8"][x % 4]);
  { const on = Math.floor(t * 2) % 9 !== 0; A(on ? 0.3 : 0, () => P(2, 32, 22, 12, "#ff3a2a")); txt(5, 35, "BEER", on ? "#ffe0d0" : "#5a1a10"); }
  // her: shoulder-length brown hair gone grey at the front, crow's feet, a sweet smile, a worn blue cardigan
  const nod = sub > 0.5 ? Math.round(Math.sin(t * 5)) : 0, cx = 44, cy = 30 + nod, HR = "#5a3a24", GR = "#c8c8c8", SK = "#e8b494", LN = "#b47a5c";
  P(cx - 11, cy, 22, 6, HR); P(cx - 8, cy - 2, 16, 2, HR); P(cx - 12, cy + 4, 4, 18, HR); P(cx + 8, cy + 4, 4, 18, HR);     // the hair
  P(cx - 6, cy - 2, 4, 6, GR); P(cx - 9, cy + 1, 2, 4, GR); P(cx - 12, cy + 6, 1, 14, GR); P(cx + 3, cy - 1, 2, 3, GR); P(cx + 10, cy + 6, 1, 12, GR);   // the grey
  P(cx - 8, cy + 4, 16, 16, SK); P(cx - 7, cy + 20, 14, 1, SK); P(cx - 5, cy + 21, 10, 1, SK);              // the face
  P(cx - 8, cy + 4, 7, 2, HR); P(cx - 6, cy + 4, 3, 1, GR);                                             // a swoop of fringe
  P(cx - 6, cy + 7, 4, 1, "#7a5a44"); P(cx + 2, cy + 7, 4, 1, "#7a5a44");                                // brows
  for (const ex of [cx - 6, cx + 2]) { P(ex, cy + 10, 1, 1, "#2a1a14"); P(ex + 1, cy + 9, 2, 1, "#2a1a14"); P(ex + 3, cy + 10, 1, 1, "#2a1a14"); }   // eyes, smiling shut
  P(cx - 8, cy + 9, 1, 1, LN); P(cx - 8, cy + 11, 1, 1, LN); P(cx + 7, cy + 9, 1, 1, LN); P(cx + 7, cy + 11, 1, 1, LN);   // crow's feet
  P(cx - 1, cy + 11, 2, 3, "#d49a7a");                                                                  // nose
  P(cx - 6, cy + 13, 1, 3, LN); P(cx + 5, cy + 13, 1, 3, LN);                                           // smile lines
  P(cx - 7, cy + 12, 2, 2, "#e8a088"); P(cx + 5, cy + 12, 2, 2, "#e8a088");                            // cheeks, soft
  const talk = sub > 0.55 && Math.floor(t * 6) % 2 === 0;
  if (talk) { P(cx - 3, cy + 15, 6, 3, "#5a1a10"); P(cx - 3, cy + 15, 6, 1, "#f2f2f2"); }
  else { P(cx - 3, cy + 16, 6, 1, "#8a2a1a"); P(cx - 4, cy + 15, 1, 1, "#8a2a1a"); P(cx + 3, cy + 15, 1, 1, "#8a2a1a"); }   // that smile
  P(cx - 3, cy + 22, 6, 2, "#d8a284");                                                                  // neck
  for (let y = cy + 24; y < 62; y++) { const ww = Math.min(17, 8 + (y - cy - 24) * 1.8); P(cx - ww, y, ww * 2, 1, (y % 3) ? "#3a5a8a" : "#33507a"); }   // the cardigan
  P(cx - 4, cy + 24, 8, 38 - cy, "#5a8a5a"); P(cx - 3, cy + 24, 6, 1, "#d8a284");                       // a worn green tee under it
  for (let y = cy + 27; y < 60; y += 4) P(cx - 6, y, 1, 1, "#e8e8e8");                                  // buttons
  // the bar top, the TIP jar, a rag
  P(0, 60, N, 6, "#6a2a14"); P(0, 60, N, 1, "#c8683a"); P(0, 66, N, 10, "#3a1408");
  P(66, 50, 12, 10, "#c8e0e8"); P(67, 50, 10, 1, "#ffffff"); txt(67, 53, "TIP", "#1a1a1a"); P(69, 57, 3, 2, "#3a9a3a"); P(73, 56, 2, 3, "#3a9a3a");
  { const wv = Math.sin(t * 3) * 1; P(24 + wv, 57, 10, 3, "#e8e8e8"); P(25 + wv, 58, 8, 1, "#c8c8c8"); }
  // down front, the pool table's corner and the dog asleep under it
  P(0, 76, N, 20, "#1a0806");
  P(0, 78, 44, 5, "#14883a"); P(0, 77, 44, 1, "#7a3a1a"); P(0, 83, 44, 2, "#4a1a0a"); P(40, 85, 3, 11, "#3a1208");
  P(10, 79, 3, 3, "#ffd23f"); P(26, 80, 3, 2, "#ffffff"); P(34, 79, 3, 3, "#2a5ad8");
  { const br = Math.floor(t * 1.2) % 2; P(12, 89 - br, 16, 5 + br, "#c88a4a"); P(26, 87, 7, 6, "#c88a4a"); P(31, 89, 3, 2, "#1a1a1a"); P(26, 87, 2, 5, "#7a4a22"); P(29, 89, 2, 1, "#3a1a0a"); P(10, 92, 3, 1, "#c88a4a");
    if (Math.floor(t * 0.7) % 3 === 0) { txt(34, 82, "Z", "#ffffff"); } }
  // the question box up top, typed out as you scroll
  const rows = wrap(QS[qn], 22), shown = Math.ceil(Math.min(1, sub * 2.2) * QS[qn].length);
  P(0, 0, N, 8 + rows.length * 6 + 3, "#0a0a14"); P(0, 8 + rows.length * 6 + 3, N, 1, "#ffd23f");
  P(2, 2, 11, 7, "#ffd23f"); txt(3, 3, "Q" + (qn + 1), "#111"); txt(16, 3, (qn + 1) + "/3", "#8a8aa8");
  let used = 0; rows.forEach((r, i) => { const n = Math.max(0, Math.min(r.length, shown - used)); used += r.length + 1; txt(3, 11 + i * 6, r.slice(0, n), "#ffffff"); });
  // her answer: a speech bubble, the dots going (her words are hers)
  if (sub > 0.5) {
    const bx = 60, by = 14 + rows.length * 6 + 1;
    P(bx, by, 22, 9, "#ffffff"); P(bx - 2, by + 6, 3, 3, "#ffffff"); P(bx - 3, by + 8, 2, 2, "#ffffff");
    for (let d = 0; d < 3; d++) if (Math.floor(t * 4) % 4 > d) P(bx + 4 + d * 5, by + 4, 3, 2, "#2a2a2a");
  }
}

/* ---------- FOX: the bar TV. Shared pieces ---------- */
function lowerThird(P: Pf, txt: Tf, tw: Wf, t: number, X: number, Y: number, W: number, head: string[], tick: string) {
  const fl = Math.floor(t * 2) % 2;
  P(X, Y, 42, 7, fl ? "#e01a1a" : "#c80a0a"); txt(X + 2, Y + 1, "BREAKING", "#ffffff");
  P(X + 42, Y, 12, 7, "#0a0a0a"); txt(X + 44, Y + 1, "NOW", "#ffd23f");
  P(X, Y + 7, W, head.length * 6 + 3, "#ffffff"); P(X, Y + 7, 2, head.length * 6 + 3, "#c80a0a");
  head.forEach((r, i) => txt(X + 4, Y + 9 + i * 6, r, "#0a1a4a"));
  const ty = Y + 10 + head.length * 6; P(X, ty, W, 7, "#0a0a0a");
  const wpx = tw(tick) + 4, off = (t * 22) % wpx;
  for (const o of [0, wpx]) txt(X + 2 - off + o, ty + 1, tick, "#ffffff");
  return ty + 7;
}
function foxBug(P: Pf, txt: Tf, x: number, y: number) {                                         // the logo bug in the corner
  P(x, y, 19, 14, "#0a2a7a"); P(x, y, 19, 1, "#3a6ad8"); txt(x + 4, y + 2, "FOX", "#ffffff"); txt(x + 2, y + 8, "NEWS", "#ffffff"); P(x, y + 14, 19, 1, "#e01a1a");
}
function anchor(P: Pf, t: number, x: number, y: number, hair: string, suit: string) {           // a news anchor at the desk, mouth going
  P(x - 1, y, 14, 5, hair); P(x - 2, y + 3, 3, 10, hair); P(x + 11, y + 3, 3, 10, hair);
  P(x + 1, y + 3, 10, 11, "#f0c0a0"); P(x + 2, y + 6, 3, 1, "#3a2a1a"); P(x + 7, y + 6, 3, 1, "#3a2a1a");
  P(x + 2, y + 7, 2, 2, "#ffffff"); P(x + 8, y + 7, 2, 2, "#ffffff"); P(x + 3, y + 8, 1, 1, "#111"); P(x + 8, y + 8, 1, 1, "#111");
  const m = Math.floor(t * 8) % 3; P(x + 4, y + 11, 4, 1 + (m === 2 ? 1 : 0), "#8a1a2a");
  P(x - 4, y + 14, 20, 12, suit); P(x + 4, y + 14, 4, 4, "#f0f0f0"); P(x + 5, y + 15, 2, 6, "#c80a0a");
}

/* ---------- FOX 1: up on the wall over the bar ---------- */
function fox1(P: Pf, A: Af, txt: Tf, tw: Wf, t: number) {
  P(0, 0, N, N, "#140404");
  P(2, 4, 92, 70, "#0a0a0a"); P(3, 5, 90, 68, "#1a1a1e");
  const X = 6, Y = 8, SW = 84, SH = 58;
  for (let y = 0; y < SH; y++) P(X, Y + y, SW, 1, y < 20 ? "#0a1a5a" : y < 34 ? "#14287a" : "#0a1a5a");     // the studio
  for (const [x, w, h] of [[8, 6, 12], [16, 4, 18], [22, 7, 10], [64, 5, 16], [72, 8, 11], [82, 4, 14]]) P(X + x - 6, Y + 30 - h, w, h, "#24408a");   // a city behind
  for (let k = 0; k < 10; k++) P(X + 4 + k * 8, Y + 4 + (k % 3) * 3, 1, 1, "#8ab0ff");
  anchor(P, t, X + 36, Y + 6, "#f0d060", "#c80a0a");                                            // blonde, red dress
  P(X, Y + 32, SW, 6, "#0a0a2a"); P(X, Y + 32, SW, 1, "#3a6ad8");                               // the desk
  lowerThird(P, txt, tw, t, X, Y + 34, SW, ["DEMENTED", "PRESIDENT BIDEN"], "DEMENTED PRESIDENT BIDEN   WHO IS RUNNING THE COUNTRY?   STAY WITH US   ");
  foxBug(P, txt, X + SW - 21, Y + 2);
  P(0, 4, 6, 70, "#0a0a0a"); P(90, 4, 6, 70, "#0a0a0a"); P(0, 72, N, 2, "#0a0a0a");                                         // the bezel over the ticker's ends
  // its blue glow on the bar, the backs of heads watching
  P(0, 74, N, 22, "#1a0606"); A(0.3, () => P(0, 74, N, 22, "#2a3ad8"));
  for (let k = 0; k < 4; k++) { const x = 6 + k * 24; P(x, 85, 14, 11, "#060608"); P(x + 3, 78, 8, 8, "#060608"); A(0.5, () => P(x + 3, 78, 8, 2, "#5a7aff")); }
}

/* ---------- FOX 2: closer, split screen, the podium ---------- */
function fox2(P: Pf, A: Af, txt: Tf, tw: Wf, t: number) {
  for (let y = 0; y < N; y++) P(0, y, N, 1, y < 48 ? "#0a1a5a" : "#14287a");
  // left box: the anchor, a guy, close and furious
  P(2, 4, 44, 52, "#1a2a8a"); P(3, 5, 42, 50, "#0e1e6a");
  { const x = 10, y = 12; P(x - 1, y - 2, 28, 7, "#5a3a1a"); P(x + 1, y + 3, 24, 22, "#f0c0a0");
    P(x + 3, y + 7, 7, 2, "#3a2010"); P(x + 15, y + 7, 7, 2, "#3a2010");                          // brows down
    P(x + 4, y + 10, 5, 4, "#ffffff"); P(x + 16, y + 10, 5, 4, "#ffffff"); P(x + 6, y + 11, 2, 2, "#111"); P(x + 17, y + 11, 2, 2, "#111");
    const m = Math.floor(t * 9) % 3; P(x + 8, y + 18, 10, 2 + m, "#6a1020"); P(x + 8, y + 18, 10, 1, "#ffffff");
    P(x - 4, y + 25, 34, 18, "#1a1a2a"); P(x + 9, y + 25, 8, 8, "#f0f0f0"); P(x + 12, y + 26, 2, 12, "#2a5ad8"); }
  // right box: LIVE, the podium, the seal
  P(50, 4, 44, 52, "#3a3a4a"); P(51, 5, 42, 50, "#5a6a8a");
  for (let y = 5; y < 55; y += 4) P(51, y, 42, 1, "#4a5a7a");
  P(64, 18, 16, 14, "#f0c8a8"); P(63, 14, 18, 6, "#e8e8e8"); P(67, 23, 3, 1, "#3a2a2a"); P(74, 23, 3, 1, "#3a2a2a"); P(69, 28, 6, 1, "#8a4a4a");
  P(58, 32, 28, 23, "#1a1a2a"); P(70, 32, 4, 6, "#f0f0f0");
  P(60, 40, 24, 15, "#6a3a1a"); P(66, 43, 12, 9, "#0a2a6a"); P(68, 45, 8, 5, "#c8a040");          // the podium, the seal
  P(53, 7, 15, 7, "#c80a0a"); txt(54, 8, "LIVE", "#ffffff");
  const end = lowerThird(P, txt, tw, t, 0, 58, N, ["IS DEMENTED BIDEN", "FIT TO SERVE?"], "DEMENTED PRESIDENT BIDEN   CONFUSED AGAIN   MORE AT 11   ");
  P(0, end, N, N - end, "#06061a");
  foxBug(P, txt, 74, 6);
  A(0.12, () => P(0, 0, N, N, "#2a3aff"));                                                       // the TV glare
}

/* ---------- CRAZY: one screaming head, reused ---------- */
function scream(P: Pf, t: number, cx: number, cy: number, r: number, skin: string, hair: string, ph: number) {
  const sh = Math.round(Math.sin(t * 23 + ph) * 1);
  for (let y = -r; y <= r; y++) { const ww = Math.sqrt(r * r - y * y) * 0.85; P(cx - ww + sh, cy + y, ww * 2, 1, skin); }
  for (let k = 0; k < 7; k++) { const a = Math.PI * (1.1 + k * 0.13), l = r * (0.4 + h1(k * 9 + ph * 7) * 0.5); P(cx + Math.cos(a) * r * 0.8 + sh, cy + Math.sin(a) * r * 0.9 - l, Math.max(2, r / 4), l + 1, hair); }   // wild hair
  const e = Math.max(2, Math.round(r * 0.32)), ey = cy - Math.round(r * 0.3);
  P(cx - r * 0.55 + sh, ey, e + 1, e + 1, "#ffffff"); P(cx + r * 0.15 + sh, ey, e + 1, e + 1, "#ffffff");   // eyes, wide
  P(cx - r * 0.55 + sh + e / 2, ey + e / 2, 1, 1, "#111"); P(cx + r * 0.15 + sh + e / 2 - 1, ey + e / 2, 1, 1, "#111");
  P(cx - r * 0.6 + sh, ey - 2, e + 2, 1, "#2a1a1a"); P(cx + r * 0.1 + sh, ey - 3, e + 2, 1, "#2a1a1a");
  const mo = Math.round(r * (0.35 + 0.25 * Math.abs(Math.sin(t * 9 + ph)))), mw = Math.round(r * 0.6);
  P(cx - mw / 2 + sh, cy + r * 0.2, mw, mo, "#3a0606"); P(cx - mw / 2 + sh, cy + r * 0.2, mw, 1, "#ffffff"); P(cx - mw / 4 + sh, cy + r * 0.2 + mo - 2, mw / 2, 2, "#c83a3a");
}
function shout(txt: Tf, tw: Wf, t: number, x: number, y: number, s: string, c: string, sc: number, ph: number) {
  const jx = Math.round(Math.sin(t * 31 + ph) * 1.2), jy = Math.round(Math.cos(t * 27 + ph) * 1.2);
  txt(x + jx + 1, y + jy + 1, s, "#000", sc); txt(x + jx, y + jy, s, c, sc);
}

/* ---------- CRAZY 1: the bar goes off, a guy up on a chair ---------- */
function crazy1(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) {
  P(0, 0, N, N, "#3a0806");
  for (let y = 0; y < 50; y++) P(0, y, N, 1, y % 6 === 0 ? "#4a0e08" : "#5a120a");
  { const on = Math.floor(t * 3) % 5 !== 0; if (on) { A(0.25, () => P(70, 22, 22, 12, "#ff3a2a")); txt(73, 25, "BEER", "#ffe0d0"); } }
  P(0, 50, N, 46, "#2a0806");
  // the guy on the chair, arms thrown up, screaming at the ceiling
  const bob = Math.round(Math.abs(Math.sin(t * 7)) * -2);
  P(38, 84, 22, 3, "#6a3a1a"); P(39, 87, 2, 9, "#4a2210"); P(57, 87, 2, 9, "#4a2210");          // the chair
  P(42, 66 + bob, 5, 18, "#2a3a6a"); P(51, 66 + bob, 5, 18, "#2a3a6a");                           // jeans
  P(40, 42 + bob, 18, 25, "#e8e8e8"); P(40, 42 + bob, 18, 2, "#c8c8c8");                          // undershirt
  const fl = Math.round(Math.sin(t * 11) * 3);
  P(33, 26 + bob + fl, 5, 18, "#e8b090"); P(60, 26 + bob - fl, 5, 18, "#e8b090");               // arms up
  P(32, 22 + bob + fl, 7, 5, "#e8b090"); P(59, 22 + bob - fl, 7, 5, "#e8b090");
  scream(P, t, 49, 32 + bob, 10, "#e8b090", "#6a6a6a", 0);
  // a woman down left yelling at him, a bald guy right yelling at the TV
  scream(P, t, 14, 62, 9, "#c88a6a", "#2a1a10", 2.1); P(4, 71, 20, 25, "#2a8a8a");
  scream(P, t, 82, 58, 9, "#f0c0a0", "#f0c0a0", 4.3); P(72, 67, 20, 29, "#3a5a2a"); P(90, 50, 6, 3, "#f0c0a0");
  // what they're yelling, changing as you scroll
  const said = [["WAKE UP!", "THE WINDS!!"], ["THEY KNOW!", "AAAAH!"], ["LISTEN!!", "NO NO NO!"]][Math.min(2, Math.floor(v * 3))];
  shout(txt, tw, t, 48 - tw(said[0], 2) / 2, 3, said[0], "#ffd23f", 2, 0);
  shout(txt, tw, t, 2, 46, said[1], "#ffffff", 1, 1.4);
  shout(txt, tw, t, 66, 42, "HEY!!", "#5af0ff", 1, 2.7);
}

/* ---------- CRAZY 2: out by the motel doors, a bathrobe screaming at the night ---------- */
function crazy2(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) {
  P(0, 0, N, N, "#06101a");
  for (let k = 0; k < 14; k++) P(h1(k * 3) * N, h1(k * 5) * 12, 1, 1, "#8aa8c8");
  // the TRADE WINDS INN sign, neon, half the letters out
  P(4, 3, 60, 16, "#0a0a0a"); P(4, 3, 60, 1, "#2a2a2a");
  const flick = Math.floor(t * 5);
  [..."TRADE WINDS"].forEach((ch, n) => { const on = (h1(n * 17 + Math.floor(flick / 3)) > 0.2); txt(7 + n * 5, 5, ch, on ? "#5af0ff" : "#103a4a"); });
  txt(7, 12, "INN", "#ffd23f"); txt(22, 12, "VACANCY", flick % 4 ? "#ff3a2a" : "#3a0a0a"); if (flick % 4) txt(22, 12, "VACANCY", "#ff7a6a");
  // the motel wall, doors in a row, one wide open
  P(0, 22, N, 60, "#1e3a44"); P(0, 22, N, 3, "#2a4a54");
  for (let k = 0; k < 4; k++) { const x = 4 + k * 24; P(x, 32, 14, 44, k === 1 ? "#ffc84a" : "#0e2a5a"); P(x - 1, 31, 16, 1, "#3a5a64"); if (k !== 1) P(x + 10, 52, 2, 2, "#c8a040"); }
  A(0.25, () => { for (let y = 76; y < N; y++) { const ww = 10 + (y - 76) * 1.4; P(35 - ww, y, ww * 2, 1, "#ffc84a"); } });  // light spilling from 11
  P(0, 82, N, 14, "#2a2e34"); P(0, 82, N, 1, "#4a4e54");
  // her, in the doorway: bathrobe, curlers, screaming
  P(26, 54, 22, 40, "#4a8ad8"); P(34, 54, 6, 14, "#3a6ab8"); P(26, 72, 22, 2, "#e8e8e8");
  const fl = Math.round(Math.sin(t * 13) * 3);
  P(20, 44 + fl, 6, 14, "#f0c0a0"); P(48, 44 - fl, 6, 14, "#f0c0a0");
  scream(P, t, 37, 44, 11, "#f0c0a0", "#9a9a9a", 1.1);
  for (let k = 0; k < 4; k++) P(30 + k * 4, 31, 3, 3, ["#5af0ff", "#ffd23f"][k % 2]);           // curlers
  // a guy down the walk, shirt off, bottle up, shouting back
  scream(P, t, 76, 50, 8, "#c88a6a", "#1a1a1a", 3.6); P(68, 58, 16, 22, "#c88a6a"); P(70, 80, 5, 10, "#2a3a6a"); P(78, 80, 5, 10, "#2a3a6a");
  P(84, 38 + fl, 4, 18, "#c88a6a"); P(84, 30 + fl, 3, 9, "#3a9a3a"); P(85, 28 + fl, 1, 2, "#e8e8e8");
  const said = [["AAAAAH!", "SHUT UP!"], ["GET OUT!!", "YOU SHUT UP!"], ["I SAW IT!!", "THE SKY!!"]][Math.min(2, Math.floor(v * 3))];
  shout(txt, tw, t, 6, 86, said[0], "#ffd23f", 2, 0);
  shout(txt, tw, t, 94 - tw(said[1]), 24, said[1], "#ffffff", 1, 2.2);
}

/* ---------- LAUGH: Jason, close up, laughing it all off ---------- */
function laugh(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) {
  // morning in the window behind him: blue sky, the sun coming up gold
  for (let y = 0; y < N; y++) P(0, y, N, 1, ["#2a6ad8", "#3a7ae8", "#4a8af0", "#6aa8f8", "#ffc83a", "#ffb02a"][Math.min(5, Math.floor(y / 14))]);
  for (let k = 0; k < 10; k++) { const th = (k / 10) * Math.PI * 2 + t * 0.3; for (let r = 40; r < 70; r += 3) P(84 + Math.cos(th) * r, 70 + Math.sin(th) * r, 1, 1, "#ffe25a"); }
  P(0, 0, 4, N, "#1a1a1a"); P(92, 0, 4, N, "#1a1a1a"); P(0, 0, N, 3, "#1a1a1a");                  // the van window frame
  const sx = Math.round(Math.sin(t * 19) * 1.5), sy = Math.round(Math.abs(Math.sin(t * 9)) * -2);   // shaking with it
  const cx = 48 + sx, cy = 44 + sy;
  // the green CUMMINS tee, the red C
  for (let y = 70; y < N; y++) { const ww = 30 + (y - 70) * 0.8; P(48 - ww + sx, y + sy, ww * 2, 1, "#2a8a3a"); }
  P(40 + sx, 68 + sy, 16, 5, "#e8b898"); P(38 + sx, 70 + sy, 20, 2, "#1e6a2c");
  P(40 + sx, 77 + sy, 16, 13, "#d81a1a"); P(44 + sx, 81 + sy, 12, 5, "#2a8a3a");   // the C
  txt(48 - tw("CUMMINS") / 2 + sx, 91 + sy, "CUMMINS", "#ffffff");
  // his head, thrown back a little
  for (let y = -24; y <= 24; y++) { const ww = Math.sqrt(576 - y * y) * 0.82; P(cx - ww, cy + y, ww * 2, 1, "#f0c4a0"); }
  P(cx - 22, cy - 2, 3, 8, "#e0aa88"); P(cx + 19, cy - 2, 3, 8, "#e0aa88");                      // ears
  P(cx - 20, cy - 26, 40, 12, "#6a3e1e"); P(cx - 21, cy - 18, 5, 12, "#6a3e1e"); P(cx + 16, cy - 18, 5, 12, "#6a3e1e");   // brown hair
  for (let k = 0; k < 6; k++) P(cx - 16 + k * 6, cy - 15 + (k % 2), 4, 3, "#6a3e1e"); P(cx - 12, cy - 25, 14, 2, "#8a5a2e");
  P(cx - 14, cy - 8, 9, 2, "#5a341a"); P(cx + 5, cy - 8, 9, 2, "#5a341a");                       // brows up
  // eyes squeezed shut: two upside-down Vs, tears
  for (const ex of [cx - 10, cx + 9]) { P(ex - 4, cy - 2, 2, 1, "#2a1a14"); P(ex - 2, cy - 3, 2, 1, "#2a1a14"); P(ex, cy - 3, 2, 1, "#2a1a14"); P(ex + 2, cy - 2, 2, 1, "#2a1a14"); P(ex - 4, cy + 1, 8, 1, "#e0a888"); }
  const tear = (t * 1.4) % 1; P(cx - 15, cy + tear * 10, 2, 2, "#7ac8f8"); P(cx + 13, cy + ((tear + 0.5) % 1) * 10, 2, 2, "#7ac8f8");
  P(cx - 16, cy + 4, 5, 3, "#f0a080"); P(cx + 11, cy + 4, 5, 3, "#f0a080");                      // cheeks up
  P(cx - 2, cy + 1, 4, 5, "#e0aa88");                                                           // nose
  // the big open laugh
  const open = 8 + Math.round(Math.abs(Math.sin(t * 12)) * 4);
  P(cx - 10, cy + 8, 20, open, "#5a1010"); P(cx - 9, cy + 8, 18, 3, "#f8f8f8"); P(cx - 5, cy + 8 + open - 3, 10, 3, "#e05a5a");
  P(cx - 11, cy + 8, 1, 3, "#b86a5a"); P(cx + 10, cy + 8, 1, 3, "#b86a5a");
  // HA HA, fading in as you scroll
  const msg = "HA HA HA", sz = 2, wv = Math.round(Math.sin(t * 9) * 2);
  if (v > 0.15) A(Math.min(1, (v - 0.15) * 4), () => { txt(48 - tw(msg, sz) / 2 + 1, 6 + wv, msg, "#111", sz); txt(48 - tw(msg, sz) / 2, 5 + wv, msg, "#ffd23f", sz); });
  for (let k = 0; k < 4; k++) { const x = k % 2 ? 72 : 6, y = 26 + k * 11 - Math.abs(Math.sin(t * 7 + k)) * 3; txt(x, y, "HA", "#ffffff"); }
}

/* ---------- CALM: and then it's quiet. Sunrise over Tulsa, the van on an empty road, birds settling ---------- */
function calm(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number) {
  const SKY = ["#1a2a6a", "#24408a", "#3a5aa8", "#4a7ac0", "#5a9ad0", "#e8a02a", "#ffb02a", "#ffc83a"];
  for (let y = 0; y < 60; y++) P(0, y, N, 1, SKY[Math.min(7, Math.floor(y / 7.5))]);
  const rise = Math.min(1, tau / 4), sy = 60 - rise * 8;                                       // the sun, coming up slow
  A(0.35, () => { for (let r = 22; r > 10; r -= 3) for (let y = -r; y <= r; y++) { const w = Math.sqrt(r * r - y * y); if (sy + y < 60) P(48 - w, sy + y, w * 2, 1, "#ffd23f"); } });
  for (let y = -8; y <= 8; y++) { const w = Math.sqrt(64 - y * y); if (sy + y < 60) P(48 - w, sy + y, w * 2, 1, "#fff4a0"); }
  // Tulsa's skyline, dark against it
  for (const [x, w, h] of [[14, 6, 10], [21, 5, 16], [27, 7, 12], [62, 6, 18], [69, 4, 11], [74, 8, 14], [83, 5, 9]]) P(x, 60 - h, w, h, "#2a2a4a");
  P(66, 38, 1, 4, "#2a2a4a");
  // the land, a long empty road to the horizon
  for (let y = 60; y < N; y++) P(0, y, N, 1, y < 66 ? "#3a7a3a" : y < 76 ? "#2e6a30" : "#245a28");
  for (let y = 60; y < N; y++) { const w = 1 + (y - 60) * 0.9; P(48 - w, y, w * 2, 1, "#4a4a54"); if ((y - Math.floor(t * 6)) % 6 < 3 && y > 62) P(48 - (y - 60) * 0.04, y, 1 + (y - 60) * 0.06, 1, "#ffd23f"); }
  // our van, parked on the shoulder, the two of us sitting on the hood
  P(58, 80, 16, 9, "#f2f2f2"); P(59, 78, 12, 3, "#e8e8e8"); P(60, 79, 9, 2, "#9ab0c8"); P(59, 89, 3, 2, "#1a1a1a"); P(70, 89, 3, 2, "#1a1a1a");
  for (const [x, c, hr] of [[61, "#3a6a9a", "#1a1a1a"], [66, "#2a8a3a", "#6a3e1e"]] as [number, string, string][]) { P(x, 74, 3, 4, c); P(x, 72, 3, 2, "#e0b090"); P(x, 71, 3, 1, hr); }
  // birds on a wire, settling one by one
  P(0, 30, N, 1, "#1a1a2a"); P(6, 26, 1, 34, "#1a1a2a"); P(90, 26, 1, 34, "#1a1a2a");
  for (let k = 0; k < 9; k++) {
    const x = 12 + k * 9, land = 0.4 + k * 0.35, u = Math.min(1, Math.max(0, (tau - land) / 0.8)), y = 29 - (1 - u) * (18 + k * 2), xx = x + (1 - u) * 12;
    const flap = u < 1 && Math.floor(t * 8 + k) % 2;
    P(xx, y - 1, 3, 2, "#0e0e1a"); if (flap) { P(xx - 1, y - 2, 1, 1, "#0e0e1a"); P(xx + 3, y - 2, 1, 1, "#0e0e1a"); }
  }
}
