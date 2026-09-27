import { BASE, fetchJSON, esc, TYPE_CLASS, MOODS, matches } from './util.js';

const rowsEl = document.getElementById('rows');
const countEl = document.getElementById('count');
const filterEl = document.getElementById('f');
let eps = [], sortKey = 'n', desc = false;

function render() {
  const list = eps.filter(e => matches(e, filterEl.value));
  const sorted = [...list].sort((a, b) => {
    const k = sortKey;
    const av = a[k], bv = b[k];
    // episodes with no data sort last whichever way you read the column
    if (av == null && bv == null) return a.n - b.n;
    if (av == null) return 1;
    if (bv == null) return -1;
    return desc ? bv - av : av - bv;
  });

  rowsEl.innerHTML = sorted.map(e => `<tr data-n="${e.n}">
      <td class="epn">${e.n}</td>
      <td><a class="eq" href="${BASE}e/${e.n}/">${esc(e.question)}</a>${e.context ? ` <span class="ctx">${esc(e.context)}</span>` : ''}</td>
      <td class="where hideS">${esc(e.topic || '')}</td>
      <td class="where hideS">${esc(MOODS[e.mood] || '')}</td>
      <td><span class="qt ${TYPE_CLASS[e.type] || ''}">${esc(e.type || '')}</span></td>
      <td class="ra hideS">${e.views ? e.views.toLocaleString() : '<span class="muted">—</span>'}</td>
    </tr>`).join('');
  countEl.textContent = `${sorted.length} of ${eps.length} episodes`;
}

document.getElementById('sorts').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const k = b.dataset.k;
  // same column twice flips direction; a new column starts descending for
  // the measures and ascending for episode order
  if (k === sortKey) desc = !desc; else { sortKey = k; desc = !(k === 'n' || k === 'mood'); }
  marks();
  render();
});

// which way the active column reads, spelled out where arrows would be vague
const DIR = { n: d => d ? '\u2193' : '\u2191', mood: d => d ? 'silly first' : 'heavy first',
              views: d => d ? '\u2193' : '\u2191' };
function marks() {
  [...document.getElementById('sorts').children].forEach(x => {
    x.setAttribute('aria-pressed', String(x.dataset.k === sortKey));
    x.dataset.dir = x.dataset.k === sortKey ? DIR[x.dataset.k](desc) : '';
  });
}
marks();

rowsEl.addEventListener('click', e => {
  if (e.target.closest('a')) return;             // the link goes by itself
  const tr = e.target.closest('tr'); if (!tr) return;
  location.href = `${BASE}e/${tr.dataset.n}/`;
});
filterEl.addEventListener('input', render);

fetchJSON(`${BASE}data/episodes.json`).then(d => { eps = d.episodes; render(); })
  .catch(() => { countEl.textContent = 'Could not load the index.'; });
