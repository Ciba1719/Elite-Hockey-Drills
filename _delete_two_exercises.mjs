// Remove "Foam Roll / Tissue Work" + "90/90 Hip Stretch + T-Spine Opener" everywhere.
import { readFileSync, writeFileSync, unlinkSync } from 'fs';

const SLUGS = ['foam-roll-tissue-work', '90-90-hip-stretch-t-spine-opener'];
let failures = 0;

function edit(file, fn) {
  const before = readFileSync(file, 'utf8');
  const after = fn(before);
  writeFileSync(file, after, 'utf8');
}

function removeAll(html, regex, label, expected) {
  const matches = html.match(regex) || [];
  if (matches.length !== expected) {
    console.error(`FAIL ${label}: expected ${expected} matches, got ${matches.length}`);
    failures++;
  } else {
    console.log(`ok   ${label}: removed ${matches.length}`);
  }
  return html.replace(regex, '');
}

// ---- 1. Four program files: cooldown <li> + glossary item per slug ----
for (const prog of ['program-9-11-office.html', 'program-12-14-office.html', 'program-15-18-office.html', 'program-40plus-office.html']) {
  edit(prog, html => {
    for (const slug of SLUGS) {
      const li = new RegExp(`<li><a class="ex" href="https://elitehockeydrills\\.com/exercises/${slug}"[^>]*>[\\s\\S]*?</a></li>`, 'g');
      html = removeAll(html, li, `${prog} li ${slug}`, 1);
      const gloss = new RegExp(`\\n?\\s*<div class="gloss-item">\\s*<div class="gi-name"><a class="ex" href="https://elitehockeydrills\\.com/exercises/${slug}"[\\s\\S]*?</div>\\s*</div>`, 'g');
      html = removeAll(html, gloss, `${prog} gloss ${slug}`, 1);
    }
    return html;
  });
}

// ---- 2. library.html: ex-cards, inline EXERCISES array, counts ----
edit('library.html', html => {
  for (const slug of SLUGS) {
    const card = new RegExp(`\\n?\\s*<a class="ex-card reveal" href="/exercises/${slug}\\.html"[\\s\\S]*?</a>`, 'g');
    html = removeAll(html, card, `library card ${slug}`, 1);
  }
  const m = html.match(/const EXERCISES = (\[[\s\S]*?\]);/);
  if (!m) { console.error('FAIL library EXERCISES array not found'); failures++; return html; }
  const arr = JSON.parse(m[1]);
  const filtered = arr.filter(e => !SLUGS.includes(e.slug));
  if (arr.length - filtered.length !== 2) { console.error(`FAIL library EXERCISES filter: removed ${arr.length - filtered.length}`); failures++; }
  else console.log(`ok   library EXERCISES: ${arr.length} -> ${filtered.length}`);
  html = html.replace(m[0], `const EXERCISES = ${JSON.stringify(filtered)};`);

  const countEdits = [
    ['<meta property="og:description" content="177 exercises', '<meta property="og:description" content="175 exercises'],
    ['<p class="lib-subtitle">177 exercises', '<p class="lib-subtitle">175 exercises'],
    ['placeholder="Search 176 exercises', 'placeholder="Search 175 exercises'],
    ['aria-pressed="true">All <span class="cat-tab-count">177</span>', 'aria-pressed="true">All <span class="cat-tab-count">175</span>'],
  ];
  for (const [from, to] of countEdits) {
    if (!html.includes(from)) { console.error(`FAIL library count edit not found: ${from}`); failures++; continue; }
    html = html.split(from).join(to);
    console.log(`ok   library count: ${from.slice(-30)}`);
  }
  // Cool-down / Recovery group count 10 -> 8 (only group with count 10 in that block)
  const cd = /(<div class="cat-group" data-category="Cool-down \/ Recovery"[\s\S]*?<span class="cat-group-count">)10(<\/span>)/;
  if (!cd.test(html)) { console.error('FAIL cool-down group count'); failures++; }
  else { html = html.replace(cd, '$18$2'); console.log('ok   library cool-down count 10 -> 8'); }
  return html;
});

// ---- 3. exercises.json ----
edit('exercises.json', txt => {
  const arr = JSON.parse(txt);
  const filtered = arr.filter(e => !SLUGS.includes(e.slug));
  if (arr.length - filtered.length !== 2) { console.error('FAIL exercises.json filter'); failures++; return txt; }
  console.log(`ok   exercises.json: ${arr.length} -> ${filtered.length}`);
  return JSON.stringify(filtered, null, 2) + '\n';
});

// ---- 4. sitemap.xml ----
edit('sitemap.xml', xml => {
  for (const slug of SLUGS) {
    const url = new RegExp(`\\s*<url><loc>https://elitehockeydrills\\.com/exercises/${slug}\\.html</loc>[\\s\\S]*?</url>`, 'g');
    xml = removeAll(xml, url, `sitemap ${slug}`, 1);
  }
  return xml;
});

// ---- 5. Sibling exercise pages: prev/next rewiring + related-card removal ----
const navFixes = [
  ['exercises/legs-up-the-wall-or-shin-pull.html',
   '<a class="pn-link pn-next" href="/exercises/90-90-hip-stretch-t-spine-opener.html"><span class="pn-name">90/90 Hip Stretch + T-Spine Opener</span><span class="pn-arrow">→</span></a>',
   '<a class="pn-link pn-next" href="/exercises/figure-4-stretch.html"><span class="pn-name">Figure-4 Stretch</span><span class="pn-arrow">→</span></a>'],
  ['exercises/figure-4-stretch.html',
   '<a class="pn-link pn-prev" href="/exercises/90-90-hip-stretch-t-spine-opener.html"><span class="pn-arrow">←</span><span class="pn-name">90/90 Hip Stretch + T-Spine Opener</span></a>',
   '<a class="pn-link pn-prev" href="/exercises/legs-up-the-wall-or-shin-pull.html"><span class="pn-arrow">←</span><span class="pn-name">Legs Up the Wall (or Shin Pull)</span></a>'],
  ['exercises/supine-spinal-twist.html',
   '<a class="pn-link pn-next" href="/exercises/foam-roll-tissue-work.html"><span class="pn-name">Foam Roll / Tissue Work</span><span class="pn-arrow">→</span></a>',
   '<a class="pn-link pn-next" href="/exercises/hip-groin-flow.html"><span class="pn-name">Hip / Groin Flow</span><span class="pn-arrow">→</span></a>'],
  ['exercises/hip-groin-flow.html',
   '<a class="pn-link pn-prev" href="/exercises/foam-roll-tissue-work.html"><span class="pn-arrow">←</span><span class="pn-name">Foam Roll / Tissue Work</span></a>',
   '<a class="pn-link pn-prev" href="/exercises/supine-spinal-twist.html"><span class="pn-arrow">←</span><span class="pn-name">Supine Spinal Twist</span></a>'],
];
for (const [file, from, to] of navFixes) {
  edit(file, html => {
    if (!html.includes(from)) { console.error(`FAIL nav fix not found in ${file}`); failures++; return html; }
    console.log(`ok   nav fix ${file}`);
    return html.replace(from, to);
  });
}

for (const file of ['exercises/child-s-pose-with-breath.html', 'exercises/legs-up-the-wall-or-shin-pull.html', 'exercises/slow-walk-with-nose-breathing.html']) {
  edit(file, html => {
    const card = /\n?\s*<a class="related-card reveal" href="\/exercises\/90-90-hip-stretch-t-spine-opener\.html">[\s\S]*?<\/a>/g;
    return removeAll(html, card, `related-card ${file}`, 1);
  });
}

// ---- 6. Delete the two exercise pages ----
if (failures === 0) {
  for (const slug of SLUGS) {
    unlinkSync(`exercises/${slug}.html`);
    console.log(`ok   deleted exercises/${slug}.html`);
  }
} else {
  console.error(`\n${failures} failures — exercise pages NOT deleted, review needed`);
  process.exit(1);
}
console.log('\nALL DONE');
