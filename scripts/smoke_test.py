#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fusttteszt: elinditja a szervert, ellenorzi hogy a fo oldalak + a design-system
chunk betoltenek, es hogy a fooldal tartalmaz dap-ds komponenseket. Kilepokod!=0 hiba eseten."""
import http.server, os, sys, threading, urllib.request, glob

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
PORT = 8791  # sajat port, hogy ne utkozzon a fuot szerverrel

PAGES = [
    "/", "/jogi-informacio-kereso/", "/szakmai-jogi-informacio-kereso/",
    "/magyar-kozlony/", "/agazati-kozlony/", "/archiv-agazati-kozlony/",
    "/jogszabalyi-aktualitasok/", "/kapcsolat/", "/felhasznaloi-kezikonyv/",
    "/felhasznalasi-feltetelek/", "/akadalymentesitesi-nyilatkozat/",
    "/adatkezelesi-tajekoztato/", "/agazati-rss.xml",
]

def get(path):
    with urllib.request.urlopen(f"http://127.0.0.1:{PORT}{path}", timeout=10) as r:
        return r.status, r.read()

def main():
    os.chdir(ROOT)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), http.server.SimpleHTTPRequestHandler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    errors = []
    # 1) oldalak elernek-e
    for p in PAGES:
        try:
            st, _ = get(p)
            print(f"  {'OK ' if st == 200 else 'HIBA'} {st}  {p}")
            if st != 200:
                errors.append(f"{p} -> {st}")
        except Exception as e:
            print(f"  HIBA ---  {p}  ({e})")
            errors.append(f"{p} -> {e}")

    # 2) design-system chunk letezik es betolt
    dds = [os.path.basename(x) for x in glob.glob(os.path.join(ROOT, "assets", "dds-*.js"))]
    if not dds:
        errors.append("hianyzik a design-system chunk (assets/dds-*.js) -> torott layout lenne")
        print("  HIBA ---  nincs assets/dds-*.js")
    else:
        st, _ = get(f"/assets/{dds[0]}")
        print(f"  {'OK ' if st == 200 else 'HIBA'} {st}  /assets/{dds[0]} (design system)")
        if st != 200:
            errors.append(f"dds {st}")

    # 3) a fooldal SSR HTML tartalmaz dap-ds komponenseket
    _, body = get("/")
    if b"dap-ds-" not in body:
        errors.append("a fooldal nem tartalmaz dap-ds komponenst")
        print("  HIBA ---  a fooldalon nincs dap-ds- markup")
    else:
        print(f"  OK  fooldal dap-ds komponensek: {body.count(b'dap-ds-')} db")

    # 4) nav-fix (offline navigacio) minden HTML-ben ott van-e
    htmls = glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
    missing = [os.path.relpath(h, ROOT) for h in htmls if "offline-nav-fix" not in open(h, encoding="utf-8", errors="replace").read()]
    if missing:
        errors.append(f"nav-fix hianyzik: {missing}")
        print(f"  HIBA ---  nav-fix hianyzik {len(missing)} HTML-bol")
    else:
        print(f"  OK  nav-fix mind a {len(htmls)} HTML-ben (fomenu-navigacio mukodik)")

    httpd.shutdown()
    if errors:
        print(f"\nFUSTTESZT: BUKOTT ({len(errors)} hiba)")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print(f"\nFUSTTESZT: OK ({len(PAGES)} oldal + design system + tartalom)")

if __name__ == "__main__":
    main()
