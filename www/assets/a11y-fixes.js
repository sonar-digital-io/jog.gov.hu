/* a11y-fixes.js
 * Akadalymentesitesi javitasok a jog.gov.hu tukorhoz - FUTASIDOBEN.
 *
 * MIERT FUTASIDOBEN? A korabbi patchek a letoltott HTML-t irtak at (fomenu-csere,
 * kep-link deduplikalas). A React-es oldalakon ez hidratacios elteresi okozott
 * (Minified React error #418), a React ujrarenderelte a DOM-ot, es a javitasok
 * eltuntek. Ezert itt minden szerkezeti javitas a hidratacio UTAN fut, es egy
 * MutationObserver ujra alkalmazza, ha a React (vagy egy web component) atrajzol
 * valamit. Minden lepes idempotens.
 *
 * Beszurja: scripts/patch_a11y.py (a <head>-be, a11y-fixes.css-sel egyutt).
 * Tesztek: scripts/test_a11y.mjs
 *
 * Tartalom (WCAG 2.2):
 *   skipLink        2.4.1  ugro link + <main> fokuszalhato cel
 *   mainNav         2.1.1, 4.1.2, 1.4.13  szemantikus fomenu (disclosure minta)
 *   langMenu        2.1.1, 4.1.2, 3.1.2  nyelvvalaszto: billentyuzet, nev, lang
 *   landmarks       1.3.1  egyedi nevek a <nav>-okon, logo-regio
 *   headings        1.3.1  kihagyott cimsorszintek javitasa (aria-level)
 *   images          1.1.1, 2.4.4  "ALT" alt-szovegek, duplikalt kep-linkek
 *   gazetteCards    4.1.2, 2.4.6  "Reszletek" lenyitok allapota es neve
 *   newWindowLinks  2.4.4, 3.2.5  "(uj ablakban nyilik meg)" a nevben
 *   langDialog      3.1.2  az angol nyelvu dialog lang="en"
 *   consentBanner   2.4.11 suti-sav: regio (a fokusz kitakarasat a focusin-kezelo oldja meg)
 *   mobileMenu      2.1.1, 2.4.3, 4.1.2  hamburgermenu fokuszkezelese
 */
(function () {
  "use strict";
  if (window.__a11yFixes) return;
  window.__a11yFixes = true;

  var D = document;
  // A tukor hat nyelven fut (hu + /en/, /de/, /fr/, /es/, /it/, /zh/). Az altalunk
  // adott feliratok az oldal nyelvet kovetik (3.1.1, 3.1.2).
  var I18N = {
    hu: { skip: "Ugrás a fő tartalomra", newWin: "(új ablakban nyílik meg)", mainNav: "Főmenü", header: "Fejléc", footer: "Lábléc", langNav: "Nyelvválasztó", langBtn: "nyelv választása", curLang: "jelenlegi nyelv", details: "Részletek", rss: "RSS-hírcsatorna", consent: "Süti- és adatkezelési tájékoztató", menu: "Menü", closeMenu: "Menü bezárása", lawText: "a jogszabály szövege", table: "Táblázat", szechenyi: "Széchenyi Terv Plusz – Magyarország Kormánya, az Európai Unió társfinanszírozásával" },
    en: { skip: "Skip to main content", newWin: "(opens in a new window)", mainNav: "Main menu", header: "Header", footer: "Footer", langNav: "Language selector", langBtn: "choose language", curLang: "current language", details: "Details", rss: "RSS feed", consent: "Cookie and data processing notice", menu: "Menu", closeMenu: "Close menu", lawText: "text of the legislation", table: "Table", szechenyi: "Széchenyi Plan Plus – Government of Hungary, co-financed by the European Union" },
    de: { skip: "Zum Hauptinhalt springen", newWin: "(öffnet in einem neuen Fenster)", mainNav: "Hauptmenü", header: "Kopfzeile", footer: "Fußzeile", langNav: "Sprachauswahl", langBtn: "Sprache wählen", curLang: "aktuelle Sprache", details: "Details", rss: "RSS-Feed", consent: "Hinweis zu Cookies und Datenverarbeitung", menu: "Menü", closeMenu: "Menü schließen", lawText: "Text der Rechtsvorschrift", table: "Tabelle", szechenyi: "Széchenyi-Plan Plus – Regierung Ungarns, kofinanziert von der Europäischen Union" },
    fr: { skip: "Aller au contenu principal", newWin: "(s’ouvre dans une nouvelle fenêtre)", mainNav: "Menu principal", header: "En-tête", footer: "Pied de page", langNav: "Sélecteur de langue", langBtn: "choisir la langue", curLang: "langue actuelle", details: "Détails", rss: "Flux RSS", consent: "Informations sur les cookies et le traitement des données", menu: "Menu", closeMenu: "Fermer le menu", lawText: "texte de l’acte juridique", table: "Tableau", szechenyi: "Plan Széchenyi Plus – Gouvernement de Hongrie, cofinancé par l’Union européenne" },
    es: { skip: "Saltar al contenido principal", newWin: "(se abre en una ventana nueva)", mainNav: "Menú principal", header: "Encabezado", footer: "Pie de página", langNav: "Selector de idioma", langBtn: "elegir idioma", curLang: "idioma actual", details: "Detalles", rss: "Canal RSS", consent: "Aviso sobre cookies y tratamiento de datos", menu: "Menú", closeMenu: "Cerrar menú", lawText: "texto de la norma", table: "Tabla", szechenyi: "Plan Széchenyi Plus – Gobierno de Hungría, cofinanciado por la Unión Europea" },
    it: { skip: "Vai al contenuto principale", newWin: "(si apre in una nuova finestra)", mainNav: "Menu principale", header: "Intestazione", footer: "Piè di pagina", langNav: "Selettore della lingua", langBtn: "scegli la lingua", curLang: "lingua attuale", details: "Dettagli", rss: "Feed RSS", consent: "Informativa su cookie e trattamento dei dati", menu: "Menu", closeMenu: "Chiudi menu", lawText: "testo dell’atto normativo", table: "Tabella", szechenyi: "Piano Széchenyi Plus – Governo dell’Ungheria, cofinanziato dall’Unione europea" },
    zh: { skip: "跳到主要内容", newWin: "（在新窗口中打开）", mainNav: "主菜单", header: "页眉", footer: "页脚", langNav: "语言选择", langBtn: "选择语言", curLang: "当前语言", details: "详情", rss: "RSS 订阅", consent: "Cookie 与数据处理说明", menu: "菜单", closeMenu: "关闭菜单", lawText: "法规全文", table: "表格", szechenyi: "塞切尼计划+ – 匈牙利政府，欧盟共同资助" }
  };
  var PAGE_LANG = (D.documentElement.getAttribute("lang") || "hu").slice(0, 2).toLowerCase();
  var S = I18N[PAGE_LANG] || I18N.en;
  // az URL nyelvi elotagja ("" a magyar oldalakon, "/en" stb. a forditottakon)
  var LANG_PREFIX = (location.pathname.match(/^\/(en|de|fr|es|it|zh)(?=\/|$)/) || ["", ""])[0];
  var NEW_WIN = S.newWin;
  // regi (csak magyar) jelzesek felismeresehez is
  var NEW_WIN_RE = /új ablakban|new window|neuen Fenster|nouvelle fenêtre|ventana nueva|nuova finestra|新窗口/;

  /* ------------------------------------------------------------- segedek */
  function txt(el) { return ((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, " ").trim(); }
  function setAttr(el, name, value) {
    // csak akkor ir, ha tenyleg valtozik -> nincs MutationObserver-hurok
    if (el && el.getAttribute(name) !== value) el.setAttribute(name, value);
  }
  function delAttr(el, name) { if (el && el.hasAttribute(name)) el.removeAttribute(name); }
  var uid = 0;
  function ensureId(el, prefix) { if (!el.id) el.id = (prefix || "a11y") + "-" + (++uid); return el.id; }
  function onShadow(host, cb) {
    if (host.shadowRoot) return cb(host.shadowRoot);
    var tag = host.tagName.toLowerCase();
    if (window.customElements && tag.indexOf("-") > 0) {
      customElements.whenDefined(tag).then(function () { setTimeout(function () { if (host.shadowRoot) cb(host.shadowRoot); }, 30); });
    }
  }
  function isVisible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none";
  }

  /* ------------------------------------------------- hidratacio megvarasa */
  function usesReact() {
    for (var i = 0; i < D.scripts.length; i++) if (/entry\.client/.test(D.scripts[i].textContent)) return true;
    return false;
  }
  function hydrated() {
    var m = D.querySelector("main");
    if (!m) return false;
    for (var k in m) if (k.indexOf("__reactFiber") === 0) return true;
    return false;
  }
  function whenReady(cb) {
    var start = Date.now();
    (function poll() {
      if (!usesReact() || hydrated() || Date.now() - start > 15000) return setTimeout(cb, 0);
      setTimeout(poll, 50);
    })();
  }

  /* =================================================== 1. Ugro link (2.4.1) */
  function skipLink() {
    var main = D.querySelector("main");
    if (main) { if (!main.id) main.id = "dds-main-content"; if (D.activeElement !== main) delAttr(main, "tabindex"); }
    // a tabindex="-1" csak az ugro link alatt kell: allandoan a <main> egy tetszoleges
    // (nem interaktiv) kattintasra fokuszt kapna, es a bongeszo a magas <main> aljara gorgetne
    var link = D.querySelector("a.skip-to-content");
    // a hibaoldalon nincs ugro link (a tartalom csak a hibauzenet es a visszalepes)
    if (D.querySelector("a.ms-error-back")) { if (link) link.remove(); return; }
    if (!link) {
      link = D.createElement("a");
      link.className = "skip-to-content";
      link.textContent = "Ugrás a fő tartalomra";
      D.body.insertBefore(link, D.body.firstChild);
    }
    if (main) setAttr(link, "href", "#" + main.id);
    if (link.textContent !== S.skip) link.textContent = S.skip;
  }
  // delegalt kezelo: a horgony-ugras fokuszt is helyez (kulonben a kovetkezo Tab
  // visszamenne a navigacioba). Space-re is mukodik.
  function jumpToMain(e) {
    var main = D.querySelector("main");
    if (!main) return;
    e.preventDefault();
    // a fokusz a <main> elemre kerul (nem a keresomezore); a gorgetes a tartalom elejere visz
    setAttr(main, "tabindex", "-1");
    main.focus({ preventScroll: true });
    main.addEventListener("blur", function () { delAttr(main, "tabindex"); }, { once: true });
    if (history.replaceState) history.replaceState(history.state, "", "#" + main.id);
  }
  D.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.skip-to-content");
    if (a) jumpToMain(e);
  }, true);
  D.addEventListener("keydown", function (e) {
    if ((e.key === " " || e.key === "Spacebar") && e.target.matches && e.target.matches("a.skip-to-content")) jumpToMain(e);
  }, true);

  // Visszalepes (bfcache): a menu lenyilok csukva allnak, a fokusz az ugro link ELE kerul (a kovetkezo Tab az ugro linkre visz)
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    D.querySelectorAll(".ms-has-sub.is-open").forEach(function (li) {
      li.classList.remove("is-open");
      var t = li.querySelector(":scope > .ms-sub-trigger"); if (t) t.setAttribute("aria-expanded", "false");
    });
    D.querySelectorAll("dap-ds-navigation-menu-item").forEach(function (it) { try { if (it.hideDropDown) it.hideDropDown(); } catch (er) {} });
    try { if (D.activeElement && D.activeElement.blur) D.activeElement.blur(); } catch (er) {}
    var m = D.createElement("span");
    m.setAttribute("tabindex", "-1"); m.setAttribute("aria-hidden", "true"); m.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    D.body.insertBefore(m, D.body.firstChild);
    m.focus({ preventScroll: true });
    m.addEventListener("blur", function () { m.remove(); }, { once: true });
  });

  /* ============================================ 2. Szemantikus fomenu */
  var CHEVRON = '<svg class="ms-chevron" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="m12 13.171 4.95-4.95 1.414 1.415L12 16 5.636 9.636 7.05 8.222z"/></svg>';
  var EXT = '<svg class="ms-ext-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm11-3v8h-2V6.413l-7.793 7.794-1.414-1.414L18.585 5H14V3z"/></svg>';
  // A menu tartalmat a (rejtett) DS-menubol olvassuk ki, igy minden nyelven es a
  // tartalomkezelo valtozasaival is helyes marad (a forditott oldalakon pl. csak
  // "Back to Hungarian page" + "Legal AI Search" van).
  function readDsMenu(ds) {
    var items = [];
    Array.prototype.forEach.call(ds.children, function (it) {
      if (it.tagName !== "DAP-DS-NAVIGATION-MENU-ITEM") return;
      var tr = it.querySelector(':scope > [slot="trigger"]');
      if (!tr) return;
      var lab = tr.querySelector(".header-secondary-menu-label");
      var sub = [];
      Array.prototype.forEach.call(it.querySelectorAll("a[href], dap-ds-button[href]:not([slot])"), function (n) {
        if (n.closest('[slot="trigger"]') || (n.tagName === "DAP-DS-BUTTON" && n.closest("a[href]"))) return;
        var h = n.getAttribute("href");
        sub.push({ label: txt(n), href: h, ext: /^https?:/i.test(h) });
      });
      // a DS menupont sajat ikonja (pl. "Back to Hungarian page" elotti nyil) - a lenyito chevront nem
      var icn = sub.length ? null : tr.querySelector("dap-ds-icon[name]");
      items.push({ label: txt(lab || tr), href: tr.getAttribute("href"), active: tr.hasAttribute("active"), sub: sub, icon: icn && icn.getAttribute("name") });
    });
    // ha a DS nem jelolt aktivat: a leghosszabb illeszkedo href
    if (!items.some(function (i) { return i.active; })) {
      var p = location.pathname.replace(/\/+$/, "") || "/", best = null;
      items.forEach(function (i) {
        var h = (i.href || "").replace(/\/+$/, "") || "/";
        if (i.href && (p === h || (h !== "/" && p.indexOf(h + "/") === 0)) && (!best || h.length > best.h.length)) best = { i: i, h: h };
      });
      if (best) best.i.active = true;
    }
    // egyetlen kereso: a "Szakmai kereso" menupont nincs (a Jogi MI kereso "Szakmai kereso" kapcsolojara kerult)
    // menupont-atnevezes (magyar): "Jogi hirek" -> "Hirek"
    if (PAGE_LANG === "hu") {
      items.forEach(function (it) { if (it.label === "Jogi hírek") it.label = "Hírek"; });
      // a "Hirek" az utolso menupont
      var news = items.filter(function (it) { return it.label === "Hírek"; })[0];
      if (news) { items.splice(items.indexOf(news), 1); items.push(news); }
    }
    var res = mergeSearch(groupGazettes(items.filter(function (it) { return !/\/szakmai-jogi-informacio-kereso\/?$/.test((it.href || "").split(/[?#]/)[0]); })));
    // magyar: a "Kozlemenyek" a 4. menupont
    if (PAGE_LANG === "hu") {
      var gi = -1; res.forEach(function (it, n) { if (it.gazettes) gi = n; });
      if (gi !== -1) { var g = res.splice(gi, 1)[0]; res.splice(Math.min(3, res.length), 0, g); }
    }
    // a "Hasznos linkek" az utolso menupont (minden nyelven)
    var ui = -1; res.forEach(function (it, n) { if (it.label === (USEFUL[PAGE_LANG] || USEFUL.en)) ui = n; });
    if (ui !== -1 && ui !== res.length - 1) res.push(res.splice(ui, 1)[0]);
    return res;
  }
  // A Kezdolap = a Jogi MI kereso (a teljes kereso a Kezdolapon van): egyetlen menupont, "Jogi MI kereso"
  // felirattal a Kezdolapra mutat; a regi, kulon "Jogi MI kereso" menupont megszunik.
  function mergeSearch(items) {
    var home = (LANG_PREFIX || "/").replace(/(.)\/+$/, "$1");
    var isSearch = function (it) { return /\/jogi-informacio-kereso\/?$/.test((it.href || "").split(/[?#]/)[0]); };
    var isHome = function (it) { return (it.href || "").split(/[?#]/)[0].replace(/(.)\/+$/, "$1") === home && !it.icon; };
    var search = items.filter(isSearch)[0];
    if (!search) return items;
    var homeItem = items.filter(isHome)[0];
    var onSearch = /\/(szakmai-)?jogi-informacio-kereso\/?$/.test(location.pathname);
    var out = [];
    items.forEach(function (it) {
      if (it === search) { if (!homeItem) { search.href = home; search.active = search.active || onSearch || (location.pathname.replace(/(.)\/+$/, "$1") === home); out.push(search); } return; }
      if (it === homeItem) {
        it.label = search.label;
        // csak a Kezdolapon (vagy a kereso oldalain) aktiv; mas oldalon (pl. Osszes keresesem) a statikus HTML "active" jelolese nem ervenyes
        it.active = onSearch || location.pathname.replace(/(.)\/+$/, "$1") === home;
      }
      out.push(it);
    });
    return out;
  }
  // Informaciosszerkezet: "Aktualis Magyar Kozlonyok", "Agazati kozlonyok" es "Archiv agazati
  // kozlonyok" egyetlen "Kozlonyok" legordulo alatt (fomenu + mobil fiok is ebbol epul).
  var GAZETTES = { hu: "Közlemények", en: "Gazettes", de: "Amtsblätter", fr: "Journaux officiels", es: "Boletines oficiales", it: "Gazzette", zh: "公报" };
  function groupGazettes(items) {
    var P = LANG_PREFIX, paths = [P + "/magyar-kozlony", P + "/agazati-kozlony", P + "/archiv-agazati-kozlony"];
    var norm = function (h) { return (h || "").split(/[?#]/)[0].replace(/\/+$/, ""); };
    var isG = function (it) {
      return paths.indexOf(norm(it.href)) !== -1 || it.sub.some(function (x) { return paths.indexOf(norm(x.href)) !== -1; });
    };
    var hit = items.filter(isG);
    if (hit.length < 2) return items;
    var cur = location.pathname.replace(/\/+$/, "") || "/";
    var sub = [];
    hit.forEach(function (it) {
      var kids = it.sub.length ? it.sub : [{ label: it.label, href: it.href, ext: false }];
      kids.forEach(function (k) {
        if (sub.some(function (x) { return norm(x.href) === norm(k.href); })) return;
        sub.push({ label: k.label, href: k.href, ext: k.ext, cur: norm(k.href) === cur });
      });
    });
    sub.sort(function (a, b) { return paths.indexOf(norm(a.href)) - paths.indexOf(norm(b.href)); });
    var group = { gazettes: true, label: GAZETTES[PAGE_LANG] || GAZETTES.en, href: null, active: hit.some(function (it) { return it.active; }), sub: sub, icon: null };
    var out = [], placed = false;
    items.forEach(function (it) {
      if (hit.indexOf(it) === -1) out.push(it);
      else if (!placed) { out.push(group); placed = true; }
    });
    return out;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function buildNav(items) {
    var html = "";
    items.forEach(function (it, i) {
      var sub = it.sub.length ? it.sub : null;
      var cls = (sub ? "ms-has-sub" : "") + (it.active ? " is-active" : "");
      var cur = it.active ? ' aria-current="page"' : "";
      var subId = "ms-sub-" + i;
      var inner;
      if (sub && !it.href) {
        inner = '<button type="button" class="ms-nav-link ms-sub-trigger" aria-expanded="false" aria-controls="' + subId + '">' +
                "<span>" + esc(it.label) + "</span>" + CHEVRON + "</button>";
      } else if (sub) {
        // a link Enterre navigal, Space/Le nyitja az almenut
        inner = '<a class="ms-nav-link ms-sub-trigger" href="' + esc(it.href) + '" aria-expanded="false" aria-controls="' + subId + '"' + cur + ">" +
                "<span>" + esc(it.label) + "</span>" + CHEVRON + "</a>";
      } else {
        inner = '<a class="ms-nav-link" href="' + esc(it.href || "/") + '"' + cur + ">" +
                (it.icon ? '<dap-ds-icon name="' + esc(it.icon) + '" size="sm" aria-hidden="true"></dap-ds-icon>' : "") +
                esc(it.label) + "</a>";
      }
      if (sub) {
        inner += '<ul class="ms-submenu" id="' + subId + '">' + sub.map(function (s) {
          return '<li><a href="' + esc(s.href) + '"' + (s.cur ? ' aria-current="page"' : "") + (s.ext ? ' target="_blank" rel="noopener"' : "") + ">" +
                 "<span>" + esc(s.label) + "</span>" + (s.ext ? EXT + '<span class="a11y-sr-only"> ' + NEW_WIN + "</span>" : "") + "</a></li>";
        }).join("") + "</ul>";
      }
      html += "<li" + (cls.trim() ? ' class="' + cls.trim() + '"' : "") + ">" + inner + "</li>";
    });
    // egyetlen <nav> az oldalon: a fomenu a fejlec <nav>-jaba kerul (oneNav), maga <div>
    var nav = D.createElement("div");
    nav.className = "ms-mainnav";
    nav.innerHTML = '<ul class="ms-mainnav-list">' + html + "</ul>";
    nav.querySelectorAll(".ms-has-sub").forEach(initSubmenu);
    return nav;
  }
  function initSubmenu(li) {
    var trigger = li.querySelector(":scope > .ms-sub-trigger");
    var submenu = li.querySelector(":scope > .ms-submenu");
    var isLink = trigger.tagName === "A";
    function items() { return Array.prototype.slice.call(submenu.querySelectorAll("a[href]")); }
    function open(which) {
      li.classList.remove("is-dismissed");
      li.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      var it = items();
      if (it.length && which) { void submenu.offsetWidth; it[which === "last" ? it.length - 1 : 0].focus(); }
    }
    function close(refocus) {
      li.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      if (refocus) trigger.focus();
    }
    trigger.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowDown") { e.preventDefault(); open("first"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); open("last"); }
      else if (e.key === "Enter" && !isLink) { e.preventDefault(); open("first"); }
      else if (e.key === "Escape") { if (li.classList.contains("is-open")) { e.preventDefault(); close(true); } }
    });
    if (!isLink) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        if (li.classList.contains("is-open")) close(false); else open(e.detail === 0 ? "first" : null);
      });
    }
    submenu.addEventListener("keydown", function (e) {
      var it = items(); if (!it.length) return;
      var idx = it.indexOf(D.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); it[(idx + 1) % it.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); it[(idx - 1 + it.length) % it.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); it[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); it[it.length - 1].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
    });
    li.addEventListener("focusout", function (e) { if (!e.relatedTarget || !li.contains(e.relatedTarget)) close(false); });
    // hoverrel megnyitott panel Escape-re eltunik, es csak az eger tavozasa utan
    // nyilik ujra hoverre (WCAG 1.4.13 - elutasithato)
    li.addEventListener("mouseleave", function () { li.classList.remove("is-dismissed"); });
    D.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && li.matches(":hover")) { li.classList.add("is-dismissed"); close(false); }
    });
  }
  function mainNav() {
    var ds = D.querySelector("nav > dap-ds-navigation-menu.main-navigation");
    if (!ds) return;
    var dsNav = ds.parentElement;
    if (dsNav.nextElementSibling && dsNav.nextElementSibling.classList.contains("ms-mainnav")) return;
    var old = D.querySelector(".ms-mainnav");
    if (old) old.remove();
    dsNav.parentElement.insertBefore(buildNav(readDsMenu(ds)), dsNav.nextSibling);
  }
  // Az eredeti DS-menu (<nav>) csak adatforras: a kepernyoolvasonak ne legyen masodik navigacios landmark.
  // A hidden/aria-hidden/inert/role=none egyutt kivezeti a hozzaferesi fabol, a megjelenesen nem valtoztat
  // (CSS-sel eddig is el volt rejtve).
  function hideSourceNav() {
    D.querySelectorAll("nav > dap-ds-navigation-menu.main-navigation").forEach(function (ds) {
      var n = ds.parentElement;
      if (n.classList.contains("ms-mainnav") || !n.nextElementSibling || !n.nextElementSibling.classList.contains("ms-mainnav")) return;
      setAttr(n, "hidden", ""); setAttr(n, "aria-hidden", "true"); setAttr(n, "role", "none"); setAttr(n, "inert", "");
    });
  }

  /* ============================== 3. Nyelvvalaszto (DS navigation-menu) */
  var LANGS = { "/en/": ["en", "English"], "/de/": ["de", "Deutsch"], "/fr/": ["fr", "Français"], "/es/": ["es", "Español"], "/it/": ["it", "Italiano"], "/zh/": ["zh", "中文"] };
  function langMenu() {
    D.querySelectorAll("dap-ds-navigation-menu").forEach(function (menu) {
      if (menu.parentElement && menu.parentElement.tagName === "NAV") return; // a (rejtett) fomenu
      var isLang = !!menu.querySelector('a[href^="/en/"], a[href^="/de/"]');
      onShadow(menu, function (root) {
        var n = root.querySelector("nav");
        if (!n) return;
        delAttr(n, "aria-orientation");                       // nem megengedett a <nav>-on
        setAttr(n, "aria-label", isLang ? S.langNav : S.menu); // ne legyen 2. "Main navigation"
      });
      if (!isLang) return;
      // a nyelvek neve a sajat nyelvukon hangozzon el (3.1.2)
      menu.querySelectorAll("a[href]").forEach(function (a) {
        var h = a.getAttribute("href");
        Object.keys(LANGS).forEach(function (p) {
          if (h.indexOf(p) === 0) { setAttr(a, "lang", LANGS[p][0]); setAttr(a, "hreflang", LANGS[p][0]); }
        });
      });
      enhanceDsMenuItems(menu);
    });
  }
  // Az aktualisan kivalasztott nyelvre kattintva nincs oldalbetoltes: csak bezarjuk a listat.
  // A window fogo fazisa a dokumentum elott fut (a fejlecbeli "offline-nav-fix" a dokumentumon fogja a linkeket).
  window.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    var item = a && a.closest("dap-ds-navigation-menu-item");
    if (!item || !item.querySelector('a[href^="/en/"], a[href^="/de/"]')) return;
    if (a.closest('[slot="trigger"]')) return;
    var h = a.getAttribute("href") || "", code = "hu";
    Object.keys(LANGS).forEach(function (p) { if (h.indexOf(p) === 0) code = LANGS[p][0]; });
    var cur = ((D.documentElement.getAttribute("lang") || "hu").toLowerCase().split("-")[0]);
    if (code !== cur) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { item.hideDropDown(); } catch (er) {}
    var tr = item.querySelector(':scope > [slot="trigger"]');
    if (tr) tr.focus();
  }, true);
  var hoverOff = function (e) {
    var p = e.composedPath ? e.composedPath() : [];
    for (var i = 0; i < p.length; i++) if (p[i] && p[i].hasAttribute && p[i].hasAttribute("data-ms-nohover")) { e.stopImmediatePropagation(); return; }
  };
  D.addEventListener("mouseover", hoverOff, true);
  D.addEventListener("mousemove", hoverOff, true);
  // A DS legordulo csak <dap-ds-navigation-menu-item> tartalmat kezel billentyuzettel;
  // itt slotolt <a> linkek vannak -> Enter nem nyitott, Tab becsukta a panelt.
  function enhanceDsMenuItems(menu) {
    menu.querySelectorAll("dap-ds-navigation-menu-item").forEach(function (el) {
      // dupla Tab-megallo: <a href><dap-ds-button> -> a kulso link kimarad a sorrendbol
      el.querySelectorAll("a[href]").forEach(function (a) {
        if (!a.closest('[slot="trigger"]') && a.querySelector("dap-ds-button, button")) setAttr(a, "tabindex", "-1");
      });
      if (el.__a11yFix || !(el.hasContent || el.querySelector("a[href]"))) return;
      el.__a11yFix = true;
      var tr = el.querySelector(':scope > [slot="trigger"]');
      function panelItems() {
        var all = el.querySelectorAll("a[href], button, dap-ds-button");
        var arr = Array.prototype.filter.call(all, function (n) { return !n.closest('[slot="trigger"]'); });
        return arr.filter(function (n) { return !arr.some(function (m) { return m !== n && n.contains(m); }); });
      }
      function focusFirst() {
        Promise.resolve(el.updateComplete).then(function () { setTimeout(function () { var it = panelItems(); if (it.length) it[0].focus(); }, 0); });
      }
      // nincs hover-nyitas: a nyelvvalaszto csak kattintasra / Enterre nyilik es zarul.
      // A DS sajat egerkezeloi (mousemove/mouseover) a host-on vannak, ezert a dokumentum
      // fogo fazisaban nyeljuk el oket (lasd hoverOff), a megjelolt elemekre. Ez nem fugg a
      // submenuController letezesetol (az a DS renderelese utan jon letre).
      el.setAttribute("data-ms-nohover", "");
      // a lista helye ugyanaz, mint a tobbi (.ms-submenu) lenyilo menue: a gomb jobb szelehez igazitva (igy nem
      // log ki a menusavbol), asztali nezetben a savval egy magassagban kezdodik (a sav aljatol 2px-re)
      el._updatePlacementForLevel = function () {};
      el.placement = "bottom-end";
      var placeLang = function () { el.offset = window.matchMedia("(min-width: 1280px)").matches ? 15 : 0; };
      placeLang();
      window.addEventListener("resize", placeLang);
      // nyitasi animacio: ugyanaz, mint a tobbi lenyilo menue (.ms-submenu): .12s alatt halvanybol, 4px-rel lentebbrol.
      // A komponens a sajat stilusait ujra beallitja (felulirja a mienket), ezert nyitaskor mindig ujra hozzafuzzuk.
      var animSheet = null;
      var ensureAnim = function () {
        try {
          var sr = el.shadowRoot;
          if (!sr || !("adoptedStyleSheets" in sr) || !window.CSSStyleSheet) return;
          if (!animSheet) {
            animSheet = new CSSStyleSheet();
            animSheet.replaceSync("@keyframes ms-pop-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } } " +
              ".popup--opened { animation: ms-pop-in .12s ease; } @media (prefers-reduced-motion: reduce) { .popup--opened { animation: none; } }");
          }
          if (sr.adoptedStyleSheets.indexOf(animSheet) < 0) sr.adoptedStyleSheets = sr.adoptedStyleSheets.concat(animSheet);
        } catch (er) {}
      };
      ensureAnim();
      var c = el.submenuController;
      if (c) {
        try { c.removeListeners(); } catch (e) {}
        c.addListeners = function () {};
      }
      el.addEventListener("click", function (e) {
        var t = e.target;
        if (!(t && t.closest && t.closest('[slot="trigger"]'))) return;
        e.preventDefault(); e.stopPropagation();
        if (el.opened) el.hideDropDown();
        else {
          placeLang(); ensureAnim(); el.showDropDown(false);
          setTimeout(function () { try { el.updatePosition(); } catch (er) {} }, 60);
        }
      }, true);
      el.addEventListener("focusout", function (e) { if (!e.relatedTarget || !el.contains(e.relatedTarget)) el.hideDropDown(); });
      el.addEventListener("keydown", function (e) {
        var t = e.target, onTr = t && t.closest && t.closest('[slot="trigger"]');
        if (e.key === "Escape") {
          if (!el.opened) return;
          e.preventDefault(); e.stopPropagation(); el.hideDropDown(); if (tr) tr.focus(); return;
        }
        if (onTr && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
          e.preventDefault(); e.stopPropagation();
          if (!el.opened) el.showDropDown(false);
          focusFirst(); return;
        }
        // Enter / Space a nyelv (link) elemen = ugyanaz, mint az egerkattintas: a DS gomb
        // belso <button>-ja nyeli el a billentyut, a kulso <a> sosem kap kattintast.
        if (!onTr && (e.key === "Enter" || e.key === " ")) {
          var link = t && t.closest && t.closest("a[href]");
          if (link && el.contains(link)) { e.preventDefault(); e.stopPropagation(); link.click(); return; }
        }
        // nyitott listaban a Balra/Jobbra nem vihet ki a listabol (a DS menu a szomszedos elemre lepne)
        if (el.opened && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); e.stopPropagation(); return; }
        if (el.opened && /^(ArrowDown|ArrowUp|Home|End)$/.test(e.key)) {
          var items = panelItems(); if (!items.length) return;
          var cur = -1;
          for (var i = 0; i < items.length; i++) if (items[i] === t || items[i].contains(t)) { cur = i; break; }
          e.preventDefault(); e.stopPropagation();
          var next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 :
                     e.key === "ArrowDown" ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length;
          items[next].focus();
        }
      }, true);
      if (tr) {
        delAttr(tr, "aria-controls"); // "dropdown" nem letezo id volt
        // Felolvasas: "Nyelvválasztó, collapsed button. Jelenlegi nyelv: Magyar." -> a nev a nyelvvalaszto
        // neve, az allapot aria-expanded, a jelenlegi nyelv leiras (aria-description)
        var LANG_NAMES = { hu: "Magyar", en: "English", de: "Deutsch", fr: "Français", es: "Español", it: "Italiano", zh: "中文" };
        var pageLang = ((D.documentElement.getAttribute("lang") || "hu").toLowerCase().split("-")[0]);
        var descr = S.curLang.charAt(0).toUpperCase() + S.curLang.slice(1) + ": " + (LANG_NAMES[pageLang] || pageLang) + ".";
        // a gomb allapota (aria-expanded) csak a belso <button>-on legyen: a kulso host elemen
        // (nincs szerepe) a felolvaso kulon "csoportkent" jelentene be
        var cleanHost = function () { ["aria-expanded", "aria-haspopup", "aria-label", "aria-current"].forEach(function (n) { if (tr.hasAttribute(n)) tr.removeAttribute(n); }); };
        var syncInner = function () {
          var b = tr.shadowRoot && tr.shadowRoot.querySelector("button");
          if (!b) return;
          setAttr(b, "aria-label", S.langNav);
          setAttr(b, "aria-description", descr);
          delAttr(b, "aria-haspopup");   // "menu pop-up" helyett egyszeru, osszecsukott/kinyitott gomb
          delAttr(b, "aria-current");    // a gomb nem "current page"
          setAttr(b, "aria-expanded", el.opened ? "true" : "false");
          setAttr(tr, "data-lang-open", el.opened ? "true" : "false"); // a DS "nyitott" stilusa miatt (lasd a11y-fixes.css)
        };
        cleanHost(); syncInner();
        if (!tr.__hostObs && window.MutationObserver) {
          tr.__hostObs = new MutationObserver(function () { cleanHost(); syncInner(); });
          tr.__hostObs.observe(tr, { attributes: true, attributeFilter: ["aria-expanded", "aria-haspopup", "aria-label", "aria-current"] });
          onShadow(tr, function (root) {
            var b = root.querySelector("button");
            if (b) new MutationObserver(syncInner).observe(b, { attributes: true, attributeFilter: ["aria-expanded", "aria-haspopup", "aria-label", "aria-current", "aria-description"] });
          });
          // nyitas/zaras utan (kattintas, billentyu, fokuszvesztes) az allapot frissitese
          ["click", "keydown", "focusout"].forEach(function (ev) {
            el.addEventListener(ev, function () { setTimeout(syncInner, 0); setTimeout(syncInner, 250); }, true);
          });
        }
      }
    });
  }

  /* ==================================================== 4. Landmarkok */
  function landmarks() {
    var up = D.querySelector("nav.header-upper");
    if (up) setAttr(up, "aria-label", S.mainNav);   // a fomenu is ebben az egyetlen <nav>-ban van
    D.querySelectorAll("footer nav").forEach(function (n) { if (!n.getAttribute("aria-label")) setAttr(n, "aria-label", S.footer); });
    var logo = D.querySelector('[class*="szechenyi-terv-plus-logo"]');
    if (logo) { setAttr(logo, "role", "region"); setAttr(logo, "aria-label", "Széchenyi Terv Plusz"); }
  }

  /* =================================================== 5. Cimsorszintek */
  // A DS kartyai H5-tel jelennek meg kozvetlenul H2 (vagy H1) alatt. A tag-et
  // nem csereljuk (React-DOM), hanem aria-level-lel javitjuk a szerkezetet:
  // egy cimsor legfeljebb eggyel lehet melyebb a "szulojenel" (az utolso,
  // nala kisebb tag-szintu cimsor tenyleges szintje). Az azonos szintu
  // testvercimsorok (pl. a kozlonykartyak H5-jei) igy azonos szintet kapnak.
  function headings() {
    var hs = D.querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6, footer h1, footer h2, footer h3, footer h4, footer h5, footer h6");
    var stack = []; // [tagSzint, tenylegesSzint]
    Array.prototype.forEach.call(hs, function (h) {
      if (h.closest("[hidden], [aria-hidden='true']")) return;
      var tag = +h.tagName.charAt(1);
      while (stack.length && stack[stack.length - 1][0] >= tag) stack.pop();
      var parent = stack.length ? stack[stack.length - 1][1] : 0;
      var want = Math.min(tag, parent + 1);
      if (want !== tag) setAttr(h, "aria-level", String(want)); else delAttr(h, "aria-level");
      stack.push([tag, want]);
    });
  }

  /* ========================================= 6. Kepek es duplikalt kep-linkek */
  var PLACEHOLDER_ALT = /^(alt|kép|kep|image|img|picture|foto|fotó)$/i;
  function images() {
    // lablec-logo: nem link, a mellette levo szoveg nem rola szol -> dekorativ
    D.querySelectorAll('footer img[alt="MKNJK Footer Logo"]').forEach(function (img) { setAttr(img, "alt", ""); });
    // a bagoly-ikon dekorativ: ures alt (a mock-search.js a data-ms-owl jelolesbol keresi a forrasat)
    D.querySelectorAll('img[alt="Bagoly Ikon"]').forEach(function (img) { setAttr(img, "data-ms-owl", ""); setAttr(img, "alt", ""); });
    // Szechenyi Terv Plusz: a kep szovege (tamogatasi kozlemeny) legyen az alt
    D.querySelectorAll('[class*="szechenyi-terv-plus-logo"] img').forEach(function (img) { setAttr(img, "alt", S.szechenyi); });
    D.querySelectorAll("main img").forEach(function (img) {
      var alt = img.getAttribute("alt");
      var a = img.closest("a[href]");
      var onlyImg = a && !txt(a);
      if (a && onlyImg) {
        var href = a.getAttribute("href");
        var dup = Array.prototype.some.call(D.querySelectorAll('main a[href="' + CSS.escape(href) + '"]'), function (o) { return o !== a && txt(o); });
        if (dup) {
          // ugyanoda mutato cim-link van mellette -> a kep-link dekorativ
          setAttr(a, "aria-hidden", "true"); setAttr(a, "tabindex", "-1");
          setAttr(img, "alt", "");
          return;
        }
      }
      if (alt !== null && (PLACEHOLDER_ALT.test(alt.trim()) || /^forr[aá]s\s*:/i.test(alt.trim()))) {
        // helyorzo / forrasmegjeloles mint alt -> a kartya cime (ha linkben van), kulonben dekorativ
        var card = img.closest(".dds-card, article, li, div");
        var title = card ? txt(card.querySelector("h1,h2,h3,h4,h5,h6")) : "";
        setAttr(img, "alt", a && title ? title : "");
      }
    });
  }

  /* ====================================== 7. Kozlonykartyak "Reszletek" gombja */
  function gazetteCards() {
    // a DS minden nyelven "Reszletek" aria-label-lel adja (forditatlan) -> data-hook
    D.querySelectorAll('button[aria-label="Részletek"], button[data-a11y-details]').forEach(function (b) {
      setAttr(b, "data-a11y-details", "");
      var card = b.closest(".dds-card");
      if (!card) return;
      var content = card.querySelector(":scope > .dds-card-content");
      var title = txt(card.querySelector("h1,h2,h3,h4,h5,h6"));
      setAttr(b, "type", "button");
      setAttr(b, "aria-label", S.details + (title ? ": " + title : ""));
      var panel = content && content.children.length > 1 ? content.children[content.children.length - 1] : null;
      setAttr(b, "aria-expanded", panel ? "true" : "false");
      if (panel) {
        setAttr(b, "aria-controls", ensureId(panel, "kozlony-reszletek"));
        if (title) { setAttr(panel, "role", "region"); setAttr(panel, "aria-label", title + " – " + S.details.toLowerCase()); }
      } else delAttr(b, "aria-controls");
      // PDF-link ugyanabban a kartyaban: egyedi nev + uj ablak jelzes
      var pdf = card.querySelector(':scope > .dds-card-content > div a[target="_blank"]');
      if (pdf && /pdf/i.test(txt(pdf)) && title) setAttr(pdf, "aria-label", txt(pdf) + ": " + title + " " + NEW_WIN);
    });
  }

  /* ========== 7d. Legordulok: a nyilo lista pontosan olyan szeles, mint a mezo, amelybol nyilik (minden kepernyon, minden oldalon)
     A lista a komponens belso dap-ds-popup elemenek shadow DOM-jaban van, a szelesseget a komponens maga felulirja,
     ezert stilust fuzunk a popup shadow root-jahoz; a mezo szelesseget CSS valtozoban (--ms-pop-w) adjuk at. */
  (function () {
    var POP_CSS = null, POP_H_CSS = null;
    var DD = /^DAP-DS-(SELECT|COMBOBOX)$/;
    function popups(root, out) {
      if (!root || !root.querySelectorAll) return out;
      Array.prototype.forEach.call(root.querySelectorAll("*"), function (n) {
        if (n.tagName === "DAP-DS-POPUP") out.push(n);
        if (n.shadowRoot) popups(n.shadowRoot, out);
      });
      return out;
    }
    function syncPopW(el) {
      el.style.setProperty("--ms-pop-w", Math.round(el.getBoundingClientRect().width) + "px");
      // a Keresesi beallitasok ablakban: ha a lista nem fer el a mezo alatt az ablak teruleten belul, felfele nyilik
      var dlg = el.closest && el.closest(".ms-settings-dialog");
      if (dlg && !el.opened) {
        var fr = el.getBoundingClientRect(), dr = dlg.getBoundingClientRect();
        var count = el.querySelectorAll("dap-ds-option-item").length;
        var need = Math.min(250, count * 36 + 16);
        var below = dr.bottom - fr.bottom - 8, above = fr.top - dr.top - 8;
        var up = below < need && above > below;
        el.setAttribute("placement", up ? "top-start" : "bottom-start");
        // a lista sosem log ki az ablak teruleterol: ha kevesebb a hely, alacsonyabb lesz (belul gorgetheto)
        el.style.setProperty("--ms-pop-h", Math.max(96, Math.min(250, Math.floor(up ? above : below))) + "px");
      }
      popups(el.shadowRoot, []).forEach(function (pu) {
        var sr = pu.shadowRoot;
        if (!sr || sr.__msPopW || !("adoptedStyleSheets" in sr) || !window.CSSStyleSheet) return;
        try {
          if (!POP_CSS) { POP_CSS = new CSSStyleSheet(); POP_CSS.replaceSync(".popup { width: var(--ms-pop-w) !important; box-sizing: border-box; }"); }
          sr.adoptedStyleSheets = sr.adoptedStyleSheets.concat(POP_CSS); sr.__msPopW = true;
        } catch (e) {}
        // a Keresesi beallitasok ablakban minden legordulo lista legfeljebb 250px magas (belul gorgetheto)
        if (!sr.__msPopH && el.closest && el.closest(".ms-settings-dialog")) {
          try {
            if (!POP_H_CSS) { POP_H_CSS = new CSSStyleSheet(); POP_H_CSS.replaceSync(".popup { max-height: var(--ms-pop-h, 250px) !important; overflow-y: auto; }"); }
            sr.adoptedStyleSheets = sr.adoptedStyleSheets.concat(POP_H_CSS); sr.__msPopH = true;
          } catch (e) {}
        }
      });
    }
    ["pointerdown", "focusin", "keydown", "input", "click"].forEach(function (ev) {
      window.addEventListener(ev, function (e) {
        var path = e.composedPath ? e.composedPath() : [], el = null;
        for (var i = 0; i < path.length; i++) { if (path[i] && path[i].tagName && DD.test(path[i].tagName)) { el = path[i]; break; } }
        if (!el) return;
        syncPopW(el);
        setTimeout(function () { syncPopW(el); }, 120);
      }, true);
    });
  })();

  /* ========== 7e. Legordulok (dap-ds-select): Tab ne ragadjon a listaban (2.1.2) */
  // A DS nyitott listaja elnyeli a Tabot: csak Escape-pel lehet kilepni (az elesen
  // is). Nativ <select> / APG "select-only combobox" mintara: nyitott listaban a
  // Tab (es Shift+Tab) kivalasztja a fokuszalt elemet, bezarja a listat, es a
  // fokusz a kovetkezo (elozo) elemre lep.
  window.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
    var path = e.composedPath ? e.composedPath() : [], sel = null, opt = null;
    for (var i = 0; i < path.length; i++) {
      var n = path[i];
      if (!n || !n.tagName) continue;
      if (!opt && n.tagName === "DAP-DS-OPTION-ITEM") opt = n;
      if (n.tagName === "DAP-DS-SELECT") { sel = n; break; }
    }
    if (!sel || !sel.opened) return;
    e.stopImmediatePropagation(); // a DS ne kapja meg (az tartja bent a fokuszt)
    if (opt && !opt.hasAttribute("disabled") && opt.getAttribute("aria-disabled") !== "true") {
      opt.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, composed: true, cancelable: true }));
    }
    if (sel.opened && sel.hideDropDown) sel.hideDropDown();
    var trig = sel.shadowRoot && sel.shadowRoot.querySelector('[role="combobox"]');
    if (trig) trig.focus(); // innen lep tovabb a bongeszo alapertelmezett Tab-lepese
  }, true);

  /* ============ 7d. Hero: nagyobb szoveg/szovegkoz ne lojon a fejlec ala (1.4.12, 1.4.4) */
  // A kereso-hero (.search-hero) abszolut pozicionalt, alulra igazitott doboz egy
  // rogzitett magassagu szulobe. Nagyobb betumeretnel / szovegkozoknel (pl. 400%-os
  // nagyitas + 1.4.12-es szovegkoz) felfele novekszik, es a H1 teteje a fejlec moge
  // kerul. Csak ilyenkor noveljuk a szulo magassagat -> normal nezetben nincs valtozas.
  var heroRO = window.ResizeObserver ? new ResizeObserver(function () { schedule(); }) : null;
  function heroOverflow() {
    D.querySelectorAll(".search-hero").forEach(function (h) {
      var p = h.parentElement;
      if (!p || getComputedStyle(h).position !== "absolute") return;
      if (heroRO && !h.__a11yRO) { h.__a11yRO = true; heroRO.observe(h); }
      p.style.minHeight = "";
      var need = Math.ceil(h.getBoundingClientRect().height);
      var next = need > p.clientHeight + 1 ? need + "px" : "";
      p.style.minHeight = next;
    });
  }

  /* ===== 7c. Jogszabaly-szoveg a kozlony reszleteiben (1.3.1, 2.4.6, 4.1.2) */
  // A kibontott jogszabaly-sorban az MI-osszefoglalo cimkezett regio, de utana a
  // teljes jogszabaly-szoveg cim nelkul folyik; a benne levo (gorgetheto, ezert a
  // Chrome altal fokuszalhato) tablazatoknak nincs nevuk ("tablazat").
  function lawTexts() {
    D.querySelectorAll("main .ck-content").forEach(function (ck) {
      var p = ck.parentElement, head = null;
      while (p && p !== D.body && !(head = p.querySelector("h6, h5"))) p = p.parentElement;
      var law = head ? txt(head) : "";
      if (!ck.getAttribute("aria-label")) { setAttr(ck, "role", "region"); setAttr(ck, "aria-label", (law ? law + " – " : "") + S.lawText); }
      ck.querySelectorAll("table").forEach(function (t, i) {
        if (t.querySelector("caption") || t.getAttribute("aria-label")) return;
        var prev = t.previousElementSibling, ctx = prev ? txt(prev) : "";
        setAttr(t, "aria-label", S.table + " " + (i + 1) + (ctx && ctx.length <= 120 ? ": " + ctx : law ? " – " + law : ""));
      });
    });
  }

  /* ========== 7b. Ikongombok neve (4.1.2) + kozlony-reszletek sorainak lenyitoi */
  // A dap-ds-icon-button aria-label-je a HOST-on van, a shadow DOM-beli valodi
  // <button>-ig nem jut el -> a felolvaso csak annyit mond: "gomb". Atmasoljuk.
  // A kozlony reszletei kozott minden jogszabaly-sornak van egy lenyito gombja
  // "Elemi egység" (semmitmondo) cimkevel: "Részletek: <jogszabaly>" + allapot.
  function iconButtonNames() {
    D.querySelectorAll("dap-ds-icon-button[aria-label]").forEach(function (h) {
      if (h.closest("#mock-search-bar")) return; // a mock kereso maga kezeli
      var lbl = h.getAttribute("aria-label");
      var unit = lbl === "Elemi egység";
      if (unit) {
        var head = h.parentElement && h.parentElement.querySelector("h1,h2,h3,h4,h5,h6");
        lbl = S.details + (head ? ": " + txt(head) : "");
      }
      onShadow(h, function (root) {
        var b = root.querySelector("button");
        if (!b) return;
        setAttr(b, "aria-label", lbl);
        if (unit) {
          var ic = root.querySelector("dap-ds-icon[name]");
          if (ic) setAttr(b, "aria-expanded", /arrow-up/.test(ic.getAttribute("name")) ? "true" : "false");
        }
      });
    });
  }

  /* ====================================== 8. Uj ablakban nyilo linkek */
  function newWindowLinks() {
    D.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      if (a.closest(".ms-mainnav")) return;
      var name = a.getAttribute("aria-label");
      if (name && NEW_WIN_RE.test(name)) return;
      if (NEW_WIN_RE.test(txt(a))) return;
      var base = name || txt(a);
      if (!base) {
        var img = a.querySelector("img[alt]");
        base = img ? img.getAttribute("alt") : "";
        if (/^rss$/i.test(base)) base = S.rss;
      }
      if (base) setAttr(a, "aria-label", base + " " + NEW_WIN);
    });
  }

  /* ============================================ 9. Angol nyelvu dialog */
  function langDialog() {
    D.querySelectorAll('[role="dialog"], [role="alertdialog"], dialog').forEach(function (d) {
      if (/browser language differs|Would you like to use this language/i.test(d.textContent)) setAttr(d, "lang", "en");
    });
  }

  /* ========================================= 10. Suti-/EIR-tajekoztato */
  function consentBanner() {
    var banner = null;
    Array.prototype.some.call(D.querySelectorAll("body > div.fixed"), function (d) {
      if (/sütik|EIR|cookie|Cookie|IRS|SIR|信息|информ/i.test(d.textContent) && d.querySelector("button") && !d.querySelector("nav, img")) { banner = d; return true; }
      return false;
    });
    var html = D.documentElement;
    if (!banner || !isVisible(banner)) {
      html.style.removeProperty("scroll-padding-bottom");
      var lg0 = D.querySelector('[class*="szechenyi-terv-plus-logo"].fixed'); if (lg0) lg0.style.removeProperty("bottom");
      D.querySelectorAll("[data-consent-inert]").forEach(function (n) { n.removeAttribute("inert"); n.removeAttribute("data-consent-inert"); });
      return;
    }
    // Nem modalis: a felhasznalo a sav elhagyhatja (Tab / kattintas), a lap tobbi resze elerheto marad.
    delAttr(banner, "aria-modal");
    // Billentyuzettel a fokusz nem hagyhatja el a suti-ablakot: a Tab/Shift+Tab az ablak (kontener) es a gombjai
    // kozott korbe jar, amig az ablak nyitva van (a "Rendben" bezarja). Kivulrol erkezo Tab is az ablakra visz.
    if (!banner.__tabTrap) {
      banner.__tabTrap = true;
      D.addEventListener("keydown", function (e) {
        if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
        var b = D.querySelector(".a11y-consent-banner");
        if (!b || !isVisible(b)) return;
        var items = [b].concat(Array.prototype.slice.call(b.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter(isVisible));
        var ae = D.activeElement;
        var i = items.indexOf(ae);
        if (i === -1 && !(ae && b.contains(ae))) {          // a fokusz az ablakon kivul van
          e.preventDefault(); (e.shiftKey ? items[items.length - 1] : items[0]).focus({ preventScroll: true }); return;
        }
        if (i === -1) return;
        var n = e.shiftKey ? (i === 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
        e.preventDefault(); items[n].focus({ preventScroll: true });
      }, true);
    }
    D.querySelectorAll("[data-consent-inert]").forEach(function (n) { n.removeAttribute("inert"); n.removeAttribute("data-consent-inert"); });
    banner.classList.add("a11y-consent-banner");
    // nem-modalis dialog: a felolvaso fokuszaltakor bemondja a nevet + a szoveget
    setAttr(banner, "role", "dialog");
    setAttr(banner, "aria-label", S.consent);
    var txtBox = banner.querySelector(":scope > div:first-child");
    if (txtBox) setAttr(banner, "aria-describedby", ensureId(txtBox, "suti-szoveg"));
    // cim a szoveg folott (a dap.gov.hu suti-ablakanak mintajara); a nev ugyanaz, mint a dialog aria-label-je
    if (!banner.querySelector(".a11y-consent-title")) {
      var ct = D.createElement("p"); ct.className = "a11y-consent-title"; ct.setAttribute("aria-hidden", "true"); ct.textContent = S.consent;
      banner.insertBefore(ct, banner.firstChild);
    }
    // FIGYELEM: scroll-padding-bottom-ot NEM allitunk. A legordulok (dap-ds-select)
    // nyitaskor fokuszt adnak egy listaelemnek; a scroll-padding miatt a bongeszo
    // ilyenkor odagorgette az oldalt, a DS popup gorgetesre bezarult, a fokusz
    // elveszett -> a Kozlonyszam/Ev/Honap legordulo billentyuzettel hasznalhatatlan
    // volt. A fokusz kitakarasat (2.4.11) a lenti focusin-kezelo oldja meg.
    html.style.removeProperty("scroll-padding-bottom");
  }
  // A fokuszalt elem ne keruljon a suti-sav vagy a rogzitett Szechenyi-logo
  // moge (2.4.11): ha atfedes van, felgorgetunk annyit, hogy latszodjon.
  D.addEventListener("focusin", function () {
    var el = D.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    if (!el || el === D.body) return;
    // parbeszedablakban (dialog) levo elemnel sem: a modalis ablak mogotti oldalt nem gorgetjuk
    if (el.closest && el.closest("dialog")) return;
    // a <main> (nagy tarolo) fokuszanal sem: a kihagyo link ne gorgesse le az oldalt
    if (el.tagName === "MAIN") return;
    // a suti-sav (es gombjai) fokuszanal nem gorgetunk: az oldal gorgetesi helyzete maradjon
    if (el.closest && el.closest(".a11y-consent-banner")) return;
    // Lebego retegek (legordulo lista, popup, menu) belsejeben NEM gorgetunk:
    // a gorgetes bezarja a DS popupot es elveszik a fokusz (a Kozlonyszam-
    // legordulo billentyuzettel hasznalhatatlan lett tole).
    for (var h = el; h; h = h.parentElement || (h.getRootNode && h.getRootNode().host)) {
      var hr = h.getAttribute && h.getAttribute("role");
      if (hr === "option" || hr === "listbox" || hr === "menu" || hr === "menuitem" || /^DAP-DS-(POPUP|OPTION|SELECT|COMBOBOX|DROPDOWN)/.test(h.tagName)) return;
    }
    var covers = [D.querySelector(".a11y-consent-banner"), D.querySelector('[class*="szechenyi-terv-plus-logo"].fixed')]
      .filter(function (c) { return c && isVisible(c) && !c.contains(el) && getComputedStyle(c).position === "fixed"; });
    if (!covers.length) return;
    requestAnimationFrame(function () {
      var a = el.getBoundingClientRect(), need = 0;
      covers.forEach(function (cv) {
        var c = cv.getBoundingClientRect();
        if (a.bottom > c.top && a.top < c.bottom && a.right > c.left && a.left < c.right) need = Math.max(need, a.bottom - c.top + 16);
      });
      if (need) window.scrollBy({ top: need, behavior: "instant" });
    });
  });

  /* ===== 10b. Ertesito-dialogok (nyelvi ajanlat, suti-sav): fokusz (2.4.3, 4.1.3) */
  // Mindket ablak a <body> VEGEN van a DOM-ban, ezert a felolvaso/Tab-bejaras csak
  // az oldal legvegen talalkozna veluk, pedig azonnal valaszt varnak. Betolteskor
  // a fokuszt a (sorrendben elso) ablakra tesszuk - a felolvaso bemondja a nevet es
  // a szoveget, a kovetkezo Tab a gombjara visz. Ha bezarult, a kovetkezo ablak
  // jon; az utolso utan (billentyuzetes hasznalatnal) a lap elejere, az ugro
  // linkre kerul a fokusz. Csak akkor nyulunk a fokuszhoz, ha az "szabad"
  // (body-n van), azaz nem vesszuk el a felhasznalotol.
  // az elso Tab (az oldal elejerol) a suti-savra visz; onnan: Rendben -> ugro link -> logo
  D.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    var ae = D.activeElement;
    if (ae && ae !== D.body && ae !== D.documentElement) return;
    var cb = D.querySelector(".a11y-consent-banner");
    if (!cb || cb.__firstTab || !isVisible(cb)) return;
    cb.__firstTab = true;
    e.preventDefault();
    setAttr(cb, "tabindex", "-1");
    cb.focus({ preventScroll: true });
  }, true);
  // ha a bongeszo sajat feluleterol (cimsor) Tabbal erkezik a fokusz az oldalra, nincs keydown az oldalon:
  // az elsokent fokuszt kapo ugro link helyett is a suti-sav az elso megallo
  D.addEventListener("focusin", function (e) {
    var t = e.target;
    if (e.relatedTarget || !t.classList || !t.classList.contains("skip-to-content")) return;
    var cb = D.querySelector(".a11y-consent-banner");
    if (!cb || cb.__firstTab || !isVisible(cb)) return;
    cb.__firstTab = true;
    setAttr(cb, "tabindex", "-1");
    cb.focus({ preventScroll: true });
  }, true);
  var lastInput = "key";
  D.addEventListener("keydown", function () { lastInput = "key"; }, true);
  D.addEventListener("pointerdown", function () { lastInput = "pointer"; }, true);
  var dlgSeen = [], dlgOpen = [];
  // az ugro linkre csak akkor ugrunk, ha a felhasznalo a sav/ablak gombjaival mar dolgozott (betolteskor nem)
  var dlgUsed = false;
  D.addEventListener("focusin", function (e) {
    if (e.target.closest && e.target.closest(".a11y-notice-dialog, .a11y-consent-banner, [role=dialog]")) dlgUsed = true;
  }, true);
  function noticeDialogs() {
    var list = [];
    var msg = D.getElementById("browser-locale-offer-message");
    var ld = msg && msg.closest('[role="dialog"]');
    if (ld && isVisible(ld)) list.push(ld);
    var cb = D.querySelector(".a11y-consent-banner");
    if (cb && isVisible(cb)) list.push(cb);
    var closed = dlgOpen.some(function (d) { return list.indexOf(d) === -1; });
    dlgOpen = list;
    var ae = D.activeElement;
    // "szabad" a fokusz: body-n van, vagy egy altalunk fokuszalt ablak taroloján
    // (a felhasznalo meg nem lepett bele) - ilyenkor athelyezhetjuk.
    var onBody = !ae || ae === D.body || ae === D.documentElement;
    var onOurs = ae && ae.classList && ae.classList.contains("a11y-notice-dialog");
    if (!onBody && !onOurs) return;
    var target = null;
    for (var i = 0; i < list.length && !target; i++) if (dlgSeen.indexOf(list[i]) === -1) target = list[i];
    if (!target && closed && onBody && list.length) target = list[0]; // a maradek ablak
    if (target) {
      if (dlgSeen.indexOf(target) === -1) dlgSeen.push(target);
      setAttr(target, "tabindex", "-1");
      target.classList.add("a11y-notice-dialog");
      // a suti-sav nem kap automatikus fokuszt: betolteskor a felolvaso eloszor az oldal cimet mondja be,
      // a sav az elso Tab-bal erheto el (lasd cookieFirstTab)
      if (target.classList.contains("a11y-consent-banner")) return;
      if (ae !== target) target.focus({ preventScroll: true });
      return;
    }
    // a suti-ablak bezarasa utan a fokusz NEM ugrik automatikusan az "Ugras a fo tartalomra" linkre:
    // a kovetkezo Tab az oldal elejerol indul (ott az ugro link az elso megallo)
  }

  /* ===== Navbar: minden menupont "gomb" (a linkek is) a kepernyoolvasonak */
  function navButtons() {
    var as = [];
    D.querySelectorAll("nav.header-upper dap-ds-button").forEach(function (h) {
      var a = h.shadowRoot && h.shadowRoot.querySelector("a");
      if (a) as.push(a);
    });
    // a (light DOM) menu/legordulo linkek; a fejlec logoja marad link
    D.querySelectorAll("nav.header-upper a[href]").forEach(function (a) {
      if (!a.querySelector("img")) as.push(a);
    });
    as.forEach(function (a) {
      setAttr(a, "role", "button");
      if (!a.__btnKeys) {
        a.__btnKeys = true;
        // gombkent a Szokoz is aktivalja (a linknek csak az Enter)
        a.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); a.click(); } });
      }
    });
  }

  /* ===== Hibaoldal: erkezeskor a fokusz a hibauzenetre kerul, igy a felolvaso bemondja */
  var errFocused = false;
  function errorScreen() {
    if (errFocused) return;
    var back = D.querySelector("a.ms-error-back");
    var main = back && back.closest("main");
    if (!main) return;
    errFocused = true;
    setAttr(main, "tabindex", "-1");
    main.focus({ preventScroll: true });
  }

  /* ===== Lablecbol elerheto oldalak: az oldalcim a zold savban (mint az "Aktualis Magyar Kozlonyok" oldalon) ===== */
  var FOOTER_PAGE_RE = /^(?:\/(?:en|de|fr|es|it|zh))?\/(kapcsolat|felhasznaloi-kezikonyv|felhasznalasi-feltetelek|akadalymentesitesi-nyilatkozat|adatkezelesi-tajekoztato)\/?$/;
  function footerPageTitle() {
    if (!FOOTER_PAGE_RE.test(location.pathname)) return;
    var main = D.querySelector("main"), hero = main && main.querySelector('[class*="_hero_"]');
    var ph = hero && hero.querySelector(".xl\\:h-\\[41px\\]");
    if (!ph || hero.querySelector(".a11y-page-title")) return;
    var h = main.querySelector("h1.dds-heading:not(.a11y-page-h1-src)");
    if (!h || hero.contains(h)) return;
    var box = D.createElement("div");
    box.className = "a11y-page-title";
    box.innerHTML = '<div class="a11y-page-title-in"><h1 class="dds-heading-inverted dds-typography-h1"></h1></div>';
    box.querySelector("h1").textContent = h.textContent;
    ph.parentNode.appendChild(box);
    // a tartalom ugyanabban az oszlopban/tavolsagra, mint az "Aktualis Magyar Kozlonyok" oldalon
    var content = main.querySelector(':scope > div:not(.relative)');
    if (content && content.firstElementChild) content.firstElementChild.classList.add("a11y-page-content");
    h.classList.add("a11y-page-h1-src");       // az eredeti cim kimarad (nem lesz ketszer oldalcim)
    docCards(main);
    contactSplit(main);
    termsToc(main);
  }

  /* Kapcsolat oldal: ketto egymas melletti szegmens (2/3 + 1/3). A masodik az uzemelteto cegadatait es az elerhetosegeket tartalmazza.
     A szoveg a React innerHTML-jebol jon, amit ujrarenderelés visszaallithat: ezert az eredeti csomopontokat nem toroljuk, hanem
     elrejtjuk (a-contact-src), es a rejtest MutationObserver ujra elvegzi, ha a React visszaallitja a tartalmat. */
  function contactSplit(main) {
    if (!/\/kapcsolat\/?$/.test(location.pathname)) return;
    var ck = main.querySelector(".a11y-page-content .ck-content");
    if (!ck || ck.__a11ySplit) return;
    var parts = contactParts(ck);
    if (!parts) return;
    ck.__a11ySplit = true;
    var aside = D.createElement("aside");
    aside.className = "a11y-contact-aside";
    var p1 = D.createElement("p"); p1.textContent = parts.sentence;
    aside.appendChild(p1);
    if (parts.ids) {
      var ids = D.createElement("p");
      ids.appendChild(D.createTextNode(parts.ids[0]));
      ids.appendChild(D.createElement("br"));
      ids.appendChild(D.createTextNode(parts.ids[1]));
      aside.appendChild(ids);
    }
    var contact = parts.contact.cloneNode(true), lead = contact.querySelector(":scope > span"), lbr = contact.querySelector(":scope > br");
    if (lead && lbr) {   // a "Kapcsolat:" felirat h3 cim lesz, kettospont nelkul
      var h = D.createElement("h3");
      h.className = "dds-typography dds-heading dds-typography-h5";
      h.textContent = lead.textContent.replace(/[\s\u00a0]*[:：]\s*$/, "");
      lead.remove(); lbr.remove();
      aside.appendChild(h);
    }
    aside.appendChild(contact);
    var split = D.createElement("div");
    split.className = "a11y-contact-split";
    ck.parentNode.insertBefore(split, ck);
    split.appendChild(ck); split.appendChild(aside);
    var apply = function () { hideContactSrc(ck); };
    apply();
    new MutationObserver(apply).observe(ck, { childList: true, subtree: true });
  }
  /* Felhasznalasi feltetelek + Adatkezelesi tajekoztato: mint a dap.gov.hu/aszf oldal - balra a szoveg, jobbra tapadó (sticky) "Tartalom" kartya a fejezetcimekkel (h3).
     A szoveg a React innerHTML-jebol jon: a cimek id-jet MutationObserver allitja vissza, ha a React ujrarendereli a tartalmat. */
  var TOC_LABEL = { hu: "Tartalom", en: "Contents", de: "Inhalt", fr: "Sommaire", es: "Contenido", it: "Indice", zh: "目录" };
  function termsToc(main) {
    if (!/\/(?:felhasznalasi-feltetelek|adatkezelesi-tajekoztato)\/?$/.test(location.pathname)) return;
    var ck = main.querySelector(".a11y-page-content .ck-content");
    if (!ck || ck.__a11yToc) return;
    var lm = /^\/(en|de|fr|es|it|zh)\//.exec(location.pathname), lang = lm ? lm[1] : "hu";
    var setIds = function () {
      var used = {};
      // a szerkeszto a szamozas utan nbsp-sorozatot hagy a cimekben ("1.      Altalanos ...") - egyetlen szokozre tomorites
      [].forEach.call(ck.querySelectorAll(":scope > h3, :scope > h4"), function (h) {
        var w = D.createTreeWalker(h, NodeFilter.SHOW_TEXT), n;
        while ((n = w.nextNode())) { var v = n.nodeValue.replace(/[\s\u00a0]{2,}/g, " "); if (v !== n.nodeValue) n.nodeValue = v; }
      });
      // Adatkezelesi tajekoztato (HU): a ket kozepre igazitott alcim (h3) egyetlen, 18 px-es bekezdesse olvad
      if (/^\/adatkezelesi-tajekoztato\/?$/.test(location.pathname) && !ck.querySelector(":scope > p.a11y-merged-title")) {
        var sub = ck.querySelectorAll(":scope > h3.text-align-center");
        if (sub.length >= 2) {
          var m2 = D.createElement("p");
          m2.className = "a11y-merged-title";
          m2.appendChild(D.createTextNode("Adatkezelési tájékoztató " + sub[0].textContent.replace(/[\s\u00a0]+/g, " ").trim()));
          m2.appendChild(D.createTextNode(" " + sub[1].textContent.replace(/[\s\u00a0]+/g, " ").trim()));
          sub[0].parentNode.insertBefore(m2, sub[0]);
          sub[0].classList.add("a11y-contact-src"); sub[1].classList.add("a11y-contact-src");
        }
      }
      // Felhasznalasi feltetelek (HU): a csupa nagybetus alcim (h2) 18 px-es, normal kis/nagybetus bekezdes lesz
      if (/^\/felhasznalasi-feltetelek\/?$/.test(location.pathname) && !ck.querySelector(":scope > p.a11y-merged-title")) {
        var h2s = ck.querySelectorAll(":scope > h2.text-align-center");
        if (h2s.length >= 2) {
          var m3 = D.createElement("p");
          m3.className = "a11y-merged-title";
          m3.textContent = "Felhasználási feltételek a Nemzeti Jogszabálytárhoz és a mesterséges intelligencia alapú keresőhöz";
          h2s[1].parentNode.insertBefore(m3, h2s[1]);
          h2s[1].classList.add("a11y-contact-src");
        }
      }
      // a tartalom elso cime ugyanaz, mint az oldalcim (zold sav): elrejtjuk, hogy ne ismetlodjon
      var h1 = main.querySelector("h1.a11y-page-h1-src"), t0 = ck.querySelector(":scope > h2");
      var norm = function (x) { return x.replace(/[\s\u00a0]+/g, " ").trim().toLowerCase(); };
      if (h1 && t0 && norm(t0.textContent) === norm(h1.textContent)) t0.classList.add("a11y-contact-src");
      [].forEach.call(ck.querySelectorAll(":scope > h3:not(.text-align-center)"), function (h) {   // a kozepre igazitott h3-ak a cim alcimei, nem fejezetek
        h.classList.add("dds-anchor");   // ezt a osztalyt keresi a dap-ds-toc
        if (h.id) return;
        var id = h.textContent.replace(/[\s\u00a0]+/g, " ").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "fejezet";
        while (used[id] || D.getElementById(id)) id += "-";
        used[id] = 1; h.id = id;
      });
    };
    setIds();
    if (!ck.querySelector(":scope > h3:not(.text-align-center)")) return;
    ck.__a11yToc = true;
    var split = D.createElement("div");
    split.className = "a11y-terms-split";
    var aside = D.createElement("aside");
    aside.className = "a11y-terms-aside";
    var toc = D.createElement("dap-ds-toc");
    toc.setAttribute("header", TOC_LABEL[lang] || TOC_LABEL.en);
    toc.setAttribute("noindent", "true");
    toc.setAttribute("minheadinglevel", "3");
    toc.setAttribute("maxheadinglevel", "3");
    toc.setAttribute("size", "lg");
    toc.setAttribute("rootmargin", "0px 0px -76% 0px");
    toc.setAttribute("lastanchorrootmargin", "0px 0px -79% 0px");
    aside.appendChild(toc);
    // A hosszu (tobb ezer px) smooth-scroll animacio akadozonak/"megallonak" tunik: a fejezetre azonnal ugrunk, a fokuszt is oda tesszuk.
    toc.addEventListener("click", function (e) {
      var a = e.composedPath().filter(function (n) { return n.tagName === "A"; })[0];
      var href = a && a.getAttribute("href");
      if (!href || href.charAt(0) !== "#" || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var target = D.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 96;
      window.scrollTo({ top: Math.max(top, 0), behavior: "instant" });
      try { history.pushState(null, "", href); } catch (_) {}
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
    ck.parentNode.insertBefore(split, ck);
    split.appendChild(aside); split.appendChild(ck);
    new MutationObserver(setIds).observe(ck, { childList: true, subtree: true });
  }
  function contactParts(ck) {
    var ps = ck.querySelectorAll(":scope > p"), n = ps.length;
    if (n < 2) return null;
    var op = ps[n - 2], spans = op.querySelectorAll(":scope > span");
    if (op.querySelectorAll(":scope > br").length < 2 || !spans.length) return null;
    var text = spans[spans.length - 1].textContent.replace(/\u00a0/g, " ");
    var cap = function (t) { return t.charAt(0).toUpperCase() + t.slice(1); };
    var m = /\s*\(([^()]*?:\s*[\d-]+),\s*([^()]*?:\s*[\d-]+)\)/.exec(text);
    return { sentence: m ? text.replace(m[0], "") : text, ids: m ? [cap(m[1]), cap(m[2])] : null, contact: ps[n - 1] };
  }
  function hideContactSrc(ck) {
    var ps = ck.querySelectorAll(":scope > p"), n = ps.length;
    if (n < 2) return;
    var hide = function (el) { if (el && !el.classList.contains("a11y-contact-src")) el.classList.add("a11y-contact-src"); };
    hide(ps[n - 1]);
    var op = ps[n - 2], spans = op.querySelectorAll(":scope > span");
    hide(spans[spans.length - 1]);
    [].forEach.call(op.querySelectorAll(":scope > br"), hide);
    var first = ps[0];   // az ures szerkesztoi bekezdes elcsusztatna a ket szegmens tetejet
    if (!first.textContent.replace(/\u00a0/g, "").trim()) hide(first);
  }

  /* A "Letoltheto dokumentumok" lista (Felhasznaloi kezikonyv, Akadalymentesitesi nyilatkozat) ugyanolyan h2 + kartya elrendezes,
     mint az "Aktualis Magyar Kozlonyok" oldal listaja: egy kartya dokumentumonkent (cim + meret, jobbra "PDF letoltese" gomb). */
  function docCards(main) {
    var h3 = [].slice.call(main.querySelectorAll("h3.dds-heading")).filter(function (x) { return x.nextElementSibling && x.nextElementSibling.querySelector(".document-divider, a.dds-link[href$='.pdf']"); })[0];
    var list = h3 && h3.nextElementSibling;
    if (!h3 || !list || list.getAttribute("data-a11y-cards")) return;
    var docs = [].slice.call(list.querySelectorAll("a.dds-link")).map(function (a) {
      var sm = a.parentElement && a.parentElement.querySelector("small");
      return { href: a.getAttribute("href"), title: (a.querySelector("span") || a).textContent.trim(), size: sm ? sm.textContent.replace(/[()]/g, "").trim() : "" };
    });
    if (!docs.length) return;
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var h2 = D.createElement("h2");
    h2.className = "dds-heading dds-typography-h2";
    h2.textContent = h3.textContent;
    var wrap = D.createElement("div");
    wrap.className = "flex flex-col gap-(--dds-spacing-200) lg:gap-(--dds-spacing-400)";
    wrap.setAttribute("data-a11y-cards", "1");
    wrap.innerHTML = docs.map(function (d) {
      return '<div class="dds-card" style="border-radius: var(--dds-radius-base); background-color: var(--dds-white-70);"><span class="dds-card-content"><div class="">' +
        '<div class="flex flex-col lg:flex-row justify-between w-full p-(--dds-spacing-400) lg:p-(--dds-spacing-800)">' +
        '<div class="flex flex-col gap-(--dds-spacing-200)"><div><h5 class="dds-heading dds-typography-h5" aria-level="3">' + esc(d.title) + '</h5>' +
        (d.size ? '<p class="dds-typography typography-body dds-typography-size--sm text-(--dds-text-neutral-subtle)">' + esc(d.size) + '</p>' : "") + '</div><div class="flex flex-row gap-(--dds-spacing-400)"></div></div>' +
        '<div class="pt-(--dds-spacing-400) lg:pt-0 lg:self-center"><a href="' + esc(d.href) + '" class="dds-button dds-button--primary dds-button--md dds-button-square" aria-label="PDF megnyitása: ' + esc(d.title) + (d.size ? " (" + esc(d.size) + ")" : "") + '">PDF megnyitása</a></div>' +
        '</div></div></span></div>';
    }).join("");
    h3.replaceWith(h2);
    list.replaceWith(wrap);
  }

  /* ============================================= 11. Mobil hamburgermenu */
  var menuState = { open: false, opener: null };
  function mobileMenu() {
    var openerHost = D.querySelector('dap-ds-button[aria-label="Menü"]');
    var closeHost = D.querySelector('dap-ds-button[aria-label="Menü bezárása"]');
    var drawer = closeHost && closeHost.closest("dap-ds-sidenav, aside, [class*=sidenav], div.fixed");
    var isOpen = !!(closeHost && isVisible(closeHost));
    if (openerHost) onShadow(openerHost, function (root) {
      var b = root.querySelector("button");
      if (b) { setAttr(b, "aria-expanded", isOpen ? "true" : "false"); setAttr(b, "aria-haspopup", "dialog"); setAttr(b, "aria-label", S.menu); }
    });
    if (closeHost) onShadow(closeHost, function (root) { var cb = root.querySelector("button"); if (cb) setAttr(cb, "aria-label", S.closeMenu); });
    if (drawer && isOpen) { setAttr(drawer, "role", "dialog"); setAttr(drawer, "aria-modal", "true"); setAttr(drawer, "aria-label", S.mainNav); }
    else if (drawer) { delAttr(drawer, "role"); delAttr(drawer, "aria-modal"); delAttr(drawer, "aria-label"); }
    // nyitaskor a fokusz a menube kerul, a hatter inert (2.4.3)
    if (isOpen && !menuState.open) {
      menuState.open = true;
      var bg = D.querySelectorAll("main, footer, header > div > nav.header-upper");
      bg.forEach(function (n) { if (!drawer || !n.contains(drawer)) n.setAttribute("inert", ""); });
      setTimeout(function () {
        var cb = closeHost.shadowRoot && closeHost.shadowRoot.querySelector("button");
        (cb || closeHost).focus();
      }, 60);
    } else if (!isOpen && menuState.open) {
      menuState.open = false;
      D.querySelectorAll("[inert]").forEach(function (n) { n.removeAttribute("inert"); });
      var ob = openerHost && openerHost.shadowRoot && openerHost.shadowRoot.querySelector("button");
      if (ob && isVisible(openerHost)) ob.focus();
    }
    // csoport-lenyitok (pl. "Hasznos linkek") allapota
    D.querySelectorAll("dap-ds-sidenav-group").forEach(function (g) {
      onShadow(g, function (root) {
        var t = root.querySelector('button[part="toggle"]');
        var sub = root.querySelector('[part="submenu"]');
        if (!t || !sub) return;
        var open = isVisible(sub) && sub.getBoundingClientRect().height > 4;
        setAttr(t, "aria-expanded", open ? "true" : "false");
        setAttr(t, "aria-controls", ensureId(sub, "sidenav-sub"));
        if (!t.__a11yObs) {
          t.__a11yObs = true;
          t.addEventListener("click", function () { setTimeout(schedule, 250); });
        }
      });
    });
  }
  D.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !menuState.open) return;
    var closeHost = D.querySelector('dap-ds-button[aria-label="Menü bezárása"]');
    if (closeHost) { e.preventDefault(); closeHost.click(); setTimeout(schedule, 300); }
  });
  D.addEventListener("click", function (e) {
    var p = e.composedPath ? e.composedPath() : [];
    for (var i = 0; i < p.length; i++) {
      var n = p[i];
      if (n && n.getAttribute && /^Menü( bezárása)?$/.test(n.getAttribute("aria-label") || "")) { setTimeout(schedule, 350); break; }
    }
  }, true);

  /* ========================== 12. Egyseges DS fokuszgyuru (2.4.7) */
  // Kereses szerint minden komponens ugyanazt a menta gyurut kapja (#37f0bf), mint
  // a gombok. Nehany DS-komponens (pl. "dark-outer-ring" valtozat) mas szint hasznalna.
  function focusRings() {
    D.querySelectorAll("main dap-ds-input, main dap-ds-select, main dap-ds-button, main dap-ds-icon-button, main dap-ds-list-item, main dap-ds-content-switcher, main dap-ds-switch, main dap-ds-textarea, main dap-ds-link, main dap-ds-checkbox, main dap-ds-radio-button, main dap-ds-card").forEach(function (h) {
      var want = "#37f0bf"; // egyseges menta gyuru minden komponensen (a gombokkal azonos)
      if (h.style.getPropertyValue("--dds-focus-outer-ring") !== want) h.style.setProperty("--dds-focus-outer-ring", want);
    });
  }

  /* ================= 13. Kezdolap kozlonykartyai -> valodi linkek (2.1.1, 4.1.2) */
  // Az elesen a React kezeli a kartya kattintasat (renderAs="button" + kliens-oldali
  // navigacio). A tukor kezdolapjan a React ki van kapcsolva (mock kereso), ezert a
  // kartyak semmit sem csinaltak. Valodi linkke alakitjuk oket (a DS list-item
  // renderAs="a" + href-et tamogat): "Magyar Kozlony 2026. evi 146. szam" ->
  // /magyar-kozlony?kiadvany=MAGYAR_KOZLONY&ev=2026&kozlonyszam=146
  function slug(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  }
  function gazetteLinks() {
    D.querySelectorAll("dap-ds-list-item").forEach(function (li) {
      var title = li.querySelector('[slot="title"]');
      if (!title) return;
      var t = (title.textContent || "").replace(/\s+/g, " ").trim();
      var m = t.match(/^(.*?)\s+(\d{4})\. évi (\d+)\. szám/);
      if (!m) return;
      var href = LANG_PREFIX + "/magyar-kozlony?kiadvany=" + slug(m[1]) + "&ev=" + m[2] + "&kozlonyszam=" + m[3];
      setAttr(li, "renderas", "a");
      setAttr(li, "href", href);
    });
  }

  /* ===== Felso sav linkjei -> "Hasznos linkek" legordulo tetejere (minden nyelven) */
  // A lathato fomenu (nav.ms-mainnav) a rejtett DS-menubol epul (readDsMenu), ezert itt a
  // DS-menut modositjuk, MIELOTT a mainNav() felepiti. HU-n a meglevo "Hasznos linkek"
  // elem tetejere kerulnek, mas nyelveken uj, lenyilo "Useful links" elem jon letre.
  var USEFUL = { hu: "Hasznos linkek", en: "Useful links", de: "Nützliche Links", fr: "Liens utiles", es: "Enlaces útiles", it: "Link utili", zh: "实用链接" };
  var topLinks = null;
  function usefulButton(l) {
    return '<dap-ds-button href="' + esc(l.href) + '" variant="subtle-menu-item" target="_blank" class="main-menu-button-item"><dap-ds-stack spacing="0"><dap-ds-stack direction="row">' +
      esc(l.label) + '<dap-ds-icon name="external-link-line"></dap-ds-icon></dap-ds-stack></dap-ds-stack></dap-ds-button>';
  }
  function usefulLinks() {
    var tops = D.querySelectorAll("dap-ds-sidenav-item.header-navbar-first-menu-item");
    if (tops.length) {
      topLinks = Array.prototype.map.call(tops, function (it) { return { href: it.getAttribute("href"), label: txt(it) }; });
      var ul = tops[0].parentNode;
      Array.prototype.forEach.call(tops, function (it) { it.remove(); });
      if (ul && ul.tagName === "UL" && !ul.children.length) ul.remove();
    }
    var ds = D.querySelector("nav > dap-ds-navigation-menu.main-navigation");
    if (!ds || !topLinks || ds.querySelector("[data-useful-links]")) return;
    var host = ds.querySelector('dap-ds-navigation-menu-item[basehref="/hasznos-linkek"]');
    var buttons = topLinks.map(usefulButton).join("");
    if (host) {
      var list = host.querySelector("dap-ds-stack.flex");
      if (!list) return;
      list.insertAdjacentHTML("afterbegin", buttons);
      list.setAttribute("data-useful-links", "");
    } else {
      ds.insertAdjacentHTML("beforeend",
        '<dap-ds-navigation-menu-item class="main-navigation-item" data-useful-links=""><dap-ds-button slot="trigger" size="sm" variant="subtle-menu" class="main-menu-button">' +
        '<dap-ds-stack direction="row" spacing="100"><dap-ds-typography size="md" variant="body" class="header-secondary-menu-label">' + esc(USEFUL[PAGE_LANG] || USEFUL.en) +
        '</dap-ds-typography><dap-ds-icon name="arrow-down-s-line"></dap-ds-icon></dap-ds-stack></dap-ds-button>' +
        '<dap-ds-stack spacing="100" class="flex w-max w-[-webkit-max-content]">' + buttons + "</dap-ds-stack></dap-ds-navigation-menu-item>");
    }
    var old = D.querySelector(".ms-mainnav");
    if (old) old.remove();      // ujraepul a modositott DS-menubol
  }

  /* ===== Mobil menu React nelkul (kezdolap + kereso-oldalak) ==================
   * Ezeken az oldalakon a mock kereso miatt a React bootstrap szandekosan nincs betoltve
   * (lasd scripts/patch_mock_search.py), igy a hamburger gombnak nincs kattintas-kezeloje.
   * Ilyenkor ugyanazt a fiokot epitjuk fel (a site sajat osztalyaival / DS elemeivel),
   * a rejtett DS-fomenubol. Hidratalt (React-es) oldalon nem csinal semmit. */
  var drawerState = { el: null, opener: null, bodyOverflow: "" };
  function reactDriven(el) {
    return Object.keys(el).some(function (k) { return k.indexOf("__reactProps") === 0; });
  }
  function drawerItem(it, i) {
    var cur = it.active ? ' active=""' : "";
    var head = '<dap-ds-divider spacing="300" variant="inverted" class="header-mobile-sidenav-item-divider divider-spacing-300" role="separator" aria-hidden="true"></dap-ds-divider>';
    if (it.sub.length) {
      return '<dap-ds-sidenav-group class="header-mobile-sidenav-item header-mobile-sidenav-group-item" spacing="none" size="xs">' + esc(it.label) +
        it.sub.map(function (l) {
          return '<dap-ds-sidenav-item size="xs" class="header-mobile-sidenav-item" slot="submenu" href="' + esc(l.href) + '" spacing="none">' + esc(l.label) +
            (l.ext ? '<dap-ds-icon name="external-link-line" class="dap-ds-icon"></dap-ds-icon>' : "") + "</dap-ds-sidenav-item>";
        }).join("") + "</dap-ds-sidenav-group>" + head;
    }
    return '<dap-ds-sidenav-item size="xs" href="' + esc(it.href || "#") + '" class="header-mobile-sidenav-item"' + cur + ' spacing="none">' + esc(it.label) + "</dap-ds-sidenav-item>" + head;
  }
  function closeDrawer() {
    if (!drawerState.el) return;
    drawerState.el.remove();
    drawerState.el = null;
    D.body.style.overflow = drawerState.bodyOverflow;
    D.querySelectorAll("[data-drawer-inert]").forEach(function (n) { n.removeAttribute("inert"); n.removeAttribute("data-drawer-inert"); });
    var op = drawerState.opener, b = op && op.shadowRoot && op.shadowRoot.querySelector("button");
    if (b) b.setAttribute("aria-expanded", "false");
    if (b) b.focus(); else if (op) op.focus();
  }
  function openDrawer(opener) {
    if (drawerState.el) return;
    var ds = D.querySelector("nav > dap-ds-navigation-menu.main-navigation");
    if (!ds) return;
    var items = readDsMenu(ds);
    var logo = D.querySelector("header img.header-logo-beta");
    var box = D.createElement("div");
    box.className = "flex flex-col fixed top-0 w-full z-50";
    box.setAttribute("data-ms-drawer", "");
    box.innerHTML =
      '<div class="header-upper bg-(--dds-background-brand-base-inverted) border-b border-(--dds-white-10)"><div class="flex items-center self-stretch min-w-0">' +
      '<div class="z-50 bg-(--dds-cold-grey-1100) rounded-(--dds-radius-base)  p-[6px] pr-[12px] ml-[-16px]"><div class="flex flex-row items-center">' +
      '<a href="' + (LANG_PREFIX || "/") + '"><img alt="' + esc(logo ? logo.getAttribute("alt") : "") + '" class="header-logo-beta" src="' + esc(logo ? logo.getAttribute("src") : "") + '"></a>' +
      '<div class="flex h-[40px] items-center"><dap-ds-divider vertical="" spacing="200" aria-hidden="true" style="--dds-divider-border-color:rgba(209,215,223,0.4);--dds-divider-border-width:1px"></dap-ds-divider></div>' +
      '<dap-ds-typography size="sm" variant="description" class="text-(--dds-cold-grey-400) text-[11px] font-bold">Béta</dap-ds-typography></div></div></div>' +
      '<div class="flex flex-row justify-end items-center self-stretch gap-x-(--dds-spacing-200)"><dap-ds-button size="md" aria-label="' + esc(S.closeMenu) + '" shape="circle" variant="primary-inverted" class="header-primary-inverted-icon dds-button-square" data-ms-drawer-close="">' +
      '<dap-ds-icon name="close-fill" size="lg" class="dap-ds-icon"></dap-ds-icon></dap-ds-button></div></div>' +
      '<nav class="header-mobile-navbar-menu" aria-label="' + esc(S.mainNav) + '"><div class="menu-container"><div><dap-ds-sidenav>' +
      items.map(drawerItem).join("") + "</dap-ds-sidenav></div>" +
      "</div></nav>";
    D.body.appendChild(box);
    drawerState.el = box;
    drawerState.opener = opener;
    drawerState.bodyOverflow = D.body.style.overflow;
    D.body.style.overflow = "hidden";
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", S.mainNav);
    D.querySelectorAll("main, footer, header").forEach(function (n) { if (!n.contains(box)) { n.setAttribute("inert", ""); n.setAttribute("data-drawer-inert", ""); } });
    var ob = opener.shadowRoot && opener.shadowRoot.querySelector("button");
    if (ob) ob.setAttribute("aria-expanded", "true");
    var cl = box.querySelector("[data-ms-drawer-close]");
    var tries = 0;
    (function focusClose() {     // a DS elem csak a beszuras utan renderel: varunk a belso gombra
      var cb = cl.shadowRoot && cl.shadowRoot.querySelector("button");
      if (cb) cb.focus();
      else if (tries++ < 20 && drawerState.el) setTimeout(focusClose, 50);
    })();
  }
  D.addEventListener("click", function (e) {
    var path = e.composedPath ? e.composedPath() : [];
    for (var i = 0; i < path.length; i++) {
      var n = path[i];
      if (!n || !n.matches) continue;
      if (n.hasAttribute && n.hasAttribute("data-ms-drawer-close")) { e.preventDefault(); closeDrawer(); return; }
      if (n.tagName === "DAP-DS-BUTTON" && n.querySelector(':scope > dap-ds-icon[name="menu-line"]') && n.matches(".xl\\:hidden")) {
        if (reactDriven(n)) return;       // hidralt oldal: a React kezeli
        e.preventDefault(); openDrawer(n); return;
      }
    }
  }, true);
  D.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawerState.el) { e.preventDefault(); closeDrawer(); }
  }, true);

  // A mobil/tablet menuben nincs lablec-link (Kapcsolat, Felhasznaloi kezikonyv...): a React-es
  // fiokban a blokkot (es az elotte levo elvalasztot) elrejtjuk; a DOM-ot nem toroljuk.
  function drawerFooter() {
    D.querySelectorAll("dap-ds-sidenav.header-mobile-sidenav").forEach(function (nav) {
      if (!nav.querySelector('dap-ds-sidenav-item[href$="/kapcsolat"]')) return;
      nav.classList.add("ms-drawer-footer-hidden");
      var prev = nav.previousElementSibling;
      if (prev && prev.tagName === "DAP-DS-DIVIDER") prev.classList.add("ms-drawer-footer-hidden");
    });
    // React-es fiok: az also 3 kulso link (Nemzeti Jogszabalytar, Magyar Kozlony Portal, Ceginformacios Portal)
    // a "Hasznos linkek" legordulo lista TETEJERE kerul; az uresen maradt blokk (es elvalasztoja) rejtve
    var useful = D.querySelector("dap-ds-sidenav-group.header-mobile-sidenav-group-item");
    if (useful) {
      var firstSub = useful.querySelector('dap-ds-sidenav-item[slot="submenu"]');
      var extHrefs = ["https://njt.hu/", "https://magyarkozlony.hu", "https://cegportal.im.gov.hu/frontend/cegkozlony"];
      var movable = extHrefs.map(function (h) {
        return D.querySelector('dap-ds-sidenav.header-mobile-sidenav > dap-ds-sidenav-item[href="' + h + '"]');
      }).filter(Boolean);
      movable.forEach(function (it) {
        it.setAttribute("slot", "submenu");
        useful.insertBefore(it, firstSub || null);
      });
      D.querySelectorAll("dap-ds-sidenav.header-mobile-sidenav").forEach(function (nv) {
        if (!nv.children.length) {
          nv.classList.add("ms-drawer-footer-hidden");
          var pv = nv.previousElementSibling;
          if (pv && pv.tagName === "DAP-DS-DIVIDER") pv.classList.add("ms-drawer-footer-hidden");
        }
      });
    }
    // React-es fiok: "Jogi hirek" -> "Hirek" (magyar)
    if (PAGE_LANG === "hu") {
      var newsEl = D.querySelector('dap-ds-sidenav-item.header-mobile-sidenav-item[href="/jogszabalyi-aktualitasok"]');
      if (newsEl && newsEl.firstChild && newsEl.firstChild.nodeType === 3 && newsEl.firstChild.nodeValue.trim() === "Jogi hírek") newsEl.firstChild.nodeValue = "Hírek";
    }
    // React-es fiok: a kulon "Jogi MI kereso" menupont elrejtese, a Kezdolap felirata "Jogi MI kereso"
    var srch = D.querySelector('dap-ds-sidenav-item.header-mobile-sidenav-item[href$="/jogi-informacio-kereso"]');
    if (srch) {
      var label = (srch.textContent || "").replace(/\s+/g, " ").trim();
      var homeEl = D.querySelector('dap-ds-sidenav-item.header-mobile-sidenav-item[href="' + (LANG_PREFIX || "/") + '"]') ||
                   D.querySelector('dap-ds-sidenav-item.header-mobile-sidenav-item[href="' + (LANG_PREFIX || "/") + '/"]');
      if (homeEl && homeEl.firstChild && homeEl.firstChild.nodeType === 3 && homeEl.firstChild.nodeValue.trim() !== label) homeEl.firstChild.nodeValue = label;
      srch.classList.add("ms-drawer-footer-hidden");
      var sx = srch.nextElementSibling;
      if (sx && sx.tagName === "DAP-DS-DIVIDER") sx.classList.add("ms-drawer-footer-hidden");
    }
    // React-es fiok: "Szakmai kereso" menupont (+ kovetkezo elvalaszto) elrejtese
    D.querySelectorAll('dap-ds-sidenav-item[href$="/szakmai-jogi-informacio-kereso"]').forEach(function (it) {
      it.classList.add("ms-drawer-footer-hidden");
      var nx = it.nextElementSibling;
      if (nx && nx.tagName === "DAP-DS-DIVIDER") nx.classList.add("ms-drawer-footer-hidden");
    });
  }

  /* ===== Szechenyi Terv Plusz logo -> a dap.gov.hu "DIMOP" valtozata + bezaro gomb ===== */
  // Ugyanaz a megjelenes es mukodes, mint a dap.gov.hu-n (c-dimop-logo): jobb also sarokban
  // fix doboz, a gomb bezarja, es a bezaras a munkamenetre (sessionStorage) megjegyzodik.
  // A React altal renderelt elemet helyben alakitjuk (nincs masolat), a kep csak src-t kap.
  var SZ_CLOSE_LABEL = { hu: "Széchenyi Terv Plusz ablak bezárás", en: "Close Széchenyi Terv Plusz window", de: "Széchenyi Terv Plusz-Fenster schließen", fr: "Fermer la fenêtre Széchenyi Terv Plusz", es: "Cerrar la ventana Széchenyi Terv Plusz", it: "Chiudi la finestra Széchenyi Terv Plusz", zh: "关闭 Széchenyi Terv Plusz 窗口" };
  var CLOSE_LABEL = { hu: "Bezárás", en: "Close", de: "Schließen", fr: "Fermer", es: "Cerrar", it: "Chiudi", zh: "关闭" };
  var DIMOP_KEY = "dimop-logo-dismissed";
  function dimopLogo() {
    var wrap = D.querySelector('[class*="szechenyi-terv-plus-logo"].fixed');
    if (!wrap) return;
    var gone = false;
    try { gone = sessionStorage.getItem(DIMOP_KEY) === "true"; } catch (e) {}
    if (gone) { if (wrap.style.display !== "none") wrap.style.display = "none"; return; }
    wrap.classList.add("ms-dimop-logo");
    var img = wrap.querySelector("img");
    if (img && img.getAttribute("src") !== "/assets/DIMOP_logo_d01847f4b9.svg") {
      img.setAttribute("src", "/assets/DIMOP_logo_d01847f4b9.svg");
      img.setAttribute("width", "267"); img.setAttribute("height", "52");
      img.classList.remove("max-h-18");
    }
    if (wrap.querySelector("[data-ms-dimop-close]")) return;
    var btn = D.createElement("dap-ds-button");
    btn.setAttribute("data-ms-dimop-close", "");
    btn.setAttribute("shape", "circle"); btn.setAttribute("variant", "primary"); btn.setAttribute("size", "xs");
    var szLabel = SZ_CLOSE_LABEL[PAGE_LANG] || SZ_CLOSE_LABEL.en;
    btn.setAttribute("aria-label", szLabel);
    // a nev csak a belso <button>-on legyen (a kulso host elemen "csoportkent" is bemondana)
    onShadow(btn, function (root) {
      var ib = root.querySelector("button");
      if (!ib) return;
      var fix = function () { if (ib.getAttribute("aria-label") !== szLabel) ib.setAttribute("aria-label", szLabel); if (btn.hasAttribute("aria-label")) btn.removeAttribute("aria-label"); };
      fix();
      new MutationObserver(fix).observe(ib, { attributes: true, attributeFilter: ["aria-label"] });
      new MutationObserver(fix).observe(btn, { attributes: true, attributeFilter: ["aria-label"] });
    });
    btn.className = "ms-dimop-close";
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" aria-hidden="true"><path fill="currentColor" d="m12 10.587l4.95-4.95l1.414 1.414l-4.95 4.95l4.95 4.95l-1.415 1.414l-4.95-4.95l-4.949 4.95l-1.414-1.415l4.95-4.95l-4.95-4.95L7.05 5.638z"></path></svg>';
    btn.addEventListener("click", function () {
      try { sessionStorage.setItem(DIMOP_KEY, "true"); } catch (e) {}
      wrap.style.display = "none";
      schedule();
    });
    wrap.appendChild(btn);
  }

  // A fomenu savja a fejlec <nav class="header-upper"> elemebe kerul (egyetlen navigacios szekcio).
  function oneNav() {
    var nav = D.querySelector("nav.header-upper"), ms = D.querySelector(".ms-mainnav");
    if (!nav || !ms) return;
    var bar = ms.closest("header > div > div");
    if (!bar || nav.contains(bar)) return;
    nav.classList.add("ms-onenav");
    bar.classList.add("ms-onenav-bar");
    nav.insertBefore(bar, nav.children[1] || null);   // logo | fomenu | nyelvvalaszto: egy sorban
  }

  /* ===== Suti-/EIR-tajekoztato minden betolteskor (a React nelkuli oldalakon is) ===== */
  // A React-es oldalakon a tajekoztato a kliensben nyilik meg minden betolteskor; a kezdolap es a kereso
  // oldalak React nelkul futnak, ezeken ugyanazzal a tartalommal/kinezettel itt epitjuk fel. A "Rendben"
  // bezarja; nem jegyezzuk meg, ezert frissiteskor ujra megjelenik.
  var CONSENT = {"hu": {"cookie": "A weboldal a működéshez és a szolgáltatás zavartalan biztosításához személyes adatokat tárol az Ön böngészőjében. Az ebbe a csoportba tartozó sütik használata elengedhetetlen az oldalon, ezeket csak időszakosan tudja törölni.", "eir": "A rendszer használatával a felhasználó tudomásul veszi, hogy a szervezet információs erőforrásait (EIR) veszi igénybe, amelynek működését biztonsági és üzemeltetési célból megfigyelhetik, rögzíthetik és naplózhatják. A rendszer jogosulatlan vagy rendeltetésellenes használata tilos, és büntető- vagy polgári jogi felelősséget vonhat maga után.", "button": "Rendben"}, "en": {"cookie": "This website stores personal data in your browser for proper operation and uninterrupted service. The use of these cookies is essential; you can only delete them temporarily.", "eir": "By using the system, you acknowledge the utilisation of the organization's information resources (EIR) the operation of which may be monitored, recorded, and logged for security and operational purposes. Unauthorized or improper use of the system is prohibited and may result in criminal or civil liability.", "button": "OK"}, "de": {"cookie": "Die Website speichert personenbezogene Daten in Ihrem Browser, um den Betrieb zu gewährleisten und einen unterbrechungsfreien Service sicherzustellen. Die Verwendung von Cookies dieser Gruppe ist für die Website unerlässlich, sie können nur zeitweise gelöscht werden.", "eir": "Durch die Nutzung des Systems bestätigt der Nutzer, dass er die Informationsressourcen (EIR) der Organisation nutzt, deren Betrieb aus Sicherheits- und Betriebsgründen überwacht, gespeichert und protokolliert werden kann. Die unbefugte oder unsachgemäße Nutzung ist untersagt und kann straf- oder zivilrechtliche Folgen nach sich ziehen.", "button": "OK"}, "fr": {"cookie": "Le site enregistre des données personnelles dans votre navigateur pour son fonctionnement. L'utilisation des cookies de ce groupe est essentielle ; vous ne pouvez les supprimer que périodiquement.", "eir": "En utilisant le système, l'utilisateur reconnaît utiliser les ressources d'information (EIR) de l'organisation, dont le fonctionnement peut être surveillé, enregistré et consigné à des fins de sécurité et d'exploitation. Toute utilisation non autorisée ou abusive est interdite et peut entraîner des responsabilités civiles ou pénales.", "button": "OK"}, "it": {"cookie": "Il sito web memorizza dati personali nel Suo browser per garantire il corretto funzionamento e la continuità del servizio. I cookie appartenenti a questo gruppo sono essenziali per il funzionamento del sito e possono essere cancellati solo periodicamente.", "eir": "Utilizzando il sistema, l’utente riconosce di avvalersi delle risorse informative (EIR) dell’organizzazione, il cui utilizzo può essere monitorato, registrato e tracciato per motivi operativi e di sicurezza. L’uso non autorizzato o improprio del sistema è vietato e può comportare responsabilità penale e/o civile.", "button": "OK"}, "zh": {"cookie": "网站为了运行和提供不间断服务，会在您的浏览器中存储个人数据。此类别跟踪器的使用对网站至关重要，，您只能定期完成删除", "eir": "使用本系统即表示用户知悉正在使用组织的信息资源（EIR），出于安全和运营目的，其运行状况可能会被监控、记录和日志化。禁止未经授权或违反用途的系统使用，否则可能导致刑事或民事法律责任。", "button": "确定"}, "es": {"cookie": "El sitio web almacena datos personales en su navegador para su funcionamiento y para garantizar la prestación ininterrumpida del servicio. Las cookies de este grupo son esenciales; solo puede eliminarlas periódicamente.", "eir": "Al usar el sistema, el usuario reconoce que utiliza los recursos de información (EIR) de la organización, cuyo funcionamiento puede ser supervisado y registrado con fines de seguridad. El uso no autorizado o indebido del sistema está prohibido y puede conllevar responsabilidad penal o civil.", "button": "Aceptar"}};
  var consentOffered = false;
  /* ===== Suti-tajekoztato: csak a fejlec logojara kattintas utan jelenik meg (egyszer; bezaras utan nem nyilik ujra) ===== */
  var CONSENT_KEY = "ms-consent-offer";
  function consentWanted() {
    try { var v = +sessionStorage.getItem(CONSENT_KEY); return v > 0 && Date.now() - v < 12000; } catch (e) { return false; }
  }
  // window fogo fazis: az offline-nav-fix (dokumentum fogo fazis) stopImmediatePropagation-t hiv, ezert elotte kell futni
  window.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (a && a.querySelector("img.header-logo-beta")) { try { sessionStorage.setItem(CONSENT_KEY, String(Date.now())); } catch (er) {} }
  }, true);
  function consentOffer() {
    if (consentOffered) return;
    if (!D.getElementById("mock-search-bar")) return;                        // csak a React nelkuli oldalakon
    if (!consentWanted()) return;                                            // csak a logora kattintas utan
    if (D.querySelector(".a11y-consent-banner")) { consentOffered = true; return; }
    consentOffered = true;
    var T = CONSENT[PAGE_LANG] || CONSENT.en;
    var b = D.createElement("div");
    b.className = "fixed flex flex-col gap-(--dds-spacing-400) p-(--dds-spacing-400) lg:p-(--dds-spacing-600) bg-white z-40 bottom-[15px] mx-(--dds-spacing-400) lg:bottom-[55px] lg:right-[35px] rounded-(--dds-radius-base) max-w-[950px] shadow-xl/35 lg:shadow-xl/15";
    b.setAttribute("data-ms-consent", "");
    b.innerHTML = '<div class="dds-typography typography-body dds-typography-size--sm">' + esc(T.cookie) +
      '<p class="pt-(--dds-spacing-400) lg:mb-[-25px]">' + esc(T.eir) + '</p></div>' +
      '<div class="flex flex-col lg:flex-row w-full justify-center lg:justify-end"><button class="dds-button dds-button--primary dds-button--sm dds-button-square dds-dark-outer-ring uppercase">' + esc(T.button) + '</button></div>';
    b.querySelector("button").addEventListener("click", function () { try { sessionStorage.removeItem(CONSENT_KEY); } catch (e) {} b.remove(); schedule(); });
    D.body.appendChild(b);
    schedule();
  }

  /* ======================================================== futtatas */
  function run() {
    try { skipLink(); } catch (e) { console.warn("[a11y] skipLink", e); }
    try { dimopLogo(); } catch (e) { console.warn("[a11y] dimopLogo", e); }
    try { consentOffer(); } catch (e) { console.warn("[a11y] consentOffer", e); }
    try { drawerFooter(); } catch (e) { console.warn("[a11y] drawerFooter", e); }
    try { usefulLinks(); } catch (e) { console.warn("[a11y] usefulLinks", e); }
    try { mainNav(); hideSourceNav(); oneNav(); } catch (e) { console.warn("[a11y] mainNav", e); }
    try { langMenu(); } catch (e) { console.warn("[a11y] langMenu", e); }
    try { landmarks(); } catch (e) { console.warn("[a11y] landmarks", e); }
    try { headings(); } catch (e) { console.warn("[a11y] headings", e); }
    try { images(); } catch (e) { console.warn("[a11y] images", e); }
    try { gazetteCards(); } catch (e) { console.warn("[a11y] gazetteCards", e); }
    try { iconButtonNames(); } catch (e) { console.warn("[a11y] iconButtonNames", e); }
    try { lawTexts(); } catch (e) { console.warn("[a11y] lawTexts", e); }
    try { heroOverflow(); } catch (e) { console.warn("[a11y] heroOverflow", e); }
    try { newWindowLinks(); } catch (e) { console.warn("[a11y] newWindowLinks", e); }
    try { langDialog(); } catch (e) { console.warn("[a11y] langDialog", e); }
    try { consentBanner(); } catch (e) { console.warn("[a11y] consentBanner", e); }
    try { noticeDialogs(); } catch (e) { console.warn("[a11y] noticeDialogs", e); }
    try { errorScreen(); } catch (e) { console.warn("[a11y] errorScreen", e); }
    try { footerPageTitle(); } catch (e) { console.warn("[a11y] footerPageTitle", e); }
    try { navButtons(); } catch (e) { console.warn("[a11y] navButtons", e); }
    try { mobileMenu(); } catch (e) { console.warn("[a11y] mobileMenu", e); }
    try { focusRings(); } catch (e) { console.warn("[a11y] focusRings", e); }
    try { gazetteLinks(); } catch (e) { console.warn("[a11y] gazetteLinks", e); }
  }
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; obs.disconnect(); run(); observe(); });
  }
  var obs = new MutationObserver(schedule);
  function observe() { obs.observe(D.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "open"] }); }

  /* ===== Link megnyitasakor (pl. lablec-linkek) az oldal teteje ===== */
  // Uj oldal (nem vissza/frissites, nincs #horgony) mindig az oldal tetejen indul; a betoltes / hidratacio /
  // kesleltetett elrendezes utan sem ugrik lejjebb, amig a felhasznalo maga nem gorget.
  (function () {
    try {
      var nav = performance.getEntriesByType("navigation")[0];
      if (!nav || nav.type !== "navigate" || location.hash) return;
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      var touched = false;
      ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) { window.addEventListener(ev, function () { touched = true; }, { passive: true, once: true }); });
      var top = function () { if (!touched && window.scrollY > 0) window.scrollTo(0, 0); };
      top();
      window.addEventListener("DOMContentLoaded", top);
      window.addEventListener("load", top);
      [150, 600, 1500].forEach(function (t) { setTimeout(top, t); });
    } catch (e) {}
  })();

  whenReady(function () {
    run();
    observe();
    window.addEventListener("resize", schedule);
    var st; window.addEventListener("scroll", function () { clearTimeout(st); st = setTimeout(schedule, 200); }, { passive: true });
    // betutipusok / kesleltetett tartalom utan a geometria-fuggo lepesek ujra
    window.addEventListener("load", schedule);
    setTimeout(schedule, 1200); setTimeout(schedule, 3500);
    window.__a11yFixesReady = true;
  });
})();
