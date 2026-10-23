// west scenes
import { W, MID, Y0, SCENES, HT, ROAD_END, TRAIL, DRIVE, HOLDS, roadX, vanX, room, free, beside, roomiest, hash, harborAt, top, bottom, at } from "../core";
import { HARBOR } from "../../harbor";
import type { SceneMod, Ctx, Px, Edge } from "../kit";
import { palm, pine, peak, bldg, stars, river, person, cowboy, fields, pivot, shade, smokies, windmill, turbine, word, wordW, GLYPH, pick,
  ePine, ePalm, eCactus, eHay, eTree, eDogwood, eHouse, eRock, eCow, eSunflower, eOwl } from "../kit";
import { PRIDE } from "../fx";

export const SC_WEST: Partial<Record<string, SceneMod>> = {
  venice: {
    ground: ["#e8c98a", "#d9b56f"],
    edge: pick(ePalm, eRock),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 2; x = free(y, 16, 20);
      px(x, y, 20, 11, "#3a8fd6"); px(x, y + 3, 20, 1, "#7fc0f0"); px(x, y + 11, 20, 2, "#f4f4f4");
      px(x + 14, y + 16, 4, 2, "#e8823a"); px(x + 15, y + 15, 2, 1, "#f4b07a"); px(x + 16, y + 16, 1, 1, "#b85a22");
      px(x + 13, y + 17, 1, 1, "#c0302a"); px(x + 12, y + 16, 1, 1, "#111"); px(x + 13, y + 18, 1, 1, "#c0302a"); px(x + 17, y + 18, 1, 1, "#c0302a");
      y = y0 + 20; x = free(y, 12, 13);
      px(x + 2, y + 2, 7, 5, "#3a6fd8"); px(x + 1, y + 1, 9, 1, "#e0302f"); px(x + 3, y + 3, 2, 2, "#cfe8ff");
      px(x + 2, y + 7, 1, 5, "#f2f2f2"); px(x + 8, y + 7, 1, 5, "#f2f2f2"); px(x + 9, y + 7, 4, 1, "#f2f2f2");
      y = y0 + 37; x = free(y, 12, 18);
      px(x, y, 18, 12, "#2f7a9a"); px(x + 1, y + 1, 16, 10, "#3a8fb0");
      px(x + 1, y + 1, 16, 1, "#f2f2f2"); px(x + 1, y + 10, 16, 1, "#f2f2f2"); px(x + 1, y + 1, 1, 10, "#f2f2f2"); px(x + 16, y + 1, 1, 10, "#f2f2f2");
      px(x + 9, y + 1, 1, 10, "#f2f2f2"); px(x + 2, y + 4, 3, 4, "#d8603a"); px(x + 14, y + 4, 3, 4, "#d8603a");
      px(x + 1, y + 5, 1, 2, "#ff8a1f"); px(x + 16, y + 5, 1, 2, "#ff8a1f");
      px(x + 6, y + 4, 2, 2, "#3a2a1a"); px(x + 11, y + 7, 2, 2, "#f0c8a0"); px(x + 8, y + 3, 1, 1, "#ff8a1f");
      y = y0 + 55; x = free(y, 11, 14) + 4;
      person(px, x + 4, y, "#2fa8a0", "#f2f2f2", "#2a3a5a");
      for (const wx of [x, x + 8]) { px(wx, y + 8, 3, 1, "#111"); px(wx, y + 10, 3, 1, "#111"); px(wx - 1, y + 9, 1, 1, "#111"); px(wx + 3, y + 9, 1, 1, "#111"); }
      px(x + 2, y + 8, 8, 1, "#e0302f"); px(x + 4, y + 7, 3, 2, "#111"); px(x + 9, y + 5, 1, 4, "#9a9a9a"); px(x + 8, y + 5, 2, 1, "#111");
      px(x - 3, y + 6, 2, 1, "#f2f2f2"); px(x - 4, y + 8, 3, 1, "#f2f2f2");
      palm(px, free(y0 + 68, 8, 9) + 4, y0 + 68);
    },
  },
  la: {
  },
  oc: {
    ground: ["#7fae4a", "#709c40"],
    edge: pick(eTree, ePalm),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 3; x = free(y, 20, 24);
      for (const [dx, r] of [[5, 5], [16, 4]]) {
        for (let k = -r; k <= r; k++) { const ww = Math.round(Math.sqrt(r * r - k * k) * 2) + 1; px(x + dx - Math.floor(ww / 2), y + 8 + k, ww, 1, k < -r / 2 ? "#ffffff" : "#d8dce0"); }
        px(x + dx - r, y + 9 + r, 1, 3, "#8a8a8a"); px(x + dx + r, y + 9 + r, 1, 3, "#8a8a8a");
      }
      px(x, y + 16, 24, 1, "#9a9a9a"); px(x + 11, y + 6, 1, 11, "#9a9a9a");
      px(x + 21, y + 1, 2, 13, "#b8b8b8"); px(x + 21, y + 1, 2, 2, "#e0302f"); px(x + 21, y + 6, 2, 1, "#e0302f");
      px(x + 21, y - 1, 2, 2, "#ff8a1f"); px(x + 21, y - 2, 1, 1, "#ffd23f");
      y = y0 + 26; x = free(y, 24, 22);
      bldg(px, x, y + 6, 6, 18, "#6a8aa8", "#cfe8ff", rnd); bldg(px, x + 7, y, 7, 24, "#4a6a88", "#cfe8ff", rnd);
      bldg(px, x + 15, y + 9, 6, 15, "#8aa0b8", "#e8f4ff", rnd); px(x + 9, y - 1, 3, 1, "#e0302f");
      y = roomiest(y0 + 52, y0 + 66, 42) ; x = free(y - 21, 42, 26);
      px(x, y, 26, 2, "#4a2a6a"); px(x, y + 2, 26, 10, "#8a4ac8"); px(x, y + 2, 26, 1, "#a86ae8");
      for (let k = 0; k < 6; k++) { px(x + 1 + k * 4, y + 6, 3, 4, "#cfe8ff"); px(x + 1 + k * 4, y + 4, 3, 1, ["#ff5ad1", "#ffd23f", "#5af0ff"][k % 3]); }
      px(x + 2, y + 12, 22, 1, "#5a5a5a");
      px(x + 1, y + 13, 24, 8, "#4a4a4e"); for (let k = 0; k < 6; k++) px(x + 2 + k * 4, y + 14, 1, 6, "#e8e8e8");
      px(x + 4, y + 15, 2, 3, "#e0302f"); px(x + 13, y + 16, 2, 3, "#3a6fd8"); px(x + 20, y + 15, 2, 3, "#f2f2f2");
      { const sw = wordW("MARKET") + 2, sx = x + Math.floor((26 - sw) / 2);
        px(sx - 1, y - 21, sw + 2, 21, "#5a2a8a");
        word(px, sx + 4, y - 19, "THE", "#ffffff", null); word(px, sx + 1, y - 13, "MARKET", "#ffffff", null); word(px, sx + 3, y - 7, "PLACE", "#ffd23f", null); }
    },
  },
  vegas: {
    ground: ["#2a1d3a", "#3a2850"],
    edge: pick(eCactus, eRock),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 4; x = free(y, 50, 16);
      stars(px, x, y, 16, 10, rnd, 8);
      px(x + 3, y + 2, 1, 4, "#cfcfcf"); px(x + 1, y + 6, 5, 3, "#d8d8e8"); px(x + 2, y + 9, 3, 1, "#ff5ad1");
      px(x + 3, y + 10, 1, 30, "#b8b8c8"); px(x + 2, y + 32, 3, 8, "#b8b8c8");
      bldg(px, x + 7, y + 18, 4, 22, "#4a3a6a", "#ff5ad1", rnd); bldg(px, x + 12, y + 24, 4, 16, "#3b3b5c", "#5af0ff", rnd);
      px(x + 5, y + 43, 7, 4, "#f2f2f2"); px(x + 6, y + 42, 5, 1, "#f2f2f2"); px(x + 8, y + 41, 1, 1, "#e0302f");
      px(x + 6, y + 44, 5, 1, "#e0302f"); px(x + 8, y + 47, 1, 3, "#9a9a9a");
      for (const [k, c] of [[0, "#ff5ad1"], [1, "#5af0ff"], [2, "#ffd23f"], [3, "#2faa4a"]] as const) {
        const fy = y0 + 8 + k * 9, fx = free(fy, 8, 9) + 4;
        live.push({ k: "boom", x: fx, y: fy, c, ph: k * 0.7 });
      }
      y = roomiest(y0 + 58, y0 + 68, 20); x = free(y, 20, 30);
      px(x, y + 9, 30, 2, "#0a4a8a"); px(x, y + 11, 30, 8, "#0071ce"); px(x + 13, y + 14, 4, 5, "#cfe8ff");
      word(px, x + 1, y + 2, "WALMART", "#ffffff", null); px(x, y + 1, 30, 1, "#0071ce"); px(x, y + 7, 30, 1, "#0071ce");
      px(x, y + 1, 1, 7, "#0071ce"); px(x + 29, y + 1, 1, 7, "#0071ce");
    },
  },
  desert: {
    ground: ["#d98c4a", "#c4763a"],
    edge: pick(eCactus, eRock),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 40; x = free(y, 12, 14);
      px(x + 1, y + 3, 13, 9, "#a8432a"); px(x + 3, y, 9, 3, "#a8432a"); px(x + 3, y, 9, 1, "#c45a38");
      y = y0 + 6; x = free(y, 20, 14);
      px(x + 3, y, 7, 2, "#f2f2f2"); px(x + 2, y + 2, 9, 3, "#e8e8e8"); px(x + 4, y + 1, 3, 1, "#ff8a1f"); px(x + 3, y + 3, 7, 1, "#d8d8d8"); px(x + 6, y + 2, 1, 1, "#e0302f");
      px(x + 3, y + 5, 7, 4, "#f0b890"); px(x + 3, y + 6, 7, 1, "#111"); px(x + 4, y + 6, 2, 1, "#3a3a3a"); px(x + 7, y + 6, 2, 1, "#3a3a3a");
      px(x + 5, y + 8, 3, 2, "#e8e0c0"); px(x + 6, y + 10, 1, 1, "#e8e0c0");
      px(x + 1, y + 10, 11, 7, "#1a1a1a");
      for (const [dx, hh, c] of [[2, 3, "#ff3b1f"], [4, 4, "#ff8a1f"], [7, 3, "#ff3b1f"], [9, 4, "#ffd23f"], [5, 2, "#ffd23f"]] as const) px(x + dx, y + 17 - hh, 1, hh, c);
      px(x, y + 11, 1, 4, "#f0b890"); px(x + 12, y + 11, 1, 3, "#f0b890"); px(x + 12, y + 10, 2, 1, "#9a9a9a");
      px(x + 2, y + 17, 3, 3, "#3a5a8a"); px(x + 8, y + 17, 3, 3, "#3a5a8a");
    },
  },
  arches: {
    ground: ["#cf6f3c", "#b85c2e"],
    edge: pick(eCactus, eRock),
    // Delicate Arch, the cliff jump, The Body Keeps the Score (its cover, not its words), bikers with pride flags
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 4; x = free(y, 26, 16);
      px(x + 2, y + 4, 3, 22, "#a8432a"); px(x + 11, y + 8, 3, 18, "#a8432a");
      px(x + 3, y + 2, 4, 2, "#bf5534"); px(x + 6, y + 1, 4, 2, "#bf5534"); px(x + 9, y + 3, 3, 2, "#bf5534"); px(x + 11, y + 5, 2, 3, "#bf5534");
      y = y0 + 36; x = free(y - 8, 32, 20);
      px(x, y, 7, 22, "#9a3a22"); px(x, y, 7, 1, "#c45a38"); person(px, x + 2, y - 8, "#e0302f", "#3a2a1a", "#3a6fd8");
      px(x + 10, y + 5, 3, 1, "#f0c8a0"); px(x + 11, y + 6, 2, 3, "#ffd23f"); px(x + 10, y + 9, 1, 2, "#3a6fd8"); px(x + 13, y + 9, 1, 2, "#3a6fd8"); px(x + 9, y + 6, 1, 1, "#f0c8a0"); px(x + 14, y + 5, 1, 1, "#f0c8a0");
      px(x + 7, y + 17, 13, 6, "#2f8ab8"); px(x + 8, y + 18, 4, 1, "#7fd0f0"); px(x + 14, y + 16, 1, 1, "#e8f8ff"); px(x + 16, y + 15, 1, 1, "#e8f8ff"); px(x + 12, y + 15, 1, 1, "#e8f8ff");
      y = y0 + 68; x = free(y, 16, 15);                                                       // the book: white cover, blue title, orange band
      px(x, y, 15, 16, "#1a1a1a"); px(x + 1, y + 1, 13, 14, "#f4f2ec");
      for (const [yy, w2] of [[2, 11], [4, 9], [6, 11], [8, 7]] as const) px(x + 2, y + yy, w2, 1, "#1f3a6a");
      px(x + 1, y + 10, 13, 2, "#e8702a"); px(x + 2, y + 13, 8, 1, "#8a8a8a");
      live.push({ k: "bikers", a: y0 + 6, b: y0 + h - 4 });
    },
  },
  vail: {
    ground: ["#4f8a42", "#457a3a"],
    edge: pick(ePine),
    // the alpine village; a retired army man and his wife, still sweet on each other
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 3; x = free(y, 14, 22);
      peak(px, x + 10, y, 11, "#7a8aa0");
      for (let r = 0; r < 12; r++) px(x + 4 + r, y + 3 + r, 1, 1, "#333");
      px(x + 7, y + 6, 3, 2, "#e0302f"); px(x + 8, y + 8, 1, 1, "#333"); px(x + 12, y + 10, 3, 2, "#ffd23f"); px(x + 13, y + 12, 1, 1, "#333");
      y = y0 + 36; x = free(y, 14, 24);
      for (const [dx, c] of [[0, "#f2ead8"], [9, "#f8f0e0"], [17, "#efe4cc"]] as const) {
        for (let r = 0; r < 4; r++) px(x + dx + 3 - r, y + r, 2 * r + 1, 1, r === 0 ? "#ffffff" : "#6a3a1a");
        px(x + dx, y + 4, 7, 7, c); px(x + dx, y + 6, 7, 1, "#8a5a2a"); px(x + dx + 1, y + 8, 2, 2, "#5a8ac8"); px(x + dx + 4, y + 8, 2, 3, "#6a3a1a");
        px(x + dx + 1, y + 10, 2, 1, "#e0302f");
      }
      y = y0 + 54; x = free(y, 18, 22);
      // him: garrison cap, grey temples, the pencil mustache, olive coat with ribbons
      px(x + 2, y, 7, 2, "#4a5a2a"); px(x + 2, y + 2, 1, 2, "#c8c8c8"); px(x + 8, y + 2, 1, 2, "#c8c8c8");
      px(x + 3, y + 2, 5, 5, "#f0c8a0"); px(x + 4, y + 3, 1, 1, "#111"); px(x + 6, y + 3, 1, 1, "#111"); px(x + 4, y + 5, 3, 1, "#1a1a1a");
      px(x + 2, y + 7, 7, 7, "#5a6a32"); px(x + 3, y + 8, 2, 1, "#e0302f"); px(x + 3, y + 9, 2, 1, "#ffd23f"); px(x + 5, y + 7, 1, 7, "#c8a830");
      px(x + 3, y + 14, 2, 4, "#3a3a2a"); px(x + 6, y + 14, 2, 4, "#3a3a2a");
      // her: white bun, pearls, lavender dress; their hands meet
      px(x + 13, y + 1, 4, 2, "#f2f2f2"); px(x + 12, y + 3, 6, 4, "#f0c8a0"); px(x + 12, y + 2, 1, 3, "#e8e8e8"); px(x + 17, y + 2, 1, 3, "#e8e8e8");
      px(x + 13, y + 4, 1, 1, "#111"); px(x + 16, y + 4, 1, 1, "#111"); px(x + 14, y + 6, 2, 1, "#d06a7a");
      px(x + 12, y + 7, 6, 1, "#f2f2f2"); px(x + 11, y + 8, 8, 8, "#b89ad8"); px(x + 12, y + 16, 2, 2, "#f0c8a0"); px(x + 16, y + 16, 2, 2, "#f0c8a0");
      px(x + 9, y + 10, 2, 1, "#f0c8a0");
      px(x + 9, y - 3, 1, 1, "#e0302f"); px(x + 11, y - 3, 1, 1, "#e0302f"); px(x + 9, y - 2, 3, 1, "#e0302f"); px(x + 10, y - 1, 1, 1, "#e0302f"); // a little heart
    },
  },
  lake: {
    ground: ["#3f7a3a", "#35693a"],
    edge: pick(ePine, eRock),
    under: ({ ctx, px, y0, h, rnd, live }) => {

    // a sky full of smoke and orange glow, a wall of snowy peaks in front of it
    for (let y = 0; y < 30; y++) px(0, y0 + y, W, 1, ["#c86a3a", "#d87a3a", "#e89a4a", "#a8a0a8", "#8aa0b8"][Math.min(4, Math.floor(y / 6))]);
    const ridge: number[] = [];
    for (let x = 0; x < W; x++) ridge.push(y0 + 60);
    for (const [cx, hh] of [[4, 30], [17, 40], [31, 34], [44, 44], [58, 36]]) for (let r = 0; r < hh; r++) {
      const top = y0 + 60 - hh + r, x0 = Math.round(cx - r * 0.8), ww = Math.round(r * 1.6) + 1;
      px(x0, top, ww, 1, r < hh * 0.3 ? "#f4f6f8" : "#6a7090");
      if (r > hh * 0.3) px(cx, top, Math.round(r * 0.8) + 1, 1, "#525878");
      for (let x = Math.max(0, x0); x < Math.min(W, x0 + ww); x++) ridge[x] = Math.min(ridge[x], top);
    }
    live.push({ k: "fire", x: 0, y: y0, w: W, h: 9, ridge });
    live.push({ k: "plume", x: 6, y: y0 + 14, w: 52, rise: 230 });
    ctx.globalAlpha = 0.45; px(0, y0 + 48, W, 3, "#eef4f6"); ctx.globalAlpha = 1;
    for (const [cx, hh] of [[10, 18], [26, 24], [38, 17], [52, 22]]) for (let r = 0; r < hh; r++) {
      const top = y0 + 66 - hh + r;
      px(cx - r, top, 2 * r + 1, 1, r < 4 ? "#dfe6ee" : "#3f4a5a");
      if (r >= 4) px(cx, top, r + 1, 1, "#33404e");
    }
    },
    // the Rockies: fire behind the peaks, me getting my head shaved on a summit in a lightning storm
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 70; x = free(y, 26, 22);
      px(x, y + 12, 22, 4, "#6a6f7a"); px(x + 3, y + 10, 16, 2, "#7a808a"); px(x + 2, y + 16, 18, 8, "#575c66");
      // me: seated, grey suit, half my hair gone, hair on the rock
      px(x + 4, y + 2, 4, 3, "#f0c8a0"); px(x + 4, y + 1, 2, 1, "#3a2a1a"); px(x + 4, y + 2, 1, 1, "#3a2a1a");
      px(x + 3, y + 5, 6, 5, "#8a8f99"); px(x + 5, y + 5, 2, 2, "#f2f2f2"); px(x + 5, y + 6, 1, 2, "#e0302f");
      px(x + 3, y + 10, 7, 2, "#8a8f99"); px(x + 9, y + 10, 1, 3, "#6a6f7a");
      px(x + 2, y + 12, 1, 1, "#3a2a1a"); px(x + 7, y + 12, 1, 1, "#3a2a1a"); px(x + 11, y + 11, 1, 1, "#3a2a1a");
      // Jason: behind me with the clippers, green Cummins tee
      px(x + 12, y - 2, 4, 2, "#5a3a1a"); px(x + 12, y, 4, 3, "#f0c8a0"); px(x + 13, y + 1, 1, 1, "#111");
      px(x + 11, y + 3, 6, 6, "#2f8a3a"); px(x + 13, y + 4, 2, 2, "#e0302f"); px(x + 13, y + 4, 1, 1, "#f2f2f2");
      px(x + 9, y + 3, 2, 1, "#f0c8a0"); px(x + 8, y + 2, 2, 1, "#3a3a3a");
      px(x + 12, y + 9, 2, 3, "#3a4a6a"); px(x + 15, y + 9, 2, 3, "#3a4a6a");
      live.push({ k: "bolt", x: x + 8, y: y0 + 34, y1: y - 2 });
      y = y0 + 106; x = free(y, 16, 24);
      px(x, y, 24, 12, "#2f6fb0"); px(x + 2, y + 2, 7, 1, "#7fb6e8"); px(x + 13, y + 6, 6, 1, "#7fb6e8");
      pine(px, x + 2, y + 13); pine(px, x + 20, y + 12);
      live.push({ k: "glint", x, y: y + 1, w: 24, h: 10 });
    },
  },
  denver: {
    ground: ["#5a5e66", "#666a72"],
    // straight through downtown, under the green walkway
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      for (let yy = y0 + 2; yy < y0 + h - 6; yy += 13) {
        const r = room(yy, 11);
        for (let xx = 1; xx + 5 < r.lo - 6; xx += 6) bldg(px, xx, yy, 5, 10 + Math.floor(rnd() * 2), ["#8a8f99", "#7a808a", "#9aa0aa", "#6a8aa8"][Math.floor(rnd() * 4)], "#dfe6ee", rnd);
        for (let xx = Math.ceil(r.hi + 7); xx + 5 <= W - 1; xx += 6) bldg(px, xx, yy, 5, 10 + Math.floor(rnd() * 2), ["#8a8f99", "#7a808a", "#9aa0aa", "#a8705a"][Math.floor(rnd() * 4)], "#dfe6ee", rnd);
      }
      y = y0 + 60; x = free(y, 8, 6);
      px(x, y + 2, 4, 6, "#3a6fd8"); px(x + 1, y, 3, 2, "#3a6fd8"); px(x + 2, y + 1, 1, 1, "#111"); // the big blue bear, peeking
      for (let k = 0; k < 2; k++) live.push({ k: "walk", x0: free(y0 + 30 + k * 30, 8, 12), x1: free(y0 + 30 + k * 30, 8, 12) + 8, y: y0 + 30 + k * 30, shirt: ["#e0302f", "#ffd23f"][k], hat: "#3a2a1a", ph: k * 3 });
      canopy.push((f) => {                 // the green walkway over the street
        const y = y0 + 44, x = roadX(y + 2);
        f(x - 12, y, 25, 5, "#2f8a4a"); f(x - 12, y + 1, 25, 3, "#3faa5a");
        for (let k = -12; k < 13; k += 3) { f(x + k, y, 1, 5, "#1f6a3a"); f(x + k + 1, y + 2, 1, 1, "#1f6a3a"); }
        f(x - 12, y - 1, 25, 1, "#bfe8c8"); f(x - 4, y + 2, 1, 1, "#ff5ad1"); f(x + 3, y + 1, 1, 1, "#ffd23f"); f(x + 7, y + 2, 1, 1, "#5af0ff");
      });
    },
  },
};
