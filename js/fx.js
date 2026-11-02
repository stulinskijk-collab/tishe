// Анимации: появление при прокрутке, отсчёт цифр, 3D-объекты (парение, наклон за курсором, параллакс)
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // ?still — без анимаций, для скриншотов
  if (reduce || /still/.test(location.search) || !('IntersectionObserver' in window)) return;

  /* появление при прокрутке, соседи — с задержкой */
  const groups = ['.sec-head > *', '.master', '.rev', '.gal figure', '.faq-list details', '.promo-text > *', '.booking-side > *', '.book'];
  const items = [];
  groups.forEach(sel => {
    const els = $$(sel);
    els.forEach(el => {
      const sibs = [...el.parentElement.children].filter(c => c.matches(sel));
      el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 90 + 'ms');
      if (el.getBoundingClientRect().top > innerHeight * .9) { el.classList.add('fx'); items.push(el); }
    });
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => io.observe(el));

  /* отсчёт цифр в фактах первого экрана */
  $$('.hero-facts b').forEach(b => {
    const m = b.textContent.match(/^([^\d]*)([\d\s ]+(?:[.,]\d+)?)(.*)$/);
    if (!m) return;
    const raw = m[2].replace(/[\s ]/g, '').replace(',', '.');
    const end = parseFloat(raw), dec = (raw.split('.')[1] || '').length;
    if (!isFinite(end) || end === 0) return;
    const fmt = v => m[1] + (dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toLocaleString('ru-RU').replace(/\s/g, ' ')) + m[3];
    const t0 = performance.now() + 400, dur = 1400;
    b.textContent = fmt(0);
    (function tick(now) {
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      b.textContent = fmt(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  });

  /* 3D-объекты: наклон за курсором и смещение при прокрутке */
  const objs = $$('.obj');
  if (!objs.length) return;
  let mx = 0, my = 0;
  if (fine) addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  const st = objs.map(() => ({ x: 0, y: 0 }));
  (function loop() {
    objs.forEach((o, i) => {
      const r = o.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const depth = +(o.dataset.depth || 1);
      const s = st[i];
      s.x += (mx - s.x) * .07; s.y += (my - s.y) * .07;
      const scroll = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      o.style.setProperty('--rx', (-s.y * 16 * depth).toFixed(2) + 'deg');
      o.style.setProperty('--ry', (s.x * 20 * depth).toFixed(2) + 'deg');
      o.style.setProperty('--py', (scroll * -40 * depth).toFixed(1) + 'px');
    });
    requestAnimationFrame(loop);
  })();
})();
