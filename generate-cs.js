#!/usr/bin/env node
/**
 * Elite Hockey Drills — CZECH exercise library generator
 *
 * Builds  /cs/library.html  and  /cs/exercises/<slug>.html  (331 pages)
 * from the SAME templates as generate.js, so the Czech pages always match the
 * English design. It reads:
 *   - generate.js            (templates — English strings are swapped for Czech below)
 *   - exercises.json         (written by generate.js: slugs, order, videos)
 *   - exercises.cs.json      (Czech texts per slug: name, execution, why, … )
 *
 * Usage:   node generate.js      (English build, also refreshes exercises.json)
 *          node generate-cs.js   (Czech build)
 *
 * If the English template changes and a string below no longer matches, this
 * script STOPS and prints which string — update the table, never ship half-English.
 */
const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ── 1. Czech category names (English category → Czech) ─────────────────────
const CAT = {
  'Competitive Play':            'Soutěživé hry',
  'Conditioning / Jump Rope':    'Kondice / švihadlo',
  'Cool-down / Recovery':        'Zklidnění / regenerace',
  'Core & Anti-rotation':        'Střed těla a antirotace',
  'Energy Systems / Intervals':  'Energetické systémy / intervaly',
  'Full-body & Complexes':       'Celé tělo a komplexy',
  'Hinge / Posterior Chain':     'Hip hinge / zadní řetězec',
  'Hockey-Specific Dryland':     'Hokejová suchá příprava',
  'Jump & Plyometric':           'Skoky a plyometrie',
  'Loaded Carries':              'Nošení zátěže',
  'Lunge & Single-leg':          'Výpady a jedna noha',
  'Prehab / Injury Prevention':  'Prehab / prevence zranění',
  'Rotational Power':            'Rotační výbušnost',
  'Speed, Sprint & Agility':     'Rychlost, sprint a agilita',
  'Squat / Knee-dominant':       'Dřep / dominance kolene',
  'Upper Body / Pull':           'Horní polovina těla / tahy',
  'Upper Body / Push':           'Horní polovina těla / tlaky',
  'Warm-up / Mobility':          'Rozcvička / mobilita',
};

// ── 2. Template string swaps (applied to generate.js source) ────────────────
const SWAPS = [
  // module bits we don't need for the Czech build
  [`const XLSX  = require('./node_modules/xlsx');`, `const XLSX = null;`],
  ['\n        <li><a href="${CS_URL}" lang="cs" hreflang="cs">Česky</a></li>', ''],
  [/\nmain\(\);\s*$/, '\n'],

  // stable anchors from Czech category names (strip diacritics before slugging)
  [`function makeSlug(name, used = new Set()) {\n  let base = name\n    .toLowerCase()`,
   `function makeSlug(name, used = new Set()) {\n  let base = name\n    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')\n    .toLowerCase()`],

  // ── URLs → Czech pages ──
  ['href="${SITE_URL}#', 'href="${SITE_URL}/cs/#', 'all'],
  ['href="${SITE_URL}" class="nav-logo"', 'href="${SITE_URL}/cs/" class="nav-logo"'],
  ['<a class="nav-logo" href="${SITE_URL}">', '<a class="nav-logo" href="${SITE_URL}/cs/">'],
  ['<li><a href="${SITE_URL}">Home</a></li>', '<li><a href="${SITE_URL}/cs/">Domů</a></li>'],
  ['${SITE_URL}/survey.html', '${SITE_URL}/cs/survey.html', 'all'],
  ['href="/library.html', 'href="/cs/library.html', 'all'],
  ['"/hockey-training-app.html"', '"/cs/hockey-training-app.html"', 'all'],
  ['/exercises/${', '/cs/exercises/${', 'all'],
  ['${SITE_URL}/library.html', '${SITE_URL}/cs/library.html', 'all'],
  ['https://apps.apple.com/us/app/elite-hockey-drills/id6787257275', 'https://apps.apple.com/cz/app/elite-hockey-drills/id6787257275', 'all'],
  ['https://play.google.com/store/apps/details?id=com.elitehockeydrills.training"', 'https://play.google.com/store/apps/details?id=com.elitehockeydrills.training&amp;hl=cs"', 'all'],
  ['<script src="/assets/library.js"></script>', '<script src="/assets/library.cs.js"></script>'],
  ['<html lang="en">', '<html lang="cs">', 'all'],

  // ── nav ──
  ['<nav aria-label="Main navigation">', '<nav aria-label="Hlavní navigace">'],
  ['#about">Coach</a></li>\n      <li><a href="${SITE_URL}/cs/#method">Method</a></li>\n      <li><a href="${SITE_URL}/cs/#tiers">Programs</a></li>',
   '#about">Trenér</a></li>\n      <li><a href="${SITE_URL}/cs/#method">Metodika</a></li>\n      <li><a href="${SITE_URL}/cs/#tiers">Programy</a></li>'],
  [`' aria-current="page"' : ''}>Library</a></li>\n      <li><a href="\${SITE_URL}/cs/#faq">FAQ</a></li>`,
   `' aria-current="page"' : ''}>Knihovna</a></li>\n      <li><a href="\${SITE_URL}/cs/#faq">Dotazy</a></li>`],
  ['class="nav-cta btn btn-primary">Get the App</a>\n</header>',
   'class="nav-cta btn btn-primary">Týden zdarma</a>\n</header>'],

  // ── footer ──
  ['<p>Science-backed off-ice training for hockey players. Built by a certified sport scientist and former national-team coach.</p>',
   '<p>Vědecky podložená suchá příprava pro hokejisty. Vytvořil certifikovaný sportovní vědec a bývalý trenér národního týmu.</p>'],
  ['<h4>Programs</h4>', '<h4>Programy</h4>'],
  ['>Free 5-Day PDF</a>', '>5denní program zdarma</a>'],
  ['#tiers">8-Week Programs</a>', '#tiers">8týdenní programy</a>'],
  ['>Hockey Training App</a>', '>Hokejová tréninková aplikace</a>'],
  ['data-store="ios">The App — iOS</a>', 'data-store="ios">Aplikace — iOS</a>'],
  ['>The App — Android</a>', '>Aplikace — Android</a>'],
  ['<h4>Navigate</h4>', '<h4>Navigace</h4>'],
  ['#about">About</a></li>', '#about">O trenérovi</a></li>'],
  ['#method">Method</a></li>\n        <li><a href="/cs/library.html">Exercise Library</a></li>\n        <li><a href="${SITE_URL}/cs/#faq">FAQ</a></li>',
   '#method">Metodika</a></li>\n        <li><a href="/cs/library.html">Knihovna cviků</a></li>\n        <li><a href="${SITE_URL}/cs/#faq">Časté dotazy</a></li>'],
  ['<h4>Connect</h4>', '<h4>Kontakt</h4>'],
  ['<li><a href="mailto:elitehockeydrills@gmail.com">Email</a></li>',
   '<li><a href="mailto:elitehockeydrills@gmail.com">E-mail</a></li>\n        <li><a href="${EN_URL}" lang="en" hreflang="en" data-lang="en">English version</a></li>'],
  ['<span>© 2026 Elite Hockey Drills. All rights reserved.</span>',
   '<span>© 2026 Elite Hockey Drills. Všechna práva vyhrazena.</span>'],

  // ── library page ──
  ['<title>Exercise Library — Off-Ice Hockey Training | Elite Hockey Drills</title>',
   '<title>Knihovna cviků — suchá příprava pro hokejisty | Elite Hockey Drills</title>'],
  ['content="Browse ${totalEx} off-ice hockey exercises across ${totalCat} movement categories. Searchable, filterable, built by a sport scientist."',
   'content="Projdi ${totalEx} cviků suché přípravy pro hokejisty v ${totalCat} pohybových kategoriích. S vyhledáváním a filtry, od sportovního vědce."'],
  ['content="Exercise Library | Elite Hockey Drills"', 'content="Knihovna cviků | Elite Hockey Drills"'],
  ['content="${totalEx} exercises · ${totalCat} movement patterns. Science-backed off-ice hockey training."',
   'content="${totalEx} cviků · ${totalCat} pohybových vzorů. Vědecky podložená suchá příprava pro hokejisty."'],
  ['<link rel="canonical" href="${SITE_URL}/cs/library.html" />',
   '<link rel="canonical" href="${SITE_URL}/cs/library.html" />\n<meta property="og:locale" content="cs_CZ" />\n<link rel="alternate" hreflang="en" href="${SITE_URL}/library.html" />\n<link rel="alternate" hreflang="cs" href="${SITE_URL}/cs/library.html" />\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}/library.html" />'],
  ['${navHTML(\'library\')}', '${navHTML(\'library\', \'/library.html\')}'],
  ['<div class="eyebrow ice lib-eyebrow">Exercise Library</div>', '<div class="eyebrow ice lib-eyebrow">Knihovna cviků</div>'],
  ['<h1 id="lib-h1" class="display lib-title">The Full<br><em class="serif">Exercise Arsenal.</em></h1>',
   '<h1 id="lib-h1" class="display lib-title">Kompletní<br><em class="serif">arzenál cviků.</em></h1>'],
  ['<p class="lib-subtitle">${totalEx} exercises &nbsp;·&nbsp; ${totalCat} movement patterns</p>',
   '<p class="lib-subtitle">${totalEx} cviků &nbsp;·&nbsp; ${totalCat} pohybových vzorů</p>'],
  ['placeholder="Search ${totalEx} exercises…" aria-label="Search exercises"',
   'placeholder="Hledej mezi ${totalEx} cviky…" aria-label="Hledat cviky"'],
  ['aria-label="Clear search" hidden', 'aria-label="Smazat hledání" hidden'],
  ['aria-label="Filter by category"', 'aria-label="Filtrovat podle kategorie"'],
  ['aria-pressed="true">All <span class="cat-tab-count">', 'aria-pressed="true">Vše <span class="cat-tab-count">'],
  ['aria-label="Filtered exercises"', 'aria-label="Vyfiltrované cviky"'],
  ['<p class="display empty-headline">No results.</p>', '<p class="display empty-headline">Nic nenalezeno.</p>'],
  ['<p class="empty-sub">Try a different search or pick another category.</p>', '<p class="empty-sub">Zkus jiné hledání nebo vyber jinou kategorii.</p>'],
  ['<button class="btn btn-ghost" id="clearBtn">Clear search</button>', '<button class="btn btn-ghost" id="clearBtn">Smazat hledání</button>'],
  ['aria-label="Exercises by category"', 'aria-label="Cviky podle kategorie"'],

  // ── exercise page: SEO helpers ──
  ['const base = `${ex.name}: How to Do It`;', 'const base = `${ex.name}: jak na to`;'],
  [`? [' + Demo Video (Hockey Off-Ice)', ' + Demo Video', ' (Video)', '']\n    : [' (Hockey Off-Ice)', ''];`,
   `? [' + video (suchá příprava hokej)', ' + video ukázka', ' (video)', '']\n    : [' (suchá příprava hokej)', ''];`],
  [`return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];`,
   `return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' a ' + parts[parts.length - 1] : parts[0];`],
  [`const na = m.match(/^n\\/?a\\b[^(]*\\(([^)]*)\\)/i);`, `const na = m.match(/^(?:n\\/?a|nevztahuje se)\\b[^(]*\\(([^)]*)\\)/i);`],
  [`else if (/^n\\/?a\\b/i.test(m)) return '';`, `else if (/^(?:n\\/?a|nevztahuje se)\\b/i.test(m)) return '';`],
  ["const head = `${ex.name} for hockey: how-to, coaching cues, mistakes${ex.video ? ' + demo video' : ''}.`;",
   "const head = `${ex.name} pro hokejisty: provedení, trenérské pokyny, chyby${ex.video ? ' + video' : ''}.`;"],
  [`if (mus && (head + ' Works the ' + mus + '.').length <= 160) return head + ' Works the ' + mus.charAt(0).toLowerCase() + mus.slice(1) + '.';`,
   `if (mus && (head + ' Zapojuje: ' + mus + '.').length <= 160) return head + ' Zapojuje: ' + mus.charAt(0).toLowerCase() + mus.slice(1) + '.';`],

  // ── exercise page ──
  [`const progMatch = ex.progression.match(/Progress(?:ion)?:\\s*([^|]+)/i);\n    const regMatch  = ex.progression.match(/Regress(?:ion)?:\\s*(.+)/i);`,
   `const progMatch = ex.progression.match(/(?:Progress(?:ion)?|Progrese):\\s*([^|]+?)(?=\\s*Regrese:|\\s*\\||$)/i);\n    const regMatch  = ex.progression.match(/(?:Regress(?:ion)?|Regrese):\\s*(.+)/i);`],
  [`"name":\${JSON.stringify(ex.name + ' — Off-Ice Hockey Exercise')},`, `"name":\${JSON.stringify(ex.name + ' — cvik suché přípravy pro hokejisty')},\n    "inLanguage":"cs",`],
  [`"name":\${JSON.stringify(ex.name + ' — Off-Ice Hockey Exercise Demo')},`, `"name":\${JSON.stringify(ex.name + ' — video ukázka cviku pro hokejisty')},\n    "inLanguage":"cs",`],
  ['<span class="pn-name">First exercise</span>', '<span class="pn-name">První cvik</span>'],
  ['<span class="pn-name">Last exercise</span>', '<span class="pn-name">Poslední cvik</span>'],
  ['<link rel="canonical" href="${SITE_URL}/cs/exercises/${ex.slug}.html" />',
   '<link rel="canonical" href="${SITE_URL}/cs/exercises/${ex.slug}.html" />\n<meta property="og:locale" content="cs_CZ" />\n<link rel="alternate" hreflang="en" href="${SITE_URL}/exercises/${ex.slug}.html" />\n<link rel="alternate" hreflang="cs" href="${SITE_URL}/cs/exercises/${ex.slug}.html" />\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}/exercises/${ex.slug}.html" />'],
  ['<body>\n${navHTML()}', '<body>\n${navHTML(\'\', \'/exercises/\' + ex.slug + \'.html\')}'],
  ['<nav aria-label="Breadcrumb">', '<nav aria-label="Drobečková navigace">'],
  ['>Library</a></li>\n        <li><a href="/cs/library.html#cat-', '>Knihovna</a></li>\n        <li><a href="/cs/library.html#cat-'],
  ['alt="Elite Hockey Drills app"', 'alt="Aplikace Elite Hockey Drills"'],
  [`<div class="display ex-app-title">Don't just watch it. <em class="serif">Train it.</em></div>`,
   `<div class="display ex-app-title">Nejen koukej. <em class="serif">Trénuj.</em></div>`],
  ['<p class="ex-app-sub">The Elite Hockey Drills app builds drills like this into your personalized off-ice program, week by week. Your first week is free.</p>',
   '<p class="ex-app-sub">Aplikace Elite Hockey Drills ti takové cviky zařadí do suché přípravy na míru, týden po týdnu. První týden máš zdarma.</p>'],
  ['data-place="ex_under_video">Start My Free Week', 'data-place="ex_under_video">Začni týden zdarma'],
  ['<h2 class="ex-section-title">How to Do It</h2>', '<h2 class="ex-section-title">Jak na to</h2>'],
  ['<h2 class="ex-section-title">Why It Works</h2>', '<h2 class="ex-section-title">Proč to funguje</h2>'],
  ['<h2 class="ex-section-title">Hockey Transfer</h2>', '<h2 class="ex-section-title">Přenos na led</h2>'],
  ['<h2 class="ex-section-title">Coaching Cues</h2>', '<h2 class="ex-section-title">Trenérské pokyny</h2>'],
  ['<h2 class="ex-section-title">Common Mistakes</h2>', '<h2 class="ex-section-title">Časté chyby</h2>'],
  ['<h2 class="ex-section-title">Progression / Regression</h2>', '<h2 class="ex-section-title">Progrese / regrese</h2>'],
  ['<span class="prog-label prog">Progression</span>', '<span class="prog-label prog">Progrese</span>'],
  ['<span class="prog-label reg">Regression</span>', '<span class="prog-label reg">Regrese</span>'],
  ['<h2 class="ex-section-title">Primary Muscles</h2>', '<h2 class="ex-section-title">Hlavní svaly</h2>'],
  ['<h2 class="ex-section-title">Energy System</h2>', '<h2 class="ex-section-title">Energetický systém</h2>'],
  ['aria-label="Navigate exercises in ${escHtml(ex.category)}"', 'aria-label="Další cviky v kategorii ${escHtml(ex.category)}"'],
  ['<div class="eyebrow ice">More from this category</div>', '<div class="eyebrow ice">Další cviky z kategorie</div>'],
  ['<div class="eyebrow ice" style="margin-bottom:18px;">Ready to train?</div>', '<div class="eyebrow ice" style="margin-bottom:18px;">Připravený trénovat?</div>'],
  ['<h2 class="display ex-cta-title">Put it to work<br><em class="serif">on the ice.</em></h2>',
   '<h2 class="display ex-cta-title">Ať je to vidět<br><em class="serif">na ledě.</em></h2>'],
  ['<p class="ex-cta-sub">The Elite Hockey Drills app builds exercises like this into a personalized off-ice program — created by a sport scientist and former national-team coach. Your first week is free.</p>',
   '<p class="ex-cta-sub">Aplikace Elite Hockey Drills ti takové cviky zařadí do suché přípravy na míru — od sportovního vědce a bývalého trenéra národního týmu. První týden máš zdarma.</p>'],
  ['        Start Your Free Week\n', '        Začni týden zdarma\n'],
  ['class="btn btn-ghost">Get a Free Program</a>', 'class="btn btn-ghost">Program zdarma</a>'],
  ['class="back-link">← Back to Exercise Library</a>', 'class="back-link">← Zpět do knihovny cviků</a>'],
  ['aria-label="Get the app">', 'aria-label="Stáhni aplikaci">'],
  ['<div class="ex-sticky-text"><strong>Train this drill in the app</strong><span>First week free · iPhone &amp; Android</span></div>',
   '<div class="ex-sticky-text"><strong>Trénuj tenhle cvik v aplikaci</strong><span>První týden zdarma · iPhone i Android</span></div>'],
  ['data-place="ex_sticky">Get the App</a>', 'data-place="ex_sticky">Týden zdarma</a>'],
  ['<button type="button" class="ex-sticky-x" aria-label="Close">', '<button type="button" class="ex-sticky-x" aria-label="Zavřít">'],
  ['title="Exercise demo"', 'title="Ukázka cviku"', 'all'],
  ['aria-label="Demo video coming soon"', 'aria-label="Video ukázka brzy"'],
  ['<p>Demo video coming soon</p>', '<p>Video ukázka už brzy</p>'],
];

// navHTML gets the EN path of the current page so we can render the EN switch.
const NAV_SWAP = [
  'function navHTML(activePage = \'\') {\n  return `<header class="nav" id="nav">',
  'function navHTML(activePage = \'\', enPath = \'/\') {\n  EN_URL = enPath;\n  return `<header class="nav" id="nav">',
];
const NAV_CTA = [
  '<a href="https://apps.apple.com/cz/app/elite-hockey-drills/id6787257275" class="nav-cta btn btn-primary">Týden zdarma</a>\n</header>`;',
  '<div class="nav-right" style="display:flex;align-items:center;gap:10px"><a href="${enPath}" class="lang-switch" hreflang="en" lang="en" data-lang="en" title="English version">EN</a>\n  <a href="https://apps.apple.com/cz/app/elite-hockey-drills/id6787257275" class="nav-cta btn btn-primary">Týden zdarma</a></div>\n</header>\n<style>.lang-switch{display:inline-flex;align-items:center;font-size:12px;font-weight:600;letter-spacing:.14em;color:var(--ink-2,#9398A2);padding:9px 11px;border:1px solid rgba(255,255,255,.12);border-radius:999px;line-height:1;white-space:nowrap}.lang-switch:hover{color:#ECEDEF;border-color:#5DB4E5}@media (max-width:560px){.nav-right .lang-switch{display:none}}</style>`;',
];

function applySwaps(src) {
  const missing = [];
  const one = (s, [a, b, mode]) => {
    if (a instanceof RegExp) { if (!a.test(s)) missing.push(String(a)); return s.replace(a, b); }
    if (!s.includes(a)) { missing.push(a.slice(0, 100)); return s; }
    return mode === 'all' ? s.split(a).join(b) : s.replace(a, () => b);
  };
  for (const sw of SWAPS) src = one(src, sw);
  src = one(src, NAV_SWAP);
  src = one(src, NAV_CTA);
  if (missing.length) {
    console.error('\n✖ generate-cs.js: these English template strings were not found in generate.js:\n');
    missing.forEach(m => console.error('   • ' + m.replace(/\n/g, '\\n')));
    console.error('\nUpdate the SWAPS table so the Czech build stays 100 % Czech.\n');
    process.exit(1);
  }
  return src;
}

// ── 3. Load templates ───────────────────────────────────────────────────────
const tpl = applySwaps(rd('generate.js').replace(/^#!.*\n/, ''));
const api = (function () {
  let EN_URL = '/';                          // set by navHTML, read by footerHTML
  // eslint-disable-next-line no-eval
  return eval(tpl + '\n;({ buildLibraryPage, buildExercisePage, makeSlug, write });');
})();

// ── 4. Data ─────────────────────────────────────────────────────────────────
const en = JSON.parse(rd('exercises.json'));
const cs = JSON.parse(rd('exercises.cs.json'));
const missingCs = en.filter(e => !cs[e.slug]).map(e => e.slug);
if (missingCs.length) {
  console.error(`\n✖ ${missingCs.length} exercise(s) have no Czech text in exercises.cs.json:\n   ` + missingCs.join('\n   ') + '\n');
  process.exit(1);
}
const missingCat = [...new Set(en.map(e => e.category))].filter(c => !CAT[c]);
if (missingCat.length) { console.error('✖ Missing Czech category: ' + missingCat.join(', ')); process.exit(1); }

const exercises = en.map(e => ({ ...e, ...cs[e.slug], category: CAT[e.category], slug: e.slug, video: e.video, num: e.num }));
const categories = [...new Set(en.map(e => e.category))].map(c => CAT[c]);

// ── 5. Write ────────────────────────────────────────────────────────────────
const OUT = path.join(ROOT, 'cs');
api.write(path.join(OUT, 'library.html'), api.buildLibraryPage(exercises, categories));

const exDir = path.join(OUT, 'exercises');
if (fs.existsSync(exDir)) fs.readdirSync(exDir).filter(f => f.endsWith('.html')).forEach(f => fs.unlinkSync(path.join(exDir, f)));
exercises.forEach(ex => {
  const catExes = exercises.filter(e => e.category === ex.category);
  const i = catExes.findIndex(e => e.slug === ex.slug);
  api.write(path.join(exDir, `${ex.slug}.html`), api.buildExercisePage(ex, catExes, catExes[i - 1] || null, catExes[i + 1] || null));
});

// Czech library.js (result counter + card links)
let lib = rd('assets/library.js');
const LSW = [
  ["'<a class=\"ex-card\" href=\"/exercises/'", "'<a class=\"ex-card\" href=\"/cs/exercises/'"],
  ["? sorted.length + ' exercise' + (sorted.length !== 1 ? 's' : '')", "? sorted.length + ' ' + czPlural(sorted.length, 'cvik', 'cviky', 'cviků')"],
  [": sorted.length + ' result' + (sorted.length !== 1 ? 's' : '');", ": sorted.length + ' ' + czPlural(sorted.length, 'výsledek', 'výsledky', 'výsledků');"],
];
for (const [a, b] of LSW) {
  if (!lib.includes(a)) { console.error('✖ library.js string not found: ' + a); process.exit(1); }
  lib = lib.replace(a, b);
}
lib = "function czPlural(n, one, few, many) { return n === 1 ? one : (n >= 2 && n <= 4 ? few : many); }\n" + lib;
api.write(path.join(ROOT, 'assets/library.cs.js'), lib);

console.log(`\nDone — ${exercises.length} Czech exercise pages + cs/library.html.\n`);
