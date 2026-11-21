// Demo "One story leads to another": un'app da telefono con hash router e stato nel browser.
// Percorso: arrivo da Instagram su un carosello → contenuti collegati → parole Zanichelli → quiz con serie → storie seguite → servizi.
// ?reset=1 (o il tasto "Start over" in You) rimette tutto da capo: serve per rifare le registrazioni.

const KEY = 'fz-demo-v1';
const fresh = () => ({ seen: [], minutes: 0, streak: 3, quiz: null, follows: [], readUpdates: [], signed: false, askedSave: false, fromIg: true });
let S;
try { S = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { S = fresh(); }
if (new URLSearchParams(location.search).has('reset')) S = fresh();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* navigazione privata: lo stato vive finché la pagina è aperta */ } };
save();

const $ = s => document.querySelector(s);
const view = $('#view');
const ic = (name, fill) => `<i class="ph-${fill ? 'fill' : 'bold'} ph-${name}" aria-hidden="true"></i>`;
const KIND = { carousel: ['cards', 'Carousel'], article: ['article', 'Deep dive'], podcast: ['headphones', 'Podcast'], video: ['play', 'Video'] };
const HREF = { carousel: 'c', article: 'a', podcast: 'p', video: 'v' };
const href = id => `#/${HREF[PIECES[id].kind]}/${id}`;
let timers = []; // intervalli della schermata aperta (podcast, video): si fermano quando si cambia schermata
const later = (fn, ms) => timers.push(setTimeout(fn, ms));

// ---------- pezzi riusati ----------
function pieceCard(id, i = 0) {
  const p = PIECES[id], [icon, label] = KIND[p.kind];
  const done = S.seen.includes(id);
  return `<a class="card fz-entra" style="--i:${i}" href="${href(id)}">
    <span class="fz-tessera" style="background: var(--${p.color})">${ic(icon)}</span>
    <span class="card-txt"><b>${p.title}</b><small>${label} · ${p.minutes} min${done ? ' · seen' : ''}</small></span>${ic('caret-right')}</a>`;
}
function followBtn(story) {
  const on = S.follows.includes(story);
  return `<button class="follow${on ? ' on' : ''}" data-follow="${story}" aria-pressed="${on}">${ic(on ? 'check' : 'plus')} ${on ? 'Following' : 'Follow'}</button>`;
}
function serviceCard(id, reason) {
  const s = SERVICES[id];
  return `<div class="service fz-entra">${reason ? `<span class="fz-occhiello">${reason}</span>` : ''}
    <div class="service-row"><span class="fz-tessera" style="background: var(--fz-viola); color: #fff">${ic(s.icon)}</span><div><b>${s.title}</b><p>${s.text}</p></div></div>
    <button class="fz-btn fz-btn--primario" data-service="${id}">${s.cta}</button></div>`;
}
const keepGoing = id => `<section class="block"><h2 class="fz-occhiello">Keep going</h2><div class="list">${PIECES[id].next.map(pieceCard).join('')}</div></section>`;
const back = (to = '#/') => `<header class="bar"><a class="icon-btn" href="${to}" aria-label="Back">${ic('arrow-left')}</a><img src="../assets/factanza-f.png" alt="Factanza"><span class="streak" title="Weeks in a row">${ic('fire', true)} ${S.streak}</span></header>`;
const freshFor = st => S.follows.includes(st) && STORIES[st].updates.some((u, i) => u.fresh && !S.readUpdates.includes(st + i));

// ---------- tempo passato e richiesta di salvare i progressi ----------
function markSeen(id) {
  if (S.seen.includes(id)) return;
  S.seen.push(id);
  S.minutes += PIECES[id].minutes;
  save();
  if (S.seen.length >= 3 && !S.signed && !S.askedSave) later(() => { S.askedSave = true; save(); saveSheet(); }, 1400); // se si cambia schermata prima, lo chiede al prossimo contenuto
}
function saveSheet() {
  openSheet(`<span class="fz-occhiello">No password, one tap</span>
    <h2>Save your progress?</h2>
    <p>You've seen ${S.seen.length} pieces and you have a ${S.streak}-week quiz streak. Keep them on every device.</p>
    <div class="stack">
      <button class="fz-btn fz-btn--scuro" data-sign>${ic('apple-logo')} Continue with Apple</button>
      <button class="fz-btn" data-sign>${ic('google-logo')} Continue with Google</button>
      <button class="link-btn" data-close>Not now</button>
    </div>`);
}

// ---------- schermate ----------
const V = {};

V.home = () => {
  const followed = S.follows.length ? S.follows : [];
  const last = S.seen.at(-1), nextUp = last && PIECES[last].next.find(n => !S.seen.includes(n));
  const news = Object.keys(STORIES).filter(freshFor);
  return `<header class="bar home"><img src="../assets/factanza-f.png" alt=""><b>Factanza</b><span class="streak" title="Weeks in a row">${ic('fire', true)} ${S.streak}</span></header>
  ${news.map(st => `<a class="alert fz-entra" href="#/s/${st}">${ic('bell-ringing', true)}<span><b>New on a story you follow</b><small>${STORIES[st].title}</small></span></a>`).join('')}
  <section class="block"><h1>Today in a minute</h1>
    <div class="covers">${['c1', 'c2', 'c3'].map((id, i) => cover(id, i)).join('')}</div></section>
  ${nextUp ? `<section class="block"><h2 class="fz-occhiello">Pick up where you left off</h2><div class="list">${pieceCard(nextUp)}</div></section>` : ''}
  <section class="block">${quizTeaser()}</section>
  <section class="block"><h2 class="fz-occhiello">${followed.length ? 'Your stories' : 'Stories to follow'}</h2>
    <div class="list">${(followed.length ? followed : Object.keys(STORIES)).map(storyRow).join('')}</div></section>
  <section class="block">${serviceCard('event', 'Near you')}</section>`;
};
function cover(id, i) {
  const p = PIECES[id], s = p.slides[0];
  return `<a class="cover-mini fz-entra" style="--i:${i}; background: var(--${p.color})" href="${href(id)}">
    <b>${s.big} <mark>${s.mark}</mark> ${s.after}</b><img src="../assets/factanza-f.png" alt=""></a>`;
}
function quizTeaser() {
  const q = S.quiz;
  if (q && q.done) return `<a class="quiz-teaser done" href="#/quiz"><span class="fz-occhiello">${QUIZ.week} quiz</span><b>${q.score}/5 · you beat ${beat(q.score)}% of players</b><small>Next quiz on Monday · keep your ${S.streak}-week streak</small></a>`;
  return `<a class="quiz-teaser fz-entra" href="#/quiz"><span class="fz-occhiello">${ic('lightning', true)} ${QUIZ.week} quiz is ready</span><b>5 questions on this week's news</b><small>2 minutes · ${QUIZ.players} already played</small><span class="fz-btn fz-btn--primario">Play now</span></a>`;
}
function storyRow(st, i = 0) {
  const s = STORIES[st];
  return `<div class="story-row fz-entra" style="--i:${i}"><a href="#/s/${st}"><span class="fz-tessera" style="background: var(--${s.color})">${ic('path')}</span>
    <span class="card-txt"><b>${s.title}${freshFor(st) ? ' <em>New</em>' : ''}</b><small>${s.updates.length} updates · ${s.followers} following</small></span></a>${followBtn(st)}</div>`;
}

V.c = id => {
  const p = PIECES[id];
  markSeen(id);
  const ig = S.fromIg;
  S.fromIg = false; save();
  return `${back()}
  ${ig ? `<div class="ig fz-entra">${ic('instagram-logo')} <span>Opened from Instagram</span><span class="pill">No sign-up</span></div>` : ''}
  <div class="slides" data-slides>${p.slides.map((s, i) => `<div class="slide" style="background: var(--${p.color})" aria-label="Slide ${i + 1} of ${p.slides.length}">
      <b class="big">${s.big}${s.mark ? ` <mark>${s.mark}</mark>` : ''}${s.after ? ` ${s.after}` : ''}</b>${s.text ? `<p>${s.text}</p>` : ''}${s.note ? `<small>${s.note}</small>` : ''}
      <img src="../assets/factanza-f.png" alt=""></div>`).join('')}</div>
  <div class="dots">${p.slides.map((_, i) => `<span${i ? '' : ' class="on"'}></span>`).join('')}</div>
  <section class="block"><h1 class="title">${p.title}</h1>
    <div class="story-tag"><span>Part of the story <b>${STORIES[p.story].title}</b></span>${followBtn(p.story)}</div></section>
  ${keepGoing(id)}`;
};

V.a = id => {
  const p = PIECES[id];
  markSeen(id);
  const body = p.body.map(par => `<p>${par.replace(/\[([^\]]+)\]/g, (_, t) => `<button class="term" data-term="${t}">${t}</button>`)}</p>`).join('');
  return `${back()}<article class="block article"><span class="fz-occhiello">${p.kicker} · ${p.minutes} min</span><h1 class="title">${p.title}</h1>
    <p class="tip">${ic('hand-tap')} Tap an underlined word for the Zanichelli definition</p>${body}</article>
  <section class="block"><div class="story-tag"><span>Part of the story <b>${STORIES[p.story].title}</b></span>${followBtn(p.story)}</div></section>
  ${keepGoing(id)}`;
};

V.p = id => {
  const p = PIECES[id];
  markSeen(id);
  return `${back()}<section class="block"><div class="pod" style="background: var(--${p.color})"><span class="fz-occhiello">${p.episode}</span><b class="big">${p.show}</b><span>${p.title.split(' · ')[1]}</span></div>
    <div class="player"><button class="play-btn" data-play aria-label="Play">${ic('play', true)}</button>
      <div class="track"><span data-progress></span></div><small data-time>0:00 / ${p.minutes}:00</small></div>
    <ol class="chapters">${p.chapters.map((c, i) => `<li><span class="fz-tessera" style="background: var(--t${[8, 9, 10][i]})">${i + 1}</span>${c}</li>`).join('')}</ol></section>
  ${keepGoing(id)}`;
};

V.v = id => {
  const p = PIECES[id];
  markSeen(id);
  return `${back()}<section class="block"><div class="video" data-video><div class="vid-bg"></div><p class="caption" data-caption></p>
      <button class="play-btn" data-vplay aria-label="Pause">${ic('pause', true)}</button><span class="vid-title">${p.title}</span></div></section>
  ${keepGoing(id)}`;
};

V.quiz = () => {
  const q = S.quiz;
  if (!q) return `${back()}<section class="block quiz-intro"><span class="fz-occhiello">${QUIZ.week} · weekly quiz</span>
    <h1>5 questions on this week's news</h1><p>2 minutes. Every answer links to the piece that explains it.</p>
    ${weeks(S.streak)}<p class="small">${ic('fire', true)} ${S.streak} weeks in a row. Play this week to make it ${S.streak + 1}.</p>
    <button class="fz-btn fz-btn--primario big-btn" data-start>Start the quiz</button><small class="small">${QUIZ.players} people already played</small></section>`;
  if (q.done) return result();
  const item = QUIZ.questions[q.i], answered = q.answers.length > q.i, a = q.answers[q.i];
  return `${back()}<section class="block quiz-q"><div class="q-steps">${QUIZ.questions.map((_, i) => `<span class="${i < q.answers.length ? (q.answers[i] === QUIZ.questions[i].ok ? 'ok' : 'no') : i === q.i ? 'now' : ''}"></span>`).join('')}</div>
    <span class="fz-occhiello">Question ${q.i + 1} of 5</span><h1>${item.q}</h1>
    <div class="options">${item.options.map((o, i) => `<button class="opt${answered ? (i === item.ok ? ' right' : i === a ? ' wrong' : '') : ''}" data-answer="${i}"${answered ? ' disabled' : ''}>${o}</button>`).join('')}</div>
    ${answered ? `<div class="explain fz-entra"><b>${a === item.ok ? 'Correct!' : 'Not quite.'}</b> Explained in:${pieceCard(item.piece)}</div>
      <button class="fz-btn fz-btn--primario big-btn fz-entra" style="--i:1" data-next>${q.i < 4 ? 'Next question' : 'See your result'}</button>` : ''}</section>`;
};
const beat = score => [8, 21, 39, 58, 72, 91][score];
const weeks = (n, grow) => `<div class="weeks" aria-label="${n} weeks in a row">${Array.from({ length: 6 }, (_, i) => `<span class="${i < n ? 'on' : ''}${grow && i === n - 1 ? ' grow' : ''}"></span>`).join('')}</div>`;
function result() {
  const q = S.quiz, stories = [...new Set(QUIZ.questions.map(x => PIECES[x.piece].story))];
  return `${back()}<section class="block quiz-result"><span class="fz-occhiello">${QUIZ.week} quiz</span>
    <div class="score fz-entra"><b>${q.score}/5</b><span>You beat ${beat(q.score)}% of the community</span></div>
    ${weeks(S.streak, true)}<p class="small">${ic('fire', true)} <b>${S.streak} weeks in a row.</b> Next quiz on Monday: don't break it.</p></section>
  <section class="block"><h2 class="fz-occhiello">Follow the stories from this quiz</h2><div class="list">${stories.map(storyRow).join('')}</div></section>
  <section class="block">${serviceCard('academy', q.score >= 4 ? 'You know the news. Learn to explain it' : 'Want to go deeper?')}</section>`;
}

V.stories = () => `<header class="bar home"><img src="../assets/factanza-f.png" alt=""><b>Stories</b><span class="streak">${ic('fire', true)} ${S.streak}</span></header>
  <section class="block"><h1>Follow a story</h1><p class="lead">Long news becomes a timeline. We tell you when something changes.</p>
  <div class="list">${Object.keys(STORIES).map(storyRow).join('')}</div></section>`;

V.s = st => {
  const s = STORIES[st];
  const html = `${back('#/stories')}<section class="block"><div class="story-head" style="background: var(--${s.color})"><span class="fz-occhiello">Story · ${s.followers} following</span><b class="big">${s.title}</b></div>
    <div class="story-tag"><span>${s.updates.length} updates so far</span>${followBtn(st)}</div>
    <ol class="timeline">${s.updates.map((u, i) => ({ u, i })).reverse().map(({ u, i }, k) => {
      const isNew = u.fresh && S.follows.includes(st) && !S.readUpdates.includes(st + i);
      return `<li class="fz-entra${isNew ? ' new' : ''}" style="--i:${k}"><span class="dot"></span><a href="${href(u.piece)}"><small>${u.date}${isNew ? ' · <em>New</em>' : ''}</small><b>${u.text}</b></a></li>`;
    }).join('')}</ol></section>`;
  if (S.follows.includes(st)) { s.updates.forEach((u, i) => u.fresh && !S.readUpdates.includes(st + i) && S.readUpdates.push(st + i)); save(); }
  return html;
};

V.you = () => `<header class="bar home"><img src="../assets/factanza-f.png" alt=""><b>You</b><span class="streak">${ic('fire', true)} ${S.streak}</span></header>
  <section class="block"><div class="stats">
    <div class="fz-entra" style="--i:0"><b>${S.minutes}</b><small>minutes on Factanza</small></div>
    <div class="fz-entra" style="--i:1"><b>${S.seen.length}</b><small>pieces seen</small></div>
    <div class="fz-entra" style="--i:2"><b>${S.streak}</b><small>weeks of quiz</small></div>
    <div class="fz-entra" style="--i:3"><b>${S.follows.length}</b><small>stories followed</small></div></div>
    ${S.signed ? `<p class="saved">${ic('check-circle', true)} Progress saved on every device</p>` : `<button class="fz-btn big-btn" data-save>${ic('cloud-arrow-up')} Save your progress</button>`}</section>
  <section class="block"><h2 class="fz-occhiello">For you, from Factanza</h2><div class="list">${serviceCard('plus')}${serviceCard('academy')}${serviceCard('event')}</div></section>
  <section class="block"><button class="link-btn" data-reset>${ic('arrow-counter-clockwise')} Start the demo over</button></section>`;

// ---------- router ----------
function route() {
  timers.forEach(clearTimeout); timers.forEach(clearInterval); timers = [];
  closeSheet(true);
  let [, name = '', id] = location.hash.split('/');
  if (!location.hash || location.hash === '#') { if (S.fromIg && !S.seen.length) { location.replace('#/c/c1'); return; } name = ''; }
  const key = name || 'home';
  const fn = V[key] && (['c', 'a', 'p', 'v'].includes(key) ? PIECES[id] && V[key] : key === 's' ? STORIES[id] && V[key] : V[key]);
  view.innerHTML = fn ? fn(id) : V.home();
  const tab = { home: 'home', quiz: 'quiz', stories: 'stories', s: 'stories', you: 'you' }[key];
  document.querySelectorAll('.tabs a').forEach(a => a.toggleAttribute('aria-current', a.dataset.tab === tab));
  view.scrollTo(0, 0); window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
  enter();
  if (key === 'c') slidesDots();
  if (key === 'p') podcast(PIECES[id]);
  if (key === 'v') video(PIECES[id]);
}
addEventListener('hashchange', route);

// entrate "da piatto a volume" del sistema Tessera
function enter() {
  requestAnimationFrame(() => requestAnimationFrame(() => view.querySelectorAll('.fz-entra').forEach(el => el.classList.add('is-in'))));
}

function slidesDots() {
  const box = view.querySelector('[data-slides]'), dots = view.querySelectorAll('.dots span');
  box.addEventListener('scroll', () => {
    const i = Math.round(box.scrollLeft / box.clientWidth);
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  }, { passive: true });
}
function podcast(p) {
  let t = 0, on = false; const total = p.minutes * 60;
  const btn = view.querySelector('[data-play]'), bar = view.querySelector('[data-progress]'), time = view.querySelector('[data-time]');
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  btn.onclick = () => {
    on = !on;
    btn.innerHTML = ic(on ? 'pause' : 'play', true); btn.setAttribute('aria-label', on ? 'Pause' : 'Play');
  };
  timers.push(setInterval(() => { // shortcut: niente audio vero, l'avanzamento è finto (10 s di episodio per ogni secondo)
    if (!on) return;
    t = Math.min(total, t + 2.5); bar.style.width = (t / total * 100) + '%'; time.textContent = `${fmt(t)} / ${fmt(total)}`;
  }, 250));
}
function video(p) {
  const cap = view.querySelector('[data-caption]'), btn = view.querySelector('[data-vplay]');
  let i = 0, on = true;
  const show = () => {
    const words = p.captions[i % p.captions.length];
    cap.innerHTML = words.map((w, k) => `<span${k === words.length - 1 ? ' class="key"' : ''}>${w}</span>`).join(' ');
    cap.classList.remove('pop'); void cap.offsetWidth; cap.classList.add('pop');
    i++;
  };
  show();
  timers.push(setInterval(() => on && show(), 1100));
  btn.onclick = () => { on = !on; btn.innerHTML = ic(on ? 'pause' : 'play', true); btn.setAttribute('aria-label', on ? 'Pause' : 'Play'); };
}

// ---------- foglio dal basso e avvisi ----------
const sheet = $('#sheet');
function openSheet(html) {
  sheet.innerHTML = `<div class="sheet-bg" data-close></div><div class="sheet-card" role="dialog" aria-modal="true">${html}</div>`;
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('open'));
  sheet.querySelector('button')?.focus();
}
function closeSheet(now) {
  if (sheet.hidden) return;
  sheet.classList.remove('open');
  if (now) sheet.hidden = true; else setTimeout(() => { sheet.hidden = true; }, 250);
}
const toast = $('#toast');
let toastTimer;
function showToast(html, to) {
  toast.innerHTML = to ? `<a href="${to}">${html}</a>` : html;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('open'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove('open'); setTimeout(() => { toast.hidden = true; }, 300); }, 5000);
}
toast.addEventListener('click', () => toast.classList.remove('open'));

// ---------- tocchi ----------
document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-close]');
  if (!t) return;
  const d = t.dataset;
  if ('close' in d) return closeSheet();
  if (d.follow) {
    const st = d.follow, on = !S.follows.includes(st);
    S.follows = on ? [...S.follows, st] : S.follows.filter(x => x !== st);
    save();
    document.querySelectorAll(`[data-follow="${st}"]`).forEach(b => b.outerHTML = followBtn(st));
    if (on) {
      showToast(`${ic('check-circle', true)} <span><b>Following ${STORIES[st].title}</b><small>We'll tell you when something changes</small></span>`);
      if (freshFor(st)) setTimeout(() => showToast(`${ic('bell-ringing', true)} <span><b>New on a story you follow</b><small>${STORIES[st].updates.find(u => u.fresh).text}</small></span>`, `#/s/${st}`), 4500);
    }
    return;
  }
  if (d.term) {
    const term = TERMS[d.term];
    S.minutes += 1; save();
    return openSheet(`<div class="def-head"><h2>${d.term}</h2><span class="pill">Zanichelli dictionary</span></div><p>${term.def}</p>
      <button class="deep" data-deep="${d.term}">${ic('books')} <span><b>Go deeper: ${term.deep}</b><small>Zanichelli card · ${term.min} min</small></span>${ic('caret-right')}</button>`);
  }
  if (d.deep) { S.minutes += TERMS[d.deep].min; save(); closeSheet(); return showToast(`${ic('books')} <span><b>Zanichelli card added to your reading</b><small>+${TERMS[d.deep].min} min of deep dive</small></span>`); }
  if ('sign' in d) { S.signed = true; save(); closeSheet(); if (location.hash.startsWith('#/you')) route(); return showToast(`${ic('check-circle', true)} <span><b>Progress saved</b><small>No password needed</small></span>`); }
  if ('save' in d) return saveSheet();
  if (d.service) return showToast(`${ic(SERVICES[d.service].icon)} <span><b>${SERVICES[d.service].title}</b><small>In the real app this opens the ${d.service === 'plus' ? 'subscription' : d.service === 'event' ? 'ticket' : 'course'} page</small></span>`);
  if ('start' in d) { S.quiz = { i: 0, answers: [] }; save(); return route(); }
  if (d.answer !== undefined && S.quiz) { S.quiz.answers[S.quiz.i] = +d.answer; save(); return route(); }
  if ('next' in d) {
    if (S.quiz.i < 4) S.quiz.i++;
    else { S.quiz.done = true; S.quiz.score = S.quiz.answers.filter((a, i) => a === QUIZ.questions[i].ok).length; S.streak += 1; }
    save(); return route();
  }
  if ('reset' in d) { S = fresh(); save(); location.hash = ''; return route(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

route();
