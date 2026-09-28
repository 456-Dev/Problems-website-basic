/* When are two questions the same question? The same rules run in
   google/Code.gs (normQ_, similar_) and qa/mockserve.py — keep them in step.
   Case, accents, contractions, British spellings, punctuation and spacing
   don't count; what's left must match 95%. */
export const SAME = 0.95;

const PAIRS = [
  [/\bcan't\b/g, 'can not'], [/\bwon't\b/g, 'will not'], [/\bi'm\b/g, 'i am'],
  [/n't\b/g, ' not'], [/'re\b/g, ' are'], [/'ve\b/g, ' have'], [/'ll\b/g, ' will'],
  [/'d\b/g, ' would'], [/\b(what|who|where|how|it|that|there|when|why|he|she)'s\b/g, '$1 is'],
  [/\b(what|who|where|how|it|that|there)s\b/g, '$1 is'],
  [/\b(do|does|did|is|are|was|were|would|should|could|has|have)nt\b/g, '$1 not'],
  [/\bcant\b/g, 'can not'], [/\bim\b/g, 'i am'],
  [/(favo|colo|flavo|neighbo|behavio|hono|humo|labo)ur/g, '$1r'], [/\bq:\s*/g, ''],
];

export function normQ(s) {
  s = String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʼ`]/g, "'");
  for (const [re, to] of PAIRS) s = s.replace(re, to);
  return s.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function lev(a, b) {
  if (a === b) return 1;
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let k = 1; k <= n; k++) {
      cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

export function similar(a, b) {
  return Math.max(lev(a, b), lev(a.replace(/ /g, ''), b.replace(/ /g, '')));
}

/** The closest of `items` to `text`: { item, sim }, compared on normQ(get(item)). */
export function closest(text, items, get = x => x) {
  const k = normQ(text);
  let best = null, sim = 0;
  for (const it of items) {
    const s = similar(k, normQ(get(it)));
    if (s > sim) { sim = s; best = it; }
  }
  return { item: best, sim };
}
