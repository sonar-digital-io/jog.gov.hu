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

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(os.path.dirname(HERE), "www")

PORT = 8799
for _a in sys.argv[1:]:
    if _a.isdigit():
        PORT = int(_a)


class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "jog-mirror/2.0"

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
