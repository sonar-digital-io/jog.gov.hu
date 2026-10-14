// NVDA-stilusu magyar megfogalmazas. KOZELITES: a pontos NVDA magyar szovegeket a kalibracios
// NVDA-futtatassal (tests/sr) kell majd ide atvezetni - minden szoveg ebben az egy fajlban van.

const ROLE = {
  heading: "címsor", link: "hivatkozás", button: "gomb", textbox: "szerkesztőmező", searchbox: "keresőmező",
  combobox: "kombinált lista", checkbox: "jelölőnégyzet", radio: "választógomb", switch: "kapcsoló",
  img: "grafika", image: "grafika", tab: "fül", menuitem: "menüelem", menuitemcheckbox: "menüelem",
  menuitemradio: "menüelem", option: "lehetőség", slider: "csúszka", spinbutton: "léptetőmező",
  progressbar: "folyamatjelző", meter: "mérő", separator: "elválasztó", listbox: "listamező", list: "lista",
  banner: "fejléc régió", navigation: "navigációs régió", main: "fő régió", contentinfo: "lábléc régió",
  complementary: "kiegészítő régió", search: "keresés régió", region: "régió", form: "űrlap régió",
};

export function roleLabel(role) {
  return ROLE[role] || "";
}

/** Amit a felolvaso egy elemre lepve mond. */
export function phrase(item) {
  if (item.kind === "text") return item.name;
  if (item.kind === "list") return `lista, ${item.count} elem`;
  const parts = [];
  if (item.name) parts.push(item.name);
  const r = roleLabel(item.role);
  if (r) parts.push(r);
  if (item.role === "heading" && item.level) parts.push(`${item.level}. szint`);
  const s = item.states || {};
  if (s.current) parts.push(s.current === "page" ? "aktuális oldal" : "aktuális");
  if (s.haspopup && item.role !== "combobox") parts.push("almenü"); // a kombinalt listanal ez alapertelmezes, nem mondja
  if (s.expanded === true) parts.push("kibontva");
  if (s.expanded === false) parts.push("összecsukva");
  if (s.checked === true) parts.push(item.role === "switch" ? "be" : "bejelölve");
  if (s.checked === false) parts.push(item.role === "switch" ? "ki" : "nincs bejelölve");
  if (s.pressed === true) parts.push("lenyomva");
  if (s.disabled) parts.push("nem elérhető");
  if (s.value) parts.push(s.value);
  return parts.length ? parts.join(", ") : "(név és szerep nélküli elem)";
}

/** Belepeskor hallhato elotag nyilas olvasasnal (regio, lista). */
export function enterPhrase(item) {
  if (item.kind === "list") return `lista, ${item.count} elem`;
  return [item.name, roleLabel(item.role)].filter(Boolean).join(", ");
}
