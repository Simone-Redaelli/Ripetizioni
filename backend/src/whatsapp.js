// Client minimale per la WhatsApp Cloud API di Meta.
import { env } from './env.js';

const endpoint = () =>
  `https://graph.facebook.com/${env.wa.apiVersion}/${env.wa.phoneNumberId}/messages`;

async function send(payload) {
  if (env.dryRun) {
    console.log(`💬 [DRY_RUN] WhatsApp → +${payload.to}\n${JSON.stringify(payload, null, 2)}\n`);
    return { dryRun: true };
  }
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.wa.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${json.error?.message || JSON.stringify(json)}`);
  return json;
}

// I parametri dei template non possono contenere a capo, tab o >4 spazi di fila, né essere vuoti.
const clean = (s) => {
  const t = String(s ?? '').replace(/[\n\r\t]+/g, ' ').replace(/ {4,}/g, '   ').trim();
  return (t || '-').slice(0, 900);
};

export const sendText = (to, body) =>
  send({ to, type: 'text', text: { body: body.slice(0, 4096), preview_url: true } });

/**
 * Template approvato. buttonPayloads = payload dei bottoni "risposta rapida", nell'ordine del template.
 */
export const sendTemplate = (to, name, bodyParams = [], buttonPayloads = []) =>
  send({
    to,
    type: 'template',
    template: {
      name,
      language: { code: env.wa.lang },
      components: [
        { type: 'body', parameters: bodyParams.map((t) => ({ type: 'text', text: clean(t) })) },
        ...buttonPayloads.map((payload, i) => ({
          type: 'button',
          sub_type: 'quick_reply',
          index: String(i),
          parameters: [{ type: 'payload', payload }],
        })),
      ],
    },
  });

/** Messaggio con bottoni (max 3, titolo max 20 caratteri). Funziona solo nella finestra di 24h. */
export const sendButtons = (to, body, buttons) =>
  send({
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body.slice(0, 1024) },
      action: { buttons: buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title.slice(0, 20) } })) },
    },
  });
