/* ============================================================
   BiBi Cartomante — starfield.js
   Céu animado atrás da página inteira:
   • ~200 estrelas cintilando em canvas (leve, DPR limitado a 2)
   • Estrela cadente a cada 3–5,5s
   • Duas névoas (violeta e magenta) derivando lentamente
   Respeita prefers-reduced-motion: se ativo, nada roda —
   fica só o fundo estático da galáxia (base.css).
   ============================================================ */

(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  /* Ajuste rápido: 0–100. Sobe = estrelas mais brilhantes. */
  const INTENSITY = 60;

  /* ---------- Camada fixa atrás do conteúdo ------------------ */
  const layer = document.createElement('div');
  layer.className = 'sky-fx';
  layer.setAttribute('aria-hidden', 'true');

  const nebViolet = document.createElement('div');
  nebViolet.className = 'sky-fx__nebula sky-fx__nebula--violet';
  const nebMagenta = document.createElement('div');
  nebMagenta.className = 'sky-fx__nebula sky-fx__nebula--magenta';

  const canvas = document.createElement('canvas');
  canvas.className = 'sky-fx__canvas';

  layer.append(nebViolet, nebMagenta, canvas);
  document.body.prepend(layer);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  /* ---------- Dimensionamento (DPR máx. 2) ------------------- */
  let W = 0, H = 0;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  /* ---------- Estrelas fixas (cintilam e derivam) ------------ */
  // Quantidade proporcional à tela, entre 120 e 240
  const starCount = Math.max(120, Math.min(240, Math.round((W * H) / 9000)));
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random(),                       // posição normalizada 0–1
      y: Math.random(),
      size: Math.random() * 1.8 + 0.2,
      baseOpacity: Math.random() * 0.55 + 0.35,
      phase: Math.random() * Math.PI * 2,     // fase da cintilação
      speed: Math.random() * 0.028 + 0.006,   // velocidade da cintilação
      driftX: (Math.random() - 0.5) * 0.00018, // deriva bem lenta
      driftY: (Math.random() - 0.5) * 0.00012,
    });
  }

  /* ---------- Estrelas cadentes ------------------------------ */
  const meteors = [];
  let lastMeteor = performance.now();
  let meteorGap = 3000 + Math.random() * 2500;

  const spawnMeteor = () => {
    // Nasce no topo (indo pra baixo-direita) ou na esquerda
    if (Math.random() > 0.5) {
      meteors.push({
        x: Math.random() * W * 0.6, y: -20,
        vx: 600 + Math.random() * 500, vy: 280 + Math.random() * 320,
        life: 0, maxLife: 1.2 + Math.random() * 0.6,
        size: 1.8 + Math.random() * 1.2,
      });
    } else {
      meteors.push({
        x: -20, y: Math.random() * H * 0.5,
        vx: 700 + Math.random() * 600, vy: 250 + Math.random() * 280,
        life: 0, maxLife: 1.2 + Math.random() * 0.6,
        size: 1.8 + Math.random() * 1.2,
      });
    }
  };

  /* ---------- Loop ------------------------------------------- */
  const globalGain = 0.2 + (INTENSITY / 100) * 1.6;   // brilho geral
  const twinkleAmp = 0.35 + (INTENSITY / 100) * 0.55; // amplitude da cintilação
  let last = performance.now();

  const draw = (now, dt) => {
    /* Névoas derivam com seno/cosseno do tempo */
    const t1 = now * 0.00007;
    const t2 = now * 0.00005;
    nebViolet.style.transform =
      `translate3d(${Math.sin(t1) * W * 0.12}px, ${Math.cos(t1 * 0.7) * H * 0.08}px, 0)`;
    nebMagenta.style.transform =
      `translate3d(${Math.cos(t2) * W * 0.15}px, ${Math.sin(t2 * 0.8) * H * 0.1}px, 0)`;

    ctx.clearRect(0, 0, W, H);

    /* Estrelas fixas */
    for (const s of stars) {
      s.phase += s.speed * (dt / 16.666);
      s.x += s.driftX * dt;
      s.y += s.driftY * dt;
      if (s.x < -0.02) s.x = 1.02; else if (s.x > 1.02) s.x = -0.02;
      if (s.y < -0.02) s.y = 1.02; else if (s.y > 1.02) s.y = -0.02;

      const tw = Math.sin(s.phase);
      const op = s.baseOpacity * (1 - twinkleAmp * 0.5 + tw * twinkleAmp * 0.5) * globalGain;
      ctx.globalAlpha = Math.max(0.05, Math.min(1, op));
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.size, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      if (s.size > 1.1) {
        ctx.shadowColor = 'rgba(200, 170, 255, 0.8)';
        ctx.shadowBlur = s.size * 3.5;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    /* Estrelas cadentes */
    if (now - lastMeteor > meteorGap) {
      lastMeteor = now;
      meteorGap = 3000 + Math.random() * 2500;
      spawnMeteor();
    }
    const alive = [];
    for (const m of meteors) {
      m.life += dt / 1000;
      if (m.life > m.maxLife) continue;
      m.x += m.vx * dt / 1000;
      m.y += m.vy * dt / 1000;

      const p = m.life / m.maxLife;
      const fade = 1 - p;
      const tail = 120 + p * 80;
      const ang = Math.atan2(m.vy, m.vx);
      const tx = m.x - Math.cos(ang) * tail;
      const ty = m.y - Math.sin(ang) * tail;

      const grad = ctx.createLinearGradient(tx, ty, m.x, m.y);
      grad.addColorStop(0,    'rgba(255,255,255,0)');
      grad.addColorStop(0.15, `rgba(200,170,255,${0.15 * fade})`);
      grad.addColorStop(0.6,  `rgba(230,210,255,${0.5 * fade})`);
      grad.addColorStop(1,    `rgba(255,255,255,${fade})`);
      ctx.beginPath();
      ctx.strokeStyle = grad;
      ctx.lineWidth = m.size;
      ctx.lineCap = 'round';
      ctx.moveTo(tx, ty);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${fade})`;
      ctx.shadowColor = 'rgba(190,150,255,0.9)';
      ctx.shadowBlur = 12 * fade;
      ctx.arc(m.x, m.y, m.size * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (m.x < W + 200 && m.y < H + 200) alive.push(m);
    }
    meteors.length = 0;
    meteors.push(...alive);
  };

  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(32, now - last);
    last = now;
    draw(now, dt);
  };

  /* Primeiro quadro imediato: o céu já nasce estrelado mesmo antes
     do primeiro tick do rAF (ou se a aba abrir em segundo plano). */
  draw(performance.now(), 16);
  requestAnimationFrame(frame);
})();
