/* Active Design: landing page choreography. Everything is visible without this file. */
(() => {
  const { reduced, hasGsap } = window.AD;

  /* Watches */
  const heroWatch = AD.initWatch(document.querySelector('.hero [data-watch]'));
  const modelsWatch = AD.initWatch(document.querySelector('.models [data-watch]'));
  const anatomyWatch = AD.initWatch(document.querySelector('.anatomy [data-watch]'), { lendHue: false });

  const caption = document.querySelector('[data-model-caption]');
  AD.bindModels(document.querySelector('[data-models]'), modelsWatch, (m, label) => { if (caption) caption.textContent = `Omni on ${label}`; });

  if (!hasGsap || reduced) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, Draggable, InertiaPlugin);

  /* ---------- Intro: the watch powers on ---------- */
  const title = document.querySelector('[data-split]');
  const split = SplitText.create(title, { type: 'words,chars', mask: 'words' });
  const screenOn = heroWatch && heroWatch.imgs[0];
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from('.stars', { opacity: 0, duration: 1.6, ease: 'power1.out' }, 0)
    .from(heroWatch.body, { y: 120, rotationX: 50, scale: 0.78, opacity: 0, duration: 1.6 }, 0.1)
    .from('.orbit ellipse', { scale: 0.6, opacity: 0, transformOrigin: '50% 50%', duration: 1.6, stagger: 0.12 }, 0.3)
    .from(screenOn, { clipPath: 'circle(0% at 50% 50%)', filter: 'brightness(3)', duration: 1.1, clearProps: 'clipPath,filter' }, 0.9)
    .from(split.chars, { yPercent: 110, duration: 1, stagger: 0.018 }, 0.35)
    .from('[data-rise]', { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.8)
    .from('.hero__caption, .hero .swatch, .hero .swatches__label', { y: 12, opacity: 0, duration: 0.7, stagger: 0.04 }, 1.2);

  /* The satellite rides the tilted orbit */
  const sat = document.querySelector('[data-sat]');
  if (sat) {
    const o = { t: 0 };
    gsap.to(o, { t: Math.PI * 2, duration: 14, repeat: -1, ease: 'none', onUpdate: () => {
      sat.setAttribute('cx', 200 + 196 * Math.cos(o.t));
      sat.setAttribute('cy', 200 + 70 * Math.sin(o.t));
    } });
  }

  /* Hero drifts back as you leave it */
  gsap.to('.hero__stage', { yPercent: 18, scale: 0.94, opacity: 0.4, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Each section lends the page the colour of its own face ---------- */
  document.querySelectorAll('[data-lend]').forEach((sec) => {
    const w = sec.querySelector('[data-watch]');
    const lend = () => { const api = w && w.__watch; const img = api && api.imgs[api.index]; if (img) AD.setHue(img.dataset.hue); };
    ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 45%', onEnter: lend, onEnterBack: lend });
  });

  /* ---------- Section heads rise in ---------- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* ---------- Models: the stage swings in ---------- */
  gsap.from('.models__stage', { y: 60, opacity: 0, rotationX: 12, transformPerspective: 1200, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: '.models__stage', start: 'top 85%' } });

  /* ---------- Kinds: counts decode, faces fan out on hover ---------- */
  gsap.utils.toArray('[data-kind]').forEach((row) => {
    const count = row.querySelector('[data-count]');
    const faces = row.querySelectorAll('.kind__faces img');
    gsap.from(row, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: row, start: 'top 90%' } });
    ScrollTrigger.create({ trigger: row, start: 'top 85%', once: true,
      onEnter: () => gsap.to(count, { duration: 1.2, scrambleText: { text: count.dataset.count, chars: '0123456789', speed: 0.4 } }) });
    const fan = gsap.timeline({ paused: true })
      .to(faces, { x: (i) => (i - faces.length + 1) * 20, rotation: (i) => (i - 2) * 8, scale: 1.12, duration: 0.6, ease: 'expo.out', stagger: 0.03 });
    row.addEventListener('pointerenter', () => fan.play());
    row.addEventListener('pointerleave', () => fan.reverse());
    row.addEventListener('focus', () => fan.play());
    row.addEventListener('blur', () => fan.reverse());
  });

  /* ---------- Anatomy: pin, then read the face part by part ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 60rem)', () => {
    const section = document.querySelector('[data-anatomy]');
    const items = [...section.querySelectorAll('.anatomy__item')];
    const marker = section.querySelector('[data-marker]');
    const screen = section.querySelector('.watch__screen');
    const stage = section.querySelector('.anatomy__stage');
    const at = (item) => {
      const [px, py] = (item.dataset.at || '50,50').split(',').map(Number);
      const s = screen.getBoundingClientRect(), g = stage.getBoundingClientRect();
      return { x: s.left - g.left + (s.width * px) / 100 - g.width / 2, y: s.top - g.top + (s.height * py) / 100 - g.height / 2 };
    };
    const set = (n) => items.forEach((it, i) => it.classList.toggle('is-on', i === n));
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: `+=${items.length * 70}%`, pin: true, scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: (st) => set(Math.min(items.length - 1, Math.floor(st.progress * items.length * 0.999))) },
    });
    tl.fromTo(anatomyWatch.body, { scale: 0.9 }, { scale: 1.06, duration: items.length, ease: 'none' }, 0);
    tl.to(marker, { opacity: 1, duration: 0.2 }, 0);
    items.forEach((it, i) => {
      if (it.dataset.aod !== undefined) {
        tl.to(marker, { opacity: 0, duration: 0.3 }, i);
        tl.to(anatomyWatch.imgs, { filter: 'brightness(0.35) saturate(0)', duration: 0.6 }, i);
      } else {
        tl.to(marker, { x: () => at(it).x, y: () => at(it).y, duration: 0.6, ease: 'power2.inOut' }, i === 0 ? 0 : i - 0.3);
      }
    });
    return () => set(-1);
  });

  /* ---------- Ring: every face in orbit, scroll and drag spin it ---------- */
  mm.add('(min-width: 40rem)', () => {
    const viewport = document.querySelector('[data-ring]');
    const track = document.querySelector('[data-ring-track]');
    const items = [...track.children];
    const n = items.length, step = 360 / n, R = Math.round((n * 196) / (2 * Math.PI));
    viewport.classList.add('is-3d');
    items.forEach((it, i) => { it.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`; });
    const spin = { scroll: 0, drag: 0 };
    const render = () => { track.style.transform = `translateZ(${-R}px) rotateX(-2deg) rotateY(${-(spin.scroll + spin.drag)}deg)`; };
    render();
    const st = ScrollTrigger.create({ trigger: viewport, start: 'top bottom', end: 'bottom top', scrub: 0.8,
      onUpdate: (s) => { spin.scroll = s.progress * 140; render(); } });
    const proxy = document.createElement('div');
    const drag = Draggable.create(proxy, { type: 'x', trigger: viewport, inertia: true, allowContextMenu: true,
      onPress() { gsap.set(proxy, { x: -spin.drag * 6 }); },
      onDrag() { spin.drag = -this.x / 6; render(); },
      onThrowUpdate() { spin.drag = -this.x / 6; render(); },
      onClick(e) { const a = e.target.closest('a'); if (a) window.open(a.href, '_blank', 'noopener'); },
    })[0];
    // Keyboard: bring a focused face round to the front
    const onFocus = (e) => {
      const i = items.indexOf(e.target.closest('.ring__item'));
      if (i < 0) return;
      const target = i * step - spin.scroll;
      gsap.to(spin, { drag: target, duration: 0.6, ease: 'expo.out', onUpdate: render });
    };
    track.addEventListener('focusin', onFocus);
    const now = document.querySelector('[data-ring-now]');
    const label = (e) => { const a = e.target.closest('a[data-label]'); if (!a) return; if (now) now.textContent = a.dataset.label; AD.setHue(a.dataset.hue); };
    track.addEventListener('pointerover', label);
    track.addEventListener('focusin', label);
    track.addEventListener('click', (e) => { if (e.detail > 0 && e.target.closest('a')) e.preventDefault(); });
    return () => { viewport.classList.remove('is-3d'); [track, ...items].forEach((e) => { e.style.transform = ''; }); st.kill(); drag.kill(); track.removeEventListener('focusin', onFocus); };
  });

  /* ---------- Free: three faces fall into alignment, each lends its colour on hover ---------- */
  document.querySelectorAll('.free__face').forEach((f) => {
    f.addEventListener('pointerenter', () => AD.setHue(f.dataset.hue));
    f.addEventListener('focusin', () => AD.setHue(f.dataset.hue));
  });
  gsap.from('.free__face', { y: 120, opacity: 0, rotation: (i) => (i - 1) * 12, duration: 1.3, ease: 'expo.out', stagger: 0.12,
    scrollTrigger: { trigger: '[data-free]', start: 'top 85%' } });
})();
