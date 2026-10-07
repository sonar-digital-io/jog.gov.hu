# jog.gov.hu – lokális tükör (tesztelési célra)

A [https://jog.gov.hu/](https://jog.gov.hu/) statikus pillanatképe. Letöltve: 2026-07-14.

Az oldal egy szerver-oldalon renderelt (SSR) React Router alkalmazás. A letöltött
HTML tartalmazza a szerver által renderelt tartalmat; a JS/CSS/kép/PDF assetek az
eredeti `/assets/` és `/files/` útvonalon vannak elmentve.

## Indítás / build / teszt

**Legegyszerűbb:** `npm start` (Windows-on dupla kattintás a `start.bat`-ra) →
elindul a szerver és megnyílik a böngészőben. Leállítás: Ctrl+C / az ablak bezárása.

**npm-mel** (a projekt gyökeréből):

```bash
npm start     # szerver + böngésző (http://127.0.0.1:8799/)
npm run build # újratükrözés a live oldalról (mirror + hiányzó chunkok)
npm test      # füstteszt: minden oldal + design system + tartalom betölt-e
npm run test:a11y # akadálymentességi regressziós teszt (Playwright + axe-core)
                 # darabolva: A11Y_ONLY_PAGES=1 A11Y_PAGES="/,/kapcsolat/" npm run test:a11y
npm run assets # csak a hiányzó JS chunkok pótlása (build gyorsabb fele)
```

A `scripts/` mappa tartalma: `serve.py` (szerver), `mirror.py` (oldalak letöltése),
`fetch_assets.py` (lazy JS chunkok), `patch_nav.py` (offline navigáció),
`patch_a11y.py` (akadálymentesítési javítások bekötése), `patch_mock_search.py`
(offline MI kereső), `smoke_test.py` és `test_a11y.mjs` (tesztek). A tükör maga
Python-ból fut; az `npm run test:a11y`-hoz egyszer kell: `npm i && npx playwright install chromium`.

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

- A kezdőlapon és a két kereső oldalon a React ki van kapcsolva (mock kereső), ezért
  ott a süti-/EIR-tájékoztató és a karbantartási sáv nem jelenik meg.
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

## Akadálymentesítési javítások (`npm run patch:a11y`)

A javítások **futásidőben**, a React-hidratáció **után** történnek
(`www/assets/a11y-fixes.js` + `a11y-fixes.css`), mert a HTML-be írt szerkezeti
változtatások (pl. a főmenü cseréje) hidratációs eltérést okoztak (React #418), és
a React újrarenderelte az oldalt – a javításokkal együtt. A `patch_a11y.py` csak
az assetet köti be, és statikus „Ugrás a fő tartalomra” linket tesz a `<body>`
elejére (ez nem okoz eltérést).

Mit javít (WCAG 2.2): ugró link (2.4.1); szemantikus, billentyűzettel bejárható
főmenü disclosure-mintával (2.1.1, 4.1.2, 1.4.13); nyelvválasztó billentyűzet,
név, `lang` (2.1.1, 3.1.2); egyedi landmark-nevek; kihagyott címsorszintek
(`aria-level`); „ALT” helyőrző alt-szövegek és duplikált kép-linkek; a közlönykártyák
„Részletek” gombjának állapota és neve; új ablakban nyíló linkek jelzése; a süti-sáv
ne takarja a fókuszt (2.4.11); mobilmenü fókuszkezelése; a design system
fókuszgyűrűjének kontrasztja világos háttéren (1.4.11); a rögzített Széchenyi-logó
helyén marad (mint az élő oldalon), de fókuszáláskor a fókuszált elem kigördül mögüle; lábléc-linkek célterülete (2.5.8).

**Fontos:** ha a `www/` HTML-jei még a régi, HTML-be írt főmenüt tartalmazzák
(`class="ms-mainnav"`), azokat az eredeti tükörből kell újragenerálni:
`git checkout origin/main -- $(git ls-tree -r --name-only origin/main www | grep '\.html$')`
majd `npm run patch`. A `npm test` ezt jelzi.

A végleges megoldás a forrásalkalmazásban / a DÁP design systemben javítani ezeket –
a tükör a javítások kipróbálására és demonstrálására szolgál.

## Query-s oldalak (pl. a kezdőlapi közlönykártyák céljai)

A kezdőlap 3 közlönykártyája a szűrt Magyar Közlöny oldalra visz, pl.
`/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146`. Ezek az oldalak
a szerveren query alapján renderelődnek, ezért külön pillanatképként vannak
elmentve: `www/magyar-kozlony/__q/<rendezett query>.html`. A `serve.py` ezeket
adja vissza (a paraméterek sorrendje mindegy), és a perjel nélküli URL-eket
(`/magyar-kozlony`) is közvetlenül kiszolgálja átirányítás nélkül.
Másik statikus szerverrel a query-s oldalak NEM működnek.

Friss pillanatkép (pl. új közlönyszámoknál):
`npm run snapshot -- / /magyar-kozlony "/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146"`
majd `npm run patch`.

A kezdőlapon a React ki van kapcsolva (mock kereső), ezért a kártyákat az
`a11y-fixes.js` alakítja valódi linkké (`renderas="a"` + `href` a címből számolva).

## Fordított oldalak (`/en/`, `/de/`, `/fr/`, `/es/`, `/it/`, `/zh/`)

Az éles oldal minden aloldala elérhető hat további nyelven, és ha a böngésző
nyelve nem magyar, az oldal felajánlja a váltást („It looks like your browser
language differs…” → YES), ami pl. `/en/magyar-kozlony?...`-ra visz. Ezért a
tükör ezeket is tartalmazza (ugyanaz a 18 oldal nyelvenként, a 3 közlöny-pillanatképpel
együtt). Frissítés: `npm run snapshot -- /en/ /en/magyar-kozlony ...`, majd `npm run patch`.

- Az `a11y-fixes.js` feliratai (ugró link, menü- és régiónevek, „új ablakban
  nyílik meg”) az oldal nyelvét követik; a főmenüt a design system menüjéből
  olvassa ki, így a fordított oldalak rövidebb menüjét is helyesen adja vissza.
- A mock MI kereső a fordított kereső oldalakon (`/en|de|fr|es|it|zh/jogi-informacio-kereso`,
  `.../szakmai-jogi-informacio-kereso`) is be van kötve: a feliratok az éles oldal
  szövegei az oldal nyelvén, a 4 példakérdés az oldal nyelvén szerepel, a válaszok
  szövege nem magyar nyelven angol. (Az éles kereső komponens offline – CORS miatt –
  nem töltődik be, ezért volt üres a fordított oldal.)
- A választott nyelvet az oldal a böngészőben tárolja (`localStorage`:
  `portal_selected_locale`, `i18nextLng`). Ha ez nem magyar (pl. a „böngésző nyelve”
  ablakban IGEN-t nyomtál), a magyar oldalak – az élővel azonosan – a
  `/<nyelv>/jogi-informacio-kereso` oldalra irányítanak. Visszaállítás: „Back to
  Hungarian page”, vagy a konzolban `localStorage.clear()`. A React nélküli (mock
  kereső) oldalakon ezt a `mock-search.js` pótolja.
- Az `/en/` (és az éles `/`) kezdőlap az **éles oldalon is** React #418
  hidratációs hibát dob; a javítások az újrarenderelés után is megmaradnak.

## Kliensoldali API-válaszok (fixture-ok)

A szűrt közlönyoldal betöltés után további kéréseket küld (Közlönyszám-lista,
karbantartási üzenet, route-felderítés `/__manifest`, a „Keresés” utáni
`/magyar-kozlony.data?...`). Ezek rögzített válaszai a `www/__fixtures/` alatt
vannak, a `serve.py` játssza vissza őket. Új rögzítés:
`python3 scripts/record_api.py "/api/..." "/magyar-kozlony.data?..."`.

Ha egy `.data` kérésre nincs rögzített válasz, az `offline-nav-fix` teljes
oldalbetöltést csinál ugyanarra az URL-re (React „Application Error” helyett).
