import { useEffect, useState } from 'react';
import { site } from '../site.config.js';
import { useInView } from '../hooks.js';
import HeroPlot from './HeroPlot.jsx';
import Demo from './Demos.jsx';
import PhoneFlow from './PhoneFlow.jsx';
import Scribble, { Tear } from './Scribble.jsx';

const fmtMin = (m) => (m % 60 === 0 ? `${m / 60} ${m === 60 ? 'ora' : 'ore'}` : `${Math.floor(m / 60)}h e ${m % 60}`);

/* ───────────── NAV ───────────── */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);
  const links = [
    ['#chi-sono', 'Chi sono'],
    ['#materie', 'Materie'],
    ['#come-funziona', 'Come funziona'],
    ['#prezzi', 'Durata e prezzo'],
    ['#faq', 'Domande'],
  ];
  const close = () => setOpen(false);
  return (
    <header className={`nav ${scrolled ? 'nav-solid' : ''} ${open ? 'nav-open' : ''}`}>
      <div className="nav-in">
        <a href="#top" className="logo" onClick={close}>
          <span className="logo-hl">{site.firstName}</span><span className="logo-dot">.</span>
        </a>
        <nav className="nav-links" aria-label="Sezioni">
          {links.map(([href, label], i) => (
            <a key={href} href={href} onClick={close} style={{ '--i': i }}>{label}</a>
          ))}
          <a href="#prenota" className="btn btn-hl nav-links-cta" onClick={close} style={{ '--i': links.length }}>Chiedi una lezione</a>
        </nav>
        <a href="#prenota" className="btn btn-hl btn-sm nav-cta" onClick={close}>Richiedi</a>
        <button className="burger" aria-label={open ? 'Chiudi menu' : 'Apri menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}

/* ───────────── HERO ───────────── */
export function Hero() {
  const h = site.hero;
  const [touch, setTouch] = useState(false);
  useEffect(() => setTouch(!window.matchMedia('(pointer: fine)').matches), []);
  return (
    <section className="hero" id="top">
      <HeroPlot />
      <div className="hero-fade" aria-hidden="true" />
      <div className="wrap hero-in">
        <h1 className="hero-title">
          {h.lines.map((l, i) => (
            <span key={l} className="hero-line" style={{ '--i': i }}><span>{l}</span></span>
          ))}
          <span className="hero-line" style={{ '--i': h.lines.length }}>
            <span><mark className="hl hl-anim">{h.highlight}</mark></span>
          </span>
        </h1>
        <p className="hero-sub">{h.subtitle}</p>
        <div className="hero-ctas">
          <a href="#prenota" className="btn btn-hl btn-lg">Chiedi una lezione</a>
          <a href="#come-funziona" className="btn btn-line btn-lg">Come funziona</a>
        </div>
      </div>
      <p className="hero-note" aria-hidden="true">
        <Scribble type="arrow" className="hero-note-arrow" color="var(--chalk-2)" width={2.5} delay={2200} />
        {touch ? h.noteTouch : h.note}
      </p>
    </section>
  );
}

export function Marquee() {
  const items = [...site.marquee, ...site.marquee];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {items.map((t, i) => (
          <span key={i} className={i % 2 ? 'mq-code' : 'mq-hand'}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ───────────── CHI SONO (carta) ───────────── */
export function About() {
  const a = site.about;
  return (
    <section className="paper" id="chi-sono">
      <Tear position="top" />
      <div className="wrap about">
        <figure className="polaroid">
          <span className="tape" />
          <div className="polaroid-img">
            {site.photo ? <img src={site.photo} alt={site.name} /> : <Doodle />}
          </div>
          <figcaption>{site.name} · {site.city}</figcaption>
          <span className="about-note">
            <Scribble type="arrowDown" className="about-note-arrow" width={2.5} />
            {a.note}
          </span>
        </figure>
        <div className="about-text">
          <h2 className="h2 h2-ink">{a.title}</h2>
          {a.paragraphs.map((p) => <p key={p.slice(0, 20)} className="body-ink">{p}</p>)}
          <Notice />
          <ul className="facts">
            {a.facts.map((f, i) => (
              <li key={f.label}>
                <b>
                  {f.value}
                  <Scribble type="circle" className="fact-circle" delay={i * 250} width={2.5} />
                </b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Tear position="bottom" />
    </section>
  );
}

/** Nota a penna rossa: le ripetizioni sono nel tempo libero */
export function Notice({ className = '' }) {
  return (
    <aside className={`notice ${className}`}>
      <b>{site.notice.title}</b>
      <p>{site.notice.text}</p>
    </aside>
  );
}

/** Autoritratto a matita: compare se non c'è una foto */
function Doodle() {
  return (
    <svg viewBox="0 0 240 280" className="doodle" aria-label="Disegno di Simone">
      <g fill="none" stroke="var(--pen)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 280 C 62 220, 90 196, 120 196 C 152 196, 180 220, 182 280" />
        <path d="M120 196 L 120 176" />
        <path d="M78 112 C 74 60, 106 38, 128 40 C 160 42, 172 74, 166 112 C 162 150, 140 176, 120 176 C 98 176, 82 150, 78 112 Z" />
        <path d="M76 98 C 84 58, 112 34, 146 44 C 166 52, 176 74, 168 96 C 152 78, 120 76, 100 70 C 92 82, 84 92, 76 98 Z" fill="var(--pen)" />
        <circle cx="104" cy="114" r="15" />
        <circle cx="142" cy="114" r="15" />
        <path d="M119 114 L 127 114" />
        <path d="M108 148 C 116 156, 130 156, 138 148" />
        <circle cx="104" cy="115" r="2.5" fill="var(--pen)" />
        <circle cx="142" cy="115" r="2.5" fill="var(--pen)" />
      </g>
      <text x="168" y="232" fontFamily="Caveat" fontWeight="700" fontSize="34" fill="var(--red)">π</text>
      <text x="34" y="226" fontFamily="Caveat" fontWeight="700" fontSize="30" fill="var(--red)">{'{ }'}</text>
    </svg>
  );
}

/* ───────────── MATERIE ───────────── */
export function Subjects() {
  const [active, setActive] = useState(0);
  const [userPicked, setUserPicked] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.3 });
  const s = site.subjects[active];

  const pick = (i) => { setUserPicked(true); setActive(i); };
  const next = () => {
    if (userPicked) return;
    setTimeout(() => setActive((i) => (i + 1) % site.subjects.length), 2600);
  };

  return (
    <section className="dark subjects" id="materie" ref={ref}>
      <div className="wrap">
        <h2 className="h2">Su cosa possiamo lavorare</h2>
        <p className="lead">Tocca una materia e guarda un pezzo di lezione.</p>
        <div className="subj">
          <div className="subj-list" role="tablist" aria-label="Materie">
            {site.subjects.map((x, i) => (
              <button
                key={x.name}
                role="tab"
                aria-selected={i === active}
                className={`subj-tab ${i === active ? 'on' : ''}`}
                onClick={() => pick(i)}
              >
                <span className="subj-name">{x.name}</span>
                <span className="subj-detail">
                  <span className="subj-detail-in">
                    <span className="subj-desc">{x.desc}</span>
                    <span className="levels">{x.levels.map((l) => <i key={l}>{l}</i>)}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="subj-board" role="tabpanel" aria-label={s.name}>
            <Demo demo={s.demo} playing={inView} loop={userPicked} onDone={next} />
            <div className="subj-desc-m" key={s.name}>
              <p>{s.desc}</p>
              <span className="levels">{s.levels.map((l) => <i key={l}>{l}</i>)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── COME FUNZIONA (carta) ───────────── */
export function HowItWorks() {
  return (
    <section className="paper" id="come-funziona">
      <Tear position="top" />
      <div className="wrap">
        <h2 className="h2 h2-ink">Dalla richiesta al link Meet, senza telefonate</h2>
        <p className="body-ink lead-ink">Ecco cosa succede davvero quando prenoti.</p>
        <PhoneFlow />
      </div>
      <Tear position="bottom" />
    </section>
  );
}

/* ───────────── PREZZI ───────────── */
export function Pricing() {
  const entries = Object.entries(site.durationNotes).map(([m, note]) => [Number(m), note]);
  const colors = ['postit-y', 'postit-m', 'postit-p'];
  return (
    <section className="dark" id="prezzi">
      <div className="wrap">
        <h2 className="h2">{site.pricing.title}</h2>
        <p className="lead">{site.pricing.text}</p>
        <div className="postits">
          {entries.map(([min, note], i) => (
            <a key={min} href="#prenota" className={`postit ${colors[i % 3]}`} style={{ '--r': `${[-3, 2, -1.5][i % 3]}deg` }}>
              <span className="postit-dur">lezione da</span>
              <b className="postit-price">{fmtMin(min)}</b>
              <span className="postit-note">{note}</span>
              <span className="postit-go">Richiedi</span>
            </a>
          ))}
        </div>
        <p className="price-chat">
          <span className="price-chat-bubble">Quanto viene?</span>
          <span className="price-chat-bubble me">Ne parliamo su WhatsApp 😉</span>
        </p>
      </div>
    </section>
  );
}

/* ───────────── FAQ (carta) ───────────── */
export function Faq() {
  return (
    <section className="paper" id="faq">
      <Tear position="top" />
      <div className="wrap narrow">
        <h2 className="h2 h2-ink">Domande frequenti</h2>
        <div className="faq">
          {site.faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}<span className="faq-x" aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <Tear position="bottom" />
    </section>
  );
}

/* ───────────── FOOTER ───────────── */
export function Footer() {
  const { email, instagram } = site.contacts;
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <a href="#top" className="logo"><span className="logo-hl">{site.firstName}</span><span className="logo-dot">.</span></a>
        <nav className="footer-links">
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {instagram && <a href={instagram} target="_blank" rel="noreferrer">Instagram</a>}
          <a href="#prenota">Chiedi una lezione</a>
        </nav>
        <small>© {new Date().getFullYear()} {site.name}, {site.city}</small>
      </div>
    </footer>
  );
}
