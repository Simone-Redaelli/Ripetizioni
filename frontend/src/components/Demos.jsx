import { useEffect, useMemo, useRef, useState } from 'react';
import { reducedMotion } from '../hooks.js';

// Ogni riga è un elenco di [testo, classe]
const DEMOS = {
  math: {
    kind: 'chalk',
    title: 'Studio di funzione',
    lines: [
      [['f(x) = x³ − 3x', '']],
      [['f′(x) = 3x² − 3', '']],
      [['3x² − 3 = 0', ''], ['   →   x² = 1', 'dim']],
      [['x = ±1', 'ans']],
      [['max in x = −1, min in x = 1 ✓', 'note']],
    ],
  },
  code: {
    kind: 'code',
    title: 'fibonacci.py',
    lines: [
      [['def ', 'kw'], ['fibonacci', 'fn'], ['(n):', '']],
      [['    a, b = ', ''], ['0', 'num'], [', ', ''], ['1', 'num']],
      [['    for ', 'kw'], ['_ ', ''], ['in ', 'kw'], ['range', 'fn'], ['(n):', '']],
      [['        a, b = b, a + b', '']],
      [['    return ', 'kw'], ['a', '']],
      [['', '']],
      [['print', 'fn'], ['(fibonacci(', ''], ['10', 'num'], ['))', '']],
      [['>>> 55', 'res']],
    ],
  },
  web: {
    kind: 'code',
    title: 'index.html',
    lines: [
      [['<button ', 'kw'], ['class', 'fn'], ['=', ''], ['"prenota"', 'str'], ['>', 'kw']],
      [['  Prenota la lezione', '']],
      [['</button>', 'kw']],
      [['', '']],
      [['.prenota', 'fn'], [' {', '']],
      [['  background', 'num'], [': ', ''], ['#FFE45C', 'str'], [';', '']],
      [['  rotate', 'num'], [': ', ''], ['-2deg', 'str'], [';', '']],
      [['}', '']],
    ],
    preview: true,
  },
  en: {
    kind: 'chalk',
    title: 'Present perfect',
    lines: [
      [['I ', ''], ['have lived', 'ans'], [' in Turin', '']],
      [['for ten years.', '']],
      [['→ abito a Torino da dieci anni', 'dim']],
      [['', '']],
      [['have / has + participio passato', 'note']],
      [['since 2016 ✓   for ten years ✓', 'note']],
    ],
  },
  fr: {
    kind: 'chalk',
    title: 'Il verbo être',
    lines: [
      [['je ', ''], ['suis', 'ans'], ['     nous ', ''], ['sommes', 'ans']],
      [['tu ', ''], ['es', 'ans'], ['        vous ', ''], ['êtes', 'ans']],
      [['il/elle ', ''], ['est', 'ans'], ['  ils ', ''], ['sont', 'ans']],
      [['', '']],
      [['Je suis prêt pour la leçon !', '']],
      [['→ sono pronto per la lezione ✓', 'note']],
    ],
  },
  bin: {
    kind: 'chalk mono',
    title: 'Da decimale a binario',
    lines: [
      [['42 : 2 = 21  ', ''], ['resto 0', 'dim']],
      [['21 : 2 = 10  ', ''], ['resto 1', 'dim']],
      [['10 : 2 =  5  ', ''], ['resto 0', 'dim']],
      [[' 5 : 2 =  2  ', ''], ['resto 1', 'dim']],
      [[' 2 : 2 =  1  ', ''], ['resto 0', 'dim']],
      [[' 1 : 2 =  0  ', ''], ['resto 1', 'dim']],
      [['42 = ', ''], ['101010', 'ans'], ['₂', '']],
    ],
  },
};

const LINE_PAUSE = 9;

function Typer({ lines, playing, onDone, loop, speed = 30 }) {
  const reduce = reducedMotion();
  const total = useMemo(
    () => lines.reduce((n, l) => n + l.reduce((m, [t]) => m + t.length, 0) + LINE_PAUSE, 0),
    [lines],
  );
  const [n, setN] = useState(reduce ? total : 0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => setN(reduce ? total : 0), [lines, total, reduce]);

  useEffect(() => {
    if (!playing || reduce) return;
    let t;
    if (n < total) t = setTimeout(() => setN((x) => x + 1), speed);
    else {
      doneRef.current?.(true);
      if (loop) t = setTimeout(() => { setN(0); doneRef.current?.(false); }, 3400);
    }
    return () => clearTimeout(t);
  }, [n, total, playing, loop, speed, reduce]);

  let start = 0;
  return lines.map((line, i) => {
    const len = line.reduce((m, [t]) => m + t.length, 0);
    const s = start;
    start += len + LINE_PAUSE;
    let left = n - s;
    const parts = [];
    for (const [t, c] of line) {
      if (left <= 0) break;
      parts.push(<span key={parts.length} className={c}>{t.slice(0, left)}</span>);
      left -= t.length;
    }
    const typing = n >= s && n < s + len + LINE_PAUSE && n < total;
    const complete = n >= s + len && n > s;
    return (
      <div key={i} className={`tl ${complete ? 'tl-done' : ''} ${n >= s ? '' : 'tl-wait'}`}>
        {parts.length ? parts : ' '}
        {typing && <i className="caret" />}
      </div>
    );
  });
}

export default function Demo({ demo, playing, onDone, loop }) {
  const d = DEMOS[demo] ?? DEMOS.math;
  const [done, setDone] = useState(false);
  useEffect(() => setDone(false), [demo]);

  return (
    <div className={`board board-${d.kind.split(' ')[0]}`}>
      <div className="board-bar">
        <span className="board-dots"><i /><i /><i /></span>
        <span>{d.title}</span>
      </div>
      <div className={`board-body ${d.kind}`}>
        <div className="board-lines">
          <Typer
            key={demo}
            lines={d.lines}
            playing={playing}
            loop={loop}
            onDone={(finished) => { setDone(finished); if (finished) onDone?.(); }}
          />
        </div>
        {d.preview && (
          <div className={`board-preview ${done ? 'show' : ''}`}>
            <button type="button" tabIndex={-1} className="fake-btn">Prenota la lezione</button>
          </div>
        )}
      </div>
    </div>
  );
}
