#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Minimalis statikus szerver a tukorhoz (repo gyoker) (mock MI kereso).

A repo gyokerben levo fajlokat szolgalja ki helybol. Nincs proxy es nincs fixture mod:
a mock MI kereso teljesen offline mukodik (mock-search.js/.css), nem hivja a
jog.gov.hu /ai backendjet. A hianyzo kliens-oldali API-hivasok (a nem keresos
oldalak dinamikus reszei) 404-et adnak - ez a statikus tukor termeszetes
korlatja, a megjelenest nem befolyasolja.

Felolvaso-szimulator: a /__sr-sim/ utvonal kozvetlenul a modules/sr-sim/src forrasbol
szolgalodik ki (scripts/patch_sr_sim.py koti be az oldalakba; Alt+A kapcsolja).

Automatikus ujratoltes: a szerver figyeli az oldal- es a szimulator-fajlokat; mentes utan
a bongeszo magatol ujratolt (CSS valtozasnal csak a stiluslapot csereli, az oldal allapota marad).
A kliens-scriptet a szerver menet kozben szurja a HTML-be, a fajlokhoz nem nyul.

Hasznalat:
    python3 scripts/serve.py [port] [--no-open]
"""
import http.server
import io
import json
import os
import posixpath
import time
import re
import sys
import threading
import webbrowser
from urllib.parse import parse_qsl, unquote, urlencode, urlsplit

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.dirname(HERE)

PORT = 8799
for _a in sys.argv[1:]:
    if _a.isdigit():
        PORT = int(_a)


def _canonical_query(q):
    return urlencode(sorted(parse_qsl(q, keep_blank_values=True)))


NOT_SITE = {"scripts", "node_modules", "__fixtures", "modules", "tests", "docs", ".git", ".claude",
            "test-results", "playwright-report",
            "package.json", "package-lock.json", "start.bat", "README.md", ".gitignore"}

# A felolvaso-szimulator (modules/sr-sim) kozvetlenul a forrasbol szolgalodik ki.
# Hosszabb prefix elol: a vendor ut a /__sr-sim/ ala esik.
SIM_SRC = os.path.join(ROOT, "modules", "sr-sim", "src")
ALIASES = [
    ("/__sr-sim/vendor/dom-accessibility-api/", os.path.join(ROOT, "node_modules", "dom-accessibility-api", "dist")),
    ("/__sr-sim/", SIM_SRC),
]

LIVERELOAD_JS = b"""<script>/*livereload*/(function(){var down=false,es=new EventSource("/__livereload");
es.onerror=function(){down=true};es.onopen=function(){if(down)location.reload()};
es.onmessage=function(e){var m=JSON.parse(e.data);if(m.type!=="css")return location.reload();
var hit=false;document.querySelectorAll('link[rel="stylesheet"]').forEach(function(l){var u=new URL(l.href);
if(u.pathname===m.path){hit=true;u.searchParams.set("lr",Date.now());l.href=u.href}});if(!hit)location.reload()}})();</script>"""


class Watcher:
    """Fel masodpercenkent vegignezi az oldal- es szimulator-fajlok mtime-jat.
    ponytail: polling, nem OS-esemeny - nagy fa eseten watchdog/ReadDirectoryChangesW kellene."""

    def __init__(self):
        self.cond = threading.Condition()
        self.version = 0
        self.last = None  # az utolso valtozas uzenete
        self.mtimes = self.scan()

    def scan(self):
        out = {}
        for base in (ROOT, SIM_SRC):
            for root, dirs, files in os.walk(base):
                # a repo gyoker az oldal gyokere: a nem-oldal mappakat (a szimulatort kulon figyeljuk) kihagyjuk
                dirs[:] = [d for d in dirs if not d.startswith(".") and d not in NOT_SITE]
                for f in files:
                    full = os.path.join(root, f)
                    try:
                        out[full] = os.stat(full).st_mtime
                    except OSError:
                        pass
        return out

    def url_of(self, full):
        for prefix, base in ALIASES + [("/", ROOT)]:
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


class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "jog-mirror/2.1"
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

    def translate_path(self, path):
        clean = unquote(path.split("?", 1)[0].split("#", 1)[0])
        for prefix, base in ALIASES:
            if clean.startswith(prefix):
                rel = os.path.normpath(clean[len(prefix):]).lstrip("\\/")
                if rel == "." or rel.startswith(".."):
                    break  # ne lehessen kilepni a mappabol
                return os.path.join(base, rel)
        return super().translate_path(path)

    def send_head(self):
        """Ket kiegeszites a sima statikus kiszolgalashoz:

        1. Query-s oldal-pillanatkep: ha letezik <ut>/__q/<rendezett query>.html
           (scripts/snapshot_pages.py tolti le), azt adjuk vissza - pl.
           /magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146
        2. Perjel nelkuli konyvtar-URL (/magyar-kozlony): 301 helyett kozvetlenul az
           index.html-t szolgaljuk ki, a query-t megtartva (az URL valtozatlan marad,
           igy a React Router is ugyanazt latja, mint az elesen).
        """
        parts = urlsplit(self.path)
        # a /jogi-informacio-kereso oldal megszunt: a kereso a Kezdolapon van (query-vel egyutt)
        _m = re.match(r"^((?:/(?:en|de|fr|es|it|zh))?)/jogi-informacio-kereso/?$", parts.path)
        if _m:
            self.send_response(302)
            self.send_header("Location", (_m.group(1) or "") + "/" + ("?" + parts.query if parts.query else ""))
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        # 0. rogzitett API-/adatvalaszok (scripts/record_api.py)
        if parts.path.startswith("/api/") or parts.path == "/__manifest" or parts.path.endswith(".data"):
            return self._send_fixture(parts)
        # a repo gyoker egyben az oldal gyokere: a nem-oldal mappakat ne szolgaljuk ki
        # ugyanugy dekodolva/normalizalva, mint a fajl-feloldasnal (kulonben a /x/..%2fscripts/ atjut)
        if posixpath.normpath(unquote(parts.path).replace("\\", "/")).lstrip("/").split("/")[0] in NOT_SITE:
            self.send_error(404)
            return None
        base = self.translate_path(parts.path)  # normalizal: '..' nem vezet ki a ROOT-bol
        if os.path.isdir(base):
            if parts.query:
                snap = os.path.join(base, "__q", _canonical_query(parts.query) + ".html")
                if os.path.isfile(snap):
                    return self._send_file(snap)
            index = os.path.join(base, "index.html")
            if os.path.isfile(index):
                if not parts.path.endswith("/"):
                    return self._send_file(index)
                base = index
        if base.endswith(".html") and os.path.isfile(base):
            return self._send_file(base)  # minden HTML ezen at: kap ujratolto scriptet
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
        """HTML kiszolgalasa; menet kozben beszurja az ujratolto scriptet (a fajlhoz nem nyul)."""
        with open(path, "rb") as f:
            body = f.read()
        i = body.lower().rfind(b"</body>")
        body = body[:i] + LIVERELOAD_JS + body[i:] if i != -1 else body + LIVERELOAD_JS
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)

    def list_directory(self, path):
        self.send_error(404)
        return None

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
    http.server.ThreadingHTTPServer.daemon_threads = True  # a nyitott livereload-kapcsolatok ne tartsak fel a leallitast
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
