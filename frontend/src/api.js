// Se il backend sta su un altro dominio, crea frontend/.env con VITE_API_URL=https://api.tuodominio.it
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function req(path, opts = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  } catch {
    throw Object.assign(new Error('Connessione non riuscita. Controlla internet e riprova.'), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Qualcosa è andato storto, riprova.'), { status: res.status });
  return data;
}

export const api = {
  config: () => req('/api/config'),
  slots: (date, duration) => req(`/api/slots?date=${date}&duration=${duration}`),
  book: (payload) => req('/api/bookings', { method: 'POST', body: JSON.stringify(payload) }),
};
