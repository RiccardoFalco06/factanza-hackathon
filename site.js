// Comportamento del sito di presentazione. Quando ci sono demo e video basta riempire queste due righe.
const DEMO_URL = '';   // link fisso della demo, se un giorno ce n'è uno. Vuoto = la demo dello stesso indirizzo del sito (server sul Mac o tunnel).
const VIDEO_SRC = '';  // file del video registrato con Recordly (es. assets/demo.mp4). Vuoto = segnaposto.

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = x => Math.min(1, Math.max(0, x));

// --- link e QR della chiusura ---
// aperto come file dal Desktop non c'è un indirizzo da inquadrare: il QR aspetta il link della demo
const local = location.protocol === 'file:';
const url = DEMO_URL || (local ? '' : location.origin + '/demo/');
document.getElementById('demo-link').href = url || '#try';
// scritte che dipendono dalla lingua (i18n.js): rifatte a ogni cambio
function labels() {
  document.getElementById('demo-url').textContent = url ? url.replace(/^https?:\/\//, '') : msg('demoSoon');
  document.getElementById('qr-label').textContent = msg(url ? 'qrScan' : 'qrSoon');
}
labels();
document.addEventListener('langchange', labels);
if (window.qrcode && url) {
  const qr = qrcode(0, 'M'); // dimensione automatica, correzione media: si legge anche proiettato
  qr.addData(url);
  qr.make();
  document.getElementById('qr').innerHTML = qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  document.querySelector('#qr svg path')?.setAttribute('fill', '#1a1d56');
}

// --- video ---
if (VIDEO_SRC) {
  const v = Object.assign(document.createElement('video'), { src: VIDEO_SRC, controls: true, playsInline: true, preload: 'metadata' });
  v.setAttribute('aria-label', 'Video della demo');
  document.getElementById('frame').replaceChildren(v);
}

// --- barra in alto: prende il fondo appena si scorre ---
const bar = document.getElementById('top');

// --- movimenti legati allo scorrimento, come su recordly.dev ---
// il riquadro del video cresce mentre arriva; ogni slide si rimpicciolisce e si scurisce quando la successiva le passa sopra
const frame = document.getElementById('frame');
const slides = [...document.querySelectorAll('.slide')];
let ticking = false;
function onScroll() {
  ticking = false;
  bar.classList.toggle('is-scrolled', scrollY > 8);
  if (still) return;
  const vh = innerHeight;
  const r = frame.getBoundingClientRect();
  frame.style.setProperty('--grow', clamp01((vh - r.top) / (vh * 0.75)).toFixed(3));
  if (getComputedStyle(slides[0]).position !== 'sticky') return; // su telefono le slide non si impilano
  slides.forEach((s, i) => {
    const next = slides[i + 1];
    if (!next) return;
    const stick = parseFloat(getComputedStyle(s).top);
    const gap = next.getBoundingClientRect().top - stick;
    s.style.setProperty('--cover', clamp01(1 - gap / s.offsetHeight).toFixed(3));
  });
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', onScroll);
onScroll();

// --- entrate "da piatto a volume" (regole in DESIGN.md) ---
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}), { threshold: 0.25 });
document.querySelectorAll('.fz-entra').forEach(el => io.observe(el));

// --- quiz della slide 3: si può provare davvero ---
// un solo ascoltatore sul riquadro: i bottoni vengono riscritti quando si cambia lingua
document.getElementById('quiz').addEventListener('click', e => {
  const b = e.target.closest('.opz');
  if (!b) return;
  const ok = b.dataset.ok === '1';
  document.querySelectorAll('#quiz .opz').forEach(o => { o.classList.toggle('giusta', o.dataset.ok === '1'); o.classList.remove('sbagliata'); });
  b.classList.toggle('sbagliata', !ok);
  document.querySelector('#quiz .esito').textContent = msg(ok ? 'quizOk' : 'quizNo');
});
document.addEventListener('langchange', () => document.querySelectorAll('#quiz .opz').forEach(o => o.classList.remove('giusta', 'sbagliata')));
