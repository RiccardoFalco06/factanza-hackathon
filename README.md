# One story leads to another · Hackathon Factanza, Challenge 2

Sito di presentazione e demo dell'app. Contenuti, numeri e collaborazione con Zanichelli sono **di esempio**.

## Link
- **Demo dell'app (telefono e PC):** https://factanza-demo.vercel.app/demo/ (da zero: https://factanza-demo.vercel.app/demo/?reset=1)
- **Sito di presentazione:** https://factanza-demo.vercel.app
- **Sistema di design:** https://factanza-demo.vercel.app/design-system.html

La demo segue eventi in diretta (news e gossip) insieme alla community: commenti sugli aggiornamenti, condivisione,
"Follow" che fissa l'evento in Home accanto al quiz, notifiche, e i servizi Factanza dentro l'app (podcast, The Social
Contract, Academy, libri, newsletter). La diretta e i commenti girano solo quando il server è acceso sul Mac di
Riccardo (`npm start` + `npm run share`, vedi `server/README.md`); dati su Supabase.

| Cosa | Dove |
|---|---|
| Sito (landing, video, slide, QR) | `index.html`, `site.css`, `site.js`, `i18n.js` (italiano), `logo3d.js` (F in 3D) |
| Demo app (inglese) | `demo/` — `data.js` contenuti, eventi live in `server/events.mjs` |
| Server della diretta | `server/` — Node senza dipendenze, Supabase, tunnel + Vercel |
| Sistema di design "Tessera" | `DESIGN.md`, `tokens.css`, `design-system.html` |

## Provarlo sul proprio computer
```bash
npm install
npm start          # serve server/data/supabase.json (chiedilo a Riccardo, non è nel repo)
```
Poi apri http://127.0.0.1:8790 (sito) e http://127.0.0.1:8790/demo/?reset=1 (demo da zero).

## File unico da mandare (si apre con doppio clic, anche offline)
```bash
npm run export   # crea ~/Desktop/Factanza sito.html
```

## Da completare
- `site.js`: `VIDEO_SRC` (video registrato con Recordly). Il QR punta già alla demo dello stesso indirizzo.
