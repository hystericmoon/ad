/* Active Design landing: colourways, the try-on window and Forte's marker. Every part works by click,
   tap or keyboard; nothing moves on its own. */
(() => {
  const faces = window.FACES || [];
  const bySlug = Object.fromEntries(faces.map((f) => [f.slug, f]));

  const show = (watch, i) => {
    const imgs = watch.querySelectorAll('.watch__screen img');
    imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
  };
  const press = (group, i) => group && group.querySelectorAll('.swatch').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));

  /* hero: the float card's swatches change the face */
  const heroWatch = document.querySelector('.hero-watch [data-watch]');
  const heroSw = document.querySelector('[data-swatches="celestrix"]');
  heroSw?.addEventListener('click', (e) => {
    const b = e.target.closest('.swatch'); if (!b) return;
    const i = +b.dataset.shot; show(heroWatch, i); press(heroSw, i);
  });

  /* try-on: the list opens a face on the watch */
  const app = document.querySelector('[data-tryon]');
  if (app) {
    const stage = app.querySelector('[data-tryon-stage] [data-watch]');
    const sw = app.querySelector('[data-tryon-swatches]');
    const name = app.querySelector('[data-tryon-name]');
    const price = app.querySelector('[data-tryon-price]');
    const type = app.querySelector('[data-tryon-type]');
    const link = app.querySelector('[data-tryon-link]');
    const label = { watch9: 'Galaxy Watch9', ultra: 'Galaxy Watch Ultra' };
    let face = bySlug.rush;
    const screen = stage.querySelector('.watch__screen');
    const meta = () => { type.textContent = `${face.type}, shown on ${label[stage.dataset.model]}`; screen.setAttribute('aria-label', `${face.name} watch face on ${label[stage.dataset.model]}`); };
    const open = (slug) => {
      face = bySlug[slug]; if (!face) return;
      screen.innerHTML = face.shots.map((s, i) => `<img src="${s.src}" alt="" width="450" height="450"${i === 0 ? ' class="is-on"' : ''}>`).join('');
      sw.innerHTML = face.shots.map((s, i) => `<button class="swatch" type="button" aria-pressed="${i === 0}" aria-label="${face.name} colourway ${i + 1}" data-shot="${i}"><img src="${s.src}" alt="" width="40" height="40"></button>`).join('');
      name.textContent = face.name;
      price.textContent = face.price;
      link.href = face.url;
      link.textContent = `Get ${face.name} on Google Play`;
      meta();
      app.querySelectorAll('[data-try]').forEach((r) => r.setAttribute('aria-pressed', String(r.dataset.try === slug)));
    };
    app.addEventListener('click', (e) => {
      const row = e.target.closest('[data-try]'); if (row) return open(row.dataset.try);
      const b = e.target.closest('.swatch'); if (b) { const i = +b.dataset.shot; show(stage, i); press(sw, i); return; }
      const m = e.target.closest('[data-tryon-model]');
      if (m) {
        stage.dataset.model = m.dataset.tryonModel;
        app.querySelectorAll('[data-tryon-model]').forEach((x) => x.setAttribute('aria-pressed', String(x === m)));
        meta();
      }
    });
  }

  /* Forte: the list moves the marker over the part it names */
  const parts = document.querySelector('[data-forte-parts]');
  const marker = document.querySelector('[data-forte-marker]');
  if (parts && marker) {
    const frame = marker.parentElement;
    const scr = frame.querySelector('.watch__screen');
    let current = parts.querySelector('[aria-pressed="true"]');
    const place = () => {
      if (!current) return;
      const [px, py] = current.dataset.at.split(',').map(Number);
      const s = scr.getBoundingClientRect(), f = frame.getBoundingClientRect();
      marker.style.transform = `translate(${s.left - f.left + (s.width * px) / 100}px, ${s.top - f.top + (s.height * py) / 100}px)`;
    };
    const pick = (b) => { current = b; parts.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); place(); };
    parts.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pick(b); });
    parts.addEventListener('pointerover', (e) => { const b = e.target.closest('button'); if (b) pick(b); });
    parts.addEventListener('focusin', (e) => { const b = e.target.closest('button'); if (b) pick(b); });
    addEventListener('resize', place);
    addEventListener('load', place);
    requestAnimationFrame(place);
  }
})();
