// Draws the 8-bit road trip strip: a little landscape per stop, top (LA) to bottom
// (Staten Island), with a highway winding through all of it. Pure canvas, no assets.
// Layout lives in trip/core.ts, sprites in trip/kit.ts, motion in trip/fx.ts, and each
// stretch of the country in trip/scenes/*. drawStrip = the still map (it also collects the
// moving bits, the hi-res overlays and what sits above the van), drawLive = the moving bits.

import { W, HT, SCENES, Y0, ROAD_END, TRAIL, DRIVE, roadX, vanX, room, harborAt, top, type Scene } from "./trip/core";
import type { Ctx, Fn, HD, Px, SceneMod } from "./trip/kit";
import type { Live } from "./trip/fx";
import { SC_WEST } from "./trip/scenes/west";
import { SC_MID } from "./trip/scenes/mid";
import { SC_EAST } from "./trip/scenes/east";
import { SC_PATERSON } from "./trip/scenes/paterson";
import { SC_HARBOR } from "./trip/scenes/harbor";

export { W, HT, ROAD_END, SCENES, SAYS, HOLDS, SCARE, sceneAt, roadX, vanX, vanAt, progressAt, holdAt } from "./trip/core";
export { drawLive, type Live } from "./trip/fx";
export type { HD, Fn } from "./trip/kit";

const MODS: Partial<Record<Scene, SceneMod>> = { ...SC_WEST, ...SC_MID, ...SC_EAST, ...SC_PATERSON, ...SC_HARBOR };

export type Strip = { live: Live[]; hd: HD[]; canopy: Fn[] };

// set globalThis.__tripOverlap = [] to collect landmark pixels that land on the road
export function drawStrip(ctx: CanvasRenderingContext2D): Strip {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const px: Px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const out: Strip = { live: [], hd: [], canopy: [] };
  const glows: [number, number, Fn[]][] = [];
  const mk = (i: number, p: Px, glow: Fn[]): Ctx => ({ ctx, px: p, y0: Y0[i], h: SCENES[i].h, rnd, live: out.live, hd: out.hd, canopy: out.canopy, glow });

  SCENES.forEach(({ sc, h }, i) => {
    const y0 = Y0[i], m = MODS[sc] ?? {};
    const [g1, g2] = m.ground ?? ["#4f8a3c", "#457a35"];
    px(0, y0, W, h, g1);
    for (let k = 0; k < h * 2.2; k++) px(Math.floor(rnd() * W), y0 + Math.floor(rnd() * h), 1, 1, g2);
    m.under?.(mk(i, px, []));
  });

  // side roads: dirt trail in the Smokies, the drive-thru lane
  for (let y = TRAIL.a; y < TRAIL.b; y++) px(vanX(y) - 2, y, 5, 1, "#7a5a36");
  for (let y = DRIVE.a; y < DRIVE.b; y++) { px(vanX(y) - 3, y, 7, 1, "#4a4a4e"); if (y % 6 < 3) px(vanX(y), y, 1, 1, "#e8e8e8"); }

  // the highway: asphalt, white edge lines, dashed yellow center; bridges over the harbor
  const HB = top("harbor");
  for (let y = 0; y < ROAD_END; y++) {
    const x = roadX(y);
    if (y >= HB && harborAt(x, y) === ".") { px(x - 6, y, 13, 1, "#9a9aa2"); px(x - 6, y, 1, 1, "#5a5a62"); px(x + 6, y, 1, 1, "#5a5a62"); }
    px(x - 4, y, 9, 1, "#3a3a3e");
    px(x - 5, y, 1, 1, "#5a5a5e"); px(x + 5, y, 1, 1, "#5a5a5e");
    px(x - 4, y, 1, 1, "#e8e8e8"); px(x + 4, y, 1, 1, "#e8e8e8");
    if (y % 6 < 3) px(x, y, 1, 1, "#ffd23f");
  }
  px(roadX(ROAD_END) - 5, ROAD_END, 11, 2, "#e0302f"); px(roadX(ROAD_END) - 4, ROAD_END + 2, 9, 1, "#f2f2f2");   // end of the road

  // landmarks last, beside the road
  const dbg = (globalThis as { __tripOverlap?: string[] }).__tripOverlap;
  SCENES.forEach(({ sc, h }, i) => {
    const y0 = Y0[i], m = MODS[sc] ?? {};
    const spx: Px = dbg ? (x, y, w, hh, c) => {
      for (let yy = Math.round(y); yy < Math.round(y) + hh; yy++) {
        const r = roadX(yy), v = vanX(yy), x0 = Math.round(x), x1 = x0 + w - 1;
        if (yy < ROAD_END && ((x1 >= r - 5 && x0 <= r + 5) || (v !== r && x1 >= v - 3 && x0 <= v + 3))) { dbg.push(`${sc}@${yy - y0}:${x0}-${x1} r${Math.round(r)} v${Math.round(v)}`); break; }
      }
      px(x, y, w, hh, c);
    } : px;
    if (m.edge) for (let k = 0; k < Math.floor(h / 7); k++) {
      const y = y0 + 4 + Math.floor(rnd() * (h - 14)), r = room(y, 9);
      const left = rnd() < 0.5, x = left ? 1 + Math.floor(rnd() * Math.max(1, r.lo - 18)) : Math.ceil(r.hi + 8 + rnd() * Math.max(1, W - 10 - r.hi - 8));
      if (left ? x + 8 < r.lo - 6 : x > r.hi + 6 && x + 8 < W) m.edge(spx, x, y);
    }
    const glow: Fn[] = [];
    m.draw?.(mk(i, spx, glow));
    if (m.night) glows.push([y0, h, glow]);
  });

  // night falls: tint those scenes dark, then switch their lights on
  for (const [y0, h, glow] of glows) {
    ctx.globalAlpha = 0.5; px(0, y0, W, h, "#0a0e2a"); ctx.globalAlpha = 1;
    glow.forEach((g) => g(px));
  }
  return out;
}

// things above the van: trees over the Smokies trail, Denver's walkway, the tunnel, bridges
export function drawCanopy(ctx: CanvasRenderingContext2D, canopy: Fn[]) {
  const f: Px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  canopy.forEach((c) => c(f));
}
