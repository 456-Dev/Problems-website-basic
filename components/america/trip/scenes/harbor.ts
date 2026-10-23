// harbor scenes
import { W, MID, Y0, SCENES, HT, ROAD_END, TRAIL, DRIVE, HOLDS, roadX, vanX, room, free, beside, roomiest, hash, harborAt, top, bottom, at } from "../core";
import { HARBOR } from "../../harbor";
import type { SceneMod, Ctx, Px, Edge } from "../kit";
import { palm, pine, peak, bldg, stars, river, person, cowboy, fields, pivot, shade, smokies, windmill, turbine, word, wordW, GLYPH, pick,
  ePine, ePalm, eCactus, eHay, eTree, eDogwood, eHouse, eRock, eCow, eSunflower, eOwl } from "../kit";
import { PRIDE } from "../fx";

export const SC_HARBOR: Partial<Record<string, SceneMod>> = {
  clouds: {
    ground: ["#4f7a3a", "#456b33"],
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      live.push({ k: "clouds", y: y0, h });
    },
  },
  harbor: {
    ground: ["#2f6fb0", "#3a7cbc"],
    under: ({ ctx, px, y0, h, rnd, live }) => {

    const C: Record<string, string> = { ".": "#2f6fb0", j: "#9a9a88", s: "#4fb03a", m: "#8a8f99", b: "#a8907a" };
    for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
      const c = harborAt(x, y0 + y); px(x, y0 + y, 1, 1, C[c]);
      if (c === "m" && (x * 7 + y * 3) % 4 === 0) px(x, y0 + y, 1, 1, "#d8dce4");
      if (c === "b" && (x * 5 + y * 3) % 5 === 0) px(x, y0 + y, 1, 1, "#7a5a4a");
      if (c === "j" && (x * 5 + y * 3) % 7 === 0) px(x, y0 + y, 1, 1, "#7a8a6a");
      if (c === "." && (x * 13 + y * 7) % 23 === 0) px(x, y0 + y, 2, 1, "#5f9fe0");
    }
    },
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      const [lx, ly] = HARBOR.liberty, sx = lx, sy = y0 + ly;
      px(sx - 1, sy, 3, 2, "#7a6a5a"); px(sx, sy - 6, 1, 6, "#5fae96"); px(sx + 1, sy - 8, 1, 3, "#5fae96"); px(sx + 1, sy - 9, 1, 1, "#ffd23f");
      live.push({ k: "ferry", x0: HARBOR.george[0] + 2, y0: y0 + HARBOR.george[1], x1: HARBOR.battery[0] - 1, y1: y0 + HARBOR.battery[1] + 2 });
    },
  },
};
