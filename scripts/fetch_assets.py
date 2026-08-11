#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""A lazy (JS-bol importalt) /assets/ chunkok rekurziv letoltese, amig nincs tobb
hianyzo. Ez tolti le pl. a design-system bundle-t (dds-*.js), ami nelkul a dap-ds-*
webkomponensek nem allnak fel es "torott" lesz a CSS. Fusd a mirror.py utan."""
import os, re, glob, urllib.request

BASE = "https://jog.gov.hu"
ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www", "assets")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36"
EXT = r"(?:js|css|svg|png|jpg|jpeg|webp|woff2?|json|ico)"
REL = re.compile(r'["\'(]\./([A-Za-z0-9._-]+\.' + EXT + r')')
ABS = re.compile(r'/assets/([A-Za-z0-9._-]+\.' + EXT + r')')

def fetch(name):
    req = urllib.request.Request(f"{BASE}/assets/{name}", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def refs(text):
    return set(REL.findall(text)) | set(ABS.findall(text))

def main():
    have = {os.path.basename(p) for p in glob.glob(os.path.join(ASSETS_DIR, "*"))}
    queue = set()
    for p in glob.glob(os.path.join(ASSETS_DIR, "*.js")) + glob.glob(os.path.join(ASSETS_DIR, "*.css")):
        queue |= refs(open(p, encoding="utf-8", errors="replace").read())
    added, failed = 0, []
    while queue:
        name = queue.pop()
        if name in have:
            continue
        have.add(name)
        try:
            data = fetch(name)
        except Exception as e:
            failed.append(name)
            continue  # 404 = false positive (nem valodi chunk), atugorjuk
        with open(os.path.join(ASSETS_DIR, name), "wb") as f:
            f.write(data)
        added += 1
        print("+", name, len(data))
        if name.endswith((".js", ".css")):
            queue |= refs(data.decode("utf-8", "replace"))
    print(f"\nhozzaadva: {added}  (kihagyott/404: {len(failed)})")

if __name__ == "__main__":
    main()
