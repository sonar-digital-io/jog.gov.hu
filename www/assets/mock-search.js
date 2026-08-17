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

  /* ---------------------------------------------------------------- ikonok */
  var IC = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    cite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/></svg>',
    owl: '<svg width="26" height="33" viewBox="0 0 26 33" xmlns="http://www.w3.org/2000/svg"><path d="M12.8333 33C9.25589 33 6.22264 31.7261 3.73358 29.1784C1.24453 26.6304 0 23.5559 0 19.9549V11.3172C0 8.03611 1.2786 5.32965 3.83579 3.19779C6.39299 1.06593 9.39217 0 12.8333 0C16.1098 0 19.0679 1.0366 21.7076 3.10979C24.347 5.18268 25.6667 7.91847 25.6667 11.3172V31.0961C25.6667 31.6345 25.4839 32.0864 25.1185 32.4518C24.7531 32.8173 24.3011 33 23.7627 33H12.8333ZM12.8333 31.1667H18.6505C17.5529 30.4028 16.6852 29.4197 16.0472 28.2173C15.4089 27.0152 15.0897 25.6949 15.0897 24.2564V22.4373C14.7136 22.4913 14.3434 22.5318 13.9792 22.5587C13.6149 22.5859 13.233 22.5995 12.8333 22.5995C10.6217 22.5995 8.52576 22.1288 6.54546 21.1874C4.56515 20.246 2.99444 18.8421 1.83333 16.9758V19.9549C1.83333 23.0575 2.89697 25.7018 5.02425 27.8878C7.15122 30.0737 9.75425 31.1667 12.8333 31.1667ZM16.923 24.2564C16.923 26.1603 17.5988 27.788 18.9503 29.1395C20.3017 30.4909 21.9294 31.1667 23.8333 31.1667V17.011C23.0389 18.2757 22.0481 19.3258 20.861 20.1612C19.6743 20.9969 18.3616 21.6216 16.923 22.0353V24.2564ZM12.8333 20.7662C15.7596 20.7662 18.3245 19.883 20.5278 18.1165C22.7315 16.3501 23.8333 14.0837 23.8333 11.3172C23.8333 10.1539 23.6207 9.05927 23.1953 8.03321C22.7697 7.00715 22.1739 6.10393 21.4078 5.32354C19.2876 5.45524 17.4813 6.24739 15.989 7.7C14.4963 9.15261 13.75 10.9343 13.75 13.0451C13.75 13.3057 13.6625 13.5236 13.4874 13.6987C13.3123 13.8741 13.0943 13.9618 12.8333 13.9618C12.5724 13.9618 12.3544 13.8741 12.1793 13.6987C12.0042 13.5236 11.9167 13.3057 11.9167 13.0451C11.9167 10.9343 11.1645 9.15032 9.66029 7.69312C8.15604 6.23562 6.34379 5.46104 4.22354 5.36938C3.48104 6.14977 2.89697 7.04535 2.47133 8.05613C2.046 9.0669 1.83333 10.1539 1.83333 11.3172C1.83333 14.0837 2.93517 16.3501 5.13883 18.1165C7.34219 19.883 9.90703 20.7662 12.8333 20.7662ZM6.875 12.6569C6.49672 12.6569 6.17879 12.5282 5.92121 12.271C5.66393 12.0137 5.53529 11.6958 5.53529 11.3172C5.53529 10.9389 5.66393 10.6211 5.92121 10.3638C6.17879 10.1062 6.49672 9.97746 6.875 9.97746C7.25328 9.97746 7.57121 10.1062 7.82879 10.3638C8.08607 10.6211 8.21471 10.9389 8.21471 11.3172C8.21471 11.6958 8.08607 12.0137 7.82879 12.271C7.57121 12.5282 7.25328 12.6569 6.875 12.6569ZM18.7917 12.6569C18.4134 12.6569 18.0955 12.5282 17.8379 12.271C17.5806 12.0137 17.452 11.6958 17.452 11.3172C17.452 10.9389 17.5806 10.6211 17.8379 10.3638C18.0955 10.1062 18.4134 9.97746 18.7917 9.97746C19.1699 9.97746 19.4879 10.1062 19.7455 10.3638C20.0027 10.6211 20.1314 10.9389 20.1314 11.3172C20.1314 11.6958 20.0027 12.0137 19.7455 12.271C19.4879 12.5282 19.1699 12.6569 18.7917 12.6569ZM6.0995 3.86421C7.60833 4.17435 8.95507 4.79829 10.1397 5.73604C11.3243 6.6741 12.2222 7.80939 12.8333 9.14192C13.4444 7.80939 14.3347 6.68005 15.504 5.75392C16.6734 4.82778 18.0125 4.19788 19.5213 3.86421C18.5931 3.22254 17.5618 2.72357 16.4276 2.36729C15.2937 2.01132 14.0956 1.83333 12.8333 1.83333C11.5711 1.83333 10.367 2.01132 9.22121 2.36729C8.07537 2.72357 7.0348 3.22254 6.0995 3.86421Z" fill="currentColor"/></svg>'
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
  function cite(on) { return on ? '<a class="ms-cite" href="' + CITE_HREF + '" target="_blank" rel="noopener" aria-label="Hivatkozás megnyitása">' + IC.cite + '</a>' : ''; }

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
      return '<div class="ms-law"><a href="' + CITE_HREF + '" target="_blank" rel="noopener">' + l.ref + '</a>' +
             '<div class="ms-law-desc">' + l.desc + '</div></div>';
    }).join("");

    return '' +
      '<div class="ms-results-grid">' +
        '<div class="ms-answer-card">' +
          '<div class="ms-answer-head">' +
            '<div class="ms-head-badge">' +
              '<div class="ms-owl">' + IC.owl + '</div>' +
              '<div class="ms-answer-label">Országos jogszabályokon alapuló válasz:</div>' +
            '</div>' +
            '<div class="ms-answer-id">' + a.id + '</div>' +
          '</div>' +
          '<div class="ms-answer-body">' + renderBlocks(a.blocks) + '</div>' +
          '<div class="ms-disclaimer">' + IC.warn + '<span>A válasz nem minősül hivatalos jogi tanácsadásnak.</span></div>' +
          '<hr class="ms-sep">' +
          '<div class="ms-feedback">' +
            '<h3>Hasznosnak találta a szolgáltatást?</h3>' +
            '<p>Segítsen nekünk, hogy még jobbá tegyük a választ!</p>' +
            '<div class="ms-thumbs">' +
              '<button class="ms-thumb" type="button" aria-label="Hasznos volt">' + IC.up + '</button>' +
              '<button class="ms-thumb" type="button" aria-label="Nem volt hasznos">' + IC.down + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ms-side">' +
          '<div class="ms-info">' + IC.info + '<span>További részletekért javasolt a vonatkozó jogszabályok áttanulmányozása.</span></div>' +
          '<h3 class="ms-laws-title">Hivatkozott országos jogszabályok</h3>' +
          lawsHtml +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ vezérlés */
  var RESULTS_PAGE = "/jogi-informacio-kereso/";

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
          '<dap-ds-textarea class="ms-input-ds" aria-label="kereső mező" size="lg" subtle hidecounter ' +
            'placeholder="Keresés pl: Ki nyújthat be igényt közérdekű adat megismerésére?"></dap-ds-textarea>' +
          '<div class="ms-actions">' +
            '<dap-ds-icon-button class="ms-clear-ds" aria-label="keresőmező értékek törlése" variant="subtle" size="md" style="display:none">' +
              '<dap-ds-icon name="close-line" size="md"></dap-ds-icon>' +
            '</dap-ds-icon-button>' +
            '<dap-ds-icon-button class="ms-search-ds" aria-label="Keresés" variant="brand" size="md">' +
              '<dap-ds-icon name="search-line" size="md"></dap-ds-icon>' +
            '</dap-ds-icon-button>' +
          '</div>' +
          '<div class="ms-suggest" id="ms-suggest-panel" role="group" aria-label="Keresési javaslatok">' +
            suggestCol(IC_TREND, "Népszerű keresések", POPULAR, "ms-suggest-pop") +
            suggestCol(IC_HIST, "Legutóbbi kereséseim", RECENT, "ms-suggest-rec") +
          '</div>' +
        '</div>' +
        '<div class="ms-toggles-ds">' +
          '<dap-ds-switch size="xs" name="municipality" aria-label="önkormányzati rendeletek kereső kapcsoló" label="Önkormányzati rendeletekben is keresne?"></dap-ds-switch>' +
          '<dap-ds-switch size="xs" name="timemachine" aria-label="időgép funkció kapcsoló" label="Múltbeli időpontra vonatkozik a kérdése?"></dap-ds-switch>' +
        '</div>' +
      '</div>';
    // a javaslat-gombok szövegét textContent-tel toltjuk fel (biztonsagos)
    (function () {
      var cols = barMount.querySelectorAll(".ms-suggest-col");
      if (cols[0]) POPULAR.forEach(function (t, i) { var b = cols[0].querySelectorAll(".ms-suggest-btn")[i]; if (b) b.textContent = t; });
      if (cols[1]) RECENT.forEach(function (t, i) { var b = cols[1].querySelectorAll(".ms-suggest-btn")[i]; if (b) b.textContent = t; });
    })();

    function run(getVal) {
      var q = (getVal() || "").trim();
      if (!q) return;
      if (redirectMode) { location.assign(RESULTS_PAGE + "?q=" + encodeURIComponent(q)); return; }
      resMount.innerHTML = '<div class="ms-results"><div class="ms-loading"><span class="ms-spinner"></span>Válasz keresése a jogszabályokban…</div></div>';
      JogMockSearch.ask(q).then(function (a) {
        if (!a) {
          resMount.innerHTML = '<div class="ms-results"><div class="ms-empty">Erre a kérdésre nincs rögzített mock válasz. Próbálja a beállított kérdések egyikét.</div></div>';
          return;
        }
        var wrap = document.createElement("div");
        wrap.className = "ms-results";
        wrap.innerHTML = renderAnswer(a);
        resMount.innerHTML = "";
        resMount.appendChild(wrap);
        wrap.querySelectorAll(".ms-thumb").forEach(function (btn) {
          btn.addEventListener("click", function () {
            wrap.querySelectorAll(".ms-thumb").forEach(function (b) { b.classList.remove("is-active"); });
            btn.classList.add("is-active");
          });
        });
        resMount.scrollIntoView({ behavior: "smooth", block: "start" });
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
      if (inner) inner.setAttribute("aria-label", "Jogi kérdés");

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
      labelIconBtn(searchBtn, "Keresés");
      labelIconBtn(clearBtn, "keresőmező értékek törlése");
      function getVal() { return ta.value || ""; }
      function setVal(v) {
        if (inner) { inner.value = v; inner.dispatchEvent(new Event("input", { bubbles: true, composed: true })); }
        else { try { ta.value = v; } catch (e) {} }
      }
      function refreshClear() { if (clearBtn) clearBtn.style.display = getVal().trim() ? "" : "none"; }

      var wrap = barMount.querySelector(".ms-searchbar-wrap");
      var suggest = barMount.querySelector(".ms-suggest");
      function suggestBtns() { return suggest ? Array.prototype.slice.call(suggest.querySelectorAll(".ms-suggest-btn")) : []; }
      function openSuggest() { if (suggest) suggest.classList.add("is-open"); if (inner) inner.setAttribute("aria-expanded", "true"); }
      function closeSuggest() { if (suggest) suggest.classList.remove("is-open"); if (inner) inner.setAttribute("aria-expanded", "false"); }

      // a mezo mint kombobox: a felolvaso igy jelzi a javaslatokat
      if (inner) {
        inner.setAttribute("role", "combobox");
        inner.setAttribute("aria-controls", "ms-suggest-panel");
        inner.setAttribute("aria-haspopup", "true");
        inner.setAttribute("aria-expanded", "false");
        inner.setAttribute("aria-autocomplete", "list");
      }

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
                    ".switch:hover .input__control--checked{background-color:#a9ebdc!important}";
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
