# Active Design watch faces

A one-page static site for Active Design Studio's Wear OS watch faces (`index.html`). Plain HTML, CSS and JavaScript, no framework and no build step to serve it.

The structure follows Linear's homepage (left-aligned display type, sections with the title left and copy right). The surfaces follow Cosmos (halftone textures, rounded black tiles, chevron pills, a layer stack). Colour lives only inside the face renders.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

Any static host works. Vercel or Netlify are the easiest: import the repo, leave the build command empty, and set the output directory to the repo root.

## Page sections

| Section | id | Notes |
| --- | --- | --- |
| Hero | `#top` | Celestrix on Galaxy Watch Ultra, Rush 3 on Galaxy Watch9, halftone planet behind them |
| Works with + statement | | Galaxy Watch, Pixel Watch, Wear OS, Google Play |
| Three styles | `#styles` | Line drawings in black tiles; pills open that style's tab |
| Inside a face | `#inside` | Dial, complications, Wear OS 5 on a halftone band |
| Every face | `#faces` | Style tabs (All, Digital, Hybrid, Analog), search by name and a Free only filter over one grid of all 63 faces. Links to `#digital`, `#hybrid`, `#analog` or `#free` pick the matching tab. Each card opens Google Play; hover cycles colourways |
| Questions | `#faq` | Disclosure buttons; open without JavaScript |

`catalog.html` now only redirects old links to the matching tab (`catalog.html?type=hybrid` lands on `#hybrid`).

## Update the faces

| Step | Command |
| --- | --- |
| 1. Crawl Google Play (needs Playwright) | `node tools/crawl-play.cjs` |
| 2. Download face renders | `python3 tools/build-data.py tools/raw.json` |
| 3. Render faces, tabs and counts into `index.html` and `data/faces.js` | `node tools/build.mjs` |

To edit by hand, change `data/faces.json` and run step 3. Blocks between `<!-- build:… -->` and `<!-- /build -->` in `index.html` are generated; edit everything else freely.

## Files

- `index.html`: the page.
- `css/site.css`: tokens and every section. `css/watch.css`: the watch component (frame geometry from `tools/make-frame.py`).
- `js/site.js`: halftone canvas, hero colourways, style tabs and filters, face-card colourway cycling, questions.
- `data/faces.json`: the 63 faces (name, style, Play link, colourway renders).
- `assets/faces/`: colourway renders. `assets/watches/`: Samsung Mobile Press frames. `assets/logo.svg`, `assets/mark.svg`.

## Before going live

Samsung Mobile Press images are licensed mainly for editorial use; check Samsung's terms for a commercial site. The footer credits them.
