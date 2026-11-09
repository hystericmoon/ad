# Active Design watch faces

A one-page static site for Active Design Studio's Wear OS watch faces (`index.html`). Plain HTML, CSS and JavaScript, no framework and no build step to serve it.

The structure follows Linear's homepage (left-aligned display type, chapters with the title left and copy right, a changelog-style timeline). The surfaces follow Cosmos (halftone textures, rounded black tiles, chevron pills, a layer stack, one lit tile). Colour lives only inside the face renders.

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
| Three styles | `#styles` | Line drawings in black tiles; pills jump to each chapter |
| Inside a face | `#inside` | Dial, complications, Wear OS 5 on a halftone band |
| Style chapters | `#faces`: `#digital`, `#hybrid`, `#analog` | The whole catalog; each card opens Google Play, hover cycles colourways |
| New faces | `#new` | The four newest faces by Google Play release date |
| Prices | `#prices` | Paid faces card and the lit Essentials card |
| Questions | `#faq` | Disclosure buttons; open without JavaScript |

`catalog.html` now only redirects old links to the matching chapter (`catalog.html?type=hybrid` lands on `#hybrid`).

## Update the faces

| Step | Command |
| --- | --- |
| 1. Crawl Google Play (needs Playwright) | `node tools/crawl-play.cjs` |
| 2. Download face renders | `python3 tools/build-data.py tools/raw.json` |
| 3. Add release dates for "New faces" | `python3 tools/fetch-dates.py` |
| 4. Render faces and counts into `index.html` and `data/faces.js` | `node tools/build.mjs` |

To edit by hand, change `data/faces.json` and run step 4. Blocks between `<!-- build:… -->` and `<!-- /build -->` in `index.html` are generated; edit everything else freely.

## Files

- `index.html`: the page.
- `css/site.css`: tokens and every section. `css/watch.css`: the watch component (frame geometry from `tools/make-frame.py`).
- `js/site.js`: halftone canvas, hero colourways, face-card colourway cycling, questions.
- `data/faces.json`: the 63 faces (name, style, Play link, colourway renders, release date).
- `assets/faces/`: colourway renders. `assets/watches/`: Samsung Mobile Press frames. `assets/logo.svg`, `assets/mark.svg`.

## Before going live

Samsung Mobile Press images are licensed mainly for editorial use; check Samsung's terms for a commercial site. The footer credits them.
