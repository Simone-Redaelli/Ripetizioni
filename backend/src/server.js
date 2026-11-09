import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { DateTime } from 'luxon';

import { env, checkEnv, digits } from './env.js';
import { booking as cfg } from './config.js';
import { store, newCode } from './store.js';
import { getSlots, parseDay, dayInRange, publicConfig } from './slots.js';
import { webhook } from './webhook.js';
import { acceptBooking, rejectBooking } from './decisions.js';
import * as notify from './notify.js';

checkEnv();

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
// rawBody serve per verificare la firma del webhook di Meta
app.use(express.json({ limit: '50kb', verify: (req, _res, buf) => { req.rawBody = buf; } }));

app.use(
  '/api',
  cors({ origin: env.allowedOrigins.length ? env.allowedOrigins : true }),
);

// ── API pubbliche ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, dryRun: env.dryRun }));

app.get('/api/config', (_req, res) => res.json(publicConfig()));

app.get('/api/slots', async (req, res) => {
  const duration = Number(req.query.duration);
  if (!parseDay(req.query.date) || !cfg.durations.includes(duration)) {
    return res.status(400).json({ error: 'Data o durata non valida.' });
  }
  try {
    res.json({ date: req.query.date, duration, slots: await getSlots(req.query.date, duration) });
  } catch (err) {
    console.error('Errore slot:', err);
    res.status(502).json({ error: 'Non riesco a leggere il calendario, riprova tra poco.' });
  }
});

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Troppe richieste. Riprova tra qualche minuto.' },
});

const EMAIL_RE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;
const str = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

function normalizePhone(raw) {
  let p = digits(raw);
  if (p.startsWith('00')) p = p.slice(2);
  if (/^3\d{8,9}$/.test(p)) p = `39${p}`; // cellulare italiano scritto senza prefisso
  return /^\d{8,15}$/.test(p) ? p : null;
}

app.post('/api/bookings', bookingLimiter, async (req, res) => {
  const body = req.body ?? {};

  // Honeypot anti-bot: campo invisibile che gli umani lasciano vuoto
  if (body.website) return res.json({ ok: true, id: newCode(), status: 'pending' });

  const name = str(body.name, 80);
  const email = str(body.email, 120).toLowerCase();
  const phone = normalizePhone(body.phone);
  const subject = str(body.subject, 80);
  const level = str(body.level, 60);
  const notes = String(body.notes ?? '').trim().slice(0, 600);
  const duration = Number(body.duration);
  const day = parseDay(body.date);
  const time = String(body.time ?? '');

  const errors = [];
  if (name.length < 2) errors.push('nome');
  if (!EMAIL_RE.test(email)) errors.push('email');
  if (!phone) errors.push('numero WhatsApp');
  if (!subject) errors.push('materia');
  if (!cfg.durations.includes(duration)) errors.push('durata');
  if (!day || !dayInRange(day) || !/^\d{2}:\d{2}$/.test(time)) errors.push('data/ora');
  if (body.consent !== true) errors.push('consenso privacy');
  if (errors.length) return res.status(400).json({ error: `Controlla: ${errors.join(', ')}.` });

  const start = DateTime.fromISO(`${body.date}T${time}`, { zone: cfg.timezone });
  const end = start.plus({ minutes: duration });

  const booking = {
    id: newCode(),
    status: 'pending',
    name, email, phone, subject, level, notes, duration,
    start: start.toISO(),
    end: end.toISO(),
    createdAt: new Date().toISOString(),
    ip: req.ip,
  };

  let saved;
  try {
    saved = await store.createIfFree(booking, async () => (await getSlots(body.date, duration)).includes(time));
  } catch (err) {
    console.error('Errore salvataggio:', err);
    return res.status(502).json({ error: 'Errore temporaneo, riprova tra poco.' });
  }
  if (!saved) return res.status(409).json({ error: 'Questo orario è appena stato preso. Scegline un altro 🙏' });

  const [adminRes, studentRes] = await Promise.allSettled([
    notify.adminNewBooking(saved),
    notify.studentReceived(saved),
  ]);
  if (adminRes.status === 'rejected') console.error('❗ WhatsApp ad admin fallito:', adminRes.reason);
  if (studentRes.status === 'rejected') console.error('WhatsApp a studente fallito:', studentRes.reason);

  console.log(`🆕 Prenotazione ${saved.id} · ${saved.name} · ${saved.subject} · ${saved.start}`);
  res.status(201).json({
    ok: true,
    id: saved.id,
    status: saved.status,
    whatsappSent: studentRes.status === 'fulfilled',
  });
});

// ── Webhook WhatsApp ─────────────────────────────────────────
app.use(webhook);

// ── Rotte di test (solo DRY_RUN) ─────────────────────────────
if (env.dryRun) {
  app.get('/api/dev/bookings', async (_req, res) => res.json(await store.all()));
  // Simula il bottone WhatsApp: apri http://localhost:3001/api/dev/accept/CODICE
  app.get('/api/dev/:action(accept|reject)/:id', async (req, res) => {
    const id = req.params.id.toUpperCase();
    const reply = req.params.action === 'accept' ? await acceptBooking(id) : await rejectBooking(id);
    res.type('text').send(reply);
  });
}

// ── Pulizia: richieste mai gestite e ormai passate → scadute ──
async function expireOld() {
  const now = new Date().toISOString();
  for (const b of await store.all()) {
    if (b.status === 'pending' && b.start < now) await store.transition(b.id, 'pending', 'expired');
  }
}
setInterval(() => expireOld().catch(console.error), 30 * 60 * 1000).unref();

// ── Frontend compilato (stesso server) ───────────────────────
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api\/|webhook).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(env.port, () => {
  console.log(`🚀 Server su http://localhost:${env.port}`);
  if (fs.existsSync(dist)) console.log('🌐 Servo anche il frontend da frontend/dist');
});
