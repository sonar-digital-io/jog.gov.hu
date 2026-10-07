#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MOCK MI kereso bekotese a lokalis tukorbe.

Az eles MI kereso egy kliensoldali web component (k2s-b2c/-b2b), ami a jog.gov.hu
/ai backendjet + captchat igenyli, ezert offline NEM mukodik (lasd README, Korlatok).
Ez a patch a kereso-oldalakon (jogi-informacio-kereso, szakmai-jogi-informacio-kereso)
a mukodeskeptelen React keresot egy ONALLO, OFFLINE MOCK keresore csereli:

  * mock-search.css + mock-search.js  -> a searchbar, a kapcsolok es a talalati
    oldal ujraepitese pontosan ugy, ahogy az elesen kinez;
  * mock service (mock-search.js-ben)  -> a rogzitett kerdes->valasz parok
    (adozas / mosogep-kellekszavatossag / berlet-kikoltoztetes).

Amit csinal, minden cel-HTML-en (idempotens, MARKER alapjan):
  1. a React bootstrap (entry.client import) es a hidratacios spinner eltavolitasa,
     hogy a React ne renderelje a mukodeskeptelen komponenst;
  2. a design system (dds) modul explicit betoltese, hogy a fejlec/lablec dap-ds-*
     komponensei React nelkul is felalljanak;
  3. mock-search.css / mock-search.js beszurasa;
  4. a searchbar es a talalati lista beillesztesi pontjainak (id) kijelolese.

Fusd a patch:search utan (npm run patch). Ujratukrozes utan (npm run build) ismet le kell futnia."""
import glob
import os
import re

ROOT = os.environ.get(
    "MOCK_WWW",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www"),
)
MARKER = "mock-search-assets"

# a ket kereso-oldal + a kezdolap (ott a hero-ban ugyanez a kereso fut)
TARGETS = ("jogi-informacio-kereso", "szakmai-jogi-informacio-kereso")
LANGS = ("en", "de", "fr", "es", "it", "zh")
HOME = "index.html"                       # www/index.html (kezdolap)
HOME_H2 = "Kérdezze meg, hogy mit mond a jog!</h2></div>"
HOME_PLACEHOLDER = ('<div class="max-w-[1090px] self-center w-full">'
                    '<div class="hidden xl:block relative left-[-72px]')

HEAD_SNIPPET = (
    '<link rel="stylesheet" href="/assets/mock-search.css"/>'
    '<script type="module" src="/assets/dds-h8rSR7eo.js"></script>'
    '<!--' + MARKER + '-->'
)
BODY_SNIPPET = '<script src="/assets/mock-search.js"></script>'

RE_HYDRATION = re.compile(
    r'<div class="hydration-overlay">.*?animate-spin"></div></div></div></div>', re.S
)
RE_ENTRY = re.compile(
    r'<script type="module" async="">.*?import\("/assets/entry\.client[^"]*"\);</script>', re.S
)
# a searchbar mount: a mt-[-33.195px] kontener belso ures div-je (b2c es b2b valtozat is)
RE_BAR = re.compile(
    r'(mt-\[-33\.195px\]">)<div class="(?:self-center )?xl:self-start w-full"></div>'
)
RE_RESULTS = re.compile(
    r'<div class="pt-\(--dds-spacing-1200\) px-\(--dds-spacing-400\) '
    r'flex justify-center w-full max-w-\[1122px\] self-center"></div>'
)


def patch(path, is_home=False):
    html = open(path, encoding="utf-8", errors="replace").read()
    original = html

    # 1) React kikapcsolasa
    html = RE_HYDRATION.sub("", html)
    html = RE_ENTRY.sub("", html)

    # 2) mount pontok
    if is_home:
        # a kezdolap hero-jaban: searchbar mount a H2 utan, a statikus (mukodeskeptelen)
        # kereso-placeholder elrejtese. Nincs results mount -> a kereses a talalati
        # oldalra iranyit (?q=...), ahogy az elesen is.
        if 'id="mock-search-bar"' not in html and HOME_H2 in html:
            html = html.replace(
                HOME_H2,
                HOME_H2 + '<div id="mock-search-bar" class="max-w-[1090px] self-center w-full"></div>',
                1,
            )
        if "data-mock-hidden" not in html and HOME_PLACEHOLDER in html:
            html = html.replace(
                HOME_PLACEHOLDER,
                '<div class="max-w-[1090px] self-center w-full" data-mock-hidden="1" style="display:none">'
                '<div class="hidden xl:block relative left-[-72px]',
                1,
            )
    else:
        html = RE_BAR.sub(r'\1<div id="mock-search-bar" class="xl:self-start w-full"></div>', html)
        html = RE_RESULTS.sub(
            '<div id="mock-search-results" class="pt-(--dds-spacing-1200) '
            'px-(--dds-spacing-400) flex flex-col w-full max-w-[1122px] self-center"></div>',
            html,
        )

    # 3) assetek (egyszer)
    if MARKER not in html:
        i = html.lower().rfind("</head>")
        if i != -1:
            html = html[:i] + HEAD_SNIPPET + html[i:]
        j = html.lower().rfind("</body>")
        if j != -1:
            html = html[:j] + BODY_SNIPPET + html[j:]

    if html == original:
        return False
    open(path, "w", encoding="utf-8").write(html)
    return True


def main():
    patched, total = 0, 0
    for name in TARGETS:
        # magyar + forditott (en/de/fr/es/it/zh) kereso-oldalak; a nyelvet a
        # mock-search.js a <html lang>-bol olvassa
        files = glob.glob(os.path.join(ROOT, name, "**", "index.html"), recursive=True)
        for lang in LANGS:
            files += glob.glob(os.path.join(ROOT, lang, name, "**", "index.html"), recursive=True)
        for f in files:
            total += 1
            if patch(f):
                patched += 1
    home = os.path.join(ROOT, HOME)
    if os.path.exists(home):
        total += 1
        if patch(home, is_home=True):
            patched += 1
    print("MOCK MI kereso bekotve: %d/%d HTML" % (patched, total))


if __name__ == "__main__":
    main()
