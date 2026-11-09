// ✏️  TUTTI I TESTI DEL SITO SONO QUI. Modifica liberamente.

export const site = {
  name: 'Simone Redaelli',
  firstName: 'Simone',
  role: 'Sviluppatore web',
  city: 'Torino',

  // Metti una tua foto in frontend/public/ (es. foto.jpg) e scrivi '/foto.jpg'. Vuoto = disegno a mano.
  photo: '',

  hero: {
    lines: ['La matematica', 'non è difficile.'],
    highlight: 'È spiegata male.',
    subtitle:
      'Ripetizioni online 1:1 di matematica, programmazione, inglese e francese, nel mio tempo libero. Mandami una richiesta per un orario, ti rispondo su WhatsApp e ci vediamo su Google Meet.',
    note: 'muovi il mouse sul grafico',
    noteTouch: 'tocca il grafico',
  },

  // La striscia che scorre sotto la hero
  marquee: [
    '∫ x² dx = x³/3 + C',
    'for (let i = 0; i < n; i++)',
    'lim sin(x)/x = 1',
    'a² + b² = c²',
    'SELECT * FROM studenti',
    'e^(iπ) + 1 = 0',
    'console.log("ci sei!")',
    'Δ = b² − 4ac',
    'def media(voti):',
    'f′(x) = 0',
    'I have been studying',
    'je suis, tu es, il est',
  ],

  // Avviso mostrato in "Chi sono" e sopra il modulo di prenotazione
  notice: {
    title: 'N.B.',
    text: 'Non è un\'attività: faccio ripetizioni nel mio tempo libero. Quella che mandi è una richiesta, non una prenotazione sicura. Se quel giorno non riesco te lo dico subito su WhatsApp e cerchiamo un altro orario.',
  },

  about: {
    title: 'Piacere, sono Simone.',
    note: 'questo sono io :)',
    paragraphs: [
      'Faccio lo sviluppatore web a Torino: scrivo codice tutti i giorni e la matematica la uso davvero, non solo sui libri. So bene cosa vuol dire restare bloccati su un esercizio per un\'ora senza capire il perché.',
      'A lezione non ti detto la soluzione: costruiamo il ragionamento insieme, con esempi concreti e al tuo ritmo, finché non riesci a rifarlo da solo.',
      'Recupero di un debito, preparazione a un esame, il primo programma da zero o una verifica di inglese o francese: partiamo da dove sei tu.',
    ],
    facts: [
      { value: '1:1', label: 'solo tu e io, niente classi' },
      { value: 'Meet', label: 'da casa tua, ovunque sei' },
      { value: '24h', label: 'per avere una risposta' },
    ],
  },

  // demo: 'math' | 'code' | 'web' | 'bin'
  subjects: [
    {
      name: 'Matematica',
      demo: 'math',
      desc: 'Equazioni, funzioni, limiti, derivate e integrali. Dalle medie ai primi esami universitari.',
      levels: ['Medie', 'Superiori', 'Università'],
    },
    {
      name: 'Programmazione',
      demo: 'code',
      desc: 'Logica, algoritmi e strutture dati in Python, C, Java e JavaScript, con esercizi veri.',
      levels: ['Superiori', 'Università', 'Da zero'],
    },
    {
      name: 'Sviluppo web',
      demo: 'web',
      desc: 'HTML, CSS, JavaScript, React, PHP e database. Dal primo sito al progetto d\'esame.',
      levels: ['Principianti', 'Intermedio'],
    },
    {
      name: 'Informatica',
      demo: 'bin',
      desc: 'Sistemi di numerazione, reti, database e SQL. Preparazione a verifiche e interrogazioni.',
      levels: ['Superiori', 'Università'],
    },
    {
      name: 'Inglese',
      demo: 'en',
      desc: 'Grammatica, tempi verbali, comprensione e conversazione. Recuperi, verifiche e certificazioni.',
      levels: ['Medie', 'Superiori', 'Conversazione'],
    },
    {
      name: 'Francese',
      demo: 'fr',
      desc: 'Verbi, grammatica e pronuncia, con frasi vere da usare. Dalle basi alla preparazione di verifiche.',
      levels: ['Medie', 'Superiori', 'Da zero'],
    },
  ],

  steps: [
    { title: 'Scegli l\'orario', text: 'Materia, durata e un orario libero. Ti arriva subito un WhatsApp di riepilogo.' },
    { title: 'Ti rispondo io', text: 'La richiesta mi arriva su WhatsApp. Se quel giorno riesco la accetto, altrimenti te lo dico subito.' },
    { title: 'Ricevi il link', text: 'Ti arrivano email e invito Google Calendar con il link Meet della lezione.' },
    { title: 'Si parte', text: 'All\'orario giusto entri dal link. Basta un PC, un tablet o il telefono.' },
  ],

  // Sezione "E il prezzo?": nessuna cifra, si concorda su WhatsApp
  pricing: {
    title: 'E il prezzo?',
    text: 'Lo decidiamo insieme su WhatsApp, in base a livello, materia e a quante lezioni ti servono. Prima scegli quanto vuoi che duri la lezione.',
  },
  // Note sulle durate (minuti → testo). Le durate vere sono in backend/src/config.js
  durationNotes: { 60: 'per un dubbio preciso', 90: 'la più scelta', 120: 'prima di una verifica' },

  faq: [
    {
      q: 'La prenotazione è sicura?',
      a: 'No, è una richiesta. Faccio ripetizioni nel mio tempo libero, non è un\'attività: la lezione è confermata solo quando ti arrivano il WhatsApp di conferma e l\'invito con il link Meet. Se non riesco te lo scrivo subito.',
    },
    {
      q: 'Come si svolgono le lezioni?',
      a: 'Online su Google Meet, con condivisione schermo e lavagna digitale. Non devi installare niente: basta il link che ti arriva via email.',
    },
    {
      q: 'Posso spostare o annullare una lezione?',
      a: 'Sì: scrivimi su WhatsApp o rispondi all\'email di conferma, possibilmente almeno 24 ore prima.',
    },
    {
      q: 'Quanto costa una lezione?',
      a: 'Il prezzo lo concordiamo su WhatsApp quando ti confermo la lezione, in base a livello, materia e frequenza.',
    },
    {
      q: 'Fai pacchetti di più lezioni?',
      a: 'Sì, per chi prepara un esame o vuole un percorso continuo. Scrivilo nelle note quando prenoti.',
    },
  ],

  contacts: {
    email: '', // es. 'simone@email.it'
    instagram: '', // es. 'https://instagram.com/tuonome'
  },
};
