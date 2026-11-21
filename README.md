# One story leads to another · Hackathon Factanza, Challenge 2

Sito di presentazione e demo dell'app. Contenuti, numeri e collaborazione con Zanichelli sono **di esempio**.

| Cosa | Dove |
|---|---|
| Sito (landing, video, slide, QR) | `index.html`, `site.css`, `site.js`, `i18n.js` (italiano), `logo3d.js` (F in 3D) |
| Demo app (inglese) | `demo/` — `data.js` ha tutti i contenuti |
| Sistema di design "Tessera" | `DESIGN.md`, `tokens.css`, `design-system.html` |

## Provarlo sul proprio computer
```bash
npm install
python3 -m http.server 8791
```
Poi apri http://127.0.0.1:8791 (sito) e http://127.0.0.1:8791/demo/?reset=1 (demo da zero).

## File unico da mandare (si apre con doppio clic, anche offline)
```bash
npm run export   # crea ~/Desktop/Factanza sito.html
```

## Da completare
- `site.js`: `DEMO_URL` (link della demo online, per il QR) e `VIDEO_SRC` (video registrato con Recordly).
