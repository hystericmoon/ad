"""Turn the crawled Play Store data into data/faces.json + local webp images.
Usage: python3 tools/build-data.py tools/raw.json   (output of tools/crawl-play.cjs)
"""
import json, sys, os, re, io, colorsys, urllib.request, collections
from PIL import Image

def from_raw(a):
    """Normalise one crawled Play Store record (tools/crawl-play.cjs) into name/type/price/shots."""
    n = a['name']
    short = re.split(r'[:]| Watch Face| Analog| Digital| Hybrid', n)[0].strip()
    m = re.search(r'\b(Hybrid|Digital|Analog|Diver)\b', n) or re.search(r'\b(hybrid|digital|analog)\b', a.get('desc') or '', re.I)
    price = a['buy'].replace(' Buy', '') if a.get('buy') and '$' in a['buy'] else 'Free'
    wear = []
    for s in a['shots']:
        if s['w'] == s['h'] and s['w'] > 0 and s['src'] not in wear:
            wear.append(s['src'])
    return dict(id=a['id'], name=short, type=m.group(1).capitalize() if m else 'Digital', price=price, desc=a.get('desc'), wear=wear)

src = [from_raw(a) if 'buy' in a else a for a in json.load(open(sys.argv[1]))]
OUT = 'assets/faces'
os.makedirs(OUT, exist_ok=True)
PER_FACE = 5

def neon_hue(im):
    im = im.convert('RGB').resize((96, 96))
    bins = collections.Counter()
    for r, g, b in im.get_flattened_data():
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s > 0.55 and v > 0.55:
            bins[int(h * 36)] += 1
    if not bins or sum(bins.values()) < 90:
        return None
    k, _ = bins.most_common(1)[0]
    # rough HSV -> OKLCH hue mapping (piecewise, good enough for a neon tint)
    hsv = (k + 0.5) * 10
    table = [(0, 29), (30, 55), (60, 110), (120, 142), (180, 195), (240, 264), (300, 328), (360, 389)]
    for (a, oa), (b, ob) in zip(table, table[1:]):
        if a <= hsv <= b:
            return round((oa + (hsv - a) / (b - a) * (ob - oa)) % 360)
    return None

def is_clean(im):
    """A bare face render: everything outside the dial circle is one flat colour."""
    im = im.convert('L').resize((90, 90))
    px = im.load(); out = []
    for y in range(90):
        for x in range(90):
            if (x - 44.5) ** 2 + (y - 44.5) ** 2 > 46 ** 2:
                out.append(px[x, y])
    m = sum(out) / len(out)
    var = sum((v - m) ** 2 for v in out) / len(out)
    return var ** 0.5 < 10

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

faces = []
counts = collections.Counter(c['name'] for c in src)
for c in src:
    name = c['name'] if counts[c['name']] == 1 else f"{c['name']} {c['type']}" if c['name'] + ' ' + c['type'] not in [f['name'] for f in faces] else c['name'] + ' Classic'
    s = slug(name)
    desc = c.get('desc', '') or ''
    shots = []
    for u in c['wear']:
        if len(shots) == PER_FACE:
            break
        data = urllib.request.urlopen(u + '=w450').read()
        im = Image.open(io.BytesIO(data)).convert('RGB')
        if not is_clean(im):
            continue
        fn = f'{OUT}/{s}-{len(shots) + 1}.webp'
        im.save(fn, 'WEBP', quality=82, method=6)
        shots.append({'src': fn, 'hue': neon_hue(im)})
    if not shots:
        print('  no clean face render for', name)
    faces.append({
        'slug': s, 'name': name, 'type': c['type'], 'price': c['price'],
        'url': f"https://play.google.com/store/apps/details?id={c['id']}",
        'shots': shots,
    })
    print(name, c['type'], c['price'], [x['hue'] for x in shots])

os.makedirs('data', exist_ok=True)
json.dump(faces, open('data/faces.json', 'w'), indent=1)
print(len(faces), 'faces')
