// ✏️  Regole delle prenotazioni: modifica qui orari, durate e preavviso.

export const booking = {
  timezone: 'Europe/Rome',

  // Durate prenotabili (minuti). I prezzi li imposti nel frontend (site.config.js).
  durations: [60, 90, 120],

  // Ogni quanti minuti parte uno slot (30 = 15:00, 15:30, 16:00...)
  slotStepMinutes: 30,

  // Pausa minima prima/dopo ogni impegno del tuo calendario
  bufferMinutes: 15,

  // Preavviso minimo: non si può prenotare per le prossime N ore
  minNoticeHours: 12,

  // Fino a quanti giorni in avanti si può prenotare
  maxDaysAhead: 30,

  // Fasce in cui sei disponibile. 1 = lunedì ... 7 = domenica. [] = giorno chiuso.
  // Gli impegni già presenti sul tuo Google Calendar vengono esclusi in automatico.
  workingHours: {
    1: [['15:00', '20:00']],
    2: [['15:00', '20:00']],
    3: [['15:00', '20:00']],
    4: [['15:00', '20:00']],
    5: [['15:00', '19:00']],
    6: [['09:30', '13:00'], ['15:00', '18:00']],
    7: [],
  },

  // Titolo dell'evento su Google Calendar
  lessonTitle: 'Ripetizioni',
};
