# jog.gov.hu – lokális tükör (tesztelési célra)

A [https://jog.gov.hu/](https://jog.gov.hu/) statikus pillanatképe. Letöltve: 2026-07-14.

Az oldal egy szerver-oldalon renderelt (SSR) React Router alkalmazás. A letöltött
HTML tartalmazza a szerver által renderelt tartalmat; a JS/CSS/kép/PDF assetek az
eredeti `/assets/` és `/files/` útvonalon vannak elmentve.

## Indítás / build / teszt

**Legegyszerűbb:** dupla kattintás a `..\start.bat`-ra → elindul a szerver és
megnyílik a böngészőben. Leállítás: az ablak bezárása.

**npm-mel** (a projekt gyökeréből, `C:\code\jog.gov.hu`):

```bash
npm start     # szerver + böngésző (http://127.0.0.1:8799/)
npm run build # újratükrözés a live oldalról (mirror + hiányzó chunkok)
npm test      # füstteszt: minden oldal + design system + tartalom betölt-e
npm run assets # csak a hiányzó JS chunkok pótlása (build gyorsabb fele)
```

A `scripts/` mappa tartalma: `serve.py` (szerver), `mirror.py` (oldalak letöltése),
`fetch_assets.py` (lazy JS chunkok), `smoke_test.py` (teszt). Nincs npm függőség,
minden Python-ból fut (node/npm csak a kényelmi felület).

**Munkafolyamat változtatásnál:** szerkeszd a `www/` alatti fájlokat → `npm start`
fut közben csak frissítsd a böngészőt (statikus, nincs újrafordítás). Ha a live
oldalról akarsz friss állapotot: `npm run build`, majd `npm test`.

### Miért nem elég a HTML-re dupla kattintani (`file://`)?

Az oldal ES module-okból (`<script type="module">`) áll, amit a Chrome `file://`
alól CORS miatt **nem tölt be** — így a design system (`dap-ds-*` komponensek) nem
állna fel, és megint töröttnek látszana. Ezért kell a mini szerver (`start.bat`),
ami már rendes `http://`-n szolgál ki. Tiszta `file://` megnyitáshoz az egész
JS-t újra kellene bundle-özni klasszikus scriptté – az az alkalmazás újraépítése.

## Letöltött oldalak

**7 főmenüpont:**
1. Kezdőlap — `/` (`index.html`)
2. Jogi MI kereső — `/jogi-informacio-kereso`
3. Aktuális Magyar Közlönyök — `/magyar-kozlony`
4. Ágazati közlönyök — `/agazati-kozlony`
5. Jogi hírek — `/jogszabalyi-aktualitasok`
6. Hasznos linkek — legördülő menü, csak **külső** linkek (parlament.hu, kormany.hu) → nincs saját aloldal
7. Szakmai kereső — `/szakmai-jogi-informacio-kereso`

**Aloldalak / kapcsolódó oldalak:**
- `/archiv-agazati-kozlony` (Archív ágazati közlönyök)
- `/jogszabalyi-aktualitasok/...` (3 db konkrét hírcikk)
- Lábléc: `/kapcsolat`, `/felhasznaloi-kezikonyv`, `/felhasznalasi-feltetelek`,
  `/akadalymentesitesi-nyilatkozat`, `/adatkezelesi-tajekoztato`
- `/agazati-rss.xml`
- Kapcsolódó PDF-ek (ágazati közlönyök, kézikönyvek) a `files/` alatt

## Fontos: gyökérből kell szolgálni (ne `file://`)

A dupla-kattintással (`file://`) megnyitott oldal **eltört CSS-t** mutat, mert az
abszolút `/assets/...` útvonalak nem oldódnak fel. Mindig a fenti `http.server`-rel
(vagy bármely statikus szerverrel) nyisd meg a `www/` gyökérből.

A design systemet (`dap-ds-*` web componentek) a `assets/dds-*.js` chunk definiálja;
ez most le van töltve, így a layout helyesen renderel (132/132 komponens feláll).

## Főmenü-navigáció (offline nav-fix)

Az eredeti oldal React Router **SPA**: menüpontra kattintva kliens-oldali
navigációt csinál, ami a `/__manifest` és route-loader végpontokat kéri — ezek a
statikus szerveren 404-elnek, ezért „Váratlan hiba történt." jelenne meg.

Ezért minden HTML-be beszúrunk egy pici scriptet (`offline-nav-fix`, lásd
`scripts/patch_nav.py`), ami capture-fázisban elkapja a belső linkekre kattintást
és **teljes oldalbetöltést** csinál (`location.assign`). Így a lemezen lévő
`.../index.html` töltődik be — a menüpontok közti navigáció működik. A `npm run build`
automatikusan lefuttatja; a `serve.py` `Cache-Control: no-store`-t küld, hogy build
után ne a régi (cache-elt) verziót lásd.

## Korlátok

- A **kliens-oldali, élő API-hívások** (MI kereső, karbantartási sáv, dinamikus
  listák újratöltése, reCAPTCHA) offline **nem működnek** — ezek a jog.gov.hu
  backendjét igénylik. A statikus SSR-tartalom és a teljes vizuális layout viszont
  megjelenik.
- A böngésző konzolon látható `/api/... 404`, `__manifest 404` hibák ebből
  fakadnak, nem a tükör hibái, és nem befolyásolják a megjelenést.
- A **Google Fonts** (Inter, Poppins) internetről töltődik; offline rendszer-
  betűtípusra esik vissza. Online tesztnél az eredeti betűk jönnek.
- A **külső** hivatkozások (njt.hu, magyarkozlony.hu, parlament.hu, kormany.hu,
  cegportal) nincsenek letöltve — más doménekre mutatnak.
