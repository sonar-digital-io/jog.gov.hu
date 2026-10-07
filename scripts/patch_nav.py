#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Offline-navigacio fix: minden letoltott HTML-be beszur egy pici scriptet, ami
capture-fazisban elkapja a belso linkekre valo kattintast es TELJES oldalbetoltest
csinal (location.assign) a React Router kliens-oldali navigacioja helyett.

Ok: az RR kattintaskor a /__manifest + route-loader vegpontokat keri, amik a
statikus szerveren 404-elnek -> "Varatlan hiba tortent." A lemezen viszont minden
oldal ott van sajat index.html-kent, igy a teljes betoltes helyesen mukodik.

KIVETEL: a fonavigacio legordulo menuinek trigger-e. Annak a gombnak van href-je,
de kattintasra nem navigalnia kell, hanem kinyitnia a legordulot - ha elkapnank,
az "Agazati kozlonyok" es a tobbi almenu egerrel sem lenne hasznalhato. A panelen
beluli linkeket viszont tovabbra is elkapjuk, azok valodi navigaciok.

Idempotens: a MARKER-t egyszer szurja be, ujrafuttatasnal frissiti."""
import glob
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
MARKER = "offline-nav-fix"

SNIPPET = (
    "<script>/*" + MARKER + "*/(function(){document.addEventListener('click',function(e){"
    "if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;"
    "var p=e.composedPath?e.composedPath():[];var el=null;"
    "for(var i=0;i<p.length;i++){var n=p[i];if(n&&n.getAttribute){var h=n.getAttribute('href');"
    "if(h&&h.charAt(0)==='/'){el=n;break;}}}"
    "if(!el)return;"
    # A legordulos menu trigger-et nem bantjuk: az nyitja a panelt, nem navigal.
    # Fontos: a trigger-t a composedPath-bol keressuk, mert a link a gomb shadow
    # DOM-jaban van, es a closest() nem lep at a shadow hataron.
    "var inTrigger=false;"
    "for(var j=0;j<p.length;j++){var m=p[j];if(!m||!m.tagName)continue;"
    "if(m.getAttribute&&m.getAttribute('slot')==='trigger')inTrigger=true;"
    "if(m.tagName.toLowerCase()==='dap-ds-navigation-menu-item'){"
    "if(inTrigger&&(m.hasContent||m.querySelectorAll('dap-ds-navigation-menu-item').length))return;"
    "break;}}"
    "var href=el.getAttribute('href');if(href.indexOf('/assets/')===0)return;"
    "e.preventDefault();e.stopImmediatePropagation();window.location.assign(href);"
    "},true);"
    # Kliensoldali adatkeres (.data) tartalek: a React Router a szuro-urlap (pl.
    # "Kereses") utan /<ut>.data?...-t ker. Ha erre nincs rogzitett valasz
    # (scripts/record_api.py), a serve.py 404-et ad, amitol a React "Application
    # Error" oldalt mutatna. Ehelyett teljes oldalbetoltest csinalunk ugyanarra az
    # URL-re: ha van query-s pillanatkep, azt kapjuk, kulonben a szuretlen oldalt.
    "var of=window.fetch;if(of){window.fetch=function(input,init){"
    "var u=typeof input==='string'?input:(input&&input.url)||'';var pr=of.apply(this,arguments);"
    "if(!/\\.data(\\?|$)/.test(u.split('#')[0]))return pr;"
    "return pr.then(function(r){if(r.status!==404)return r;"
    "var x=new URL(u,location.href);x.pathname=x.pathname.replace(/\\.data$/,'');"
    "if(x.pathname==='/_root')x.pathname='/';x.searchParams.delete('_routes');"
    "window.location.assign(x.pathname+x.search);return new Promise(function(){});});};}"
    "})();</script>"
)
EXISTING_RE = re.compile(r"<script>/\*" + MARKER + r"\*/.*?</script>", re.S)


def patch(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    original = html

    if MARKER in html:
        html = EXISTING_RE.sub(lambda m: SNIPPET, html, count=1)
    else:
        i = html.lower().find("<head")
        if i == -1:
            return False
        i = html.find(">", i) + 1          # beszuras kozvetlenul a <head ...> utan
        html = html[:i] + SNIPPET + html[i:]

    if html == original:
        return False
    open(path, "w", encoding="utf-8").write(html)
    return True


def main():
    files = glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
    patched = sum(patch(f) for f in files)
    print("nav-fix: %d/%d HTML" % (patched, len(files)))


if __name__ == "__main__":
    main()
