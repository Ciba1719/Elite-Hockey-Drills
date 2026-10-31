#!/usr/bin/env node
/**
 * Elite Hockey Drills — TRANSLATED exercise library generator (cs, sv, de, fi, ru)
 *
 * Builds  /<lang>/library.html  and  /<lang>/exercises/<slug>.html  for every
 * language below, from the SAME templates as generate.js, so translated pages
 * always match the English design. Reads:
 *   - generate.js              templates (English strings are swapped below)
 *   - exercises.json           written by generate.js: slugs, order, videos
 *   - exercises.<lang>.json    translated texts per slug (name, execution, …)
 *
 * Usage:   node generate.js         English build — runs this script at the end
 *          node generate-i18n.js    translated builds only (all languages)
 *          node generate-i18n.js sv one language
 *
 * If the English template changes and a string below no longer matches, the
 * script STOPS and prints it — update the table, never ship half-translated.
 * To add a language: add a LANGS entry, a column in CAT and SWAPS, and the
 * exercises.<lang>.json file.
 */
const fs   = require('fs');
const path = require('path');
const ROOT = __dirname;
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const LANGS = {
  cs: { store: 'cz', ogLocale: 'cs_CZ',
        plural: "function i18nPlural(n, w) { return n === 1 ? w[0] : (n >= 2 && n <= 4 ? w[1] : w[2]); }",
        exWords: "['cvik','cviky','cviků']", resWords: "['výsledek','výsledky','výsledků']" },
  fi: { store: 'fi', ogLocale: 'fi_FI',
        plural: "function i18nPlural(n, w) { return n === 1 ? w[0] : w[1]; }",
        exWords: "['harjoitus','harjoitusta']", resWords: "['tulos','tulosta']" },
  de: { store: 'de', ogLocale: 'de_DE',
        plural: "function i18nPlural(n, w) { return n === 1 ? w[0] : w[1]; }",
        exWords: "['Übung','Übungen']", resWords: "['Treffer','Treffer']" },
  ru: { store: 'ru', ogLocale: 'ru_RU',
        plural: "function i18nPlural(n, w) { var m10 = n % 10, m100 = n % 100; return (m10 === 1 && m100 !== 11) ? w[0] : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? w[1] : w[2]; }",
        exWords: "['упражнение','упражнения','упражнений']", resWords: "['результат','результата','результатов']" },
  sv: { store: 'se', ogLocale: 'sv_SE',
        plural: "function i18nPlural(n, w) { return n === 1 ? w[0] : w[1]; }",
        exWords: "['övning','övningar']", resWords: "['träff','träffar']" },
};

// ── Category names ──────────────────────────────────────────────────────────
const CAT = {
  'Competitive Play':           { cs: 'Soutěživé hry',                    sv: 'Tävlingslekar', de: 'Wettkampfspiele', fi: 'Kilpailulliset pelit', ru: 'Соревновательные игры' },
  'Conditioning / Jump Rope':   { cs: 'Kondice / švihadlo',               sv: 'Kondition / hopprep', de: 'Kondition / Seilspringen', fi: 'Kestävyys / hyppynaru', ru: 'Выносливость / скакалка' },
  'Cool-down / Recovery':       { cs: 'Zklidnění / regenerace',           sv: 'Nedvarvning / återhämtning', de: 'Cool-down / Regeneration', fi: 'Loppuverryttely / palautuminen', ru: 'Заминка / восстановление' },
  'Core & Anti-rotation':       { cs: 'Střed těla a antirotace',          sv: 'Bål och antirotation', de: 'Rumpf & Anti-Rotation', fi: 'Keskivartalo & kiertoa vastustavat', ru: 'Кор и антиротация' },
  'Energy Systems / Intervals': { cs: 'Energetické systémy / intervaly',  sv: 'Energisystem / intervaller', de: 'Energiesysteme / Intervalle', fi: 'Energiajärjestelmät / intervallit', ru: 'Энергетические системы / интервалы' },
  'Full-body & Complexes':      { cs: 'Celé tělo a komplexy',             sv: 'Helkropp och komplex', de: 'Ganzkörper & Komplexe', fi: 'Koko keho & kompleksit', ru: 'Всё тело и комплексы' },
  'Hinge / Posterior Chain':    { cs: 'Hip hinge / zadní řetězec',        sv: 'Höftfällning / baksida', de: 'Hüftbeuge / hintere Kette', fi: 'Lonkkasaranat / takaketju', ru: 'Хинж / задняя цепь' },
  'Hockey-Specific Dryland':    { cs: 'Hokejová suchá příprava',          sv: 'Hockeyspecifik barmark', de: 'Eishockey-spezifisches Athletiktraining', fi: 'Jääkiekkospesifi oheisharjoittelu', ru: 'Хоккейная специфика вне льда' },
  'Jump & Plyometric':          { cs: 'Skoky a plyometrie',               sv: 'Hopp och plyometri', de: 'Sprünge & Plyometrie', fi: 'Hypyt & plyometria', ru: 'Прыжки и плиометрика' },
  'Loaded Carries':             { cs: 'Nošení zátěže',                    sv: 'Bärövningar', de: 'Loaded Carries / Tragen', fi: 'Kantoliikkeet', ru: 'Переноски с отягощением' },
  'Lunge & Single-leg':         { cs: 'Výpady a jedna noha',              sv: 'Utfall och enbensövningar', de: 'Ausfallschritte & einbeinig', fi: 'Askelkyykyt & yhden jalan liikkeet', ru: 'Выпады и работа на одной ноге' },
  'Prehab / Injury Prevention': { cs: 'Prehab / prevence zranění',        sv: 'Prehab / skadeförebyggande', de: 'Prehab / Verletzungsprävention', fi: 'Prehab / vammojen ennaltaehkäisy', ru: 'Профилактика травм' },
  'Rotational Power':           { cs: 'Rotační výbušnost',                sv: 'Rotationsexplosivitet', de: 'Rotationskraft', fi: 'Rotaatioräjähtävyys', ru: 'Ротационная мощность' },
  'Speed, Sprint & Agility':    { cs: 'Rychlost, sprint a agilita',       sv: 'Fart, sprint och smidighet', de: 'Speed, Sprint & Agilität', fi: 'Nopeus, sprintti & ketteryys', ru: 'Скорость, спринт и ловкость' },
  'Squat / Knee-dominant':      { cs: 'Dřep / dominance kolene',          sv: 'Knäböj / knädominant', de: 'Kniebeuge / kniedominant', fi: 'Kyykky / polvidominantit', ru: 'Присед / коленно-доминантные' },
  'Upper Body / Pull':          { cs: 'Horní polovina těla / tahy',       sv: 'Överkropp / drag', de: 'Oberkörper / Ziehen', fi: 'Ylävartalo / vedot', ru: 'Верх тела / тяги' },
  'Upper Body / Push':          { cs: 'Horní polovina těla / tlaky',      sv: 'Överkropp / press', de: 'Oberkörper / Drücken', fi: 'Ylävartalo / työnnöt', ru: 'Верх тела / жимы' },
  'Warm-up / Mobility':         { cs: 'Rozcvička / mobilita',             sv: 'Uppvärmning / rörlighet', de: 'Aufwärmen / Mobilität', fi: 'Alkulämmittely / liikkuvuus', ru: 'Разминка / мобильность' },
};

// ── Template swaps: [english, {cs, sv} | string-with-__L__/__STORE__, mode] ──
// A plain string replacement applies to every language (__L__ = lang code).
const SWAPS = [
  [`const XLSX  = require('./node_modules/xlsx');`, `const XLSX = null;`],
  [/\nmain\(\);\s*$/, '\n'],
  [`const PAGE_LANG  = 'en';`, `const PAGE_LANG  = '__L__';`],
  [`const OG_LOCALE  = 'en_US';`, `const OG_LOCALE  = '__OG__';`],
  // stable anchors from translated category names (strip diacritics before slugging)
  [`function makeSlug(name, used = new Set()) {\n  let base = name\n    .toLowerCase()`,
   `function makeSlug(name, used = new Set()) {\n  let base = name\n    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')\n    .replace(/[а-яё]/gi, function (c) { return ({а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'})[c.toLowerCase()] || ''; })\n    .toLowerCase()`],

  // URLs → same-language pages
  ['href="${SITE_URL}#', 'href="${SITE_URL}/__L__/#', 'all'],
  ['href="${SITE_URL}" class="nav-logo"', 'href="${SITE_URL}/__L__/" class="nav-logo"'],
  ['<a class="nav-logo" href="${SITE_URL}">', '<a class="nav-logo" href="${SITE_URL}/__L__/">'],
  ['${SITE_URL}/survey.html', '${SITE_URL}/__L__/survey.html', 'all'],
  ['href="/library.html', 'href="/__L__/library.html', 'all'],
  ['"/hockey-training-app.html"', '"/__L__/hockey-training-app.html"', 'all'],
  ['/exercises/${', '/__L__/exercises/${', 'all'],
  ['${SITE_URL}/library.html', '${SITE_URL}/__L__/library.html', 'all'],
  ['https://apps.apple.com/us/app/elite-hockey-drills/id6787257275', 'https://apps.apple.com/__STORE__/app/elite-hockey-drills/id6787257275', 'all'],
  ['https://play.google.com/store/apps/details?id=com.elitehockeydrills.training"', 'https://play.google.com/store/apps/details?id=com.elitehockeydrills.training&amp;hl=__L__"', 'all'],
  ['<script src="/assets/library.js"></script>', '<script src="/assets/library.__L__.js"></script>'],
  ['<html lang="en">', '<html lang="__L__">', 'all'],

  // nav
  ['<nav aria-label="Main navigation">', { cs: '<nav aria-label="Hlavní navigace">', sv: '<nav aria-label="Huvudmeny">', de: '<nav aria-label="Hauptnavigation">', fi: '<nav aria-label="Päävalikko">', ru: '<nav aria-label="Основная навигация">' }],
  ['#about">Coach</a></li>', { cs: '#about">Trenér</a></li>', sv: '#about">Tränaren</a></li>', de: '#about">Trainer</a></li>', fi: '#about">Valmentaja</a></li>', ru: '#about">Тренер</a></li>' }],
  ['#method">Method</a></li>', { cs: '#method">Metodika</a></li>', sv: '#method">Metod</a></li>', de: '#method">Methode</a></li>', fi: '#method">Menetelmä</a></li>', ru: '#method">Метод</a></li>' }, 'all'],
  ['#tiers">Programs</a></li>', { cs: '#tiers">Programy</a></li>', sv: '#tiers">Program</a></li>', de: '#tiers">Programme</a></li>', fi: '#tiers">Ohjelmat</a></li>', ru: '#tiers">Программы</a></li>' }],
  [`' aria-current="page"' : ''}>Library</a></li>`, { cs: `' aria-current="page"' : ''}>Knihovna</a></li>`, sv: `' aria-current="page"' : ''}>Bibliotek</a></li>`, de: `' aria-current="page"' : ''}>Bibliothek</a></li>`, fi: `' aria-current="page"' : ''}>Kirjasto</a></li>`, ru: '\' aria-current="page"\' : \'\'}>Библиотека</a></li>' }],
  ['      <li><a href="${SITE_URL}/__L__/#faq">FAQ</a></li>\n    </ul>\n  </nav>',
   { cs: '      <li><a href="${SITE_URL}/__L__/#faq">Dotazy</a></li>\n    </ul>\n  </nav>', sv: '      <li><a href="${SITE_URL}/__L__/#faq">Frågor</a></li>\n    </ul>\n  </nav>', de: '      <li><a href="${SITE_URL}/__L__/#faq">Fragen</a></li>\n    </ul>\n  </nav>', fi: '      <li><a href="${SITE_URL}/__L__/#faq">UKK</a></li>\n    </ul>\n  </nav>', ru: '      <li><a href="${SITE_URL}/__L__/#faq">Вопросы</a></li>\n    </ul>\n  </nav>' }],
  ['class="nav-cta btn btn-primary">Get the App</a></div>', { cs: 'class="nav-cta btn btn-primary">Týden zdarma</a></div>', sv: 'class="nav-cta btn btn-primary">Gratisvecka</a></div>', de: 'class="nav-cta btn btn-primary">Gratiswoche</a></div>', fi: 'class="nav-cta btn btn-primary">Ilmainen viikko</a></div>', ru: 'class="nav-cta btn btn-primary">Скачать приложение</a></div>' }],

  // footer
  ['<p>Science-backed off-ice training for hockey players. Built by a certified sport scientist and former national-team coach.</p>',
   { cs: '<p>Vědecky podložená suchá příprava pro hokejisty. Vytvořil certifikovaný sportovní vědec a bývalý trenér národního týmu.</p>',
     sv: '<p>Vetenskapligt underbyggd barmarksträning för hockeyspelare. Skapad av en certifierad idrottsforskare och tidigare landslagstränare.</p>', de: '<p>Wissenschaftlich fundiertes Off-Ice-Training für Eishockeyspieler. Entwickelt von einem zertifizierten Sportwissenschaftler und ehemaligen Nationaltrainer.</p>', fi: '<p>Tieteeseen perustuvaa oheisharjoittelua jääkiekkoilijoille. Laatinut sertifioitu urheilutieteilijä ja entinen maajoukkuevalmentaja.</p>', ru: '<p>Научно обоснованные тренировки вне льда для хоккеистов. Создано сертифицированным спортивным учёным и бывшим тренером национальной сборной.</p>' }],
  ['<h4>Programs</h4>', { cs: '<h4>Programy</h4>', sv: '<h4>Program</h4>', de: '<h4>Programme</h4>', fi: '<h4>Ohjelmat</h4>', ru: '<h4>Программы</h4>' }],
  ['>Free 5-Day PDF</a>', { cs: '>5denní program zdarma</a>', sv: '>Gratis 5-dagarsprogram</a>', de: '>Gratis 5-Tage-Programm</a>', fi: '>Ilmainen 5 päivän ohjelma</a>', ru: '>Бесплатная 5-дневная программа</a>' }],
  ['#tiers">8-Week Programs</a>', { cs: '#tiers">8týdenní programy</a>', sv: '#tiers">8-veckorsprogram</a>', de: '#tiers">8-Wochen-Programme</a>', fi: '#tiers">8 viikon ohjelmat</a>', ru: '#tiers">8-недельные программы</a>' }],
  ['>Hockey Training App</a>', { cs: '>Hokejová tréninková aplikace</a>', sv: '>Träningsapp för hockey</a>', de: '>Eishockey-Trainings-App</a>', fi: '>Jääkiekon treenisovellus</a>', ru: '>Приложение для хоккейных тренировок</a>' }],
  ['data-store="ios">The App — iOS</a>', { cs: 'data-store="ios">Aplikace — iOS</a>', sv: 'data-store="ios">Appen — iOS</a>', de: 'data-store="ios">Die App — iOS</a>', fi: 'data-store="ios">Sovellus — iOS</a>', ru: 'data-store="ios">Приложение — iOS</a>' }],
  ['>The App — Android</a>', { cs: '>Aplikace — Android</a>', sv: '>Appen — Android</a>', de: '>Die App — Android</a>', fi: '>Sovellus — Android</a>', ru: '>Приложение — Android</a>' }],
  ['<h4>Navigate</h4>', { cs: '<h4>Navigace</h4>', sv: '<h4>Navigera</h4>', de: '<h4>Navigation</h4>', fi: '<h4>Sivusto</h4>', ru: '<h4>Навигация</h4>' }],
  ['#about">About</a></li>', { cs: '#about">O trenérovi</a></li>', sv: '#about">Om tränaren</a></li>', de: '#about">Über den Trainer</a></li>', fi: '#about">Valmentajasta</a></li>', ru: '#about">О тренере</a></li>' }],
  ['<li><a href="/__L__/library.html">Exercise Library</a></li>', { cs: '<li><a href="/__L__/library.html">Knihovna cviků</a></li>', sv: '<li><a href="/__L__/library.html">Övningsbibliotek</a></li>', de: '<li><a href="/__L__/library.html">Übungsbibliothek</a></li>', fi: '<li><a href="/__L__/library.html">Harjoituspankki</a></li>', ru: '<li><a href="/__L__/library.html">Библиотека упражнений</a></li>' }],
  ['        <li><a href="${SITE_URL}/__L__/#faq">FAQ</a></li>\n      </ul>',
   { cs: '        <li><a href="${SITE_URL}/__L__/#faq">Časté dotazy</a></li>\n      </ul>', sv: '        <li><a href="${SITE_URL}/__L__/#faq">Vanliga frågor</a></li>\n      </ul>', de: '        <li><a href="${SITE_URL}/__L__/#faq">Häufige Fragen</a></li>\n      </ul>', fi: '        <li><a href="${SITE_URL}/__L__/#faq">Usein kysyttyä</a></li>\n      </ul>', ru: '        <li><a href="${SITE_URL}/__L__/#faq">Частые вопросы</a></li>\n      </ul>' }],
  ['<h4>Connect</h4>', { cs: '<h4>Kontakt</h4>', sv: '<h4>Kontakt</h4>', de: '<h4>Kontakt</h4>', fi: '<h4>Ota yhteyttä</h4>', ru: '<h4>Контакты</h4>' }],
  ['<li><a href="mailto:elitehockeydrills@gmail.com">Email</a></li>', { cs: '<li><a href="mailto:elitehockeydrills@gmail.com">E-mail</a></li>', sv: '<li><a href="mailto:elitehockeydrills@gmail.com">E-post</a></li>', de: '<li><a href="mailto:elitehockeydrills@gmail.com">E-Mail</a></li>', fi: '<li><a href="mailto:elitehockeydrills@gmail.com">Sähköposti</a></li>', ru: '<li><a href="mailto:elitehockeydrills@gmail.com">Эл. почта</a></li>' }],
  ['<span>© 2026 Elite Hockey Drills. All rights reserved.</span>', { cs: '<span>© 2026 Elite Hockey Drills. Všechna práva vyhrazena.</span>', sv: '<span>© 2026 Elite Hockey Drills. Alla rättigheter förbehållna.</span>', de: '<span>© 2026 Elite Hockey Drills. Alle Rechte vorbehalten.</span>', fi: '<span>© 2026 Elite Hockey Drills. Kaikki oikeudet pidätetään.</span>', ru: '<span>© 2026 Elite Hockey Drills. Все права защищены.</span>' }],

  // library page
  ['<title>Exercise Library — Off-Ice Hockey Training | Elite Hockey Drills</title>',
   { cs: '<title>Knihovna cviků — suchá příprava pro hokejisty | Elite Hockey Drills</title>', sv: '<title>Övningsbibliotek — barmarksträning för hockey | Elite Hockey Drills</title>', de: '<title>Übungsbibliothek — Off-Ice-Training für Eishockey | Elite Hockey Drills</title>', fi: '<title>Harjoituspankki — jääkiekon oheisharjoittelu | Elite Hockey Drills</title>', ru: '<title>Библиотека упражнений — хоккейные тренировки вне льда | Elite Hockey Drills</title>' }],
  ['content="Browse ${totalEx} off-ice hockey exercises across ${totalCat} movement categories. Searchable, filterable, built by a sport scientist."',
   { cs: 'content="Projdi ${totalEx} cviků suché přípravy pro hokejisty v ${totalCat} pohybových kategoriích. S vyhledáváním a filtry, od sportovního vědce."',
     sv: 'content="Bläddra bland ${totalEx} barmarksövningar för hockey i ${totalCat} rörelsekategorier. Sökbart, filtrerbart och byggt av en idrottsforskare."', de: 'content="Entdecke ${totalEx} Off-Ice-Übungen für Eishockey in ${totalCat} Bewegungskategorien. Durchsuchbar, filterbar, von einem Sportwissenschaftler entwickelt."', fi: 'content="Selaa ${totalEx} jääkiekon oheisharjoitusta ${totalCat} liikekategoriassa. Haettava, suodatettava ja urheilutieteilijän laatima."', ru: 'content="Библиотека упражнений вне льда для хоккеистов — всего ${totalEx}, в ${totalCat} категориях движений. Поиск, фильтры, автор — спортивный учёный."' }],
  ['content="Exercise Library | Elite Hockey Drills"', { cs: 'content="Knihovna cviků | Elite Hockey Drills"', sv: 'content="Övningsbibliotek | Elite Hockey Drills"', de: 'content="Übungsbibliothek | Elite Hockey Drills"', fi: 'content="Harjoituspankki | Elite Hockey Drills"', ru: 'content="Библиотека упражнений | Elite Hockey Drills"' }],
  ['content="${totalEx} exercises · ${totalCat} movement patterns. Science-backed off-ice hockey training."',
   { cs: 'content="${totalEx} cviků · ${totalCat} pohybových vzorů. Vědecky podložená suchá příprava pro hokejisty."',
     sv: 'content="${totalEx} övningar · ${totalCat} rörelsemönster. Vetenskapligt underbyggd barmarksträning för hockey."', de: 'content="${totalEx} Übungen · ${totalCat} Bewegungsmuster. Wissenschaftlich fundiertes Off-Ice-Training für Eishockey."', fi: 'content="${totalEx} harjoitusta · ${totalCat} liikemallia. Tieteeseen perustuvaa jääkiekon oheisharjoittelua."', ru: 'content="Упражнений: ${totalEx} · паттернов движения: ${totalCat}. Научно обоснованные хоккейные тренировки вне льда."' }],
  ['<div class="eyebrow ice lib-eyebrow">Exercise Library</div>', { cs: '<div class="eyebrow ice lib-eyebrow">Knihovna cviků</div>', sv: '<div class="eyebrow ice lib-eyebrow">Övningsbibliotek</div>', de: '<div class="eyebrow ice lib-eyebrow">Übungsbibliothek</div>', fi: '<div class="eyebrow ice lib-eyebrow">Harjoituspankki</div>', ru: '<div class="eyebrow ice lib-eyebrow">Библиотека упражнений</div>' }],
  ['<h1 id="lib-h1" class="display lib-title">The Full<br><em class="serif">Exercise Arsenal.</em></h1>',
   { cs: '<h1 id="lib-h1" class="display lib-title">Kompletní<br><em class="serif">arzenál cviků.</em></h1>', sv: '<h1 id="lib-h1" class="display lib-title">Hela<br><em class="serif">övningsarsenalen.</em></h1>', de: '<h1 id="lib-h1" class="display lib-title">Das komplette<br><em class="serif">Übungsarsenal.</em></h1>', fi: '<h1 id="lib-h1" class="display lib-title">Koko<br><em class="serif">harjoitusarsenaali.</em></h1>', ru: '<h1 id="lib-h1" class="display lib-title">Полный<br><em class="serif">арсенал упражнений.</em></h1>' }],
  ['<p class="lib-subtitle">${totalEx} exercises &nbsp;·&nbsp; ${totalCat} movement patterns</p>',
   { cs: '<p class="lib-subtitle">${totalEx} cviků &nbsp;·&nbsp; ${totalCat} pohybových vzorů</p>', sv: '<p class="lib-subtitle">${totalEx} övningar &nbsp;·&nbsp; ${totalCat} rörelsemönster</p>', de: '<p class="lib-subtitle">${totalEx} Übungen &nbsp;·&nbsp; ${totalCat} Bewegungsmuster</p>', fi: '<p class="lib-subtitle">${totalEx} harjoitusta &nbsp;·&nbsp; ${totalCat} liikemallia</p>', ru: '<p class="lib-subtitle">Упражнений: ${totalEx} &nbsp;·&nbsp; паттернов движения: ${totalCat}</p>' }],
  ['placeholder="Search ${totalEx} exercises…" aria-label="Search exercises"',
   { cs: 'placeholder="Hledej mezi ${totalEx} cviky…" aria-label="Hledat cviky"', sv: 'placeholder="Sök bland ${totalEx} övningar…" aria-label="Sök övningar"', de: 'placeholder="${totalEx} Übungen durchsuchen…" aria-label="Übungen durchsuchen"', fi: 'placeholder="Hae ${totalEx} harjoituksesta…" aria-label="Hae harjoituksia"', ru: 'placeholder="Поиск по библиотеке (${totalEx})…" aria-label="Поиск упражнений"' }],
  ['aria-label="Clear search" hidden', { cs: 'aria-label="Smazat hledání" hidden', sv: 'aria-label="Rensa sökningen" hidden', de: 'aria-label="Suche löschen" hidden', fi: 'aria-label="Tyhjennä haku" hidden', ru: 'aria-label="Очистить поиск" hidden' }],
  ['aria-label="Filter by category"', { cs: 'aria-label="Filtrovat podle kategorie"', sv: 'aria-label="Filtrera efter kategori"', de: 'aria-label="Nach Kategorie filtern"', fi: 'aria-label="Suodata kategorian mukaan"', ru: 'aria-label="Фильтр по категории"' }],
  ['aria-pressed="true">All <span class="cat-tab-count">', { cs: 'aria-pressed="true">Vše <span class="cat-tab-count">', sv: 'aria-pressed="true">Alla <span class="cat-tab-count">', de: 'aria-pressed="true">Alle <span class="cat-tab-count">', fi: 'aria-pressed="true">Kaikki <span class="cat-tab-count">', ru: 'aria-pressed="true">Все <span class="cat-tab-count">' }],
  ['aria-label="Filtered exercises"', { cs: 'aria-label="Vyfiltrované cviky"', sv: 'aria-label="Filtrerade övningar"', de: 'aria-label="Gefilterte Übungen"', fi: 'aria-label="Suodatetut harjoitukset"', ru: 'aria-label="Отфильтрованные упражнения"' }],
  ['<p class="display empty-headline">No results.</p>', { cs: '<p class="display empty-headline">Nic nenalezeno.</p>', sv: '<p class="display empty-headline">Inga träffar.</p>', de: '<p class="display empty-headline">Keine Treffer.</p>', fi: '<p class="display empty-headline">Ei tuloksia.</p>', ru: '<p class="display empty-headline">Ничего не найдено.</p>' }],
  ['<p class="empty-sub">Try a different search or pick another category.</p>', { cs: '<p class="empty-sub">Zkus jiné hledání nebo vyber jinou kategorii.</p>', sv: '<p class="empty-sub">Testa en annan sökning eller välj en annan kategori.</p>', de: '<p class="empty-sub">Versuch eine andere Suche oder wähl eine andere Kategorie.</p>', fi: '<p class="empty-sub">Kokeile toista hakua tai valitse toinen kategoria.</p>', ru: '<p class="empty-sub">Попробуй другой запрос или выбери другую категорию.</p>' }],
  ['<button class="btn btn-ghost" id="clearBtn">Clear search</button>', { cs: '<button class="btn btn-ghost" id="clearBtn">Smazat hledání</button>', sv: '<button class="btn btn-ghost" id="clearBtn">Rensa sökningen</button>', de: '<button class="btn btn-ghost" id="clearBtn">Suche löschen</button>', fi: '<button class="btn btn-ghost" id="clearBtn">Tyhjennä haku</button>', ru: '<button class="btn btn-ghost" id="clearBtn">Очистить поиск</button>' }],
  ['aria-label="Exercises by category"', { cs: 'aria-label="Cviky podle kategorie"', sv: 'aria-label="Övningar per kategori"', de: 'aria-label="Übungen nach Kategorie"', fi: 'aria-label="Harjoitukset kategorioittain"', ru: 'aria-label="Упражнения по категориям"' }],

  // exercise page — SEO helpers
  ['const base = `${ex.name}: How to Do It`;', { cs: 'const base = `${ex.name}: jak na to`;', sv: 'const base = `${ex.name}: så gör du`;', de: 'const base = `${ex.name}: so geht\'s`;', fi: 'const base = `${ex.name}: näin teet sen`;', ru: 'const base = `${ex.name}: техника выполнения`;' }],
  [`? [' + Demo Video (Hockey Off-Ice)', ' + Demo Video', ' (Video)', '']\n    : [' (Hockey Off-Ice)', ''];`,
   { cs: `? [' + video (suchá příprava hokej)', ' + video ukázka', ' (video)', '']\n    : [' (suchá příprava hokej)', ''];`,
     sv: `? [' + video (barmarksträning hockey)', ' + videodemo', ' (video)', '']\n    : [' (barmarksträning hockey)', ''];`, de: `? [' + Video (Off-Ice-Training Eishockey)', ' + Video', ' (Video)', '']\n    : [' (Off-Ice-Training Eishockey)', ''];`, fi: `? [' + video (jääkiekon oheisharjoittelu)', ' + videodemo', ' (video)', '']\n    : [' (jääkiekon oheisharjoittelu)', ''];`, ru: '? [\' + видео (хоккей, вне льда)\', \' + видео\', \' (видео)\', \'\']\n    : [\' (хоккей, вне льда)\', \'\'];' }],
  [`return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];`,
   { cs: `return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' a ' + parts[parts.length - 1] : parts[0];`,
     sv: `return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' och ' + parts[parts.length - 1] : parts[0];`, de: `return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' und ' + parts[parts.length - 1] : parts[0];`, fi: `return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' ja ' + parts[parts.length - 1] : parts[0];`, ru: 'return parts.length > 1 ? parts.slice(0, -1).join(\', \') + \' и \' + parts[parts.length - 1] : parts[0];' }],
  [`const na = m.match(/^n\\/?a\\b[^(]*\\(([^)]*)\\)/i);`, `const na = m.match(/^(?:n\\/?a|nevztahuje se|ej tillämpligt|не применяется|не применимо)\\b[^(]*\\(([^)]*)\\)/i);`],
  [`else if (/^n\\/?a\\b/i.test(m)) return '';`, `else if (/^(?:n\\/?a|nevztahuje se|ej tillämpligt|не применяется|не применимо)\\b/i.test(m)) return '';`],
  ["const head = `${ex.name} for hockey: how-to, coaching cues, mistakes${ex.video ? ' + demo video' : ''}.`;",
   { cs: "const head = `${ex.name} pro hokejisty: provedení, trenérské pokyny, chyby${ex.video ? ' + video' : ''}.`;",
     sv: "const head = `${ex.name} för hockey: utförande, coachning, vanliga fel${ex.video ? ' + video' : ''}.`;", de: "const head = `${ex.name} für Eishockey: Ausführung, Coaching-Cues, Fehler${ex.video ? ' + Video' : ''}.`;", fi: "const head = `${ex.name} jääkiekkoon: suoritus, valmennusvihjeet, virheet${ex.video ? ' + video' : ''}.`;", ru: 'const head = `${ex.name} для хоккея: техника, подсказки тренера, ошибки${ex.video ? \' + видео\' : \'\'}.`;' }],
  [`if (mus && (head + ' Works the ' + mus + '.').length <= 160) return head + ' Works the ' + mus.charAt(0).toLowerCase() + mus.slice(1) + '.';`,
   { cs: `if (mus && (head + ' Zapojuje: ' + mus + '.').length <= 160) return head + ' Zapojuje: ' + mus.charAt(0).toLowerCase() + mus.slice(1) + '.';`,
     sv: `if (mus && (head + ' Tränar: ' + mus + '.').length <= 160) return head + ' Tränar: ' + mus.charAt(0).toLowerCase() + mus.slice(1) + '.';`, de: `if (mus && (head + ' Trainiert: ' + mus + '.').length <= 160) return head + ' Trainiert: ' + mus.charAt(0).toUpperCase() + mus.slice(1) + '.';`, fi: `if (mus && (head + ' Kuormittaa: ' + mus + '.').length <= 160) return head + ' Kuormittaa: ' + mus.charAt(0).toLowerCase() + mus.slice(1) + '.';`, ru: 'if (mus && (head + \' Работают: \' + mus + \'.\').length <= 160) return head + \' Работают: \' + mus.charAt(0).toLowerCase() + mus.slice(1) + \'.\';' }],

  // exercise page
  [`const progMatch = ex.progression.match(/Progress(?:ion)?:\\s*([^|]+)/i);\n    const regMatch  = ex.progression.match(/Regress(?:ion)?:\\s*(.+)/i);`,
   `const progMatch = ex.progression.match(/(?:Progress(?:ion|io)?|Progrese):\\s*([^|]+?)(?=\\s*(?:Regrese|Regression|Regressio):|\\s*\\||$)/i);\n    const regMatch  = ex.progression.match(/(?:Regress(?:ion|io)?|Regrese):\\s*(.+)/i);`],
  [`"name":\${JSON.stringify(ex.name + ' — Off-Ice Hockey Exercise')},`,
   { cs: `"name":\${JSON.stringify(ex.name + ' — cvik suché přípravy pro hokejisty')},\n    "inLanguage":"cs",`,
     sv: `"name":\${JSON.stringify(ex.name + ' — barmarksövning för hockey')},\n    "inLanguage":"sv",`, de: `"name":\${JSON.stringify(ex.name + ' — Off-Ice-Übung für Eishockey')},\n    "inLanguage":"de",`, fi: `"name":\${JSON.stringify(ex.name + ' — jääkiekon oheisharjoitus')},\n    "inLanguage":"fi",`, ru: '"name":${JSON.stringify(ex.name + \' — упражнение вне льда для хоккея\')},\n    "inLanguage":"ru",' }],
  [`"name":\${JSON.stringify(ex.name + ' — Off-Ice Hockey Exercise Demo')},`,
   { cs: `"name":\${JSON.stringify(ex.name + ' — video ukázka cviku pro hokejisty')},\n    "inLanguage":"cs",`,
     sv: `"name":\${JSON.stringify(ex.name + ' — videodemo av hockeyövning')},\n    "inLanguage":"sv",`, de: `"name":\${JSON.stringify(ex.name + ' — Video-Demo einer Eishockey-Übung')},\n    "inLanguage":"de",`, fi: `"name":\${JSON.stringify(ex.name + ' — jääkiekkoharjoituksen videodemo')},\n    "inLanguage":"fi",`, ru: '"name":${JSON.stringify(ex.name + \' — видеодемонстрация хоккейного упражнения\')},\n    "inLanguage":"ru",' }],
  ['<span class="pn-name">First exercise</span>', { cs: '<span class="pn-name">První cvik</span>', sv: '<span class="pn-name">Första övningen</span>', de: '<span class="pn-name">Erste Übung</span>', fi: '<span class="pn-name">Ensimmäinen harjoitus</span>', ru: '<span class="pn-name">Первое упражнение</span>' }],
  ['<span class="pn-name">Last exercise</span>', { cs: '<span class="pn-name">Poslední cvik</span>', sv: '<span class="pn-name">Sista övningen</span>', de: '<span class="pn-name">Letzte Übung</span>', fi: '<span class="pn-name">Viimeinen harjoitus</span>', ru: '<span class="pn-name">Последнее упражнение</span>' }],
  ['<link rel="canonical" href="${SITE_URL}/__L__/exercises/${ex.slug}.html" />', '<link rel="canonical" href="${SITE_URL}/__L__/exercises/${ex.slug}.html" />'],
  ['<nav aria-label="Breadcrumb">', { cs: '<nav aria-label="Drobečková navigace">', sv: '<nav aria-label="Brödsmulor">', de: '<nav aria-label="Brotkrümelnavigation">', fi: '<nav aria-label="Murupolku">', ru: '<nav aria-label="Навигационная цепочка">' }],
  ['<li><a href="${SITE_URL}">Home</a></li>', { cs: '<li><a href="${SITE_URL}/__L__/">Domů</a></li>', sv: '<li><a href="${SITE_URL}/__L__/">Hem</a></li>', de: '<li><a href="${SITE_URL}/__L__/">Start</a></li>', fi: '<li><a href="${SITE_URL}/__L__/">Etusivu</a></li>', ru: '<li><a href="${SITE_URL}/__L__/">Главная</a></li>' }],
  ['>Library</a></li>\n        <li><a href="/__L__/library.html#cat-', { cs: '>Knihovna</a></li>\n        <li><a href="/__L__/library.html#cat-', sv: '>Bibliotek</a></li>\n        <li><a href="/__L__/library.html#cat-', de: '>Bibliothek</a></li>\n        <li><a href="/__L__/library.html#cat-', fi: '>Kirjasto</a></li>\n        <li><a href="/__L__/library.html#cat-', ru: '>Библиотека</a></li>\n        <li><a href="/__L__/library.html#cat-' }],
  ['alt="Elite Hockey Drills app"', { cs: 'alt="Aplikace Elite Hockey Drills"', sv: 'alt="Elite Hockey Drills-appen"', de: 'alt="Elite Hockey Drills App"', fi: 'alt="Elite Hockey Drills -sovellus"', ru: 'alt="Приложение Elite Hockey Drills"' }],
  [`<div class="display ex-app-title">Don't just watch it. <em class="serif">Train it.</em></div>`,
   { cs: `<div class="display ex-app-title">Nejen koukej. <em class="serif">Trénuj.</em></div>`, sv: `<div class="display ex-app-title">Titta inte bara. <em class="serif">Träna.</em></div>`, de: `<div class="display ex-app-title">Nicht nur anschauen. <em class="serif">Trainieren.</em></div>`, fi: `<div class="display ex-app-title">Älä vain katso. <em class="serif">Treenaa.</em></div>`, ru: '<div class="display ex-app-title">Не просто смотри. <em class="serif">Тренируй.</em></div>' }],
  ['<p class="ex-app-sub">The Elite Hockey Drills app builds drills like this into your personalized off-ice program, week by week. Your first week is free.</p>',
   { cs: '<p class="ex-app-sub">Aplikace Elite Hockey Drills ti takové cviky zařadí do suché přípravy na míru, týden po týdnu. První týden máš zdarma.</p>',
     sv: '<p class="ex-app-sub">Elite Hockey Drills-appen bygger in övningar som den här i ditt personliga barmarksprogram, vecka för vecka. Första veckan är gratis.</p>', de: '<p class="ex-app-sub">Die Elite Hockey Drills App baut Übungen wie diese Woche für Woche in dein persönliches Off-Ice-Programm ein. Deine erste Woche ist kostenlos.</p>', fi: '<p class="ex-app-sub">Elite Hockey Drills -sovellus rakentaa tällaiset harjoitukset henkilökohtaiseen oheisharjoitteluohjelmaasi viikko viikolta. Ensimmäinen viikko on ilmainen.</p>', ru: '<p class="ex-app-sub">Приложение Elite Hockey Drills встраивает такие упражнения в твою персональную программу вне льда — неделя за неделей. Первая неделя бесплатно.</p>' }],
  ['data-place="ex_under_video">Start My Free Week', { cs: 'data-place="ex_under_video">Začni týden zdarma', sv: 'data-place="ex_under_video">Starta din gratisvecka', de: 'data-place="ex_under_video">Starte deine Gratiswoche', fi: 'data-place="ex_under_video">Aloita ilmainen viikko', ru: 'data-place="ex_under_video">Начать бесплатную неделю' }],
  ['<h2 class="ex-section-title">How to Do It</h2>', { cs: '<h2 class="ex-section-title">Jak na to</h2>', sv: '<h2 class="ex-section-title">Så gör du</h2>', de: '<h2 class="ex-section-title">So geht\'s</h2>', fi: '<h2 class="ex-section-title">Näin teet sen</h2>', ru: '<h2 class="ex-section-title">Техника выполнения</h2>' }],
  ['<h2 class="ex-section-title">Why It Works</h2>', { cs: '<h2 class="ex-section-title">Proč to funguje</h2>', sv: '<h2 class="ex-section-title">Därför fungerar det</h2>', de: '<h2 class="ex-section-title">Warum es wirkt</h2>', fi: '<h2 class="ex-section-title">Miksi se toimii</h2>', ru: '<h2 class="ex-section-title">Почему это работает</h2>' }],
  ['<h2 class="ex-section-title">Hockey Transfer</h2>', { cs: '<h2 class="ex-section-title">Přenos na led</h2>', sv: '<h2 class="ex-section-title">Överföring till isen</h2>', de: '<h2 class="ex-section-title">Transfer aufs Eis</h2>', fi: '<h2 class="ex-section-title">Siirtovaikutus jäälle</h2>', ru: '<h2 class="ex-section-title">Перенос на лёд</h2>' }],
  ['<h2 class="ex-section-title">Coaching Cues</h2>', { cs: '<h2 class="ex-section-title">Trenérské pokyny</h2>', sv: '<h2 class="ex-section-title">Coachningsord</h2>', de: '<h2 class="ex-section-title">Coaching-Cues</h2>', fi: '<h2 class="ex-section-title">Valmennusvihjeet</h2>', ru: '<h2 class="ex-section-title">Подсказки тренера</h2>' }],
  ['<h2 class="ex-section-title">Common Mistakes</h2>', { cs: '<h2 class="ex-section-title">Časté chyby</h2>', sv: '<h2 class="ex-section-title">Vanliga fel</h2>', de: '<h2 class="ex-section-title">Häufige Fehler</h2>', fi: '<h2 class="ex-section-title">Yleiset virheet</h2>', ru: '<h2 class="ex-section-title">Частые ошибки</h2>' }],
  ['<h2 class="ex-section-title">Progression / Regression</h2>', { cs: '<h2 class="ex-section-title">Progrese / regrese</h2>', sv: '<h2 class="ex-section-title">Progression / regression</h2>', de: '<h2 class="ex-section-title">Progression / Regression</h2>', fi: '<h2 class="ex-section-title">Progressio / regressio</h2>', ru: '<h2 class="ex-section-title">Усложнение / упрощение</h2>' }],
  ['<span class="prog-label prog">Progression</span>', { cs: '<span class="prog-label prog">Progrese</span>', sv: '<span class="prog-label prog">Progression</span>', de: '<span class="prog-label prog">Progression</span>', fi: '<span class="prog-label prog">Progressio</span>', ru: '<span class="prog-label prog">Усложнение</span>' }],
  ['<span class="prog-label reg">Regression</span>', { cs: '<span class="prog-label reg">Regrese</span>', sv: '<span class="prog-label reg">Regression</span>', de: '<span class="prog-label reg">Regression</span>', fi: '<span class="prog-label reg">Regressio</span>', ru: '<span class="prog-label reg">Упрощение</span>' }],
  ['<h2 class="ex-section-title">Primary Muscles</h2>', { cs: '<h2 class="ex-section-title">Hlavní svaly</h2>', sv: '<h2 class="ex-section-title">Primära muskler</h2>', de: '<h2 class="ex-section-title">Hauptmuskeln</h2>', fi: '<h2 class="ex-section-title">Päälihakset</h2>', ru: '<h2 class="ex-section-title">Основные мышцы</h2>' }],
  ['<h2 class="ex-section-title">Energy System</h2>', { cs: '<h2 class="ex-section-title">Energetický systém</h2>', sv: '<h2 class="ex-section-title">Energisystem</h2>', de: '<h2 class="ex-section-title">Energiesystem</h2>', fi: '<h2 class="ex-section-title">Energiajärjestelmä</h2>', ru: '<h2 class="ex-section-title">Энергетическая система</h2>' }],
  ['aria-label="Navigate exercises in ${escHtml(ex.category)}"', { cs: 'aria-label="Další cviky v kategorii ${escHtml(ex.category)}"', sv: 'aria-label="Fler övningar i ${escHtml(ex.category)}"', de: 'aria-label="Weitere Übungen in ${escHtml(ex.category)}"', fi: 'aria-label="Lisää harjoituksia: ${escHtml(ex.category)}"', ru: 'aria-label="Другие упражнения в категории ${escHtml(ex.category)}"' }],
  ['<div class="eyebrow ice">More from this category</div>', { cs: '<div class="eyebrow ice">Další cviky z kategorie</div>', sv: '<div class="eyebrow ice">Mer från den här kategorin</div>', de: '<div class="eyebrow ice">Mehr aus dieser Kategorie</div>', fi: '<div class="eyebrow ice">Lisää tästä kategoriasta</div>', ru: '<div class="eyebrow ice">Ещё из этой категории</div>' }],
  ['<div class="eyebrow ice" style="margin-bottom:18px;">Ready to train?</div>', { cs: '<div class="eyebrow ice" style="margin-bottom:18px;">Připravený trénovat?</div>', sv: '<div class="eyebrow ice" style="margin-bottom:18px;">Redo att träna?</div>', de: '<div class="eyebrow ice" style="margin-bottom:18px;">Bereit fürs Training?</div>', fi: '<div class="eyebrow ice" style="margin-bottom:18px;">Valmis treenaamaan?</div>', ru: '<div class="eyebrow ice" style="margin-bottom:18px;">Пора тренироваться?</div>' }],
  ['<h2 class="display ex-cta-title">Put it to work<br><em class="serif">on the ice.</em></h2>',
   { cs: '<h2 class="display ex-cta-title">Ať je to vidět<br><em class="serif">na ledě.</em></h2>', sv: '<h2 class="display ex-cta-title">Ta det med dig<br><em class="serif">ut på isen.</em></h2>', de: '<h2 class="display ex-cta-title">Bring es<br><em class="serif">aufs Eis.</em></h2>', fi: '<h2 class="display ex-cta-title">Vie se<br><em class="serif">jäälle.</em></h2>', ru: '<h2 class="display ex-cta-title">Перенеси это<br><em class="serif">на лёд.</em></h2>' }],
  ['<p class="ex-cta-sub">The Elite Hockey Drills app builds exercises like this into a personalized off-ice program — created by a sport scientist and former national-team coach. Your first week is free.</p>',
   { cs: '<p class="ex-cta-sub">Aplikace Elite Hockey Drills ti takové cviky zařadí do suché přípravy na míru — od sportovního vědce a bývalého trenéra národního týmu. První týden máš zdarma.</p>',
     sv: '<p class="ex-cta-sub">Elite Hockey Drills-appen bygger in övningar som den här i ett personligt barmarksprogram – skapat av en idrottsforskare och tidigare landslagstränare. Första veckan är gratis.</p>', de: '<p class="ex-cta-sub">Die Elite Hockey Drills App baut Übungen wie diese in ein persönliches Off-Ice-Programm ein – entwickelt von einem Sportwissenschaftler und ehemaligen Nationaltrainer. Deine erste Woche ist kostenlos.</p>', fi: '<p class="ex-cta-sub">Elite Hockey Drills -sovellus rakentaa tällaiset harjoitukset henkilökohtaiseen oheisharjoitteluohjelmaan – laatinut urheilutieteilijä ja entinen maajoukkuevalmentaja. Ensimmäinen viikko on ilmainen.</p>', ru: '<p class="ex-cta-sub">Приложение Elite Hockey Drills встраивает такие упражнения в персональную программу вне льда — её создали спортивный учёный и бывший тренер национальной сборной. Первая неделя бесплатно.</p>' }],
  ['        Start Your Free Week\n', { cs: '        Začni týden zdarma\n', sv: '        Starta din gratisvecka\n', de: '        Starte deine Gratiswoche\n', fi: '        Aloita ilmainen viikko\n', ru: '        Начать бесплатную неделю\n' }],
  ['class="btn btn-ghost">Get a Free Program</a>', { cs: 'class="btn btn-ghost">Program zdarma</a>', sv: 'class="btn btn-ghost">Gratis program</a>', de: 'class="btn btn-ghost">Gratis-Programm</a>', fi: 'class="btn btn-ghost">Ilmainen ohjelma</a>', ru: 'class="btn btn-ghost">Бесплатная программа</a>' }],
  ['class="back-link">← Back to Exercise Library</a>', { cs: 'class="back-link">← Zpět do knihovny cviků</a>', sv: 'class="back-link">← Tillbaka till övningsbiblioteket</a>', de: 'class="back-link">← Zurück zur Übungsbibliothek</a>', fi: 'class="back-link">← Takaisin harjoituspankkiin</a>', ru: 'class="back-link">← Назад в библиотеку упражнений</a>' }],
  ['aria-label="Get the app">', { cs: 'aria-label="Stáhni aplikaci">', sv: 'aria-label="Hämta appen">', de: 'aria-label="App holen">', fi: 'aria-label="Lataa sovellus">', ru: 'aria-label="Скачать приложение">' }],
  ['<div class="ex-sticky-text"><strong>Train this drill in the app</strong><span>First week free · iPhone &amp; Android</span></div>',
   { cs: '<div class="ex-sticky-text"><strong>Trénuj tenhle cvik v aplikaci</strong><span>První týden zdarma · iPhone i Android</span></div>',
     sv: '<div class="ex-sticky-text"><strong>Träna den här övningen i appen</strong><span>Första veckan gratis · iPhone och Android</span></div>', de: '<div class="ex-sticky-text"><strong>Trainier diese Übung in der App</strong><span>Erste Woche gratis · iPhone &amp; Android</span></div>', fi: '<div class="ex-sticky-text"><strong>Treenaa tämä harjoitus sovelluksessa</strong><span>Ensimmäinen viikko ilmaiseksi · iPhone &amp; Android</span></div>', ru: '<div class="ex-sticky-text"><strong>Тренируй это упражнение в приложении</strong><span>Первая неделя бесплатно · iPhone и Android</span></div>' }],
  ['data-place="ex_sticky">Get the App</a>', { cs: 'data-place="ex_sticky">Týden zdarma</a>', sv: 'data-place="ex_sticky">Gratisvecka</a>', de: 'data-place="ex_sticky">Gratiswoche</a>', fi: 'data-place="ex_sticky">Ilmainen viikko</a>', ru: 'data-place="ex_sticky">Скачать приложение</a>' }],
  ['<button type="button" class="ex-sticky-x" aria-label="Close">', { cs: '<button type="button" class="ex-sticky-x" aria-label="Zavřít">', sv: '<button type="button" class="ex-sticky-x" aria-label="Stäng">', de: '<button type="button" class="ex-sticky-x" aria-label="Schließen">', fi: '<button type="button" class="ex-sticky-x" aria-label="Sulje">', ru: '<button type="button" class="ex-sticky-x" aria-label="Закрыть">' }],
  ['title="Exercise demo"', { cs: 'title="Ukázka cviku"', sv: 'title="Övningsdemo"', de: 'title="Übungs-Demo"', fi: 'title="Harjoituksen demo"', ru: 'title="Демонстрация упражнения"' }, 'all'],
  ['aria-label="Demo video coming soon"', { cs: 'aria-label="Video ukázka brzy"', sv: 'aria-label="Videodemo kommer snart"', de: 'aria-label="Video-Demo folgt in Kürze"', fi: 'aria-label="Videodemo tulossa pian"', ru: 'aria-label="Видео скоро появится"' }],
  ['<p>Demo video coming soon</p>', { cs: '<p>Video ukázka už brzy</p>', sv: '<p>Videodemo kommer snart</p>', de: '<p>Video-Demo folgt in Kürze</p>', fi: '<p>Videodemo tulossa pian</p>', ru: '<p>Видео скоро появится</p>' }],
  // /ru/ only: Cyrillic glyphs for the Bebas Neue display face
  ['<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet" />', { cs: '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet" />', sv: '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet" />', de: '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet" />', fi: '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet" />', ru: '<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet" />\n<link href="/assets/ru-display.css" rel="stylesheet" />' }],
];

function applySwaps(src, L) {
  const cfg = LANGS[L], missing = [];
  const fill = (v) => (typeof v === 'string' ? v : v[L]).split('__L__').join(L).split('__STORE__').join(cfg.store).split('__OG__').join(cfg.ogLocale);
  for (const [a0, b0, mode] of SWAPS) {
    if (a0 instanceof RegExp) { if (!a0.test(src)) missing.push(String(a0)); src = src.replace(a0, b0); continue; }
    const a = fill(a0), b = fill(b0);
    if (!src.includes(a)) { missing.push(a.slice(0, 110)); continue; }
    src = mode === 'all' ? src.split(a).join(b) : src.replace(a, () => b);
  }
  if (missing.length) {
    console.error(`\n✖ generate-i18n.js [${L}]: these template strings were not found in generate.js:\n`);
    missing.forEach(m => console.error('   • ' + m.replace(/\n/g, '\\n')));
    console.error('\nUpdate the SWAPS table so the translated build stays 100 % translated.\n');
    process.exit(1);
  }
  return src;
}

const enSrc = rd('generate.js').replace(/^#!.*\n/, '');
const en = JSON.parse(rd('exercises.json'));
const wanted = process.argv.slice(2).filter(a => LANGS[a]);
const targets = wanted.length ? wanted : Object.keys(LANGS);

for (const L of targets) {
  const api = (function () {
    // eslint-disable-next-line no-eval
    return eval(applySwaps(enSrc, L) + '\n;({ buildLibraryPage, buildExercisePage, write });');
  })();
  const tr = JSON.parse(rd(`exercises.${L}.json`));
  const miss = en.filter(e => !tr[e.slug]).map(e => e.slug);
  if (miss.length) { console.error(`\n✖ [${L}] ${miss.length} exercise(s) missing in exercises.${L}.json:\n   ` + miss.join('\n   ')); process.exit(1); }
  const missCat = [...new Set(en.map(e => e.category))].filter(c => !CAT[c] || !CAT[c][L]);
  if (missCat.length) { console.error(`✖ [${L}] missing category: ` + missCat.join(', ')); process.exit(1); }

  const exercises = en.map(e => ({ ...e, ...tr[e.slug], category: CAT[e.category][L], slug: e.slug, video: e.video, num: e.num }));
  const categories = [...new Set(en.map(e => e.category))].map(c => CAT[c][L]);
  const OUT = path.join(ROOT, L);
  api.write(path.join(OUT, 'library.html'), api.buildLibraryPage(exercises, categories));
  const exDir = path.join(OUT, 'exercises');
  if (fs.existsSync(exDir)) fs.readdirSync(exDir).filter(f => f.endsWith('.html')).forEach(f => fs.unlinkSync(path.join(exDir, f)));
  exercises.forEach(ex => {
    const cat = exercises.filter(e => e.category === ex.category);
    const i = cat.findIndex(e => e.slug === ex.slug);
    api.write(path.join(exDir, `${ex.slug}.html`), api.buildExercisePage(ex, cat, cat[i - 1] || null, cat[i + 1] || null));
  });

  // library.<lang>.js — result counter + card links
  let lib = rd('assets/library.js');
  const cfg = LANGS[L];
  const LSW = [
    ["'<a class=\"ex-card\" href=\"/exercises/'", `'<a class="ex-card" href="/${L}/exercises/'`],
    ["? sorted.length + ' exercise' + (sorted.length !== 1 ? 's' : '')", `? sorted.length + ' ' + i18nPlural(sorted.length, ${cfg.exWords})`],
    [": sorted.length + ' result' + (sorted.length !== 1 ? 's' : '');", `: sorted.length + ' ' + i18nPlural(sorted.length, ${cfg.resWords});`],
  ];
  for (const [a, b] of LSW) {
    if (!lib.includes(a)) { console.error(`✖ [${L}] library.js string not found: ` + a); process.exit(1); }
    lib = lib.replace(a, b);
  }
  api.write(path.join(ROOT, `assets/library.${L}.js`), cfg.plural + '\n' + lib);
  console.log(`\nDone [${L}] — ${exercises.length} exercise pages + ${L}/library.html.\n`);
}
