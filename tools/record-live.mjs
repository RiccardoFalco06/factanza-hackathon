// Registra la diretta in demo/recorded.json: la demo la usa quando il server non risponde (es. su Vercel a Mac spento).
// Uso: npm start, poi `npm run reset-live`, aspetta 5 minuti (tutti gli aggiornamenti usciti) e `node tools/record-live.mjs`.
// Tiene solo i commenti finti (bot): quelli scritti da persone vere non finiscono nel repo.
import { writeFileSync } from 'node:fs';

const base = `http://127.0.0.1:${process.env.PORT || 8790}`;
const get = path => fetch(base + path).then(r => { if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); });

const { events } = await get('/api/state');
const comments = {};
for (const [id, ev] of Object.entries(events)) {
  for (const [i, u] of ev.updates.entries()) {
    const list = (await get(`/api/comments?event=${encodeURIComponent(id)}&upd=${i}`)).comments.filter(c => c.bot);
    comments[`${id}:${i}`] = list;
    const last = list.at(-1);
    u.comments = list.length;
    u.last = last ? { id: last.id, name: last.name, color: last.color, text: last.text, bot: true, ts: last.ts } : null;
  }
}
console.assert(Object.values(comments).flat().every(c => c.bot), 'solo commenti bot');
writeFileSync(new URL('../demo/recorded.json', import.meta.url), JSON.stringify({ events, comments }));
console.log('demo/recorded.json:', Object.keys(events).length, 'eventi,', Object.values(comments).flat().length, 'commenti');
