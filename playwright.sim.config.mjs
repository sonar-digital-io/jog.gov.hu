// Felolvaso-szimulator (modules/sr-sim) tesztjei: fej nelkuli Chromium, nincs valodi felolvaso, nem nyom OS-billentyut.
// Sajat port: ne a futo fejlesztoi szervert (8799, akar mas branchrol) tesztelje.
const PORT = 8797;
export default {
  testDir: "tests/sr-sim",
  timeout: 60 * 1000,
  webServer: {
    command: `python3 scripts/serve.py ${PORT} --no-open`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
    locale: "hu-HU",
    viewport: { width: 1366, height: 800 }, // asztali nezet: a fomenu lathato
  },
};
