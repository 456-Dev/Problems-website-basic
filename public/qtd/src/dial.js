/* The Dial — every question as a graduation mark on one dial face.
 *
 *   around   topic, eight sectors
 *   outward  mood: a mark runs from the hub out to its mood ring, so heavy
 *            questions are short strokes and silly ones reach the rim
 *   colour   the tip of each mark: big question, hot take, or about you
 *
 * Point anywhere around the dial and the nearest question by angle is read
 * out in the centre — no tiny targets to hit. The dial itself never moves.
 * It opens on the Question of the Day; left alone, the centre steps through
 * questions from different topics until someone points at something.
 */
import { BASE, fetchJSON, clamp, esc, matches, TYPE_RGB, TYPE_CLASS, MOODS } from './util.js';

const cv = document.getElementById('field');
const ctx = cv.getContext('2d', { alpha: false });
const hub = document.getElementById('hub');
const hubCard = document.getElementById('hubcard');
const hubFace = document.getElementById('hubface');
const hubTimer = document.getElementById('hubtimer');

const TOPICS = ['Big Ideas', 'Future & Tech', 'Work & Money', 'Society',
                'Places', 'Culture', 'Daily Life', 'People & Love'];

// world units; the whole dial is scaled to fit
const R_HUB = 262;
const RING = m => 318 + (m - 1) * 82;          // mood 1..5 -> 318..646
const R_RIM = RING(5), R_TOPIC = R_RIM + 58;
const MARK_FROM = R_HUB + 18;
const GAP_SLOTS = 2.2;                          // between sectors
const TOP_GAP = 12;                             // the axis gap at twelve o'clock — room for its labels
const TOP = Math.PI / 2;

const AUTO_EVERY = 4500;                        // ms per question when idle — long ones need reading time
const IDLE_AFTER = 9000;                        // ms without input before it resumes
const TODAY_HOLD = 12000;                       // ms the day's question stays up first
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const S = {
  nodes: [], sectors: [], byN: new Map(),
  sel: null, today: null, mode: 'today', typeOnly: null, narrow: false, lastPtr: null, ptrType: 'mouse',
  topicFocus: null, filterText: null,
  w: 1, h: 1, cx: 0, cy: 0, s: 1,
  lastInput: -1e9, autoAt: 0, opened: new Set(),
};

const wrap = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
const toXY = (r, a) => [S.cx + Math.cos(a) * r * S.s, S.cy - Math.sin(a) * r * S.s];

try { S.opened = new Set(JSON.parse(localStorage.getItem('qtd.opened.v1') || '[]')); } catch {}
function paintProgress() {
  const tot = S.nodes.length || 1;
  document.getElementById('progn').textContent = `${S.opened.size}/${tot}`;
  document.getElementById('progbar').style.width = `${(S.opened.size / tot) * 100}%`;
}

/* ---------- geometry ----------------------------------------------------- */
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect();
  S.w = Math.max(r.width, 1); S.h = Math.max(r.height, 1);
  cv.width = Math.max(1, Math.round(S.w * dpr));
  cv.height = Math.max(1, Math.round(S.h * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const narrow = S.narrow = S.w < 700;
  // phones: search on top, a readout card on the bottom, the dial between.
  // Move the card first, then measure it, or the dial sizes for an empty box.
  const ro = document.getElementById('readout');
  if (narrow && hubCard.parentElement !== ro) ro.appendChild(hubCard);
  if (!narrow && hubCard.parentElement === ro) hub.insertBefore(hubCard, hubTimer);
  const top = narrow ? 100 : 30, bottom = narrow ? (ro.offsetHeight || 190) + 34 : 8;
  S.cx = S.w / 2;
  S.cy = top + (S.h - top - bottom) / 2;
  const byH = ((S.h - top - bottom) / 2 - 20) / (R_TOPIC + 16);
  // topic names are centred on phones (short), left/right aligned on desktop
  const byW = narrow ? (S.w / 2 - 46) / R_TOPIC : (S.w / 2 - 150) / (R_TOPIC + 40);
  S.s = Math.max(0.1, Math.min(byH, byW));


  const d = R_HUB * 2 * S.s * 0.94;
  Object.assign(hub.style, {
    width: `${d}px`, height: `${d}px`,
    left: `${S.cx - d / 2}px`, top: `${S.cy - d / 2}px`,
    fontSize: `${clamp(d / 15, 9, 19)}px`,
  });
}

function build(episodes) {
  // Unknown or renamed topics land in Daily Life rather than vanishing (the
  // rename from "You" briefly dropped 45 questions off the dial).
  const topicOf = e => TOPICS.includes(e.topic) ? e.topic : 'Daily Life';
  const groups = TOPICS.map(t => episodes.filter(e => topicOf(e) === t).sort((a, b) => a.n - b.n));
  const nonEmpty = groups.filter(g => g.length);
  const total = episodes.length + GAP_SLOTS * (nonEmpty.length - 1) + TOP_GAP;
  const slot = (2 * Math.PI) / total;
  let i = TOP_GAP / 2;
  const nodes = [], sectors = [];
  groups.forEach((g, ti) => {
    if (!g.length) return;
    const start = i;
    for (const e of g) {
      nodes.push({ ...e, topic: TOPICS[ti], a: TOP - i * slot, mood: e.mood || 3,
                   rgb: TYPE_RGB[e.type] || TYPE_RGB['about you'] });
      i += 1;
    }
    sectors.push({ name: TOPICS[ti], count: g.length,
                   a0: TOP - (start - 0.5) * slot, a1: TOP - (i - 0.5) * slot,
                   mid: TOP - ((start + i - 1) / 2) * slot });
    i += GAP_SLOTS;
  });
  S.nodes = nodes; S.sectors = sectors;
  S.byN = new Map(nodes.map(nd => [nd.n, nd]));

  // a different question every day, the same one for everyone that day
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const ordered = [...nodes].sort((a, b) => a.n - b.n);
  S.today = ordered[(day * 37) % ordered.length];
}

function visible(nd) {
  if (S.typeOnly && nd.type !== S.typeOnly) return false;
  if (S.topicFocus && nd.topic !== S.topicFocus) return false;
  if (S.filterText && !S.filterText.has(nd.n)) return false;
  return true;
}

/* ---------- the readout ---------------------------------------------------- */
function show(nd, mode) {
  if (!nd) return;
  const changed = nd !== S.sel || mode !== S.mode;
  S.sel = nd; S.mode = mode;
  if (!changed) return;
  const today = mode === 'today';
  const where = ((nd.places && nd.places[0]) || nd.city || '').split(',')[0].toUpperCase();
  document.getElementById('hubkicker').textContent = today ? 'QUESTION OF THE DAY' : `EPISODE ${nd.n}`;
  document.getElementById('hubsub').textContent = [today ? `EP ${nd.n}` : '', where,
    S.opened.has(nd.n) ? '\u2713 OPENED' : ''].filter(Boolean).join(' \u00b7 ');
  document.getElementById('hubq').textContent = nd.question;
  document.getElementById('hubtags').innerHTML =
    `<span class="qt">${esc(nd.topic)}</span><span class="qt">${MOODS[nd.mood] || ''}</span>` +
    `<span class="qt ${TYPE_CLASS[nd.type] || ''}">${esc(nd.type)}</span>`;
  document.getElementById('hubgo').textContent = today ? 'ANSWER IT →' : 'WATCH IT →';
  hubCard.href = `${BASE}e/${nd.n}/`;
  hubCard.classList.remove('swap'); void hubCard.offsetWidth; hubCard.classList.add('swap');

  if (nd.face) {
    hubFace.classList.remove('on');
    hubFace.onload = () => {
      // portrait frames only need a nudge; square ones hide the video between bars
      hubFace.classList.toggle('portrait', hubFace.naturalHeight > hubFace.naturalWidth * 1.25);
      hubFace.classList.add('on');
    };
    hubFace.src = `${BASE}media/frames/${nd.face}`;
  } else {
    hubFace.classList.remove('on');
  }
}

function nextAuto() {
  // hop to a different topic each time: the variety is the point
  const pool = S.nodes.filter(nd => visible(nd) && (!S.sel || nd.topic !== S.sel.topic));
  const from = pool.length ? pool : S.nodes.filter(visible);
  show(from[(Math.random() * from.length) | 0], 'auto');
}

// a filter changed while a search is up: run the search again inside it
function researched() {
  const q = document.getElementById('q');
  if (!q || !q.value.trim()) return false;
  q.dispatchEvent(new Event('input'));
  return true;
}

function touched() { S.lastInput = performance.now(); hubTimer.style.setProperty('--t', 0); }

function refilter() {
  if (!S.sel || !visible(S.sel)) {
    const first = S.nodes.find(visible);
    if (first) show(first, 'point');
  }
}

function clearFilters() {
  S.topicFocus = null; S.typeOnly = null; S.filterText = null;
  const q = document.getElementById('q');
  if (q) q.value = '';
  document.getElementById('results').hidden = true;
  document.getElementById('qhits').textContent = '';
  document.querySelectorAll('#types button').forEach(x => { x.classList.remove('on', 'off'); x.setAttribute('aria-pressed', 'false'); });
}

function tick(now) {
  if (reduce) return;
  const idle = now - S.lastInput > (S.narrow ? IDLE_AFTER * 2.5 : IDLE_AFTER);
  if (!idle) { S.autoAt = now + AUTO_EVERY; return; }
  if (S.mode === 'today' && S.autoAt === 0) S.autoAt = now + TODAY_HOLD;
  const left = S.autoAt - now;
  const span = S.mode === 'today' ? TODAY_HOLD : AUTO_EVERY;
  hubTimer.style.setProperty('--t', clamp(1 - left / span, 0, 1));
  if (left <= 0) { nextAuto(); S.autoAt = now + AUTO_EVERY; }
}

/* ---------- drawing -------------------------------------------------------- */
function draw() {
  ctx.fillStyle = '#070707';
  ctx.fillRect(0, 0, S.w, S.h);

  // mood rings, faint
  ctx.lineWidth = 1;
  for (let m = 1; m <= 5; m++) {
    ctx.strokeStyle = `rgba(255,255,255,${m === 5 ? 0.09 : 0.045})`;
    ctx.beginPath(); ctx.arc(S.cx, S.cy, RING(m) * S.s, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.beginPath(); ctx.arc(S.cx, S.cy, R_HUB * S.s, 0, Math.PI * 2); ctx.stroke();

  // a fine scale round the outside
  for (let k = 0; k < 240; k++) {
    const a = (k / 240) * Math.PI * 2;
    const long = k % 10 === 0;
    const [x1, y1] = toXY(R_RIM + 16, a), [x2, y2] = toXY(R_RIM + (long ? 30 : 23), a);
    ctx.strokeStyle = `rgba(255,255,255,${long ? 0.2 : 0.07})`;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  // sector edges and names
  const fs = clamp(S.s * 21, 9, 12);
  ctx.textBaseline = 'middle';
  for (const sec of S.sectors) {
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    const [x1, y1] = toXY(R_HUB + 4, sec.a0), [x2, y2] = toXY(R_RIM + 12, sec.a0);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    const on = S.sel && S.sel.topic === sec.name;
    const dim = S.topicFocus && S.topicFocus !== sec.name;
    const [tx, ty] = toXY(R_TOPIC, sec.mid);
    const c = Math.cos(sec.mid);
    ctx.textAlign = S.narrow || Math.abs(c) < 0.25 ? 'center' : c > 0 ? 'left' : 'right';
    ctx.font = `${on ? 700 : 400} ${fs}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillStyle = on ? '#ffffff' : `rgba(170,170,170,${dim ? 0.3 : 0.9})`;
    const label = S.narrow ? sec.name.split(' ')[0] : sec.name;
    ctx.fillText(label.toUpperCase(), tx, ty);
    ctx.font = `${fs - 1}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.fillStyle = `rgba(255,229,0,${dim ? 0.3 : 0.75})`;
    ctx.fillText(String(sec.count), tx, ty + fs + 3);
  }

  // the marks
  const cap = clamp(S.s * 9, 3.5, 6);
  for (const nd of S.nodes) {
    const vis = visible(nd);
    const on = nd === S.sel;
    const [x1, y1] = toXY(MARK_FROM, nd.a);
    const [x2, y2] = toXY(RING(nd.mood), nd.a);
    ctx.strokeStyle = on ? '#ffffff' : `rgba(255,255,255,${vis ? 0.2 : 0.04})`;
    ctx.lineWidth = on ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const [r, g, b] = nd.rgb;
    const c = on ? cap * 1.8 : cap;
    ctx.fillStyle = `rgba(${r},${g},${b},${vis ? 1 : 0.12})`;
    ctx.fillRect(x2 - c / 2, y2 - c / 2, c, c);
    if (S.opened.has(nd.n) && vis && !on) {
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1;
      ctx.strokeRect(x2 - c / 2 - 2, y2 - c / 2 - 2, c + 4, c + 4);
    }
  }

  // the mood axis, spelled out in the gap at twelve o'clock, over the marks;
  // phones only have room for its two ends
  ctx.font = `${clamp(S.s * 17, 8, 10)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = 'center';
  for (let m = 1; m <= 5; m++) {
    if (S.narrow && m !== 1 && (m !== 5 || S.w < 360)) continue;   // SILLY collides with the topic names on the smallest phones
    const [x, y] = toXY(RING(m), TOP);
    ctx.fillStyle = 'rgba(7,7,7,.95)';
    const w = ctx.measureText(MOODS[m].toUpperCase()).width;
    ctx.fillRect(x - w / 2 - 4, y - 7, w + 8, 14);
    ctx.fillStyle = `rgba(200,200,200,${0.45 + m * 0.1})`;
    ctx.fillText(MOODS[m].toUpperCase(), x, y);
  }

  // a pointer outside the rim for the one being read
  if (S.sel) {
    const [px, py] = toXY(R_RIM + 36, S.sel.a);
    const [qx, qy] = toXY(R_RIM + 48, S.sel.a);
    ctx.strokeStyle = '#ffe500'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
  }
}

/* ---------- input ---------------------------------------------------------- */
function atAngle(px, py) {
  const dx = px - S.cx, dy = py - S.cy;
  const d = Math.hypot(dx, dy) / S.s;
  if (d < R_HUB * 0.97 || d > R_RIM + 40) return null;          // hub and labels have their own clicks
  const a = Math.atan2(-dy, dx);
  let best = null, bd = Infinity;
  for (const nd of S.nodes) {
    if (!visible(nd)) continue;
    const e = Math.abs(wrap(nd.a - a));
    if (e < bd) { bd = e; best = nd; }
  }
  return bd < 0.08 ? best : null;
}

function topicAt(px, py) {
  // the name blocks drawn outside the rim
  for (const sec of S.sectors) {
    const [tx, ty] = toXY(R_TOPIC, sec.mid);
    const c = Math.cos(sec.mid);
    const w = 110, x0 = Math.abs(c) < 0.25 ? tx - w / 2 : c > 0 ? tx : tx - w;
    if (px >= x0 - 6 && px <= x0 + w + 6 && py >= ty - 12 && py <= ty + 26) return sec;
  }
  return null;
}

function bind() {
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => { S.ptrType = e.pointerType || 'mouse'; });
  // Heading for the centre card crosses other marks. The way menus solve it:
  // from the spot where you picked a question, any movement that stays inside
  // the cone toward the card keeps that question. Pause over a mark on the way
  // (a quarter second) and it's yours after all.
  let anchor = null, dwell = 0;
  const aiming = (px, py) => {
    if (!anchor || S.ptrType === 'touch') return false;
    const ax = S.cx - anchor[0], ay = S.cy - anchor[1], ad = Math.hypot(ax, ay);
    const mx = px - anchor[0], my = py - anchor[1], md = Math.hypot(mx, my);
    if (md < 3) return true;                   // jitter at a mark's edge: a pause still switches
    if (Math.hypot(px - S.cx, py - S.cy) > ad + 4) return false;  // moving away from the card
    const r = R_HUB * S.s * 0.94;                              // the card's circle
    const half = Math.asin(Math.min(1, r / Math.max(ad, 1))) + 0.14;
    const off = Math.acos(clamp((ax * mx + ay * my) / (ad * md), -1, 1));
    return off <= half;
  };
  cv.addEventListener('pointermove', e => {
    touched();
    if (e.pointerType) S.ptrType = e.pointerType;
    const [px, py] = local(e);
    const sec = topicAt(px, py);
    const nd = sec ? null : atAngle(px, py);
    cv.classList.toggle('overnode', !!(nd || sec));
    clearTimeout(dwell);
    if (!nd || nd === S.sel) return;
    if (S.sel && aiming(px, py)) {
      dwell = setTimeout(() => { anchor = [px, py]; show(nd, 'point'); }, 250);
      return;
    }
    anchor = [px, py];
    show(nd, 'point');
  });
  cv.addEventListener('pointerleave', () => { clearTimeout(dwell); anchor = null; });
  cv.addEventListener('click', e => {
    const [px, py] = local(e);
    const sec = topicAt(px, py);
    if (sec) {
      touched();
      S.topicFocus = S.topicFocus === sec.name ? null : sec.name;
      if (!researched()) { if (S.topicFocus) nextAuto(); else refilter(); }
      return;
    }
    const nd = atAngle(px, py);
    if (!nd) return;
    // on touch there is no hover: the first tap reads it, a second one opens
    if (S.ptrType === 'touch' && nd !== S.sel) { touched(); show(nd, 'point'); return; }
    location.href = `${BASE}e/${nd.n}/`;
  });
  hub.addEventListener('pointerenter', touched);
  hub.addEventListener('pointermove', touched);

  const step = dir => {
    touched();
    const list = S.nodes.filter(visible);
    const i = Math.max(0, list.indexOf(S.sel));
    show(list[(i + dir + list.length) % list.length], 'point');
  };
  cv.addEventListener('wheel', e => { e.preventDefault(); step(e.deltaY > 0 ? 1 : -1); }, { passive: false });
  document.getElementById('prevq').onclick = () => step(-1);
  document.getElementById('nextq').onclick = () => step(1);
  document.getElementById('todayq').onclick = () => { touched(); clearFilters(); refilter(); show(S.today, 'today'); };
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (t && t.matches && t.matches('input, textarea')) {
      if (e.key === 'Escape') { t.blur(); touched(); clearFilters(); refilter(); }   // one press clears it all
      return;
    }
    // buttons and links handle their own Enter and Space
    const free = !t || t === document.body || t === cv || t === document.documentElement;
    if (e.key === 'Escape') { touched(); clearFilters(); refilter(); return; }
    if (!free) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Enter' && S.sel) location.href = `${BASE}e/${S.sel.n}/`;
    else if (e.key === '/') { e.preventDefault(); document.getElementById('q').focus(); }
  });
  document.getElementById('today').onclick = () => { touched(); clearFilters(); show(S.today, 'today'); };
  window.addEventListener('resize', resize);
}

function bindPanels() {
  document.getElementById('types').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    touched();
    S.typeOnly = S.typeOnly === b.dataset.type ? null : b.dataset.type;
    document.querySelectorAll('#types button').forEach(x => {
      x.classList.toggle('on', x.dataset.type === S.typeOnly);
      x.classList.toggle('off', !!S.typeOnly && x.dataset.type !== S.typeOnly);
      x.setAttribute('aria-pressed', String(x.dataset.type === S.typeOnly));
    });
    if (!researched()) refilter();
  });

  const input = document.getElementById('q');
  const hitsEl = document.getElementById('qhits');
  const list = document.getElementById('results');
  input.addEventListener('input', () => {
    touched();
    const q = input.value.trim();
    if (q.length < 2 && !/^\d$/.test(q)) { S.filterText = null; list.hidden = true; hitsEl.textContent = ''; refilter(); return; }
    // search within what the chips and topic already show
    const m = S.nodes.filter(nd => matches(nd, q) && (!S.typeOnly || nd.type === S.typeOnly)
                                   && (!S.topicFocus || nd.topic === S.topicFocus));
    S.filterText = new Set(m.map(nd => nd.n));
    hitsEl.textContent = `${m.length} question${m.length === 1 ? '' : 's'}`;
    list.innerHTML = m.map(nd =>
      `<button class="hit" data-n="${nd.n}"><span class="label">EP ${nd.n} · ${esc(nd.topic)}</span>${esc(nd.question)}</button>`).join('');
    list.hidden = !m.length;
    fitResults();
    if (m[0]) show(m[0], 'point');
  });
  // the list ends above the legend panel, never under it
  function fitResults() {
    if (list.hidden || S.narrow) { list.style.maxHeight = ''; return; }
    const legend = document.querySelector('.hud-bl');
    const bottom = legend && legend.offsetParent ? legend.getBoundingClientRect().top : innerHeight;
    list.style.maxHeight = `${Math.max(120, bottom - list.getBoundingClientRect().top - 12)}px`;
  }
  addEventListener('resize', fitResults);
  input.addEventListener('keydown', e => {
    const hits = [...list.querySelectorAll('.hit')];
    if (e.key === 'ArrowDown' && hits.length) { e.preventDefault(); hits[0].focus(); }
    if (e.key === 'Enter' && hits.length) { e.preventDefault(); hits[0].click(); }
  });
  list.addEventListener('keydown', e => {
    const hits = [...list.querySelectorAll('.hit')];
    const i = hits.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && i < hits.length - 1) { e.preventDefault(); hits[i + 1].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? hits[i - 1] : input).focus(); }
  });
  list.addEventListener('focusin', e => {
    const b = e.target.closest('.hit'); if (b) { touched(); show(S.byN.get(+b.dataset.n), 'point'); }
  });
  list.addEventListener('mouseover', e => {
    const b = e.target.closest('.hit'); if (b) { touched(); show(S.byN.get(+b.dataset.n), 'point'); }
  });
  list.addEventListener('click', e => {
    const b = e.target.closest('.hit'); if (b) location.href = `${BASE}e/${b.dataset.n}/`;
  });
}

/* ---------- boot ------------------------------------------------------------ */
async function boot() {
  resize();
  const d = await fetchJSON(`${BASE}data/episodes.json`);
  build(d.episodes);
  document.getElementById('introcount').textContent = S.nodes.length;
  paintProgress();
  bind(); bindPanels();
  show(S.today, 'today');
  document.getElementById('loading')?.remove();
  (function frame(now) { tick(now); draw(); requestAnimationFrame(frame); })(performance.now());
}

boot().catch(err => {
  console.error(err);
  const l = document.getElementById('loading');
  if (l) l.textContent = 'Could not load the questions.';
});
