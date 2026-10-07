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
    if (main) { if (!main.id) main.id = "dds-main-content"; setAttr(main, "tabindex", "-1"); }
    var link = D.querySelector("a.skip-to-content");
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
    main.focus();
    if (history.replaceState) history.replaceState(history.state, "", "#" + main.id);
  }
  D.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.skip-to-content");
    if (a) jumpToMain(e);
  }, true);
  D.addEventListener("keydown", function (e) {
    if ((e.key === " " || e.key === "Spacebar") && e.target.matches && e.target.matches("a.skip-to-content")) jumpToMain(e);
  }, true);

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
    return items;
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
          return '<li><a href="' + esc(s.href) + '"' + (s.ext ? ' target="_blank" rel="noopener"' : "") + ">" +
                 "<span>" + esc(s.label) + "</span>" + (s.ext ? EXT + '<span class="a11y-sr-only"> ' + NEW_WIN + "</span>" : "") + "</a></li>";
        }).join("") + "</ul>";
      }
      html += "<li" + (cls.trim() ? ' class="' + cls.trim() + '"' : "") + ">" + inner + "</li>";
    });
    var nav = D.createElement("nav");
    nav.className = "ms-mainnav";
    nav.setAttribute("aria-label", S.mainNav);
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
    var old = D.querySelector("nav.ms-mainnav");
    if (old) old.remove();
    dsNav.parentElement.insertBefore(buildNav(readDsMenu(ds)), dsNav.nextSibling);
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
      var c = el.submenuController;
      if (c) {
        try { c.removeListeners(); } catch (e) {}
        c.addListeners = function () {};
        el.addEventListener("mouseover", function () { if (!el.opened) el.showDropDown(true); });
        el.addEventListener("mouseleave", function () { if (el.opened && !el.contains(D.activeElement)) el.hideDropDown(); });
        el.addEventListener("focusout", function (e) { if (!e.relatedTarget || !el.contains(e.relatedTarget)) el.hideDropDown(); });
      }
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
        var curEl = el.querySelector("[aria-current]");
        var curLang = curEl ? txt(curEl) : "";
        // a lathato felirat ("HU") legyen a nev elejen (2.5.3 Cimke a nevben)
        var vis = txt(tr) || "HU";
        var lbl = vis + " – " + S.langBtn + (curLang ? ", " + S.curLang + ": " + curLang : "");
        onShadow(tr, function (root) { var b = root.querySelector("button"); if (b) setAttr(b, "aria-label", lbl); });
      }
    });
  }

  /* ==================================================== 4. Landmarkok */
  function landmarks() {
    var up = D.querySelector("nav.header-upper");
    if (up) setAttr(up, "aria-label", S.header);
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
    if (!banner || !isVisible(banner)) { html.style.removeProperty("scroll-padding-bottom"); return; }
    // A Szechenyi Terv Plusz (EU-tamogatasi) logo pozicioja fix (jobb also sarok),
    // a suti-sav eltakarta (mobilon teljesen, desktopon reszben). A SAVOT emeljuk
    // a logo fole, ha vizszintesen atfednek; a logo a helyen marad.
    var logo = D.querySelector('[class*="szechenyi-terv-plus-logo"].fixed');
    banner.style.removeProperty("bottom");
    if (logo && isVisible(logo)) {
      var br = banner.getBoundingClientRect(), lr = logo.getBoundingClientRect();
      if (br.right > lr.left && br.left < lr.right && br.bottom > lr.top) {
        var want = Math.ceil(window.innerHeight - lr.top + 8) + "px";
        banner.style.setProperty("bottom", want, "important");
      }
    }
    banner.classList.add("a11y-consent-banner");
    // nem-modalis dialog: a felolvaso fokuszaltakor bemondja a nevet + a szoveget
    setAttr(banner, "role", "dialog");
    setAttr(banner, "aria-label", S.consent);
    var txtBox = banner.querySelector(":scope > div:first-child");
    if (txtBox) setAttr(banner, "aria-describedby", ensureId(txtBox, "suti-szoveg"));
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
  var lastInput = "key";
  D.addEventListener("keydown", function () { lastInput = "key"; }, true);
  D.addEventListener("pointerdown", function () { lastInput = "pointer"; }, true);
  var dlgSeen = [], dlgOpen = [];
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
      if (ae !== target) target.focus({ preventScroll: true });
      return;
    }
    if (closed && onBody && lastInput === "key") {
      var sk = D.querySelector("a.skip-to-content");
      if (sk) sk.focus({ preventScroll: true });
    }
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

  /* ======================================================== futtatas */
  function run() {
    try { skipLink(); } catch (e) { console.warn("[a11y] skipLink", e); }
    try { mainNav(); } catch (e) { console.warn("[a11y] mainNav", e); }
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
