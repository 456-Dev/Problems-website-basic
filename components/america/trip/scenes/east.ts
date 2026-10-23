// east scenes
import { W, MID, Y0, SCENES, HT, ROAD_END, TRAIL, DRIVE, HOLDS, roadX, vanX, room, free, beside, roomiest, hash, harborAt, top, bottom, at } from "../core";
import { HARBOR } from "../../harbor";
import type { SceneMod, Ctx, Px, Edge } from "../kit";
import { palm, pine, peak, bldg, stars, river, person, cowboy, fields, pivot, shade, smokies, windmill, turbine, word, wordW, GLYPH, pick,
  ePine, ePalm, eCactus, eHay, eTree, eDogwood, eHouse, eRock, eCow, eSunflower, eOwl } from "../kit";
import { PRIDE } from "../fx";

export const SC_EAST: Partial<Record<string, SceneMod>> = {
  gatlinburg: {
    ground: ["#2f6b3a", "#285c32"],
    edge: pick(ePine),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      for (let k = 0; k < 20; k++) { const xx = Math.floor(rnd() * W), yy = y0 + 2 + Math.floor(rnd() * 6); if (Math.abs(xx - roadX(yy)) > 7) px(xx, yy, 2, 1, "#a9c4b8"); }
      y = y0 + 6; x = free(y, 36, 16);
      px(x + 10, y, 1, 4, "#cfcfcf"); px(x + 7, y + 4, 7, 3, "#e8e8e8"); px(x + 8, y + 7, 5, 1, "#9a9a9a"); px(x + 9, y + 8, 3, 26, "#d8d8d8");
      px(x + 3, y + 14, 1, 20, "#7a7a7a");
      px(x, y + 10, 7, 2, "#d8903e"); px(x + 1, y + 8, 5, 2, "#e8a850"); px(x, y + 6, 7, 2, "#d8903e");
      px(x + 1, y + 5, 5, 1, "#7a3a1a"); px(x + 2, y + 4, 3, 1, "#fff0a0"); px(x, y + 6, 1, 3, "#7a3a1a"); px(x + 6, y + 6, 1, 4, "#7a3a1a");
      y = y0 + 46; x = free(y, 18, 21);
      px(x + 2, y + 4, 9, 11, "#d8c8a8"); px(x + 4, y + 2, 5, 2, "#d8c8a8"); px(x + 5, y, 3, 2, "#8a5a32"); px(x + 8, y + 3, 3, 4, "#d8c8a8");
      px(x + 2, y + 8, 9, 4, "#f2ead8"); word(px, x + 2, y + 8, "XXX", "#1a1a1a", null);
      px(x + 14, y + 4, 3, 2, "#6a4a2a"); px(x + 17, y + 5, 3, 1, "#3a2a1a"); px(x + 13, y + 6, 1, 1, "#3a2a1a");
      person(px, x + 14, y + 5, "#5a7a3a", "#6a4a2a", "#3a5a8a");
      px(x + 13, y + 9, 1, 2, "#f0c8a0"); px(x + 12, y + 8, 1, 2, "#e8e8e8");
      y = y0 + 68; x = free(y - 2, 16, 20);
      px(x, y + 10, 20, 4, "#2faa4a"); px(x + 17, y + 11, 1, 1, "#111"); px(x + 17, y + 8, 1, 3, "#f2f2f2"); px(x + 18, y + 8, 2, 1, "#e0302f");
      px(x + 4, y + 2, 7, 6, "#3a9a4a"); px(x + 9, y - 2, 5, 4, "#3a9a4a"); px(x + 12, y, 2, 1, "#f2f2f2"); px(x + 11, y - 1, 1, 1, "#111");
      px(x + 1, y + 4, 4, 2, "#3a9a4a"); px(x, y + 5, 2, 1, "#3a9a4a"); px(x + 5, y + 8, 2, 2, "#3a9a4a"); px(x + 9, y + 8, 2, 2, "#3a9a4a"); px(x + 11, y + 4, 2, 1, "#3a9a4a");
      y = y0 + 86; x = free(y - 3, 15, 15) + 1;
      px(x + 1, y + 6, 6, 6, "#8a8f99"); px(x + 2, y + 7, 1, 4, "#6a6f79"); px(x + 4, y + 7, 1, 4, "#6a6f79");
      px(x, y, 8, 6, "#1a1a1a"); px(x + 3, y - 1, 2, 1, "#3a3a3a"); px(x - 1, y + 1, 1, 4, "#1a1a1a"); px(x + 8, y + 1, 1, 4, "#1a1a1a");
      px(x + 9, y + 11, 3, 1, "#9aa0a8"); px(x + 10, y - 3, 1, 1, "#f2f2f2"); px(x + 12, y + 1, 2, 1, "#ffd23f");
    },
  },
  smoky: {
    ground: ["#2f6b3a", "#285c32"],
    edge: pick(ePine),
    under: ({ ctx, px, y0, h, canopy }) => {
      smokies(ctx, px, y0, h);
      canopy.push((f) => {                 // trees over the trail: the van disappears under them
        const a = TRAIL.a + 12, b = TRAIL.b - 12, G = ["#12302a", "#1c4a36", "#2a6a48", "#173c30"];
        for (let y = a - 4; y < b + 4; y += 2) {
          const edge = Math.min(y - a + 4, b + 4 - y), r = Math.min(9, 3 + edge);
          for (let k = 0; k < 3; k++) {
            const x = vanX(Math.min(b, Math.max(a, y))) + (hash(y * 5 + k) - 0.5) * r * 1.6, w = 3 + Math.floor(hash(y * 7 + k) * r);
            f(x - w / 2, y - 1, w, 3, G[(y + k) % 4]);
            f(x - w / 2 + 1, y - 2, Math.max(1, w - 2), 1, G[(y + k + 2) % 4]);
          }
        }
        for (let y = a; y < b; y += 5) f(vanX(y) + (hash(y) - 0.5) * 6, y, 1, 1, "#3a8a5a");
      });
    },
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      for (const yy of [y0 + 6, y0 + h - 14]) { const xx = free(yy, 10, 14); pine(px, xx + 3, yy, "#12302a"); pine(px, xx + 9, yy + 2, "#12302a"); }
    },
  },
  waffle: {
    ground: ["#4f8a3c", "#457a35"],
    edge: pick(ePine, eTree),
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = roomiest(y0 + 2, y0 + 8, 22); x = free(y - 1, 23, 26) + 1;
      px(x + 12, y + 16, 1, 6, "#7a7a7a");
      px(x, y, 25, 16, "#111");
      word(px, x + 2, y + 2, "WAFFLE"); word(px, x + 4, y + 9, "HOUSE");
      y = y0 + 28; x = free(y, 13, 16);
      px(x, y, 16, 1, "#4a3a2a"); px(x, y + 1, 16, 2, "#ffd23f");
      px(x + 1, y + 3, 14, 9, "#d8c8a0"); px(x + 1, y + 11, 14, 1, "#8a6a4a");
      for (let k = 2; k < 13; k += 4) px(x + k, y + 5, 3, 3, "#ffe9a0");
      px(x + 12, y + 6, 2, 6, "#5a3a1a");
      y = y0 + 52; x = free(y, 24, 22);
      px(x, y, 22, 2, "#3a3a3e"); px(x, y + 2, 22, 1, "#ffd23f");
      for (let k = 0; k < 4; k++) { px(x + 1 + k * 6, y + 4, 2, 8, "#e8e8e8"); px(x + 1 + k * 6, y + 6, 2, 1, "#ffd23f"); px(x + 3 + k * 6, y + 8, 1, 3, "#1a1a1a"); }
      px(x, y + 13, 22, 10, "#4a4a4e"); for (let k = 0; k < 4; k++) px(x + k * 6, y + 13, 1, 10, "#e8e8e8");
      px(x + 1, y + 15, 4, 7, "#3f5a3a"); px(x + 2, y + 16, 2, 2, "#1a2a3a"); px(x + 1, y + 21, 1, 1, "#fff6c0"); px(x + 4, y + 21, 1, 1, "#fff6c0");
      px(x + 7, y + 15, 4, 7, "#e8e8e8"); px(x + 8, y + 16, 2, 2, "#1a2a3a"); px(x + 7, y + 21, 1, 1, "#fff6c0"); px(x + 10, y + 21, 1, 1, "#fff6c0");
    },
  },
  tunnel: {
    ground: ["#3f7a3a", "#35693a"],
    edge: pick(ePine),
    under: ({ px, y0 }) => {               // the mountain, then the overlook and the lakes far below
      for (let y = y0 + 8; y < y0 + 44; y++) for (let x = 0; x < W; x++) px(x, y, 1, 1, (x * 7 + y * 3) % 9 === 0 ? "#5a5048" : (y - y0 < 12 || y - y0 > 40) ? "#7a7068" : "#6a6058");
      for (let x = 0; x < W; x += 3) pine(px, x, y0 + 2 + (x % 5), "#1f5a2a");
    },
    // through the mountain, then out on a cliff over the lakes
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 52;
      const LAKES = [[9, 14, 10, 8], [54, 22, 11, 10], [14, 38, 12, 7], [52, 42, 9, 5]];
      for (let x2 = 0; x2 < W; x2++) if (Math.abs(x2 - roadX(y)) > 6) { px(x2, y, 1, 2, "#8a8278"); if (x2 % 3 === 0) px(x2, y - 2, 1, 2, "#5a5048"); }
      for (let yy = y + 2; yy < y0 + h; yy++) for (let x2 = 0; x2 < W; x2++) {
        const r = roadX(yy); if (Math.abs(x2 - r) < 7) continue;
        const v = Math.max(...LAKES.map(([cx, cy, rx, ry]) => 1 - ((x2 - cx) / rx) ** 2 - ((yy - y - cy) / ry) ** 2));
        px(x2, yy, 1, 1, v > 0.25 ? (v > 0.8 && (x2 + yy) % 3 === 0 ? "#4ab8e0" : "#2f9ac8") : v > 0 ? "#d8e8c8" : (yy - y < 4 ? "#7a7068" : (x2 * 3 + yy) % 7 === 0 ? "#2f7a32" : "#3f8a3a"));
      }
      for (const [cx, cy] of [[9, 14], [55, 21]]) { const ix = cx, iy = y + cy; px(ix - 2, iy, 5, 2, "#3f8a3a"); pine(px, ix, iy - 5, "#1f5a2a"); }
      live.push({ k: "glint", x: 0, y: y + 4, w: W, h: h - 58 });
      canopy.push((f) => {                 // the mountain the tunnel goes through
        const a = y0 + 12, b = y0 + 40;
        for (let y = a; y < b; y++) { const x = roadX(y); f(x - 7, y, 15, 1, (y * 7 + Math.floor(x)) % 5 === 0 ? "#5a5048" : "#6a6058"); }
        for (let y = a; y < b; y += 3) f(roadX(y) - 6 + ((y * 3) % 11), y, 2, 1, "#2f6a32");
        for (const [yy, s] of [[a, 1], [b - 1, -1]] as const) {
          const x = roadX(yy);
          f(x - 7, yy - s, 15, 1, "#8a8278"); f(x - 6, yy, 13, 1, "#9a928a");
          f(x - 4, yy + (s > 0 ? 1 : -1), 9, 1, "#1a1614");
        }
      });
    },
  },
  antique: {
    ground: ["#7a9a45", "#6b893c"],
    edge: pick(eTree, eCow),
    // the dam, then the farm antique store flying three flags
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 4; x = free(y, 28, 26);
      px(x, y, 26, 11, "#2f6fb0"); px(x + 2, y + 3, 8, 1, "#5f9fe0"); px(x + 14, y + 7, 7, 1, "#5f9fe0");
      px(x - 1, y + 11, 28, 4, "#c8c4b8"); px(x - 1, y + 11, 28, 1, "#e8e4d8");
      for (let k = 2; k < 26; k += 5) px(x + k, y + 12, 1, 3, "#9a968a");
      px(x + 10, y + 15, 6, 11, "#8ac8f0");
      live.push({ k: "falls", x: x + 10, y: y + 15, w: 6, h: 11 });
      px(x + 7, y + 26, 12, 2, "#e8f8ff");
      y = y0 + 40; x = free(y + 2, 40, 26);
      px(x, y + 8, 18, 12, "#a8302a"); for (let r = 0; r < 5; r++) px(x + 4 - r, y + 3 + r, 10 + 2 * r, 1, "#5a2a1a");
      px(x + 6, y + 13, 6, 7, "#3a1a14"); px(x + 7, y + 13, 1, 7, "#f2f2f2"); px(x + 10, y + 13, 1, 7, "#f2f2f2"); px(x + 2, y + 10, 3, 3, "#f2e8b0");
      px(x + 1, y + 21, 3, 3, "#8a6a42"); px(x + 2, y + 22, 1, 1, "#3a2a1a");                    // a wagon wheel, an old tractor, a rusty sign
      px(x + 6, y + 21, 6, 3, "#c84a2a"); px(x + 6, y + 24, 2, 2, "#1a1a1a"); px(x + 10, y + 23, 3, 3, "#1a1a1a"); px(x + 9, y + 19, 1, 2, "#5a5a5a");
      px(x + 14, y + 21, 4, 3, "#c8a030"); px(x + 15, y + 22, 2, 1, "#8a3a1a");
      for (let k = 0; k < 3; k++) {
        const fx = x + k * 9, fy = y + 28;
        px(fx, fy, 1, 12, "#cfcfcf");
        live.push({ k: "flag", x: fx + 1, y: fy, w: 7, h: 5, kind: (["dixie", "ferrari", "weed"] as const)[k] });
      }
    },
  },
  fair: {
    ground: ["#2f4a32", "#28402b"],
    edge: pick(eOwl, ePine),
    // the state fair after dark: a mountain string band, and the animals watching from the dark
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = roomiest(y0 + 5, y0 + 12, 22); x = free(y - 3, 22, 26);
      px(x, y + 12, 26, 4, "#d8b048"); px(x, y + 12, 26, 1, "#e8c858"); px(x, y + 16, 26, 2, "#a8803a");    // hay-bale stage
      for (let k = 0; k < 8; k++) px(x + 1 + k * 3, y - 2, 1, 1, ["#ffd23f", "#ff8a1f", "#fff6c0"][k % 3]);  // string lights
      px(x, y - 3, 26, 1, "#3a3a3a");
      // banjo, fiddle, washtub bass, washboard: overalls all round
      const band: [string, number][] = [["#3a5a9a", 0], ["#3a5a9a", 7], ["#3a5a9a", 13], ["#3a5a9a", 20]];
      band.forEach(([c, dx], k) => {
        px(x + dx + 1, y + 2, 3, 1, ["#6a4a2a", "#1a1a1a", "#c8a060", "#5a3a1a"][k]); px(x + dx + 1, y + 3, 3, 2, "#e0b090");
        px(x + dx + 1, y + 5, 3, 5, c); px(x + dx + 1, y + 5, 3, 1, "#e0302f"); px(x + dx + 1, y + 10, 1, 2, "#2a2a3a"); px(x + dx + 3, y + 10, 1, 2, "#2a2a3a");
      });
      px(x + 3, y + 6, 3, 3, "#e8e2d0"); px(x + 6, y + 5, 2, 1, "#6a4a2a");                       // banjo
      px(x + 10, y + 3, 2, 1, "#8a4a1a"); px(x + 11, y + 2, 1, 1, "#d8d8d8");                    // fiddle
      px(x + 16, y + 8, 4, 4, "#9aa0a8"); px(x + 17, y + 2, 1, 6, "#8a6a42");                     // washtub bass
      px(x + 23, y + 5, 2, 4, "#c8ccd2");                                                         // washboard
      y = y0 + 40; x = free(y, 16, 20);
      px(x + 1, y, 14, 2, "#f2f2f2"); px(x, y + 2, 16, 1, "#d8d8d8"); px(x + 1, y + 3, 1, 7, "#9a9a9a"); px(x + 14, y + 3, 1, 7, "#9a9a9a");
      px(x + 3, y + 7, 10, 1, "#8a6a42"); px(x + 5, y + 6, 2, 1, "#e0302f"); person(px, x + 7, y + 2, "#3a6a9a");
      // possum, raccoon, owl, crow, black cat, coyote: eyes that catch the light
      const eyes: [number, number, string][] = [];
      for (let k = 0; k < 8; k++) {
        const yy = y0 + 4 + Math.floor((k * (h - 10)) / 8), side = k % 2, r = room(yy, 4);
        const xx = side ? Math.min(W - 6, Math.round(r.hi + 8 + (k % 3) * 3)) : Math.max(1, Math.round(r.lo - 12 - (k % 3) * 3));
        if ((side && xx > r.hi + 6) || (!side && xx + 4 < r.lo - 6)) {
          const kind = k % 6;
          if (kind === 0) { px(xx, yy + 1, 4, 2, "#b8b8b8"); px(xx + 4, yy + 2, 2, 1, "#f2a8b8"); px(xx - 1, yy + 1, 1, 1, "#f2f2f2"); } // possum
          if (kind === 1) { px(xx, yy + 1, 4, 2, "#5a5a5a"); px(xx, yy + 1, 4, 1, "#1a1a1a"); px(xx + 4, yy + 2, 2, 1, "#3a3a3a"); }          // raccoon
          if (kind === 2) { px(xx + 1, yy + 3, 1, 4, "#5a3a1a"); px(xx, yy, 3, 3, "#6a5a4a"); }                                         // owl on a post
          if (kind === 3) { px(xx, yy + 1, 3, 2, "#111"); px(xx + 3, yy + 1, 1, 1, "#3a3a3a"); }                                       // crow
          if (kind === 4) { px(xx, yy + 1, 3, 3, "#111"); px(xx, yy, 1, 1, "#111"); px(xx + 2, yy, 1, 1, "#111"); px(xx + 3, yy + 3, 2, 1, "#111"); } // black cat
          if (kind === 5) { px(xx, yy + 1, 5, 2, "#8a7a5a"); px(xx, yy, 1, 1, "#8a7a5a"); px(xx + 2, yy + 3, 1, 1, "#8a7a5a"); }         // coyote
          eyes.push([xx, yy + (kind === 2 ? 1 : kind === 4 ? 1 : 1), kind === 2 ? "#ffd23f" : kind === 4 ? "#7aff5a" : "#ff5a3a"]);
        }
      }
      live.push({ k: "eyes", pts: eyes });
    },
  },
  dish: {
    ground: ["#5a8f42", "#4f7f3a"],
    edge: pick(ePine),
    // the Green Bank Telescope (rendered, badly out of place), an alien behind a tree
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 4; x = free(y, 46, 30);
      hd.push({ x, y, w: 30, h: 46, draw: (g, w, h) => drawDish3D(g, w, h) });
      y = y0 + 60; x = free(y - 6, 24, 14);
      px(x + 1, y - 6, 12, 8, "#2f7a2a"); px(x, y - 4, 14, 5, "#2f7a2a"); px(x + 3, y - 5, 4, 1, "#5aa84a"); px(x + 2, y + 2, 10, 2, "#2a6a26");
      live.push({ k: "peek", x: x + 7, y: y + 4 });
    },
  },
  sunset: {
    ground: ["#3a2a4a", "#33253f"],
    under: ({ ctx, px, y0, h, rnd, live }) => {

    const SKY = ["#2a1f4a", "#4a2a6a", "#7a3a7a", "#b84a6a", "#e86a4a", "#f8a04a", "#ffd07a"];
    for (let y = 0; y < 36; y++) px(0, y0 + y, W, 1, SKY[Math.min(6, Math.floor(y / 5.2))]);
    for (let k = -6; k <= 6; k++) { const ww = Math.round(Math.sqrt(36 - k * k)); if (k <= 0) px(44 - ww, y0 + 33 + k, 2 * ww + 1, 1, "#fff0b0"); }
    const R = ["#6a3a6a", "#4a2a5a", "#38224a", "#2a1a3a", "#1f1430"];
    R.forEach((c, k) => {
      const base = y0 + 34 + k * ((h - 34) / 5);
      for (let x = 0; x < W; x++) {
        const top = Math.round(base - (4 + k) * (0.55 * Math.sin(x / (6 + k) + k * 2.1) + 0.45 * Math.sin(x / (2.7 + k) + k)) - 3);
        px(x, top, 1, base + (h - 34) / 5 + 3 - top, c);
      }
      ctx.globalAlpha = 0.35; px(0, base + 2, W, 2, "#f8a07a"); ctx.globalAlpha = 1;
    });
    },
  },
  mcd: {
    ground: ["#6a9a4a", "#5d8a41"],
    edge: pick(eTree),
    // the drive-thru, where the first interview after the news happened
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      const m = (DRIVE.a + DRIVE.b) / 2;
      y = Math.round(m - 14);
      let lo = 99, hi = 0; for (let k = -18; k < 30; k++) { lo = Math.min(lo, vanX(y + k)); hi = Math.max(hi, vanX(y + k)); }
      x = Math.round(DRIVE.dir > 0 ? hi + 5 : lo - 5 - 14);
      px(x, y, 14, 26, "#c8302a"); px(x, y, 14, 3, "#ffd23f"); px(x + 2, y + 6, 10, 6, "#f2e8b0");
      px(DRIVE.dir > 0 ? x : x + 13, y + 14, 1, 4, "#cfe8ff");                                    // the window
      px(x + 2, y + 18, 4, 6, "#cfe8ff"); px(x + 8, y + 18, 4, 6, "#cfe8ff");
      { const ax = Math.round(DRIVE.dir > 0 ? x + 3 : x + 1), ay = y - 16;                         // golden arches on a pole
        px(ax + 4, ay + 10, 1, 6, "#9a9a9a");
        for (const ox of [0, 5]) { px(ax + ox, ay + 2, 1, 8, "#ffc72c"); px(ax + ox + 4, ay + 2, 1, 8, "#ffc72c"); px(ax + ox + 1, ay, 3, 1, "#ffc72c"); px(ax + ox + 1, ay + 1, 1, 1, "#ffc72c"); px(ax + ox + 3, ay + 1, 1, 1, "#ffc72c"); } }
      px(DRIVE.dir > 0 ? x + 15 : x - 4, y + 2, 3, 5, "#1a1a1a"); px(DRIVE.dir > 0 ? x + 15 : x - 4, y + 3, 3, 1, "#ffd23f");   // menu board
      person(px, DRIVE.dir > 0 ? x - 1 : x + 12, y + 18, "#e0302f", "#3a2a1a", "#2a2a3a", "#c08a5a"); // our interviewee, out by the lane
    },
  },
  dc: {
    ground: ["#2f6a32", "#285c2c"],
    edge: pick(eTree),
    under: ({ ctx, px, y0, h, rnd, live }) => {
           // the road comes in through the forest
    for (let k = 0; k < 90; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * 40); px(x - 2, y, 5, 4, ["#1f5a2a", "#2a6a32", "#174a24"][k % 3]); px(x - 1, y - 1, 3, 1, "#3a7a3a"); }
    },
    // out of the forest into D.C.: the Capitol, the Monument, scooters everywhere, the Beast going by
    draw: ({ ctx, px, y0, h, rnd, live, hd, canopy, glow }) => {
      let x = 0, y = 0;
      y = y0 + 48; x = free(y, 14, 12);
      px(x + 1, y + 6, 9, 4, "#f2f2f2"); px(x + 3, y + 3, 5, 3, "#f2f2f2"); px(x + 4, y + 1, 3, 2, "#f2f2f2"); px(x + 5, y, 1, 1, "#f2f2f2");
      for (let k = 2; k < 10; k += 2) px(x + k, y + 7, 1, 3, "#c8c8c8");
      y = y0 + 64; x = free(y, 34, 12);
      px(x + 4, y, 3, 28, "#f2f2f2"); px(x + 5, y - 2, 1, 2, "#f2f2f2"); px(x + 4, y + 28, 3, 1, "#c8c8c8");
      px(x, y + 30, 12, 3, "#2f6fb0"); px(x + 4, y + 31, 3, 1, "#9ac8f0");
      live.push({ k: "scoot", a: y0 + 40, b: y0 + h - 2 });
      live.push({ k: "beast", a: y0 + 8, b: y0 + h - 2 });
    },
  },
};

/* ---------- the out-of-place 3D render (Green Bank) ---------- */

// smooth, shaded, nothing like the rest: drawn onto its own hi-res canvas
function drawDish3D(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const g = (x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => { const gr = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  // soft ground shadow
  const sh = ctx.createRadialGradient(w * 0.5, h * 0.93, 2, w * 0.5, h * 0.93, w * 0.45);
  sh.addColorStop(0, "rgba(0,0,0,0.45)"); sh.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = sh; ctx.fillRect(0, h * 0.8, w, h * 0.2);
  // lattice tower
  ctx.fillStyle = g(w * 0.3, 0, w * 0.7, 0, [[0, "#b9bec6"], [0.5, "#ffffff"], [1, "#8a909a"]]);
  ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.9); ctx.lineTo(w * 0.42, h * 0.45); ctx.lineTo(w * 0.58, h * 0.45); ctx.lineTo(w * 0.7, h * 0.9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(90,96,108,0.8)"; ctx.lineWidth = Math.max(1, w / 90);
  for (let k = 0; k < 6; k++) { const y = h * (0.47 + k * 0.072); ctx.beginPath(); ctx.moveTo(w * (0.42 - k * 0.019), y); ctx.lineTo(w * (0.58 + k * 0.019), y + h * 0.072); ctx.moveTo(w * (0.58 + k * 0.019), y); ctx.lineTo(w * (0.42 - k * 0.019), y + h * 0.072); ctx.stroke(); }
  // base
  ctx.fillStyle = g(0, h * 0.86, 0, h * 0.94, [[0, "#d8dce2"], [1, "#7a808a"]]); ctx.fillRect(w * 0.22, h * 0.86, w * 0.56, h * 0.07);
  // the dish: a tilted ellipse with a glossy highlight
  ctx.save(); ctx.translate(w * 0.5, h * 0.3); ctx.rotate(-0.35);
  ctx.fillStyle = g(-w * 0.45, 0, w * 0.45, 0, [[0, "#7a828e"], [0.35, "#f4f6fa"], [0.55, "#ffffff"], [1, "#9aa2ae"]]);
  ctx.beginPath(); ctx.ellipse(0, 0, w * 0.46, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = g(0, -h * 0.1, 0, h * 0.12, [[0, "rgba(40,48,60,0.35)"], [1, "rgba(255,255,255,0)"]]);
  ctx.beginPath(); ctx.ellipse(0, h * 0.01, w * 0.4, h * 0.1, 0, 0, Math.PI * 2); ctx.fill();
  const spec = ctx.createRadialGradient(-w * 0.12, -h * 0.04, 1, -w * 0.12, -h * 0.04, w * 0.22);
  spec.addColorStop(0, "rgba(255,255,255,0.95)"); spec.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = spec;
  ctx.beginPath(); ctx.ellipse(0, 0, w * 0.46, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  // feed arm sweeping up and over
  ctx.strokeStyle = g(w * 0.3, 0, w * 0.45, 0, [[0, "#c8ccd4"], [1, "#6a707a"]]); ctx.lineWidth = Math.max(2, w / 30); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(w * 0.36, h * 0.03); ctx.quadraticCurveTo(w * 0.4, -h * 0.22, w * 0.02, -h * 0.24); ctx.stroke();
  ctx.fillStyle = g(0, -h * 0.28, 0, -h * 0.2, [[0, "#ffffff"], [1, "#8a909a"]]); ctx.fillRect(-w * 0.04, -h * 0.28, w * 0.1, h * 0.07);
  ctx.restore();
  // a cheesy render-engine lens flare
  const fl = ctx.createRadialGradient(w * 0.82, h * 0.12, 0, w * 0.82, h * 0.12, w * 0.18);
  fl.addColorStop(0, "rgba(255,255,240,0.9)"); fl.addColorStop(0.3, "rgba(255,240,200,0.35)"); fl.addColorStop(1, "rgba(255,240,200,0)");
  ctx.fillStyle = fl; ctx.fillRect(0, 0, w, h);
}

