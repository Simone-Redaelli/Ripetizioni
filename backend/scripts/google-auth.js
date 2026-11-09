// Ottieni il GOOGLE_REFRESH_TOKEN una volta sola.
// Uso: compila GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nel .env, poi: npm run google-auth
import 'dotenv/config';
import http from 'node:http';
import { google } from 'googleapis';

const PORT = 5555;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('❌ Metti prima GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nel file .env');
  process.exit(1);
}

const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT);
const url = oauth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/calendar', // creare eventi Meet + leggere disponibilità
    'https://www.googleapis.com/auth/gmail.send', // inviare le email di conferma
  ],
});

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT);
  if (u.pathname !== '/oauth2callback') return res.writeHead(404).end();
  const code = u.searchParams.get('code');
  if (!code) return res.writeHead(400).end('Codice mancante');
  try {
    const { tokens } = await oauth.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h2>✅ Fatto! Torna al terminale.</h2>');
    if (!tokens.refresh_token) {
      console.log('\n⚠️  Google non ha restituito un refresh token. Vai su https://myaccount.google.com/permissions, rimuovi l\'accesso all\'app e rilancia lo script.');
    } else {
      console.log('\n✅ Copia questa riga nel tuo .env:\n');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    }
  } catch (err) {
    res.writeHead(500).end('Errore, guarda il terminale');
    console.error('❌', err.message);
  } finally {
    setTimeout(() => process.exit(0), 300);
  }
});

server.listen(PORT, () => {
  console.log('\n1) Apri questo link e accedi con la Gmail che userai per le lezioni:\n');
  console.log(url);
  console.log(`\n2) Se Google dice "app non verificata" → Avanzate → Vai a (non sicuro). È la tua app, va bene.\n`);
});
