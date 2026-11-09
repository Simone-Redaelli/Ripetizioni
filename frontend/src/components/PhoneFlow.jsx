import { useEffect, useState } from 'react';
import { useInView, reducedMotion } from '../hooks.js';
import { site } from '../site.config.js';

// Timeline della demo (ms): quando compare ogni cosa
const T = { request: 700, tap: 3300, reply: 3800, confirm: 5600, card: 6300, live: 8600, end: 11500 };
const STEP_AT = [0, 2900, 5300, 8300]; // in che momento si accende ogni passo a sinistra

export default function PhoneFlow() {
  const [ref, inView] = useInView({ threshold: 0.35 });
  const [t, setT] = useState(reducedMotion() ? T.end - 1 : 0);

  useEffect(() => {
    if (!inView || reducedMotion()) return;
    const t0 = performance.now() - t;
    const id = setInterval(() => setT((performance.now() - t0) % T.end), 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const at = (k) => t >= T[k];
  const step = STEP_AT.reduce((acc, s, i) => (t >= s ? i : acc), 0);
  const [m, f] = [t > T.end - 900, at('live')];

  return (
    <div className="flow" ref={ref}>
      <ol className="flow-steps">
        {site.steps.map((s, i) => (
          <li key={s.title} className={i === step ? 'on' : i < step ? 'past' : ''}>
            <span className="flow-n">{i + 1}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="flow-cap" key={step} aria-live="polite">
        <b>{site.steps[step].title}.</b> {site.steps[step].text}
      </p>

      <div className={`phone-wrap ${m ? 'fade' : ''}`}>
        <div className="phone">
          <div className="phone-notch" />
          <div className="chat-head">
            <span className="chat-avatar">R</span>
            <div><b>Ripetizioni · prenotazioni</b><small>{at('tap') && !at('reply') ? 'sta scrivendo…' : 'online'}</small></div>
          </div>
          <div className="chat">
            <div className="chat-day">oggi</div>
            {at('request') && (
              <div className="bubble in pop">
                <b>📚 Nuova richiesta di ripetizioni</b>
                <span>Studente: Giulia</span>
                <span>Materia: Matematica</span>
                <span>Quando: giovedì alle 17:00</span>
                <span>Durata: 1 ora</span>
                <em className="st">15:02</em>
                <div className="bubble-btns">
                  <span className={at('tap') ? 'pressed' : ''}>✅ Accetta</span>
                  <span>❌ Rifiuta</span>
                </div>
              </div>
            )}
            {at('reply') && <div className="bubble out pop">✅ Accetta<em>15:03 ✓✓</em></div>}
            {at('confirm') && (
              <div className="bubble in pop">
                <b>✅ Confermata · Giulia</b>
                <span>🎥 meet.google.com/kxe-vbqa-pmt</span>
                <span>📨 Email, invito e WhatsApp inviati.</span>
                <em>15:03</em>
              </div>
            )}
          </div>
        </div>

        <div className={`cal-card ${at('card') ? 'show' : ''} ${f ? 'live' : ''}`}>
          <span className="cal-date"><small>GIO</small><b>12</b></span>
          <div>
            <b>Ripetizioni Matematica – Giulia</b>
            <small>17:00 – 18:00 · Google Meet</small>
            <span className="cal-join">{f ? '● Lezione in corso · Entra' : 'Invito inviato a giulia@gmail.com'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
