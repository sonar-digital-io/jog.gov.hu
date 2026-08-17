#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Akadalymentesitesi javitas a fonavigacio legordulo menuire (dap-ds-navigation-menu).

MIT JAVIT (mindharom hiba a design systemben van, nem a tukorben):

1. Enter a trigger-en nem nyitotta ki a legordulot. A komponens billentyu-kezeloje
   csak akkor lep be a panelbe, ha a legordulo tartalma <dap-ds-navigation-menu-item>
   elemekbol all; itt viszont slotolt <a> linkek vannak. Ezert az Enter atesett a
   bongeszo alapertelmezesere, es a trigger linkje navigalt - a panel sosem nyilt ki.
   Billentyuzettel tehat egyaltalan nem lehetett elerni az "Agazati kozlonyok" es
   "Archiv agazati kozlonyok" menupontokat. (WCAG 2.1.1 Billentyuzet)

2. A panel Tab-ra becsukodott (case "Tab": disableSubmenu), es mivel zarva `inert`,
   a tartalma soha nem kaphatott fokuszt.

3. (ELTAVOLITVA keresre) Korabban a normalizeDisplay() display:contents-re allitotta
   a menupontot, hogy az "Agazati kozlonyok" trigger Tabbal fokuszalhato legyen. Ez
   viszont nem a nativ gomb-fokuszt adta, ezert ez a funkcio ki lett veve - a menupont
   fokusza most a design system alapertelmezett viselkedeset koveti.

4. A trigger aria-controls="dropdown" erteke nem letezo id-re mutat (a panel id-je
   "popup"), raadasul a panel shadow DOM-ban van, ahova light DOM-bol id alapjan
   nem is lehet hivatkozni. (WCAG 4.1.2 Nev, szerep, ertek)

MIT AD HELYETTE: Enter/Space/ArrowDown nyit es a panel elso elemere lep, Arrow fel/le
+ Home/End lepked a menupontok kozott, Escape zar es visszaadja a fokuszt a trigger-re,
Tab termeszetesen vegigmegy a panelen. Az eger-viselkedes (hover-nyitas, kattintas)
valtozatlan.

Idempotens: a MARKER-t egyszer szurja be, ujrafuttatasnal frissiti."""
import glob
import os
import re

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "www")
MARKER = "dds-navmenu-a11y-fix"

FIX_JS = r"""(function () {
  var SEL = 'dap-ds-navigation-menu-item';

  function trigger(el) { return el.querySelector(':scope > [slot="trigger"]'); }
  function hasPanel(el) { return !!el.hasContent || el.querySelectorAll(SEL).length > 0; }

  function panelItems(el) {
    // a legordulo tartalma helyenkent <a><dap-ds-button>, helyenkent csupasz
    // <dap-ds-button href>. A LEGBELSO fokuszalhatot tartjuk meg (a gombot), mert
    // a design system fokusz-jelzese azon latszik - a csupasz <a>-n nem.
    var all = el.querySelectorAll('a[href], button, dap-ds-button, dap-ds-link, [tabindex]:not([tabindex="-1"])');
    var arr = Array.prototype.filter.call(all, function (n) { return !n.closest('[slot="trigger"]'); });
    var out = [];
    arr.forEach(function (n) {
      for (var i = 0; i < arr.length; i++) if (arr[i] !== n && n.contains(arr[i])) return;
      out.push(n);
    });
    return out;
  }

  function focusFirst(el) {
    Promise.resolve(el.updateComplete).then(function () {
      setTimeout(function () { var it = panelItems(el); if (it.length) it[0].focus(); }, 0);
    });
  }

  function enhance(el) {
    if (el.__a11yFix || !hasPanel(el)) return;
    el.__a11yFix = true;

    // 1) A beepitett kezelo Tab-ra becsukja a panelt (case "Tab": disableSubmenu),
    //    ezert soha nem lehet beletabbolni. Levesszuk, es potoljuk a jo reszeit.
    var c = el.submenuController;
    if (c) {
      try { c.removeListeners(); } catch (e) {}
      c.addListeners = function () {};
      el.addEventListener('mouseover', function () { if (!el.opened) el.showDropDown(true); });
      el.addEventListener('mouseleave', function () { if (el.opened && !el.contains(document.activeElement)) el.hideDropDown(); });
      el.addEventListener('focusout', function (e) {
        if (!e.relatedTarget || !el.contains(e.relatedTarget)) el.hideDropDown();
      });
    }

    // 2) Billentyuzet. Capture fazis: elobb fut, mint a komponens sajat kezeloje.
    el.addEventListener('keydown', function (e) {
      var t = e.target;
      var onTrigger = t && t.closest && t.closest('[slot="trigger"]');

      if (e.key === 'Escape') {
        if (!el.opened) return;
        e.preventDefault(); e.stopPropagation();
        el.hideDropDown();
        var tr = trigger(el); if (tr) tr.focus();
        return;
      }

      if (onTrigger && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
        // Enter a triggeren eddig a linket aktivalta (elnavigalt), a panel sosem nyilt ki.
        // Mostantol ugyanazt teszi, mint az egerkattintas: nyit, es belep a panelbe.
        e.preventDefault(); e.stopPropagation();
        if (!el.opened) el.showDropDown(false);
        focusFirst(el);
        return;
      }

      if (el.opened && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')) {
        var items = panelItems(el);
        if (!items.length) return;
        var cur = -1;
        for (var i = 0; i < items.length; i++) if (items[i] === t || items[i].contains(t)) { cur = i; break; }
        e.preventDefault(); e.stopPropagation();
        var next;
        if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = items.length - 1;
        else if (e.key === 'ArrowDown') next = cur < items.length - 1 ? cur + 1 : 0;
        else next = cur > 0 ? cur - 1 : items.length - 1;
        items[next].focus();
      }
    }, true);

    // 3) ARIA: az aria-controls="dropdown" nem letezo id-re mutat, raadasul a panel
    //    shadow DOM-ban van, ahova light DOM-bol id-vel nem lehet hivatkozni.
    var tr = trigger(el);
    var popup = el.shadowRoot && el.shadowRoot.querySelector('#popup');
    if (tr) {
      if (popup && 'ariaControlsElements' in Element.prototype) {
        try { tr.ariaControlsElements = [popup]; tr.removeAttribute('aria-controls'); }
        catch (e) { tr.removeAttribute('aria-controls'); }
      } else {
        tr.removeAttribute('aria-controls');
      }
    }

    // 4) A nyelvvalaszto trigger neve csak "HU" -> a felolvaso nem tudja, hogy ez nyelvvalaszto.
    //    Ha a menu nyelvi linkeket tartalmaz, a trigger BELSO gombjara teszunk leiro nevet
    //    (a host aria-label nem jut el a shadow DOM-beli <button>-ig).
    if (el.querySelector('a[href^="/en/"], a[href^="/de/"], a[href^="/fr/"], a[href^="/es/"], a[href^="/it/"], a[href^="/zh/"]')) {
      var curEl = el.querySelector('[aria-current]');
      var curLang = curEl ? (curEl.textContent || '').trim() : '';
      var lbl = 'Nyelv választása' + (curLang ? ', jelenlegi nyelv: ' + curLang : '');
      var setLangLbl = function () {
        if (tr && tr.shadowRoot) {
          var nb = tr.shadowRoot.querySelector('button');
          if (nb) { nb.setAttribute('aria-label', lbl); return true; }
        }
        return false;
      };
      if (!setLangLbl() && window.customElements) {
        customElements.whenDefined('dap-ds-button').then(function () { setTimeout(setLangLbl, 30); });
      }
    }
  }

  function dedupeTabStops(el) {
    // A legordulo minden nyelve/menupontja <a href><dap-ds-button> szerkezetu, ezert
    // a Tab MINDKETTON megall (a linken es a benne levo gombon is) -> dupla stop /
    // "tab kihagyas". A KULSO linket vesszuk ki a Tab-sorrendbol, a belso gomb marad
    // a megallo: egy stop menupontonkent, ES a fokusz LATSZIK (a design system
    // fokusz-jelzese a gombon van). Az Enter/kattintas tovabbra is a linket koveti.
    // Idempotens: csak akkor ir, ha kell (nincs mutation-loop).
    el.querySelectorAll('a[href]').forEach(function (a) {
      if (a.closest('[slot="trigger"]')) return;
      if (!a.querySelector('dap-ds-button, button')) return;
      if (a.getAttribute('tabindex') !== '-1') a.setAttribute('tabindex', '-1');
    });
  }

  function scan() {
    document.querySelectorAll(SEL).forEach(function (el) { enhance(el); dedupeTabStops(el); });
  }

  function boot() {
    scan();
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (customElements.get('dap-ds-navigation-menu-item')) boot();
  else customElements.whenDefined('dap-ds-navigation-menu-item').then(function () { setTimeout(boot, 0); });
})();
"""

SNIPPET = "<script>/*" + MARKER + "*/" + FIX_JS + "</script>"
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


# --------------------------------------------------------------------------- #
# "Skip to main content" link (WCAG 2.4.1 Bypass Blocks).
#
# HIBA: nincs "ugras a fo tartalomra" link. A fejlec (logo, fomenu, nyelvvalaszto,
# stb.) minden oldalbetoltesnel 10-30 fokuszalhato elemet tartalmaz, amin a
# billentyuzetes/felolvaso-hasznalonak vegig kell mennie, mielott a tenyleges
# tartalomhoz erne.
#
# JAVITAS: a <body> ELSO gyereke egy <a href="#dds-main-content"> link, ami a
# <main>-re ugrik. Alapallapotban kepernyon kivul pozicionalva (position:absolute;
# top:-40px), NEM display:none/visibility:hidden - azok a felolvaso elol is
# elrejtenek. Fokuszra (:focus) top:0-ra kerul, tehat lathatova (es Enterrel
# hasznalhatova) valik latoknak is.
#
# FONTOS: a puszta href="#id" horgony-ugras a legtobb bongeszoben CSAK
# odagorditi a celt, a fokuszt NEM helyezi ra (ha a cel nem eredendoen
# fokuszalhato). Enelkul a link "hasznalata" utan a kovetkezo Tab onnan
# folytatna, ahol a fokusz VALOJABAN maradt (a linken) - tehat vissza a
# navigacioba, nem a tartalomba. Ezert a <main> kap tabindex="-1"-et
# (programozottan fokuszalhato, de a normal Tab-sorrendbol kimarad), es egy
# kis script explicit el.focus()-t hiv a linkre kattintva/Enterre.
SKIP_MARKER = "skip-nav-fix"
SKIP_SNIPPET = (
    "<style>/*" + SKIP_MARKER + "*/"
    ".skip-to-content{position:absolute;top:-40px;left:0;z-index:9999;"
    "padding:12px 20px;background:var(--dds-cold-grey-1100,#0b3d3e);color:#fff;"
    "font-weight:600;text-decoration:none;border-radius:0 0 8px 0;"
    "outline-color:var(--dds-focus-outer-ring);outline-offset:var(--dds-spacing-50);"
    "outline-width:var(--dds-border-width-large);transition:top .15s ease-in-out}"
    ".skip-to-content:focus{top:0;outline-style:solid}"
    "</style>"
    '<a href="#dds-main-content" class="skip-to-content">Ugrás a fő tartalomra</a>'
    "<script>/*" + SKIP_MARKER + "*/(function(){"
    "var l=document.querySelector('a.skip-to-content');if(!l)return;"
    "function jump(e){"
    # sajat kezelesben vesszuk at a horgony-ugrast (preventDefault), mert a
    # bongeszo natic hash-navigacioja bizonyos esetekben KESOBB fut, mint a mi
    # focus()-unk, es felulirja azt (visszaesik a fokusz a body-ra/linkre).
    # Ha MI hivjuk a focus()-t, a bongeszo automatikusan a kepbe is gorditi -
    # nincs szukseg kulon scrollIntoView-ra.
    "e.preventDefault();"
    "var t=document.getElementById('dds-main-content');if(!t)return;"
    "t.focus();"
    "if(window.history&&window.history.pushState){window.history.pushState(null,'','#dds-main-content');}"
    "else{location.hash='#dds-main-content';}"
    "}"
    "l.addEventListener('click',jump);"
    # linkeket natic bongeszoben csak Enter aktival, Space nem (az csak
    # gomboknal mukodik) - sok tesztelo eloszor Space-t probal, ezert azt is
    # tamogatjuk, hogy ne fusson bele ebbe a kulonbsegbe.
    "l.addEventListener('keydown',function(e){if(e.key===' '||e.key==='Spacebar'){jump(e);}});"
    "})();</script>"
)
# A regi (korabbi futasbol szarmazo) blokk vagy csak style+link-kel vegzodik
# (meg script nelkuli verzio), vagy mar style+link+script-tel - a zarojeles
# ...(script...)?  RESZ OPCIONALIS, hogy MINDKET regi alakot felismerje es
# kicserelje. (Az elozo, csak-kotelezo-scriptes mintazat nemán nem talalt
# illeszkedest a script nelkuli regi tartalomra, ezert a csere kimaradt.)
SKIP_EXISTING_RE = re.compile(
    r"<style>/\*" + SKIP_MARKER + r"\*/.*?</a>(?:<script>/\*" + SKIP_MARKER + r"\*/.*?</script>)?",
    re.S,
)
MAIN_NO_ID_RE = re.compile(r"(<main(?![^>]*\bid=)[^>]*)(>)")
MAIN_NO_TABINDEX_RE = re.compile(r"(<main(?![^>]*\btabindex=)[^>]*)(>)")


def patch_skip_link(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    original = html

    # 1) a <main>-nek kell egy id (a link celja) es tabindex="-1" (programozottan
    #    fokuszalhato legyen, .focus()-szal elerheto, de a Tab-sorrendbol kimaradjon)
    html = MAIN_NO_ID_RE.sub(r'\1 id="dds-main-content"\2', html, count=1)
    html = MAIN_NO_TABINDEX_RE.sub(r'\1 tabindex="-1"\2', html, count=1)

    # 2) a link+stilus+script beszurasa a <body ...> UTAN, mint elso gyerek
    if SKIP_MARKER in html:
        html = SKIP_EXISTING_RE.sub(lambda m: SKIP_SNIPPET, html, count=1)
    else:
        i = html.lower().find("<body")
        if i == -1:
            return False
        i = html.find(">", i) + 1
        html = html[:i] + SKIP_SNIPPET + html[i:]

    if html == original:
        return False
    open(path, "w", encoding="utf-8").write(html)
    return True


# --------------------------------------------------------------------------- #
# Duplikalt szomszedos linkek: kep-link + cim-link ugyanarra a URL-re.
#
# HIBA: a hirkartyaknal (pl. a fooldal kiemelt cikke) a thumbnail-kep KULON
# <a href="X"><img alt="Cikkcim"></a>, mellette a cim IS egy KULON
# <a href="X"><h3>Cikkcim</h3></a> - ket egymas utani, azonos celu link.
# Felolvaso ezt ketszer jelzi ("link, Cikkcim" majd megegyszer "link, Cikkcim"),
# ami felesleges Tab-megallo es zavaro ismetles.
#
# JAVITAS: a kep-linket elrejtjuk az AT elol (aria-hidden="true" tabindex="-1"),
# mert a mellette levo cim-link mar olvashato nevvel ugyanoda vezet - egerrel/
# erintessel a kep tovabbra is kattinthato marad, csak a felolvaso/Tab kihagyja.
# Csak akkor alkalmazzuk, ha egy KEPET-csak-tartalmazo linket kovet (kb. 1200
# karakteren belul) egy MASIK link ugyanarra a href-re, szoveges tartalommal.
IMG_ONLY_A_RE = re.compile(
    r'<a\s+([^>]*?href="([^"]+)"[^>]*)>(\s*<img\b[^>]*/?>\s*)</a>',
    re.S,
)
DUP_LOOKAHEAD_CHARS = 1200


def dedupe_thumbnail_links(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    original = html

    def repl(m):
        attrs, href, img_html = m.group(1), m.group(2), m.group(3)
        if "aria-hidden" in attrs:
            return m.group(0)  # mar javitva - idempotens
        window = html[m.end():m.end() + DUP_LOOKAHEAD_CHARS]
        has_text_dup = re.search(
            r'<a\s[^>]*href="' + re.escape(href) + r'"[^>]*>\s*<(?:h[1-6]|span|div)\b',
            window,
        )
        if not has_text_dup:
            return m.group(0)
        return '<a aria-hidden="true" tabindex="-1" ' + attrs + '>' + img_html + '</a>'

    html = IMG_ONLY_A_RE.sub(repl, html)
    if html == original:
        return False
    open(path, "w", encoding="utf-8").write(html)
    return True


def main():
    files = glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)
    patched = sum(patch(f) for f in files)
    print("navigacios a11y javitas: %d/%d HTML" % (patched, len(files)))
    skip_patched = sum(patch_skip_link(f) for f in files)
    print("skip-to-content link: %d/%d HTML" % (skip_patched, len(files)))
    dedupe_patched = sum(dedupe_thumbnail_links(f) for f in files)
    print("duplikalt kep+cim link javitva: %d/%d HTML" % (dedupe_patched, len(files)))


if __name__ == "__main__":
    main()
