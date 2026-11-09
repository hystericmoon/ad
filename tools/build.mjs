// Renders data/faces.json into the marked blocks of index.html and catalog.html,
// and writes data/faces.js for the scripts. Run after editing data/faces.json:
//   node tools/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const faces = JSON.parse(readFileSync('data/faces.json', 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bySlug = Object.fromEntries(faces.map((f) => [f.slug, f]));
const kinds = ['Hybrid', 'Digital', 'Analog', 'Diver'];
const count = (t) => faces.filter((f) => f.type === t).length;
const free = faces.filter((f) => f.price === 'Free');

const playIcon = '<svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5v17l14-8.5z" fill="currentColor"/></svg>';

export const watch = (face, { model = 'ultra', tapLabel = 'Next colourway', lazy = false } = {}) => `
<div class="watch" data-model="${model}" data-watch data-face="${face.slug}">
  <div class="watch__body">
    <div class="watch__screen" role="img" aria-label="${esc(face.name)} watch face on ${model === 'ultra' ? 'Galaxy Watch Ultra' : 'Galaxy Watch9'}">
      ${face.shots.map((s, i) => `<img src="${s.src}" alt="" width="450" height="450" data-hue="${s.hue ?? ''}"${i === 0 ? ' class="is-on"' : ''}${lazy || i > 0 ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`).join('\n      ')}
    </div>
    <img class="watch__frame watch__frame--ultra" src="assets/watches/galaxy-watch-ultra.webp" alt="" width="960" height="1509" aria-hidden="true"${model === 'ultra' ? '' : ' loading="lazy"'} draggable="false">
    <img class="watch__frame watch__frame--watch9" src="assets/watches/galaxy-watch9.webp" alt="" width="960" height="1587" aria-hidden="true"${model === 'watch9' ? '' : ' loading="lazy"'} draggable="false">
    ${face.shots.length > 1 ? `<button class="watch__tap" type="button" aria-label="${esc(tapLabel)}"></button>` : ''}
  </div>
</div>`;

export const swatches = (face) => face.shots.length < 2 ? '' : `
<div class="swatches" role="group" aria-label="${esc(face.name)} colourways" data-swatches="${face.slug}">
  <span class="swatches__label">Colourway</span>
  ${face.shots.map((s, i) => `<button class="swatch" type="button" aria-pressed="${i === 0}" aria-label="Colourway ${i + 1}" data-shot="${i}"><img src="${s.src}" alt="" width="44" height="44" loading="lazy"></button>`).join('\n  ')}
</div>`;

const blocks = {
  'hero-watch': () => watch(bySlug.rush, { tapLabel: 'Show the next Rush colourway' }),
  'hero-swatches': () => swatches(bySlug.rush),
  'models-watch': () => watch(bySlug.omni, { model: 'watch9', lazy: true, tapLabel: 'Show the next Omni colourway' }),
  'anatomy-watch': () => watch(bySlug.forte, { lazy: true, tapLabel: 'Show the next Forte colourway' }),
  kinds: () => kinds.map((t) => {
    const set = faces.filter((f) => f.type === t).slice(0, 5);
    const line = { Hybrid: 'Hands over a digital readout.', Digital: 'Numerals first, data around them.', Analog: 'Hands, a dial and quiet complications.', Diver: 'A bezel and markers built for depth.' }[t];
    return `
<li class="kind">
  <a class="kind__link" href="catalog.html?type=${t.toLowerCase()}" data-kind>
    <span class="kind__name">${t}</span>
    <span class="kind__line">${line}<span class="kind__count" data-count="${count(t)}">${count(t)}</span></span>
    <span class="kind__faces" aria-hidden="true">${set.map((f) => `<img src="${f.shots[0].src}" alt="" width="64" height="64" loading="lazy">`).join('')}</span>
  </a>
</li>`;
  }).join(''),
  ring: () => faces.map((f) => `
<li class="ring__item"><a href="${f.url}" target="_blank" rel="noopener" data-hue="${f.shots[0].hue ?? ''}" data-label="${esc(f.name)}, ${f.type.toLowerCase()}, ${f.price === 'Free' ? 'free' : f.price}" aria-label="${esc(f.name)}, ${f.type.toLowerCase()}, ${f.price === 'Free' ? 'free' : f.price}, on Google Play"><img src="${f.shots[0].src}" alt="" width="168" height="168" loading="lazy" decoding="async" draggable="false"></a></li>`).join(''),
  free: () => free.map((f) => `
<div class="free__face" data-hue="${f.shots.find((x) => x.hue != null)?.hue ?? ''}">
  <div class="free__dial"><img src="${f.shots[0].src}" alt="${esc(f.name)} watch face" width="450" height="450" loading="lazy"></div>
  <span class="free__name">${esc(f.name)}</span>
  <a class="btn btn--ghost btn--sm" href="${f.url}" target="_blank" rel="noopener" aria-label="Install ${esc(f.name)} free on Google Play">Install free</a>
</div>`).join(''),
  total: () => String(faces.length),
  chips: () => [['all', 'All', faces.length], ...kinds.map((t) => [t.toLowerCase(), t, count(t)]), ['free', 'Free', free.length]]
    .map(([k, l, n]) => `<button class="chip" type="button" data-filter="${k}" aria-pressed="${k === 'all'}">${l}<span class="chip__n">${n}</span></button>`).join(''),
  grid: () => faces.map((f, i) => `
<li class="card" data-slug="${f.slug}" data-type="${f.type.toLowerCase()}" data-price="${f.price === 'Free' ? 0 : f.price.replace('$', '')}" data-name="${esc(f.name.toLowerCase())}" data-order="${i}">
  <button class="card__face" type="button" aria-label="Preview ${esc(f.name)}" data-open="${f.slug}">
    ${f.shots.map((s, j) => `<img src="${s.src}" alt="" width="450" height="450"${j === 0 && i < 5 ? (i === 0 ? ' fetchpriority="high"' : '') : ' loading="lazy"'} decoding="async" data-hue="${s.hue ?? ''}"${j === 0 ? ' class="is-on"' : ''}>`).join('')}
  </button>
  <div class="card__meta">
    <h2 class="card__name">${esc(f.name)}</h2>
    <span class="card__price">${f.price}</span>
    <span class="card__type">${f.type}</span>
  </div>
  <a class="btn btn--ghost btn--sm" href="${f.url}" target="_blank" rel="noopener" aria-label="Get ${esc(f.name)} on Google Play">${playIcon}Google Play</a>
</li>`).join(''),
};

for (const file of ['index.html', 'catalog.html']) {
  let html = readFileSync(file, 'utf8');
  html = html.replace(/<!-- build:([a-z-]+) -->[\s\S]*?<!-- \/build -->/g, (m, key) => {
    if (!blocks[key]) throw new Error(`unknown block ${key} in ${file}`);
    return `<!-- build:${key} -->${blocks[key]()}<!-- /build -->`;
  });
  writeFileSync(file, html);
}
writeFileSync('data/faces.js', `// Generated by tools/build.mjs from data/faces.json\nwindow.FACES = ${JSON.stringify(faces)};\n`);
console.log(`built ${faces.length} faces into index.html, catalog.html and data/faces.js`);
