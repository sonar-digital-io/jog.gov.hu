/* mock-search.js
 * A jog.gov.hu "Jogi mesterséges intelligencia alapú kereső" mock
 * implementációja: a kliensoldali web component (k2s-b2c) helyett egy önálló,
 * offline működő kereső + egy MOCK SERVICE, ami a rögzített kérdés→válasz
 * párokat szolgálja ki. A válaszoldal ugyanúgy épül fel, mint az élesen.
 *
 * A mock service felülete:
 *     window.JogMockSearch.ask(kérdés) -> Promise<válaszObjektum | null>
 */
(function () {
  "use strict";

  /* ------------------------------------------------- nyelvvalasztas (locale)
   * Ezeken az oldalakon a React ki van kapcsolva, ezert az eles alkalmazas
   * nyelvkezeleset itt potoljuk, pontosan ugy, ahogy elesen mukodik:
   *  - a valasztott nyelv a localStorage "portal_selected_locale" (+ i18nextLng)
   *    kulcsban van; ha egy MAGYAR oldalt nyitunk meg, de a valasztott nyelv
   *    nem magyar, az eles oldal a /<nyelv>/jogi-informacio-kereso oldalra
   *    iranyit (a query-t megtartva);
   *  - belso linkre kattintaskor (pl. "Vissza a magyar oldalra", nyelvvalaszto)
   *    a cel URL nyelve lesz a valasztott nyelv. */
  var LOCALES = ["en", "de", "fr", "es", "it", "zh"];
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  (function () {
    var pageLang = (document.documentElement.getAttribute("lang") || "hu").toLowerCase().split("-")[0];
    var sel = lsGet("portal_selected_locale");
    if (pageLang === "hu" && sel && LOCALES.indexOf(sel) !== -1) {
      // a Kezdolap a valasztott nyelven (nem a Jogi MI kereso); mas oldalon a kereso oldal marad
      location.replace(location.pathname.replace(/\/+$/, "") === "" ? "/" + sel + "/" : "/" + sel + "/" + location.search);
      return;
    }
    function langOf(path) { var m = /^\/([a-z]{2})(\/|$)/.exec(path); return m && LOCALES.indexOf(m[1]) !== -1 ? m[1] : "hu"; }
    // window capture: az offline-nav-fix (document capture) stopImmediatePropagation-t hiv
    window.addEventListener("click", function (e) {
      var path = e.composedPath ? e.composedPath() : [e.target];
      for (var i = 0; i < path.length; i++) {
        var n = path[i];
        if (!n || !n.getAttribute) continue;
        var h = n.getAttribute("href");
        if (h == null) continue;
        var u; try { u = new URL(h, location.href); } catch (x) { return; }
        if (u.origin !== location.origin) return;
        var l = langOf(u.pathname);
        lsSet("portal_selected_locale", l); lsSet("i18nextLng", l);
        return;
      }
    }, true);
  })();

  /* ------------------------------------------------------------ nyelv (i18n)
   * Az oldal nyelve a <html lang> alapjan. A forditott oldalakon (en/de/fr/es/
   * it/zh) a kereso feliratai az eles oldal szovegei; a mock valaszok
   * torzsszovege nem magyar nyelven angol. */
  var LANG = ((document.documentElement.getAttribute("lang") || "hu").toLowerCase().split("-")[0]);
  var I18N = {
    hu: { label: "Keresés", ph: "Írja le a kérdését", search: "Keresés", clear: "Szöveg törlése",
          sw1: "Keresés önkormányzati rendeletekben", sw2: "Keresés időpont szerint", suggest: "Keresési javaslatok", pop: "Népszerű keresések", rec: "Legutóbbi kereséseim", samples: "Példakérdések",
          loading: "Válasz keresése a jogszabályokban…", none: "Erre a kérdésre nincs rögzített mock válasz. Próbálja a beállított kérdések egyikét.", thanks: "Köszönjük a visszajelzést!", loaded: "A válasz betöltődött.",
          ansLabel: "Országos jogszabályokon alapuló válasz:", ansId: "Válaszazonosító: ", disclaimer: "A válasz nem minősül hivatalos jogi tanácsadásnak.",
          fbTitle: "Hasznosnak találta a szolgáltatást?", fbText: "Segítsen nekünk, hogy még jobbá tegyük a választ!", up: "Hasznos volt", down: "Nem volt hasznos",
          info: "További részletekért javasolt a vonatkozó jogszabályok áttanulmányozása.", laws: "Hivatkozott országos jogszabályok", newWin: " (új ablakban nyílik meg)", cite: "Forrás a Nemzeti Jogszabálytárban (új ablakban nyílik meg)" },
    en: { label: "Search", ph: "Describe your question", rec: "My recent searches", search: "Search", clear: "Clear text",
          sw1: "Would you also like to search local government decrees?", sw2: "Is your question related to a past date?", suggest: "Search suggestions", samples: "Sample questions",
          loading: "Searching the legislation for an answer…", none: "There is no recorded mock answer for this question. Try one of the sample questions.", thanks: "Thank you for your feedback!", loaded: "The answer has loaded.",
          ansLabel: "Answer based on national legislation:", ansId: "Answer ID: ", disclaimer: "This answer does not constitute official legal advice.",
          fbTitle: "Did you find this service useful?", fbText: "Help us make the answer even better!", up: "Useful", down: "Not useful",
          info: "For further details, we recommend reading the relevant legislation.", laws: "Referenced national legislation", newWin: " (opens in a new window)", cite: "Source in the National Legislation Database (opens in a new window)" },
    de: { label: "Suche", ph: "Beschreiben Sie Ihre Frage", rec: "Meine letzten Suchanfragen", search: "Suchen", clear: "Text löschen",
          sw1: "Möchten Sie auch in den Gemeindeverordnungen suchen?", sw2: "Bezieht sich Ihre Frage auf ein Datum in der Vergangenheit?", suggest: "Suchvorschläge", samples: "Beispielfragen",
          loading: "Antwort wird in den Rechtsvorschriften gesucht…", none: "Für diese Frage gibt es keine hinterlegte Mock-Antwort. Versuchen Sie eine der Beispielfragen.", thanks: "Vielen Dank für Ihr Feedback!", loaded: "Die Antwort wurde geladen.",
          ansLabel: "Antwort auf Grundlage nationaler Rechtsvorschriften:", ansId: "Antwort-ID: ", disclaimer: "Die Antwort stellt keine offizielle Rechtsberatung dar.",
          fbTitle: "Fanden Sie den Dienst hilfreich?", fbText: "Helfen Sie uns, die Antwort noch besser zu machen!", up: "Hilfreich", down: "Nicht hilfreich",
          info: "Für weitere Einzelheiten empfiehlt sich das Studium der einschlägigen Rechtsvorschriften.", laws: "Zitierte nationale Rechtsvorschriften", newWin: " (öffnet in einem neuen Fenster)", cite: "Quelle in der Nationalen Rechtsdatenbank (öffnet in einem neuen Fenster)" },
    fr: { label: "Recherche", ph: "Décrivez votre question", rec: "Mes recherches récentes", search: "Recherche", clear: "Effacer le texte",
          sw1: "Voulez-vous également effectuer des recherces dans les décrets municipaux ?", sw2: "Votre question concerne-t-elle une date passée ?", suggest: "Suggestions de recherche", samples: "Exemples de questions",
          loading: "Recherche d'une réponse dans la législation…", none: "Aucune réponse fictive n'est enregistrée pour cette question. Essayez l'un des exemples de questions.", thanks: "Merci pour votre avis !", loaded: "La réponse est chargée.",
          ansLabel: "Réponse fondée sur la législation nationale :", ansId: "Identifiant de la réponse : ", disclaimer: "La réponse ne constitue pas un conseil juridique officiel.",
          fbTitle: "Avez-vous trouvé ce service utile ?", fbText: "Aidez-nous à améliorer encore la réponse !", up: "Utile", down: "Pas utile",
          info: "Pour plus de détails, il est recommandé de consulter la législation applicable.", laws: "Législation nationale citée", newWin: " (s'ouvre dans une nouvelle fenêtre)", cite: "Source dans la base de données juridique nationale (s'ouvre dans une nouvelle fenêtre)" },
    es: { label: "Búsqueda", ph: "Describa su pregunta", rec: "Mis búsquedas recientes", search: "Búsqueda", clear: "Borrar texto",
          sw1: "¿Buscaría también en los decretos municipales?", sw2: "¿Su pregunta se refiere a un momento pasado?", suggest: "Sugerencias de búsqueda", samples: "Preguntas de ejemplo",
          loading: "Buscando una respuesta en la legislación…", none: "No hay ninguna respuesta simulada para esta pregunta. Pruebe una de las preguntas de ejemplo.", thanks: "¡Gracias por sus comentarios!", loaded: "La respuesta se ha cargado.",
          ansLabel: "Respuesta basada en la legislación nacional:", ansId: "ID de la respuesta: ", disclaimer: "La respuesta no constituye asesoramiento jurídico oficial.",
          fbTitle: "¿Le ha resultado útil el servicio?", fbText: "¡Ayúdenos a mejorar aún más la respuesta!", up: "Útil", down: "No útil",
          info: "Para más detalles, se recomienda consultar la legislación correspondiente.", laws: "Legislación nacional citada", newWin: " (se abre en una ventana nueva)", cite: "Fuente en la Base de Datos Legislativa Nacional (se abre en una ventana nueva)" },
    it: { label: "Ricerca", ph: "Descriva la sua domanda", rec: "Le mie ricerche recenti", search: "Ricerca", clear: "Cancella testo",
          sw1: "Vuole cercare anche nei regolamenti comunali?", sw2: "La sua domanda si riferisce a un momento passato?", suggest: "Suggerimenti di ricerca", samples: "Domande di esempio",
          loading: "Ricerca di una risposta nella normativa…", none: "Per questa domanda non è registrata alcuna risposta fittizia. Provi una delle domande di esempio.", thanks: "Grazie per il suo riscontro!", loaded: "La risposta è stata caricata.",
          ansLabel: "Risposta basata sulla normativa nazionale:", ansId: "ID risposta: ", disclaimer: "La risposta non costituisce consulenza legale ufficiale.",
          fbTitle: "Ha trovato utile il servizio?", fbText: "Ci aiuti a migliorare ancora la risposta!", up: "Utile", down: "Non utile",
          info: "Per ulteriori dettagli si consiglia di consultare la normativa pertinente.", laws: "Normativa nazionale citata", newWin: " (si apre in una nuova finestra)", cite: "Fonte nella Banca dati legislativa nazionale (si apre in una nuova finestra)" },
    zh: { label: "搜索", ph: "请描述您的问题", rec: "我最近的搜索", search: "搜索", clear: "清除文字",
          sw1: "您是否也要在地方政府条例中进行搜索？", sw2: "您的问题是针对过去某个日期的版本吗？", suggest: "搜索建议", samples: "示例问题",
          loading: "正在法律法规中查找答案…", none: "此问题没有预设的模拟答案。请尝试其中一个示例问题。", thanks: "感谢您的反馈！", loaded: "答案已加载。",
          ansLabel: "基于国家法律法规的答案：", ansId: "答案编号：", disclaimer: "本答案不构成正式的法律建议。",
          fbTitle: "您觉得这项服务有用吗？", fbText: "帮助我们把答案做得更好！", up: "有用", down: "没有用",
          info: "如需了解更多详情，建议查阅相关法律法规。", laws: "引用的国家法律法规", newWin: "（在新窗口中打开）", cite: "国家法律数据库中的来源（在新窗口中打开）" }
  };
  if (!I18N[LANG]) LANG = "en";
  var S = I18N[LANG];
  /* ------------------------------------------- szuro-elemek adatai (megye / telepules) */
  var MS_COUNTIES = [
    ["Bács-Kiskun", ["Kecskemét", "Baja", "Kiskunfélegyháza", "Kalocsa"]], ["Baranya", ["Pécs", "Komló", "Mohács", "Szigetvár"]],
    ["Békés", ["Békéscsaba", "Gyula", "Orosháza", "Szarvas"]], ["Borsod-Abaúj-Zemplén", ["Miskolc", "Ózd", "Kazincbarcika", "Sárospatak"]],
    ["Budapest", ["Budapest"]], ["Csongrád-Csanád", ["Szeged", "Hódmezővásárhely", "Makó", "Szentes"]],
    ["Fejér", ["Székesfehérvár", "Dunaújváros", "Mór", "Bicske"]], ["Győr-Moson-Sopron", ["Győr", "Sopron", "Mosonmagyaróvár", "Csorna"]],
    ["Hajdú-Bihar", ["Debrecen", "Hajdúszoboszló", "Hajdúböszörmény", "Berettyóújfalu"]], ["Heves", ["Eger", "Gyöngyös", "Hatvan", "Heves"]],
    ["Jász-Nagykun-Szolnok", ["Szolnok", "Jászberény", "Karcag", "Törökszentmiklós"]], ["Komárom-Esztergom", ["Tatabánya", "Esztergom", "Komárom", "Tata"]],
    ["Nógrád", ["Salgótarján", "Balassagyarmat", "Pásztó", "Szécsény"]], ["Pest", ["Érd", "Szentendre", "Vác", "Gödöllő", "Cegléd"]],
    ["Somogy", ["Kaposvár", "Siófok", "Marcali", "Nagyatád"]], ["Szabolcs-Szatmár-Bereg", ["Nyíregyháza", "Mátészalka", "Kisvárda", "Tiszavasvári"]],
    ["Tolna", ["Szekszárd", "Paks", "Dombóvár", "Bonyhád"]], ["Vas", ["Szombathely", "Sárvár", "Körmend", "Kőszeg"]],
    ["Veszprém", ["Veszprém", "Ajka", "Pápa", "Balatonfüred"]], ["Zala", ["Zalaegerszeg", "Nagykanizsa", "Keszthely", "Lenti"]]
  ];
  // a ket kapcsolo (es a hozzajuk tartozo szurok) ezen a lenyithato cim alatt van
  var DOC_TEXT = { hu: ["Dokumentum hozzáadása", "Eltávolítás"], en: ["Add document", "Remove"], de: ["Dokument hinzufügen", "Entfernen"], fr: ["Ajouter un document", "Retirer"],
    es: ["Añadir documento", "Quitar"], it: ["Aggiungi documento", "Rimuovi"], zh: ["添加文档", "移除"] };
  var IC_ADD = '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.8287 7.75737L9.1718 13.4142C8.78127 13.8047 8.78127 14.4379 9.1718 14.8284C9.56232 15.219 10.1955 15.219 10.586 14.8284L16.2429 9.17158C17.4144 8.00001 17.4144 6.10052 16.2429 4.92894C15.0713 3.75737 13.1718 3.75737 12.0002 4.92894L6.34337 10.5858C4.39075 12.5384 4.39075 15.7042 6.34337 17.6569C8.29599 19.6095 11.4618 19.6095 13.4144 17.6569L19.0713 12L20.4855 13.4142L14.8287 19.0711C12.095 21.8047 7.66283 21.8047 4.92916 19.0711C2.19549 16.3374 2.19549 11.9053 4.92916 9.17158L10.586 3.51473C12.5386 1.56211 15.7045 1.56211 17.6571 3.51473C19.6097 5.46735 19.6097 8.63317 17.6571 10.5858L12.0002 16.2427C10.8287 17.4142 8.92916 17.4142 7.75759 16.2427C6.58601 15.0711 6.58601 13.1716 7.75759 12L13.4144 6.34316L14.8287 7.75737Z" fill="#404753"/></svg>';
  var DONE_TEXT = { hu: "Kész", en: "Done", de: "Fertig", fr: "Terminé", es: "Listo", it: "Fatto", zh: "完成" };
  var HIST_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#404753" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3.6 12a8.4 8.4 0 1 0 2.6-6.05"/><path d="M3.4 4.2v4.3h4.3"/><path d="M12 7.6V12l3 1.8"/></svg>';
  var BACK_TEXT = { hu: "Vissza", en: "Back", de: "Zurück", fr: "Retour", es: "Atrás", it: "Indietro", zh: "返回" };
  var CLOSE_TEXT = { hu: "Bezárás", en: "Close", de: "Schließen", fr: "Fermer", es: "Cerrar", it: "Chiudi", zh: "关闭" };
  var IC_SETTINGS = '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.33946 17.0002C2.90721 16.2515 2.58277 15.4702 2.36133 14.6741C3.3338 14.1779 3.99972 13.1668 3.99972 12.0002C3.99972 10.8345 3.3348 9.824 2.36353 9.32741C2.81025 7.71651 3.65857 6.21627 4.86474 4.99001C5.7807 5.58416 6.98935 5.65534 7.99972 5.072C9.01009 4.48866 9.55277 3.40635 9.4962 2.31604C11.1613 1.8846 12.8847 1.90004 14.5031 2.31862C14.4475 3.40806 14.9901 4.48912 15.9997 5.072C17.0101 5.65532 18.2187 5.58416 19.1346 4.99007C19.7133 5.57986 20.2277 6.25151 20.66 7.00021C21.0922 7.7489 21.4167 8.53025 21.6381 9.32628C20.6656 9.82247 19.9997 10.8336 19.9997 12.0002C19.9997 13.166 20.6646 14.1764 21.6359 14.673C21.1892 16.2839 20.3409 17.7841 19.1347 19.0104C18.2187 18.4163 17.0101 18.3451 15.9997 18.9284C14.9893 19.5117 14.4467 20.5941 14.5032 21.6844C12.8382 22.1158 11.1148 22.1004 9.49633 21.6818C9.55191 20.5923 9.00929 19.5113 7.99972 18.9284C6.98938 18.3451 5.78079 18.4162 4.86484 19.0103C4.28617 18.4205 3.77172 17.7489 3.33946 17.0002ZM8.99972 17.1964C10.0911 17.8265 10.8749 18.8227 11.2503 19.9659C11.7486 20.0133 12.2502 20.014 12.7486 19.9675C13.1238 18.8237 13.9078 17.8268 14.9997 17.1964C16.0916 16.5659 17.347 16.3855 18.5252 16.6324C18.8146 16.224 19.0648 15.7892 19.2729 15.334C18.4706 14.4373 17.9997 13.2604 17.9997 12.0002C17.9997 10.74 18.4706 9.5632 19.2729 8.6665C19.1688 8.4405 19.0538 8.21822 18.9279 8.00021C18.802 7.78219 18.667 7.57148 18.5233 7.36842C17.3457 7.61476 16.0911 7.43414 14.9997 6.80405C13.9083 6.17395 13.1246 5.17768 12.7491 4.03455C12.2509 3.98714 11.7492 3.98646 11.2509 4.03292C10.8756 5.17671 10.0916 6.17364 8.99972 6.80405C7.9078 7.43447 6.65245 7.61494 5.47428 7.36803C5.18485 7.77641 4.93463 8.21117 4.72656 8.66637C5.52881 9.56311 5.99972 10.74 5.99972 12.0002C5.99972 13.2604 5.52883 14.4372 4.72656 15.3339C4.83067 15.5599 4.94564 15.7822 5.07152 16.0002C5.19739 16.2182 5.3324 16.4289 5.47612 16.632C6.65377 16.3857 7.90838 16.5663 8.99972 17.1964ZM11.9997 15.0002C10.3429 15.0002 8.99972 13.6571 8.99972 12.0002C8.99972 10.3434 10.3429 9.00021 11.9997 9.00021C13.6566 9.00021 14.9997 10.3434 14.9997 12.0002C14.9997 13.6571 13.6566 15.0002 11.9997 15.0002ZM11.9997 13.0002C12.552 13.0002 12.9997 12.5525 12.9997 12.0002C12.9997 11.4479 12.552 11.0002 11.9997 11.0002C11.4474 11.0002 10.9997 11.4479 10.9997 12.0002C10.9997 12.5525 11.4474 13.0002 11.9997 13.0002Z" fill="#404753"/></svg>';
  var SETTINGS_TITLE = { hu: "Keresési beállítások", en: "Search settings", de: "Sucheinstellungen", fr: "Paramètres de recherche", es: "Ajustes de búsqueda", it: "Impostazioni di ricerca", zh: "搜索设置" };
  var PRO_TEXT = {
    hu: { label: "Szakmai kereső", tip: "Összefoglaló helyett a jogi dokumentumok listáját kapja, a bírósági határozatokkal és az indokolásokkal együtt.", info: "Információ a szakmai keresőről" },
    en: { label: "Professional search", tip: "Instead of a summary, you get a list of legal documents, including court decisions and their reasoning.", info: "Information about the professional search" },
    de: { label: "Fachsuche", tip: "Statt einer Zusammenfassung erhalten Sie eine Liste der Rechtsdokumente, einschließlich Gerichtsentscheidungen und deren Begründungen.", info: "Informationen zur Fachsuche" },
    fr: { label: "Recherche professionnelle", tip: "Au lieu d’un résumé, vous obtenez la liste des documents juridiques, y compris les décisions de justice et leurs motifs.", info: "Informations sur la recherche professionnelle" },
    es: { label: "Búsqueda profesional", tip: "En lugar de un resumen, recibe la lista de documentos jurídicos, incluidas las resoluciones judiciales y su motivación.", info: "Información sobre la búsqueda profesional" },
    it: { label: "Ricerca professionale", tip: "Invece di un riepilogo, ottiene l’elenco dei documenti giuridici, comprese le decisioni giudiziarie e le relative motivazioni.", info: "Informazioni sulla ricerca professionale" },
    zh: { label: "专业搜索", tip: "您将获得法律文件列表（包括法院裁判及其理由），而不是摘要。", info: "有关专业搜索的信息" }
  };
  // az eles kereso: 3 karakternel rovidebb kerdesre hibauzenet a mezo alatt (searchbox.feedback.minChar)
  var MIN_CHARS = 3;
  var MIN_CHAR_TEXT = { hu: "Legalább 3 karaktert adjon meg.", en: "Please enter at least 3 characters.", de: "Bitte geben Sie mindestens 3 Zeichen ein.", fr: "Veuillez saisir au moins 3 caractères.", es: "Introduzca al menos 3 caracteres.", it: "Inserire almeno 3 caratteri.", zh: "请至少输入3个字符。" };
  // hangalapu bevitel (diktalas) a mezoben: Web Speech API; nem tamogatott bongeszoben a gomb rejtett
  var MIC_TEXT = {
    hu: { tip: "Diktálás", start: "Diktálás indítása", stop: "Diktálás leállítása", denied: "A mikrofon használata nem engedélyezett.", err: "A diktálás nem sikerült. Próbálja újra.", lang: "hu-HU" },
    en: { tip: "Dictation", start: "Start dictation", stop: "Stop dictation", denied: "Microphone access is not allowed.", err: "Dictation failed. Please try again.", lang: "en-US" },
    de: { tip: "Diktat", start: "Diktat starten", stop: "Diktat beenden", denied: "Der Mikrofonzugriff ist nicht erlaubt.", err: "Diktat fehlgeschlagen. Bitte versuchen Sie es erneut.", lang: "de-DE" },
    fr: { tip: "Dictée", start: "Démarrer la dictée", stop: "Arrêter la dictée", denied: "L’accès au microphone n’est pas autorisé.", err: "La dictée a échoué. Veuillez réessayer.", lang: "fr-FR" },
    es: { tip: "Dictado", start: "Iniciar dictado", stop: "Detener dictado", denied: "No se permite el acceso al micrófono.", err: "El dictado ha fallado. Inténtelo de nuevo.", lang: "es-ES" },
    it: { tip: "Dettatura", start: "Avvia dettatura", stop: "Interrompi dettatura", denied: "L’accesso al microfono non è consentito.", err: "Dettatura non riuscita. Riprovare.", lang: "it-IT" },
    zh: { tip: "语音输入", start: "开始语音输入", stop: "停止语音输入", denied: "不允许使用麦克风。", err: "语音输入失败，请重试。", lang: "zh-CN" }
  };
  var MIC = MIC_TEXT[LANG] || MIC_TEXT.en;
  var IC_MIC = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M11.9998 3C10.3429 3 8.99976 4.34315 8.99976 6V10C8.99976 11.6569 10.3429 13 11.9998 13C13.6566 13 14.9998 11.6569 14.9998 10V6C14.9998 4.34315 13.6566 3 11.9998 3ZM11.9998 1C14.7612 1 16.9998 3.23858 16.9998 6V10C16.9998 12.7614 14.7612 15 11.9998 15C9.23833 15 6.99976 12.7614 6.99976 10V6C6.99976 3.23858 9.23833 1 11.9998 1ZM3.05469 11H5.07065C5.55588 14.3923 8.47329 17 11.9998 17C15.5262 17 18.4436 14.3923 18.9289 11H20.9448C20.4837 15.1716 17.1714 18.4839 12.9998 18.9451V23H10.9998V18.9451C6.82814 18.4839 3.51584 15.1716 3.05469 11Z" fill="#404753"/></svg>';
  var PRO = PRO_TEXT[LANG] || PRO_TEXT.en;
  // Egyetlen kereso: a "Szakmai kereso" kapcsolo (?szakmai=1) allitja a talalati modot; a regi
  // /szakmai-jogi-informacio-kereso oldalak ide iranyitnak.
  var SEARCH_PAGE = (LANG === "hu" ? "" : "/" + LANG) + "/";
  var IS_PRO_PAGE = /\/szakmai-jogi-informacio-kereso(\/|$)/.test(location.pathname);
  var INIT_PRO = IS_PRO_PAGE || new URLSearchParams(location.search).get("szakmai") === "1";
  if (IS_PRO_PAGE) {
    var qs = new URLSearchParams(location.search); qs.set("szakmai", "1");
    location.replace(SEARCH_PAGE + "?" + qs.toString());
  }
  var FILTER_TEXT = {
    hu: { county: "Megye", selCounty: "Válasszon megyét", settlement: "Település", selSettlement: "Válasszon települést", date: "Válasszon dátumot", dateLabel: "Dátum", countyRequired: "A megye megadása kötelező." },
    en: { county: "County", selCounty: "Select a county", settlement: "Settlement", selSettlement: "Select a settlement", date: "Select a date", dateLabel: "Date", countyRequired: "Please select a county." },
    de: { county: "Komitat", selCounty: "Komitat auswählen", settlement: "Ortschaft", selSettlement: "Ortschaft auswählen", date: "Datum auswählen", dateLabel: "Datum", countyRequired: "Bitte wählen Sie ein Komitat." },
    fr: { county: "Comitat", selCounty: "Sélectionnez un comitat", settlement: "Localité", selSettlement: "Sélectionnez une localité", date: "Sélectionnez une date", dateLabel: "Date", countyRequired: "Veuillez sélectionner un comitat." },
    es: { county: "Condado", selCounty: "Seleccione un condado", settlement: "Localidad", selSettlement: "Seleccione una localidad", date: "Seleccione una fecha", dateLabel: "Fecha", countyRequired: "Seleccione un condado." },
    it: { county: "Contea", selCounty: "Seleziona una contea", settlement: "Località", selSettlement: "Seleziona una località", date: "Seleziona una data", dateLabel: "Data", countyRequired: "Selezionare una contea." },
    zh: { county: "县", selCounty: "选择县", settlement: "城镇", selSettlement: "选择城镇", date: "选择日期", dateLabel: "日期", countyRequired: "请选择县。" }
  };

  var PREFIX = LANG === "hu" ? "" : "/" + LANG;

  /* ---------------------------------------------------------------- ikonok */
  var IC = {
    search: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    cite: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    warn: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    up: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>',
    down: '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>',
    owl: '<svg aria-hidden="true" focusable="false" width="26" height="33" viewBox="0 0 26 33" xmlns="http://www.w3.org/2000/svg"><path d="M12.8333 33C9.25589 33 6.22264 31.7261 3.73358 29.1784C1.24453 26.6304 0 23.5559 0 19.9549V11.3172C0 8.03611 1.2786 5.32965 3.83579 3.19779C6.39299 1.06593 9.39217 0 12.8333 0C16.1098 0 19.0679 1.0366 21.7076 3.10979C24.347 5.18268 25.6667 7.91847 25.6667 11.3172V31.0961C25.6667 31.6345 25.4839 32.0864 25.1185 32.4518C24.7531 32.8173 24.3011 33 23.7627 33H12.8333ZM12.8333 31.1667H18.6505C17.5529 30.4028 16.6852 29.4197 16.0472 28.2173C15.4089 27.0152 15.0897 25.6949 15.0897 24.2564V22.4373C14.7136 22.4913 14.3434 22.5318 13.9792 22.5587C13.6149 22.5859 13.233 22.5995 12.8333 22.5995C10.6217 22.5995 8.52576 22.1288 6.54546 21.1874C4.56515 20.246 2.99444 18.8421 1.83333 16.9758V19.9549C1.83333 23.0575 2.89697 25.7018 5.02425 27.8878C7.15122 30.0737 9.75425 31.1667 12.8333 31.1667ZM16.923 24.2564C16.923 26.1603 17.5988 27.788 18.9503 29.1395C20.3017 30.4909 21.9294 31.1667 23.8333 31.1667V17.011C23.0389 18.2757 22.0481 19.3258 20.861 20.1612C19.6743 20.9969 18.3616 21.6216 16.923 22.0353V24.2564ZM12.8333 20.7662C15.7596 20.7662 18.3245 19.883 20.5278 18.1165C22.7315 16.3501 23.8333 14.0837 23.8333 11.3172C23.8333 10.1539 23.6207 9.05927 23.1953 8.03321C22.7697 7.00715 22.1739 6.10393 21.4078 5.32354C19.2876 5.45524 17.4813 6.24739 15.989 7.7C14.4963 9.15261 13.75 10.9343 13.75 13.0451C13.75 13.3057 13.6625 13.5236 13.4874 13.6987C13.3123 13.8741 13.0943 13.9618 12.8333 13.9618C12.5724 13.9618 12.3544 13.8741 12.1793 13.6987C12.0042 13.5236 11.9167 13.3057 11.9167 13.0451C11.9167 10.9343 11.1645 9.15032 9.66029 7.69312C8.15604 6.23562 6.34379 5.46104 4.22354 5.36938C3.48104 6.14977 2.89697 7.04535 2.47133 8.05613C2.046 9.0669 1.83333 10.1539 1.83333 11.3172C1.83333 14.0837 2.93517 16.3501 5.13883 18.1165C7.34219 19.883 9.90703 20.7662 12.8333 20.7662ZM6.875 12.6569C6.49672 12.6569 6.17879 12.5282 5.92121 12.271C5.66393 12.0137 5.53529 11.6958 5.53529 11.3172C5.53529 10.9389 5.66393 10.6211 5.92121 10.3638C6.17879 10.1062 6.49672 9.97746 6.875 9.97746C7.25328 9.97746 7.57121 10.1062 7.82879 10.3638C8.08607 10.6211 8.21471 10.9389 8.21471 11.3172C8.21471 11.6958 8.08607 12.0137 7.82879 12.271C7.57121 12.5282 7.25328 12.6569 6.875 12.6569ZM18.7917 12.6569C18.4134 12.6569 18.0955 12.5282 17.8379 12.271C17.5806 12.0137 17.452 11.6958 17.452 11.3172C17.452 10.9389 17.5806 10.6211 17.8379 10.3638C18.0955 10.1062 18.4134 9.97746 18.7917 9.97746C19.1699 9.97746 19.4879 10.1062 19.7455 10.3638C20.0027 10.6211 20.1314 10.9389 20.1314 11.3172C20.1314 11.6958 20.0027 12.0137 19.7455 12.271C19.4879 12.5282 19.1699 12.6569 18.7917 12.6569ZM6.0995 3.86421C7.60833 4.17435 8.95507 4.79829 10.1397 5.73604C11.3243 6.6741 12.2222 7.80939 12.8333 9.14192C13.4444 7.80939 14.3347 6.68005 15.504 5.75392C16.6734 4.82778 18.0125 4.19788 19.5213 3.86421C18.5931 3.22254 17.5618 2.72357 16.4276 2.36729C15.2937 2.01132 14.0956 1.83333 12.8333 1.83333C11.5711 1.83333 10.367 2.01132 9.22121 2.36729C8.07537 2.72357 7.0348 3.22254 6.0995 3.86421Z" fill="currentColor"/></svg>'
  };

  // legördülő javaslatok ikonjai (a valódi oldalról)
  var IC_TREND = '<svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M14 0L16.29 2.29L11.41 7.17L7.41 3.17L0 10.59L1.41 12L7.41 6L11.41 10L17.71 3.71L20 6V0H14Z" fill="#606B7A"/></svg>';
  var IC_HIST = '<svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 0C7.53 0 3.5 4.03 3.5 9H0.5L4.39 12.89L4.46 13.03L8.5 9H5.5C5.5 5.13 8.63 2 12.5 2C16.37 2 19.5 5.13 19.5 9C19.5 12.87 16.37 16 12.5 16C10.57 16 8.82 15.21 7.56 13.94L6.14 15.36C7.77 16.99 10.01 18 12.5 18C17.47 18 21.5 13.97 21.5 9C21.5 4.03 17.47 0 12.5 0ZM11.5 5V10L15.78 12.54L16.5 11.33L13 9.25V5H11.5Z" fill="#606B7A"/></svg>';

  // legördülő javaslatok (népszerű keresések + legutóbbi kereséseim)
  var POPULAR = [
    "Mely szerveknek kell elérhetővé tenni a közérdekből nyilvános adatait vagy közérdekű adatait?",
    "Mi az a közérdekű adat?",
    "Mennyi diákhitelt kaphatok?"
  ];
  var RECENT = [
    "A főbérlő azt mondta, két héten belül költözzek ki, pedig van érvényes bérleti szerződésem. Megteheti ezt, és mit tudok csinálni?",
    "Vettem egy mosógépet, két hónap után elromlott. A bolt azt mondja, nem az ő hibájuk. Mit kérhetek tőlük, és meddig?",
    "Hol kell adóznom, ha Magyarországon dolgozom, de külföldi lakcímmel rendelkezem?",
    "Most kaptam felmondást a munkahelyemen. Mennyi a felmondási időm, és mit kell tennem, ha nem értek vele egyet?",
    "Milyen bírósági gyakorlat alakult ki a munkáltatói felmondás indokának valóságával és okszerűségével kapcsolatban?"
  ];

  // A hivatkozott jogszabalyhelyek szovege (forras: Nemzeti Jogszabaltar, njt.jog.gov.hu; a mock offline marad)
  var LAW_TEXTS = {"mt":{"64":["64. § (1) A munkaviszony megszüntethető","a) közös megegyezéssel,","b) felmondással,","c) azonnali hatályú felmondással.","(2) A megszüntetés okának az indokolásból világosan ki kell tűnnie. A megszüntető jognyilatkozat indokának valóságát és okszerűségét a nyilatkozattevő bizonyítja.","(3) A munkáltató – a munkavállaló kérelmére – indokolási kötelesség hiányában is a (2) bekezdés szerint megindokolja a munkaviszony megszüntetésére irányuló jognyilatkozatát, ha a munkavállaló hivatkozása szerint a munkaviszony megszüntetésére","a) az 55. § (1) bekezdés l) pontja szerinti munkaidő-kedvezmény,","b) az apasági szabadság,","c) a szülői szabadság,","d) a 128. § szerint a gyermek gondozása céljából fizetés nélküli szabadság igénybevétele, vagy","e) a 61. § (2) és (4) bekezdése szerinti kérelme","miatt került sor.","(4) A munkavállaló a (3) bekezdés szerinti jognyilatkozat indokolását annak közlésétől számított tizenöt napon belül írásban kérheti. A munkáltató az indokolást a kérelem kézhezvételétől számított tizenöt napon belül írásban közli."],"65":["65. § (1) A munkaviszonyt mind a munkavállaló, mind a munkáltató felmondással megszüntetheti.","(2) A felek megállapodása esetén – legfeljebb a munkaviszony kezdetétől számított egy évig – a munkaviszony felmondással nem szüntethető meg.","(3) A munkáltató felmondással nem szüntetheti meg a munkaviszonyt","a) a várandósság,","b) a szülési szabadság,","c) az apasági szabadság,","d) a szülői szabadság,","e) a gyermek gondozása céljából igénybe vett fizetés nélküli szabadság (128. §, 130. §),","f) a tényleges önkéntes tartalékos katonai szolgálatteljesítés,","g) a nő jogszabály szerinti, az emberi reprodukciós eljárással összefüggő kezelésének, de legfeljebb ennek megkezdésétől számított hat hónap, és","h) az 55. § (1) bekezdés l) pontja szerinti mentesülés","tartama alatt.","(4) A (3) bekezdés szerinti védelem alkalmazása szempontjából a felmondás közlésének, csoportos létszámcsökkentés esetén a 75. § (1) bekezdés szerinti tájékoztatás közlésének időpontja az irányadó.","(5) A munkavállaló a (3) bekezdés a) és g) pontjában meghatározott körülményre akkor hivatkozhat, ha erről a munkáltatót tájékoztatta. A felmondás közlését követő munkavállalói tájékoztatástól számított tizenöt napon belül a munkáltató a felmondást írásban visszavonhatja.","(6) A felmondás visszavonása esetén a 83. § (2)–(4) bekezdését kell alkalmazni."],"66":["66. § (1) A munkáltató felmondását köteles megindokolni.","(2) A felmondás indoka a munkavállaló munkaviszonnyal kapcsolatos magatartásával, képességével vagy a munkáltató működésével összefüggő ok lehet.","(3) Kizárólag","a) a munkáltató személyében bekövetkező változás,","b) a 99. § (3) bekezdése, a 109. § (2) bekezdése vagy a 135. § (3)–(4) bekezdése szerinti megállapodás munkavállaló általi felmondása","nem szolgálhat a munkáltató felmondásának indokául.","(4) A munkáltató a nyugdíjasnak nem minősülő munkavállaló határozatlan tartamú munkaviszonyát a munkavállalóra irányadó öregségi nyugdíjkorhatár betöltését megelőző öt éven belül a munkavállaló munkaviszonnyal kapcsolatos magatartásával indokolt felmondással a 78. § (1) bekezdésében meghatározott okból szüntetheti meg.","(5) A (4) bekezdésben meghatározott munkavállaló munkaviszonya a munkavállaló képességével vagy a munkáltató működésével összefüggő okból akkor szüntethető meg, ha a munkáltatónál a 45. § (3) bekezdése szerinti munkahelyen nincs a munkavállaló által betöltött munkakörhöz szükséges képességnek, végzettségnek, gyakorlatnak megfelelő betöltetlen másik munkakör vagy a munkavállaló az e munkakörben való foglalkoztatásra irányuló ajánlatot elutasítja.","(6) Az anya vagy a gyermekét egyedül nevelő apa munkaviszonyának felmondással történő megszüntetése esetén a gyermek hároméves koráig a (4)–(5) bekezdésben foglaltakat kell alkalmazni, ha a munkavállaló szülési vagy a gyermek gondozása céljából fizetés nélküli szabadságot [128. § (1) és (2) bekezdése] nem vesz igénybe.","(7) A munkáltató a rehabilitációs ellátásban vagy rehabilitációs járadékban részesülő munkavállaló munkaviszonyát a munkavállaló egészségi okkal összefüggő képességével indokolt felmondással akkor szüntetheti meg, ha a munkavállaló eredeti munkakörében nem foglalkoztatható tovább és a munkavállaló számára állapotának egészségi szempontból megfelelő munkakört nem tud felajánlani, vagy a munkavállaló a felajánlott munkakört alapos ok nélkül nem fogadja el.","(8) A munkáltató a határozott idejű munkaviszonyt felmondással megszüntetheti","a) a felszámolási– vagy csődeljárás tartama alatt vagy","b) a munkavállaló képességére alapított okból vagy","c) ha a munkaviszony fenntartása elháríthatatlan külső ok következtében lehetetlenné válik.","(9) A munkáltató a határozatlan tartamú munkaviszony felmondással történő megszüntetését nem köteles indokolni, ha a munkavállaló nyugdíjasnak minősül."],"68":["68. § (1) A felmondási idő legkorábban a felmondás közlését követő napon kezdődik.","(2) A munkáltató felmondása esetén a felmondási idő legkorábban az alábbiakban meghatározott tartam lejártát követő napon kezdődik:","a) a betegség miatti keresőképtelenség, legfeljebb azonban a betegszabadság lejártát követő egy év,","b) a beteg gyermek ápolása címén fennálló keresőképtelenség,","c) a hozzátartozó otthoni gondozása céljából kapott fizetés nélküli szabadság.","(3) A (2) bekezdésben foglaltakat csoportos létszámcsökkentés esetén abban az esetben kell alkalmazni, ha a (2) bekezdésben meghatározott körülmények a 75. § (1) bekezdés szerinti tájékoztatás közlésének időpontjában fennálltak."],"69":["69. § (1) A felmondási idő harminc nap.","(2) A munkáltató felmondása esetén a felmondási idő a munkáltatónál munkaviszonyban töltött","a) három év után öt nappal,","b) öt év után tizenöt nappal,","c) nyolc év után húsz nappal,","d) tíz év után huszonöt nappal,","e) tizenöt év után harminc nappal,","f) tizennyolc év után negyven nappal,","g) húsz év után hatvan nappal","meghosszabbodik.","(3) A felek az (1)–(2) bekezdésben foglaltaknál hosszabb, legfeljebb hathavi felmondási időben is megállapodhatnak.","(4) A felmondási idő számítása szempontjából a 77. § (2) bekezdésében meghatározott tartamot nem kell figyelembe venni.","(5) A felmondási idő a határozott idejű munkaviszony felmondással történő megszüntetése esetén legfeljebb a határozott idő lejártáig tart."],"77":["77. § (1) A munkavállalót végkielégítés illeti meg, ha munkaviszonya","a) a munkáltató felmondása,","b) a munkáltató jogutód nélküli megszűnése, vagy","c) a 63. § (1) bekezdés d) pontja","alapján szűnik meg.","(2) A végkielégítésre való jogosultság feltétele, hogy a munkaviszony a felmondás közlésének vagy a munkáltató jogutód nélküli megszűnésének időpontjában a (3) bekezdésben meghatározott tartamban fennálljon. A végkielégítésre való jogosultság szempontjából nem kell figyelembe venni azt az egybefüggően legalább harminc napot meghaladó tartamot, amelyre a munkavállalót munkabér nem illette meg, kivéve","a) a szülési szabadság, a szülői szabadság és a gyermek ápolása, gondozása céljából igénybe vett fizetés nélküli szabadság (128. §),","b) a tényleges önkéntes tartalékos katonai szolgálatteljesítés céljából igénybe vett fizetés nélküli szabadság (132. §) három hónapot meg nem haladó","tartamát.","(3) A végkielégítés mértéke","a) legalább három év esetén egyhavi,","b) legalább öt év esetén kéthavi,","c) legalább tíz év esetén háromhavi,","d) legalább tizenöt év esetén négyhavi,","e) legalább húsz év esetén öthavi,","f) legalább huszonöt év esetén hathavi","távolléti díj összege.","(4) A végkielégítésnek a (3) bekezdés","a) a)–b) pontban meghatározott mértéke egyhavi,","b) c)–d) pontban meghatározott mértéke kéthavi,","c) e)–f) pontban meghatározott mértéke háromhavi","távolléti díj összegével emelkedik, ha a munkaviszony az (1) bekezdésben meghatározott módon és a munkavállalóra irányadó öregségi nyugdíjkorhatár betöltését megelőző öt éven belül szűnik meg.","(5) Nem jár végkielégítés a munkavállalónak, ha","a) a felmondás közlésének vagy a munkáltató jogutód nélküli megszűnésének időpontjában nyugdíjasnak minősül, vagy","b) a felmondás indoka a munkavállaló munkaviszonnyal kapcsolatos magatartása vagy a nem egészségi okkal összefüggő képessége."],"82":["82. § (1) A munkáltató köteles megtéríteni a munkaviszony jogellenes megszüntetésével összefüggésben okozott kárt.","(2) A munkaviszony körében elmaradt jövedelem címén igényelt kártérítés nem haladhatja meg a munkavállaló tizenkéthavi távolléti díjának összegét.","(3) A munkavállaló az (1) bekezdésben foglaltakon túlmenően jogosult a végkielégítés összegére, ha munkaviszonya","a) jogellenesen nem felmondással szűnt meg, vagy","b) munkaviszonya megszűnésekor a 77. § (5) bekezdés b) pontja alapján nem részesült végkielégítésben.","(4) A munkavállaló az (1)–(2) bekezdésben foglaltak helyett követelheti a munkáltatói felmondás esetén irányadó felmondási időre járó távolléti díjnak megfelelő összeget."],"83":["83. § (1) A munkavállaló kérelmére a bíróság a munkaviszonyt helyreállítja, ha","a) a munkaviszony megszüntetése","aa) az egyenlő bánásmód követelményébe,","ab) a joggal való visszaélés tilalmába,","ac) a 65. § (3) bekezdésébe, vagy","ad) a 273. § (1) bekezdésébe ütközött,","b) a munkavállaló a munkaviszony megszüntetésekor munkavállalói képviselő volt, vagy","c) a munkavállaló a munkaviszony közös megegyezéssel történő megszüntetését vagy erre irányuló saját jognyilatkozatát sikerrel támadta meg.","(2) A munkaviszony helyreállítását követően keletkezett, a munkaviszonyban töltött időhöz kapcsolódó jogosultság tekintetében a munkaviszony megszüntetése (megszűnése) és annak helyreállítása közötti tartamot munkaviszonyban töltött időnek kell tekinteni.","(3) Meg kell téríteni a munkavállaló elmaradt munkabérét, egyéb járandóságát és ezt meghaladó kárát. Elmaradt munkabérként a munkavállaló távolléti díját kell figyelembe venni.","(4) Az elmaradt munkabér és egyéb járandóság összegének számításánál le kell vonni,","a) amit a munkavállaló megkeresett, vagy az adott helyzetben elvárhatóan megkereshetett volna, továbbá","b) a munkaviszony megszüntetésekor kifizetett végkielégítést."],"287":["287. § (1) A keresetlevelet a munkáltatói jognyilatkozat közlésétől számított harminc napon belül kell előterjeszteni","a) az egyoldalú munkaszerződés-módosítással,","b) a munkaviszony megszüntetésének jogellenességével,","c) a munkavállaló kötelezettségszegése miatt alkalmazott jogkövetkezménnyel,","d) a fizetési felszólítással, továbbá","e) a 81. § (2) bekezdésében meghatározottakkal","kapcsolatos igény érvényesítése iránt.","(1a) A keresetlevelet a 61. § (6) bekezdése és a 64. § (4) bekezdése szerinti igény érvényesítése esetén a munkáltató jognyilatkozatának közlésétől, vagy a jognyilatkozat megtételére rendelkezésre álló határidő lejártától számított harminc napon belül kell előterjeszteni.","(2) A munkavállaló","a) 40. § szerinti felmondásával, vagy","b) 78. § szerinti azonnali hatályú felmondásával","kapcsolatos igény az elévülési időn belül érvényesíthető.","(3) A munkaviszony megszüntetésére vonatkozó megállapodás vagy egyoldalú jognyilatkozat megtámadása esetén a keresetlevelet a megtámadás eredménytelenségének megállapításától számított harminc napon belül lehet előterjeszteni. A megtámadás eredménytelen, ha a másik fél annak közlésétől számított tizenöt napon belül nem válaszol, vagy azt nem fogadja el.","(4) A keresetlevél beadására megállapított határidőt megtartottnak kell tekinteni, ha a keresetlevelet legkésőbb a határidő utolsó napján postára adták. Az igényt érvényesítő igazolással élhet, ha a keresetlevél beadására megállapított határidőt elmulasztja. Az igény hat hónap elteltével nem érvényesíthető.","(5) A keresetlevél benyújtásának – az (1) bekezdés c)–d) pontban foglaltakat kivéve – halasztó hatálya nincs."]},"art":{"4":["4. § [A nemzetközi szerződéssel érintett jövedelem magyarországi adóztatása]","(1) Ha törvénnyel, kormányrendelettel kihirdetett nemzetközi szerződéssel érintett jogviszonyok, ebből származó jövedelmek tekintetében a rendelkezésre álló tényeknek vagy a vonatkozó nemzetközi szerződés rendelkezéseinek államok közötti eltérő értelmezése azt eredményezi, hogy az adott jogviszonyból származó jövedelmet egyik állam sem tekinti belföldön adóztathatónak, akkor Magyarország nem mentesíti ezt a jövedelmet az adóztatás alól.","(2) Nemzetközi szerződés rendelkezése alapján állampolgárság szerint megkülönböztetést lehet tenni."],"41":["41. § [Külföldi illetőségű természetes személyek bejelentése]","(1) A jogi személy és egyéb szervezet az állami adó- és vámhatósághoz bejelenti azt a székhelyére, telephelyére az adóévben nem önálló tevékenység végzésére kirendelt, a tevékenység megkezdése, illetve – ha a munkavégzés céljából Magyarországra történő utazása ezt megelőzi – a beutazása előtti napon külföldi illetőségű természetes személyt,","a) akinek – a tevékenység megkezdésekor ismert körülmények alapján – az adóévben az Szja tv., illetve a rá vonatkozó kettős adóztatás elkerüléséről szóló egyezmény vagy viszonosság értelmében várhatóan személyi jövedelemadó-kötelezettsége keletkezik,","b) akinek a tevékenysége megkezdésekor ismert körülmények változása következtében az adóévben az Szja tv., illetve a rá vonatkozó kettős adóztatás elkerüléséről szóló egyezmény értelmében személyi jövedelemadó-kötelezettsége keletkezik.","(1a) A közfeladatot ellátó közérdekű vagyonkezelő alapítvány, a HUN-REN Magyar Kutatási Hálózat (a továbbiakban: HUN-REN) és a felsőoktatási intézmény az állami adó- és vámhatósághoz bejelenti azt a külföldi illetőségű természetes személyt, akinek a közfeladatot ellátó közérdekű vagyonkezelő alapítvánnyal, a HUN-REN-nel vagy a felsőoktatási intézménnyel fennálló munkavégzésre irányuló jogviszonya alapján várhatóan személyi jövedelemadó-fizetési kötelezettsége keletkezik.","(2) Az (1) bekezdés a) pontja és az (1a) bekezdés esetében a tevékenység megkezdésétől számított harminc napon belül, az (1) bekezdés b) pontja esetében pedig a személyi jövedelemadó-kötelezettség keletkezését követő harminc napon belül kell a bejelentési kötelezettséget teljesíteni.","(3) Az (1) és (1a) bekezdésben előírt bejelentés tartalmazza:","a) a külföldi illetőségű természetes személy természetes személyazonosító adatait, lakcímét, állampolgárságát,","b) a munkavégzés megkezdésének időpontját,","c) a munkavégzésre megbízást adó külföldi szervezet vagy természetes személy nevét, székhelyét, telephelyét, illetve lakóhelyét.","(4) Az (1) bekezdésben, illetve az (1a) bekezdésben meghatározott személy az állami adó- és vámhatósághoz bejelenti a székhelyére, telephelyére nem önálló tevékenység végzésére kirendelt, illetve a közfeladatot ellátó közérdekű vagyonkezelő alapítvánnyal, a HUN-REN-nel vagy a felsőoktatási intézménnyel fennálló munkavégzésre irányuló jogviszonyban álló külföldi illetőségű természetes személy munkavégzése befejezésének időpontját és – ha az adat a munkavégzéssel kapcsolatban rendelkezésére áll – Magyarország területe elhagyásának időpontját. A bejelentést a munkavégzés befejezése, illetve az ország területe elhagyása előtt harminc nappal kell megtenni. Ha a munkavégzés befejezésének időpontja a munkavégzésre irányuló jogviszony azonnali hatályú megszűnése miatt vagy más okból e határidőben nem áll a bejelentésre kötelezett rendelkezésére, akkor a bejelentést a munkavégzés befejezése napját követő napon az ok megjelölésével kell az állami adó- és vámhatósághoz teljesíteni."]},"szja":{"1":["1. § (1) Magyarországon a magánszemélyek a jövedelmükből a közterhekhez való hozzájárulás alkotmányos kötelezettségének e törvény rendelkezései szerint tesznek eleget, figyelemmel az adóigazgatási jogszabályokban foglaltakra is.","(2) E törvény célja az arányosság és a méltányosság elvének érvényesítésével az állami feladatok ellátásához szükséges adóbevétel biztosítása, kivételesen egyes társadalmi, gazdasági célok megvalósulásának elősegítése.","(3) A magánszemély minden jövedelme adóköteles. Ettől eltérő szabályt, az adóból kedvezményt a kivételes célok érdekében – e törvény alapelveinek figyelembevételével – csak törvény állapíthat meg. Az adó alapja az adóköteles bevételből megállapított, e törvény rendelkezései szerinti levonásokkal csökkentett jövedelem és az adóalap-növelő tételek összege.","(4) Az adókötelezettséget, az adó mértékét befolyásoló, a magánszemély adójának csökkenését eredményező eltérő szabály, adókedvezmény annyiban alkalmazható, illetőleg érvényesíthető, amennyiben az annak alapjául szolgáló szerződés, jogügylet, más hasonló cselekmény tartalma megvalósítja az eltérő szabály, az adókedvezmény célját. Az alkalmazhatóságot, illetőleg érvényesíthetőséget annak kell bizonyítania, akinek az érdekében áll. Ha a felek akár a szokásos piaci értékektől, áraktól való eltérítésekkel, akár színlelt jogügyletekkel kívánják érvényesíteni, növelni az adószabályok alkalmazásának előnyeit, akkor azokat az adókötelezettség megállapítása során figyelmen kívül kell hagyni.","(5) A magánszemély vagy annak adózásában közreműködő, azt befolyásoló más személy egyaránt köteles a vonatkozó rendelkezések alkalmazása során az adókötelezettséget, az adó mértékét befolyásoló tényezők esetében érvényesíteni az ezen §-ban foglalt alapelveket.","(6) Az adót – egyes kivételekkel – naptári évenként, az összes jövedelem alapján kell megállapítani és megfizetni, azonban az adóbevételek folyamatossága érdekében adóelőleget kell fizetni.","(7) Az érvénytelen szerződés alapján, vagy egyébként jogalap nélkül megszerzett bevétel után megfizetett adó (adóelőleg) az eredeti állapot helyreállítását követően, az önellenőrzésre irányadó rendelkezések megfelelő alkalmazásával igényelhető vissza. Ha az eredeti állapot helyreállítása már az adókötelezettség teljesítési határidejének lejárta előtt megtörtént, akkor az említett bevétellel összefüggésben adókötelezettség nem keletkezik.","(8) Az érvénytelen szerződés, vagy egyébként jogalap nélküli kiadás alapján érvényesített költséggel, levonással megállapított jövedelmet és adót (adóelőleget), vagy az adót (adóelőleget) csökkentő jogosultságot az eredeti állapot helyreállítását követően az önellenőrzésre irányadó rendelkezések megfelelő alkalmazásával helyesbíteni kell. Ha az érvénytelenség vagy a jogalap hiánya már a jövedelem és az adó (adóelőleg) megállapítása előtt fennáll, akkor a kiadás alapján költség, levonás, az adót (adóelőleget) csökkentő jogosultság nem érvényesíthető.","(9) Az adókötelezettség jogcímét, valamint az adókötelezettségeket (ideértve a jövedelem megállapítását is)","a) elmaradt jövedelemre tekintettel kifizetett, juttatott kártérítés, kártalanítás, kárpótlás címén megszerzett bevétel esetén az elmaradt jövedelemre irányadó rendelkezések szerint kell meghatározni;","b) késedelmi kamat vagy kötbér címén megszerzett bevétel esetén azon bevételre irányadó rendelkezések szerint kell meghatározni, amelynek késedelmes, illetve nem vagy nem szerződésszerű teljesítésére tekintettel a kifizetése, juttatása történt.","(10) Ha a magánszemélyt egy adott bevétel az általa vagy más személy által végzett önálló vagy nem önálló tevékenység ellenértékeként illeti meg – törvény eltérő rendelkezésének hiányában – e bevétel adókötelezettségének megállapítására az adóalapba nem tartozó tételnek minősülő bevételre, a béren kívüli juttatásra, az egyes meghatározott juttatásra vonatkozó szabály nem alkalmazható."]},"ptk":{"6:158":["6:158. § [Hibás teljesítési vélelem]","Fogyasztó és vállalkozás közötti szerződés esetén az ellenkező bizonyításáig vélelmezni kell, hogy a teljesítést követő hat hónapon belül a fogyasztó által felismert hiba már a teljesítés időpontjában megvolt, kivéve, ha e vélelem a dolog természetével vagy a hiba jellegével összeegyeztethetetlen."],"6:159":["6:159. § [Kellékszavatossági jogok]","(1) Olyan szerződés alapján, amelyben a felek kölcsönös szolgáltatásokkal tartoznak, a kötelezett a hibás teljesítésért kellékszavatossággal tartozik.","(2) Kellékszavatossági igénye alapján a jogosult választása szerint","a) kijavítást vagy kicserélést igényelhet, kivéve, ha a választott kellékszavatossági jog teljesítése lehetetlen, vagy ha az a kötelezettnek - másik kellékszavatossági igény teljesítésével összehasonlítva - aránytalan többletköltséget eredményezne, figyelembe véve a szolgáltatás hibátlan állapotban képviselt értékét, a szerződésszegés súlyát és a kellékszavatossági jog teljesítésével a jogosultnak okozott érdeksérelmet; vagy","b) az ellenszolgáltatás arányos leszállítását igényelheti, – a (2a) bekezdés szerinti kivétellel – a hibát a kötelezett költségére maga kijavíthatja vagy mással kijavíttathatja, vagy a szerződéstől elállhat, ha a kötelezett a kijavítást vagy a kicserélést nem vállalta, e kötelezettségének a (4) bekezdés szerinti feltételekkel nem tud eleget tenni, vagy ha a jogosultnak a kijavításhoz vagy kicseréléshez fűződő érdeke megszűnt.","(2a) Fogyasztó és vállalkozás közötti – ingó dolognak minősülő áru adásvételére, digitális tartalom szolgáltatására vagy digitális szolgáltatások nyújtására irányuló – szerződés esetén a fogyasztó kellékszavatossági jogai gyakorlása keretében a hibát a kötelezett költségére maga nem javíthatja ki, illetve mással sem javíttathatja ki azt.","(3) Jelentéktelen hiba miatt elállásnak nincs helye.","(4) A kijavítást vagy kicserélést - a dolog tulajdonságaira és a jogosult által elvárható rendeltetésére figyelemmel - megfelelő határidőn belül, a jogosult érdekeit kímélve kell elvégezni."],"6:163":["6:163. § [A kellékszavatossági igény elévülése]","(1) A jogosult kellékszavatossági igénye a teljesítés időpontjától számított egy év alatt évül el.","(2) Fogyasztó és vállalkozás közötti szerződés esetén a fogyasztó kellékszavatossági igénye a teljesítés időpontjától számított két év alatt évül el. Ha a fogyasztó és a vállalkozás közötti szerződés tárgya használt dolog, a felek rövidebb elévülési időben is megállapodhatnak; egy évnél rövidebb elévülési határidő ebben az esetben sem köthető ki érvényesen.","(3) Ha a szerződés alapján szolgáltatott dolog ingatlan, a kellékszavatossági igény a teljesítés időpontjától számított öt év alatt évül el.","(4) Nem számít bele az elévülési időbe a kijavítási időnek az a része, amely alatt a jogosult a dolgot rendeltetésszerűen nem tudja használni.","(5) A dolognak a kicseréléssel vagy a kijavítással érintett részére a kellékszavatossági igény elévülése újból kezdődik. Ezt a szabályt kell alkalmazni arra az esetre is, ha a kijavítás következményeként új hiba keletkezik."]},"korm45":{"1":["1. § (1) E rendeletben foglaltakat a fogyasztó és a vállalkozás között kötött szerződésekre (a továbbiakban: fogyasztói szerződés) kell alkalmazni, amikor a fogyasztó kifizeti vagy vállalja, hogy kifizeti az áru vagy szolgáltatás ellenértékét. E rendelet víz, gáz, villamos energia vagy távfűtés – akár közszolgáltatók általi – szolgáltatására vonatkozó szerződésekre is alkalmazandó, ha ezeket az árukat szerződés alapján biztosítják.","(1a) E rendeletben foglaltakat abban az esetben is alkalmazni kell, ha a vállalkozás nem tárgyi adathordozón rögzített digitális tartalmat szolgáltat vagy digitális szolgáltatást nyújt vagy szolgáltatás nyújtását vállalja, a fogyasztó pedig személyes adatokat szolgáltat vagy ilyen adatok szolgáltatását vállalja a vállalkozás részére, kivéve, ha a fogyasztó által szolgáltatott személyes adatokat a vállalkozás kizárólag a 2011/83/EU európai parlamenti és tanácsi irányelvnek megfelelő, nem tárgyi adathordozón rögzített digitális tartalom vagy digitális szolgáltatás biztosításának vagy a vállalkozásra vonatkozó jogi követelményeknek való megfelelés lehetővé tétele céljából kezeli, és a kereskedő semmilyen más célból nem kezeli ezeket az adatokat.","(2) E rendelet meghatározza a fogyasztói szerződéssel kapcsolatos tájékoztatás és a teljesítés egyes szabályait, továbbá a távollévők között és az üzlethelyiségen kívül kötött fogyasztói szerződés esetében a szerződés megkötésére és az elállási, illetve a felmondási jogra vonatkozó részletes szabályokat.","(3) E rendeletet akkor kell alkalmazni, ha az Európai Unió általános hatályú, közvetlenül alkalmazandó jogi aktusa vagy az Európai Unió kötelező jogi aktusát átültető jogszabály eltérően nem rendelkezik.","(4) E rendeletben foglaltaktól a fogyasztó javára a felek megállapodása eltérhet."]},"vht":{"154/A":["154/A. § (1) Az adós és az adós jogán az ingatlanban lakó személyek – a (3) és (4) bekezdésben foglalt kivétellel – az árveréstől számított 30. napig, ha a végrehajtó ennél hosszabb határidőt adott a vételár megfizetésére, eddig az időpontig, jogorvoslat előterjesztése esetén pedig az erről szóló határozat rendelkezése szerint a határozat jogerőre emelkedésétől számított 15. napig kötelesek az ingatlant ingóságaiktól kiürítve elhagyni, és biztosítani, hogy a végrehajtó átadja azt az árverési vevőnek.","(2) A végrehajtást foganatosító bíróság a jogorvoslat benyújtásáról, a jogorvoslatot elbíráló bíróság pedig a jogorvoslatot elbíráló határozat jogerőre emelkedéséről tájékozatja a végrehajtót, és részére a határozatot megküldi.","(3) Az adós és a vele lakó személyek ideiglenesen mentesülnek a kiköltözési kötelezettség alól, ha a vételár kifizetése határidőben nem történt meg; ebben az esetben a teljes vételár kifizetésétől számított 30 napon belül kell kiköltözni az ingatlanból.","(4) A végrehajtást foganatosító bíróság az adósnak a – becsérték közlésének kézhezvételétől számított 15 napon belül előterjesztett – kérelmére az ingatlan elhagyására egyszeri halasztást adhat, ha az ingatlan a 147. § (3) és (4) bekezdésében foglaltaknak megfelel, és az adós az elhelyezését ideiglenesen sem tudja biztosítani. Nincs helye halasztásnak, ha az adóst az eljárás során korábban rendbírsággal sújtották, vagy kérelmére a bíróság legalább 6 hónapra a halasztásra is okot adó körülmény miatt a végrehajtást felfüggesztette.","(5) A halasztás időtartama legfeljebb az árverés időpontjától számított 6 hónapig terjedhet.","(6) A halasztás iránti kérelemben meg kell jelölni a halasztás indokát és a kérelem alaposságát valószínűsítő körülményeket, azt, hogy a kérelmező mely címről, illetve rövid úton milyen módon idézhető a meghallgatáson való megjelenésre, a kérelmet alátámasztó iratokat pedig csatolni kell. Ha a kérelem elbírálásához a kérelmező meghallgatása szükséges, a bíróság a meghallgatásra a kérelem beérkezésétől számított 8 napon belüli határnapot tűz ki, és erre a kérelmezőt azzal idézi, hogy távolmaradása (képviselőjének távolmaradása) a kérelem elintézésének nem akadálya.","(7) A kérelemről a beérkezését követő 8 napon belül, meghallgatás tartása esetén a meghallgatáson kell dönteni.","(8) A halasztás tárgyában hozott döntést haladéktalanul kézbesíteni kell a kérelmezőnek. A halasztást elrendelő végzést, illetve az elutasító végzés elleni fellebbezésről szóló értesítést a végrehajtó részére is meg kell küldeni.","(9) A kérelmet elutasító végzés ellen a kérelmező fellebbezhet. A fellebbezést a végzés kézbesítésétől számított 15 napon belül, meghallgatás esetén a végzés kihirdetésekor lehet bejelenteni. Fellebbezés esetén az árverés megtartható, de az árverési vevőt tájékoztatni kell a halasztás tárgyában folyamatban levő eljárásról.","(10) Ha a kiköltözésre az (1) és (5) bekezdésben foglalt időpontig nem került sor az árverési vevő a kiköltözési határidő lejártát követő 15. napig kérelmezheti az ingatlan birtokba adását.","(11) A végrehajtó köteles – a lakóingatlan birtokba adására irányuló kérelem részére történt kézbesítését követő 8 napon belül – tájékoztatni a lakóingatlan fekvése szerint illetékes jegyzőt arról, hogy az árverési vevő az ingatlan birtokba adására irányuló kérelmet terjesztett elő.","(12) A végrehajtó az árverési vevő kérelmére – szükség esetén rendőrség közreműködésével – akkor intézkedik az ingatlan birtokba adása iránt a 182. § és a 182/A. § megfelelő alkalmazásával, ha a (11) bekezdés szerint a jegyző részére megküldött tájékoztatástól 60 nap eltelt.","(13) Az ingatlan birtokba adása során a végrehajtást kérő jogai és kötelezettségei az árverési vevőt illetik meg, illetve terhelik."],"183/A":["183/A. § (1) A bérbeadó a határozott időre kötött lakás- és más – nem lakás céljára szolgáló – helyiségbérleti szerződés esetén a meghatározott idő lejártát követő 60 napon belül kérheti a 183. §-ban meghatározott rendelkezések alkalmazását, ha a kérelem benyújtásával egyidejűleg igazolja, hogy a bérleti szerződésben meghatározott idő eltelt. A kiürítés iránti kérelem benyújtására nyitva álló határidő jogvesztő.","(2) Az (1) bekezdés szerinti eljárás során is alkalmazni kell a 182/A. § rendelkezéseit azzal, hogy az ingatlan a kiürítés elhalasztása szempontjából nem minősül önkényesen elfoglalt lakásnak."]},"andorra":{"1":["1. § Az Országgyűlés e törvénnyel felhatalmazást ad a Magyarország és az Andorrai Hercegség között a jövedelemadók területén a kettős adóztatás elkerüléséről és az adókijátszás és adóelkerülés megakadályozásáról szóló Egyezmény (a továbbiakban: Egyezmény) kötelező hatályának elismerésére."],"2":["2. § Az Országgyűlés az Egyezményt e törvénnyel kihirdeti."]}};
  var LAW_MAP = {
    "2012. évi I. törvény 64. §":["mt",["64"]],
    "2012. évi I. törvény 65. §":["mt",["65"]],
    "2012. évi I. törvény 82. §, 83. §":["mt",["82","83"]],"2012. évi I. törvény 64. §, 66. §, 68–69. §":["mt",["64","66","68","69"]],"2012. évi I. törvény 77. §, 82–83. §, 287. §":["mt",["77","82","83","287"]],"2012. évi I. törvény 64. §, 65. §":["mt",["64","65"]],"2012. évi I. törvény 82. §, 83. §":["mt",["82","83"]],"2022. évi XXXIII. törvény":["andorra",["1","2"]],"2017. évi CL. törvény 4. §, 41. §":["art",["4","41"]],"1995. évi CXVII. törvény 1.":["szja",["1"]],"2013. évi V. törvény 6:159. §, 6:158. §, 6:163. §":["ptk",["6:158","6:159","6:163"]],"45/2014. (II. 26.) Korm. rendelet 1.":["korm45",["1"]],"1994. évi LIII. törvény 183/A. §, 154/A. §":["vht",["154/A","183/A"]]};

  var CITE_HREF = "https://njt.hu/";
  var LAW_UI = {
    hu: { na: "A jogszabályhely szövege jelenleg nem érhető el.", src: "Forrás: Nemzeti Jogszabálytár (njt.jog.gov.hu)", open: "Jogszabályszöveg megnyitása" },
    en: { na: "The text of this provision is not available at the moment.", src: "Source: National Legislation Database (njt.jog.gov.hu), Hungarian original", open: "Open legal text" },
    de: { na: "Der Text dieser Vorschrift ist derzeit nicht verfügbar.", src: "Quelle: Nationale Rechtsdatenbank (njt.jog.gov.hu), ungarisches Original", open: "Gesetzestext öffnen" },
    fr: { na: "Le texte de cette disposition n'est pas disponible pour le moment.", src: "Source : Base nationale de la législation (njt.jog.gov.hu), original hongrois", open: "Ouvrir le texte juridique" },
    es: { na: "El texto de esta disposición no está disponible por el momento.", src: "Fuente: Base de datos nacional de legislación (njt.jog.gov.hu), original húngaro", open: "Abrir el texto legal" },
    it: { na: "Il testo di questa disposizione non è al momento disponibile.", src: "Fonte: Banca dati nazionale della legislazione (njt.jog.gov.hu), originale ungherese", open: "Apri il testo normativo" },
    zh: { na: "该条文文本暂时无法查看。", src: "来源：国家法律数据库（njt.jog.gov.hu），匈牙利语原文", open: "打开法律文本" }
  };
  function cite() { return ""; }
  function lawLink(l, cls) {
    return '<a href="#" class="ms-law-link' + (cls ? " " + cls : "") + '" role="button" aria-haspopup="dialog" data-ref="' + String(l.ref).replace(/"/g, "&quot;") + '" data-desc="' + String(l.desc).replace(/"/g, "&quot;") + '">' + l.ref + '</a>';
  }
  var lawDlg = null, lawOpener = null;
  // Ha a jogszabalyhely egy MAR NYITOTT parbeszedablakbol nyilik (pl. a "Legutobbi kereseim" valasza), nem nyitunk ujabb
  // ablakot: a tartalom ugyanabban az ablakban jelenik meg, bal felso "Vissza" nyillal, ami az elozo tartalomhoz visz.
  function subViewClean(dlg) {
    var v = dlg.querySelector(":scope > .ms-sub-view"); if (v) v.remove();
    [].slice.call(dlg.children).forEach(function (c) { c.classList.remove("ms-sub-hidden"); });
    dlg.style.height = "";
    if (dlg._subLabel != null) { if (dlg._subLabel) dlg.setAttribute("aria-labelledby", dlg._subLabel); else dlg.removeAttribute("aria-labelledby"); dlg._subLabel = null; }
  }
  function subViewBack(dlg, focusEl) {
    var sc = dlg._subScroll; subViewClean(dlg);
    var body = dlg.querySelector(".ms-rd-body, .ms-law-text"); if (body && sc != null) body.scrollTop = sc;
    if (focusEl && focusEl.isConnected && focusEl.focus) try { focusEl.focus({ preventScroll: true }); } catch (er) {}
  }
  function openLawInDialog(dlg, ref, desc, body, U, opener) {
    function e3(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    if (dlg.querySelector(":scope > .ms-sub-view")) subViewClean(dlg);
    var prevBody = dlg.querySelector(".ms-rd-body"); dlg._subScroll = prevBody ? prevBody.scrollTop : null;
    if (!dlg._subInit) {
      dlg._subInit = true;
      dlg.addEventListener("cancel", function (ev) {   // Esc: egy szintet vissza (nem zarja be az egesz ablakot)
        if (!dlg.querySelector(":scope > .ms-sub-view")) return;
        ev.preventDefault(); subViewBack(dlg, dlg._subOpener);
      });
      dlg.addEventListener("close", function () { subViewClean(dlg); });
    }
    dlg.style.height = dlg.getBoundingClientRect().height + "px";   // az ablak magassaga ne valtozzon a tartalomcserekor
    dlg._subOpener = opener;
    dlg._subLabel = dlg.getAttribute("aria-labelledby") || "";
    [].slice.call(dlg.children).forEach(function (c) { c.classList.add("ms-sub-hidden"); });
    var v = document.createElement("div"); v.className = "ms-sub-view";
    v.innerHTML =
      '<div class="ms-settings-head"><button type="button" class="ms-sub-back" aria-label="' + e3(BACK_TEXT[LANG] || BACK_TEXT.en) + '">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>' +
      '<div class="ms-sub-titles"><h3 id="ms-sub-title" class="ms-settings-title">' + e3(ref) + '</h3><p class="ms-law-sub">' + e3(desc) + '</p></div>' +
      '<button type="button" class="ms-settings-x" aria-label="' + e3(CLOSE_TEXT[LANG] || CLOSE_TEXT.en) + '">&times;</button></div>' +
      '<div class="ms-law-text"' + (body.indexOf("ms-law-sec") === -1 ? ' tabindex="0"' : "") + '>' + body + '</div>' +
      '<p class="ms-law-src">' + e3(U.src) + '</p>';
    dlg.appendChild(v);
    dlg.setAttribute("aria-labelledby", "ms-sub-title");
    var back = v.querySelector(".ms-sub-back");
    back.addEventListener("click", function () { subViewBack(dlg, opener); });
    v.querySelector(".ms-settings-x").addEventListener("click", function () { dlg.close(); });
    v.querySelector(".ms-law-text").scrollTop = 0;
    back.focus({ preventScroll: true });
  }
  function openLaw(ref, desc, opener) {
    function e2(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    var U = LAW_UI[LANG] || LAW_UI.en, m = LAW_MAP[ref], body = "";
    if (m && LAW_TEXTS[m[0]]) {
      m[1].forEach(function (n) {
        var ls = LAW_TEXTS[m[0]][n];
        if (!ls) return;
        var hm = ls[0].match(/^(\S+\. §)/), sid = "ms-law-sec-" + n.replace(/\W/g, "_");
        body += '<section class="ms-law-sec" tabindex="0" role="region"' + (hm ? ' aria-labelledby="' + sid + '"' : "") + '>' + ls.map(function (t, i) {
          if (i === 0) { var h = t.match(/^(\S+\. §)\s*(.*)$/); if (h) return '<h4 class="ms-law-par" id="' + sid + '">' + e2(h[1]) + '</h4>' + (h[2] ? '<p>' + e2(h[2]) + '</p>' : ""); }
          return '<p>' + e2(t) + '</p>';
        }).join("") + '</section>';
      });
    }
    if (!body) body = '<p class="ms-law-na">' + e2(U.na) + '</p>';
    var host = opener && opener.closest ? opener.closest("dialog[open]") : null;
    if (host && host !== lawDlg) { openLawInDialog(host, ref, desc, body, U, opener); return; }
    if (!lawDlg) {
      lawDlg = document.createElement("dialog");
      lawDlg.className = "ms-law-dialog";
      lawDlg.setAttribute("aria-labelledby", "ms-law-title");
      document.body.appendChild(lawDlg);
      lawDlg.addEventListener("click", function (e) { if (e.target === lawDlg) lawDlg.close(); });
      // Esc nem zarja be: csak a Bezaras gomb vagy a dialogon kivuli kattintas
      lawDlg.addEventListener("cancel", function (e) { e.preventDefault(); });
      // a fokusz nem hagyhatja el a dialogot; a szakaszok kozott nyilakkal is lehet lepni
      lawDlg.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { e.preventDefault(); return; }
        var secs = [].slice.call(lawDlg.querySelectorAll(".ms-law-sec"));
        var tabs = [lawDlg.querySelector(".ms-settings-x")].concat(secs.length ? secs : [lawDlg.querySelector(".ms-law-text")]);
        var i = tabs.indexOf(document.activeElement);
        if (e.key === "Tab") {
          if (i === -1) { e.preventDefault(); tabs[0].focus(); return; }
          var n = e.shiftKey ? (i === 0 ? tabs.length - 1 : i - 1) : (i === tabs.length - 1 ? 0 : i + 1);
          e.preventDefault(); tabs[n].focus();
          return;
        }
        var si = secs.indexOf(document.activeElement);
        if (si === -1) return;
        var to = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") to = Math.min(si + 1, secs.length - 1);
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") to = Math.max(si - 1, 0);
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = secs.length - 1;
        if (to !== null) { e.preventDefault(); secs[to].focus(); }
      });
      lawDlg.addEventListener("close", function () { if (lawOpener && lawOpener.focus) try { lawOpener.focus(); } catch (e) {} });
    }
    lawOpener = opener;
    lawDlg.innerHTML =
      '<div class="ms-settings-head"><div><h3 id="ms-law-title" class="ms-settings-title">' + e2(ref) + '</h3>' +
      '<p class="ms-law-sub">' + e2(desc) + '</p></div>' +
      '<button type="button" class="ms-settings-x" aria-label="' + e2(CLOSE_TEXT[LANG] || CLOSE_TEXT.en) + '">&times;</button></div>' +
      '<div class="ms-law-text"' + (body.indexOf("ms-law-sec") === -1 ? ' tabindex="0"' : "") + '>' + body + '</div>' +
      '<p class="ms-law-src">' + e2(U.src) + '</p>';
    lawDlg.querySelector(".ms-settings-x").addEventListener("click", function () { lawDlg.close(); });
    lawDlg.showModal();
    lawDlg.querySelector(".ms-law-text").scrollTop = 0;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest(".ms-law-link");
    if (!a) return;
    e.preventDefault();
    openLaw(a.getAttribute("data-ref"), a.getAttribute("data-desc") || "", a);
  });

  /* --------------------------------------------------- MOCK adatbázis (kérdések) */
  var ANSWERS = [
    {
      id: "52a7d7bd-91c8-4165-bf7a-3b7f10f8f63c",
      question: "Most kaptam felmondást a munkahelyemen. Mennyi a felmondási időm, és mit kell tennem, ha nem értek vele egyet?",
      keywords: ["felmond", "felmondási idő", "felmondást kaptam", "munkahely", "nem értek vele egyet", "munkaviszony megszűn"],
      blocks: [
        { t: "p", cite: true, html: 'A felmondási idő és annak hossza attól függ, ki és milyen jogcímen szüntette meg a munkaviszonyt. Ha a munkáltató mondott fel rendes felmondással egy határozatlan idejű munkaviszonyt, a felmondási idő <strong>főszabály szerint 30 nap</strong>, amely a munkáltatónál munkaviszonyban töltött idő alapján fokozatosan növekszik (hosszabb jogviszonynál akár jelentősen). A felmondási idő <strong>legkorábban a felmondás közlését követő napon kezdődik</strong>.' },
        { t: "p", cite: true, html: 'Lényeges, hogy a <strong>munkáltatói felmondást indokolni kell</strong>, és az indoknak valósnak és okszerűnek kell lennie. Ha te mondasz fel (munkavállalói felmondás), határozatlan idejű jogviszonynál általában nem kell indokolnod, és a 30 napos felmondási idő ilyenkor nem hosszabbodik meg.' },
        { t: "lead", html: 'Ha nem értesz egyet a felmondással:' },
        { t: "ul", items: [
          { html: 'Kérd <strong>írásban</strong> a felmondást és annak indokolását, és ellenőrizd, hogy a közlés módja, a felmondási idő és az indok megfelel-e a törvénynek.', cite: true },
          { html: 'A felmondás vitatására <strong>munkaügyi jogvitát</strong> kezdeményezhetsz: a keresetlevelet <strong>a felmondás közlésétől számított 30 napon belül</strong> kell benyújtani – ez a határidő döntő jelentőségű.', cite: true },
          { html: 'Ha a bíróság a felmondást jogellenesnek találja, annak <strong>jogkövetkezményei</strong> vannak (pl. elmaradt jövedelem és kártérítés, meghatározott esetben a munkaviszony helyreállítása).', cite: true }
        ]},
        { t: "p", cite: false, html: 'Emellett érdemes ellenőrizni a <strong>végkielégítésre</strong> való jogosultságot is (jellemzően legalább 3 év munkaviszonynál, a törvényi kizáró okok hiányában), és őrizd meg a felmondást, a munkaszerződést és a kapcsolódó levelezést.' }
      ],
      laws: [
        { ref: "2012. évi I. törvény 64. §, 66. §, 68–69. §", desc: "a munka törvénykönyvéről" },
        { ref: "2012. évi I. törvény 77. §, 82–83. §, 287. §", desc: "a munka törvénykönyvéről" }
      ]
    },
    {
      id: "944df3b4-c34a-467e-9de0-c8239c5388d5",
      question: "Hol kell adóznom, ha Magyarországon dolgozom, de külföldi lakcímmel rendelkezem?",
      keywords: ["adóz", "adóznom", "külföldi lakcím", "illetőség", "kettős adóztat", "hol kell adóz"],
      blocks: [
        { t: "p", cite: true, html: 'Az, hogy hol kell adóznod, alapvetően attól függ, melyik államban vagy adóügyi illetőséggel, és mit mond a Magyarország és az illetőséged szerinti állam közötti kettős adóztatást elkerülő egyezmény. Általános szabály szerint, ha a munkát fizikailag Magyarországon végzed, a munkaviszonyból származó jövedelem Magyarországon is adóztatható. Ugyanakkor előfordulhat, hogy az egyezmény alapján mégis csak a külföldi illetőséged szerinti állam adóztathat (tipikusan a 183 napos feltételek és a munkáltató/telephely körülményei alapján).' },
        { t: "p", cite: true, html: 'Ha az egyezmény alkalmazása vagy a tényállás értelmezése miatt az jönne ki, hogy „senki" nem adóztatná a jövedelmet, Magyarország ilyen esetben nem köteles mentesíteni a jövedelmet az adóztatás alól.' },
        { t: "lead", html: 'Gyakorlatban:' },
        { t: "ul", items: [
          { html: 'ha magyar kifizetőtől (pl. magyar munkáltatótól) kapsz bért, a levonás/bevallás jellemzően itthon történik;' },
          { html: 'ha külföldi illetőségű vagy és a jövedelmed belföldön adóköteles, a külföldi személyek jövedelmére vonatkozó különös szabályok is érinthetnek (pl. kifizetői adólevonás, vagy kifizető hiányában saját bevallás).', cite: true }
        ]},
        { t: "p", cite: true, html: 'Fontos még, hogy ha egy szervezet külföldi illetőségű személyt Magyarországra „nem önálló tevékenységre" kirendel, a szervezetet NAV felé bejelentési kötelezettség terhelheti.' }
      ],
      laws: [
        { ref: "2022. évi XXXIII. törvény", desc: "a Magyarország és az Andorrai Hercegség között a jövedelemadók területén a kettős adóztatás elkerüléséről és az adókijátszás és adóelkerülés megakadályozásáról szóló Egyezmény kihirdetéséről" },
        { ref: "2017. évi CL. törvény 4. §, 41. §", desc: "az adózás rendjéről" },
        { ref: "1995. évi CXVII. törvény 1.", desc: "a személyi jövedelemadóról" }
      ]
    },
    {
      id: "5b3f37b0-9182-42f8-b061-45f6a5b4bbf4",
      question: "Vettem egy mosógépet, két hónap után elromlott. A bolt azt mondja, nem az ő hibájuk. Mit kérhetek tőlük, és meddig?",
      keywords: ["mosógép", "elromlott", "bolt", "szavatoss", "kellékszavatoss", "hibás", "kérhetek", "meddig"],
      blocks: [
        { t: "p", cite: true, html: 'Ha a mosógép a vásárlást (teljesítést) követő 2 hónapon belül hibásodik meg, akkor az eladóval (vállalkozással) szemben <strong>kellékszavatossági igényt</strong> érvényesíthetsz, és alapvetően <strong>te választhatod meg</strong>, hogy milyen igényt kérsz: elsődlegesen <strong>javítást vagy cserét</strong>, ha pedig ezek nem kérhetők/megoldhatók, akkor <strong>árleszállítást</strong> vagy végső esetben <strong>elállást</strong> (jelentéktelen hiba miatt elállás nem jár). Fogyasztó–vállalkozás szerződésnél fontos, hogy <strong>a hibát nem javíthatod meg „saját szakálladra" az eladó költségére</strong> a kellékszavatossági jogok körében.' },
        { t: "p", cite: true, html: 'Az, hogy az eladó „nem vállal felelősséget", önmagában nem zárja ki a szavatossági felelősségét: fogyasztói szerződésnél a teljesítést követő <strong>6 hónapon belül</strong> fennáll egy <strong>hibás teljesítési vélelem</strong>, vagyis főszabály szerint úgy kell tekinteni, hogy a hiba már a teljesítéskor megvolt (amíg az ellenkezőjét nem bizonyítják).' },
        { t: "lead", html: 'Határidők:' },
        { t: "ul", items: [
          { html: 'A hibát a felfedezés után <strong>haladéktalanul</strong> jelezd az eladónak; a mintaszabály alapján a felfedezéstől számított <strong>2 hónapon belüli közlés</strong> még időben megtettnek minősül.', cite: true },
          { html: 'Fogyasztó és vállalkozás között a kellékszavatossági igények <strong>általános elévülési ideje 2 év</strong> a teljesítéstől számítva.', cite: true }
        ]},
        { t: "p", cite: false, html: 'Ha az eladó továbbra is elutasít, érdemes írásban bejelenteni a hibát és konkrétan megjelölni a választott igényt (pl. kijavítás vagy csere), hivatkozva arra, hogy 6 hónapon belül a hibás teljesítést vélelmezni kell.' }
      ],
      laws: [
        { ref: "2013. évi V. törvény 6:159. §, 6:158. §, 6:163. §", desc: "a Polgári Törvénykönyvről" },
        { ref: "45/2014. (II. 26.) Korm. rendelet 1.", desc: "a fogyasztó és a vállalkozás közötti szerződések részletes szabályairól" }
      ]
    },
    {
      id: "59d246b0-3399-424f-a3f7-7285a76d6f80",
      question: "A főbérlő azt mondta, két héten belül költözzek ki, pedig van érvényes bérleti szerződésem. Megteheti ezt, és mit tudok csinálni?",
      keywords: ["főbérlő", "költözz", "kiköltöz", "bérleti szerződés", "bérbeadó", "kiürít", "albérlet"],
      blocks: [
        { t: "p", cite: true, html: 'A puszta felszólítás („két héten belül költözz ki") önmagában nem szünteti meg az érvényes bérleti szerződésedet, és különösen határozott idejű szerződésnél a bérbeadó nem „rövidítheti le" egyoldalúan a szerződés időtartamát. Ha a szerződés határozott időre szól, annak lejártáig (vagy a szerződésben rögzített feltétel bekövetkeztéig) áll fenn, jellemzően írásban megkötve .' },
        { t: "p", cite: true, html: 'A bérbeadó akkor tud kiköltöztetést elérni, ha a szerződés megszűnése után sem költözöl ki, és ő a törvény szerinti eljárást kezdeményezi; határozott idejű bérletnél a kiürítés iránti eljárás a meghatározott idő lejárta után 60 napon belül kérheti (ez a határidő jogvesztő) . Ha végrehajtási eljárásban kerül sor ingatlan kiürítésére (pl. árverést követően), ott is törvényi határidők és eljárási garanciák vannak, nem „2 hét" bemondásra történik .' },
        { t: "lead", html: 'Mit tehetsz most:' },
        { t: "ol", items: [
          { html: 'Kérd írásban, hogy pontosan milyen jogcímen és mikor szűnik meg a bérlet (határozott idő lejárta? közös megegyezés? felmondás?) és hivatkozz arra, hogy a bérleti jogviszony a szerződés szerint áll fenn .', cite: true },
          { html: 'Ne írj alá „közös megegyezést" vagy kiköltözési nyilatkozatot, ha nem akarsz elmenni; közös megegyezésnél is az a főszabály, hogy a bérlőnek külön térítési igénye sincs, és ki kell költöznie .', cite: true },
          { html: 'Őrizd meg a szerződést, befizetési bizonylatokat, levelezést; ha fenyegetés, önkényes lakásba bejutás, zárcsere merül fel, az már nem „rendes" bérbeadói eljárás.', cite: false },
          { html: 'Ha mégis eljárást indítanak ellened kiürítésre, a határidőket és a kézbesítéseket nagyon figyeld, mert ezek döntőek lehetnek .', cite: true }
        ]}
      ],
      laws: [
        { ref: "106/1999. (XII. 28.) FVM rendelet 3. §, 5. §", desc: "a lakások és helyiségek bérletére, valamint az elidegenítésükre vonatkozó egyes szabályokról szóló 1993. évi LXXVIII. törvény végrehajtásáról" },
        { ref: "1994. évi LIII. törvény 183/A. §, 154/A. §", desc: "a bírósági végrehajtásról" }
      ]
    },
    {
      // PELDA a "Szakmai kereso" kapcsolo teszteleséhez (a regi szakmai oldal "Legutobbi kereseim" listajabol)
      id: "7c1e5a52-0b3d-4f6e-9a8e-3d2f6b0c4e11",
      question: "Milyen bírósági gyakorlat alakult ki a munkáltatói felmondás indokának valóságával és okszerűségével kapcsolatban?",
      keywords: ["bírósági gyakorlat", "felmondás indok", "indokának valóság", "okszerűség", "munkaügyi bíróság"],
      blocks: [
        { t: "p", cite: true, html: 'A munkáltatói rendes felmondást <strong>indokolni kell</strong>, az indokolásból az indoknak világosan ki kell tűnnie, és annak <strong>valósnak és okszerűnek</strong> kell lennie (Mt. 64. §).' },
        { t: "lead", html: 'A bírósági gyakorlat főbb elemei:' },
        { t: "ul", items: [
          { html: 'Az indok <strong>valóságát és okszerűségét a munkáltatónak kell bizonyítania</strong>.', cite: true },
          { html: 'A bíróság a felmondás jogszerűségét <strong>kizárólag a közölt indok alapján</strong> vizsgálja, az indok utóbb nem pótolható és nem cserélhető ki.', cite: true },
          { html: 'Az indokolásnak <strong>konkrétnak</strong> kell lennie: általános megfogalmazás (pl. „átszervezés”) nem elegendő.', cite: true }
        ]}
      ],
      laws: [
        { ref: "2012. évi I. törvény 64. §, 65. §", desc: "a munka törvénykönyvéről" },
        { ref: "2012. évi I. törvény 82. §, 83. §", desc: "a munka törvénykönyvéről" }
      ],
      // szakmai nezet (Szakmai kereso kapcsolo): dokumentumlistak fulenkent. Peldaadatok teszteleshez.
      pro: {
        legislation: [
          { title: "1992. évi XXII. törvény 89. §", from: "1992-07-01", to: "2012-06-30", meta: "Jogszabály · a Munka Törvénykönyvéről (hatályon kívül helyezett)", text: "A korábbi Munka Törvénykönyve felmondásra vonatkozó szabálya; helyébe a 2012. évi I. törvény lépett." },
          { title: "2012. évi I. törvény 64. §", from: "2012-07-01", meta: "Jogszabály · a munka törvénykönyvéről", text: "A munkáltató felmondását indokolni kell; az indokolásnak valósnak és okszerűnek kell lennie." },
          { title: "2012. évi I. törvény 65. §", from: "2012-07-01", meta: "Jogszabály · a munka törvénykönyvéről", text: "A munkáltatói felmondás indoka a munkavállaló képességével, magatartásával vagy a munkáltató működésével összefüggő ok lehet." },
          { title: "2012. évi I. törvény 82. §, 83. §", from: "2012-07-01", meta: "Jogszabály · a munka törvénykönyvéről", text: "A munkaviszony jogellenes megszüntetésének jogkövetkezményei, kártérítés és a munkaviszony helyreállítása." }
        ],
        court: [
          { title: "Munkaügyi bírósági határozat – az indok valóságának bizonyítása", meta: "Bírósági határozat · példaadat", text: "A munkáltatót terheli annak bizonyítása, hogy a felmondásban megjelölt indok valós és okszerű volt." },
          { title: "Munkaügyi bírósági határozat – az indok pótlásának tilalma", meta: "Bírósági határozat · példaadat", text: "A felmondás jogszerűsége kizárólag a felmondásban közölt indok alapján bírálható el, az indok utóbb nem módosítható." },
          { title: "Munkaügyi bírósági határozat – az indokolás konkrétsága", meta: "Bírósági határozat · példaadat", text: "Az általános, tartalmilag ki nem fejtett indok nem felel meg a világos és konkrét indokolás követelményének." }
        ],
        reasons: [
          { title: "A munka törvénykönyvéről szóló törvény 64. §-ához fűzött indokolás", meta: "Törvényjavaslati indokolás · példaadat", text: "Az indokolás a felmondás indokával szemben támasztott követelményeket (világosság, valóság, okszerűség) rögzíti." }
        ],
        notices: []
      }
    }
  ];


  /* ------------------------------------------- nem magyar nyelvu mock valaszok
   * A valasz torzse angol (minden forditott nyelven), a kerdes es a
   * kulcsszavak az oldal nyelven. Sorrend = ANSWERS sorrendje. */
  var EN_BODIES = [
    {
      blocks: [
        { t: "p", cite: true, html: 'Whether there is a notice period, and how long it is, depends on who terminated the employment and on what legal grounds. If the employer terminated an open-ended employment relationship by ordinary dismissal, the notice period is <strong>30 days as a general rule</strong>, and it increases gradually with the time spent in employment with that employer. The notice period <strong>starts no earlier than the day after the dismissal is communicated</strong>.' },
        { t: "p", cite: true, html: 'Importantly, <strong>the employer must give reasons for the dismissal</strong>, and the reason must be real and well founded. If you resign (termination by the employee) from an open-ended employment, you generally do not have to give reasons, and the 30-day notice period is not extended in that case.' },
        { t: "lead", html: 'If you do not agree with the dismissal:' },
        { t: "ul", items: [
          { html: 'Ask for the dismissal and its reasons <strong>in writing</strong>, and check whether the way it was communicated, the notice period and the reason comply with the law.', cite: true },
          { html: 'You can contest the dismissal by starting a <strong>labour dispute</strong>: the statement of claim must be filed <strong>within 30 days of the dismissal being communicated</strong> – this deadline is decisive.', cite: true },
          { html: 'If the court finds the dismissal unlawful, there are <strong>legal consequences</strong> (e.g. lost earnings and damages, and in certain cases reinstatement).', cite: true }
        ]},
        { t: "p", cite: false, html: 'It is also worth checking whether you are entitled to <strong>severance pay</strong> (typically after at least 3 years of employment, unless a statutory exclusion applies), and keep the dismissal, the employment contract and related correspondence.' }
      ],
      laws: [
        { ref: "2012. évi I. törvény 64. §, 66. §, 68–69. §", desc: "Act I of 2012 on the Labour Code" },
        { ref: "2012. évi I. törvény 77. §, 82–83. §, 287. §", desc: "Act I of 2012 on the Labour Code" }
      ]
    },
    {
      blocks: [
        { t: "p", cite: true, html: 'Where you have to pay tax basically depends on which state you are tax resident in, and on the double taxation convention between Hungary and the state of your residence. As a general rule, if you physically perform the work in Hungary, income from employment may also be taxed in Hungary. However, under the convention it may happen that only the state of your foreign residence may tax it (typically depending on the 183-day conditions and on the employer/permanent establishment).' },
        { t: "p", cite: true, html: 'If applying the convention or interpreting the facts would mean that “no one” taxes the income, Hungary is not obliged to exempt the income from taxation in such a case.' },
        { t: "lead", html: 'In practice:' },
        { t: "ul", items: [
          { html: 'if you receive your salary from a Hungarian payer (e.g. a Hungarian employer), withholding and filing typically take place in Hungary;' },
          { html: 'if you are a foreign resident and your income is taxable in Hungary, special rules on the income of foreign persons may also apply (e.g. tax withheld by the payer or, if there is no payer, your own tax return).', cite: true }
        ]},
        { t: "p", cite: true, html: 'Note also that if an organisation posts a foreign resident to Hungary for “dependent activities”, it may have a reporting obligation towards the Hungarian Tax Authority (NAV).' }
      ],
      laws: [
        { ref: "2022. évi XXXIII. törvény", desc: "Act XXXIII of 2022 promulgating the Convention between Hungary and the Principality of Andorra for the elimination of double taxation with respect to taxes on income and the prevention of tax evasion and avoidance" },
        { ref: "2017. évi CL. törvény 4. §, 41. §", desc: "Act CL of 2017 on the Rules of Taxation" },
        { ref: "1995. évi CXVII. törvény 1.", desc: "Act CXVII of 1995 on Personal Income Tax" }
      ]
    },
    {
      blocks: [
        { t: "p", cite: true, html: 'If the washing machine breaks down within 2 months of purchase (performance), you can assert a <strong>warranty claim for defective performance</strong> against the seller, and in principle <strong>you can choose</strong> what to ask for: primarily <strong>repair or replacement</strong>, and if these cannot be requested or carried out, a <strong>price reduction</strong> or, as a last resort, <strong>withdrawal from the contract</strong> (not for an insignificant defect). In a consumer–business contract, note that <strong>you may not have the defect repaired yourself at the seller’s expense</strong> under the warranty rights.' },
        { t: "p", cite: true, html: 'The fact that the seller “does not accept responsibility” does not in itself exclude its warranty liability: in consumer contracts there is a <strong>presumption of defective performance</strong> for <strong>6 months</strong> after performance, i.e. as a rule the defect is deemed to have existed at the time of performance (unless the contrary is proved).' },
        { t: "lead", html: 'Deadlines:' },
        { t: "ul", items: [
          { html: 'Report the defect to the seller <strong>without delay</strong> after discovering it; notification <strong>within 2 months</strong> of discovery is deemed timely.', cite: true },
          { html: 'Between a consumer and a business, the <strong>general limitation period for warranty claims is 2 years</strong> from performance.', cite: true }
        ]},
        { t: "p", cite: false, html: 'If the seller still refuses, report the defect in writing and state the specific remedy you choose (e.g. repair or replacement), pointing out that within 6 months defective performance must be presumed.' }
      ],
      laws: [
        { ref: "2013. évi V. törvény 6:159. §, 6:158. §, 6:163. §", desc: "Act V of 2013 on the Civil Code" },
        { ref: "45/2014. (II. 26.) Korm. rendelet 1.", desc: "Government Decree 45/2014 (II. 26.) on the detailed rules of contracts between consumers and businesses" }
      ]
    },
    {
      blocks: [
        { t: "p", cite: true, html: 'A mere demand (“move out within two weeks”) does not in itself terminate your valid lease, and especially with a fixed-term lease the landlord cannot unilaterally “shorten” its term. If the lease is for a fixed term, it remains in force until it expires (or until a condition set out in the contract occurs); such leases are typically concluded in writing.' },
        { t: "p", cite: true, html: 'The landlord can only obtain your eviction if you do not move out after the lease has ended and the landlord initiates the statutory procedure; for a fixed-term lease, the eviction procedure can be requested within 60 days after the term expires (this is a preclusive deadline). Where a property is vacated in enforcement proceedings (e.g. after an auction), there are statutory deadlines and procedural guarantees as well – it does not happen on a “2 weeks” say-so.' },
        { t: "lead", html: 'What you can do now:' },
        { t: "ol", items: [
          { html: 'Ask in writing on what legal grounds and when exactly the lease would end (expiry of a fixed term? mutual agreement? termination?), and point out that the lease is in force under the contract.', cite: true },
          { html: 'Do not sign a “mutual agreement” or a declaration to move out if you do not want to leave; with mutual agreement the general rule is that the tenant has no separate claim for compensation and must move out.', cite: true },
          { html: 'Keep the contract, payment receipts and correspondence; threats, unauthorised entry into the flat or changing the locks are no longer a “normal” landlord procedure.', cite: false },
          { html: 'If proceedings for eviction are nevertheless started against you, watch the deadlines and service of documents very carefully, as these can be decisive.', cite: true }
        ]}
      ],
      laws: [
        { ref: "106/1999. (XII. 28.) FVM rendelet 3. §, 5. §", desc: "Decree 106/1999 (XII. 28.) FVM implementing Act LXXVIII of 1993 on the lease and alienation of flats and premises" },
        { ref: "1994. évi LIII. törvény 183/A. §, 154/A. §", desc: "Act LIII of 1994 on Judicial Enforcement" }
      ]
    }
  ];
  var Q_I18N = {
    en: [
      ["I have just been dismissed from my job. How long is my notice period, and what should I do if I disagree?", ["dismiss", "notice period", "fired", "terminat", "my job", "disagree"]],
      ["Where do I have to pay tax if I work in Hungary but have a foreign address?", ["tax", "foreign address", "resident", "double taxation", "where do i"]],
      ["I bought a washing machine and it broke down after two months. The shop says it is not their fault. What can I ask from them, and until when?", ["washing machine", "broke", "shop", "warranty", "defect", "faulty"]],
      ["My landlord told me to move out within two weeks, even though I have a valid lease. Can they do that, and what can I do?", ["landlord", "move out", "lease", "evict", "tenan", "rent"]]
    ],
    de: [
      ["Mir wurde gerade gekündigt. Wie lang ist meine Kündigungsfrist, und was kann ich tun, wenn ich nicht einverstanden bin?", ["kündig", "kündigungsfrist", "arbeitsplatz", "nicht einverstanden", "entlass"]],
      ["Wo muss ich Steuern zahlen, wenn ich in Ungarn arbeite, aber eine ausländische Adresse habe?", ["steuer", "ausländische adresse", "ansässig", "doppelbesteuerung"]],
      ["Ich habe eine Waschmaschine gekauft, nach zwei Monaten ist sie kaputtgegangen. Der Laden sagt, es sei nicht seine Schuld. Was kann ich verlangen, und bis wann?", ["waschmaschine", "kaputt", "laden", "gewährleistung", "defekt", "mangel"]],
      ["Mein Vermieter hat gesagt, ich soll innerhalb von zwei Wochen ausziehen, obwohl ich einen gültigen Mietvertrag habe. Darf er das, und was kann ich tun?", ["vermieter", "ausziehen", "mietvertrag", "räumung", "miete"]]
    ],
    fr: [
      ["Je viens d'être licencié. Quelle est la durée de mon préavis, et que faire si je ne suis pas d'accord ?", ["licenci", "préavis", "emploi", "pas d'accord", "renvoy"]],
      ["Où dois-je payer mes impôts si je travaille en Hongrie mais que j'ai une adresse à l'étranger ?", ["impôt", "impot", "adresse à l'étranger", "résiden", "double imposition"]],
      ["J'ai acheté un lave-linge qui est tombé en panne au bout de deux mois. Le magasin dit que ce n'est pas sa faute. Que puis-je lui demander, et jusqu'à quand ?", ["lave-linge", "machine à laver", "panne", "magasin", "garantie", "défaut"]],
      ["Mon propriétaire m'a dit de déménager sous deux semaines alors que j'ai un bail valable. En a-t-il le droit, et que puis-je faire ?", ["propriétaire", "déménag", "bail", "expulsion", "locataire", "loyer"]]
    ],
    es: [
      ["Me acaban de despedir. ¿Cuánto es mi plazo de preaviso y qué debo hacer si no estoy de acuerdo?", ["despid", "preaviso", "trabajo", "no estoy de acuerdo"]],
      ["¿Dónde tengo que pagar impuestos si trabajo en Hungría pero tengo una dirección en el extranjero?", ["impuesto", "dirección en el extranjero", "residen", "doble imposición"]],
      ["Compré una lavadora y se estropeó a los dos meses. La tienda dice que no es culpa suya. ¿Qué puedo pedirles y hasta cuándo?", ["lavadora", "estrope", "averi", "tienda", "garantía", "defect"]],
      ["Mi casero me dijo que me fuera en dos semanas, aunque tengo un contrato de alquiler válido. ¿Puede hacerlo y qué puedo hacer?", ["casero", "arrendador", "alquiler", "desahucio", "mudar", "inquilino"]]
    ],
    it: [
      ["Sono appena stato licenziato. Quanto dura il mio preavviso e cosa devo fare se non sono d'accordo?", ["licenzi", "preavviso", "lavoro", "non sono d'accordo"]],
      ["Dove devo pagare le tasse se lavoro in Ungheria ma ho un indirizzo all'estero?", ["tasse", "impost", "indirizzo all'estero", "residen", "doppia imposizione"]],
      ["Ho comprato una lavatrice che si è rotta dopo due mesi. Il negozio dice che non è colpa sua. Cosa posso chiedere e fino a quando?", ["lavatrice", "rott", "guast", "negozio", "garanzia", "difett"]],
      ["Il padrone di casa mi ha detto di andarmene entro due settimane, anche se ho un contratto d'affitto valido. Può farlo e cosa posso fare?", ["padrone di casa", "locatore", "affitto", "sfratto", "andarmene", "inquilino"]]
    ],
    zh: [
      ["我刚被解雇了。我的通知期有多长？如果我不同意该怎么办？", ["解雇", "通知期", "辞退", "工作", "不同意"]],
      ["如果我在匈牙利工作，但持有外国地址，我应该在哪里纳税？", ["纳税", "税", "外国地址", "居民", "双重征税"]],
      ["我买了一台洗衣机，两个月后坏了。商店说不是他们的责任。我可以要求什么，期限是多久？", ["洗衣机", "坏了", "商店", "保修", "瑕疵", "质量"]],
      ["房东让我两周内搬走，但我有有效的租赁合同。他可以这样做吗？我该怎么办？", ["房东", "搬走", "租赁", "租房", "驱逐", "租客"]]
    ]
  };
  if (LANG !== "hu") {
    var qs = Q_I18N[LANG] || Q_I18N.en;
    ANSWERS = ANSWERS.slice(0, qs.length).map(function (a, i) {
      return { id: a.id, question: qs[i][0], keywords: qs[i][1].concat(Q_I18N.en[i][1]), blocks: EN_BODIES[i].blocks, laws: EN_BODIES[i].laws };
    });
    // az eles forditott oldalakon nincsenek "nepszeru/legutobbi" javaslatok;
    // a mockban a fokuszra nyilo panel a valaszolhato peldakerdeseket mutatja
    POPULAR = [];
    RECENT = qs.map(function (q) { return q[0]; });
  }

  /* --------------------------------------------------------- egyszerű illesztő */
  function norm(s) {
    return (s || "").toLowerCase()
      .replace(/[""„”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
  function match(query) {
    var q = norm(query);
    if (!q) return null;
    var best = null, bestScore = 0;
    ANSWERS.forEach(function (a) {
      var score = 0;
      if (norm(a.question) === q) score += 100;
      a.keywords.forEach(function (k) { if (q.indexOf(norm(k)) !== -1) score += 1; });
      if (score > bestScore) { bestScore = score; best = a; }
    });
    return bestScore > 0 ? best : null;
  }

  /* --------------------------------------------------------------- MOCK SERVICE */
  var JogMockSearch = {
    answers: ANSWERS,
    ask: function (query) {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(match(query)); }, 1900);
      });
    }
  };
  window.JogMockSearch = JogMockSearch;

  /* -------------------------------------------------------------- render segédek */
  function attr(t) { return String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }

  /* ---------- Valasz letoltese (PDF) es vagolapra masolasa ---------- */
  var IC_DL = '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 19H21V21H3V19ZM13 13.1716L19.0711 7.1005L20.4853 8.51472L12 17L3.51472 8.51472L4.92893 7.1005L11 13.1716V2H13V13.1716Z" fill="#404753"/></svg>';
  var IC_COPY = '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z" fill="#404753"/></svg>';
  var TOOLS_UI = {
    hu: { dl: "Válasz letöltése", cp: "Válasz vágólapra másolása", ok: "A válasz a vágólapra került.", fail: "A másolás nem sikerült.", title: "Válasz" },
    en: { dl: "Download answer", cp: "Copy answer to clipboard", ok: "The answer was copied to the clipboard.", fail: "Copying failed.", title: "Answer" },
    de: { dl: "Antwort herunterladen", cp: "Antwort in die Zwischenablage kopieren", ok: "Die Antwort wurde in die Zwischenablage kopiert.", fail: "Kopieren fehlgeschlagen.", title: "Antwort" },
    fr: { dl: "Télécharger la réponse", cp: "Copier la réponse dans le presse-papiers", ok: "La réponse a été copiée dans le presse-papiers.", fail: "La copie a échoué.", title: "Réponse" },
    es: { dl: "Descargar la respuesta", cp: "Copiar la respuesta al portapapeles", ok: "La respuesta se copió al portapapeles.", fail: "No se pudo copiar.", title: "Respuesta" },
    it: { dl: "Scarica la risposta", cp: "Copia la risposta negli appunti", ok: "La risposta è stata copiata negli appunti.", fail: "Copia non riuscita.", title: "Risposta" },
    zh: { dl: "下载答案", cp: "将答案复制到剪贴板", ok: "答案已复制到剪贴板。", fail: "复制失败。", title: "答案" }
  };
  function toolsHtml() {
    var T = TOOLS_UI[LANG] || TOOLS_UI.en;
    return '<div class="ms-answer-tools">' +
      '<button type="button" class="ms-tool ms-tool-download" data-tip="' + T.dl + '" aria-label="' + T.dl + '">' + IC_DL + '</button>' +
      '<button type="button" class="ms-tool ms-tool-copy" data-tip="' + T.cp + '" aria-label="' + T.cp + '">' + IC_COPY + '</button>' +
      '</div>';
  }
  // a valasz kartya szoveges tartalma, dokumentum-sorrendben: [{k: "h"|"b"|"p"|"li", t: "..."}]
  function answerLines(card) {
    var sel = "h2, h3, p, li, .ms-law-link, .ms-law-desc, .ms-answer-id, .ms-disclaimer, .ms-pro-doc-title, .ms-pro-doc-dates, .ms-pro-doc-meta, .ms-pro-status";
    var els = [].slice.call(card.querySelectorAll(sel)).filter(function (e) {
      return !e.closest(".ms-answer-tools, .ms-pro-tabs, .ms-pro-cal");
    });
    els = els.filter(function (e) { return !els.some(function (o) { return o !== e && o.contains(e); }); });
    var lines = [];
    els.forEach(function (e) {
      var cl = e.cloneNode(true); cl.querySelectorAll(".ms-term-def").forEach(function (x) { x.remove(); });
      var t = (cl.textContent || "").replace(/\s+/g, " ").trim();
      if (!t) return;
      if (e.matches("h2, h3")) lines.push({ k: "h", t: t });
      else if (e.matches("li")) lines.push({ k: "li", t: t });
      else if (e.matches(".ms-law-link, .ms-pro-doc-title")) lines.push({ k: "b", t: t });
      else if (e.matches(".ms-answer-id")) {
        var l = e.querySelector(".ms-answer-id-label"), v = e.querySelector(".ms-answer-id-value");
        lines.push({ k: "p", t: (l ? l.textContent.trim() : "") + ": " + (v ? v.textContent.trim() : "") });
      } else lines.push({ k: "p", t: t });
    });
    return lines;
  }
  function copyText(text) {
    var viaExec = function () { return new Promise(function (res, rej) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      ta.remove(); ok ? res() : rej(new Error("copy"));
    }); };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) return navigator.clipboard.writeText(text).catch(viaExec);
    return viaExec();
  }
  // Egyszeru, kulso konyvtar nelkuli PDF-iro: Helvetica (WinAnsi) + a magyar ő/ű/Ő/Ű glifak a Differences-ben
  function buildPdf(lines, title) {
    var W = 595.28, H = 841.89, M = 56, FS = 11, LH = 15.5, maxW = W - 2 * M;
    var cv = document.createElement("canvas").getContext("2d");
    var special = { "ő": 0x81, "ű": 0x8d, "Ő": 0x8f, "Ű": 0x90, "„": 0x84, "”": 0x94, "“": 0x93, "–": 0x96, "—": 0x97, "•": 0x95, "’": 0x92, "‘": 0x91, "…": 0x85, "€": 0x80 };
    var bad = 0, total = 0;
    function enc(str) {
      var o = "";
      for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i), c = str.charCodeAt(i); total++;
        var b = special[ch] !== undefined ? special[ch] : (c < 256 && !(c >= 0x80 && c <= 0x9f) ? c : (c === 0xa0 ? 32 : 63));
        if (b === 63 && ch !== "?") bad++;
        o += String.fromCharCode(b);
      }
      return o;
    }
    function esc(b) { return b.replace(/([\\()])/g, "\\$1"); }
    function width(t, bold, size) { cv.font = (bold ? "bold " : "") + size + "px Helvetica, Arial, sans-serif"; return cv.measureText(t).width; }
    function wrap(t, bold, size, w) {
      var words = t.split(" "), out = [], cur = "";
      words.forEach(function (wd) {
        var tryS = cur ? cur + " " + wd : wd;
        if (width(tryS, bold, size) <= w || !cur) cur = tryS; else { out.push(cur); cur = wd; }
      });
      if (cur) out.push(cur);
      return out;
    }
    var pages = [[]], y = H - M;
    function newPageIfNeeded(size) { if (y - size < M) { pages.push([]); y = H - M; } }
    function put(t, bold, size, x, gapBefore) {
      y -= gapBefore || 0;
      newPageIfNeeded(size);
      pages[pages.length - 1].push("BT /" + (bold ? "F2" : "F1") + " " + size + " Tf " + x.toFixed(2) + " " + (y - size).toFixed(2) + " Td (" + esc(enc(t)) + ") Tj ET");
      y -= LH * (size / FS);
    }
    put(title, true, 16, M, 0);
    lines.forEach(function (ln) {
      if (ln.k === "h") wrap(ln.t, true, 13, maxW).forEach(function (r, i) { put(r, true, 13, M, i ? 0 : 10); });
      else if (ln.k === "b") wrap(ln.t, true, FS, maxW).forEach(function (r, i) { put(r, true, FS, M, i ? 0 : 6); });
      else if (ln.k === "li") wrap(ln.t, false, FS, maxW - 16).forEach(function (r, i) {
        if (i === 0) { y -= 3; newPageIfNeeded(FS); pages[pages.length - 1].push("BT /F1 " + FS + " Tf " + (M + 4).toFixed(2) + " " + (y - FS).toFixed(2) + " Td (" + esc(enc("•")) + ") Tj ET"); }
        put(r, false, FS, M + 16, 0);
      });
      else wrap(ln.t, false, FS, maxW).forEach(function (r, i) { put(r, false, FS, M, i ? 0 : 6); });
    });
    // objektumok: 1 katalogus, 2 oldalfa, 3 F1, 4 F2, 5 encoding, majd oldalak + tartalmak
    var objs = [];
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    var kids = [], n = 6;
    pages.forEach(function (cmds) {
      var pid = n++, cid = n++, stream = cmds.join("\n");
      kids.push(pid + " 0 R");
      objs[pid] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents " + cid + " 0 R >>";
      objs[cid] = "<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream";
    });
    objs[2] = "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + pages.length + " >>";
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding 5 0 R >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding 5 0 R >>";
    objs[5] = "<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [129 /ohungarumlaut 141 /uhungarumlaut 143 /Ohungarumlaut 144 /Uhungarumlaut] >>";
    var out = "%PDF-1.4\n", offs = [];
    for (var i = 1; i < objs.length; i++) { offs[i] = out.length; out += i + " 0 obj\n" + objs[i] + "\nendobj\n"; }
    var xr = out.length;
    out += "xref\n0 " + objs.length + "\n0000000000 65535 f \n";
    for (var j = 1; j < objs.length; j++) out += ("0000000000" + offs[j]).slice(-10) + " 00000 n \n";
    out += "trailer\n<< /Size " + objs.length + " /Root 1 0 R >>\nstartxref\n" + xr + "\n%%EOF";
    if (total && bad / total > 0.05) return null;       // pl. kinai szoveg: a Helvetica nem tudja megjeleniteni
    var u8 = new Uint8Array(out.length);
    for (var k = 0; k < out.length; k++) u8[k] = out.charCodeAt(k) & 255;
    return new Blob([u8], { type: "application/pdf" });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ms-tool");
    if (!b) return;
    var card = b.closest(".ms-answer-card, .ms-pro");
    if (!card) return;
    var T = TOOLS_UI[LANG] || TOOLS_UI.en, lines = answerLines(card);
    var st = document.getElementById("ms-status");
    if (b.classList.contains("ms-tool-copy")) {
      var text = lines.map(function (l) { return (l.k === "li" ? "• " : "") + l.t; }).join("\n");
      copyText(text).then(function () { if (st) { st.textContent = ""; st.textContent = T.ok; } b.classList.add("is-done"); setTimeout(function () { b.classList.remove("is-done"); }, 1600); },
                          function () { if (st) st.textContent = T.fail; });
      return;
    }
    var idEl = card.querySelector(".ms-answer-id-value"), id = idEl ? idEl.textContent.trim() : "";
    var blob = null;
    try { blob = buildPdf(lines, T.title); } catch (er) {}
    if (!blob) { window.print(); return; }                  // nem latin irasu valasz: a bongeszo "Mentes PDF-kent" nyomtatasa
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = T.title.toLowerCase().replace(/\s+/g, "-") + (id ? "-" + id : "") + ".pdf";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  });

  /* ---------- Hibauzenet a keresomezoben (jobb felso sarok): piros ikon + szoveg; role="alert" -> a felolvaso bemondja ---------- */
  function fieldError(msg) {
    var mount = document.getElementById("mock-search-bar");
    var box = mount && mount.querySelector(".ms-searchbar-ds");
    if (!box) return;
    var c = box.querySelector(".ms-field-error");
    if (!c) {
      c = document.createElement("div");
      c.className = "ms-field-error";
      c.setAttribute("role", "alert");
      c.innerHTML = '<span class="ms-field-error-icon" aria-hidden="true">!</span><span class="ms-field-error-text"></span>';
      box.appendChild(c);
    }
    // ugyanazt a szoveget ujra beirva is bemondja: elobb kiuritjuk, majd kis kesleltetessel beirjuk
    var t = c.querySelector(".ms-field-error-text");
    t.textContent = "";
    setTimeout(function () { t.textContent = msg; }, 50);
    var inp = box.querySelector(".ms-input-ds");
    var ta = inp && inp.shadowRoot && inp.shadowRoot.querySelector("textarea");
    if (inp) c.style.top = (inp.offsetTop + 14) + "px";     // a mezo (nem a felette levo cimke) felso soraban
    if (ta) ta.setAttribute("aria-invalid", "true");
  }
  function clearFieldError() {
    var mount = document.getElementById("mock-search-bar");
    var box = mount && mount.querySelector(".ms-searchbar-ds");
    if (!box) return;
    var c = box.querySelector(".ms-field-error");
    if (c) c.remove();
    var inp = box.querySelector(".ms-input-ds");
    var ta = inp && inp.shadowRoot && inp.shadowRoot.querySelector("textarea");
    if (ta) ta.removeAttribute("aria-invalid");
  }

  /* ---------- Valasz betoltese (a jog.gov.hu "k2s" eredmeny-komponensenek mintajara) ----------
   * 1. "processing": kozepre igazitott betolto (forgo gyuru + bagoly) es pulzalo szoveg;
   * 2. "generating": a kartya megjelenik, a betolto balra kerul ("Az MI gondolkodik"), a bekezdesek egymas utan
   *    ".5s slideIn" animacioval jelennek meg; a vegen a betolto eltunik, majd a jogszabalyok / azonosito / visszajelzes. */
  var LOAD_TEXT = {
    hu: { processing: "Releváns jogi források keresése", generating: "Az MI gondolkodik" },
    en: { processing: "Search for relevant legal sources", generating: "AI is thinking" },
    de: { processing: "Nach relevanten Rechtsquellen suchen", generating: "KI Denkprozess läuft" },
    fr: { processing: "Recherche de sources juridiques pertinentes", generating: "L'IA réfléchit" },
    es: { processing: "Búsqueda de fuentes jurídicas relevantes", generating: "La IA está pensando." },
    it: { processing: "Ricerca di fonti giuridiche rilevanti", generating: "L'IA sta pensando" },
    zh: { processing: "正在检索相关法律依据", generating: "人工智能正在思考中" }
  };
  function loaderHtml(msg, left) {
    var owl = document.querySelector('img[alt="Bagoly Ikon"], img[data-ms-owl]');
    var src = owl ? owl.getAttribute("src") : "";
    return '<div class="ms-ld' + (left ? " ms-ld--left" : "") + '"><span class="ms-ld-ring-wrap"><span class="ms-ld-owl">' +
      (src ? '<img src="' + String(src).replace(/"/g, "&quot;") + '" alt="">' : "") + '</span><span class="ms-ld-ring"></span></span>' +
      '<p class="ms-ld-text">' + msg + '</p></div>';
  }
  /* ---------- Ritkabban hasznalt szavak: alahuzas + rovid, kozerthetoe magyarazat ----------
   * A valasz szovegeben az elso elofordulast alahuzzuk (gomb); kattintasra/Enterre/fokuszra magyarazat jelenik meg. */
  var GLOSSARY = {
    hu: [
      ["munkaügyi jogvit", "vita a munkáltatóddal a munkaviszonyból eredő jogaidról, amelyet végül bíróság dönt el"],
      ["keresetlevel", "a bíróságnak írt kérelem, amellyel pert indítasz"],
      ["jogellenes", "ami nem felel meg a jogszabályoknak"],
      ["jogkövetkezmény", "az, ami a jogszabály szerint egy jogsértés után bekövetkezik"],
      ["elmaradt jövedelem", "az a fizetés, amit a jogellenes felmondás miatt nem kaptál meg"],
      ["kártérítés", "pénzösszeg, amellyel a bekövetkezett kárt meg kell téríteni"],
      ["végkielégítés", "a munkáltató által fizetendő összeg bizonyos felmondások esetén"],
      ["okszerű", "észszerű, a tényekből logikusan következő"],
      ["adóügyi illetőség", "az az ország, ahol adózási szempontból lakosnak számítasz"],
      ["illetőség", "az az ország, ahol adózási szempontból lakosnak számítasz"],
      ["kettős adóztatást elkerülő egyezmény", "két ország megállapodása arról, hogy ugyanazt a jövedelmet ne adóztassák kétszer"],
      ["kifizető", "aki a jövedelmet kifizeti, például a munkáltatód"],
      ["telephely", "állandó üzleti hely, ahol a cég tevékenységét végzi"],
      ["kirendel", "a munkavállalót ideiglenesen másik helyre vagy országba küldi dolgozni"],
      ["kellékszavatossági igény", "a hibás termék miatt az eladóval szemben érvényesíthető jogod (javítás, csere, árleszállítás vagy elállás)"],
      ["árleszállítás", "a vételár csökkentése a hiba miatt"],
      ["elállás", "visszalépés a szerződéstől: visszaadod a terméket, és visszakapod a pénzed"],
      ["vélelem", "amit addig igaznak kell tekinteni, amíg az ellenkezőjét be nem bizonyítják"],
      ["vélelm", "amit addig igaznak kell tekinteni, amíg az ellenkezőjét be nem bizonyítják"],
      ["elévülési idő", "az az idő, amelynek letelte után az igényedet már nem lehet bíróságon érvényesíteni"],
      ["jogvesztő", "a határidő lejárta után az igényed végleg elvész"],
      ["kiürítés", "az ingatlan kiürítése, vagyis a kiköltöztetés"],
      ["végrehajtási eljárás", "az az eljárás, amelyben a tartozást vagy a bírósági döntést kényszerrel teljesítik"],
      ["árverés", "nyilvános eladás, ahol a legtöbbet ígérő vásárolja meg a vagyontárgyat"],
      ["eljárási garancia", "olyan szabály, amely az eljárás során védi a jogaidat"],
      ["kézbesítés", "a hivatalos irat átadása, megérkezése hozzád"]
    ],
    en: [
      ["labour dispute", "a dispute with your employer about your rights from the employment, which a court ultimately decides"],
      ["statement of claim", "the written request to the court with which you start a lawsuit"],
      ["unlawful", "not in line with the law"],
      ["lost earnings", "the pay you did not receive because of the unlawful dismissal"],
      ["damages", "money paid to make up for the harm that occurred"],
      ["reinstatement", "you get your job back"],
      ["severance pay", "an amount the employer must pay after certain dismissals"],
      ["tax resident", "living in a country for tax purposes"],
      ["double taxation convention", "an agreement between two countries so that the same income is not taxed twice"],
      ["withholding", "the payer deducts the tax from your pay before paying you"],
      ["permanent establishment", "a fixed place of business where a company carries on its activity"],
      ["warranty claim", "your right against the seller when a product is defective (repair, replacement, price reduction or withdrawal)"],
      ["price reduction", "a lower price because of the defect"],
      ["withdrawal from the contract", "backing out of the deal: you return the product and get your money back"],
      ["presumption", "something treated as true until the opposite is proved"],
      ["limitation period", "the time after which a claim can no longer be enforced in court"],
      ["preclusive deadline", "a deadline after which the right is lost for good"],
      ["enforcement proceedings", "the procedure in which a debt or a court decision is enforced by force of law"],
      ["auction", "a public sale in which the highest bidder buys the property"]
    ]
  };
  function glossify(html) {
    var list = GLOSSARY[LANG]; if (!list || !html) return html;
    var tpl = document.createElement("template"); tpl.innerHTML = html;
    var walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    GLOSS_USED = GLOSS_USED || {};
    list.slice().sort(function (a, b) { return b[0].length - a[0].length; }).forEach(function (g) {
      var key = g[1];                                       // azonos magyarazatu alakok (pl. illetoseg) csak egyszer
      if (GLOSS_USED[key]) return;
      var re = new RegExp("(^|[^\\p{L}])(" + g[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\p{L}*)", "iu");
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i]; if (!node.parentNode || node.parentNode.closest && node.parentNode.closest(".ms-term-wrap, a, button")) continue;
        var m = re.exec(node.nodeValue); if (!m) continue;
        var start = m.index + m[1].length, word = m[2];
        var after = node.splitText(start); after.splitText(word.length);
        var id = "ms-term-" + (GLOSS_ID++);
        var wrap = document.createElement("span"); wrap.className = "ms-term-wrap";
        var b = document.createElement("button"); b.type = "button"; b.className = "ms-term"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-describedby", id); b.textContent = word;
        var d = document.createElement("span"); d.className = "ms-term-def"; d.id = id; d.setAttribute("role", "tooltip"); d.hidden = true; d.textContent = g[1];
        wrap.appendChild(b); wrap.appendChild(d);
        after.parentNode.replaceChild(wrap, after);
        GLOSS_USED[key] = true;
        nodes = []; var w2 = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT), n2;      // a felosztott szovegcsomopontok miatt ujra gyujtjuk
        while ((n2 = w2.nextNode())) nodes.push(n2);
        break;
      }
    });
    var div = document.createElement("div"); div.appendChild(tpl.content); return div.innerHTML;
  }
  var GLOSS_USED = null, GLOSS_ID = 1;
  function closeTerms(except) {
    document.querySelectorAll(".ms-term[aria-expanded=true]").forEach(function (t) {
      if (t === except) return;
      t.setAttribute("aria-expanded", "false"); t.parentNode.classList.remove("is-open"); t.nextElementSibling.hidden = true;
    });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".ms-term");
    if (!t) { closeTerms(null); return; }
    var open = t.getAttribute("aria-expanded") !== "true";
    closeTerms(t);
    t.setAttribute("aria-expanded", open ? "true" : "false"); t.parentNode.classList.toggle("is-open", open); t.nextElementSibling.hidden = !open;
  });
  // a magyarazat a parbeszedablak tartalmi teruleten belul marad (nincs vizszintes gorgetes): szelen balra tolodik
  function placeDef(wrap) {
    var d = wrap && wrap.querySelector(".ms-term-def"), box = wrap && wrap.closest(".ms-rd-body");
    if (!d || !box) return;
    d.style.left = "0";
    var br = box.getBoundingClientRect(), dr = d.getBoundingClientRect();
    if (!dr.width) return;
    var maxRight = br.left + box.clientWidth, shift = Math.max(0, dr.right - maxRight);
    shift = Math.min(shift, Math.max(0, dr.left - br.left));
    d.style.left = (-shift) + "px";
  }
  ["mouseover", "focusin", "click"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var w = e.target.closest && e.target.closest(".ms-term-wrap");
      if (w) setTimeout(function () { placeDef(w); }, 0);
    });
  });
  // ha a fokusz elhagyja a kiemelt szot (Tab / Shift+Tab), a magyarazat is eltunik
  document.addEventListener("focusout", function (e) {
    var t = e.target.closest && e.target.closest(".ms-term");
    if (t && t.getAttribute("aria-expanded") === "true") closeTerms(null);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { var o = document.querySelector(".ms-term[aria-expanded=true]"); if (o) { closeTerms(null); o.focus(); } }
  });

  function renderBlocks(blocks) {
    var out = "";
    GLOSS_USED = {};
    blocks.forEach(function (b) {
      if (b.t === "p") out += "<p>" + b.html + cite(b.cite) + "</p>";
      else if (b.t === "lead") out += '<p class="ms-lead">' + b.html + "</p>";
      else if (b.t === "ul" || b.t === "ol") {
        var tag = b.t === "ul" ? "ul" : "ol";
        out += "<" + tag + ">";
        b.items.forEach(function (it) { out += "<li>" + it.html + cite(it.cite) + "</li>"; });
        out += "</" + tag + ">";
      }
    });
    return glossify(out);
  }

  function renderAnswer(a) {
    var lawsHtml = a.laws.map(function (l) {
      return '<div class="ms-law">' + lawLink(l) +
             '<div class="ms-law-desc">' + l.desc + '</div></div>';
    }).join("");

    return '' +
      '<div class="ms-results-grid">' +
        '<div class="ms-answer-card">' +
          '<div class="ms-answer-head">' +
            '<div class="ms-head-badge">' +
              '<h2 class="ms-answer-label" id="ms-answer-title" tabindex="-1">' + S.ansLabel + '</h2>' +
            '</div>' +
          '</div>' +
          '<div class="ms-disclaimer">' + IC.warn + '<span>' + S.disclaimer + '</span></div>' +
          '<div class="ms-answer-body">' + renderBlocks(a.blocks) + '</div>' +
          '<div class="ms-laws-section">' +
            '<h2 class="ms-laws-title">' + S.laws + '</h2>' +
            lawsHtml +
          '</div>' +
          '<hr class="ms-sep">' +
          '<div class="ms-answer-foot">' + '<div class="ms-answer-id"><span class="ms-answer-id-label">' + (LANG === "hu" ? "Válasz azonosító" : S.ansId.replace(/\s*[:：]\s*$/, "")) + '</span><span class="ms-answer-id-value">' + a.id + '</span></div>' + toolsHtml() + '</div>' +
        '</div>' +

      '</div>';
  }

  /* ------------------------------------------- szakmai nezet (Szakmai kereso kapcsolo)
   * Az osszefoglalo helyett dokumentumlistak, fulenkent (az eles B2B talalati oldal mintajara):
   * jogszabalyok, birosagi hatarozatok, indokolasok, hivatalos ertesitok. */
  var PRO_VIEW = {
    hu: { title: "Szakmai találatok", tabs: ["Jogszabályok", "Bírósági határozatok", "Indokolások", "Hivatalos értesítők"], none: "Ebben a kategóriában nincs találat." },
    en: { title: "Professional results", tabs: ["Legislation", "Court decisions", "Statements of reasons", "Official notices"], none: "No results in this category." },
    de: { title: "Fachergebnisse", tabs: ["Rechtsvorschriften", "Gerichtsentscheidungen", "Begründungen", "Amtliche Mitteilungen"], none: "Keine Ergebnisse in dieser Kategorie." },
    fr: { title: "Résultats professionnels", tabs: ["Législation", "Décisions de justice", "Exposés des motifs", "Avis officiels"], none: "Aucun résultat dans cette catégorie." },
    es: { title: "Resultados profesionales", tabs: ["Legislación", "Resoluciones judiciales", "Exposiciones de motivos", "Avisos oficiales"], none: "Sin resultados en esta categoría." },
    it: { title: "Risultati professionali", tabs: ["Legislazione", "Decisioni giudiziarie", "Relazioni illustrative", "Avvisi ufficiali"], none: "Nessun risultato in questa categoria." },
    zh: { title: "专业结果", tabs: ["法律法规", "法院裁判", "立法理由", "官方公告"], none: "此类别中没有结果。" }
  };
  var PRO_LAW = {
    hu: { on: "Hatályos", off: "Nem hatályos", cal: "Időpont kiválasztása" },
    en: { on: "In force", off: "Not in force", cal: "Select a date" },
    de: { on: "In Kraft", off: "Nicht in Kraft", cal: "Zeitpunkt wählen" },
    fr: { on: "En vigueur", off: "Non en vigueur", cal: "Choisir une date" },
    es: { on: "En vigor", off: "No vigente", cal: "Seleccionar fecha" },
    it: { on: "In vigore", off: "Non in vigore", cal: "Seleziona una data" },
    zh: { on: "现行有效", off: "已失效", cal: "选择日期" }
  };
  var IC_CAL = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M7.5 13.5h1.5M11.3 13.5h1.5M15 13.5h1.5M7.5 16.7h1.5M11.3 16.7h1.5"/></svg>';
  function fmtD(iso) { return iso ? iso.replace(/-/g, ".") + "." : ""; }
  function inForce(from, to, d) { return (!from || from <= d) && (!to || d <= to); }
  function renderPro(a) {
    var V = PRO_VIEW[LANG] || PRO_VIEW.en;
    var pro = a.pro || {
      legislation: a.laws.map(function (l) { return { title: l.ref, meta: V.tabs[0] + " · " + l.desc, text: "" }; }),
      court: [], reasons: [], notices: []
    };
    var lists = [pro.legislation, pro.court, pro.reasons, pro.notices];
    var tabs = V.tabs.map(function (t, i) {
      return '<button type="button" role="tab" class="ms-pro-tab" id="ms-pro-tab-' + i + '" aria-controls="ms-pro-panel-' + i + '" aria-selected="' + (i === 0 ? "true" : "false") +
             '" tabindex="0">' + t + ' <span class="ms-pro-count">' + lists[i].length + '</span></button>';
    }).join("");
    var panels = lists.map(function (docs, i) {
      var body = docs.length ? '<ul class="ms-pro-list">' + docs.map(function (d) {
        var main = lawLink({ ref: d.title, desc: d.meta }, "ms-pro-doc-title");
        if (i !== 0) return '<li class="ms-pro-doc">' + main + '<div class="ms-pro-doc-meta">' + d.meta + '</div>' + (d.text ? '<p class="ms-pro-doc-text">' + d.text + '</p>' : '') + '</li>';
        // jogszabaly: hatalyossag-ikon az elejen, idopont-valaszto naptar a vegen
        var L = PRO_LAW[LANG] || PRO_LAW.en, on = inForce(d.from, d.to, new Date().toISOString().slice(0, 10));
        return '<li class="ms-pro-doc ms-pro-law" data-from="' + (d.from || "") + '" data-to="' + (d.to || "") + '">' +
               '<div class="ms-pro-doc-main"><div class="ms-pro-doc-head">' + main +
               '<span class="ms-pro-status ' + (on ? "is-on" : "is-off") + '" data-on="' + L.on + '" data-off="' + L.off + '">' + (on ? L.on : L.off) + '</span></div>' +
               (d.from ? '<div class="ms-pro-doc-dates">' + fmtD(d.from) + ' - ' + fmtD(d.to) + '</div>' : '') +
               '<div class="ms-pro-doc-meta">' + d.meta + '</div>' + (d.text ? '<p class="ms-pro-doc-text">' + d.text + '</p>' : '') + '</div>' +
               '<span class="ms-pro-cal"><button type="button" class="ms-pro-cal-btn" aria-label="' + L.cal + '">' + IC_CAL + '</button>' +
               '<input type="date" class="ms-pro-cal-input" tabindex="-1" aria-hidden="true"></span></li>';
      }).join("") + '</ul>' : '<p class="ms-pro-none">' + V.none + '</p>';
      return '<div role="tabpanel" class="ms-pro-panel" id="ms-pro-panel-' + i + '" aria-labelledby="ms-pro-tab-' + i + '"' + (i === 0 ? "" : " hidden") + (docs.length ? "" : ' tabindex="0"') + '>' + body + '</div>';
    }).join("");
    return '<div class="ms-pro">' +
      '<div class="ms-answer-head"><div class="ms-head-badge">' +
      '<h2 class="ms-answer-label" id="ms-answer-title" tabindex="-1">' + V.title + '</h2></div></div>' +
      '<div class="ms-disclaimer">' + IC.warn + '<span>' + S.disclaimer + '</span></div>' +
      '<div class="ms-pro-tabs" role="tablist" aria-label="' + V.title + '">' + tabs + '</div>' + panels +
      '<hr class="ms-sep">' +
      '<div class="ms-answer-foot">' + '<div class="ms-answer-id"><span class="ms-answer-id-label">' + (LANG === "hu" ? "Válasz azonosító" : S.ansId.replace(/\s*[:：]\s*$/, "")) + '</span><span class="ms-answer-id-value">' + a.id + '</span></div>' + toolsHtml() + '</div>' +
      '</div>';
  }
  function initProTabs(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll(".ms-pro-tab"));
    function panelOf(i) { return root.querySelector("#" + tabs[i].getAttribute("aria-controls")); }
    function links(i) { return Array.prototype.slice.call(panelOf(i).querySelectorAll("a[href]")); }
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        t.setAttribute("aria-selected", j === i ? "true" : "false");
        panelOf(j).hidden = j !== i;     // minden ful Tab-bal elerheto marad (tabindex=0)
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (e) {
        // Balra/Jobbra/Home/End: ful-valtas; Le: a (kivalasztott) ful lista elso elemere
        var n = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length :
                e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
        if (n >= 0) { e.preventDefault(); select(n, true); return; }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          select(i, false);
          var l = links(i);
          if (l.length) l[0].focus(); else panelOf(i).focus();
        }
      });
    });
    // idopont-valaszto: a kivalasztott napon hatalyos-e a jogszabaly
    root.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".ms-pro-cal-btn");
      if (!b) return;
      var inp = b.parentNode.querySelector(".ms-pro-cal-input");
      try { inp.showPicker(); } catch (er) { inp.focus(); inp.click(); }
    });
    root.addEventListener("change", function (e) {
      var inp = e.target;
      if (!(inp.classList && inp.classList.contains("ms-pro-cal-input")) || !inp.value) return;
      var li = inp.closest(".ms-pro-law"), st = li.querySelector(".ms-pro-status");
      var on = inForce(li.getAttribute("data-from"), li.getAttribute("data-to"), inp.value);
      st.textContent = on ? st.getAttribute("data-on") : st.getAttribute("data-off");
      st.classList.toggle("is-on", on); st.classList.toggle("is-off", !on);
      li.querySelector(".ms-pro-cal-btn").focus();
    });
    // a lista elemei kozott Le/Fel nyil; Fel az elso elemrol visszaviszi a fulre
    root.querySelectorAll(".ms-pro-panel").forEach(function (panel, pi) {
      panel.addEventListener("keydown", function (e) {
        var l = links(pi), idx = l.indexOf(document.activeElement);
        if (idx === -1 && document.activeElement !== panel) return;
        if (e.key === "ArrowDown") { e.preventDefault(); if (idx < l.length - 1) l[idx + 1].focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); if (idx > 0) l[idx - 1].focus(); else tabs[pi].focus(); }
        else if (e.key === "Home" && l.length) { e.preventDefault(); l[0].focus(); }
        else if (e.key === "End" && l.length) { e.preventDefault(); l[l.length - 1].focus(); }
      });
    });
  }

  /* ------------------------------------------------------------------ vezérlés */
  /* ---------- Korabbi keresesek: kartyak, a valasz parbeszedablakban, es az "Osszes keresesem" oldal ---------- */
  var REC_DATES = ["2026-10-19", "2026-10-17", "2026-10-14", "2026-10-09", "2026-10-02"];   // mock adat, legujabb elol
  var REC_TITLES = {
    hu: ["Főbérlő ki akar lakoltatni", "Elromlott mosógép", "Adózás külföldi lakcímmel", "Felmondás a munkahelyen", "Munkáltatói felmondás indoka"],
    en: ["Landlord wants me out", "Broken washing machine", "Tax with a foreign address", "Dismissal at work", "Reason for dismissal"]
  };
  var ALL_LABEL = { hu: "Összes keresésem", en: "All my searches", de: "Alle meine Suchen", fr: "Toutes mes recherches", es: "Todas mis búsquedas", it: "Tutte le mie ricerche", zh: "我的全部搜索" };
  function ALL_RECENT_LABEL() { return S.rec || S.samples; }
  var isHomePage = !document.getElementById("mock-search-results") && !/\/(szakmai-)?jogi-informacio-kereso/.test(location.pathname);
  function escH(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmtDate(iso) {
    try { return new Date(iso + "T12:00:00").toLocaleDateString(LANG === "zh" ? "zh-CN" : LANG, { year: "numeric", month: "long", day: "numeric" }); } catch (e) { return iso; }
  }
  function recTitleOf(i) {
    var q = RECENT[i];
    if (REC_TITLES[LANG] && REC_TITLES[LANG][i]) return REC_TITLES[LANG][i];
    var w = q.split(" ").slice(0, 4).join(" "); return w.length < q.length ? w + "…" : w;
  }
  function answerExcerpt(i) {
    var a = match(RECENT[i]); if (!a || !a.blocks || !a.blocks.length) return "";
    var b = a.blocks[0], tmp = document.createElement("div");
    tmp.innerHTML = b.html || ((b.items && b.items[0] && b.items[0].html) || "");
    return (tmp.textContent || "").replace(/\s+/g, " ").trim();
  }
  function recCardHtml(i, extraCls, hidden, withAnswer) {
    var iso = REC_DATES[i % REC_DATES.length], ex = withAnswer ? answerExcerpt(i) : "";
    return '<button type="button" class="ms-rc' + (extraCls ? " " + extraCls : "") + '"' + (hidden ? " hidden" : "") + ' data-i="' + i + '">' +
      '<time class="ms-rc-date" datetime="' + iso + '">' + escH(fmtDate(iso)) + '</time>' +
      '<span class="ms-rc-title">' + escH(recTitleOf(i)) + '</span>' +
      '<span class="ms-rc-text">' + escH(RECENT[i]) + '</span>' +
      (ex ? '<span class="ms-rc-answer">' + escH(ex) + '</span>' : "") + '</button>';
  }
  var recDlg = null, recOpener = null;
  function openRecent(i, opener) {
    var q = RECENT[i], a = match(q);
    if (!recDlg) {
      recDlg = document.createElement("dialog");
      recDlg.className = "ms-law-dialog ms-recent-dialog";
      recDlg.setAttribute("aria-labelledby", "ms-rd-title");
      document.body.appendChild(recDlg);
      recDlg.addEventListener("click", function (ev) { if (ev.target === recDlg) recDlg.close(); });
      recDlg.addEventListener("close", function () { if (recOpener && recOpener.focus) try { recOpener.focus(); } catch (er) {} });
    }
    recOpener = opener;
    var iso = REC_DATES[i % REC_DATES.length], inner;
    if (a) {
      var tmp = document.createElement("div");
      tmp.innerHTML = renderAnswer(a);
      var card = tmp.querySelector(".ms-answer-card");
      var h2 = card && card.querySelector("#ms-answer-title"); if (h2) h2.removeAttribute("id");   // egyedi azonosito marad az oldalon
      inner = card ? card.outerHTML.replace(/<h2\b/g, "<h4").replace(/<\/h2>/g, "</h4>") : "";     // a parbeszedablak cime h3, a belso cimek h4
    } else inner = '<p class="ms-law-na">' + escH(S.none) + '</p>';
    recDlg.innerHTML =
      '<div class="ms-settings-head"><div><h3 id="ms-rd-title" class="ms-settings-title">' + escH(recTitleOf(i)) + '</h3>' +
      '<p class="ms-law-sub"><time datetime="' + iso + '">' + escH(fmtDate(iso)) + '</time><br>' + escH(q) + '</p></div>' +
      '<button type="button" class="ms-settings-x" aria-label="' + escH(CLOSE_TEXT[LANG] || CLOSE_TEXT.en) + '">&times;</button></div>' +
      '<div class="ms-rd-body" tabindex="0">' + inner + '</div>';
    recDlg.querySelector(".ms-settings-x").addEventListener("click", function () { recDlg.close(); });
    recDlg.showModal();
    recDlg.querySelector(".ms-rd-body").scrollTop = 0;
  }
  // az "Osszes keresesem" oldal (/osszes-keresesem): az osszes korabbi keres kartyakon, a valasz kivonataval
  function renderAllSearches() {
    var main = document.querySelector("main[data-ms-all]");
    if (!main || main.querySelector(".ms-allsearches")) return;
    var sec = document.createElement("section");
    sec.className = "ms-allsearches";
    sec.setAttribute("aria-label", ALL_LABEL[LANG] || ALL_LABEL.en);
    sec.innerHTML = '<div class="ms-allsearches-in"><div class="ms-rc-grid">' + RECENT.map(function (q, i) { return recCardHtml(i, "", false, true); }).join("") + '</div></div>';
    main.appendChild(sec);
    sec.addEventListener("click", function (e) {
      var rc = e.target.closest && e.target.closest(".ms-rc");
      if (rc) openRecent(+rc.getAttribute("data-i"), rc);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderAllSearches); else renderAllSearches();

  var RESULTS_PAGE = PREFIX + "/";

  function boot() {
    var barMount = document.getElementById("mock-search-bar");
    var resMount = document.getElementById("mock-search-results");
    if (!barMount) return;
    // resMount hiánya = kezdőlap: nincs átirányítás, a találatok ugyanitt, a hero alatt töltődnek be
    var isHome = !resMount;
    if (isHome) {
      var mainEl = document.querySelector("main");
      resMount = document.createElement("div");
      resMount.id = "mock-search-results";
      resMount.className = "pt-(--dds-spacing-1200) px-(--dds-spacing-400) flex flex-col";
      (mainEl || barMount.parentNode).appendChild(resMount);
    }
    // a valasz a fo teruleten (a hero-ban) jelenik meg, kozvetlenul a kereso mezo alatt
    if (barMount.parentNode && barMount.nextSibling !== resMount) barMount.parentNode.insertBefore(resMount, barMount.nextSibling);
    var redirectMode = false;

    // Kezdolap: a zold (hero) hatter a valaszkartya "A valasz nem minosul hivatalos jogi tanacsadasnak." sora
    // alatt er veget; a kartya tobbi resze a vilagos hatterre log ki (a hero magassagat a mount fix
    // magassaga adja, az alatta levo tartalom a kilogo resz helyet kapja a --ms-overflow valtozoval).
    // A zold terulet magassaga MINDEN allapotban azonos (alapallapot, betoltes, ures valasz, kesz valasz): a mount fix
    // magassaga (HERO_FIT) adja; ami ennel magasabb, az a vilagos hatterre logva jelenik meg.
    var fitObserver = null, fitObserved = null;
    var HERO_FIT = function () { return window.innerWidth < 640 ? 16 : 2 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16); };
    function fitHero() {
      var mainEl2 = document.querySelector("main");
      if (!isHome || !mainEl2) return;
      var R = resMount.querySelector(".ms-results");
      var card = resMount.querySelector(".ms-answer-card, .ms-pro");
      var disc = card && card.querySelector(".ms-disclaimer");
      var mTop = resMount.getBoundingClientRect().top;
      var fixedH = HERO_FIT();
      if (R && card && disc) {
        var cardTop = card.getBoundingClientRect().top;
        var keep = (disc.getBoundingClientRect().bottom - cardTop) + 18;           // a kartya teteje + a figyelmeztetes sora alatt
        fixedH = Math.max(fixedH, Math.round((cardTop - mTop) + keep));
      }
      var total = R ? R.getBoundingClientRect().bottom - mTop : 0;
      resMount.classList.add("is-fit");
      resMount.style.height = Math.round(fixedH) + "px";
      mainEl2.style.setProperty("--ms-overflow", Math.max(0, Math.round(total - fixedH)) + "px");
      if (window.ResizeObserver && R !== fitObserved) {
        if (!fitObserver) fitObserver = new ResizeObserver(function () { fitHero(); });
        fitObserver.disconnect(); fitObserved = R;
        if (R) fitObserver.observe(R);
      }
    }
    if (isHome) { fitHero(); window.addEventListener("resize", fitHero); }

    // A searchbar a design system VALÓDI komponenseibol epul (dap-ds-textarea,
    // dap-ds-icon-button, dap-ds-switch) -> pontosan ugy nez ki, mint elesen.
    function suggestCol(icon, title, items, gid) {
      // Valodi <ul>/<li>: a natic HTML-lista-szemantikat a felolvasok
      // megbizhatobban ismerik fel, mint a role="list"/"listitem" felulirast
      // generikus <div>-eken. A <ul> a cimhez (gid) van aria-labelledby-vel
      // kotve, igy "lista, <nev>, N elem"-et jelez, es minden <li>-nel
      // elem-pozicot (pl. "2/3") mond.
      var lis = items.map(function () {
        return '<li><button type="button" class="ms-suggest-btn"></button></li>';
      }).join("");
      return '<div class="ms-suggest-col">' +
        '<span class="ms-suggest-title" id="' + gid + '">' + icon + '<span>' + title + '</span></span>' +
        '<ul class="ms-suggest-ul" aria-labelledby="' + gid + '">' + lis + '</ul>' +
        '</div>';
    }
    barMount.innerHTML =
      '<div class="ms-searchbar-wrap' + (isHome ? ' ms-on-dark' : '') + '">' +
        '<div class="ms-searchbar-ds">' +
          '<label class="ms-label" id="ms-label">' + S.label + '</label>' +
          '<dap-ds-textarea class="ms-input-ds" size="lg" subtle hidecounter ' +
            'placeholder="' + attr(S.ph) + '"></dap-ds-textarea>' +
          '<div class="ms-actions ms-actions-left">' +
            (isHomePage ? '<button type="button" class="ms-history-btn" data-tip="' + attr(ALL_RECENT_LABEL()) + '" aria-label="' + attr(ALL_RECENT_LABEL()) + '" aria-expanded="false" aria-controls="ms-history-panel">' + HIST_ICON + '</button>' : '') +
            '<dap-ds-icon-button class="ms-add-btn" data-tip="' + attr((DOC_TEXT[LANG] || DOC_TEXT.en)[0]) + '" aria-label="' + attr((DOC_TEXT[LANG] || DOC_TEXT.en)[0]) + '" variant="brand" size="md"><dap-ds-icon size="md">' + IC_ADD + '</dap-ds-icon></dap-ds-icon-button>' +
            '<input type="file" class="ms-add-input" accept=".pdf,.doc,.docx,.txt,.rtf,.odt" multiple hidden>' +
            '<dap-ds-icon-button class="ms-settings-btn" data-tip="' + attr(SETTINGS_TITLE[LANG] || SETTINGS_TITLE.en) + '" aria-label="' + attr(SETTINGS_TITLE[LANG] || SETTINGS_TITLE.en) + '" aria-haspopup="dialog" variant="brand" size="md"><dap-ds-icon size="md">' + IC_SETTINGS + '</dap-ds-icon></dap-ds-icon-button>' +
          '</div>' +
          '<div class="ms-actions">' +
            '<dap-ds-icon-button class="ms-clear-ds" data-tip="' + attr(S.clear) + '" aria-label="' + S.clear + '" variant="subtle" size="md" icon="close-line" style="display:none"></dap-ds-icon-button>' +
            '<dap-ds-icon-button class="ms-mic-ds" data-tip="' + attr(MIC.tip) + '" aria-label="' + MIC.start + '" variant="brand" size="md"><dap-ds-icon size="md">' + IC_MIC + '</dap-ds-icon></dap-ds-icon-button>' +
            '<dap-ds-icon-button class="ms-search-ds" data-tip="' + attr(S.search) + '" aria-label="' + S.search + '" variant="brand" size="md" icon="search-line"></dap-ds-icon-button>' +
          '</div>' +
          '<div class="ms-suggest" id="ms-suggest-panel" role="group" aria-label="' + S.suggest + '">' +
            (POPULAR.length ? suggestCol(IC_TREND, S.pop, POPULAR, "ms-suggest-pop") : "") +
            suggestCol(IC_HIST, S.rec || S.samples, RECENT, "ms-suggest-rec") +
          '</div>' +
        '</div>' +
        '<dialog class="ms-settings-dialog" aria-labelledby="ms-settings-title">' +
          '<div class="ms-settings-head"><h3 id="ms-settings-title" class="ms-settings-title">' + (SETTINGS_TITLE[LANG] || SETTINGS_TITLE.en) + '</h3>' +
            '<button type="button" class="ms-settings-x" aria-label="' + attr(CLOSE_TEXT[LANG] || CLOSE_TEXT.en) + '">&times;</button></div>' +
          '<div class="ms-toggles-ds">' +
            '<div class="ms-pro-row">' +
              '<dap-ds-switch size="xs" name="professional" label="' + attr(PRO.label) + '"></dap-ds-switch>' +
              '<span class="ms-info-tip">' +
                '<dap-ds-icon-button class="ms-info-btn" clean size="xs" iconSize="16" aria-label="' + attr(PRO.info) + '" aria-describedby="ms-info-pop">' +
                  '<dap-ds-icon name="information-line" aria-hidden="true"></dap-ds-icon></dap-ds-icon-button>' +
                '<span class="ms-info-pop" id="ms-info-pop" role="tooltip">' + escH(PRO.tip) + '</span>' +
              '</span>' +
            '</div>' +
            '<dap-ds-switch size="xs" name="municipality" label="' + attr(S.sw1) + '"></dap-ds-switch>' +
            '<dap-ds-switch size="xs" name="timemachine" label="' + attr(S.sw2) + '"></dap-ds-switch>' +
          '</div>' +
          '<div class="ms-settings-foot"><button type="button" class="dds-button dds-button--primary dds-button--md dds-button-square ms-settings-done">' + (DONE_TEXT[LANG] || DONE_TEXT.en) + '</button></div>' +
        '</dialog>' +
        '<div class="ms-sr-only" id="ms-status" role="status" aria-live="polite" aria-atomic="true"></div>' +
      '</div>';
    // a javaslat-gombok szövegét textContent-tel toltjuk fel (biztonsagos)
    (function () {
      var colPop = barMount.querySelector("#ms-suggest-pop"), colRec = barMount.querySelector("#ms-suggest-rec");
      [[colPop, POPULAR], [colRec, RECENT]].forEach(function (c) {
        if (!c[0]) return;
        var bs = c[0].parentNode.querySelectorAll(".ms-suggest-btn");
        c[1].forEach(function (t, i) { if (bs[i]) bs[i].textContent = t; });
      });
    })();

    function announce(msg) {
      var st = barMount.querySelector("#ms-status");
      if (!st) return;
      st.textContent = "";
      setTimeout(function () { st.textContent = msg; }, 60);
    }

    var filterGuard = null, runTok = 0;
    function run(getVal) {
      var q = (getVal() || "").trim();
      var taEl = barMount.querySelector(".ms-input-ds");
      if (q.length < MIN_CHARS) {
        if (taEl) {
          var msg0 = MIN_CHAR_TEXT[LANG] || MIN_CHAR_TEXT.en;
          fieldError(msg0);
          if (!taEl.__minCharBound) {
            taEl.__minCharBound = true;
            taEl.addEventListener("dds-input", clearFieldError);
          }
          var inp = taEl.shadowRoot && taEl.shadowRoot.querySelector("textarea"); if (inp) inp.focus();
        }
        return;
      }
      clearFieldError();
      if (filterGuard && !filterGuard()) return;
      // "Szakmai kereso" kapcsolo: dokumentumlista (szakmai oldal) az osszefoglalo helyett
      var proSw = barMount.querySelector('dap-ds-switch[name="professional"]');
      var wantPro = !!(proSw && (proSw.__touched ? proSw.checked : INIT_PRO));   // erintes nelkul az URL szerinti mod
      if (redirectMode) { location.assign(RESULTS_PAGE + "?q=" + encodeURIComponent(q) + (wantPro ? "&szakmai=1" : "")); return; }
      resMount.setAttribute("data-mode", wantPro ? "professional" : "summary");
      try {   // az URL kovesse a kapcsolot (frissitesre / megosztasra ugyanaz a mod)
        var u2 = new URL(location.href);
        u2.searchParams.set("q", q);
        if (wantPro) u2.searchParams.set("szakmai", "1"); else u2.searchParams.delete("szakmai");
        // uj kerdes = uj elozmeny-bejegyzes (a Vissza az elozo kerdesre / kepernyore visz); ugyanaz a kerdes nem duplazodik
        var cur = new URL(location.href);
        var same = (cur.searchParams.get("q") || "") === q && (cur.searchParams.get("szakmai") === "1") === !!wantPro;
        if (same) history.replaceState(history.state, "", u2.pathname + u2.search);
        else history.pushState({ msq: q }, "", u2.pathname + u2.search);
      } catch (e) {}
      resMount.setAttribute("aria-busy", "true");
      announce(S.loading);
      var LT = LOAD_TEXT[LANG] || LOAD_TEXT.en;
      resMount.innerHTML = '<div class="ms-results"><div class="ms-ld-card ms-slidein" aria-hidden="true">' + loaderHtml(LT.processing, false) + '</div></div>';
      fitHero();
      var tok = ++runTok;
      JogMockSearch.ask(q).then(function (a) {
        if (tok !== runTok) return;   // kozben masik kerdes / Vissza: az elavult valasz nem jelenik meg
        if (!a) {
          var msg = S.none;
          resMount.innerHTML = '<div class="ms-results"><div class="ms-empty">' + msg + '</div></div>';
          fitHero();
          resMount.removeAttribute("aria-busy");
          announce(msg);
          return;
        }
        var wrap = document.createElement("div");
        wrap.className = "ms-results";
        wrap.innerHTML = wantPro ? renderPro(a) : renderAnswer(a);
        resMount.innerHTML = "";
        resMount.appendChild(wrap);
        if (wantPro) initProTabs(wrap);
        fitHero();
        // kesz allapot: a felolvaso bemondja, hogy a valasz betoltodott, utana a fokusz a valasz cimere kerul
        var done = function () {
          resMount.removeAttribute("data-streaming"); resMount.removeAttribute("aria-busy"); fitHero();
          announce(S.loaded);
          var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          var title = wrap.querySelector("#ms-answer-title");
          setTimeout(function () { if (title) title.focus({ preventScroll: true }); }, 1400);
          resMount.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
        };
        var reduceM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var cardEl = !wantPro && wrap.querySelector(".ms-answer-card");
        if (cardEl && !reduceM) {
          // a valasz fokozatos megjelenitese ("generating" fazis)
          var body = cardEl.querySelector(".ms-answer-body"), disc = cardEl.querySelector(".ms-disclaimer");
          var steps = [].slice.call(body.children);
          var tail = [].slice.call(cardEl.children).filter(function (c) { return !c.matches(".ms-answer-head, .ms-disclaimer, .ms-answer-body"); });
          var fb = wrap.querySelector(".ms-feedback");
          var rest = tail.concat(fb ? [fb] : []);
          var all = steps.concat(rest);
          all.forEach(function (e) { e.classList.add("ms-pending"); });
          var row = document.createElement("div");
          row.className = "ms-ld-row"; row.setAttribute("aria-hidden", "true");
          row.innerHTML = loaderHtml((LOAD_TEXT[LANG] || LOAD_TEXT.en).generating, true);
          disc.parentNode.insertBefore(row, body);
          var showEl = function (e) { e.classList.remove("ms-pending"); e.classList.add("ms-slidein"); fitHero(); };
          var k = 0;
          resMount.setAttribute("data-streaming", "");
          var nextStep = function () {
            if (k < steps.length) { showEl(steps[k++]); setTimeout(nextStep, 750); return; }
            row.remove();
            // jogszabalyok, azonosito/gombok, visszajelzes: egymas utan, kis kesleltetessel
            var j = 0;
            (function tailStep() { if (j < rest.length) { showEl(rest[j++]); setTimeout(tailStep, 250); } else done(); })();
          };
          setTimeout(nextStep, 500);
        } else { done(); }
        wrap.querySelectorAll(".ms-thumb").forEach(function (btn) {
          btn.addEventListener("click", function () {
            wrap.querySelectorAll(".ms-thumb").forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
            btn.classList.add("is-active");
            btn.setAttribute("aria-pressed", "true");
            announce(S.thanks);
          });
        });
      });
    }

    function setup() {
      var ta = barMount.querySelector(".ms-input-ds");
      var searchBtn = barMount.querySelector(".ms-search-ds");
      var clearBtn = barMount.querySelector(".ms-clear-ds");
      if (!ta || !searchBtn) return;
      var inner = ta.shadowRoot ? ta.shadowRoot.querySelector("textarea") : null;

      // Ugyanaz a hiba, mint a gomboknal: a HOST aria-label="kereső mező" nem jut el a
      // shadow DOM-beli valodi <textarea>-ig, aminek ezert nincs programozott neve -
      // a felolvaso csak a placeholder-t mondja be (ami gepeles kozben el is tunik).
      // A belso textarea-ra tesszuk a tartos aria-label-t; a placeholder csak pelda marad.
      // a lathato <label> szovege; a placeholder csak pelda marad (3.3.2, 2.5.3)
      if (inner) {
        inner.setAttribute("aria-label", S.label);
      }
      var lbl = barMount.querySelector("#ms-label");
      if (lbl) lbl.addEventListener("click", function () { if (inner) inner.focus(); });

      // A dap-ds-icon-button aria-label-je a HOST-on van, ami NEM jut el a shadow DOM-beli
      // valodi <button>-ig -> a felolvasonak nevtelen. A belso gombra tesszuk a cimket.
      function labelIconBtn(btn, label) {
        if (!btn) return;
        var apply = function () {
          if (btn.shadowRoot) {
            var nb = btn.shadowRoot.querySelector("button");
            if (nb) { nb.setAttribute("aria-label", label); btn.removeAttribute("aria-label"); return true; }
          }
          return false;
        };
        if (!apply() && window.customElements) {
          customElements.whenDefined("dap-ds-icon-button").then(function () { setTimeout(apply, 30); });
        }
      }
      labelIconBtn(searchBtn, S.search);
      labelIconBtn(clearBtn, S.clear);
      // ---- Dokumentum hozzaadasa: fajlvalaszto; a kivalasztott fajlok cimkekent a mezo alatt (nem erinti a keresest) ----
      var addBtn = barMount.querySelector(".ms-add-btn");
      var addInput = barMount.querySelector(".ms-add-input");
      if (addBtn && addInput) {
        var DT = DOC_TEXT[LANG] || DOC_TEXT.en;
        labelIconBtn(addBtn, DT[0]);
        var chips = document.createElement("ul");
        chips.className = "ms-attachments"; chips.setAttribute("aria-label", DT[0]);
        var barBox = barMount.querySelector(".ms-searchbar-ds");
        if (barBox && barBox.parentNode) barBox.parentNode.insertBefore(chips, barBox.nextSibling);
        var files = [];
        var renderChips = function () {
          chips.innerHTML = "";
          files.forEach(function (f, i) {
            var li = document.createElement("li"); li.className = "ms-chip";
            var nm = document.createElement("span"); nm.className = "ms-chip-name"; nm.textContent = f.name;
            var x = document.createElement("button"); x.type = "button"; x.className = "ms-chip-x";
            x.setAttribute("aria-label", DT[1] + ": " + f.name); x.textContent = "\u00d7";
            x.addEventListener("click", function () { files.splice(i, 1); renderChips(); (addBtn.shadowRoot && addBtn.shadowRoot.querySelector("button") || addBtn).focus(); });
            li.appendChild(nm); li.appendChild(x); chips.appendChild(li);
          });
        };
        addBtn.addEventListener("click", function () { addInput.click(); });
        addInput.addEventListener("change", function () {
          Array.prototype.forEach.call(addInput.files, function (f) { files.push(f); });
          addInput.value = ""; renderChips();
        });
      }

      // ---- Keresesi beallitasok: parbeszedablak a mezo bal also sarkabol nyilo gombbal ----
      var setBtn = barMount.querySelector(".ms-settings-btn");
      var setDlg = barMount.querySelector(".ms-settings-dialog");
      if (setBtn && setDlg) {
        labelIconBtn(setBtn, SETTINGS_TITLE[LANG] || SETTINGS_TITLE.en);
        setBtn.addEventListener("click", function () { if (!setDlg.open) setDlg.showModal(); });
        setDlg.querySelectorAll(".ms-settings-x, .ms-settings-done").forEach(function (b) { b.addEventListener("click", function () { setDlg.close(); }); });
        // a hatterre (a ablakon kivulre) kattintas bezarja
        setDlg.addEventListener("click", function (e) { if (e.target === setDlg) setDlg.close(); });
      }
      // Info ikon (Szakmai kereso): a tobbi eszkoztippel azonos kinezet; az ablak teruleten belul marad
      var infoBtn = barMount.querySelector(".ms-info-btn"), infoPop = barMount.querySelector(".ms-info-pop");
      if (infoBtn && infoPop) {
        labelIconBtn(infoBtn, PRO.info);
        var infoWrap = infoBtn.parentNode;
        var placeInfo = function () {
          var dlgEl = infoWrap.closest("dialog") || document.body;
          var dr = dlgEl.getBoundingClientRect(), br = infoBtn.getBoundingClientRect();
          var pad = 16, maxW = Math.min(320, dr.width - 2 * pad);
          infoPop.style.maxWidth = maxW + "px";
          var wr = (infoPop.offsetParent || infoWrap).getBoundingClientRect();
          var pw = infoPop.offsetWidth;
          var cx = br.left + br.width / 2;
          var left = Math.min(Math.max(cx - pw / 2, dr.left + pad), dr.right - pad - pw);
          infoPop.style.left = Math.round(left - wr.left) + "px";
          infoPop.style.setProperty("--ms-arrow-x", Math.round(cx - left) + "px");
        };
        var showInfo = function () { infoWrap.classList.add("is-open"); placeInfo(); };
        var hideInfo = function () { infoWrap.classList.remove("is-open"); };
        infoWrap.addEventListener("mouseenter", showInfo);
        infoWrap.addEventListener("mouseleave", function () { if (!infoWrap.hasAttribute("data-kbd")) hideInfo(); });
        infoWrap.addEventListener("focusin", function () {
          var inb = infoBtn.shadowRoot && infoBtn.shadowRoot.activeElement, vis = false;
          try { vis = !!(inb && inb.matches(":focus-visible")); } catch (er) {}
          if (vis) { infoWrap.setAttribute("data-kbd", ""); showInfo(); }
        });
        infoWrap.addEventListener("focusout", function () { infoWrap.removeAttribute("data-kbd"); hideInfo(); });
        infoWrap.addEventListener("pointerdown", function () { infoWrap.removeAttribute("data-kbd"); });
        infoWrap.addEventListener("keydown", function (e) { if (e.key === "Escape" && infoWrap.classList.contains("is-open")) { e.stopPropagation(); hideInfo(); } });
        window.addEventListener("resize", function () { if (infoWrap.classList.contains("is-open")) placeInfo(); });
      }
      function getVal() { return ta.value || ""; }
      function setVal(v) {
        if (inner) { inner.value = v; inner.dispatchEvent(new Event("input", { bubbles: true, composed: true })); }
        else { try { ta.value = v; } catch (e) {} }
      }
      function refreshClear() { if (clearBtn) clearBtn.style.display = getVal().trim() ? "" : "none"; }

      // Mobilon a mezore koppintva a mezo (a cimkevel egyutt) a kepernyo tetejere gorul, hogy a megnyilo billentyuzet
      // ne takarja el a tartalmat. A billentyuzet megjelenesekor (visualViewport atmeretezes) ujra igazit.
      ta.addEventListener("focusin", function () {
        if (!window.matchMedia("(max-width: 639.98px)").matches) return;
        var toTop = function () {
          var el = barMount.querySelector(".ms-label") || ta;
          var top = el.getBoundingClientRect().top;
          if (Math.abs(top - 16) > 4) window.scrollTo({ top: window.scrollY + top - 16, behavior: "smooth" });
        };
        setTimeout(toTop, 60);
        var vv = window.visualViewport;
        if (vv) {
          var again = function () { vv.removeEventListener("resize", again); setTimeout(toTop, 60); };
          vv.addEventListener("resize", again);
          setTimeout(function () { vv.removeEventListener("resize", again); }, 1500);
        }
      });

      // ---- Gepeles-effektus a placeholderben: peldakerdesek forognak, amig a felhasznalo bele nem kattint ----
      var PH_EX = {
        hu: ["Hogyan kérhetek családi pótlékot?", "Mennyi a felmondási idő munkaviszonyban?", "Hogyan kérhetek útlevelet?", "Mit tehetek, ha a főbérlő felmond a bérleti szerződésnek?"],
        en: ["How can I apply for a family allowance?", "How long is the notice period in an employment?", "How can I apply for a passport?", "What can I do if my landlord terminates the lease?"]
      }[LANG];
      if (isHome && PH_EX && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
        var phTimer = null, phStopped = false;
        var phHost = ta;
        var stopPh = function () {
          if (phStopped) return;
          phStopped = true; clearTimeout(phTimer);
          phHost.setAttribute("placeholder", S.ph);
        };
        ["pointerdown", "focusin", "input"].forEach(function (ev) { phHost.addEventListener(ev, stopPh); });
        var phI = 0, phN = 0, phDel = false;
        var tick = function () {
          if (phStopped) return;
          if (getVal()) { stopPh(); return; }
          var t = PH_EX[phI], d = 55;
          if (!phDel) {
            phN++;
            if (phN >= t.length) { phDel = true; d = 1800; }
          } else {
            phN -= 2; d = 25;
            if (phN <= 0) { phN = 0; phDel = false; phI = (phI + 1) % PH_EX.length; d = 500; }
          }
          phHost.setAttribute("placeholder", t.slice(0, Math.max(phN, 0)) || " ");
          phTimer = setTimeout(tick, d);
        };
        phHost.setAttribute("placeholder", " ");
        phTimer = setTimeout(tick, 600);
      }

      // ---- Diktalas (mikrofon gomb) ----
      var micBtn = barMount.querySelector(".ms-mic-ds");
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (micBtn && !SR) { micBtn.style.display = "none"; micBtn = null; }
      if (micBtn) {
        labelIconBtn(micBtn, MIC.start);
        var rec = null, listening = false, baseText = "";
        var micInner = function () { return micBtn.shadowRoot && micBtn.shadowRoot.querySelector("button"); };
        var setListening = function (on) {
          listening = on;
          micBtn.classList.toggle("is-listening", on);
          var b = micInner();
          if (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", on ? MIC.stop : MIC.start); }
        };
        var micError = function (msg) {
          fieldError(msg);
        };
        micBtn.addEventListener("click", function () {
          if (listening && rec) { try { rec.stop(); } catch (e) {} return; }
          clearFieldError();
          rec = new SR();
          rec.lang = MIC.lang; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
          baseText = getVal().replace(/\s+$/, "");
          rec.onresult = function (ev) {
            var t = "";
            for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
            setVal((baseText ? baseText + " " : "") + t.trim());
          };
          rec.onerror = function (ev) {
            if (ev.error === "not-allowed" || ev.error === "service-not-allowed") micError(MIC.denied);
            else if (ev.error !== "no-speech" && ev.error !== "aborted") micError(MIC.err);
          };
          rec.onend = function () { setListening(false); refreshClear(); (inner || ta).focus(); };
          try { rec.start(); setListening(true); } catch (e) { setListening(false); }
        });
      }

      // Eszkoztipp a gombokon: ravitelre es billentyuzetes (Tab) fokuszra; egerkattintas utan nem marad kinn.
      // A DS gomb a shadow DOM-jaban kap fokuszt, a host :focus-visible-t nem kapja -> adatattributum.
      barMount.addEventListener("focusin", function (e) {
        var h = e.target.closest && e.target.closest("[data-tip]");
        if (!h) return;
        var inner = h.shadowRoot && h.shadowRoot.activeElement || (h.matches && h.matches("button") ? h : null);
        var vis = false; try { vis = !!(inner && inner.matches(":focus-visible")); } catch (er) {}
        if (vis) h.setAttribute("data-kbd", ""); else h.removeAttribute("data-kbd");
      });
      barMount.addEventListener("focusout", function (e) {
        var h = e.target.closest && e.target.closest("[data-tip]");
        if (h) h.removeAttribute("data-kbd");
      });
      barMount.addEventListener("pointerdown", function (e) {
        var h = e.target.closest && e.target.closest("[data-tip]");
        if (h) h.removeAttribute("data-kbd");
      }, true);
      var wrap = barMount.querySelector(".ms-searchbar-wrap");
      var suggest = barMount.querySelector(".ms-suggest");
      function suggestBtns() { return suggest ? Array.prototype.slice.call(suggest.querySelectorAll(".ms-suggest-btn")) : []; }
      // a javaslat-lista (Nepszeru / Legutobbi keresesek) a mezobol nem nyithato meg: a panel el is tavolodik
      function openSuggest() {}
      if (suggest) { suggest.remove(); suggest = null; }
      function closeSuggest() { if (suggest) suggest.classList.remove("is-open"); }

      // A mezo NEM kombobox: a javaslatok egy cimkezett listaban levo gombok, amik
      // Tabbal es Le/Fel nyillal is elerhetok. (A korabbi, felig megvalositott
      // kombobox-minta aria-controls-a a shadow DOM hataran at nem oldodott fel.)

      var go = function () { closeSuggest(); run(getVal); };
      var suppressOpen = false; // Escape utan a visszafokuszalas ne nyissa ujra

      ta.addEventListener("input", refreshClear);
      // display:none -> display:flex UTAN azonnal (szinkron) fokuszt atadni egy
      // benne levo elemre klasszikus felolvaso-hiba: az AT-nak nincs ideje
      // feldolgozni, hogy egy uj, nevvel ellatott regio (lista/csoport) jelent
      // meg, mire a fokusz mar at is ugrik bele - ezert csak a gomb sajat
      // szoveget mondja be, a "lista, Nepszeru keresesek, 3 elem"-fele
      // kontextust nem. Egy apro (~50ms) halasztas a focus() elott eleg idot ad
      // a felolvasonak, hogy "utolerje" a DOM-valtozast, mielott bemond.
      function focusSoon(el) { if (el) setTimeout(function () { el.focus(); }, 50); }
      (inner || ta).addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); go(); }
        else if (e.key === "Escape") { closeSuggest(); }
      });
      // A legordulot a keresomezo-konteneren figyeljuk (focusin/focusout buborekol es
      // atmegy a shadow DOM-on) -> megbizhatoan nyitva marad, amig a fokusz a keresoben
      // van (mezo, keres-gomb, javaslatok), es Tabbal vegig lehet menni rajta.
      var sbds = barMount.querySelector(".ms-searchbar-ds");
      if (sbds) {
        // a javaslat-lista NEM nyilik a mezore kattintasra / fokuszra; csak a Le/Fel nyil nyitja (billentyuzettel)
        sbds.addEventListener("focusout", function (e) {
          if (!sbds.contains(e.relatedTarget)) closeSuggest();
        });
      }
      searchBtn.addEventListener("click", go);
      if (clearBtn) clearBtn.addEventListener("click", function () { setVal(""); refreshClear(); if (inner) inner.focus(); });

      if (suggest) {
        // billentyuzet a javaslatok kozott: ↑/↓ (koron at), Home/End, Escape -> vissza a mezobe
        suggest.addEventListener("keydown", function (e) {
          var bs = suggestBtns();
          if (!bs.length) return;
          var idx = bs.indexOf(document.activeElement);
          if (e.key === "ArrowDown") { e.preventDefault(); bs[(idx + 1) % bs.length].focus(); }
          else if (e.key === "ArrowUp") { e.preventDefault(); bs[(idx - 1 + bs.length) % bs.length].focus(); }
          else if (e.key === "Home") { e.preventDefault(); bs[0].focus(); }
          else if (e.key === "End") { e.preventDefault(); bs[bs.length - 1].focus(); }
          else if (e.key === "Escape") { e.preventDefault(); closeSuggest(); suppressOpen = true; if (inner) inner.focus(); }
        });
        // javaslat kivalasztasa (eger + Enter/Space a gombon natívan kattintast valt ki)
        suggest.addEventListener("click", function (e) {
          var b = e.target.closest ? e.target.closest(".ms-suggest-btn") : null;
          if (!b) return;
          var t = b.textContent;
          setVal(t); closeSuggest();
          run(function () { return t; });
        });
      }
      // kattintás a mezőn kívül -> bezárás
      document.addEventListener("mousedown", function (e) {
        if (wrap && !wrap.contains(e.target)) closeSuggest();
      });

      // switch hover háttér (a dds nem ad rá változót -> a shadow DOM-ba injektáljuk)
      var swHover = ".switch:hover .input__control{background-color:#404753!important}" +
                    ".switch:hover .input__control--checked{background-color:#a9ebdc!important}" +
                    // bekapcsolt allapotban a kapcsolo "gombja" sotetzold (#0B3D3E) a feher helyett
                    ".input__control--checked .input__control-toggle-thumb{color:#0B3D3E!important;fill:#0B3D3E!important}" +
                    // vilagos hatteren (talalati oldal) a DS #37f0bf fokuszgyuruje ~1,4:1 -> sotet gyuru (2.4.7, 1.4.11)
                    "";
      barMount.querySelectorAll("dap-ds-switch").forEach(function (s) {
        function inject() {
          if (s.shadowRoot && !s.__hoverStyled) {
            s.__hoverStyled = true;
            var st = document.createElement("style");
            st.textContent = swHover;
            s.shadowRoot.appendChild(st);
          }
        }
        if (s.shadowRoot) inject();
        else if (window.customElements) customElements.whenDefined("dap-ds-switch").then(function () { setTimeout(inject, 30); });
      });

      // Szuro-elemek a kapcsolok ALATT (az eles kereso szerint):
      //  - "Onkormanyzati rendeletekben is keresne?" -> megye (kotelezo) + telepules valaszto
      //    (dap-ds-combobox, a telepules a megyere szukul, telepulesvalasztas beallitja a megyet);
      //  - "Multbeli idopontra vonatkozik a kerdese?" -> datumvalaszto (dap-ds-datepicker, max. +10 ev).
      // Kikapcsolva az elemek elrejtodnek es az ertekuk torlodik.
      var pro = barMount.querySelector('dap-ds-switch[name="professional"]');
      if (pro) pro.addEventListener("dds-change", function () { pro.__touched = true; });
      if (pro && INIT_PRO) customElements.whenDefined("dap-ds-switch").then(function () { pro.checked = true; pro.setAttribute("checked", ""); });
      var muni = barMount.querySelector('dap-ds-switch[name="municipality"]');
      var tm = barMount.querySelector('dap-ds-switch[name="timemachine"]');
      var togglesBox = barMount.querySelector(".ms-toggles-ds");
      if (muni && tm && togglesBox) {
        var T = FILTER_TEXT[LANG] || FILTER_TEXT.en;
        var box = document.createElement("div");
        box.className = "ms-filters-ds";
        togglesBox.parentNode.insertBefore(box, togglesBox.nextSibling);
        // a felirat ugyanaz a .ms-label, mint a "Jogi kerdes" mezonel (szin, meret, vastagsag)
        var fid = 0;
        var mk = function (tag, cls, text) {
          var w = document.createElement("div"), l = document.createElement("label"), e = document.createElement(tag);
          w.className = "ms-field"; w.hidden = true;
          l.className = "ms-label"; l.id = "ms-flabel-" + (++fid); l.textContent = text;
          e.className = cls; e.setAttribute("aria-labelledby", l.id); e.setAttribute("aria-label", text);
          l.addEventListener("click", function () { var i = e.shadowRoot && e.shadowRoot.querySelector("input"); if (i) i.focus(); });
          w.appendChild(l); w.appendChild(e); box.appendChild(w);
          return e;
        };
        var show = function (el, on) { el.parentNode.hidden = !on; };
        var county = mk("dap-ds-combobox", "ms-county-ds", T.county), settle = mk("dap-ds-combobox", "ms-settlement-ds", T.settlement), dp = mk("dap-ds-datepicker", "ms-datepicker-ds", T.dateLabel);
        var countyId = "", settleId = "";
        [[county, T.county, T.selCounty], [settle, T.settlement, T.selSettlement]].forEach(function (c) {
          c[0].setAttribute("name", c[0] === county ? "county-combobox" : "settlement-combobox");
          c[0].setAttribute("placeholder", c[2]);
          c[0].setAttribute("size", "sm");
          c[0].setAttribute("searchmode", "autocomplete");
          c[0].setAttribute("openOnEmpty", "false");
          c[0].setAttribute("selectable", "false");
          c[0].setAttribute("feedbackType", "negative");
        });
        var opts = function (el, items) {
          el.textContent = "";
          items.forEach(function (it) { var o = document.createElement("dap-ds-option-item"); o.setAttribute("value", it[0]); o.textContent = it[1]; el.appendChild(o); });
        };
        var allSettlements = [];
        MS_COUNTIES.forEach(function (c, ci) { c[1].forEach(function (t, ti) { allSettlements.push([ci + "-" + ti, t, String(ci)]); }); });
        var fillSettle = function () {
          opts(settle, allSettlements.filter(function (t) { return countyId === "" || t[2] === countyId; }).map(function (t) { return [t[0], t[1]]; }));
        };
        opts(county, MS_COUNTIES.map(function (c, i) { return [String(i), c[0]]; }));
        fillSettle();
        var dl = T.date;
        dp.setAttribute("size", "sm"); dp.setAttribute("placeholder", dl); dp.setAttribute("locale", LANG);
        var max = new Date(); max.setFullYear(max.getFullYear() + 10);
        customElements.whenDefined("dap-ds-datepicker").then(function () { dp.maxDate = max; });
        var val = function (e) { return e && e.detail && e.detail.value != null ? String(e.detail.value) : ""; };
        county.addEventListener("dds-change", function (e) {
          countyId = val(e);
          county.removeAttribute("feedback");
          if (settleId && settleId.split("-")[0] !== countyId) { settleId = ""; try { settle.value = undefined; } catch (x) {} }
          fillSettle();
        });
        county.addEventListener("dds-clear", function () { countyId = ""; fillSettle(); });
        settle.addEventListener("dds-change", function (e) {
          settleId = val(e);
          if (settleId) { countyId = settleId.split("-")[0]; try { county.value = countyId; } catch (x) {} county.removeAttribute("feedback"); fillSettle(); }
        });
        settle.addEventListener("dds-clear", function () { settleId = ""; });
        muni.addEventListener("dds-change", function (e) {
          var on = e && e.detail && typeof e.detail.checked === "boolean" ? e.detail.checked : !!muni.checked;
          show(county, on); show(settle, on);
          if (!on) {
            countyId = settleId = ""; county.removeAttribute("feedback");
            try { county.value = undefined; settle.value = undefined; } catch (x) {}
            fillSettle();
          }
        });
        tm.addEventListener("dds-change", function (e) {
          var on = e && e.detail && typeof e.detail.checked === "boolean" ? e.detail.checked : !!tm.checked;
          show(dp, on);
          if (on) { setTimeout(function () { var i = dp.shadowRoot && dp.shadowRoot.querySelector("input"); if (i) i.focus(); }, 60); }
          else { try { dp.value = undefined; } catch (x) {} }
        });
        // a megye kotelezo, ha az onkormanyzati kapcsolo be van kapcsolva (eles: validation.field.countyRequired)
        filterGuard = function () {
          if (muni.checked && countyId === "") {
            var dlgEl = box.closest("dialog"); if (dlgEl && !dlgEl.open) dlgEl.showModal();   // a hibauzenet latszodjon
            county.setAttribute("feedback", T.countyRequired);
            var i = county.shadowRoot && county.shadowRoot.querySelector("input"); if (i) i.focus(); else county.focus();
            return false;
          }
          return true;
        };
      }

      // ---- Kezdolap: "Legutobbi kereseim" szekcio a hero alatt (a "Legfrissebb kozlonyok" sablonjaval) ----
      // A legordulo lista "Legutobbi kereseim" elemei lenyithato kartyakent (mint a kinyitott kozlony): a
      // fejlecben a kerdes, lenyitva a korabban kapott valasz a "MI altal generalt osszefoglalo" dobozban.
      if (isHome && RECENT.length) {
        if (!document.querySelector('link[href*="Gazettes-BVYaXKt9.css"]')) {   // az osszefoglalo-doboz stilusai
          var lk = document.createElement("link"); lk.rel = "stylesheet"; lk.href = "/assets/Gazettes-BVYaXKt9.css";
          document.head.appendChild(lk);
        }
        var AI = { hu: ["MI által generált összefoglaló", "Teljes összefoglaló", "Összecsukás"], en: ["AI-generated summary", "Full summary", "Collapse"],
          de: ["KI-generierte Zusammenfassung", "Vollständige Zusammenfassung", "Einklappen"], fr: ["Résumé généré par IA", "Résumé complet", "Réduire"],
          es: ["Resumen generado por IA", "Resumen completo", "Contraer"], it: ["Riepilogo generato dall'IA", "Riepilogo completo", "Comprimi"],
          zh: ["AI 生成的摘要", "完整摘要", "收起"] };
        var T2 = AI[LANG] || AI.en;
        var MORE = { hu: ["Mutass többet", "Mutass kevesebbet"], en: ["Show more", "Show less"], de: ["Mehr anzeigen", "Weniger anzeigen"], fr: ["Afficher plus", "Afficher moins"],
          es: ["Mostrar más", "Mostrar menos"], it: ["Mostra di più", "Mostra meno"], zh: ["显示更多", "显示更少"] };
        var TM = MORE[LANG] || MORE.en, SHOW_FIRST = 3;
        var recMain = document.querySelector("main");
        var esc2 = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
        var owlImg = document.querySelector('img[alt="Bagoly Ikon"], img[data-ms-owl]');
        var owlSrc = owlImg ? owlImg.getAttribute("src") : "";
        // ---- "Legutobbi kereseim": a keresomezo elozmeny-gombjara nyilo panel (a mezo alatt) ----
        var histBtn = barMount.querySelector(".ms-history-btn");
        var histBox = barMount.querySelector(".ms-searchbar-ds");
        if (histBtn && histBox) {
          var panel = document.createElement("section");
          panel.id = "ms-history-panel"; panel.className = "ms-history"; panel.hidden = true;
          panel.setAttribute("aria-labelledby", "ms-history-title");
          panel.innerHTML = '<div class="ms-history-head"><h2 id="ms-history-title" class="ms-history-title">' + esc2(ALL_RECENT_LABEL()) + '</h2>' +
            '<a class="ms-recent-all" href="' + PREFIX + '/osszes-keresesem">' + esc2(ALL_LABEL[LANG] || ALL_LABEL.en) + '</a></div>' +
            '<ul class="ms-history-list">' + RECENT.slice(0, SHOW_FIRST).map(function (q, i) {
              return '<li><button type="button" class="ms-history-row" data-i="' + i + '"><span class="ms-history-text">' + esc2(q) + '</span></button></li>';
            }).join("") + '</ul>';
          histBox.appendChild(panel);        // a mezo aljahoz kotve, a tartalom fole (nem tolja el az oldalt)
          var setHist = function (open) {
            panel.hidden = !open; histBtn.setAttribute("aria-expanded", open ? "true" : "false"); histBtn.classList.toggle("is-open", open);
            if (open) { panel.setAttribute("tabindex", "-1"); panel.focus({ preventScroll: true }); }   // megnyitaskor a fokusz a panelre kerul
          };
          histBtn.addEventListener("click", function () { setHist(panel.hidden); });
          panel.addEventListener("click", function (e) {
            var row = e.target.closest && e.target.closest(".ms-history-row");
            if (!row) return;
            openRecent(+row.getAttribute("data-i"), row);
            // a kerdes ablakanak bezarasakor a "Legutobbi kereseim" panel is bezarul, a fokusz az ikonra kerul
            recDlg.addEventListener("close", function () { setHist(false); histBtn.focus({ preventScroll: true }); }, { once: true });
          });
          // a panel az ikonra valo ujabb kattintassal, a panelen kivuli egerkattintassal vagy Esc-pel zarul (a fokusz az ikonra kerul)
          document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape" || e.defaultPrevented || panel.hidden || document.querySelector("dialog[open]")) return;
            e.preventDefault(); setHist(false); histBtn.focus({ preventScroll: true });
          });
          document.addEventListener("mousedown", function (e) {
            if (panel.hidden || panel.contains(e.target) || histBtn.contains(e.target) || e.target.closest("dialog, .a11y-consent-banner")) return;
            setHist(false);
          }, true);
          // nyitott panelnel a billentyuzetes fokusz nem hagyhatja el: Tab/Shift+Tab a panel, a sorai, a link es az ikon
          // (az ikonnal lehet bezarni) kozott korbe jar. Megnyitott (modalis) parbeszedablakban nem avatkozunk be.
          document.addEventListener("keydown", function (e) {
            if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey || panel.hidden || document.querySelector("dialog[open]")) return;
            if (document.querySelector(".a11y-consent-banner")) return;       // a suti-ablak sajat korforgasa az elsodleges
            var items = [panel].concat([].slice.call(panel.querySelectorAll("button, a[href]")), [histBtn]);
            var i = items.indexOf(document.activeElement);
            if (i === -1) { e.preventDefault(); (e.shiftKey ? items[items.length - 1] : items[0]).focus({ preventScroll: true }); return; }
            var n = e.shiftKey ? (i === 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
            e.preventDefault(); items[n].focus({ preventScroll: true });
          }, true);
        }
        // ---- "Miben tud segiteni az MI?": temakorok kartyakon (a dap.gov.hu "Eletesemenyek" szekcio felepitesevel) ----
        // A kategoriak alapja az NJT elethelyzet-rendszere (cowork-gyujtes); a peldakerdesek sajat megfogalmazasuak.
        var CAT_ICONS = [
          '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
          '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14.2c2.4.4 4 2.4 4 4.8"/>',
          '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 7a2 2 0 0 1 2-2h12v2"/><circle cx="16.5" cy="13.5" r="1.2"/>',
          '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
          '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
          '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5L15.5 10"/>',
          '<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>'
        ];
        var CATS = {
          hu: { t: "Miben tud segíteni az MI?", x: "Példa kérdések", xs: "példa kérdés",
            c: [
              ["Élethelyzetekben", "Család, lakás, munka, pénzügyek – hétköznapi kérdések.", ["Ki jogosult GYED-re?", "Mennyi illetéket kell fizetni lakásvásárláskor?", "Mit tehetek, ha a főbérlő felmondja a szerződést?"]],
              ["Hivatalos jogi ügyekben", "Hatóságok, bíróságok, határidők és illetékek.", ["Hány napon belül lehet fellebbezni egy hatósági döntés ellen?", "Mennyi az illeték egy polgári per indításakor?", "Hogyan kérhetek fizetési meghagyást?"]],
              ["Fogalmak tisztázásában", "Jogi kifejezések közérthető magyarázata.", ["Mi számít közérdekű adatnak és hogy férhetek hozzá?", "Mi a végrehajtási eljárás?", "Mi a különbség a megbízás és a vállalkozás között?"]]
            ] },
          en: { t: "How can the AI help?", x: "Example questions", xs: "example question",
            c: [
              ["In life situations", "Family, housing, work, finances – everyday questions.", ["Who is entitled to GYED?", "How much duty is payable when buying a flat?", "What can I do if my landlord terminates the lease?"]],
              ["In official legal matters", "Authorities, courts, deadlines and fees.", ["Within how many days can a decision of an authority be appealed?", "What is the fee for starting a civil lawsuit?", "How can I apply for a payment order?"]],
              ["In clarifying concepts", "Plain-language explanations of legal terms.", ["What counts as data of public interest and how can I access it?", "What is enforcement proceedings?", "What is the difference between a mandate contract and a contract for work?"]]
            ] },
          de: { t: "Wobei kann die KI helfen?", x: "Beispielfragen", xs: "Beispielfrage",
            c: [
              ["In Lebenslagen", "Familie, Wohnen, Arbeit, Finanzen – alltägliche Fragen.", ["Wer hat Anspruch auf GYED?", "Wie viel Gebühr fällt beim Wohnungskauf an?", "Was kann ich tun, wenn mein Vermieter den Mietvertrag kündigt?"]],
              ["In amtlichen Rechtsangelegenheiten", "Behörden, Gerichte, Fristen und Gebühren.", ["Innerhalb wie vieler Tage kann eine Behördenentscheidung angefochten werden?", "Wie hoch ist die Gebühr für die Einleitung eines Zivilprozesses?", "Wie kann ich einen Zahlungsbefehl beantragen?"]],
              ["Bei der Klärung von Begriffen", "Verständliche Erklärungen juristischer Begriffe.", ["Was gilt als Daten von öffentlichem Interesse und wie erhalte ich Zugang dazu?", "Was ist das Vollstreckungsverfahren?", "Was ist der Unterschied zwischen einem Auftrag und einem Werkvertrag?"]]
            ] },
          fr: { t: "En quoi l'IA peut-elle aider ?", x: "Exemples de questions", xs: "exemple de question",
            c: [
              ["Dans les situations de vie", "Famille, logement, travail, finances – questions du quotidien.", ["Qui a droit au GYED ?", "Quels droits faut-il payer lors de l'achat d'un logement ?", "Que faire si mon propriétaire résilie le bail ?"]],
              ["Dans les affaires juridiques officielles", "Autorités, tribunaux, délais et frais.", ["Dans quel délai peut-on contester une décision d'une autorité ?", "Quel est le montant des frais pour engager une action civile ?", "Comment demander une injonction de payer ?"]],
              ["Pour clarifier des notions", "Explications claires des termes juridiques.", ["Qu'est-ce qu'une donnée d'intérêt public et comment y accéder ?", "Qu'est-ce que la procédure d'exécution ?", "Quelle est la différence entre un mandat et un contrat d'entreprise ?"]]
            ] },
          es: { t: "¿En qué puede ayudar la IA?", x: "Preguntas de ejemplo", xs: "pregunta de ejemplo",
            c: [
              ["En situaciones de la vida", "Familia, vivienda, trabajo, finanzas: preguntas cotidianas.", ["¿Quién tiene derecho al GYED?", "¿Cuánto hay que pagar de tasa al comprar una vivienda?", "¿Qué puedo hacer si el arrendador rescinde el contrato de alquiler?"]],
              ["En asuntos jurídicos oficiales", "Autoridades, tribunales, plazos y tasas.", ["¿En cuántos días se puede recurrir una decisión de una autoridad?", "¿Cuál es la tasa por iniciar un proceso civil?", "¿Cómo puedo solicitar un requerimiento de pago?"]],
              ["En la aclaración de conceptos", "Explicaciones claras de términos jurídicos.", ["¿Qué se considera dato de interés público y cómo puedo acceder a él?", "¿Qué es el procedimiento de ejecución?", "¿Cuál es la diferencia entre un mandato y un contrato de obra?"]]
            ] },
          it: { t: "In cosa può aiutare l'IA?", x: "Domande di esempio", xs: "domanda di esempio",
            c: [
              ["Nelle situazioni di vita", "Famiglia, casa, lavoro, finanze: domande di tutti i giorni.", ["Chi ha diritto al GYED?", "Quali imposte si pagano all'acquisto di un'abitazione?", "Cosa posso fare se il locatore disdice il contratto di locazione?"]],
              ["Nelle questioni giuridiche ufficiali", "Autorità, tribunali, termini e tasse.", ["Entro quanti giorni si può impugnare una decisione di un'autorità?", "Qual è il costo per avviare una causa civile?", "Come posso richiedere un decreto ingiuntivo?"]],
              ["Nel chiarire i concetti", "Spiegazioni chiare dei termini giuridici.", ["Cosa si intende per dati di interesse pubblico e come posso accedervi?", "Che cos'è la procedura esecutiva?", "Qual è la differenza tra mandato e contratto d'opera?"]]
            ] },
          zh: { t: "人工智能能在哪些方面帮助您？", x: "示例问题", xs: "示例问题",
            c: [
              ["生活场景", "家庭、住房、工作、财务——日常问题。", ["谁有资格领取 GYED（育儿津贴）？", "购买住房时需要缴纳多少税费？", "如果房东解除租赁合同，我该怎么办？"]],
              ["官方法律事务", "行政机关、法院、期限和费用。", ["对行政机关的决定可以在多少天内提出申诉？", "提起民事诉讼的费用是多少？", "我如何申请支付令？"]],
              ["厘清概念", "用通俗易懂的方式解释法律术语。", ["什么属于公共利益数据？我如何获取？", "什么是执行程序？", "委托合同与承揽合同有什么区别？"]]
            ] }
        };
        var CP = CATS[LANG] || CATS.en;
        // a leiras vegere: ", peldaul:" (a lezaro pont helyett)
        var EG_LEAD = { hu: ", például:", en: ", for example:", de: ", zum Beispiel:", fr: ", par exemple :", es: ", por ejemplo:", it: ", ad esempio:", zh: "，例如：" };
        // a kartyak ikonjai (32x32, kitoltott, currentColor): Elethelyzetek (haz), Hivatalos jogi ugyek (birói kalapacs), Fogalmak (diplomas sapka)
        var CAT3_ICONS = [
          "M17.3333 25.3333H25.3333V13.3042L16 6.04495L6.66667 13.3042V25.3333H14.6667V17.3333H17.3333V25.3333ZM28 26.6667C28 27.4031 27.4031 28 26.6667 28H5.33333C4.59696 28 4 27.4031 4 26.6667V12.6521C4 12.2406 4.18996 11.8522 4.51475 11.5996L15.1815 3.30332C15.6629 2.92884 16.3371 2.92884 16.8185 3.30332L27.4852 11.5996C27.81 11.8522 28 12.2406 28 12.6521V26.6667Z",
          "M18.6729 26.6706V29.3372H2.67285V26.6706H18.6729ZM19.4539 0.918945L29.8247 11.2898L27.9391 13.1755L26.525 12.7041L23.2251 16.0039L30.7677 23.5464L28.8819 25.432L21.3395 17.8895L18.1339 21.0951L18.5111 22.6035L16.6254 24.4892L6.25457 14.1183L8.1402 12.2327L9.64869 12.6098L18.0397 4.21878L17.5683 2.80456L19.4539 0.918945ZM20.3967 5.63299L10.9686 15.0611L15.6826 19.7751L25.1107 10.347L20.3967 5.63299Z",
          "M5.33333 15.1114L0 12.0003L16 2.66699L32 12.0003V23.3337H29.3333V13.5559L26.6667 15.1114V24.0154L26.3699 24.3822C23.9276 27.4002 20.1891 29.3337 16 29.3337C11.8109 29.3337 8.07239 27.4002 5.63017 24.3822L5.33333 24.0154V15.1114ZM8 16.667V23.0559C9.95628 25.2723 12.8148 26.667 16 26.667C19.1852 26.667 22.0437 25.2723 24 23.0559V16.667L16 21.3337L8 16.667ZM5.29236 12.0003L16 18.2465L26.7076 12.0003L16 5.75421L5.29236 12.0003Z"
        ];
        var help = document.createElement("section");
        help.className = "ms-help";
        help.setAttribute("aria-labelledby", "ms-help-title");
        var ACC_SVG = function (inner, sz) { return '<svg viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>'; };
        // Kinyilo panelek: egyszerre egy nyitott, a tobbi osszehuzva (ikon + cim + "+"); a nyitott panelen a pelda-kerdesek kattinthatok
        help.innerHTML = '<div class="ms-help-in">' +
          '<h2 id="ms-help-title">' + esc2(CP.t) + '</h2>' +
          '<ul class="ms-acc">' + CP.c.map(function (c, n) {
            return '<li class="ms-acc-card' + (n === 0 ? " is-open" : "") + '">' +
              '<h3 class="ms-acc-h"><button type="button" class="ms-acc-btn" id="ms-acc-btn-' + n + '" aria-expanded="' + (n === 0 ? "true" : "false") + '" aria-controls="ms-acc-panel-' + n + '">' +
                '<span class="ms-acc-ic">' + '<svg viewBox="0 0 32 32" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false"><path d="' + CAT3_ICONS[n] + '"/></svg>' + '</span>' +
                '<span class="ms-acc-row"><span class="ms-acc-title">' + esc2(c[0]) + '</span></span>' +
                '<span class="ms-acc-plus" aria-hidden="true">' + ACC_SVG('<path d="M12 5v14M5 12h14"/>', 20).replace("<svg ", '<svg class="ms-acc-pl" ') +
                  '<svg class="ms-acc-ch ms-acc-ch-down" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" focusable="false"><path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z"/></svg>' + '</span>' +
              '</button></h3>' +
              '<div class="ms-acc-panel" id="ms-acc-panel-' + n + '" role="region" aria-labelledby="ms-acc-btn-' + n + '"' + (n === 0 ? "" : " hidden") + '>' +
                '<p class="ms-acc-desc">' + esc2(c[1].replace(/[.。]\s*$/, "") + (EG_LEAD[LANG] || EG_LEAD.en)) + '</p>' +
                '<ul class="ms-acc-qs" aria-label="' + esc2(CP.x) + '">' + c[2].map(function (q) {
                  return '<li><a class="ms-acc-q" aria-label="„' + esc2(q) + '”, ' + esc2(CP.xs) + '" href="' + PREFIX + '/?q=' + encodeURIComponent(q) + '" data-q="' + esc2(q) + '"><span>„' + esc2(q) + '”</span></a></li>';
                }).join("") + '</ul>' +
              '</div></li>';
          }).join("") + '</ul>' +
          '</div>';
        (function () {
          var cards = [].slice.call(help.querySelectorAll(".ms-acc-card"));
          // Mobilon/tableten (fuggoleges elrendezes) a panel magassaga animalodik (nyitas/zaras), mint asztalon a szelesseg
          var stacked = function () { return window.matchMedia("(max-width: 1023.98px)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !!document.documentElement.animate; };
          var slide = function (pn, open) {
            pn.getAnimations().forEach(function (an) { an.cancel(); });
            pn.style.overflow = "hidden";
            var h = pn.offsetHeight, mt = getComputedStyle(pn).marginTop;
            var an = pn.animate(open ? { height: ["0px", h + "px"], marginTop: ["0px", mt], opacity: [0, 1] } : { height: [h + "px", "0px"], marginTop: [mt, "0px"], opacity: [1, 0] }, { duration: 400, easing: "ease" });
            an.onfinish = an.oncancel = function () { pn.style.overflow = ""; if (!open && !pn.closest(".ms-acc-card").classList.contains("is-open")) pn.hidden = true; };
          };
          var openCard = function (card) {
            var anim = stacked();
            cards.forEach(function (c) {
              var on = c === card, b = c.querySelector(".ms-acc-btn"), pn = c.querySelector(".ms-acc-panel"), was = c.classList.contains("is-open");
              c.classList.toggle("is-open", on); b.setAttribute("aria-expanded", on ? "true" : "false");
              if (on) pn.hidden = false;
              if (anim && on !== was) slide(pn, on); else if (!on) { pn.getAnimations().forEach(function (an) { an.cancel(); }); pn.hidden = true; }
            });
          };
          cards.forEach(function (c) {
            c.querySelector(".ms-acc-btn").addEventListener("click", function () { if (!c.classList.contains("is-open")) openCard(c); });
          });
          // nyitott panelen Fel/Le nyil (es Home/End) a panel gombja es a pelda-kerdesek kozott (nem korbe)
          help.addEventListener("keydown", function (e) {
            if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
            var card = e.target.closest && e.target.closest(".ms-acc-card.is-open");
            if (!card || e.altKey || e.ctrlKey || e.metaKey) return;
            var items = [card.querySelector(".ms-acc-btn")].concat([].slice.call(card.querySelectorAll(".ms-acc-q")));
            var i = items.indexOf(document.activeElement);
            if (i === -1) return;
            var to = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : e.key === "ArrowDown" ? Math.min(i + 1, items.length - 1) : Math.max(i - 1, 0);
            e.preventDefault(); items[to].focus();
          });
          // a pelda-kerdesre kattintva a kerdes bekerul a keresobe es lefut
          // (a window capture-ban: az index.html "offline-nav-fix" scriptje a "/"-jeles linkeket a document capture-ben teljes oldalbetoltessel nyitna meg)
          window.addEventListener("click", function (e) {
            var q = e.target.closest && e.target.closest(".ms-acc-q");
            if (!q || !help.contains(q)) return;
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // uj lapon/ablakban nyitas a link alapertelmezett mukodese
            e.preventDefault();
            setVal(q.getAttribute("data-q") || "");
            try { barMount.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); } catch (er) {}
            go();
          }, true);
        })();
        var heroWrap = recMain && recMain.querySelector(":scope > div.relative");
        if (heroWrap) heroWrap.insertAdjacentElement("afterend", help);
        else if (recMain) recMain.appendChild(help);   // "Miben tud segiteni" a "Legutobbi kereseim" utan

        // "Hamarosan chat": a Jogi MI kereso hamarosan beszelgetes-alapu lesz (jelenleg egy kerdes - egy valasz). A "Miben tud segiteni" szekcio ALATT jelenik meg
        var CHAT = {
          hu: { b: "2027-ben", t: "Hamarosan: keresés helyett beszélgetés a Jogi MI-vel", p: "A Jogi MI kereső hamarosan csevegő lesz: folyamatos párbeszédet folytathat, rákérdezhet a válaszra, és a korábbi üzeneteire is építhet.", l: "Mi fog változni?", i: ["Pontosíthat és rákérdezhet az előző válaszra", "A beszélgetés megőrzi a korábbi kérdéseit és válaszait", "Lépésről lépésre végigvezetheti ügye megoldásán"], u: "Mennyi illetéket kell fizetni lakásvásárláskor?", a: "Az illeték általában a vételár 4%-a, de van, aki kedvezményre jogosult.", f: "Én első lakást vásárolok. Kapok kedvezményt?", ax: "Chatbeszélgetés a jogi MI-vel. A felhasználó megkérdezi, mennyi illetéket kell fizetni lakásvásárláskor. Az asszisztens azt válaszolja, hogy általában a vételár 4%-át, de van, aki kedvezményre jogosult. A felhasználó elmondja, hogy első lakást vásárol, és megkérdezi, kap-e kedvezményt. Az asszisztens éppen gépel." },
          en: { b: "In 2027", t: "Coming soon: chat with Legal AI instead of just searching", p: "The Legal AI search will soon become a chat: hold an ongoing conversation, ask follow-up questions and build on your earlier messages.", l: "What will change?", i: ["Clarify and follow up on the previous answer", "The conversation keeps your earlier questions and answers", "Get guided step by step towards solving your case"], u: "How much duty must I pay when buying a home?", a: "Duty is usually 4% of the purchase price, but some buyers are eligible for a reduction.", f: "I'm buying my first home. Do I get a reduction?", ax: "Chat conversation with the legal AI. The user asks how much duty must be paid when buying a home. The assistant answers that it is usually 4% of the purchase price, but some buyers are eligible for a reduction. The user says they are buying their first home and asks whether they get a reduction. The assistant is typing." },
          de: { b: "2027", t: "Demnächst: statt zu suchen im Gespräch mit der Rechts-KI", p: "Die Rechts-KI-Suche wird bald zum Chat: Sie führen ein fortlaufendes Gespräch, stellen Rückfragen und knüpfen an frühere Nachrichten an.", l: "Was wird sich ändern?", i: ["Auf die vorherige Antwort präzisieren und nachfragen", "Das Gespräch behält Ihre früheren Fragen und Antworten", "Schritt für Schritt zur Lösung Ihres Anliegens geführt werden"], u: "Wie viel Gebühr fällt beim Wohnungskauf an?", a: "Die Gebühr beträgt meist 4 % des Kaufpreises, manche Käufer erhalten jedoch eine Ermäßigung.", f: "Ich kaufe meine erste Wohnung. Bekomme ich eine Ermäßigung?", ax: "Chatgespräch mit der Rechts-KI. Der Nutzer fragt, wie viel Gebühr beim Wohnungskauf anfällt. Der Assistent antwortet, dass es meist 4 % des Kaufpreises sind, manche Käufer aber eine Ermäßigung erhalten. Der Nutzer sagt, dass er seine erste Wohnung kauft, und fragt, ob er eine Ermäßigung bekommt. Der Assistent tippt gerade." },
          fr: { b: "En 2027", t: "Bientôt : discuter avec l'IA juridique plutôt que chercher", p: "La recherche juridique par IA deviendra bientôt un chat : menez une conversation continue, posez des questions de suivi et appuyez-vous sur vos messages précédents.", l: "Qu'est-ce qui va changer ?", i: ["Préciser et poser des questions sur la réponse précédente", "La conversation conserve vos questions et réponses précédentes", "Être guidé pas à pas vers la résolution de votre dossier"], u: "Quels droits faut-il payer lors de l'achat d'un logement ?", a: "Les droits représentent en général 4 % du prix d'achat, mais certains acquéreurs bénéficient d'une réduction.", f: "J'achète mon premier logement. Ai-je droit à une réduction ?", ax: "Conversation par chat avec l'IA juridique. L'utilisateur demande quels droits il faut payer lors de l'achat d'un logement. L'assistant répond que c'est en général 4 % du prix d'achat, mais que certains acquéreurs bénéficient d'une réduction. L'utilisateur explique qu'il achète son premier logement et demande s'il a droit à une réduction. L'assistant est en train d'écrire." },
          es: { b: "En 2027", t: "Próximamente: conversar con la IA jurídica en lugar de buscar", p: "El buscador de IA jurídica se convertirá pronto en un chat: mantenga una conversación continua, haga preguntas de seguimiento y apóyese en sus mensajes anteriores.", l: "¿Qué va a cambiar?", i: ["Aclarar y repreguntar sobre la respuesta anterior", "La conversación conserva sus preguntas y respuestas anteriores", "Recibir orientación paso a paso para resolver su caso"], u: "¿Cuánto hay que pagar de tasa al comprar una vivienda?", a: "La tasa suele ser el 4 % del precio de compra, pero algunos compradores tienen derecho a una reducción.", f: "Voy a comprar mi primera vivienda. ¿Tengo derecho a una reducción?", ax: "Conversación de chat con la IA jurídica. El usuario pregunta cuánto hay que pagar de tasa al comprar una vivienda. El asistente responde que suele ser el 4 % del precio de compra, pero que algunos compradores tienen derecho a una reducción. El usuario cuenta que compra su primera vivienda y pregunta si tiene derecho a una reducción. El asistente está escribiendo." },
          it: { b: "Nel 2027", t: "Prossimamente: conversare con l'IA giuridica invece di cercare", p: "La ricerca con IA giuridica diventerà presto una chat: potrà portare avanti una conversazione continua, fare domande di approfondimento e basarsi sui messaggi precedenti.", l: "Cosa cambierà?", i: ["Precisare e approfondire la risposta precedente", "La conversazione conserva le domande e le risposte precedenti", "Essere guidati passo dopo passo alla soluzione del suo caso"], u: "Quali imposte si pagano all'acquisto di un'abitazione?", a: "L'imposta è di solito il 4% del prezzo di acquisto, ma alcuni acquirenti hanno diritto a una riduzione.", f: "Sto comprando la mia prima casa. Ho diritto a una riduzione?", ax: "Conversazione in chat con l'IA giuridica. L'utente chiede quali imposte si pagano all'acquisto di un'abitazione. L'assistente risponde che di solito è il 4% del prezzo di acquisto, ma che alcuni acquirenti hanno diritto a una riduzione. L'utente dice che sta comprando la prima casa e chiede se ha diritto a una riduzione. L'assistente sta scrivendo." },
          zh: { b: "2027 年", t: "即将推出：与法律人工智能对话，而不只是搜索", p: "法律人工智能搜索即将升级为聊天模式：您可以持续对话、针对回答继续追问，并基于之前的消息展开交流。", l: "将有哪些变化？", i: ["可以对上一个回答补充说明并继续追问", "对话会保留您之前的问题和回答", "一步一步引导您解决问题"], u: "购买住房时需要缴纳多少税费？", a: "税费通常为购买价格的 4%，部分购房者可享受减免。", f: "我是首次购房，可以减免吗？", ax: "与法律人工智能的聊天对话。用户询问购买住房时需要缴纳多少税费。助手回答说通常为购买价格的 4%，但部分购房者可享受减免。用户说明自己是首次购房，并询问是否可以减免。助手正在输入。" }
        };
        var CH = CHAT[LANG] || CHAT.en;
        var CHK = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z"/></svg>';
        var OWL_AV = '<span class="ms-chat-av" aria-hidden="true">' + (owlSrc ? '<img src="' + String(owlSrc).replace(/"/g, "&quot;") + '" alt="">' : "") + '</span>';
        var chat = document.createElement("section");
        chat.className = "ms-chat";
        chat.setAttribute("aria-labelledby", "ms-chat-title");
        chat.innerHTML = '<div class="ms-chat-in">' +
          '<div class="ms-chat-text">' +
            '<p class="ms-chat-badge">' + esc2(CH.b) + '</p>' +
            '<h2 id="ms-chat-title">' + esc2(CH.t) + '</h2>' +
            '<h3 class="ms-chat-sub">' + esc2(CH.l) + '</h3>' +
            '<ul class="ms-chat-list">' + CH.i.map(function (t) { return '<li>' + CHK + '<span>' + esc2(t) + '</span></li>'; }).join("") + '</ul>' +
          '</div>' +
          '<div class="ms-chat-demo">' +
            '<p class="ms-chat-alt">' + esc2(CH.ax) + '</p>' +
            '<div class="ms-chat-b ms-chat-u" aria-hidden="true">' + esc2(CH.u) + '</div>' +
            '<div class="ms-chat-b ms-chat-a" aria-hidden="true">' + esc2(CH.a) + '</div>' +
            '<div class="ms-chat-b ms-chat-u" aria-hidden="true">' + esc2(CH.f) + '</div>' +
            '<div class="ms-chat-row" aria-hidden="true">' + OWL_AV + '<div class="ms-chat-b ms-chat-a ms-chat-typing"><i></i><i></i><i></i></div></div>' +
          '</div>' +
        '</div>';
        help.insertAdjacentElement("afterend", chat);
        // Gorgetesre buborekonkent jelenik meg a beszelgetes; mire a szekcio kozepe a kepernyo kozepere er, mind lathato (visszafele gorgetve eltunnek)
        (function () {
          var demo = chat.querySelector(".ms-chat-demo");
          if (!demo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
          var items = [].slice.call(demo.children).filter(function (e) { return !e.classList.contains("ms-chat-alt"); });
          demo.classList.add("is-anim");
          var tick = false;
          var update = function () {
            tick = false;
            var r = demo.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
            // 0: az illusztracio teteje a kepernyo aljan; 1: az illusztracio kozepe a kepernyo kozepen (asztalon ez a szekcio kozepe is; mobilon az illusztracio a szoveg alatt van)
            var p = (vh - r.top) / (vh / 2 + r.height / 2);
            items.forEach(function (el, i) { el.classList.toggle("is-in", p >= 0.15 + (i / items.length) * 0.8); });
          };
          var req = function () { if (!tick) { tick = true; window.requestAnimationFrame(update); } };
          window.addEventListener("scroll", req, { passive: true });
          window.addEventListener("resize", req);
          update();
        })();
      }

      if (!redirectMode) {
        try {
          var pq = new URLSearchParams(location.search).get("q");
          if (pq) { setVal(pq); go(); }
        } catch (e) {}
        // Vissza / Elore: az URL szerinti kerdes jelenik meg (vagy ures kezdolap), uj elozmeny-bejegyzes nelkul
        window.addEventListener("popstate", function () {
          var q2 = new URLSearchParams(location.search).get("q");
          if (q2) { setVal(q2); go(); return; }
          runTok++;
          resMount.removeAttribute("aria-busy"); resMount.innerHTML = "";
          setVal(""); refreshClear(); fitHero();
          var h1 = document.querySelector("main h1"); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); h1.addEventListener("blur", function () { h1.removeAttribute("tabindex"); }, { once: true }); }
        });
      }
      refreshClear();
    }

    if (window.customElements && customElements.whenDefined) {
      Promise.all(["dap-ds-textarea", "dap-ds-icon-button"].map(function (t) { return customElements.whenDefined(t); }))
        .then(function () { setTimeout(setup, 60); });
    } else {
      setup();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
