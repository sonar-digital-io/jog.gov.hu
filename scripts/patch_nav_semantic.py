#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""A fejlec masodik savjanak fomenujet szemantikus <nav><ul><li><a> listava alakitja.

MIERT: az eredeti fomenu design system web componentekbol all
(dap-ds-navigation-menu / -item / dap-ds-button), amiket csak JS-es a11y-hackekkel
lehetett Tab-elhetove/fokuszalhatova tenni. Szemantikus listaval a menu natívan
elerheto: minden menupont valodi <a> (vagy a legordulo-nyito <button>), a
legordulok tiszta CSS-sel (:hover / :focus-within) nyilnak, es Tabbal is
bejarhatok. Kevesebb <div>, helyes cimkezes (nav > ul > li > a).

MIT NEM ERINT: a nyelvvalaszto (HU) es a felso kulso linkek maradnak a jelenlegi
formaban; azokra tovabbra is a patch_a11y.py vonatkozik.

Az aktiv menupontot oldalankent jeloljuk (aria-current="page" + .is-active), a
fajl utvonalabol szamitva. Idempotens: ha a DS-blokk mar le van cserelve, nem
talalja ujra; a CSS-t a MARKER alapjan egyszer szurja be."""
import glob
import os
import re

ROOT = os.environ.get(
    "MOCK_WWW",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www"),
)
MARKER = "nav-semantic-css"

# a lecserelendo DS fomenu-blokk: <nav><dap-ds-navigation-menu class="main-navigation" ...> ... </dap-ds-navigation-menu></nav>
BLOCK_RE = re.compile(
    r'<nav><dap-ds-navigation-menu class="main-navigation".*?</dap-ds-navigation-menu></nav>',
    re.S,
)
EXISTING_RE = re.compile(r'<nav class="ms-mainnav".*?</nav>', re.S)

CHEVRON = ('<svg class="ms-chevron" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
           '<path d="m12 13.171 4.95-4.95 1.414 1.415L12 16 5.636 9.636 7.05 8.222z"/></svg>')
EXT = ('<svg class="ms-ext-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
       '<path d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm11-3v8h-2V6.413l-7.793 '
       '7.794-1.414-1.414L18.585 5H14V3z"/></svg>')

# (key, label, href-or-None, submenu[list of (label, href, blank, ext)])
ITEMS = [
    ("home", "Kezdőlap", "/", None),
    ("mi", "Jogi MI kereső", "/jogi-informacio-kereso", None),
    ("mk", "Aktuális Magyar Közlönyök", "/magyar-kozlony", None),
    ("agazati", "Ágazati közlönyök", "/agazati-kozlony", [
        ("Ágazati közlönyök", "/agazati-kozlony", False, False),
        ("Archív ágazati közlönyök", "/archiv-agazati-kozlony", True, False),
    ]),
    ("hirek", "Jogi hírek", "/jogszabalyi-aktualitasok", None),
    ("hasznos", "Hasznos linkek", None, [
        ("Folyamatban lévő törvényjavaslatok",
         "https://www.parlament.hu/web/guest/folyamatban-levo-torvenyjavaslatok", True, True),
        ("Folyamatban lévő jogszabálytervezetek", "https://kormany.hu/dokumentumtar", True, True),
    ]),
    ("szakmai", "Szakmai kereső", "/szakmai-jogi-informacio-kereso", None),
]


def route_of(path):
    """www/agazati-kozlony/index.html -> /agazati-kozlony ; www/index.html -> /"""
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    rel = rel[:-len("/index.html")] if rel.endswith("/index.html") else rel
    rel = rel[:-len("index.html")] if rel.endswith("index.html") else rel
    return "/" + rel.strip("/")


def active_key(route):
    if route == "/":
        return "home"
    if route.startswith("/jogi-informacio-kereso"):
        return "mi"
    if route.startswith("/magyar-kozlony"):
        return "mk"
    if route.startswith("/agazati-kozlony") or route.startswith("/archiv-agazati-kozlony"):
        return "agazati"
    if route.startswith("/jogszabalyi-aktualitasok"):
        return "hirek"
    if route.startswith("/szakmai-jogi-informacio-kereso"):
        return "szakmai"
    return None


def submenu_html(sub):
    lis = []
    for label, href, blank, ext in sub:
        attrs = ' href="%s"' % href
        if blank:
            attrs += ' target="_blank" rel="noopener"'
        icon = EXT if ext else ""
        lis.append("<li><a%s><span>%s</span>%s</a></li>" % (attrs, label, icon))
    return '<ul class="ms-submenu">' + "".join(lis) + "</ul>"


def build_nav(active):
    lis = []
    for key, label, href, sub in ITEMS:
        is_active = (key == active)
        li_cls = "ms-has-sub" if sub else ""
        if is_active:
            li_cls = (li_cls + " is-active").strip()
        li_open = '<li%s>' % ((' class="%s"' % li_cls) if li_cls else "")
        cur = ' aria-current="page"' if is_active else ""
        if sub and href is None:
            # csak legordulot nyito (nincs cél-oldal) -> button
            trigger = ('<button type="button" class="ms-nav-link ms-sub-trigger" aria-haspopup="true">'
                       '<span>%s</span>%s</button>' % (label, CHEVRON))
        elif sub:
            trigger = ('<a class="ms-nav-link ms-sub-trigger" href="%s" aria-haspopup="true"%s>'
                       '<span>%s</span>%s</a>' % (href, cur, label, CHEVRON))
        else:
            trigger = '<a class="ms-nav-link" href="%s"%s>%s</a>' % (href, cur, label)
        inner = trigger + (submenu_html(sub) if sub else "")
        lis.append(li_open + inner + "</li>")
    # Csak felolvasonak szolo cimsor: H-val lepkedve ez az elso megallo (a fejlec a <main> elott van),
    # igy a felhasznalo rogton valaszthat: Menu, vagy a kovetkezo H-val az oldal sajat cime.
    return ('<nav class="ms-mainnav" aria-label="Főmenü"><h2 class="sr-only">Menü</h2><ul class="ms-mainnav-list">'
            + "".join(lis) + "</ul></nav>")


def patch(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    original = html

    nav = build_nav(active_key(route_of(path)))
    if BLOCK_RE.search(html):
        html = BLOCK_RE.sub(lambda m: nav, html, count=1)
    else:  # mar patchelt fajl: a menut ujrageneraljuk, hogy a valtozasok ide is atkeruljenek
        html = EXISTING_RE.sub(lambda m: nav, html, count=1)

    i = html.lower().rfind("</head>")
    if i != -1:
        add = ""
        if "nav-semantic.css" not in html:
            add += '<link rel="stylesheet" href="/assets/nav-semantic.css"/>'
        if "nav-semantic.js" not in html:
            add += '<script src="/assets/nav-semantic.js" defer></script>'
        if add:
            html = html[:i] + add + html[i:]

    if html == original:
        return False
    open(path, "w", encoding="utf-8").write(html)
    return True


def main():
    files = glob.glob(os.path.join(ROOT, "**", "index.html"), recursive=True)
    patched = sum(patch(f) for f in files)
    print("szemantikus fomenu: %d/%d HTML" % (patched, len(files)))


if __name__ == "__main__":
    main()
