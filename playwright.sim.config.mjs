// Felolvaso-szimulator (modules/sr-sim) tesztjei: fej nelkuli Edge, nincs valodi felolvaso, nem nyom OS-billentyut.
export default {
  testDir: "tests/sr-sim",
  timeout: 60 * 1000,
  webServer: {
    command: "python scripts/serve.py 8799 --no-open",
    url: "http://127.0.0.1:8799/",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:8799",
    channel: "msedge",
    headless: true,
    locale: "hu-HU",
    viewport: { width: 1366, height: 800 }, // asztali nezet: a fomenu lathato
  },
};
