#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Minimalis statikus szerver a www/ tukorhoz (mock MI kereso).

A www/ alatti fajlokat szolgalja ki helybol. Nincs proxy es nincs fixture mod:
a mock MI kereso teljesen offline mukodik (mock-search.js/.css), nem hivja a
jog.gov.hu /ai backendjet. A hianyzo kliens-oldali API-hivasok (a nem keresos
oldalak dinamikus reszei) 404-et adnak - ez a statikus tukor termeszetes
korlatja, a megjelenest nem befolyasolja.

Hasznalat:
    python3 scripts/serve.py [port] [--no-open]
"""
import http.server
import os
import sys
import threading
import webbrowser
from urllib.parse import parse_qsl, unquote, urlencode, urlsplit

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.join(os.path.dirname(HERE), "www")

PORT = 8799
for _a in sys.argv[1:]:
    if _a.isdigit():
        PORT = int(_a)


def _canonical_query(q):
    return urlencode(sorted(parse_qsl(q, keep_blank_values=True)))


class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "jog-mirror/2.1"

    def send_head(self):
        """Ket kiegeszites a sima statikus kiszolgalashoz:

        1. Query-s oldal-pillanatkep: ha letezik www/<ut>/__q/<rendezett query>.html
           (scripts/snapshot_pages.py tolti le), azt adjuk vissza - pl.
           /magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146
        2. Perjel nelkuli konyvtar-URL (/magyar-kozlony): 301 helyett kozvetlenul az
           index.html-t szolgaljuk ki, a query-t megtartva (az URL valtozatlan marad,
           igy a React Router is ugyanazt latja, mint az elesen).
        """
        parts = urlsplit(self.path)
        # 0. rogzitett API-/adatvalaszok (scripts/record_api.py)
        if parts.path.startswith("/api/") or parts.path == "/__manifest" or parts.path.endswith(".data"):
            return self._send_fixture(parts)
        rel = unquote(parts.path).lstrip("/")
        base = os.path.join(ROOT, rel.replace("/", os.sep)) if rel else ROOT
        if os.path.isdir(base):
            if parts.query:
                snap = os.path.join(base, "__q", _canonical_query(parts.query) + ".html")
                if os.path.isfile(snap):
                    return self._send_file(snap)
            index = os.path.join(base, "index.html")
            if not parts.path.endswith("/") and os.path.isfile(index):
                return self._send_file(index)
        return super().send_head()

    def _send_fixture(self, parts):
        import glob
        import json
        from record_api import fixture_base
        base = fixture_base(unquote(parts.path), parts.query)
        if not os.path.isfile(base + ".body") and parts.path == "/__manifest":
            # a route-felderito valasza minden oldalon ugyanaz az utvonal-keszlet
            found = sorted(glob.glob(os.path.join(os.path.dirname(base), "*.body")))
            base = found[0][:-5] if found else base
        if not os.path.isfile(base + ".body") and "issues-serial-number" in parts.path:
            # a kozlonyszam-lista: ha az adott honap/ev nincs rogzitve, a tagabb
            # (honap nelkuli, majd ev nelkuli) rogzitett listat adjuk vissza
            q = [kv for kv in parse_qsl(parts.query, keep_blank_values=True)]
            for drop in ("field_pub_month", "field_volume", "field_type"):
                q = [kv for kv in q if kv[0] != drop]
                cand = fixture_base(unquote(parts.path), urlencode(q))
                if os.path.isfile(cand + ".body"):
                    base = cand
                    break
        if not os.path.isfile(base + ".body"):
            body = b'{"error":"nincs rogzitett valasz (scripts/record_api.py)"}'
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        meta = json.load(open(base + ".meta", encoding="utf-8"))
        f = open(base + ".body", "rb")
        self.send_response(meta.get("status", 200))
        self.send_header("Content-Type", meta.get("type") or "application/octet-stream")
        self.send_header("Content-Length", str(os.fstat(f.fileno()).st_size))
        self.end_headers()
        return f

    def _send_file(self, path):
        f = open(path, "rb")
        st = os.fstat(f.fileno())
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(st.st_size))
        self.end_headers()
        return f

    def end_headers(self):
        # ne cache-eljen a bongeszo, hogy valtoztatas utan mindig a friss allapotot lassuk
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def build_server(port=None):
    os.chdir(ROOT)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    return http.server.ThreadingHTTPServer(("127.0.0.1", port or PORT), Handler)


def main():
    httpd = build_server()
    url = "http://127.0.0.1:%d/" % PORT
    if "--no-open" not in sys.argv:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    print("jog.gov.hu tukor (mock MI kereso): %s  (leallitas: Ctrl+C)" % url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nleallitva")


if __name__ == "__main__":
    main()
