import crypto from 'node:crypto';
import { google } from 'googleapis';
import { env } from './env.js';
import { booking as cfg } from './config.js';
import { fmtDuration } from './format.js';

const auth = new google.auth.OAuth2(env.google.clientId, env.google.clientSecret);
if (env.google.refreshToken) auth.setCredentials({ refresh_token: env.google.refreshToken });

const calendar = google.calendar({ version: 'v3', auth });
const gmail = google.gmail({ version: 'v1', auth });

export const googleReady = () =>
  Boolean(env.google.clientId && env.google.clientSecret && env.google.refreshToken);

// ── Disponibilità ────────────────────────────────────────────
const busyCache = new Map();

/** Intervalli occupati sul tuo calendario: [{start, end}] in ISO */
export async function getBusy(timeMin, timeMax) {
  if (env.dryRun || !googleReady()) return [];
  const key = `${timeMin}|${timeMax}`;
  const hit = busyCache.get(key);
  if (hit && Date.now() - hit.at < 60_000) return hit.data;

  const res = await calendar.freebusy.query({
    requestBody: { timeMin, timeMax, timeZone: cfg.timezone, items: [{ id: env.google.calendarId }] },
  });
  const cal = res.data.calendars?.[env.google.calendarId] ?? Object.values(res.data.calendars ?? {})[0];
  if (cal?.errors?.length) throw new Error(`Google freebusy: ${JSON.stringify(cal.errors)}`);
  const data = cal?.busy ?? [];
  busyCache.set(key, { at: Date.now(), data });
  if (busyCache.size > 200) busyCache.delete(busyCache.keys().next().value);
  return data;
}

export const invalidateBusy = () => busyCache.clear();

// ── Evento + Google Meet ─────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const meetOf = (ev) =>
  ev.hangoutLink || ev.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')?.uri || null;

/**
 * Crea l'evento sul tuo Google Calendar con link Meet e invita lo studente.
 * sendUpdates:'all' → Google manda l'invito calendario via email allo studente.
 */
export async function createLessonEvent(b) {
  if (env.dryRun) {
    const fake = `https://meet.google.com/dry-${b.id.toLowerCase()}`;
    console.log(`📅 [DRY_RUN] Evento creato per ${b.name} → ${fake}`);
    return { eventId: `dry-${b.id}`, meetLink: fake, eventLink: null };
  }

  const res = await calendar.events.insert({
    calendarId: env.google.calendarId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: `${cfg.lessonTitle} ${b.subject} – ${b.name}`,
      description: [
        `Lezione di ${b.subject} (${fmtDuration(b.duration)})`,
        b.level ? `Livello: ${b.level}` : null,
        b.notes ? `Note: ${b.notes}` : null,
        '',
        `Studente: ${b.name} · ${b.email} · +${b.phone}`,
        `Codice prenotazione: ${b.id}`,
      ].filter((l) => l !== null).join('\n'),
      start: { dateTime: b.start, timeZone: cfg.timezone },
      end: { dateTime: b.end, timeZone: cfg.timezone },
      attendees: [{ email: b.email, displayName: b.name }],
      guestsCanInviteOthers: false,
      conferenceData: {
        createRequest: { requestId: `${b.id}-${crypto.randomUUID()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
      extendedProperties: { private: { bookingId: b.id } },
    },
  });

  let ev = res.data;
  // A volte Google crea il Meet in modo asincrono: aspettiamo qualche secondo.
  for (let i = 0; i < 6 && !meetOf(ev); i++) {
    await sleep(1000);
    ev = (await calendar.events.get({ calendarId: env.google.calendarId, eventId: ev.id })).data;
  }
  invalidateBusy();
  return { eventId: ev.id, meetLink: meetOf(ev), eventLink: ev.htmlLink };
}

// ── Gmail ────────────────────────────────────────────────────
const encWord = (s) => `=?UTF-8?B?${Buffer.from(String(s)).toString('base64')}?=`;
const b64Lines = (s) => Buffer.from(s).toString('base64').replace(/.{76}/g, '$&\r\n');
const addr = (name, email) => `${encWord(name)} <${email}>`;

/** Invia un'email dalla tua Gmail. to/cc: [{name, email}] */
export async function sendEmail({ to, cc = [], subject, html, text }) {
  if (env.dryRun) {
    console.log(`✉️  [DRY_RUN] Email "${subject}" → ${[...to, ...cc].map((x) => x.email).join(', ')}`);
    return;
  }
  const boundary = `b_${crypto.randomBytes(12).toString('hex')}`;
  const mime = [
    `From: ${addr(env.admin.name, env.admin.email)}`,
    `To: ${to.map((x) => addr(x.name, x.email)).join(', ')}`,
    cc.length ? `Cc: ${cc.map((x) => addr(x.name, x.email)).join(', ')}` : null,
    `Reply-To: ${env.admin.email}`,
    `Subject: ${encWord(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    b64Lines(text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    b64Lines(html),
    `--${boundary}--`,
  ].filter((l) => l !== null).join('\r\n');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(mime).toString('base64url') },
  });
}
