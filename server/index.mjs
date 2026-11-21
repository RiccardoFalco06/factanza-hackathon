// Server della demo Factanza: serve il sito e la demo, salva commenti, reazioni e seguiti su Supabase e manda la diretta
// ai browser con Server-Sent Events. Nessuna libreria esterna: serve solo Node 22.
// Avvio: npm start   ·   Cambio computer: copia la cartella del progetto (con server/data/supabase.json) e rilancia npm start.
// Il database sta su Supabase (progetto factanza-hackathon): cambiare computer non sposta dati.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EVENTS, PEOPLE } from './events.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = process.env.FZ_DATA || join(ROOT, 'server', 'data');
const PORT = +process.env.PORT || 8790;
const CYCLE = (+process.env.FZ_CYCLE_MIN || 8) * 60_000; // ogni 8 minuti la diretta riparte da capo, così c'è sempre qualcosa che arriva

// accesso a Supabase: server/data/supabase.json (fuori da git) oppure variabili SUPABASE_URL, SUPABASE_KEY, FZ_SERVER_KEY
const CONF_FILE = join(DATA, 'supabase.json');
const CONF = existsSync(CONF_FILE) ? JSON.parse(readFileSync(CONF_FILE, 'utf8')) : {};
const SB = { url: process.env.SUPABASE_URL || CONF.url, key: process.env.SUPABASE_KEY || CONF.key, server: process.env.FZ_SERVER_KEY || CONF.server_key };
if (!SB.url || !SB.key || !SB.server) { console.error(`Manca l'accesso a Supabase: crea ${CONF_FILE} con url, key e server_key (vedi server/README.md).`); process.exit(1); }
const ADMIN = SB.server; // la stessa chiave serve per npm run reset-live

async function rpc(name, args = {}) {
  const r = await fetch(`${SB.url}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: SB.key, 'content-type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`supabase ${name}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.status === 204 ? null : r.json();
}

// ---------- la diretta ----------
const rome = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
let cycleStart = 0;
const released = {}; // evento → aggiornamenti della coda già usciti in questo giro
const items = id => [...EVENTS[id].updates, ...released[id]];
async function newCycle(now = Date.now()) {
  cycleStart = now;
  for (const id in EVENTS) released[id] = [];
  await rpc('new_cycle', { p_key: ADMIN, p_started: now, p_from: Object.fromEntries(Object.entries(EVENTS).map(([id, ev]) => [id, ev.updates.length])) });
}
function catchUp() { // la diretta riprende dal punto giusto del giro, senza mandare avvisi per quello già uscito
  for (const [id, ev] of Object.entries(EVENTS)) {
    released[id] = [];
    for (const u of ev.queue || []) if (Date.now() - cycleStart >= u.after * 1000) { const { after, ...rest } = u; released[id].push({ ...rest, time: rome.format(cycleStart + after * 1000) }); }
  }
}

const clients = new Set();
// registro delle ultime novità: chi non riceve il flusso (alcuni tunnel lo trattengono) le chiede ogni 2 secondi con /api/poll
const LOG = []; let seq = 0;
const pollers = new Map(); // id del telefono → ultima volta che ha chiesto
const viewers = () => clients.size + [...pollers.values()].filter(t => Date.now() - t < 10_000).length;
const send = (type, data) => {
  LOG.push({ seq: ++seq, type, data }); if (LOG.length > 300) LOG.shift();
  const line = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const c of clients) c.write(line);
};

let busy = false;
async function tick() {
  const now = Date.now();
  if (busy) return;
  if (now - cycleStart > CYCLE) { busy = true; try { await newCycle(now); send('reset', {}); } finally { busy = false; } return; }
  for (const [id, ev] of Object.entries(EVENTS)) {
    const queue = ev.queue || [];
    while (released[id].length < queue.length && now - cycleStart >= queue[released[id].length].after * 1000) {
      const { after, ...rest } = queue[released[id].length], u = { ...rest, time: rome.format(now), now: true };
      released[id].push(u);
      send('update', { event: id, idx: items(id).length - 1, update: u });
    }
  }
}

// la community di esempio commenta solo quando qualcuno guarda
let botAt = 0;
setInterval(() => {
  if (!viewers() || Date.now() < botAt) return;
  botAt = Date.now() + 2500 + Math.random() * 3500;
  const live = Object.keys(EVENTS).filter(id => EVENTS[id].live);
  const id = live[Math.floor(Math.random() * live.length)], ev = EVENTS[id];
  const n = items(id).length, upd = Math.random() < 0.75 ? n - 1 : Math.max(0, n - 2);
  const p = PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
  post(id, upd, p.name, p.c, ev.talk[Math.floor(Math.random() * ev.talk.length)], true).catch(e => console.error(e.message));
}, 500);
setInterval(() => rpc('prune_bots', { p_key: ADMIN, p_before: Date.now() - 3 * 3600_000 }).catch(e => console.error(e.message)), 600_000); // i commenti finti più vecchi di 3 ore si buttano

async function post(event, upd, name, color, text, bot) {
  const c = await rpc('add_comment', { p_key: ADMIN, p_event: event, p_upd: upd, p_name: name, p_color: color, p_text: text, p_bot: bot });
  const count = await rpc('count_comments', { p_event: event, p_upd: upd });
  send('comment', { event, upd, comment: c, count });
  return c;
}
const watching = id => EVENTS[id].watching ? EVENTS[id].watching + viewers() + Math.round(Math.sin(Date.now() / 9000 + id.length) * 37) : 0;
setInterval(() => { if (viewers()) send('watching', Object.fromEntries(Object.keys(EVENTS).map(id => [id, watching(id)]))); }, 4000);
const reactBase = upd => 40 + upd * 57;

async function state() {
  const [sum, counts] = await Promise.all([rpc('comment_summary'), rpc('counts')]);
  const by = {}; for (const r of sum) by[`${r.event}:${r.upd}`] = r;
  const reacts = {}; for (const r of counts.reacts) reacts[`${r.event}:${r.upd}`] = r.n;
  const follows = {}; for (const r of counts.follows) follows[r.event] = r.n;
  const events = {};
  for (const [id, ev] of Object.entries(EVENTS)) {
    const { queue, talk, ...rest } = ev;
    events[id] = { ...rest, watching: watching(id), followers: ev.followers + (follows[id] || 0),
      updates: items(id).map((u, i) => { const s = by[`${id}:${i}`]; return { ...u, comments: s ? +s.n : 0, reacts: reactBase(i) + (reacts[`${id}:${i}`] || 0),
        last: s ? { id: s.last_id, name: s.last_name, color: s.last_color, text: s.last_text, bot: s.last_bot, ts: +s.last_ts } : null }; }) };
  }
  return { events, cycleStart, cycle: CYCLE, seq };
}

// all'avvio: riprende il giro salvato su Supabase, oppure ne comincia uno nuovo; la prima volta mette i commenti di partenza
async function boot() {
  const counts = await rpc('counts');
  cycleStart = +(counts.cycle || 0);
  if (!cycleStart || Date.now() - cycleStart > CYCLE) await newCycle(); else catchUp();
  if (!(await rpc('comment_summary')).length) {
    for (const [id, ev] of Object.entries(EVENTS)) for (let i = 0; i < ev.updates.length; i++) for (let k = 0; k < 3; k++) {
      const p = PEOPLE[(i * 3 + k) % PEOPLE.length];
      await rpc('add_comment', { p_key: ADMIN, p_event: id, p_upd: i, p_name: p.name, p_color: p.c, p_text: ev.talk[(i * 2 + k) % ev.talk.length], p_bot: true });
    }
  }
  setInterval(() => tick().catch(e => console.error(e.message)), 1000);
}

// ---------- regole per i commenti veri ----------
const BAD = /\b(cazz\w*|stronz\w*|puttan\w*|troi\w*|frocio|negro|ritardat\w*|vaffanculo|coglion\w*|fuck\w*|shit|bitch|retard\w*|nigg\w*|fag\w*)\b/i;
const hits = new Map(); // ip → [tempi dei commenti recenti]
function allowed(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 60_000);
  if (list.length && now - list.at(-1) < 3000 || list.length >= 20) return false;
  list.push(now); hits.set(ip, list); return true;
}
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

// ---------- http ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
// solo questi file e cartelle sono visibili da fuori (niente database, chiavi, .git, riferimenti di Factanza)
const PUBLIC = [/^\/demo\//, /^\/vendor\//, /^\/assets\/(?!riferimenti\/)[^/]+$/, /^\/(index\.html|site\.css|site\.js|i18n\.js|logo3d\.js|tokens\.css|design-system\.html)$/];

const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
async function body(req) {
  let s = '';
  for await (const chunk of req) { s += chunk; if (s.length > 4096) throw new Error('too big'); }
  return JSON.parse(s || '{}');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = decodeURIComponent(url.pathname);
  const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
  try {
    if (path === '/api/state') return json(res, 200, await state());
    if (path === '/api/stream') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
      res.write(`retry: 3000\nevent: hello\ndata: {"seq":${seq}}\n\n`);
      clients.add(res);
      const ping = setInterval(() => res.write(': ping\n\n'), 20_000);
      req.on('close', () => { clearInterval(ping); clients.delete(res); });
      return;
    }
    if (path === '/api/poll') {
      const since = +url.searchParams.get('since') || 0, id = String(url.searchParams.get('c') || '').slice(0, 40);
      if (id) { pollers.set(id, Date.now()); if (pollers.size > 2000) pollers.clear(); }
      return json(res, 200, { seq, events: since > seq ? [] : LOG.filter(e => e.seq > since) });
    }
    if (path === '/api/comments' && req.method === 'GET') {
      const ev = url.searchParams.get('event'), upd = +url.searchParams.get('upd');
      if (!EVENTS[ev] || !(upd >= 0 && upd < items(ev).length)) return json(res, 404, { error: 'not found' });
      return json(res, 200, { comments: await rpc('list_comments', { p_event: ev, p_upd: upd, p_limit: 60 }) });
    }
    if (req.method === 'POST' && path.startsWith('/api/')) {
      const b = await body(req);
      if (path === '/api/comments') {
        const ev = b.event, upd = +b.upd, name = clean(b.name, 24) || 'Guest', text = clean(b.text, 200);
        if (!EVENTS[ev] || !(upd >= 0 && upd < items(ev).length) || !text) return json(res, 400, { error: 'Something is missing in your comment.' });
        if (BAD.test(text) || BAD.test(name)) return json(res, 422, { error: "Let's keep it kind: this comment was not published." });
        if (!allowed(ip)) return json(res, 429, { error: 'Easy! Wait a few seconds before the next comment.' });
        const c = await post(ev, upd, name, /^t([1-9]|10)$/.test(b.color) ? b.color : 't8', text, false);
        setTimeout(() => { // qualcuno della community risponde: la diretta è fatta di persone
          const p = PEOPLE[Math.floor(Math.random() * PEOPLE.length)];
          post(ev, upd, p.name, p.c, `@${name} ${['same here', 'totally agree', 'good point actually', 'haha yes', 'this!'][Math.floor(Math.random() * 5)]}`, true).catch(e => console.error(e.message));
        }, 2500 + Math.random() * 2000);
        return json(res, 200, { comment: c });
      }
      if (path === '/api/react' || path === '/api/follow') {
        const ev = b.event, d = b.on ? 1 : -1;
        if (!EVENTS[ev]) return json(res, 400, { error: 'unknown event' });
        if (path === '/api/follow') { const n = EVENTS[ev].followers + await rpc('bump_follow', { p_key: ADMIN, p_event: ev, p_d: d }); send('follow', { event: ev, n }); return json(res, 200, { n }); }
        const upd = +b.upd;
        if (!(upd >= 0 && upd < items(ev).length)) return json(res, 400, { error: 'unknown update' });
        const n = reactBase(upd) + await rpc('bump_react', { p_key: ADMIN, p_event: ev, p_upd: upd, p_d: d });
        send('react', { event: ev, upd, n });
        return json(res, 200, { n });
      }
      if (path === '/api/admin/reset') {
        if (req.headers['x-admin-key'] !== ADMIN) return json(res, 403, { error: 'forbidden' });
        await newCycle(); send('reset', {}); return json(res, 200, { ok: true });
      }
      return json(res, 404, { error: 'not found' });
    }
    // file statici
    if (path === '/' || path === '/demo') { res.writeHead(302, { location: path === '/' ? '/index.html' : '/demo/' }); return res.end(); }
    let file = normalize(path).replace(/\\/g, '/');
    if (file.endsWith('/')) file += 'index.html';
    if (file.includes('..') || !PUBLIC.some(r => r.test(file))) return json(res, 404, { error: 'not found' });
    const full = join(ROOT, file);
    if (!(await stat(full).catch(() => null))?.isFile()) return json(res, 404, { error: 'not found' });
    res.writeHead(200, { 'content-type': TYPES[extname(full).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(await readFile(full));
  } catch (e) {
    if (!(e.message === 'too big' || e instanceof SyntaxError)) console.error(e.message);
    json(res, e.message === 'too big' || e instanceof SyntaxError ? 400 : 500, { error: e.message.startsWith('supabase') ? 'The database is not answering, try again in a moment.' : 'bad request' });
  }
});
boot().then(() => server.listen(PORT, '127.0.0.1', () => {
  console.log(`Factanza demo: http://127.0.0.1:${PORT}/demo/  ·  sito: http://127.0.0.1:${PORT}/`);
  console.log(`database: ${SB.url}  ·  la diretta riparte ogni ${CYCLE / 60_000} minuti`);
})).catch(e => { console.error('Avvio fallito:', e.message); process.exit(1); });
