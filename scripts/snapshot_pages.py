#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Egyes oldalak (opcionalisan query-stringgel) friss letoltese az elo oldalrol.

Hasznalat:
    python3 scripts/snapshot_pages.py / /magyar-kozlony \
        "/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146"
    (utana: npm run patch)

- Query nelkuli oldal: a szokasos helyre kerul (www/<ut>/index.html).
- Query-s oldal: www/<ut>/__q/<rendezett query>.html - ezt a serve.py szolgalja ki,
  ha pontosan ezzel a query-vel kerik az oldalt (a parameterek sorrendje mindegy).
- A hivatkozott /assets/ es /files/ fajlokat, valamint a lazy JS chunkokat is
  letolti, ha meg hianyoznak (a meglevoeket nem irja felul).
"""
import os
import sys
import time
from urllib.parse import urlsplit, parse_qsl, urlencode

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mirror          # noqa: E402  (fetch, save, local_path, grab_assets)
import fetch_assets    # noqa: E402

OUT = mirror.OUT


def canonical_query(q):
    """A query parametereinek rendezett, ujrakodolt alakja (fajlnevhez es keresheshez)."""
    return urlencode(sorted(parse_qsl(q, keep_blank_values=True)))


def query_file(path, query):
    base = path.split("?")[0].strip("/")
    d = os.path.join(OUT, base.replace("/", os.sep)) if base else OUT
    return os.path.join(d, "__q", canonical_query(query) + ".html")


def snapshot(url):
    parts = urlsplit(url)
    data, ctype = mirror.fetch(mirror.BASE + url)
    target = query_file(parts.path, parts.query) if parts.query else mirror.local_path(parts.path, "html" in ctype)
    mirror.save(target, data)
    print("PAGE:", url, "->", os.path.relpath(target, OUT), len(data))
    if "html" in ctype:
        # csak a hianyzo asseteket toltjuk le
        text = data.decode("utf-8", "replace")
        for a in sorted(set(mirror.ASSET_RE.findall(text)) | set(mirror.ASSET_RE2.findall(text))):
            if os.path.exists(mirror.local_path(a, False)):
                mirror.saved_assets.add(a)
        mirror.grab_assets(text)


def main(urls):
    if not urls:
        print(__doc__)
        return 1
    for u in urls:
        snapshot(u)
        time.sleep(0.25)
    fetch_assets.main()
    if mirror.failed:
        for f in mirror.failed:
            print("FAILED:", f[0], "-", f[1][:80])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
