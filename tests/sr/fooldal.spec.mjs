// A foldal bejarasa NVDA-val a negy jellemzo strategia szerint. Minden teszt a kimondott
// mondatokat menti a test-results/sr-logs/<nev>.json-ba, hogy ember (vagy Claude) atnezhesse.
import { nvdaTest as test } from "@guidepup/playwright";
import { expect } from "@playwright/test";
import fs from "node:fs";

const OUT = "test-results/sr-logs";

async function start(page, nvda) {
  await page.goto("/", { waitUntil: "load" });
  await page.locator("main").waitFor();
  await page.waitForTimeout(2000); // hidratalas + dinamikus tartalom
  await nvda.navigateToWebContent();
  // Biztonsagi zar: ha a teszt-bongeszo nem kerult elotérbe, az NVDA egy masik ablakot olvas,
  // es a tovabbi billentyuk oda mennenek. Ilyenkor azonnal leallunk.
  const heard = (await nvda.spokenPhraseLog()).join(" | ");
  if (!heard.includes("Magyar Jogi")) {
    throw new Error("Az NVDA nem a teszt-oldalt olvassa (elotérben mas ablak van). Hallott: " + heard.slice(0, 200));
  }
  await nvda.clearSpokenPhraseLog();
}

async function save(name, nvda) {
  const log = await nvda.spokenPhraseLog();
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify(log, null, 2), "utf8");
  return log;
}

test("H: cimsorok", async ({ page, nvda }) => {
  await start(page, nvda);
  for (let i = 0; i < 10; i++) await nvda.perform(nvda.keyboardCommands.moveToNextHeading);
  const log = await save("h-cimsorok", nvda);
  // a cel: az elso ket H-megallo a Menu, majd a kereso cime
  expect(log[0]).toContain("Menü");
  expect(log[1]).toContain("Mesterséges intelligencia");
});

test("D: regiok", async ({ page, nvda }) => {
  await start(page, nvda);
  for (let i = 0; i < 8; i++) await nvda.perform(nvda.keyboardCommands.moveToNextLandmark);
  await save("d-regiok", nvda);
});

test("Tab: vezerlok", async ({ page, nvda }) => {
  await start(page, nvda);
  for (let i = 0; i < 20; i++) await nvda.press("Tab");
  await save("tab-vezerlok", nvda);
});

test("Kereso: E, majd lefele nyil", async ({ page, nvda }) => {
  await start(page, nvda);
  await nvda.perform(nvda.keyboardCommands.moveToNextEditField);
  for (let i = 0; i < 3; i++) await nvda.press("ArrowDown");
  await save("kereso", nvda);
});
