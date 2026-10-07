#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Akadalymentesitesi javitasok bekotese a tukor minden HTML-jebe.

MIT CSINAL (idempotens, ujrafuttathato):

1. A <head>-be beszurja az a11y-fixes.css-t es az a11y-fixes.js-t. A tenyleges
   javitasok (szemantikus fomenu, nyelvvalaszto-billentyuzet, cimsorszintek,
   "Reszletek" gombok allapota, uj ablakos linkek, mobilmenu fokuszkezelese stb.)
   FUTASIDOBEN, a React-hidratacio UTAN tortennek - lasd www/assets/a11y-fixes.js.

2. A <body> elso gyerekekent statikus "Ugras a fo tartalomra" linket tesz, a
   <main>-re pedig id="dds-main-content" es tabindex="-1" kerul (WCAG 2.4.1).
   Ez a ket valtoztatas NEM okoz hidratacios elterest (merve), a link JS nelkul
   is mukodik; a fokusz-athelyezest az a11y-fixes.js vegzi.

3. Eltavolitja a korabbi verziok HTML-be irt javitasait, mert azok a React-es
   oldalakon hidratacios hibat okoztak (Minified React error #418), es a React a
   javitasokkal egyutt ujrarenderelte az oldalt:
     - a fomenu SSR-csereje (patch_nav_semantic.py, mar torolve),
     - a nav-semantic.css / nav-semantic.js hivatkozasok,
     - a dds-navmenu-a11y-fix inline script (most az a11y-fixes.js resze),
     - a skip-nav-fix inline stilus/script (most az a11y-fixes.css/.js resze),
     - a kep-linkekre irt aria-hidden (most futasidoben tortenik).
   A fomenu SSR-csereje nem vonhato vissza regex-szel; azokat a fajlokat az
   eredeti tukorbol kell ujrageneralni (npm run build, vagy git checkout
   origin/main -- www, majd npm run patch).
"""
import glob
import os
import re

ROOT = os.environ.get(
    "MOCK_WWW",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www"),
)

HEAD_MARKER = "a11y-fixes-assets"
HEAD_SNIPPET = (
    "<!--" + HEAD_MARKER + "-->"
    '<link rel="stylesheet" href="/assets/a11y-fixes.css"/>'
    '<script src="/assets/a11y-fixes.js" defer=""></script>'
)
SKIP_LINK = '<a href="#dds-main-content" class="skip-to-content">Ugrás a fő tartalomra</a>'

LEGACY = [
    re.compile(r"<script>/\*dds-navmenu-a11y-fix\*/.*?</script>", re.S),
    re.compile(r"<style>/\*skip-nav-fix\*/.*?</style>", re.S),
    re.compile(r"<script>/\*skip-nav-fix\*/.*?</script>", re.S),
    re.compile(r'<link rel="stylesheet" href="/assets/nav-semantic\.css"/>'),
    re.compile(r'<script src="/assets/nav-semantic\.js" defer></script>'),
]
LEGACY_IMG_LINK = re.compile(r'<a aria-hidden="true" tabindex="-1" ')
MAIN_NO_ID_RE = re.compile(r"(<main(?![^>]*\bid=)[^>]*)(>)")
MAIN_NO_TABINDEX_RE = re.compile(r"(<main(?![^>]*\btabindex=)[^>]*)(>)")


def patch(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    original = html

    if 'class="ms-mainnav"' in html:
        print("  FIGYELEM: %s meg a regi, HTML-be irt fomenut tartalmazza -> "
              "generald ujra az eredeti tukorbol (lasd docstring)" % os.path.relpath(path, ROOT))

    for rx in LEGACY:
        html = rx.sub("", html)
    html = LEGACY_IMG_LINK.sub("<a ", html)

    # 1) head assetek
    if HEAD_MARKER not in html:
        i = html.lower().rfind("</head>")
        if i != -1:
            html = html[:i] + HEAD_SNIPPET + html[i:]

    # 2) skip link + main cel
    if "skip-to-content" not in html:
        i = html.lower().find("<body")
        if i != -1:
            i = html.find(">", i) + 1
            html = html[:i] + SKIP_LINK + html[i:]
    html = MAIN_NO_ID_RE.sub(r'\1 id="dds-main-content"\2', html, count=1)
    html = MAIN_NO_TABINDEX_RE.sub(r'\1 tabindex="-1"\2', html, count=1)

    if html == original:
        return False
    open(path, "w", encoding="utf-8").write(html)
    return True


def main():
    files = glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
    patched = sum(patch(f) for f in files)
    print("a11y javitasok bekotve: %d/%d HTML" % (patched, len(files)))


if __name__ == "__main__":
    main()
