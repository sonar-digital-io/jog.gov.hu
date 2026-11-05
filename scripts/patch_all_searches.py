#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Az "Osszes keresesem" oldal (/osszes-keresesem, /<nyelv>/osszes-keresesem) a Kezdolap (es a forditott
kezdolapok) alapjan: ugyanaz a fejlec/lablec, a hero-ban csak a cim, a tartalmat (a korabbi keresesek
kartyai) a mock-search.js tolti be a <main data-ms-all> elembe. Idempotens, az `npm run patch` resze.

Futtatas: python3 scripts/patch_all_searches.py"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ("", "en", "de", "fr", "es", "it", "zh")
LABEL = {"": "Összes keresésem", "en": "All my searches", "de": "Alle meine Suchen", "fr": "Toutes mes recherches",
         "es": "Todas mis búsquedas", "it": "Tutte le mie ricerche", "zh": "我的全部搜索"}

HERO_RE = re.compile(
    r'<div class="max-w-\[1090px\] self-center w-full"><h1 class="dds-heading-inverted[^"]*">.*?</h1>'
    r'(?:<p class="[^"]*"[^>]*>.*?</p>)?</div><div id="mock-search-bar"[^>]*></div>', re.S)
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.S)


def build(lang):
    src = os.path.join(ROOT, lang, "index.html") if lang else os.path.join(ROOT, "index.html")
    if not os.path.exists(src):
        return False
    html = open(src, encoding="utf-8", errors="replace").read()
    label = LABEL[lang]
    hero = ('<div class="max-w-[1090px] self-center w-full"><h1 class="dds-heading-inverted dds-typography-h1 '
            'whitespace-pre-line">%s</h1></div>' % label)
    html, n = HERO_RE.subn(lambda m: hero, html, count=1)
    if not n:
        print("FIGYELEM: nem talalhato a hero:", src)
        return False
    m = TITLE_RE.search(html)
    site = m.group(1).split(" - ")[-1] if m else "Magyar Jogi Információs Portál"
    html = TITLE_RE.sub(lambda _: "<title>%s - %s</title>" % (label, site), html, count=1)
    html = html.replace('<meta name="description" content="Kezdőlap"/>', '<meta name="description" content="%s"/>' % label)
    html = html.replace("lg:py-[96px]", "lg:py-[48px]", 1)
    html = html.replace('<main class="', '<main data-ms-all="" class="', 1)
    out_dir = os.path.join(ROOT, lang, "osszes-keresesem") if lang else os.path.join(ROOT, "osszes-keresesem")
    os.makedirs(out_dir, exist_ok=True)
    open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8").write(html)
    return True


def main():
    done = [l or "hu" for l in LANGS if build(l)]
    print("Osszes keresesem oldal: %s" % ", ".join(done))


if __name__ == "__main__":
    main()
