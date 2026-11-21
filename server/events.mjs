// Eventi da seguire insieme. Il server tiene una sola diretta per tutti: chi apre la demo vede gli stessi
// aggiornamenti e gli stessi commenti nello stesso momento.
// updates = già pubblicati; queue = arrivano in diretta "after" secondi dall'inizio del giro (vedi CYCLE in index.mjs).
// talk = commenti di esempio che la community finta scrive mentre qualcuno guarda.
// Fatti veri (verificati il 2026-11-21): bilancio 2027 in discussione; semifinale GF Vip spostata a lunedì 23/11,
// finale il 30/11, sondaggi con Piera davanti a Varsi e Andreas Müller terzo; Sanremo 2027 condotto da Stefano
// De Martino, annuncio dei 24 Big l'11/12 alle 21:30 su Rai 1 a "Sarà Sanremo", Festival dal 16 al 20/2.
// Tutto il resto (risultati, numeri dei voti, commenti, persone) è di esempio.

export const EVENTS = {
  budget: {
    kind: 'News', live: true, color: 't1', title: 'Budget 2027: the Senate votes', mark: 'votes', short: 'Budget 2027 live',
    image: 'media/senato.jpg', credit: 'Palazzo Madama · Wikimedia Commons, CC BY-SA 4.0',
    followers: 48200, watching: 2341,
    updates: [
      { time: '14:02', text: 'The session opens: 312 amendments on the table, the final vote is expected tonight.' },
      { time: '14:40', text: 'The rent bonus survives: up to €2,000 a year for renters under 31.', piece: 'c1' },
      { time: '15:15', text: 'Pensions slow everything down: the vote moves to after 17:00.' },
    ],
    queue: [
      { after: 25, text: 'The government calls a confidence vote: the result arrives within the hour.' },
      { after: 110, text: 'Approved: 112 yes, 76 no. The budget now goes back to the Chamber.', piece: 'v1', big: true },
      { after: 220, text: 'What changes for you, in 1 minute: our carousel is out.', piece: 'c1' },
    ],
    talk: ['Finally some news on the rent bonus', 'Does it count if the contract is shared with flatmates?', 'Squattrinati covered this last week, worth a listen',
      'Following from Bologna', 'So when does it actually start?', 'The spread card made this so much clearer', 'Under 31 here, fingers crossed',
      'Wait, what is a confidence vote?', 'Honestly the only way I follow politics', 'Who else is here instead of studying?',
      'Numbers can still change at the Chamber, right?', 'My landlord is not going to like this'],
  },
  gfvip: {
    kind: 'Gossip', live: true, color: 't10', title: 'Grande Fratello Vip: the semifinal', mark: 'semifinal', short: 'GF Vip semifinal',
    image: 'media/web/gf-vip.jpg', credit: 'Image from the web, personal prototype only',
    followers: 73900, watching: 6120,
    updates: [
      { time: '21:31', text: 'The semifinal starts. It was moved from Friday to tonight, the final is on November 30.' },
      { time: '21:48', text: 'Televote polls flip: Piera overtakes Varsi.' },
      { time: '22:05', text: 'Andreas Müller is the third favourite for the final in the polls.' },
    ],
    queue: [
      { after: 15, text: 'Live from the studio: the three nominated go to the televote, lines close at the end of the night.' },
      { after: 70, text: 'Big moment in the House: the letter from home that everyone was waiting for.', big: true },
      { after: 150, text: 'Televote closed. First result of the night: Andreas Müller goes straight to the final.' },
      { after: 260, text: 'Who is the next finalist? Vote in our poll and see what the community thinks.' },
    ],
    talk: ['Piera deserves the final', 'Nooo I was team Varsi', 'Andreas is so calm, I love him', 'This letter made me cry',
      'Who else is watching instead of studying?', 'The polls are always wrong, wait for the televote', 'Live from my sofa with my mum',
      'Is the final really on the 30th?', 'This season is unhinged', 'They better not cut the best part again', 'Called it', 'Final on the 30th, cancel all plans'],
  },
  sanremo: {
    kind: 'Gossip', upcoming: 'Dec 11 · 21:30', color: 't2', title: 'Sanremo 2027: the 24 Big', mark: '24 Big', short: 'Sanremo 2027',
    image: 'media/ariston.jpg', credit: 'Teatro Ariston · Wikimedia Commons, CC BY-SA 4.0',
    host: { image: 'media/de-martino.png', credit: 'Stefano De Martino · Wikimedia Commons, CC BY 3.0' },
    followers: 91700, watching: 0,
    updates: [
      { time: 'Jun', text: 'Official: Stefano De Martino is the host and artistic director of Sanremo 2027.' },
      { time: 'Nov 18', text: 'De Martino confirms the date: the 24 Big are announced on December 11 at 21:30 on Rai 1, during "Sarà Sanremo".' },
      { time: 'Nov 20', text: 'Rumours: Elodie, Achille Lauro, Mahmood and Geolier among the names. Nothing is confirmed yet.' },
      { time: 'Today', text: 'The Festival runs from February 16 to 20, with a Eurovision night on the Thursday.' },
    ],
    talk: ['If Geolier is in I am watching every night', 'De Martino host, finally', 'Måneskin reunion please', 'Eurovision night sounds fun',
      'Fantasanremo team already ready', 'December 11, alarm set'],
  },
  water: {
    kind: 'Story', color: 't3', title: "Sicily's water crisis", mark: 'water', short: 'Water in Sicily',
    image: 'media/pozzillo.jpg', credit: 'Lago di Pozzillo · Wikimedia Commons, CC BY-SA 4.0',
    followers: 12900, watching: 0,
    updates: [
      { time: 'Oct 20', text: 'Reservoirs at their lowest in 30 years', piece: 'c2' },
      { time: 'Nov 15', text: '€400 million to fix the pipes', piece: 'c2' },
    ],
    talk: ['My grandparents in Agrigento live this every summer', 'Why does it take until 2029?'],
  },
  ai: {
    kind: 'Story', color: 't2', title: 'The AI Act in Italy', mark: 'AI Act', short: 'AI Act',
    image: 'media/ai-act.jpg', credit: 'European Parliament · Wikimedia Commons, CC BY 2.0',
    followers: 21400, watching: 0,
    updates: [
      { time: 'Sep 30', text: 'What is banned from today', piece: 'c3' },
      { time: 'Nov 8', text: 'Job applications and AI: your rights', piece: 'c3' },
    ],
    talk: ['Good to know for my internship applications', 'Does this apply to school too?'],
  },
};

// Persone di esempio della community
export const PEOPLE = [
  { name: 'Giulia R.', c: 't1' }, { name: 'Marco B.', c: 't3' }, { name: 'Sofia L.', c: 't6' }, { name: 'Davide M.', c: 't9' },
  { name: 'Chiara P.', c: 't2' }, { name: 'Luca T.', c: 't5' }, { name: 'Nina F.', c: 't10' }, { name: 'Omar K.', c: 't4' },
];
