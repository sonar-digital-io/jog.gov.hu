# sr-sim – felolvasó-szimulátor

Megmutatja, milyen sorrendben és tempóval olvasna fel egy képernyőolvasó egy oldalt (H / D / Tab / nyilak), és jelzi a hibákat. Design: `docs/superpowers/specs/2026-10-13-sr-sim-design.md`.

## Használat a jog.gov.hu tükörben
`npm start`, majd bármelyik oldalon **Alt+A**. Üzemmódban: Szóköz lejátszás/szünet, ←/→ lépés, Esc kilépés.

## Beépítés más termékbe
```js
import { install, analyze } from "@sonar/sr-sim";
install();                 // Alt+A figyelése
const { plans, issues } = analyze(); // UI nélkül: lépések stratégiánként + hibák elemenként
```
Egyetlen függőség: `dom-accessibility-api` (bundler oldja fel; a tükörben import map).

## Felépítés
- `src/engine/` – bejárás (`tree.js`), lépéssorok (`strategies.js`), szövegek (`phrases.js` – NVDA-közelítés, kalibrálandó), hibaszabályok (`issues.js`)
- `src/timing.js` – becsült idő / Web Speech API
- `src/ui/` – kiemelés, vezérlősáv, döntési fa panel (saját shadow root)

Teszt: `npm run test:sim` (repo gyökeréből).
