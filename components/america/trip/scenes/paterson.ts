// paterson scenes
import { W, MID, Y0, SCENES, HT, ROAD_END, TRAIL, DRIVE, HOLDS, roadX, vanX, room, free, beside, roomiest, hash, harborAt, top, bottom, at } from "../core";
import { HARBOR } from "../../harbor";
import type { SceneMod, Ctx, Px, Edge } from "../kit";
import { palm, pine, peak, bldg, stars, river, person, cowboy, fields, pivot, shade, smokies, windmill, turbine, word, wordW, GLYPH, pick,
  ePine, ePalm, eCactus, eHay, eTree, eDogwood, eHouse, eRock, eCow, eSunflower, eOwl } from "../kit";
import { PRIDE } from "../fx";

export const SC_PATERSON: Partial<Record<string, SceneMod>> = {
  jersey: {
    ground: ["#4f7a3a", "#456b33"],
    edge: pick(eTree, eHouse),
    // Paterson's Great Falls, as big as we can make them, then the food market
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = roomiest(y0 + 2, y0 + 8, 46); x = free(y, 46, 26);
      px(x, y, 26, 6, "#3a7ac0");                                                               // the Passaic, sliding up to the edge
      for (let k = 0; k < 5; k++) px(x + 2 + k * 5, y + 1 + (k % 3), 3, 1, "#7ab8e8");
      for (let yy = y + 6; yy < y + 34; yy++) {                                                  // jagged basalt walls of the gorge
        const wl = 3 + Math.round(2 * Math.sin(yy * 0.7) + hash(yy) * 2), wr = 3 + Math.round(2 * Math.cos(yy * 0.5) + hash(yy + 99) * 2);
        px(x, yy, wl, 1, "#2a2824"); px(x + 26 - wr, yy, wr, 1, "#2a2824");
        if (yy % 3 === 0) { px(x + 1, yy, 1, 1, "#4a4640"); px(x + 24, yy, 1, 1, "#4a4640"); }
        px(x + wl, yy, 26 - wl - wr, 1, "#5aa0d8");
      }
      px(x + 1, y + 5, 24, 2, "#1f1d1a"); px(x + 3, y + 5, 20, 1, "#e8f6ff");                      // the lip, white where it pours over
      live.push({ k: "falls", x: x + 5, y: y + 7, w: 16, h: 25 });
      px(x, y + 34, 26, 8, "#2f6fb0"); px(x + 3, y + 34, 20, 2, "#f2fbff"); px(x + 1, y + 37, 8, 1, "#9ad0f0"); px(x + 15, y + 39, 9, 1, "#9ad0f0");
      for (let k = 0; k < 6; k++) for (let a2 = 0; a2 < 20; a2++) {                             // a rainbow across the spray
        const th = Math.PI * (0.1 + 0.8 * a2 / 19), cx = x + 13, cy = y + 34;
        px(cx + Math.round((12 - k) * Math.cos(th)), cy - Math.round((10 - k) * Math.sin(th)), 1, 1, PRIDE[k]);
      }
      y = y0 + 64; x = free(y, 30, 24);
      for (let k = 0; k < 3; k++) {
        const sx2 = x + k * 8, c = ["#e0302f", "#2faa4a", "#3a6fd8"][k];
        for (let s2 = 0; s2 < 7; s2++) px(sx2 + s2, y, 1, 3, s2 % 2 ? c : "#f2f2f2");
        px(sx2, y + 3, 1, 6, "#8a6a42"); px(sx2 + 6, y + 3, 1, 6, "#8a6a42"); px(sx2, y + 7, 7, 2, "#a8743e");
        for (let s2 = 0; s2 < 3; s2++) px(sx2 + 1 + s2 * 2, y + 6, 1, 1, ["#ff8a1f", "#e0302f", "#ffd23f", "#2faa4a", "#b04ad8"][(k + s2) % 5]);
      }
      for (let k = 0; k < 4; k++) person(px, x + 1 + k * 6, y + 12 + (k % 2) * 3, ["#ffd23f", "#e0302f", "#f2f2f2", "#b04ad8"][k], ["#1a1a1a", "#5a3a1a", "#e8e8e8", "#1a1a1a"][k]);
    },
  },
};
