// A felolvaso-szimulator a jog.gov.hu tukor foldalan: a motor a valos, ismert hibakat talalja meg,
// es a felulet Alt+A / lejatszas / Esc szerint mukodik.
import { expect, test } from "@playwright/test";
import { estimateMs } from "../../modules/sr-sim/src/timing.js";

async function open(page) {
  await page.addInitScript(() => localStorage.setItem("portal_selected_locale", "hu"));
  await page.goto("/", { waitUntil: "load" });
  await page.locator("main").waitFor();
  await page.waitForTimeout(2000); // hidratalas + dinamikus tartalom
}

const analyze = (page) => page.evaluate(async () => {
  const { analyze } = await import("/__sr-sim/index.js");
  const a = analyze();
  const ids = [];
  a.issues.forEach((list) => list.forEach((i) => ids.push(i.id)));
  const texts = Object.fromEntries(Object.entries(a.plans).map(([k, steps]) => [k, steps.map((s) => s.text)]));
  return { texts, ids };
});

test("időzítés: karakteralapú becslés + lépésenkénti ráhagyás", () => {
  expect(estimateMs("x".repeat(180), 180)).toBe(10300); // 180 szo/perc = 18 karakter/mp
  expect(estimateMs("", 300)).toBe(300);
});

test("motor: H-sorrend és a főoldal ismert hibái", async ({ page }) => {
  await open(page);
  const { texts, ids } = await analyze(page);
  expect(texts.H[0]).toBe("Jogi MI kereső, címsor, 1. szint");
  expect(texts.D).toContain("Főmenü, navigációs régió");
  expect(texts.Tab[0]).toBe("Ugrás a fő tartalomra, hivatkozás");
  expect(texts.Tab).toContain("Keresés, szerkesztőmező");
  // az akadalymentesitesi javitasok utan is megmarado, ismert hibak (ha kijavitjak, innen torolni)
  for (const id of ["focus-no-name", "skip-link"]) expect(ids, id).toContain(id);
  // a javitasokkal megszunt hibak ne jojjenek vissza
  for (const id of ["heading-skip", "heading-hidden", "landmark-name", "dup-link", "idref"]) {
    expect(ids, id).not.toContain(id);
  }
});

test("motor: aria-hidden alatti fókuszálható elem = néma Tab-megálló", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const d = document.createElement("div");
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = '<a href="#rejtett" id="rejtett-link">Rejtett link</a>';
    document.querySelector("main").append(d);
  });
  const { ids } = await analyze(page);
  expect(ids).toContain("hidden-focusable");
});

test("felület: az oldal gombján a Szóköz az oldalé marad", async ({ page }) => {
  await open(page);
  await page.keyboard.press("Alt+a");
  const explain = page.locator("#sr-sim-root").locator(".explain");
  const before = await explain.textContent();
  const id = await page.locator('nav button[aria-expanded="false"][aria-controls]').first().getAttribute("aria-controls");
  const btn = page.locator(`nav button[aria-controls="${id}"]`);
  await btn.focus();
  await page.keyboard.press(" ");
  await expect(btn).toHaveAttribute("aria-expanded", "true"); // a menu nyilt ki, nem a lejatszas indult
  await expect(explain).toHaveText(before);
});

test("felület: Alt+A, lejátszás, stratégiaváltás, Esc", async ({ page }) => {
  await open(page);
  const root = page.locator("#sr-sim-root");
  await page.keyboard.press("Alt+a");
  await expect(root).toHaveCount(1);
  const explain = root.locator(".explain");

  await root.locator(".wpm").fill("450");
  await page.keyboard.press(" ");
  await expect(explain).toContainText(/ 1\/\d+/);
  await expect(explain).toContainText(/ 2\/\d+/, { timeout: 5000 }); // magatol lepett tovabb
  await page.screenshot({ path: "test-results/sr-sim-play.png" });
  await page.keyboard.press(" ");
  await expect(root.locator(".play")).toHaveText("▶ Lejátszás");

  await root.locator('.seg button[data-s="D"]').click();
  await page.keyboard.press("ArrowRight");
  await expect(root.locator(".txt")).toHaveText("fejléc régió");
  await page.keyboard.press("ArrowRight");
  await expect(root.locator(".txt")).toHaveText("Főmenü, navigációs régió");
  // hibajelzes: a Tab-sorrend elso eleme a skip link, aminek a celja nem fokuszalhato
  await root.locator('.seg button[data-s="Tab"]').click();
  await page.keyboard.press("ArrowRight");
  await expect(root.locator(".txt")).toHaveText("Ugrás a fő tartalomra, hivatkozás");
  await expect(root.locator(".label .iss")).toContainText("skip link");
  await page.screenshot({ path: "test-results/sr-sim-issue.png" });

  await page.keyboard.press("Escape");
  await expect(root).toHaveCount(0);
});
