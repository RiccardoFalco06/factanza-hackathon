// Demo Factanza: app da telefono con hash router. Gli eventi live, gli aggiornamenti e i commenti arrivano dal server
// (server/index.mjs) e sono gli stessi per tutti quelli che aprono la demo nello stesso momento.
// Nel browser restano solo le cose personali: eventi seguiti, quiz, minuti, nome per i commenti.
// ?reset=1 (o "Start the demo over" in You) rimette a zero le cose personali, per rifare le registrazioni.

const KEY = 'fz-demo-v2';
const fresh = () => ({ seen: [], minutes: 0, streak: 3, quiz: null, follows: [], signed: false, askedSave: false, fromIg: true,
  lesson: false, name: '', news: { pills: true, feed: false }, notify: { events: true, streak: true }, reminders: [], reacted: [] });
let S;
function sane(x) { // lo stato salvato può essere vecchio o rovinato: si tiene solo quello che ha la forma giusta
  const f = fresh(), s = { ...f }, own = (o, id) => typeof id === 'string' && Object.hasOwn(o, id);
  for (const k in f) if (k !== 'quiz' && x && x[k] != null && typeof x[k] === typeof f[k] && Array.isArray(x[k]) === Array.isArray(f[k])) s[k] = x[k];
  const q = x?.quiz;
  s.quiz = q && typeof q === 'object' && Number.isInteger(q.i) && q.i >= 0 && q.i < QUIZ.questions.length && Array.isArray(q.answers) ? q : null;
  s.news = { ...f.news, ...s.news }; s.notify = { ...f.notify, ...s.notify };
  s.seen = s.seen.filter(id => own(PIECES, id)); s.follows = s.follows.filter(id => typeof id === 'string');
  if (!Number.isFinite(s.minutes)) s.minutes = 0; if (!Number.isFinite(s.streak)) s.streak = 3;
  return s;
}
try { S = sane(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = fresh(); }
if (new URLSearchParams(location.search).has('reset')) { S = fresh(); history.replaceState(null, '', location.pathname + location.hash); } // una volta sola, non a ogni ricarica
addEventListener('storage', e => { if (e.key !== KEY || !e.newValue) return; try { S = sane(JSON.parse(e.newValue)); render(false); } catch {} });
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* navigazione privata: lo stato vive finché la pagina è aperta */ } };
save();

const $ = s => document.querySelector(s);
const view = $('#view');
const ic = (name, fill) => `<i class="ph-${fill ? 'fill' : 'duotone'} ph-${name}" aria-hidden="true"></i>`; // due toni: contorno blu notte, riempimento giallo come l'evidenziatore
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = n => n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? 'now' : m < 60 ? `${m}m` : `${Math.round(m / 60)}h`; };
const marked = (title, word) => word ? esc(title).replace(esc(word), `<mark>${esc(word)}</mark>`) : esc(title);
const KIND = { carousel: ['cards', 'Carousel'], article: ['article', 'Deep dive'], podcast: ['headphones', 'Podcast'], video: ['play', 'Video'] };
const HREF = { carousel: 'c', article: 'a', podcast: 'p', video: 'v' };
const href = id => `#/${HREF[PIECES[id].kind]}/${id}`;
let timers = [];
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
let here = ['home'];

// ---------- server: stato iniziale + diretta ----------
let EV = {}; // eventi come li manda il server
let online = false;
let REC = null; // copia registrata della diretta (recorded.json): la demo resta piena anche a server spento
const unread = {}; // evento → aggiornamenti arrivati mentre non lo guardavi
const lit = new Set(); // righe del tabellone accese finché non le apri
async function load() {
  try {
    const r = await fetch('/api/state', { cache: 'no-store' });
    const d = await r.json(); if (!r.ok || !d || typeof d.events !== 'object') throw new Error('no state');
    EV = d.events; seq = d.seq; online = true;
  } catch {
    online = false; REC ??= await fetch('recorded.json').then(r => r.json()).catch(() => null);
    EV = REC ? structuredClone(REC.events) : {};
  }
}
const post = (path, body) => fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  .then(async r => ({ ok: r.ok, data: await r.json().catch(() => ({})) })).catch(() => ({ ok: false, data: { error: "You're offline: the comment was not sent." } }));

// novità dal server: prima il flusso continuo (Server-Sent Events); se entro 5 s non arriva niente
// (alcuni tunnel lo trattengono) si chiede al server ogni 2 secondi cosa è cambiato
const ON = {
  update({ event: id, idx, update }) {
    const ev = EV[id]; if (!ev || ev.updates[idx]) return;
    ev.updates[idx] = { ...update, comments: 0, last: null, reacts: 40 + idx * 57 };
    const cl = view.querySelector(`[data-cover-last="${id}"]`); if (cl) { cl.innerHTML = `<b>${esc(update.time)}</b> ${esc(update.text)}`; pop(cl); }
    if (here[0] === 'e' && here[1] === id) return addUpdate(id, idx);
    unread[id] = (unread[id] || 0) + 1;
    if (S.follows.includes(id)) {
      lit.add(id);
      if (S.notify.events) notify('broadcast', ev.short, update.text, `#/e/${id}`);
      if (here[0] === 'home') rerank(id);
    }
  },
  comment({ event: id, upd, comment, count }) {
    const u = EV[id]?.updates[upd]; if (!u) return;
    u.comments = count; u.last = comment;
    const n = view.querySelector(`[data-count="${id}:${upd}"]`); if (n) n.textContent = count;
    const p = view.querySelector(`[data-preview="${id}:${upd}"]`);
    if (p) { p.innerHTML = preview(comment); p.hidden = false; pop(p); }
    if (thread && thread[0] === id && thread[1] === upd && !$('#sheet [data-cid="' + comment.id + '"]')) appendComment(comment);
  },
  watching(w) { for (const id in w) { if (EV[id]) EV[id].watching = w[id]; view.querySelectorAll(`[data-watch="${id}"]`).forEach(el => { el.textContent = fmt(w[id]); }); } },
  react({ event: id, upd, n }) { if (EV[id]?.updates[upd]) EV[id].updates[upd].reacts = n; const b = view.querySelector(`[data-react="${id}:${upd}"] span`); if (b) b.textContent = n; },
  follow({ event: id, n }) { if (EV[id]) EV[id].followers = n; },
  async reset() { await load(); if ((location.hash.split('/')[1] || 'home') !== here[0]) route(); else render(false); }, // server tornato o ripartito: un link a un evento si apre ora
};
let seq = 0;
const me = Math.random().toString(36).slice(2, 12);
function listen() {
  let heard = false;
  const es = window.EventSource && new EventSource('/api/stream');
  if (es) {
    for (const type of Object.keys(ON)) es.addEventListener(type, e => { heard = true; ON[type](JSON.parse(e.data)); });
    es.addEventListener('hello', () => { heard = true; if (!online) ON.reset(); });
  }
  setTimeout(() => { if (heard) return; es?.close(); poll(); }, 5000);
}
async function poll() {
  try {
    const r = await fetch(`/api/poll?since=${seq}&c=${me}`, { cache: 'no-store' }).then(x => x.json());
    if (!online || r.seq < seq) { await ON.reset(); r.events = []; } // il server è tornato o è ripartito
    for (const e of r.events) { seq = e.seq; ON[e.type]?.(e.data); }
    seq = Math.max(seq, r.seq);
  } catch { /* rete assente: si riprova */ }
  setTimeout(poll, document.hidden ? 15000 : 2000); // scheda nascosta: poche richieste
}
const pop = el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };

// ---------- notifiche ----------
const NOTES = [];
function notify(icon, title, body, to) {
  const i = NOTES.findIndex(n => n.title === title && n.body === body); if (i >= 0) NOTES.splice(i, 1); // niente doppioni (promemoria acceso, spento, riacceso)
  NOTES.unshift({ icon, title, body, to, read: false });
  bell();
  if (location.hash !== to) push(title, body, to);
}
const bell = () => document.querySelectorAll('[data-bell] .badge').forEach(b => { const n = NOTES.filter(x => !x.read).length; b.textContent = n; b.hidden = !n; });
setTimeout(() => { // promemoria della serie del quiz: una volta per visita, se il quiz non è fatto
  if (S.notify.streak && !(S.quiz && S.quiz.done)) notify('fire', `Your ${S.streak}-week streak is on the line`, `${QUIZ.week} quiz closes on Sunday: 5 questions, 2 minutes.`, '#/quiz');
}, 45000);

// ---------- lettore podcast sempre acceso sopra le schede ----------
const P = { key: null, title: '', sub: '', color: 't8', t: 0, total: 1, on: false };
function playEp(key, title, sub, color, min) {
  if (P.key !== key) Object.assign(P, { key, title, sub, color, t: 0, total: min * 60 });
  P.on = true; mini(); syncPlayer();
}
function mini() {
  const m = $('#mini');
  m.hidden = !P.key;
  if (!P.key) return;
  m.innerHTML = `<span class="fz-tessera" style="background: var(--${P.color})">${ic('headphones')}</span>
    <span class="mini-txt"><b>${esc(P.title)}</b><small>${esc(P.sub)}</small></span>
    <button class="mini-btn" data-toggle-play aria-label="${P.on ? 'Pause' : 'Play'}">${ic(P.on ? 'pause' : 'play', true)}</button>
    <span class="mini-bar" style="width: ${P.t / P.total * 100}%"></span>`;
}
const ft = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function syncPlayer() { // la pagina dell'episodio, se aperta, mostra lo stesso lettore
  const btn = view.querySelector('[data-play]'); if (!btn) return;
  const mine = P.key === btn.dataset.play, t = mine ? P.t : 0, total = mine ? P.total : +btn.dataset.min * 60;
  btn.innerHTML = ic(mine && P.on ? 'pause' : 'play', true);
  view.querySelector('[data-progress]').style.width = (t / total * 100) + '%';
  view.querySelector('[data-time]').textContent = `${ft(t)} / ${ft(total)}`;
}
function togglePlayer() { if (!P.on && P.t >= P.total) P.t = 0; P.on = !P.on; mini(); syncPlayer(); } // finito → riparte da capo
setInterval(() => { if (P.on) { P.t = Math.min(P.total, P.t + 6); if (P.t >= P.total) P.on = false; mini(); syncPlayer(); } }, 1000); // shortcut: niente audio vero, 6 s di episodio al secondo

// ---------- pezzi riusati ----------
const av = (name, c) => `<span class="av" style="background: var(--${/^t([1-9]|10)$/.test(c) ? c : 't8'})">${esc([...(name || '?')][0])}</span>`;
const preview = c => `${av(c.name, c.color)}<span><b>${esc(c.name)}</b> ${esc(c.text)}</span>`;
const commentLi = c => `<li class="cm${c.mine ? ' mine' : ''}" data-cid="${c.id}">${av(c.name, c.color)}<div><b>${esc(c.name)}</b> <small>${ago(c.ts)}</small><p>${esc(c.text)}</p></div></li>`;
function pieceCard(id, i = 0) {
  const p = PIECES[id], [icon, label] = KIND[p.kind];
  return `<a class="card fz-entra" style="--i:${i}" href="${href(id)}">
    <span class="fz-tessera" style="background: var(--${p.color})">${ic(icon)}</span>
    <span class="card-txt"><b>${p.title}</b><small>${label} · ${p.minutes} min${S.seen.includes(id) ? ' · seen' : ''}</small></span>${ic('caret-right')}</a>`;
}
function followBtn(id) {
  const ev = EV[id]; if (!ev) return '';
  const on = S.follows.includes(id), soon = ev.upcoming;
  const label = soon ? (on ? 'Reminder on' : 'Remind me') : on ? 'Pinned' : 'Follow';
  return `<button class="follow${on ? ' on' : ''}" data-follow="${id}" aria-pressed="${on}">${ic(soon ? 'bell' : 'push-pin', on)} ${label}</button>`;
}
function status(ev) {
  if (ev.live) return '<span class="live-tag"><span class="dot"></span>Live</span>';
  if (ev.upcoming) return `<span class="soon-tag">${ic('clock')} ${ev.upcoming}</span>`;
  return `<span class="soon-tag">${ic('path')} Story</span>`;
}
const faces = (n = 3) => `<span class="faces">${['Giulia', 'Marco', 'Sofia', 'Davide'].slice(0, n).map((x, i) => av(x, ['t1', 't3', 't6', 't9'][i])).join('')}</span>`;
function serviceCard(id, reason) {
  const s = SERVICES[id];
  return `<div class="service fz-entra">${reason ? `<span class="service-why">${reason}</span>` : ''}
    <div class="service-row"><span class="fz-tessera" style="background: var(--fz-viola); color: #fff">${ic(s.icon)}</span><div><b>${s.title}</b><p>${s.text}</p></div></div>
    ${s.href ? `<a class="fz-btn fz-btn--primario" href="${s.href}">${s.cta}</a>` : `<button class="fz-btn fz-btn--primario" data-service="${id}">${s.cta}</button>`}</div>`;
}
const keepGoing = id => `<section class="block"><h2 class="sec">Keep going</h2><div class="list">${PIECES[id].next.map(pieceCard).join('')}</div></section>`;
const bellBtn = () => `<button class="icon-btn" data-bell aria-label="Notifications">${ic('bell')}<span class="badge" hidden></span></button>`;
const topBar = title => `<header class="bar home"><img src="../assets/factanza-f.png" alt=""><b>${title}</b><a class="streak" href="#/play" title="Weeks of quiz in a row">${ic('fire', true)} ${S.streak}</a>${bellBtn()}</header>`;
const back = (to = '#/', right = '') => `<header class="bar"><a class="icon-btn" href="${to}" aria-label="Back">${ic('arrow-left')}</a><img src="../assets/factanza-f.png" alt="Factanza">${right || `<span class="streak">${ic('fire', true)} ${S.streak}</span>`}</header>`;
const storyTag = st => EV[st] ? `<a class="story-tag" href="#/e/${st}">${status(EV[st])}<b>${EV[st].title}</b>${ic('caret-right')}</a>` : '';
const offline = () => online ? '' : `<p class="offline">${ic('wifi-slash')} ${REC ? 'Live server is off: you are watching a recording of the live.' : 'The live is taking a break: it comes back by itself in a moment.'}</p>`;

// ---------- tempo passato e richiesta di salvare i progressi ----------
function markSeen(id) {
  if (S.seen.includes(id)) return;
  S.seen.push(id); S.minutes += PIECES[id].minutes; save();
  if (S.seen.length >= 3 && !S.signed && !S.askedSave) later(() => { S.askedSave = true; save(); saveSheet(); }, 1400);
}
function saveSheet() {
  openSheet(`<h2>Save your progress?</h2>
    <p>You've seen ${S.seen.length} pieces, you follow ${S.follows.length} live events and have a ${S.streak}-week quiz streak. Keep them on every device. No password.</p>
    <div class="stack">
      <button class="fz-btn fz-btn--scuro" data-sign>${ic('apple-logo')} Continue with Apple</button>
      <button class="fz-btn" data-sign>${ic('google-logo')} Continue with Google</button>
      <button class="link-btn" data-close>Not now</button>
    </div>`);
}

// ---------- schermate ----------
const V = {};

// --- Home: la copertina del giorno, con sopra la fila dei live fissati e della serie del quiz ---
function pinTile(id) {
  const ev = EV[id], last = ev.updates.at(-1), n = unread[id] || 0;
  return `<a class="pin${lit.has(id) ? ' lit' : ''}" href="#/e/${id}" data-row="${id}" style="--c: var(--${ev.color})">
    <span class="pin-top">${status(ev)}${n ? `<span class="pin-new">${n} new</span>` : ''}</span>
    <b>${esc(ev.short)}</b><span class="pin-last">${esc(last.text)}</span>
    <small>${ev.live ? `<span data-watch="${id}">${fmt(ev.watching)}</span> watching` : esc(last.time)}</small></a>`;
}
function streakTile() {
  const q = S.quiz, done = q && q.done;
  return `<a class="pin streak-pin${done ? ' done' : ''}" href="${done ? '#/play' : '#/quiz'}">
    <span class="pin-top"><span class="fire">${ic('fire', true)} ${S.streak}</span><span class="chip">${QUIZ.week}</span></span>
    <b>${done ? `${q.score}/5 this week` : 'Weekly quiz'}</b><span class="pin-last">${done ? 'Streak saved. Next one on Monday.' : `Keep your ${S.streak}-week streak: closes Sunday`}</span>
    <small>${done ? `You beat ${beat(q.score)}%` : '<span class="play-chip">Play · 2 min</span>'}</small></a>`;
}
function quizRow() { return `<div class="pins pins-solo">${streakTile()}</div>`; }
function rerank(id) { // il live con la novità passa in testa alla fila e resta acceso finché non lo apri (FLIP: gli altri scivolano al loro posto)
  const box = view.querySelector('[data-board]'), old = box && box.querySelector(`[data-row="${id}"]`);
  if (!old) return refreshBoard();
  const first = new Map([...box.children].map(r => [r, r.getBoundingClientRect()]));
  const was = first.get(old);
  old.outerHTML = pinTile(id);
  const row = box.querySelector(`[data-row="${id}"]`);
  box.prepend(row); first.set(row, was);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const r of box.children) {
    const a = first.get(r), b = r.getBoundingClientRect(); if (!a) continue;
    const dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) r.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.65,0,.35,1)' });
  }
}
function dayCover(id) { // la copertina del giorno: il live più caldo, come una copertina dei caroselli Factanza
  const ev = EV[id], last = ev.updates.at(-1);
  return `<article class="day-cover fz-entra" style="--c: var(--${ev.color})">
    <a class="day-photo" href="#/e/${id}"><img src="${ev.image}" alt=""><span class="day-top">${status(ev)}<span class="chip">${ev.kind}</span></span>
      <h1>${marked(ev.title, ev.mark)}</h1><img class="f" src="../assets/factanza-f.png" alt=""></a>
    <div class="day-foot"><p data-cover-last="${id}"><b>${esc(last.time)}</b> ${esc(last.text)}</p>
      <span class="day-actions">${faces()}<small>${ev.live ? `<b data-watch="${id}">${fmt(ev.watching)}</b> watching` : `${fmt(ev.followers)} following`}</small>${followBtn(id)}</span></div></article>`;
}
const pinnedIds = () => S.follows.filter(id => EV[id]).sort((a, b) => lit.has(b) - lit.has(a));
const board = pinned => `${pinned.map(pinTile).join('')}${streakTile()}
    ${pinned.length ? '' : `<p class="pins-hint">${ic('push-pin', true)} Follow a live and it stays here, next to your quiz.</p>`}`;
const refreshBoard = () => { const b = view.querySelector('[data-board]'); if (b) b.innerHTML = board(pinnedIds()); };
V.home = () => {
  const pinned = pinnedIds();
  const lives = Object.keys(EV).filter(id => EV[id].live || EV[id].upcoming);
  const hero = lives.find(id => !pinned.includes(id) && EV[id].live) || lives.find(id => EV[id].live) || lives[0];
  const more = lives.filter(id => id !== hero && !pinned.includes(id));
  const last = S.seen.at(-1), nextUp = last && PIECES[last].next.find(n => !S.seen.includes(n));
  return `${topBar('Factanza')}${offline()}
  <section class="pins-block" aria-label="Pinned"><div class="pins" data-board>${board(pinned)}</div></section>
  ${hero ? `<section class="block">${dayCover(hero)}</section>` : ''}
  ${more.length ? `<section class="block"><h2 class="sec">More lives</h2><div class="rail">${more.map(liveCard).join('')}</div></section>` : ''}
  <section class="block"><h2 class="sec">Today in a minute</h2><div class="covers">${['c1', 'c2', 'c3'].map(cover).join('')}</div></section>
  ${nextUp ? `<section class="block"><h2 class="sec">Pick up where you left off</h2><div class="list">${pieceCard(nextUp)}</div></section>` : ''}
  <section class="block"><div class="head-row"><h2 class="sec">Listen</h2><a href="#/listen">All podcasts ${ic('caret-right')}</a></div><div class="rail">${['squattrinati', 'show', 'rewind', 'fatti'].map(showTile).join('')}</div></section>
  <section class="block"><div class="head-row"><h2 class="sec">Learn</h2><a href="#/learn">Academy ${ic('caret-right')}</a></div>${lessonCard()}</section>
  <section class="block"><div class="head-row"><h2 class="sec">Play</h2><a href="#/play">All games ${ic('caret-right')}</a></div>${gameCard()}</section>
  <section class="block">${storyList()}</section>`;
};
const storyList = () => { const st = Object.keys(EV).filter(id => !EV[id].live && !EV[id].upcoming); return st.length ? `<h2 class="sec">Long stories to follow</h2><div class="list">${st.map(id => `<a class="card" href="#/e/${id}"><span class="fz-tessera photo-tile" style="--c: var(--${EV[id].color})"><img src="${EV[id].image}" alt=""></span><span class="card-txt"><b>${esc(EV[id].title)}</b><small>${EV[id].updates.length} updates · ${fmt(EV[id].followers)} following</small></span>${ic('caret-right')}</a>`).join('')}</div>` : ''; };
function liveCard(id, i = 0) { // evento da scoprire: foto in bianco e nero con il colore della sua tessera, come i collage di Factanza
  const ev = EV[id];
  return `<div class="live-card fz-entra" style="--i:${i}; --c: var(--${ev.color})"><a href="#/e/${id}" class="live-photo"><img src="${ev.image}" alt="">
      <span class="live-photo-top">${status(ev)}<span class="chip">${ev.kind}</span></span><img class="f" src="../assets/factanza-f.png" alt=""></a>
    <a href="#/e/${id}" class="live-title">${marked(ev.title, ev.mark)}</a>
    <span class="live-foot"><small>${ev.live ? `<b data-watch="${id}">${fmt(ev.watching)}</b> watching` : `${fmt(ev.followers)} following`}</small>${followBtn(id)}</span></div>`;
}
function cover(id, i) {
  const p = PIECES[id], s = p.slides[0];
  return `<a class="cover-mini fz-entra" style="--i:${i}; background: var(--${p.color})" href="${href(id)}"><b>${s.big} <mark>${s.mark}</mark> ${s.after}</b><img src="../assets/factanza-f.png" alt=""></a>`;
}
const showTile = (key, i = 0) => { const s = PODCASTS[key]; return `<a class="show-tile fz-entra" style="--i:${i}; --c: var(--${s.color})" href="#/show/${key}"><span class="show-art"><b>${s.name}</b><img src="../assets/factanza-f.png" alt=""></span><small>${s.live || `${s.eps.length} ${s.eps.length === 1 ? 'episode' : 'episodes'}`}</small></a>`; };
const lessonCard = () => { const c = COURSES.dcs; return `<a class="lesson-card fz-entra" href="#/lesson/dcs"><span class="lesson-play">${ic('play', true)}</span><span><small>${S.lesson ? 'Continue' : 'First lesson free'}</small><b>${c.lesson.title}</b><small>${c.title} · ${c.lesson.min} min</small></span></a>`; };
const gameCard = () => `<a class="game-card fz-entra" href="#/game"><span class="game-art">${['t1', 't4', 't8', 't6'].map(c => `<span style="background: var(--${c})"></span>`).join('')}</span><span><small>Our board game, now in the app</small><b>${GAME.title}</b><small>Up to 4 friends · 15 min</small></span></a>`;

// --- evento live ---
function updCard(id, i) {
  const u = EV[id].updates[i], on = S.reacted.includes(`${id}:${i}`);
  return `<li class="upd fz-entra${u.big ? ' big' : ''}${u.now ? ' now' : ''}" data-u="${i}">
    <span class="dot"></span><small class="upd-time">${esc(u.time)}${u.now ? ' · <em>New</em>' : ''}</small><p>${esc(u.text)}</p>
    ${u.piece ? `<div class="upd-piece">${pieceCard(u.piece)}</div>` : ''}
    <div class="upd-foot"><button class="react${on ? ' on' : ''}" data-react="${id}:${i}" aria-pressed="${on}" aria-label="React">${ic('fire', on)} <span>${u.reacts}</span></button>
      <button class="talk" data-thread="${id}:${i}">${ic('chat-circle')} <span data-count="${id}:${i}">${u.comments}</span> comments</button></div>
    <button class="preview" data-thread="${id}:${i}" data-preview="${id}:${i}"${u.last ? '' : ' hidden'}>${u.last ? preview(u.last) : ''}</button></li>`;
}
function addUpdate(id, i) {
  const list = view.querySelector('[data-updates]'); if (!list) return;
  list.querySelectorAll('.upd.now').forEach(el => el.classList.remove('now'));
  list.insertAdjacentHTML('afterbegin', updCard(id, i));
  view.querySelector('[data-composer]').dataset.thread = `${id}:${i}`;
  enter();
}
V.e = id => {
  const ev = EV[id];
  delete unread[id]; lit.delete(id);
  const host = ev.host ? `<figure class="host"><img src="${ev.host.image}" alt="Stefano De Martino"><figcaption>Host and artistic director<small>${esc(ev.host.credit)}</small></figcaption></figure>` : '';
  const pod = ev.kind === 'Gossip' && ev.upcoming && PODCASTS.sanremo;
  return `${back('#/', `<button class="icon-btn" data-share="${id}" aria-label="Share">${ic('share-network')}</button>`)}
  <section class="ev-head" style="--c: var(--${ev.color})">
    <div class="ev-photo"><img src="${ev.image}" alt=""><img class="f" src="../assets/factanza-f.png" alt=""><small class="credit">${esc(ev.credit)}</small></div>
    <div class="ev-body"><span class="row-top">${status(ev)}<span class="chip">${ev.kind}</span></span>
      <h1>${marked(ev.title, ev.mark)}</h1>
      <span class="ev-meta">${faces(4)}<span>${ev.live ? `<b data-watch="${id}">${fmt(ev.watching)}</b> watching with you` : `<b>${fmt(ev.followers)}</b> following`}</span></span>
      <span class="ev-actions">${followBtn(id)}<button class="follow ghost" data-share="${id}">${ic('share-network')} Share</button></span></div>
  </section>
  ${host ? `<section class="block">${host}</section>` : ''}
  ${pod ? `<section class="block"><button class="listen-live" data-ep="sanremo:0">${ic('headphones', true)}<span><b>${PODCASTS.sanremo.name}</b><small>${PODCASTS.sanremo.live} · our live show</small></span>${ic('play', true)}</button></section>` : ''}
  <section class="block"><h2 class="sec">${ev.live ? 'Live updates' : ev.upcoming ? 'Before it starts' : 'The story so far'}</h2>
    <ol class="updates" data-updates="${id}">${ev.updates.map((_, i) => i).reverse().map(i => updCard(id, i)).join('')}</ol></section>
  <button class="composer-btn" data-composer data-thread="${id}:${ev.updates.length - 1}">${av(S.name || 'You', 't8')}<span>Comment the latest update</span>${ic('paper-plane-right', true)}</button>`;
};

// --- Listen ---
V.listen = () => `${topBar('Listen')}
  <section class="block"><button class="briefing fz-entra" data-ep="briefing">${ic('waveform', true)}<span><small>Made for you · 8 min</small><b>Your briefing</b>
    <small>Real voices from our creators on the lives you follow${S.follows.length ? '' : '. Follow one to tune it'}</small></span>${ic('play', true)}</button></section>
  <section class="block"><h2 class="sec">Our podcasts</h2><div class="show-grid">${Object.keys(PODCASTS).map(showTile).join('')}</div></section>`;
V.show = key => {
  const s = PODCASTS[key];
  return `${back('#/listen')}<section class="block"><div class="pod" style="--c: var(--${s.color})"><small>Factanza podcast</small><b class="big">${s.name}</b><span>${s.about}</span><img class="f" src="../assets/factanza-f.png" alt=""></div>
    <h2 class="sec">Episodes</h2><div class="list">${s.eps.map((e, i) => e.piece
      ? `<a class="card" href="#/p/${e.piece}"><span class="fz-tessera" style="background: var(--${s.color})">${ic('headphones')}</span><span class="card-txt"><b>${e.title}</b><small>${e.min} min · chapters</small></span>${ic('caret-right')}</a>`
      : `<button class="card" data-ep="${key}:${i}"><span class="fz-tessera" style="background: var(--${s.color})">${ic('play', true)}</span><span class="card-txt"><b>${e.title}</b><small>${e.min} min</small></span></button>`).join('')}</div></section>`;
};
V.p = id => {
  const p = PIECES[id];
  markSeen(id);
  return `${back('#/show/squattrinati')}<section class="block"><div class="pod" style="--c: var(--${p.color})"><small>${p.episode}</small><b class="big">${p.show}</b><span>${p.title.split(' · ')[1]}</span><img class="f" src="../assets/factanza-f.png" alt=""></div>
    <div class="player"><button class="play-btn" data-play="${id}" data-min="${p.minutes}" aria-label="Play or pause">${ic('play', true)}</button>
      <div class="track"><span data-progress></span></div><small data-time></small></div>
    <ol class="chapters">${p.chapters.map((c, i) => `<li><span class="fz-tessera" style="background: var(--t${[8, 9, 10][i]})">${i + 1}</span>${c}</li>`).join('')}</ol>
    ${storyTag(p.story)}</section>${keepGoing(id)}`;
};

// --- contenuti ---
V.c = id => {
  const p = PIECES[id], ig = S.fromIg;
  markSeen(id); S.fromIg = false; save();
  return `${back()}
  ${ig ? `<div class="ig fz-entra">${ic('instagram-logo')} <span>Opened from Instagram</span><span class="pill">No sign-up</span></div>` : ''}
  <div class="slides" data-slides>${p.slides.map((s, i) => `<div class="slide" style="background: var(--${p.color})" aria-label="Slide ${i + 1} of ${p.slides.length}">
      <b class="big">${s.big}${s.mark ? ` <mark>${s.mark}</mark>` : ''}${s.after ? ` ${s.after}` : ''}</b>${s.text ? `<p>${s.text}</p>` : ''}${s.note ? `<small>${s.note}</small>` : ''}
      <img src="../assets/factanza-f.png" alt=""></div>`).join('')}</div>
  <div class="dots">${p.slides.map((_, i) => `<span${i ? '' : ' class="on"'}></span>`).join('')}</div>
  <section class="block"><h1 class="title">${p.title}</h1>${storyTag(p.story)}</section>${keepGoing(id)}`;
};
V.a = id => {
  const p = PIECES[id];
  markSeen(id);
  const body = p.body.map(par => `<p>${par.replace(/\[([^\]]+)\]/g, (_, t) => `<button class="term" data-term="${t}">${t}</button>`)}</p>`).join('');
  return `${back()}${p.image ? `<div class="art-photo" style="--c: var(--${p.color})"><img src="${p.image}" alt=""></div>` : ''}
  <article class="block article"><h1 class="title">${p.title}</h1><small class="meta-line">${p.kicker} · ${p.minutes} min</small>
    <p class="tip">${ic('hand-tap')} Tap an underlined word for the Zanichelli definition</p>${body}</article>
  <section class="block">${storyTag(p.story)}</section>${keepGoing(id)}`;
};
V.v = id => {
  const p = PIECES[id];
  markSeen(id);
  return `${back()}<section class="block"><div class="video" style="--c: var(--${p.color})">${p.image ? `<img class="vid-img" src="${p.image}" alt="">` : ''}<div class="vid-bg"></div><p class="caption"></p>
      <button class="play-btn" data-vplay aria-label="Pause">${ic('pause', true)}</button><span class="vid-title">${p.title}</span></div>${storyTag(p.story)}</section>${keepGoing(id)}`;
};

// --- Play ---
const beat = score => [8, 21, 39, 58, 72, 91][score];
const weeks = (n, grow) => `<div class="weeks" aria-label="${n} weeks in a row">${Array.from({ length: 6 }, (_, i) => `<span class="${i < n ? 'on' : ''}${grow && i === n - 1 ? ' grow' : ''}"></span>`).join('')}</div>`;
function friends() {
  const rows = [...QUIZ.friends, ...(S.quiz && S.quiz.done ? [{ name: S.name || 'You', c: 't8', score: S.quiz.score, me: true }] : [])].sort((a, b) => b.score - a.score);
  return `<ol class="friends">${rows.map((r, i) => `<li class="${r.me ? 'me' : ''}"><span class="rank">${i + 1}</span>${av(r.name, r.c)}<b>${esc(r.name)}</b><span>${r.score}/5</span></li>`).join('')}</ol>
    ${S.quiz && S.quiz.done ? '' : '<p class="hint">Play this week to join your friends.</p>'}`;
}
V.play = () => `${topBar('Play')}
  <section class="block"><h1>This week</h1>${quizRow()}${weeks(S.streak)}<p class="small">${ic('fire', true)} ${S.streak} weeks in a row. We remind you before it closes.</p></section>
  <section class="block"><h2 class="sec">Friends this week</h2>${friends()}</section>
  <section class="block"><h2 class="sec">Games</h2>${gameCard()}</section>`;
V.quiz = () => {
  const q = S.quiz;
  if (!q) return `${back('#/play')}<section class="block quiz-intro"><h1>5 questions on this week's news</h1><small class="meta-line">${QUIZ.week} · weekly quiz</small><p>2 minutes. Every answer links to the piece that explains it.</p>
    ${weeks(S.streak)}<p class="small">${ic('fire', true)} ${S.streak} weeks in a row. Play this week to make it ${S.streak + 1}.</p>
    <button class="fz-btn fz-btn--primario big-btn" data-start>Start the quiz</button><small class="small">${QUIZ.players} people already played</small></section>`;
  if (q.done) return result();
  const item = QUIZ.questions[q.i], answered = q.answers.length > q.i, a = q.answers[q.i];
  return `${back('#/play')}<section class="block quiz-q"><div class="q-steps">${QUIZ.questions.map((_, i) => `<span class="${i < q.answers.length ? (q.answers[i] === QUIZ.questions[i].ok ? 'ok' : 'no') : i === q.i ? 'now' : ''}"></span>`).join('')}</div>
    <h1>${item.q}</h1><small class="meta-line">Question ${q.i + 1} of 5</small>
    <div class="options">${item.options.map((o, i) => `<button class="opt${answered ? (i === item.ok ? ' right' : i === a ? ' wrong' : '') : ''}" data-answer="${i}"${answered ? ' disabled' : ''}>${o}</button>`).join('')}</div>
    ${answered ? `<div class="explain fz-entra"><b>${a === item.ok ? 'Correct!' : 'Not quite.'}</b> Explained in:${pieceCard(item.piece)}</div>
      <button class="fz-btn fz-btn--primario big-btn" data-next>${q.i < 4 ? 'Next question' : 'See your result'}</button>` : ''}</section>`;
};
function result() {
  const q = S.quiz, lives = [...new Set(QUIZ.questions.map(x => PIECES[x.piece].story))].filter(id => EV[id]);
  return `${back('#/play')}<section class="block quiz-result"><h1>${QUIZ.week} quiz</h1>
    <div class="score fz-entra"><b>${q.score}/5</b><span>You beat ${beat(q.score)}% of the community</span></div>
    ${weeks(S.streak, true)}<p class="small">${ic('fire', true)} <b>${S.streak} weeks in a row.</b> We'll remind you on Monday.</p></section>
  <section class="block"><h2 class="sec">Friends this week</h2>${friends()}</section>
  ${lives.length ? `<section class="block"><h2 class="sec">Follow what this quiz was about</h2><div class="rail">${lives.map(liveCard).join('')}</div></section>` : ''}
  <section class="block">${serviceCard('academy', q.score >= 4 ? 'You know the news. Learn to explain it.' : 'Want to go deeper?')}</section>`;
}
V.game = () => `${back('#/play')}<section class="block">${gameCard().replace('href="#/game"', 'href="#/game" tabindex="-1" aria-hidden="true"')}
  <p class="lead">${GAME.about}</p>
  <ol class="chapters">${['Pick a role: student, worker, mayor or entrepreneur', 'Each round, vote one rule for your society', 'At the end, see how the community voted the same rules'].map((t, i) => `<li><span class="fz-tessera" style="background: var(--t${[1, 4, 8][i]})">${i + 1}</span>${t}</li>`).join('')}</ol>
  <button class="fz-btn fz-btn--primario big-btn" data-room>${ic('users-three')} Create a room</button>
  <p class="hint">Concept: the app version of the board game is a proposal.</p></section>`;

// --- Learn ---
V.learn = () => `${topBar('Learn')}
  <section class="block"><h1>Factanza Academy</h1><p class="lead">From the news you follow to skills you can show. Start free, right here.</p>${lessonCard()}</section>
  <section class="block"><h2 class="sec">Courses</h2><div class="list">${Object.keys(COURSES).map(k => { const c = COURSES[k]; return `<a class="card fz-entra" href="#/course/${k}"><span class="fz-tessera" style="background: var(--${c.color})">${ic('graduation-cap')}</span><span class="card-txt"><b>${c.title}</b><small>${c.meta}</small></span><span class="price">${c.price}</span></a>`; }).join('')}</div></section>
  <section class="block"><h2 class="sec">Live class, free</h2><div class="webinar fz-entra">${ic('video-camera', true)}<span><b>${WEBINAR.title}</b><small>${WEBINAR.when} · in the app</small></span>
    <button class="follow${S.reminders.includes('webinar') ? ' on' : ''}" data-remind="webinar">${ic('bell', S.reminders.includes('webinar'))} ${S.reminders.includes('webinar') ? 'Reminder on' : 'Remind me'}</button></div></section>
  <section class="block"><h2 class="sec">Books · Facciamo il punto</h2><div class="rail">${BOOKS.map((b, i) => `<button class="book fz-entra" style="--i:${i}; --c: var(--${b.color})" data-book="${i}"><small>Facciamo il punto</small><b>${b.title}</b><span>Read a sample</span></button>`).join('')}</div></section>
  <section class="block">${serviceCard('event', 'Meet the newsroom')}</section>`;
V.course = k => {
  const c = COURSES[k];
  return `${back('#/learn')}<section class="block"><div class="pod" style="--c: var(--${c.color})"><small>Factanza Academy</small><b class="big">${c.title}</b><span>${c.meta}</span><img class="f" src="../assets/factanza-f.png" alt=""></div>
    ${c.lesson ? lessonCard() : ''}
    <button class="fz-btn fz-btn--primario big-btn" data-enroll="${k}">Enroll · ${c.price}</button><p class="hint">Payment is the only step outside the app.</p></section>`;
};
V.lesson = k => {
  const c = COURSES[k], l = c.lesson;
  if (!S.lesson) { S.lesson = true; S.minutes += l.min; save(); }
  return `${back('#/learn')}<section class="block"><div class="video lesson-video" style="--c: var(--${c.color})"><div class="vid-bg"></div><p class="caption">${l.title.split(' · ')[1]}</p>
      <button class="play-btn" data-vplay aria-label="Pause">${ic('pause', true)}</button><span class="vid-title">${c.title} · ${l.min} min</span></div>
    <h2 class="sec">In this lesson</h2><ol class="chapters">${l.outline.map((t, i) => `<li><span class="fz-tessera" style="background: var(--t${[5, 4, 3][i]})">${i + 1}</span>${t}</li>`).join('')}</ol></section>
  <section class="block"><div class="service"><div class="service-row"><span class="fz-tessera" style="background: var(--fz-viola); color: #fff">${ic('lock-key-open')}</span><div><b>49 more lessons</b><p>${c.meta}.</p></div></div>
    <button class="fz-btn fz-btn--primario" data-enroll="${k}">Enroll · ${c.price}</button></div></section>`;
};

// --- You ---
V.you = () => {
  const toggle = (g, k, label) => `<label class="toggle"><span>${label}</span><input type="checkbox" data-toggle="${g}.${k}"${S[g][k] ? ' checked' : ''}><span class="sw" aria-hidden="true"></span></label>`;
  return `${topBar('You')}
  <section class="block"><div class="stats">
    <div class="fz-entra" style="--i:0"><b>${S.minutes}</b><small>minutes on Factanza</small></div>
    <div class="fz-entra" style="--i:1"><b>${S.seen.length}</b><small>pieces seen</small></div>
    <div class="fz-entra" style="--i:2"><b>${S.streak}</b><small>weeks of quiz</small></div>
    <div class="fz-entra" style="--i:3"><b>${S.follows.length}</b><small>lives followed</small></div></div>
    ${S.signed ? `<p class="saved">${ic('check-circle', true)} Progress saved on every device</p>` : `<button class="fz-btn big-btn" data-save>${ic('cloud-arrow-up')} Save your progress</button>`}</section>
  <section class="block"><button class="recap fz-entra" data-recap><small>Your November</small><b>${S.minutes} minutes · ${S.streak} weeks · ${S.follows.length} ${S.follows.length === 1 ? 'live' : 'lives'}</b><span>Share your month ${ic('share-network')}</span><img src="../assets/factanza-f.png" alt=""></button></section>
  <section class="block"><h2 class="sec">Name in the comments</h2><form class="name-form" data-name><input name="n" value="${esc(S.name)}" placeholder="Pick a name" maxlength="24" aria-label="Your name in the comments"><button class="fz-btn">Save</button></form></section>
  <section class="block"><h2 class="sec">Notifications</h2><div class="toggles">${toggle('notify', 'events', 'Updates on lives I follow')}${toggle('notify', 'streak', 'Quiz streak reminders')}</div></section>
  <section class="block"><h2 class="sec">Newsletters</h2><div class="toggles">${toggle('news', 'pills', 'Weekly Pills · every week')}${toggle('news', 'feed', 'The Feed · social media and AI')}</div></section>
  <section class="block">${serviceCard('plus')}</section>
  <section class="block"><button class="link-btn" data-reset>${ic('arrow-counter-clockwise')} Start the demo over</button>
    <p class="hint">Demo for the Factanza Hackathon. Results, figures, people and episodes are examples.</p></section>`;
};

// ---------- router ----------
const TAB = { home: 'home', e: 'home', c: 'home', a: 'home', v: 'home', listen: 'listen', show: 'listen', p: 'listen', play: 'play', quiz: 'play', game: 'play', learn: 'learn', course: 'learn', lesson: 'learn', you: 'you' };
function valid(name, id) {
  if (id !== undefined && /^(c|a|p|v|e|show|course|lesson)$/.test(name) && !Object.hasOwn(({ c: PIECES, a: PIECES, p: PIECES, v: PIECES, e: EV, show: PODCASTS, course: COURSES, lesson: COURSES })[name], id)) return false; // "constructor" non è un pezzo
  if (name === 'lesson' && !COURSES[id]?.lesson) return false; // non tutti i corsi hanno la lezione di prova
  return ({ c: PIECES, a: PIECES, p: PIECES, v: PIECES, e: EV, show: PODCASTS, course: COURSES, lesson: COURSES })[name]?.[id] !== undefined || !({ c: 1, a: 1, p: 1, v: 1, e: 1, show: 1, course: 1, lesson: 1 })[name];
}
function render(anim = true) {
  const [name, id] = here, keep = view.scrollTop;
  view.innerHTML = V[name](id);
  bell();
  if (anim) enter(); else { view.querySelectorAll('.fz-entra').forEach(el => el.classList.add('is-in')); view.scrollTop = keep; }
}
function route() {
  timers.forEach(clearTimeout); timers = [];
  closeSheet(true);
  if (!location.hash || location.hash === '#') { if (S.fromIg && !S.seen.length) { location.replace('#/c/c1'); return; } }
  let [, name = 'home', id] = location.hash.split('/');
  if (name === '') name = 'home';
  if (!Object.hasOwn(V, name) || !valid(name, id)) name = 'home';
  here = [name, id];
  render();
  document.querySelectorAll('.tabs a').forEach(a => a.toggleAttribute('aria-current', a.dataset.tab === TAB[name]));
  view.scrollTo(0, 0);
  view.focus({ preventScroll: true });
  if (name === 'c') slidesDots();
  if (name === 'p') syncPlayer();
  if (name === 'v' || name === 'lesson') videoCaptions(name === 'v' ? PIECES[id].captions : null);
}
addEventListener('hashchange', route);
function enter() { requestAnimationFrame(() => requestAnimationFrame(() => view.querySelectorAll('.fz-entra').forEach(el => el.classList.add('is-in')))); }
function slidesDots() {
  const box = view.querySelector('[data-slides]'), dots = view.querySelectorAll('.dots span');
  box.addEventListener('scroll', () => { const i = Math.round(box.scrollLeft / box.clientWidth); dots.forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
}
function videoCaptions(captions) {
  const cap = view.querySelector('.caption'), btn = view.querySelector('[data-vplay]');
  let i = 0, on = true;
  const show = () => {
    if (captions) { const w = captions[i % captions.length]; cap.innerHTML = w.map((x, k) => `<span${k === w.length - 1 ? ' class="key"' : ''}>${x}</span>`).join(' '); i++; }
    pop(cap);
  };
  show();
  if (captions) timers.push(setInterval(() => on && show(), 1100));
  btn.onclick = () => { on = !on; btn.innerHTML = ic(on ? 'pause' : 'play', true); btn.setAttribute('aria-label', on ? 'Pause' : 'Play'); };
}

// ---------- foglio dal basso e avvisi ----------
const sheet = $('#sheet');
let thread = null;
let sheetT, sheetFrom;
function openSheet(html, cls = '') {
  thread = null; clearTimeout(sheetT); if (sheet.hidden) sheetFrom = document.activeElement;
  sheet.innerHTML = `<div class="sheet-bg" data-close></div><div class="sheet-card ${cls}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
  const card = sheet.querySelector('.sheet-card'), h = card.querySelector('h2, b');
  card.setAttribute('aria-label', h ? h.textContent.trim().slice(0, 80) : 'Details');
  sheet.hidden = false; card.focus({ preventScroll: true });
  requestAnimationFrame(() => sheet.classList.add('open'));
}
function closeSheet(now) {
  thread = null;
  if (sheet.hidden) return;
  sheet.classList.remove('open');
  sheetFrom?.focus?.({ preventScroll: true }); sheetFrom = null;
  if (now) sheet.hidden = true; else sheetT = setTimeout(() => { sheet.hidden = true; }, 250);
}
function appendComment(c) { const ul = $('#sheet [data-list]'); if (!ul) return; ul.querySelector('.cm-empty')?.remove(); ul.insertAdjacentHTML('beforeend', commentLi(c)); ul.scrollTop = ul.scrollHeight; }
async function threadSheet(id, i) {
  const ev = EV[id], u = ev.updates[i];
  openSheet(`<div class="thread-head"><span class="row-top">${status(ev)}<small>${esc(u.time)}</small></span><b>${esc(u.text)}</b></div>
    <p class="rules">${ic('shield-check')} Moderated: be kind, no insults.</p>
    <ul class="comments" data-list><li class="cm-loading"></li><li class="cm-loading"></li></ul>
    <form class="composer" data-post="${id}:${i}">${S.name ? '' : '<input name="n" placeholder="Your name" maxlength="24" aria-label="Your name" required>'}
      <input name="t" placeholder="Say something to the community" maxlength="200" autocomplete="off" aria-label="Your comment" required><button aria-label="Send">${ic('paper-plane-right', true)}</button>
      <p class="form-err" role="alert" hidden></p></form>`, 'tall');
  thread = [id, i];
  const r = !online && REC ? { comments: REC.comments[`${id}:${i}`] || [] } : await fetch(`/api/comments?event=${encodeURIComponent(id)}&upd=${i}`).then(x => x.json()).catch(() => null);
  const ul = $('#sheet [data-list]'); if (!ul || !thread || thread[0] !== id || thread[1] !== i) return;
  ul.innerHTML = r ? (r.comments.length ? r.comments.map(c => commentLi({ ...c, mine: c.name === S.name && !c.bot })).join('') : '<li class="cm-empty">No comments yet. Start the conversation.</li>') : '<li class="cm-empty">Comments are offline right now.</li>';
  ul.scrollTop = ul.scrollHeight;
  sheet.querySelector('form input')?.focus({ preventScroll: true });
}
function shareSheet(title, line, color, link) {
  openSheet(`<h2>Share</h2>
    <div class="share-card" style="--c: var(--${color})"><img src="../assets/factanza-f.png" alt=""><b>${esc(title)}</b><small>${esc(line)}</small></div>
    <div class="share-row">
      <button data-share-to="Instagram Stories">${ic('instagram-logo')}<small>Stories</small></button>
      <button data-share-to="WhatsApp">${ic('whatsapp-logo')}<small>WhatsApp</small></button>
      <button data-copy="${esc(link)}">${ic('link')}<small>Copy link</small></button></div>`);
}
function notesSheet() {
  NOTES.forEach(n => { n.read = true; }); bell();
  openSheet(`<h2>Notifications</h2>${NOTES.length ? `<div class="list">${NOTES.map(n => `<a class="note" href="${n.to}">${ic(n.icon, true)}<span><b>${esc(n.title)}</b><small>${esc(n.body)}</small></span></a>`).join('')}</div>`
    : '<p>Nothing yet. Follow a live or keep your quiz streak: we tell you when it matters.</p>'}`, 'tall');
}
const toast = $('#toast');
let toastTimer;
function showToast(html, to, cls = '') {
  toast.className = 'toast ' + cls;
  toast.innerHTML = to ? `<a href="${to}">${html}</a>` : html;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('open'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove('open'); setTimeout(() => { toast.hidden = true; }, 300); }, 5000);
}
const push = (title, body, to) => showToast(`<img src="../assets/factanza-f.png" alt=""><span><small class="push-app">Factanza · now</small><b>${esc(title)}</b><small>${esc(body)}</small></span>`, to, 'push');
const info = (icon, title, body) => showToast(`${ic(icon, true)}<span><b>${title}</b><small>${body}</small></span>`);
toast.addEventListener('click', () => toast.classList.remove('open'));

// ---------- tocchi ----------
document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-close]');
  if (!t || (t.closest('form') && t.matches('form button'))) return; // i moduli passano da "submit"
  const d = t.dataset;
  if ('close' in d) return closeSheet();
  if ('bell' in d) return notesSheet();
  if (d.thread) { const [id, i] = d.thread.split(':'); return threadSheet(id, +i); }
  if (d.react) {
    const [id, i] = d.react.split(':'), on = !S.reacted.includes(d.react);
    S.reacted = on ? [...S.reacted, d.react] : S.reacted.filter(x => x !== d.react); save();
    t.classList.toggle('on', on); t.setAttribute('aria-pressed', on); t.querySelector('i').outerHTML = ic('fire', on);
    post('/api/react', { event: id, upd: +i, on });
    return;
  }
  if (d.follow) {
    const id = d.follow, on = !S.follows.includes(id), ev = EV[id];
    S.follows = on ? [...S.follows, id] : S.follows.filter(x => x !== id); save();
    document.querySelectorAll(`[data-follow="${id}"]`).forEach(b => { b.outerHTML = followBtn(id); });
    post('/api/follow', { event: id, on });
    refreshBoard();
    if (on) info('push-pin', ev.upcoming ? 'Reminder on' : 'Pinned to your Home', ev.upcoming ? `We'll notify you when it starts: ${ev.upcoming}` : `We'll notify you on every update of ${ev.short}`);
    return;
  }
  if (d.share) { const ev = EV[d.share]; return shareSheet(ev.title, ev.live ? 'Follow it live with me on Factanza' : 'Follow it with me on Factanza', ev.color, location.origin + location.pathname + '#/e/' + d.share); }
  if (d.shareTo) { closeSheet(); return info('share-network', `Shared to ${d.shareTo}`, `In the real app this opens ${d.shareTo} with the link`); }
  if (d.copy) { navigator.clipboard?.writeText(d.copy).catch(() => {}); closeSheet(); return info('link', 'Link copied', 'Whoever opens it lands right here, no sign-up'); }
  if ('recap' in d) return shareSheet('My November on Factanza', `${S.minutes} minutes · ${S.streak}-week quiz streak · ${S.follows.length} lives`, 't8', location.origin + location.pathname);
  if (d.ep) {
    if (d.ep === 'briefing') return playEp('briefing', 'Your briefing', 'Made for you · 8 min', 't5', 8);
    const [key, i] = d.ep.split(':'), s = PODCASTS[key], ep = s.eps[+i];
    return playEp(`${key}:${i}`, ep.title, s.name, s.color, ep.min);
  }
  if (d.play) { const p = PIECES[d.play]; if (P.key === d.play) togglePlayer(); else playEp(d.play, p.title.split(' · ')[1], p.show, p.color, p.minutes); return; }
  if ('togglePlay' in d) return togglePlayer();
  if (d.term) {
    const term = TERMS[d.term];
    S.minutes += 1; save();
    return openSheet(`<div class="def-head"><h2>${d.term}</h2><span class="pill">Zanichelli dictionary</span></div><p>${term.def}</p>
      <button class="deep" data-deep="${d.term}">${ic('books')} <span><b>Go deeper: ${term.deep}</b><small>Zanichelli card · ${term.min} min</small></span>${ic('caret-right')}</button>`);
  }
  if (d.deep) { S.minutes += TERMS[d.deep].min; save(); closeSheet(); return info('books', 'Zanichelli card added to your reading', `+${TERMS[d.deep].min} min of deep dive`); }
  if ('sign' in d) { S.signed = true; save(); closeSheet(); if (here[0] === 'you') render(false); return info('check-circle', 'Progress saved', 'No password needed'); }
  if ('save' in d) return saveSheet();
  if (d.service) return info(SERVICES[d.service].icon, SERVICES[d.service].title, `In the real app this opens the ${d.service === 'plus' ? 'subscription' : 'ticket'} checkout`);
  if (d.enroll) return info('graduation-cap', COURSES[d.enroll].title, `In the real app this opens the checkout · ${COURSES[d.enroll].price}`);
  if (d.remind) {
    const on = !S.reminders.includes(d.remind);
    S.reminders = on ? [...S.reminders, d.remind] : S.reminders.filter(x => x !== d.remind); save(); render(false);
    if (on) notify('video-camera', 'Reminder set', `${WEBINAR.title} · ${WEBINAR.when}`, '#/learn');
    return;
  }
  if (d.book) return info('book-open', BOOKS[d.book].title, 'In the real app the first chapter opens here');
  if ('room' in d) return shareSheet(`${GAME.title} · room FZ-4821`, 'Join my game on Factanza', 't6', location.origin + location.pathname + '#/game');
  if ('start' in d) { S.quiz = { i: 0, answers: [] }; save(); return render(); }
  if (d.answer !== undefined && S.quiz) { S.quiz.answers[S.quiz.i] = +d.answer; save(); return render(false); }
  if ('next' in d) {
    if (S.quiz.i < 4) S.quiz.i++;
    else { S.quiz.done = true; S.quiz.score = S.quiz.answers.filter((a, i) => a === QUIZ.questions[i].ok).length; S.streak += 1; }
    save(); return render();
  }
  if ('reset' in d) { S = fresh(); save(); NOTES.length = 0; for (const k in unread) delete unread[k]; lit.clear(); Object.assign(P, { key: null, on: false }); mini(); location.hash = ''; return route(); }
});
document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if ('name' in f.dataset) { S.name = f.n.value.trim().slice(0, 24); save(); return info('check-circle', 'Name saved', S.name ? `You comment as ${esc(S.name)}` : 'You comment as Guest'); }
  if (!f.dataset.post) return;
  if (f.n) { S.name = f.n.value.trim().slice(0, 24); save(); }
  const text = f.t.value.trim(), err = f.querySelector('.form-err'); if (!text) return;
  const [id, i] = f.dataset.post.split(':'), btn = f.querySelector('button');
  btn.disabled = true;
  const body = { event: id, upd: +i, name: S.name || 'Guest', color: 't8', text };
  const r = !online && REC ? { ok: true, data: { comment: { ...body, id: `local${Date.now()}`, ts: Date.now() } } } : await post('/api/comments', body); // registrazione: il commento resta solo su questo telefono
  btn.disabled = false;
  if (!r.ok) { err.textContent = r.data.error || 'The comment was not sent.'; err.hidden = false; return; }
  err.hidden = true; f.t.value = '';
  if (f.n) { f.n.remove(); }
  const li = $('#sheet [data-cid="' + r.data.comment.id + '"]');
  if (li) li.classList.add('mine'); else appendComment({ ...r.data.comment, mine: true });
});
document.addEventListener('change', e => { const k = e.target.dataset.toggle; if (!k) return; const [g, key] = k.split('.'); S[g][key] = e.target.checked; save(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

load().then(() => { route(); listen(); });
