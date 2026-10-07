/* mock-search.js
 * A jog.gov.hu "Mesterséges intelligencia alapú jogi információ kereső" mock
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
      location.replace("/" + sel + "/jogi-informacio-kereso" + location.search);
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
    hu: { label: "Jogi kérdés", ph: "Keresés pl: Ki nyújthat be igényt közérdekű adat megismerésére?", search: "Keresés", clear: "keresőmező értékek törlése",
          sw1: "Önkormányzati rendeletekben is keresne?", sw2: "Múltbeli időpontra vonatkozik a kérdése?", suggest: "Keresési javaslatok", pop: "Népszerű keresések", rec: "Legutóbbi kereséseim", samples: "Példakérdések",
          loading: "Válasz keresése a jogszabályokban…", none: "Erre a kérdésre nincs rögzített mock válasz. Próbálja a beállított kérdések egyikét.", thanks: "Köszönjük a visszajelzést!", loaded: "A válasz betöltődött.",
          ansLabel: "Országos jogszabályokon alapuló válasz:", ansId: "Válaszazonosító: ", disclaimer: "A válasz nem minősül hivatalos jogi tanácsadásnak.",
          fbTitle: "Hasznosnak találta a szolgáltatást?", fbText: "Segítsen nekünk, hogy még jobbá tegyük a választ!", up: "Hasznos volt", down: "Nem volt hasznos",
          info: "További részletekért javasolt a vonatkozó jogszabályok áttanulmányozása.", laws: "Hivatkozott országos jogszabályok", newWin: " (új ablakban nyílik meg)", cite: "Forrás a Nemzeti Jogszabálytárban (új ablakban nyílik meg)" },
    en: { label: "Legal question", ph: "Search e.g.: Who can submit a request for access to data of public interest?", search: "Search", clear: "Clear search field",
          sw1: "Would you also like to search local government decrees?", sw2: "Is your question related to a past date?", suggest: "Search suggestions", samples: "Sample questions",
          loading: "Searching the legislation for an answer…", none: "There is no recorded mock answer for this question. Try one of the sample questions.", thanks: "Thank you for your feedback!", loaded: "The answer has loaded.",
          ansLabel: "Answer based on national legislation:", ansId: "Answer ID: ", disclaimer: "This answer does not constitute official legal advice.",
          fbTitle: "Did you find this service useful?", fbText: "Help us make the answer even better!", up: "Useful", down: "Not useful",
          info: "For further details, we recommend reading the relevant legislation.", laws: "Referenced national legislation", newWin: " (opens in a new window)", cite: "Source in the National Legislation Database (opens in a new window)" },
    de: { label: "Rechtliche Frage", ph: "Suchen z.B.: Wer kann einen Antrag auf Zugang zu Daten von öffentlichem Interesse stellen?", search: "Suchen", clear: "Suchfeld leeren",
          sw1: "Möchten Sie auch in den Gemeindeverordnungen suchen?", sw2: "Bezieht sich Ihre Frage auf ein Datum in der Vergangenheit?", suggest: "Suchvorschläge", samples: "Beispielfragen",
          loading: "Antwort wird in den Rechtsvorschriften gesucht…", none: "Für diese Frage gibt es keine hinterlegte Mock-Antwort. Versuchen Sie eine der Beispielfragen.", thanks: "Vielen Dank für Ihr Feedback!", loaded: "Die Antwort wurde geladen.",
          ansLabel: "Antwort auf Grundlage nationaler Rechtsvorschriften:", ansId: "Antwort-ID: ", disclaimer: "Die Antwort stellt keine offizielle Rechtsberatung dar.",
          fbTitle: "Fanden Sie den Dienst hilfreich?", fbText: "Helfen Sie uns, die Antwort noch besser zu machen!", up: "Hilfreich", down: "Nicht hilfreich",
          info: "Für weitere Einzelheiten empfiehlt sich das Studium der einschlägigen Rechtsvorschriften.", laws: "Zitierte nationale Rechtsvorschriften", newWin: " (öffnet in einem neuen Fenster)", cite: "Quelle in der Nationalen Rechtsdatenbank (öffnet in einem neuen Fenster)" },
    fr: { label: "Question juridique", ph: "Recherche ex : Qui peut soumettre une demande de consultation de données d'intérêt public ?", search: "Recherche", clear: "Effacer le champ de recherche",
          sw1: "Voulez-vous également effectuer des recherces dans les décrets municipaux ?", sw2: "Votre question concerne-t-elle une date passée ?", suggest: "Suggestions de recherche", samples: "Exemples de questions",
          loading: "Recherche d'une réponse dans la législation…", none: "Aucune réponse fictive n'est enregistrée pour cette question. Essayez l'un des exemples de questions.", thanks: "Merci pour votre avis !", loaded: "La réponse est chargée.",
          ansLabel: "Réponse fondée sur la législation nationale :", ansId: "Identifiant de la réponse : ", disclaimer: "La réponse ne constitue pas un conseil juridique officiel.",
          fbTitle: "Avez-vous trouvé ce service utile ?", fbText: "Aidez-nous à améliorer encore la réponse !", up: "Utile", down: "Pas utile",
          info: "Pour plus de détails, il est recommandé de consulter la législation applicable.", laws: "Législation nationale citée", newWin: " (s'ouvre dans une nouvelle fenêtre)", cite: "Source dans la base de données juridique nationale (s'ouvre dans une nouvelle fenêtre)" },
    es: { label: "Pregunta jurídica", ph: "Búsqueda p. ej.: ¿Quién puede presentar una solicitud para conocer datos de interés público?", search: "Búsqueda", clear: "Borrar el campo de búsqueda",
          sw1: "¿Buscaría también en los decretos municipales?", sw2: "¿Su pregunta se refiere a un momento pasado?", suggest: "Sugerencias de búsqueda", samples: "Preguntas de ejemplo",
          loading: "Buscando una respuesta en la legislación…", none: "No hay ninguna respuesta simulada para esta pregunta. Pruebe una de las preguntas de ejemplo.", thanks: "¡Gracias por sus comentarios!", loaded: "La respuesta se ha cargado.",
          ansLabel: "Respuesta basada en la legislación nacional:", ansId: "ID de la respuesta: ", disclaimer: "La respuesta no constituye asesoramiento jurídico oficial.",
          fbTitle: "¿Le ha resultado útil el servicio?", fbText: "¡Ayúdenos a mejorar aún más la respuesta!", up: "Útil", down: "No útil",
          info: "Para más detalles, se recomienda consultar la legislación correspondiente.", laws: "Legislación nacional citada", newWin: " (se abre en una ventana nueva)", cite: "Fuente en la Base de Datos Legislativa Nacional (se abre en una ventana nueva)" },
    it: { label: "Domanda giuridica", ph: "Ricerca ad es. Chi può presentare una richiesta per accedere a dati di interesse pubblico?", search: "Ricerca", clear: "Cancella il campo di ricerca",
          sw1: "Vuole cercare anche nei regolamenti comunali?", sw2: "La sua domanda si riferisce a un momento passato?", suggest: "Suggerimenti di ricerca", samples: "Domande di esempio",
          loading: "Ricerca di una risposta nella normativa…", none: "Per questa domanda non è registrata alcuna risposta fittizia. Provi una delle domande di esempio.", thanks: "Grazie per il suo riscontro!", loaded: "La risposta è stata caricata.",
          ansLabel: "Risposta basata sulla normativa nazionale:", ansId: "ID risposta: ", disclaimer: "La risposta non costituisce consulenza legale ufficiale.",
          fbTitle: "Ha trovato utile il servizio?", fbText: "Ci aiuti a migliorare ancora la risposta!", up: "Utile", down: "Non utile",
          info: "Per ulteriori dettagli si consiglia di consultare la normativa pertinente.", laws: "Normativa nazionale citata", newWin: " (si apre in una nuova finestra)", cite: "Fonte nella Banca dati legislativa nazionale (si apre in una nuova finestra)" },
    zh: { label: "法律问题", ph: "搜索样例：谁可以提出获取公共利益信息的请求？", search: "搜索", clear: "清除搜索框",
          sw1: "您是否也要在地方政府条例中进行搜索？", sw2: "您的问题是针对过去某个日期的版本吗？", suggest: "搜索建议", samples: "示例问题",
          loading: "正在法律法规中查找答案…", none: "此问题没有预设的模拟答案。请尝试其中一个示例问题。", thanks: "感谢您的反馈！", loaded: "答案已加载。",
          ansLabel: "基于国家法律法规的答案：", ansId: "答案编号：", disclaimer: "本答案不构成正式的法律建议。",
          fbTitle: "您觉得这项服务有用吗？", fbText: "帮助我们把答案做得更好！", up: "有用", down: "没有用",
          info: "如需了解更多详情，建议查阅相关法律法规。", laws: "引用的国家法律法规", newWin: "（在新窗口中打开）", cite: "国家法律数据库中的来源（在新窗口中打开）" }
  };
  if (!I18N[LANG]) LANG = "en";
  var S = I18N[LANG];
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
    "Most kaptam felmondást a munkahelyemen. Mennyi a felmondási időm, és mit kell tennem, ha nem értek vele egyet?"
  ];

  var CITE_HREF = "https://njt.hu/";
  function cite(on) { return on ? '<a class="ms-cite" href="' + CITE_HREF + '" target="_blank" rel="noopener" aria-label="' + S.cite + '">' + IC.cite + '</a>' : ''; }

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
    ANSWERS = ANSWERS.map(function (a, i) {
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
        setTimeout(function () { resolve(match(query)); }, 620);
      });
    }
  };
  window.JogMockSearch = JogMockSearch;

  /* -------------------------------------------------------------- render segédek */
  function attr(t) { return String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
  function el(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; }

  function renderBlocks(blocks) {
    var out = "";
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
    return out;
  }

  function renderAnswer(a) {
    var lawsHtml = a.laws.map(function (l) {
      return '<div class="ms-law"><a href="' + CITE_HREF + '" target="_blank" rel="noopener">' + l.ref +
             '<span class="ms-sr-only">' + S.newWin + '</span></a>' +
             '<div class="ms-law-desc">' + l.desc + '</div></div>';
    }).join("");

    return '' +
      '<div class="ms-results-grid">' +
        '<div class="ms-answer-card">' +
          '<div class="ms-answer-head">' +
            '<div class="ms-head-badge">' +
              '<div class="ms-owl">' + IC.owl + '</div>' +
              '<h2 class="ms-answer-label" id="ms-answer-title" tabindex="-1">' + S.ansLabel + '</h2>' +
            '</div>' +
            '<div class="ms-answer-id"><span class="ms-sr-only">' + S.ansId + '</span>' + a.id + '</div>' +
          '</div>' +
          '<div class="ms-answer-body">' + renderBlocks(a.blocks) + '</div>' +
          '<div class="ms-disclaimer">' + IC.warn + '<span>' + S.disclaimer + '</span></div>' +
          '<hr class="ms-sep">' +
          '<div class="ms-feedback">' +
            '<h2 class="ms-feedback-title" id="ms-feedback-title">' + S.fbTitle + '</h2>' +
            '<p>' + S.fbText + '</p>' +
            '<div class="ms-thumbs" role="group" aria-labelledby="ms-feedback-title">' +
              '<button class="ms-thumb" type="button" aria-pressed="false" aria-label="' + S.up + '">' + IC.up + '</button>' +
              '<button class="ms-thumb" type="button" aria-pressed="false" aria-label="' + S.down + '">' + IC.down + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ms-side">' +
          '<div class="ms-info">' + IC.info + '<span>' + S.info + '</span></div>' +
          '<h2 class="ms-laws-title">' + S.laws + '</h2>' +
          lawsHtml +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ vezérlés */
  var RESULTS_PAGE = PREFIX + "/jogi-informacio-kereso/";

  function boot() {
    var barMount = document.getElementById("mock-search-bar");
    var resMount = document.getElementById("mock-search-results");
    if (!barMount) return;
    // resMount hiánya = "csak searchbar" mód (pl. kezdőlap) -> átirányítás a találati oldalra
    var redirectMode = !resMount;

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
      '<div class="ms-searchbar-wrap' + (redirectMode ? ' ms-on-dark' : '') + '">' +
        '<div class="ms-searchbar-ds">' +
          '<label class="ms-label" id="ms-label">' + S.label + '</label>' +
          '<dap-ds-textarea class="ms-input-ds" size="lg" subtle hidecounter ' +
            'placeholder="' + attr(S.ph) + '"></dap-ds-textarea>' +
          '<div class="ms-actions">' +
            '<dap-ds-icon-button class="ms-clear-ds" aria-label="' + S.clear + '" variant="subtle" size="md" icon="close-line" style="display:none"></dap-ds-icon-button>' +
            '<dap-ds-icon-button class="ms-search-ds" aria-label="' + S.search + '" variant="brand" size="md" icon="search-line"></dap-ds-icon-button>' +
          '</div>' +
          '<div class="ms-suggest" id="ms-suggest-panel" role="group" aria-label="' + S.suggest + '">' +
            (POPULAR.length ? suggestCol(IC_TREND, S.pop, POPULAR, "ms-suggest-pop") : "") +
            suggestCol(IC_HIST, LANG === "hu" ? S.rec : S.samples, RECENT, "ms-suggest-rec") +
          '</div>' +
        '</div>' +
        '<div class="ms-toggles-ds">' +
          '<dap-ds-switch size="xs" name="municipality" label="' + attr(S.sw1) + '"></dap-ds-switch>' +
          '<dap-ds-switch size="xs" name="timemachine" label="' + attr(S.sw2) + '"></dap-ds-switch>' +
        '</div>' +
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

    function run(getVal) {
      var q = (getVal() || "").trim();
      if (!q) return;
      if (redirectMode) { location.assign(RESULTS_PAGE + "?q=" + encodeURIComponent(q)); return; }
      resMount.setAttribute("aria-busy", "true");
      announce(S.loading);
      resMount.innerHTML = '<div class="ms-results"><div class="ms-loading"><span class="ms-spinner" aria-hidden="true"></span>' + S.loading + '</div></div>';
      JogMockSearch.ask(q).then(function (a) {
        resMount.removeAttribute("aria-busy");
        if (!a) {
          var msg = S.none;
          resMount.innerHTML = '<div class="ms-results"><div class="ms-empty">' + msg + '</div></div>';
          announce(msg);
          return;
        }
        var wrap = document.createElement("div");
        wrap.className = "ms-results";
        wrap.innerHTML = renderAnswer(a);
        resMount.innerHTML = "";
        resMount.appendChild(wrap);
        wrap.querySelectorAll(".ms-thumb").forEach(function (btn) {
          btn.addEventListener("click", function () {
            wrap.querySelectorAll(".ms-thumb").forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
            btn.classList.add("is-active");
            btn.setAttribute("aria-pressed", "true");
            announce(S.thanks);
          });
        });
        announce(S.loaded);
        // a fokusz a valasz cimere kerul, igy a felolvaso onnan folytatja (2.4.3, 4.1.3)
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var title = wrap.querySelector("#ms-answer-title");
        if (title) title.focus({ preventScroll: true });
        resMount.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
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
            if (nb) { nb.setAttribute("aria-label", label); return true; }
          }
          return false;
        };
        if (!apply() && window.customElements) {
          customElements.whenDefined("dap-ds-icon-button").then(function () { setTimeout(apply, 30); });
        }
      }
      labelIconBtn(searchBtn, S.search);
      labelIconBtn(clearBtn, S.clear);
      function getVal() { return ta.value || ""; }
      function setVal(v) {
        if (inner) { inner.value = v; inner.dispatchEvent(new Event("input", { bubbles: true, composed: true })); }
        else { try { ta.value = v; } catch (e) {} }
      }
      function refreshClear() { if (clearBtn) clearBtn.style.display = getVal().trim() ? "" : "none"; }

      var wrap = barMount.querySelector(".ms-searchbar-wrap");
      var suggest = barMount.querySelector(".ms-suggest");
      function suggestBtns() { return suggest ? Array.prototype.slice.call(suggest.querySelectorAll(".ms-suggest-btn")) : []; }
      function openSuggest() { if (suggest) suggest.classList.add("is-open"); }
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
        else if (e.key === "ArrowDown") { e.preventDefault(); openSuggest(); var bs = suggestBtns(); focusSoon(bs[0]); }
        else if (e.key === "ArrowUp") { e.preventDefault(); openSuggest(); var bu = suggestBtns(); focusSoon(bu[bu.length - 1]); }
      });
      // A legordulot a keresomezo-konteneren figyeljuk (focusin/focusout buborekol es
      // atmegy a shadow DOM-on) -> megbizhatoan nyitva marad, amig a fokusz a keresoben
      // van (mezo, keres-gomb, javaslatok), es Tabbal vegig lehet menni rajta.
      var sbds = barMount.querySelector(".ms-searchbar-ds");
      if (sbds) {
        sbds.addEventListener("focusin", function () {
          if (suppressOpen) { suppressOpen = false; return; }
          openSuggest();
        });
        sbds.addEventListener("focusout", function (e) {
          if (!sbds.contains(e.relatedTarget)) closeSuggest();
        });
      }
      searchBtn.addEventListener("click", go);
      if (clearBtn) clearBtn.addEventListener("click", function () { setVal(""); refreshClear(); if (inner) inner.focus(); openSuggest(); });

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

      if (!redirectMode) {
        try {
          var pq = new URLSearchParams(location.search).get("q");
          if (pq) { setVal(pq); go(); }
        } catch (e) {}
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
