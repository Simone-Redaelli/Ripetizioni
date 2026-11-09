// Cosa succede quando premi Accetta / Rifiuta su WhatsApp.
import { env } from './env.js';
import { store } from './store.js';
import { createLessonEvent, sendEmail } from './google.js';
import { confirmedEmail, rejectedEmail } from './emails.js';
import * as notify from './notify.js';
import { fmtWhen, fmtShort, STATUS_LABEL } from './format.js';

const admin = () => ({ name: env.admin.name, email: env.admin.email });

async function alreadyHandled(id) {
  const cur = await store.get(id);
  return cur
    ? `ℹ️ La prenotazione ${id} è già ${STATUS_LABEL[cur.status] ?? cur.status}.`
    : `❓ Nessuna prenotazione con codice ${id}.`;
}

export async function acceptBooking(id) {
  const b = await store.transition(id, 'pending', 'processing');
  if (!b) return alreadyHandled(id);

  let ev;
  try {
    ev = await createLessonEvent(b);
  } catch (err) {
    console.error('Errore creazione evento:', err);
    await store.update(id, { status: 'pending' });
    return `⚠️ Non sono riuscito a creare l'evento per ${id} (${err.message}). La prenotazione è ancora in attesa: riprova con "si ${id}".`;
  }

  const confirmed = await store.update(id, { status: 'confirmed', ...ev });

  // Email (a lui/lei + te in copia) e WhatsApp allo studente, in parallelo
  const mail = confirmedEmail(confirmed);
  const [emailRes, waRes] = await Promise.allSettled([
    sendEmail({ to: [{ name: b.name, email: b.email }], cc: [admin()], ...mail }),
    notify.studentConfirmed(confirmed),
  ]);
  const problems = [];
  if (emailRes.status === 'rejected') {
    console.error('Email conferma fallita:', emailRes.reason);
    problems.push(`email non inviata (${emailRes.reason.message})`);
  }
  if (waRes.status === 'rejected') {
    console.error('WhatsApp conferma fallito:', waRes.reason);
    problems.push(`WhatsApp allo studente non inviato (${waRes.reason.message})`);
  }

  return [
    `✅ *Confermata* · ${b.name}`,
    `📘 ${b.subject} · ${fmtWhen(b.start)}`,
    `🎥 ${ev.meetLink ?? 'link Meet non disponibile'}`,
    problems.length
      ? `⚠️ Attenzione: ${problems.join('; ')}. L'invito calendario è comunque partito.`
      : '📨 Email, invito Google Calendar e WhatsApp inviati.',
  ].join('\n');
}

export async function rejectBooking(id) {
  const b = await store.transition(id, 'pending', 'rejected');
  if (!b) return alreadyHandled(id);

  const mail = rejectedEmail(b);
  const results = await Promise.allSettled([
    notify.studentRejected(b),
    sendEmail({ to: [{ name: b.name, email: b.email }], ...mail }),
  ]);
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Notifica rifiuto fallita:', r.reason));

  return `❌ *Rifiutata* · ${b.name} (${b.subject}, ${fmtWhen(b.start)}). L'ho avvisato/a con il link per scegliere un altro orario.`;
}

export async function listPending() {
  const pending = (await store.all())
    .filter((b) => b.status === 'pending')
    .sort((a, b) => a.start.localeCompare(b.start));
  if (!pending.length) return '📭 Nessuna richiesta in attesa.';
  return [
    `📋 *Richieste in attesa (${pending.length})*`,
    ...pending.map((b) => `• *${b.id}* — ${b.name}, ${b.subject}, ${fmtShort(b.start, b.end)}`),
    '',
    'Rispondi "si CODICE" o "no CODICE".',
  ].join('\n');
}

export const HELP = [
  '🤖 *Comandi*',
  '• Premi ✅ Accetta / ❌ Rifiuta sotto la richiesta',
  '• oppure scrivi "si CODICE" / "no CODICE"',
  '• "lista" → richieste in attesa',
].join('\n');

/** Interpreta un comando in arrivo da te. Restituisce la risposta da mandarti. */
export async function handleAdminCommand(raw) {
  const text = String(raw ?? '').trim();
  if (text.startsWith(notify.ACCEPT)) return acceptBooking(text.slice(notify.ACCEPT.length));
  if (text.startsWith(notify.REJECT)) return rejectBooking(text.slice(notify.REJECT.length));

  const m = text.match(/^(si|sì|ok|accetta|conferma|no|rifiuta)\s+#?([a-z0-9]{6})$/i);
  if (m) {
    const id = m[2].toUpperCase();
    return /^(no|rifiuta)$/i.test(m[1]) ? rejectBooking(id) : acceptBooking(id);
  }
  if (/^(lista|pending|richieste)$/i.test(text)) return listPending();
  return HELP;
}
