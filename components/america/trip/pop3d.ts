// The solid bits of the trip: Kansas's windmills, turbines, elevators, crosses and billboards
// pop up out of their own pixel art as the van gets near, and our white minivan is a real 3D
// van that turns with the road, Jason driving and me hanging out the passenger window, the two
// of us climbing out when we park for an interview. A tiny painter's-algorithm renderer on a
// smooth canvas over the pixels; `proj` decides how the map is seen (flat from above with a
// little lean, or through the CSS tilt of the Kansas sundown).

import { hash, room } from "./core";

export type Pop =
  | { k: "turbine"; x: number; y: number; h?: number }
  | { k: "windmill"; x: number; y: number }
  | { k: "box"; x: number; y: number; w: number; d: number; h: number; c: string; roof?: string; gable?: boolean }
  | { k: "bin"; x: number; y: number; r: number; h: number; c: string; cone?: string }
  | { k: "cross"; x: number; y: number; h: number }
  | { k: "tower"; x: number; y: number; h: number; c: string; cap: string }
  | { k: "sign"; x: number; y: number; w: number; h: number; lift: number; bg: string; lines: [string, string][] };
// filled by the scene modules while the strip is drawn (drawStrip clears it first)
export const POP: Pop[] = [];

// map (x, y, height) → screen [x, y, depth] (bigger depth = farther), or null if behind the camera
export type Proj = (x: number, y: number, z: number) => [number, number, number] | null;
export type View = {
  proj: Proj; t: number; vy: number; spin: number; dusk: number;
  van: { x: number; y: number; fx: number; fy: number };
  out: number;          // 0 = in the van, 1 = out of it, interviewing
  side: number;         // which side of the van we get out on (+1 = map right)
  w: number; h: number; // canvas size, css px
  pops: boolean;
  near: boolean;        // false: leave out what stands between the camera and the road (it'd fill the screen)
};

type Prim =
  | { d: number; k: "poly"; p: number[]; fill: string; line?: string; lw?: number; a?: number }
  | { d: number; k: "line"; p: number[]; line: string; lw: number }
  | { d: number; k: "dot"; p: number[]; r: number; fill: string; line?: string }
  | { d: number; k: "text"; p: number[]; bg: string; lines: [string, string][]; ratio: number };

const clamp = (u: number) => Math.min(1, Math.max(0, u));
const smooth = (u: number) => { const v = clamp(u); return v * v * (3 - 2 * v); };
const back = (u: number) => { const v = clamp(u), c = 2.2; return 1 + (c + 1) * (v - 1) ** 3 + c * (v - 1) ** 2; };   // pop, overshoot, settle

const rgb = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const SUNSET = [255, 122, 58];
// flat shading: low sun from the west (up the map), warmer as the sun goes
function shade(c: string, n: [number, number, number], dusk: number) {
  const L = [-0.25, -0.75, 0.6], len = Math.hypot(...n) || 1;
  const k = 0.62 + 0.42 * Math.max(0, (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / len);
  const [r, g, b] = rgb(c), w = dusk * 0.28;
  const f = (v: number, s: number) => Math.round(Math.min(255, (v * (1 - w) + s * w) * k * (1 - dusk * 0.18)));
  return `rgb(${f(r, SUNSET[0])},${f(g, SUNSET[1])},${f(b, SUNSET[2])})`;
}

export function render3D(ctx: CanvasRenderingContext2D, v: View) {
  const P: Prim[] = [], shadows: number[][] = [];
  const { proj, t, dusk } = v;
  const pr = (x: number, y: number, z: number) => proj(x, y, z);

  // a flat face through 3D points (map units), shaded by its normal
  const face = (pts: [number, number, number][], c: string, line = "rgba(0,0,0,.55)", lw = 1, flat = false) => {
    const p: number[] = []; let d = 0;
    for (const [x, y, z] of pts) { const q = pr(x, y, z); if (!q) return; p.push(q[0], q[1]); d += q[2]; }
    const [a, b, e] = pts;
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [e[0] - a[0], e[1] - a[1], e[2] - a[2]];
    let n: [number, number, number] = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    if (n[2] < 0 || (n[2] === 0 && n[1] < 0)) n = [-n[0], -n[1], -n[2]];
    P.push({ d: d / pts.length, k: "poly", p, fill: flat ? c : shade(c, n, dusk), line, lw });
  };
  const seg = (a: [number, number, number], b: [number, number, number], c: string, lw: number) => {
    const p = pr(...a), q = pr(...b); if (!p || !q) return;
    P.push({ d: (p[2] + q[2]) / 2, k: "line", p: [p[0], p[1], q[0], q[1]], line: c, lw });
  };
  const dot = (x: number, y: number, z: number, r: number, c: string, line?: string) => {
    const q = pr(x, y, z), e = pr(x, y, z + r); if (!q || !e) return;
    P.push({ d: q[2] - 0.001, k: "dot", p: [q[0], q[1]], r: Math.max(1, Math.hypot(e[0] - q[0], e[1] - q[1])), fill: c, line });
  };
  const shadow = (pts: [number, number][]) => {
    const p: number[] = [];
    for (const [x, y] of pts) { const q = pr(x, y, 0); if (!q) return; p.push(q[0], q[1]); }
    shadows.push(p);
  };
  // an upright box, footprint centred on (x, y), turned by yaw (radians)
  const box = (x: number, y: number, w: number, d: number, z0: number, h: number, c: string, top = c, yaw = 0) => {
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const C = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => [x + a * cs - b * sn, y + a * sn + b * cs]);
    for (let i = 0; i < 4; i++) { const [a, b] = [C[i], C[(i + 1) % 4]]; face([[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z0 + h], [a[0], a[1], z0 + h]], c); }
    face(C.map(([a, b]) => [a, b, z0 + h] as [number, number, number]), top);
    return C;
  };

  /* ---------- the popped-up landmarks ---------- */
  const vd = pr(v.van.x, v.van.y, 0)?.[2] ?? 0;
  const list = v.pops ? POP.slice() : [];
  for (let i = 0; i < list.length; i++) {
    const o = list[i];
    const dist = Math.abs(o.y - v.vy);
    if (dist > 190) continue;
    const g = back((185 - dist) / 45);
    if (g <= 0.01) continue;
    const base = pr(o.x, o.y, 0);
    if (!v.near && base && base[2] < vd) {
      // side-on, what's on the near side would fill the screen: it pops up across the road instead
      const dx = 2 * (v.van.x - o.x) + 10;
      const m = { ...o, x: o.x + dx };
      if (Math.abs(o.y - v.vy) < 190) list.push(m);
      continue;
    }
    if (!base || base[0] < -250 || base[0] > v.w + 250 || base[1] < -400 || base[1] > v.h + 250) continue;
    // things that face you (rotors, signboards) turn with the camera: up the map from above, across it side-on
    const face_ = (v.spin * Math.PI) / 2;
    const fx = -Math.sin(face_), fy = Math.cos(face_);      // the facing direction's in-plane axis
    switch (o.k) {
      case "turbine": {
        const H = (o.h ?? 30) * g, hub = H + 0.6;
        shadow([[o.x - 1, o.y], [o.x + 1, o.y], [o.x + 9, o.y + H * 0.5], [o.x + 7, o.y + H * 0.5]]);
        const n = 6;
        for (let i = 0; i < n; i++) {                                   // a tapered white tower
          const a0 = (i / n) * 6.283, a1 = ((i + 1) / n) * 6.283, r0 = 0.9, r1 = 0.45;
          face([[o.x + Math.cos(a0) * r0, o.y + Math.sin(a0) * r0, 0], [o.x + Math.cos(a1) * r0, o.y + Math.sin(a1) * r0, 0],
            [o.x + Math.cos(a1) * r1, o.y + Math.sin(a1) * r1, H], [o.x + Math.cos(a0) * r1, o.y + Math.sin(a0) * r1, H]], "#f2f2f2", "rgba(0,0,0,.2)");
        }
        box(o.x + fx * 0.3, o.y + fy * 0.3, 1.6, 3.4, H - 0.6, 1.6, "#e8e8e8", "#f8f8f8", face_);
        const R = 12 * g, sp = 1.3 + hash(o.x * 7 + o.y) * 0.5, ph = hash(o.y * 3 + o.x) * 6.28;
        const hx = o.x + fx * 2.2, hy = o.y + fy * 2.2, px_ = -fy, py_ = fx;   // the hub, out in front of the nacelle; the disc spans px_/py_ and up
        for (let b = 0; b < 3; b++) {
          const a = t * sp + ph + (b * 2 * Math.PI) / 3, ca = Math.cos(a), sa = Math.sin(a);
          const along = (r: number, wd: number): [number, number, number] => [hx + px_ * (ca * r - sa * wd), hy + py_ * (ca * r - sa * wd), hub + sa * r + ca * wd];
          face([along(0.6, -0.4), along(R, -0.15), along(R, 0.1), along(0.6, 0.5)], "#fafafa", "rgba(0,0,0,.25)");
        }
        dot(hx, hy, hub, 0.7, "#dedede", "rgba(0,0,0,.4)");
        // the red light on top, blinking us to sleep
        if ((t * (0.9 + dusk * 1.4) + o.y * 0.002) % 1 < 0.2) dot(o.x, o.y, H + 1.4, 0.55, "#ff2a1a");
        break;
      }
      case "windmill": {
        const H = 14 * g;
        shadow([[o.x - 2, o.y - 1], [o.x + 2, o.y - 1], [o.x + 6, o.y + H * 0.45], [o.x + 4, o.y + H * 0.45]]);
        const legs = [[-2, -2], [2, -2], [2, 2], [-2, 2]];
        for (const [a, b] of legs) seg([o.x + a, o.y + b, 0], [o.x + a * 0.2, o.y + b * 0.2, H], "#6a6a6a", 1.2);
        for (let k = 1; k < 4; k++) {                                    // braces
          const z = (H * k) / 4, s = 2 - 1.6 * (k / 4);
          for (let i = 0; i < 4; i++) { const [a, b] = legs[i], [c, d] = legs[(i + 1) % 4]; seg([o.x + a * s / 2, o.y + b * s / 2, z], [o.x + c * s / 2, o.y + d * s / 2, z], "#8a8a8a", 0.8); }
        }
        face([[o.x - fx * 1.5, o.y - fy * 1.5, H + 0.9], [o.x - fx * 6, o.y - fy * 6, H + 2.2], [o.x - fx * 6, o.y - fy * 6, H - 0.4], [o.x - fx * 1.5, o.y - fy * 1.5, H + 0.3]], "#c83a2a");   // the tail vane
        const R = 4.2 * g, hx = o.x + fx * 0.9, hy = o.y + fy * 0.9, hz = H + 0.6, sp = 2 + hash(o.y) * 1.2;
        for (let b = 0; b < 12; b++) {
          const a = t * sp + (b * 2 * Math.PI) / 12, a2 = a + 0.2;
          const pt = (an: number, r: number): [number, number, number] => [hx - fy * Math.cos(an) * r, hy + fx * Math.cos(an) * r, hz + Math.sin(an) * r];
          face([pt(a, 1.2), pt(a, R), pt(a2, R), pt(a2, 1.2)], b % 2 ? "#e8e8e8" : "#cfcfcf", "rgba(0,0,0,.35)");
        }
        dot(hx, hy, hz, 0.6, "#444");
        break;
      }
      case "box": {
        const H = o.h * g;
        shadow([[o.x - o.w / 2, o.y - o.d / 2], [o.x + o.w / 2, o.y - o.d / 2], [o.x + o.w / 2 + H * 0.3, o.y + o.d / 2 + H * 0.4], [o.x - o.w / 2 + H * 0.3, o.y + o.d / 2 + H * 0.4]]);
        box(o.x, o.y, o.w, o.d, 0, H, o.c, o.gable ? o.c : (o.roof ?? o.c));
        if (o.gable) {                                                   // ridge runs along x
          const r = o.roof ?? "#5a2a1a", hz = H + Math.min(o.w, o.d) * 0.45 * g, x0 = o.x - o.w / 2, x1 = o.x + o.w / 2, y0 = o.y - o.d / 2, y1 = o.y + o.d / 2;
          face([[x0, y0, H], [x1, y0, H], [x1, o.y, hz], [x0, o.y, hz]], r);
          face([[x0, y1, H], [x1, y1, H], [x1, o.y, hz], [x0, o.y, hz]], r);
          face([[x0, y0, H], [x0, y1, H], [x0, o.y, hz]], o.c);
          face([[x1, y0, H], [x1, y1, H], [x1, o.y, hz]], o.c);
        }
        break;
      }
      case "bin": {
        const H = o.h * g, n = 10;
        shadow([[o.x - o.r, o.y], [o.x + o.r, o.y], [o.x + o.r + H * 0.3, o.y + H * 0.4], [o.x - o.r + H * 0.3, o.y + H * 0.4]]);
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * 6.283, a1 = ((i + 1) / n) * 6.283;
          face([[o.x + Math.cos(a0) * o.r, o.y + Math.sin(a0) * o.r, 0], [o.x + Math.cos(a1) * o.r, o.y + Math.sin(a1) * o.r, 0],
            [o.x + Math.cos(a1) * o.r, o.y + Math.sin(a1) * o.r, H], [o.x + Math.cos(a0) * o.r, o.y + Math.sin(a0) * o.r, H]], o.c, "rgba(0,0,0,.18)");
          face([[o.x + Math.cos(a0) * o.r, o.y + Math.sin(a0) * o.r, H], [o.x + Math.cos(a1) * o.r, o.y + Math.sin(a1) * o.r, H], [o.x, o.y, H + (o.cone ? o.r * 0.6 : 0) * g]], o.cone ?? o.c, "rgba(0,0,0,.18)");
        }
        break;
      }
      case "tower": {
        const H = o.h * g;
        shadow([[o.x - 2, o.y - 2], [o.x + 2, o.y - 2], [o.x + 2 + H * 0.3, o.y + 2 + H * 0.4], [o.x - 2 + H * 0.3, o.y + 2 + H * 0.4]]);
        box(o.x, o.y, 4, 4, 0, H, o.c);
        face([[o.x - 2, o.y - 2, H], [o.x + 2, o.y - 2, H], [o.x, o.y, H + 6 * g]], o.cap);
        face([[o.x + 2, o.y - 2, H], [o.x + 2, o.y + 2, H], [o.x, o.y, H + 6 * g]], o.cap);
        face([[o.x + 2, o.y + 2, H], [o.x - 2, o.y + 2, H], [o.x, o.y, H + 6 * g]], o.cap);
        face([[o.x - 2, o.y + 2, H], [o.x - 2, o.y - 2, H], [o.x, o.y, H + 6 * g]], o.cap);
        dot(o.x, o.y, H + 6.4 * g, 0.5, "#f2f2f2");
        break;
      }
      case "cross": {
        const H = o.h * g;
        box(o.x, o.y, 2.2, 2.2, 0, H, "#f8f8f8");
        const arm = 7 * g, z = H * 0.66;
        const ax = -fy, ay = fx;                                          // the arms face you
        face([[o.x - ax * arm, o.y - ay * arm, z], [o.x + ax * arm, o.y + ay * arm, z], [o.x + ax * arm, o.y + ay * arm, z + 2.4], [o.x - ax * arm, o.y - ay * arm, z + 2.4]], "#ffffff", "rgba(0,0,0,.3)");
        break;
      }
      case "sign": {
        const ax = -fy, ay = fx, hw = o.w / 2, z0 = o.lift * g, z1 = z0 + o.h * g;
        for (const s of [-0.6, 0.6]) seg([o.x + ax * hw * s, o.y + ay * hw * s, 0], [o.x + ax * hw * s, o.y + ay * hw * s, z0], "#6a4a2a", 1.6);
        const a = pr(o.x + ax * hw, o.y + ay * hw, z1), b = pr(o.x - ax * hw, o.y - ay * hw, z1), c = pr(o.x + ax * hw, o.y + ay * hw, z0), d = pr(o.x - ax * hw, o.y - ay * hw, z0);
        if (a && b && c && d && g > 0.3) P.push({ d: (a[2] + b[2] + c[2] + d[2]) / 4, k: "text", p: [a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]], bg: o.bg, lines: o.lines, ratio: o.h / o.w });
        break;
      }
    }
  }

  /* ---------- the van ---------- */
  {
    const dusk = v.dusk * 0.35;
    const face = (pts: [number, number, number][], c: string, line = "rgba(0,0,0,.55)", lw = 1, flat = false) => {
      const p: number[] = []; let d = 0;
      for (const [x, y, z] of pts) { const q = pr(x, y, z); if (!q) return; p.push(q[0], q[1]); d += q[2]; }
      const [a, b, e] = pts;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [e[0] - a[0], e[1] - a[1], e[2] - a[2]];
      let n: [number, number, number] = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      if (n[2] < 0 || (n[2] === 0 && n[1] < 0)) n = [-n[0], -n[1], -n[2]];
      P.push({ d: d / pts.length, k: "poly", p, fill: flat ? c : shade(c, n, dusk), line, lw });
    };
    const { x: vx, y: vy, fx, fy } = v.van, Lx = fy, Ly = -fx;
    const at = (a: number, b: number, z: number): [number, number, number] => [vx + fx * a + Lx * b, vy + fy * a + Ly * b, z];
    shadow([[-5.6, -3.4], [5.6, -3.4], [5.6, 3.4], [-5.6, 3.4]].map(([a, b]) => { const p = at(a, b, 0); return [p[0] + 0.8, p[1] + 1] as [number, number]; }));
    // side profile (along, up), back to front, extruded across the van's width
    const PR: [number, number][] = [[-5, 0.9], [-5, 5], [2.3, 5.1], [4.1, 3.2], [5, 2.9], [5, 0.9]];
    const B = 3, ink = "#111";
    for (const s of [-1, 1]) face(PR.map(([a, z]) => at(a, s * B, z)), "#f0f0f0", ink, 1.2);
    for (let i = 0; i < PR.length - 1; i++) {
      const [a0, z0] = PR[i], [a1, z1] = PR[i + 1];
      const glass = i === 2;                                               // the windshield
      face([at(a0, -B, z0), at(a0, B, z0), at(a1, B, z1), at(a1, -B, z1)], glass ? "#1a2a3a" : i === 1 ? "#ffffff" : "#e6e6e6", ink, 1.2, glass);
    }
    face([at(-5.02, -2.4, 3.2), at(-5.02, 2.4, 3.2), at(-5.02, 2.4, 4.7), at(-5.02, -2.4, 4.7)], "#1a2a3a", ink, 1, true);   // back window
    for (const s of [-1, 1]) {
      const b = s * (B + 0.02);
      face([at(-4.4, b, 3.3), at(-0.6, b, 3.3), at(-0.6, b, 4.75), at(-4.4, b, 4.75)], "#1a2a3a", ink, 1, true);           // side windows
      face([at(-0.2, b, 3.3), at(2.0, b, 3.3), at(2.0, b, 4.75), at(-0.2, b, 4.75)], "#1a2a3a", ink, 1, true);
      for (const a of [-3.2, 3.0]) {                                        // wheels
        const W8: [number, number, number][] = [];
        for (let k = 0; k < 8; k++) { const an = (k / 8) * 6.283; W8.push(at(a + Math.cos(an) * 1.05, b * 1.003, 1.0 + Math.sin(an) * 1.05)); }
        face(W8, "#151515", "#000", 1, true);
      }
      face([at(-5.03, s * 2.2, 1.6), at(-5.03, s * 2.9, 1.6), at(-5.03, s * 2.9, 2.6), at(-5.03, s * 2.2, 2.6)], "#e0302f", ink, 0.8, true);   // tail lights
      face([at(5.03, s * 2.0, 1.7), at(5.03, s * 2.8, 1.7), at(5.03, s * 2.8, 2.4), at(5.03, s * 2.0, 2.4)], "#fff6a0", ink, 0.8, true);       // headlights
    }
    // Jason driving (left), me riding shotgun: hanging out the windows, hair in the wind
    const inVan = 1 - smooth(v.out / 0.2);
    const head = (b: number, shirt: string, hair: string, wave: boolean) => {
      const lean = inVan, hb = b * (B + 0.3 + 1.2 * lean), hz = 4.3 + 1.2 * lean;
      if (lean < 0.05) return;
      const sh = at(1.0, b * (B + 0.2 + 0.6 * lean), 3.9);
      dot(sh[0], sh[1], sh[2], 0.9, shirt, ink);
      const h = at(1.1, hb, hz);
      dot(h[0], h[1], h[2], 1.3, "#f0c8a0", ink);
      const hr = at(0.5, hb, hz + 0.6);
      dot(hr[0], hr[1], hr[2], 1.0, hair);
      for (let k = 0; k < 3; k++) {                                        // hair streaming back
        const fl = Math.sin(t * 14 + k * 2) * 0.25;
        seg(at(0.4, hb + (k - 1) * 0.35, hz + 0.6), at(-0.9 - k * 0.2, hb + (k - 1) * 0.4 + fl, hz + 0.55 + fl), hair, 1.1);
      }
      if (wave) {                                                          // my arm out, waving at Kansas
        const w = Math.sin(t * 7) * 0.9;
        const s0 = at(1.6, b * (B + 0.3), 3.9), hand = at(2.4 + w * 0.4, b * (B + 2.4), 6.4 + w);
        seg(s0, hand, "#f0c8a0", 2); dot(hand[0], hand[1], hand[2], 0.45, "#f0c8a0", ink);
      } else {
        const s0 = at(0.6, b * (B + 0.1), 3.6), hand = at(-0.6, b * (B + 1.0), 3.4);
        seg(s0, hand, "#2f8a3a", 2);
      }
    };
    head(1, "#2f8a3a", "#5a3a1a", false);     // Jason, green Cummins tee
    head(-1, "#f2f2f2", "#4a2e1a", true);     // me
    // out of the van for an interview: Jason filming, me with the mic
    if (v.out > 0.05) {
      const s = v.side * (fx >= 0 ? 1 : 1);
      const walk = smooth((v.out - 0.15) / 0.5);
      const K = 1.8, lw = (n: number) => n * Math.max(1, Math.abs((pr(v.van.x + 1, v.van.y, 0)?.[0] ?? 1) - (pr(v.van.x, v.van.y, 0)?.[0] ?? 0)) / 3);
      const person = (a0: number, a1: number, b1: number, shirt: string, hair: string, prop: "cam" | "mic") => {
        const a = a0 + (a1 - a0) * walk, b = s * (B + 0.6 + (b1 - B - 0.6) * walk);
        const step = walk < 1 && walk > 0 ? Math.sin(t * 12) * 0.5 * K : 0;
        const p = at(a, b, 0);
        for (const l of [-0.4, 0.4]) { const f0 = at(a + l * step, b + l * K, 0), h0 = at(a, b + l * 0.5 * K, 2.4 * K); seg(f0, h0, "#2a3a5a", lw(2.4)); }
        seg(at(a, b, 2.4 * K), at(a, b, 4.6 * K), shirt, lw(4.6));
        const hd = at(a, b, 5.5 * K); dot(hd[0], hd[1], hd[2], 1.0 * K, "#f0c8a0", ink);
        const hr = at(a - 0.25 * K, b, 6.0 * K); dot(hr[0], hr[1], hr[2], 0.75 * K, hair);
        const toward = s * K;   // facing out, toward whoever we're talking to
        if (prop === "mic") {
          const hand = at(a + 0.3 * K, b + toward * 1.4, 4.4 * K), mic = at(a + 0.4 * K, b + toward * 2.2, 5.0 * K);
          seg(at(a, b, 4.3 * K), hand, "#f0c8a0", lw(1.8)); seg(hand, mic, "#111", lw(1.8)); dot(mic[0], mic[1], mic[2], 0.4 * K, "#333");
        } else {
          const cam = at(a + 0.2 * K, b + toward * 1.0, 5.4 * K);
          seg(at(a, b, 4.4 * K), cam, "#f0c8a0", lw(1.8)); dot(cam[0], cam[1], cam[2], 0.75 * K, "#111");
          dot(cam[0], cam[1], cam[2] + 0.1, 0.3 * K, "#6a9ad8");
        }
        shadows.push(((): number[] => { const o: number[] = []; for (let k = 0; k < 8; k++) { const an = (k / 8) * 6.283; const q = pr(p[0] + Math.cos(an) * 1.0 + 0.4, p[1] + Math.sin(an) * 0.8 + 0.5, 0); if (!q) return []; o.push(q[0], q[1]); } return o; })());
      };
      person(1.2, 3.4, B + 6.5, "#f2f2f2", "#4a2e1a", "mic");     // me, from the passenger door
      person(-0.6, -2.4, B + 5.0, "#2f8a3a", "#5a3a1a", "cam");   // Jason, round from the driver's side
    }
  }

  /* ---------- paint, back to front ---------- */
  ctx.fillStyle = `rgba(20,10,30,${0.22 + dusk * 0.1})`;
  for (const p of shadows) { if (p.length < 6) continue; ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); ctx.fill(); }
  P.sort((a, b) => b.d - a.d);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  for (const q of P) {
    if (q.k === "poly") {
      ctx.beginPath(); ctx.moveTo(q.p[0], q.p[1]); for (let i = 2; i < q.p.length; i += 2) ctx.lineTo(q.p[i], q.p[i + 1]); ctx.closePath();
      ctx.fillStyle = q.fill; ctx.fill();
      if (q.line) { ctx.strokeStyle = q.line; ctx.lineWidth = q.lw ?? 1; ctx.stroke(); }
    } else if (q.k === "line") {
      ctx.beginPath(); ctx.moveTo(q.p[0], q.p[1]); ctx.lineTo(q.p[2], q.p[3]); ctx.strokeStyle = q.line; ctx.lineWidth = q.lw; ctx.stroke();
    } else if (q.k === "dot") {
      ctx.beginPath(); ctx.arc(q.p[0], q.p[1], q.r, 0, 6.283); ctx.fillStyle = q.fill; ctx.fill();
      if (q.line) { ctx.strokeStyle = q.line; ctx.lineWidth = 1; ctx.stroke(); }
    } else {
      // a billboard: the board, then its words mapped onto it (affine is plenty at this size)
      const [ax, ay, bx, by, cx, cy, dx, dy] = q.p;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(dx, dy); ctx.lineTo(cx, cy); ctx.closePath();
      ctx.fillStyle = q.bg; ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = 1.5; ctx.stroke();
      const U = 100, V = U * q.ratio;
      ctx.save();
      ctx.setTransform(new DOMMatrix([(bx - ax) / U, (by - ay) / U, (cx - ax) / V, (cy - ay) / V, ax, ay]).preMultiplySelf(ctx.getTransform()));
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const n = q.lines.length;
      q.lines.forEach(([s, c], i) => {
        let fs = (V / n) * 0.78; ctx.font = `900 ${fs}px Arial, Helvetica, sans-serif`;
        const m = ctx.measureText(s).width; if (m > U * 0.9) { fs *= (U * 0.9) / m; ctx.font = `900 ${fs}px Arial, Helvetica, sans-serif`; }
        ctx.fillStyle = c; ctx.fillText(s, U / 2, (V * (i + 0.55)) / n);
      });
      ctx.restore();
    }
  }
}

// which side of the road has the room to get out on, at row y
export const outSide = (y: number) => { const r = room(y, 10); return r.right >= r.left ? 1 : -1; };
