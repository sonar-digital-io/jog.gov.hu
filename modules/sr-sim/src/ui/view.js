// A szimulator felulete: kiemelo keret + cimke, also vezerlosav, jobb oldali dontesi fa panel.
// Sajat shadow rootban el, hogy az oldal stilusa ne rontsa el (es forditva).
import { STRATEGIES } from "../engine/strategies.js";
import { isVisuallyHidden, targetRect } from "./highlight.js";

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; font-family: system-ui, "Segoe UI", sans-serif; }
button { font: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }
.hl { position: fixed; inset: 0; pointer-events: none; z-index: 2147483646; }
.box { position: fixed; border: 3px solid #2563eb; border-radius: 4px; background: rgb(37 99 235 / .08); transition: all .15s ease-out; }
.box.error { border-color: #dc2626; background: rgb(220 38 38 / .08); }
.box.warn { border-color: #d97706; background: rgb(217 119 6 / .08); }
.box.vh { border-style: dashed; }
.label { position: fixed; max-width: 440px; padding: 8px 10px; border-radius: 6px; background: #111827; color: #f9fafb; font-size: 13px; line-height: 1.45; box-shadow: 0 4px 16px rgb(0 0 0 / .3); }
.key { display: inline-block; min-width: 26px; padding: 1px 6px; margin-right: 6px; border: 1px solid #6b7280; border-bottom-width: 3px; border-radius: 4px; background: #374151; text-align: center; font-weight: 600; }
.label ul, .steps .iss { margin: 6px 0 0; padding: 0; list-style: none; }
.label li { margin-top: 3px; }
.sev-error { color: #fca5a5; } .sev-warn { color: #fcd34d; } .note { color: #a5b4fc; }
.bar { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); z-index: 2147483647; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; max-width: calc(100vw - 24px); padding: 8px 10px; border-radius: 10px; background: #111827; color: #f9fafb; font-size: 13px; box-shadow: 0 6px 24px rgb(0 0 0 / .35); }
.bar button { padding: 6px 10px; border: 1px solid #4b5563; border-radius: 6px; background: #1f2937; color: inherit; }
.bar button:hover { background: #374151; }
.bar button[aria-pressed="true"] { background: #2563eb; border-color: #2563eb; }
.bar .play { min-width: 92px; font-weight: 600; }
.bar .exit { background: #7f1d1d; border-color: #991b1b; }
.bar label { display: inline-flex; align-items: center; gap: 6px; }
.seg { display: inline-flex; gap: 2px; }
.warn-msg { color: #fcd34d; }
.panel { position: fixed; top: 12px; right: 12px; bottom: 76px; width: 340px; z-index: 2147483647; display: flex; flex-direction: column; border-radius: 10px; background: #f9fafb; color: #111827; font-size: 13px; box-shadow: 0 6px 24px rgb(0 0 0 / .25); overflow: hidden; }
.panel.collapsed { bottom: auto; }
.panel.collapsed .body { display: none; }
.phead { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: #111827; color: #f9fafb; }
.phead button { padding: 3px 8px; border: 1px solid #4b5563; border-radius: 6px; background: #1f2937; color: inherit; }
.body { display: flex; flex-direction: column; min-height: 0; flex: 1; }
.explain { margin: 0; padding: 8px 10px; background: #e0e7ff; color: #1e3a8a; font-weight: 600; }
.root { margin: 8px 10px 4px; padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; }
.branches { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 0 10px 0 22px; padding: 0 0 0 10px; list-style: none; border-left: 2px solid #d1d5db; }
.branches button { width: 100%; padding: 4px 6px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; color: inherit; text-align: left; }
.branches button[aria-pressed="true"] { border-color: #2563eb; background: #dbeafe; font-weight: 600; }
.branches small { display: block; color: #6b7280; font-weight: 400; }
.steps { flex: 1; min-height: 0; overflow: auto; margin: 8px 0 0; padding: 0 10px 10px 34px; }
.steps li { margin: 2px 0; }
.steps button { width: 100%; padding: 4px 6px; border: 1px solid transparent; border-radius: 6px; background: none; color: inherit; text-align: left; }
.steps button:hover { background: #f3f4f6; }
.steps li.current button { border-color: #2563eb; background: #dbeafe; }
.steps .k { display: inline-block; min-width: 22px; margin-right: 4px; padding: 0 4px; border: 1px solid #9ca3af; border-radius: 3px; font-size: 11px; text-align: center; }
.steps .end { color: #6b7280; font-style: italic; }
.steps .iss li { font-size: 12px; } .steps .sev-error { color: #b91c1c; } .steps .sev-warn { color: #b45309; }
.summary { margin: 0; padding: 6px 10px; border-top: 1px solid #e5e7eb; color: #4b5563; }
`;

const HTML = `
<div class="hl" hidden><div class="box"></div><div class="label"><span class="key"></span><span class="txt"></span><ul class="iss"></ul></div></div>
<aside class="panel" aria-label="Felolvasó-szimulátor: döntési fa">
  <div class="phead"><strong>Felolvasó-szimulátor</strong><button type="button" class="collapse" aria-expanded="true">Panel</button></div>
  <div class="body">
    <p class="explain"></p>
    <div class="root">Oldal betöltése</div>
    <ul class="branches"></ul>
    <ol class="steps"></ol>
    <p class="summary"></p>
  </div>
</aside>
<div class="bar" role="toolbar" aria-label="Felolvasó-szimulátor vezérlők">
  <div class="seg" role="group" aria-label="Stratégia"></div>
  <button type="button" class="prev" aria-label="Előző lépés">◀</button>
  <button type="button" class="play">▶ Lejátszás</button>
  <button type="button" class="next" aria-label="Következő lépés">▶|</button>
  <label><input type="checkbox" class="sound"> Hang</label>
  <label>Tempó <input type="range" class="wpm" min="100" max="450" step="10"> <output class="wpmv"></output> szó/perc</label>
  <span class="warn-msg" role="status"></span>
  <button type="button" class="exit">Kilépés (Esc)</button>
</div>`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const worst = (issues) => (issues.some((i) => i.severity === "error") ? "error" : issues.length ? "warn" : "");
const issuesHtml = (issues) => issues.map((i) => `<li class="sev-${i.severity}">${i.severity === "error" ? "!" : "?"} ${esc(i.msg)}</li>`).join("");

/**
 * @param {object} h  esemenykezelok: onStrategy(k), onPlay(), onPrev(), onNext(), onGoto(i), onSound(on), onWpm(n), onExit()
 */
export function mount(h) {
  const host = document.createElement("div");
  host.id = "sr-sim-root";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${CSS}</style>${HTML}`;
  document.body.appendChild(host);
  const $ = (s) => shadow.querySelector(s);

  const keys = Object.keys(STRATEGIES);
  $(".seg").innerHTML = keys.map((k) => `<button type="button" data-s="${k}" aria-pressed="false">${esc(STRATEGIES[k].key)} ${esc(STRATEGIES[k].label)}</button>`).join("");
  $(".branches").innerHTML = keys.map((k) => `<li><button type="button" data-s="${k}" aria-pressed="false">${esc(STRATEGIES[k].key)} – ${esc(STRATEGIES[k].label)}<small></small></button></li>`).join("");

  shadow.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.s) h.onStrategy(b.dataset.s);
    else if (b.dataset.i) h.onGoto(+b.dataset.i);
    else if (b.classList.contains("play")) h.onPlay();
    else if (b.classList.contains("prev")) h.onPrev();
    else if (b.classList.contains("next")) h.onNext();
    else if (b.classList.contains("exit")) h.onExit();
    else if (b.classList.contains("collapse")) {
      const collapsed = $(".panel").classList.toggle("collapsed");
      b.setAttribute("aria-expanded", String(!collapsed));
    }
  });
  $(".sound").addEventListener("change", (e) => h.onSound(e.target.checked));
  $(".wpm").addEventListener("input", (e) => h.onWpm(+e.target.value));

  let state = null;
  let renderedSteps = null;
  let raf = 0;

  function drawHighlight() {
    raf = requestAnimationFrame(drawHighlight);
    const step = state?.steps[state.index];
    const hl = $(".hl");
    if (!step?.item) { hl.hidden = true; return; }
    hl.hidden = false;
    let r = targetRect(step.item);
    const vh = isVisuallyHidden(r);
    if (vh) r = { left: r.left - 12, top: r.top - 12, width: 24, height: 24 };
    const box = $(".box");
    box.className = `box ${worst(step.issues)} ${vh ? "vh" : ""}`;
    Object.assign(box.style, { left: `${r.left - 4}px`, top: `${r.top - 4}px`, width: `${r.width + 8}px`, height: `${r.height + 8}px` });
    const label = $(".label");
    const below = r.top + r.height + 12;
    const top = below + label.offsetHeight < innerHeight - 80 ? below : Math.max(8, r.top - label.offsetHeight - 12);
    const left = Math.min(Math.max(8, r.left), innerWidth - label.offsetWidth - 360);
    Object.assign(label.style, { left: `${Math.max(8, left)}px`, top: `${top}px` });
  }

  function update(s) {
    state = s;
    const strat = STRATEGIES[s.strategy];
    for (const b of shadow.querySelectorAll("button[data-s]")) b.setAttribute("aria-pressed", String(b.dataset.s === s.strategy));
    for (const k of keys) {
      const small = shadow.querySelector(`.branches button[data-s="${k}"] small`);
      const c = s.counts[k];
      small.textContent = c ? `${c.steps} lépés${c.errors ? `, ${c.errors} hiba` : ""}${c.warns ? `, ${c.warns} figyelm.` : ""}` : "";
    }
    $(".play").textContent = s.playing ? "⏸ Szünet" : "▶ Lejátszás";
    $(".sound").checked = s.sound;
    $(".wpm").value = String(s.wpm);
    $(".wpmv").textContent = String(s.wpm);
    $(".warn-msg").textContent = s.warning || "";

    const step = s.steps[s.index];
    $(".explain").textContent = step ? `${strat.explain} – ${s.index + 1}/${s.steps.length}` : `${strat.explain}. Indítás: ▶ vagy Szóköz`;

    if (renderedSteps !== s.steps) {
      renderedSteps = s.steps;
      $(".steps").innerHTML = s.steps.map((st, i) => `<li><button type="button" data-i="${i}"><span class="k">${esc(st.key)}</span><span class="${st.end ? "end" : ""}">${esc(st.text)}</span>${st.issues.length ? `<ul class="iss">${issuesHtml(st.issues)}</ul>` : ""}</button></li>`).join("");
      const errs = s.steps.reduce((n, st) => n + st.issues.filter((i) => i.severity === "error").length, 0);
      const warns = s.steps.reduce((n, st) => n + st.issues.filter((i) => i.severity === "warn").length, 0);
      $(".summary").textContent = `${s.steps.length - 1} lépés · ${errs} hiba · ${warns} figyelmeztetés ezen az úton (összesen az oldalon: ${s.totalIssues})`;
    }
    shadow.querySelectorAll(".steps li.current").forEach((li) => {
      li.classList.remove("current");
      li.querySelector("button").removeAttribute("aria-current");
    });
    const li = $(".steps").children[s.index];
    if (li) {
      li.classList.add("current");
      li.querySelector("button").setAttribute("aria-current", "step");
      li.scrollIntoView({ block: "nearest" });
    }

    if (step) {
      $(".key").textContent = step.key;
      $(".txt").textContent = step.text;
      const vh = step.item && isVisuallyHidden(targetRect(step.item));
      $(".label .iss").innerHTML = issuesHtml(step.issues) + (vh ? `<li class="note">◌ vizuálisan rejtett – csak a felolvasó hallja</li>` : "");
    }
    if (!raf) drawHighlight();
  }

  return {
    host,
    update,
    destroy() {
      cancelAnimationFrame(raf);
      host.remove();
    },
  };
}
