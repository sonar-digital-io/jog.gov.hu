/**
 * Billentyuzetes akadalymentessegi teszt a fonavigacio legordulo menuire.
 *
 * Elinditja a lokalis szervert egy szabad porton, majd valodi bongeszoben
 * (Playwright + Chromium) vegigmegy azon, aminek billentyuzettel mukodnie kell.
 * A vart viselkedes: Enter/Space nyit es a panel elso elemere lep, Arrow fel/le
 * lepked, Escape zar es visszaadja a fokuszt, Tab nem csukja be a panelt.
 *
 * Eloszor egyszer:  npm i -D playwright && npx playwright install chromium
 * Futtatas:         npm run test:a11y
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);

const freePort = () => new Promise(res => {
  const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
});

let pass = 0, fail = 0;
const check = (ok, label, detail) => {
  ok ? pass++ : fail++;
  console.log('  [' + (ok ? 'OK ' : 'BUKO') + '] ' + label + (detail ? '   -- ' + detail : ''));
};

const DEEP = `(() => { let el=document.activeElement,p=[];
  while(el){ p.push(el.tagName.toLowerCase()
    + (el.getAttribute&&el.getAttribute('href') ? '['+el.getAttribute('href')+']' : '')
    + (el.textContent&&el.textContent.trim() ? ' "'+el.textContent.trim().slice(0,26)+'"' : ''));
    if(el.shadowRoot&&el.shadowRoot.activeElement) el=el.shadowRoot.activeElement; else break; }
  return p.join(' >> '); })()`;

const port = await freePort();
const srv = spawn('python3', [path.join(HERE, 'serve.py'), String(port), '--no-open', '--no-proxy'],
                  { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));

// CHROME_PATH-szal sajat Chromium is megadhato
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage({ locale: 'hu-HU', viewport: { width: 1440, height: 900 } });

try {
  await page.goto('http://127.0.0.1:' + port + '/', { waitUntil: 'networkidle' });
  await page.waitForFunction("customElements.get('dap-ds-navigation-menu-item')!==undefined", null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  // a nyelvvalaszto parbeszed elfedi a navigaciot, ha a bongeszo nyelve nem magyar
  await page.evaluate(() => document.querySelectorAll('dap-ds-dialog,dialog,[role=dialog]').forEach(d => d.remove()));

  // 0) Tab-sorrend: minden fomenupontnak elerhetonek kell lennie billentyuzettel.
  //    Ezt kulon merni kell - programbol fokuszalva ugyanis az is "mukodik",
  //    amit a Tab valojaban atugrik.
  console.log('\n--- Tab-sorrend ---');
  const expected = await page.evaluate(() => [...document.querySelectorAll('dap-ds-navigation-menu .main-navigation-item')]
    .map(el => (el.querySelector('[slot=trigger]')?.textContent || '').trim().replace(/\s+/g, ' ')).filter(Boolean));
  await page.evaluate(() => document.body.focus());
  const reached = new Set();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(60);
    const t = await page.evaluate(() => {
      const a = document.activeElement;
      const mi = a && a.closest && a.closest('.main-navigation-item');
      return mi ? (mi.querySelector('[slot=trigger]')?.textContent || '').trim().replace(/\s+/g, ' ') : null;
    });
    if (t) reached.add(t);
  }
  for (const e of expected) check(reached.has(e), 'Tabbal elerheto: ' + e);

  const items = await page.evaluate(() => [...document.querySelectorAll('dap-ds-navigation-menu-item')]
    .map((el, i) => ({ i, txt: (el.querySelector('[slot=trigger]')?.textContent || '').trim().slice(0, 30), panel: !!el.hasContent }))
    .filter(x => x.panel));

  if (!items.length) { console.log('Nem talaltam legordulos menupontot.'); process.exitCode = 1; }

  for (const it of items) {
    console.log('\n--- ' + it.txt + ' ---');
    const state = () => page.evaluate(i => {
      const el = [...document.querySelectorAll('dap-ds-navigation-menu-item')][i];
      return el ? { opened: !!el.opened, inert: el.shadowRoot?.querySelector('#popup')?.inert } : { gone: true };
    }, it.i);
    const focusIn = () => page.evaluate(i => {
      const el = [...document.querySelectorAll('dap-ds-navigation-menu-item')][i];
      return !!el && el.contains(document.activeElement) && !document.activeElement.closest('[slot="trigger"]');
    }, it.i);

    await page.evaluate(i => [...document.querySelectorAll('dap-ds-navigation-menu-item')][i].focus(), it.i);
    await page.keyboard.press('Enter'); await page.waitForTimeout(450);
    check((await state()).opened === true, 'Enter kinyitja a legordulot');
    check(await focusIn(), 'a fokusz a panel elso elemere kerul', await page.evaluate(DEEP));

    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200);
    const second = await page.evaluate(DEEP);
    check(await focusIn(), 'ArrowDown a panelen belul lepked', second);

    await page.keyboard.press('ArrowUp'); await page.waitForTimeout(200);
    const first = await page.evaluate(DEEP);
    check(await focusIn() && first !== second, 'ArrowUp visszalep', first);

    // Tab az elso elemrol: a panelen belul kell maradnia (nem szabad becsukodnia)
    await page.keyboard.press('Tab'); await page.waitForTimeout(250);
    check((await state()).opened === true, 'Tab nem csukja be a panelt', await page.evaluate(DEEP));

    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    check((await state()).opened === false, 'Escape bezarja');
    check(await page.evaluate(i => {
      const el = [...document.querySelectorAll('dap-ds-navigation-menu-item')][i];
      return !!el && el.contains(document.activeElement);
    }, it.i), 'Escape utan a fokusz visszater a trigger-re', await page.evaluate(DEEP));

    const ac = await page.evaluate(i => [...document.querySelectorAll('dap-ds-navigation-menu-item')][i]
      .querySelector('[slot=trigger]')?.getAttribute('aria-controls'), it.i);
    check(ac === null, 'nincs nem letezo id-re mutato aria-controls', 'aria-controls=' + ac);
  }
} finally {
  await browser.close();
  srv.kill();
}

console.log('\n=== ' + pass + ' rendben, ' + fail + ' hiba ===');
if (fail) process.exitCode = 1;
