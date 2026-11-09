import { useEffect, useRef } from 'react';
import { reducedMotion } from '../hooks.js';

// Funzioni che si trasformano una nell'altra
const FUNCS = [
  { f: (x) => 1.6 * Math.sin(1.1 * x), label: 'f(x) = 1.6 sin(1.1x)' },
  { f: (x) => 0.2 * x ** 3 - 1.1 * x, label: 'f(x) = 0.2x³ − 1.1x' },
  { f: (x) => 2.6 * Math.exp(-(x * x) / 1.8) - 0.9, label: 'f(x) = 2.6e^(−x²/1.8) − 0.9' },
  { f: (x) => 0.16 * x * x - 1.5, label: 'f(x) = 0.16x² − 1.5' },
];

const C = {
  minor: 'rgba(150, 175, 255, 0.07)',
  major: 'rgba(150, 175, 255, 0.13)',
  axis: 'rgba(238, 242, 255, 0.42)',
  curve: '#FFE45C',
  area: 'rgba(255, 228, 92, 0.13)',
  tangent: '#FF5A4E',
  chalk: '#EEF2FF',
};
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export default function HeroPlot() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const reduce = reducedMotion();
    let w = 0, h = 0, raf = 0, running = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const view = () => {
      const wide = w > 900;
      const unit = wide ? Math.max(56, Math.min(w / 15, 92)) : Math.max(40, Math.min(w / 7.5, 64));
      return { unit, wide, cx: wide ? w * 0.66 : w * 0.5, cy: wide ? h * 0.52 : h - Math.min(190, h * 0.24) };
    };

    // input
    let target = null, cur = null, lastMove = -1e9;
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      target = e.clientX - r.left;
      lastMove = performance.now();
    };
    host.addEventListener('pointermove', onMove, { passive: true });
    host.addEventListener('pointerdown', onMove, { passive: true });

    let idx = 0, next = 1, morphStart = null, lastSwitch = performance.now();
    const start = performance.now();

    const frame = (now) => {
      const v = view();
      const toPx = (x) => v.cx + x * v.unit;
      const toPy = (y) => v.cy - y * v.unit;
      const toX = (px) => (px - v.cx) / v.unit;

      // morph
      let mt = 0;
      if (!reduce) {
        if (morphStart === null && now - lastSwitch > 5600) morphStart = now;
        if (morphStart !== null) {
          mt = Math.min(1, (now - morphStart) / 1500);
          if (mt >= 1) { idx = next; next = (idx + 1) % FUNCS.length; morphStart = null; lastSwitch = now; mt = 0; }
        }
      }
      const m = ease(mt);
      const f = (x) => FUNCS[idx].f(x) * (1 - m) + FUNCS[next].f(x) * m;
      const df = (x) => (f(x + 0.001) - f(x - 0.001)) / 0.002;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      if (!v.wide) {
        // su telefono il grafico vive sotto al testo
        const top = v.cy - v.unit * 2.3;
        ctx.beginPath(); ctx.rect(0, top, w, h - top); ctx.clip();
      }

      // quadretti
      const half = v.unit / 2;
      ctx.lineWidth = 1;
      for (let i = Math.floor(-v.cx / half); i * half + v.cx < w; i++) {
        const x = Math.round(v.cx + i * half) + 0.5;
        ctx.strokeStyle = i % 2 === 0 ? C.major : C.minor;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let i = Math.floor(-v.cy / half); i * half + v.cy < h; i++) {
        const y = Math.round(v.cy + i * half) + 0.5;
        ctx.strokeStyle = i % 2 === 0 ? C.major : C.minor;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // assi
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Math.round(v.cy) + 0.5); ctx.lineTo(w, Math.round(v.cy) + 0.5);
      ctx.moveTo(Math.round(v.cx) + 0.5, 0); ctx.lineTo(Math.round(v.cx) + 0.5, h);
      ctx.stroke();
      ctx.fillStyle = C.axis;
      ctx.font = '500 12px "JetBrains Mono Variable", monospace';
      for (let i = -12; i <= 12; i++) {
        if (!i) continue;
        const px = toPx(i);
        if (px < 8 || px > w - 8) continue;
        ctx.fillText(String(i), px - (i < 0 ? 8 : 4), v.cy + 18);
      }

      // curva che si disegna all'avvio
      const xMin = toX(0), xMax = toX(w);
      const reveal = reduce ? 1 : ease(Math.min(1, (now - start) / 1800));
      const xEnd = xMin + (xMax - xMin) * reveal;

      // punto: segue il mouse, altrimenti oscilla da solo
      const auto = 2.4 * Math.sin((now - start) / 2600);
      const goal = target !== null && now - lastMove < 3500 ? toX(target) : auto;
      cur = cur === null ? goal : cur + (goal - cur) * 0.09;
      const px = Math.max(xMin + 0.3, Math.min(xMax - 0.3, cur));
      const showProbe = reveal > 0.98;

      // area (integrale da 0 a x)
      if (showProbe) {
        ctx.beginPath();
        ctx.moveTo(toPx(0), toPy(0));
        const steps = 80;
        let area = 0, prev = f(0);
        for (let i = 1; i <= steps; i++) {
          const x = (px * i) / steps;
          const y = f(x);
          area += ((prev + y) / 2) * (px / steps);
          prev = y;
          ctx.lineTo(toPx(x), toPy(y));
        }
        ctx.lineTo(toPx(px), toPy(0));
        ctx.closePath();
        ctx.fillStyle = C.area;
        ctx.fill();

        ctx.font = '700 22px Caveat, cursive';
        ctx.fillStyle = C.curve;
        const ax = toPx(px / 2) - 30;
        ctx.fillText(`∫ = ${area.toFixed(2)}`, ax, v.cy + (area >= 0 ? 34 : -18));
      }

      // curva
      ctx.save();
      ctx.shadowColor = 'rgba(255, 228, 92, 0.65)';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = C.curve;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = xMin; x <= xEnd; x += 2 / v.unit) {
        const y = toPy(f(x));
        if (x === xMin) ctx.moveTo(toPx(x), y);
        else ctx.lineTo(toPx(x), y);
      }
      ctx.stroke();
      ctx.restore();

      if (showProbe) {
        const y = f(px), d = df(px);
        const X = toPx(px), Y = toPy(y);

        // proiezioni tratteggiate
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(238, 242, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, v.cy); ctx.moveTo(X, Y); ctx.lineTo(v.cx, Y); ctx.stroke();
        ctx.setLineDash([]);

        // tangente
        const span = 1.8;
        ctx.strokeStyle = C.tangent;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(toPx(px - span), toPy(y - d * span));
        ctx.lineTo(toPx(px + span), toPy(y + d * span));
        ctx.stroke();

        // punto
        ctx.fillStyle = C.chalk;
        ctx.beginPath(); ctx.arc(X, Y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.curve; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(X, Y, 11, 0, Math.PI * 2); ctx.stroke();

        // etichetta derivata
        ctx.font = '700 24px Caveat, cursive';
        ctx.fillStyle = C.tangent;
        const label = `f′(${px.toFixed(1)}) = ${d.toFixed(2)}`;
        const lw = ctx.measureText(label).width;
        const lx = Math.min(Math.max(X + 18, 12), w - lw - 12);
        ctx.fillText(label, lx, Math.max(Y - 22, 28));
      }

      // nome della funzione
      ctx.font = `700 ${v.wide ? 26 : 21}px Caveat, cursive`;
      const tag = (text, alpha) => {
        ctx.globalAlpha = alpha * reveal * 0.85;
        ctx.fillStyle = C.chalk;
        const tw = ctx.measureText(text).width;
        ctx.fillText(text, w - tw - (v.wide ? 32 : 18), v.wide ? 132 : h - 18);
      };
      tag(FUNCS[idx].label, 1 - m);
      if (m > 0) tag(FUNCS[next].label, m);
      ctx.globalAlpha = 1;

      ctx.restore();
      if (running) raf = requestAnimationFrame(frame);
    };

    const play = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
    const pause = () => { running = false; cancelAnimationFrame(raf); };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()));
    io.observe(canvas);
    const onVis = () => (document.hidden ? pause() : play());
    document.addEventListener('visibilitychange', onVis);
    document.fonts?.ready.then(() => !running && requestAnimationFrame(frame));

    return () => {
      pause();
      io.disconnect();
      ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerdown', onMove);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-plot" aria-hidden="true" />;
}
