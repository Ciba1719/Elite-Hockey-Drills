// One-shot: wire Russian into generate-i18n.js (LANGS entry, N/A pattern,
// Cyrillic-safe category slugs), generate.js (SITE_LANGS), lang-switch.js and
// store-links.js. Idempotent: every edit checks it has not been applied yet.
import fs from 'fs';

function edit(file, pairs) {
  let s = fs.readFileSync(file, 'utf8'); let n = 0;
  for (const [from, to, opts = {}] of pairs) {
    if (opts.skipIf && s.includes(opts.skipIf)) continue;
    const count = s.split(from).length - 1;
    if (count < 1) throw new Error(`${file}: not found: ${from.slice(0, 70)}`);
    if (!opts.all && count !== 1) throw new Error(`${file}: expected 1 match, got ${count}: ${from.slice(0, 70)}`);
    s = s.split(from).join(to); n++;
  }
  fs.writeFileSync(file, s, 'utf8'); console.log(`${file}: ${n} edit(s)`);
}

const CYR = "{а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'}";

edit('generate-i18n.js', [
  ["  sv: { store: 'se', ogLocale: 'sv_SE',",
   "  ru: { store: 'ru', ogLocale: 'ru_RU',\n        plural: \"function i18nPlural(n, w) { var m10 = n % 10, m100 = n % 100; return (m10 === 1 && m100 !== 11) ? w[0] : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) ? w[1] : w[2]; }\",\n        exWords: \"['упражнение','упражнения','упражнений']\", resWords: \"['результат','результата','результатов']\" },\n  sv: { store: 'se', ogLocale: 'sv_SE',",
   { skipIf: "ru: { store: 'ru'" }],
  ['TRANSLATED exercise library generator (cs, sv, de, fi)', 'TRANSLATED exercise library generator (cs, sv, de, fi, ru)', { skipIf: 'fi, ru)' }],
  ['nevztahuje se|ej tillämpligt', 'nevztahuje se|ej tillämpligt|не применяется|не применимо', { all: true, skipIf: 'не применяется' }],
  // category anchors: transliterate Cyrillic before the [^a-z0-9] slug filter
  [".normalize('NFD').replace(/[\\\\u0300-\\\\u036f]/g, '')\\n    .toLowerCase()",
   ".normalize('NFD').replace(/[\\\\u0300-\\\\u036f]/g, '')\\n    .replace(/[а-яё]/gi, function (c) { return (" + CYR + ")[c.toLowerCase()] || ''; })\\n    .toLowerCase()",
   { skipIf: '[а-яё]/gi' }],
]);

edit('generate.js', [
  ["const SITE_LANGS = [['en', ''], ['cs', '/cs'], ['sv', '/sv'], ['de', '/de'], ['fi', '/fi']];",
   "const SITE_LANGS = [['en', ''], ['cs', '/cs'], ['sv', '/sv'], ['de', '/de'], ['fi', '/fi'], ['ru', '/ru']];", { skipIf: "['ru', '/ru']" }],
  ['/cs/, /sv/, /de/ and /fi/ mirrors', '/cs/, /sv/, /de/, /fi/ and /ru/ mirrors', { skipIf: '/ru/ mirrors' }],
]);

edit('assets/lang-switch.js', [
  ["    { code: 'fi', label: 'FI', name: 'Suomi', prefix: '/fi' },\n  ];",
   "    { code: 'fi', label: 'FI', name: 'Suomi', prefix: '/fi' },\n    { code: 'ru', label: 'RU', name: 'Русский', prefix: '/ru' },\n  ];", { skipIf: "code: 'ru'" }],
  ["    fi: { text: 'Tämä sivu on myös suomeksi.', btn: 'Suomeksi', close: 'Sulje' },\n  };",
   "    fi: { text: 'Tämä sivu on myös suomeksi.', btn: 'Suomeksi', close: 'Sulje' },\n    ru: { text: 'Эта страница есть и на русском.', btn: 'По-русски', close: 'Закрыть' },\n  };", { skipIf: 'По-русски' }],
  ["fill=\"#002F6C\"/></svg>',\n  };",
   "fill=\"#002F6C\"/></svg>',\n    ru: '<svg viewBox=\"0 0 9 6\" aria-hidden=\"true\"><rect width=\"9\" height=\"2\" fill=\"#fff\"/><rect y=\"2\" width=\"9\" height=\"2\" fill=\"#0039A6\"/><rect y=\"4\" width=\"9\" height=\"2\" fill=\"#D52B1E\"/></svg>',\n  };", { skipIf: '#0039A6' }],
  ['(cs|sv|de|fi)', '(cs|sv|de|fi|ru)', { all: true, skipIf: '(cs|sv|de|fi|ru)' }],
  ["(/(^|,)fi\\b/.test(langs) ? 'fi' : null)", "(/(^|,)fi\\b/.test(langs) ? 'fi' : (/(^|,)ru\\b/.test(langs) ? 'ru' : null))", { skipIf: "? 'ru' : null" }],
  ['language switcher (EN / CZ / SV / DE / FI)', 'language switcher (EN / CZ / SV / DE / FI / RU)', { skipIf: 'FI / RU' }],
]);

edit('assets/store-links.js', [
  ['(cs|sv|de|fi)', '(cs|sv|de|fi|ru)', { all: true, skipIf: '(cs|sv|de|fi|ru)' }],
]);
