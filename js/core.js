/* Active Design: shared behaviour.
   The page has one neon channel (--hue). Whatever face is on screen lends it its colour. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const fine = matchMedia('(pointer: fine)').matches;
  const AD = (window.AD = { reduced, hasGsap, fine });

  /* ---------- The colour channel ---------- */
  // Neon lightness by hue: reds and violets need a lower L to stay saturated, yellows a higher one.
  const L_TABLE = [[0, 68], [30, 70], [60, 80], [95, 90], [130, 88], [160, 86], [210, 84], [245, 72], [280, 70], [320, 70], [360, 68]];
  const lightness = (h) => {
    h = ((h % 360) + 360) % 360;
    for (let i = 1; i < L_TABLE.length; i++) {
      const [a, la] = L_TABLE[i - 1], [b, lb] = L_TABLE[i];
      if (h <= b) return la + ((h - a) / (b - a)) * (lb - la);
    }
    return 68;
  };
  const paint = (h) => {
    const n = ((h % 360) + 360) % 360;
    root.style.setProperty('--hue', n.toFixed(1));
    root.style.setProperty('--accent-l', `${lightness(n).toFixed(1)}%`);
  };
  const hueState = { h: parseFloat(getComputedStyle(root).getPropertyValue('--hue')) || 182 };
  AD.setHue = (target, instant) => {
    if (target === null || target === undefined || target === '' || Number.isNaN(+target)) return;
    let to = +target;
    const from = hueState.h;
    let d = ((to - from + 540) % 360) - 180; // shortest way round the wheel
    to = from + d;
    if (!hasGsap || reduced || instant) {
      hueState.h = to;
      paint(to);
      return;
    }
    gsap.to(hueState, {
      h: to, duration: 0.9, ease: 'power3.out', overwrite: true,
      onUpdate: () => paint(hueState.h),
    });
  };

  /* ---------- Watch markup (mirrors tools/build.mjs) ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  AD.watchHTML = (face, model = 'ultra') => `
    <div class="watch" data-model="${model}" data-watch data-face="${face.slug}">
      <div class="watch__body">
        <div class="watch__screen" role="img" aria-label="${esc(face.name)} watch face">
          ${face.shots.map((s, i) => `<img src="${s.src}" alt="" width="450" height="450" data-hue="${s.hue ?? ''}"${i === 0 ? ' class="is-on"' : ''}>`).join('')}
        </div>
        <img class="watch__frame watch__frame--ultra" src="assets/watches/galaxy-watch-ultra.webp" alt="" width="960" height="1509" aria-hidden="true" draggable="false">
        <img class="watch__frame watch__frame--watch9" src="assets/watches/galaxy-watch9.webp" alt="" width="960" height="1587" aria-hidden="true" draggable="false">
        ${face.shots.length > 1 ? `<button class="watch__tap" type="button" aria-label="Show the next ${esc(face.name)} colourway"></button>` : ''}
      </div>
    </div>`;
  AD.swatchesHTML = (face) => face.shots.length < 2 ? '' : `
    <div class="swatches" role="group" aria-label="${esc(face.name)} colourways" data-swatches="${face.slug}">
      <span class="swatches__label">Colourway</span>
      ${face.shots.map((s, i) => `<button class="swatch" type="button" aria-pressed="${i === 0}" aria-label="Colourway ${i + 1}" data-shot="${i}"><img src="${s.src}" alt="" width="44" height="44"></button>`).join('')}
    </div>`;

  /* ---------- A watch: colourways, tap, swatches, tilt, model ---------- */
  AD.initWatch = (el, { scope = document, lendHue = true, tilt = true } = {}) => {
    if (!el || el.__watch) return el && el.__watch;
    const imgs = [...el.querySelectorAll('.watch__screen img')];
    const body = el.querySelector('.watch__body');
    const swatchGroup = scope.querySelector(`[data-swatches="${el.dataset.face}"]`);
    const swatchBtns = swatchGroup ? [...swatchGroup.querySelectorAll('.swatch')] : [];
    let index = Math.max(0, imgs.findIndex((i) => i.classList.contains('is-on')));

    const go = (next, { quiet } = {}) => {
      next = (next + imgs.length) % imgs.length;
      if (next === index && !quiet) return;
      const prev = imgs[index], img = imgs[next];
      index = next;
      imgs.forEach((i) => i !== prev && i !== img && i.classList.remove('is-on'));
      img.classList.add('is-on');
      if (hasGsap && !reduced && prev !== img) {
        gsap.set(img, { zIndex: 1 });
        gsap.set(prev, { zIndex: 0 });
        gsap.fromTo(img, { clipPath: 'circle(0% at 50% 50%)', filter: 'brightness(2.2)' },
          { clipPath: 'circle(75% at 50% 50%)', filter: 'brightness(1)', duration: 0.7, ease: 'expo.out',
            onComplete: () => { prev.classList.remove('is-on'); gsap.set(img, { clearProps: 'clipPath,filter' }); } });
        gsap.fromTo(body, { rotationZ: -3 }, { rotationZ: 0, duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
      } else if (prev !== img) prev.classList.remove('is-on');
      swatchBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
      if (lendHue) AD.setHue(img.dataset.hue);
    };
    el.querySelector('.watch__tap')?.addEventListener('click', () => go(index + 1));
    swatchBtns.forEach((b, i) => b.addEventListener('click', () => go(i)));

    if (tilt && fine && hasGsap && !reduced) {
      const rx = gsap.quickTo(body, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      const ry = gsap.quickTo(body, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      const zone = el.closest('[data-stage], figure, section') || el;
      zone.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - (r.left + r.width / 2)) / r.width;
        const py = (e.clientY - (r.top + r.height / 2)) / r.height;
        ry(gsap.utils.clamp(-18, 18, px * 26));
        rx(gsap.utils.clamp(-14, 14, -py * 22));
        el.style.setProperty('--gx', `${30 + px * 50}%`);
        el.style.setProperty('--gy', `${22 + py * 50}%`);
      });
      zone.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }

    const setModel = (model) => {
      if (el.dataset.model === model) return;
      if (hasGsap && !reduced) {
        gsap.timeline()
          .to(body, { rotationY: '+=90', scale: 0.92, duration: 0.28, ease: 'power2.in' })
          .add(() => { el.dataset.model = model; })
          .fromTo(body, { rotationY: -90 }, { rotationY: 0, scale: 1, duration: 0.7, ease: 'expo.out' });
      } else el.dataset.model = model;
    };
    return (el.__watch = { go, setModel, get index() { return index; }, imgs, body });
  };

  AD.bindModels = (group, watchApi, onChange) => {
    if (!group || !watchApi) return;
    group.querySelectorAll('button[data-model]').forEach((b) => {
      b.addEventListener('click', () => {
        group.querySelectorAll('button[data-model]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        watchApi.setModel(b.dataset.model);
        onChange && onChange(b.dataset.model, b.textContent.trim());
      });
    });
  };

  /* ---------- Nav: tuck away on the way down, back on the way up ---------- */
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    let last = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      nav.classList.toggle('is-hidden', y > last && y > 240 && !nav.contains(document.activeElement));
      last = y;
    }, { passive: true });
  }

  /* ---------- Magnetic primary buttons ---------- */
  if (fine && hasGsap && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach((b) => {
      const x = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3.out' });
      const y = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3.out' });
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.25);
        y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      b.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  /* ---------- Starfield: monochrome dust with a slow parallax drift ---------- */
  const canvas = document.querySelector('.stars');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const starColor = getComputedStyle(root).getPropertyValue('--color-star').trim();
    let w, h, dpr, stars = [], mx = 0, my = 0, tmx = 0, tmy = 0;
    const seed = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr;
      const n = Math.round((innerWidth * innerHeight) / 5200);
      stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random() ** 2, t: Math.random() * 6.28 }));
    };
    const draw = (time = 0) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = starColor;
      mx += (tmx - mx) * 0.04; my += (tmy - my) * 0.04;
      const sy = scrollY * dpr;
      for (const s of stars) {
        const depth = 0.15 + s.z;
        let x = (s.x + mx * depth * 30 * dpr) % w; if (x < 0) x += w;
        let y = (s.y - sy * depth * 0.18 + my * depth * 30 * dpr) % h; if (y < 0) y += h;
        ctx.globalAlpha = (0.25 + s.z * 0.75) * (reduced ? 1 : 0.7 + 0.3 * Math.sin(time / 900 + s.t));
        const r = (0.4 + s.z * 1.1) * dpr;
        ctx.fillRect(x, y, r, r);
      }
      if (!reduced) requestAnimationFrame(draw);
    };
    seed(); draw();
    addEventListener('resize', () => { seed(); if (reduced) draw(); });
    if (reduced) addEventListener('scroll', () => requestAnimationFrame(() => draw()), { passive: true });
    if (fine) addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });
  }
})();
