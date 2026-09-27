/* The wall. Every episode as a tile: a face from the episode itself, the
   number loud over it, the question on approach. */
import { BASE, fetchJSON, esc, typeRGB, MOODS, matches } from './util.js';

const grid = document.getElementById('grid');
const countEl = document.getElementById('count');
const filterEl = document.getElementById('f');
let eps = [], sortKey = 'n', desc = true, seen = new Set();

try { seen = new Set(JSON.parse(localStorage.getItem('qtd.opened.v1') || '[]')); } catch {}

const nfmt = n => n == null ? null
  : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + 'M'
  : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);

function render() {
  const list = eps.filter(e => matches(e, filterEl.value));
  const sorted = [...list].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return b.n - a.n;
    if (av == null) return 1;
    if (bv == null) return -1;
    return desc ? bv - av : av - bv;
  });

  grid.innerHTML = sorted.map(e => {
    const [r, g, b] = typeRGB(e.type);
    const img = e.face
      ? `<img loading="lazy" alt="" src="${BASE}media/frames/${esc(e.face)}">`
      : e.thumb ? `<img loading="lazy" alt="" src="${esc(e.thumb)}">`
      : `<span class="noimg">${esc(e.topic || '')}</span>`;
    const yt = nfmt(e.views), ig = nfmt(e.igViews);
    const meta = [
      yt ? `<span class="yt"><b>▶</b> ${yt}</span>` : '',
      ig ? `<span class="ig"><b>◉</b> ${ig}</span>` : '',
    ].join('');
    return `<a class="cell ${seen.has(e.n) ? 'seen' : ''}" href="${BASE}e/${e.n}/">
      ${img}
      <span class="shade"></span>
      <span class="bar" style="background:rgb(${r},${g},${b})"></span>
      <span class="n">${e.n}</span>
      <span class="meta">${meta}</span>
      <span class="q">${esc(e.question)}${e.context ? ` <em>${esc(e.context)}</em>` : ''}</span>
    </a>`;
  }).join('') || `<p class="gridempty label">Nothing matches “${esc(filterEl.value.trim())}”. Try a city, a topic or a word.</p>`;
  countEl.textContent = `${sorted.length} of ${eps.length}`;
}

// Back from an episode lands where you were: same sort, same filter, same spot
function marks() {
  [...document.getElementById('sorts').children].forEach(x => {
    x.setAttribute('aria-pressed', String(x.dataset.k === sortKey));
    x.dataset.dir = x.dataset.k === sortKey ? (desc ? '\u2193' : '\u2191') : '';
  });
}
function keep() {
  try { history.replaceState({ sortKey, desc, f: filterEl.value, y: scrollY }, ''); } catch {}
}
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let keepT = 0;
addEventListener('scroll', () => { clearTimeout(keepT); keepT = setTimeout(keep, 150); }, { passive: true });
addEventListener('pagehide', keep);

document.getElementById('sorts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const k = b.dataset.k;
  if (k === sortKey) desc = !desc; else { sortKey = k; desc = true; }
  marks();
  render();
  keep();
});
filterEl.addEventListener('input', () => { render(); keep(); });

const back = history.state;
if (back && back.sortKey) { sortKey = back.sortKey; desc = !!back.desc; filterEl.value = back.f || ''; }
marks();

fetchJSON(`${BASE}data/episodes.json`).then(d => {
  eps = d.episodes; render();
  if (back && back.y) requestAnimationFrame(() => scrollTo(0, back.y));
})
  .catch(() => { countEl.textContent = 'Could not load the episodes.'; });
