// The night at the Trade Winds, Tulsa. The map goes dark after the Kansas sundown (just the headlights and
// the turbines' red dots), the van parks in the Tulsa hold, and while you keep scrolling RoadRail shows drawSeq full-frame:
//   BLACK   nothing. Two red turbine dots blinking, then even those go out
//   SMASH   the jump scare: full-bright red, the pool table, a break shot, the BEER neon. The Trade Winds
//   LADY    the bartender (cap, glasses, flannel, her cat on the bar) with us filming her: Jason on camera, Michael on
//           the mic. What makes her happy, and is she. Her real answers, as subtitles
//   FOX     the TV over the bar: BREAKING, "DEMENTED PRESIDENT BIDEN", Parkinson's?
//   CRAZY   the Trade Winds Inn lobby: the long-grey-haired guy in the TULSA tee ranting under MEETING ROOM & RESTROOMS
//   FOX     again, closer: split screen, Biden and Harris walking through a crowd
//   CRAZY   outside by the motel doors, a woman in a bathrobe screaming at the night
//   LAUGH   Jason in the lobby under the TV, hands on his head, cracking up
//   CALM    and then it's quiet. Sunrise over Tulsa
// Chunky 96x96 pixels on a 384 canvas. Each cut remounts the canvas in RoadRail (white flash + shake), which is what
// makes BLACK -> SMASH land as a scare.

import { GLYPH } from "./kit";

const N = 96;
const CUTS = [0, 0.05, 0.1, 0.46, 0.53, 0.6, 0.67, 0.74, 0.87];   // where each panel starts, as a fraction of the hold
export const PANELS = CUTS.length;
export const panelAt = (u: number) => { let k = 0; while (k < PANELS - 1 && u >= CUTS[k + 1]) k++; return k; };

const h1 = (n: number) => { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const MORE: Record<string, string> = {
  J: "011001001101010", Z: "111001010100111", "!": "010010010000010", "?": "111001011000010", ".": "000000000000010",
  "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111", "4": "101101111001001",
  "/": "001001010100100", ":": "000010000010000", "-": "000000111000000", "'": "010010000000000", ",": "000000000010100",
  "&": "010101010101011",
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

/* ---------- LADY: the bartender. We ask, she answers (her real words, from the film) ---------- */
// each beat: who's talking, the line, and her face while it's said
const TALK: [0 | 1, string, "listen" | "smile" | "sad" | "wry"][] = [
  [0, "WHAT MAKES YOU HAPPY?", "listen"],
  [1, "CRITTERS.", "smile"],
  [1, "WITH MY KIDS HAVING MENTAL HEALTH ISSUES,", "sad"],
  [1, "I FEEL LIKE A FAILURE AS A PARENT.", "sad"],
  [1, "SO I'VE GOT ALL THE DOGS, CATS...", "smile"],
  [1, "I ALSO BREED EXOTICS.", "smile"],
  [0, "WOULD YOU SAY THAT YOU'RE HAPPY?", "listen"],
  [1, "AM I? FAKING IT.", "wry"],
  [1, "IT'S JUST BEEN HARD.", "sad"],
];
function lady(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) {
  const bn = Math.min(TALK.length - 1, Math.floor(v * TALK.length)), sub = v * TALK.length - bn, [who, line, mood] = TALK[bn];
  // dark wood wall, a red glow, the back shelf of liquor, the little signs
  P(0, 0, N, N, "#2a100a");
  for (let x = 0; x < N; x += 8) P(x, 0, 1, 58, "#1e0a06");
  A(0.18, () => P(0, 0, N, 58, "#ff3a2a"));
  for (const sy of [12, 26]) { P(60, sy + 7, 36, 2, "#120604"); for (let x = 61; x < 95; x += 3) P(x, sy + (x % 2), 2, 7 - (x % 2), ["#3aa84a", "#e8a02a", "#e8e8e8", "#7a3a1a", "#3a6ad8"][x % 5]); }
  P(2, 4, 30, 9, "#f2f2f2"); txt(5, 6, "WE I.D.", "#c80a0a");
  P(1, 16, 38, 15, "#ffd23f"); txt(3, 18, "WE ACCEPT", "#111"); txt(3, 24, "CASH", "#111"); P(20, 24, 6, 5, "#3a9a3a");
  // her: around 50, glasses, a faded red cap, a red-and-grey flannel
  const cx = 50, cy = 18 + (who === 1 && sub > 0.3 ? Math.round(Math.sin(t * 4)) : 0), SK = "#e8b494", LN = "#b47a5c", HR = "#6a4a30";
  P(cx - 12, cy + 6, 4, 20, HR); P(cx + 8, cy + 6, 4, 20, HR);                                        // hair down past the cap
  P(cx - 8, cy + 6, 16, 18, SK); P(cx - 7, cy + 24, 14, 1, SK); P(cx - 5, cy + 25, 10, 1, SK);          // the face
  P(cx - 10, cy - 1, 20, 8, "#a8453c"); P(cx - 8, cy - 3, 16, 2, "#a8453c"); P(cx - 4, cy - 2, 6, 3, "#b85a4a");   // the cap, sun-faded
  P(cx - 12, cy + 6, 24, 2, "#7a2e26");                                                              // the brim
  const sad = mood === "sad";
  P(cx - 7, cy + 9 + (sad ? 1 : 0), 5, 1, "#6a4a32"); P(cx + 2, cy + 9 + (sad ? 1 : 0), 5, 1, "#6a4a32");   // brows
  if (sad) { P(cx - 3, cy + 9, 1, 1, "#6a4a32"); P(cx + 2, cy + 9, 1, 1, "#6a4a32"); }                 // knit up in the middle
  for (const gx of [cx - 8, cx + 1]) { P(gx, cy + 11, 7, 1, "#2a2a2a"); P(gx, cy + 15, 7, 1, "#2a2a2a"); P(gx, cy + 11, 1, 5, "#2a2a2a"); P(gx + 6, cy + 11, 1, 5, "#2a2a2a"); }   // glasses
  P(cx - 1, cy + 12, 2, 1, "#2a2a2a");
  const look = mood === "wry" ? 1 : 0;                                                                // she looks down and away on "faking it"
  if (mood === "smile") { for (const ex of [cx - 6, cx + 3]) { P(ex, cy + 14, 1, 1, "#2a1a14"); P(ex + 1, cy + 13, 1, 1, "#2a1a14"); P(ex + 2, cy + 14, 1, 1, "#2a1a14"); } }
  else { P(cx - 5, cy + 13 + look, 2, 2, "#2a1a14"); P(cx + 4, cy + 13 + look, 2, 2, "#2a1a14"); }
  P(cx - 9, cy + 13, 1, 1, LN); P(cx - 9, cy + 15, 1, 1, LN); P(cx + 8, cy + 13, 1, 1, LN); P(cx + 8, cy + 15, 1, 1, LN);   // crow's feet
  P(cx - 1, cy + 16, 2, 3, "#d49a7a");                                                               // nose
  P(cx - 6, cy + 18, 1, 3, LN); P(cx + 5, cy + 18, 1, 3, LN);                                        // lines
  if (mood === "sad" && bn === TALK.length - 1) { const d = (t * 0.6) % 1; P(cx + 4, cy + 16 + d * 5, 1, 2, "#7ac8f8"); }   // just one tear
  const talking = who === 1 && sub > 0.2 && Math.floor(t * 6) % 2 === 0, my = cy + 21;
  if (talking) { P(cx - 3, my - 1, 6, 3, "#5a1a10"); P(cx - 3, my - 1, 6, 1, "#f2f2f2"); }
  else if (mood === "smile") { P(cx - 3, my, 6, 1, "#8a2a1a"); P(cx - 4, my - 1, 1, 1, "#8a2a1a"); P(cx + 3, my - 1, 1, 1, "#8a2a1a"); }
  else if (mood === "sad") { P(cx - 3, my, 6, 1, "#8a2a1a"); P(cx - 4, my + 1, 1, 1, "#8a2a1a"); P(cx + 3, my + 1, 1, 1, "#8a2a1a"); }
  else if (mood === "wry") { P(cx - 3, my, 6, 1, "#8a2a1a"); P(cx + 3, my - 1, 1, 1, "#8a2a1a"); }
  else P(cx - 3, my, 6, 1, "#8a2a1a");
  P(cx - 3, cy + 26, 6, 2, "#d8a284");                                                               // neck
  for (let y = cy + 27; y < 60; y++) { const ww = Math.min(18, 8 + (y - cy - 27) * 2);               // the flannel: red, grey checks
    for (let x = -ww; x < ww; x++) P(cx + x, y, 1, 1, (x + 40) % 6 < 2 && y % 6 < 2 ? "#4a1a16" : (x + 40) % 6 < 2 || y % 6 < 2 ? "#8a8a8e" : "#b83a30"); }
  P(cx - 2, cy + 27, 4, 4, "#d8a284"); P(cx - 5, cy + 27, 3, 3, "#c8c8cc"); P(cx + 2, cy + 27, 3, 3, "#c8c8cc");   // open collar
  // the bar: TIP jar, a beer, a plastic cup, and the critters
  P(0, 58, N, 5, "#4a2414"); P(0, 58, N, 1, "#8a4a26"); P(0, 63, N, 33, "#1e0c06");
  P(20, 42, 13, 16, "#c8e0e8"); P(21, 41, 11, 2, "#f2f2f2"); txt(21, 46, "TIP", "#1a1a1a"); P(22, 53, 4, 3, "#3a9a3a"); P(27, 52, 3, 4, "#3a9a3a"); P(25, 50, 3, 2, "#3a9a3a");
  P(37, 48, 3, 10, "#6a3a10"); P(38, 45, 1, 3, "#6a3a10"); P(37, 51, 3, 3, "#e8d070");             // a beer
  P(42, 51, 5, 7, "#d8e8f0"); P(42, 51, 5, 1, "#ffffff");                                            // a plastic cup
  { const tail = Math.round(Math.sin(t * 2) * 1.5), bl = Math.floor(t * 0.5) % 5 === 0;              // the cat, curled on the bar
    P(64, 52, 14, 6, "#8a8a8a"); P(74, 48, 7, 6, "#8a8a8a"); P(74, 46, 2, 2, "#8a8a8a"); P(79, 46, 2, 2, "#8a8a8a");
    for (let x = 65; x < 75; x += 3) P(x, 52, 1, 6, "#5a5a5a"); P(75, 50, 1, bl ? 1 : 2, "#3a8a3a"); P(78, 50, 1, bl ? 1 : 2, "#3a8a3a"); P(76, 52, 2, 1, "#e8a088");
    P(60, 55 + tail, 5, 2, "#8a8a8a"); }
  if (bn >= 4) { const sx = 20 + Math.round(Math.sin(t * 1.5) * 1);                                  // and one of her exotics, a little lizard, up on the TIP jar
    P(sx, 38, 10, 2, "#6aaa3a"); P(sx + 10, 37, 4, 3, "#6aaa3a"); P(sx + 12, 37, 1, 1, "#111"); P(sx - 4, 39, 4, 1, "#5a9a2a");
    P(sx + 1, 40, 1, 1, "#5a9a2a"); P(sx + 8, 40, 1, 1, "#5a9a2a"); for (let x = sx; x < sx + 10; x += 2) P(x, 37, 1, 1, "#ffd23f"); }
  // us, in the foreground: Jason with the camera on his shoulder (left), Michael in the grey suit with the mic (right)
  { const b = Math.round(Math.sin(t * 2) * 0.6);
    for (let y = 76; y < N; y++) { const ww = Math.min(22, 12 + (y - 76) * 2); P(10 - ww, y + b, ww * 2 + 6, 1, "#2a8a3a"); }   // Jason's shoulders, green tee
    P(-2, 52 + b, 22, 26, "#2a1a10"); P(1, 49 + b, 16, 4, "#2a1a10"); P(3, 48 + b, 10, 1, "#8a6a4a"); P(1, 49 + b, 2, 1, "#8a6a4a"); P(15, 49 + b, 2, 1, "#8a6a4a"); P(19, 52 + b, 1, 8, "#8a6a4a");   // the back of his head, lit from the bar
    P(17, 62 + b, 3, 7, "#e8b898"); P(13, 74 + b, 8, 4, "#e0aa88");                                    // ear, neck
    P(16, 56 + b, 26, 13, "#3a3a44"); P(16, 56 + b, 26, 1, "#7a7a86"); P(20, 52 + b, 14, 4, "#1a1a1e"); P(24, 60 + b, 10, 5, "#26262c");   // the camera on his shoulder
    P(42, 57 + b, 8, 10, "#1a1a1e"); P(49, 58 + b, 2, 8, "#3a6ad8"); P(13, 59 + b, 4, 5, "#1a1a1e");       // lens, eyepiece
    if (Math.floor(t * 2) % 2) P(36, 58 + b, 2, 2, "#ff2a1a");                                         // REC
    P(40, 67 + b, 6, 4, "#e8b898"); }                                                                  // his hand on the lens
  { const b = Math.round(Math.sin(t * 2 + 1) * 0.6);
    P(66, 80 + b, 30, 16, "#8a8a92"); P(70, 78 + b, 26, 3, "#8a8a92"); P(78, 78 + b, 6, 6, "#f2f2f2"); P(77, 80 + b, 1, 16, "#6a6a72");   // grey suit, white shirt
    P(78, 50 + b, 18, 10, "#2e1e12"); P(86, 56 + b, 10, 22, "#2e1e12"); P(78, 50 + b, 14, 1, "#8a6a4a");   // Michael, three-quarter from behind: hair
    P(74, 56 + b, 13, 18, "#e0b090"); P(72, 62 + b, 2, 4, "#e0b090"); P(87, 61 + b, 3, 5, "#d49a7a");     // face, nose, ear
    P(74, 68 + b, 14, 11, "#4a2e1c"); P(76, 66 + b, 8, 2, "#4a2e1c"); P(77, 61 + b, 2, 2, "#2a1a14"); P(75, 59 + b, 5, 1, "#3a2414");   // the beard, an eye, a brow
    for (let k = 0; k < 9; k++) P(68 - k * 1.3, 82 - k * 1.8 + b, 5, 5, "#8a8a92");                       // his arm, out toward her
    P(55, 63 + b, 5, 4, "#e0b090"); P(54, 58 + b, 3, 6, "#1a1a1a"); P(52, 54 + b, 6, 5, "#9a9aa0"); P(53, 55 + b, 3, 2, "#c8c8d0"); }   // hand, the mic
  // the subtitles, burned in at the bottom: us in yellow, her in white, typed out as you scroll
  const rows = wrap(line, 23), shown = Math.ceil(Math.min(1, sub * 3) * line.length), top = N - rows.length * 6 - 5;
  A(0.85, () => P(0, top, N, N - top, "#000"));
  let used = 0; rows.forEach((r, i) => { const n = Math.max(0, Math.min(r.length, shown - used)); used += r.length + 1;
    txt(48 - tw(r) / 2, top + 3 + i * 6, r.slice(0, n), who === 0 ? "#ffd23f" : "#ffffff"); });
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
  lowerThird(P, txt, tw, t, X, Y + 34, SW, ["DEMENTED", "PRESIDENT BIDEN"], "DEMENTED PRESIDENT BIDEN   TESTED FOR PARKINSON'S?   WHO IS RUNNING THE COUNTRY?   ");
  foxBug(P, txt, X + SW - 21, Y + 2);
  P(0, 4, 6, 70, "#0a0a0a"); P(90, 4, 6, 70, "#0a0a0a"); P(0, 72, N, 2, "#0a0a0a");                                         // the bezel over the ticker's ends
  // its blue glow on the bar, the backs of heads watching
  P(0, 74, N, 22, "#1a0606"); A(0.3, () => P(0, 74, N, 22, "#2a3ad8"));
  for (let k = 0; k < 4; k++) { const x = 6 + k * 24; P(x, 85, 14, 11, "#060608"); P(x + 3, 78, 8, 8, "#060608"); A(0.5, () => P(x + 3, 78, 8, 2, "#5a7aff")); }
}

/* ---------- FOX 2: closer, split screen, Biden and Harris walking through a crowd ---------- */
function fox2(P: Pf, A: Af, txt: Tf, tw: Wf, t: number) {
  for (let y = 0; y < N; y++) P(0, y, N, 1, y < 48 ? "#0a1a5a" : "#14287a");
  // left box: the anchor, a guy, close and furious
  P(2, 4, 44, 52, "#1a2a8a"); P(3, 5, 42, 50, "#0e1e6a");
  { const x = 10, y = 12; P(x - 1, y - 2, 28, 7, "#5a3a1a"); P(x + 1, y + 3, 24, 22, "#f0c0a0");
    P(x + 3, y + 7, 7, 2, "#3a2010"); P(x + 15, y + 7, 7, 2, "#3a2010");                          // brows down
    P(x + 4, y + 10, 5, 4, "#ffffff"); P(x + 16, y + 10, 5, 4, "#ffffff"); P(x + 6, y + 11, 2, 2, "#111"); P(x + 17, y + 11, 2, 2, "#111");
    const m = Math.floor(t * 9) % 3; P(x + 8, y + 18, 10, 2 + m, "#6a1020"); P(x + 8, y + 18, 10, 1, "#ffffff");
    P(x - 4, y + 25, 34, 18, "#1a1a2a"); P(x + 9, y + 25, 8, 8, "#f0f0f0"); P(x + 12, y + 26, 2, 12, "#2a5ad8"); }
  // right box: the footage, the two of them walking through a crowd, cameras up
  P(50, 4, 44, 52, "#3a3a4a"); P(51, 5, 42, 50, "#6a8aa8");
  for (let k = 0; k < 9; k++) { const x = 52 + h1(k * 5) * 36, y = 34 + h1(k * 3) * 8; P(x, y, 5, 26, "#2a2a3a"); P(x + 1, y - 4, 4, 4, ["#c89a7a", "#6a4028", "#f0c8a0"][k % 3]); }   // the crowd
  const st = Math.floor(t * 3) % 2;
  P(60, 22, 8, 8, "#f0c8a8"); P(59, 20, 10, 3, "#f2f2f2"); P(61, 25, 2, 1, "#3a2a2a"); P(65, 25, 2, 1, "#3a2a2a");   // him: white hair
  P(58, 30, 12, 22, "#1a2a4a"); P(62, 30, 4, 4, "#f2f2f2"); P(59, 52, 4, 7, "#1a1a2a"); P(65, 52 - st, 4, 7, "#1a1a2a");
  P(76, 24, 8, 8, "#c89a7a"); P(75, 22, 10, 3, "#1a1a1a"); P(75, 24, 2, 8, "#1a1a1a"); P(77, 27, 2, 1, "#2a1a1a"); P(81, 27, 2, 1, "#2a1a1a");   // her: dark hair
  P(74, 32, 12, 20, "#3a3a4a"); P(78, 32, 4, 3, "#f2f2f2"); P(75, 52, 4, 7, "#1a1a2a"); P(81, 52 - (1 - st), 4, 7, "#1a1a2a");
  if (Math.floor(t * 4) % 5 === 0) A(0.6, () => P(52 + h1(Math.floor(t * 4)) * 36, 10, 4, 4, "#ffffff"));   // a camera flash
  P(53, 7, 15, 7, "#c80a0a"); txt(54, 8, "LIVE", "#ffffff");
  const end = lowerThird(P, txt, tw, t, 0, 58, N, ["BIDEN: PARKINSON'S?", "TESTED OR TREATED?"], "DEMENTED PRESIDENT BIDEN   PARKINSON'S DISEASE?   MORE AT 11   ");
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

/* ---------- CRAZY 1: the Trade Winds Inn lobby, the guy with the lanyard, ranting ---------- */
function crazy1(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) {
  lobby(P);
  P(2, 4, 54, 17, "#3a2414"); P(3, 5, 52, 15, "#5a3a20"); txt(6, 7, "MEETING ROOM", "#f2f2f2"); txt(6, 13, "& RESTROOMS", "#f2f2f2");   // the sign
  P(50, 13, 3, 1, "#f2f2f2"); P(52, 12, 1, 3, "#f2f2f2");                                          // and its arrow
  P(68, 56, 28, 26, "#5a3a20"); P(66, 54, 30, 3, "#7a4a26"); P(84, 50, 5, 3, "#c8a040"); P(86, 49, 1, 1, "#e8e8e8");   // the front desk, a bell
  // him: long grey hair, a grey beard, a black TULSA tee, a lanyard, going on and on
  const cx = 38, bob = Math.round(Math.sin(t * 6) * 1), cy = 38 + bob;
  P(cx - 13, cy - 4, 26, 30, "#b8b8bc");                                                            // the long grey hair behind
  for (let y = 54 + bob; y < 84; y++) { const ww = Math.min(19, 13 + (y - 54 - bob) * 0.8); P(cx - ww, y, ww * 2, 1, "#1a1a1e"); }   // the tee
  P(cx - 5, 54 + bob, 2, 8, "#2a5ad8"); P(cx + 3, 54 + bob, 2, 8, "#2a5ad8"); P(cx - 3, 61 + bob, 6, 2, "#2a5ad8"); P(cx - 4, 63 + bob, 8, 6, "#f2f2f2"); P(cx - 3, 64 + bob, 6, 1, "#2a5ad8");   // lanyard, badge
  txt(cx - tw("TULSA") / 2, 72 + bob, "TULSA", "#ffd23f"); P(cx - 9, 78 + bob, 18, 1, "#ffd23f"); P(cx + 9, 77 + bob, 2, 1, "#ffd23f");   // the script, underlined
  scream(P, t, cx, cy, 10, "#e8b494", "#b8b8bc", 0.7);
  P(cx - 7, cy + 4, 14, 10, "#c8c8cc"); { const mo = 2 + Math.floor(t * 9) % 3; P(cx - 3, cy + 4, 6, mo, "#3a0606"); }   // beard, mouth going in it
  // arms: one jabbing a finger at us, one waving at the sign
  const jab = Math.round(Math.sin(t * 10) * 2), wv = Math.round(Math.sin(t * 7) * 3);
  P(cx + 16, 58 + bob, 14 + jab, 5, "#e8b494"); P(cx + 30 + jab, 57 + bob, 5, 2, "#e8b494");
  P(cx - 22, 40 + wv, 5, 18, "#e8b494"); P(cx - 23, 36 + wv, 7, 5, "#e8b494");
  for (let k = 0; k < 3; k++) { const u = (t * 1.5 + k / 3) % 1; A(1 - u, () => P(cx + 12 + u * 10, cy - 2 - u * 6, 1, 1, "#ffffff")); }   // spit flying
  // the rant, scrolling on
  const said = [["LISTEN!", "AND ANOTHER THING"], ["NO NO NO!", "YOU KNOW WHAT?"], ["WAIT!!", "LET ME TELL YOU"]][Math.min(2, Math.floor(v * 3))];
  P(0, 84, N, 12, "#000");
  shout(txt, tw, t, 4, 86, said[0], "#ffd23f", 2, 0);
  shout(txt, tw, t, 94 - tw(said[1]), 26, said[1], "#ffffff", 1, 1.4);
}
// the Trade Winds Inn lobby: grey-blue walls, wood wainscot, worn red carpet
function lobby(P: Pf) {
  P(0, 0, N, N, "#4a6474"); for (let x = 0; x < N; x += 12) P(x, 0, 1, 50, "#42596a");
  P(0, 50, N, 30, "#4a2c18"); P(0, 50, N, 2, "#6a4026"); for (let x = 4; x < N; x += 10) P(x, 54, 1, 26, "#3a2212");
  P(0, 80, N, 16, "#5a1a1e"); for (let x = 0; x < N; x += 6) P(x + (x % 12 ? 2 : 0), 84, 2, 1, "#6a2a2a");
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

/* ---------- LAUGH: Jason under the lobby TV, hands on his head, cracking up ---------- */
function laugh(P: Pf, A: Af, txt: Tf, tw: Wf, t: number, tau: number, v: number) {
  lobby(P);
  // the TV up on the wall, still going about Biden
  P(22, 1, 52, 30, "#0a0a0a"); P(24, 3, 48, 26, "#0a1a5a"); P(44, 6, 10, 9, "#f0c0a0"); P(43, 5, 12, 3, "#5a3a1a"); P(41, 14, 16, 8, "#1a1a2a");
  P(24, 17, 48, 6, Math.floor(t * 2) % 2 ? "#e01a1a" : "#c80a0a"); txt(26, 18, "BREAKING", "#ffffff"); P(24, 23, 48, 6, "#ffffff"); txt(26, 24, "BIDEN", "#0a1a4a");
  P(58, 5, 12, 7, "#0a2a7a"); txt(59, 6, "FOX", "#ffffff");
  A(0.15, () => P(10, 31, 76, 30, "#5a7aff"));                                                     // its glow on him
  const sx = Math.round(Math.sin(t * 19) * 1.5), sy = Math.round(Math.abs(Math.sin(t * 9)) * -2), cx = 48 + sx, cy = 58 + sy;   // shaking with it
  // the green CUMMINS tee, the red C
  for (let y = 76; y < N; y++) { const ww = 26 + (y - 76) * 1.2; P(48 - ww + sx, y + sy, ww * 2, 1, "#2a8a3a"); }
  P(42 + sx, 74 + sy, 12, 4, "#e8b898"); P(40 + sx, 76 + sy, 16, 2, "#1e6a2c");
  P(41 + sx, 80 + sy, 14, 10, "#d81a1a"); P(45 + sx, 83 + sy, 10, 4, "#2a8a3a");                  // the C
  txt(48 - tw("CUMMINS") / 2 + sx, 91 + sy, "CUMMINS", "#ffffff");
  // arms up, elbows out, hands clamped on top of his head
  P(14 + sx, 60 + sy, 10, 20, "#2a8a3a"); P(72 + sx, 60 + sy, 10, 20, "#2a8a3a");                  // sleeves
  for (let k = 0; k < 10; k++) { P(16 + k * 1.6 + sx, 58 - k * 2.2 + sy, 6, 5, "#f0c4a0"); P(76 - k * 1.6 + sx, 58 - k * 2.2 + sy, 6, 5, "#f0c4a0"); }   // forearms
  // his head
  for (let y = -17; y <= 17; y++) { const ww = Math.sqrt(289 - y * y) * 0.88; P(cx - ww, cy + y, ww * 2, 1, "#f0c4a0"); }
  P(cx - 17, cy - 1, 3, 6, "#e0aa88"); P(cx + 14, cy - 1, 3, 6, "#e0aa88");                        // ears
  for (let k = 0; k < 14; k++) { const a = Math.PI * (1.02 + k * 0.074); P(cx + Math.cos(a) * 15 - 3, cy - 6 + Math.sin(a) * 13 - 3, 7, 7, k % 2 ? "#3a2414" : "#2a1a0e"); }   // dark curls
  for (let k = 0; k < 5; k++) P(cx - 10 + k * 5, cy - 14 + (k % 2) * 2, 4, 4, "#3a2414");
  P(cx - 23, cy - 18, 10, 6, "#f0c4a0"); P(cx + 13, cy - 18, 10, 6, "#f0c4a0");                     // hands on his head
  P(cx - 12, cy - 6, 8, 2, "#2a1a0e"); P(cx + 4, cy - 6, 8, 2, "#2a1a0e");                          // brows up
  for (const ex of [cx - 8, cx + 7]) { P(ex - 3, cy - 1, 2, 1, "#2a1a14"); P(ex - 1, cy - 2, 2, 1, "#2a1a14"); P(ex + 1, cy - 1, 2, 1, "#2a1a14"); }   // eyes squeezed
  const tear = (t * 1.4) % 1; P(cx - 12, cy + tear * 8, 2, 2, "#7ac8f8"); P(cx + 10, cy + ((tear + 0.5) % 1) * 8, 2, 2, "#7ac8f8");
  P(cx - 13, cy + 3, 4, 3, "#f0a080"); P(cx + 9, cy + 3, 4, 3, "#f0a080");                          // cheeks up
  P(cx - 1, cy + 1, 3, 4, "#e0aa88");                                                              // nose
  const open = 6 + Math.round(Math.abs(Math.sin(t * 12)) * 3);                                      // the big open laugh
  P(cx - 8, cy + 7, 16, open, "#5a1010"); P(cx - 7, cy + 7, 14, 2, "#f8f8f8"); P(cx - 4, cy + 7 + open - 2, 8, 2, "#e05a5a");
  // HA HA, fading in as you scroll
  const n = 2 + Math.floor(v * 5);
  for (let k = 0; k < n; k++) { const x = k % 2 ? 78 : 3, y = 4 + Math.floor(k / 2) * 14 - Math.abs(Math.sin(t * 7 + k)) * 3, c = k % 3 ? "#ffd23f" : "#ffffff";
    txt(x + 1, y + 1, "HA", "#111", 2); txt(x, y, "HA", c, 2); }
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
