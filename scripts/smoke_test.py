#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fusttteszt: elinditja a szervert, ellenorzi hogy a fo oldalak + a design-system
chunk betoltenek, es hogy a fooldal tartalmaz dap-ds komponenseket. Kilepokod!=0 hiba eseten."""
import http.server, os, sys, threading, urllib.request, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from serve import Handler as MirrorHandler  # query-s pillanatkepek + perjel nelkuli URL-ek

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
PORT = 8791  # sajat port, hogy ne utkozzon a fuot szerverrel

PAGES = [
    "/", "/jogi-informacio-kereso/", "/szakmai-jogi-informacio-kereso/",
    "/magyar-kozlony/", "/agazati-kozlony/", "/archiv-agazati-kozlony/",
    "/jogszabalyi-aktualitasok/", "/kapcsolat/", "/felhasznaloi-kezikonyv/",
    "/felhasznalasi-feltetelek/", "/akadalymentesitesi-nyilatkozat/",
    "/adatkezelesi-tajekoztato/", "/agazati-rss.xml",
    # forditott oldalak (nyelvvalaszto / "browser language" ajanlat celjai)
    "/en/", "/en/jogi-informacio-kereso", "/en/magyar-kozlony",
    "/de/", "/fr/", "/es/", "/it/", "/zh/",
]

def get(path):
    with urllib.request.urlopen(f"http://127.0.0.1:{PORT}{path}", timeout=10) as r:
        return r.status, r.read()

def main():
    os.chdir(ROOT)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), MirrorHandler)
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

    # 4b) kezdolapi kozlonykartyak celoldalai (query-s pillanatkepek, perjel nelkul)
    for n in ("146", "145", "144"):
        p = f"/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam={n}"
        try:
            st, body = get(p)
            ok = st == 200 and f"2026. évi {n}. szám".encode() in body
        except Exception as e:
            ok, st = False, e
        print(f"  {'OK ' if ok else 'HIBA'} {st}  {p}")
        if not ok:
            errors.append(f"{p} -> {st}")

    # 4c) rogzitett kliensoldali valaszok (scripts/record_api.py)
    for p in ("/api/search/issues-serial-number/issue/all?field_type=MAGYAR_KOZLONY&field_volume=2026",
              "/magyar-kozlony.data?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=144&_routes=root%2Croutes%2Fmagyar-kozlony",
              "/api/maintenance-message"):
        try:
            st, body = get(p)
            ok = st == 200 and len(body) > 10
        except Exception as e:
            ok, st = False, e
        print(f"  {'OK ' if ok else 'HIBA'} {st}  {p[:90]}")
        if not ok:
            errors.append(f"fixture {p} -> {st}")

    # 5) akadalymentesitesi javitasok bekotve (assetek + statikus ugro link)
    miss = [os.path.relpath(h, ROOT) for h in htmls
            if "a11y-fixes-assets" not in open(h, encoding="utf-8", errors="replace").read()]
    for asset in ("/assets/a11y-fixes.js", "/assets/a11y-fixes.css"):
        st, _ = get(asset)
        if st != 200:
            errors.append(f"{asset} -> {st}")
    if miss:
        errors.append(f"a11y-fixes hianyzik: {miss}")
        print(f"  HIBA ---  a11y-fixes hianyzik {len(miss)} HTML-bol")
    else:
        print(f"  OK  a11y-fixes mind a {len(htmls)} HTML-ben (a renderelt oldalt a test:a11y ellenorzi)")
    stale = [os.path.relpath(h, ROOT) for h in htmls if 'class="ms-mainnav"' in open(h, encoding="utf-8", errors="replace").read()]
    if stale:
        errors.append(f"regi, HTML-be irt fomenu (hidratacios hibat okoz): {stale}")

    httpd.shutdown()
    if errors:
        print(f"\nFUSTTESZT: BUKOTT ({len(errors)} hiba)")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    # a kereso-oldalakon (magyar + forditott) a mock MI kereso be van kotve
    ks = [h for h in glob.glob(os.path.join(ROOT, "**", "*jogi-informacio-kereso", "index.html"), recursive=True)]
    kmiss = [os.path.relpath(h, ROOT) for h in ks if "mock-search-assets" not in open(h, encoding="utf-8", errors="replace").read()]
    if kmiss:
        print(f"  HIBA ---  mock kereso hianyzik: {kmiss}")
        sys.exit(1)
    print(f"  OK  mock MI kereso mind a {len(ks)} kereso-oldalon")
    print(f"\nFUSTTESZT: OK ({len(PAGES)} oldal + design system + tartalom)")

if __name__ == "__main__":
    main()
