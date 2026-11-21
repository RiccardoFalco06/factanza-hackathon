// Lingue del sito. L'inglese è quello scritto in index.html (lingua di base); qui c'è l'italiano per ogni [data-t].
// I testi possono contenere HTML (icone, evidenziatori): vengono messi così come sono, sono scritti da noi.
const IT = {
  _title: "Una notizia tira l'altra · Hackathon Factanza",
  _desc: "Prototipo per la Challenge 2 dell'Hackathon Factanza: approfondimenti con Zanichelli, quiz, contenuti collegati e storie da seguire, per far restare le persone su Factanza.",
  'brand': "Una notizia tira l'altra",
  'brand.aria': 'Torna su',
  'nav.video': 'Video', 'nav.how': 'Come funziona', 'nav.path': 'Il percorso', 'nav.faq': 'Domande',
  'cta.top': 'Prova la demo',
  'hero.eyebrow': 'Hackathon Factanza · Challenge 2',
  'hero.title': 'Una notizia tira l\'altra.<br><span class="fz-adesivo">E resti su Factanza</span>',
  'hero.lead': "Approfondimenti con Zanichelli, quiz, contenuti collegati e storie da seguire: ogni minuto in più sulla piattaforma avvicina le persone ai servizi di Factanza, dall'Academy all'abbonamento.",
  'hero.cta1': 'Prova la demo', 'hero.cta2': 'Guarda il video',
  'video.eyebrow': 'La demo in 90 secondi', 'video.title': 'Guarda come funziona',
  'video.note': 'Registrato sul prototipo vero, senza tagli.', 'video.wait': 'Il video della demo arriva qui',
  'how.eyebrow': 'I quattro pezzi',
  'how.title': 'Entri per una notizia, <span class="fz-evidenzia">resti</span> per il resto',
  's1.bar': 'Arrivi da Instagram', 's1.pill': 'Nessuna registrazione',
  's1.cover': 'Legge di bilancio 2027: <span>cosa cambia</span> per chi ha 25 anni', 's1.coverMeta': 'Carosello · 1 min',
  's1.next': 'Continua con',
  's1.l1t': "Squattrinati · L'affitto a 25 anni", 's1.l1m': 'Podcast · 12 min',
  's1.l2t': 'Il bonus affitti in 60 secondi', 's1.l2m': 'Video · 1 min',
  's1.save': 'Hai visto 3 contenuti. Salvi i progressi?', 's1.saveBtn': 'Un tocco <i class="ph-bold ph-apple-logo"></i>',
  's1.tag': 'Tutto collegato, zero attriti',
  's1.h': 'Da Instagram dentro Factanza con un tocco, e ogni contenuto porta al prossimo.',
  's1.p': "Si entra senza registrarsi e si riprende da dove si era rimasti. Sotto ogni carosello ci sono il podcast, il video e l'approfondimento sullo stesso tema. L'account si chiede dopo, quando c'è già qualcosa da salvare.",
  's2.meta': 'Economia · 4 min',
  's2.text': 'Per finanziare il bonus il governo conta su uno <mark class="parola">spread</mark> più basso nei prossimi mesi, cioè su interessi più leggeri da pagare sul debito.',
  's2.pill': 'Dizionario Zanichelli',
  's2.def': 'Differenza di rendimento fra i titoli di Stato di due Paesi, usata per misurare la fiducia dei mercati.',
  's2.link': '<i class="ph-bold ph-books"></i> Approfondisci: perché lo spread conta per il tuo mutuo <small>scheda Zanichelli · 3 min</small>',
  's2.tag': 'Approfondimenti Zanichelli',
  's2.h': 'Una parola difficile non è più un motivo per uscire.',
  's2.p': 'Tocchi un termine e la definizione del dizionario Zanichelli si apre lì, senza cambiare pagina. Chi vuole andare a fondo trova la scheda di approfondimento: più tempo sul contenuto, più fiducia nella fonte.',
  's3.meta': 'Quiz della settimana · 3 di 5', 's3.streak': '<i class="ph-fill ph-fire"></i> 4 settimane di fila',
  's3.q': 'Fino a che età si può chiedere il nuovo bonus affitti?',
  's3.o1': '25 anni', 's3.o2': '31 anni', 's3.o3': '35 anni',
  's3.hint': 'Prova: tocca una risposta.',
  's3.tag': 'Quiz',
  's3.h': 'Cinque domande sulle notizie della settimana. E una serie da non rompere.',
  's3.p': 'Il quiz trasforma quello che hai letto in un gioco di due minuti. La serie di settimane di fila e il confronto con la community fanno tornare ogni lunedì, e ogni risposta rimanda al contenuto che la spiega.',
  's4.notTitle': 'Novità sulla storia che segui', 's4.notMeta': 'Legge di bilancio 2027 · il Senato ha votato',
  's4.story': 'Legge di bilancio 2027', 's4.follow': '<i class="ph-bold ph-check"></i> Segui',
  's4.t1': '<b>Oggi</b> Il Senato approva il testo: cosa resta del bonus affitti <em>Nuovo</em>',
  's4.t2': '<b>12 novembre</b> Le modifiche della Camera, spiegate',
  's4.t3': '<b>3 novembre</b> La prima bozza in 1 minuto',
  's4.tag': 'Storie seguite',
  's4.h': 'Segui una storia e Factanza ti richiama quando cambia qualcosa.',
  's4.p': "Le notizie lunghe (una legge, un'elezione, una guerra) diventano una linea del tempo da seguire. Ogni aggiornamento è un motivo concreto per tornare, e chi torna spesso è chi si abbona.",
  'path.eyebrow': "L'obiettivo",
  'path.title': 'Ogni minuto in più porta ai <span class="fz-evidenzia">servizi di Factanza</span>',
  'path.1b': 'Arriva per una notizia', 'path.1s': '1 minuto, da Instagram o TikTok',
  'path.2b': 'Approfondisce', 'path.2s': '+4 minuti con podcast e schede Zanichelli',
  'path.3b': 'Gioca', 'path.3s': '+2 minuti a settimana con il quiz',
  'path.4b': 'Torna', 'path.4s': '3 volte a settimana per le storie seguite',
  'path.5b': 'Scopre i servizi', 'path.5s': 'Academy, abbonamento, eventi, shop',
  'path.note': "Tempi di esempio, da misurare nella prova. L'idea: più tempo e più ritorni vogliono dire più occasioni per proporre l'Academy e l'abbonamento a chi è già coinvolto.",
  'faq.eyebrow': 'Domande', 'faq.title': 'Quello che ci chiederete',
  'faq.q1': 'Perché Zanichelli?',
  'faq.a1': "Porta l'autorevolezza di un dizionario che tutti conoscono da scuola, e Factanza non deve scrivere da zero le definizioni. La collaborazione nel prototipo è un'ipotesi da proporre.",
  'faq.q2': 'I quiz non sono troppo scolastici?',
  'faq.a2': 'Sono cinque domande a settimana, con il tono di Factanza e una serie da tenere viva. Più gioco che compito, e ogni risposta porta al contenuto che la spiega.',
  'faq.q3': 'Perché non chiedere subito la registrazione?',
  'faq.a3': "Ogni schermata in più all'ingresso fa perdere persone. Si entra subito e l'account si chiede quando c'è già qualcosa da salvare: progressi, quiz, storie seguite.",
  'faq.q4': 'Come si guadagna?',
  'faq.a4': "Chi resta più a lungo e torna spesso vede l'Academy, l'abbonamento e gli eventi nel momento giusto. In più gli spazi dentro quiz e storie possono ospitare partner coerenti con il tema.",
  'try.eyebrow': 'Tocca a te', 'try.title': 'Prova la demo',
  'try.lead': 'Inquadra il codice con il telefono: apri una notizia, fai il quiz e segui la tua prima storia.',
  'try.btn': 'Apri la demo', 'try.qrAria': 'Codice QR per aprire la demo',
  'foot.1': "Progetto per l'Hackathon Factanza · Challenge 2",
  'foot.2': 'Notizie, numeri e collaborazioni in questa pagina sono di esempio.',
};

// testi usati da site.js, nelle due lingue
const MSG = {
  en: { demoSoon: 'Demo link coming soon', qrScan: 'Scan to try it', qrTemp: 'Temporary: opens this page', qrSoon: 'QR code coming with the demo link',
        quizOk: 'Correct! You beat 72% of the community.', quizNo: "Close: it's 31. Here's the carousel that explains it." },
  it: { demoSoon: 'Link della demo in arrivo', qrScan: 'Inquadra per provare', qrTemp: 'Provvisorio: apre questa pagina', qrSoon: 'Il QR arriva con il link della demo',
        quizOk: 'Giusto! Hai fatto meglio del 72% della community.', quizNo: 'Quasi: è 31 anni. Ti lasciamo il carosello che lo spiega.' },
};

const EN = {}; // l'inglese originale della pagina, letto al primo cambio
let lang = 'en';
const msg = k => MSG[lang][k];

function setLang(next) {
  lang = next === 'it' ? 'it' : 'en';
  document.documentElement.lang = lang;
  const desc = document.querySelector('meta[name="description"]');
  EN._title ??= document.title; EN._desc ??= desc.content;
  document.title = lang === 'it' ? IT._title : EN._title;
  desc.content = lang === 'it' ? IT._desc : EN._desc;
  document.querySelectorAll('[data-t]').forEach(el => {
    const k = el.dataset.t;
    EN[k] ??= el.innerHTML;
    el.innerHTML = lang === 'it' ? (IT[k] ?? EN[k]) : EN[k];
  });
  document.querySelectorAll('[data-t-aria]').forEach(el => {
    const k = el.dataset.tAria;
    EN[k] ??= el.getAttribute('aria-label');
    el.setAttribute('aria-label', lang === 'it' ? (IT[k] ?? EN[k]) : EN[k]);
  });
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  try { localStorage.setItem('fz-lang', lang); } catch { /* navigazione privata: resta per questa visita */ }
  document.dispatchEvent(new Event('langchange'));
}

document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
// ?lang=it nel link vince sulla scelta salvata; senza niente resta l'inglese
const asked = new URLSearchParams(location.search).get('lang');
let saved = null;
try { saved = localStorage.getItem('fz-lang'); } catch { /* niente */ }
if ((asked || saved) === 'it') setLang('it');

// controllo: ogni testo da tradurre ha la sua versione italiana
const missing = [...document.querySelectorAll('[data-t]')].map(e => e.dataset.t).concat([...document.querySelectorAll('[data-t-aria]')].map(e => e.dataset.tAria)).filter(k => !(k in IT));
console.assert(!missing.length, 'i18n: manca l\'italiano per', missing);
