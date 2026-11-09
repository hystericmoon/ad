# Active Design watch faces

A static site for Active Design Studio's Wear OS watch faces: a landing page (`index.html`) and a catalog of every face (`catalog.html`). Plain HTML, CSS and JavaScript, animated with GSAP 3.13 from cdnjs. No build step is needed to serve it.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

Any static host works. Vercel or Netlify are the easiest: import the repo, leave the build command empty, and set the output directory to the repo root. Both create a preview link for every pull request. GitHub Pages works too (Settings, Pages, deploy from `main`, root folder).

## Update the catalog

The face data and images come from the Google Play listings.

| Step | Command |
| --- | --- |
| 1. Crawl Google Play (needs Playwright) | `node tools/crawl-play.cjs` |
| 2. Download face renders, sample each colourway's neon hue | `python3 tools/build-data.py tools/raw.json` |
| 3. Render faces into both pages and `data/faces.js` | `node tools/build.mjs` |

To edit by hand instead, change `data/faces.json` (name, style, price, Play link, images) and run step 3. Blocks between `<!-- build:… -->` and `<!-- /build -->` in the HTML are generated; edit everything else freely.

## How the colour works

The page has one neon accent, `--hue` in `css/tokens.css`. Whatever face is on screen lends it its colour: tapping the hero watch, scrolling into a section, hovering a catalog card or a ring face all call `AD.setHue()` in `js/core.js` with that face's sampled hue.

## Files

- `css/tokens.css`: colour, type, spacing tokens. `css/base.css`: resets. `css/site.css`: everything else.
- `js/core.js`: the colour channel, watch component (colourways, tilt, model switch), nav, starfield.
- `js/home.js`: landing choreography (intro, pinned anatomy, 3D ring). `js/catalog.js`: filters, hover colourways, try-on dialog.
- Watch hardware (Galaxy Watch Ultra, Galaxy Watch8, Pixel Watch) is drawn in CSS around the real face renders.
