// Jason and me in 8-bit, out of the van for an interview: me with the mic, Jason with the camera
// on his shoulder in his green CUMMINS tee. Drawn on the live layer in map pixels.

type F = (x: number, y: number, w: number, h: number, c: string) => void;

const PAL: Record<string, string> = {
  h: "#4a2e1a", j: "#5a3a1a", s: "#f0c8a0", e: "#111111", b: "#5a3a22", m: "#c87a6a",
  w: "#f2f2f2", W: "#cfcfcf", g: "#2f8a3a", G: "#1f6a2a", r: "#c8202a", p: "#3a5a8a", P: "#2a4470",
  k: "#111111", K: "#3a3a3a", l: "#6a9ad8", o: "#000000",
};
// me: messy brown hair, beard, white tee, jeans, the mic held out (to the right)
const ME = [
  "..ohhho......",
  ".ohhhhho.....",
  ".ohssssho....",
  ".ossesso.....",
  ".osssssso....",
  ".obbmbbo.....",
  "..obbbo......",
  ".owwwwwo.....",
  "owwwwwwwsso..",
  "owwwwwwwo.kKo",
  "osowwwwo..ko.",
  "oso.ppo......",
  "..oppPpo.....",
  "..opo.opo....",
  "..opo.opo....",
  "..oko.oko....",
];
// Jason: brown hair, green CUMMINS tee, the camera up on his right shoulder (lens to the right)
const JASON = [
  "...ojjjo.....",
  "..ojjjjjo....",
  "..ossssso....",
  "..osesesokkkk",
  "..osssssokkKl",
  "...osmso.kkkk",
  "..oggggggso..",
  ".oggrgggo....",
  ".oggrrggo....",
  ".oggggggo....",
  ".osoggggoso..",
  "...oppppo....",
  "...oppPpo....",
  "...opo.opo...",
  "...opo.opo...",
  "...oko.oko...",
];

function sprite(f: F, art: string[], x: number, y: number, flip: boolean, step: number) {
  const n = art[0].length;
  art.forEach((row, r) => {
    // walking: the legs scissor (one leg's rows lift a pixel each step)
    const lift = step && r >= art.length - 4 ? (step > 0 ? 1 : 0) : 0;
    for (let c = 0; c < n; c++) {
      const ch = row[c]; if (ch === "." || !PAL[ch]) continue;
      if (lift && c >= n / 2 - 2 && c < n / 2 + 1 && r === art.length - 1) continue;
      f(x + (flip ? n - 1 - c : c), y + r, 1, 1, PAL[ch]);
    }
  });
}

// out = 0..1 how far out of the van we are; side = +1 we get out to the map's right; van at (vx, vy)
export function drawUs(f: F, t: number, vx: number, vy: number, out: number, side: number) {
  if (out <= 0.02) return;
  const walk = Math.min(1, Math.max(0, (out - 0.1) / 0.6));
  const moving = walk > 0 && walk < 1;
  const step = moving ? (Math.floor(t * 6) % 2 ? 1 : -1) : 0;
  const flip = side < 0;                          // face away from the van, toward whoever we're talking to
  const door = vx + side * 4;
  // me from the passenger door, out ahead; Jason round the back, a step behind me, filming
  const mx = door + side * (2 + 11 * walk) - (flip ? 13 : 0), my = vy - 12 + walk * 3;
  const jx = door + side * (2 + 3 * walk) - (flip ? 13 : 0), jy = vy - 6 + walk * 8;
  if (walk < 0.15) return;                        // still climbing out
  // shadows
  for (const [x, y] of [[mx, my], [jx, jy]]) { f(x + 2, y + 16, 8, 1, "rgba(0,0,0,.25)"); }
  sprite(f, JASON, Math.round(jx), Math.round(jy), flip, step);
  sprite(f, ME, Math.round(mx), Math.round(my), flip, -step);
}
