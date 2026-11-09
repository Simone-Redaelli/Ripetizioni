import { DateTime } from 'luxon';
import { booking as cfg } from './config.js';

export const inZone = (iso) => DateTime.fromISO(iso, { zone: cfg.timezone }).setLocale('it');

/** "lunedì 16 novembre alle 15:00" */
export const fmtWhen = (iso) => inZone(iso).toFormat("cccc d LLLL 'alle' HH:mm");

/** "lun 16/11, 15:00–16:30" */
export const fmtShort = (startIso, endIso) =>
  `${inZone(startIso).toFormat('ccc d/LL, HH:mm')}–${inZone(endIso).toFormat('HH:mm')}`;

export const fmtDuration = (m) => {
  if (m % 60 === 0) return m === 60 ? '1 ora' : `${m / 60} ore`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
};

export const STATUS_LABEL = {
  pending: 'in attesa',
  processing: 'in elaborazione',
  confirmed: 'confermata',
  rejected: 'rifiutata',
  expired: 'scaduta',
};

export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
