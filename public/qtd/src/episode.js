/* One episode on one screen: the video, your answer (written or filmed), what
   everyone online has said, and the next question. The street answers are
   the video itself; this page only lists what came in through the internet. */
import { BASE, esc, fetchJSON } from './util.js';
import { CONFIG } from '../config.js';

const main = document.querySelector('.ep');
const EP = +main.dataset.ep;
const VIDEO = main.dataset.video;
const STREET = +main.dataset.street || 0;
const QUESTION = document.querySelector('.ep-titletext h1 .q')?.textContent
  || document.querySelector('.ep-titletext h1')?.textContent || '';
const MAX = 600;

const list = document.getElementById('alist');
const empty = document.getElementById('sayempty');
const status = document.getElementById('astatus');
const sayCount = document.getElementById('saycount');
const text = document.getElementById('atext');

function setStatus(msg, kind) {
  status.className = 'label' + (kind ? ` ${kind}` : '');
  status.textContent = msg || '';
}

/* ---------- storage that survives being blocked ------------------------- */
// What you sent from this browser: { kind, text, at, ok } — ok once the feed
// has served it back. Films stay until an approved clip turns up.
const MINE = 'qtd.mine.v1';
let memory = {};                          // fallback when localStorage throws
function loadAll() {
  try { return JSON.parse(localStorage.getItem(MINE) || '{}'); } catch { return memory; }
}
function saveAll(all) {
  try { localStorage.setItem(MINE, JSON.stringify(all)); } catch { memory = all; }
}
const mine = () => loadAll()[EP] || [];
function saveMine(list) { const all = loadAll(); all[EP] = list; saveAll(all); }
function remember(entry) {
  const row = { ...entry, at: Date.now() };
  saveMine([...mine(), row]);
  return row;
}
try {
  const op = new Set(JSON.parse(localStorage.getItem('qtd.opened.v1') || '[]'));
  op.add(EP);
  localStorage.setItem('qtd.opened.v1', JSON.stringify([...op]));
} catch {}

/* ---------- what the internet says -------------------------------------- */
let web = [];            // rows from the sheet: { kind, answer, file, at }
let feed = 'loading';    // loading | ok | failed
const checking = new Set();               // local answers being read back right now
const HOLD = 10 * 60 * 1000;              // show an unconfirmed answer this long
const FILM_HOLD = 14 * 24 * 3600 * 1000;  // an unwatched clip placeholder this long
// Sheets keeps a formula-looking answer as text with a leading apostrophe;
// compare what people typed, not how the sheet stored it
const norm = s => String(s || '').replace(/^'(?=[=+\-@])/, '').normalize('NFC').replace(/\s+/g, ' ').trim();
const same = (a, b) => norm(a) === norm(b);
const shown = s => String(s || '').replace(/^'(?=[=+\-@])/, '');
const when = r => typeof r.at === 'number' ? (r.at < 1e12 ? r.at * 1000 : r.at) : (Date.parse(r.at) || 0);
const copies = t => web.filter(r => r.kind !== 'video' && same(r.answer, t)).length;
// arrived = the feed holds more copies of these words than it did when you sent
// them; someone else's identical "yes" doesn't count as yours
const inFeed = m => copies(m.text) > (m.base || 0);

function driveId(url) {
  const m = String(url || '').match(/\/d\/([A-Za-z0-9_-]{10,})|[?&]id=([A-Za-z0-9_-]{10,})/);
  return m ? (m[1] || m[2]) : null;
}

// Mark what the feed has served back, and let go of what it never will:
// an answer that was confirmed and later disappeared was taken down.
function reconcile() {
  if (feed !== 'ok') return;
  const now = Date.now();
  const vids = web.filter(r => r.kind === 'video').map(when).sort((a, b) => a - b);
  const next = [];
  for (const m of mine()) {
    if (m.kind === 'video') {
      const i = vids.findIndex(t => t >= m.at - HOLD);        // an approved clip from about then
      if (i >= 0) { vids.splice(i, 1); continue; }
      if (now - m.at < FILM_HOLD) next.push(m);
      continue;
    }
    if (inFeed(m)) { next.push({ ...m, ok: true }); continue; }
    if (m.ok || now - m.at > HOLD) continue;
    next.push(m);
  }
  saveMine(next);
}

function paint() {
  const sent = mine();
  const rows = [...web].sort((a, b) => when(b) - when(a));      // newest first
  // yours, one sent answer per served row, so two people saying "yes" stay two people
  const texts = sent.filter(m => m.kind === 'text');
  const unclaimed = texts.filter(m => m.ok || inFeed(m));
  const tagged = rows.map(r => {
    if (r.kind === 'video') return { r, me: false };
    const i = unclaimed.findIndex(m => same(m.text, r.answer));
    if (i < 0) return { r, me: false };
    unclaimed.splice(i, 1);
    return { r, me: true };
  });
  // sent from here but not served back (yet): on top, clearly not live
  const waiting = texts.filter(m => !m.ok && !inFeed(m)).sort((a, b) => b.at - a.at);
  const films = sent.filter(m => m.kind === 'video');

  const filmHtml = films.map(() => `<li class="a web mine pending"><span class="a-who">you</span>
      <p class="a-text">Your filmed answer is waiting to be watched. It’ll appear here once it has.</p></li>`);
  const waitHtml = waiting.map(m => {
    const busy = checking.has(m.at);
    return `<li class="a web mine pending unconfirmed"><span class="a-who">you</span>
      <div><p class="a-text user-text">${esc(m.text)}</p>
      <p class="a-flag label">${busy ? 'Checking it arrived…'
        : `Not showing online yet <button class="resend" type="button" data-at="${m.at}">Send again</button>`}</p></div></li>`;
  });
  const rowHtml = tagged.map(({ r, me }) => {
    if (r.kind === 'video') {
      const id = driveId(r.file);
      if (!id) return '';
      return `<li class="a web vid"><span class="a-who">film</span>
        <div class="vidwrap"><iframe loading="lazy" allow="autoplay"
          src="https://drive.google.com/file/d/${esc(id)}/preview" title="A filmed answer"></iframe></div></li>`;
    }
    return `<li class="a web ${me ? 'mine' : ''}">
      <span class="a-who">${me ? 'you' : 'anon'}</span>
      <p class="a-text">${esc(shown(r.answer))}</p></li>`;
  });
  list.innerHTML = [...filmHtml, ...waitHtml, ...rowHtml].join('');

  // the count is what everyone can see: served rows only
  const online = list.querySelectorAll('.a:not(.pending)').length;
  empty.hidden = online > 0 || films.length > 0 || waiting.length > 0;
  empty.textContent = feed === 'failed'
    ? 'Couldn’t load the answers from online right now. Try again in a minute.'
    : feed === 'loading' ? 'Loading answers from online…'
    : 'Nobody online has answered this one yet. You could be first.';
  sayCount.textContent = online ? `${online} online` : '';
  document.getElementById('anscount').textContent = STREET + online;
  document.getElementById('ansnote').textContent =
    online ? `${STREET} in the video · ${online} online`
    : feed === 'loading' && CONFIG.SHOW_SUBMISSIONS ? `in the video · loading online`
    : (STREET === 1 ? 'answer' : 'answers');
}

function readFeed() {
  return new Promise(resolve => {
    if (!CONFIG.SHEET_URL || !CONFIG.SHOW_SUBMISSIONS) { feed = 'ok'; paint(); return resolve(false); }
    const cb = `qtdcb${Math.random().toString(36).slice(2, 9)}`;
    const s = document.createElement('script');
    const timer = setTimeout(() => done(null), 8000);
    function done(d) {
      clearTimeout(timer); delete window[cb]; s.remove();
      if (d && d.ok !== false) {
        feed = 'ok';
        web = (d.answers || []).filter(r => r.kind === 'video' ? !!r.file : !!norm(r.answer));
        reconcile();
      } else if (feed !== 'ok') {
        feed = 'failed';
      }
      paint();
      resolve(!!d);
    }
    window[cb] = done;
    s.src = `${CONFIG.SHEET_URL}?episode=${EP}&callback=${cb}&t=${Date.now()}`;
    s.onerror = () => done(null);
    document.head.appendChild(s);
  });
}
paint();
readFeed();

/* ---------- answer anonymously ------------------------------------------ */
const form = document.getElementById('addform');
const counter = document.getElementById('acount');
const btn = document.getElementById('asend');
const TRIMMED = `Trimmed to ${MAX} characters.`;
// nothing a person can see: zero-width spaces, joiners, soft hyphens, BOMs
const visible = s => s.replace(/[\s​-‍⁠᠎﻿­]/g, '');
let posting = false;     // a POST is in flight: Cmd+Enter must not start another
let lastSent = { text: '', t: 0 };

text.addEventListener('input', () => {
  const n = text.value.length;
  counter.textContent = n > MAX - 120 ? `${n}/${MAX}` : '';
  counter.classList.toggle('near', n >= MAX);
  if (n < MAX && status.textContent === TRIMMED) setStatus('');
});
text.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); form.requestSubmit(); }
});
text.addEventListener('paste', e => {
  const pasted = (e.clipboardData && e.clipboardData.getData('text')) || '';
  const kept = text.value.length - (text.selectionEnd - text.selectionStart);
  if (kept + pasted.length > MAX) setTimeout(() => setStatus(TRIMMED, 'err'), 0);
});

async function post(body) {
  await fetch(CONFIG.SHEET_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ kind: 'text', episode: EP, videoId: VIDEO, question: QUESTION,
                           answer: body, name: '', at: new Date().toISOString() }),
  });
}

// The sheet can't answer a cross-site post, so read the feed back to know the
// answer really landed rather than assuming it did. Quick checks first, then
// quieter ones for about a minute.
async function confirm(entry) {
  checking.add(entry.at);
  paint();
  let first = true;
  for (const wait of [900, 2500, 8000, 15000, 30000]) {
    await new Promise(r => setTimeout(r, wait));
    await readFeed();
    if (inFeed(entry)) {
      checking.delete(entry.at);
      paint();
      if (lastSent.t === entry.at) setStatus('In. It’s live for everyone.', 'ok');
      return;
    }
    if (first && wait >= 2500) {
      first = false;
      checking.delete(entry.at);
      paint();
      if (lastSent.t === entry.at) setStatus('Sent, but it hasn’t shown up yet. It usually appears within a minute.', 'err');
    }
  }
  checking.delete(entry.at);
  paint();
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (posting) return;
  const body = (text.value || '').trim().slice(0, MAX);
  if (!visible(body)) {
    // a second Cmd+Enter right after a send lands on an empty box: ignore it
    if (Date.now() - lastSent.t < 2000) return;
    setStatus('Say something first.', 'err'); text.focus(); return;
  }
  if (document.getElementById('hp').value) return;
  if (!CONFIG.SHEET_URL) { setStatus('Answers aren’t open yet.', 'err'); return; }

  posting = true;
  btn.disabled = true;
  const before = copies(body);
  setStatus('Sending…');
  try {
    await post(body);
  } catch {
    // nothing left the browser: keep the words where they are
    setStatus('That didn’t send — check your connection and press Send again.', 'err');
    text.focus();
    return;
  } finally {
    posting = false;
    btn.disabled = false;
  }
  const entry = remember({ kind: 'text', text: body, base: before });
  lastSent = { text: body, t: entry.at };
  text.value = '';
  counter.textContent = '';
  text.focus();
  setStatus('Sent — checking it arrived…');
  confirm(entry);
});

// "Send again" on an answer that never showed up
list.addEventListener('click', async e => {
  const b = e.target.closest('.resend'); if (!b || posting) return;
  const at = +b.dataset.at;
  const entry = mine().find(m => m.at === at); if (!entry) return;
  let base = entry.base || 0;
  posting = true;
  b.disabled = true;
  try {
    await readFeed();                        // it may have landed in the meantime
    if (inFeed(entry)) { setStatus('It’s there now. Live for everyone.', 'ok'); return; }
    base = copies(entry.text);
    await post(entry.text);
  } catch {
    setStatus('That didn’t send — check your connection and try again.', 'err');
    b.disabled = false;
    return;
  } finally { posting = false; }
  // restart the clock on it so it stays visible while we check again
  const fresh = { ...entry, at: Date.now(), base };
  saveMine(mine().map(m => m.at === at ? fresh : m));
  lastSent = { text: entry.text, t: fresh.at };
  setStatus('Sent again — checking it arrived…');
  confirm(fresh);
});

/* ---------- film yourself ------------------------------------------------ */
(function film() {
  const LIMIT = 20 * 1000 * 1000;         // decimal MB, the unit people read
  const VIDEO_EXT = /\.(mp4|mov|m4v|webm|3gp|avi|mkv)$/i;
  const input = document.getElementById('afile');
  const pick = document.getElementById('filmpick');
  const nameEl = document.getElementById('filmname');
  const send = document.getElementById('vsend');
  const filmBtn = document.getElementById('filmbtn');
  const size = b => b < 1e6 ? `${Math.max(1, Math.round(b / 1000))} KB` : `${(b / 1e6).toFixed(1)} MB`;
  const reset = () => { input.value = ''; pick.hidden = true; };

  filmBtn.onclick = () => input.click();     // phones open the front camera
  document.getElementById('vcancel').onclick = () => { reset(); setStatus(''); filmBtn.focus(); };

  // what the first bytes of a real clip look like: MP4/MOV/3GP boxes, WebM/MKV, AVI
  async function looksLikeVideo(f) {
    try {
      const b = new Uint8Array(await f.slice(0, 12).arrayBuffer());
      const at = (i, str) => [...str].every((c, k) => b[i + k] === c.charCodeAt(0));
      return ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip', 'pnot'].some(t => at(4, t))
        || (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)
        || (at(0, 'RIFF') && at(8, 'AVI '));
    } catch { return true; }             // can't read it here: let the server decide
  }

  input.addEventListener('change', async () => {
    const f = input.files && input.files[0];
    if (!f) { pick.hidden = true; return; }
    const isVideo = (f.type || '').startsWith('video/') || (!f.type && VIDEO_EXT.test(f.name));
    if (!isVideo || !f.size || !(await looksLikeVideo(f))) {
      setStatus(f.size ? 'That isn’t a video file.' : 'That file is empty.', 'err'); reset(); return;
    }
    if (f.size > LIMIT) {
      const shownSize = f.size < LIMIT * 1.005 ? 'just over 20 MB' : size(f.size);
      setStatus(`That clip is ${shownSize}. The limit is 20 MB — a shorter take usually fits.`, 'err');
      reset(); return;
    }
    nameEl.textContent = `${f.name} · ${size(f.size)}`;
    nameEl.title = f.name;
    pick.hidden = false;
    setStatus('');
    send.focus();
  });

  send.onclick = async () => {
    const f = input.files && input.files[0];
    if (!f) return;
    if (!CONFIG.SHEET_URL) { setStatus('Filmed answers aren’t open yet.', 'err'); return; }
    send.disabled = filmBtn.disabled = true;
    setStatus('Uploading… keep this tab open.');
    try {
      const b64 = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result).split(',')[1]);
        fr.onerror = rej;
        fr.readAsDataURL(f);
      });
      await fetch(CONFIG.SHEET_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ kind: 'video', episode: EP, videoId: VIDEO, question: QUESTION,
                               name: '', filename: f.name, mime: f.type || 'video/mp4',
                               data: b64, at: new Date().toISOString() }),
      });
      remember({ kind: 'video', text: f.name });
      paint();
      setStatus('Sent. It shows up here once it’s been watched.', 'ok');
      reset();
    } catch {
      setStatus('The upload didn’t go through — try again, or a shorter clip.', 'err');
    } finally { send.disabled = filmBtn.disabled = false; }
  };
})();

/* ---------- ask the next question ---------------------------------------- */
(function freshDoors() {
  let seen = new Set();
  try { seen = new Set(JSON.parse(localStorage.getItem('qtd.opened.v1') || '[]')); } catch {}
  document.querySelectorAll('.door[data-pool]').forEach(door => {
    let pool;
    try { pool = JSON.parse(door.dataset.pool); } catch { return; }
    const next = pool.find(([n]) => !seen.has(n) && n !== EP);
    if (!next) return;
    const [n, question, tags, tclass] = next;
    door.href = `../${n}/`;
    door.classList.remove('t-big', 't-hot', 't-you');
    if (tclass) door.classList.add(tclass);
    door.querySelector('.door-q').textContent = question;
    door.querySelector('.door-note').textContent = tags;
  });
})();

document.getElementById('anydoor').addEventListener('click', async function () {
  this.disabled = true;
  try {
    const d = await fetchJSON(`${BASE}data/episodes.json`);
    let seen = new Set();
    try { seen = new Set(JSON.parse(localStorage.getItem('qtd.opened.v1') || '[]')); } catch {}
    const pool = d.episodes.filter(e => e.n !== EP);
    const fresh = pool.filter(e => !seen.has(e.n));
    const from = fresh.length ? fresh : pool;
    const pick = from[(Math.random() * from.length) | 0];
    if (pick) location.href = `${BASE}e/${pick.n}/`;
  } catch { location.href = BASE; }
  finally { this.disabled = false; }
});
