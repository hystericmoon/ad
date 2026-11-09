/* Active Design, one page: halftone textures, hero colourways, face-card colourway cycling, questions.
   Everything works by click, tap or keyboard; the page reads fully without this script. */
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Halftone (after Cosmos, drawn here): dot size follows a brightness map.
     planet: the limb of a planet rising from below the stage. field: a soft interference field. */
  const drawHalftone = (c) => {
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, r.width, r.height);
    const W = r.width, H = r.height, field = c.dataset.ht === 'field';
    const step = field ? 7 : 6;
    const R = Math.max(W * 0.62, H), cx = W * 0.58, cy = H * 0.42 + R * 0.92;
    for (let j = 0, row = 0; j < H + step; j += step, row++) {
      for (let i = row % 2 ? step / 2 : 0; i < W + step; i += step) {
        let v;
        if (field) {
          v = 0.32 + 0.3 * Math.sin(i * 0.016 + j * 0.01) * Math.cos(j * 0.021 - i * 0.006) + 0.16 * Math.sin((i + j) * 0.045);
          v *= 0.55 + 0.45 * (1 - Math.abs(i / W - 0.5) * 2) ** 0.6; // calmer at the edges
        } else {
          const d = Math.hypot(i - cx, j - cy) / R;
          if (d >= 1) continue;
          v = (1 - Math.abs(d - 0.92) / 0.92) ** 3.4 + 0.1 * Math.sin(i * 0.045) * Math.cos(j * 0.06);
        }
        if (v <= 0.05) continue;
        v = Math.min(1, v);
        x.fillStyle = `rgba(196, 202, 212, ${0.22 + 0.5 * v})`;
        x.beginPath(); x.arc(i, j, v * step * 0.5, 0, Math.PI * 2); x.fill();
      }
    }
  };
  const canvases = [...document.querySelectorAll('canvas.ht')];
  const redraw = () => canvases.forEach(drawHalftone);
  redraw();
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(redraw, 150); });

  /* Hero: swatches and tapping the watch change the colourway */
  const show = (watch, i) => watch.querySelectorAll('.watch__screen img').forEach((im, k) => im.classList.toggle('is-on', k === i));
  document.querySelectorAll('[data-watch]').forEach((watch) => {
    const group = document.querySelector(`[data-swatches="${watch.dataset.face}"]`);
    const imgs = watch.querySelectorAll('.watch__screen img');
    let cur = 0;
    const set = (i) => {
      cur = (i + imgs.length) % imgs.length; show(watch, cur);
      group?.querySelectorAll('.swatch').forEach((b, k) => b.setAttribute('aria-pressed', String(k === cur)));
    };
    watch.querySelector('.watch__tap')?.addEventListener('click', () => set(cur + 1));
    group?.addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (b) set(+b.dataset.shot); });
  });

  /* Face cards: hover or keyboard focus cycles the colourways; leaving returns to the first */
  if (!still) {
    document.querySelectorAll('[data-cycle]').forEach((card) => {
      const imgs = card.querySelectorAll('.face__dial img');
      let timer = null, i = 0;
      const step = () => { imgs[i].classList.remove('is-on'); i = (i + 1) % imgs.length; imgs[i].classList.add('is-on'); };
      const start = () => { if (timer) return; imgs.forEach((im) => { im.loading = 'eager'; }); step(); timer = setInterval(step, 900); };
      const stop = () => { clearInterval(timer); timer = null; imgs[i].classList.remove('is-on'); i = 0; imgs[0].classList.add('is-on'); };
      card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') start(); });
      card.addEventListener('pointerleave', stop);
      card.addEventListener('focus', start);
      card.addEventListener('blur', stop);
    });
  }

  /* Faces: style tabs plus filters (search by name, free only) over one grid.
     Without this script the bar stays hidden and every face shows. */
  const grid = document.querySelector('[data-grid]');
  if (grid) {
    const bar = document.querySelector('[data-browse-bar]');
    const tabs = [...document.querySelectorAll('[data-tab]')];
    const panel = document.getElementById('faces-panel');
    const items = [...grid.querySelectorAll('.face')];
    const search = document.querySelector('[data-search]');
    const freeBtn = document.querySelector('[data-free]');
    const countEl = document.querySelector('[data-count]');
    const empty = document.querySelector('[data-empty]');
    const emptyQ = document.querySelector('[data-empty-q]');
    const section = document.querySelector('.browse'); // scroll target: the tabs, with the grid right under them
    const state = { type: 'all', free: false, q: '' };
    bar.hidden = false;

    const apply = () => {
      tabs.forEach((t) => { const on = t.dataset.tab === state.type; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', `tab-${state.type}`);
      freeBtn.setAttribute('aria-pressed', String(state.free));
      let shown = 0;
      items.forEach((el) => {
        const ok = (state.type === 'all' || el.dataset.type === state.type) && (!state.free || el.hasAttribute('data-free')) && (!state.q || el.dataset.name.includes(state.q));
        el.hidden = !ok; if (ok) shown++;
      });
      const style = state.type === 'all' ? '' : `${state.type} `;
      const kind = `${state.free ? 'free ' : ''}${style}face${shown === 1 ? '' : 's'}`;
      countEl.textContent = state.q ? `${shown} ${kind} matching “${search.value.trim()}”` : `${shown} ${kind}`;
      empty.hidden = shown > 0;
      emptyQ.textContent = search.value.trim();
    };
    const select = (type, { focus = false } = {}) => {
      state.type = type; apply();
      if (focus) tabs.find((t) => t.dataset.tab === type)?.focus();
      history.replaceState(null, '', type === 'all' ? '#faces' : `#${type}`);
    };
    tabs.forEach((t) => t.addEventListener('click', () => select(t.dataset.tab)));
    // tablist keyboard: arrows move and select, Home and End jump
    document.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
      const i = tabs.findIndex((t) => t.dataset.tab === state.type);
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      select(tabs[(to + tabs.length) % tabs.length].dataset.tab, { focus: true });
    });
    let timer;
    search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.q = search.value.trim().toLowerCase(); apply(); }, 120); });
    freeBtn.addEventListener('click', () => { state.free = !state.free; apply(); });
    document.querySelector('[data-reset]').addEventListener('click', () => { state.free = false; state.q = ''; search.value = ''; select('all'); search.focus(); });

    // links such as #digital (style tiles, footer, old catalog URLs) pick a tab and bring the grid into view
    const fromHash = (scroll) => {
      const h = location.hash.slice(1);
      if (h === 'free') { state.free = true; select('all'); }
      else if (tabs.some((t) => t.dataset.tab === h)) select(h);
      else return;
      if (scroll) section.scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
    };
    addEventListener('hashchange', () => fromHash(true));
    // same-hash clicks fire no hashchange, so handle these links directly
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const h = a.getAttribute('href').slice(1);
      if (h !== 'free' && !tabs.some((t) => t.dataset.tab === h)) return;
      e.preventDefault();
      state.free = h === 'free';
      select(h === 'free' ? 'all' : h);
      section.scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
    });
    apply();
    fromHash(true);
  }

  /* Questions: disclosure buttons. Answers stay open without this script; with it they start closed. */
  const faq = document.querySelector('[data-faq]');
  faq?.querySelectorAll('button[aria-expanded]').forEach((b) => {
    b.setAttribute('aria-expanded', 'false');
    document.getElementById(b.getAttribute('aria-controls')).hidden = true;
  });
  faq?.addEventListener('click', (e) => {
    const b = e.target.closest('button[aria-expanded]'); if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
  });
})();
