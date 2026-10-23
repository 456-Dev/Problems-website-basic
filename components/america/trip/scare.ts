// The Tulsa jump scare: the van parks at the Center of the Universe, everything goes quiet,
// then the Golden Driller's giant gold face slams up at the glass, hollow eyes burning red,
// mouth wide open. Chunky 32x32 pixels on its own canvas; RoadRail pops it in (and shakes it) with CSS.

type G = (string | null)[][];
const N = 32;

function face(): G {
  const g: G = Array.from({ length: N }, () => Array(N).fill(null));
  const set = (x: number, y: number, c: string) => { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
  const ell = (cx: number, cy: number, rx: number, ry: number, c: string, f = (_x: number, _y: number) => true) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && f(x, y)) set(x, y, c);
  };
  // the face: wide at the cheekbones, a heavy jaw
  for (let y = 9; y < 31; y++) {
    const half = y < 24 ? 10 : 10 - Math.round((y - 23) * 1.1);
    for (let x = 16 - half; x < 16 + half; x++) set(x, y, "g");
  }
  for (let y = 10; y < 31; y++) for (let x = 0; x < N; x++) if (g[y][x] && (!g[y][x - 2] || !g[y][x + 2])) set(x, y, "G");   // shadow down the sides
  for (let x = 6; x < 26; x++) { set(x, 10, "G"); set(x, 11, "G"); }                                       // brow shadow
  // the hard hat: dome, ridge, brim
  ell(16, 8, 11, 7, "h", (_x, y) => y <= 8);
  for (let y = 2; y <= 8; y++) { set(15, y, "H"); set(16, y, "H"); }
  for (let y = 3; y <= 6; y++) set(10, y, "L");
  for (let x = 2; x < 30; x++) { set(x, 9, "H"); set(x, 10, x < 4 || x > 27 ? "H" : g[10][x] ?? "H"); }
  // hollow eyes, red light at the bottom of them
  ell(10.5, 15.5, 4, 3.4, "G"); ell(21.5, 15.5, 4, 3.4, "G");
  ell(10.5, 15, 3.4, 3, "d"); ell(21.5, 15, 3.4, 3, "d");
  set(11, 16, "e"); set(10, 16, "e"); set(21, 16, "e"); set(22, 16, "e");
  for (let k = 0; k < 5; k++) { set(7 + k, 11 + Math.floor(k / 2), "a"); set(24 - k, 11 + Math.floor(k / 2), "a"); }   // angry brows
  // nose
  for (let y = 16; y < 21; y++) { set(16, y, "G"); } set(15, 20, "G"); set(17, 20, "G");
  // the mouth, wide open
  ell(16, 25, 5, 4.4, "m"); ell(16, 25.8, 3.4, 3.2, "d");
  for (let x = 12; x <= 20; x += 2) set(x, 22, "w"); for (let x = 13; x <= 19; x += 2) set(x, 28, "w");
  // dark outline around everything
  const out: [number, number][] = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy]?.[x + dx])) out.push([x, y]);
  out.forEach(([x, y]) => set(x, y, "a"));
  return g;
}
const GRID = face();
const PAL: Record<string, string> = { a: "#2a1a04", g: "#e8b830", G: "#a87a14", h: "#ffd23f", H: "#c8961a", L: "#fff2a0", d: "#0a0a10", e: "#ff2a2a", m: "#5a0a0a", w: "#f2f2e8" };

export function drawScare(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const s = Math.floor(Math.min(w, h) / N);
  ctx.clearRect(0, 0, w, h);
  const jit = (Math.floor(t * 30) % 3) - 1;                     // a little twitch
  const flare = Math.floor(t * 8) % 7 === 3;
  GRID.forEach((row, y) => row.forEach((ch, x) => {
    if (!ch) return;
    ctx.fillStyle = ch === "e" && flare ? "#ffffff" : PAL[ch];
    ctx.fillRect(x * s + jit, y * s, s, s);
  }));
}
