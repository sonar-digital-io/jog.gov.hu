#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Minimalis statikus szerver a www/ tukorhoz (mock MI kereso).

A www/ alatti fajlokat szolgalja ki helybol. Nincs proxy es nincs fixture mod:
a mock MI kereso teljesen offline mukodik (mock-search.js/.css), nem hivja a
jog.gov.hu /ai backendjet. A hianyzo kliens-oldali API-hivasok (a nem keresos
oldalak dinamikus reszei) 404-et adnak - ez a statikus tukor termeszetes
korlatja, a megjelenest nem befolyasolja.

Automatikus ujratoltes: a szerver figyeli a www/ es a modules/sr-sim/src/ fajljait; mentes utan
a bongeszo magatol ujratolt (csak CSS valtozasnal csak a stiluslapot csereli, az oldal allapota marad).
A kliens-scriptet a szerver menet kozben szurja a HTML-be, a fajlokhoz nem nyul.

Hasznalat:
    python3 scripts/serve.py [port] [--no-open]
"""
import http.server
import io
import json
import os
import sys
import threading
import time
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
ROOT = os.path.join(REPO, "www")

# A felolvaso-szimulator (modules/sr-sim) kozvetlenul a forrasbol szolgalodik ki, nem masoljuk a www/ ala.
# Hosszabb prefix elol: a vendor ut a /__sr-sim/ ala esik.
ALIASES = [
    ("/__sr-sim/vendor/dom-accessibility-api/", os.path.join(REPO, "node_modules", "dom-accessibility-api", "dist")),
    ("/__sr-sim/", os.path.join(REPO, "modules", "sr-sim", "src")),
]

WATCH = [ROOT, os.path.join(REPO, "modules", "sr-sim", "src")]
LIVERELOAD_JS = b"""<script>/*livereload*/(function(){var down=false,es=new EventSource("/__livereload");
es.onerror=function(){down=true};es.onopen=function(){if(down)location.reload()};
es.onmessage=function(e){var m=JSON.parse(e.data);if(m.type!=="css")return location.reload();
var hit=false;document.querySelectorAll('link[rel="stylesheet"]').forEach(function(l){var u=new URL(l.href);
if(u.pathname===m.path){hit=true;u.searchParams.set("lr",Date.now());l.href=u.href}});if(!hit)location.reload()}})();</script>"""


class Watcher:
    """Fel masodpercenkent vegignezi a WATCH mappak fajljainak mtime-jat (~100 fajl, ~3 ms).
    ponytail: polling, nem OS-esemeny - nagy fa eseten watchdog/ReadDirectoryChangesW kellene."""

    def __init__(self):
        self.cond = threading.Condition()
        self.version = 0
        self.last = None  # az utolso valtozas uzenete
        self.mtimes = self.scan()

    def scan(self):
        out = {}
        for base in WATCH:
            for root, dirs, files in os.walk(base):
                dirs[:] = [d for d in dirs if not d.startswith(".") and d != "node_modules"]
                for f in files:
                    full = os.path.join(root, f)
                    try:
                        out[full] = os.stat(full).st_mtime
                    except OSError:
                        pass
        return out

    def url_of(self, full):
        for prefix, base in [("/", ROOT)] + [(p, b) for p, b in ALIASES]:
            if full.startswith(base + os.sep):
                return prefix + os.path.relpath(full, base).replace(os.sep, "/")
        return None

    def run(self):
        while True:
            time.sleep(0.5)
            now = self.scan()
            changed = [f for f in set(now) | set(self.mtimes) if now.get(f) != self.mtimes.get(f)]
            self.mtimes = now
            if not changed:
                continue
            if all(f.endswith(".css") for f in changed):
                msgs = [{"type": "css", "path": self.url_of(f)} for f in changed]
            else:
                msgs = [{"type": "reload"}]
            with self.cond:
                self.version += 1
                self.last = msgs
                self.cond.notify_all()


WATCHER = None

PORT = 8799
for _a in sys.argv[1:]:
    if _a.isdigit():
        PORT = int(_a)


class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "jog-mirror/2.0"
    # Windowson a .js MIME-tipusa a registrybol jon (neha text/plain) - modul scriptnel ez vegzetes
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".js": "text/javascript", ".mjs": "text/javascript"}

    def do_GET(self):
        if self.path.startswith("/__livereload"):
            return self.livereload()
        return super().do_GET()

    def livereload(self):
        """Server-Sent Events: valtozaskor uzenet a bongeszonek; 15 mp-enkent ping (igy derul ki, ha bezartak)."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        seen = WATCHER.version
        try:
            while True:
                with WATCHER.cond:
                    WATCHER.cond.wait_for(lambda: WATCHER.version != seen, timeout=15)
                    msgs = WATCHER.last if WATCHER.version != seen else None
                    seen = WATCHER.version
                payload = "".join("data: %s\n\n" % json.dumps(m) for m in msgs) if msgs else ": ping\n\n"
                self.wfile.write(payload.encode("utf-8"))
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

    def send_head(self):
        """HTML-be menet kozben beszurja az ujratolto scriptet; minden mas valtozatlan."""
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            if not self.path.split("?", 1)[0].endswith("/"):
                return super().send_head()  # atiranyitas a / vegu cimre
            path = os.path.join(path, "index.html")
        if not path.endswith(".html") or not os.path.isfile(path):
            return super().send_head()
        with open(path, "rb") as f:
            body = f.read()
        i = body.lower().rfind(b"</body>")
        body = body[:i] + LIVERELOAD_JS + body[i:] if i != -1 else body + LIVERELOAD_JS
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)

    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        for prefix, base in ALIASES:
            if clean.startswith(prefix):
                rel = os.path.normpath(clean[len(prefix):]).lstrip("\\/")
                if rel.startswith(".."):
                    break  # ne lehessen kilepni a mappabol
                return os.path.join(base, rel)
        return super().translate_path(path)

    def end_headers(self):
        # ne cache-eljen a bongeszo, hogy valtoztatas utan mindig a friss allapotot lassuk
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def build_server(port=None):
    global WATCHER
    os.chdir(ROOT)
    if WATCHER is None:
        WATCHER = Watcher()
        threading.Thread(target=WATCHER.run, daemon=True).start()
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    http.server.ThreadingHTTPServer.daemon_threads = True  # a nyitott livereload-kapcsolatok ne tartsak fel a leallitast
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
