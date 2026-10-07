#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kliensoldali API- es adatvalaszok rogzitese az elo oldalrol (fixture-ok).

Az SSR-oldal betoltese utan a React tovabbi kereseket kuld (pl. a Kozlonyszam
legordulo opcioi, a "Kereses" gomb utani /magyar-kozlony.data, a route-felderito
/__manifest). Ezek a statikus tukorben 404-et adnanak. Ez a szkript letolti oket,
a serve.py pedig visszajatssza:

    www/__fixtures/<ut>/<rendezett query vagy _>.body   - a valasz teste
    www/__fixtures/<ut>/<rendezett query vagy _>.meta   - {"status": .., "type": ..}

Hasznalat:
    python3 scripts/record_api.py "/api/maintenance-message" \\
        "/api/search/issues-serial-number/issue/all?field_type=MAGYAR_KOZLONY&field_volume=2026"
"""
import json
import os
import sys
import urllib.error
import urllib.request
from urllib.parse import parse_qsl, urlencode, urlsplit

BASE = "https://jog.gov.hu"
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
FIX = os.path.join(ROOT, "__fixtures")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"


def canonical_query(q):
    return urlencode(sorted(parse_qsl(q, keep_blank_values=True)))


def fixture_base(path, query):
    """A serve.py is ezt hasznalja a kereseshez."""
    d = os.path.join(FIX, path.strip("/").replace("/", os.sep))
    name = canonical_query(query) if query else "_"
    # nagyon hosszu query (pl. __manifest?paths=...) -> rovidebb, stabil nev
    if len(name) > 180:
        import hashlib
        name = "h-" + hashlib.sha1(name.encode()).hexdigest()
    return os.path.join(d, name)


def record(url):
    parts = urlsplit(url)
    req = urllib.request.Request(BASE + url, headers={"User-Agent": UA, "Accept-Language": "hu", "Accept": "*/*"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            status, ctype, body = r.status, r.headers.get("Content-Type", ""), r.read()
    except urllib.error.HTTPError as e:  # pl. /api/auth/user -> 401 (nincs bejelentkezve)
        status, ctype, body = e.code, e.headers.get("Content-Type", ""), e.read()
    base = fixture_base(parts.path, parts.query)
    os.makedirs(os.path.dirname(base), exist_ok=True)
    with open(base + ".body", "wb") as f:
        f.write(body)
    with open(base + ".meta", "w", encoding="utf-8") as f:
        json.dump({"status": status, "type": ctype, "url": url}, f, ensure_ascii=False)
    print("%s %d %s  %s" % ("FIX", status, ctype[:30], url[:120]))


if __name__ == "__main__":
    urls = sys.argv[1:]
    if not urls:
        print(__doc__)
        sys.exit(1)
    for u in urls:
        record(u)
