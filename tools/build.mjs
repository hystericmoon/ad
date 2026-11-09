// Renders data/faces.json into the marked blocks of index.html and writes data/faces.js
// for the page script. Run after editing data/faces.json:
//   node tools/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const faces = JSON.parse(readFileSync('data/faces.json', 'utf8'));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bySlug = Object.fromEntries(faces.map((f) => [f.slug, f]));
const ofType = (t) => faces.filter((f) => f.type === t);
const isFree = (f) => f.price === 'Free';
const free = faces.filter(isFree);
const ext = 'target="_blank" rel="noopener"';

export const watch = (face, { model = 'ultra', tapLabel = 'Next colourway', lazy = false } = {}) => `
<div class="watch" data-model="${model}" data-watch data-face="${face.slug}">
  <div class="watch__body">
    <div class="watch__screen" role="img" aria-label="${esc(face.name)} watch face on ${model === 'ultra' ? 'Galaxy Watch Ultra' : 'Galaxy Watch9'}">
      ${face.shots.map((s, i) => `<img src="${s.src}" alt="" width="450" height="450"${i === 0 ? ' class="is-on"' : ''}${lazy || i > 0 ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`).join('\n      ')}
    </div>
    <img class="watch__frame watch__frame--ultra" src="assets/watches/galaxy-watch-ultra.webp" alt="" width="960" height="1509" aria-hidden="true"${model === 'ultra' ? '' : ' loading="lazy"'} draggable="false">
    <img class="watch__frame watch__frame--watch9" src="assets/watches/galaxy-watch9.webp" alt="" width="960" height="1587" aria-hidden="true"${model === 'watch9' ? '' : ' loading="lazy"'} draggable="false">
    ${face.shots.length > 1 ? `<button class="watch__tap" type="button" aria-label="${esc(tapLabel)}"></button>` : ''}
  </div>
</div>`;

export const swatches = (face) => face.shots.length < 2 ? '' : `
<div class="swatches" role="group" aria-label="${esc(face.name)} colourways" data-swatches="${face.slug}">
  ${face.shots.map((s, i) => `<button class="swatch" type="button" aria-pressed="${i === 0}" aria-label="${esc(face.name)} colourway ${i + 1}" data-shot="${i}"><img src="${s.src}" alt="" width="40" height="40" loading="lazy"></button>`).join('\n  ')}
</div>`;

// One catalog card: the face on a Galaxy Watch9 body. The colourways cycle on their own, hover shows the
// always-on look, and selecting the card opens the details dialog (js/site.js). Without the script it is a
// plain link to the face on Google Play.
const card = (f, i) => `
<li class="face" data-type="${f.type.toLowerCase()}" data-name="${esc(f.name.toLowerCase())}"${isFree(f) ? ' data-free' : ''}>
  <a class="face__card" href="${f.url}" ${ext} data-open="${f.slug}" aria-label="${esc(f.name)}, ${f.type.toLowerCase()}${isFree(f) ? ', free' : ''}">
    <span class="face__stage">
      <span class="watch face__watch" data-model="watch9">
        <span class="watch__body">
          <span class="watch__screen">${f.shots.map((s, k) => `<img src="${s.src}" alt="" width="450" height="450"${k === 0 ? ' class="is-on"' : ''}${i < 10 && k === 0 ? '' : ' loading="lazy"'} decoding="async">`).join('')}</span>
          <img class="watch__frame watch__frame--watch9" src="assets/watches/galaxy-watch9.webp" alt="" width="960" height="1587" loading="lazy" decoding="async" draggable="false">
        </span>
      </span>
    </span>
    <span class="face__meta">
      <span class="face__name">${esc(f.name)}</span>
      ${isFree(f) ? '<span class="tag">Free</span>' : `<span class="face__cw">${f.shots.length} colourway${f.shots.length === 1 ? '' : 's'}</span>`}
    </span>
    <span class="face__aod" aria-hidden="true">Always-on</span>
  </a>
</li>`;

const blocks = {
  'hero-watch': () => watch(bySlug.celestrix, { tapLabel: 'Show the next Celestrix colourway' }),
  'hero-watch-2': () => watch(bySlug['rush-3'], { model: 'watch9', lazy: true, tapLabel: 'Show the next Rush 3 colourway' }),
  'hero-swatches': () => swatches(bySlug.celestrix),
  'n-total': () => String(faces.length),
  'n-digital': () => String(ofType('Digital').length),
  'n-hybrid': () => String(ofType('Hybrid').length),
  'n-analog': () => String(ofType('Analog').length),
  'n-free': () => String(free.length),
  tabs: () => [['all', 'All', faces.length], ...['Digital', 'Hybrid', 'Analog'].map((t) => [t.toLowerCase(), t, ofType(t).length])]
    .map(([k, l, n], i) => `<button class="tab" type="button" role="tab" id="tab-${k}" aria-controls="faces-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${k}">${l} <span class="tab__n">${n}</span></button>`).join(''),
  grid: () => faces.map(card).join(''),
};

let html = readFileSync('index.html', 'utf8');
html = html.replace(/<!-- build:([a-z0-9-]+) -->[\s\S]*?<!-- \/build -->/g, (m, key) => {
  if (!blocks[key]) throw new Error(`unknown block ${key} in index.html`);
  return `<!-- build:${key} -->${blocks[key]()}<!-- /build -->`;
});
writeFileSync('index.html', html);
writeFileSync('data/faces.js', `// Generated by tools/build.mjs from data/faces.json\nwindow.FACES = ${JSON.stringify(faces)};\n`);
console.log(`built ${faces.length} faces into index.html and data/faces.js`);
