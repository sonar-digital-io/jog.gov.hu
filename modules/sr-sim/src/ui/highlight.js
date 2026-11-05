// Hol van a kepernyon egy lepes eleme (szovegcsomopontnal a szoveg doboza), es odagorgetes.

export function targetRect(item) {
  if (item.node) {
    const range = document.createRange();
    range.selectNodeContents(item.node);
    return range.getBoundingClientRect();
  }
  return item.el.getBoundingClientRect();
}

/** Vizualisan rejtett (pl. sr-only) elem: a felolvaso hallja, a szem nem latja. */
export function isVisuallyHidden(rect) {
  return rect.width <= 2 && rect.height <= 2;
}

export function scrollToItem(item) {
  const el = item.node ? item.node.parentElement : item.el;
  const r = targetRect(item);
  if (r.top < 60 || r.bottom > innerHeight - 140) el.scrollIntoView({ block: "center", behavior: "smooth" });
}
