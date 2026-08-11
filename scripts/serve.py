#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Statikus szerver a www/ tukorhoz + bongeszo megnyitasa.  Hasznalat: python scripts/serve.py [port]"""
import http.server, os, sys, threading, webbrowser

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8799

os.chdir(ROOT)
url = f"http://127.0.0.1:{PORT}/"
if "--no-open" not in sys.argv:
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    # ne cache-eljen a bongeszo, hogy build/valtoztatas utan mindig a friss allapot lassuk
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

http.server.ThreadingHTTPServer.allow_reuse_address = True
httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler)
print(f"jog.gov.hu tukor: {url}  (leallitas: Ctrl+C)")
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nleallitva")
