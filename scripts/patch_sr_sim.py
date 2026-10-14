#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Felolvaso-szimulator (modules/sr-sim) betoltese minden oldalba: Alt+A-val kapcsolhato be.

Ket dolgot ir be:
  - <head> elejere egy import map-et (a modul a 'dom-accessibility-api'-t csupasz nevvel importalja,
    hogy termekbe epitve a bundler ugyanigy feloldja);
  - </head> ele a modul belepesi pontjat (/__sr-sim/auto.js).
A /__sr-sim/ utvonalat a serve.py szolgalja ki kozvetlenul a modul forrasabol.

Idempotens: ha mar benne van, nem nyul hozza."""
import glob
import os

ROOT = os.environ.get(
    "MOCK_WWW",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www"),
)
MARKER = "/__sr-sim/auto.js"
IMPORT_MAP = ('<script type="importmap">{"imports":{"dom-accessibility-api":'
              '"/__sr-sim/vendor/dom-accessibility-api/index.mjs"}}</script>')
ENTRY = '<script type="module" src="/__sr-sim/auto.js"></script>'


def patch(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    if MARKER in html:
        return False
    i = html.lower().find("<head")
    j = html.lower().rfind("</head>")
    if i == -1 or j == -1:
        return False
    i = html.find(">", i) + 1  # az import map-nek minden modul script elott kell lennie
    html = html[:i] + IMPORT_MAP + html[i:j] + ENTRY + html[j:]
    open(path, "w", encoding="utf-8").write(html)
    return True


def main():
    files = glob.glob(os.path.join(ROOT, "**", "index.html"), recursive=True)
    patched = sum(patch(f) for f in files)
    print("felolvaso-szimulator: %d/%d HTML" % (patched, len(files)))


if __name__ == "__main__":
    main()
