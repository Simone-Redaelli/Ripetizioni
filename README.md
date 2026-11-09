# 📚 Sito Ripetizioni — React + WhatsApp + Google Meet

Sito personale per farti conoscere e ricevere prenotazioni di ripetizioni, con tutto il flusso automatico:

```
Studente prenota sul sito
   │
   ├─► WhatsApp a TE con bottoni  [✅ Accetta] [❌ Rifiuta]
   └─► WhatsApp allo STUDENTE: "richiesta ricevuta"

Tu premi ✅ Accetta su WhatsApp
   ├─► Evento creato sul tuo Google Calendar con link Google Meet
   ├─► Invito Google Calendar allo studente (arriva nella sua Gmail)
   ├─► Email di conferma con link Meet dalla tua Gmail (a lui + te in copia)
   ├─► WhatsApp allo studente con il link Meet
   └─► WhatsApp a te: "Confermata ✅"

Tu premi ❌ Rifiuta
   └─► WhatsApp + email allo studente con link per scegliere un altro orario
```

Il calendario del sito mostra **solo gli orari in cui sei davvero libero**: legge il tuo Google Calendar e toglie gli impegni (+15 min di margine).

---

## 📁 Struttura

```
ripetizioni-site/
├── frontend/                 → sito React (Vite)
│   └── src/site.config.js    ✏️ TUTTI I TESTI: bio, materie, prezzi, FAQ
├── backend/                  → server Node/Express
│   ├── src/config.js         ✏️ ORARI DISPONIBILI, durate, preavviso
│   ├── .env.example          ✏️ chiavi WhatsApp e Google
│   └── scripts/google-auth.js
└── README.md
```

---

## 1) Provalo subito in locale (senza configurare niente)

Serve **Node.js 20+**.

```bash
cd ripetizioni-site
npm run install:all
cp backend/.env.example backend/.env      # lascia DRY_RUN=true
```

Apri **due terminali**:

```bash
npm run dev:backend      # terminale 1 → http://localhost:3001
npm run dev:frontend     # terminale 2 → http://localhost:5173
```

Con `DRY_RUN=true` WhatsApp, Gmail e Calendar sono **simulati**: vedi nel terminale del backend esattamente cosa verrebbe inviato.
Per simulare il tuo click su WhatsApp apri nel browser:

- `http://localhost:3001/api/dev/accept/CODICE`
- `http://localhost:3001/api/dev/reject/CODICE`
- `http://localhost:3001/api/dev/bookings` → tutte le prenotazioni

---

## 2) Personalizza

- **Testi, foto, materie, FAQ** → `frontend/src/site.config.js`
  (per la foto metti `foto.jpg` in `frontend/public/` e scrivi `photo: '/foto.jpg'`)
- **Orari disponibili, durate, preavviso minimo** → `backend/src/config.js`
- Le note sotto ogni durata ("la più scelta"…) sono in `durationNotes` nel frontend. Nessun prezzo è mostrato: lo concordi su WhatsApp.

---

## 3) Google (Calendar + Meet + Gmail) — ~10 minuti

1. Vai su **https://console.cloud.google.com** → crea un progetto (es. "Ripetizioni").
2. **API e servizi → Libreria** → abilita **Google Calendar API** e **Gmail API**.
3. **API e servizi → Schermata consenso OAuth**:
   - Tipo utente: **Esterno**
   - Nome app, la tua email → salva
   - In "Utenti di test" aggiungi la tua Gmail
   - ⚠️ Poi premi **PUBBLICA APP** ("In produzione"). Se la lasci "In test" il token **scade dopo 7 giorni** e le conferme smettono di funzionare. Non serve la verifica Google: la usi solo tu.
4. **API e servizi → Credenziali → Crea credenziali → ID client OAuth**:
   - Tipo: **Applicazione web**
   - URI di reindirizzamento autorizzati: `http://localhost:5555/oauth2callback`
   - Copia **Client ID** e **Client secret** nel `backend/.env`
5. Genera il refresh token:
   ```bash
   cd backend
   npm run google-auth
   ```
   Apri il link, accedi con la **Gmail che usi per le lezioni**, accetta (se dice "app non verificata" → *Avanzate → Vai a…*).
   Copia la riga `GOOGLE_REFRESH_TOKEN=...` nel `.env`.
6. Metti `ADMIN_EMAIL` = quella stessa Gmail.

---

## 4) WhatsApp Cloud API (Meta) — ~20 minuti + approvazione template

> ⚠️ **Importante sul numero:** il "mittente" dei messaggi è un **numero business** collegato all'API.
> Non può essere il numero che usi già nell'app WhatsApp normale. Usa una SIM secondaria / numero virtuale.
> Il tuo WhatsApp personale va in `ADMIN_PHONE`: è lì che ricevi le richieste con i bottoni.

1. Vai su **https://developers.facebook.com** → *Le mie app* → **Crea app** → tipo **Business** → aggiungi il prodotto **WhatsApp**.
2. In **WhatsApp → Configurazione API**:
   - All'inizio hai un **numero di test** gratuito (può scrivere solo a max 5 numeri che verifichi tu: ottimo per provare).
   - Per gli studenti veri: **Aggiungi numero di telefono** e registra il numero business.
   - Copia il **Phone number ID** → `WA_PHONE_NUMBER_ID`
3. **Token permanente** (quello temporaneo scade in 24h):
   *business.facebook.com → Impostazioni → Utenti di sistema → Aggiungi* (ruolo Admin) → *Assegna risorse*: la tua app → *Genera token* con permessi `whatsapp_business_messaging` e `whatsapp_business_management`, scadenza **Mai** → `WA_TOKEN`.
4. **App secret**: *App Dashboard → Impostazioni app → Di base → Chiave segreta* → `WA_APP_SECRET`.
5. **Webhook** (serve il sito già online in HTTPS, vedi punto 5):
   *WhatsApp → Configurazione → Webhook → Modifica*
   - URL di callback: `https://tuodominio.it/webhook`
   - Token di verifica: lo stesso che hai messo in `WA_VERIFY_TOKEN`
   - Poi in **Campi webhook** attiva **messages** ✅
6. **Crea i 4 template** in *WhatsApp Manager → Modelli di messaggio → Crea modello*
   Categoria **Utility**, lingua **Italiano**, nomi **esattamente** questi:

### `nuova_prenotazione` (a te)
Corpo:
```
📚 Nuova richiesta di ripetizioni

Studente: {{1}}
Materia: {{2}}
Quando: {{3}}
Durata: {{4}}
Contatti: {{5}}
Note: {{6}}

Codice prenotazione: {{7}}
```
Bottoni → **Risposta rapida** (personalizzata), in quest'ordine:
1. `✅ Accetta`
2. `❌ Rifiuta`

### `prenotazione_ricevuta` (allo studente)
```
Ciao {{1}}! Ho ricevuto la tua richiesta di ripetizioni di {{2}} per {{3}}.
Faccio ripetizioni nel tempo libero, quindi non è ancora confermata: ti scrivo il prima possibile qui su WhatsApp e, se riesco, ci accordiamo sul prezzo.

Codice prenotazione: {{4}}
```

### `prenotazione_confermata` (allo studente)
```
Ottime notizie {{1}}! La lezione di {{2}} di {{3}} è confermata ✅

Link Google Meet: {{4}}

Ti ho inviato anche l'invito all'indirizzo {{5}}. A presto!
```

### `prenotazione_rifiutata` (allo studente)
```
Ciao {{1}}, purtroppo non riesco a fare la lezione di {{2}} di {{3}}.
Puoi scegliere un altro orario qui: {{4}}
```

Nel modulo Meta ti chiede un **esempio** per ogni variabile: metti valori realistici (es. "Mario", "Matematica", "lunedì 16 novembre alle 15:00", "https://meet.google.com/abc-defg-hij").
L'approvazione di solito arriva in pochi minuti.

> 💶 I messaggi template "Utility" verso gli studenti hanno un piccolo costo per messaggio (listino Meta per l'Italia). Le tue risposte e i comandi che invii tu sono gratuiti.

### Comandi che puoi scrivere al numero business
| Messaggio | Effetto |
|---|---|
| bottone **✅ Accetta** / **❌ Rifiuta** | conferma / rifiuta |
| `si ABC123` / `no ABC123` | uguale, scrivendo il codice |
| `lista` | richieste ancora in attesa |

---

## 5a) Sito su GitHub Pages (senza server)

Link: **https://simone-redaelli.github.io/Ripetizioni/**

Senza backend il sito funziona in **modalità WhatsApp**: il calendario mostra le fasce di `offlineSchedule`
(in `frontend/src/site.config.js`, non legge il Google Calendar) e il pulsante finale apre WhatsApp con la
richiesta già scritta, diretta al numero in `whatsappNumber`.

Per ripubblicare dopo una modifica:
```bash
cd frontend
npm run deploy:pages
```
Prima volta: *Settings → Pages → Build and deployment → Source: Deploy from a branch → `gh-pages` / `(root)`*.

Quando metti online il backend (punto 5), in `frontend/.env` aggiungi `VITE_API_URL=https://tuo-backend` e
nel backend `ALLOWED_ORIGINS=https://simone-redaelli.github.io`: il sito passa da solo al sistema automatico.

## 5) Mettilo online

Il backend serve anche il sito React: **un solo servizio Node**.

```bash
npm run install:all
npm run build          # crea frontend/dist
npm start              # avvia tutto sulla PORT del .env
```

Nel `.env` di produzione: `DRY_RUN=false`, `PUBLIC_URL=https://tuodominio.it`.

**Dove:**
- **VPS / Windows Server** con Node: `npm start` dietro Nginx/Caddy (o IIS) con HTTPS. Usa `pm2` per tenerlo acceso: `npm i -g pm2 && pm2 start backend/src/server.js --name ripetizioni`.
- **Render / Railway**: build command `npm run install:all && npm run build`, start command `npm start`. Aggiungi un **disco persistente** montato su `backend/data` (lì c'è `bookings.json`), altrimenti al riavvio perdi le prenotazioni in attesa.

**Test del webhook in locale** (senza server online):
```bash
npx cloudflared tunnel --url http://localhost:3001
```
Usa l'URL `https://....trycloudflare.com/webhook` nel pannello Meta.

**Frontend e backend su domini diversi?** (es. sito su GitHub Pages)
In `frontend/.env` metti `VITE_API_URL=https://api.tuodominio.it` e nel backend `ALLOWED_ORIGINS=https://tuosito.github.io`.

---

## 🛠️ Problemi comuni

| Problema | Soluzione |
|---|---|
| Non ti arriva il WhatsApp | Controlla il log del backend. Template non approvato o nome sbagliato → errore `132001`. Con numero di test: il destinatario dev'essere tra i 5 verificati. |
| Premi Accetta ma non succede nulla | Webhook non verificato o campo **messages** non attivo. `ADMIN_PHONE` deve essere identico al tuo numero (es. `393331234567`). |
| Errore `invalid_grant` di Google | Refresh token scaduto: app lasciata "In test". Pubblicala e rilancia `npm run google-auth`. |
| Gli orari non tengono conto del calendario | `GOOGLE_CALENDAR_ID=primary` usa il calendario principale della Gmail autorizzata. |
| Per provare senza template | `WA_USE_TEMPLATES=false`: manda messaggi liberi e bottoni interattivi, ma funziona solo se quel numero ha scritto al numero business nelle ultime 24h. |

---

## 🔒 Sicurezza inclusa
- Firma dei webhook Meta verificata (`X-Hub-Signature-256`)
- Solo il tuo numero (`ADMIN_PHONE`) può accettare/rifiutare
- Doppio click / messaggi duplicati ignorati (una prenotazione non può essere confermata due volte)
- Controllo atomico anti-doppia prenotazione dello stesso orario
- Rate limit (5 richieste / 15 min per IP) + campo honeypot anti-bot
- Le richieste mai gestite diventano "scadute" quando l'orario è passato
