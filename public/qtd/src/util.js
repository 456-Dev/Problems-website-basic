/* Shared helpers. BASE resolves to the /qtd/ root from this module's own URL,
   so every page can sit at a different depth and still find the data. */
import { CONFIG } from '../config.js';

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
  const hay = fold([e.question, e.context, e.topic, tagName(e),
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

/* What the answer sheet's script can do. An old deployment answers every
   request with its answer list and no version: it can't take films, list
   suggestions or count views, so the pages say so instead of pretending.
   Google wakes these scripts slowly (often 5-15 s on the first request), so
   a slow or failed check means "don't know", and "don't know" doesn't close
   anything: only a clear answer from an old script does. */
let caps = null;
export function backend() {
  if (!caps) caps = (async () => {
    if (!CONFIG.SHEET_URL) return { state: 'none', features: [] };
    for (const ms of [20000, 25000]) {
      try {
        const d = await jsonp(`${CONFIG.SHEET_URL}?version=1`, ms);
        return d && d.version ? { state: 'new', version: d.version, features: d.features || [] }
                              : { state: 'old', features: ['text'] };
      } catch { /* slow to wake: once more */ }
    }
    return { state: 'unknown', features: [] };
  })();
  return caps;
}
export async function can(f) {
  const b = await backend();
  if (b.state === 'none') return false;
  if (b.state === 'unknown') return true;          // try it; a real failure says so itself
  return b.features.includes(f);
}

/* Page views. Each page is counted once per visit (a reload in the same tab
   doesn't count again) and, unless the browser asks not to be tracked,
   logged with coarse details only: the page, the site you came from (its
   name, not the address), campaign tags, phone / tablet / desktop, browser and
   system family, language, time zone, screen width to the nearest 50px, and
   how long the page was open. No cookies, no IP address, nothing that follows
   a person between visits. The About page says the same.
   Resolves to { page, total } or null. */
const noTrack = () => navigator.globalPrivacyControl === true ||
  navigator.doNotTrack === '1' || window.doNotTrack === '1';

function visitDetails() {
  const ua = navigator.userAgent || '';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android'
    : /CrOS/.test(ua) ? 'ChromeOS' : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'other';
  const br = /Instagram/.test(ua) ? 'Instagram app' : /FBAN|FBAV/.test(ua) ? 'Facebook app'
    : /TikTok|musical_ly/.test(ua) ? 'TikTok app' : /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera'
    : /Firefox\/|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari' : 'other';
  const touch = (navigator.maxTouchPoints || 0) > 0;
  const short = Math.min(screen.width || 0, screen.height || 0);
  const dev = /iPad|Tablet/.test(ua) || (touch && short >= 600 && short < 1100) ? 'tablet'
    : touch && short < 600 ? 'phone' : 'desktop';
  let ref = 'direct';
  try {
    if (document.referrer) {
      const r = new URL(document.referrer);
      ref = r.origin === location.origin ? `here ${r.pathname}` : r.hostname.replace(/^www\./, '');
    }
  } catch {}
  const q = new URLSearchParams(location.search);
  const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map(k => q.get(k)).filter(Boolean).join(' / ');
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
  let nv = '1';
  try { nv = sessionStorage.getItem('qtd.visit') ? '0' : '1'; sessionStorage.setItem('qtd.visit', '1'); } catch {}
  return { ref, utm, dev, br, os, sw: Math.floor((innerWidth || 0) / 50) * 50,
           lang: (navigator.language || '').slice(0, 5), tz, nv };
}

// time on page: counts only while the tab is on screen, sent as it closes or hides
function timeOnPage(vid) {
  let shown = document.visibilityState === 'visible' ? performance.now() : null, total = 0, sent = false;
  const flush = () => {
    if (shown !== null) { total += performance.now() - shown; shown = null; }
    if (sent || total < 1000) return;
    sent = true;
    try {
      navigator.sendBeacon(CONFIG.SHEET_URL, new Blob([JSON.stringify({ kind: 'leave', vid, secs: Math.round(total / 1000) })],
                                                      { type: 'text/plain;charset=utf-8' }));
    } catch {}
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else if (!sent) shown = performance.now();
  });
  addEventListener('pagehide', flush);
}

export async function views(path = location.pathname) {
  if (!(await can('views'))) return null;
  const key = `qtd.counted.${path}`;
  let counted = false;
  try { counted = !!sessionStorage.getItem(key); } catch {}
  let extra = '';
  if (!counted && !noTrack()) {
    const d = visitDetails();
    d.vid = Math.random().toString(36).slice(2, 12);                  // this one page view only
    extra = '&' + new URLSearchParams(d).toString();
    timeOnPage(d.vid);
  }
  try {
    const r = await jsonp(`${CONFIG.SHEET_URL}?hit=${encodeURIComponent(path)}&n=${counted ? 0 : 1}${extra}`);
    try { sessionStorage.setItem(key, '1'); } catch {}
    return r && r.ok ? r : null;
  } catch { return null; }
}
