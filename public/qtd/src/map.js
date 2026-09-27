/* Map — one continuous view, two levels of detail.
 *
 *   world     black-and-white countries; each city shows one face and a count
 *             when zoomed out, and fans out into every episode's face as you
 *             zoom in. A dashed line traces the trip in the order it happened.
 *   new york  near New York, zooming in swaps the coarse coastline for the
 *             detailed boroughs, the subway (the MTA's own track shapes) and
 *             each episode's walking route. Anywhere else, zoom is just zoom.
 */
import { BASE, fetchJSON, esc, clamp, typeRGB, MOODS } from './util.js';

const cv = document.getElementById('map');
const ctx = cv.getContext('2d', { alpha: false });
const tip = document.getElementById('tip');
const callout = document.getElementById('nyccall');
const panel = document.querySelector('.hud-tl');

const MIN_S = 240, MAX_S = 4.2e6;
const CITY_AT = 45000, CITY_FULL = 110000;       // New York detail crossfade
const FAN_AT = 4200;                             // below this, one face per city
const NYC = { lat: 40.72, lng: -74.0 };
const METRO = [40.47, 41.0, -74.35, -73.68];

const S = {
  world: [], nyc: null, eps: [], clusters: [], nycEps: [], nycRoutes: [], nycLoose: [],
  journey: [], faces: new Map(), unplaced: 0,
  cam: { x: 0.3, y: 0.4, s: 800, tx: 0.3, ty: 0.4, ts: 800 },
  w: 1, h: 1, hover: null, drag: null, pinch: null, pointers: new Map(),
  touch: false, preview: null,
};

const mercX = lng => (lng + 180) / 360;
const mercY = lat => {
  const r = clamp(lat, -85.05, 85.05) * Math.PI / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};
const toScreen = (x, y) => [(x - S.cam.x) * S.cam.s + S.w / 2, (y - S.cam.y) * S.cam.s + S.h / 2];
const toWorld = (sx, sy) => [(sx - S.w / 2) / S.cam.s + S.cam.x, (sy - S.h / 2) / S.cam.s + S.cam.y];
const inMetro = ([la, lo]) => la > METRO[0] && la < METRO[1] && lo > METRO[2] && lo < METRO[3];

/* New York's detail only takes over when you're actually looking at New York:
   zooming into London used to flip the whole page into "subway view". */
function cityMix() {
  const byScale = clamp((S.cam.s - CITY_AT) / (CITY_FULL - CITY_AT), 0, 1);
  if (!byScale) return 0;
  const [cx, cy] = toWorld(S.w / 2, S.h / 2);
  const d = Math.hypot(cx - mercX(NYC.lng), cy - mercY(NYC.lat));
  return byScale * clamp(1 - (d - 0.0015) / 0.0025, 0, 1);
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect();
  S.w = Math.max(r.width, 1); S.h = Math.max(r.height, 1);
  cv.width = Math.max(1, Math.round(S.w * dpr));
  cv.height = Math.max(1, Math.round(S.h * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// the space the floating panels leave, measured rather than guessed
function inset() {
  if (S.w <= 700) return { l: 8, r: 8, t: 60, b: 8 };
  const p = panel.getBoundingClientRect(), c = cv.getBoundingClientRect();
  return { l: Math.max(8, p.right - c.left + 12), r: 70, t: 10, b: 10 };
}
function usableCentre() {
  const i = inset();
  return [i.l + (S.w - i.l - i.r) / 2, i.t + (S.h - i.t - i.b) / 2];
}
function frame(x0, y0, x1, y1, pad = 40, now = false, maxS = MAX_S) {
  const i = inset();
  const aw = Math.max(S.w - i.l - i.r - pad * 2, 80), ah = Math.max(S.h - i.t - i.b - pad * 2, 80);
  const s = clamp(Math.min(aw / Math.max(x1 - x0, 1e-9), ah / Math.max(y1 - y0, 1e-9)), MIN_S, maxS);
  const cx = i.l + pad + aw / 2, cy = i.t + pad + ah / 2;
  S.cam.ts = s;
  S.cam.tx = (x0 + x1) / 2 + (S.w / 2 - cx) / s;
  S.cam.ty = (y0 + y1) / 2 + (S.h / 2 - cy) / s;
  if (now) Object.assign(S.cam, { x: S.cam.tx, y: S.cam.ty, s: S.cam.ts });
}
const frameWorld = now => frame(mercX(-170), mercY(72), mercX(180), mercY(-50), 20, now);
function frameNYC(now) {
  // every walk on screen, not just the core: ep 71 is out in Tottenville
  const pts = S.nycRoutes.flatMap(r => r.route);
  const la = pts.map(p => p[0]), lo = pts.map(p => p[1]);
  frame(mercX(Math.min(...lo)), mercY(Math.max(...la)), mercX(Math.max(...lo)), mercY(Math.min(...la)), 24, now);
}
// the name over the panel: the subway view, the city you've zoomed to, or the world
function viewLabel() {
  if (cityMix() > 0.5) return 'New York · subway view';
  if (S.cam.s < FAN_AT) return 'The world';
  const [cx, cy] = toWorld(...usableCentre());
  let best = null, bd = Infinity;
  for (const c of S.clusters) { const d = Math.hypot(c.x - cx, c.y - cy); if (d < bd) { bd = d; best = c; } }
  return best && bd * S.cam.s < Math.min(S.w, S.h) * 0.45 ? best.short : 'The world';
}
function frameCity(cl) {
  // close enough to fan the faces out, never deep enough to trip the NYC view
  const d = 0.0035;
  frame(cl.x - d, cl.y - d, cl.x + d, cl.y + d, 60, false, CITY_AT * 0.6);
}
function zoomBy(f) {
  // around what you're looking at, not the middle of the Atlantic
  const [ux, uy] = usableCentre();
  const [wx, wy] = toWorld(ux, uy);
  S.cam.ts = clamp(S.cam.ts * f, MIN_S, MAX_S);
  S.cam.tx = wx - (ux - S.w / 2) / S.cam.ts;
  S.cam.ty = wy - (uy - S.h / 2) / S.cam.ts;
}

/* ---------- faces ------------------------------------------------------------ */
function face(e) {
  if (!e.face) return null;
  let img = S.faces.get(e.face);
  if (!img) { img = new Image(); img.src = `${BASE}media/frames/${e.face}`; S.faces.set(e.face, img); }
  return img.complete && img.naturalWidth ? img : null;
}
function drawFace(e, x, y, size) {
  const img = face(e);
  if (img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    // Most frames are portrait with a date/place banner burned in at the top
    // and subtitles at the bottom; a few are squares with the video between
    // black bars. Crop to the face either way instead of squashing the lot.
    let sx, sy, side;
    if (h > w * 1.25) { side = w * 0.86; sx = (w - side) / 2; sy = h * 0.2; }
    else { side = Math.min(w * 0.42, h * 0.6); sx = (w - side) / 2; sy = h * 0.12; }
    ctx.drawImage(img, sx, sy, side, side, x, y, size, size);
  } else {
    ctx.fillStyle = '#1c1c1c'; ctx.fillRect(x, y, size, size);
  }
  const [r, g, b] = typeRGB(e.type);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x, y + size - 3, size, 3);
}

/* ---------- drawing ------------------------------------------------------------ */
function polygon(ring, fn) {
  ctx.beginPath();
  for (let i = 0; i < ring.length; i++) { const [sx, sy] = fn(ring[i]); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); }
  ctx.closePath();
}

function draw() {
  ctx.fillStyle = '#070707';
  ctx.fillRect(0, 0, S.w, S.h);
  const mix = cityMix();
  if (mix < 1) {
    ctx.globalAlpha = 1 - mix;
    ctx.lineJoin = 'round';
    for (const c of S.world) for (const ring of c.r) {
      polygon(ring, p => toScreen(mercX(p[0]), mercY(p[1])));
      ctx.fillStyle = '#141414'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1; ctx.stroke();
    }
    drawJourney();
    drawClusters();
    ctx.globalAlpha = 1;
  }
  if (mix > 0 && S.nyc) { ctx.globalAlpha = mix; drawNYC(); ctx.globalAlpha = 1; }
  placeCallout(mix);
}

function drawJourney() {
  if (S.journey.length < 2) return;
  ctx.strokeStyle = 'rgba(255,229,0,.55)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  for (let i = 1; i < S.journey.length; i++) {
    const a = S.journey[i - 1], b = S.journey[i];
    let bx = b.x;
    // take the short way round: LA to Fiji crosses the Pacific, not the Atlantic
    if (bx - a.x > 0.5) bx -= 1; else if (a.x - bx > 0.5) bx += 1;
    for (const shift of [0, bx === b.x ? null : (bx < b.x ? 1 : -1)]) {
      if (shift === null) continue;
      const [x1, y1] = toScreen(a.x + shift, a.y), [x2, y2] = toScreen(bx + shift, b.y);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawClusters() {
  const fanned = S.cam.s >= FAN_AT;
  const TILE = fanned ? clamp(S.cam.s / 260, 14, 30) : 16;
  const gap = 2;
  const drawn = [];                              // in paint order, for picking
  const faces = [];                              // painted rects, so names never cover a face
  for (const cl of S.clusters) {
    const [cx, cy] = toScreen(cl.x, cl.y);
    cl._screen = [cx, cy];
    for (const e of cl.eps) e._rects = null;
    cl._rects = null;
    if (cx < -200 || cx > S.w + 200 || cy < -200 || cy > S.h + 200) continue;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
    if (!fanned) {
      // one face and a count: nine European cities no longer pile into one heap
      const e = cl.eps[0];
      const x = cx - TILE / 2, y = cy - TILE - 6;
      drawFace(e, x, y, TILE);
      // hit area = exactly what's painted: the face, plus the count badge
      cl._rects = [[x, y, TILE, TILE]];
      faces.push([x, y, TILE, TILE]);
      if (cl.eps.length > 1) {
        ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
        const t = String(cl.eps.length), w = ctx.measureText(t).width + 5;
        ctx.fillStyle = '#ffe500'; ctx.fillRect(x + TILE - 4, y - 5, w, 11);
        ctx.fillStyle = '#000'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(t, x + TILE - 1.5, y + 0.5);
        cl._rects.push([x + TILE - 4, y - 5, w, 11]);
        faces.push([x + TILE - 4, y - 5, w, 11]);
      }
      if (S.hover === cl) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 2.5, y - 2.5, TILE + 5, TILE + 5); }
      drawn.push(cl);
      continue;
    }
    const cols = Math.min(cl.eps.length, 4), rows = Math.ceil(cl.eps.length / cols);
    const bw = cols * TILE + (cols - 1) * gap, bh = rows * TILE + (rows - 1) * gap;
    const ox = cx - bw / 2, oy = cy - bh - 8;
    cl.eps.forEach((e, i) => {
      const x = ox + (i % cols) * (TILE + gap), y = oy + Math.floor(i / cols) * (TILE + gap);
      e._rects = [[x, y, TILE, TILE]];
      faces.push([x, y, TILE, TILE]);
      drawFace(e, x, y, TILE);
      if (S.hover === e || S.preview === e) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 2.5, y - 2.5, TILE + 5, TILE + 5);
      }
      drawn.push(e);
    });
  }
  S.drawn = drawn;

  // names for clusters on screen only, placed greedily so they never overprint
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const taken = [...faces];
  for (const cl of [...S.clusters].sort((a, b) => b.eps.length - a.eps.length)) {
    if (!cl._screen) continue;
    const [x, y] = cl._screen;
    if (x < -40 || x > S.w + 40 || y < -40 || y > S.h + 40) continue;
    const t = cl.short.toUpperCase(), w = ctx.measureText(t).width;
    const r = [x - w / 2 - 2, y + 6, w + 4, 12];
    if (taken.some(o => r[0] < o[0] + o[2] && r[0] + r[2] > o[0] && r[1] < o[1] + o[3] && r[1] + r[3] > o[1])) continue;
    taken.push(r);
    ctx.fillStyle = 'rgba(7,7,7,.82)'; ctx.fillRect(...r);
    ctx.fillStyle = 'rgba(232,232,232,.92)';
    ctx.fillText(t, x, y + 7);
  }
}

function drawNYC() {
  const P = p => toScreen(mercX(p[0]), mercY(p[1]));
  for (const l of S.nyc.land) {
    polygon(l.r, P);
    ctx.fillStyle = l.nyc ? '#161616' : '#101010'; ctx.fill();
    ctx.strokeStyle = l.nyc ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,.2)';
  for (const [name, lat, lng] of [['MANHATTAN', 40.785, -73.967], ['BROOKLYN', 40.655, -73.945],
       ['QUEENS', 40.715, -73.83], ['THE BRONX', 40.845, -73.87], ['STATEN ISLAND', 40.585, -74.14],
       ['NEW JERSEY', 40.73, -74.13]]) {
    const [x, y] = toScreen(mercX(lng), mercY(lat)); ctx.fillText(name, x, y);
  }
  ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 1; ctx.lineJoin = 'round';
  for (const ln of S.nyc.subway) {
    ctx.beginPath(); ln.p.forEach((p, i) => { const [x, y] = P(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  }
  if (S.cam.s > 160000) {
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (const st of S.nyc.stations) { const [x, y] = P(st.p); ctx.fillRect(x - 1, y - 1, 2, 2); }
  }
  const focus = S.hover || S.preview;
  ctx.lineCap = 'round';
  for (const r of S.nycRoutes) {
    r._pts = r.route.map(([la, lo]) => toScreen(mercX(lo), mercY(la)));
    ctx.strokeStyle = '#070707'; ctx.lineWidth = focus === r ? 7 : 5;
    ctx.beginPath(); r._pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  }
  for (const r of S.nycRoutes) {
    const [cr, cg, cb] = typeRGB(r.type);
    const on = focus === r;
    ctx.strokeStyle = on ? '#fff' : `rgba(${cr},${cg},${cb},${focus ? 0.3 : 0.95})`;
    ctx.lineWidth = on ? 3 : 2;
    ctx.beginPath(); r._pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  }
  ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const taken = [];
  for (const r of S.nycRoutes) {
    const [x, y] = r._pts[0];
    const t = String(r.n), w = ctx.measureText(t).width, rect = [x + 4, y - 7, w + 6, 14];
    if (focus !== r && taken.some(o => rect[0] < o[0] + o[2] && rect[0] + rect[2] > o[0] && rect[1] < o[1] + o[3] && rect[1] + rect[3] > o[1])) continue;
    taken.push(rect);
    ctx.fillStyle = focus === r ? '#fff' : 'rgba(7,7,7,.85)'; ctx.fillRect(...rect);
    ctx.fillStyle = focus === r ? '#000' : '#ffe500'; ctx.fillText(t, x + 7, y);
  }
}

function placeCallout(mix) {
  if (!S.nycEps.length || mix > 0.05) { callout.hidden = true; return; }
  const [x, y] = toScreen(mercX(NYC.lng), mercY(NYC.lat));
  const i = inset();
  // hidden rather than half-covered when the panel or an edge is in the way
  const narrow = S.w <= 700;
  const left = narrow ? x - 70 : x + 16;
  if (x < 0 || x > S.w || y < 20 || y > S.h - 20 || (!narrow && (left < i.l || left + 190 > S.w - 8 || y - 110 < i.t)) || (narrow && (left < 4 || left + 140 > S.w || y - 112 < panel.getBoundingClientRect().bottom - cv.getBoundingClientRect().top))) {
    callout.hidden = true; return;
  }
  callout.hidden = false;
  callout.style.left = `${x}px`;
  callout.style.top = `${y}px`;
}

/* ---------- picking: topmost first, the way it's painted ----------------------- */
function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy;
  const t = clamp(L ? ((px - x1) * dx + (py - y1) * dy) / L : 0, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
function pick(px, py) {
  if (cityMix() > 0.5) {
    let best = null, bd = S.touch ? 16 : 9;
    for (const r of S.nycRoutes) {
      if (!r._pts) continue;
      for (let i = 1; i < r._pts.length; i++) {
        const d = distToSeg(px, py, ...r._pts[i - 1], ...r._pts[i]);
        if (d < bd) { bd = d; best = r; }
      }
    }
    return best;
  }
  const list = S.drawn || [];
  const pad = S.touch ? 5 : 0;                   // a fingertip is wider than a cursor
  for (let i = list.length - 1; i >= 0; i--) {
    for (const R of list[i]._rects || []) {
      if (px >= R[0] - pad && px <= R[0] + R[2] + pad && py >= R[1] - pad && py <= R[1] + R[3] + pad) return list[i];
    }
  }
  return null;
}

function describe(h) {
  if (h.eps) return `<span class="label">${esc(h.name)}</span>${h.eps.length} episode${h.eps.length === 1 ? '' : 's'} — click to open up`;
  const where = [h.borough, (h.places || [])[0] || h.city].filter(Boolean)[0] || '';
  return `<span class="label">EP ${h.n} · ${esc(where)} · ${MOODS[h.mood] || ''}</span>${esc(h.question)}` +
         (S.touch ? '<span class="label">Tap again to open</span>' : '');
}
function showTip(h, x, y) {
  if (!h) { tip.hidden = true; return; }
  tip.innerHTML = describe(h);
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  tip.style.left = `${clamp(x + 14, 4, S.w - r.width - 4)}px`;
  tip.style.top = `${clamp(y + 14, 4, S.h - r.height - 4)}px`;
}
function activate(h, x, y) {
  if (!h) { S.preview = null; showTip(null); return; }
  if (h.eps) { frameCity(h); S.preview = null; showTip(null); return; }
  // on touch there's no hover: the first tap says what it is, the second opens
  if (S.touch && S.preview !== h) { S.preview = h; showTip(h, x, y); return; }
  location.href = `${BASE}e/${h.n}/`;
}

/* ---------- panels ---------------------------------------------------------------- */
function paintPanel() {
  const inCity = cityMix() > 0.5;
  document.getElementById('back').hidden = !inCity;
  const el = document.getElementById('places');
  if (inCity) {
    el.innerHTML = `<div class="sub">${S.nycRoutes.length} WALKS ON THE MAP</div>` +
      (S.nycLoose.length ? `<div class="sub">SOMEWHERE IN NEW YORK — NO ROUTE RECORDED</div>
       <div class="chips">${S.nycLoose.map(e => `<a href="${BASE}e/${e.n}/" title="${esc(e.question)}">${e.n}</a>`).join('')}</div>` : '');
  } else {
    el.innerHTML = `<button data-nyc="1">New York<b>${S.nycEps.length}</b></button>` +
      S.clusters.map((c, i) => `<button data-i="${i}">${esc(c.short)}<b>${c.eps.length}</b></button>`).join('') +
      `<button class="muted-row" disabled>No location yet<b>${S.unplaced}</b></button>`;
  }
  const key = t => `<div class="keyrow"><span class="dot" style="background:var(--${t[0]})"></span><span class="label">${t[1]}</span></div>`;
  const kinds = [['yellow', 'big question'], ['red', 'hot take'], ['green', 'about you']].map(key).join('');
  document.getElementById('legend').innerHTML = inCity
    ? `<div class="label">Each line is one episode's walk</div>${kinds}
       <div class="rule"></div><div class="keyrow"><span class="keyline thin"></span><span class="label">subway</span></div>`
    : `<div class="label">A face per episode; the stripe is its kind</div>${kinds}
       <div class="rule"></div>
       <div class="keyrow"><span class="dot city"></span><span class="label">where it was filmed</span></div>
       <div class="keyrow"><span class="keyline dashed"></span><span class="label">the trip, city to city, in order</span></div>`;
}

/* ---------- input: mouse, touch, pinch ------------------------------------------- */
function bind() {
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let lastTap = 0;

  cv.addEventListener('pointerdown', e => {
    S.touch = e.pointerType === 'touch';
    cv.setPointerCapture(e.pointerId);
    S.pointers.set(e.pointerId, local(e));
    if (S.pointers.size === 2) {
      const [a, b] = [...S.pointers.values()];
      S.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: S.cam.ts };
      S.drag = null;
    } else {
      const [x, y] = local(e);
      S.drag = { x, y, moved: false };
    }
  });
  cv.addEventListener('pointermove', e => {
    const [x, y] = local(e);
    if (S.pointers.has(e.pointerId)) S.pointers.set(e.pointerId, [x, y]);
    if (S.pinch && S.pointers.size === 2) {
      // two fingers: zoom about their midpoint
      const [a, b] = [...S.pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const [bx, by] = toWorld(mx, my);
      S.cam.s = S.cam.ts = clamp(S.pinch.s * d / Math.max(S.pinch.d, 1), MIN_S, MAX_S);
      const [ax, ay] = toWorld(mx, my);
      S.cam.x += bx - ax; S.cam.y += by - ay; S.cam.tx = S.cam.x; S.cam.ty = S.cam.y;
      return;
    }
    if (S.drag) {
      const dx = x - S.drag.x, dy = y - S.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > (S.touch ? 8 : 3)) S.drag.moved = true;
      if (S.drag.moved) {
        cv.classList.add('dragging');
        S.cam.x -= dx / S.cam.s; S.cam.y -= dy / S.cam.s;
        S.cam.tx = S.cam.x; S.cam.ty = S.cam.y;
        S.drag.x = x; S.drag.y = y;
      }
      return;
    }
    if (S.touch) return;
    S.mouse = [x, y];
    S.hover = pick(x, y);
    cv.classList.toggle('over', !!S.hover);
    showTip(S.hover, x, y);
  });
  const up = e => {
    S.pointers.delete(e.pointerId);
    if (S.pinch) { if (S.pointers.size < 2) S.pinch = null; S.drag = null; return; }
    const d = S.drag; S.drag = null; cv.classList.remove('dragging');
    if (!d || d.moved) return;
    const [x, y] = local(e);
    const now = performance.now();
    if (S.touch && now - lastTap < 300) { zoomAt(x, y, 2.2); lastTap = 0; return; }   // double-tap
    lastTap = now;
    activate(pick(x, y), x, y);
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { S.mouse = null; if (!S.touch) { S.hover = null; tip.hidden = true; } });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    const [mx, my] = local(e);
    zoomAt(mx, my, Math.exp(-e.deltaY * 0.0016), true);
  }, { passive: false });

  document.getElementById('zin').onclick = () => zoomBy(1.8);
  document.getElementById('zout').onclick = () => zoomBy(1 / 1.8);
  document.getElementById('zfit').onclick = () => frameWorld();
  document.getElementById('back').onclick = () => frameWorld();
  document.getElementById('fold').onclick = e => {
    const folded = panel.classList.toggle('folded');
    e.currentTarget.setAttribute('aria-expanded', String(!folded));
  };
  callout.onclick = () => frameNYC();
  document.getElementById('places').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (S.w <= 700) panel.classList.add('folded');
    if (b.dataset.nyc) return frameNYC();
    frameCity(S.clusters[+b.dataset.i]);
  });
  addEventListener('resize', resize);
}
function zoomAt(mx, my, f, instant = false) {
  const [bx, by] = toWorld(mx, my);
  S.cam.ts = clamp(S.cam.ts * f, MIN_S, MAX_S);
  if (instant) S.cam.s = S.cam.ts;
  const s = instant ? S.cam.s : S.cam.ts;
  S.cam.tx = bx - (mx - S.w / 2) / s;
  S.cam.ty = by - (my - S.h / 2) / s;
  if (instant) { S.cam.x = S.cam.tx; S.cam.y = S.cam.ty; }
}

/* ---------- boot -------------------------------------------------------------------- */
async function boot() {
  resize();
  if (S.w <= 700) panel.classList.add('folded');
  const [d, world, nyc] = await Promise.all([
    fetchJSON(`${BASE}data/episodes.json`),
    fetchJSON(`${BASE}data/world.json`).catch(() => []),
    fetchJSON(`${BASE}data/nyc.json`).catch(() => null),
  ]);
  S.world = world; S.nyc = nyc; S.eps = d.episodes;

  // New York means the metro: Jersey City and Hoboken belong in the subway view
  const isNYC = e => e.city === 'New York' || (Array.isArray(e.at) && inMetro(e.at));
  S.nycEps = S.eps.filter(isNYC);
  S.nycRoutes = S.nycEps.filter(e => (e.route || []).length > 1);
  S.nycLoose = S.nycEps.filter(e => !((e.route || []).length > 1));
  S.unplaced = S.eps.filter(e => !Array.isArray(e.at)).length;

  const by = new Map();
  for (const e of S.eps) {
    if (isNYC(e) || !Array.isArray(e.at)) continue;
    const key = (e.places && e.places[0]) || e.city;
    if (!by.has(key)) by.set(key, { name: key, short: key.split(',')[0], eps: [], lat: e.at[0], lng: e.at[1] });
    by.get(key).eps.push(e);
  }
  S.clusters = [...by.values()].map(c => ({ ...c, x: mercX(c.lng), y: mercY(c.lat) }))
                               .sort((a, b) => b.eps.length - a.eps.length);

  const home = { x: mercX(NYC.lng), y: mercY(NYC.lat), name: 'New York' };
  const seen = new Set(), path = [];
  for (const e of [...S.eps].sort((a, b) => a.n - b.n)) {
    if (!Array.isArray(e.at)) continue;
    const key = isNYC(e) ? 'New York' : ((e.places && e.places[0]) || e.city);
    if (key !== 'New York' && seen.has(key)) continue;
    seen.add(key);
    const stop = key === 'New York' ? home : S.clusters.find(c => c.name === key);
    if (stop && path[path.length - 1] !== stop) path.push(stop);
  }
  S.journey = path;
  document.getElementById('nycn').textContent = S.nycEps.length;

  // Back from an episode opened in the subway view lands in the subway view
  if (location.hash === '#nyc' && S.nycRoutes.length) frameNYC(true); else frameWorld(true);
  bind();
  paintPanel();
  document.getElementById('loading')?.remove();

  let lastMode = null, lastName = null;
  const viewName = document.getElementById('viewname');
  (function tick() {
    const k = 0.14;
    S.cam.s += (S.cam.ts - S.cam.s) * k;
    S.cam.x += (S.cam.tx - S.cam.x) * k;
    S.cam.y += (S.cam.ty - S.cam.y) * k;
    const mode = cityMix() > 0.5;
    if (mode !== lastMode) {
      lastMode = mode; paintPanel();
      try { history.replaceState(null, '', mode ? '#nyc' : location.pathname + location.search); } catch {}
    }
    // the map moves under a still cursor while a zoom settles: keep the tip honest
    if (S.mouse && !S.drag && !S.touch) {
      const h = pick(...S.mouse);
      if (h !== S.hover) { S.hover = h; cv.classList.toggle('over', !!h); showTip(h, ...S.mouse); }
    }
    const vn = viewLabel();
    if (vn !== lastName) { lastName = vn; viewName.textContent = vn; }
    draw();
    requestAnimationFrame(tick);
  })();
}

boot().catch(e => {
  console.error(e);
  const l = document.getElementById('loading');
  if (l) l.textContent = 'Could not load the map.';
});
