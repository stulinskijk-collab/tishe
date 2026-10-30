(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rub = window.SITE_rub;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const form = $('#bookForm');
  const steps = $$('.step', form);
  const mini = $$('#stepsMini li');
  const next = $('#next'), back = $('#back');
  const err = $('#err');
  let cur = 0, day = null, slot = null;

  /* services as options */
  const all = [];
  const catNames = SITE.cats;
  Object.entries(SITE_SERVICES).forEach(([cat, arr]) => arr.forEach(s => all.push({ ...s, cat })));
  $('#optServices').innerHTML = all.map(s => `
    <label class="opt"><input type="radio" name="service" id="s-${s.id}" value="${s.id}">
      <span>${s.name}<small>${catNames[s.cat]} · ${s.min} мин · ${rub(s.price)}</small></span></label>`).join('');

  window.SITE_preselect = id => {
    const r = $('#s-' + id);
    if (r) r.checked = true;
    go(0);
    SITE_toast('Услуга выбрана, осталось время');
  };

  /* days & slots */
  const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const TIMES = SITE.times;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 10 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d; });
  const daysEl = $('#days'), slotsEl = $('#slots');
  daysEl.innerHTML = days.map((d, i) => `
    <button type="button" class="day" data-i="${i}" id="day-${i}">
      <small>${i === 0 ? 'сегодня' : i === 1 ? 'завтра' : WD[d.getDay()]}</small><b>${d.getDate()}</b></button>`).join('');

  function hash(str) { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
  function renderSlots() {
    const master = $('input[name="master"]:checked').value;
    const d = days[day];
    const now = new Date();
    slotsEl.innerHTML = TIMES.map(t => {
      const [hh, mm] = t.split(':').map(Number);
      const when = new Date(d); when.setHours(hh, mm);
      const busy = when <= now || hash(d.toDateString() + t + master) % 3 === 0;
      return `<button type="button" class="slot" data-t="${t}" ${busy ? 'disabled aria-label="' + t + ', занято"' : ''}>${t}</button>`;
    }).join('');
    slot = null;
  }
  daysEl.addEventListener('click', e => {
    const b = e.target.closest('.day'); if (!b) return;
    $$('.day').forEach(x => x.classList.toggle('is-on', x === b));
    day = +b.dataset.i; renderSlots(); err.hidden = true;
  });
  slotsEl.addEventListener('click', e => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    $$('.slot').forEach(x => x.classList.toggle('is-on', x === b));
    slot = b.dataset.t;
  });
  $$('input[name="master"]').forEach(r => r.addEventListener('change', () => { if (day !== null) renderSlots(); }));
  // first day with free slots preselected
  $('#day-0').click();
  if (!$('.slot:not(:disabled)')) $('#day-1').click();

  /* phone mask */
  const phone = $('#phone');
  phone.addEventListener('input', () => {
    let d = phone.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = d.slice(1);
    let out = '+7';
    if (p.length) out += ' (' + p.slice(0, 3);
    if (p.length >= 3) out += ')';
    if (p.length > 3) out += ' ' + p.slice(3, 6);
    if (p.length > 6) out += '-' + p.slice(6, 8);
    if (p.length > 8) out += '-' + p.slice(8, 10);
    phone.value = out;
    phone.classList.remove('bad');
  });
  $('#name').addEventListener('input', e => e.target.classList.remove('bad'));

  function chosen() {
    const sid = ($('input[name="service"]:checked') || {}).value;
    const s = all.find(x => x.id === sid);
    const m = $('input[name="master"]:checked').value;
    return { s, m };
  }
  function fail(msg, el) {
    err.textContent = msg; err.hidden = false;
    if (el) { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); el.focus(); }
    SITE_toast(msg);
    return false;
  }
  function valid(i) {
    err.hidden = true;
    if (i === 0 && !chosen().s) return fail('Выберите услугу');
    if (i === 2 && !slot) return fail('Выберите свободное время');
    if (i === 3) {
      if ($('#name').value.trim().length < 2) return fail('Напишите, как к вам обращаться', $('#name'));
      if (phone.value.replace(/\D/g, '').length !== 11) return fail('Проверьте номер: нужно 10 цифр после +7', phone);
    }
    return true;
  }
  function summary() {
    const { s, m } = chosen(); const d = days[day];
    const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
    $('#summary').innerHTML = `<b>${s.name}</b><span>${date}, ${slot}</span><span>${m} · ${s.min} мин · ${rub(s.price)}</span>`;
    return { s, m, date };
  }
  function go(i) {
    cur = i;
    steps.forEach((st, k) => st.classList.toggle('is-on', k === i));
    mini.forEach((li, k) => { li.classList.toggle('is-on', k === i); li.classList.toggle('is-done', k < i); });
    back.disabled = i === 0;
    next.innerHTML = i === 3 ? 'Отправить заявку <span class="arr">→</span>' : 'Дальше <span class="arr">→</span>';
    if (i === 3) summary();
  }
  next.addEventListener('click', () => {
    if (!valid(cur)) return;
    if (cur < 3) return go(cur + 1);
    const { s, date } = summary();
    $('#doneTxt').textContent = `${$('#name').value.trim()}, ждём вас ${date} в ${slot} на «${s.name}». Администратор напишет на ${phone.value} в течение 15 минут.`;
    steps.forEach(st => st.classList.remove('is-on'));
    $('#bookNav').hidden = true; $('#done').hidden = false;
    mini.forEach(li => { li.classList.remove('is-on'); li.classList.add('is-done'); });
    confetti();
  });
  back.addEventListener('click', () => cur > 0 && go(cur - 1));
  form.addEventListener('submit', e => { e.preventDefault(); next.click(); });
  $('#again').addEventListener('click', () => {
    form.reset(); $('#done').hidden = true; $('#bookNav').hidden = false;
    $('#day-0').click(); go(0);
  });

  /* confetti */
  const cv = $('#confetti'), ctx = cv.getContext('2d');
  function confetti() {
    if (reduce) return;
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.scale(dpr, dpr);
    const cols = SITE.confetti;
    const box = form.getBoundingClientRect();
    const ox = box.left - r.left + box.width / 2, oy = box.top - r.top + box.height / 3;
    const ps = Array.from({ length: 160 }, () => ({
      x: ox, y: oy, vx: (Math.random() - .5) * 16, vy: -Math.random() * 14 - 4,
      s: 6 + Math.random() * 8, a: Math.random() * 6, va: (Math.random() - .5) * .4,
      c: cols[(Math.random() * cols.length) | 0], shape: Math.random() < .3 ? 'c' : 'r'
    }));
    let t = 0;
    (function f() {
      ctx.clearRect(0, 0, r.width, r.height);
      ps.forEach(p => {
        p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c;
        ctx.strokeStyle = SITE.ink; ctx.lineWidth = 1.5;
        if (p.shape === 'c') { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.strokeRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
        ctx.restore();
      });
      if (++t < 180) requestAnimationFrame(f); else ctx.clearRect(0, 0, r.width, r.height);
    })();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
  }

  go(0);
})();
