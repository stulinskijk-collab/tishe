(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rub = n => !n ? 'бесплатно' : n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  window.SITE_rub = rub;

  /* ---------- toast ---------- */
  const toast = $('#toast');
  window.SITE_toast = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  /* ---------- header ---------- */
  const top = $('.top');
  const onScroll = () => top.classList.toggle('scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- hero photo: slow parallax against the cursor ---------- */
  const heroImg = $('.hero .ph');
  let px = 0, py = 0, tx = 0, ty = 0;
  if (fine && !reduce && heroImg) {
    heroImg.style.scale = '1.06';
    addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; });
    (function loopPhoto() {
      px += (tx - px) * .08; py += (ty - py) * .08;
      heroImg.style.translate = `${(-px * 18).toFixed(1)}px ${(-py * 14).toFixed(1)}px`;
      requestAnimationFrame(loopPhoto);
    })();
  }
  const badge = $('.hero .badge');
  if (badge) badge.addEventListener('click', () => SITE_toast(SITE.poke));

  /* floats drift away from cursor */
  const floats = $$('.float');
  const art = $('.hero-media') || $('.hero');
  if (floats.length) art.addEventListener('pointermove', e => {
    if (reduce) return;
    floats.forEach((f, i) => {
      const r = f.getBoundingClientRect();
      const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
      const d = Math.hypot(dx, dy);
      const push = Math.max(0, 140 - d) / 140 * 40;
      f.style.translate = `${dx / (d || 1) * push}px ${dy / (d || 1) * push}px`;
    });
  });
  art.addEventListener('pointerleave', () => floats.forEach(f => (f.style.translate = '')));

  /* sparkles trail over the hero — only for sticker themes */
  if (fine && !reduce && floats.length) {
    let lastSpark = 0;
    $('.hero').addEventListener('pointermove', e => {
      const now = performance.now();
      if (now - lastSpark < 45) return;
      lastSpark = now;
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      s.style.width = s.style.height = 10 + Math.random() * 14 + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 800);
    });
  }

  /* ---------- services tabs ---------- */
  const list = $('#priceList');
  const ink = $('#tabInk');
  const tabs = $$('.tab');
  function moveInk(t) {
    ink.style.width = t.offsetWidth + 'px';
    ink.style.transform = `translateX(${t.offsetLeft - 6}px)`;
  }
  function render(cat) {
    list.innerHTML = SITE_SERVICES[cat].map((s, i) => `
      <div class="row" style="animation-delay:${i * 60}ms">
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
        <span class="min">${s.min} мин</span>
        <span class="cost">${rub(s.price)}</span>
        <button class="pick" type="button" data-id="${s.id}" data-cat="${cat}">Записаться на эту услугу →</button>
      </div>`).join('');
  }
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', x === t); });
    moveInk(t);
    render(t.dataset.tab);
  }));
  render(tabs[0].dataset.tab);
  requestAnimationFrame(() => moveInk(tabs[0]));
  addEventListener('resize', () => moveInk($('.tab.is-on')));
  document.fonts && document.fonts.ready.then(() => moveInk($('.tab.is-on')));

  list.addEventListener('click', e => {
    const b = e.target.closest('.pick');
    if (!b) return;
    window.SITE_preselect && SITE_preselect(b.dataset.id);
    $('#booking').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- tilt cards ---------- */
  if (fine && !reduce) {
    $$('.tilt').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg) translateY(-6px)`;
      });
      c.addEventListener('pointerleave', () => (c.style.transform = ''));
    });
  }

  /* ---------- reviews drag-to-scroll ---------- */
  const strip = $('#revStrip');
  let down = false, sx = 0, sl = 0, moved = false;
  strip.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft;
    strip.classList.add('drag');
  });
  addEventListener('pointermove', e => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 3) moved = true;
    strip.scrollLeft = sl - dx;
  });
  addEventListener('pointerup', () => { down = false; strip.classList.remove('drag'); });
  strip.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);

  /* ---------- reveal ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('go');
      io.unobserve(en.target);
    }), { rootMargin: '0px 0px 10% 0px' });
    $$('.reveal').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) io.observe(el); });
  }

  /* ---------- copy phone ---------- */
  $('#copyPhone').addEventListener('click', () => {
    const txt = $('#phoneTxt').textContent.trim();
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents($('#phoneTxt'));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      SITE_toast('Номер выделен, нажмите Ctrl+C');
    };
    try { navigator.clipboard.writeText(txt).then(() => SITE_toast('Номер скопирован'), fallback); }
    catch (_) { fallback(); }
  });
})();
