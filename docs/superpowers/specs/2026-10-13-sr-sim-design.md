# Felolvasó-szimulátor (sr-sim) – design

Dátum: 2026-10-13 · Ág: `sr-sim` · Állapot: jóváhagyva chatben (1–3. rész), a felhasználó kérésére terv-dokumentum nélkül fejlesztve.

## Cél és közönség
Fejlesztői/tesztelői eszköz, ami munka közben megmutatja, **milyen sorrendben és tempóval olvasna fel egy képernyőolvasó** egy oldalt, és **hol rossz** a sorrend vagy a szemantika. Elsőként belső használatra, később ügyfélbemutatóra. Itt érleljük, utána saját termékbe építjük – ezért önálló modul.

## Döntések
| Kérdés | Döntés |
|---|---|
| Hang | Web Speech API (magyar hang) **és** csendes, becsült időzítés; alapból csendes |
| Útvonal | A felhasználó választ stratégiát: H / D / Tab / Nyilak; forgatókönyvek később |
| Hol fut | Csak a helyi tükörben, de önálló modulként (`modules/sr-sim`) |
| Motor | Saját: lapított DOM-bejárás (shadow DOM + slot), szerep/név: `dom-accessibility-api` |
| Kalibráció | Valódi NVDA (Guidepup, `tests/sr`) futás összevetése – később |

## Felépítés
`modules/sr-sim/` – npm workspace, tiszta ES modulok, build nélkül. A `serve.py` a `/__sr-sim/` útvonalon a modul `src/`-jét, a `/__sr-sim/vendor/dom-accessibility-api/` útvonalon a függőség `dist/`-jét szolgálja ki. A `scripts/patch_sr_sim.py` import map-et és egy `<script type="module" src="/__sr-sim/auto.js">` sort ír minden oldalba.

| Fájl | Feladat |
|---|---|
| `engine/tree.js` | Lapított bejárás → elemek (szerep, név, szint, állapot, régió, tabolható elemek) |
| `engine/strategies.js` | Elemek + stratégia → lépések |
| `engine/phrases.js` | NVDA-stílusú magyar szöveg (közelítés, kalibrálandó) |
| `engine/issues.js` | Hibaszabályok |
| `timing.js` | Becsült idő (karakter alapú, szó/percben kijelezve) és beszéd |
| `ui/*.js` | Kiemelés, alsó sáv, döntési fa panel – saját shadow rootban |
| `index.js` | `install()`, `analyze()`, Alt+A, lejátszó |

## Viselkedés
- **Alt+A** be/ki. Bekapcsolva: alsó sáv (stratégia, ◀, ▶/⏸, ▶|, hang, tempó 100–450 szó/perc, alap 180, Kilépés), jobb oldali döntési fa panel, kiemelő keret + címke (billentyű + kimondott szöveg + hibák).
- Üzemmódban: Szóköz lejátszás/szünet, ←/→ lépés, Esc kilépés.
- Lépésidő csendesen: karakterszám / (szó/perc × 6 / 60) + 300 ms. Hanggal: a beszéd vége zárja a lépést; magyar hang hiányában figyelmeztetés + csendes mód.
- A szimulátor saját UI-ja kimarad a bejárásból; a UI maga is billentyűzettel és felolvasóval használható.

## Hibaszabályok
piros = hiba, sárga = ellenőrizendő
- `heading-skip` (piros): címsorszint-ugrás
- `landmark-name` (piros): több navigációs/kiegészítő régió közül névtelen vagy azonos nevű
- `no-name` (piros): interaktív elem név nélkül
- `dup-link` (piros): egymás utáni linkek ugyanarra a címre
- `outside-landmark` (sárga): tartalom régión kívül (oldalon belüli horgony kivétel)
- `idref` (piros): nem feloldható `aria-controls/-labelledby/-describedby/-owns/-activedescendant`
- `combobox-empty` (piros): kibontott kombinált lista választható elemek nélkül
- `skip-link` (piros): az első horgonylink célja hiányzik vagy nem fókuszálható
- `focus-no-name` (piros): fókuszálható elem név és szerep nélkül – üres Tab-megálló (fejlesztés közben talált: nyelvválasztó menüpont)
- `heading-hidden` (sárga): címsor egy „children presentational” elem (pl. gomb) belsejében – H-val nem érhető el (fejlesztés közben talált: közlönykártyák)

Linkben lévő címsort a H megtalál (az ARIA szerint a link tartalma nem prezentációs), nyilas olvasásnál nem ismételjük.

Kimarad: díszítő képek felismerése, hibalista export.

## Tesztelés
`npm run test:sim` – Playwright (Edge, fej nélkül) a helyi tükrön: Alt+A/Esc, H-sorrend (Menü → H1), a fenti hibák megjelennek a valós eseteken, időzítés képlete.
