// mid scenes
import { W, MID, Y0, SCENES, HT, ROAD_END, TRAIL, DRIVE, HOLDS, roadX, vanX, room, free, beside, roomiest, hash, harborAt, top, bottom, at } from "../core";
import { HARBOR } from "../../harbor";
import type { SceneMod, Ctx, Px, Edge } from "../kit";
import { palm, pine, peak, bldg, stars, river, person, cowboy, fields, pivot, shade, smokies, windmill, turbine, word, wordW, GLYPH, pick,
  ePine, ePalm, eCactus, eHay, eTree, eDogwood, eHouse, eRock, eCow, eSunflower, eOwl } from "../kit";
import { PRIDE } from "../fx";
const KANSAS = ["#e8c040", "#7ac83a", "#d89a3a", "#4ab83a", "#f0d860", "#a8d84a", "#c87a3a"];

export const SC_MID: Partial<Record<string, SceneMod>> = {
  truckstop: {
    ground: ["#e8c040", "#d8ac30"],
    edge: pick(eCow, eSunflower),
    under: ({ ctx, px, y0, h, rnd, live }) => {
 fields(px, rnd, y0, h, KANSAS); pivot(px, 8, y0 + 64, 6); pivot(px, 56, y0 + 22, 7, "#5ac83a");
    },
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 4; x = free(y, 22, 22);
      px(x, y, 22, 3, "#2f8a4a"); px(x, y + 3, 22, 1, "#e0302f"); px(x + 3, y + 4, 1, 8, "#cfcfcf"); px(x + 18, y + 4, 1, 8, "#cfcfcf");
      for (const dx of [7, 13]) { px(x + dx, y + 7, 3, 5, "#e8e8e8"); px(x + dx + 1, y + 8, 1, 1, "#2faa4a"); }
      px(x + 1, y + 14, 9, 5, "#f2f2f2"); px(x + 10, y + 15, 4, 4, "#e0302f"); px(x + 12, y + 16, 2, 2, "#cfe8ff");
      for (const dx of [2, 6, 11]) px(x + dx, y + 19, 2, 2, "#111");
      y = y0 + 32; x = free(y, 22, 18);
      px(x + 1, y + 1, 16, 18, "#c8d8c8"); px(x + 1, y + 1, 16, 1, "#2f6a4a"); px(x + 3, y + 3, 4, 3, "#9ad0e8"); px(x + 11, y + 3, 4, 3, "#9ad0e8");
      px(x + 3, y + 8, 5, 10, "#2a1e16"); px(x + 2, y + 7, 7, 3, "#2a1e16"); px(x + 4, y + 6, 3, 1, "#2a1e16");
      px(x + 4, y + 8, 1, 1, "#e8c890"); px(x + 6, y + 8, 1, 1, "#e8c890"); px(x + 1, y + 10, 1, 6, "#2a1e16"); px(x + 9, y + 10, 1, 6, "#2a1e16");
      person(px, x + 12, y + 10, "#3a4a9a", "#8a5a2a");
      y = y0 + 58; x = free(y - 9, 26, 26);
      px(x + 12, y - 4, 1, 16, "#9a9a9a"); px(x + 7, y - 9, 11, 6, "#e0302f"); px(x + 8, y - 8, 9, 1, "#ffd23f"); px(x + 8, y - 6, 9, 1, "#ffd23f");
      for (let k = 0; k < 3; k++) eCow(px, x + k * 8, y + 6 + (k % 2) * 3);
    },
  },
  silo: {
    ground: ["#e8b838", "#d8a42c"],
    edge: pick(eSunflower, eHay),
    under: ({ ctx, px, y0, h, rnd, live }) => {
 fields(px, rnd, y0, h, KANSAS); pivot(px, 54, y0 + 66, 7);
    },
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 44; x = free(y, 26, 16);
      px(x + 2, y + 2, 5, 22, "#c8ccd2"); px(x + 2, y, 5, 2, "#9aa0a8"); px(x + 3, y - 1, 3, 1, "#9aa0a8");
      px(x + 8, y + 8, 5, 16, "#c8ccd2"); px(x + 8, y + 6, 5, 2, "#9aa0a8");
      y = y0 + 6; x = free(y - 6, 22, 18);
      px(x, y + 6, 18, 9, "#a8603a"); px(x, y + 5, 18, 1, "#e8e2d0"); px(x + 6, y + 2, 6, 3, "#e8e2d0"); px(x + 8, y + 1, 2, 1, "#e8e2d0");
      for (const dx of [2, 5, 12, 15]) px(x + dx, y + 8, 1, 3, "#f2e8b0");
      px(x + 8, y + 10, 2, 5, "#5a3a1a"); px(x + 7, y + 15, 4, 1, "#cfcfcf");
      px(x + 9, y - 6, 1, 7, "#cfcfcf"); px(x + 10, y - 6, 4, 2, "#3a3fa0"); px(x + 10, y - 4, 4, 1, "#e0302f");
      turbine(px, free(y0 + 22, 22, 12) + 6, y0 + 30);
    },
  },
  plains: {
    ground: ["#e8c040", "#d8ac30"],
    edge: pick(eSunflower, eHay),
    under: ({ ctx, px, y0, h, rnd, live }) => {
 fields(px, rnd, y0, h, KANSAS); pivot(px, 7, y0 + 80, 6, "#5ac83a");
    },
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 4; x = free(y, 24, 14);
      px(x + 6, y, 1, 3, "#f2f2f2"); px(x + 5, y + 1, 3, 1, "#f2f2f2");
      for (let r = 0; r < 6; r++) px(x + 6 - Math.floor(r / 2), y + 3 + r, 1 + 2 * Math.floor(r / 2), 1, "#d8d0c0");
      px(x + 4, y + 9, 5, 6, "#ece6d8"); px(x + 5, y + 10, 3, 2, "#3a6fd8"); px(x + 6, y + 10, 1, 2, "#e0302f");
      for (let r = 0; r < 3; r++) px(x + 6 - 3 - r, y + 15 + r, 7 + 2 * r, 1, "#7a2f1f");
      px(x + 1, y + 18, 11, 7, "#ece6d8"); px(x + 5, y + 21, 3, 4, "#7a2a1f"); px(x + 2, y + 20, 1, 2, "#8ab0d8"); px(x + 10, y + 20, 1, 2, "#8ab0d8");
      y = y0 + 34; x = free(y, 18, 18);
      px(x, y + 8, 18, 9, "#3a3a42"); px(x, y + 7, 18, 1, "#1a1a1a"); px(x + 8, y + 12, 3, 5, "#111");
      px(x + 1, y, 16, 7, "#ffd23f"); word(px, x + 3, y + 1, "XXX", "#e0302f", null);
      px(x + 2, y + 10, 4, 1, "#ff5ad1"); px(x + 13, y + 10, 4, 1, "#ff5ad1");
      x = free(y0 + 56, 26, 18); windmill(px, x + 4, y0 + 58); windmill(px, x + 14, y0 + 66);
    },
  },
  tulsa: {
    ground: ["#6aaa3a", "#5f9a34"],
    edge: pick(eTree, eCow),
    under: ({ ctx, px, y0, h, rnd, live }) => {
 for (let k = 0; k < 10; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * h); px(x, y, 7, 4, "#c8643a"); px(x + 1, y + 1, 5, 2, "#d8743a"); }
    },
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 3; x = free(y, 30, 16);
      px(x + 12, y, 1, 28, "#8a8a8a"); px(x + 14, y, 1, 28, "#8a8a8a");
      for (let yy = y; yy < y + 28; yy += 4) px(x + 12, yy, 3, 1, "#8a8a8a");
      px(x + 5, y + 4, 3, 3, "#e8b830"); px(x + 4, y + 3, 5, 1, "#c99a20");
      px(x + 4, y + 7, 5, 9, "#e8b830"); px(x + 9, y + 8, 3, 1, "#e8b830"); px(x + 3, y + 8, 1, 5, "#e8b830");
      px(x + 4, y + 16, 2, 10, "#d8a828"); px(x + 7, y + 16, 2, 10, "#d8a828"); px(x + 2, y + 26, 10, 2, "#9a9a9a");
      y = y0 + 40; x = free(y, 14, 16);
      for (const [r, c] of [[7, "#a8603a"], [5, "#c87a4a"], [3, "#a8603a"], [1, "#d8d0c0"]] as const)
        for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k) * 2) + 1; px(x + 8 - Math.floor(ww / 2), y + 7 + Math.round(k * 0.6), ww, 1, c); }
      person(px, x + 7, y, "#e0302f"); px(x + 11, y + 1, 1, 1, "#f2f2f2"); px(x + 12, y, 1, 1, "#f2f2f2"); px(x + 13, y + 2, 1, 1, "#f2f2f2"); px(x + 3, y + 1, 1, 1, "#f2f2f2");
      y = y0 + 58; x = free(y, 15, 19);
      px(x + 2, y + 3, 14, 8, "#5a3018"); px(x + 3, y + 4, 12, 6, "#1f7a3a");
      for (const [dx, dy] of [[3, 4], [14, 4], [3, 9], [14, 9], [8, 4], [8, 9]]) px(x + dx, y + dy, 1, 1, "#111");
      px(x + 6, y + 6, 1, 1, "#f2f2f2"); px(x + 10, y + 7, 1, 1, "#e0302f"); px(x + 11, y + 5, 1, 1, "#ffd23f"); px(x + 12, y + 7, 1, 1, "#3a6fd8");
      live.push({ k: "dogs", x: x + 1, y: y + 1, w: 16, h: 12 });
      y = y0 + 80; x = free(y, 22, 24);
      px(x, y + 12, 24, 10, "#3a3448"); px(x, y + 11, 24, 1, "#1a1624");
      for (let k = 0; k < 5; k++) px(x + 1 + k * 5, y + 14, 3, 3, k === 3 ? "#d8f05a" : "#1a1624");
      px(x + 2, y, 21, 11, "#1a1624"); word(px, x + 3, y + 1, "TRADE", "#d8f05a", null); word(px, x + 3, y + 6, "WINDS", "#8a7ab8", null);
      px(x + 18, y + 17, 3, 4, "#e8e8f0"); px(x + 18, y + 21, 1, 1, "#e8e8f0"); px(x + 20, y + 21, 1, 1, "#e8e8f0"); px(x + 19, y + 18, 1, 1, "#111");
      px(x + 1, y + 2, 2, 1, "#111"); px(x + 22, y + 13, 2, 1, "#111");
    },
  },
  oregon: {
    ground: ["#c8743a", "#b8652f"],
    edge: pick(eRock, eTree),
    under: ({ ctx, px, y0, h, rnd, live }) => {
 for (let k = 0; k < 14; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * h); px(x, y, 6, 3, "#5aa83a"); px(x + 1, y - 1, 4, 1, "#6ab84a"); }
    },
    // Muskogee: the old town is a film set; costumed extras, the crew, a journalist on the story
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 6;
      for (const [dx, w, c, f] of [[0, 7, "#8a5a32", "#a06a3a"], [8, 8, "#6a4a2a", "#9a6a3a"]] as const) {
        x = free(y - 1, 18, 16) + dx;
        px(x, y + 4, w, 12, c); px(x, y, w, 4, f); px(x, y - 1, w, 1, "#4a3018");
        px(x + 1, y + 1, w - 2, 2, "#e8d8a0"); px(x + Math.floor(w / 2) - 1, y + 11, 2, 5, "#2a1a0a");
        px(x + 1, y + 6, 2, 2, "#e8d080"); px(x, y + 9, w, 1, "#5a3a1a");
        px(x + w - 1, y + 2, 1, 14, "#c8b890");
      }
      x = free(y + 16, 4, 18);
      px(x, y + 16, 18, 4, "#e0b080");
      y = y0 + 30; x = free(y, 18, 18);
      live.push({ k: "walk", x0: x, x1: x + 15, y, shirt: "#6a2a4a", hat: "#3a2a1a", ph: 0 });
      live.push({ k: "walk", x0: x, x1: x + 15, y: y + 9, shirt: "#e8e0d0", hat: "#f2e8c8", ph: 7 });
      y = y0 + 52; x = free(y, 18, 24);
      px(x + 2, y + 2, 6, 4, "#1a1a1a"); px(x + 8, y + 3, 2, 2, "#3a3a3a"); px(x + 1, y, 3, 3, "#2a2a2a"); px(x + 5, y, 3, 3, "#2a2a2a");
      px(x + 4, y + 6, 1, 6, "#5a5a5a"); px(x + 2, y + 11, 5, 1, "#5a5a5a");
      px(x + 12, y + 1, 4, 3, "#f2f2d0"); px(x + 13, y + 4, 1, 8, "#5a5a5a"); px(x + 11, y + 11, 4, 1, "#5a5a5a");
      px(x + 17, y + 6, 5, 1, "#1a1a1a"); px(x + 17, y + 3, 1, 3, "#1a1a1a"); px(x + 17, y + 3, 5, 2, "#1a1a1a"); px(x + 18, y + 7, 1, 4, "#8a6a42"); px(x + 21, y + 7, 1, 4, "#8a6a42");
      px(x + 18, y + 2, 3, 1, "#f2f2f2");
      person(px, x + 8, y + 12, "#1a1a1a", "#1a1a1a");
      px(x + 13, y + 14, 6, 1, "#5a5a5a"); px(x + 18, y + 13, 2, 3, "#3a3a3a");
      y = y0 + 76; x = free(y, 12, 16);                                                         // the journalist: blazer, mic, notepad
      person(px, x + 2, y, "#c8302f", "#1a1a1a", "#1a1a2a", "#6a4028");
      px(x + 5, y + 3, 2, 1, "#6a4028"); px(x + 7, y + 2, 1, 2, "#3a3a3a"); px(x + 7, y + 1, 1, 1, "#1a1a1a"); px(x + 7, y + 4, 1, 1, "#3a6fd8");
      px(x, y + 4, 2, 2, "#f2f2f2");
      person(px, x + 11, y, "#5a7a9a", "#3a2a1a"); px(x + 9, y + 2, 2, 2, "#1a1a1a");                 // the person she's interviewing
    },
  },
  clinton: {
    ground: ["#3f9a3a", "#378a33"],
    edge: pick(eDogwood, eTree),
    // Little Rock: the glass library over the river, Bill blowing the sax, downtown, dogwoods
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      river(px, y0 + 36, 8);
      y = y0 + 26; x = free(y - 12, 22, 16);
      px(x - 1, y, 15, 6, "#a8c4d8"); px(x - 1, y, 15, 1, "#e8f4ff");
      for (let k = 0; k < 15; k += 3) px(x - 1 + k, y + 1, 1, 5, "#6a8aa0");
      px(x + 10, y + 6, 2, 4, "#7a808a");
      px(x - 1, y - 4, 2, 3, "#e0302f"); px(x - 1, y - 6, 1, 2, "#ffd23f"); px(x, y - 6, 1, 2, "#ffd23f");
      live.push({ k: "bill", x, y });
      y = y0 + 52; x = free(y, 24, 18);
      bldg(px, x, y + 6, 5, 18, "#7a808a", "#e8eef4", rnd); bldg(px, x + 6, y, 6, 24, "#6a707a", "#e8eef4", rnd); bldg(px, x + 13, y + 9, 5, 15, "#8a909a", "#e8eef4", rnd);
    },
  },
  casino: {
    ground: ["#3a5a32", "#33502c"],
    edge: pick(eTree, eHouse),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 3; x = free(y, 28, 18);
      stars(px, x, y, 18, 6, rnd, 4);
      px(x, y + 14, 18, 14, "#3a2a50"); px(x + 1, y + 15, 16, 1, "#ffd23f");
      for (let k = 0; k < 9; k++) px(x + 1 + Math.floor(rnd() * 16), y + 17 + Math.floor(rnd() * 9), 1, 1, "#ff5ad1");
      { const cx = x + 9, cy = y + 7;
        for (let a = 0; a < 36; a++) { const th = Math.PI * (0.15 + 1.7 * a / 35) + Math.PI / 2; px(cx + Math.round(6 * Math.cos(th)), cy - Math.round(6 * Math.sin(th)), 2, 2, "#e8b830"); }
        for (const [dx, dy] of [[-5, -3], [4, -3], [-6, 1], [5, 1]]) px(cx + dx, cy + dy, 1, 1, "#7a5a1a"); }
      y = y0 + 38; x = free(y - 1, 22, 14);
      px(x + 3, y, 9, 6, "#c8ccd2"); px(x + 4, y - 1, 7, 1, "#9aa0a8"); px(x + 4, y + 2, 7, 1, "#3a6fd8");
      px(x + 4, y + 6, 1, 14, "#9aa0a8"); px(x + 10, y + 6, 1, 14, "#9aa0a8"); px(x + 7, y + 6, 1, 14, "#9aa0a8");
      y = y0 + 66; x = free(y, 22, 22);
      px(x + 1, y + 11, 20, 9, "#f2e8d8"); px(x + 1, y + 10, 20, 1, "#e85a9a");
      for (let k = 0; k < 4; k++) px(x + 2 + k * 5, y + 12, 4, 1, k % 2 ? "#e85a9a" : "#f2f2f2");
      px(x + 3, y + 14, 6, 4, "#cfe8ff"); px(x + 13, y + 14, 3, 6, "#8a5a32");
      { const cx = x + 11, cy = y + 5;
        for (let k = -5; k <= 5; k++) { const ww = Math.round(Math.sqrt(25 - k * k) * 2) + 1; px(cx - Math.floor(ww / 2), cy + Math.round(k * 0.8), ww, 1, k < 1 ? "#ff7ab8" : "#c8823a"); }
        px(cx - 1, cy - 1, 3, 2, "#3a5a32");
        for (const [dx, dy, c] of [[-3, -2, "#ffd23f"], [2, -3, "#5af0ff"], [3, -1, "#f2f2f2"], [-2, -3, "#2faa4a"], [-4, 0, "#3a6fd8"]] as const) px(cx + dx, cy + dy, 1, 1, c); }
    },
  },
  graceland: {
    ground: ["#5f9a45", "#548a3c"],
    edge: pick(eTree),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 4; x = free(y, 10, 16);
      px(x + 2, y + 3, 13, 2, "#f2f2f2"); px(x + 6, y, 2, 9, "#f2f2f2"); px(x + 13, y + 1, 2, 3, "#f2f2f2"); px(x + 4, y + 3, 4, 1, "#3a6fd8");
      y = y0 + 18; x = free(y - 1, 31, 16);
      px(x, y + 4, 16, 9, "#f2f2f2"); px(x + 4, y, 8, 4, "#f2f2f2"); px(x + 4, y - 1, 8, 1, "#8a8a8a");
      for (let k = 0; k < 4; k++) px(x + 5 + 2 * k, y + 5, 1, 8, "#d0d0d0");
      px(x + 7, y + 9, 2, 4, "#5a3a1a");
      { const e = y + 17;
        px(x + 2, e, 3, 2, "#111"); px(x + 4, e - 1, 2, 1, "#111"); px(x + 2, e + 2, 3, 2, "#f0c8a0");
        px(x + 1, e + 4, 5, 6, "#ffffff"); px(x, e + 5, 1, 3, "#ffffff"); px(x + 6, e + 5, 1, 3, "#ffffff");
        px(x + 1, e + 7, 5, 1, "#ffd23f"); px(x + 1, e + 4, 1, 1, "#ffd23f"); px(x + 5, e + 4, 1, 1, "#ffd23f");
        px(x + 1, e + 10, 2, 3, "#ffffff"); px(x + 4, e + 10, 2, 3, "#ffffff");
        px(x + 8, e + 4, 1, 1, "#ffd23f"); px(x + 10, e + 2, 1, 1, "#ffd23f"); px(x + 9, e + 1, 1, 2, "#ffd23f"); }
      river(px, y0 + 92, 10);
      y = y0 + 64; x = free(y, 24, 22);
      for (let r = 0; r < 20; r++) px(x + 11 - r * 0.55, y + r + 4, Math.round(r * 1.1) + 1, 1, r % 4 === 0 ? "#e8eef4" : "#b8c0c8");
      px(x + 11, y + 1, 1, 3, "#cfcfcf");
    },
  },
  nashville: {
    ground: ["#2a3448", "#333d55"],
    edge: pick(eTree),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 3; x = free(y, 34, 17);
      stars(px, x, y, 16, 6, rnd, 5);
      bldg(px, x + 1, y + 16, 4, 16, "#3a3f60", "#ffd23f", rnd);
      px(x + 7, y + 4, 6, 28, "#2f3450"); px(x + 7, y, 1, 4, "#2f3450"); px(x + 12, y, 1, 4, "#2f3450");
      for (let yy = y + 6; yy < y + 30; yy += 3) px(x + 8, yy, 4, 1, "#5a6090");
      px(x + 14, y + 26, 2, 6, "#c8702a"); px(x + 14, y + 22, 1, 4, "#5a3a1a");
      y = roomiest(y0 + 40, y0 + 50, 48); x = free(y - 2, 48, 26);
      px(x, y, 26, 32, "#1a1424"); px(x, y - 2, 26, 2, "#3a2a4a");
      for (let f2 = 0; f2 < 4; f2++) {
        const fy = y + 1 + f2 * 8;
        px(x + 1, fy, 24, 6, "#2a1a3a"); px(x, fy + 6, 26, 1, "#5a4a6a");
        live.push({ k: "club", x: x + 1, y: fy, w: 24, h: 2 });
        for (let k = 0; k < 6; k++) px(x + 2 + k * 4, fy + 3, 2, 3, ["#f0c8a0", "#c08a5a", "#8a5a3a"][(k + f2) % 3]);
        for (let k = 0; k < 6; k++) { if ((k + f2) % 2) { px(x + 1 + k * 4, fy + 2, 4, 1, "#c8a060"); px(x + 2 + k * 4, fy + 1, 2, 1, "#c8a060"); } else px(x + 2 + k * 4, fy + 2, 2, 1, ["#ffd23f", "#1a1a1a", "#f2f2f2"][(k + f2) % 3]); }
      }
      px(x + 11, y + 26, 4, 7, "#ffd23f");
      for (let k = 0; k < 4; k++) cowboy(px, x + 2 + k * 6, y + 35, ["#e0302f", "#3a6fd8", "#f2f2f2", "#ff5ad1"][k], ["#c8a060", "#1a1a1a", "#f2f2f2", "#c8a060"][k]);
      live.push({ k: "walk", x0: x + 1, x1: x + 22, y: y + 46, shirt: "#e0302f", hat: "#c8a060", ph: 0, brim: true });
      live.push({ k: "walk", x0: x + 1, x1: x + 22, y: y + 46, shirt: "#3a6fd8", hat: "#f2f2f2", ph: 9, brim: true, skin: "#8a5a3a" });
      y = y0 + 98; x = free(y, 24, 18);
      px(x + 8, y + 12, 2, 6, "#7a7a7a");
      px(x + 3, y, 12, 12, "#ffd23f"); px(x + 2, y + 1, 1, 10, "#ffd23f"); px(x + 15, y + 1, 1, 10, "#ffd23f");
      px(x + 5, y + 2, 8, 8, "#8a5a2a"); px(x + 5, y + 1, 2, 1, "#8a5a2a"); px(x + 11, y + 1, 2, 1, "#8a5a2a");
      px(x + 7, y + 4, 1, 1, "#000"); px(x + 10, y + 4, 1, 1, "#000"); px(x + 8, y + 7, 2, 2, "#f2f2f2");
      px(x, y + 18, 18, 5, "#c8ccd2"); px(x + 2, y + 19, 3, 2, "#e0302f");
    },
  },
};
