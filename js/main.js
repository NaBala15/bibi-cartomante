/* ============================================================
   BiBi Cartomante — main.js
   • Header muda ao rolar
   • Menu mobile (toggle)
   • Scroll reveal via IntersectionObserver
   • Flip nas cartas do hero (click/hover)
   • Ano do rodapé automático
   ============================================================ */

(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Ano do rodapé ---------------------------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header com estado ao rolar --------------------- */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Menu mobile ------------------------------------ */
  const toggle = document.querySelector('.nav-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    // Fecha ao clicar num link do menu
    document.querySelectorAll('.nav a').forEach((a) => {
      a.addEventListener('click', () => {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll reveal ---------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---------- Cartas do hero — flip ------------------------- */
  const cards = document.querySelectorAll('.oracle-card');
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
    });
    // Ao carregar a página, gira as três cartas em sequência para
    // apresentar a mecânica — sem virar por completo, um "aceno".
    if (!reduced) {
      setTimeout(() => {
        card.classList.add('is-flipped');
        setTimeout(() => card.classList.remove('is-flipped'), 900);
      }, 900 + i * 260);
    }
  });

  /* ---------- Suporte a teclado nas cartas ------------------ */
  cards.forEach((card) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  /* ---------- Roda de feedbacks ----------------------------- */
  /* 24 prints reais em círculo. A carta ativa aparece grande no
     centro ("carta puxada"). Autoplay a cada 5s; click escolhe;
     click no centro amplia no lightbox. */
  const wheel = document.getElementById('feedback-wheel');
  const ring  = document.getElementById('wheel-ring');
  const centerBtn = document.getElementById('wheel-center');
  const centerImg = document.getElementById('wheel-center-img');
  const dotsWrap = document.getElementById('wheel-dots');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCounter = document.getElementById('lightbox-counter');

  if (wheel && ring && centerBtn && centerImg) {

    const N = 24; // feedback-01.jpeg ... feedback-24.jpeg
    const srcFor = (i) => `assets/img/feedbacks/feedback-${String(i + 1).padStart(2, '0')}.jpeg`;
    // Miniaturas leves (220px) para as cartas da roda — geradas a partir dos prints
    const thumbFor = (i) => `assets/img/feedbacks/feedback-${String(i + 1).padStart(2, '0')}-thumb.jpeg`;

    // ---- Gera as 24 cartas em círculo ----
    // Cada carta é posicionada por --tx, --ty (seno/cosseno).
    // A contra-rotação no CSS mantém as miniaturas em pé
    // enquanto o anel gira lentamente.
    const cards = [];
    const radius = 0.42; // fração da largura da wheel — casa com --ring-radius no CSS
    for (let i = 0; i < N; i++) {
      // Começa no topo (i=0 no ápice) e segue em sentido horário
      const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
      const tx = Math.cos(angle) * radius * 100;
      const ty = Math.sin(angle) * radius * 100;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'wheel__card';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-index', String(i));
      btn.setAttribute('aria-label', `Ver feedback ${i + 1} de ${N}`);
      // cqi escala junto com a wheel em qualquer resolução
      btn.style.setProperty('--tx', `${tx}cqi`);
      btn.style.setProperty('--ty', `${ty}cqi`);
      btn.innerHTML = `<img class="wheel__card-img" src="${thumbFor(i)}" alt="" loading="lazy" decoding="async" />`;
      ring.appendChild(btn);
      cards.push(btn);
    }

    // `cqi` é unidade de container query — a wheel precisa ser container
    wheel.style.containerType = 'inline-size';

    // ---- Dots ----
    const dots = [];
    for (let i = 0; i < N; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'wheel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Feedback ${i + 1}`);
      dot.setAttribute('data-index', String(i));
      dotsWrap.appendChild(dot);
      dots.push(dot);
    }

    // ---- Estado e transições ----
    let activeIndex = -1;

    const setActive = (idx) => {
      if (idx === activeIndex) return;
      activeIndex = idx;

      cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));

      // Fade suave do print central
      centerImg.classList.add('is-out');
      setTimeout(() => {
        centerImg.src = srcFor(idx);
        centerImg.alt = `Print de feedback de consulente ${idx + 1} de ${N}`;
        centerImg.classList.remove('is-out');
      }, reduced ? 0 : 220);
    };

    // ---- Autoplay ----
    let autoplayId = null;
    const AUTOPLAY_MS = 5000;
    const startAutoplay = () => {
      stopAutoplay();
      autoplayId = setInterval(() => setActive((activeIndex + 1) % N), AUTOPLAY_MS);
    };
    const stopAutoplay = () => {
      if (autoplayId) clearInterval(autoplayId);
      autoplayId = null;
    };
    // Interação manual: pausa e retoma depois de 12s de ociosidade
    let resumeId = null;
    const pauseThenResume = () => {
      stopAutoplay();
      if (resumeId) clearTimeout(resumeId);
      resumeId = setTimeout(startAutoplay, 12000);
    };

    // ---- Interações na roda ----
    ring.addEventListener('click', (e) => {
      const c = e.target.closest('.wheel__card');
      if (!c) return;
      pauseThenResume();
      setActive(Number(c.dataset.index));
    });
    dotsWrap.addEventListener('click', (e) => {
      const d = e.target.closest('.wheel__dot');
      if (!d) return;
      pauseThenResume();
      setActive(Number(d.dataset.index));
    });

    // Pausa autoplay quando a roda sai da tela (poupa CPU)
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting && !lightbox?.open) startAutoplay();
          else stopAutoplay();
        });
      }, { threshold: 0.1 });
      io.observe(wheel);
    } else {
      startAutoplay();
    }

    // ---- Lightbox (ampliar o print) ----
    if (lightbox && lightboxImg) {
      let lbIndex = 0;

      const showLb = (idx) => {
        lbIndex = (idx + N) % N;
        lightboxImg.src = srcFor(lbIndex);
        lightboxImg.alt = `Print de feedback ${lbIndex + 1} de ${N}`;
        lightboxCounter.textContent = `${lbIndex + 1} / ${N}`;
        // Mantém a roda sincronizada com o print visto —
        // não dependemos do evento 'close' do dialog (inconsistente entre browsers)
        setActive(lbIndex);
      };

      const closeLb = () => {
        if (typeof lightbox.close === 'function') lightbox.close();
        else lightbox.removeAttribute('open');
        pauseThenResume();
      };

      centerBtn.addEventListener('click', () => {
        stopAutoplay();
        showLb(activeIndex);
        if (typeof lightbox.showModal === 'function') lightbox.showModal();
        else lightbox.setAttribute('open', '');
      });

      lightbox.querySelector('[data-lb-close]')?.addEventListener('click', closeLb);
      lightbox.querySelector('[data-lb-prev]')?.addEventListener('click', () => showLb(lbIndex - 1));
      lightbox.querySelector('[data-lb-next]')?.addEventListener('click', () => showLb(lbIndex + 1));

      // Clique no backdrop fecha
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLb();
      });
      // Setas navegam; ESC fecha nativamente
      lightbox.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
        if (e.key === 'ArrowRight') showLb(lbIndex + 1);
      });
      // ESC / fechamento nativo: retoma o autoplay (a roda já está em dia via showLb)
      lightbox.addEventListener('cancel', pauseThenResume);
      lightbox.addEventListener('close', pauseThenResume);
    }

    // Estado inicial
    setActive(0);
  }

})();
