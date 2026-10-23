// Layout of the 8-bit road trip: which scene sits where, where the highway runs,
// where the van leaves it, where it stops, and who says what along the way.
// Everything here is pure math so scenes, the live layer and RoadRail can all share it.

import { HARBOR } from "../harbor";

export const W = 128;      // strip width in "pixels"
export const MID = 64;

export type Scene =
  | "venice" | "la" | "oc" | "vegas" | "desert" | "arches" | "vail" | "lake" | "denver" | "truckstop" | "silo"
  | "plains" | "tulsa" | "oregon" | "clinton" | "casino" | "graceland" | "nashville" | "gatlinburg"
  | "smoky" | "waffle" | "tunnel" | "antique" | "fair" | "dish" | "sunset" | "mcd" | "dc" | "jersey"
  | "clouds" | "harbor";

// in driving order; `stop` = index into lib/america.ts stops, label overrides the place name
export type Def = { sc: Scene; h: number; stop: number; label?: string };
export const SCENES: Def[] = [
  { sc: "venice", h: 150, stop: 0 }, { sc: "la", h: 130, stop: 0, label: "Los Angeles" }, { sc: "oc", h: 170, stop: 1 },
  { sc: "vegas", h: 200, stop: 2 }, { sc: "desert", h: 140, stop: 3 }, { sc: "arches", h: 210, stop: 4 },
  { sc: "vail", h: 140, stop: 5 }, { sc: "lake", h: 300, stop: 6 }, { sc: "denver", h: 170, stop: 7 },
  { sc: "truckstop", h: 130, stop: 8 }, { sc: "silo", h: 270, stop: 9 }, { sc: "plains", h: 290, stop: 10 },
  { sc: "tulsa", h: 210, stop: 11 }, { sc: "oregon", h: 190, stop: 12 }, { sc: "clinton", h: 150, stop: 13, label: "Little Rock" },
  { sc: "casino", h: 150, stop: 15, label: "Horseshoe · Hernando" }, { sc: "graceland", h: 190, stop: 17, label: "Graceland · Memphis" },
  { sc: "nashville", h: 230, stop: 19, label: "Nashville · Buc-ee's" }, { sc: "gatlinburg", h: 220, stop: 21 },
  { sc: "smoky", h: 150, stop: 22 }, { sc: "waffle", h: 130, stop: 23 }, { sc: "tunnel", h: 150, stop: 23, label: "Up into the mountains" },
  { sc: "antique", h: 140, stop: 24 }, { sc: "fair", h: 160, stop: 24 }, { sc: "dish", h: 180, stop: 25 },
  { sc: "sunset", h: 190, stop: 25, label: "Appalachia, sundown" }, { sc: "mcd", h: 220, stop: 26 }, { sc: "dc", h: 220, stop: 27 },
  { sc: "jersey", h: 380, stop: 28 }, { sc: "clouds", h: 150, stop: 29, label: "Almost there" }, { sc: "harbor", h: HARBOR.h, stop: 29 },
];
export const Y0: number[] = [];
export const HT = SCENES.reduce((a, d) => (Y0.push(a), a + d.h), 0);
export const sceneAt = (y: number) => { let i = 0; while (i < SCENES.length - 1 && Y0[i + 1] <= y) i++; return i; };
export const at = (sc: Scene) => SCENES.findIndex((d) => d.sc === sc);
export const top = (sc: Scene) => Y0[at(sc)];
export const bottom = (sc: Scene) => Y0[at(sc)] + SCENES[at(sc)].h;

const smooth = (u: number) => { const v = Math.min(1, Math.max(0, u)); return v * v * (3 - 2 * v); };
export const hash = (n: number) => {
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

/* ---------- the highway ---------- */

// the trip ends on Staten Island: the last scene is the harbor map, turned so the drive runs down it
const HB = at("harbor");
const PATH = HARBOR.path.map(([x, y]) => [x, Y0[HB] + y] as [number, number]);
export const ROAD_END = PATH[PATH.length - 1][1];
const pathX = (y: number) => {             // Catmull-Rom through the waypoints
  let i = 0; while (i < PATH.length - 2 && PATH[i + 1][1] <= y) i++;
  const p0 = PATH[Math.max(0, i - 1)], p1 = PATH[i], p2 = PATH[i + 1], p3 = PATH[Math.min(PATH.length - 1, i + 2)];
  const u = Math.min(1, Math.max(0, (y - p1[1]) / (p2[1] - p1[1]))), u2 = u * u, u3 = u2 * u;
  return 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3);
};

const SUN = at("sunset"), KS0 = top("truckstop"), KS1 = bottom("plains"), CL = top("clouds"), HB0 = PATH[0][1];
export const KX = MID - 16;                 // across Kansas the road goes dead straight
// (Kansas got 260 rows longer in v8; east of its dead-straight middle the curves keep their old phase,
// so every scene after it still sits where it was drawn)
const KANSAS_EXTRA = 260, KMID = (top("truckstop") + bottom("plains")) / 2;
const wander = (y0: number) => {
  const y = y0 > KMID ? y0 - KANSAS_EXTRA : y0;
  let x = MID + 20 * Math.sin(y / 37) + 6 * Math.sin(y / 11.3);
  const u = (y0 - Y0[SUN]) / SCENES[SUN].h;
  if (u > 0 && u < 1) x += 14 * Math.sin(Math.PI * u) * Math.sin(y / 9);   // Appalachia at sundown: it wanders a lot more
  return x;
};
export const roadX = (y: number) => {
  if (y >= HB0) return pathX(y);
  let x = wander(y);
  const k = smooth((y - KS0) / 40) * smooth((KS1 - y) / 40);
  if (k > 0) x += (KX - x) * k;
  if (y > CL) x += (PATH[0][0] - x) * smooth((y - CL) / (HB0 - CL));
  return x;
};
export const harborAt = (x: number, y: number) => {
  const r = HARBOR.rows[Math.floor(y - Y0[HB])];
  return r ? r[Math.min(HARBOR.w - 1, Math.max(0, Math.floor(x)))] : ".";
};

/* ---------- where the van leaves the highway ---------- */

// a trail into the Smokies, the McDonald's drive-thru
export type Detour = { a: number; b: number; dir: number; amp: number };
const mk = (sc: Scene, a: number, b: number, amp: number): Detour => {
  const y0 = top(sc), m = y0 + (a + b) / 2;
  return { a: y0 + a, b: y0 + b, dir: roadX(m) > MID ? -1 : 1, amp };
};
export const TRAIL = mk("smoky", 30, 120, 24);
export const DRIVE = mk("mcd", 30, 190, 26);
export function vanX(y: number) {
  for (const d of [TRAIL, DRIVE]) if (y > d.a && y < d.b) {
    const u = (y - d.a) / (d.b - d.a);
    const s = d === DRIVE ? Math.min(1, Math.sin(Math.PI * u) * 2.2) : Math.sin(Math.PI * u);
    return roadX(y) + d.dir * d.amp * s;
  }
  return roadX(y);
}

/* ---------- where the van stops, and what happens there ---------- */

// HOLDS: the van parks at row y while you scroll `len` more rows' worth
export type Hold = { y: number; len: number };
export const HOLDS: Hold[] = [
  { y: top("vegas") + 150, len: 130 },       // the preacher outside Trump's tower: a question, then an answer
  { y: top("tulsa") + 40, len: 290 },        // the crash: through the Trade Winds bar at night (trip/scare.ts drawSeq)
  { y: top("graceland") + 128, len: 170 },   // the Pyramid: the Bass Pro guy walks us through the guns
];
export const SCROLL = ROAD_END - 12 + HOLDS.reduce((a, h) => a + h.len, 0);
// scroll progress (0..1) → the van's row
export function vanAt(p: number) {
  let s = 12 + p * SCROLL, y = 12;
  for (const h of HOLDS) {
    if (s <= h.y) return s;
    if (s <= h.y + h.len) return h.y;
    s -= h.len; y = h.y;
  }
  return Math.max(y, Math.min(ROAD_END, s));
}
export function progressAt(vy: number) {          // the inverse, for click/drag
  let s = vy;
  for (const h of HOLDS) if (vy > h.y) s += h.len;
  return Math.min(1, Math.max(0, (s - 12) / SCROLL));
}

// which hold the scroll position p is parked in, and how far through it (u = 0..1)
export function holdAt(p: number): { i: number; u: number } | null {
  let s = 12 + p * SCROLL;
  for (let i = 0; i < HOLDS.length; i++) {
    const h = HOLDS[i];
    if (s <= h.y) return null;
    if (s <= h.y + h.len) return { i, u: (s - h.y) / h.len };
    s -= h.len;
  }
  return null;
}
// the Kansas → Oklahoma sundown: the ground plane bends away (tilt 0..1) and the light goes (dusk 0..1)
// until the van crashes into the Trade Winds; after the crash sequence it's morning in Tulsa
export const SEQ = { hold: 1 };
export function bendAt(vy: number) {
  const a = top("silo") + 10, b = HOLDS[1].y;     // a long dramatic sundown: Colby, Hays, into Oklahoma
  if (vy <= a || vy > b) return { tilt: 0, spin: 0, dusk: 0 };
  const u = (vy - a) / (b - a);
  // the last stretch before the bar: the whole world swings round to horizontal, holds, then we hit the wall
  return { tilt: u * u, spin: smooth((vy - (b - 70)) / 40), dusk: Math.min(1, u * 1.3) };
}

// speech bubbles, shown while the van is between a and b
// (hold/u0/u1: only while parked in that hold, between those fractions of it)
export type Say = { a: number; b: number; text: string; who: "us" | "them" | "note"; hold?: number; u0?: number; u1?: number; href?: string };
const mcdQ = (() => {
  const lines: [Say["who"], string][] = [
    ["note", "First interview after hearing the news"],
    ["us", "What is one question you would ask everyone in America?"], ["them", "What is the meaning of life?"],
    ["us", "Answer your own question."], ["them", "Help others."],
    ["us", "Are you happy?"], ["them", "No."],
  ];
  const a = DRIVE.a + 2, step = (DRIVE.b - 4 - a) / lines.length;
  return lines.map(([who, text], k): Say => ({ a: a + k * step, b: a + (k + 1) * step, who, text }));
})();
export const SAYS: Say[] = [
  { a: HOLDS[0].y - 30, b: HOLDS[0].y + 1, who: "them", text: "“Are you going to heaven or to hell?”", hold: 0, u0: 0, u1: 0.5 },
  { a: HOLDS[0].y - 1, b: HOLDS[0].y + 1, who: "us", text: "“A little bit of both.”", hold: 0, u0: 0.5, u1: 1.01 },
  { a: TRAIL.a - 20, b: TRAIL.b + 6, who: "us", text: "“hey Jason, turn right onto this trail”" },
  { a: Y0[SUN] + 60, b: Y0[SUN] + 160, who: "us", text: "“Michael! Trump got shot in Pennsylvania!”" },
  ...mcdQ,
];

/* ---------- placing things beside the road ---------- */

// the span the road (and the van, on a detour) covers over rows y..y+h
export function room(y: number, h: number) {
  let lo = 999, hi = -999;
  for (let k = -1; k <= h + 1; k++) { const a = roadX(y + k), b = vanX(y + k); lo = Math.min(lo, a, b); hi = Math.max(hi, a, b); }
  return { lo, hi, left: lo - 6, right: W - 1 - (hi + 6) };
}
// x for something w wide, h tall at row y, on whichever side of the road has more room
// (too wide for the gap? it hugs the road and runs off the edge of the map instead of onto the road)
export function free(y: number, h: number, w: number, side?: "l" | "r") {
  const { lo, hi, left, right } = room(y, h);
  const goLeft = side ? side === "l" : left >= right;
  if (goLeft) return w <= left ? Math.max(1, Math.round((left - w) / 2) + 1) : Math.floor(lo - 6 - w);
  return w <= right ? Math.min(W - 1 - w, Math.round(hi + 6 + (right - w) / 2)) : Math.ceil(hi + 7);
}
// x for something w wide right beside the road (gap px from the shoulder) on a given side
export function beside(y: number, h: number, w: number, side: "l" | "r", gap = 3) {
  const { lo, hi } = room(y, h);
  return side === "l" ? Math.floor(lo - 6 - gap - w) : Math.ceil(hi + 6 + gap);
}
// the row in [ya, yb] where something h tall has the most room beside the road
export function roomiest(ya: number, yb: number, h: number) {
  let best = ya, bw = -1;
  for (let y = ya; y <= yb; y++) { const r = room(y, h), m = Math.max(r.left, r.right); if (m > bw) { bw = m; best = y; } }
  return best;
}
