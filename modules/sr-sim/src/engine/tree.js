// Az oldal bejarasa ugy, ahogy a felolvaso latja: lapitott fa (shadow DOM + slotok), rejtett reszek nelkul.
// Kimenet: felolvasasi sorrendben az elemek (items), a Tab-sorrend (tabOrder) es minden latogatott elem (all).
import { computeAccessibleName, getRole } from "dom-accessibility-api";

export const LANDMARKS = new Set(["banner", "navigation", "main", "contentinfo", "complementary", "search", "region", "form"]);

// Ezeket egy egysegkent olvassa fel a felolvaso (a nevuk a tartalmukbol jon) -> nem megyunk beljebb.
const LEAF = new Set([
  "heading", "link", "button", "textbox", "searchbox", "combobox", "checkbox", "radio", "switch",
  "img", "image", "tab", "menuitem", "menuitemcheckbox", "menuitemradio", "option", "slider",
  "spinbutton", "progressbar", "meter", "separator",
]);

// ARIA "children presentational": ezek tartalma egyetlen egysegkent hangzik el, a benne levo
// cimsor stb. nem kulon elem (H-val nem talalhato). A link/cimsor/mezo NEM ilyen.
const PRESENTATIONAL = new Set([
  "button", "checkbox", "img", "image", "menuitemcheckbox", "menuitemradio", "meter", "option",
  "progressbar", "radio", "scrollbar", "separator", "slider", "switch", "tab",
]);

const SKIP_TAGS = new Set(["script", "style", "template", "noscript", "link", "meta", "head", "title"]);

function isHidden(el) {
  if (el.getAttribute("aria-hidden") === "true" || el.hidden) return true;
  if (el.hasAttribute("inert")) return true; // inert reszfa: sem Tab, sem felolvaso (a hoston vagjuk, igy az arnyek-DOM is kiesik)
  const cs = getComputedStyle(el);
  if (cs.display === "none") return true;
  if (cs.display === "contents") return false; // slot, wrapper custom elementek: nincs dobozuk, de a tartalmuk latszik
  // ponytail: a visibility:hidden alatti, ujra visible gyerekeket nem keressuk meg (ritka)
  return cs.visibility === "hidden";
}

function flatChildren(node) {
  if (node.shadowRoot) return [...node.shadowRoot.childNodes];
  if (node.localName === "slot") {
    const assigned = node.assignedNodes({ flatten: true });
    return assigned.length ? assigned : [...node.childNodes];
  }
  return [...node.childNodes];
}

function isTabbable(el) {
  if (el.tabIndex < 0 || el.disabled) return false;
  // display:contents elemnek nincs doboza: ma egyik motor sem fokuszalja tabindex="0" mellett sem (Chromium
  // csak a <slot tabindex>-et), pl. a design system menupont-hostjat - a fokuszt a benne levo gomb kapja.
  // A szabvany (whatwg/html#9425) fokuszalhatova tenne; ha egy motor ezt kiadja, a host valodi ures
  // Tab-megallo lesz - ezt a "Tab-sorrend = valodi Tab-sorrend" teszt fogja jelezni.
  if (getComputedStyle(el).display === "contents") return false;
  // <a> href nelkul nem kap fokuszt, de a tabIndex-e nehany bongeszoben 0
  if (el.localName === "a" && !el.hasAttribute("href") && !el.hasAttribute("tabindex")) return false;
  return true;
}

function headingLevel(el) {
  const aria = parseInt(el.getAttribute("aria-level"), 10);
  if (aria > 0) return aria;
  const m = /^h([1-6])$/.exec(el.localName);
  return m ? +m[1] : 2; // role="heading" szint nelkul: a felolvasok 2-nek veszik
}

function statesOf(el, role) {
  const a = (n) => el.getAttribute(n);
  const s = {};
  if (a("aria-expanded") != null) s.expanded = a("aria-expanded") === "true";
  if (["checkbox", "switch", "radio", "menuitemcheckbox", "menuitemradio"].includes(role)) {
    s.checked = typeof el.checked === "boolean" ? el.checked : a("aria-checked") === "true";
  }
  if (a("aria-pressed") != null) s.pressed = a("aria-pressed") === "true";
  const cur = a("aria-current");
  if (cur && cur !== "false") s.current = cur;
  if (el.disabled || a("aria-disabled") === "true") s.disabled = true;
  const pop = a("aria-haspopup");
  if (pop && pop !== "false") s.haspopup = true;
  if (role === "link") s.href = el.href || a("href") || "";
  if (["textbox", "searchbox", "combobox"].includes(role) && typeof el.value === "string" && el.value) s.value = el.value;
  return s;
}

/** Egy elem leirasa felolvasashoz (szerep, nev, szint, allapot). */
export function describe(el, kind = "leaf") {
  const role = getRole(el) || "";
  const item = { kind, el, role, name: computeAccessibleName(el).replace(/\s+/g, " ").trim(), states: statesOf(el, role) };
  if (role === "heading") item.level = headingLevel(el);
  return item;
}

/**
 * @param {Element} root  ahonnan a bejaras indul (altalaban document.body)
 * @param {{exclude?: (el: Element) => boolean}} opts  pl. a szimulator sajat UI-ja
 */
export function collect(root = document.body, { exclude = () => false } = {}) {
  const items = [];
  const tabbables = [];
  const all = [];
  const buriedHeadings = []; // { heading, container }: gomb/kapcsolo stb. belsejeben levo cimsor
  const hiddenFocusables = []; // aria-hidden="true" alatt, de lathato es Tab-bal elerheto: a felolvaso nem mond semmit
  // a lathato, de aria-hidden reszfa Tab-megalloi: a Tab ide is eljut, a felolvaso viszont nem mond rola semmit
  function visitAriaHidden(node) {
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TAGS.has(node.localName) || exclude(node) || node.hidden) return;
      const cs = getComputedStyle(node);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      if (isTabbable(node)) { tabbables.push(node); hiddenFocusables.push(node); }
    }
    for (const c of flatChildren(node)) visitAriaHidden(c);
  }

  // leaf: a legkozelebbi "egysegkent felolvasott" os ({ el, role, presentational }) vagy null
  // list: a legkozelebbi lista elem (a listaelemeit a lapitott faban szamoljuk, mert slotokon at is lehetnek)
  function visit(node, landmark, leaf, list) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (leaf) return;
      const text = node.data.replace(/\s+/g, " ").trim();
      if (text) items.push({ kind: "text", el: node.parentElement, node, role: "text", name: text, states: {}, landmark });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.getAttribute("aria-hidden") === "true" && !SKIP_TAGS.has(node.localName) && !exclude(node)) {
        return visitAriaHidden(node);
      }
      if (SKIP_TAGS.has(node.localName) || exclude(node) || isHidden(node)) return;
      all.push(node);
      if (isTabbable(node)) tabbables.push(node);
      const role = getRole(node) || "";
      if (leaf && role === "heading") {
        if (leaf.presentational) buriedHeadings.push({ heading: describe(node), container: leaf.el, containerRole: leaf.role });
        else items.push({ ...describe(node), landmark, nested: true }); // pl. linkben levo cimsor: H-val megtalalhato
      }
      if (!leaf) {
        if (LANDMARKS.has(role)) {
          const item = describe(node, "landmark");
          // region/form csak nevvel szamit regionak (ARIA szabaly)
          if ((role !== "region" && role !== "form") || item.name) {
            items.push(item);
            landmark = item;
          }
        } else if (role === "list") {
          list = { kind: "list", el: node, role, name: "", count: 0, states: {}, landmark };
          items.push(list);
        } else if (role === "listitem" && list) {
          list.count++;
        } else if (LEAF.has(role)) {
          const item = describe(node);
          item.landmark = landmark;
          items.push(item);
          // a tartalmat mar a neve hordozza; lejjebb csak a Tab-, cimsor- es hibaszabalyok miatt megyunk
          leaf = { el: node, role, presentational: PRESENTATIONAL.has(role) };
        }
      }
    }
    for (const child of flatChildren(node)) visit(child, landmark, leaf, list);
  }

  visit(root, null, null, null);

  // Tab-sorrend: pozitiv tabindex elol (novekvo, stabil), utana a tobbi bejarasi sorrendben
  const positive = tabbables.filter((el) => el.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  const rest = tabbables.filter((el) => el.tabIndex === 0);
  const tabOrder = [...positive, ...rest].map((el) => describe(el, "focus"));

  return { items, tabOrder, all, buriedHeadings, hiddenFocusables };
}
