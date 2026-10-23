// The Tulsa jump scare: the van parks at the Center of the Universe, everything goes quiet,
// then a pale face snaps up at the glass. Drawn as chunky 32x32 pixels on its own canvas;
// RoadRail pops it in (and shakes it) with CSS.

const FACE = [
  "..........aaaaaaaaaaaa..........",
  ".......aaabbbbbbbbbbbbaaa.......",
  ".....aabbbbbbbbbbbbbbbbbbaa.....",
  "....abbbbbbbbbbbbbbbbbbbbbba....",
  "...abbbbbbbbbbbbbbbbbbbbbbbba...",
  "..abbbbbbbbbbbbbbbbbbbbbbbbbba..",
  "..abbbbbbbbbbbbbbbbbbbbbbbbbba..",
  ".abbbbbccccbbbbbbbbbbccccbbbbba.",
  ".abbbbccccccbbbbbbbbccccccbbbba.",
  ".abbbccddddccbbbbbbccddddccbbba.",
  "abbbbcdddddddcbbbbcdddddddcbbbba",
  "abbbbcddeedddcbbbbcdddeeddcbbbba",
  "abbbbcddeedddcbbbbcdddeeddcbbbba",
  "abbbbcdddddddcbbbbcdddddddcbbbba",
  "abbbbbcdddddcbbbbbbcdddddcbbbbba",
  "abbbbbbcccccbbbbbbbbcccccbbbbbba",
  "abbbbbbbbbbbbbccccbbbbbbbbbbbbba",
  "abbbbbbbbbbbbccddccbbbbbbbbbbbba",
  ".abbbbbbbbbbbcddddcbbbbbbbbbbba.",
  ".abbbbbbbbbbbbccccbbbbbbbbbbbba.",
  ".abbbbbbbbbbbbbbbbbbbbbbbbbbbba.",
  "..abbbbbccccccccccccccccbbbbba..",
  "..abbbbcdddddddddddddddddcbbba..",
  "...abbcdfdfdfdfdfdfdfdfddcbba...",
  "...abbcddddddddddddddddddcbba...",
  "....abcdfdfdfdfdfdfdfdfddcba....",
  ".....abccccccccccccccccccba.....",
  "......abbbbbbbbbbbbbbbbbba......",
  ".......aabbbbbbbbbbbbbbaa.......",
  ".........aaabbbbbbbbaaa.........",
  "............aaaaaaaa............",
  "................................",
];
const PAL: Record<string, string> = { a: "#5a5a6a", b: "#e8e8f0", c: "#8a8a9a", d: "#0a0a10", e: "#ff2a2a", f: "#f2f2e8" };

export function drawScare(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const s = Math.floor(Math.min(w, h) / 32);
  ctx.clearRect(0, 0, w, h);
  const jit = Math.floor(t * 30) % 3 - 1;                      // a little twitch
  FACE.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === ".") return;
    let c = PAL[ch];
    if (ch === "e" && Math.floor(t * 8) % 5 === 0) c = "#ffffff";  // the eyes flare
    ctx.fillStyle = c; ctx.fillRect(x * s + jit, y * s, s, s);
  }));
}
