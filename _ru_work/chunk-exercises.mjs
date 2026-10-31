// Split exercises.json into translation chunks, and merge the translated chunks
// back into exercises.<lang>.json.
//   node _ru_work/chunk-exercises.mjs split [chunks=6]   → _ru_work/ex/chunk-N.en.json
//   node _ru_work/chunk-exercises.mjs merge              → exercises.ru.json (+ validation)
import fs from 'fs';
import path from 'path';

const FIELDS = ['name', 'execution', 'why', 'transfer', 'cues', 'mistakes', 'progression', 'muscles', 'energy'];
const DIR = path.join('_ru_work', 'ex');
const en = JSON.parse(fs.readFileSync('exercises.json', 'utf8'));
const [cmd, arg] = process.argv.slice(2);
fs.mkdirSync(DIR, { recursive: true });

if (cmd === 'split') {
  const n = Number(arg) || 6;
  const nameMap = JSON.parse(fs.readFileSync('_ru_work/name-map.json', 'utf8'));
  const per = Math.ceil(en.length / n);
  for (let i = 0; i < n; i++) {
    const slice = en.slice(i * per, (i + 1) * per);
    const out = {};
    for (const e of slice) {
      out[e.slug] = Object.fromEntries(FIELDS.map(f => [f, e[f] ?? '']));
      if (nameMap[e.slug]) out[e.slug].nameHint = nameMap[e.slug].ru; // the app's Russian name for this exercise — use it
      out[e.slug].category = e.category;
    }
    fs.writeFileSync(path.join(DIR, `chunk-${i + 1}.en.json`), JSON.stringify(out, null, 1), 'utf8');
    const chars = slice.reduce((a, e) => a + FIELDS.reduce((b, f) => b + String(e[f] ?? '').length, 0), 0);
    console.log(`chunk-${i + 1}: ${slice.length} exercises, ${chars} chars`);
  }
} else if (cmd === 'merge') {
  const merged = {}; const problems = [];
  for (const f of fs.readdirSync(DIR).filter(x => /^chunk-\d+\.ru\.json$/.test(x)).sort()) {
    const ru = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const [slug, v] of Object.entries(ru)) {
      const src = en.find(e => e.slug === slug);
      if (!src) { problems.push(`${f}: unknown slug ${slug}`); continue; }
      const entry = {};
      for (const field of FIELDS) {
        let val = v[field];
        // chunks translated in parallel: unify the "Strength/neural" energy label
        if (field === 'energy' && typeof val === 'string') val = val.replace(/^Силовая\/(нейромышечная|нервная|нервно-мышечная|нейральная|неврологическая)/, 'Силовая/нервно-мышечная');
        if (typeof val !== 'string' || !val.trim()) { if (src[field]) problems.push(`${slug}.${field}: empty`); continue; }
        if (val === src[field] && /\p{L}{4,}/u.test(val)) problems.push(`${slug}.${field}: identical to English`);
        if (!/\p{Script=Cyrillic}/u.test(val) && /\p{L}{4,}/u.test(val)) problems.push(`${slug}.${field}: no Cyrillic`);
        if (/[іїєґў]/i.test(val)) problems.push(`${slug}.${field}: non-Russian Cyrillic letter`);
        if (/\p{Script=Latin}\p{Script=Cyrillic}|\p{Script=Cyrillic}\p{Script=Latin}/u.test(val)) problems.push(`${slug}.${field}: Latin glued to Cyrillic`);
        entry[field] = val;
      }
      merged[slug] = entry;
    }
  }
  const missing = en.filter(e => !merged[e.slug]).map(e => e.slug);
  if (missing.length) problems.push(`missing slugs (${missing.length}): ${missing.slice(0, 10).join(', ')}`);
  problems.forEach(p => console.log('  ' + p));
  if (!problems.length || process.argv.includes('--force')) {
    // keep exercises.json order
    const ordered = {}; for (const e of en) if (merged[e.slug]) ordered[e.slug] = merged[e.slug];
    fs.writeFileSync('exercises.ru.json', JSON.stringify(ordered, null, 2) + '\n', 'utf8');
    console.log(`exercises.ru.json written: ${Object.keys(ordered).length} exercises${problems.length ? ' (with problems, forced)' : ''}`);
  } else {
    console.log(`NOT written — ${problems.length} problem(s)`);
    process.exit(1);
  }
} else {
  console.error('usage: split [n] | merge [--force]'); process.exit(2);
}
