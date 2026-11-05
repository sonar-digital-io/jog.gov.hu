// Meddig marad a szimulator egy lepesen: becsles (csendes mod) vagy a tenyleges beszed vege (hangos mod).

export const DEFAULT_WPM = 180; // kb. kezdo NVDA-felhasznalo; a tapasztaltak 300+ szo/perc
export const STEP_OVERHEAD_MS = 300; // billentyuleutes + a felolvaso reakcioideje
const CHARS_PER_WORD = 6; // karakteralapu becsles: a magyar szavak hosszuak, a szoszam felrevinne

export function estimateMs(text, wpm = DEFAULT_WPM) {
  const charsPerSecond = (wpm * CHARS_PER_WORD) / 60;
  return Math.round((text.length / charsPerSecond) * 1000) + STEP_OVERHEAD_MS;
}

/** Var ms-ig; megszakitaskor (signal) azonnal visszater. */
export function wait(ms, signal) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); resolve(); }, { once: true });
  });
}

export function hungarianVoice() {
  if (!("speechSynthesis" in globalThis)) return null;
  return speechSynthesis.getVoices().find((v) => /^hu/i.test(v.lang)) || null;
}

/** Felolvassa a szoveget; akkor ter vissza, amikor a hang befejezte (vagy megszakitottak). */
export function speak(text, { voice, wpm = DEFAULT_WPM, signal } = {}) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    u.rate = Math.min(3, Math.max(0.5, wpm / DEFAULT_WPM));
    u.onend = u.onerror = () => resolve();
    signal?.addEventListener("abort", () => { speechSynthesis.cancel(); resolve(); }, { once: true });
    speechSynthesis.speak(u);
  });
}
