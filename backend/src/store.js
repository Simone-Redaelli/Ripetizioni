// Archivio prenotazioni su file JSON (nessun database da installare).
// Tutte le scritture passano da una coda, quindi niente doppie prenotazioni o file corrotti.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from './env.js';

const FILE = path.resolve(env.dataDir, 'bookings.json');
let cache = null;
let chain = Promise.resolve();

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    cache = [];
  }
  return cache;
}

async function persist() {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(cache, null, 2));
  await fs.rename(tmp, FILE);
}

function locked(fn) {
  const run = chain.then(fn);
  chain = run.catch(() => {});
  return run;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // niente 0/O/1/I
export function newCode(len = 6) {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const ACTIVE = ['pending', 'processing', 'confirmed'];

export const store = {
  async all() {
    return [...(await load())];
  },

  async get(id) {
    return (await load()).find((b) => b.id === id) ?? null;
  },

  /** Crea la prenotazione solo se isFree() restituisce true, in modo atomico. */
  createIfFree(booking, isFree) {
    return locked(async () => {
      const list = await load();
      if (!(await isFree())) return null;
      while (list.some((b) => b.id === booking.id)) booking.id = newCode();
      list.push(booking);
      await persist();
      return booking;
    });
  },

  update(id, patch) {
    return locked(async () => {
      const b = (await load()).find((x) => x.id === id);
      if (!b) return null;
      Object.assign(b, patch, { updatedAt: new Date().toISOString() });
      await persist();
      return { ...b };
    });
  },

  /** Cambia stato solo se lo stato attuale è `from`. Evita doppie accettazioni. */
  transition(id, from, to, patch = {}) {
    return locked(async () => {
      const b = (await load()).find((x) => x.id === id);
      if (!b || b.status !== from) return null;
      Object.assign(b, patch, { status: to, updatedAt: new Date().toISOString() });
      await persist();
      return { ...b };
    });
  },
};
