// Felolvaso-szimulator: Alt+A-val be/ki. A motor (engine/) DOM-bejaras + tiszta fuggvenyek,
// a felulet (ui/) cserelheto - termekbe epiteskor az install()/analyze() a belepesi pont.
import { findIssues } from "./engine/issues.js";
import { buildSteps, STRATEGIES } from "./engine/strategies.js";
import { collect } from "./engine/tree.js";
import { DEFAULT_WPM, estimateMs, hungarianVoice, speak, wait } from "./timing.js";
import { scrollToItem } from "./ui/highlight.js";
import { mount } from "./ui/view.js";

let view = null;
let abort = null;
let run = 0; // minden play()/pause() uj azonositot kap -> egy megszakitott, meg varakozo ciklus nem fut tovabb
const state = {
  strategy: "H", steps: [], index: -1, playing: false, sound: false, wpm: DEFAULT_WPM,
  warning: "", counts: {}, totalIssues: 0,
};

/** Bejaras + hibak + a negy strategia lepesei. A szimulator sajat UI-ja kimarad. */
export function analyze(root = document.body) {
  const model = collect(root, { exclude: (el) => el.id === "sr-sim-root" });
  const issues = findIssues(model);
  const plans = {};
  for (const k of Object.keys(STRATEGIES)) {
    plans[k] = buildSteps(model, k).map((st) => ({ ...st, issues: (st.item && issues.get(st.item.el)) || [] }));
  }
  let totalIssues = 0;
  issues.forEach((list) => { totalIssues += list.length; });
  return { model, issues, plans, totalIssues };
}

function refresh() {
  const { plans, totalIssues } = analyze();
  state.steps = plans[state.strategy];
  state.totalIssues = totalIssues;
  state.counts = Object.fromEntries(Object.entries(plans).map(([k, steps]) => [k, {
    steps: steps.length - 1,
    errors: steps.reduce((n, st) => n + st.issues.filter((i) => i.severity === "error").length, 0),
    warns: steps.reduce((n, st) => n + st.issues.filter((i) => i.severity === "warn").length, 0),
  }]));
}

function render() {
  view?.update(state);
}

function show(i) {
  state.index = Math.max(0, Math.min(i, state.steps.length - 1));
  const item = state.steps[state.index]?.item;
  if (item) scrollToItem(item);
  render();
}

function pause() {
  run++;
  state.playing = false;
  abort?.abort();
  abort = null;
  render();
}

async function play() {
  if (state.playing) return;
  if (state.index >= state.steps.length - 1) state.index = -1; // a vegerol elolrol
  state.playing = true;
  const mine = ++run;
  while (run === mine && state.index < state.steps.length - 1) {
    show(state.index + 1);
    abort = new AbortController();
    const { text } = state.steps[state.index];
    const voice = state.sound ? hungarianVoice() : null;
    if (voice) await speak(text, { voice, wpm: state.wpm, signal: abort.signal });
    else await wait(estimateMs(text, state.wpm), abort.signal);
  }
  if (run !== mine) return;
  state.playing = false;
  render();
}

function setSound(on) {
  state.sound = on;
  state.warning = "";
  if (on && !hungarianVoice()) {
    state.sound = false;
    state.warning = "Nincs magyar hang ebben a böngészőben – csendes mód marad";
  }
  render();
}

export function enable() {
  if (view) return;
  view = mount({
    onStrategy: (k) => { pause(); state.strategy = k; refresh(); state.index = -1; render(); },
    onPlay: () => (state.playing ? pause() : play()),
    onPrev: () => { pause(); show(state.index - 1); },
    onNext: () => { pause(); show(state.index + 1); },
    onGoto: (i) => { pause(); show(i); },
    onSound: setSound,
    onWpm: (n) => { state.wpm = n; render(); },
    onExit: disable,
  });
  // a hangok listaja aszinkron toltodik; ha kozben elerhetove valik, a figyelmeztetes eltunhet
  globalThis.speechSynthesis?.getVoices();
  refresh();
  state.index = -1;
  render();
}

export function disable() {
  if (!view) return;
  pause();
  view.destroy();
  view = null;
}

export function toggle() {
  (view ? disable : enable)();
}

function onKey(e) {
  if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyA") {
    e.preventDefault();
    toggle();
    return;
  }
  if (!view) return;
  if (e.key === "Escape") { e.preventDefault(); disable(); return; }
  // a sajat vezerlokon (gomb, csuszka) a bongeszo kezelje a billentyuket; az oldal mezoiben se vegyuk el
  // A sajat feluleten: a nyilak leptetnek (kiveve a csuszkan), a Szokoz a gombot nyomja meg
  // (kiveve a csuszkan, ahol semmit nem csinalna -> ott lejatszas/szunet).
  const path = e.composedPath();
  const t = path[0];
  const inUi = path.includes(view.host);
  const isRange = t?.type === "range";
  if (inUi && !((e.key === " " && isRange) || ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !isRange))) return;
  if (!inUi && (t?.isContentEditable || /^(input|textarea|select)$/i.test(t?.localName || ""))) return;
  if (e.key === " ") { e.preventDefault(); state.playing ? pause() : play(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); pause(); show(state.index + 1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); pause(); show(state.index - 1); }
}

let installed = false;
export function install() {
  if (installed) return;
  installed = true;
  window.addEventListener("keydown", onKey, true);
}
