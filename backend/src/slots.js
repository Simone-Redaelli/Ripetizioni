import { DateTime, Interval } from 'luxon';
import { booking as cfg } from './config.js';
import { getBusy } from './google.js';
import { store, ACTIVE } from './store.js';

const zone = cfg.timezone;

export const parseDay = (ymd) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ymd))) return null;
  const d = DateTime.fromISO(ymd, { zone }).startOf('day');
  return d.isValid ? d : null;
};

export function dayInRange(day) {
  const today = DateTime.now().setZone(zone).startOf('day');
  return day >= today && day <= today.plus({ days: cfg.maxDaysAhead });
}

const atTime = (day, hhmm) => {
  const [hour, minute] = hhmm.split(':').map(Number);
  return day.set({ hour, minute, second: 0, millisecond: 0 });
};

/** Orari liberi ("HH:mm") per un giorno e una durata. */
export async function getSlots(ymd, duration) {
  const day = parseDay(ymd);
  if (!day || !dayInRange(day) || !cfg.durations.includes(duration)) return [];

  const ranges = cfg.workingHours[day.weekday] ?? [];
  if (!ranges.length) return [];

  const dayStart = day.startOf('day');
  const dayEnd = day.endOf('day');

  // Occupato = impegni Google Calendar + prenotazioni attive sul sito
  const googleBusy = await getBusy(dayStart.toUTC().toISO(), dayEnd.toUTC().toISO());
  const bookings = (await store.all()).filter((b) => ACTIVE.includes(b.status));
  const busy = [
    ...googleBusy.map((x) => Interval.fromDateTimes(DateTime.fromISO(x.start), DateTime.fromISO(x.end))),
    ...bookings.map((b) => Interval.fromDateTimes(DateTime.fromISO(b.start), DateTime.fromISO(b.end))),
  ].filter((i) => i.isValid && i.overlaps(Interval.fromDateTimes(dayStart, dayEnd)));

  const earliest = DateTime.now().setZone(zone).plus({ hours: cfg.minNoticeHours });
  const slots = [];

  for (const [from, to] of ranges) {
    const close = atTime(day, to);
    for (let s = atTime(day, from); s.plus({ minutes: duration }) <= close; s = s.plus({ minutes: cfg.slotStepMinutes })) {
      if (s < earliest) continue;
      const e = s.plus({ minutes: duration });
      const withBuffer = Interval.fromDateTimes(
        s.minus({ minutes: cfg.bufferMinutes }),
        e.plus({ minutes: cfg.bufferMinutes }),
      );
      if (!busy.some((b) => b.overlaps(withBuffer))) slots.push(s.toFormat('HH:mm'));
    }
  }
  return slots;
}

export const publicConfig = () => ({
  timezone: zone,
  durations: cfg.durations,
  maxDaysAhead: cfg.maxDaysAhead,
  minNoticeHours: cfg.minNoticeHours,
  // giorni (1=lun ... 7=dom) con almeno una fascia aperta
  workingDays: Object.entries(cfg.workingHours)
    .filter(([, r]) => r.length)
    .map(([d]) => Number(d)),
});
