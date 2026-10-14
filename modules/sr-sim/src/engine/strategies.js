// Strategia -> lepessor. Egy lepes: { key, text, item } (item null a "nincs tobb" zarolepesnel).
import { enterPhrase, phrase } from "./phrases.js";

export const STRATEGIES = {
  H: { key: "H", label: "Címsorok", explain: "H: ugrás a következő címsorra", end: "nincs következő címsor" },
  D: { key: "D", label: "Régiók", explain: "D: ugrás a következő régióra (landmark)", end: "nincs következő régió" },
  Tab: { key: "Tab", label: "Tab", explain: "Tab: a fókusz a következő vezérlőre lép", end: "a fókusz elhagyja az oldalt (böngésző-felület)" },
  Nyilak: { key: "↓", label: "Nyilak", explain: "↓: a következő elem felolvasása olvasó módban", end: "dokumentum vége" },
};

export function buildSteps(model, strategy) {
  const s = STRATEGIES[strategy];
  if (!s) throw new Error(`Ismeretlen stratégia: ${strategy}`);
  let steps;
  if (strategy === "H") {
    steps = model.items.filter((i) => i.kind === "leaf" && i.role === "heading").map((item) => ({ item, text: phrase(item) }));
  } else if (strategy === "D") {
    steps = model.items.filter((i) => i.kind === "landmark").map((item) => ({ item, text: phrase(item) }));
  } else if (strategy === "Tab") {
    steps = model.tabOrder.map((item) => ({ item, text: phrase(item) }));
  } else {
    // Nyilak: minden tartalom sorban; a regio/lista belepest a kovetkezo elem ele mondja a felolvaso
    steps = [];
    let enter = [];
    for (const item of model.items) {
      if (item.nested) continue; // a befoglalo link mar felolvasta
      if (item.kind === "landmark" || item.kind === "list") {
        enter.push(item);
        continue;
      }
      const prefix = enter.map(enterPhrase).filter(Boolean).join(", ");
      steps.push({ item, text: prefix ? `${prefix}, ${phrase(item)}` : phrase(item) });
      enter = [];
    }
  }
  steps.push({ item: null, text: s.end, end: true });
  return steps.map((st) => ({ ...st, key: s.key }));
}
