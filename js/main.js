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

  /* ---------- WhatsApp dentro do TikTok / Instagram ---------- */
  /* Navegadores embutidos (TikTok, Instagram, Facebook) bloqueiam o
     redirecionamento do wa.me. Estratégia em 3 camadas:
       1. Links usam https://api.whatsapp.com/send (formato universal, sem redirect)
       2. No celular, tentamos abrir o app direto via whatsapp:// e, se
          não abrir em ~1,5s, caímos para o link https normal
       3. Se detectarmos navegador embutido, mostramos uma faixa
          "Abrir no navegador" (no Android, com botão que pula para o Chrome)
     Para testar a faixa no desktop: abrir a página com ?inapp=1 */
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const debugInApp = new URLSearchParams(location.search).get('inapp'); // ?inapp=1 ou ?inapp=meta
  const isTikTok = /TikTok|musical_ly|Bytedance/i.test(ua) || debugInApp === '1';
  const isMeta = /Instagram|FBAN|FBAV|FB_IAB|Threads/i.test(ua) || debugInApp === 'meta';
  const inAppBrowser = isTikTok || isMeta || /Line\//i.test(ua);

  /* Dentro do TikTok, o WhatsApp é bloqueado por completo (esquema e domínio).
     Em vez de um toque que não faz nada, abrimos um cartão com o caminho
     (abrir no navegador) e a opção de copiar o número. */
  const ttModal = document.getElementById('tt-modal');
  if (isTikTok && ttModal) {
    const tryLink = ttModal.querySelector('[data-try-link]');
    const copyBtn = ttModal.querySelector('[data-copy-number]');
    const numberEl = document.getElementById('tt-number');
    const NUMBER = '+55 11 99367-7994';

    const openTT = (href) => {
      if (tryLink && href) tryLink.href = href;
      if (typeof ttModal.showModal === 'function') ttModal.showModal();
      else ttModal.setAttribute('open', '');
    };
    const closeTT = () => {
      if (typeof ttModal.close === 'function') ttModal.close();
      else ttModal.removeAttribute('open');
    };

    document.querySelectorAll('a[href^="https://api.whatsapp.com/send"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openTT(a.href);
      });
    });

    ttModal.querySelector('[data-tt-close]')?.addEventListener('click', closeTT);
    ttModal.addEventListener('click', (e) => { if (e.target === ttModal) closeTT(); });

    // Copia o número; se a área de transferência falhar, seleciona o texto
    // para a pessoa segurar e copiar manualmente.
    const copyText = async (text) => {
      try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (_) { return false; }
    };
    copyBtn?.addEventListener('click', async () => {
      const ok = await copyText(NUMBER);
      const original = copyBtn.textContent;
      if (ok) {
        copyBtn.textContent = 'Número copiado ✓';
      } else {
        copyBtn.textContent = 'Segure o número acima para copiar';
        const range = document.createRange();
        range.selectNodeContents(numberEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      setTimeout(() => { copyBtn.textContent = original; }, 2600);
    });
  }

  if (isMobile && !isTikTok) {
    document.querySelectorAll('a[href^="https://api.whatsapp.com/send"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const url = new URL(a.href);
        const phone = url.searchParams.get('phone') || '';
        const text = url.searchParams.get('text') || '';
        const scheme = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;

        // Tenta o app via iframe invisível (falha em silêncio se bloqueado)
        const probe = document.createElement('iframe');
        probe.style.display = 'none';
        probe.src = scheme;
        document.body.appendChild(probe);

        // Se a página continuar visível, o app não abriu: usa o link https
        setTimeout(() => {
          probe.remove();
          if (document.visibilityState === 'visible') {
            window.location.href = a.href;
          }
        }, 1500);
      });
    });
  }

  if (inAppBrowser && !sessionStorage.getItem('inappBannerDismissed')) {
    const banner = document.createElement('div');
    banner.className = 'inapp-banner';
    banner.setAttribute('role', 'status');

    // Texto de instrução manual (funciona em qualquer app: menu ⋯ → Abrir no navegador)
    const manualHint =
      `Para o WhatsApp abrir certinho, toque em <strong>⋯</strong> no canto superior ` +
      `e escolha <strong>Abrir no navegador</strong>.`;

    // O intent:// só é aceito por Instagram/Facebook. O TikTok bloqueia com erro,
    // então lá usamos uma tentativa silenciosa (iframe) e, se falhar, a instrução.
    const intentUrl =
      `intent://${location.host}${location.pathname}${location.search}` +
      `#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(location.href)};end`;

    if (isAndroid && isMeta) {
      banner.innerHTML =
        `<span>Para o WhatsApp abrir certinho, use o navegador do celular.</span>
         <a class="inapp-banner__btn" href="${intentUrl}">Abrir no Chrome</a>
         <button class="inapp-banner__close" type="button" aria-label="Fechar aviso">×</button>`;
    } else if (isAndroid || isIOS) {
      banner.innerHTML =
        `<span>${isTikTok ? 'O TikTok bloqueia o WhatsApp aqui dentro.' : 'Para o WhatsApp abrir certinho,'} Use o navegador do celular.</span>
         <button class="inapp-banner__btn" type="button" data-escape>Abrir no navegador</button>
         <button class="inapp-banner__close" type="button" aria-label="Fechar aviso">×</button>`;
    } else {
      banner.innerHTML =
        `<span>${manualHint}</span>
         <button class="inapp-banner__close" type="button" aria-label="Fechar aviso">×</button>`;
    }

    document.body.prepend(banner);
    document.body.classList.add('has-inapp-banner');

    // Tentativa silenciosa de pular para o navegador externo:
    // Android → Chrome (googlechrome://), iOS → Safari (x-safari-https://).
    // Se o app bloquear, nada de erro na tela: a faixa vira a instrução manual.
    banner.querySelector('[data-escape]')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Abrindo…';
      const target = isIOS
        ? location.href.replace(/^https:\/\//, 'x-safari-https://')
        : `googlechrome://navigate?url=${encodeURIComponent(location.href)}`;
      const probe = document.createElement('iframe');
      probe.style.display = 'none';
      probe.src = target;
      document.body.appendChild(probe);
      setTimeout(() => {
        probe.remove();
        if (document.visibilityState === 'visible') {
          banner.querySelector('span').innerHTML = manualHint;
          btn.remove();
        }
      }, 1200);
    });

    banner.querySelector('.inapp-banner__close').addEventListener('click', () => {
      banner.remove();
      document.body.classList.remove('has-inapp-banner');
      sessionStorage.setItem('inappBannerDismissed', '1');
    });
  }

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
