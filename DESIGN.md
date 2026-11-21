# Factanza · sistema "Tessera" (landing dell'hackathon)

Il riferimento per tutta la UI e la UX della landing. Token pronti in `tokens.css`, tavola visiva in
`design-system.html` (anteprima: `cd ~/Projects/factanza-landing && python3 -m http.server 8791`, poi
http://127.0.0.1:8791/design-system.html). Ricerca fatta il 2026-11-21.

**Lettura del progetto:** landing di presentazione per una giuria (Factanza e partner) e per la community
Gen Z di Factanza. Stile giocoso ma ordinato, che parte dal logo 3D. Livelli secondo la skill di design:
varietà 6, movimento 6, densità 3.

## 1. Cosa fa già Factanza (ricerca)

Fonti: factanza.com (pagine, CSS del tema, libreria immagini), TikTok @factanza, interviste
(DiLei, Money.it, Fortune Italia, Reuters Institute). Instagram non è stato leggibile: chiede di confermare
l'account e il lettore automatico vuole l'accesso. Al suo posto ho usato le copertine dei caroselli, che sono
nella libreria immagini del sito (`assets/riferimenti/copertine-caroselli.png`).

- **Chi sono:** media company nata su Instagram nel 2019/2020 (Bianca Arrighini e Livia Viganò). Dicono di
  avere circa 1 milione di utenti under 35: oltre 700 mila su Instagram, oltre 300 mila su TikTok
  (474,8 mila sul profilo il 21/11), 200 mila ascoltatori al mese per i podcast. Fanno caroselli, video,
  podcast (Squattrinati, Vitamine, Rewind, A Carte Scoperte), la newsletter "Weekly Pills", l'Academy,
  gli eventi, uno shop e un abbonamento.
- **Voce** (dal manifesto): "accessibile ma non semplicistico", "Ti spieghiamo il mondo in 1 minuto",
  "L'informazione che crea (in)dipendenza". Danno del tu, usano ironia e giochi di parole, POV e meme
  nei caroselli. Sui valori (inclusione, sostenibilità, diritti) cercano "le parole giuste".
- **Sito:** fondo viola `#824dff`. Divisori a nuvole fatti di cerchi enormi, collage di foto in bianco e
  nero scontornate con un dettaglio fluo (capelli rosa, cappello verde). Titoli misti: una parola normale
  ("Scopri") e una in maiuscolo stretto su un adesivo inclinato con ombra piena ("I NOSTRI CONTENUTI").
  Bottoni bianchi con bordo e ombra piena di 2-4 px. Barra di navigazione a pillola, una striscia che
  scorre ("abbonati a factanza") e il team mostrato come Memoji su tessere colorate.
- **Tavolozza ufficiale** (nomi dal loro CSS): primary-purple `#824dff`, primary-violet `#6015ff`,
  primary-blue `#4909ff`, primary-blue-light `#86c4ff`, primary-turchese `#31ceff`, primary-fucsia
  `#ff4bcd`, primary-magenta `#fd4ea9`, primary-indaco `#e6a0ff`, primary-green-light `#bcff94`,
  primary-green-acid `#adf919`, primary-orange-light `#ffc630`, primary-orange-dark `#fc6f21`,
  primary-yellow-dark `#ffeb38`, secondary-blue-dark `#1b1d53`, secondary-black `#332804`,
  secondary-background `#f6f6f6`.
- **Caratteri:** Neue Montreal (testi, 116 usi nel CSS), gazzetta-variable da Adobe Fonts (maiuscolo stretto,
  26 usi), Agrandir (titoli morbidi, 9 usi). Sono tutti a pagamento.
- **Movimento sul sito:** comparsa dal basso in 0,6 s, entrata "a molla" (`cubic-bezier(.68,-.55,.265,1.55)`),
  striscia che scorre, rotazioni lente infinite delle decorazioni, "tada" sulle icone. Passaggi di 0,2 s.
- **Caroselli Instagram (1080×1350):** un colore pieno e saturo per copertina, a volte con grana. Titolo grande
  in maiuscolo stretto o in sans, e **una parola chiave** evidenziata (colore, pennarello, cerchio a mano).
  Foto scontornate e mascotte. **La piccola F 3D è in basso a sinistra su ogni copertina.**
- **TikTok:** l'avatar è la F 3D su cerchio azzurro. Video con mezzo schermo di filmato e mezzo di chi parla,
  sottotitoli bianchi maiuscoli al centro con la parola chiave in giallo.

## 2. L'idea che tiene insieme tutto

La F 3D è fatta di **tessere quadrate di colore, a spigolo vivo, sopra uno spessore blu notte**. Il sito
di Factanza ha già il gemello di questa idea: l'ombra piena sui bottoni e sugli adesivi. Qui le due cose
diventano una regola sola:

> **Ogni pezzo della pagina è una tessera con il suo spessore.** L'ombra piena blu notte, verso destra in
> basso, è il corpo della F che sporge.

E il movimento copia l'avvio del logo: **ogni elemento arriva piatto e poi prende spessore.**

## 3. Colori

| Ruolo | Colore | Uso | Contrasto |
|---|---|---|---|
| Azzurro | `#86c4ff` | fondo dell'apertura, come dietro al logo (= primary-blue-light) | blu notte sopra 8,4:1 |
| Blu notte | `#1a1d56` | testo, bordi, spessori, fondo della sezione video (≈ secondary-blue-dark) | bianco sopra 15,5:1 |
| Carta | `#f6f6f6` | fondo delle sezioni di lettura (= secondary-background) | blu notte sopra 14,4:1 |
| Bianco | `#ffffff` | faccia di riquadri e bottoni | |
| Viola | `#824dff` | solo la chiusura, per legarsi a factanza.com | bianco sopra 4,7:1 |
| Testo secondario | `#4a4d7a` | descrizioni su carta e bianco | 7,4:1 |

**Le 10 tessere** della favicon, in ordine: `#d7007f` `#831f82` `#0075bf` `#009fe3` `#00aca9` `#009469`
`#c8d400` `#ffe000` `#f7a600` `#ea5b0c`.

- Si usano **piccole**: numeri dei passi, adesivi, evidenziatore, la fila, segnaposto. Mai come fondo di una
  sezione intera.
- **Giallo `#ffe000`** è l'accento di lavoro (evidenziatore, bottone principale): con il blu notte fa 11,7:1.
- Se servono più tessere in fila, seguono l'ordine della ruota: il passo 1 è magenta, il 2 ciano, il 3 giallo.
- Testo bianco solo su blu notte, viola, prugna, blu e verde. Mai su fucsia, arancio o giallo.

## 4. Caratteri

I font di Factanza sono a pagamento. Al loro posto due alternative gratuite che ne tengono il carattere:

| Ruolo | Font | Al posto di | Regole |
|---|---|---|---|
| Titolone, adesivo, occhiello | **Anton** (Google Fonts, un solo peso; Big Shoulders scartato: M con le fessure chiuse) | gazzetta | sempre maiuscolo, interlinea 0,9-0,95 |
| Titoli e testo | **Satoshi** 400/500/700 (Fontshare, gratis anche per uso commerciale) | Neue Montreal e Agrandir | titoli 700 con spaziatura −2%; testo 400, interlinea 1,55, massimo 62 caratteri per riga |

- Scala: titolone `clamp(3rem, 8vw, 6.5rem)` · titolo `clamp(2rem, 4vw, 3rem)` · sottotitolo 1,35rem ·
  testo 1,0625rem · occhiello 0,95rem con spaziatura +6%.
- **Una parola chiave per titolo**, evidenziata in giallo (`.fz-evidenzia`) o messa su un adesivo
  (`.fz-adesivo`), come nei caroselli.
- Se Factanza vi dà il suo kit con i font veri, basta cambiare `--fz-font` e `--fz-font-display` in `tokens.css`.
- Per la pagina finale conviene ospitare i font insieme al sito invece di caricarli da Google e Fontshare.

## 5. Forme

- **Modulo:** la tessera da 8 px. Spazi e misure sono multipli (8, 16, 24, 48, 96).
- **Raggi:** le tessere sono a spigolo vivo, come nel logo. Tutto il resto (riquadri, bottoni, adesivi,
  riquadro del video) ha **6 px**. Niente pillole e niente cerchi grandi.
- **Spessore:** ombra piena blu notte, verso destra in basso. 3 px per bottoni e tessere, 6 px per riquadri
  e adesivi, 10 px per il video (lì in giallo, sul fondo blu notte). Mai ombre sfumate.
- **Bordo:** 2 px blu notte sui riquadri e i bottoni chiari.
- **Componenti** (`tokens.css`): `.fz-btn` (bianco, `--primario` giallo, `--scuro`), `.fz-adesivo`
  (inclinato −2°), `.fz-riquadro`, `.fz-tessera`, `.fz-fila` (la barra in alto della F come separatore o
  avanzamento), `.fz-evidenzia`, `.fz-occhiello`.
- **Al posto delle nuvole** del sito di Factanza c'è la fila di tessere: le nuvole sono tonde, il logo è quadrato.
- **Immagini:** foto in bianco e nero scontornate con un solo dettaglio nel colore di una tessera, come i
  collage di Factanza. Le notizie e le persone degli esempi sono inventate (si può dire nella landing).

## 6. Movimento

| Token | Valore | Dove |
|---|---|---|
| `--fz-ease-turn` | `cubic-bezier(.65,0,.35,1)` | entrate e giri, stessa curva del logo |
| `--fz-ease-pop` | `cubic-bezier(.34,1.56,.64,1)` | lo spessore che spunta, hover dei bottoni |
| tempi | 120 ms click · 220 ms hover · 600 ms entrata · 60 ms fra una tessera e l'altra | |
| logo | 0,7 s piatto, poi 1,8 s di giro fino alla posa 3D | `HOLD` e `TURN` in `logo3d.js` |

- **Da piatto a volume** (`.fz-entra` + `.is-in` dato da un IntersectionObserver): l'elemento sale di 16 px
  comparendo piatto e, 350 ms dopo, spunta lo spessore. In una fila le tessere arrivano a cascata (`--i`).
- **Bottoni:** passando sopra si alzano di 2 px e lo spessore cresce; al click si schiacciano e lo perdono.
  Non mettere `.fz-entra` sul bottone stesso (sovrascrive le sue transizioni): mettilo sul contenitore.
- **Niente animazioni infinite**, a parte l'oscillazione lenta del logo. La striscia che scorre del sito
  si può usare una volta sola (per esempio per i titoli delle notizie inventate).
- Con "riduci movimento" attivo tutto compare subito, già con lo spessore; il logo resta fermo nella posa 3D.

## 7. Struttura della landing (formato deciso da Riccardo)

1. **Apertura** su azzurro: logo 3D a destra, titolo a sinistra (non centrato), fila di tessere in fondo.
2. **Video della demo** su blu notte, riquadro con spessore giallo da 10 px.
3. **I passi non mostrabili nel video** su carta: riquadri con tessere numerate nei colori della ruota.
4. **Chiusura** su viola: una frase e il bottone giallo "Prova il prototipo".

Fatto in `index.html`, `site.css`, `site.js`. Fra il video e i passi le slide si impilano come su recordly.dev
(su telefono no). Link della demo e video si mettono in cima a `site.js` (`DEMO_URL`, `VIDEO_SRC`).

Lingua: inglese di base (testi in `index.html`), italiano in `i18n.js` con l'interruttore EN/IT; `?lang=it` apre in italiano.
Titoli con evidenziatore: interlinea 1,2, altrimenti il giallo copre le lettere con la gamba (g, p, q).

## 8. Sì / No

- Sì: una parola evidenziata per titolo; spigoli vivi solo sulle tessere; spessori sempre pieni e verso destra
  in basso; entrate da piatto a volume; testi brevi, con il tu.
- No: ombre sfumate, gradienti, vetro smerigliato; sezioni intere nel colore di una tessera; testo bianco su
  fucsia, arancio o giallo; scritte "scorri"; più di un bottone principale per schermata.

## 9. Riferimenti salvati

`assets/riferimenti/` contiene le foto del sito e le copertine dei caroselli. Sono materiale di Factanza:
servono come riferimento in locale e non vanno pubblicati.
