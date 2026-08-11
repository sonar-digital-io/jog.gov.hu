#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""jog.gov.hu (SSR React Router app) letoltese lokalis teszteleshez.
Letolti a fooldalt + 7 fomenu + aloldalaikat (BFS melyseg<=2, azonos host) es a
kozvetlenul hivatkozott /assets/ es /files/ eroforrasokat. A lazy-importalt JS
chunkokat a fetch_assets.py toltiik le utana (fusd mindkettot: npm run build)."""
import os, re, time, urllib.request
from collections import deque

BASE = "https://jog.gov.hu"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"

SEEDS = [
    "/", "/jogi-informacio-kereso", "/szakmai-jogi-informacio-kereso",
    "/magyar-kozlony", "/agazati-kozlony", "/archiv-agazati-kozlony",
    "/jogszabalyi-aktualitasok", "/kapcsolat", "/felhasznaloi-kezikonyv",
    "/felhasznalasi-feltetelek", "/akadalymentesitesi-nyilatkozat",
    "/adatkezelesi-tajekoztato", "/agazati-rss.xml",
]
MAX_PAGES, MAX_DEPTH = 80, 2

visited, saved_assets, failed = set(), set(), []
ASSET_RE = re.compile(r'(?:href|src)="(/(?:assets|files)/[^"]+)"')
ASSET_RE2 = re.compile(r'"(/assets/[^"\\]+\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?|ico))"')
LINK_RE = re.compile(r'href="(/[^"]*)"')

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "hu"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read(), r.headers.get_content_type()

def local_path(path, is_html):
    path = path.split("?")[0].split("#")[0]
    if path in ("", "/"):
        return os.path.join(OUT, "index.html")
    rel = path.lstrip("/")
    if is_html and not os.path.splitext(rel)[1]:
        return os.path.join(OUT, rel.replace("/", os.sep), "index.html")
    return os.path.join(OUT, rel.replace("/", os.sep))

def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)

def is_page_link(href):
    href = href.split("?")[0].split("#")[0]
    if not href.startswith("/") or href.startswith(("/assets/", "/files/")):
        return False
    if re.match(r"^/(de|en|es|fr|it|zh)(/|$)", href):
        return False
    ext = os.path.splitext(href)[1].lower()
    return not ext or ext == ".html"

SKIP_EXT = (".pdf",)  # nagy, nem-hasznalt mediat nem toltunk le (lasd README)

def grab_assets(text):
    for a in sorted(set(ASSET_RE.findall(text)) | set(ASSET_RE2.findall(text))):
        if a in saved_assets or a.split("?")[0].lower().endswith(SKIP_EXT):
            continue
        saved_assets.add(a)
        try:
            data, _ = fetch(BASE + a)
            save(local_path(a, False), data)
            print("  asset:", a, len(data))
        except Exception as e:
            failed.append((a, str(e)))
            print("  ASSET FAIL:", a, e)

def crawl():
    q = deque((s, 0) for s in SEEDS)
    while q and len(visited) < MAX_PAGES:
        path, depth = q.popleft()
        key = path.split("?")[0].split("#")[0].rstrip("/") or "/"
        if key in visited:
            continue
        visited.add(key)
        try:
            data, ctype = fetch(BASE + path)
        except Exception as e:
            failed.append((path, str(e)))
            print("PAGE FAIL:", path, e)
            continue
        is_html = "html" in ctype
        save(local_path(path, is_html), data)
        print("PAGE[%d]:" % depth, path, len(data))
        if is_html:
            text = data.decode("utf-8", "replace")
            grab_assets(text)
            if depth < MAX_DEPTH:
                for href in set(LINK_RE.findall(text)):
                    if is_page_link(href):
                        k = href.split("?")[0].split("#")[0].rstrip("/") or "/"
                        if k not in visited:
                            q.append((href, depth + 1))
        time.sleep(0.25)

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    crawl()
    print(f"\npages: {len(visited)}  assets: {len(saved_assets)}  failed: {len(failed)}")
    for f in failed:
        print("FAILED:", f[0], "-", f[1][:80])
