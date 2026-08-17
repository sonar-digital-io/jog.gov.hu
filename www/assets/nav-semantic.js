/* nav-semantic.js
 * Billentyuzet-kezeles a fomenu legordulo-nyitoihoz (.ms-sub-trigger), az ARIA
 * "menu button" minta szerint:
 *   - a triggeren Space / ArrowDown -> lenyit es az elso alpontra ugrik
 *     (ArrowUp -> az utolsora);
 *   - nyitva ↑/↓ lepked az alpontok kozott (Home/End: elso/utolso), koron at;
 *   - Escape zar es visszaadja a fokuszt a triggerre;
 *   - a fokusz elhagyasakor (Tab ki) automatikusan zar.
 * Egerrel a legordulo tovabbra is hoverre nyilik (tiszta CSS). A "Hasznos linkek"
 * gomb kattintasra is nyit/zar (touch/eger). Az "Agazati kozlonyok" trigger valodi
 * link -> Enter tovabbra is navigal.
 */
(function () {
  "use strict";

  function initItem(li) {
    var trigger = li.querySelector(":scope > .ms-sub-trigger");
    var submenu = li.querySelector(":scope > .ms-submenu");
    if (!trigger || !submenu) return;
    var isLink = trigger.tagName === "A";

    function items() { return Array.prototype.slice.call(submenu.querySelectorAll("a[href]")); }
    function open(which) {
      li.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      var it = items();
      if (it.length && which) {
        void submenu.offsetWidth; // reflow: a lathatosag lepjen eletbe a fokusz elott
        it[which === "last" ? it.length - 1 : 0].focus();
      }
    }
    function close(refocus) {
      li.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      if (refocus) trigger.focus();
    }

    trigger.setAttribute("aria-expanded", "false");

    trigger.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); open("first"); }
      else if (e.key === "ArrowDown") { e.preventDefault(); open("first"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); open("last"); }
      else if (e.key === "Enter" && !isLink) { e.preventDefault(); open("first"); }
      else if (e.key === "Escape") { close(true); }
    });

    // gomb-trigger (Hasznos linkek): kattintasra is nyit/zar
    if (!isLink) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        if (li.classList.contains("is-open")) close(false); else open("first");
      });
    }

    submenu.addEventListener("keydown", function (e) {
      var it = items();
      if (!it.length) return;
      var idx = it.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); it[(idx + 1) % it.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); it[(idx - 1 + it.length) % it.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); it[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); it[it.length - 1].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
    });

    // a fokusz elhagyta a menupontot -> zar
    li.addEventListener("focusout", function (e) {
      if (!e.relatedTarget || !li.contains(e.relatedTarget)) close(false);
    });
  }

  function boot() {
    document.querySelectorAll("nav.ms-mainnav .ms-has-sub").forEach(initItem);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
