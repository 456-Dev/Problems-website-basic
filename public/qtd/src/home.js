/* Home: what should we ask strangers next?
   One input. As you type it checks the questions already asked on the street
   (95% the same: we take you to that video) and the ones already suggested
   (95% the same: it counts as your vote, never a second line). Under it, the
   list of suggestions, most wanted first. Behind it, a wall of the strangers
   who already answered: point at one to see what they were asked. */
import { BASE, fetchJSON, esc, jsonp, clamp, todayOf, can, views } from './util.js';
import { CONFIG } from '../config.js';
import { closest, SAME } from './similar.js';

const $ = id => document.getElementById(id);
const input = $('askq'), form = $('askform'), go = $('askgo');
const hint = $('askhint'), status = $('askstatus');
const board = $('board'), empty = $('boardempty'), more = $('boardmore');

const S = { eps: [], byN: new Map(), sugg: null, sort: 'top', showAll: false, busy: false,
            voted: new Set(), fresh: null, feed: 'loading' };
const touch = matchMedia('(hover: none)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEFAULT_HINT = hint.innerHTML;

// the only thing this browser remembers: which suggestions it voted for
const VOTED = 'qtd.voted.v1';
try { S.voted = new Set(JSON.parse(localStorage.getItem(VOTED) || '[]')); } catch {}
const saveVoted = () => { try { localStorage.setItem(VOTED, JSON.stringify([...S.voted])); } catch {} };

function setStatus(msg, kind) {
  status.className = 'ask-status' + (kind ? ` ${kind}` : '');
  status.textContent = msg || '';
}
// the sheet keeps a formula-looking question as text behind an apostrophe
const shown = q => String(q || '').replace(/^'(?=[=+\-@])/, '');
const epLink = e => `<a href="${BASE}e/${e.n}/">EP ${e.n} · ${esc(e.question)} →</a>`;

/* ---------- as you type ---------------------------------------------------- */
function assess(text) {
  const t = text.trim();
  if (t.length < 6) return null;
  return { ep: closest(t, S.eps, e => e.question), sg: closest(t, S.sugg || [], s => shown(s.question)) };
}

function renderHint() {
  const a = assess(input.value);
  hint.className = 'ask-hint';
  if (!a) { hint.innerHTML = DEFAULT_HINT; return; }
  if (a.ep.item && a.ep.sim >= SAME) {
    hint.classList.add('match');
    hint.innerHTML = `<b>Already asked on the street.</b> ${epLink(a.ep.item)} <span class="dim">Enter takes you there.</span>`;
  } else if (a.sg.item && a.sg.sim >= SAME) {
    const mine = S.voted.has(a.sg.item.id);
    hint.classList.add('match');
    hint.innerHTML = `<b>Already suggested</b> — ${a.sg.item.votes} ${a.sg.item.votes === 1 ? 'vote' : 'votes'}. ` +
      `<span class="dim">${mine ? 'You’ve voted for it already.' : 'Enter adds yours.'}</span>`;
  } else if (a.ep.item && a.ep.sim >= 0.8) {
    hint.innerHTML = `Close to ${epLink(a.ep.item)} <span class="dim">Different enough? Suggest it.</span>`;
  } else {
    hint.innerHTML = DEFAULT_HINT;
  }
}
let hintT = 0;
input.addEventListener('input', () => { clearTimeout(hintT); hintT = setTimeout(renderHint, 90); setStatus(''); });

/* ---------- suggesting ----------------------------------------------------- */
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (S.busy) return;
  const text = input.value.replace(/\s+/g, ' ').trim();
  if (text.length < 8 || !/[a-z]{2}/i.test(text)) {
    setStatus('Ask a whole question — a few words at least.', 'err'); input.focus(); return;
  }
  const r = input.getBoundingClientRect();
  ripple(r.left + r.width / 2, r.top + r.height / 2);
  const a = assess(text);
  if (a && a.ep.item && a.ep.sim >= SAME) {
    const n = a.ep.item.n;
    setStatus(`We asked that on the street — episode ${n}. Taking you there…`, 'ok');
    setTimeout(() => { location.href = `${BASE}e/${n}/`; }, reduce ? 250 : 1300);
    return;
  }
  if (!CONFIG.SHEET_URL || S.feed === 'off' || !(await can('suggest'))) {
    setStatus('We haven’t asked that yet. Suggestions open soon — try again in a day or two.', 'err'); return;
  }
  S.busy = true; go.disabled = true;
  setStatus('Sending…');
  try {
    const d = await jsonp(`${CONFIG.SHEET_URL}?suggest=${encodeURIComponent(text)}`);
    if (!d || d.ok === false || !d.id) throw new Error((d && d.error) || 'failed');
    S.sugg = d.suggestions || S.sugg || [];
    S.feed = 'ok';
    S.voted.add(d.id); saveVoted();
    S.fresh = d.id;
    // keep your question in view even when it isn't in the top ten
    const list = sorted();
    if (list.findIndex(s => s.id === d.id) >= 10) S.showAll = true;
    setStatus(d.result === 'merged'
      ? `Someone beat you to it, so that’s your vote: ${d.votes} people want it asked.`
      : 'Added to the list. Tell a friend — votes decide what gets asked.', 'ok');
    input.value = '';
    renderHint();
    renderBoard();
    board.querySelector('.fresh')?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  } catch (err) {
    setStatus(/short/.test(err.message) ? 'Ask a whole question — a few words at least.'
      : 'That didn’t go through. Check your connection and try again.', 'err');
  } finally {
    S.busy = false; go.disabled = false;
  }
});

/* ---------- the list ------------------------------------------------------- */
function sorted() {
  const list = [...(S.sugg || [])];
  return S.sort === 'new'
    ? list.sort((a, b) => String(b.at).localeCompare(String(a.at)))
    : list.sort((a, b) => b.votes - a.votes || String(b.at).localeCompare(String(a.at)));
}

function renderBoard() {
  if (S.sugg === null) {
    board.innerHTML = '';
    empty.hidden = false;
    empty.textContent = S.feed === 'failed' ? 'Couldn’t load the suggestions right now. Try again in a minute.'
      : S.feed === 'off' ? 'Suggestions open soon. You can still type a question to see if we’ve asked it.'
      : 'Loading what people want asked…';
    more.hidden = true;
    return;
  }
  const list = sorted();
  const shownList = S.showAll ? list : list.slice(0, 10);
  board.innerHTML = shownList.map((s, i) => {
    const mine = S.voted.has(s.id);
    const q = shown(s.question);
    return `<li class="sg${s.id === S.fresh ? ' fresh' : ''}${mine ? ' voted' : ''}" data-id="${esc(s.id)}">
      <span class="sg-rank num">${i + 1}</span>
      <span class="sg-q">${esc(q)}</span>
      <button class="sg-vote" type="button" aria-pressed="${mine}"
        aria-label="${mine ? 'You voted for' : 'Vote for'}: ${esc(q)} (${s.votes} ${s.votes === 1 ? 'vote' : 'votes'})">
        <b aria-hidden="true">▲</b><span class="num">${s.votes}</span></button>
    </li>`;
  }).join('');
  empty.hidden = list.length > 0;
  empty.textContent = 'Nothing suggested yet. The first question you type goes straight to the top.';
  more.hidden = list.length <= 10;
  more.textContent = S.showAll ? 'Show the top ten' : `Show all ${list.length}`;
}

board.addEventListener('click', async e => {
  const b = e.target.closest('.sg-vote'); if (!b) return;
  const id = b.closest('.sg').dataset.id;
  const s = (S.sugg || []).find(x => x.id === id); if (!s) return;
  if (S.voted.has(id)) { setStatus('You’ve voted for that one already.', ''); return; }
  s.votes += 1; S.voted.add(id); saveVoted(); renderBoard();        // feels instant
  try {
    const d = await jsonp(`${CONFIG.SHEET_URL}?vote=${encodeURIComponent(id)}`);
    if (!d || d.ok === false) throw new Error('vote');
    S.sugg = d.suggestions || S.sugg;
    renderBoard();
  } catch {
    s.votes -= 1; S.voted.delete(id); saveVoted(); renderBoard();
    setStatus('Your vote didn’t go through. Try again.', 'err');
  }
});

$('boardsort').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  S.sort = b.dataset.sort;
  $('boardsort').querySelectorAll('button').forEach(x => {
    x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b));
  });
  renderBoard();
});
more.addEventListener('click', () => { S.showAll = !S.showAll; renderBoard(); });

async function loadSuggestions() {
  if (!CONFIG.SHEET_URL || !(await can('suggest'))) {
    S.feed = 'off'; S.sugg = null; renderBoard(); return;
  }
  try {
    const d = await jsonp(`${CONFIG.SHEET_URL}?suggestions=1`);
    if (!d || d.ok === false || !Array.isArray(d.suggestions)) throw new Error('feed');
    S.sugg = d.suggestions;
    S.feed = 'ok';
  } catch {
    S.feed = 'failed';
  }
  renderBoard();
  renderHint();
}

/* ---------- the wall of faces ---------------------------------------------- */
const wall = $('facewall'), tip = $('facetip');
const W = { atlas: null, tiles: [], size: 76, pointer: null, raf: 0, order: [], next: 0 };

function faceAt(t, i) {
  const a = W.atlas, s = W.size;
  t.dataset.i = i;
  t.style.backgroundPosition = `${-(i % a.cols) * s}px ${-Math.floor(i / a.cols) * s}px`;
}
function nextFace() {
  if (W.next >= W.order.length) { W.order.sort(() => Math.random() - 0.5); W.next = 0; }
  return W.order[W.next++];
}

function buildWall() {
  const a = W.atlas; if (!a) return;
  W.size = innerWidth < 700 ? 60 : innerWidth < 1200 ? 70 : 78;
  const s = W.size;
  const cols = Math.ceil(innerWidth / s) + 1, rows = Math.ceil(innerHeight / s) + 1;
  wall.style.setProperty('--s', `${s}px`);
  wall.style.gridTemplateColumns = `repeat(${cols}, ${s}px)`;
  W.order = a.faces.map((_, i) => i).sort(() => Math.random() - 0.5);
  W.next = 0;
  const frag = document.createDocumentFragment();
  W.tiles = [];
  for (let k = 0; k < cols * rows; k++) {
    const t = document.createElement('i');
    t.style.backgroundImage = `url(${BASE}${a.src})`;
    t.style.backgroundSize = `${a.cols * s}px ${a.rows * s}px`;
    faceAt(t, nextFace());
    t._l = 0;
    frag.appendChild(t);
    W.tiles.push(t);
  }
  wall.replaceChildren(frag);
  measure();
  light();
}
function measure() {
  for (const t of W.tiles) {
    const r = t.getBoundingClientRect();
    t._x = r.left + r.width / 2; t._y = r.top + r.height / 2;
  }
}

// a pool of light around the pointer: the faces there come up in colour
function light() {
  cancelAnimationFrame(W.raf);
  W.raf = requestAnimationFrame(() => {
    const p = W.pointer, R = W.size * 3.2, now = performance.now();
    for (const t of W.tiles) {
      let l = p ? clamp(1 - Math.hypot(t._x - p[0], t._y - p[1]) / R, 0, 1) : 0;
      if (t._flash && t._flash > now) l = Math.max(l, (t._flash - now) / 700);
      if (Math.abs(l - t._l) > 0.015) {
        t._l = l;
        t.style.filter = l > 0.01 ? `grayscale(${(1 - l).toFixed(2)}) brightness(${(0.4 + 0.65 * l).toFixed(2)})` : '';
      }
    }
    if (W.tiles.some(t => t._flash && t._flash > now)) light();
  });
}

function flip(t, then) {
  if (reduce || !t.animate) { faceAt(t, nextFace()); then && then(); return; }
  t.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 140, easing: 'ease-in' })
   .onfinish = () => {
     faceAt(t, nextFace());
     t.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 160, easing: 'ease-out' });
     then && then();
   };
}

// when you suggest something, the faces turn over from where you typed
function ripple(x, y) {
  if (!W.tiles.length) return;
  const now = performance.now();
  for (const t of W.tiles) {
    const d = Math.hypot(t._x - x, t._y - y);
    if (d > 900) continue;
    const delay = reduce ? 0 : d * 0.7;
    setTimeout(() => flip(t), delay);
    t._flash = now + delay + 700;
  }
  light();
}

function tileAt(x, y) {
  const el = document.elementFromPoint(x, y);
  return el && el.parentElement === wall ? el : null;
}
function showTip(t, x, y) {
  if (!t) { tip.hidden = true; wall.style.cursor = ''; return; }
  const [n] = W.atlas.faces[+t.dataset.i];
  const e = S.byN.get(n); if (!e) { tip.hidden = true; return; }
  tip.innerHTML = `<span class="label">EP ${n}${touch ? ' · tap again to watch' : ''}</span>${esc(e.question)}`;
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  tip.style.left = `${clamp(x + 14, 8, innerWidth - r.width - 8)}px`;
  tip.style.top = `${clamp(y + 16, 56, innerHeight - r.height - 8)}px`;
  wall.style.cursor = 'pointer';
}

let tipped = null;
document.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  W.pointer = [e.clientX, e.clientY];
  light();
  showTip(tileAt(e.clientX, e.clientY), e.clientX, e.clientY);
}, { passive: true });
document.addEventListener('pointerleave', () => { W.pointer = null; light(); tip.hidden = true; });
wall.addEventListener('click', e => {
  const t = e.target.parentElement === wall ? e.target : null; if (!t) return;
  const [n] = W.atlas.faces[+t.dataset.i];
  if (touch && tipped !== t) {            // first tap says who; the second opens it
    tipped = t; W.pointer = [t._x, t._y]; light(); showTip(t, t._x, t._y); return;
  }
  location.href = `${BASE}e/${n}/`;
});
tip.addEventListener('click', () => { if (tipped) tipped.click(); });

// the wall is never still: a few faces turn over every second; on a phone
// the pool of light drifts by itself
setInterval(() => {
  if (document.hidden || !W.tiles.length || reduce) return;
  for (let k = 0; k < 3; k++) flip(W.tiles[(Math.random() * W.tiles.length) | 0]);
}, 1100);
if (touch && !reduce) {
  const t0 = performance.now();
  setInterval(() => {
    if (document.hidden || tipped) return;
    const t = (performance.now() - t0) / 1000;
    W.pointer = [innerWidth * (0.5 + 0.42 * Math.sin(t * 0.23)), innerHeight * (0.5 + 0.4 * Math.sin(t * 0.37 + 1))];
    light();
  }, 120);
}
let rT = 0;
addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(buildWall, 150); });
addEventListener('scroll', () => { measure(); }, { passive: true });

/* ---------- boot ----------------------------------------------------------- */
views().then(v => {
  if (!v) return;
  $('nvisits').textContent = v.total.toLocaleString();
  $('nvisitsw').textContent = v.total === 1 ? 'visit' : 'visits';
  $('visits').hidden = false;
});
renderBoard();
loadSuggestions();
fetchJSON(`${BASE}data/episodes.json`).then(d => {
  S.eps = d.episodes.filter(e => e.question);
  S.byN = new Map(S.eps.map(e => [e.n, e]));
  $('neps').textContent = S.eps.length;
  const t = todayOf(S.eps);
  if (t) {
    $('today').href = `${BASE}e/${t.n}/`;
    $('todayq').textContent = t.question;
    $('today').hidden = false;
  }
  renderHint();
}).catch(() => {});
fetchJSON(`${BASE}data/atlas.json`).then(a => {
  W.atlas = a;
  const img = new Image();
  img.onload = () => { buildWall(); wall.classList.add('on'); };
  img.src = `${BASE}${a.src}`;
}).catch(() => {});
