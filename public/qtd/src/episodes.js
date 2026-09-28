/* Episodes: every question as a card with a face from the episode. The
   number is loud, the question is always there, and pointing at a card flips
   through the other people who answered it. Today's question leads, big. */
import { BASE, fetchJSON, esc, matches, tagOf, tagName, heroUrl, faceUrl, todayOf, views } from './util.js';

views();

const grid = document.getElementById('grid');
const countEl = document.getElementById('count');
const filterEl = document.getElementById('f');
let eps = [], today = null, tag = '', order = 'new', seen = new Set(), mix = new Map();
try { seen = new Set(JSON.parse(localStorage.getItem('qtd.opened.v1') || '[]')); } catch {}
const hover = matchMedia('(hover: hover)').matches;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function where(e) {
  return ((e.places && e.places[0]) || e.city || '').split(',')[0];
}

function card(e, big) {
  const img = heroUrl(e);
  const pic = img
    ? `<img class="hero" loading="lazy" decoding="async" alt="" src="${esc(img)}">`
    : `<span class="noface" aria-hidden="true">?!</span>`;
  const place = where(e);
  return `<a class="card${big ? ' big' : ''}${seen.has(e.n) ? ' seen' : ''}" href="${BASE}e/${e.n}/" data-n="${e.n}">
    ${pic}
    <span class="shade"></span>
    <span class="n num">${e.n}</span>
    <span class="tag">${esc(tagName(e))}</span>
    ${big ? '<span class="today label">Today’s question</span>' : ''}
    <span class="foot">
      <span class="q">${esc(e.question)}${e.context ? ` <em>${esc(e.context)}</em>` : ''}</span>
      <span class="meta label">${esc(place)}${seen.has(e.n) ? `${place ? ' · ' : ''}<b>seen</b>` : ''}</span>
    </span>
  </a>`;
}

function render() {
  const q = filterEl.value.trim();
  let list = eps.filter(e => matches(e, q) && (!tag || tagOf(e) === tag));
  if (order === 'new') list.sort((a, b) => b.n - a.n);
  else if (order === 'old') list.sort((a, b) => a.n - b.n);
  else list.sort((a, b) => mix.get(a.n) - mix.get(b.n));
  // today's question leads, big, when you're looking at everything
  const lead = !q && !tag && order === 'new' && today ? today : null;
  if (lead) list = [lead, ...list.filter(e => e !== lead)];
  grid.innerHTML = list.map((e, i) => card(e, lead && i === 0)).join('')
    || `<p class="none">Nothing matches “${esc(q)}”${tag ? ` in ${esc(tagName({ tag }))}` : ''}. Try a city, a word or a number.</p>`;
  countEl.textContent = `${list.length} episode${list.length === 1 ? '' : 's'}`;
}

/* pointing at a card flips through the people who answered */
let flipT = 0, flipCard = null;
function stopFlip() {
  clearInterval(flipT);
  if (flipCard) {
    const img = flipCard.querySelector('img.hero');
    if (img && img.dataset.orig) { img.src = img.dataset.orig; img.classList.remove('face'); }
  }
  flipCard = null;
}
function startFlip(c) {
  if (!hover || reduce || c === flipCard) return;
  stopFlip();
  const e = eps.find(x => x.n === +c.dataset.n);
  const img = c.querySelector('img.hero');
  if (!e || !img || !(e.faces > 1)) return;
  flipCard = c;
  img.dataset.orig = img.dataset.orig || img.src;
  const faces = Array.from({ length: e.faces }, (_, k) => faceUrl(e, k));
  faces.forEach(u => { const i = new Image(); i.src = u; });        // warm them up
  let k = 0;
  flipT = setInterval(() => {
    img.classList.add('face');
    img.src = faces[k++ % faces.length];
  }, 520);
}
grid.addEventListener('pointerover', ev => {
  const c = ev.target.closest('.card');
  if (c) startFlip(c);
});
grid.addEventListener('pointerleave', stopFlip);
grid.addEventListener('pointerout', ev => {
  const c = ev.target.closest('.card');
  if (c && !c.contains(ev.relatedTarget)) stopFlip();
});

/* controls */
function pressed(group, btn) {
  group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
}
document.getElementById('tags').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  tag = b.dataset.tag; pressed(ev.currentTarget, b); render(); keep();
});
document.getElementById('order').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  order = b.dataset.o;
  if (order === 'mix') mix = new Map(eps.map(e => [e.n, Math.random()]));
  pressed(ev.currentTarget, b); render(); keep();
});
filterEl.addEventListener('input', () => { render(); keep(); });

/* Back from an episode lands where you were */
function keep() {
  try { history.replaceState({ tag, order, f: filterEl.value, y: scrollY, mix: [...mix] }, ''); } catch {}
}
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let keepT = 0;
addEventListener('scroll', () => { clearTimeout(keepT); keepT = setTimeout(keep, 150); }, { passive: true });
addEventListener('pagehide', keep);
const back = history.state;
if (back && back.order) {
  tag = back.tag || ''; order = back.order; filterEl.value = back.f || '';
  mix = new Map(back.mix || []);
  pressed(document.getElementById('tags'), document.querySelector(`#tags [data-tag="${tag}"]`));
  pressed(document.getElementById('order'), document.querySelector(`#order [data-o="${order}"]`));
}

fetchJSON(`${BASE}data/episodes.json`).then(d => {
  eps = d.episodes.filter(e => e.question);
  today = todayOf(eps);
  if (!mix.size) mix = new Map(eps.map(e => [e.n, Math.random()]));
  render();
  if (back && back.y) requestAnimationFrame(() => scrollTo(0, back.y));
}).catch(() => { countEl.textContent = 'Could not load the episodes.'; });
