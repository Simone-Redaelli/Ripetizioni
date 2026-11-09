// Tutti i messaggi WhatsApp del flusso, in un posto solo.
// Con WA_USE_TEMPLATES=true usa i template (obbligatori per scrivere per primi a qualcuno).
import { env } from './env.js';
import { sendTemplate, sendText, sendButtons } from './whatsapp.js';
import { fmtWhen, fmtDuration } from './format.js';

const T = env.wa.useTemplates;

export const ACCEPT = 'ACCEPT:';
export const REJECT = 'REJECT:';

/** A te: nuova richiesta con bottoni Accetta / Rifiuta */
export function adminNewBooking(b) {
  const when = fmtWhen(b.start);
  const contact = `${b.email} · +${b.phone}`;
  const notes = [b.level && `Livello: ${b.level}`, b.notes].filter(Boolean).join(' — ') || '-';

  if (T) {
    return sendTemplate(
      env.admin.phone,
      'nuova_prenotazione',
      [b.name, b.subject, when, fmtDuration(b.duration), contact, notes, b.id],
      [ACCEPT + b.id, REJECT + b.id],
    );
  }
  return sendButtons(
    env.admin.phone,
    `📚 *Nuova richiesta di ripetizioni*\n\n👤 ${b.name}\n📘 ${b.subject}\n🗓️ ${when}\n⏱️ ${fmtDuration(b.duration)}\n📇 ${contact}\n📝 ${notes}\n\nCodice: *${b.id}*`,
    [
      { id: ACCEPT + b.id, title: '✅ Accetta' },
      { id: REJECT + b.id, title: '❌ Rifiuta' },
    ],
  );
}

/** Allo studente: richiesta ricevuta */
export function studentReceived(b) {
  const when = fmtWhen(b.start);
  if (T) return sendTemplate(b.phone, 'prenotazione_ricevuta', [b.name, b.subject, when, b.id]);
  return sendText(
    b.phone,
    `Ciao ${b.name}! 👋 Ho ricevuto la tua richiesta di ripetizioni di *${b.subject}* per *${when}*.\nFaccio ripetizioni nel tempo libero, quindi non è ancora confermata: ti rispondo il prima possibile qui su WhatsApp e, se riesco, ci accordiamo sul prezzo.\n\nCodice: ${b.id}`,
  );
}

/** Allo studente: confermata con link Meet */
export function studentConfirmed(b) {
  const when = fmtWhen(b.start);
  if (T) return sendTemplate(b.phone, 'prenotazione_confermata', [b.name, b.subject, when, b.meetLink, b.email]);
  return sendText(
    b.phone,
    `Ottime notizie ${b.name}! ✅ La lezione di *${b.subject}* di *${when}* è confermata.\n\n🎥 Google Meet: ${b.meetLink}\n\nTi ho mandato anche l'invito su ${b.email}. A presto!`,
  );
}

/** Allo studente: rifiutata */
export function studentRejected(b) {
  const when = fmtWhen(b.start);
  const link = `${env.publicUrl}/#prenota`;
  if (T) return sendTemplate(b.phone, 'prenotazione_rifiutata', [b.name, b.subject, when, link]);
  return sendText(
    b.phone,
    `Ciao ${b.name}, purtroppo non riesco a fare la lezione di *${b.subject}* di *${when}* 😕\nPuoi scegliere un altro orario qui: ${link}`,
  );
}

/** A te: risposta libera (sei appena tu ad avermi scritto, quindi la finestra 24h è aperta) */
export const replyAdmin = (text) => sendText(env.admin.phone, text);
