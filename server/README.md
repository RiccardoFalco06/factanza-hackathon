# Server della demo

Serve il sito (`/`) e la demo (`/demo/`), manda la diretta ai telefoni e salva commenti, reazioni e seguiti su
**Supabase** (progetto `factanza-hackathon`, Francoforte). Serve solo Node 22: nessuna libreria da installare.

## Avvio
```bash
npm start          # http://127.0.0.1:8790/demo/
npm run share      # (in un altro terminale) link pubblico per telefoni e QR, cambia a ogni avvio
npm run reset-live # fa ripartire la diretta da capo (lo fa anche da sola ogni 8 minuti)
```

## Cambiare computer
1. Copia la cartella del progetto **insieme a `server/data/supabase.json`** (non è su GitHub: contiene la chiave
   del server). In alternativa sul nuovo computer imposta `SUPABASE_URL`, `SUPABASE_KEY` e `FZ_SERVER_KEY`.
2. Installa Node 22 (`brew install node`) e, per il link pubblico, `brew install cloudflared`.
3. `npm start`. I dati sono su Supabase, quindi non si sposta nient'altro.

## Come è fatto
- `events.mjs`: gli eventi (aggiornamenti già usciti, quelli che arrivano in diretta, commenti di esempio).
- `index.mjs`: la diretta (un giro di 8 minuti uguale per tutti), i commenti finti mentre qualcuno guarda, le regole
  sui commenti veri (niente insulti, massimo un commento ogni 3 secondi), i file pubblici.
- Su Supabase le tabelle sono chiuse: si passa solo da funzioni che controllano i dati, e ogni scrittura chiede la
  chiave del server. La chiave pubblica da sola non basta per scrivere o cancellare.
