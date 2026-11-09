import 'dotenv/config';

export const digits = (s) => String(s ?? '').replace(/\D/g, '');

const e = process.env;

export const env = {
  port: Number(e.PORT || 3001),
  publicUrl: (e.PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, ''),
  allowedOrigins: (e.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  dryRun: e.DRY_RUN === 'true',
  dataDir: e.DATA_DIR || './data',
  admin: {
    name: e.ADMIN_NAME || 'Simone',
    email: e.ADMIN_EMAIL || '',
    phone: digits(e.ADMIN_PHONE),
  },
  wa: {
    token: e.WA_TOKEN || '',
    phoneNumberId: e.WA_PHONE_NUMBER_ID || '',
    verifyToken: e.WA_VERIFY_TOKEN || '',
    appSecret: e.WA_APP_SECRET || '',
    apiVersion: e.WA_API_VERSION || 'v25.0',
    lang: e.WA_TEMPLATE_LANG || 'it',
    useTemplates: e.WA_USE_TEMPLATES !== 'false',
  },
  google: {
    clientId: e.GOOGLE_CLIENT_ID || '',
    clientSecret: e.GOOGLE_CLIENT_SECRET || '',
    refreshToken: e.GOOGLE_REFRESH_TOKEN || '',
    calendarId: e.GOOGLE_CALENDAR_ID || 'primary',
  },
};

export function checkEnv() {
  const required = {
    ADMIN_EMAIL: env.admin.email,
    ADMIN_PHONE: env.admin.phone,
    WA_TOKEN: env.wa.token,
    WA_PHONE_NUMBER_ID: env.wa.phoneNumberId,
    WA_VERIFY_TOKEN: env.wa.verifyToken,
    WA_APP_SECRET: env.wa.appSecret,
    GOOGLE_CLIENT_ID: env.google.clientId,
    GOOGLE_CLIENT_SECRET: env.google.clientSecret,
    GOOGLE_REFRESH_TOKEN: env.google.refreshToken,
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (env.dryRun) {
    console.log('🧪 DRY_RUN attivo: WhatsApp, Gmail e Calendar vengono solo simulati nel terminale.');
  } else if (missing.length) {
    console.warn(`⚠️  Variabili mancanti nel .env: ${missing.join(', ')}`);
  }
}
