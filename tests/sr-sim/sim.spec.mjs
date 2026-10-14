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
  expect(texts.H[0]).toBe("Menü, címsor, 2. szint");
  expect(texts.H[1]).toContain("Mesterséges intelligencia alapú jogi információ kereső, címsor, 1. szint");
  expect(texts.D).toContain("Főmenü, navigációs régió");
  expect(texts.Tab.some((t) => t.startsWith("Jogi kérdés, kombinált lista"))).toBe(true);
  for (const id of ["heading-skip", "heading-hidden", "landmark-name", "focus-no-name", "dup-link", "idref"]) {
    expect(ids, id).toContain(id);
  }
});

test("felület: Alt+A, lejátszás, stratégiaváltás, Esc", async ({ page }) => {
  await open(page);
  const root = page.locator("#sr-sim-root");
  await page.keyboard.press("Alt+a");
  await expect(root).toHaveCount(1);
  const explain = root.locator(".explain");

  await root.locator(".wpm").fill("450");
  await page.keyboard.press(" ");
  await expect(explain).toContainText("1/8");
  await expect(explain).toContainText("2/8", { timeout: 5000 }); // magatol lepett tovabb
  await page.screenshot({ path: "test-results/sr-sim-play.png" });
  await page.keyboard.press(" ");
  await expect(root.locator(".play")).toHaveText("▶ Lejátszás");

  await root.locator('.seg button[data-s="D"]').click();
  await page.keyboard.press("ArrowRight");
  await expect(root.locator(".txt")).toHaveText("fejléc régió");
  await page.keyboard.press("ArrowRight");
  await expect(root.locator(".label .iss")).toContainText("névtelen");
  await page.screenshot({ path: "test-results/sr-sim-issue.png" });

  await page.keyboard.press("Escape");
  await expect(root).toHaveCount(0);
});
