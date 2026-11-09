import { useInView } from '../hooks.js';

// Tratti "a mano" che si disegnano quando entrano nello schermo
const PATHS = {
  circle: { vb: '0 0 220 90', d: 'M36 46 C 30 16, 176 4, 202 34 C 222 64, 74 92, 24 62 C 2 48, 38 16, 126 12' },
  arrow: { vb: '0 0 130 90', d: 'M10 80 C 26 40, 64 18, 116 22 M98 8 L118 22 L100 38' },
  arrowDown: { vb: '0 0 90 130', d: 'M20 6 C 64 26, 74 70, 50 118 M34 100 L50 120 L66 102' },
  underline: { vb: '0 0 220 22', d: 'M4 15 C 60 6, 140 4, 216 11' },
  check: { vb: '0 0 120 110', d: 'M10 58 C 26 70, 38 84, 46 98 C 62 62, 86 30, 114 8' },
  star: { vb: '0 0 60 60', d: 'M30 4 L36 24 L56 24 L40 36 L46 56 L30 44 L14 56 L20 36 L4 24 L24 24 Z' },
};

export default function Scribble({ type = 'underline', className = '', color = 'var(--red)', width = 3, delay = 0 }) {
  const [ref, seen] = useInView({ threshold: 0.6, once: true });
  const p = PATHS[type];
  return (
    <svg
      ref={ref}
      viewBox={p.vb}
      className={`scribble ${seen ? 'drawn' : ''} ${className}`}
      style={{ '--delay': `${delay}ms` }}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d={p.d}
        pathLength="1"
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Bordo di carta strappata per le sezioni "quaderno" */
const tearPath = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  let d = 'M0 30 L0 14';
  for (let x = 0; x <= 1440; x += 18 + rnd() * 26) d += ` L${x.toFixed(0)} ${(6 + rnd() * 14).toFixed(1)}`;
  return `${d} L1440 12 L1440 30 Z`;
})();

export function Tear({ position = 'top' }) {
  return (
    <svg className={`tear tear-${position}`} viewBox="0 0 1440 30" preserveAspectRatio="none" aria-hidden="true">
      <path d={tearPath} fill="var(--paper)" />
    </svg>
  );
}
