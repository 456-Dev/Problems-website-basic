/* The map is a globe, close enough that the countries fill the screen and the
   edges of the sphere run off it. Drag to spin it; it drifts when left alone.
   The only colour on it is the people: a face for every place we stopped,
   fanning out into every episode there as you zoom. Questions asked near
   whatever you're looking at drift in and out, each with an arrow to where it
   was asked. Zoom into New York and the globe hands over to the walks. */
import { BASE, fetchJSON, esc, clamp, faceUrl, tagName, views } from './util.js';

views();

const d3 = window.d3;
const $ = id => document.getElementById(id);
const stage = $('stage'), cv = $('globe'), ctx = cv.getContext('2d');
const ghostsEl = $('ghosts'), leaders = $('leaders'), tip = $('gtip');
const touch = matchMedia('(hover: none)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEG = 180 / Math.PI;

const NYC = [-73.97, 40.73];
const NYC_AT = 42000, NYC_FULL = 100000;      // pixels per radian: the walks fade in between
const FAN_AT = 2600;                          // below this, one face per place

const S = {
  w: 1, h: 1, dpr: 1, cx: 0, cy: 0,
  R: 500, z: 1, zmin: 0.4, zmax: 420,
  rot: [30, -28, 0],                          // the Atlantic, New York to the left of it
  vel: [0, 0], drag: null, pointers: new Map(), pinch: null,
  idleSince: performance.now(), anim: null,
  world: null, nyc: null, eps: [], clusters: [], nycEps: [], routes: [], loose: [],
  imgs: new Map(), hits: [], hover: null, preview: null, dirty: true,
  ghosts: [], shown: [],
};
const proj = d3.geoOrthographic().clipAngle(90).precision(0.6);
const path = d3.geoPath(proj, ctx);
const graticule = d3.geoGraticule10();

/* ---------- geometry ------------------------------------------------------- */
function resize() {
  const r = stage.getBoundingClientRect();
  S.dpr = Math.min(devicePixelRatio || 1, 2);
  S.w = Math.max(1, r.width); S.h = Math.max(1, r.height);
  cv.width = Math.round(S.w * S.dpr); cv.height = Math.round(S.h * S.dpr);
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  leaders.setAttribute('viewBox', `0 0 ${S.w} ${S.h}`);
  // close in: wider than the screen, so the sphere's sides run off it
  const phone = S.w < 700;
  S.R = phone ? S.w * 0.8 : Math.max(S.w * 0.5, S.h * 0.72);
  S.cx = S.w / 2;
  S.cy = phone ? S.h * 0.5 : S.h * 0.56;
  S.zmin = (Math.min(S.w, S.h) * 0.44) / S.R;
  S.dirty = true;
}
const scale = () => S.R * S.z;
const center = () => [-S.rot[0], -S.rot[1]];
function project(lnglat) {
  if (d3.geoDistance(lnglat, center()) > Math.PI / 2 - 0.02) return null;
  const p = proj(lnglat);
  return p && p[0] > -80 && p[0] < S.w + 80 && p[1] > -80 && p[1] < S.h + 80 ? p : null;
}
const nycMix = () => clamp((scale() - NYC_AT) / (NYC_FULL - NYC_AT), 0, 1);

/* ---------- faces ---------------------------------------------------------- */
const faceOf = e => e.heroFace != null ? faceUrl(e, e.heroFace) : (e.hero ? BASE + e.hero : null);
function img(url) {
  if (!url) return null;
  let im = S.imgs.get(url);
  if (!im) {
    im = new Image(); im.decoding = 'async';
    im.onload = () => { S.dirty = true; };
    im.src = url; S.imgs.set(url, im);
  }
  return im.complete && im.naturalWidth ? im : null;
}
function tile(e, x, y, s, on) {
  const im = img(faceOf(e));
  if (im) {
    const side = Math.min(im.naturalWidth, im.naturalHeight);
    ctx.drawImage(im, (im.naturalWidth - side) / 2, (im.naturalHeight - side) / 2 * 0.6, side, side, x, y, s, s);
  } else {
    ctx.fillStyle = '#1c1c1c'; ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#6e6e6e'; ctx.font = `600 ${Math.max(9, s * 0.3)}px ui-monospace, Menlo, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(e.n), x + s / 2, y + s / 2);
  }
  ctx.strokeStyle = on ? '#ffe500' : 'rgba(255,255,255,.85)';
  ctx.lineWidth = on ? 2 : 1;
  ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1);
}

/* ---------- drawing -------------------------------------------------------- */
function draw() {
  S.dirty = false;
  const R = scale(), mix = nycMix();
  proj.scale(R).translate([S.cx, S.cy]).rotate(S.rot).clipExtent([[-2, -2], [S.w + 2, S.h + 2]]);
  ctx.fillStyle = '#070707'; ctx.fillRect(0, 0, S.w, S.h);

  // the sphere, its lines of latitude and longitude, the land
  ctx.beginPath(); path({ type: 'Sphere' });
  ctx.fillStyle = '#0b0b0b'; ctx.fill();
  if (mix < 1) {
    ctx.globalAlpha = 1 - mix * 0.8;
    ctx.beginPath(); path(graticule);
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 0.7; ctx.stroke();
    if (S.world) {
      ctx.beginPath(); path(S.world);
      ctx.fillStyle = '#191919'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 0.8; ctx.lineJoin = 'round'; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // the rim, where the sphere meets space
  ctx.beginPath(); path({ type: 'Sphere' });
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.stroke();

  S.hits = [];
  if (mix > 0 && S.nyc) drawNYC(mix);
  drawPlaces(mix);
  placeGhosts();
}

function drawPlaces(mix) {
  const fanned = scale() >= FAN_AT;
  const phone = S.w < 700;
  const T = fanned ? clamp(scale() / 120, 26, 44) : clamp(scale() / 22, phone ? 26 : 30, phone ? 34 : 42);
  // biggest places first; a face that would land on top of one already drawn
  // waits for a closer zoom (its dot stays, and the place list still finds it)
  const taken = [];
  const overlaps = r => taken.some(o => r[0] < o[0] + o[2] - 6 && r[0] + r[2] - 6 > o[0] && r[1] < o[1] + o[3] - 6 && r[1] + r[3] - 6 > o[1]);
  for (const c of S.clusters) {
    if (c.nyc && mix > 0.5) continue;                      // the walks take over
    const p = project(c.lnglat);
    c._p = p;
    if (!p) continue;
    const [x, y] = p;
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, 4, 4);   // exactly where
    if (!fanned || c.eps.length === 1) {
      const e = c.eps[0];
      const tx = x - T / 2, ty = y - T - 9;
      if (overlaps([tx, ty - 6, T + 12, T + 6])) continue;
      taken.push([tx, ty - 6, T + 12, T + 6]);
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x, ty + T); ctx.stroke();
      tile(e, tx, ty, T, S.hover === c || S.preview === c);
      if (c.eps.length > 1) {
        const t = String(c.eps.length);
        ctx.font = '700 10px ui-monospace, Menlo, monospace';
        const bw = ctx.measureText(t).width + 7;
        ctx.fillStyle = '#ffe500'; ctx.fillRect(tx + T - 6, ty - 6, bw, 14);
        ctx.fillStyle = '#000'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(t, tx + T - 2.5, ty + 1.5);
      }
      S.hits.push({ x: tx, y: ty - 6, w: T + 12, h: T + 6, ref: c.eps.length > 1 ? c : e, c });
      if (T >= 34 || S.hover === c) label(c.short, x, y + 8);
      continue;
    }
    // fanned: every episode there, in a block above the dot
    const n = Math.min(c.eps.length, c.nyc ? 20 : 30);
    const cols = Math.min(n, c.nyc ? 5 : 4), rows = Math.ceil(n / cols), g = 2;
    const bw = cols * T + (cols - 1) * g, bh = rows * T + (rows - 1) * g;
    const ox = x - bw / 2, oy = y - bh - 10;
    if (overlaps([ox, oy, bw, bh])) continue;
    taken.push([ox, oy, bw, bh]);
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x, oy + bh); ctx.stroke();
    for (let i = 0; i < n; i++) {
      const e = c.eps[i];
      const tx = ox + (i % cols) * (T + g), ty = oy + Math.floor(i / cols) * (T + g);
      tile(e, tx, ty, T, S.hover === e || S.preview === e);
      S.hits.push({ x: tx, y: ty, w: T, h: T, ref: e, c });
    }
    label(c.short + (c.eps.length > n ? `  +${c.eps.length - n}` : ''), x, y + 8);
  }
}

function label(t, x, y) {
  ctx.font = '10px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const s = t.toUpperCase(), w = ctx.measureText(s).width;
  ctx.fillStyle = 'rgba(7,7,7,.82)'; ctx.fillRect(x - w / 2 - 3, y - 1, w + 6, 13);
  ctx.fillStyle = 'rgba(235,235,235,.95)'; ctx.fillText(s, x, y + 1);
}

function drawNYC(mix) {
  ctx.globalAlpha = mix;
  const P = pt => proj(pt);
  for (const l of S.nyc.land) {
    ctx.beginPath();
    l.r.forEach((pt, i) => { const q = P(pt); if (q) (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); });
    ctx.closePath();
    ctx.fillStyle = l.nyc ? '#171717' : '#101010'; ctx.fill();
    ctx.strokeStyle = l.nyc ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.font = '11px ui-monospace, Menlo, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  for (const [name, lat, lng] of [['MANHATTAN', 40.785, -73.967], ['BROOKLYN', 40.655, -73.945], ['QUEENS', 40.715, -73.83],
       ['THE BRONX', 40.845, -73.87], ['STATEN ISLAND', 40.585, -74.14], ['NEW JERSEY', 40.73, -74.13]]) {
    const q = P([lng, lat]); if (q) ctx.fillText(name, q[0], q[1]);
  }
  const focus = S.hover || S.preview;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const r of S.routes) {
    r._pts = r.route.map(([la, lo]) => P([lo, la])).filter(Boolean);
    if (r._pts.length < 2) continue;
    ctx.strokeStyle = '#070707'; ctx.lineWidth = focus === r ? 7 : 5;
    ctx.beginPath(); r._pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.strokeStyle = focus === r ? '#ffe500' : `rgba(255,255,255,${focus ? 0.35 : 0.8})`;
    ctx.lineWidth = focus === r ? 3 : 2;
    ctx.beginPath(); r._pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
  }
  // a face at the start of every walk
  const T = 30;
  for (const r of S.routes) {
    if (!r._pts || !r._pts.length) continue;
    const [x, y] = r._pts[0];
    tile(r, x - T / 2, y - T - 6, T, focus === r);
    S.hits.push({ x: x - T / 2, y: y - T - 6, w: T, h: T, ref: r, walk: true });
  }
  ctx.globalAlpha = 1;
}

/* ---------- questions that drift in ---------------------------------------- */
function candidates() {
  const out = [];
  const inset = 70;
  const ok = p => p && p[0] > inset && p[0] < S.w - inset && p[1] > inset + 40 && p[1] < S.h - inset;
  if (nycMix() > 0.5) {
    for (const r of S.routes) if (r._pts && r._pts.length && ok(r._pts[0])) out.push({ e: r, p: () => r._pts && r._pts[0] });
  } else {
    for (const c of S.clusters) {
      if (!ok(c._p)) continue;
      for (const e of c.eps) out.push({ e, c, p: () => c._p });
    }
  }
  return out.filter(o => o.e.question && !S.shown.includes(o.e.n) && !S.ghosts.some(g => g.e === o.e));
}

function spawnGhost() {
  if (document.hidden || S.drag || S.ghosts.length >= (S.w < 700 ? 1 : 2)) return;
  const pool = candidates();
  if (!pool.length) { S.shown = S.shown.slice(-4); return; }
  // not two from the same place, and not on top of one already up
  const used = new Set(S.ghosts.map(g => g.c));
  const fresh = pool.filter(o => !o.c || !used.has(o.c));
  const pick = (fresh.length ? fresh : pool)[(Math.random() * (fresh.length || pool.length)) | 0];
  const e = pick.e;
  const el = document.createElement('a');
  el.className = 'ghost';
  el.href = `${BASE}e/${e.n}/`;
  const where = (pick.c ? pick.c.short : (e.borough || 'New York'));
  el.innerHTML = `<span class="label">EP ${e.n} · ${esc(where)} · ${esc(tagName(e))}</span>
    <span class="gq">${esc(e.question)}</span><span class="go" aria-hidden="true">→</span>`;
  ghostsEl.appendChild(el);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  leaders.appendChild(line);
  const g = { e, c: pick.c, p: pick.p, el, line, born: performance.now(), side: null, hold: false };
  el.addEventListener('pointerenter', () => { g.hold = true; });
  el.addEventListener('pointerleave', () => { g.hold = false; g.born = performance.now() - 2500; });
  S.ghosts.push(g);
  S.shown.push(e.n); if (S.shown.length > 24) S.shown.shift();
  requestAnimationFrame(() => el.classList.add('in'));
  placeGhosts();
}

function placeGhosts() {
  const now = performance.now();
  // what a card must not cover: the panels, in stage coordinates
  const sr = stage.getBoundingClientRect();
  const obstacles = ['gpanel', 'ghint'].map(id => $(id)).concat([document.querySelector('.gzoom')])
    .filter(el => el && !el.classList.contains('gone') && el.offsetParent)
    .map(el => { const b = el.getBoundingClientRect(); return [b.left - sr.left, b.top - sr.top, b.width, b.height]; });
  for (const g of [...S.ghosts]) {
    const p = g.p();
    const age = now - g.born;
    const dying = !p || (!g.hold && age > 6500);
    if (dying && !g.dead) {
      g.dead = now; g.el.classList.remove('in'); g.line.classList.add('out');
      setTimeout(() => { g.el.remove(); g.line.remove(); S.ghosts = S.ghosts.filter(x => x !== g); }, 600);
    }
    if (!p) continue;
    const [x, y] = p;
    const r = g.el.getBoundingClientRect(), w = r.width || 260, h = r.height || 60;
    // Try spots around the place: keep the one it had while it's still clear,
    // otherwise the first that misses the panels, the other cards and the face.
    const spots = [[70, -110 - h / 2], [70, 40], [-70 - w, -110 - h / 2], [-70 - w, 40],
                   [-w / 2, -150 - h], [-w / 2, 60]];
    const fit = k => {
      const lx = clamp(x + spots[k][0], 12, S.w - w - 12), ly = clamp(y + spots[k][1], 12, S.h - h - 12);
      const rect = [lx, ly, w, h];
      const hitsFace = lx < x + 26 && lx + w > x - 26 && ly < y + 4 && ly + h > y - 64;
      const bad = hitsFace || obstacles.some(o => rect[0] < o[0] + o[2] + 8 && rect[0] + rect[2] + 8 > o[0] &&
                                                   rect[1] < o[1] + o[3] + 8 && rect[1] + rect[3] + 8 > o[1]);
      return { lx, ly, bad };
    };
    let k = g.slot ?? (x < S.w / 2 ? 0 : 2), spot = fit(k);
    if (spot.bad) {
      for (let j = 0; j < spots.length; j++) { const f = fit(j); if (!f.bad) { k = j; spot = f; break; } }
    }
    g.slot = k;
    const { lx, ly } = spot;
    obstacles.push([lx, ly, w, h]);
    g.side = lx + w / 2 >= x ? 1 : -1;
    g.el.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px)`;
    // the arrow: from the card's near edge to just above the place
    const ax = g.side > 0 ? lx : lx + w, ay = clamp(y, ly + 10, ly + h - 10);
    const tx = x, ty = y - 8;
    const mx = (ax + tx) / 2;
    g.line.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} C${mx.toFixed(1)},${ay.toFixed(1)} ${tx.toFixed(1)},${(ay + ty) / 2} ${tx.toFixed(1)},${ty.toFixed(1)}`);
  }
}

/* ---------- motion --------------------------------------------------------- */
function flyTo(lnglat, z, ms = 1100) {
  const from = center(), z0 = S.z, z1 = clamp(z, S.zmin, S.zmax);
  const interp = d3.geoInterpolate(from, lnglat);
  const t0 = performance.now();
  S.vel = [0, 0];
  S.anim = now => {
    const t = clamp((now - t0) / (reduce ? 1 : ms), 0, 1);
    const k = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const c = interp(k);
    S.rot = [-c[0], -c[1], 0];
    S.z = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * k);
    if (t >= 1) S.anim = null;
    S.dirty = true;
  };
  touched();
}
function touched() { S.idleSince = performance.now(); }

function frame(now) {
  if (S.anim) S.anim(now);
  else if (!S.drag && !S.pinch) {
    if (Math.abs(S.vel[0]) + Math.abs(S.vel[1]) > 0.01) {            // momentum after a throw
      S.rot[0] += S.vel[0]; S.rot[1] = clamp(S.rot[1] + S.vel[1], -80, 80);
      S.vel[0] *= 0.94; S.vel[1] *= 0.94; S.dirty = true;
    } else if (!reduce && now - S.idleSince > 5000 && nycMix() === 0 && S.z < 2.5) {
      S.rot[0] -= 0.035; S.dirty = true;                             // it drifts east when left alone
    }
  }
  if (S.dirty || S.ghosts.length) draw();
  paintPanel();
  requestAnimationFrame(frame);
}

/* ---------- picking and input ---------------------------------------------- */
function pick(px, py) {
  const pad = touch ? 6 : 0;
  for (let i = S.hits.length - 1; i >= 0; i--) {
    const h = S.hits[i];
    if (px >= h.x - pad && px <= h.x + h.w + pad && py >= h.y - pad && py <= h.y + h.h + pad) return h.ref;
  }
  return null;
}
function describe(h) {
  if (h.eps) return `<span class="label">${esc(h.name)}</span>${h.eps.length} episodes — ${touch ? 'tap' : 'click'} to open them up`;
  const where = h.borough || (h.places && h.places[0]) || h.city || '';
  return `<span class="label">EP ${h.n} · ${esc(where.split(',')[0])} · ${esc(tagName(h))}</span>${esc(h.question)}` +
    (touch ? '<span class="label">tap again to watch</span>' : '');
}
function showTip(h, x, y) {
  if (!h) { tip.hidden = true; return; }
  tip.innerHTML = describe(h); tip.hidden = false;
  const r = tip.getBoundingClientRect();
  tip.style.left = `${clamp(x + 14, 6, S.w - r.width - 6)}px`;
  tip.style.top = `${clamp(y + 14, 6, S.h - r.height - 6)}px`;
}
function activate(h, x, y) {
  if (!h) { S.preview = null; showTip(null); return; }
  if (h.eps) {                                                       // a place: open it up
    S.preview = null; showTip(null);
    flyTo(h.lnglat, h.nyc ? NYC_FULL * 1.15 / S.R : Math.max(S.z, FAN_AT * 1.6 / S.R));
    return;
  }
  if (touch && S.preview !== h) { S.preview = h; showTip(h, x, y); S.dirty = true; return; }
  location.href = `${BASE}e/${h.n}/`;
}

function bind() {
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let lastTap = 0;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    S.pointers.set(e.pointerId, local(e));
    S.anim = null; touched(); hideHint();
    if (S.pointers.size === 2) {
      const [a, b] = [...S.pointers.values()];
      S.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: S.z }; S.drag = null; return;
    }
    const [x, y] = local(e);
    S.drag = { x, y, moved: false, t: performance.now() };
    S.vel = [0, 0];
  });
  cv.addEventListener('pointermove', e => {
    const [x, y] = local(e);
    if (S.pointers.has(e.pointerId)) S.pointers.set(e.pointerId, [x, y]);
    if (S.pinch && S.pointers.size >= 2) {
      const [a, b] = [...S.pointers.values()];
      S.z = clamp(S.pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / S.pinch.d, S.zmin, S.zmax);
      S.dirty = true; touched(); return;
    }
    if (S.drag) {
      const dx = x - S.drag.x, dy = y - S.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > (touch ? 7 : 3)) S.drag.moved = true;
      if (S.drag.moved) {
        const k = DEG / scale();
        S.rot[0] += dx * k; S.rot[1] = clamp(S.rot[1] - dy * k, -80, 80);
        S.vel = [dx * k * 0.6, -dy * k * 0.6];
        S.drag.x = x; S.drag.y = y; S.dirty = true; touched();
        cv.classList.add('dragging');
      }
      return;
    }
    if (touch) return;
    const h = pick(x, y);
    if (h !== S.hover) { S.hover = h; S.dirty = true; }
    cv.classList.toggle('over', !!h);
    showTip(h, x, y);
  });
  const up = e => {
    S.pointers.delete(e.pointerId);
    if (S.pinch) { if (S.pointers.size < 2) S.pinch = null; S.drag = null; return; }
    const d = S.drag; S.drag = null; cv.classList.remove('dragging');
    if (!d || d.moved) return;
    S.vel = [0, 0];
    const [x, y] = local(e);
    const now = performance.now();
    if (touch && now - lastTap < 300) { S.z = clamp(S.z * 2.2, S.zmin, S.zmax); S.dirty = true; lastTap = 0; return; }
    lastTap = now;
    activate(pick(x, y), x, y);
  };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (!touch) { S.hover = null; tip.hidden = true; S.dirty = true; } });
  cv.addEventListener('wheel', e => {
    e.preventDefault(); S.anim = null; touched(); hideHint();
    S.z = clamp(S.z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), S.zmin, S.zmax);
    S.dirty = true;
  }, { passive: false });

  $('zin').onclick = () => flyTo(center(), S.z * 1.9, 450);
  $('zout').onclick = () => flyTo(center(), S.z / 1.9, 450);
  $('zfit').onclick = () => flyTo([-30, 28], 1, 900);
  $('back').onclick = () => flyTo([-30, 28], 1, 1100);
  $('fold').onclick = e => {
    const list = $('places'); list.hidden = !list.hidden;
    e.currentTarget.setAttribute('aria-expanded', String(!list.hidden));
  };
  $('places').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    const c = S.clusters[+b.dataset.i];
    if (S.w < 700) { $('places').hidden = true; $('fold').setAttribute('aria-expanded', 'false'); }
    activate(c);
  });
  addEventListener('resize', () => { resize(); });
}

let hintGone = false;
function hideHint() { if (!hintGone) { hintGone = true; $('ghint').classList.add('gone'); } }

let lastPanel = '';
function paintPanel() {
  const mode = nycMix() > 0.5 ? 'nyc' : S.z > 2.2 ? 'close' : 'world';
  let name = 'The world';
  if (mode === 'nyc') name = 'New York · the walks';
  else if (mode === 'close') {
    const c = center();
    let best = null, bd = 1;
    for (const cl of S.clusters) { const d = d3.geoDistance(cl.lnglat, c); if (d < bd) { bd = d; best = cl; } }
    if (best && bd < 0.35) name = best.name;
  }
  const key = mode + name;
  if (key === lastPanel) return;
  lastPanel = key;
  $('viewname').textContent = name;
  $('back').hidden = mode === 'world';
}

function fillPlaces() {
  $('places').innerHTML = S.clusters.map((c, i) =>
    `<button data-i="${i}">${esc(c.short)}<b>${c.eps.length}</b></button>`).join('') +
    (S.unplaced ? `<button disabled class="muted-row">No location yet<b>${S.unplaced}</b></button>` : '');
}

/* ---------- boot ----------------------------------------------------------- */
async function boot() {
  resize();
  bind();
  const [world, nyc, idx] = await Promise.all([
    fetchJSON(`${BASE}data/globe.json`), fetchJSON(`${BASE}data/nyc.json`), fetchJSON(`${BASE}data/episodes.json`)]);
  S.world = world; S.nyc = nyc;
  S.eps = idx.episodes.filter(e => e.question);
  const inMetro = at => at[0] > 40.45 && at[0] < 41.0 && at[1] > -74.3 && at[1] < -73.65;
  const isNYC = e => e.city === 'New York' || (Array.isArray(e.at) && inMetro(e.at));
  S.nycEps = S.eps.filter(e => Array.isArray(e.at) && isNYC(e));
  S.routes = S.nycEps.filter(e => (e.route || []).length > 1);
  S.unplaced = S.eps.filter(e => !Array.isArray(e.at)).length;
  const by = new Map();
  for (const e of S.eps) {
    if (!Array.isArray(e.at) || isNYC(e)) continue;
    const key = (e.places && e.places[0]) || e.city;
    if (!by.has(key)) by.set(key, { name: key, short: key.split(',')[0], eps: [], lnglat: [e.at[1], e.at[0]] });
    by.get(key).eps.push(e);
  }
  const newest = (a, b) => (b.hero ? 1 : 0) - (a.hero ? 1 : 0) || b.n - a.n;
  S.clusters = [
    { name: 'New York', short: 'New York', nyc: true, lnglat: NYC, eps: [...S.nycEps].sort(newest) },
    ...[...by.values()].map(c => ({ ...c, eps: c.eps.sort(newest) })).sort((a, b) => b.eps.length - a.eps.length),
  ];
  fillPlaces();
  $('gloading').remove();
  S.dirty = true;
  requestAnimationFrame(frame);
  setInterval(spawnGhost, 2600);
  setTimeout(spawnGhost, 900);
}
boot().catch(err => { console.error(err); $('gloading').textContent = 'Could not load the globe.'; });
