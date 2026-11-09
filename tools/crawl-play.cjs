// Crawls every Active Design Studio watch face on Google Play into tools/raw.json.
// Needs Playwright with Chromium: npm i -D playwright && npx playwright install chromium
// Then: node tools/crawl-play.cjs && python3 tools/build-data.py tools/raw.json && node tools/build.mjs
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({locale:'en-US'});
  const p = await ctx.newPage();
  const seen = new Set(), queue = [], out = [];
  const add = id => { if (!seen.has(id)) { seen.add(id); queue.push(id); } };
  const harvest = async () => {
    const ls = await p.$$eval('a[href*="details?id="]', as => as.map(a => [a.href.split('id=')[1].split('&')[0], a.innerText]));
    ls.filter(([id,t]) => /Active Design Studio/.test(t) || /activedesign|activewatchdesign/.test(id)).forEach(([id]) => add(id));
  };
  for (const u of ['https://play.google.com/store/apps/developer?id=Active+Design+Studio&hl=en&gl=US',
    'https://play.google.com/store/search?q=%22Active%20Design%20Studio%22%20watch%20face&c=apps&hl=en&gl=US',
    'https://play.google.com/store/search?q=activedesign%20watch%20face&c=apps&hl=en&gl=US',
    'https://play.google.com/store/search?q=Active%20Design%20hybrid%20watch%20face&c=apps&hl=en&gl=US',
    'https://play.google.com/store/search?q=Active%20Design%20digital%20watch%20face&c=apps&hl=en&gl=US',
    'https://play.google.com/store/search?q=Active%20Design%20analog%20watch%20face&c=apps&hl=en&gl=US']) {
    await p.goto(u, {waitUntil:'networkidle'});
    for (let i=0;i<10;i++){ await p.mouse.wheel(0,5000); await p.waitForTimeout(500); }
    await harvest();
  }
  while (queue.length) {
    const id = queue.shift();
    try {
      await p.goto(`https://play.google.com/store/apps/details?id=${id}&hl=en&gl=US`, {waitUntil:'networkidle', timeout:45000});
      const d = await p.evaluate(() => {
        const t = s => document.querySelector(s)?.innerText?.trim();
        const dev = [...document.querySelectorAll('a[href*="/store/apps/dev"]')].map(a=>a.innerText.trim()).find(Boolean);
        const shots = [...document.querySelectorAll('img[alt="Screenshot image"]')].map(i=>({src:i.src.split('=')[0], w:i.naturalWidth, h:i.naturalHeight}));
        const icon = document.querySelector('img[alt="Icon image"]')?.src.split('=')[0];
        const buy = [...document.querySelectorAll('button')].map(x=>x.innerText.trim()).find(x=>/Buy|Install/.test(x));
        const rating = document.querySelector('[itemprop="starRating"]')?.innerText || ([...document.querySelectorAll('div')].find(x=>/^\d\.\d\s*star$/.test(x.innerText.trim().replace(/\n/g,' ')))?.innerText);
        return { name: t('h1'), dev, icon, shots, buy, rating, desc: t('[data-g-id="description"]') };
      });
      await harvest();
      out.push({ id, ...d });
      process.stderr.write(id + ' ' + d.name + ' ' + d.dev + '\n');
    } catch (e) { process.stderr.write('ERR ' + id + '\n'); }
  }
  fs.writeFileSync(process.argv[2] || 'tools/raw.json', JSON.stringify(out, null, 1));
  await b.close();
})();
