#!/usr/bin/env python3
"""Adds each face's Google Play release date to data/faces.json as "released" (YYYY-MM-DD).

The date is the one Google Play shows on the listing, read from the page's embedded data
(the date that sits just before the install count). Run from the repo root, then rebuild:
    python3 tools/fetch-dates.py && node tools/build.mjs
"""
import json
import re
import sys
import time
import urllib.request
from datetime import datetime

PATH = 'data/faces.json'
# "Mar 8, 2025",[1741446753,...]],null,null,["1,000+"   -> release date followed by installs
PATTERN = re.compile(r'\["([A-Z][a-z]{2} \d{1,2}, \d{4})",\[(\d+),\d+\]\],null,null,\["[\d,.]+[+]?"')


def released(url):
    req = urllib.request.Request(url + '&hl=en_US&gl=US', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')
    m = PATTERN.search(html)
    if not m:
        return None
    return datetime.strptime(m.group(1), '%b %d, %Y').strftime('%Y-%m-%d')


def main():
    faces = json.load(open(PATH))
    missing = []
    for f in faces:
        try:
            d = released(f['url'])
        except Exception as e:  # network or HTTP error: keep any date we already had
            print(f"{f['slug']}: {e}", file=sys.stderr)
            d = None
        if d:
            f['released'] = d
        elif 'released' not in f:
            missing.append(f['slug'])
        print(f"{f['slug']:24} {f.get('released', '-')}")
        time.sleep(0.4)
    json.dump(faces, open(PATH, 'w'), indent=1, ensure_ascii=False)
    open(PATH, 'a').write('\n')
    if missing:
        print('no date for: ' + ', '.join(missing), file=sys.stderr)


if __name__ == '__main__':
    main()
