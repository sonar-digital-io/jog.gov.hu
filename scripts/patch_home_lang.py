#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""A forditott kezdolapok (en/de/fr/es/it/zh) a magyar Kezdolap mintajara.

A nyelvvalasztas utan a felhasznalo a Kezdolapon marad: ugyanaz a hero (cim + leiras + MI kereso,
a talalatok ugyanott toltodnek be), a forditott nyelven nem tamogatott szekciok (Kozlonyok, Jogi
hirek, hirlevel-banner) nelkul. Idempotens; a mock kereso eszkozeit a patch_mock_search.py kotti be.

Futtatas: python3 scripts/patch_home_lang.py   (az `npm run patch` resze)"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import patch_mock_search  # noqa: E402

ROOT = patch_mock_search.ROOT
LANGS = patch_mock_search.LANGS

TEXT = {
    "en": ("Have a legal question? Ask the AI",
           "Quick, simplified answers to your legal questions with the help of artificial intelligence (AI)."),
    "de": ("Rechtsfrage? Fragen Sie die KI",
           "Schnelle, vereinfachte Antworten auf Ihre Rechtsfragen mithilfe künstlicher Intelligenz (KI)."),
    "fr": ("Une question juridique ? Demandez à l’IA",
           "Des réponses rapides et simplifiées à vos questions juridiques grâce à l’intelligence artificielle (IA)."),
    "es": ("¿Tiene una pregunta jurídica? Pregunte a la IA",
           "Respuestas rápidas y sencillas a sus preguntas jurídicas con ayuda de la inteligencia artificial (IA)."),
    "it": ("Ha una domanda giuridica? Chieda all’IA",
           "Risposte rapide e semplificate alle sue domande giuridiche con l’aiuto dell’intelligenza artificiale (IA)."),
    "zh": ("有法律问题？问问人工智能", "借助人工智能（AI），快速、简明地解答您的法律问题。"),
}

HERO_RE = re.compile(
    r'<div class="max-w-\[1090px\] self-center w-full"><h1 class="dds-heading-inverted[^"]*">.*?</h1>'
    r'<h2 class="dds-heading-inverted[^"]*">.*?</h2></div>',
    re.S,
)
BAR = '<div id="mock-search-bar" class="max-w-[1090px] self-center w-full"></div>'
SECTIONS_START = '<div class="_latestGazettes_13rgp_2">'


def hero_html(lang):
    h1, p = TEXT[lang]
    return ('<div class="max-w-[1090px] self-center w-full"><h1 class="dds-heading-inverted dds-typography-h1 '
            'whitespace-pre-line">%s</h1><p class="dds-typography typography-body dds-typography-size--lg pt-5 '
            'lg:pt-1.5" style="color:#fff;font-weight:400">%s</p></div>' % (h1, p))


def strip_sections(html):
    """A hero utani szekciok (Kozlonyok, Jogi hirek, hirlevel) torlese a </main>-ig."""
    s = html.find(SECTIONS_START)
    if s == -1:
        return html
    e = html.index("</main>", s)
    return html[:s] + html[e:]


# a nyelvvalaszto linkjei a (forditott) Kezdolapra mutatnak, nem a kereso oldalra
LANG_LINK_RE = re.compile(r'(<a style="text-decoration:none" href=")/(en|de|fr|es|it|zh)/jogi-informacio-kereso(")')


def patch(lang):
    path = os.path.join(ROOT, lang, "index.html")
    if not os.path.exists(path):
        return False
    html = open(path, encoding="utf-8", errors="replace").read()
    original = html
    if 'id="mock-search-bar"' not in html:
        html, n = HERO_RE.subn(lambda m: hero_html(lang) + BAR, html, count=1)
        if not n:
            print("FIGYELEM: nem talalhato a hero:", path)
            return False
    html = strip_sections(html)
    html = LANG_LINK_RE.sub(r'\1/\2/\3', html)
    if html != original:
        open(path, "w", encoding="utf-8").write(html)
    patch_mock_search.patch(path, is_home=True)   # React ki, placeholder rejtes, kereso-assetek
    return True


def main():
    done = [l for l in LANGS if patch(l)]
    print("Forditott kezdolapok a magyar mintara: %s" % ", ".join(done))


if __name__ == "__main__":
    main()
