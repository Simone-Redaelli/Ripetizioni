// Webhook WhatsApp: riceve le tue risposte (bottoni o testo) e le esegue.
import crypto from 'node:crypto';
import { Router } from 'express';
import { env, digits } from './env.js';
import { handleAdminCommand } from './decisions.js';
import { replyAdmin } from './notify.js';

export const webhook = Router();

// Verifica iniziale richiesta da Meta quando configuri il webhook
webhook.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === env.wa.verifyToken) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  res.sendStatus(403);
});

function validSignature(req) {
  if (!env.wa.appSecret) return env.dryRun; // in produzione la firma è obbligatoria
  const header = req.get('x-hub-signature-256') || '';
  if (!req.rawBody || !header.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', env.wa.appSecret).update(req.rawBody).digest('hex');
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

// Meta può reinviare lo stesso messaggio: teniamo a mente gli ultimi id
const seen = new Set();
const remember = (id) => {
  seen.add(id);
  if (seen.size > 500) seen.delete(seen.values().next().value);
};

function extractCommand(msg) {
  if (msg.type === 'button') return msg.button?.payload || msg.button?.text;
  if (msg.type === 'interactive') return msg.interactive?.button_reply?.id;
  if (msg.type === 'text') return msg.text?.body;
  return null;
}

webhook.post('/webhook', (req, res) => {
  if (!validSignature(req)) return res.sendStatus(401);
  res.sendStatus(200); // rispondiamo subito, Meta vuole un 200 rapido

  const messages = (req.body?.entry ?? [])
    .flatMap((e) => e.changes ?? [])
    .flatMap((c) => c.value?.messages ?? []);

  for (const msg of messages) {
    if (!msg.id || seen.has(msg.id)) continue;
    remember(msg.id);

    if (digits(msg.from) !== env.admin.phone) {
      console.log(`📥 Messaggio da +${msg.from} (non admin), ignorato.`);
      continue;
    }
    const command = extractCommand(msg);
    if (!command) continue;

    handleAdminCommand(command)
      .then((reply) => reply && replyAdmin(reply))
      .catch((err) => {
        console.error('Errore gestione comando:', err);
        replyAdmin(`⚠️ Errore: ${err.message}`).catch(() => {});
      });
  }
});
