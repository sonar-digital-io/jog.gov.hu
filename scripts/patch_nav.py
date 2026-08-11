#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Offline-navigacio fix: minden letoltott HTML-be beszur egy pici scriptet, ami
capture-fazisban elkapja a belso linkekre valo kattintast es TELJES oldalbetoltest
csinal (location.assign) a React Router kliens-oldali navigacioja helyett.

Ok: az RR kattintaskor a /__manifest + route-loader vegpontokat keri, amik a
statikus szerveren 404-elnek -> "Varatlan hiba tortent." A lemezen viszont minden
oldal ott van sajat index.html-kent, igy a teljes betoltes helyesen mukodik.

Idempotens: a MARKER-t egyszer szurja be. Fusd a mirror.py utan (npm run build resze)."""
import os, glob

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
MARKER = "offline-nav-fix"

SNIPPET = (
    "<script>/*" + MARKER + "*/(function(){document.addEventListener('click',function(e){"
    "if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;"
    "var p=e.composedPath?e.composedPath():[];var el=null;"
    "for(var i=0;i<p.length;i++){var n=p[i];if(n&&n.getAttribute){var h=n.getAttribute('href');"
    "if(h&&h.charAt(0)==='/'){el=n;break;}}}"
    "if(!el)return;var href=el.getAttribute('href');if(href.indexOf('/assets/')===0)return;"
    "e.preventDefault();e.stopImmediatePropagation();window.location.assign(href);"
    "},true);})();</script>"
)

def patch(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    if MARKER in html:
        return False
    i = html.lower().find("<head")
    if i == -1:
        return False
    i = html.find(">", i) + 1          # beszuras kozvetlenul a <head ...> utan
    open(path, "w", encoding="utf-8").write(html[:i] + SNIPPET + html[i:])
    return True

def main():
    files = glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
    patched = sum(patch(f) for f in files)
    print(f"nav-fix beszurva: {patched}/{len(files)} HTML")

if __name__ == "__main__":
    main()
