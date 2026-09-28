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

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmtDate(s) {
  if (!/^\d{8}$/.test(s || '')) return s || '';
  const d = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* What the site says about a question — never about its answers. Four grey
   tags; the three signal colours are kept for actions and states instead:
   yellow = do this, red = recording / something went wrong, green = yours / done. */
export const TAGS = { fun: 'fun', event: 'place & event', deep: 'deep', personal: 'personal' };
export const TAG_ORDER = ['fun', 'event', 'deep', 'personal'];
const FROM_TYPE = { 'big question': 'deep', 'hot take': 'event', 'about you': 'personal' };
export const tagOf = e => (e && (TAGS[e.tag] ? e.tag : FROM_TYPE[e.type])) || 'personal';
export const tagName = e => TAGS[tagOf(e)];
export const MOODS = { 1: 'heavy', 2: 'serious', 3: 'curious', 4: 'light', 5: 'silly' };

/* The faces pulled from each episode (pipeline/faces.py). */
export const heroUrl = e => e && e.hero ? BASE + e.hero : null;
export const faceUrl = (e, k) => `${BASE}media/faces/${e.n}/${k}.jpg`;

/* One search for every page, so "brooklyn" can't mean 1 on the wall and 17 on
   the index. Accents don't matter ("medellin" finds Medellín), countries and
   cities count, and a bare number means that episode exactly. */
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function matches(e, query) {
  const q = fold(query).trim();
  if (!q) return true;
  if (/^\d+$/.test(q)) return String(e.n) === q;
  const hay = fold([e.question, e.context, e.topic, tagName(e), MOODS[e.mood],
                    (e.places || []).join(' '), e.city, e.country, e.borough].join(' '));
  // words match from their start: "rio" is Rio, not se-rio-us
  return q.split(/\s+/).every(w => new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(hay));
}

/* The Apps Script answers cross-site reads as JSONP: a script tag that calls
   back. Rejects on a network error or after `ms`. */
export function jsonp(url, ms = 12000) {
  return new Promise((resolve, reject) => {
    const cb = `qtdcb${Math.random().toString(36).slice(2, 9)}`;
    const s = document.createElement('script');
    const timer = setTimeout(() => done(null, new Error('timeout')), ms);
    function done(d, err) {
      clearTimeout(timer); delete window[cb]; s.remove();
      err ? reject(err) : resolve(d);
    }
    window[cb] = d => done(d);
    s.onerror = () => done(null, new Error('network'));
    s.src = `${url}${url.includes('?') ? '&' : '?'}callback=${cb}&t=${Date.now()}`;
    document.head.appendChild(s);
  });
}

/* The day's question: the same for everyone that day. */
export function todayOf(episodes) {
  const ordered = [...episodes].filter(e => e.question).sort((a, b) => a.n - b.n);
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  return ordered[(day * 37) % ordered.length];
}
