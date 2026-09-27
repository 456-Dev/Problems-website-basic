/* Shared helpers. BASE resolves to the /qtd/ root from this module's own URL,
   so every page can sit at a different depth and still find the data. */
export const BASE = new URL('../', import.meta.url).href;

export async function fetchJSON(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;

const GREEN = [0, 255, 65], YELLOW = [255, 229, 0], RED = [255, 31, 31];

/** spread 0 (everyone agreed) -> green, 0.5 -> yellow, 1 (nobody agreed) -> red */
export function colorForSpread(s) {
  s = clamp(s ?? 0.5, 0, 1);
  const [a, b, t] = s < 0.5 ? [GREEN, YELLOW, s * 2] : [YELLOW, RED, (s - 0.5) * 2];
  return [Math.round(lerp(a[0], b[0], t)),
          Math.round(lerp(a[1], b[1], t)),
          Math.round(lerp(a[2], b[2], t))];
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmtDate(s) {
  if (!/^\d{8}$/.test(s || '')) return s || '';
  const d = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* What the site says about a question — never about its answers. */
export const TYPE_RGB = {
  'big question': [255, 229, 0],
  'hot take': [255, 31, 31],
  'about you': [0, 255, 65],
};
export const TYPE_CLASS = { 'big question': 't-big', 'hot take': 't-hot', 'about you': 't-you' };
export const MOODS = { 1: 'heavy', 2: 'serious', 3: 'curious', 4: 'light', 5: 'silly' };
export const typeRGB = t => TYPE_RGB[t] || TYPE_RGB['about you'];

/* One search for every page, so "brooklyn" can't mean 1 on the wall and 17 on
   the index. Accents don't matter ("medellin" finds Medellín), countries and
   cities count, and a bare number means that episode exactly. */
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function matches(e, query) {
  const q = fold(query).trim();
  if (!q) return true;
  if (/^\d+$/.test(q)) return String(e.n) === q;
  const hay = fold([e.question, e.context, e.topic, e.type, MOODS[e.mood],
                    (e.places || []).join(' '), e.city, e.country, e.borough].join(' '));
  // words match from their start: "rio" is Rio, not se-rio-us
  return q.split(/\s+/).every(w => new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(hay));
}
