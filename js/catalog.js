/* Catalog: search, style filter, sort, and the try-on dialog. */
(() => {
  const faces = window.FACES || [];
  const bySlug = Object.fromEntries(faces.map((f) => [f.slug, f]));
  const grid = document.querySelector('[data-grid]');
  const items = [...grid.querySelectorAll('.cat__item')];
  const search = document.querySelector('[data-search]');
  const sortSel = document.querySelector('[data-sort]');
  const chips = [...document.querySelectorAll('[data-filter]')];
  const countEl = document.querySelector('[data-count]');
  const empty = document.querySelector('[data-empty]');
  const state = { filter: 'all', q: '', sort: 'order' };
  const t = new URLSearchParams(location.search).get('type');
  if (t && chips.some((c) => c.dataset.filter === t)) state.filter = t;

  const sorters = {
    order: (a, b) => a.dataset.order - b.dataset.order,
    name: (a, b) => a.dataset.name.localeCompare(b.dataset.name),
    price: (a, b) => a.dataset.price - b.dataset.price || a.dataset.order - b.dataset.order,
  };
  const apply = () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === state.filter)));
    [...items].sort(sorters[state.sort]).forEach((el) => grid.appendChild(el));
    let shown = 0;
    items.forEach((el) => {
      const okType = state.filter === 'all' || (state.filter === 'free' ? el.dataset.price === '0' : el.dataset.type === state.filter);
      const ok = okType && (!state.q || el.dataset.name.includes(state.q));
      el.hidden = !ok; if (ok) shown++;
    });
    countEl.textContent = shown === items.length ? `Showing all ${items.length} faces` : `Showing ${shown} of ${items.length} faces`;
    empty.hidden = shown > 0;
    const url = new URL(location.href);
    state.filter === 'all' ? url.searchParams.delete('type') : url.searchParams.set('type', state.filter);
    history.replaceState(null, '', url);
  };
  chips.forEach((c) => c.addEventListener('click', () => { state.filter = c.dataset.filter; apply(); }));
  let timer;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { state.q = search.value.trim().toLowerCase(); apply(); }, 120); });
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; apply(); });
  document.querySelector('[data-reset]').addEventListener('click', () => { Object.assign(state, { filter: 'all', q: '', sort: 'order' }); search.value = ''; sortSel.value = 'order'; apply(); search.focus(); });
  apply();

  /* try-on dialog */
  const dlg = document.querySelector('[data-dialog]');
  const stage = dlg.querySelector('[data-stage]');
  const sw = dlg.querySelector('[data-dlg-swatches]');
  const label = { ultra: 'Galaxy Watch Ultra', watch9: 'Galaxy Watch9' };
  let model = 'ultra', face = null, opener = null;
  const render = () => {
    stage.innerHTML = `<div class="watch" data-model="${model}"><div class="watch__body"><div class="watch__screen" role="img" aria-label="${face.name} watch face on ${label[model]}">${face.shots.map((s, i) => `<img src="${s.src}" alt="" width="450" height="450"${i === 0 ? ' class="is-on"' : ''}>`).join('')}</div><img class="watch__frame watch__frame--ultra" src="assets/watches/galaxy-watch-ultra.webp" alt="" width="960" height="1509" aria-hidden="true"><img class="watch__frame watch__frame--watch9" src="assets/watches/galaxy-watch9.webp" alt="" width="960" height="1587" aria-hidden="true"></div></div>`;
    sw.innerHTML = face.shots.length < 2 ? '' : face.shots.map((s, i) => `<button class="swatch" type="button" aria-pressed="${i === 0}" aria-label="${face.name} colourway ${i + 1}" data-shot="${i}"><img src="${s.src}" alt="" width="40" height="40"></button>`).join('');
    dlg.querySelector('[data-dlg-name]').textContent = face.name;
    dlg.querySelector('[data-dlg-meta]').textContent = face.price === 'Free' ? `${face.type}, free` : `${face.type}, a one-time purchase priced for your country`;
    const buy = dlg.querySelector('[data-dlg-buy]');
    buy.href = face.url;
    buy.textContent = face.price === 'Free' ? `Get ${face.name} free` : `Get ${face.name} on Google Play`;
  };
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    face = bySlug[b.dataset.open]; if (!face) return;
    opener = b; render(); dlg.showModal();
  });
  sw.addEventListener('click', (e) => {
    const b = e.target.closest('.swatch'); if (!b) return;
    const i = +b.dataset.shot;
    stage.querySelectorAll('.watch__screen img').forEach((im, k) => im.classList.toggle('is-on', k === i));
    sw.querySelectorAll('.swatch').forEach((x, k) => x.setAttribute('aria-pressed', String(k === i)));
  });
  dlg.querySelectorAll('[data-model]').forEach((m) => m.addEventListener('click', () => {
    model = m.dataset.model;
    dlg.querySelectorAll('[data-model]').forEach((x) => x.setAttribute('aria-pressed', String(x === m)));
    const w = stage.querySelector('.watch'); w.dataset.model = model;
    w.querySelector('.watch__screen').setAttribute('aria-label', `${face.name} watch face on ${label[model]}`);
  }));
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => opener && opener.focus());
})();
