/**
 * Akadalymentessegi regresszios teszt a jog.gov.hu tukorhoz.
 *
 * Elinditja a lokalis szervert egy szabad porton, es valodi bongeszoben
 * (Playwright + Chromium) ellenorzi a RENDERELT oldalt - a React-hidratacio
 * UTAN, mert a korabbi, HTML-be irt javitasokat a hidratacio eltuntette, mikozben
 * a regi teszt zold maradt.
 *
 *   1. minden fo oldalon: nincs hidratacios hiba, van ugro link es szemantikus
 *      fomenu, a cimsorszintek nem ugranak, axe-core (WCAG 2.2 A/AA) hibamentes
 *   2. fomenu billentyuzettel (Tab, Space/Enter, nyilak, Escape, hover + Escape)
 *   3. nyelvvalaszto billentyuzettel
 *   4. kozlonykartyak: "Reszletek" allapota, egyedi PDF-linknevek
 *   5. suti-sav: a fokusz nem kerul moge
 *   6. mobil hamburgermenu: fokusz be/ki, Escape, inert hatter
 *   7. mock MI kereso: allapotuzenetek, fokusz a valaszra, aria-pressed
 *
 * Eloszor egyszer:  npm i && npx playwright install chromium
 * Futtatas:         npm run test:a11y
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

// Reszfuttatas (pl. lassu gepen vagy CI-ban darabolva):
//   A11Y_PAGES="/,/kapcsolat/"  csak ezeken az oldalakon fut az 1. blokk ("-" = egyiken sem)
//   A11Y_ONLY_PAGES=1           csak az 1. blokk (oldalankenti ellenorzesek) fut
const ALL_PAGES = [
  '/', '/jogi-informacio-kereso/', '/szakmai-jogi-informacio-kereso/',
  '/magyar-kozlony/', '/agazati-kozlony/', '/archiv-agazati-kozlony/',
  '/jogszabalyi-aktualitasok/', '/kapcsolat/', '/felhasznaloi-kezikonyv/',
  '/felhasznalasi-feltetelek/', '/akadalymentesitesi-nyilatkozat/', '/adatkezelesi-tajekoztato/',
  '/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146',
  // forditott oldalak (a nyelvvalaszto es a "browser language" dialog ide visz)
  '/en/', '/en/magyar-kozlony', '/en/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146',
  '/en/jogi-informacio-kereso', '/de/kapcsolat', '/zh/jogszabalyi-aktualitasok',
];
// Ezeken az oldalakon az ELO jog.gov.hu is #418 hidratacios hibat dob (merve:
// https://jog.gov.hu/ es /en/ nyers HTML-lel is). Nem a tukor hibaja; a javitasok
// ujrarendereles utan is megmaradnak, ezt az oldalankenti tobbi ellenorzes nezi.
const KNOWN_418 = new Set(['/en/']);
const PAGES = process.env.A11Y_PAGES === '-' ? [] : process.env.A11Y_PAGES ? process.env.A11Y_PAGES.split(',') : ALL_PAGES;
const ONLY_PAGES = !!process.env.A11Y_ONLY_PAGES;

const freePort = () => new Promise(res => {
  const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
});

let pass = 0, fail = 0;
const check = (ok, label, detail) => {
  ok ? pass++ : fail++;
  console.log('  [' + (ok ? 'OK ' : 'BUKO') + '] ' + label + (detail ? '   -- ' + detail : ''));
};

// a fokuszalt elem (shadow DOM-on at), rovid leirassal
const ACTIVE = `(() => { let e = document.activeElement;
  while (e && e.shadowRoot && e.shadowRoot.activeElement) e = e.shadowRoot.activeElement;
  return e ? (e.getAttribute('aria-label') || e.innerText || e.tagName).trim().replace(/\\s+/g, ' ').slice(0, 60) : null; })()`;
const DEEP = `(sel) => { const out = []; const walk = r => { r.querySelectorAll(sel).forEach(e => out.push(e));
  r.querySelectorAll('*').forEach(e => e.shadowRoot && walk(e.shadowRoot)); }; walk(document); return out; }`;

const port = await freePort();
const BASE = 'http://127.0.0.1:' + port;
const srv = spawn('python3', [path.join(HERE, 'serve.py'), String(port), '--no-open'], { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

async function open(url, opts = {}) {
  const page = await browser.newPage({ locale: 'hu-HU', viewport: opts.viewport || { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'warning' && m.text().startsWith('[a11y]')) errors.push(m.text()); });
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__a11yFixesReady === true, null, { timeout: 20000 });
  await page.waitForTimeout(600);
  if (opts.dismissBanner) {
    const ok = page.getByRole('button', { name: /^rendben$/i });
    if (await ok.count()) { await ok.first().click(); await page.waitForTimeout(200); }
  }
  return { page, errors };
}
const tabUntil = async (page, re, max = 40) => {
  for (let i = 0; i < max; i++) { await page.keyboard.press('Tab'); if (re.test(await page.evaluate(ACTIVE) || '')) return true; }
  return false;
};

try {
  /* ---------------------------------------------------------------- 1 */
  for (const url of PAGES) {
    console.log('\n--- ' + url + ' ---');
    const { page, errors } = await open(url);
    if (KNOWN_418.has(url)) console.log('  [INFO] ismert, az elo oldalon is jelentkezo #418 - nem ellenorizzuk');
    else check(!errors.some(e => /#418|#423|#425|hydrat/i.test(e)), 'nincs React hidratacios hiba', errors.find(e => /#418|hydrat/i.test(e)));
    check(!errors.some(e => e.startsWith('[a11y]')), 'az a11y-fixes.js hiba nelkul fut', errors.find(e => e.startsWith('[a11y]')));
    const st = await page.evaluate(() => ({
      skip: !!document.querySelector('body > a.skip-to-content'),
      nav: !!document.querySelector('nav.ms-mainnav[aria-label]') && document.querySelector('nav.ms-mainnav').getAttribute('aria-label') === ({ hu: 'Főmenü', en: 'Main menu', de: 'Hauptmenü', zh: '主菜单' }[document.documentElement.lang.slice(0, 2)] || document.querySelector('nav.ms-mainnav').getAttribute('aria-label')),
      dsHidden: [...document.querySelectorAll('nav > dap-ds-navigation-menu.main-navigation')].every(d => getComputedStyle(d.parentElement).display === 'none'),
    }));
    check(st.skip, 'ugro link a renderelt DOM-ban');
    check(st.nav && st.dsHidden, 'szemantikus fomenu megvan, a DS-menu rejtett');
    const skipped = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('main h1,main h2,main h3,main h4,main h5,main h6')].filter(h => h.offsetParent);
      let prev = 0; const bad = [];
      hs.forEach(h => { const l = +(h.getAttribute('aria-level') || h.tagName[1]); if (prev && l > prev + 1) bad.push(h.tagName + '/' + l + ' ' + h.textContent.trim().slice(0, 30)); prev = l; });
      return bad;
    });
    check(!skipped.length, 'nincs kihagyott cimsorszint', skipped.join('; '));
    await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async () => {
      const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
      return r.violations.map(x => x.id + ' (' + x.impact + ', ' + x.nodes.length + ')');
    });
    check(!v.length, 'axe-core WCAG 2.2 A/AA: nincs hiba', v.join(', '));
    await page.close();
  }

  /* ---------------------------------------------------------------- 2 */
  for (const url of ONLY_PAGES ? [] : ['/', '/magyar-kozlony/']) {
    console.log('\n--- fomenu billentyuzettel: ' + url + ' ---');
    const { page } = await open(url, { dismissBanner: true });
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    const want = await page.evaluate(() => [...document.querySelectorAll('nav.ms-mainnav .ms-mainnav-list > li > .ms-nav-link')].map(a => a.textContent.trim()));
    const got = new Set();
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const t = await page.evaluate(() => document.activeElement.closest('nav.ms-mainnav') ? document.activeElement.textContent.trim() : null);
      if (t) got.add(t);
    }
    want.forEach(w => check(got.has(w), 'Tabbal elerheto: ' + w));

    const ag = page.locator('nav.ms-mainnav .ms-sub-trigger').first();
    await ag.focus(); await page.keyboard.press(' '); await page.waitForTimeout(200);
    check(await ag.getAttribute('aria-expanded') === 'true', 'Space kinyitja az "Agazati kozlonyok" almenut');
    check(/Ágazati közlönyök/.test(await page.evaluate(ACTIVE)), 'a fokusz az elso alpontra kerul', await page.evaluate(ACTIVE));
    await page.keyboard.press('ArrowDown');
    check(/Archív/.test(await page.evaluate(ACTIVE)), 'ArrowDown a kovetkezo alpontra lep', await page.evaluate(ACTIVE));
    check(await page.evaluate(() => getComputedStyle(document.activeElement).outlineColor) === 'rgb(55, 240, 191)', 'az almenu fokuszkerete is az egyseges menta gyuru');
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    check(await ag.getAttribute('aria-expanded') === 'false' && /Ágazati közlönyök/.test(await page.evaluate(ACTIVE)), 'Escape zar es visszaadja a fokuszt');
    check(await page.evaluate(() => { const id = document.querySelector('.ms-sub-trigger').getAttribute('aria-controls'); return !!document.getElementById(id); }), 'aria-controls letezo panelre mutat');

    const hz = page.locator('nav.ms-mainnav button.ms-sub-trigger');
    await hz.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    check(await hz.getAttribute('aria-expanded') === 'true', 'Enter kinyitja a "Hasznos linkek" almenut');
    check(/új ablakban/.test(await page.evaluate(ACTIVE)), 'a kulso link neve jelzi az uj ablakot', await page.evaluate(ACTIVE));
    await page.keyboard.press('Escape');

    await page.mouse.move(5, 700);
    await page.locator('nav.ms-mainnav li.ms-has-sub').nth(1).hover(); await page.waitForTimeout(250);
    const visible = () => page.evaluate(() => getComputedStyle(document.querySelectorAll('nav.ms-mainnav .ms-submenu')[1]).visibility);
    const before = await visible();
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    check(before === 'visible' && await visible() === 'hidden', 'hoverrel nyitott almenu Escape-re eltunik (1.4.13)');
    await page.close();
  }

  /* ---------------------------------------------------------------- 3 */
  if (!ONLY_PAGES) {
    console.log('\n--- nyelvvalaszto ---');
    const { page } = await open('/magyar-kozlony/', { dismissBanner: true });
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    check(await tabUntil(page, /nyelv választása/), 'Tabbal elerheto, beszedes nevvel', await page.evaluate(ACTIVE));
    await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    const inPanel = () => page.evaluate(() => { const a = document.activeElement; const it = a && a.closest('dap-ds-navigation-menu-item');
      return !!it && !a.closest('[slot="trigger"]') ? (a.closest('a') || a).textContent.trim() : null; });
    check(!!(await inPanel()), 'Enter kinyitja, a fokusz az elso nyelvre kerul', await inPanel());
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150);
    check(/English/.test(await inPanel() || ''), 'ArrowDown a kovetkezo nyelvre lep', await inPanel());
    check(await page.evaluate(() => document.querySelector('a[href^="/en/"]').getAttribute('lang') === 'en'), 'a nyelvek neve lang attributumot kap (3.1.2)');
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    check(/nyelv választása/.test(await page.evaluate(ACTIVE)), 'Escape utan a fokusz a triggeren', await page.evaluate(ACTIVE));
    await page.close();
  }

  /* ---------------------------------------------------------------- 4 */
  if (!ONLY_PAGES) {
    console.log('\n--- kozlonykartyak ---');
    const { page } = await open('/magyar-kozlony/', { dismissBanner: true });
    const btn = page.locator('button[aria-label^="Részletek"]').first();
    check(/^Részletek: .+/.test(await btn.getAttribute('aria-label')), 'a "Reszletek" gomb neve tartalmazza a kozlony cimet', await btn.getAttribute('aria-label'));
    check(await btn.getAttribute('aria-expanded') === 'false' && await btn.getAttribute('type') === 'button', 'zart allapot jelezve, type=button');
    await btn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
    check(await btn.getAttribute('aria-expanded') === 'true', 'Enter utan aria-expanded=true');
    await page.keyboard.press('Enter'); await page.waitForTimeout(600);
    check(await btn.getAttribute('aria-expanded') === 'false', 'ujabb Enter utan aria-expanded=false');
    const names = await page.evaluate(() => [...document.querySelectorAll('main a[target=_blank]')].map(a => a.getAttribute('aria-label') || a.textContent.trim()));
    check(names.length && new Set(names).size === names.length && names.every(n => /új ablakban/.test(n)), 'a PDF-linkek neve egyedi es jelzi az uj ablakot', names[0]);
    await page.close();
  }

  /* --------------------------------------------------------------- 4d */
  if (!ONLY_PAGES) {
    console.log('\n--- szurt kozlonyoldal (144) offline ---');
    const { page } = await open('/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=144', { dismissBanner: true });
    const bad = [];
    page.on('response', r => { if (r.status() >= 400 && !/auth\/user/.test(r.url())) bad.push(r.status() + ' ' + r.url().replace(BASE, '')); });
    const sel = await page.evaluate(() => [...document.querySelectorAll('main dap-ds-select')].map(s => s.getAttribute('value') || ''));
    check(sel.includes('MAGYAR_KOZLONY') && sel.includes('2026') && sel.includes('144'), 'a szurok az URL szerint allnak', sel.join(','));
    const n = await page.evaluate(() => document.querySelectorAll('main dap-ds-select')[3].querySelectorAll('dap-ds-option-item').length);
    check(n > 100, 'a Kozlonyszam legordulo opcioi betoltodnek (rogzitett API-valasz)', n + ' opcio');
    await page.getByRole('button', { name: 'Keresés' }).click(); await page.waitForTimeout(2500);
    const body = await page.evaluate(() => document.body.innerText);
    check(/2026\. évi 144\. szám/.test(body) && !/Application Error/.test(body), '"Kereses" utan is a 144. szam latszik, nincs hibaoldal', page.url().replace(BASE, ''));
    check(!bad.length, 'nincs 4xx/5xx valasz', bad.join(' | '));
    await page.close();
  }

  /* --------------------------------------------------------------- 4c */
  if (!ONLY_PAGES) {
    console.log('\n--- "browser language" dialog -> angol oldal ---');
    const page = await browser.newPage({ locale: 'en-US', viewport: { width: 1440, height: 900 } });
    const bad = [];
    page.on('response', r => { if (r.request().resourceType() === 'document' && r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
    await page.goto(BASE + '/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const yes = page.getByRole('button', { name: /^yes$/i });
    check(await yes.count() > 0, 'angol bongeszonyelvnel megjelenik a nyelvvalto ajanlat');
    if (await yes.count()) {
      await yes.click(); await page.waitForLoadState('networkidle'); await page.waitForTimeout(2000);
      await page.waitForFunction(() => window.__a11yFixesReady === true, null, { timeout: 20000 }).catch(() => {});
      check(/^\/en\//.test(new URL(page.url()).pathname) && !bad.length, 'YES utan az angol oldal betolt (nincs 404)', page.url().replace(BASE, '') + ' ' + bad.join(', '));
      check(await page.evaluate(() => document.documentElement.lang === 'en' && /146/.test(document.querySelector('main').innerText)), 'az angol oldalon is a 146. szam latszik');
      check(await page.evaluate(() => document.querySelector('.skip-to-content').textContent === 'Skip to main content' && document.querySelector('nav.ms-mainnav').getAttribute('aria-label') === 'Main menu'), 'az ugro link es a fomenu neve angolul');
    }
    await page.close();
  }

  /* --------------------------------------------------------------- 4b */
  if (!ONLY_PAGES) {
    console.log('\n--- kezdolapi kozlonykartyak ---');
    const { page } = await open('/');
    const cards = await page.evaluate(() => [...document.querySelectorAll('dap-ds-list-item')].map(li => {
      const a = li.shadowRoot && li.shadowRoot.querySelector('dap-ds-card') && li.shadowRoot.querySelector('dap-ds-card').shadowRoot.querySelector('a[href]');
      return { href: a && a.getAttribute('href'), title: (li.querySelector('[slot=title]') || {}).textContent };
    }));
    check(cards.length >= 3 && cards.every(c => c.href), 'a kartyak valodi linkek (<a href>)', cards.map(c => c.href).join(' | '));
    check(cards.every(c => { const m = (c.title || '').match(/(\d{4})\. évi (\d+)\. szám/); return m && c.href.includes('ev=' + m[1]) && c.href.endsWith('kozlonyszam=' + m[2]); }), 'a link a kartyan szereplo szamra mutat');
    await page.evaluate(() => document.querySelector('dap-ds-list-item').shadowRoot.querySelector('dap-ds-card').shadowRoot.querySelector('a').focus());
    await Promise.all([page.waitForNavigation(), page.keyboard.press('Enter')]);
    await page.waitForLoadState('networkidle');
    const m = (cards[0].title || '').match(/(\d+)\. szám/);
    const body = await page.evaluate(() => document.querySelector('main').innerText);
    check(page.url().endsWith(cards[0].href) && m && body.includes(m[1] + '. szám'), 'Enterre a celoldal toltodik be, a kozlonnyel', page.url().replace(BASE, ''));
    await page.close();
  }

  /* ---------------------------------------------------------------- 5 */
  if (!ONLY_PAGES) {
    console.log('\n--- suti-sav (2.4.11) ---');
    const { page } = await open('/magyar-kozlony/');
    const has = await page.evaluate(() => { const b = document.querySelector('.a11y-consent-banner[role=dialog]'); const d = b && document.getElementById(b.getAttribute('aria-describedby')); return !!b && !!b.getAttribute('aria-label') && !!d && /sütik/.test(d.textContent); });
    check(has, 'a suti-sav nevvel es leirassal ellatott (nem-modalis) dialog');
    check(await page.evaluate(() => document.activeElement === document.querySelector('.a11y-consent-banner')), 'betolteskor a fokusz a suti-tajekoztaton van (a felolvaso elsokent ezt mondja be)');
    let hidden = 0;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab'); await page.waitForTimeout(250);
      hidden += await page.evaluate(() => {
        let e = document.activeElement; while (e.shadowRoot && e.shadowRoot.activeElement) e = e.shadowRoot.activeElement;
        const b = document.querySelector('.a11y-consent-banner'); if (!b || b.contains(e) || e === document.body) return 0;
        const a = e.getBoundingClientRect(), c = b.getBoundingClientRect();
        return a.bottom > c.top && a.top < c.bottom && a.right > c.left && a.left < c.right ? 1 : 0;
      });
    }
    check(hidden === 0, 'a fokuszalt elem soha nincs a sav mogott', hidden + ' atfedes');
    await page.close();
  }

  /* ---------------------------------------------------------------- 6 */
  if (!ONLY_PAGES) {
    console.log('\n--- mobil menu (375px) ---');
    const { page } = await open('/magyar-kozlony/', { viewport: { width: 375, height: 800 }, dismissBanner: true });
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    check(await tabUntil(page, /^Menü$/), 'a "Menu" gomb Tabbal elerheto');
    await page.keyboard.press('Enter'); await page.waitForTimeout(900);
    check(/Menü bezárása/.test(await page.evaluate(ACTIVE)), 'nyitas utan a fokusz a menuben', await page.evaluate(ACTIVE));
    check(await page.evaluate(() => !!document.querySelector('[role=dialog][aria-modal=true]') && !!document.querySelector('main[inert]')), 'dialogkent jelolve, a hatter inert');
    const exp = await page.evaluate(`(${DEEP})('dap-ds-button[aria-label="Menü"]').map(h => h.shadowRoot.querySelector('button').getAttribute('aria-expanded'))`);
    check(exp[0] === 'true', 'a "Menu" gomb aria-expanded=true');
    const toggles = () => page.evaluate(`(${DEEP})('button[part=toggle]').map(t => t.getAttribute('aria-expanded'))`);
    const tg = await page.evaluateHandle(`(${DEEP})('button[part=toggle]')[0]`);
    const t0 = (await toggles())[0]; await tg.asElement().focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
    check(t0 === 'false' && (await toggles())[0] === 'true', 'a menucsoport-lenyito aria-expanded allapotot jelez');
    await page.keyboard.press('Escape'); await page.waitForTimeout(900);
    check(/^Menü$/.test(await page.evaluate(ACTIVE)) && !(await page.evaluate(() => document.querySelectorAll('[inert]').length)), 'Escape zar, a fokusz visszater, a hatter ujra elerheto', await page.evaluate(ACTIVE));
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'nincs vizszintes gorgetes 375px-en');
    await page.close();
  }

  /* ---------------------------------------------------------------- 7 */
  if (!ONLY_PAGES) {
    console.log('\n--- mock MI kereso ---');
    const { page } = await open('/jogi-informacio-kereso/');
    check(await page.evaluate(() => { const l = document.getElementById('ms-label'); return !!l && l.offsetHeight > 0; }), 'lathato mezocimke');
    const ta = await page.evaluateHandle(`(${DEEP})('textarea')[0]`);
    check(await ta.evaluate(t => t.getAttribute('aria-label') === 'Jogi kérdés' && !t.getAttribute('role')), 'a mezo neve a lathato cimke, nincs felig megvalositott kombobox');
    await ta.asElement().focus();
    await page.keyboard.type('Vettem egy mosógépet, két hónap után elromlott');
    await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    check(/keresése/.test(await page.evaluate(() => document.getElementById('ms-status').textContent)), 'betoltes bejelentve (role=status)');
    await page.waitForTimeout(1500);
    check(/betöltődött/.test(await page.evaluate(() => document.getElementById('ms-status').textContent)), 'eredmeny bejelentve');
    check(/Országos jogszabályokon/.test(await page.evaluate(ACTIVE)), 'a fokusz a valasz cimere kerul', await page.evaluate(ACTIVE));
    await page.locator('.ms-thumb').first().click();
    check(await page.locator('.ms-thumb').first().getAttribute('aria-pressed') === 'true', 'az ertekelo gomb allapota aria-pressed');
    await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async () => (await axe.run('#mock-search-results', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map(x => x.id));
    check(!v.length, 'a talalati blokk axe-hibamentes', v.join(', '));
    await page.close();

    // forditott kereso-oldalak: a mock kereso ott is megjelenik, az oldal nyelven
    for (const [lp, label, q, title] of [
      ['/en/jogi-informacio-kereso', 'Legal question', 'I bought a washing machine and it broke', /Answer based on national legislation/],
      ['/de/jogi-informacio-kereso', 'Rechtliche Frage', 'Waschmaschine kaputt', /Antwort auf Grundlage/],
      ['/zh/szakmai-jogi-informacio-kereso', '法律问题', '洗衣机坏了', /基于国家法律法规/],
    ]) {
      const { page: pg } = await open(lp);
      const t2 = await pg.evaluateHandle(`(${DEEP})('textarea')[0]`);
      check(!!(await t2.asElement()) && await t2.evaluate((t, l) => t.getAttribute('aria-label') === l, label), lp + ': a mock kereso megjelenik, a mezo neve az oldal nyelven');
      await t2.asElement().focus(); await pg.keyboard.type(q); await pg.keyboard.press('Enter'); await pg.waitForTimeout(1700);
      check(title.test(await pg.evaluate(ACTIVE)), lp + ': valasz betoltve, fokusz a valasz cimen', await pg.evaluate(ACTIVE));
      await pg.close();
    }

    // kepernyoolvasos bejaras: legordulo, kozlony-reszletek, kepek
    console.log('\n--- kepernyoolvaso: legordulo es kozlony-reszletek ---');
    {
      const { page: sp } = await open('/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=144');
      const deepAct = () => sp.evaluate(() => { let e = document.activeElement; while (e && e.shadowRoot && e.shadowRoot.activeElement) e = e.shadowRoot.activeElement; return e.tagName + '#' + (e.id || ''); });
      await sp.evaluate(() => document.querySelector('dap-ds-select[label="Közlönyszám"]').shadowRoot.querySelector('[role=combobox]').focus());
      await sp.keyboard.press('Enter'); await sp.waitForTimeout(500);
      check(/DAP-DS-OPTION-ITEM#dap-ds-option-144/.test(await deepAct()) && (await sp.evaluate(() => scrollY)) === 0, 'Kozlonyszam: Enter megnyitja a listat, a fokusz a kijelolt elemen marad (nem ugrik el az oldal)', await deepAct());
      await sp.keyboard.press('ArrowDown'); await sp.keyboard.press('Enter'); await sp.waitForTimeout(500);
      check(await sp.evaluate(() => document.querySelector('dap-ds-select[label="Közlönyszám"]').shadowRoot.querySelector('[role=combobox]').textContent.trim()) === '145' && /BUTTON/.test(await deepAct()), 'Le + Enter kivalasztja a 145-ot, a fokusz visszater a mezore');
      await sp.reload({ waitUntil: 'networkidle' }); await sp.waitForTimeout(1500);
      await sp.locator('button[data-a11y-details]').first().click(); await sp.waitForTimeout(900);
      const units = await sp.evaluate(() => [...document.querySelectorAll('dap-ds-icon-button[aria-label="Elemi egység"]')].map(h => { const b = h.shadowRoot.querySelector('button'); return b.getAttribute('aria-label') + '|' + b.getAttribute('aria-expanded'); }));
      check(units.length === 5 && units.every(u => /^Részletek: .+\|false$/.test(u)), 'a jogszabaly-sorok lenyitoinak neve "Reszletek: <jogszabaly>", allapotuk jelezve', units[0]);
      await sp.locator('dap-ds-icon-button[aria-label="Elemi egység"]').first().click(); await sp.waitForTimeout(1800);
      const u0 = await sp.evaluate(() => document.querySelector('dap-ds-icon-button[aria-label="Elemi egység"]').shadowRoot.querySelector('button').getAttribute('aria-expanded'));
      const ck = await sp.evaluate(() => { const c = document.querySelector('main .ck-content'); return c ? c.getAttribute('role') + ':' + c.getAttribute('aria-label') : null; });
      check(u0 === 'true' && /^region:223\/2026\. .* – a jogszabály szövege$/.test(ck || ''), 'kibontas utan: aria-expanded=true, a jogszabaly szovege cimkezett regio (rogzitett API-valaszbol)', ck);
      check(await sp.evaluate(() => [...document.querySelectorAll('main .ck-content table')].every(t => t.getAttribute('aria-label') || t.querySelector('caption'))), 'a jogszabaly-szoveg tablazatainak van neve');
      check(await sp.evaluate(() => { const f = document.querySelector('footer img[src*="footer-icon"]'); const sz = document.querySelector('[class*="szechenyi-terv-plus-logo"] img'); return f && f.alt === '' && sz && /Széchenyi Terv Plusz – Magyarország Kormánya/.test(sz.alt); }), 'lablec-logo dekorativ, a Szechenyi-logo alt szovege a tamogatasi kozlemeny');
      await sp.setViewportSize({ width: 320, height: 640 }); await sp.reload({ waitUntil: 'networkidle' }); await sp.waitForTimeout(1200);
      await sp.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}' }); await sp.waitForTimeout(800);
      const hb = await sp.evaluate(() => [Math.round(document.querySelector('h1').getBoundingClientRect().top), Math.round(document.querySelector('nav.header-upper').getBoundingClientRect().bottom)]);
      check(hb[0] >= hb[1], '320px + 1.4.12 szovegkoz: a H1 nem csuszik a fejlec ala', 'h1 top=' + hb[0] + ' fejlec alja=' + hb[1]);
      await sp.close();
    }

    // legordulo: a Tab nem ragad a nyitott listaban (szuro nelkuli /magyar-kozlony oldal)
    console.log('\n--- legordulo: Tab a nyitott listabol ---');
    {
      const { page: tp } = await open('/magyar-kozlony');
      const where = () => tp.evaluate(() => { const h = document.activeElement; let e = h; while (e && e.shadowRoot && e.shadowRoot.activeElement) e = e.shadowRoot.activeElement; return (h.getAttribute('label') || h.getAttribute('aria-label') || '') + '|' + e.tagName; });
      const val = l => tp.evaluate(x => { const s = document.querySelector('dap-ds-select[label="' + x + '"]'); return (s.opened ? 'NYITVA:' : '') + s.shadowRoot.querySelector('[role=combobox]').textContent.trim(); }, l);
      check(await tp.evaluate(() => [...document.querySelectorAll('main dap-ds-select')].every(s => s.shadowRoot.querySelector('[role=combobox]').getAttribute('tabindex') === '0')), 'a szurok legordului Tabbal elerhetok (a kozlonyszam-lista API-valasza rogzitve)');
      await tp.evaluate(() => document.querySelector('dap-ds-select[label="Kiadvány típusa"]').shadowRoot.querySelector('[role=combobox]').focus());
      await tp.keyboard.press('Space'); await tp.waitForTimeout(400);
      check(/DAP-DS-OPTION-ITEM/.test(await where()), 'Szokoz megnyitja a listat');
      await tp.keyboard.press('ArrowDown'); await tp.waitForTimeout(200);
      await tp.keyboard.press('Tab'); await tp.waitForTimeout(600);
      check(/^Év\|BUTTON$/.test(await where()) && await val('Kiadvány típusa') === 'Magyar Közlöny', 'nyitott listaban a Tab kivalaszt, bezar es a kovetkezo mezore lep', await where() + ' / ' + await val('Kiadvány típusa'));
      await tp.keyboard.press('Space'); await tp.waitForTimeout(400); await tp.keyboard.press('Shift+Tab'); await tp.waitForTimeout(600);
      check(/^Kiadvány típusa\|BUTTON$/.test(await where()) && !/NYITVA/.test(await val('Év')), 'Shift+Tab a nyitott listabol az elozo mezore lep');
      await tp.keyboard.press('Space'); await tp.waitForTimeout(400); await tp.keyboard.press('ArrowDown'); await tp.keyboard.press('Escape'); await tp.waitForTimeout(400);
      check(/^Kiadvány típusa\|BUTTON$/.test(await where()) && await val('Kiadvány típusa') === 'Magyar Közlöny', 'Escape valtoztatas nelkul zar, a fokusz a mezon marad');
      await tp.close();
    }

    // suti-sav vs. Szechenyi (EU-tamogatasi) logo: a sav nem takarhatja el
    console.log('\n--- suti-sav es Szechenyi-logo ---');
    for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
      const { page: cp } = await open('/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=144');
      await cp.setViewportSize(vp); await cp.waitForTimeout(900);
      const g = await cp.evaluate(() => { const b = document.querySelector('.a11y-consent-banner').getBoundingClientRect(); const l = document.querySelector('[class*="szechenyi-terv-plus-logo"]').getBoundingClientRect(); const btn = document.querySelector('.a11y-consent-banner button').getBoundingClientRect(); return { overlap: l.bottom > b.top && l.top < b.bottom && l.right > b.left && l.left < b.right, logoBottom: l.bottom, btnVisible: btn.bottom <= b.bottom + 1 && btn.top >= b.top - 1 }; });
      check(!g.overlap && Math.round(g.logoBottom) === vp.height && g.btnVisible, vp.width + 'px: a suti-sav a logo folott van (a logo a fix helyen), a RENDBEN gomb latszik', JSON.stringify(g));
      await cp.locator('.a11y-consent-banner button').click(); await cp.waitForTimeout(700);
      check(await cp.evaluate(() => { const l = document.querySelector('[class*="szechenyi-terv-plus-logo"]'); return !l.style.bottom && Math.round(l.getBoundingClientRect().bottom) === innerHeight; }), vp.width + 'px: a logo vegig a fix helyen (jobb also sarok) marad');
      await cp.close();
    }

    // fokuszgyuru: a sima gombok/linkek ugyanolyan gyurut kapnak, mint a DS-komponensek
    console.log('\n--- fokuszgyuru egysegessege ---');
    {
      const { page: rp } = await open('/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=144');
      await rp.keyboard.press('Tab');
      const ring = async sel => { const h = await rp.evaluateHandle(sel); await h.asElement().focus(); await rp.waitForTimeout(450); return h.evaluate(e => { const c = getComputedStyle(e); return c.outlineWidth + ' ' + c.outlineColor + ' ' + c.outlineOffset + ' ' + c.boxShadow; }); };
      const sel = await ring(`document.querySelector('dap-ds-select[label="Közlönyszám"]').shadowRoot.querySelector('[role=combobox]')`);
      const ker = await ring(`[...document.querySelectorAll('main button')].find(b=>/Keresés/.test(b.textContent))`);
      const pdf = await ring(`document.querySelector('main a.dds-button')`);
      const ok = await ring(`document.querySelector('.a11y-consent-banner button')`);
      const ft = await ring(`[...document.querySelectorAll('footer a')].find(a=>/Kapcsolat/.test(a.textContent))`);
      const all = [sel, ker, pdf, ok, ft];
      check(all.every(r => /^2px rgb\(55, 240, 191\) 2px none$/.test(r)), 'minden gomb/link/legordulo ugyanazt a 2px menta gyurut kapja (hero, kartya, suti-sav, lablec)', all.join(' / '));
      await rp.close();
    }

    // ertesito-ablakok sorrendje billentyuzettel: nyelvi ajanlat -> suti-sav -> lap eleje
    console.log('\n--- ertesito-ablakok: fokusz-sorrend ---');
    {
      const ctx = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 900 } });
      const np = await ctx.newPage();
      await np.goto(BASE + '/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=144', { waitUntil: 'networkidle' }); await np.waitForTimeout(1500);
      const act = () => np.evaluate(() => { const a = document.activeElement; return a === document.body ? 'body' : (a.getAttribute('role') === 'dialog' ? 'dialog:' + (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 30)) : a.tagName + ':' + a.textContent.trim().slice(0, 30)); });
      check(/^dialog:It looks like your browser/.test(await act()), 'betolteskor eloszor a nyelvi ajanlat kapja a fokuszt', await act());
      await np.keyboard.press('Tab'); await np.keyboard.press('Tab'); await np.keyboard.press('Enter'); await np.waitForTimeout(800);
      check(/^dialog:Süti/.test(await act()), '"No thanks" utan a fokusz a suti-tajekoztatora kerul', await act());
      await np.keyboard.press('Tab'); await np.keyboard.press('Enter'); await np.waitForTimeout(800);
      check(/^A:Ugrás a fő tartalomra/.test(await act()), 'RENDBEN utan a fokusz a lap elejere (ugro link) kerul', await act());
      await ctx.close();
      const { page: mp } = await open('/magyar-kozlony/');
      await mp.locator('.a11y-consent-banner button').click(); await mp.waitForTimeout(700);
      check(await mp.evaluate(() => document.activeElement === document.body), 'egeres bezaraskor a fokusz nem ugrik el (nem villan fel az ugro link)');
      await mp.close();
    }

    // nyelvvalasztas a React nelkuli (mock) oldalakon is ugy mukodik, mint elesen
    console.log('\n--- valasztott nyelv (portal_selected_locale) ---');
    const { page: lp } = await open('/kapcsolat/');
    await lp.evaluate(() => { localStorage.setItem('portal_selected_locale', 'en'); localStorage.setItem('i18nextLng', 'en'); });
    const Q144 = '/magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=144';
    await lp.goto(BASE + '/', { waitUntil: 'networkidle' }); await lp.waitForTimeout(800);
    check(/\/en\/jogi-informacio-kereso$/.test(new URL(lp.url()).pathname), 'angol valasztott nyelvnel a magyar kezdolap az angol keresore iranyit (mint elesen)', lp.url().replace(BASE, ''));
    await lp.goto(BASE + Q144, { waitUntil: 'networkidle' }); await lp.waitForTimeout(800);
    check(/^\/en\/jogi-informacio-kereso/.test(new URL(lp.url()).pathname), 'a 144-es oldal is az angol keresore iranyit (mint elesen)', lp.url().replace(BASE, ''));
    await lp.getByRole('link', { name: /Back to Hungarian page/ }).first().click(); await lp.waitForTimeout(1500);
    check(await lp.evaluate(() => localStorage.getItem('portal_selected_locale')) === 'hu', '"Back to Hungarian page" visszaallitja a magyar nyelvet');
    await lp.goto(BASE + Q144, { waitUntil: 'networkidle' }); await lp.waitForTimeout(800);
    check(new URL(lp.url()).pathname === '/magyar-kozlony' && /Magyar Közlöny/.test(await lp.evaluate(() => document.querySelector('h1').textContent)), 'utana a 144-es oldal magyarul nyilik meg', lp.url().replace(BASE, ''));
    await lp.close();
  }
} finally {
  await browser.close();
  srv.kill();
}

console.log('\n=== ' + pass + ' rendben, ' + fail + ' hiba ===');
if (fail) process.exitCode = 1;
