// Ports the playable Week One (quiz result screen + homepage sections) to cs, sv, de, fi, ru.
// The English pages (survey.html, index.html) were changed by hand on 2026-11-15; the translated pages are
// hand-maintained copies with the same structure, so this script applies the same change to each of them
// with the strings below. It skips a page that already has the change.
//   node _apply_week_one_i18n.mjs            all languages
//   node _apply_week_one_i18n.mjs de         one language
// Tone: players are addressed informally (ty / du / sinä / ты), parents formally where the language has it
// (vy / Sie / вы), as on the rest of each site. Prices are not written here: the result screen reuses the
// price sentence already on each page.
// Data: assets/week-one-data.<lang>.js (campaigns/week1/generate-preview-i18n.mjs, the app's own translations).
import fs from 'fs';

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

const S = {
  cs: {
    title: 'První týden<br>je <em>připravený</em>.',
    lead: 'Tady je tvůj Den 1. Klepni na cvik a podívej se na ukázku.',
    leadYouth: 'Tady je Den 1 pro vašeho hráče (AGE let). Klepněte na cvik a podívejte se na ukázku.',
    app: 'Trénuj to v aplikaci', appYouth: 'Spusťte to v aplikaci',
    fine: 'Video, časovač pauz a výsledky ke každému cviku.', stores: 'iOS a Android.',
    pdf: 'Otevřít PDF zdarma (anglicky)',
    share: 'Poslat rodiči', shareNote: 'Rodič dostane krátkou stránku: co aplikace je, kolik stojí a jak ji zrušit.',
    shareText: 'Mám program suché přípravy na hokej přímo pro můj věk. První týden je zdarma. Na pokračování potřebuju aplikaci, která má týden zdarma. Podíváš se na to se mnou?',
    copied: 'Zkopírováno. Vlož to do zprávy', subject: 'Program suché přípravy na hokej',
    barTitle: '2. týden je v aplikaci', barSub: '7 dní zdarma, zrušíš kdykoli', barBtn: 'Stáhnout aplikaci',
  },
  sv: {
    title: 'Vecka ett<br>är <em>klar</em>.',
    lead: 'Här är din dag 1. Tryck på en övning för att se den.',
    leadYouth: 'Här är dag 1 för din spelare (AGE år). Tryck på en övning för att se den.',
    app: 'Träna det i appen', appYouth: 'Kör det i appen',
    fine: 'Video, vilotimer och resultat för varje övning.', stores: 'iOS och Android.',
    pdf: 'Öppna gratis-PDF:en (på engelska)',
    share: 'Skicka till en förälder', shareNote: 'Föräldern får en kort sida: vad appen är, vad den kostar och hur man avslutar.',
    shareText: 'Jag har hittat ett barmarksprogram för hockey för min ålder och fick första veckan gratis. För att fortsätta behöver jag appen. Den har en gratisvecka. Kan du kolla på det med mig?',
    copied: 'Kopierat. Klistra in i ett meddelande', subject: 'Barmarksprogram för hockey',
    barTitle: 'Vecka 2 finns i appen', barSub: '7 dagar gratis, avsluta när du vill', barBtn: 'Hämta appen',
  },
  de: {
    title: 'Woche eins<br>ist <em>bereit</em>.',
    lead: 'Hier ist dein Tag 1. Tippe auf eine Übung, um sie anzusehen.',
    leadYouth: 'Hier ist Tag 1 für Ihren Spieler (AGE Jahre). Tippen Sie auf eine Übung, um sie anzusehen.',
    app: 'Trainiere es in der App', appYouth: 'In der App starten',
    fine: 'Video, Pausen-Timer und Ergebnisse zu jeder Übung.', stores: 'iOS und Android.',
    pdf: 'Kostenloses PDF öffnen (auf Englisch)',
    share: 'An ein Elternteil schicken', shareNote: 'Deine Eltern bekommen eine kurze Seite: was die App ist, was sie kostet und wie man kündigt.',
    shareText: 'Ich habe ein Off-Ice-Hockeyprogramm für mein Alter gefunden und die erste Woche gratis bekommen. Zum Weitermachen brauche ich die App. Sie hat eine Gratiswoche. Schaust du es dir mit mir an?',
    copied: 'Kopiert. Füge es in eine Nachricht ein', subject: 'Off-Ice-Hockeyprogramm',
    barTitle: 'Woche 2 ist in der App', barSub: '7 Tage gratis, jederzeit kündbar', barBtn: 'App holen',
  },
  fi: {
    title: 'Ensimmäinen viikko<br>on <em>valmis</em>.',
    lead: 'Tässä on ensimmäinen päiväsi. Napauta liikettä, niin näet sen.',
    leadYouth: 'Tässä on päivä 1 pelaajallesi (AGE v). Napauta liikettä, niin näet sen.',
    app: 'Treenaa se sovelluksessa', appYouth: 'Aloita sovelluksessa',
    fine: 'Video, lepoajastin ja tulokset jokaiseen liikkeeseen.', stores: 'iOS ja Android.',
    pdf: 'Avaa ilmainen PDF (englanniksi)',
    share: 'Lähetä vanhemmalle', shareNote: 'Vanhempi saa lyhyen sivun: mikä sovellus on, mitä se maksaa ja miten tilaus perutaan.',
    shareText: 'Löysin ikäiselleni tehdyn jääkiekon oheisharjoitteluohjelman ja sain ensimmäisen viikon ilmaiseksi. Jatkoa varten tarvitsen sovelluksen. Siinä on ilmainen viikko. Katsotko sitä kanssani?',
    copied: 'Kopioitu. Liitä viestiin', subject: 'Jääkiekon oheisharjoitteluohjelma',
    barTitle: 'Viikko 2 on sovelluksessa', barSub: '7 päivää ilmaiseksi, peru milloin tahansa', barBtn: 'Lataa sovellus',
  },
  ru: {
    title: 'Первая неделя<br><em>готова</em>.',
    lead: 'Вот ваш День 1. Нажмите на упражнение, чтобы посмотреть его.',   // the Russian quiz page says «вы» throughout
    leadYouth: 'Вот День 1 для вашего игрока (AGE лет). Нажмите на упражнение, чтобы посмотреть его.',
    app: 'Тренируйтесь в приложении', appYouth: 'Запустить в приложении',
    fine: 'Видео, таймер отдыха и результаты к каждому упражнению.', stores: 'iOS и Android.',
    pdf: 'Открыть бесплатный PDF (на английском)',
    share: 'Отправить родителю', shareNote: 'Родитель получит короткую страницу: что это за приложение, сколько оно стоит и как отменить подписку.',
    shareText: 'У меня есть программа тренировок вне льда для моего возраста, первая неделя бесплатно. Чтобы продолжить, нужно приложение. В нём есть бесплатная неделя. Посмотришь вместе со мной?',
    copied: 'Скопировано. Вставьте в сообщение', subject: 'Программа тренировок вне льда',
    barTitle: '2-я неделя — в приложении', barSub: '7 дней бесплатно, отмена в любой момент', barBtn: 'Скачать приложение',
  },
};

const H = {
  cs: {
    eyebrow: 'Vyzkoušej hned · bez registrace', h2: 'Vyber věk.<br>Podívej se na <em>první den.</em>',
    lede: 'Tohle je první týden, který aplikace sestaví, cvik po cviku. Klepni na cvik a pusť si ukázku.',
    cta1: 'Začni tenhle týden v aplikaci', cta2: 'Pošli mi tenhle týden e-mailem zdarma',
    small: 'Aplikace ho přestaví podle tvého věku, pozice, vybavení a zápasů. První týden máš zdarma.',
    watch: 'Podívej se na první den',
    pEyebrow: 'Pro hokejové rodiče', pH2: 'Trénink přiměřený<br><em>věku.</em>',
    cards: [
      ['Pro tělo, které roste', 'Hráči do 14 let cvičí jen s vlastní vahou a lehkými pomůckami, nikdy s činkou. Lehčí týdny jsou v plánu.'],
      ['Ukázané, ne odhadnuté', 'Video a rada trenéra ke každému cviku, aby se ho hráč naučil správně hned napoprvé.'],
      ['Ladí s hokejem', '2 až 5 tréninků týdně, naplánovaných kolem ledu a zápasů. Zítra zápas znamená krátkou aktivaci, ne těžké nohy.'],
      ['Žádná překvapení', 'První týden je u ročního plánu zdarma. Platbu řeší Apple nebo Google a zrušíte ji dvěma klepnutími. Žádné reklamy. Osobní údaje nikdy neprodáváme.'],
    ],
    pBtn: 'Stránka pro rodiče', pSpan: 'Co to je, kolik to stojí, jak to zrušit. Dvě minuty.',
    dTitle: 'Stáhni si ji <em>do telefonu.</em>', dText: 'Namiř foťák telefonu na kód. První týden máš zdarma.',
    dAlt: 'Nemáš telefon po ruce? Klikni na kód a otevře se stránka obchodu.', close: 'Zavřít',
  },
  sv: {
    eyebrow: 'Testa direkt · ingen registrering', h2: 'Välj ålder.<br>Se <em>dag ett.</em>',
    lede: 'Det här är första veckan som appen bygger, övning för övning. Tryck på en övning för att se demon.',
    cta1: 'Starta veckan i appen', cta2: 'Mejla mig veckan, gratis',
    small: 'Appen bygger om den efter din ålder, position, utrustning och dina matcher. Din första vecka är gratis.',
    watch: 'Se dag ett',
    pEyebrow: 'För hockeyföräldrar', pH2: 'Träning som passar<br><em>åldern.</em>',
    cards: [
      ['Rätt för en växande kropp', 'Spelare som är 14 år eller yngre tränar bara med kroppsvikt och lätt utrustning, aldrig med skivstång. Lättare veckor är inplanerade.'],
      ['Visat, inte gissat', 'En demovideo och ett tränartips för varje övning, så att de lär sig göra rätt från början.'],
      ['Passar runt hockeyn', '2 till 5 pass i veckan, planerade runt isträningar och matcher. Match i morgon betyder en kort aktivering, inte tunga ben.'],
      ['Inga överraskningar', 'Första veckan är gratis med årsplanen. Apple eller Google sköter betalningen och du avslutar med två tryck. Ingen reklam. Personuppgifter säljs aldrig.'],
    ],
    pBtn: 'Läs föräldrasidan', pSpan: 'Vad det är, vad det kostar, hur man avslutar. Två minuter.',
    dTitle: 'Hämta den till <em>din mobil.</em>', dText: 'Rikta mobilkameran mot koden. Din första vecka är gratis.',
    dAlt: 'Ingen mobil nära? Klicka på en kod för att öppna butikssidan här.', close: 'Stäng',
  },
  de: {
    eyebrow: 'Jetzt ausprobieren · ohne Anmeldung', h2: 'Wähle ein Alter.<br>Sieh dir <em>Tag eins</em> an.',
    lede: 'Das ist die erste Woche, die die App baut, Übung für Übung. Tippe auf eine Übung, um die Demo zu sehen.',
    cta1: 'Starte diese Woche in der App', cta2: 'Schick mir diese Woche per E-Mail, gratis',
    small: 'Die App baut sie um dein Alter, deine Position, deine Ausrüstung und deine Spiele neu auf. Deine erste Woche ist gratis.',
    watch: 'Tag eins ansehen',
    pEyebrow: 'Für Hockey-Eltern', pH2: 'Training, das zum<br><em>Alter passt.</em>',
    cards: [
      ['Passend für einen Körper im Wachstum', 'Spieler bis 14 Jahre trainieren nur mit Körpergewicht und leichtem Material, nie mit der Langhantel. Leichtere Wochen sind eingeplant.'],
      ['Gezeigt, nicht geraten', 'Ein Demovideo und ein Coaching-Tipp zu jeder Übung, damit sie von Anfang an richtig ausgeführt wird.'],
      ['Passt zum Hockey', '2 bis 5 Einheiten pro Woche, geplant rund um Eistraining und Spiele. Morgen ein Spiel heißt kurze Aktivierung, keine schweren Beine.'],
      ['Keine Überraschungen', 'Die erste Woche ist im Jahresabo gratis. Die Abrechnung läuft über Apple oder Google, und Sie kündigen mit zwei Tipps. Keine Werbung. Persönliche Daten werden nie verkauft.'],
    ],
    pBtn: 'Zur Elternseite', pSpan: 'Was es ist, was es kostet, wie man kündigt. Zwei Minuten.',
    dTitle: 'Hol sie dir aufs <em>Handy.</em>', dText: 'Richte die Handykamera auf den Code. Deine erste Woche ist gratis.',
    dAlt: 'Kein Handy zur Hand? Klick auf einen Code, um die Store-Seite hier zu öffnen.', close: 'Schließen',
  },
  fi: {
    eyebrow: 'Kokeile heti · ei rekisteröitymistä', h2: 'Valitse ikä.<br>Katso <em>ensimmäinen päivä.</em>',
    lede: 'Tämä on ensimmäinen viikko, jonka sovellus rakentaa, liike liikkeeltä. Napauta liikettä, niin näet demon.',
    cta1: 'Aloita tämä viikko sovelluksessa', cta2: 'Lähetä viikko sähköpostiini ilmaiseksi',
    small: 'Sovellus rakentaa sen uudelleen ikäsi, pelipaikkasi, välineidesi ja peliesi mukaan. Ensimmäinen viikko on ilmainen.',
    watch: 'Katso ensimmäinen päivä',
    pEyebrow: 'Kiekkovanhemmille', pH2: 'Ikään sopivaa<br><em>harjoittelua.</em>',
    cards: [
      ['Kasvavalle keholle sopiva', 'Enintään 14-vuotiaat treenaavat vain kehonpainolla ja kevyillä välineillä, ei koskaan levytangolla. Kevyemmät viikot on suunniteltu valmiiksi.'],
      ['Näytetty, ei arvattu', 'Demovideo ja valmentajan vinkki jokaiseen liikkeeseen, jotta liike opitaan oikein heti alusta.'],
      ['Sopii kiekon ympärille', '2–5 treeniä viikossa jäätreenien ja pelien ympärille suunniteltuna. Huomenna peli tarkoittaa lyhyttä aktivointia, ei raskaita jalkoja.'],
      ['Ei yllätyksiä', 'Ensimmäinen viikko on vuositilauksessa ilmainen. Laskutus hoituu Applen tai Googlen kautta, ja perut kahdella napautuksella. Ei mainoksia. Henkilötietoja ei koskaan myydä.'],
    ],
    pBtn: 'Lue vanhempien sivu', pSpan: 'Mikä se on, mitä se maksaa, miten se perutaan. Kaksi minuuttia.',
    dTitle: 'Lataa se <em>puhelimeesi.</em>', dText: 'Osoita puhelimen kameralla koodia. Ensimmäinen viikko on ilmainen.',
    dAlt: 'Eikö puhelin ole käsillä? Avaa kaupan sivu tässä klikkaamalla koodia.', close: 'Sulje',
  },
  ru: {
    eyebrow: 'Попробуй сейчас · без регистрации', h2: 'Выбери возраст.<br>Посмотри <em>первый день.</em>',
    lede: 'Это первая неделя, которую составляет приложение, упражнение за упражнением. Нажми на упражнение, чтобы посмотреть демо.',
    cta1: 'Начать эту неделю в приложении', cta2: 'Прислать эту неделю на почту, бесплатно',
    small: 'Приложение перестроит её под твой возраст, позицию, инвентарь и игры. Первая неделя бесплатно.',
    watch: 'Посмотреть первый день',
    pEyebrow: 'Для родителей хоккеистов', pH2: 'Тренировки<br><em>по возрасту.</em>',
    cards: [
      ['Для растущего организма', 'Игроки 14 лет и младше занимаются только с собственным весом и лёгким инвентарём, никогда со штангой. Лёгкие недели запланированы заранее.'],
      ['Показано, а не угадано', 'Видео и подсказка тренера к каждому упражнению, чтобы игрок сразу учился выполнять правильно.'],
      ['Вписывается в хоккей', 'От 2 до 5 тренировок в неделю, спланированных вокруг льда и игр. Завтра игра — значит короткая активация, а не тяжёлые ноги.'],
      ['Без сюрпризов', 'Первая неделя в годовом плане бесплатна. Оплата идёт через Apple или Google, отменить можно в два касания. Без рекламы. Личные данные никогда не продаются.'],
    ],
    pBtn: 'Страница для родителей', pSpan: 'Что это, сколько стоит, как отменить. Две минуты.',
    dTitle: 'Установи на <em>телефон.</em>', dText: 'Наведи камеру телефона на код. Первая неделя бесплатно.',
    dAlt: 'Телефона нет под рукой? Нажми на код, чтобы открыть страницу магазина здесь.', close: 'Закрыть',
  },
};

const ICONS = [
  '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/></svg>',
  '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  '<svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
];

// the blocks shared with the English pages are read from them, so the two never drift apart
const EN_SURVEY = fs.readFileSync('survey.html', 'utf8');
const EN_INDEX = fs.readFileSync('index.html', 'utf8');
const between = (src, a, b, what) => { const i = src.indexOf(a); const j = src.indexOf(b, i + a.length); if (i < 0 || j < 0) throw new Error('English page: block not found: ' + what); return src.slice(i, j); };
const SURVEY_CSS = between(EN_SURVEY, '/* Result screen: playable Day 1', '@media(max-width:380px){', 'survey css');
const INDEX_CSS = between(EN_INDEX, '/* ── Short laptop screens', '</style>', 'index css');
// per-language additions to the homepage styles
const EXTRA_CSS = {
  ru: "/* ── Russian headline runs to five lines: sized by screen height so the buttons stay on the first screen ── */\n@media (min-width:1024px){\n  html[lang=\"ru\"] .hero h1{font-size:clamp(48px,min(8.4vw,9.6vh),104px);margin-bottom:14px}\n}\n",
};
const DIALOG_JS = between(EN_INDEX, '/* ── Desktop: gold "start" buttons open the scan-to-phone dialog ── */', '</script>', 'dialog js');

const js = (s) => JSON.stringify(s);
const must = (c, w) => { if (!c) throw new Error('anchor missing: ' + w); };

function patchSurvey(lang) {
  const file = `${lang}/survey.html`;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('id="weekOne"')) return `${file}: already done`;
  const t = S[lang];
  const rep = (from, to, what) => { must(s.includes(from), `${file}: ${what}`); s = s.replace(from, () => to); };

  // what the page already says, reused as is
  const pill = (s.match(/<div class="ok-pill">.*<\/div>/) || [])[0];
  const mail = (s.match(/<p class="gift-mail" id="giftMail">[\s\S]*?<\/p>/) || [])[0];
  const price = ((s.match(/<div class="app-fine">([\s\S]*?)<br>/) || [])[1] || '').trim();
  const pdfHref = (s.match(/id="giftBtn" href="([^"]+)"/) || [])[1];
  must(pill && mail && price && pdfHref, `${file}: ok-pill / gift-mail / price sentence / pdf link`);

  rep('@media(max-width:380px){', SURVEY_CSS + '@media(max-width:380px){', 'css anchor');
  rep('<script src="/assets/store-links.js" defer></script>',
      `<script src="/assets/store-links.js" defer></script>\n<script src="/assets/week-one-data.${lang}.js" defer></script>\n<script src="/assets/week-one.js" defer></script>`, 'script anchor');

  const a = s.lastIndexOf('\n', s.indexOf('<!-- SUCCESS:')) + 1;
  const b = s.lastIndexOf('\n', s.indexOf('<div class="steps">')) + 1;
  must(a > 0 && b > a, `${file}: result markup`);
  const html = `  <!-- SUCCESS: Day 1 plays right here (assets/week-one.js), then two doors: the app, or the PDF (the email is the copy).
       Then the week at a glance, a 3-step start and what the app adds. Applied by _apply_week_one_i18n.mjs. -->
  <section class="screen success-screen" data-screen="success">
    ${pill}
    <h2 class="ok-title display">${t.title}</h2>
    <p class="ok-lead" id="okLead">${t.lead}</p>

    <div id="weekOne"></div>

    <div class="doors">
      <a class="door-app" id="doorApp" href="/${lang}/app?src=survey_week_one" data-place="survey-week-one" target="_blank" rel="noopener"><span id="doorAppLabel">${t.app}</span>${ARROW}</a>
      <p class="door-fine">${t.fine} ${price} ${t.stores}</p>
      <a class="door-pdf" id="giftBtn" href="${pdfHref}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>
        <span>${t.pdf}</span>
      </a>
      ${mail}
      <button type="button" class="door-parent" id="parentShare" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v13"/><path d="M7 8l5-5 5 5"/></svg>
        <span id="parentShareLabel">${t.share}</span>
      </button>
      <p class="door-fine" id="parentNote" hidden>${t.shareNote}</p>
    </div>

    <div id="weekOneWeek"></div>

`;
  s = s.slice(0, a) + html + s.slice(b);

  rep('</main>', `</main>

<div class="stickybar" id="stickyBar" aria-hidden="true">
  <span><b>${t.barTitle}</b>${t.barSub}</span>
  <a href="/${lang}/app?src=survey_bar" data-place="survey-bar" target="_blank" rel="noopener" tabindex="-1">${t.barBtn}</a>
</div>`, 'main close');

  // script: inside populateSuccessScreen, the PDF cover block goes, the lead line is replaced, the new parts are added
  const f0 = s.indexOf('function populateSuccessScreen(){');
  const f1 = s.indexOf('// emailed: false when', f0);
  must(f0 > 0 && f1 > f0, `${file}: populateSuccessScreen`);
  let fn = s.slice(f0, f1);
  const c0 = fn.indexOf("  const cover = document.getElementById('giftCover');");
  const c1 = fn.indexOf("document.getElementById('giftMeta').textContent = g.meta;");
  must(c0 > 0 && c1 > c0, `${file}: cover block`);
  fn = fn.slice(0, c0) + fn.slice(fn.indexOf('\n', c1) + 1);
  // one line, or split over three lines (ru)
  const leadRe = /^[ \t]*document\.getElementById\('okLead'\)\.textContent = [\s\S]*?;[ \t]*$/m;
  must(leadRe.test(fn), `${file}: lead line`);
  fn = fn.replace(leadRe, () => `  // Day 1, playable (assets/week-one.js). If the script did not load, the two buttons below still work.
  if (window.EHDWeekOne) window.EHDWeekOne.mount(document.getElementById('weekOne'), { age, place:'survey-success', weekInto: document.getElementById('weekOneWeek') });
  document.getElementById('okLead').textContent = youth ? ${js(t.leadYouth)}.replace('AGE', answers.ageLabel || '') : ${js(t.lead)};
  document.getElementById('doorAppLabel').textContent = youth ? ${js(t.appYouth)} : ${js(t.app)};
  // 15–18: the player is usually the one reading, and a parent holds the card
  const share = document.getElementById('parentShare');
  const teen = age === '15_18';
  share.hidden = !teen;
  document.getElementById('parentNote').hidden = !teen;
  if (teen) share.onclick = shareWithParent;
  // The bar with the app button shows whenever the first app button is off screen
  const bar = document.getElementById('stickyBar');
  const door = document.getElementById('doorApp');
  if (bar && door && 'IntersectionObserver' in window && !bar.dataset.on) {
    bar.dataset.on = '1';
    new IntersectionObserver((entries) => {
      const on = !entries[0].isIntersecting;
      bar.classList.toggle('show', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      bar.querySelector('a').tabIndex = on ? 0 : -1;
    }, { threshold: 0 }).observe(door);
  }`);
  fn += `// App buttons on the result screen → GA4 "survey_app_click" (placement says which one).
document.addEventListener('click', (e) => {
  const a = e.target.closest ? e.target.closest('a[href*="/app?src=survey"]') : null;
  if (!a || typeof gtag !== 'function') return;
  gtag('event', 'survey_app_click', { placement: a.getAttribute('data-place') || 'survey', age: answers.age || '', lang: ${js(lang)}, transport_type:'beacon' });
}, true);

// "Send this to a parent" (15–18): the phone's share sheet, or the message copied where there is none
async function shareWithParent(){
  const url = 'https://elitehockeydrills.com/${lang}/parents';
  const text = ${js(t.shareText)};
  const label = document.getElementById('parentShareLabel');
  let method = 'share';
  try {
    if (navigator.share) { await navigator.share({ text, url }); }
    else { method = 'copy'; await navigator.clipboard.writeText(text + ' ' + url); label.textContent = ${js(t.copied)}; }
  } catch (err) {
    if (err && err.name === 'AbortError') return;       // closed the share sheet
    method = 'mailto'; location.href = 'mailto:?subject=' + encodeURIComponent(${js(t.subject)}) + '&body=' + encodeURIComponent(text + '\\n\\n' + url);
  }
  if (typeof gtag === 'function') gtag('event', 'parent_share', { placement:'survey-success', method, age: answers.age || '', lang: ${js(lang)} });
}

`;
  s = s.slice(0, f0) + fn + s.slice(f1);
  fs.writeFileSync(file, s);
  return `${file}: done (price line reused: "${price.replace(/&nbsp;/g, ' ').slice(0, 60)}…")`;
}

function patchIndex(lang) {
  const file = `${lang}/index.html`;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('id="week-one"')) return `${file}: already done`;
  const t = H[lang];
  const rep = (from, to, what) => { must(s.includes(from), `${file}: ${what}`); s = s.replace(from, () => to); };
  const ios = (s.match(/href="(https:\/\/apps\.apple\.com\/[^"]+)"/) || [])[1];
  const play = (s.match(/href="(https:\/\/play\.google\.com\/store\/apps\/details[^"]+)"/) || [])[1];
  must(ios && play, `${file}: store links`);

  const head = s.indexOf('</head>');
  const st = s.lastIndexOf('</style>', head);
  must(st > 0, `${file}: style close`);
  s = s.slice(0, st) + INDEX_CSS + (EXTRA_CSS[lang] || '') + s.slice(st);
  rep('<script src="/assets/lang-switch.js" defer></script>',
      `<script src="/assets/lang-switch.js" defer></script>\n<script src="/assets/week-one-data.${lang}.js" defer></script>\n<script src="/assets/week-one.js" defer></script>`, 'head scripts');

  const ghost = /<a href="#app" class="btn btn-ghost btn-lg">[^<]*<\/a>/;
  must(ghost.test(s), `${file}: hero second button`);
  s = s.replace(ghost, () => `<a href="#week-one" class="btn btn-ghost btn-lg">${t.watch}</a>`);
  const mm = s.indexOf('<div class="mobile-menu" id="mobileMenu">');
  const mmFirst = s.indexOf('<a href="#app">', mm);
  must(mm > 0 && mmFirst > mm, `${file}: mobile menu`);
  s = s.slice(0, mmFirst) + `<a href="#week-one">${t.watch}</a>\n  ` + s.slice(mmFirst);

  rep('<section class="sec" id="how">', `<!-- WEEK ONE, PLAYABLE: the app's real first week per age group (assets/week-one-data.${lang}.js). Applied by _apply_week_one_i18n.mjs. -->
<section class="sec try" id="week-one">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="eyebrow gold">${t.eyebrow}</div>
      <h2 class="display">${t.h2}</h2>
      <p class="lede">${t.lede}</p>
    </div>
    <div id="weekOne"></div>
    <div class="try-cta reveal">
      <a href="${ios}" class="btn btn-primary btn-lg" data-place="week_one">${t.cta1}
        ${ARROW}</a>
      <a href="survey.html" class="btn btn-ghost btn-lg">${t.cta2}</a>
      <small>${t.small}</small>
    </div>
  </div>
</section>

<section class="sec" id="how">`, 'how section');

  rep('<section class="sec pricing" id="trial">', `<!-- PARENTS (same facts as parents.html). Applied by _apply_week_one_i18n.mjs. -->
<section class="sec-tight" id="parents">
  <div class="wrap">
    <div class="sec-head reveal" style="margin-bottom:26px">
      <div class="eyebrow ice">${t.pEyebrow}</div>
      <h2 class="display" style="font-size:clamp(36px,6.4vw,64px)">${t.pH2}</h2>
    </div>
    <div class="parents-grid">
${t.cards.map(([title, text], i) => `      <article class="parent-card reveal${i ? ' d' + i : ''}">
        <div class="ic">${ICONS[i]}</div>
        <h3>${title}</h3>
        <p>${text}</p>
      </article>`).join('\n')}
    </div>
    <div class="parents-foot reveal">
      <a href="/${lang}/parents.html" class="btn btn-ghost">${t.pBtn}
        ${ARROW}</a>
      <span>${t.pSpan}</span>
    </div>
  </div>
</section>

<section class="sec pricing" id="trial">`, 'pricing section');

  rep('<div class="mobile-bar" id="mobileBar">', `<!-- Desktop visitors cannot install from here: the gold buttons open this instead of the store's web page -->
<div class="getapp" id="getApp" role="dialog" aria-modal="true" aria-labelledby="getAppTitle">
  <div class="getapp-box">
    <button type="button" class="getapp-x" id="getAppClose" aria-label="${t.close}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <h3 id="getAppTitle">${t.dTitle}</h3>
    <p>${t.dText}</p>
    <div class="getapp-qrs">
      <a class="getapp-qr" href="${ios}" data-store="ios" data-place="desktop_dialog" target="_blank" rel="noopener"><img src="/assets/app/app-store-qr.svg" alt="QR: App Store" width="200" height="200" /><b>iOS · App Store</b></a>
      <a class="getapp-qr" href="${play}" data-place="desktop_dialog" target="_blank" rel="noopener"><img src="/assets/app/google-play-qr.svg" alt="QR: Google Play" width="200" height="200" /><b>Android · Google Play</b></a>
    </div>
    <p class="getapp-alt">${t.dAlt}</p>
  </div>
</div>

<div class="mobile-bar" id="mobileBar">`, 'mobile bar');

  const anchor = s.indexOf('/* ── Nav / menu / progress');
  must(anchor > 0, `${file}: script anchor`);
  const end = s.indexOf('</script>', anchor);
  s = s.slice(0, end) + `
/* ── Week One, playable ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function(){
  var el = document.getElementById('weekOne');
  if (el && window.EHDWeekOne) window.EHDWeekOne.mount(el, { age:'12_14', picker:true, wide:true, place:'home' });
});

${DIALOG_JS}` + s.slice(end);
  fs.writeFileSync(file, s);
  return `${file}: done`;
}

const only = process.argv[2];
for (const lang of Object.keys(S)) {
  if (only && only !== lang) continue;
  console.log(patchSurvey(lang));
  console.log(patchIndex(lang));
}
