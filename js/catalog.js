/* Active Design: catalog filters, hover colourways and the try-on dialog. */
(() => {
  const { reduced, hasGsap } = window.AD;
  const faces = window.FACES || [];
  const bySlug = Object.fromEntries(faces.map((f) => [f.slug, f]));
  const grid = document.querySelector('[data-grid]');
  const cards = [...grid.querySelectorAll('.card')];
  const search = document.querySelector('[data-search]');
  const sortSel = document.querySelector('[data-sort]');
  const chips = [...document.querySelectorAll('[data-filter]')];
  const countEl = document.querySelector('[data-count]');
  const empty = document.querySelector('[data-empty]');
  if (hasGsap && window.Flip) gsap.registerPlugin(Flip);

  const state = { filter: 'all', q: '', sort: 'order' };
  const params = new URLSearchParams(location.search);
  if (params.get('type') && chips.some((c) => c.dataset.filter === params.get('type'))) state.filter = params.get('type');

  const matches = (c) => {
    const okType = state.filter === 'all' || (state.filter === 'free' ? c.dataset.price === '0' : c.dataset.type === state.filter);
    return okType && (!state.q || c.dataset.name.includes(state.q));
  };
  const sorters = {
    order: (a, b) => a.dataset.order - b.dataset.order,
    name: (a, b) => a.dataset.name.localeCompare(b.dataset.name),
    price: (a, b) => a.dataset.price - b.dataset.price || a.dataset.order - b.dataset.order,
  };

  const apply = (animate = true) => {
    const flipState = animate && hasGsap && window.Flip && !reduced ? Flip.getState(cards) : null;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === state.filter)));
    [...cards].sort(sorters[state.sort]).forEach((c) => grid.appendChild(c));
    let shown = 0;
    cards.forEach((c) => { const ok = matches(c); c.hidden = !ok; if (ok) shown++; });
    countEl.textContent = shown === cards.length ? `Showing all ${cards.length} faces` : `Showing ${shown} of ${cards.length} faces`;
    empty.hidden = shown > 0;
    if (flipState) {
      Flip.from(flipState, { duration: 0.6, ease: 'expo.out', absolute: true, stagger: 0.012,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 }) });
    }
    const url = new URL(location.href);
    state.filter === 'all' ? url.searchParams.delete('type') : url.searchParams.set('type', state.filter);
    history.replaceState(null, '', url);
  };

  chips.forEach((c) => c.addEventListener('click', () => { state.filter = c.dataset.filter; apply(); }));
  let t;
  search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value.trim().toLowerCase(); apply(); }, 120); });
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; apply(); });
  document.querySelector('[data-reset]').addEventListener('click', () => {
    Object.assign(state, { filter: 'all', q: '', sort: 'order' }); search.value = ''; sortSel.value = 'order'; apply(); search.focus();
  });
  apply(false);

  /* Entrance */
  if (hasGsap && !reduced) {
    gsap.from('.cat-head__title, .cat-head__lede, .toolbar', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08 });
    gsap.from(cards.filter((c) => !c.hidden).slice(0, 10), { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.05, delay: 0.2 });
  }

  /* ---------- Hover: the face runs through its colourways and lends the page its hue ---------- */
  cards.forEach((card) => {
    const imgs = [...card.querySelectorAll('.card__face img')];
    if (imgs.length < 2) return;
    let i = 0, timer;
    const show = (n) => {
      imgs[i].classList.remove('is-on'); i = n % imgs.length; imgs[i].classList.add('is-on');
      AD.setHue(imgs[i].dataset.hue);
      if (hasGsap && !reduced) gsap.fromTo(imgs[i], { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 0.55, ease: 'expo.out', clearProps: 'clipPath' });
    };
    const start = () => { if (timer) return; show(i + 1); timer = setInterval(() => show(i + 1), 1100); };
    const stop = () => { clearInterval(timer); timer = null; };
    card.addEventListener('pointerenter', start);
    card.addEventListener('pointerleave', stop);
    card.addEventListener('focusin', start);
    card.addEventListener('focusout', (e) => { if (!card.contains(e.relatedTarget)) stop(); });
  });

  /* ---------- Try-on dialog ---------- */
  const dialog = document.querySelector('[data-detail]');
  const stage = dialog.querySelector('[data-detail-stage]');
  const modelsGroup = dialog.querySelector('[data-models]');
  let opener = null, current = null;

  const open = (slug, from) => {
    const face = bySlug[slug]; if (!face) return;
    opener = from;
    const model = modelsGroup.querySelector('[aria-pressed="true"]')?.dataset.model || 'ultra';
    stage.innerHTML = AD.watchHTML(face, model) + AD.swatchesHTML(face);
    current = AD.initWatch(stage.querySelector('[data-watch]'), { scope: stage });
    dialog.querySelector('[data-detail-name]').textContent = face.name;
    dialog.querySelector('[data-detail-type]').textContent = face.type;
    dialog.querySelector('[data-detail-price]').textContent = face.price === 'Free' ? 'Free' : `${face.price}, paid once`;
    const buy = dialog.querySelector('[data-detail-buy]');
    buy.href = face.url;
    buy.textContent = face.price === 'Free' ? 'Install free on Google Play' : `Get it for ${face.price}`;
    AD.setHue(face.shots[0]?.hue);
    dialog.showModal();
    document.body.classList.add('is-locked');
    if (hasGsap && !reduced) {
      gsap.fromTo(dialog, { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out' });
      gsap.from(current.body, { rotationY: -70, scale: 0.8, opacity: 0, duration: 0.9, ease: 'expo.out', delay: 0.05 });
    }
  };
  const close = () => {
    if (!dialog.open) return;
    const done = () => { dialog.close(); };
    if (hasGsap && !reduced) gsap.to(dialog, { opacity: 0, y: 20, duration: 0.25, ease: 'power2.in', onComplete: done });
    else done();
  };
  dialog.addEventListener('close', () => { document.body.classList.remove('is-locked'); window.gsap?.set(dialog, { clearProps: 'all' }); opener?.focus(); });
  dialog.querySelector('[data-close]').addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  AD.bindModels(modelsGroup, { setModel: (m) => current && current.setModel(m) });
  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) open(b.dataset.open, b); });
})();
