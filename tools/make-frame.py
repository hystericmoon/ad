"""Turn a front-on product render on white into a watch frame for the site:
the white background becomes transparent and the display is cut out, so a
face render placed underneath shows through.

Usage:
  python3 tools/make-frame.py <render.jpg> <out.webp> <cx> <cy> <r> [width]
cx, cy, r: the display circle in the source image's pixels.
Prints the CSS geometry (screen centre and diameter as percentages).
"""
import sys
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

src, out, cx, cy, r = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:6])
width = int(sys.argv[6]) if len(sys.argv) > 6 else 960

im = Image.open(src).convert('RGB')
# Crop to the product
grey = im.convert('L')
bbox = grey.point(lambda v: 255 if v < 244 else 0).getbbox()
pad = 8
bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad))
im = im.crop(bbox); cx -= bbox[0]; cy -= bbox[1]

# Work at the output scale
s = width / im.width
im = im.resize((width, round(im.height * s)), Image.LANCZOS)
cx, cy, r = cx * s, cy * s, r * s
W, H = im.size
px = im.load()

# Background: flood fill near-white from the border
bg = Image.new('L', (W, H), 0); bgp = bg.load()
near_white = lambda p: min(p) > 236
q = deque((x, y) for x in range(W) for y in (0, H - 1))
q.extend((x, y) for y in range(H) for x in (0, W - 1))
while q:
    x, y = q.popleft()
    if bgp[x, y] or not near_white(px[x, y]):
        continue
    bgp[x, y] = 255
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < W and 0 <= ny < H and not bgp[nx, ny]:
            q.append((nx, ny))

# Soft edge: grow the background by a pixel, then alpha from distance to white
grown = bg.filter(ImageFilter.MaxFilter(3))
alpha = Image.new('L', (W, H), 255); ap = alpha.load(); gp = grown.load()
for y in range(H):
    for x in range(W):
        if bgp[x, y]:
            ap[x, y] = 0
        elif gp[x, y]:
            m = min(px[x, y])
            a = max(0, min(255, int((255 - m) / (255 - 150) * 255)))
            ap[x, y] = a
            if 0 < a < 255:  # un-premultiply the white fringe
                f = a / 255
                px[x, y] = tuple(max(0, min(255, int((c - (1 - f) * 255) / f))) for c in px[x, y])

# Cut the display out (antialiased via supersampling)
SS = 4
hole = Image.new('L', (W * SS, H * SS), 255)
ImageDraw.Draw(hole).ellipse(((cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS), fill=0)
hole = hole.resize((W, H), Image.LANCZOS)
from PIL import ImageChops
alpha = ImageChops.multiply(alpha, hole)

im.putalpha(alpha)
im.save(out, 'WEBP', quality=88, method=6)
print(f'{out}: {W}x{H}  --frame-ratio: {W}/{H}; --sx: {cx / W * 100:.3f}%; --sy: {cy / H * 100:.3f}%; --sd: {2 * r / W * 100:.3f}%;')
