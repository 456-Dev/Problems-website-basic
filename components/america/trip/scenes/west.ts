// West: California (Venice, LA, Orange County), Las Vegas, Utah (Bicknell, Moab), Colorado (Vail, the Rockies, Denver).
// July 4th to July 8th: flags everywhere.
import { W, HOLDS, HI, STAND, roadX, room, free, roomiest, hash } from "../core";
import { palm, peak, stars } from "../kit";
import { PRIDE } from "../fx";
import type { SceneMod, Px } from "../kit";
import { pine, bldg, person, word, wordW, pick, ePine, ePalm, eCactus, eRock, eTree, usFlag } from "../kit";
import type { Live, F } from "../fx";
import { FLAME } from "../fx";

/* ---------- local sprites ---------- */

const T = (px: Px, x: number, y: number, s: string, c: string) => word(px, x, y, s, c, null);
// a tall palm with a little lean
function palm2(px: Px, x: number, y: number, h = 12, lean = 1) {
  for (let k = 0; k < h; k++) px(x + Math.round(Math.sin((k / h) * 1.6) * lean), y + k, 1, 1, k % 3 ? "#8a5a2a" : "#6a4220");
  const G = ["#2f8a3a", "#3faa4a", "#1f6a2a"];
  for (const [dx, dy, n] of [[-1, 0, 4], [1, 0, 4], [-1, 1, 3], [1, 1, 3], [0, -1, 2], [-1, -1, 2], [1, -1, 2]] as const)
    for (let k = 1; k <= n; k++) px(x + dx * k, y + dy * Math.ceil(k / 2) + (k > 2 && dy === 0 ? 1 : 0), 1, 1, G[k % 3]);
  px(x, y, 1, 1, "#5a3a1a");
}
// a US flag on a pole that waves (live)
// the radiation trefoil: yellow disc, three black blades, a black hub
function trefoil(px: Px, cx: number, cy: number, r: number) {
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) {
    const d = Math.hypot(xx, yy); if (d > r + 0.3) continue;
    const a = (Math.atan2(yy, xx) * 180) / Math.PI + 90, blade = ((a % 120) + 120) % 120 < 60;
    px(cx + xx, cy + yy, 1, 1, d > r - 0.7 ? "#111" : d < r * 0.24 ? "#111" : d < r * 0.4 ? "#ffd23f" : blade ? "#111" : "#ffd23f");
  }
}
function flag(px: Px, live: Live[], x: number, y: number, pole = 10, w = 7, h = 5) {
  px(x, y - 1, 1, pole + 1, "#d8d8d8"); px(x, y - 2, 1, 1, "#ffd23f");
  live.push({ k: "flag", x: x + 1, y, w, h, kind: "us" });
}
// a standing skyscraper seen from the street (side view), base on row `base`
function tower(px: Px, x: number, base: number, w: number, h: number, c: string, lit: string, rnd: () => number, dark = shadeOf(c)) {
  px(x, base - h, w, h, c); px(x + w - Math.max(1, Math.floor(w / 3)), base - h, Math.max(1, Math.floor(w / 3)), h, dark);
  for (let yy = base - h + 2; yy < base - 1; yy += 2) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rnd() > 0.45) px(xx, yy, 1, 1, lit);
}
const shadeOf = (c: string, d = 26) => "#" + [1, 3, 5].map((i) => Math.max(0, parseInt(c.slice(i, i + 2), 16) - d).toString(16).padStart(2, "0")).join("");
const disc = (px: Px, cx: number, cy: number, r: number, c: string, sy = 1) => {
  for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k)); px(cx - ww, cy + Math.round(k * sy), 2 * ww + 1, Math.max(1, Math.ceil(sy)), c); }
};
const ring = (px: Px, cx: number, cy: number, r: number, c: string, n = 40) => {
  for (let a = 0; a < n; a++) { const th = (a / n) * Math.PI * 2; px(cx + Math.round(r * Math.cos(th)), cy + Math.round(r * Math.sin(th)), 1, 1, c); }
};
// clear a plot to plain ground before drawing a landmark on it
const plot = (px: Px, x: number, y: number, w: number, h: number, c: string) => px(x, y, w, h, c);
// a little top-down car, w 2 x h 3
const car = (px: Px, x: number, y: number, c: string) => { px(x, y, 2, 3, c); px(x, y + 1, 2, 1, "#1a2a3a"); };
const SKIN = ["#f0c8a0", "#c08a5a", "#8a5a3a", "#e0b090"];

// ocean along the left edge, waves rolling in (live)
function ocean(px: Px, live: Live[], y0: number, h: number, w = 13) {
  for (let y = y0; y < y0 + h; y++) {
    const e = w + Math.round(Math.sin(y / 9) * 1.5);
    px(0, y, e, 1, "#2f7fc8"); px(0, y, Math.max(0, e - 6), 1, "#2a6fb8"); px(e, y, 2, 1, "#c8b07a");
  }
  live.push({ k: "fn", fn: (f, t) => {
    for (let k = 0; k < 9; k++) {
      const x = ((t * 1.6 + k * 1.37) % 1) * (w - 1);
      for (let y = y0 + k * (h / 9); y < y0 + (k + 1) * (h / 9) - 2; y += 1) if (hash(Math.floor(y) * 3 + k) > 0.3) f(x + Math.sin(y / 5) * 0.8, y, 1, 1, "#e8f6ff");
    }
  } });
}
// a surfer bobbing / riding in toward the beach
function surfers(live: Live[], pts: [number, number][]) {
  live.push({ k: "fn", fn: (f, t) => pts.forEach(([x, y], k) => {
    const u = (t * 0.25 + k * 0.37) % 1, xx = x + u * 5, yy = y + Math.sin(t * 2 + k) * 0.6;
    f(xx, yy + 1, 1, 4, ["#ffd23f", "#f2f2f2", "#e0302f"][k % 3]); f(xx, yy + 2, 1, 1, "#1a1a1a"); f(xx, yy, 1, 1, SKIN[k % 4]);
    if (u > 0.5) f(xx - 1, yy + 4, 1, 1, "#ffffff");
  }) });
}
// people moving up and down a vertical path (boardwalk skaters, joggers)
function vwalk(live: Live[], x: number, a: number, b: number, n: number, speed = 6) {
  live.push({ k: "fn", fn: (f, t) => {
    for (let k = 0; k < n; k++) {
      const span = b - a, p = (t * (speed + k) + k * 37) % (2 * span), y = a + (p < span ? p : 2 * span - p), xx = x + (k % 2);
      f(xx, y, 2, 1, ["#3a2a1a", "#ffd23f", "#1a1a1a", "#c87a3a"][k % 4]); f(xx, y + 1, 2, 1, SKIN[k % 4]);
      f(xx, y + 2, 2, 2, ["#ff5ad1", "#3a6fd8", "#2faa4a", "#ffd23f", "#e0302f"][k % 5]); f(xx + (Math.floor(t * 6) % 2), y + 4, 1, 1, "#1a1a1a");
    }
  } });
}

/* ---------- Orange County: tract homes forever ---------- */

const ROOFS = ["#b8603a", "#c87a4a", "#8a8f99", "#a85a3a", "#9a6a4a", "#7a7f88"];
function suburb(px: Px, rnd: () => number, ya: number, yb: number, xa: number, xb: number, bulb: "l" | "r") {
  const P = 20;
  for (let y = ya; y + P <= yb + 2; y += P) {
    // street with a cul-de-sac bulb at one end
    const sa = xa, sb = xb;
    px(sa, y, sb - sa, 3, "#9a9aa0"); px(sa, y + 1, sb - sa, 1, "#a8a8ae");
    const bx = bulb === "r" ? sb - 3 : sa + 3; disc(px, bx, y + 1, 4, "#9a9aa0"); px(bx - 1, y, 3, 3, "#6aaa4a");
    for (const [hy, face] of [[y + 4, -1], [y - 6, 1]] as const) {
      if (hy < ya - 2) continue;
      for (let x = sa + 1; x + 7 <= sb; x += 9) {
        if (bulb === "r" && x + 7 > sb - 6 && face === -1) continue;
        const roof = ROOFS[Math.floor(rnd() * ROOFS.length)];
        px(x, hy, 7, 5, roof); px(x, hy + 2, 7, 1, shadeOf(roof, 30)); px(x + 6, hy, 1, 5, shadeOf(roof, 18));
        const dy = face === -1 ? hy - 1 : hy + 5;                                   // driveway to the street
        px(x + 1, dy, 2, 1, "#c8c8c8");
        if (rnd() < 0.45) car(px, x + 1, face === -1 ? hy - 1 : hy + 3, ["#f2f2f2", "#c8ccd2", "#3a3a3e", "#b8303a"][Math.floor(rnd() * 4)]);
        const py = face === -1 ? hy + 6 : hy - 4;                                   // backyard pool
        if (rnd() < 0.55 && py > ya - 2) { px(x + 3, py, 4, 3, "#e8e8e8"); px(x + 3, py, 4, 2, "#4ab8e8"); px(x + 4, py, 2, 1, "#8ad8f8"); }
        if (rnd() < 0.18) { px(x + 1, hy - (face === -1 ? 3 : -6), 1, 3, "#d8d8d8"); usFlag(px, x + 2, hy - (face === -1 ? 3 : -6), 3, 2); }
        if (rnd() < 0.3) { px(x + 8, hy + 1, 1, 1, "#2f7a2a"); }
      }
    }
  }
}

/* ---------- the scenes ---------- */

// The very first person on the trip: the hermit crab man at the Venice jetty (film, July 4th).
// Shirtless, beard, glasses, orange-and-white striped towel, a gold Star of David, green shorts.
// He's small; the hermit crab he's holding out is big, and it's the one doing the talking.
function crabMan(px: Px, live: Live[], x: number, y: number) {
  const SK = "#d8a07a", SKD = "#c08a64", GOLD = "#ffd23f";
  px(x - 2, y - 2, 30, 28, "#e8c98a");                                                   // clear sand round him
  // the rock jetty behind him, running out to the water
  for (let k = 0; k < 6; k++) { const rx = x - 1 + (k % 3) * 4, ry = y + 18 + Math.floor(k / 3) * 4 + (k % 2); px(rx, ry, 4, 3, "#7a7670"); px(rx + 1, ry, 2, 1, "#a8a49c"); }
  // hair, face, glasses, beard (small)
  px(x + 2, y, 5, 1, "#6a4a2a"); px(x + 1, y + 1, 1, 3, "#6a4a2a"); px(x + 7, y + 1, 1, 3, "#6a4a2a");
  px(x + 2, y + 1, 5, 4, SK);
  px(x + 2, y + 2, 2, 1, "#1a1a1a"); px(x + 5, y + 2, 2, 1, "#1a1a1a"); px(x + 4, y + 2, 1, 1, "#1a1a1a");
  px(x + 2, y + 4, 5, 2, "#7a5a3a"); px(x + 3, y + 6, 3, 1, "#7a5a3a"); px(x + 4, y + 4, 1, 1, "#c86a5a");
  // bare chest, towel stripes over both shoulders, the Star of David
  px(x + 1, y + 7, 7, 6, SK); px(x + 1, y + 12, 7, 1, SKD);
  for (let k = 0; k < 7; k++) { px(x + 1, y + 7 + k, 1, 1, k % 2 ? "#f2f2f2" : "#ff7a1a"); px(x + 7, y + 7 + k, 1, 1, k % 2 ? "#ff7a1a" : "#f2f2f2"); }
  px(x + 3, y + 7, 1, 1, GOLD); px(x + 5, y + 7, 1, 1, GOLD);
  [".#.", "###", ".#."].forEach((r, jj) => [...r].forEach((c, ii) => { if (c === "#") px(x + 3 + ii, y + 8 + jj, 1, 1, GOLD); }));
  // arm out to the right, holding the crab up
  px(x, y + 8, 1, 4, SK); px(x + 8, y + 8, 3, 1, SK); px(x + 10, y + 7, 2, 2, SK);
  // green shorts, legs
  px(x + 2, y + 13, 5, 3, "#2f9a4a"); px(x + 2, y + 16, 2, 3, SK); px(x + 5, y + 16, 2, 3, SK);
  // the hermit crab: a big spiral shell, red legs and claws, eyes on stalks
  const cx = x + 11, cy = y + 1;
  px(cx, cy, 9, 7, "#e8a070"); px(cx + 1, cy - 1, 7, 1, "#e8a070"); px(cx + 1, cy + 7, 7, 1, "#c87a4a");
  for (const [dx, dy, c] of [[2, 1, "#a85a2a"], [3, 1, "#a85a2a"], [4, 1, "#a85a2a"], [5, 2, "#a85a2a"], [5, 3, "#a85a2a"], [4, 4, "#a85a2a"], [3, 4, "#a85a2a"], [2, 3, "#a85a2a"], [3, 3, "#f8d8b0"], [6, 1, "#f8d8b0"], [1, 5, "#f8d8b0"]] as const) px(cx + dx, cy + dy, 1, 1, c);
  live.push({ k: "fn", fn: (f, t) => {
    const talk = Math.floor(t * 5) % 2, bob = Math.floor(t * 2) % 2;
    f(cx - 1, cy + 5, 3, 3, "#d8402a");                                                  // body poking out of the shell
    f(cx - 2, cy + 1 - bob, 1, 4 + bob, "#d8402a"); f(cx, cy + 1 - bob, 1, 4 + bob, "#d8402a");   // eye stalks
    f(cx - 2, cy - bob, 1, 1, "#111"); f(cx, cy - bob, 1, 1, "#111");
    f(cx - 4, cy + 5 - talk, 3, 2, "#e8604a"); f(cx - 4, cy + 4 - talk * 2, 1, 1, "#e8604a");          // the big claw, waving
    f(cx - 2, cy + 8, 1, 2, "#d8402a"); f(cx, cy + 8, 1, 2, "#d8402a"); f(cx + 2, cy + 8, 1, 1, "#d8402a");
    if (talk) { f(cx - 7, cy + 1, 1, 3, "#ffffff"); f(cx - 7, cy + 5, 1, 1, "#ffffff"); }          // !
  } });
}

// "Champion!": long blond hair, sunglasses, Hawaiian shirt, green gloves, on his bike with a big flag, screaming
function champion(px: Px, live: Live[], x: number, y: number) {
  const SK = "#d89a70";
  px(x - 1, y - 12, 31, 38, "#e8c98a");
  // the bike, side on
  ring(px, x + 3, y + 22, 3, "#1a1a1a", 20); ring(px, x + 15, y + 22, 3, "#1a1a1a", 20);
  px(x + 3, y + 19, 12, 1, "#e0302f"); px(x + 8, y + 16, 1, 6, "#e0302f"); px(x + 14, y + 14, 1, 6, "#9a9a9a"); px(x + 13, y + 14, 3, 1, "#1a1a1a");
  // him: legs on the pedals, the shirt, gloves on the bars
  px(x + 6, y + 14, 2, 6, "#3a4a6a"); px(x + 9, y + 14, 2, 4, "#3a4a6a");
  px(x + 5, y + 6, 7, 8, "#1a1a2a");
  for (const [dx, dy, c] of [[6, 7, "#ff5ad1"], [9, 8, "#ffd23f"], [7, 10, "#5af0ff"], [10, 11, "#ff8a1f"], [6, 12, "#2faa4a"], [9, 6, "#e0302f"]] as const) px(x + dx, y + dy, 1, 1, c);
  px(x + 11, y + 9, 3, 1, SK); px(x + 13, y + 10, 2, 2, "#4ac83a");                         // arm to the bars, green glove
  // head: long blond hair down the shoulders, sunglasses, the mouth wide open
  px(x + 4, y - 2, 8, 9, "#f0d070"); px(x + 3, y + 1, 1, 7, "#f0d070"); px(x + 12, y + 1, 1, 7, "#e8c060");
  px(x + 5, y, 6, 6, SK); px(x + 5, y + 1, 6, 1, "#1a1a1a"); px(x + 6, y + 2, 1, 1, "#1a1a1a"); px(x + 9, y + 2, 1, 1, "#1a1a1a");
  px(x + 5, y - 1, 6, 1, "#f8e090");
  live.push({ k: "fn", fn: (f, t) => {
    const scream = Math.floor(t * 3) % 3 !== 0;
    f(x + 7, y + 3, 2, scream ? 3 : 1, scream ? "#5a1010" : "#a85a4a");
    // the other arm up high, green glove on the pole, the flag waving off it
    const px0 = x + 16, top = y - 12;
    f(x + 12, y + 5, 2, 2, SK); f(x + 14, y + 2, 2, 3, SK); f(px0, y, 2, 2, "#4ac83a");
    f(px0, top, 1, 14, "#d8d8d8"); f(px0, top - 1, 1, 1, "#ffd23f");
    for (let xx = 0; xx < 14; xx++) {
      const wv = Math.round(Math.sin(t * 6 - xx * 0.6) * 1.2 * (xx / 14));
      for (let yy = 0; yy < 9; yy++) {
        const c = yy < 5 && xx < 6 ? ((xx + yy) % 2 ? "#2a3a8a" : "#f2f2f2") : yy % 2 ? "#f2f2f2" : "#c8202a";
        f(px0 + 1 + xx, top + yy + wv, 1, 1, c);
      }
    }
    if (scream) for (let k = 0; k < 3; k++) f(x + 2 - k * 2, y + 1 - k, 1, 2, "#ffffff");      // the yell
  } });
}

// the e-bike guy: "I like Bobby Kennedy!", then he scoots off, slowly, down the street
function ebike(px: Px, live: Live[], x: number, y0: number, y1: number) {
  live.push({ k: "fn", fn: (f, t) => {
    const y = y0 + ((t * 2.2) % (y1 - y0));
    f(x, y + 8, 3, 1, "#111"); f(x, y + 10, 3, 1, "#111"); f(x - 1, y + 9, 1, 1, "#111"); f(x + 3, y + 9, 1, 1, "#111");
    f(x + 8, y + 8, 3, 1, "#111"); f(x + 8, y + 10, 3, 1, "#111"); f(x + 7, y + 9, 1, 1, "#111"); f(x + 11, y + 9, 1, 1, "#111");
    f(x + 2, y + 8, 8, 1, "#e0302f"); f(x + 4, y + 7, 3, 2, "#2a2a2e"); f(x + 5, y + 7, 1, 1, "#5af05a");   // the battery, lit
    f(x + 9, y + 5, 1, 4, "#9a9a9a");
    f(x + 4, y, 3, 1, "#f2f2f2"); f(x + 4, y + 1, 3, 2, "#e0b090"); f(x + 4, y + 3, 3, 3, "#2fa8a0"); f(x + 4, y + 6, 1, 2, "#2a3a5a"); f(x + 6, y + 6, 1, 2, "#2a3a5a");
    f(x + 7, y + 4, 2, 1, "#e0b090");
  } });
}

// LA: the road is the 10 freeway here, four lanes jammed both ways, and a slow-speed chase
// with a news chopper over it (every LA broadcast, ever)
function laFreeway(px: Px, live: Live[], y0: number, h: number) {
  const wAt = (y: number) => Math.round(6 + 7 * Math.min(1, (y - y0) / 8, (y0 + h - y) / 8));
  for (let y = y0; y < y0 + h; y++) {
    const x = Math.round(roadX(y)), w = wAt(y);
    px(x - w, y, 2 * w, 1, "#a8a8ae"); px(x - w, y, 1, 1, "#f2f2f2"); px(x + w - 1, y, 1, 1, "#f2f2f2");
    if (w > 11 && y % 4 < 2) { px(x - 10, y, 1, 1, "#e8e8e8"); px(x + 8, y, 1, 1, "#e8e8e8"); }
  }
  const C = ["#f2f2f2", "#1a1a1a", "#e0302f", "#3a6fd8", "#ffd23f", "#c8ccd2", "#2faa4a", "#8a8f99"];
  live.push({ k: "fn", fn: (f, t) => {
    const span = h - 22;
    // the jam: everybody crawling, brake lights coming on and off
    for (let k = 0; k < 16; k++) {
      const lane = k % 3, up = lane < 2, sp = up ? 0.9 + (k % 4) * 0.15 : 1.6;
      const p = (t * sp + k * 11.3) % span, y = up ? y0 + h - 11 - p : y0 + 11 + p, x = roadX(y) + (lane === 0 ? -12 : lane === 1 ? -8 : 6);
      f(x, y, 2, 3, C[k % 8]); f(x, y + 1, 2, 1, "#1a2a3a");
      if (Math.floor(t * 1.3 + k) % 3 === 0) f(x, up ? y + 2 : y, 2, 1, "#ff2a2a");
    }
    // the chase: a white Bronco, cops strung out behind it, lights going
    const p = (t * 2.4) % (span + 30), y = y0 + 11 + p - 20;
    if (y > y0 + 4) { const x = roadX(y) + 10; f(x, y, 2, 3, "#f8f8f8"); f(x, y + 2, 2, 1, "#1a2a3a"); }
    for (let k = 1; k <= 3; k++) {
      const cy = y - k * 6; if (cy < y0 + 4 || cy > y0 + h - 6) continue;
      const cx = roadX(cy) + 10, blink = (Math.floor(t * 8) + k) % 2;
      f(cx, cy, 2, 3, "#1a1a1a"); f(cx, cy + 1, 2, 1, "#f2f2f2"); f(cx, cy + 1, 1, 1, blink ? "#ff2a2a" : "#2a5aff"); f(cx + 1, cy + 1, 1, 1, blink ? "#2a5aff" : "#ff2a2a");
    }
    // the news chopper, hanging right over it
    if (y > y0 + 4 && y < y0 + h - 4) {
      const hx = roadX(y) + 18 + Math.sin(t * 0.9) * 3, hy = y - 8 + Math.cos(t * 1.1) * 2;
      f(hx + 2, hy + 6, 4, 2, "rgba(0,0,0,.25)");
      f(hx, hy, 4, 3, "#2a4a8a"); f(hx + 4, hy + 1, 5, 1, "#2a4a8a"); f(hx + 8, hy, 1, 2, "#2a4a8a"); f(hx, hy + 1, 1, 1, "#9ad0f0");
      if (Math.floor(t * 12) % 2) f(hx - 3, hy - 1, 10, 1, "#3a3a3a"); else f(hx + 1, hy - 4, 1, 7, "#3a3a3a");
    }
  } });
}

// Caesars Palace: white columns, the gold trim, Caesar on his pedestal, fountains going
function caesars(px: Px, live: Live[], x: number, y: number) {
  px(x - 1, y - 1, 36, 24, "#8a9a5a");
  px(x, y + 6, 34, 10, "#efe8d8"); px(x, y + 5, 34, 1, "#d8b040"); px(x + 2, y + 3, 30, 2, "#e8e0cc"); px(x + 6, y + 1, 22, 2, "#f2ecdc");
  for (let k = 0; k < 9; k++) { px(x + 1 + k * 4, y + 7, 2, 9, "#f8f4ea"); px(x + 1 + k * 4, y + 7, 2, 1, "#d8b040"); px(x + 3 + k * 4, y + 8, 1, 7, "#c8c0b0"); }
  px(x + 5, y - 6, 25, 7, "#1a1a2a"); px(x + 5, y - 6, 25, 1, "#d8b040"); px(x + 5, y, 25, 1, "#d8b040");
  word(px, x + 4 + 2, y - 5, "CAESARS", "#ffd23f", null);
  // the pool and fountains out front, Caesar on a column in the middle
  px(x + 2, y + 17, 30, 5, "#3a8fd6"); px(x + 3, y + 18, 28, 1, "#7fc0f0");
  px(x + 16, y + 13, 2, 6, "#e8e8e8"); px(x + 16, y + 10, 2, 3, "#f8f8f8"); px(x + 15, y + 12, 1, 2, "#f8f8f8");
  live.push({ k: "fn", fn: (f, t) => { for (const fx of [x + 6, x + 26]) for (let k = 0; k < 6; k++) { const u = (t * 1.4 + k / 6) % 1, h = Math.sin(u * Math.PI) * 6; f(fx + (k - 3) * u * 1.2, y + 19 - h, 1, 1, "#e8f8ff"); } } });
}

export const SC_WEST: Partial<Record<string, SceneMod>> = {
  venice: {
    ground: ["#e8c98a", "#dcb874"],
    edge: pick(ePalm),
    under: ({ px, y0, h, rnd }) => {
      for (let y = y0; y < y0 + h; y++) px(30, y, 4, 1, (y % 4) ? "#d8d0c4" : "#c8c0b4");          // the boardwalk
      for (let k = 0; k < 40; k++) px(16 + Math.floor(rnd() * 12), y0 + Math.floor(rnd() * h), 1, 1, "#f4dca0");
    },
    draw: ({ px, y0, h, rnd, live, says }) => {
      ocean(px, live, y0, h);
      // Santa Monica Pier: the deck out over the water, Pacific Park's wheel and coaster on it
      px(0, y0 + 17, 32, 6, "#8a6a4a"); for (let x = 1; x < 32; x += 2) px(x, y0 + 18, 1, 4, "#9a7a58");
      for (let x = 2; x < 30; x += 5) { px(x, y0 + 23, 1, 2, "#5a4a3a"); }
      { const cx = 10, cy = y0 + 9;
        ring(px, cx, cy, 8, "#f2f2f2", 60); ring(px, cx, cy, 7, "#ffd23f", 50);
        for (let a = 0; a < 8; a++) { const th = (a / 8) * Math.PI * 2; for (let r = 1; r < 8; r++) px(cx + Math.round(r * Math.cos(th)), cy + Math.round(r * Math.sin(th)), 1, 1, "#d8d8d8"); }
        px(cx - 3, cy + 8, 1, 2, "#d8d8d8"); px(cx + 3, cy + 8, 1, 2, "#d8d8d8");
        live.push({ k: "fn", fn: (f, t) => { for (let a = 0; a < 10; a++) { const th = (a / 10) * Math.PI * 2 + t * 0.4; f(cx + Math.round(8 * Math.cos(th)) - 1, cy + Math.round(8 * Math.sin(th)), 2, 2, ["#e0302f", "#ffd23f", "#3a6fd8", "#2faa4a", "#ff5ad1"][a % 5]); } } }); }
      for (let x = 20; x < 31; x++) { const yy = y0 + 9 + Math.round(4 * Math.sin((x - 20) / 1.7)); px(x, yy, 1, 1, "#e0302f"); px(x, yy + 1, 1, Math.max(1, y0 + 17 - yy - 1), "#c8c8c8"); }
      px(32, y0 + 13, 1, 10, "#3a6fd8"); px(46, y0 + 13, 1, 10, "#3a6fd8"); px(32, y0 + 11, 15, 7, "#3a6fd8"); T(px, 33, y0 + 12, "PIER", "#ffd23f");
      flag(px, live, 22, y0 + 1, 8);
      surfers(live, [[2, y0 + 34], [6, y0 + 52], [3, y0 + 70], [7, y0 + 96], [2, y0 + 120], [5, y0 + 140]]);
      // lifeguard towers, flags on top
      for (const [ty, c] of [[y0 + 34, "#3a8fd6"], [y0 + 84, "#ff8ab8"], [y0 + 128, "#ffd23f"]] as const) {
        px(16, ty, 9, 6, c); px(16, ty, 9, 1, "#f2f2f2"); px(17, ty + 2, 3, 2, "#cfe8ff"); px(22, ty + 2, 2, 2, "#cfe8ff");
        px(17, ty + 6, 1, 4, "#f2f2f2"); px(23, ty + 6, 1, 4, "#f2f2f2"); px(24, ty + 6, 4, 1, "#d8d8d8"); px(27, ty + 7, 2, 1, "#d8d8d8");
        flag(px, live, 20, ty - 7, 7, 6, 4);
      }
      px(16, y0 + 54, 11, 1, "#f2f2f2"); px(16, y0 + 53, 1, 3, "#5a5a5a"); px(26, y0 + 53, 1, 3, "#5a5a5a");               // volleyball
      person(px, 18, y0 + 46, "#e0302f", "#ffd23f", "#3a6fd8"); person(px, 22, y0 + 56, "#2fa8a0", "#3a2a1a", "#1a1a1a");
      // umbrellas, towels, sunbathers all over the sand
      for (let k = 0; k < 16; k++) {
        const y = y0 + 28 + Math.floor(hash(k * 13) * (h - 40)), lim = Math.floor(room(y, 8).lo - 9), x = 36 + Math.floor(hash(k * 7 + 1) * Math.max(1, lim - 40));
        if (x + 8 > lim || (y < y0 + 58 && x < 66) || (y > y0 + 56 && y < y0 + 96 && x < 68) || (y > y0 + 94 && x < 52)) continue;
        const c = ["#e0302f", "#3a6fd8", "#ffd23f", "#ff5ad1", "#2faa4a", "#ff8a1f"][k % 6];
        px(x + 4, y + 1, 3, 5, ["#f2f2f2", "#5af0ff", "#ff8ab8"][k % 3]); px(x + 5, y + 2, 1, 2, SKIN[k % 4]);
        disc(px, x + 2, y + 2, 3, c); px(x + 1, y + 1, 2, 2, "#f2f2f2"); px(x + 2, y + 2, 1, 1, "#5a5a5a");
      }
      // palms down the boardwalk
      for (let y = y0 + 26; y < y0 + h - 12; y += 15) palm2(px, 28, y, 12, -1);
      vwalk(live, 31, y0 + 2, y0 + h - 6, 6);
      // Muscle Beach: the outdoor pen, a sign, a guy pressing a bar overhead
      { const x = 36, y = y0 + 58;
        px(x, y, 30, 10, "#1a1a1a"); word(px, x + 4, y + 2, "MUSCLE", "#ffd23f", null);
        px(x, y + 10, 1, 2, "#5a5a5a"); px(x + 29, y + 10, 1, 2, "#5a5a5a");
        px(x, y + 12, 30, 20, "#e8d0a0"); for (let k = 0; k < 30; k += 2) { px(x + k, y + 12, 1, 1, "#7a7a7a"); px(x + k, y + 31, 1, 1, "#7a7a7a"); }
        for (let k = 12; k < 32; k += 2) { px(x, y + k, 1, 1, "#7a7a7a"); px(x + 29, y + k, 1, 1, "#7a7a7a"); }
        px(x + 3, y + 22, 8, 2, "#5a5a5a"); px(x + 5, y + 19, 1, 3, "#3a3a3a");                                  // a bench
        px(x + 18, y + 26, 8, 1, "#5a5a5a"); px(x + 17, y + 25, 2, 3, "#1a1a1a"); px(x + 25, y + 25, 2, 3, "#1a1a1a");  // weights on the sand
        live.push({ k: "fn", fn: (f, t) => {
          const up = Math.floor(t * 1.5) % 2, bx = x + 14, by = y + 15;
          f(bx, by + 2, 3, 2, "#c87a4a"); f(bx - 1, by + 4, 5, 3, "#c87a4a"); f(bx, by + 4, 3, 2, "#e0302f"); f(bx, by + 7, 1, 3, "#1a1a2a"); f(bx + 2, by + 7, 1, 3, "#1a1a2a");
          f(bx - 4, by - up * 2, 11, 1, "#5a5a5a"); f(bx - 5, by - 1 - up * 2, 2, 3, "#1a1a1a"); f(bx + 6, by - 1 - up * 2, 2, 3, "#1a1a1a");
          f(bx - 1, by + 1 - up * 2, 1, 3 + up * 2, "#c87a4a"); f(bx + 3, by + 1 - up * 2, 1, 3 + up * 2, "#c87a4a");
        } });
        T(px, x + 6, y + 34, "BEACH", "#1a1a1a"); }
      // the skate park: bowls, kids carving around them
      { const x = 30, y = y0 + 98;
        px(x, y, 20, 26, "#b8b8bc"); for (const [cx, cy, r] of [[x + 6, y + 7, 5], [x + 13, y + 18, 6]] as const) { disc(px, cx, cy, r, "#8a8a90"); disc(px, cx, cy, r - 2, "#6a6a72"); }
        px(x, y, 20, 1, "#8a8a90"); px(x + 2, y + 22, 1, 1, "#ff5ad1"); px(x + 16, y + 3, 2, 2, "#3a6fd8");
        live.push({ k: "fn", fn: (f, t) => [[x + 6, y + 7, 4, 1.4], [x + 13, y + 18, 5, -1.1], [x + 13, y + 18, 3, 1.8]].forEach(([cx, cy, r, s], k) => {
          const th = t * s + k * 2; f(cx + r * Math.cos(th), cy + r * Math.sin(th), 2, 2, ["#e0302f", "#ffd23f", "#2faa4a"][k]); f(cx + r * Math.cos(th), cy + r * Math.sin(th) + 2, 2, 1, "#1a1a1a");
        }) }); }
      // the basketball courts
      { const x = 30, y = y0 + 128;
        px(x, y, 14, 20, "#3a7a5a"); px(x + 1, y + 1, 12, 18, "#c8703a"); px(x + 1, y + 10, 12, 1, "#f2f2f2"); ring(px, x + 7, y + 10, 2, "#f2f2f2", 16);
        px(x + 6, y + 1, 3, 1, "#f2f2f2"); px(x + 6, y + 18, 3, 1, "#f2f2f2");
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 4; k++) { const yy = y + 3 + ((t * (3 + k) + k * 5) % 14), xx = x + 2 + ((k * 3 + Math.floor(t)) % 9); f(xx, yy, 2, 2, ["#1a1a1a", "#f2f2f2", "#e0302f", "#3a6fd8"][k]); } f(x + 7 + 3 * Math.sin(t * 3), y + 10 + 5 * Math.cos(t * 2), 1, 1, "#ff8a1f"); } }); }
      // Venice canals: houses, little white bridges, ducks
      { const xa = 92, ya = y0 + 6, yb = y0 + 60;
        for (const cy of [ya + 14, ya + 44]) { px(xa, cy, W - xa, 4, "#3a8fc0"); px(xa, cy + 1, W - xa, 1, "#6ab0e0"); }
        px(108, ya + 14, 4, yb - ya - 14, "#3a8fc0"); px(109, ya + 14, 1, yb - ya - 14, "#6ab0e0");
        for (const [bx, by] of [[98, ya + 13], [118, ya + 43]]) { px(bx, by, 5, 6, "#f2f2f2"); px(bx + 1, by + 1, 3, 4, "#d8d8d8"); }
        for (let y = ya; y < yb; y += 10) for (const x of [94, 101, 114, 121]) {
          if ([ya + 14, ya + 44].some((c) => y + 7 > c && y < c + 5)) continue;
          const c = ["#f2e8d8", "#ff8ab8", "#8ad8c8", "#ffd88a", "#c8a8e8"][Math.floor(rnd() * 5)];
          px(x, y, 6, 6, c); px(x, y, 6, 1, shadeOf(c, 40)); px(x + 1, y + 2, 2, 2, "#5a8ac8");
          if (rnd() < 0.3) usFlag(px, x + 1, y - 3, 4, 3);
        }
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 3; k++) f(96 + ((t * 2 + k * 9) % 28), ya + 44 + 1 + (k % 2) * 2, 1, 1, "#f2f2f2"); } }); }
      // the VENICE sign strung over Windward Ave
      { const y = y0 + 98, x = Math.max(free(y, 18, 34, "r"), 84);
        px(x, y + 6, W - x, 10, "#8a8a90"); px(x, y + 10, W - x, 1, "#f2f2f2");
        px(x + 2, y, 1, 18, "#3a3a3a"); px(x + 31, y, 1, 18, "#3a3a3a"); px(x + 2, y + 1, 30, 1, "#5a5a5a");
        px(x + 4, y + 2, 26, 7, "#1a1a1a"); T(px, x + 5, y + 3, "VENICE", "#fff6c0");
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 6; k++) if ((t * 3 + k) % 6 < 1) f(x + 5 + k * 4 + 1, y + 3, 1, 1, "#ffffff"); } });
        for (let k = 0; k < 4; k++) { const c = ["#ff8ab8", "#5af0ff", "#ffd23f", "#8ad84a"][k]; px(x + 2 + k * 9, y + 19, 7, 6, c); px(x + 3 + k * 9, y + 21, 2, 2, "#cfe8ff"); }
        flag(px, live, x + 34, y + 2, 14, 9, 6); }
      // vendors on the boardwalk: tents, a t-shirt rack, a guy on a red bike
      for (const [yy, c] of [[y0 + 40, "#e0302f"], [y0 + 92, "#3a6fd8"], [y0 + 120, "#ffd23f"]] as const) { px(35, yy, 6, 5, c); px(35, yy, 6, 1, "#f2f2f2"); px(36, yy + 5, 4, 1, "#5a5a5a"); }
      crabMan(px, live, 38, y0 + 24);
      says.push({ a: 0, b: 44, who: "them", text: "The hermit crab: “Drive back!”" });
      // the e-bike guy, "I like Bobby Kennedy!", scooting off down the street, slowly; we don't wait
      { const y = y0 + 126, x = Math.max(free(y, 12, 16, "r"), 64);
        ebike(px, live, x, y, y0 + h - 4);
        says.push({ a: y - 24, b: y + 10, who: "them", text: "“I like Bobby Kennedy!”" }); }
      // the Champion: on his bike, flag up, screaming it
      { const y = y0 + 72, x = 96;
        champion(px, live, x, y);
        STAND[HI.venice] = x > roadX(HOLDS[HI.venice].y) ? { side: 1, x: x + 2 } : { side: -1, x: x + 20 };
        says.push({ a: y - 6, b: y + 24, who: "them", text: "“CHAMPION!”" }); }
    },
  },
  la: {
    ground: ["#8a9a5a", "#7a8a4f"],
    edge: pick(ePalm),
    under: ({ px, y0, h, live }) => laFreeway(px, live, y0, h),
    draw: ({ px, y0, rnd, live, canopy }) => {

      // the downtown skyline, standing up off the street, sitting in its smog
      { const base = y0 + 56, x0 = 65;
        px(x0 - 2, base, W - x0 + 2, 3, "#6a6a70"); px(x0 - 2, base + 1, W - x0 + 2, 1, "#ffd23f");
        tower(px, x0, base, 7, 26, "#8a9aa8", "#e8f0f8", rnd);
        tower(px, x0 + 8, base, 6, 34, "#5a7a9a", "#cfe8ff", rnd);
        // Wilshire Grand: glass, the sail on top, the spire
        tower(px, x0 + 15, base, 10, 50, "#3a6a9a", "#9ad0f0", rnd, "#2a5a88");
        for (let k = 0; k < 8; k++) px(x0 + 15 + k, base - 50 - k + Math.floor(k / 2), 10 - k, 1, "#4a7aaa");
        px(x0 + 18, base - 62, 1, 9, "#d8d8d8"); live.push({ k: "fn", fn: (f, t) => { if (Math.floor(t * 2) % 2) f(x0 + 18, base - 63, 1, 1, "#ff3b3b"); } });
        // US Bank Tower: the cylinder, stepped crown, the glass crown lit at the top
        { const x = x0 + 27, w = 10, hgt = 54;
          for (let k = 0; k < w; k++) px(x + k, base - hgt, 1, hgt, ["#9aa0a8", "#b8bec6", "#d0d4da", "#c0c4ca", "#a8aeb6", "#9aa0a8", "#8a9098", "#7a8088", "#6a7078", "#5a6068"][k]);
          for (let yy = base - hgt + 4; yy < base - 1; yy += 2) for (let k = 1; k < w - 1; k += 2) if (rnd() > 0.5) px(x + k, yy, 1, 1, "#f2f8ff");
          for (let s = 0; s < 4; s++) px(x + s, base - hgt - 1 - s * 2, w - 2 * s, 2, s === 3 ? "#e8f4ff" : "#b8bec6");
          px(x + 3, base - hgt - 9, 4, 1, "#e8f4ff"); px(x + 4, base - hgt - 10, 2, 1, "#ffd23f"); }
        tower(px, x0 + 38, base, 8, 40, "#4a5a7a", "#cfe8ff", rnd);                                         // Aon
        tower(px, x0 + 47, base, 7, 30, "#2a6aa8", "#9ad0f0", rnd); px(x0 + 47, base - 32, 7, 2, "#2a6aa8"); px(x0 + 49, base - 34, 3, 2, "#2a6aa8"); // the Gas Company
        // City Hall: white, stepped, the pyramid on top
        { const x = x0 + 55; px(x, base - 16, 10, 16, "#ecebe4"); px(x + 2, base - 26, 6, 10, "#f2f2ec"); px(x + 3, base - 30, 4, 4, "#f2f2ec");
          for (let r = 0; r < 3; r++) px(x + 4 - r, base - 33 + r, 2 + 2 * r, 1, "#d8d8d0");
          for (let yy = base - 14; yy < base - 1; yy += 3) for (let k = 1; k < 9; k += 2) px(x + k, yy, 1, 2, "#b8b8b0");
          flag(px, live, x + 5, base - 42, 9, 6, 4); }
        for (const [dx, hh] of [[66, 18], [6, 14]]) if (x0 + dx + 5 < W) tower(px, x0 + dx, base, 5, hh, "#9a8a7a", "#f2e8c8", rnd);
        for (let x = x0 + 8; x < 90; x += 9) palm2(px, x, base + 4, 9);
        // the smog: a brown haze sitting on downtown, breathing
        live.push({ k: "fn", fn: (f, t, c) => {
          c.globalAlpha = 0.2 + 0.06 * Math.sin(t * 0.7); f(x0 - 2, base - 34, W - x0 + 2, 30, "#b08a5a");
          c.globalAlpha = 0.12; f(x0 - 2, base - 48, W - x0 + 2, 14, "#c8a070"); c.globalAlpha = 1;
        } }); }
      // the Hollywood Hills: the sign up top, Griffith Observatory on the ridge, a coyote trotting the fire road
      { const y = y0 + 1;
        for (let xx = 0; xx < 38; xx++) {
          const top = y + 1 + Math.round(1.5 * Math.sin(xx / 5) + Math.sin(xx / 2.1)), bot = y0 + 40 - Math.round(xx * 0.6);
          px(xx, top, 1, Math.max(0, bot - top), xx % 6 ? "#8a7a4a" : "#7a6a3a");
        }
        for (let k = 0; k < 16; k++) { const xx = Math.floor(rnd() * 32), yy = y + 10 + Math.floor(rnd() * (26 - xx * 0.5)); px(xx, yy, 2, 1, "#5a6a32"); }
        for (let k = 0; k < 14; k++) px(3 + k * 2, y + 22 - Math.round(Math.abs(Math.sin(k / 2.2)) * 5), 1, 1, "#b8a070");   // the fire road
        for (let k = 0; k < 9; k++) px(1 + k * 4, y + 9, 1, 2, "#5a4a2a");                                                     // the scaffold legs
        T(px, 1, y + 3, "HOLLYWOOD", "#f8f8f8");
        // Griffith, small on the ridge: white walls, three copper domes
        { const gx = 4, gy = y0 + 26;
          px(gx, gy + 3, 20, 4, "#ecebe4"); px(gx, gy + 6, 20, 1, "#c8c8c0"); for (let k = 2; k < 19; k += 3) px(gx + k, gy + 4, 1, 2, "#b8b8b0");
          disc(px, gx + 10, gy + 2, 3, "#5aa890"); disc(px, gx + 2, gy + 3, 1, "#5aa890"); disc(px, gx + 17, gy + 3, 1, "#5aa890"); px(gx + 9, gy - 1, 2, 1, "#8ad8c0"); }
        live.push({ k: "fn", fn: (f, t) => {
          const u = (t * 0.08) % 1, k = Math.min(12.99, u * 13), i = Math.floor(k), xx = 3 + k * 2, yy = y + 21 - Math.abs(Math.sin(k / 2.2)) * 5;
          const step = Math.floor(t * 6) % 2;
          f(xx, yy - 1, 3, 1, "#a87a4a"); f(xx + 2, yy - 2, 2, 1, "#a87a4a"); f(xx + 3, yy - 3, 1, 1, "#a87a4a"); f(xx - 1, yy - 2, 1, 1, "#8a5a3a");
          f(xx + step, yy, 1, 1, "#6a4a2a"); f(xx + 2 - step, yy, 1, 1, "#6a4a2a"); void i;
        } }); }
      // Sunset Blvd: palms down both sides
      { const y = y0 + 52, e = Math.floor(roadX(y + 2)) - 13;
        px(0, y, e, 4, "#5a5a60"); px(0, y - 1, e, 1, "#c8c8c8"); px(0, y + 4, e, 1, "#c8c8c8"); for (let x = 1; x < e - 1; x += 4) px(x, y + 2, 2, 1, "#e8e8e8");
        for (let x = 2; x < e - 3; x += 6) { palm2(px, x, y - 12, 11, -1); palm2(px, x + 3, y + 6, 11, 1); }
        word(px, 2, y + 8, "SUNSET", "#ffffff", "#1f7a3f"); }
      // the 10 East gantry over the freeway: this is where the trip starts
      { const y = y0 + 63, cx = Math.round(roadX(y + 4)), x = cx - 20;
        canopy.push((px) => {
        px(x + 1, y + 8, 1, 7, "#7a7a80"); px(x + 39, y + 8, 1, 7, "#7a7a80"); px(x, y + 7, 41, 1, "#8a8a90");
        px(x + 2, y - 7, 37, 15, "#f2f2f2"); px(x + 3, y - 6, 35, 13, "#1f7a3f");
        // the interstate shield
        px(x + 5, y - 5, 7, 6, "#1f4aa8"); px(x + 5, y - 5, 7, 1, "#e0302f"); px(x + 6, y + 1, 5, 1, "#1f4aa8"); px(x + 7, y + 2, 3, 1, "#1f4aa8");
        T(px, x + 6, y - 3, "10", "#ffffff"); T(px, x + 15, y - 4, "EAST", "#ffffff");
        T(px, x + 5, y + 2, "NEW YORK", "#ffffff"); }); }
      // TCL Chinese Theatre with a premiere on: the pagoda roof, red carpet, the crowd, flashbulbs, searchlights
      { const y = y0 + 70, x = 15;
        live.push({ k: "fn", fn: (f, t, c) => {
          for (const [bx, sp, ph] of [[x + 3, 0.9, 0], [x + 30, 0.7, 2]] as const) {
            const a = -Math.PI / 2 + Math.sin(t * sp + ph) * 0.75;
            c.globalAlpha = 0.28;
            for (let r = 2; r < 40; r++) { const wd = 1 + Math.floor(r / 12); f(bx + Math.cos(a) * r, y + 26 + Math.sin(a) * r, wd, 1, "#fff8d0"); }
            c.globalAlpha = 1;
          }
        } });
        px(x, y + 12, 33, 12, "#b8302a"); px(x, y + 12, 33, 1, "#8a1a1a");
        px(x + 3, y + 8, 27, 4, "#1f6a4a"); px(x + 1, y + 10, 2, 1, "#1f6a4a"); px(x, y + 9, 1, 1, "#1f6a4a"); px(x + 30, y + 10, 2, 1, "#1f6a4a"); px(x + 32, y + 9, 1, 1, "#1f6a4a");
        px(x + 8, y + 4, 17, 4, "#2a7a5a"); px(x + 6, y + 6, 2, 1, "#2a7a5a"); px(x + 25, y + 6, 2, 1, "#2a7a5a");
        px(x + 12, y + 1, 9, 3, "#2a7a5a"); px(x + 16, y - 2, 1, 3, "#ffd23f");
        px(x + 4, y + 12, 2, 12, "#e04a3a"); px(x + 27, y + 12, 2, 12, "#e04a3a"); px(x + 3, y + 12, 4, 1, "#ffd23f"); px(x + 26, y + 12, 4, 1, "#ffd23f");
        px(x + 9, y + 17, 15, 7, "#2a1a1a"); px(x + 14, y + 14, 5, 2, "#ffd23f");
        px(x, y + 24, 33, 8, "#111"); T(px, x + 1, y + 26, "PREMIERE", "#ffd23f");
        px(x + 13, y + 32, 7, 10, "#d0202a"); px(x + 14, y + 32, 5, 10, "#e0303a");
        for (let k = 0; k < 4; k++) { px(x + 11, y + 33 + k * 3, 1, 2, "#c8a040"); px(x + 21, y + 33 + k * 3, 1, 2, "#c8a040"); }
        live.push({ k: "fn", fn: (f, t) => {
          for (let k = 0; k < 13; k++) if ((Math.floor(t * 8) + k) % 4 === 0) { f(x + 1 + k * 2.5, y + 24, 1, 1, "#fff6c0"); f(x + 1 + k * 2.5, y + 31, 1, 1, "#fff6c0"); }
          // the stars walking the carpet, the photographers on both sides, flashes going
          const u = (t * 0.12) % 1, sy = y + 41 - u * 9;
          f(x + 15, sy, 3, 1, "#1a1a1a"); f(x + 15, sy + 1, 3, 2, "#f0c8a0"); f(x + 15, sy + 3, 3, 3, "#1a1a2a"); f(x + 16, sy + 3, 1, 2, "#f2f2f2");
          for (let k = 0; k < 4; k++) for (const s of [0, 1]) {
            const bx = s ? x + 23 : x + 7, by = y + 33 + k * 3;
            f(bx, by, 2, 1, ["#3a2a1a", "#c8a060", "#1a1a1a", "#8a5a3a"][k]); f(bx, by + 1, 2, 2, ["#3a6fd8", "#e0302f", "#5a5a5a", "#2faa4a"][(k + s) % 4]);
            if (hash(Math.floor(t * 5) * 13 + k * 3 + s) > 0.82) { f(bx + (s ? -1 : 2), by, 1, 1, "#ffffff"); f(bx + (s ? -2 : 3), by - 1, 1, 1, "#ffffcc"); }
          }
        } }); }
      // Randy's Donuts: the giant donut on the roof
      { const y = y0 + 100, x = 1;
        px(x, y + 14, 18, 8, "#f2ead8"); px(x, y + 14, 18, 1, "#c8a060"); px(x + 2, y + 16, 5, 4, "#cfe8ff"); px(x + 10, y + 16, 5, 4, "#cfe8ff");
        disc(px, x + 9, y + 7, 7, "#c8823a"); disc(px, x + 9, y + 7, 6, "#d8a058"); disc(px, x + 9, y + 7, 3, "#8a9a5a");
        for (const [dx, dy, c] of [[3, 3, "#ff5ad1"], [12, 2, "#5af0ff"], [8, 13, "#ffd23f"], [14, 9, "#ff5ad1"], [4, 10, "#5af0ff"]] as const) px(x + dx, y + dy, 2, 1, c);   // sprinkles
        T(px, x + 1, y + 23, "RANDYS", "#f2f2f2"); }
      for (let k = 0; k < 4; k++) palm2(px, 30 + k * 7, y0 + 113 + (k % 2) * 4, 11, k % 2 ? 1 : -1);
      // Capitol Records, the stack of records with the needle, blinking HOLLYWOOD in morse
      { const y = y0 + 64, x = 92;
        for (let s = 0; s < 9; s++) { const ww = 12 - Math.floor(s / 2); px(x + Math.floor((12 - ww) / 2), y + 26 - s * 3, ww, 2, "#ecebe4"); px(x + Math.floor((12 - ww) / 2), y + 28 - s * 3, ww, 1, "#6a7078"); }
        px(x + 5, y - 4, 1, 4, "#d8d8d8"); px(x + 3, y + 29, 6, 2, "#c8c8c0");
        live.push({ k: "fn", fn: (f, t) => { if (".-....--".charAt(Math.floor(t * 3) % 8) === "-" || Math.floor(t * 6) % 2) f(x + 5, y - 5, 1, 1, "#ff3b3b"); } });
        // Hollywood Blvd: the Walk of Fame
        px(x + 14, y + 2, W - x - 14, 28, "#3a3a40"); for (let yy = y + 4; yy < y + 28; yy += 6) for (let xx = x + 16; xx < W - 3; xx += 6) { px(xx, yy + 1, 3, 1, "#ff8ab8"); px(xx + 1, yy, 1, 3, "#ff8ab8"); px(xx + 1, yy + 1, 1, 1, "#ffd23f"); }
        vwalk(live, x + 16, y + 3, y + 26, 3, 3); flag(px, live, x + 15, y - 8, 9, 7, 5); }
      // In-N-Out: crossed palms, the yellow arrow, the drive-thru line
      { const y = y0 + 98, x = 95;
        px(x, y + 6, 22, 12, "#f8f8f4"); px(x, y + 9, 22, 2, "#e0302f"); px(x, y + 6, 22, 1, "#d8d8d0"); px(x + 3, y + 12, 6, 5, "#cfe8ff");
        px(x + 24, y, 1, 18, "#9a9a9a"); px(x + 21, y - 3, 8, 5, "#ffd23f"); px(x + 27, y - 4, 2, 7, "#ffd23f"); px(x + 22, y - 2, 4, 3, "#e0302f");
        palm2(px, x + 13, y - 2, 9, -2); palm2(px, x + 15, y - 2, 9, 2);
        for (let k = 0; k < 4; k++) car(px, x + 2 + k * 5, y + 19, ["#f2f2f2", "#1a1a1a", "#e0302f", "#3a6fd8"][k]);
        px(x - 1, y + 25, 33, 7, "#f8f8f4"); T(px, x + 1, y + 26, "IN N OUT", "#e0302f"); }
    },
  },
  oc: {
    ground: ["#7fae4a", "#709c40"],
    edge: pick(eTree),
    under: ({ px, y0, h, rnd }) => {
      // tract homes on every side of the road; the beach takes the top-left corner
      for (let y = y0 + 4; y < y0 + h - 18; y += 20) {
        const r = room(y - 7, 27), rl = Math.floor(r.lo - 8), rr = Math.ceil(r.hi + 8);
        const xa = y < y0 + 60 ? 30 : 2;
        if (rl - xa > 18) suburb(px, rnd, y, y + 20, xa, rl, "r");
        if (W - 2 - rr > 18) suburb(px, rnd, y, y + 20, rr, W - 2, "l");
      }
    },
    draw: ({ px, y0, h, rnd, live }) => {
      // Huntington Beach: sand, the pier with Ruby's at the end, surfers, "SURF CITY"
      px(0, y0, 29, 62, "#e8c98a"); for (let k = 0; k < 30; k++) px(Math.floor(rnd() * 28), y0 + Math.floor(rnd() * 60), 1, 1, "#d9b56f");
      ocean(px, live, y0, 62, 12);
      px(0, y0 + 26, 22, 4, "#8a6a4a"); for (let x = 1; x < 22; x += 2) px(x, y0 + 27, 1, 2, "#9a7a58");
      px(0, y0 + 24, 5, 8, "#f2f2f2"); px(0, y0 + 24, 5, 2, "#e0302f"); px(1, y0 + 27, 3, 2, "#cfe8ff");
      surfers(live, [[3, y0 + 8], [6, y0 + 16], [2, y0 + 40], [7, y0 + 48], [4, y0 + 55]]);
      px(14, y0 + 6, 1, 8, "#d8d8d8"); px(14, y0 + 6, 9, 5, "#1a6aa8");
      word(px, 15, y0 + 46, "SURF", "#f2f2f2", "#1a6aa8"); word(px, 15, y0 + 54, "CITY", "#f2f2f2", "#1a6aa8");
      for (let y = y0 + 4; y < y0 + 60; y += 13) palm2(px, 25, y, 10);
      flag(px, live, 18, y0 + 32, 9, 7, 5);
      // Disneyland peeking over the trees: the castle, the Matterhorn, fireworks for the 4th
      { const y = y0 + 52, x = Math.max(free(y, 36, 46, "r"), 74);
        plot(px, x - 1, y - 1, 46, 34, "#6aa040"); for (let k = 0; k < 20; k++) px(x + Math.floor(rnd() * 44), y + Math.floor(rnd() * 32), 3, 2, "#2f7a2a");
        // Matterhorn
        for (let r = 0; r < 22; r++) { const ww = Math.round(r * 0.75); px(x + 30 - ww, y + 4 + r, 2 * ww + 1, 1, r < 6 ? "#f8f8f8" : r % 4 === 0 ? "#8a8f99" : "#9aa0aa"); if (r > 5) px(x + 30, y + 4 + r, ww + 1, 1, "#7a808a"); }
        // Sleeping Beauty Castle: pink walls, blue spires, gold tips
        const cx = x + 6;
        px(cx, y + 18, 18, 10, "#f2c8d8"); px(cx, y + 18, 18, 1, "#d8a8b8"); px(cx + 7, y + 22, 4, 6, "#5a3a5a");
        for (const [dx, hh] of [[1, 8], [5, 12], [9, 16], [13, 12], [16, 8]] as const) {
          px(cx + dx, y + 18 - hh + 3, 2, hh - 3, "#f2c8d8");
          for (let r = 0; r < 5; r++) px(cx + dx + 1 - Math.floor(r / 2), y + 18 - hh - 3 + r, 1 + 2 * Math.floor(r / 2), 1, "#3a6fd8");
          px(cx + dx + 1, y + 18 - hh - 4, 1, 1, "#ffd23f");
        }
        px(cx - 2, y + 28, 22, 2, "#3a8fc0");
        live.push({ k: "boom", x: cx + 4, y: y + 2, c: "#ff5ad1", ph: 0.3 }, { k: "boom", x: cx + 14, y: y - 2, c: "#5af0ff", ph: 1.2 }, { k: "boom", x: x + 36, y: y + 2, c: "#ffd23f", ph: 2 }); }
      // the Big A at Angel Stadium, its halo
      { const y = y0 + 102, x = Math.max(1, free(y, 30, 16, "l"));
        plot(px, x - 1, y - 1, 18, 30, "#7fae4a");
        for (let r = 0; r < 18; r++) { const ww = Math.round(r * 0.35); px(x + 7 - ww, y + 6 + r, 2, 1, "#e0302f"); px(x + 8 + ww, y + 6 + r, 2, 1, "#c0202a"); }
        px(x + 4, y + 17, 9, 2, "#e0302f"); ring(px, x + 8, y + 3, 4, "#ffd23f", 24); disc(px, x + 8, y + 3, 2, "#7fae4a");
        px(x + 2, y + 25, 14, 2, "#9a9a9a"); }
      // THE MARKETPLACE: the purple sign, all of it, over the parking lot
      { const y = y0 + 112, sw = wordW("MARKET") + 8, x = Math.min(W - 2 - 30, Math.max(free(y - 22, 46, 30, "r"), 56));
        plot(px, x - 2, y - 24, 34, 48, "#7fae4a");
        const sx = x + Math.floor((30 - sw) / 2);
        px(sx + Math.floor(sw / 2) - 1, y, 2, 6, "#5a5a5a");
        px(sx, y - 23, sw, 23, "#4a2a7a"); px(sx + 1, y - 22, sw - 2, 21, "#6a3aa8"); px(sx + 1, y - 22, sw - 2, 1, "#8a5ac8");
        T(px, sx + Math.floor((sw - wordW("THE")) / 2), y - 20, "THE", "#ffffff"); T(px, sx + 4, y - 14, "MARKET", "#ffffff"); T(px, sx + Math.floor((sw - wordW("PLACE")) / 2), y - 8, "PLACE", "#ffd23f");
        px(x, y + 6, 30, 2, "#4a2a6a"); px(x, y + 8, 30, 8, "#8a4ac8");
        for (let k = 0; k < 7; k++) { px(x + 1 + k * 4, y + 11, 3, 4, "#cfe8ff"); px(x + 1 + k * 4, y + 9, 3, 1, ["#ff5ad1", "#ffd23f", "#5af0ff"][k % 3]); }
        px(x, y + 16, 30, 8, "#4a4a4e"); for (let k = 0; k < 8; k++) px(x + 1 + k * 4, y + 17, 1, 6, "#e8e8e8");
        car(px, x + 3, y + 18, "#e0302f"); car(px, x + 11, y + 19, "#f2f2f2"); car(px, x + 23, y + 18, "#3a6fd8");
        flag(px, live, x + 29, y - 22, 14, 9, 6); }
      // more flags out front for the 4th
      for (let k = 0; k < 5; k++) { const yy = y0 + 70 + k * 18, r = room(yy, 8), xx = k % 2 ? Math.ceil(r.hi + 8) : Math.floor(r.lo - 9); flag(px, live, xx, yy, 9, 6, 4); }
    },
  },
  vegas: {
    ground: ["#221832", "#2e2244"],
    edge: pick(eCactus, eRock),
    under: ({ px, y0, h, rnd }) => {
      // the night ends after the preacher: dawn, then a hot desert morning for Walmart
      const D = ["#3a2440", "#5a3048", "#8a4a4a", "#b8664a", "#d07c48", "#d98c4a"], a = y0 + 156;
      for (let y = a; y < y0 + h; y++) px(0, y, W, 1, D[Math.min(5, Math.floor((y - a) / 2.5))]);
      for (let k = 0; k < 160; k++) px(Math.floor(rnd() * W), a + 14 + Math.floor(rnd() * (y0 + h - a - 14)), 1, 1, "#c4763a");
    },
    draw: ({ px, y0, h, rnd, live, glow }) => {
      for (let k = 0; k < 70; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * 150); if (Math.abs(x - roadX(y)) > 8) px(x, y, 1, 1, "#ffffff"); }
      // Welcome to Fabulous Las Vegas: the diamond sign, bulbs chasing round it
      { const y = y0 + 3, x = Math.max(free(y, 28, 40, "r"), 70), cx = x + 19;
        for (let r = 0; r < 13; r++) { const ww = 8 + Math.round(r * 0.9); px(cx - ww, y + 2 + r, 2 * ww + 1, 1, "#f4f0e0"); px(cx - ww, y + 26 - r, 2 * ww + 1, 1, "#f4f0e0"); }
        T(px, cx - 13, y + 7, "WELCOME", "#e0302f"); T(px, cx - 17, y + 15, "LAS VEGAS", "#1a6fd8");
        px(cx - 1, y - 2, 3, 3, "#e0302f"); px(cx, y - 3, 1, 5, "#e0302f"); px(cx - 2, y - 1, 5, 1, "#e0302f");
        px(cx - 1, y + 28, 3, 8, "#cfcfcf");
        live.push({ k: "fn", fn: (f, t) => { for (let a = 0; a < 26; a++) { const s = a < 13 ? a : 26 - a, side = a < 13 ? 1 : -1; if ((a + Math.floor(t * 8)) % 3 === 0) { f(cx + side * (8 + Math.round(s * 0.9)) + side, y + 2 + s, 1, 1, "#ffd23f"); f(cx + side * (8 + Math.round(s * 0.9)) + side, y + 26 - s, 1, 1, "#ffd23f"); } } } }); }
      // the Stratosphere
      { const y = y0 + 40, x = W - 15;
        px(x + 6, y + 14, 2, 42, "#c8c8d8"); px(x + 5, y + 50, 4, 6, "#a8a8b8"); px(x + 4, y + 52, 6, 4, "#8a8aa0");
        px(x + 2, y + 8, 10, 6, "#e8e8f0"); px(x + 1, y + 10, 12, 2, "#d0d0e0"); px(x + 3, y + 9, 8, 1, "#ff5ad1"); px(x + 3, y + 12, 8, 1, "#5af0ff");
        px(x + 6, y, 2, 8, "#d8d8e8"); px(x + 6, y - 6, 1, 6, "#cfcfcf");
        live.push({ k: "fn", fn: (f, t) => { if (Math.floor(t * 2) % 2) f(x + 6, y - 7, 1, 1, "#ff3b3b"); f(x + 3 + ((t * 6) % 8), y + 9, 1, 1, "#ffffff"); } }); }
      for (const [k, c] of [[0, "#ff5ad1"], [1, "#5af0ff"], [2, "#ffd23f"], [3, "#2faa4a"], [4, "#e0302f"], [5, "#f2f2f2"]] as const) {
        const fy = y0 + 10 + k * 14, side = k % 2 ? "r" : "l", fx = Math.max(6, Math.min(W - 8, free(fy, 10, 12, side) + 6));
        live.push({ k: "boom", x: fx, y: fy, c, ph: k * 0.45 });
      }
      // the Bellagio, its fountains dancing
      { const y = y0 + 64, x = 3, w = Math.min(54, Math.floor(room(y, 40).lo - 8) - x);
        px(x, y, w, 10, "#e8d8c0"); px(x, y, w, 1, "#c8b8a0"); for (let xx = x + 1; xx < x + w - 1; xx += 2) for (let yy = y + 2; yy < y + 9; yy += 2) px(xx, yy, 1, 1, "#fff0b0");
        px(x, y + 10, w, 20, "#1f5a8a"); px(x + 1, y + 11, w - 2, 18, "#2a7ab8");
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 9; k++) { const hgt = 3 + Math.abs(Math.sin(t * 2.2 + k * 0.7)) * 9, xx = x + 3 + k * ((w - 6) / 8); for (let r = 0; r < hgt; r++) f(xx, y + 26 - r, 1, 1, r > hgt - 2 ? "#ffffff" : "#bfe8ff"); } } });
        px(x, y + 30, w, 2, "#5a5a6a"); }
      // Caesars Palace, and a street preacher next to it with his REPENT sign
      { const y = y0 + 104; caesars(px, live, 2, y);
        const lim = Math.floor(room(y, 24).lo - 6), side = lim - 38 >= 12;      // beside it if there's room, else under it
        const q = side ? 39 : 4, py = side ? y + 4 : y + 30;
        const sx = side ? q - 1 : q + 6, sy = side ? py - 12 : py - 1;           // the sign: white board, red letters, on a stick
        px(sx, sy, 25, 9, "#111"); px(sx + 1, sy + 1, 23, 7, "#f8f8f0"); T(px, sx + 1, sy + 2, "REPENT", "#d01818");
        px(side ? sx + 12 : sx - 1, sy + 9, 1, side ? 4 : 2, "#6a4a2a");
        px(q + 1, py, 5, 2, "#d8d8d8"); px(q + 1, py + 2, 5, 4, "#e0b090"); px(q + 2, py + 3, 1, 1, "#111"); px(q + 4, py + 3, 1, 1, "#111");
        px(q + 1, py + 5, 5, 2, "#c8c8c8");                                                                          // the white beard
        px(q, py + 7, 7, 7, "#2a2a3a"); px(q + 3, py + 7, 1, 3, "#f2f2f2");                                        // dark suit
        px(q + 1, py + 14, 2, 4, "#1a1a24"); px(q + 4, py + 14, 2, 4, "#1a1a24"); px(q, py + 18, 3, 1, "#111"); px(q + 4, py + 18, 3, 1, "#111");
        px(q - 2, py + 9, 2, 3, "#5a1a1a");                                                                        // the bible
        live.push({ k: "fn", fn: (f, t) => { if (Math.floor(t * 2.5) % 2) f(sx + 1, sy + 1, 23, 7, "rgba(255,255,255,.18)"); } }); }
      // the Flamingo: pink tower, the neon plume, and flamingos strutting round the lawn
      { const y = y0 + 22, x = Math.max(1, Math.min(Math.floor(room(y - 8, 44).lo - 9) - 38, 6));
        px(x, y, 38, 20, "#ff6fb4"); px(x, y, 38, 1, "#ffb0d8"); for (let r = y + 3; r < y + 19; r += 3) for (let c = x + 2; c < x + 36; c += 3) px(c, r, 2, 1, "#ffd8ec");
        px(x + 1, y - 7, 36, 7, "#1a0a14"); T(px, x + 3, y - 6, "FLAMINGO", "#ff7ac0");
        live.push({ k: "fn", fn: (f, t) => { if (Math.floor(t * 3) % 4) { f(x + 3, y - 7, 32, 1, "#ff4aa8"); f(x + 3, y - 1, 32, 1, "#ff4aa8"); } } });
        px(x, y + 20, 38, 14, "#3faa4a"); px(x, y + 20, 38, 1, "#5ac85a");
        live.push({ k: "fn", fn: (f, t) => {
          for (let k = 0; k < 5; k++) {
            const sp = 0.25 + hash(k * 3) * 0.2, ph = hash(k * 11) * 6.28, u = 0.5 + 0.5 * Math.sin(t * sp + ph);
            const fx = Math.round(x + 2 + u * 31), fy = y + 22 + (k % 3) * 4, dir = Math.cos(t * sp + ph) >= 0 ? 1 : -1, step = Math.floor(t * 4 + k) % 2;
            f(fx, fy + 3, 3, 2, "#ff7ab8"); f(fx + (dir > 0 ? 3 : -1), fy + 3, 1, 1, "#ff9ad0");                        // body
            const nx = dir > 0 ? fx + 2 : fx; f(nx, fy, 1, 3, "#ff7ab8"); f(nx + (dir > 0 ? 0 : -1), fy - 1, 2, 1, "#ff7ab8");   // neck, head
            f(dir > 0 ? nx + 2 : nx - 2, fy - 1, 1, 1, "#111");                                                       // beak
            f(fx + 1, fy + 5, 1, 2 - step, "#e0508a"); f(fx + 2, fy + 5, 1, 1 + step, "#e0508a");                     // legs
          }
        } }); }
      // the Luxor: a black glass pyramid, its beam going straight up into the night
      { const y = y0 + 136, lim = Math.floor(room(y, 26).lo - 8), w = Math.min(26, lim - 3), x = Math.max(2, lim - w - 1);
        if (w > 14) {
          const cx = x + Math.floor(w / 2), hh = Math.floor(w / 2);
          for (let r = 0; r <= hh; r++) { px(cx - r, y + r, r + 1, 1, "#2a2a36"); px(cx, y + r, r + 1, 1, "#14141c"); }
          px(cx - hh, y + hh + 1, 2 * hh + 1, 2, "#3a3448");
          disc(px, cx - 10 < 2 ? cx + 10 : cx - 10, y + hh - 2, 3, "#c8a868");
          live.push({ k: "fn", fn: (f, t, c) => { c.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3); f(cx, y - 9, 1, 9, "#f2f6ff"); c.globalAlpha = 0.2; f(cx - 1, y - 9, 3, 9, "#c8d8ff"); c.globalAlpha = 1; f(cx, y, 1, 1, "#ffffff"); } });
        } }
      // Trump International: gold glass, TRUMP across the top, the street preacher out front
      { const hy = HOLDS[HI.vegas].y, y = hy - 46, x = Math.max(free(y, 46, 22, "r"), 76);
        px(x, y + 2, 22, 44, "#d8a830"); px(x + 15, y + 2, 7, 44, "#b8882a");
        for (let yy = y + 8; yy < y + 45; yy += 2) { px(x + 1, yy, 14, 1, "#f0c850"); px(x + 15, yy, 6, 1, "#a07824"); }
        for (let k = 0; k < 14; k++) px(x + 1 + Math.floor(rnd() * 13), y + 8 + Math.floor(rnd() * 36), 1, 1, "#fff6c8");
        px(x, y, 22, 7, "#1a1406"); T(px, x + 2, y + 1, "TRUMP", "#ffd860");
        px(x - 2, y + 46, 26, 2, "#3a3448"); flag(px, live, x + 11, y - 12, 11, 8, 5);
        // the Serbian couple out on the Strip with their little dog, who want to know: heaven or hell?
        const r = room(hy - 8, 16), q = Math.min(W - 22, Math.ceil(r.hi + 21));
        STAND[HI.vegas] = { side: 1, x: q - 1 };
        glow.push((g) => { g(q - 3, hy - 16, 24, 22, "#4a3a5a"); });
        // him: dark buzz cut, stubble, black leather jacket, a little Serbian flag (red, blue, white)
        px(q + 1, hy - 12, 5, 1, "#1a1410"); px(q + 1, hy - 11, 5, 4, "#e0b090"); px(q + 2, hy - 10, 1, 1, "#111"); px(q + 4, hy - 10, 1, 1, "#111"); px(q + 1, hy - 8, 5, 1, "#8a6a50");
        px(q, hy - 7, 7, 8, "#1a1a1e"); px(q + 3, hy - 7, 1, 4, "#e8e8e8"); px(q + 1, hy + 1, 2, 5, "#2a3450"); px(q + 4, hy + 1, 2, 5, "#2a3450"); px(q, hy + 6, 3, 1, "#111"); px(q + 4, hy + 6, 3, 1, "#111");
        px(q - 1, hy - 6, 1, 4, "#1a1a1e"); px(q - 2, hy - 15, 1, 12, "#9a9a9a");
        px(q - 8, hy - 15, 6, 1, "#c6363c"); px(q - 8, hy - 14, 6, 1, "#0c4076"); px(q - 8, hy - 13, 6, 1, "#f2f2f2");
        // her: long dark hair, red top, white jeans, holding his hand
        const w2 = q + 8;
        px(w2, hy - 12, 6, 2, "#3a2014"); px(w2, hy - 10, 1, 7, "#3a2014"); px(w2 + 5, hy - 10, 1, 7, "#3a2014");
        px(w2 + 1, hy - 10, 4, 4, "#f0c8a0"); px(w2 + 2, hy - 9, 1, 1, "#111"); px(w2 + 4, hy - 9, 1, 1, "#111"); px(w2 + 2, hy - 7, 2, 1, "#c84a5a");
        px(w2 + 1, hy - 6, 4, 7, "#d01830"); px(w2, hy - 4, 1, 3, "#f0c8a0"); px(q + 7, hy - 3, 1, 1, "#f0c8a0");
        px(w2 + 1, hy + 1, 2, 5, "#ecebe4"); px(w2 + 3, hy + 1, 2, 5, "#ecebe4"); px(w2 + 1, hy + 6, 2, 1, "#111"); px(w2 + 3, hy + 6, 2, 1, "#111");
        // the dog: small, white, on a red leash, tail going
        const dx = w2 + 8, dy = hy + 2;
        for (let k = 0; k < 5; k++) px(w2 + 5 + k, hy - 3 + Math.round(k * 0.9), 1, 1, "#e0302f");
        px(dx, dy, 6, 3, "#f2f2f2"); px(dx + 5, dy - 2, 3, 3, "#f2f2f2"); px(dx + 7, dy - 1, 1, 1, "#111"); px(dx + 5, dy - 2, 1, 1, "#d8d8d8");
        px(dx, dy + 3, 1, 2, "#f2f2f2"); px(dx + 4, dy + 3, 1, 2, "#f2f2f2");
        live.push({ k: "fn", fn: (f, t) => { const wag = Math.floor(t * 10) % 2; f(dx - 1, dy - 1 + wag, 1, 2, "#f2f2f2"); } }); }
      // the Little White Wedding Chapel, Elvis out front
      { const y = y0 + 166, x = Math.max(free(y, 26, 30, "r"), 54);
        px(x, y + 6, 18, 12, "#f8f8f4"); for (let r = 0; r < 5; r++) px(x + 9 - r * 2, y + 2 + r, 1 + r * 4, 1, "#e8e8e8"); px(x + 8, y - 6, 2, 9, "#f8f8f4"); px(x + 8, y - 8, 1, 2, "#ffd23f");
        px(x + 7, y + 12, 4, 6, "#ff9ab8"); px(x + 2, y + 9, 3, 3, "#ffd8e8"); px(x + 13, y + 9, 3, 3, "#ffd8e8");
        px(x + 13, y - 2, 2, 2, "#ff5a8a"); px(x + 16, y - 2, 2, 2, "#ff5a8a"); px(x + 13, y, 5, 2, "#ff5a8a"); px(x + 14, y + 2, 3, 1, "#ff5a8a"); px(x + 15, y + 3, 1, 1, "#ff5a8a");
        const e = x + 22;
        px(e, y + 4, 3, 2, "#111"); px(e + 2, y + 3, 1, 1, "#111"); px(e, y + 6, 3, 2, "#f0c8a0"); px(e - 1, y + 8, 5, 6, "#ffffff"); px(e - 1, y + 10, 5, 1, "#ffd23f");
        px(e - 2, y + 9, 1, 3, "#ffffff"); px(e + 4, y + 9, 1, 3, "#ffffff"); px(e - 1, y + 14, 2, 3, "#ffffff"); px(e + 2, y + 14, 2, 3, "#ffffff"); }
      // Walmart, the morning after
      { const y = y0 + 168, x = Math.max(1, Math.min(free(y, 22, 32, "l"), 30));
        px(x, y + 9, 32, 2, "#0a4a8a"); px(x, y + 11, 32, 9, "#0071ce"); px(x + 14, y + 14, 4, 6, "#cfe8ff");
        px(x, y + 1, 32, 7, "#0071ce"); T(px, x + 2, y + 2, "WALMART", "#ffffff"); px(x + 29, y + 3, 2, 2, "#ffc220");
        px(x, y + 20, 32, 8, "#3a3a44"); for (let k = 0; k < 7; k++) px(x + 2 + k * 4, y + 21, 1, 6, "#d8d8d8");
        car(px, x + 4, y + 22, "#e0302f"); car(px, x + 16, y + 22, "#f2f2f2"); flag(px, live, x + 30, y - 10, 10, 7, 5); }
    },
  },
  desert: {
    ground: ["#d98c4a", "#c4763a"],
    edge: pick(eCactus, eRock),
    under: ({ px, y0, h, rnd }) => {
      // daylight for Guy Fieri, then the sun goes and the Milky Way comes out over Bicknell
      const N0 = y0 + 62, N1 = y0 + 80, DUSK = ["#c87a48", "#a85a4a", "#7a3e50", "#4e2c50", "#2e2244", "#1e1c3a"];
      for (let y = N0; y < y0 + h; y++) px(0, y, W, 1, y < N1 ? DUSK[Math.min(5, Math.floor((y - N0) / 3))] : "#1a1a34");
      for (let k = 0; k < 700; k++) {
        const u = rnd(), x = u * W, cy = N1 + 6 + u * (y0 + h - N1 - 12), off = (rnd() + rnd() + rnd() - 1.5) * 12;
        const y = cy + off; if (y < N1 + 1) continue;
        px(x, y, 1, 1, Math.abs(off) < 4 ? (rnd() < 0.5 ? "#c8c0e8" : "#8a82b8") : rnd() < 0.5 ? "#4a4878" : "#3a3a66");
      }
      for (let k = 0; k < 120; k++) px(Math.floor(rnd() * W), N1 + Math.floor(rnd() * (y0 + h - N1)), 1, 1, rnd() < 0.3 ? "#ffffff" : "#b8b8d8");
      // red mesas by day, dark ones by night
      px(W - 34, y0 + 4, 34, 26, "#a8432a"); px(W - 32, y0 + 2, 30, 2, "#c45a38"); px(W - 34, y0 + 29, 34, 2, "#8a3420");
      for (const [x0, y, w] of [[0, y0 + 96, 30], [W - 26, y0 + 110, 26]] as const) {
        px(x0, y, w, 26, "#2a1a24"); px(x0 + 2, y - 2, w - 4, 2, "#341f2a"); px(x0, y, w, 1, "#4a2a30");
      }
    },
    draw: ({ px, y0, h, rnd, live }) => {
      // the sun going down at the top, the moon coming up below
      { const x = Math.min(free(y0 + 4, 10, 10, "l"), 30), y = y0 + 6; disc(px, x + 5, y + 5, 5, "#fff2a0"); disc(px, x + 5, y + 5, 3, "#ffffff"); }
      { const x = Math.min(free(y0 + 84, 10, 10, "l"), 30), y = y0 + 84; disc(px, x + 5, y + 5, 5, "#f8f4d8"); disc(px, x + 7, y + 4, 4, "#1a1a34"); }
      // twinkling + a shooting star now and then
      live.push({ k: "fn", fn: (f, t) => {
        for (let k = 0; k < 40; k++) { const x = Math.floor(hash(k * 7 + 1) * W), y = y0 + 82 + Math.floor(hash(k * 7 + 2) * (h - 84)); if (Math.abs(x - roadX(y)) < 7) continue; const p = (t * (0.6 + hash(k) * 1.4) + hash(k * 3)) % 1; if (p < 0.25) { f(x, y, 1, 1, "#ffffff"); f(x - 1, y, 3, 1, "#8a8ad8"); f(x, y - 1, 1, 3, "#8a8ad8"); f(x, y, 1, 1, "#ffffff"); } }
        const u = (t % 7) / 7; if (u < 0.12) { const s = u / 0.12; for (let k = 0; k < 8; k++) { const ww = s * 60 - k * 2; f(20 + ww, y0 + 92 + ww * 0.35, 1, 1, k === 0 ? "#ffffff" : "#9a9ae0"); } }
      } });
      // Guy Fieri, in broad daylight: white cap, shades, flame-print shirt, a grill going beside him
      { const y = y0 + 30, x = Math.max(free(y, 24, 26, "r"), 62);
        px(x + 3, y, 7, 2, "#f2f2f2"); px(x + 2, y + 2, 9, 3, "#e8e8e8"); px(x + 4, y + 1, 3, 1, "#ff8a1f"); px(x + 6, y + 2, 1, 1, "#e0302f");
        px(x + 3, y + 5, 7, 4, "#f0b890"); px(x + 3, y + 6, 7, 1, "#111"); px(x + 5, y + 8, 3, 2, "#e8e0c0"); px(x + 6, y + 10, 1, 1, "#e8e0c0");
        px(x + 1, y + 10, 11, 7, "#1a1a1a");
        for (const [dx, hh, c] of [[2, 3, "#ff3b1f"], [4, 4, "#ff8a1f"], [7, 3, "#ff3b1f"], [9, 4, "#ffd23f"], [5, 2, "#ffd23f"]] as const) px(x + dx, y + 17 - hh, 1, hh, c);
        px(x, y + 11, 1, 4, "#f0b890"); px(x + 12, y + 11, 1, 3, "#f0b890"); px(x + 2, y + 17, 3, 3, "#3a5a8a"); px(x + 8, y + 17, 3, 3, "#3a5a8a");
        const fx = x + 17, fy = y + 14;
        px(fx - 1, fy + 4, 9, 2, "#5a3a1a"); px(fx, fy + 5, 7, 1, "#3a2a1a"); for (const dx of [-2, 8]) px(fx + dx, fy + 3, 2, 2, "#6a6a6a");
        live.push({ k: "fire", x: fx, y: fy - 2, w: 7, h: 6 });
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 5; k++) { const u = (t * 0.7 + k / 5) % 1; f(fx + 3 + Math.sin(u * 9 + k) * 2, fy - 3 - u * 10, 1, 1, u < 0.5 ? "#ffd23f" : "#ff8a1f"); } } }); }
      // Bicknell: a handful of houses, windows lit, one gas station sign
      for (let k = 0; k < 5; k++) {
        const y = y0 + 84 + k * 10, x = k % 2 ? Math.max(free(y, 8, 9, "r"), 0) + (k % 3) * 4 : Math.max(1, free(y, 8, 9, "l") - (k % 3) * 5);
        px(x, y + 2, 9, 6, "#3a3448"); px(x, y, 9, 2, "#2a2438"); px(x + 2, y + 4, 2, 2, "#ffd27a"); px(x + 6, y + 4, 2, 2, "#ffd27a");
      }
      { const y = y0 + 110, x = Math.max(free(y, 14, 12, "l"), 2); px(x + 5, y + 4, 1, 10, "#8a8a8a"); word(px, x + 1, y, "GAS", "#f2f2f2", "#e0302f"); }
    },
  },
  arches: {
    ground: ["#cf6f3c", "#b85c2e"],
    edge: pick(eCactus, eRock),
    under: ({ px, y0, h, rnd }) => {
      for (let k = 0; k < 26; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * h); px(x, y, 8, 3, "#c4683a"); px(x + 1, y - 1, 6, 1, "#d8804a"); px(x + 1, y + 3, 7, 1, "#a8502a"); }
    },
    draw: ({ px, y0, h, rnd, live, says }) => {
      // Delicate Arch, big, standing alone on the slickrock bowl
      { const y = y0 + 4, x = Math.max(2, Math.min(free(y, 40, 30, "l"), 26)), cx = x + 14, cy = y + 22;
        disc(px, cx, y + 37, 15, "#c06030", 0.3); disc(px, cx, y + 37, 11, "#d07040", 0.25);
        for (let yy = -18; yy <= 15; yy++) for (let xx = -14; xx <= 14; xx++) {
          const o = (xx / 13) ** 2 + (yy / 18) ** 2, i = ((xx + 1) / 8.5) ** 2 + ((yy + 1) / 14) ** 2;
          const legL = xx < -6 && yy > 0, legR = xx > 8 && xx < 13 && yy > 0;
          if ((o <= 1 && i > 1 && yy <= 0) || (legL && xx > -13) || legR) {
            const lit = xx < 0 ? (yy < -10 ? "#e08048" : "#c8603a") : "#a8482a";
            px(cx + xx, cy + yy, 1, 1, (xx + yy) % 7 === 0 ? "#9a3a22" : lit);
          }
        }
        px(cx - 13, cy + 15, 27, 2, "#8a3420");
        person(px, cx - 1, cy + 8, "#3a6fd8", "#ffd23f", "#2a2a3a"); }
      // Balanced Rock: a boulder the size of a house on a pencil of stone
      { const y = y0 + 62, x = Math.max(2, Math.min(free(y, 36, 22, "l"), 18));
        px(x + 8, y + 14, 6, 18, "#a8432a"); px(x + 9, y + 14, 2, 18, "#c45a38"); px(x + 6, y + 30, 10, 4, "#8a3420");
        disc(px, x + 11, y + 8, 9, "#b84a2c", 0.8); disc(px, x + 9, y + 5, 5, "#d8703a", 0.8); px(x + 3, y + 13, 16, 1, "#8a3420");
        person(px, x + 18, y + 26, "#e0302f", "#3a2a1a", "#3a5a8a"); }
      // the biker bar: a row of Harleys out front, the flags (the new Utah flag, one pride flag)
      { const y = y0 + 22, x = Math.max(free(y, 36, 50, "r"), 64);
        px(x, y, 34, 14, "#5a3a2a"); px(x, y, 34, 2, "#3a2418"); for (let k = 0; k < 34; k += 3) px(x + k, y + 3, 1, 11, "#4a2e20");
        px(x + 3, y + 4, 28, 6, "#1a1a1a"); T(px, x + 4, y + 4, "BIKERS", "#ff8a1f"); px(x + 14, y + 10, 5, 4, "#2a1a0a");
        for (let k = 0; k < 3; k++) {                                                         // the Harleys already parked, chrome and black
          const bx = x + 1 + k * 6, by = y + 17;
          px(bx + 1, by, 2, 9, "#1a1a1a"); px(bx + 1, by + 1, 2, 1, "#d8d8d8"); px(bx, by + 2, 4, 1, "#c8c8c8"); px(bx + 1, by + 4, 2, 3, ["#e0302f", "#1a1a1a", "#ff8a1f", "#3a3a3a", "#c8c8c8", "#1a1a1a"][k]);
          px(bx + 3, by + 6, 1, 3, "#b8b8b8");
        }
        person(px, x + 37, y + 14, "#1a1a1a", "#3a3a3a", "#1a2a4a"); px(x + 37, y + 17, 3, 1, "#6a4a2a");     // leather vest
        person(px, x + 42, y + 16, "#1a1a1a", "#c8c8c8", "#1a2a4a");
        // the new Utah flag: navy sky, white peaks, red rock, the beehive in a hexagon with a gold star
        { const fx = x + 36, fy = y - 2, w = 13, hh = 9;
          px(fx - 1, fy - 1, 1, 22, "#d8d8d8"); px(fx - 1, fy - 2, 1, 1, "#ffd23f");
          for (let yy = 0; yy < hh; yy++) for (let xx = 0; xx < w; xx++) {
            const ridge = 4 + Math.abs(((xx * 3) % 8) - 4) * 0.4;
            px(fx + xx, fy + yy, 1, 1, yy < ridge ? "#1a2a5a" : yy < 6 ? "#f2f2f2" : "#c8402a");
          }
          px(fx + 5, fy + 2, 3, 5, "#1a2a5a"); px(fx + 4, fy + 3, 5, 3, "#1a2a5a"); px(fx + 5, fy + 3, 3, 3, "#ffd23f"); px(fx + 6, fy + 3, 1, 3, "#c8902a"); px(fx + 6, fy + 2, 1, 1, "#ffd23f"); }
        // the pack rides down the highway, swings into the lot, parks in the empty spots, and they walk in.
        // one rainbow flag in the whole pack, on the second bike
        const by = y + 17, P = 11;
        live.push({ k: "fn", fn: (f, t) => {
          const u = (t % P) / P;
          for (let k = 0; k < 3; k++) {
            const sx = x + 1 + (k + 3) * 6 + 1, lag = k * 0.035, v = u - lag;
            let bx: number, byy: number, parked = false;
            if (v < 0 || v > 0.94) continue;
            if (v < 0.42) { byy = y0 - 12 + (v / 0.42) * (by - y0 + 12); bx = Math.round(roadX(byy)) + 2; }
            else if (v < 0.56) { const s2 = (v - 0.42) / 0.14; byy = by; bx = Math.round(roadX(by) + 2 + (sx - roadX(by) - 2) * s2); }
            else { bx = sx; byy = by; parked = true; }
            f(bx, byy, 2, 9, "#1a1a1a"); f(bx, byy + 1, 2, 1, "#d8d8d8"); f(bx - 1, byy + 2, 4, 1, "#c8c8c8"); f(bx, byy + 4, 2, 3, ["#c8202a", "#1a1a1a", "#3a3a3a"][k]); f(bx + 2, byy + 6, 1, 3, "#b8b8b8");
            if (!parked || v < 0.62) {                                                      // the rider still on it
              f(bx, byy + 3, 2, 3, "#1a1a1a"); f(bx, byy + 2, 2, 1, "#e8c0a0"); f(bx, byy + 1, 2, 1, "#3a3a3a");
              if (!parked) for (let k2 = 0; k2 < 3; k2++) f(bx + (k2 % 2), byy + 10 + k2 * 2, 1, 1, "#9a7a5a");   // dust
            } else if (v < 0.8) {                                                            // walking up to the door
              const s3 = (v - 0.62) / 0.18, wx = bx + (x + 15 - bx) * s3, wy = byy - s3 * 4;
              f(wx, wy, 2, 1, "#3a3a3a"); f(wx, wy + 1, 2, 1, "#e8c0a0"); f(wx, wy + 2, 2, 3, "#1a1a1a"); f(wx + (Math.floor(t * 6) % 2), wy + 5, 1, 2, "#1a2a4a");
            }
            if (k === 1) { f(bx + 2, byy - 5, 1, 7, "#cfcfcf");
              for (let s2 = 0; s2 < 5; s2++) { const wv = parked ? 0 : Math.round(Math.sin(t * 8 + s2 * 0.9) * 0.7); for (let c = 0; c < 6; c++) f(bx + 3 + s2, byy - 5 + wv + c, 1, 1, PRIDE[c]); } }
          }
        } }); }
      // cliff jumping: a run, a leap, a splash, the friends on the rocks
      { const y = y0 + 64, x = Math.max(free(y, 46, 46, "r"), 58), lip = x + 14;
        for (let yy = 0; yy < 40; yy++) { const ww = 14 + Math.round(Math.sin(yy / 4) + hash(yy) * 2); px(x, y + yy, ww, 1, yy % 5 ? "#9a3a22" : "#b04a2a"); px(x + ww - 2, y + yy, 2, 1, "#6a2414"); }
        px(x, y, 15, 2, "#c45a38");
        const wx = lip + 2, wy = y + 26;
        for (let yy = 0; yy < 18; yy++) px(wx, wy + yy, Math.min(W - wx - 1, 28), 1, yy < 2 ? "#3a8fb8" : "#2f7aa8");
        px(wx + 4, wy + 6, 6, 1, "#6ab8e0"); px(wx + 14, wy + 12, 8, 1, "#6ab8e0");
        for (const [dx, dy] of [[24, -4], [27, -2]]) { px(wx + dx - 1, wy + dy, 5, 3, "#a8432a"); }
        person(px, wx + 23, wy - 12, "#ffd23f", "#3a2a1a", "#3a6fd8"); person(px, wx + 26, wy - 11, "#2faa4a", "#c87a3a", "#1a1a1a");
        STAND[HI.arches] = { side: 1, x: wx + 23 };
        says.push({ a: y - 10, b: y + 34, who: "them", text: "“Here for a good time, not for a long time.”" });
        live.push({ k: "fn", fn: (f, t) => {
          const P = 4.2, u = (t % P) / P, sk = "#f0c8a0";
          let jx: number, jy: number;
          if (u < 0.3) { jx = x + 2 + (u / 0.3) * 11; jy = y - 6; }
          else if (u < 0.62) { const s = (u - 0.3) / 0.32; jx = lip + s * 9; jy = y - 6 - Math.sin(s * Math.PI) * 6 + s * s * 34; }
          else { jx = -99; jy = 0; }
          if (jx > 0) { f(jx, jy, 2, 2, sk); f(jx, jy + 2, 2, 3, "#e0302f"); f(jx + (Math.floor(t * 8) % 2), jy + 5, 1, 2, sk); if (u > 0.3) { f(jx - 1, jy - 1, 1, 2, sk); f(jx + 2, jy - 1, 1, 2, sk); } }
          if (u > 0.6 && u < 0.95) { const s = (u - 0.6) / 0.35, sx = lip + 9, sy = wy + 6;
            for (let a = 0; a < 12; a++) { const th = (a / 12) * Math.PI * 2; f(sx + Math.cos(th) * (1 + s * 5), sy + Math.sin(th) * (1 + s * 2.5), 1, 1, "#e8f8ff"); }
            if (s < 0.4) for (let k = 0; k < 5; k++) f(sx - 2 + k, sy - 1 - (4 - Math.abs(k - 2) * 1.5) * Math.sin(s / 0.4 * Math.PI), 1, 1, "#ffffff"); }
        } }); }
      // The Body Keeps the Score, the copy with the blue-and-red Scream on the cover
      { const y = y0 + 118, x = Math.max(free(y, 34, 26, "r"), 70), w = 22, hh = 30;
        px(x + 2, y + 2, w, hh, "#5a2414");
        px(x, y, w, hh, "#1a1a1a");
        for (let yy = 1; yy < hh - 1; yy++) for (let xx = 1; xx < w - 1; xx++) {
          const sky = yy < 13, wv = Math.sin(xx / 2.2 + yy / 1.6);
          px(x + xx, y + yy, 1, 1, sky ? (wv > 0.3 ? "#e8402a" : wv > -0.4 ? "#c82a2a" : "#ff7a3a") : (wv > 0.2 ? "#1a3a9a" : "#2a5ad8"));
        }
        for (let k = 0; k < 18; k++) px(x + 1 + k, y + 18 + Math.floor(k * 0.6), 1, 1, "#8a3a2a");                 // the bridge rail
        px(x + 13, y + 11, 4, 6, "#e8d8b8"); px(x + 14, y + 13, 1, 2, "#1a1a1a"); px(x + 16, y + 13, 1, 2, "#1a1a1a"); px(x + 15, y + 15, 1, 1, "#1a1a1a");   // the face
        px(x + 12, y + 12, 1, 4, "#e8d8b8"); px(x + 17, y + 12, 1, 4, "#e8d8b8"); px(x + 13, y + 17, 4, 9, "#1a1a2a");
        px(x + 1, y + 1, w - 2, 9, "#f2f2f2");
        word(px, x + 3, y + 2, "BODY", "#1a3a9a", null); px(x + 3, y + 8, 16, 1, "#c82a2a");
        px(x + 1, y + hh - 4, w - 2, 3, "#f2f2f2"); px(x + 3, y + hh - 3, 16, 1, "#5a5a5a");
        says.push({ a: y - 30, b: y + hh + 6, who: "note", text: "The Body Keeps the Score: Brain, Mind, and Body in the Healing of Trauma — Bessel van der Kolk",
          href: "https://www.thriftbooks.com/w/the-body-keeps-the-score-brain-mind-and-body-in-the-healing-of-trauma_bessel-a-van-der-kolk/8899394/" }); }
      // the hippies: a VW bus, a drum circle round a little fire, a hammock, tie-dye everywhere
      { const y = y0 + 98, x = Math.max(2, Math.min(free(y, 26, 44, "l"), 6));
        // the bus, side on: two-tone, split windshield, a peace sign on the nose
        const bx = x, by = y + 2;
        px(bx + 1, by, 18, 1, "#f2ead8"); px(bx, by + 1, 20, 4, "#f2ead8"); px(bx, by + 5, 20, 5, "#5ab8c8"); px(bx, by + 5, 20, 1, "#3a98a8");
        for (let k = 0; k < 4; k++) px(bx + 2 + k * 4, by + 2, 3, 2, "#9ad0e8");
        px(bx + 17, by + 6, 2, 3, "#f2ead8"); px(bx + 17, by + 7, 1, 1, "#3a98a8");                             // the big V on the nose
        px(bx + 3, by + 10, 3, 2, "#1a1a1a"); px(bx + 14, by + 10, 3, 2, "#1a1a1a"); px(bx + 4, by + 10, 1, 1, "#c8c8c8"); px(bx + 15, by + 10, 1, 1, "#c8c8c8");
        { const cx = bx + 9, cy = by + 7; ring(px, cx, cy, 2, "#1a1a1a", 12); px(cx, cy - 2, 1, 5, "#1a1a1a"); px(cx - 1, cy + 1, 1, 1, "#1a1a1a"); px(cx + 1, cy + 1, 1, 1, "#1a1a1a"); }
        px(bx + 4, by - 2, 12, 2, "#c86a3a"); px(bx + 5, by - 3, 3, 1, "#3a8a3a"); px(bx + 10, by - 3, 4, 1, "#e8c040");   // surfboard + bags on the roof
        // the drum circle
        const dx = x + 27, dy = y + 7;
        px(dx - 1, dy, 3, 2, "#4a3a2a"); live.push({ k: "fire", x: dx - 1, y: dy - 3, w: 3, h: 3 });
        const TD = ["#ff3b6a", "#ffd23f", "#3ad86a", "#3a8aff", "#c83aff"];
        for (let k = 0; k < 6; k++) {
          const th = (k / 6) * Math.PI * 2, hx = Math.round(dx + Math.cos(th) * 6) - 1, hy = Math.round(dy + Math.sin(th) * 5) - 3;
          px(hx, hy, 3, 1, ["#3a2a1a", "#c8a050", "#5a3a1a", "#e8c070", "#2a1a0a", "#8a5a2a"][k]);       // hair: dreads, braids, a bandana
          if (k % 2 === 0) { px(hx - 1, hy + 1, 1, 3, "#3a2a1a"); px(hx + 3, hy + 1, 1, 3, "#3a2a1a"); }
          px(hx, hy + 1, 3, 2, ["#f0c8a0", "#c08a5a", "#8a5a3a"][k % 3]);
          for (let q = 0; q < 9; q++) px(hx + (q % 3), hy + 3 + Math.floor(q / 3), 1, 1, TD[(q + k * 2) % 5]);   // tie-dye
        }
        live.push({ k: "fn", fn: (f, t) => {                                                 // the djembes going
          for (let k = 0; k < 6; k += 2) { const th = (k / 6) * Math.PI * 2, hx = Math.round(dx + Math.cos(th) * 6) - 1, hy = Math.round(dy + Math.sin(th) * 5) - 3, b = Math.floor(t * 6 + k) % 2;
            f(hx + 3, hy + 4 + b, 2, 3, "#8a5a2a"); f(hx + 3, hy + 4 + b, 2, 1, "#e8d8b0"); }
          for (let k = 0; k < 3; k++) { const u = (t * 0.8 + k / 3) % 1; f(dx + 6 + u * 6, dy - 6 - u * 10 + Math.sin(u * 9) * 1.5, 1, 1, "#ffd23f"); }   // notes rising
        } });
        // a hammock between two junipers, someone swinging in it
        const hx0 = x + 2, hy0 = y + 15;
        for (const tx of [hx0, hx0 + 14]) { px(tx, hy0, 3, 3, "#3a6a3a"); px(tx + 1, hy0 + 3, 1, 3, "#5a3a1a"); }
        live.push({ k: "fn", fn: (f, t) => { const sw = Math.round(Math.sin(t * 1.6) * 1);
          for (let k = 0; k < 11; k++) f(hx0 + 2 + k, hy0 + 2 + Math.round(Math.sin((k / 10) * Math.PI) * 2) + (k > 2 && k < 8 ? sw : 0), 1, 1, TD[k % 5]);
          f(hx0 + 5, hy0 + 2 + sw, 2, 1, "#f0c8a0"); } }); }
      // the crystal shop: a tin shack, amethyst and quartz out front, a peace flag
      { const y = y0 + 158, x = Math.max(free(y, 18, 34, "r"), 64);
        px(x, y + 4, 24, 12, "#9a8a7a"); for (let k = 0; k < 24; k += 3) px(x + k, y + 4, 1, 12, "#8a7a6a"); px(x - 1, y + 3, 26, 2, "#6a5a4a");
        px(x + 1, y - 3, 34, 7, "#3a1a4a"); T(px, x + 2, y - 2, "CRYSTALS", "#e8b8ff");
        px(x + 3, y + 8, 6, 4, "#cfe8ff"); px(x + 15, y + 9, 4, 7, "#5a3a1a");
        for (const [cx, c] of [[x + 26, "#9a5ad8"], [x + 29, "#e8e8f8"], [x + 32, "#d85ab8"]] as const) { px(cx, y + 12, 2, 4, c); px(cx, y + 11, 1, 1, "#ffffff"); }
        { const fx = x + 21, fy = y - 12; px(fx, fy, 1, 15, "#c8c8c8"); px(fx + 1, fy, 9, 7, "#3a8ad8");      // a peace flag
          ring(px, fx + 5, fy + 3, 2, "#ffffff", 14); px(fx + 5, fy + 1, 1, 5, "#ffffff"); px(fx + 4, fy + 4, 1, 1, "#ffffff"); px(fx + 6, fy + 4, 1, 1, "#ffffff"); }
        person(px, x + 10, y + 8, "#c83aff", "#e8c070", "#3a6fd8"); for (let q = 0; q < 9; q++) px(x + 10 + (q % 3), y + 11 + Math.floor(q / 3), 1, 1, ["#ff3b6a", "#ffd23f", "#3ad86a", "#3a8aff"][q % 4]); }
      // the Moab uranium tailings: a terraced flat-topped mound, fenced off, trefoils, drums, a man in a hazmat suit
      { const y = y0 + 128, x = 2, w = Math.min(48, Math.floor(room(y, 60).lo - 10) - x);
        for (let r = 0; r < 46; r++) {                                                             // three terraces, flat top
          const inset = Math.max(0, 12 - r) + Math.max(0, r - 34) * 0.8, step = r === 4 || r === 8 || r === 38 || r === 42;
          px(x + inset, y + r, w - inset * 2, 1, step ? "#6a6248" : r < 12 ? "#9a8e68" : r > 34 ? "#7a7052" : "#b4a87e");
        }
        for (let k = 0; k < 6; k++) px(x + 14, y + 14 + k * 3, w - 28, 1, "#a89c74");              // the dozer tracks on the cap
        px(x + w / 2 - 4, y + 22, 9, 4, "#ffd23f"); px(x + w / 2 - 3, y + 23, 4, 2, "#1a1a1a");      // a little dozer up top
        // the big trefoil, standing on the cap
        trefoil(px, Math.round(x + w / 2), y + 8, 6);
        // fence
        for (let k = -2; k < w + 2; k += 2) { px(x + k, y - 3, 1, 2, "#c8c8c8"); px(x + k, y + 49, 1, 2, "#c8c8c8"); }
        px(x - 2, y - 3, w + 4, 1, "#9a9a9a"); px(x - 2, y + 49, w + 4, 1, "#9a9a9a");
        // the sign at the gate: DANGER / RADIOACTIVE
        { const sx = x + 1, sy = y + 52; px(sx + 3, sy + 14, 1, 4, "#5a5a5a"); px(sx + 38, sy + 14, 1, 4, "#5a5a5a");
          px(sx, sy, 44, 15, "#111"); px(sx + 1, sy + 1, 42, 13, "#ffd23f"); px(sx + 1, sy + 1, 42, 6, "#c8202a");
          T(px, sx + 11, sy + 1, "DANGER", "#ffffff"); T(px, sx + 1, sy + 8, "RADIOACTIVE", "#111"); }
        trefoil(px, x + w - 4, y + 52, 4);
        // drums leaking green
        for (let k = 0; k < 3; k++) { const dx = x + w - 15 + k * 5, dy = y + 40 + (k % 2); px(dx, dy, 4, 6, "#e8c030"); px(dx, dy + 2, 4, 1, "#a88a20"); px(dx + 1, dy + 3, 2, 2, "#1a1a1a"); }
        live.push({ k: "fn", fn: (f, t, c) => {
          c.globalAlpha = 0.5 + 0.35 * Math.sin(t * 2.2); f(x + w - 16, y + 46, 15, 2, "#7aff3a"); f(x + w - 13, y + 48, 8, 1, "#7aff3a"); c.globalAlpha = 1;
          for (let k = 0; k < 4; k++) { const u = (t * 0.5 + k / 4) % 1; c.globalAlpha = 1 - u; f(x + w - 14 + k * 3, y + 44 - u * 8, 1, 1, "#b8ff7a"); c.globalAlpha = 1; }
          // the hazmat man walking the fence line with a Geiger counter, which clicks
          const span = w - 10, p2 = (t * 4) % (2 * span), hx = x + 4 + (p2 < span ? p2 : 2 * span - p2), hy = y + 41;
          f(hx, hy, 3, 2, "#ffd23f"); f(hx + 1, hy + 1, 1, 1, "#1a1a1a"); f(hx, hy + 2, 3, 4, "#ffd23f"); f(hx + (Math.floor(t * 4) % 2), hy + 6, 1, 2, "#e8c030"); f(hx + 2 - (Math.floor(t * 4) % 2), hy + 6, 1, 2, "#e8c030");
          f(hx + 3, hy + 3, 2, 1, "#3a3a3a"); if (Math.floor(t * 11) % 3 === 0) f(hx + 4, hy + 1, 1, 1, "#7aff3a");
        } });
        px(x, y + 70, w + 6, 6, "#4a7aa0"); px(x, y + 71, w + 6, 1, "#7ab0d0"); }
      // Jeeps crawling over the slickrock
      for (let k = 0; k < 2; k++) { const yy = y0 + 181 + k * 9, xx = Math.max(free(yy, 8, 10, "r"), 0) + k * 6; px(xx, yy, 7, 4, ["#2faa4a", "#ffd23f", "#e0302f"][k]); px(xx + 1, yy + 1, 3, 2, "#1a2a3a"); px(xx - 1, yy, 1, 1, "#111"); px(xx + 7, yy, 1, 1, "#111"); px(xx - 1, yy + 3, 1, 1, "#111"); px(xx + 7, yy + 3, 1, 1, "#111"); }
      { const yy = y0 + 196, xx = Math.max(free(yy, 10, 18, "r"), 60); word(px, xx, yy + 1, "MOAB", "#f2f2f2", "#7a2a18"); }
    },
  },
  vail: {
    ground: ["#3f7a3a", "#36703a"],
    under: ({ px, y0, h }) => {
      // forest on every slope: the money hides in it
      for (let y = y0 + 2; y < y0 + h - 4; y += 3) for (let x = (y % 2) * 2; x < W; x += 4) {
        const xx = x + Math.floor(hash(x * 13 + y * 7) * 3), r = roadX(y + 4);
        if (Math.abs(xx - r) < 10) continue;
        pine(px, xx, y, ["#1f5a2a", "#1a4e26", "#24603a", "#174422"][Math.floor(hash(xx * 3 + y) * 4)]);
      }
    },
    draw: ({ px, y0, rnd, live, says }) => {
      // Vail Mountain in July: green runs, the gondola climbing, wildflowers
      { const y = y0 + 1, cx = 24, H = 48;
        const lim = (r: number) => Math.floor(room(y + r, 0).lo - 8);
        for (let r = 0; r < H; r++) {
          const half = Math.round(3 + r * 0.75), l = Math.max(0, cx - half), rr = Math.min(lim(r), cx + half);
          if (rr <= l) continue;
          px(l, y + r, rr - l, 1, r < 4 ? "#e8eef2" : "#3f7a3a"); if (r > 3 && cx < rr) px(cx, y + r, rr - cx, 1, "#346a30");
          for (const off of [-0.55, -0.15, 0.3, 0.65]) { const xx = cx + Math.round(off * half + Math.sin(r / 4 + off * 9) * 2); if (r > 4 && xx > l && xx < rr - 1) px(xx, y + r, 2, 1, "#7aba5a"); }
          if (r > 6 && hash(r * 17) < 0.6) { const xx = l + Math.floor(hash(r * 3) * (rr - l)); px(xx, y + r, 1, 1, ["#ffd23f", "#ff8ab8", "#b89ad8", "#f2f2f2"][r % 4]); }
        }
        for (let k = 0; k < 18; k++) { const r = 10 + Math.floor(rnd() * (H - 12)), half = Math.round(3 + r * 0.75), xx = cx - half + Math.floor(rnd() * 2 * half); if (xx < lim(r) - 4) pine(px, xx, y + r - 6, "#1f5a2a"); }
        const g0x = cx + 2, g0y = y + 5, g1x = Math.min(lim(H) - 4, cx + 26), g1y = y + H - 2;
        for (let k = 0; k <= 40; k++) px(g0x + (g1x - g0x) * (k / 40), g0y + (g1y - g0y) * (k / 40), 1, 1, "#2a2a2a");
        px(g1x - 2, g1y, 5, 4, "#8a5a32"); px(g0x - 2, g0y - 2, 5, 3, "#8a5a32");
        live.push({ k: "fn", fn: (f, t) => { for (let k = 0; k < 5; k++) { const u = (t * 0.05 + k / 5) % 1; f(g0x + (g1x - g0x) * u - 1, g0y + (g1y - g0y) * u + 1, 3, 2, "#e0302f"); f(g0x + (g1x - g0x) * u - 1, g0y + (g1y - g0y) * u + 1, 3, 1, "#ff8a7a"); } } }); }
      // gentrified Vail, hidden in the trees: glass-and-timber houses tucked into clearings up the slopes,
      // private drives snaking down to the road, Range Rovers, a hot tub steaming, a gate with a guard
      const clear = (x: number, y: number, w: number, hh: number) => {
        for (let yy = 0; yy < hh; yy++) { const inset = Math.max(0, 3 - yy, yy - hh + 4); px(x + inset, y + yy, w - inset * 2, 1, (yy + x) % 5 ? "#4f8a42" : "#467e3c"); }
      };
      const drive = (fx: number, fy: number) => {                       // a paved private drive down to the road
        const tx = roadX(fy + 6), dir = tx > fx ? 1 : -1;
        for (let k = 0; k <= Math.abs(tx - fx); k++) { const xx = fx + dir * k, yy = fy + Math.round(Math.sin(k / 4) * 2 + k * 0.12); if (Math.abs(xx - roadX(yy)) < 7 || Math.abs(xx - roadX(yy + 1)) < 7) break; px(xx, yy, 1, 2, "#7a7a82"); }
      };
      const rover = (x: number, y: number, c: string) => {               // a Range Rover, side on
        px(x + 1, y, 6, 2, c); px(x, y + 2, 9, 2, c); px(x + 2, y + 1, 4, 1, "#2a3440"); px(x + 7, y + 2, 1, 1, "#fff6c0");
        px(x + 1, y + 4, 2, 1, "#111"); px(x + 6, y + 4, 2, 1, "#111");
      };
      const house = (x: number, y: number, w: number, tub: boolean) => {  // glass, cedar, stone, a low dark roof
        clear(x - 4, y - 5, w + 8, 26);
        px(x - 1, y, w + 2, 2, "#2a2c30"); px(x, y + 2, w, 1, "#3a3c42");
        px(x, y + 3, w, 8, "#6a4426"); for (let k = 1; k < w; k += 2) px(x + k, y + 3, 1, 8, "#5a3820");
        const gw = Math.floor(w * 0.6); px(x + 1, y + 4, gw, 6, "#9ad0e8"); px(x + 2, y + 6, gw - 2, 4, "#ffd890"); for (let k = 3; k < gw; k += 4) px(x + 1 + k, y + 4, 1, 6, "#2a2c30");
        px(x - 1, y + 11, w + 2, 3, "#8a8580"); for (let k = 0; k < w + 2; k += 3) px(x - 1 + k, y + 12, 1, 1, "#6a6560");
        px(x + gw + 2, y + 6, 3, 5, "#3a2414");
        px(x - 2, y + 14, w + 4, 1, "#9a7a50");                                                   // the deck
        if (tub) { px(x + w + 2, y + 9, 5, 4, "#c8c0b0"); px(x + w + 3, y + 10, 3, 2, "#5ad0e8");
          live.push({ k: "fn", fn: (f, t, c2) => { c2.globalAlpha = 0.5; for (let k = 0; k < 4; k++) { const u2 = (t * 0.4 + k / 4) % 1; f(x + w + 3 + Math.sin(u2 * 6 + k) * 1.5, y + 9 - u2 * 8, 2, 1, "#ffffff"); } c2.globalAlpha = 1; } }); }
        drive(x + Math.floor(w / 2), y + 15);
      };
      { const r = (y: number) => Math.max(free(y, 22, 26, "r"), Math.ceil(room(y, 22).hi + 14));
        house(r(y0 + 8), y0 + 8, 18, false); rover(r(y0 + 8) + 4, y0 + 24, "#1a1a1e");
        house(r(y0 + 46), y0 + 46, 20, true); rover(r(y0 + 46) - 2, y0 + 62, "#e8e8ea");
        house(r(y0 + 112) + 4, y0 + 112, 16, true);
        const lx = (y: number) => Math.max(2, Math.min(free(y, 22, 26, "l"), Math.floor(room(y, 22).lo - 40)));
        house(lx(y0 + 102) + 6, y0 + 102, 18, false); rover(lx(y0 + 102) + 1, y0 + 120, "#3a4a3a");
      }
      // the gate: stone pillars, a gatehouse, the arm down, a Rover waiting to be let in
      { const y = y0 + 82, x = Math.max(free(y, 22, 44, "r"), Math.ceil(room(y, 22).hi + 7));
        clear(x - 3, y - 4, 46, 24);
        px(x, y + 8, 40, 4, "#7a7a82"); px(x, y + 9, 40, 1, "#8a8a92");
        for (const dx of [8, 20]) { px(x + dx, y + 2, 4, 10, "#8a8580"); px(x + dx - 1, y + 1, 6, 2, "#a8a39c"); px(x + dx + 1, y + 4, 2, 1, "#ffd890"); }
        px(x + 12, y + 9, 8, 1, "#e0302f"); for (let k = 0; k < 8; k += 2) px(x + 12 + k, y + 9, 1, 1, "#f2f2f2");      // the arm
        px(x + 26, y, 12, 8, "#6a4426"); px(x + 25, y - 2, 14, 2, "#2a2c30"); px(x + 28, y + 2, 5, 3, "#ffd890");
        person(px, x + 34, y + 6, "#1a2a4a", "#1a2a4a", "#1a1a2a");                                   // the guard
        word(px, x + 2, y - 8, "VAIL", "#f2ead8", "#3a2a1a");
        rover(x + 1, y + 7, "#1a1a1e"); }
      // a retired army man and his wife, still sweet on each other. He just turned 80.
      { const y = y0 + 64, x = Math.max(2, free(y, 26, 30, "l"));
        for (let yy = 0; yy < 26; yy++) px(x - 3, y - 8 + yy, 32, 1, (yy + x) % 5 ? "#6aa04a" : "#5f9442");
        { const HY = HOLDS[HI.vail].y;
          STAND[HI.vail] = { side: -1, x: x + 28 };
          says.push({ a: y - 34, b: HY + 1, who: "them", text: "“He just turned 80.”", hold: HI.vail, u0: 0, u1: 0.5 },
            { a: HY - 1, b: HY + 1, who: "us", text: "“Happy birthday!”", hold: HI.vail, u0: 0.5, u1: 1.01 }); }
        flag(px, live, x + 24, y - 6, 22, 11, 7);
        px(x + 2, y, 7, 2, "#4a5a2a"); px(x + 2, y + 2, 1, 2, "#c8c8c8"); px(x + 8, y + 2, 1, 2, "#c8c8c8");
        px(x + 3, y + 2, 5, 5, "#f0c8a0"); px(x + 4, y + 3, 1, 1, "#111"); px(x + 6, y + 3, 1, 1, "#111"); px(x + 4, y + 5, 3, 1, "#1a1a1a");
        px(x + 2, y + 7, 7, 7, "#5a6a32"); px(x + 3, y + 8, 2, 1, "#e0302f"); px(x + 3, y + 9, 2, 1, "#ffd23f"); px(x + 5, y + 7, 1, 7, "#c8a830");
        px(x + 3, y + 14, 2, 4, "#3a3a2a"); px(x + 6, y + 14, 2, 4, "#3a3a2a");
        px(x + 13, y + 1, 4, 2, "#f2f2f2"); px(x + 12, y + 3, 6, 4, "#f0c8a0"); px(x + 12, y + 2, 1, 3, "#e8e8e8"); px(x + 17, y + 2, 1, 3, "#e8e8e8");
        px(x + 13, y + 4, 1, 1, "#111"); px(x + 16, y + 4, 1, 1, "#111"); px(x + 14, y + 6, 2, 1, "#d06a7a");
        px(x + 12, y + 7, 6, 1, "#f2f2f2"); px(x + 11, y + 8, 8, 8, "#b89ad8"); px(x + 12, y + 16, 2, 2, "#f0c8a0"); px(x + 16, y + 16, 2, 2, "#f0c8a0");
        px(x + 9, y + 10, 2, 1, "#f0c8a0");
        live.push({ k: "fn", fn: (f, t) => { const u = (t * 0.5) % 1, hy = y - 3 - u * 8; f(x + 9, hy, 1, 1, "#e0302f"); f(x + 11, hy, 1, 1, "#e0302f"); f(x + 9, hy + 1, 3, 1, "#e0302f"); f(x + 10, hy + 2, 1, 1, "#e0302f"); } });
        px(x - 1, y + 18, 22, 2, "#7a5a3a"); }
    },
  },
  lake: {
    ground: ["#3f7a3a", "#35693a"],
    under: ({ ctx, px, y0, h, rnd }) => {
      // a high sky, then range after range of the Rockies, each one closer, darker and greener
      const SKY = ["#8aaed4", "#98b8dc", "#a8c4e2", "#b8d0e8", "#c8dcee", "#d6e4f2", "#e2ecf6"];
      for (let y = 0; y < 92; y++) px(0, y0 + y, W, 1, SKY[Math.min(6, Math.floor(y / 13))]);
      const RANGES: [number, number, string, string, string, number][] = [   // base row, peak height, lit, shadow, snow, snow share
        [y0 + 96, 74, "#a4acc0", "#6a7290", "#f8fafe", 0.42],
        [y0 + 138, 62, "#8290a8", "#525e7a", "#f0f4fa", 0.32],
        [y0 + 180, 52, "#62788c", "#405268", "#e8eef6", 0.22],
        [y0 + 218, 44, "#4a6a58", "#324c40", "#e0e8ee", 0.1],
        [y0 + 254, 34, "#3a6a3a", "#285030", "#dfe8ee", 0.0],
      ];
      RANGES.forEach(([base, ph, lit, sh, snow, sl], ri) => {
        const peaks: [number, number, number][] = [];
        for (let x = -16; x < W + 20; x += 12 + Math.floor(rnd() * 14)) peaks.push([x + Math.floor(rnd() * 5), ph * (rnd() < 0.2 ? 1.2 : 0.45 + rnd() * 0.5), 0.9 + rnd() * 0.5]);
        peaks.sort((p, q) => q[1] - p[1]);                       // tallest first, so the lower ones stand in front
        const end = ri === RANGES.length - 1 ? y0 + h : base + 64;
        for (const [cx, hh, sl2] of peaks) {
          const apex = Math.round(base - hh);
          for (let y = apex; y < end; y++) {
            const d = y - apex, half = Math.round(d * sl2 + (d > 3 ? Math.sin(d * 0.9 + cx) * 1.3 + hash(d * 31 + cx) * 1.2 : 0));
            const snowy = sl > 0 && d < hh * sl + hash(cx * 7 + y) * 3 - 1;
            for (let x = Math.max(0, cx - half); x <= Math.min(W - 1, cx + half); x++) {
              const right = x > cx || (x === cx && d % 2 === 1);
              const streak = !snowy && d < 26 && ((x - cx) * 3 + y) % 11 === 0;
              let c = right ? sh : lit;
              if (snowy && Math.abs(x - cx) < half * (1 - d / (hh * sl + 1) * 0.15) + 1) c = right ? "#c4cede" : snow;
              else if (streak) c = shadeOf(c, 16);
              else if (d > hh * 0.9) c = shadeOf(c, Math.min(30, (d - hh * 0.9) * 0.8));
              px(x, y, 1, 1, c);
            }
          }
        }
        if (ri >= 2) for (let x = 0; x < W; x += 2) if (hash(x * 7 + ri) < (ri === 2 ? 0.35 : 0.7)) pine(px, x, base - 8 + Math.floor(hash(x * 3 + ri) * 22), ri === 4 ? "#1f4a24" : ri === 3 ? "#24503a" : "#2a5444");
        if (ri < RANGES.length - 1) { ctx.globalAlpha = 0.5; for (let x = 0; x < W; x++) px(x, base + 4 + Math.round(Math.sin(x / 7 + ri) * 1.5), 1, 3, "#eef2f8"); ctx.globalAlpha = 1; }
      });
      for (let y = y0 + 254; y < y0 + h; y++) for (let x = 0; x < W; x++) if (hash(x * 31 + y * 7) < 0.06) px(x, y, 1, 1, "#4f8a42");
    },
    draw: ({ px, y0, h, rnd, live, says, hd }) => {
      // the wildfire on the far range, right side only: a thick, narrow plume leaning off to the east
      { const y = y0 + 52, x = Math.max(free(y, 20, 24, "r"), 92), w = Math.min(22, W - x - 2);
        for (let k = 0; k < w; k++) px(x + k, y + 12 + Math.round(Math.sin(k / 3) * 2), 1, 3, "#3a2a2a");
        live.push({ k: "fire", x, y: y + 4, w, h: 9 });
        live.push({ k: "fn", fn: (f, t, c) => {
          for (let k = 0; k < 90; k++) {
            const life = (t * 0.06 + hash(k * 7 + 5)) % 1;
            const px2 = x + w / 2 + (hash(k * 7 + 3) - 0.5) * (4 + life * 6) + life * life * 26, py = y + 6 - life * 58;
            const s = 3 + Math.floor(life * 4);
            c.globalAlpha = 0.85 * (1 - life * 0.8); f(px2, py, s, s, k % 3 ? "#5a5458" : life < 0.25 ? "#7a6058" : "#8a8488"); c.globalAlpha = 1;
          }
        } }); }
      // me getting my head shaved on a summit, in a lightning storm: big rock, wind, hair flying off into the valley
      { const y = y0 + 124, x = Math.max(2, Math.min(free(y, 44, 50, "l"), 30, Math.floor(room(y - 8, 56).lo - 6 - 52)));
        // the summit block: jagged granite, lit from the left, cracks, a little snow in the seams
        for (let yy = 0; yy < 26; yy++) {
          const l = Math.round(4 - Math.sin(yy / 3) * 2 + Math.max(0, 6 - yy) * 1.2), r = Math.round(46 - Math.max(0, 8 - yy) * 1.4 + Math.sin(yy / 4) * 2);
          const rr = Math.min(r, Math.floor(room(y + 22 + yy, 0).lo - 6) - x);
          for (let xx = l; xx < rr; xx++) px(x + xx, y + 22 + yy, 1, 1, xx < l + 3 ? "#a8aeb8" : xx > r - 6 ? "#4a4f58" : (xx * 3 + yy * 5) % 13 === 0 ? "#5a5f68" : yy < 3 ? "#9aa0aa" : "#757a84");
        }
        for (const [cx2, cy2, len] of [[14, 26, 9], [30, 28, 12], [22, 36, 7]]) for (let k = 0; k < len; k++) px(x + cx2 + Math.round(Math.sin(k) * 1), y + cy2 + k, 1, 1, "#3a3e46");
        px(x + 9, y + 31, 3, 1, "#e8eef4"); px(x + 36, y + 27, 2, 1, "#e8eef4");
        // the camp chair
        px(x + 9, y + 15, 12, 2, "#2a5a9a"); px(x + 9, y + 17, 1, 5, "#5a5a5a"); px(x + 20, y + 17, 1, 5, "#5a5a5a"); px(x + 8, y + 7, 2, 9, "#2a5a9a");
        // me: grey suit, open white shirt, no tie, half the hair gone, a cape of hair on my shoulders
        const SK = "#f0c8a0";
        px(x + 11, y + 1, 7, 7, SK); px(x + 11, y, 3, 2, "#c8a888"); px(x + 14, y - 1, 4, 3, "#4a2e1a"); px(x + 16, y + 1, 2, 4, "#4a2e1a"); px(x + 17, y, 1, 2, "#5a3a22");
        px(x + 12, y + 3, 1, 1, "#111"); px(x + 15, y + 3, 1, 1, "#111"); px(x + 13, y + 5, 2, 1, "#c87a6a"); px(x + 18, y + 3, 1, 2, SK);
        px(x + 9, y + 8, 11, 8, "#8a8f99"); px(x + 13, y + 8, 3, 6, "#f2f2f2"); px(x + 14, y + 8, 1, 2, SK); px(x + 9, y + 8, 2, 7, "#7a7f89"); px(x + 18, y + 8, 2, 7, "#7a7f89");
        px(x + 10, y + 8, 9, 1, "#4a2e1a"); px(x + 11, y + 9, 1, 1, "#4a2e1a"); px(x + 17, y + 9, 1, 1, "#4a2e1a");
        px(x + 7, y + 11, 3, 2, SK); px(x + 19, y + 11, 3, 2, SK);
        px(x + 10, y + 16, 9, 3, "#7a7f89"); px(x + 10, y + 19, 3, 4, "#6a6f79"); px(x + 16, y + 19, 3, 4, "#6a6f79"); px(x + 9, y + 23, 4, 1, "#111"); px(x + 16, y + 23, 4, 1, "#111");
        // Jason behind me: green Cummins tee, jeans, the clippers at my head
        const jx = x + 24;
        px(jx + 1, y - 8, 6, 2, "#5a3a1a"); px(jx, y - 6, 8, 6, SK); px(jx, y - 6, 1, 3, "#5a3a1a"); px(jx + 2, y - 4, 1, 1, "#111"); px(jx + 5, y - 4, 1, 1, "#111"); px(jx + 3, y - 2, 2, 1, "#a86a5a");
        px(jx - 4, y, 16, 11, "#2f8a3a"); px(jx - 4, y, 16, 1, "#3faa4a");
        // CUMMINS across his chest: drawn crisp on its own little hi-res canvas so it reads
        hd.push({ x: jx - 4, y: y + 2, w: 16, h: 5, res: 16, draw: (g, w, h) => {
          g.clearRect(0, 0, w, h);
          g.fillStyle = "#c8202a"; g.fillRect(w * 0.02, h * 0.08, h * 0.84, h * 0.84);
          g.fillStyle = "#ffffff"; g.font = `900 ${Math.round(h * 0.8)}px Arial, Helvetica, sans-serif`; g.textBaseline = "middle";
          g.fillText("C", w * 0.02 + h * 0.14, h * 0.54);
          const s2 = "CUMMINS", room2 = w - h * 1.0; let fs = h * 0.78; g.font = `900 ${fs}px Arial, Helvetica, sans-serif`;
          const mw = g.measureText(s2).width; if (mw > room2) { fs *= room2 / mw; g.font = `900 ${fs}px Arial, Helvetica, sans-serif`; }
          g.fillText(s2, h * 0.98, h * 0.54);
        } });
        px(jx - 6, y + 2, 6, 2, SK); px(jx - 8, y + 1, 3, 3, "#c8c8d0"); px(jx - 8, y + 1, 3, 1, "#9a9aa8");
        px(jx + 12, y + 2, 2, 7, SK);
        px(jx, y + 11, 3, 11, "#3a4a6a"); px(jx + 5, y + 11, 3, 11, "#3a4a6a"); px(jx - 1, y + 22, 4, 1, "#3a2a1a"); px(jx + 5, y + 22, 4, 1, "#3a2a1a");
        // the storm: three strikes, hard rain on the slant, wind, my hair tearing off the summit
        live.push({ k: "bolt", x: x + 6, y: y0 + 96, y1: y + 18 });
        live.push({ k: "fn", fn: (f, t, c) => {
          for (const [bx2, off, y1] of [[x + 40, 1.3, y - 4], [x + 52, 2.4, y + 10]] as const) {
            const u2 = ((t + off) % 3.9) / 3.9;
            if (u2 < 0.07) { let lx = bx2; for (let yy = y0 + 92; yy < y1; yy++) { if (yy % 3 === 0) lx += hash(yy * 17 + Math.floor((t + off) / 3.9)) > 0.5 ? 1 : -1; f(lx, yy, 1, 1, "#ffffff"); f(lx + 1, yy, 1, 1, "#c8d8ff"); }
              c.globalAlpha = 0.18; f(0, y0 + 90, W, 80, "#e8f0ff"); c.globalAlpha = 1; }
          }
          c.globalAlpha = 0.55;
          for (let k = 0; k < 46; k++) { const p2 = (t * 46 + hash(k * 3) * 60) % 60, rx = x - 10 + hash(k) * 70 + p2 * 0.5, ry = y0 + 96 + p2; f(rx, ry, 1, 2, "#b8c8e8"); }
          c.globalAlpha = 1;
          for (let k = 0; k < 5; k++) { const p2 = (t * 0.9 + k / 5) % 1; c.globalAlpha = 0.5 * (1 - p2); f(x - 6 + p2 * 70, y - 6 + k * 6, 6, 1, "#e8eef8"); c.globalAlpha = 1; }
          for (let k = 0; k < 12; k++) { const p2 = (t * 0.55 + hash(k * 5)) % 1, hx = x + 15 + p2 * 44 + Math.sin(t * 9 + k) * 1.5, hy = y + 1 + Math.sin(p2 * 7 + k) * 4 - p2 * 6;
            f(hx, hy, 1 + (k % 2), 1, k % 3 ? "#4a2e1a" : "#6a4a2a"); }
          const buzz = Math.floor(t * 30) % 2; f(x + 16 + buzz, y + 1, 1, 1, "#e8e8f0");
        } }); }
      // an alpine lake at the bottom, glinting, and elk in the meadow across the road
      { const y = y0 + 258, x = 3, w = Math.min(44, Math.floor(room(y, 30).lo - 9) - x - 14);
        for (let r = 0; r < 28; r++) { const ww = Math.round(Math.sqrt(1 - ((r - 14) / 14) ** 2) * w / 2); px(x + w / 2 - ww, y + r, 2 * ww, 1, r < 3 ? "#5f9fe0" : "#2f6fb0"); }
        for (const k of [0.2, 0.5, 0.8]) pine(px, x + w * k, y - 6, "#1f5a2a");
        live.push({ k: "glint", x: x + 4, y: y + 4, w: w - 8, h: 20 });
        // at the water's edge: Glacier hoodie, a glass ball held up with the whole lake upside down in it
        const gx = x + w + 2, gy = y + 4;
        px(gx + 1, gy, 4, 2, "#8a6a3a"); px(gx, gy + 1, 1, 4, "#8a6a3a"); px(gx + 1, gy + 2, 4, 4, "#f0c8a0"); px(gx + 2, gy + 3, 1, 1, "#111"); px(gx + 4, gy + 3, 1, 1, "#111");
        px(gx, gy + 6, 6, 8, "#3a6a5a"); px(gx + 1, gy + 8, 4, 1, "#e8f2ee"); px(gx, gy + 14, 2, 5, "#2a2a3a"); px(gx + 4, gy + 14, 2, 5, "#2a2a3a");
        px(gx + 6, gy + 8, 2, 2, "#f0c8a0");
        disc(px, gx + 9, gy + 7, 2, "#d8ecf8"); px(gx + 8, gy + 8, 3, 1, "#3a6a8a"); px(gx + 8, gy + 6, 3, 1, "#3f7a3a"); px(gx + 8, gy + 6, 1, 1, "#ffffff");
        { const HY = HOLDS[HI.lake].y;
          STAND[HI.lake] = gx < roadX(HY) ? { side: -1, x: gx + 11 } : { side: 1, x: gx - 1 };
          says.push({ a: gy - 96, b: gy - 64, who: "us", text: "“What's your favorite song?”" },
            { a: gy - 64, b: HY + 1, who: "them", text: "“I always say Toto by Africa.”", hold: HI.lake, u0: 0, u1: 0.5 },
            { a: HY - 1, b: HY + 1, who: "them", text: "“It's a glass ball, I got it on Amazon.”", hold: HI.lake, u0: 0.5, u1: 1.01 }); } }
      { const y = y0 + 230, x = Math.max(free(y, 20, 40, "r"), 70);
        for (let k = 0; k < 5; k++) { const ex = x + k * 8, ey = y + (k % 2) * 6 + (k > 2 ? 8 : 0); if (ex + 7 > W) break;
          px(ex + 1, ey + 2, 5, 3, "#8a5a32"); px(ex + 5, ey + 1, 2, 2, "#6a4022"); px(ex + 1, ey + 2, 1, 2, "#e8d8b8");
          px(ex + 1, ey + 5, 1, 2, "#3a2a1a"); px(ex + 5, ey + 5, 1, 2, "#3a2a1a"); if (k % 2 === 0) { px(ex + 5, ey - 2, 1, 3, "#c8b090"); px(ex + 7, ey - 2, 1, 3, "#c8b090"); px(ex + 4, ey - 2, 1, 1, "#c8b090"); } } }
    },
  },
  denver: {
    ground: ["#5a5e66", "#666a72"],
    under: ({ px, y0, h }) => {
      // the Cherry Creek greenway: grass, trees and a path running right alongside the highway
      for (let y = y0; y < y0 + h; y++) {
        const x = Math.round(roadX(y)) + 8;
        px(x, y, 14, 1, "#4f9a4a"); px(x + 5, y, 3, 1, "#d8d0c0"); px(x + 10, y, 2, 1, "#3a8fc0");
        if (y % 9 === 0) { px(x + 1, y - 1, 3, 3, "#2f7a2a"); px(x + 12, y + 3, 2, 2, "#2f7a2a"); }
      }
    },
    draw: ({ px, y0, h, rnd, live, says }) => {
      const gx = (y: number) => Math.round(roadX(y)) + 8;
      // downtown blocks on both sides, kept off the road and the greenway
      for (let yy = y0 + 2; yy < y0 + h - 4; yy += 14) {
        const r = room(yy, 12);
        for (let xx = 1; xx + 7 < r.lo - 6; xx += 8) bldg(px, xx, yy, 7, 11 + Math.floor(rnd() * 2), ["#8a8f99", "#7a808a", "#9aa0aa", "#6a8aa8", "#a8705a"][Math.floor(rnd() * 5)], "#dfe6ee", rnd);
        for (let xx = Math.ceil(r.hi + 6 + 18); xx + 7 <= W - 1; xx += 8) bldg(px, xx, yy, 7, 11 + Math.floor(rnd() * 2), ["#8a8f99", "#7a808a", "#9aa0aa", "#a8705a"][Math.floor(rnd() * 4)], "#dfe6ee", rnd);
      }
      // Union Station, the red neon
      { const y = y0 + 16, x = Math.max(2, Math.min(free(y, 26, 40, "l"), 40));
        px(x - 1, y - 1, 42, 26, "#5a5e66");
        px(x, y + 8, 40, 14, "#d8b890"); px(x, y + 8, 40, 1, "#a88a68"); for (let k = 2; k < 40; k += 5) { px(x + k, y + 12, 3, 6, "#5a7a9a"); px(x + k + 1, y + 11, 1, 1, "#5a7a9a"); }
        px(x + 16, y + 4, 8, 4, "#d8b890"); px(x + 18, y + 5, 4, 2, "#f2f2f2");
        px(x + 6, y, 28, 11, "#1a1a1a"); T(px, x + 10, y, "UNION", "#ff3b3b"); T(px, x + 7, y + 6, "STATION", "#ff3b3b"); px(x + 7, y + 12, 1, 1, "#d8b890");
      }
      // the big blue bear, nose to the convention center glass
      { const y = y0 + 98, x = Math.max(2, Math.min(free(y, 30, 30, "l"), 30));
        px(x - 1, y - 1, 32, 30, "#5a5e66"); px(x + 14, y, 16, 28, "#9ac0d8"); for (let k = 0; k < 28; k += 3) px(x + 14, y + k, 16, 1, "#7aa0c0");
        px(x + 2, y + 8, 10, 14, "#3a6fd8"); px(x + 4, y + 2, 8, 7, "#3a6fd8"); px(x + 11, y + 4, 3, 3, "#3a6fd8"); px(x + 4, y + 1, 2, 2, "#2a5ab8"); px(x + 9, y + 1, 2, 2, "#2a5ab8");
        px(x + 10, y + 4, 1, 1, "#111"); px(x + 13, y + 5, 1, 1, "#111"); px(x + 12, y + 9, 2, 6, "#3a6fd8"); px(x + 3, y + 22, 3, 6, "#3a6fd8"); px(x + 8, y + 22, 3, 6, "#3a6fd8");
        px(x + 3, y + 10, 2, 8, "#5a8ae8"); }
      // Coors Field across the way
      { const y = y0 + 118, x = Math.max(free(y, 42, 44, "r"), Math.ceil(room(y, 42).hi + 24));
        if (x + 30 < W) {
          const w = Math.min(44, W - 1 - x);
          px(x, y, w, 40, "#3a3a44"); px(x + 2, y + 2, w - 4, 36, "#3a8a3a");
          for (let r = 0; r < 12; r++) px(x + w / 2 - r, y + 26 - r, 2 * r + 1, 1, r % 2 ? "#c8864a" : "#b87a40");
          for (let r = 0; r < 7; r++) px(x + w / 2 - r, y + 24 - r, 2 * r + 1, 1, "#3a9a3a");
          for (const [dx, dy] of [[0, 1], [7, -6], [0, -13], [-7, -6]]) px(x + w / 2 + dx, y + 26 + dy - 1, 2, 2, "#f2f2f2");
          for (let k = 0; k < 40; k++) px(x + 1 + Math.floor(rnd() * (w - 2)), y + 1 + (k % 2) * 37, 1, 1, ["#e0302f", "#f2f2f2", "#5a3a8a"][k % 3]);
          flag(px, live, x + 2, y - 10, 10, 8, 5);
        } }
      // walkers and bikes up and down the greenway
      live.push({ k: "fn", fn: (f, t) => {
        for (let k = 0; k < 7; k++) {
          const span = h - 4, dir = k % 2 ? 1 : -1, p = (t * (k < 3 ? 12 : 4) + k * 31) % span, y = y0 + 2 + (dir > 0 ? p : span - p), x = gx(y) + 5 + (k % 2);
          if (k < 3) { f(x, y, 1, 4, "#1a1a1a"); f(x, y + 1, 1, 2, ["#ffd23f", "#e0302f", "#2faa4a"][k]); }
          else { f(x, y, 1, 1, "#3a2a1a"); f(x, y + 1, 1, 2, ["#ff5ad1", "#3a6fd8", "#f2f2f2", "#ff8a1f"][k - 3]); }
        }
      } });
      // a guy on the greenway with the question for all of America
      { const yy = y0 + 66; person(px, gx(yy) + 13, yy, "#c8302a", "#1a1a1a", "#2a2a3a", "#8a5a3a");
        says.push({ a: yy - 40, b: yy + 20, who: "them", text: "“Why ain't we free anymore?”" }); }
    },
  },
};
