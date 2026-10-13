// Kepernyoolvaso (NVDA) tesztek Guidepuppal. Csak Windowson, fejjel futo bongeszovel mukodik,
// es futas kozben valodi billentyuket nyom -> ne nyulj a gephez. Elotte egyszer: npx @guidepup/setup install nvda
import { screenReaderConfig } from "@guidepup/playwright";

export default {
  ...screenReaderConfig,
  testDir: "tests/sr",
  timeout: 5 * 60 * 1000,
  reportSlowTests: null,
  webServer: {
    command: "python scripts/serve.py 8799 --no-open",
    url: "http://127.0.0.1:8799/",
    reuseExistingServer: true,
  },
  use: {
    ...screenReaderConfig.use,
    baseURL: "http://127.0.0.1:8799",
    channel: "msedge",
    headless: false,
    locale: "hu-HU", // magyar bongeszo: a nyelvvalaszto popup nem jon fel
    viewport: { width: 1366, height: 800 }, // asztali nezet: a fomenu lathato
  },
};
