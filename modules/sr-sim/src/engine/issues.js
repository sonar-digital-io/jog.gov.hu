// Hibaszabalyok. Kimenet: Map(elem -> [{ id, severity: "error" | "warn", msg }]).
// Minden szabaly egy valos, a jog.gov.hu tukron talalt esetbol jon (lasd a spec "Hibaszabalyok" reszet).
import { roleLabel } from "./phrases.js";

const INTERACTIVE = new Set([
  "link", "button", "textbox", "searchbox", "combobox", "checkbox", "radio", "switch", "tab",
  "menuitem", "menuitemcheckbox", "menuitemradio", "option", "slider", "spinbutton", "listbox",
]);
const IDREF_ATTRS = ["aria-controls", "aria-labelledby", "aria-describedby", "aria-owns", "aria-activedescendant"];

export function findIssues(model, doc = document) {
  const map = new Map();
  const add = (el, id, severity, msg) => {
    if (!el) return;
    const list = map.get(el) || [];
    if (!list.some((x) => x.id === id && x.msg === msg)) list.push({ id, severity, msg });
    map.set(el, list);
  };
  const leaves = model.items.filter((i) => i.kind === "leaf");
  const landmarks = model.items.filter((i) => i.kind === "landmark");

  // heading-skip
  let prev = 0;
  for (const h of leaves.filter((i) => i.role === "heading")) {
    if (prev && h.level > prev + 1) add(h.el, "heading-skip", "error", `Címsorszint-ugrás: ${prev}. szint után ${h.level}. szint`);
    prev = h.level;
  }

  // heading-hidden: cimsor egy egysegkent felolvasott elem (pl. gomb) belsejeben
  for (const { heading, container, containerRole } of model.buriedHeadings || []) {
    const r = roleLabel(containerRole) || "vezérlő";
    add(container, "heading-hidden", "warn", `A(z) „${heading.name.replace(/\s+/g, " ")}” címsor egy ${r} belsejében van – H-val nem érhető el, a ${r} tartalma egyben hangzik el`);
  }

  // landmark-name
  for (const role of ["navigation", "complementary"]) {
    const same = landmarks.filter((l) => l.role === role);
    if (same.length < 2) continue;
    const label = roleLabel(role);
    for (const l of same) {
      if (!l.name) add(l.el, "landmark-name", "error", `Több ${label} van, ez névtelen – D-vel nem különböztethető meg`);
      else if (same.filter((o) => o.name === l.name).length > 1) add(l.el, "landmark-name", "error", `Azonos nevű ${label}: „${l.name}”`);
    }
  }

  // no-name
  for (const i of [...leaves, ...model.tabOrder]) {
    if (INTERACTIVE.has(i.role) && !i.name) add(i.el, "no-name", "error", `Név nélküli ${roleLabel(i.role) || i.role} – a felolvasó csak a szerepét mondja`);
  }

  // focus-no-name: fokuszalhato, de sem neve, sem szerepe -> ures Tab-megallo
  for (const i of model.tabOrder) {
    if (!i.name && !roleLabel(i.role)) add(i.el, "focus-no-name", "error", "Fókuszálható elem név és szerep nélkül – üres Tab-megálló");
  }

  // dup-link: egymas utani linkek ugyanarra a cimre (kozottuk nincs mas vezerlo)
  let lastLink = null;
  for (const i of leaves) {
    if (i.role === "link") {
      if (lastLink && i.states.href && i.states.href === lastLink.states.href) {
        add(i.el, "dup-link", "error", "Ugyanoda mutat, mint az előző link – a linklistában duplán szerepel");
      }
      lastLink = i;
    } else if (INTERACTIVE.has(i.role)) {
      lastLink = null;
    }
  }

  // outside-landmark (az oldalon beluli horgony - pl. skip link - kivetel)
  for (const i of model.items) {
    if ((i.kind !== "leaf" && i.kind !== "text") || i.landmark) continue;
    if (i.role === "link" && (i.el.getAttribute("href") || "").startsWith("#")) continue;
    add(i.el, "outside-landmark", "warn", "Régión kívüli tartalom – régiók (D) szerint haladva kimarad");
  }

  // idref
  const hosts = model.all.filter((el) => el.shadowRoot);
  const existsElsewhere = (id) => !!doc.getElementById(id) || hosts.some((h) => h.shadowRoot.getElementById(id));
  for (const el of model.all) {
    for (const attr of IDREF_ATTRS) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      for (const id of value.trim().split(/\s+/)) {
        if (el.getRootNode().getElementById?.(id)) continue;
        add(el, "idref", "error", existsElsewhere(id)
          ? `${attr}="${id}": a cél egy másik shadow rootban van – a felolvasó nem éri el`
          : `${attr}="${id}": nincs ilyen azonosítójú elem`);
      }
    }
  }

  // combobox-empty
  for (const i of [...leaves, ...model.tabOrder]) {
    if (i.role !== "combobox" || i.states.expanded !== true) continue;
    const ids = (i.el.getAttribute("aria-controls") || i.el.getAttribute("aria-owns") || "").trim().split(/\s+/).filter(Boolean);
    const root = i.el.getRootNode();
    const hasOption = ids.some((id) => root.getElementById?.(id)?.querySelector('[role="option"]'));
    if (!hasOption) add(i.el, "combobox-empty", "error", "Kibontott kombinált lista, de nincs elérhető választható elem (option) – nyilakkal nem lehet a javaslatokra lépni");
  }

  // skip-link: ha az elso Tab-megallo oldalon beluli horgony, a celja letezzen es legyen fokuszalhato
  const first = model.tabOrder[0];
  const href = first?.role === "link" ? first.el.getAttribute("href") || "" : "";
  if (href.startsWith("#") && href.length > 1) {
    const target = doc.getElementById(decodeURIComponent(href.slice(1)));
    if (!target) add(first.el, "skip-link", "error", `A skip link célja (${href}) nem létezik`);
    else if (!target.hasAttribute("tabindex") && target.tabIndex < 0) {
      add(first.el, "skip-link", "error", `A skip link célja (${href}) nem fókuszálható – hiányzik a tabindex="-1"`);
    }
  }

  return map;
}
