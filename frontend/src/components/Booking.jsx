import { useEffect, useMemo, useRef, useState } from 'react';
import { site } from '../site.config.js';
import { api } from '../api.js';
import Scribble from './Scribble.jsx';
import { Notice } from './Sections.jsx';

const STEPS = ['Lezione', 'Giorno e ora', 'I tuoi dati'];
const PREFIXES = [
  ['39', '🇮🇹 +39'], ['41', '🇨🇭 +41'], ['33', '🇫🇷 +33'], ['34', '🇪🇸 +34'],
  ['49', '🇩🇪 +49'], ['44', '🇬🇧 +44'], ['40', '🇷🇴 +40'], ['355', '🇦🇱 +355'],
];
const EMAIL_RE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;
const ICONS = { math: 'π', code: '{ }', web: '</>', bin: '01', en: 'EN', fr: 'FR' };

const fmtMin = (m) => (m % 60 === 0 ? `${m / 60} ${m === 60 ? 'ora' : 'ore'}` : `${Math.floor(m / 60)}h e ${m % 60}`);

// Giorni del calendario italiano, a prescindere dal fuso del visitatore
function romeTodayUTCNoon() {
  const s = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d, 12);
}
function buildDays(count, workingDays) {
  const base = romeTodayUTCNoon();
  return Array.from({ length: count + 1 }, (_, i) => {
    const dt = new Date(base + i * 86400000);
    const js = dt.getUTCDay();
    return {
      ymd: dt.toISOString().slice(0, 10),
      dow: dt.toLocaleDateString('it-IT', { weekday: 'short', timeZone: 'UTC' }).replace('.', ''),
      day: dt.getUTCDate(),
      month: dt.toLocaleDateString('it-IT', { month: 'short', timeZone: 'UTC' }).replace('.', ''),
      open: workingDays.includes(js === 0 ? 7 : js),
    };
  });
}
const longDate = (ymd) => {
  const s = new Date(`${ymd}T12:00:00Z`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// ── Modalità senza server (GitHub Pages): orari dal config e invio via WhatsApp ──
const OFF = site.offlineSchedule;
const offlineConfig = () => ({
  durations: OFF.durations,
  maxDaysAhead: OFF.maxDaysAhead,
  workingDays: Object.entries(OFF.workingHours).filter(([, r]) => r.length).map(([d]) => Number(d)),
});
/** Istante (ms) di una data+ora del calendario italiano */
function romeToEpoch(ymd, hhmm) {
  const [y, m, d] = ymd.split('-').map(Number);
  const [hh, mi] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mi);
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(guess)).map((x) => [x.type, x.value]),
  );
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return guess - (wall - guess);
}
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
function offlineSlots(ymd, duration) {
  const js = new Date(`${ymd}T12:00:00Z`).getUTCDay();
  const ranges = OFF.workingHours[js === 0 ? 7 : js] ?? [];
  const earliest = Date.now() + OFF.minNoticeHours * 3600e3;
  const out = [];
  for (const [from, to] of ranges) {
    for (let s = toMin(from); s + duration <= toMin(to); s += OFF.slotStepMinutes) {
      const t = toHHMM(s);
      if (romeToEpoch(ymd, t) >= earliest) out.push(t);
    }
  }
  return out;
}

const CONFETTI = ['π', '∑', '√', '∞', '∫', '{ }', ';', '=', '+', 'x²', '≠', '%'];
function Confetti() {
  const bits = useMemo(
    () => Array.from({ length: 34 }, (_, i) => ({
      s: CONFETTI[i % CONFETTI.length],
      x: (Math.random() * 2 - 1) * 320,
      y: -120 - Math.random() * 260,
      r: (Math.random() * 2 - 1) * 260,
      d: Math.random() * 200,
      c: ['var(--hl)', 'var(--red)', 'var(--mint)', 'var(--pink)', 'var(--pen)'][i % 5],
    })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span key={i} style={{ '--x': `${b.x}px`, '--y': `${b.y}px`, '--r': `${b.r}deg`, '--d': `${b.d}ms`, color: b.c }}>{b.s}</span>
      ))}
    </div>
  );
}

export default function Booking() {
  const [cfg, setCfg] = useState(null);
  const [cfgError, setCfgError] = useState('');
  const [offline, setOffline] = useState(false);
  const [step, setStep] = useState(0);

  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [slotsKey, setSlotsKey] = useState(0);

  const [form, setForm] = useState({ name: '', email: '', prefix: '39', phone: '', level: '', notes: '', consent: false, website: '' });
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const bookRef = useRef(null);
  const stripRef = useRef(null);

  const loadConfig = () => {
    setCfgError('');
    api.config()
      .then((c) => {
        if (!Array.isArray(c?.durations)) throw Object.assign(new Error('no api'), { status: 404 });
        setOffline(false); setCfg(c); setDuration((d) => d ?? c.durations[0]);
      })
      .catch((e) => {
        // Nessun backend raggiungibile (es. sito su GitHub Pages): uso gli orari del config
        if (e.status === 0 && !navigator.onLine) return setCfgError('Sei offline. Controlla la connessione e riprova.');
        const c = offlineConfig();
        setOffline(true); setCfg(c); setDuration((d) => d ?? c.durations[0]);
      });
  };
  useEffect(loadConfig, []);

  const days = useMemo(() => (cfg ? buildDays(cfg.maxDaysAhead, cfg.workingDays) : []), [cfg]);

  useEffect(() => {
    if (!date || !duration) return;
    if (offline) { setTime(''); setSlotsError(''); setSlots(offlineSlots(date, duration)); return; }
    let alive = true;
    setSlotsLoading(true);
    setSlotsError('');
    setTime('');
    api.slots(date, duration)
      .then((r) => alive && setSlots(r.slots))
      .catch((e) => alive && (setSlots([]), setSlotsError(e.message)))
      .finally(() => alive && setSlotsLoading(false));
    return () => { alive = false; };
  }, [date, duration, slotsKey, offline]);

  const subjectInfo = site.subjects.find((s) => s.name === subject);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const fieldErrors = {
    name: form.name.trim().length < 2 && 'Scrivi nome e cognome',
    email: !EMAIL_RE.test(form.email.trim()) && 'Controlla l\'email: ti serve per il link Meet',
    phone: form.phone.replace(/\D/g, '').length < 6 && 'Scrivi il numero WhatsApp',
    consent: !form.consent && 'Spunta la casella per ricevere la conferma',
  };
  const formValid = !Object.values(fieldErrors).some(Boolean);
  const canNext = [Boolean(subject && duration), Boolean(date && time), formValid][step];

  const scrollToTop = () => {
    const el = bookRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const go = (n) => { setStep(n); setError(''); scrollToTop(); };
  const scrollStrip = (dir) => stripRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });

  async function submit() {
    setTouched(true);
    if (!formValid) return;
    if (offline) {
      if (!site.whatsappNumber) {
        setError('Le richieste online non sono ancora attive. Riprova tra poco.');
        return;
      }
      const msg = [
        `Ciao ${site.firstName}! Vorrei chiederti una lezione 📚`,
        '',
        `Materia: ${subject}${form.level ? ` (${form.level})` : ''}`,
        `Quando: ${longDate(date)} alle ${time}`,
        `Durata: ${fmtMin(duration)}`,
        `Nome: ${form.name.trim()}`,
        `Email: ${form.email.trim()}`,
        form.notes.trim() ? `Note: ${form.notes.trim()}` : null,
      ].filter((l) => l !== null).join('\n');
      window.open(`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      setDone({ id: null, viaWhatsApp: true });
      scrollToTop();
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await api.book({
        subject, duration, date, time,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: `${form.prefix}${form.phone.replace(/\D/g, '').replace(/^0+(?=3)/, '')}`,
        level: form.level,
        notes: form.notes.trim(),
        consent: form.consent,
        website: form.website,
      });
      setDone(res);
      scrollToTop();
    } catch (e) {
      setError(e.message);
      if (e.status === 409) { setStep(1); setSlotsKey((k) => k + 1); }
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setDone(null); setStep(0); setDate(''); setTime(''); setTouched(false);
    setForm((f) => ({ ...f, notes: '' }));
  }

  return (
    <section className="dark booking-sec" id="prenota" data-mode={offline ? 'whatsapp' : 'api'}>
      <div className="wrap">
        <h2 className="h2">Chiedi una lezione</h2>
        <p className="lead">Vedi solo gli orari in cui di solito sono libero. Mandami la richiesta e ti rispondo su WhatsApp.</p>
        <Notice className="notice-dark" />

        <div className="notebook" ref={bookRef}>
          <div className="spiral" aria-hidden="true" />
          {cfgError ? (
            <div className="nb-empty">
              <p>{cfgError}</p>
              <button className="btn btn-ink" onClick={loadConfig}>Riprova</button>
            </div>
          ) : !cfg ? (
            <div className="nb-empty"><span className="spinner" /> Apro il calendario…</div>
          ) : done ? (
            <div className="nb-done">
              <Confetti />
              <Scribble type="check" className="done-check" color="var(--red)" width={6} />
              <h3>Richiesta inviata!</h3>
              <p className="nb-pending">Non è ancora confermata</p>
              {done.viaWhatsApp ? (
                <p>
                  Ti si è aperto WhatsApp con il messaggio già scritto: <b>premi invia</b> e la richiesta mi arriva.
                  Le ripetizioni le faccio nel tempo libero: se quel giorno riesco ci accordiamo lì sul prezzo e ti mando il link Meet.
                  {' '}<a className="link" href={`https://wa.me/${site.whatsappNumber}`} target="_blank" rel="noreferrer">WhatsApp non si è aperto?</a>
                </p>
              ) : (
              <p>
                Grazie {form.name.split(' ')[0]}.{' '}
                {done.whatsappSent ? 'Ti ho appena scritto su WhatsApp con il riepilogo.' : 'Ho ricevuto la tua richiesta.'}{' '}
                Le ripetizioni le faccio nel tempo libero: se quel giorno riesco ci accordiamo lì sul prezzo e ti arrivano <b>email</b> e <b>invito Google Calendar</b> con il link Meet. Se non riesco te lo scrivo e troviamo un altro orario.
              </p>
              )}
              {done.id && <div className="nb-code">codice <b>{done.id}</b></div>}
              <div className="nb-recap">
                <span>{subject}</span><span>{longDate(date)}</span><span>ore {time}</span><span>{fmtMin(duration)}</span>
              </div>
              <button className="btn btn-ink" onClick={reset}>Chiedi un'altra lezione</button>
            </div>
          ) : (
            <div className="nb-grid">
              <div className="nb-main">
                <ol className="nb-steps">
                  {STEPS.map((s, i) => (
                    <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''}>
                      <button type="button" disabled={i > step} onClick={() => i < step && go(i)} aria-current={i === step ? 'step' : undefined}>
                        <span className="nb-step-n">{i < step ? '✓' : i + 1}</span>
                        <span className="nb-step-l">{s}</span>
                      </button>
                    </li>
                  ))}
                </ol>

                {step === 0 && (
                  <div className="nb-pane" key="s0">
                    <h4 className="hand-label">Che materia?</h4>
                    <div className="pick-grid">
                      {site.subjects.map((s) => (
                        <button key={s.name} type="button" className={`pick ${subject === s.name ? 'sel' : ''}`} onClick={() => setSubject(s.name)} aria-pressed={subject === s.name}>
                          <span className="pick-ico">{ICONS[s.demo] ?? '✦'}</span>
                          <span>{s.name}</span>
                        </button>
                      ))}
                    </div>
                    <h4 className="hand-label">Quanto dura?</h4>
                    <div className="pick-grid pick-grid-3">
                      {cfg.durations.map((d) => (
                        <button key={d} type="button" className={`pick pick-dur ${duration === d ? 'sel' : ''}`} onClick={() => setDuration(d)} aria-pressed={duration === d}>
                          <b>{fmtMin(d)}</b>
                          {site.durationNotes?.[d] && <small>{site.durationNotes[d]}</small>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="nb-pane" key="s1">
                    <div className="hand-row">
                      <h4 className="hand-label">Che giorno?</h4>
                      <div className="strip-nav">
                        <button type="button" aria-label="Giorni precedenti" onClick={() => scrollStrip(-1)}>‹</button>
                        <button type="button" aria-label="Giorni successivi" onClick={() => scrollStrip(1)}>›</button>
                      </div>
                    </div>
                    <div className="days" ref={stripRef}>
                      {days.map((d) => (
                        <button key={d.ymd} type="button" disabled={!d.open} className={`day ${date === d.ymd ? 'sel' : ''}`} onClick={() => setDate(d.ymd)} aria-pressed={date === d.ymd} aria-label={longDate(d.ymd)}>
                          <small>{d.dow}</small>
                          <b>{d.day}</b>
                          <small>{d.month}</small>
                        </button>
                      ))}
                    </div>

                    <h4 className="hand-label">A che ora?</h4>
                    {!date ? (
                      <p className="nb-hint">Scegli prima un giorno qui sopra.</p>
                    ) : slotsLoading ? (
                      <div className="slots">{Array.from({ length: 8 }, (_, i) => <span key={i} className="slot sk" />)}</div>
                    ) : slotsError ? (
                      <p className="nb-hint nb-hint-err">{slotsError} <button className="link" onClick={() => setSlotsKey((k) => k + 1)}>Riprova</button></p>
                    ) : slots.length === 0 ? (
                      <p className="nb-hint">In questo giorno non ho {fmtMin(duration)} liberi. Prova un altro giorno o una lezione più corta.</p>
                    ) : (
                      <div className="slots">
                        {slots.map((t, i) => (
                          <button key={t} type="button" className={`slot ${time === t ? 'sel' : ''}`} style={{ '--i': i }} onClick={() => setTime(t)} aria-pressed={time === t}>{t}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <form className="nb-pane nb-form" key="s2" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
                    <div className="line-field">
                      <label htmlFor="f-name">Nome e cognome</label>
                      <input id="f-name" autoComplete="name" value={form.name} onChange={set('name')} placeholder="Giulia Bianchi" />
                      {touched && fieldErrors.name && <em>{fieldErrors.name}</em>}
                    </div>
                    <div className="line-field">
                      <label htmlFor="f-email">Email <small>qui ti arriva il link Meet</small></label>
                      <input id="f-email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="giulia@gmail.com" />
                      {touched && fieldErrors.email && <em>{fieldErrors.email}</em>}
                    </div>
                    <div className="line-field">
                      <label htmlFor="f-phone">WhatsApp</label>
                      <div className="phone-in">
                        <select aria-label="Prefisso" value={form.prefix} onChange={set('prefix')}>
                          {PREFIXES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <input id="f-phone" type="tel" inputMode="tel" autoComplete="tel-national" value={form.phone} onChange={set('phone')} placeholder="333 123 4567" />
                      </div>
                      {touched && fieldErrors.phone && <em>{fieldErrors.phone}</em>}
                    </div>
                    {subjectInfo?.levels?.length > 0 && (
                      <div className="line-field">
                        <label>Livello</label>
                        <div className="chips">
                          {subjectInfo.levels.map((l) => (
                            <button key={l} type="button" className={form.level === l ? 'sel' : ''} aria-pressed={form.level === l} onClick={() => setForm((f) => ({ ...f, level: f.level === l ? '' : l }))}>{l}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="line-field">
                      <label htmlFor="f-notes">Su cosa vuoi lavorare? <small>facoltativo</small></label>
                      <textarea id="f-notes" rows={3} maxLength={600} value={form.notes} onChange={set('notes')} placeholder="Es. verifica sulle derivate venerdì, non mi tornano i limiti notevoli…" />
                    </div>
                    <input className="hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />
                    <p className="nb-small">Ricorda: è una richiesta. La lezione è confermata solo quando ricevi il link Meet.</p>
                    <label className="consent">
                      <input type="checkbox" checked={form.consent} onChange={set('consent')} />
                      <span>Va bene essere contattato/a su WhatsApp ed email per questa prenotazione.</span>
                    </label>
                    {touched && fieldErrors.consent && <em className="err-inline">{fieldErrors.consent}</em>}
                  </form>
                )}

                {error && <p className="nb-error" role="alert">{error}</p>}

                <div className="nb-actions">
                  {step > 0 ? <button type="button" className="btn btn-ghost-ink" onClick={() => go(step - 1)}>Indietro</button> : <span />}
                  {step < 2 ? (
                    <button type="button" className="btn btn-ink" disabled={!canNext} onClick={() => go(step + 1)}>Continua</button>
                  ) : (
                    <button type="button" className="btn btn-ink" disabled={sending} onClick={submit}>
                      {sending ? <><span className="spinner" /> Invio…</> : offline ? 'Invia su WhatsApp' : 'Invia la richiesta'}
                    </button>
                  )}
                </div>
              </div>

              <aside className="nb-sum postit postit-y" aria-label="Riepilogo">
                <span className="tape" />
                <h4>Riepilogo</h4>
                <dl>
                  <div><dt>Materia</dt><dd>{subject || '…'}</dd></div>
                  <div><dt>Durata</dt><dd>{duration ? fmtMin(duration) : '…'}</dd></div>
                  <div><dt>Giorno</dt><dd>{date ? longDate(date) : '…'}</dd></div>
                  <div><dt>Ora</dt><dd>{time || '…'}</dd></div>
                </dl>
                <p className="nb-price-note">Il prezzo lo concordiamo su WhatsApp.</p>
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
