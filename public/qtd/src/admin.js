/* Admin: sign in against the sheet's script (the password is checked there,
   never in this page), then review filmed answers, suggestions, written
   answers and visits. Every change is one row in the sheet; nothing is
   deleted except a rejected clip's file, and Drive keeps that 30 days. */
import { BASE, esc, fetchJSON } from './util.js';
import { CONFIG } from '../config.js';

const $ = id => document.getElementById(id);
const TOKEN = 'qtd.admin.v1';
let token = null, data = null, questions = null;
try { token = sessionStorage.getItem(TOKEN); } catch {}

async function call(body) {
  const r = await fetch(CONFIG.SHEET_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ kind: 'admin', token, ...body }),
  });
  const d = await r.json();
  if (d && d.error === 'signed out') { signOut('Signed out. Sign in again.'); throw new Error('signed out'); }
  return d;
}
function setStatus(el, msg, kind) { el.className = 'astat' + (kind ? ` ${kind}` : ''); el.textContent = msg || ''; }
const when = s => { const d = new Date(s); return isNaN(d) ? s : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); };
const driveId = u => (String(u || '').match(/\/d\/([A-Za-z0-9_-]{10,})|[?&]id=([A-Za-z0-9_-]{10,})/) || []).slice(1).find(Boolean);
const shown = q => String(q || '').replace(/^'(?=[=+\-@])/, '');

/* ---------- signing in ------------------------------------------------------ */
$('login').addEventListener('submit', async e => {
  e.preventDefault();
  const st = $('lstatus');
  if (!CONFIG.SHEET_URL) { setStatus(st, 'No sheet script is set in config.js.', 'err'); return; }
  $('go').disabled = true; setStatus(st, 'Checking…');
  try {
    const d = await call({ action: 'login', user: $('user').value.trim(), pass: $('pass').value });
    if (!d.ok) {
      setStatus(st, d.error === 'locked' ? 'Too many wrong tries. Wait 15 minutes.'
        : d.error === 'wrong' ? 'That username and password don’t match.'
        : d.error === 'empty' ? 'The sheet script is an older version without admin. Deploy the new Code.gs.'
        : `Couldn’t sign in: ${d.error || 'unknown'}`, 'err');
      return;
    }
    token = d.token;
    try { sessionStorage.setItem(TOKEN, token); } catch {}
    $('pass').value = '';
    setStatus(st, '');
    showPanel();
  } catch (err) {
    setStatus(st, 'Couldn’t reach the sheet script. Check your connection.', 'err');
  } finally { $('go').disabled = false; }
});

function signOut(msg) {
  token = null; data = null;
  try { sessionStorage.removeItem(TOKEN); } catch {}
  $('panel').hidden = true; $('logout').hidden = true; $('login').hidden = false;
  setStatus($('lstatus'), msg || '');
}
$('logout').addEventListener('click', async () => {
  try { await call({ action: 'logout' }); } catch {}
  signOut('Signed out.');
});

async function showPanel() {
  $('login').hidden = true; $('panel').hidden = false; $('logout').hidden = false;
  await load();
}

/* ---------- the lists ------------------------------------------------------ */
async function load() {
  setStatus($('status'), 'Loading…');
  try {
    const d = await call({ action: 'list' });
    if (!d.ok) { setStatus($('status'), `Couldn’t load: ${d.error}`, 'err'); return; }
    data = d;
    // the sheet keeps each answer's question; fill it in where it didn't
    if (!questions) questions = await fetchJSON(`${BASE}data/episodes.json`)
      .then(x => new Map(x.episodes.map(e => [e.n, e.question]))).catch(() => new Map());
    for (const v of data.videos) if (!v.question) v.question = questions.get(v.episode) || '';
    render();
    setStatus($('status'), '');
  } catch (err) {
    if (String(err.message) !== 'signed out') setStatus($('status'), 'Couldn’t reach the sheet script.', 'err');
  }
}
$('reload').addEventListener('click', load);

function render() {
  const pending = data.videos.filter(v => v.hidden && !/reject/i.test(v.status));
  $('nvid').textContent = pending.length ? `${pending.length} to watch` : '';
  $('nsug').textContent = data.suggestions.length || '';
  $('ntxt').textContent = data.texts.length || '';
  $('nviews').textContent = data.views.total ? data.views.total.toLocaleString() : '';

  // filmed answers: waiting first, then live, then rejected
  const order = v => (v.hidden && !/reject/i.test(v.status)) ? 0 : !v.hidden ? 1 : 2;
  const vids = [...data.videos].sort((a, b) => order(a) - order(b) || String(b.at).localeCompare(String(a.at)));
  $('t-videos').innerHTML = vids.length ? `<div class="vgrid">${vids.map(v => {
    const state = order(v) === 0 ? 'waiting' : order(v) === 1 ? 'live' : 'rejected';
    const id = driveId(v.file);
    return `<article class="vcard ${state}" data-row="${v.row}" data-key="${esc(v.key)}">
      <div class="vbox">${id ? `<button class="vload" data-id="${esc(id)}">▶ Watch</button>` : '<span class="label">no file</span>'}</div>
      <div class="vmeta">
        <span class="label">${state === 'waiting' ? '<b class="y">Waiting</b>' : state === 'live' ? '<b class="g">Live</b>' : '<b class="r">Rejected</b>'} · EP ${v.episode || '?'} · ${esc(when(v.at))}</span>
        <p>${esc(v.question)}</p>
        <div class="vbtns">
          ${state !== 'live' ? `<button class="btn btn-solid" data-act="approve">Approve</button>` : `<button class="btn" data-act="unpublish">Take down</button>`}
          ${state === 'waiting' ? `<button class="btn" data-act="reject">Reject</button>` : ''}
          ${state === 'rejected' && id ? `<button class="btn btn-r" data-act="trash">Delete file</button>` : ''}
          ${v.episode ? `<a class="btn" href="${BASE}e/${v.episode}/" target="_blank" rel="noopener">Episode ↗</a>` : ''}
        </div>
      </div>
    </article>`;
  }).join('')}</div>` : '<p class="none">No filmed answers yet.</p>';

  // suggestions, most votes first
  $('t-sugg').innerHTML = data.suggestions.length ? `<ol class="alist2">${data.suggestions.map(s => `
    <li class="${s.hidden ? 'off' : ''}" data-row="${s.row}" data-key="${esc(s.key)}" data-sheet="suggestions">
      <span class="num votes">${s.votes}</span>
      <span class="txt">${esc(shown(s.question))}<span class="label">${esc(when(s.at))}${s.status ? ' · ' + esc(s.status) : ''}${s.hidden ? ' · hidden' : ''}</span></span>
      <span class="acts">
        <button class="btn mini" data-act="asked">${/asked/.test(s.status) ? 'Not asked' : 'Mark asked'}</button>
        <button class="btn mini" data-act="${s.hidden ? 'show' : 'hide'}">${s.hidden ? 'Show' : 'Hide'}</button>
      </span>
    </li>`).join('')}</ol>` : '<p class="none">No suggestions yet.</p>';

  // written answers, newest first
  $('t-texts').innerHTML = data.texts.length ? `<ol class="alist2">${data.texts.map(t => `
    <li class="${t.hidden ? 'off' : ''}" data-row="${t.row}" data-key="${esc(t.key)}" data-sheet="answers">
      <span class="num votes">${t.episode || '?'}</span>
      <span class="txt">${esc(shown(t.answer))}<span class="label">EP ${t.episode || '?'} · ${esc(when(t.at))}${t.hidden ? ' · hidden' : ''}</span></span>
      <span class="acts"><button class="btn mini" data-act="${t.hidden ? 'show' : 'hide'}">${t.hidden ? 'Show' : 'Hide'}</button></span>
    </li>`).join('')}</ol>` : '<p class="none">No written answers yet.</p>';

  // visits
  const pages = data.views.pages || [];
  $('t-views').innerHTML = `<p class="bigsum"><b class="num">${data.views.total.toLocaleString()}</b> visits in all</p>` +
    (pages.length ? `<ol class="alist2">${pages.map(([path, n]) => `
      <li><span class="num votes">${n.toLocaleString()}</span><span class="txt"><a href="${esc(path)}" target="_blank" rel="noopener">${esc(path)}</a></span></li>`).join('')}</ol>`
      : '<p class="none">No visits counted yet.</p>');
}

/* ---------- actions -------------------------------------------------------- */
async function act(el, change, doneMsg) {
  const holder = el.closest('[data-row]');
  const sheet = holder.dataset.sheet || 'answers';
  el.disabled = true;
  try {
    const d = await call({ action: change.trash ? 'trash' : 'set', sheet, row: +holder.dataset.row, key: holder.dataset.key, ...change });
    if (!d.ok) { setStatus($('status'), d.error || 'That didn’t work.', 'err'); el.disabled = false; return; }
    setStatus($('status'), doneMsg, 'ok');
    await load();
  } catch { el.disabled = false; }
}

document.querySelector('.admin').addEventListener('click', e => {
  const tab = e.target.closest('[role=tab]');
  if (tab) {
    document.querySelectorAll('[role=tab]').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    document.querySelectorAll('.tabpane').forEach(p => { p.hidden = p.id !== `t-${tab.dataset.tab}`; });
    return;
  }
  const load1 = e.target.closest('.vload');
  if (load1) {
    load1.parentElement.innerHTML = `<iframe src="https://drive.google.com/file/d/${encodeURIComponent(load1.dataset.id)}/preview"
      allow="autoplay" title="Filmed answer"></iframe>`;
    return;
  }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act;
  const s = (b.closest('[data-row]') || {}).dataset || {};
  const item = s.sheet === 'suggestions' ? data.suggestions.find(x => x.row === +s.row) : null;
  if (a === 'approve') act(b, { hidden: false, status: 'approved' }, 'Approved. It’s on the episode page now.');
  else if (a === 'unpublish') act(b, { hidden: true, status: 'taken down' }, 'Taken down.');
  else if (a === 'reject') act(b, { hidden: true, status: 'rejected' }, 'Rejected. It stays hidden.');
  else if (a === 'trash') { if (confirm('Delete this clip from Drive? It stays in the Drive bin for 30 days.')) act(b, { trash: true }, 'File deleted.'); }
  else if (a === 'hide') act(b, { hidden: true }, 'Hidden from the site.');
  else if (a === 'show') act(b, { hidden: false }, 'Showing on the site again.');
  else if (a === 'asked') act(b, { status: item && /asked/.test(item.status) ? '' : 'asked' }, 'Saved.');
});

if (token) showPanel();
