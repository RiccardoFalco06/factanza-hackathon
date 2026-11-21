// Contenuti della demo: TUTTI INVENTATI (notizie, numeri, collaborazione con Zanichelli), in inglese come il sito.
// Ogni contenuto ha un tema (story) e i collegamenti ai contenuti vicini: è la "rete" che tiene le persone dentro.

const PIECES = {
  c1: {
    kind: 'carousel', story: 'budget', minutes: 1, color: 't1',
    title: "Italy's 2027 budget: what changes at 25",
    slides: [
      { big: "Italy's 2027 budget", mark: 'what changes', after: 'if you are 25', note: 'Swipe →' },
      { big: 'Rent bonus', text: 'Up to €2,000 a year for renters under 31 with a contract in their own name. Where you are registered as a resident does not matter.' },
      { big: 'First job', text: 'Companies that hire under-30s pay less tax for three years: about €120 less in contributions per month for each new contract.' },
      { big: 'When?', text: 'Parliament must approve the law by December 31. Until then, the numbers can still change.', note: 'Follow the story to know when they do' },
    ],
    next: ['p1', 'v1', 'a1'],
  },
  a1: {
    kind: 'article', story: 'budget', minutes: 4, color: 't4',
    title: 'Why the spread matters for your mortgage',
    kicker: 'Economy · Deep dive',
    body: [
      'To fund the rent bonus, the government is counting on a lower [spread] in the coming months, meaning lighter interest payments on the [public debt].',
      'When investors trust Italy, they accept a lower [yield] on its bonds. The state pays less, and banks usually lower the rates on new mortgages too.',
      'The budget also sets the [deficit] for next year: how much more the state spends than it collects. Brussels asks to keep it below 3% of [GDP].',
    ],
    next: ['c1', 'v1'],
  },
  p1: {
    kind: 'podcast', story: 'budget', minutes: 12, color: 't8',
    title: 'Squattrinati · Renting at 25',
    show: 'Squattrinati', episode: 'Ep. 41',
    chapters: ['How the rent bonus works', 'Contracts shared with flatmates', 'What to ask your landlord'],
    next: ['c1', 'a1'],
  },
  v1: {
    kind: 'video', story: 'budget', minutes: 1, color: 't5',
    title: 'The rent bonus in 60 seconds',
    captions: [['Under', '31?'], ['Up', 'to', '€2,000'], ['for', 'your', 'rent'], ['contract', 'in', 'your', 'name'], ['residence', "doesn't", 'matter']],
    next: ['c1', 'p1'],
  },
  c2: {
    kind: 'carousel', story: 'water', minutes: 1, color: 't3',
    title: "Sicily's water: why the taps run dry",
    slides: [
      { big: "Sicily's water", mark: 'why the taps', after: 'run dry' },
      { big: 'Half is lost', text: 'About one litre in two leaks out of old pipes before it reaches a home.' },
      { big: 'What now', text: 'The region has €400 million to fix the network by 2029. Works start in Palermo and Agrigento.' },
    ],
    next: ['c1'],
  },
  c3: {
    kind: 'carousel', story: 'ai', minutes: 1, color: 't2',
    title: 'What the AI Act means for your job',
    slides: [
      { big: 'The AI Act', mark: 'and your job', after: 'explained' },
      { big: 'Banned', text: 'Social scoring of people and emotion recognition at work are not allowed in the EU.' },
      { big: 'Your rights', text: 'If an AI system helps decide on your job application, you can ask for an explanation.' },
    ],
    next: ['c1'],
  },
};

// Parole con la definizione del dizionario Zanichelli (testi scritti da noi per la demo)
const TERMS = {
  'spread': { def: "The difference in yield between two countries' government bonds, used to measure how much markets trust a country.", deep: 'Why the spread goes up during a crisis', min: 3 },
  'public debt': { def: 'All the money a state has borrowed and still has to repay, with interest.', deep: "How Italy's debt grew in 40 years", min: 4 },
  'yield': { def: 'The return an investor earns on a bond, as a percentage of its price.', deep: 'Bonds explained with a pizza', min: 3 },
  'deficit': { def: 'In a given year, the amount by which public spending is higher than public revenue.', deep: 'Deficit and debt: not the same thing', min: 2 },
  'GDP': { def: 'Gross domestic product: the value of all goods and services produced in a country in a year.', deep: 'What GDP does not measure', min: 3 },
};

const STORIES = {
  budget: {
    title: "Italy's 2027 budget", color: 't1', followers: '48.2k',
    updates: [
      { date: 'Nov 3', text: 'The first draft in 1 minute', piece: 'c1' },
      { date: 'Nov 12', text: "The Chamber's changes, explained", piece: 'a1' },
      { date: 'Today', text: "The Senate approves the text: what's left of the rent bonus", piece: 'v1', fresh: true },
    ],
  },
  water: {
    title: "Sicily's water crisis", color: 't3', followers: '12.9k',
    updates: [
      { date: 'Oct 20', text: 'Reservoirs at their lowest in 30 years', piece: 'c2' },
      { date: 'Nov 15', text: '€400 million to fix the pipes', piece: 'c2' },
    ],
  },
  ai: {
    title: 'The AI Act in Italy', color: 't2', followers: '21.4k',
    updates: [
      { date: 'Sep 30', text: 'What is banned from today', piece: 'c3' },
      { date: 'Nov 8', text: 'Job applications and AI: your rights', piece: 'c3' },
    ],
  },
};

// Quiz della settimana: ogni domanda rimanda al contenuto che la spiega
const QUIZ = {
  week: 'Week 47', players: '12.4k',
  questions: [
    { q: 'Up to what age can you get the new rent bonus?', options: ['25', '31', '35'], ok: 1, piece: 'c1' },
    { q: 'What does the spread measure?', options: ['How much a country spends', 'The gap in yield between two countries’ bonds', 'The price of petrol'], ok: 1, piece: 'a1' },
    { q: "How much of Sicily's water is lost in the pipes?", options: ['About 10%', 'About a quarter', 'About half'], ok: 2, piece: 'c2' },
    { q: 'Which of these does the AI Act ban?', options: ['Chatbots at school', 'Social scoring of people', 'AI-made music'], ok: 1, piece: 'c3' },
    { q: 'By when must Parliament approve the budget?', options: ['June 30', 'September 1', 'December 31'], ok: 2, piece: 'c1' },
  ],
};

// I servizi di Factanza verso cui porta il tempo passato sulla piattaforma (Academy, abbonamento, eventi)
const SERVICES = {
  academy: { title: 'Factanza Academy', text: 'Learn to explain the news on social media, with the people who make Factanza.', cta: 'See the course', icon: 'graduation-cap' },
  plus: { title: 'Factanza Plus', text: 'Every deep dive, the quiz archive and early access to new formats.', cta: 'Try 7 days free', icon: 'star' },
  event: { title: 'Factanza Live · Milan', text: 'An evening on the budget with the newsroom and two economists. December 12.', cta: 'Get a ticket', icon: 'ticket' },
};
